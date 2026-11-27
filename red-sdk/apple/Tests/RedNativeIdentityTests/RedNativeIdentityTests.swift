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
