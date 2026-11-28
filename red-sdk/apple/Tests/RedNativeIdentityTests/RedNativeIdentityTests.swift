import XCTest
import Foundation
import CryptoKit
@testable import RedNativeIdentity

final class RedNativeIdentityTests: XCTestCase {
    func testProofAndPayload() throws {
        let a = RedNativeClient.makeProof(), b = RedNativeClient.makeProof()
        XCTAssertEqual(a.verifier.count, 43)
        XCTAssertEqual(a.challenge.count, 43)
        XCTAssertNotEqual(a.verifier, b.verifier)
        let expected = Data(SHA256.hash(data: Data(a.verifier.utf8))).base64EncodedString()
            .replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
        XCTAssertEqual(a.challenge, expected)
        let payload = try RedNativeClient.pairingRequest(app: "red-bit", challenge: a.challenge)
        XCTAssertFalse(payload.contains(a.verifier))
        let decoded = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(payload.utf8)) as? [String:Any])
        XCTAssertEqual(decoded["app"] as? String, "red-bit")
        XCTAssertEqual(decoded["challenge"] as? String, a.challenge)
        XCTAssertThrowsError(try RedNativeClient.pairingRequest(app: "unknown", challenge: a.challenge))
    }
    func testQRCode() throws {
        let proof = RedNativeClient.makeProof()
        let a = try RedPairQRCode.image(app: "red-bit", challenge: proof.challenge, scale: 4)
        XCTAssertGreaterThan(a.width, 100)
        XCTAssertEqual(a.width, a.height)
        XCTAssertEqual(a.width % 4, 0)
        XCTAssertThrowsError(try RedPairQRCode.image(app: "red-bit", challenge: proof.challenge, scale: 0))
    }
    func testScopes() throws {
        let a = try RedNativeClient.credentialScope(origin: "https://home.example.test", app: "red-bit")
        XCTAssertEqual(a.count, 64)
        XCTAssertNotEqual(a, try RedNativeClient.credentialScope(origin: "https://other.example.test", app: "red-bit"))
        XCTAssertNotEqual(a, try RedNativeClient.credentialScope(origin: "https://home.example.test", app: "red-yt"))
        for bad in ["http://home.example.test","https://home.example.test/path","https://user@home.example.test","https://home.example.test?x=y","https://home.example.test:443"] {
            XCTAssertThrowsError(try RedNativeClient.credentialScope(origin: bad, app: "red-bit"))
        }
    }
}

extension RedNativeIdentityTests {
    func testShareInteroperability() throws {
        let key=Data((0..<32).map { UInt8($0) })
        let vector=RedNativeShareMessage(source:"red-poly",channel:"progress",id:String(repeating:"ab",count:16),envelope:"AAECAwQFBgcICQoLPCCgfreWq3TjY626ncscDPe3pQ6LWTwTVReJ4GkMZJA7JdOBAzc9bkALwlMYEGiQhNYF2Q",expires:Int64(Date().timeIntervalSince1970*1000)+60000)
        let clear=try RedNativeShare.open(key:key,target:"red-ion",message:vector)
        XCTAssertEqual(String(data:clear,encoding:.utf8),"{\"version\":1,\"data\":{\"completed\":5}}")
        XCTAssertThrowsError(try RedNativeShare.open(key:key,target:"red-bit",message:vector))
        let prepared=try RedNativeShare.prepare(key:key,source:"red-poly",target:"red-ion",channel:"progress",json:clear)
        let message=RedNativeShareMessage(source:prepared.source,channel:prepared.channel,id:prepared.id,envelope:prepared.envelope,expires:vector.expires)
        XCTAssertEqual(try RedNativeShare.open(key:key,target:"red-ion",message:message),clear)
    }
}
