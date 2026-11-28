import Foundation
import CryptoKit
import CoreImage
import CoreGraphics
import Security

public enum RedNativeError: Error, Equatable {
    case invalidOrigin, invalidApp, invalidResponse, invalidProof, busy, notSignedIn
    case http(Int), keychain(OSStatus)
}
public struct RedNativeProof: Codable, Equatable {
    public let verifier: String
    public let challenge: String
}
public struct RedNativeSession: Codable, Equatable {
    public let version: Int
    public let app: String
    public let accessToken: String
    public let refreshToken: String
    public let expiresAt: String
    public let refreshExpiresAt: String
    public let scopes: [String]
}
public struct RedNativeIdentity: Codable, Equatable {
    public let version: Int
    public let id: String
    public let name: String
    public let app: String
    public let scopes: [String]
    public let expiresAt: String
}
public protocol RedNativeCredentialStore {
    func load(scope: String) throws -> Data?
    func save(_ value: Data, scope: String) throws
    func clear(scope: String) throws
}
/// Device-only Keychain, no shared access group or iCloud synchronisation.
public struct RedKeychainStore: RedNativeCredentialStore {
    public init() {}
    private func query(_ scope: String) -> [String: Any] {
        var q: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
         kSecAttrService as String: "com.red.ecosystem.identity.v2",
         kSecAttrAccount as String: scope,
         kSecAttrSynchronizable as String: false]
        #if os(macOS)
        q[kSecUseDataProtectionKeychain as String] = true
        #endif
        return q
    }
    public func load(scope: String) throws -> Data? {
        var q = query(scope)
        q[kSecReturnData as String] = true
        q[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        let status = SecItemCopyMatching(q as CFDictionary, &result)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess else { throw RedNativeError.keychain(status) }
        guard let data = result as? Data else { throw RedNativeError.invalidResponse }
        return data
    }
    public func save(_ value: Data, scope: String) throws {
        let q = query(scope)
        let attributes: [String: Any] = [kSecValueData as String: value,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly]
        let status = SecItemUpdate(q as CFDictionary, attributes as CFDictionary)
        if status == errSecItemNotFound {
            let add = q.merging(attributes) { _, new in new }
            let inserted = SecItemAdd(add as CFDictionary, nil)
            guard inserted == errSecSuccess else { throw RedNativeError.keychain(inserted) }
        } else if status != errSecSuccess {
            throw RedNativeError.keychain(status)
        }
    }
    public func clear(scope: String) throws {
        let status = SecItemDelete(query(scope) as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw RedNativeError.keychain(status)
        }
    }
}
private final class RejectRedirects: NSObject, URLSessionTaskDelegate {
    func urlSession(_ session: URLSession, task: URLSessionTask,
                    willPerformHTTPRedirection response: HTTPURLResponse,
                    newRequest request: URLRequest,
                    completionHandler: @escaping (URLRequest?) -> Void) {
        completionHandler(nil)
    }
}
public actor RedNativeClient {
    public static let apps = ["red-ion","red-fit","red-poly","red-bit","red-loop","red-efz","red-kurd","red-uhr","red-yt","stran","babat-red"]
    private let origin: String
    private let app: String
    private let scope: String
    private let store: RedNativeCredentialStore
    private let session: URLSession
    private var busy = false

    public init(origin: String, app: String, store: RedNativeCredentialStore = RedKeychainStore()) throws {
        self.scope = try Self.credentialScope(origin: origin, app: app)
        self.origin = origin
        self.app = app
        self.store = store
        let config = URLSessionConfiguration.ephemeral
        config.httpShouldSetCookies = false
        config.httpCookieStorage = nil
        config.urlCache = nil
        config.urlCredentialStorage = nil
        config.timeoutIntervalForRequest = 15
        config.timeoutIntervalForResource = 30
        self.session = URLSession(configuration: config, delegate: RejectRedirects(), delegateQueue: nil)
    }
    public static func credentialScope(origin: String, app: String) throws -> String {
        guard apps.contains(app) else { throw RedNativeError.invalidApp }
        guard let c = URLComponents(string: origin), c.scheme == "https",
              let host = c.host, !host.isEmpty, c.user == nil, c.password == nil,
              c.path.isEmpty, c.query == nil, c.fragment == nil,
              let url = c.url, url.absoluteString == origin,
              c.port == nil || (c.port! > 0 && c.port! <= 65535 && c.port! != 443)
        else { throw RedNativeError.invalidOrigin }
        return SHA256.hash(data: Data((origin + "\n" + app).utf8)).map { String(format: "%02x", $0) }.joined()
    }
    private static func base64url(_ data: Data) -> String {
        data.base64EncodedString().replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
    }
    public static func makeProof() -> RedNativeProof {
        let secret = SymmetricKey(size: .bits256).withUnsafeBytes { Data($0) }
        let verifier = base64url(secret)
        return RedNativeProof(verifier: verifier, challenge: base64url(Data(SHA256.hash(data: Data(verifier.utf8)))))
    }
    public static func pairingRequest(app: String, challenge: String) throws -> String {
        guard apps.contains(app) else { throw RedNativeError.invalidApp }
        guard matches(challenge, "^[A-Za-z0-9_-]{43}$") else { throw RedNativeError.invalidProof }
        let data = try JSONSerialization.data(withJSONObject: ["kind":"red-pair","version":1,"app":app,"challenge":challenge])
        guard let result = String(data: data, encoding: .utf8) else { throw RedNativeError.invalidResponse }
        return result
    }
    private static func matches(_ s: String, _ regex: String) -> Bool {
        guard let range = s.range(of: regex, options: .regularExpression) else { return false }
        return range == s.startIndex..<s.endIndex
    }
    private static func date(_ text: String) -> Date? {
        let parser = ISO8601DateFormatter()
        parser.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = parser.date(from: text) { return date }
        parser.formatOptions = [.withInternetDateTime]
        return parser.date(from: text)
    }
    private func valid(_ value: RedNativeSession) throws -> RedNativeSession {
        guard value.version == 2, value.app == app, value.scopes == ["identity:read"],
              Self.matches(value.accessToken, "^redat_[a-f0-9]{64}$"),
              Self.matches(value.refreshToken, "^redrt_[a-f0-9]{64}$"),
              let access = Self.date(value.expiresAt), let refresh = Self.date(value.refreshExpiresAt),
              access <= refresh else { throw RedNativeError.invalidResponse }
        return value
    }
    private func load() throws -> RedNativeSession {
        guard let data = try store.load(scope: scope) else { throw RedNativeError.notSignedIn }
        return try valid(JSONDecoder().decode(RedNativeSession.self, from: data))
    }
    private func save(_ data: Data) throws -> RedNativeSession {
        let value = try valid(JSONDecoder().decode(RedNativeSession.self, from: data))
        try store.save(JSONEncoder().encode(value), scope: scope)
        return value
    }
    private func request(_ path: String, method: String = "POST", body: [String:String]? = nil, token: String? = nil, share: Bool = false) async throws -> Data {
        guard let url = URL(string: origin + (share ? "/red-share/v1/" : "/red-id/v2/") + path) else { throw RedNativeError.invalidOrigin }
        var req = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData)
        req.httpMethod = method
        req.setValue("no-store", forHTTPHeaderField: "Cache-Control")
        if let body {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try JSONEncoder().encode(body)
        }
        if let token { req.setValue("Bearer " + token, forHTTPHeaderField: "Authorization") }
        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse, http.url == url else { throw RedNativeError.invalidResponse }
        guard (200...299).contains(http.statusCode) else { throw RedNativeError.http(http.statusCode) }
        guard data.count <= 65536 else { throw RedNativeError.invalidResponse }
        return data
    }
    private func enter() throws {
        guard !busy else { throw RedNativeError.busy }
        busy = true
    }
    private func rotate(_ old: RedNativeSession) async throws -> RedNativeSession {
        do {
            return try save(await request("refresh", body: ["app":app,"refreshToken":old.refreshToken]))
        } catch RedNativeError.http(401) {
            try store.clear(scope: scope)
            throw RedNativeError.notSignedIn
        }
    }
    private func current() async throws -> RedNativeSession {
        let value = try load()
        if Self.date(value.expiresAt)! <= Date().addingTimeInterval(30) { return try await rotate(value) }
        return value
    }
    public func claimLogin(verifier: String) async throws {
        try enter(); defer { busy = false }
        guard Self.matches(verifier, "^[A-Za-z0-9._~-]{43,128}$") else { throw RedNativeError.invalidProof }
        _ = try save(await request("claim-login", body: ["app":app,"verifier":verifier]))
    }
    public func pair(code: String, verifier: String) async throws {
        try enter(); defer { busy = false }
        guard Self.matches(code, "^redpair_[a-f0-9]{64}$"), Self.matches(verifier, "^[A-Za-z0-9._~-]{43,128}$") else { throw RedNativeError.invalidProof }
        _ = try save(await request("exchange", body: ["app":app,"code":code,"verifier":verifier]))
    }
    public func identity() async throws -> RedNativeIdentity {
        try enter(); defer { busy = false }
        let value = try await current()
        let data: Data
        do { data = try await request("me", method: "GET", token: value.accessToken) }
        catch RedNativeError.http(401) {
            let next = try await rotate(value)
            data = try await request("me", method: "GET", token: next.accessToken)
        }
        let identity = try JSONDecoder().decode(RedNativeIdentity.self, from: data)
        guard identity.version == 2, identity.app == app, !identity.id.isEmpty,
              identity.scopes == ["identity:read"], Self.date(identity.expiresAt) != nil
        else { throw RedNativeError.invalidResponse }
        return identity
    }
    private func shareRequest(_ path: String, body: [String:String]? = nil) async throws -> Data {
        let s = try await current()
        let method = body == nil ? "GET" : "POST"
        do { return try await request(path, method: method, body: body, token: s.accessToken, share: true) }
        catch RedNativeError.http(401) {
            let next = try await rotate(s)
            return try await request(path, method: method, body: body, token: next.accessToken, share: true)
        }
    }
    public func shareSend(_ prepared: RedNativeSharePrepared) async throws {
        try enter(); defer { busy = false }
        guard prepared.source == app else { throw RedNativeError.invalidApp }
        try RedNativeShare.validate(source: prepared.source, target: prepared.target, channel: prepared.channel, id: prepared.id)
        _ = try RedNativeShare.decodeEnvelope(prepared.envelope)
        _ = try await shareRequest("send", body: ["target":prepared.target,"channel":prepared.channel,"id":prepared.id,"envelope":prepared.envelope])
    }
    public func shareInbox() async throws -> [RedNativeShareMessage] {
        try enter(); defer { busy = false }
        let data = try await shareRequest("inbox")
        let result = try JSONDecoder().decode(RedNativeShareInbox.self, from: data)
        guard result.version == 1, result.messages.count <= 32 else { throw RedNativeError.invalidResponse }
        for m in result.messages {
            try RedNativeShare.validate(source: m.source, target: app, channel: m.channel, id: m.id)
            _ = try RedNativeShare.decodeEnvelope(m.envelope)
        }
        return result.messages
    }
    /// Call only after atomically saving application data and the message ID.
    public func shareAck(_ message: RedNativeShareMessage) async throws {
        try enter(); defer { busy = false }
        try RedNativeShare.validate(source: message.source, target: app, channel: message.channel, id: message.id)
        _ = try await shareRequest("ack", body: ["source":message.source,"channel":message.channel,"id":message.id])
    }
    /// If the server cannot be reached, throws after clearing local credentials.
    /// Remote revocation must then be performed in RED ION settings.
    public func logout() async throws {
        try enter(); defer { busy = false }
        do {
            let value = try await current()
            _ = try await request("logout", token: value.accessToken)
        } catch {
            try store.clear(scope: scope)
            throw error
        }
        try store.clear(scope: scope)
    }
}

public enum RedPairQRCode {
    /// Render only the public pairing request. Integral scaling and four
    /// white quiet-zone modules preserve scanner readability.
    public static func image(app: String, challenge: String, scale: Int = 6) throws -> CGImage {
        guard (2...16).contains(scale) else { throw RedNativeError.invalidResponse }
        let payload = try RedNativeClient.pairingRequest(app: app, challenge: challenge)
        guard let filter = CIFilter(name: "CIQRCodeGenerator") else { throw RedNativeError.invalidResponse }
        filter.setValue(Data(payload.utf8), forKey: "inputMessage")
        filter.setValue("M", forKey: "inputCorrectionLevel")
        guard let qr = filter.outputImage else { throw RedNativeError.invalidResponse }
        let size = qr.extent.integral
        let bounds = CGRect(x: 0, y: 0, width: size.width + 8, height: size.height + 8)
        let white = CIImage(color: CIColor(red: 1, green: 1, blue: 1)).cropped(to: bounds)
        let padded = qr.transformed(by: CGAffineTransform(translationX: 4 - size.minX, y: 4 - size.minY)).composited(over: white)
        let factor = CGFloat(scale)
        let output = padded.transformed(by: CGAffineTransform(scaleX: factor, y: factor))
        guard let image = CIContext(options: [.useSoftwareRenderer: true]).createCGImage(output, from: output.extent.integral)
        else { throw RedNativeError.invalidResponse }
        return image
    }
}

public struct RedNativeSharePrepared: Codable, Equatable {
    public let source: String, target: String, channel: String, id: String, envelope: String
}
public struct RedNativeShareMessage: Codable, Equatable {
    public let source: String, channel: String, id: String, envelope: String
    public let expires: Int64
}
private struct RedNativeShareInbox: Decodable {
    let version: Int
    let messages: [RedNativeShareMessage]
}
public enum RedNativeShare {
    private static func matches(_ value: String, _ pattern: String) -> Bool {
        value.range(of: pattern, options: .regularExpression) == value.startIndex..<value.endIndex
    }
    static func validate(source: String, target: String, channel: String, id: String) throws {
        guard RedNativeClient.apps.contains(source), RedNativeClient.apps.contains(target),
              source != target, matches(channel, "^[a-z][a-z0-9_-]{0,31}$"),
              matches(id, "^[a-f0-9]{32}$") else { throw RedNativeError.invalidResponse }
    }
    private static func aad(source: String,target: String,channel: String,id: String) throws -> Data {
        try validate(source: source,target: target,channel: channel,id: id)
        return try JSONSerialization.data(withJSONObject: ["red-share-v1",source,target,channel,id])
    }
    private static func b64(_ data: Data) -> String {
        data.base64EncodedString().replacingOccurrences(of:"+",with:"-").replacingOccurrences(of:"/",with:"_").replacingOccurrences(of:"=",with:"")
    }
    static func decodeEnvelope(_ envelope: String) throws -> Data {
        guard matches(envelope, "^[A-Za-z0-9_-]{38,60000}$") else { throw RedNativeError.invalidResponse }
        let base = envelope.replacingOccurrences(of:"-",with:"+").replacingOccurrences(of:"_",with:"/")
        guard let data = Data(base64Encoded: base + String(repeating:"=",count:(4-base.count%4)%4)),
              data.count >= 28, b64(data) == envelope else { throw RedNativeError.invalidResponse }
        return data
    }
    /// Key must be securely exchanged and stored outside the server.
    /// Persist only this prepared encrypted envelope; retry it unchanged.
    public static func prepare(key: Data,source: String,target: String,channel: String,json: Data) throws -> RedNativeSharePrepared {
        guard key.count == 32,json.count <= 44000 else { throw RedNativeError.invalidResponse }
        let parsed = try JSONSerialization.jsonObject(with: json)
        guard let object = parsed as? [String:Any], object["version"] as? Int == 1, object.keys.contains("data") else { throw RedNativeError.invalidResponse }
        let id = UUID().uuidString.replacingOccurrences(of:"-",with:"").lowercased()
        let sealed = try AES.GCM.seal(json,using:SymmetricKey(data:key),authenticating:aad(source:source,target:target,channel:channel,id:id))
        guard let combined = sealed.combined else { throw RedNativeError.invalidResponse }
        return RedNativeSharePrepared(source:source,target:target,channel:channel,id:id,envelope:b64(combined))
    }
    public static func open(key: Data,target: String,message: RedNativeShareMessage) throws -> Data {
        guard key.count == 32,Double(message.expires) > Date().timeIntervalSince1970*1000 else { throw RedNativeError.invalidResponse }
        let sealed = try AES.GCM.SealedBox(combined:decodeEnvelope(message.envelope))
        let data = try AES.GCM.open(sealed,using:SymmetricKey(data:key),authenticating:aad(source:message.source,target:target,channel:message.channel,id:message.id))
        guard let object = try JSONSerialization.jsonObject(with:data) as? [String:Any],object["version"] as? Int == 1,object.keys.contains("data") else { throw RedNativeError.invalidResponse }
        return data
    }
}
