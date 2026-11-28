import Foundation
import CryptoKit
import Security

public enum RedNativeSyncKeyPurpose: String, CaseIterable {
    case sync, file, localSync
}
public enum RedNativeSyncKeyError: Error, Equatable {
    case invalidOwner, invalidKey, existingDifferentKey, keychain(OSStatus)
}

// Separate namespace from identity credentials. Insert only, never overwrite.
protocol RedNativeSyncKeyBackend {
    func load(account: String) throws -> Data?
    func insertIfAbsent(_ value: Data, account: String) throws -> Bool
}
struct RedNativeSyncKeychainBackend: RedNativeSyncKeyBackend {
    private func query(_ account: String) -> [String: Any] {
        var q: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: "com.red.ecosystem.sync-keys.v1",
            kSecAttrAccount as String: account,
            kSecAttrSynchronizable as String: false
        ]
        #if os(macOS)
        q[kSecUseDataProtectionKeychain as String] = true
        #endif
        return q
    }
    func load(account: String) throws -> Data? {
        var q = query(account)
        q[kSecReturnData as String] = true
        q[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        let status = SecItemCopyMatching(q as CFDictionary, &result)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess else { throw RedNativeSyncKeyError.keychain(status) }
        guard let data = result as? Data else { throw RedNativeSyncKeyError.invalidKey }
        return data
    }
    func insertIfAbsent(_ value: Data, account: String) throws -> Bool {
        var q = query(account)
        q[kSecValueData as String] = value
        q[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        let status = SecItemAdd(q as CFDictionary, nil)
        if status == errSecDuplicateItem { return false }
        guard status == errSecSuccess else { throw RedNativeSyncKeyError.keychain(status) }
        return true
    }
}

/// Native, device-only storage of an explicitly obtained 32-byte key.
/// Missing keys are never generated automatically. No sync, rotation,
/// deletion, or shared Keychain access group is provided.
public struct RedNativeSyncKeyStore {
    private let backend: RedNativeSyncKeyBackend
    public init() { backend = RedNativeSyncKeychainBackend() }
    init(backend: RedNativeSyncKeyBackend) { self.backend = backend }

    public static func account(origin: String, owner: String, app: String,
                               purpose: RedNativeSyncKeyPurpose) throws -> String {
        let identity = try RedNativeClient.credentialScope(origin: origin, app: app)
        guard !owner.isEmpty, owner.utf16.count <= 128 else { throw RedNativeSyncKeyError.invalidOwner }
        let context = try JSONEncoder().encode(["red-native-sync-key-v1", identity, owner, purpose.rawValue])
        return SHA256.hash(data: context).map { String(format: "%02x", $0) }.joined()
    }

    public func load(origin: String, owner: String, app: String,
                     purpose: RedNativeSyncKeyPurpose) throws -> Data? {
        let account = try Self.account(origin: origin, owner: owner, app: app, purpose: purpose)
        guard let existing = try backend.load(account: account) else { return nil }
        guard existing.count == 32 else { throw RedNativeSyncKeyError.invalidKey }
        return existing
    }

    /// Call only after trusted local generation or verified device transfer.
    /// Existing different keys are never replaced. Keychain add is atomic
    /// even if another process is simultaneously installing the same scope.
    public func install(_ key: Data, origin: String, owner: String, app: String,
                        purpose: RedNativeSyncKeyPurpose) throws {
        guard key.count == 32 else { throw RedNativeSyncKeyError.invalidKey }
        let account = try Self.account(origin: origin, owner: owner, app: app, purpose: purpose)
        if try backend.insertIfAbsent(key, account: account) { return }
        guard let existing = try backend.load(account: account), existing.count == 32
        else { throw RedNativeSyncKeyError.invalidKey }
        guard existing == key else { throw RedNativeSyncKeyError.existingDifferentKey }
    }
}
