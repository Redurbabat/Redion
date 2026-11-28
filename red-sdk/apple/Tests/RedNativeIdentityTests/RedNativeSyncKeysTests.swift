import XCTest
import Foundation
@testable import RedNativeIdentity

private final class TestKeyBackend: RedNativeSyncKeyBackend {
    var entries: [String: Data] = [:]
    func load(account: String) throws -> Data? { entries[account] }
    func insertIfAbsent(_ value: Data, account: String) throws -> Bool {
        if entries[account] != nil { return false }
        entries[account] = value
        return true
    }
}
final class RedNativeSyncKeysTests: XCTestCase {
    private let origin = "https://home.example.test"
    func testScopeIsolation() throws {
        let base = try RedNativeSyncKeyStore.account(origin: origin, owner: "owner", app: "red-ion", purpose: .sync)
        XCTAssertEqual(base.count, 64)
        XCTAssertNotEqual(base, try RedNativeClient.credentialScope(origin: origin, app: "red-ion"))
        XCTAssertNotEqual(base, try RedNativeSyncKeyStore.account(origin: origin, owner: "other", app: "red-ion", purpose: .sync))
        XCTAssertNotEqual(base, try RedNativeSyncKeyStore.account(origin: origin, owner: "owner", app: "red-fit", purpose: .sync))
        XCTAssertNotEqual(base, try RedNativeSyncKeyStore.account(origin: "https://other.example.test", owner: "owner", app: "red-ion", purpose: .sync))
        let scopes = try RedNativeSyncKeyPurpose.allCases.map {
            try RedNativeSyncKeyStore.account(origin: origin, owner: "owner", app: "red-ion", purpose: $0)
        }
        XCTAssertEqual(Set(scopes).count, 3)
        XCTAssertThrowsError(try RedNativeSyncKeyStore.account(origin: origin, owner: "", app: "red-ion", purpose: .sync))
        XCTAssertThrowsError(try RedNativeSyncKeyStore.account(origin: origin, owner: String(repeating: "a", count: 129), app: "red-ion", purpose: .sync))
        XCTAssertThrowsError(try RedNativeSyncKeyStore.account(origin: "http://home.example.test", owner: "owner", app: "red-ion", purpose: .sync))
    }
    func testMissingAndInsertOnly() throws {
        let backend = TestKeyBackend(), store = RedNativeSyncKeyStore(backend: backend)
        let key = Data(repeating: 7, count: 32), different = Data(repeating: 8, count: 32)
        XCTAssertNil(try store.load(origin: origin, owner: "owner", app: "red-ion", purpose: .sync))
        try store.install(key, origin: origin, owner: "owner", app: "red-ion", purpose: .sync)
        try store.install(key, origin: origin, owner: "owner", app: "red-ion", purpose: .sync)
        XCTAssertThrowsError(try store.install(different, origin: origin, owner: "owner", app: "red-ion", purpose: .sync)) {
            XCTAssertEqual($0 as? RedNativeSyncKeyError, .existingDifferentKey)
        }
        XCTAssertThrowsError(try store.install(Data(), origin: origin, owner: "owner", app: "red-ion", purpose: .file))
        XCTAssertEqual(try store.load(origin: origin, owner: "owner", app: "red-ion", purpose: .sync), key)
        XCTAssertNil(try store.load(origin: origin, owner: "owner", app: "red-ion", purpose: .file))
        XCTAssertNil(try store.load(origin: origin, owner: "other", app: "red-ion", purpose: .sync))
        let account = try RedNativeSyncKeyStore.account(origin: origin, owner: "owner", app: "red-ion", purpose: .sync)
        backend.entries[account] = Data([1])
        XCTAssertThrowsError(try store.load(origin: origin, owner: "owner", app: "red-ion", purpose: .sync))
        XCTAssertThrowsError(try store.install(key, origin: origin, owner: "owner", app: "red-ion", purpose: .sync))
        XCTAssertEqual(backend.entries[account], Data([1]))
    }
}
