// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "RedNativeIdentity",
    platforms: [.iOS(.v15), .macOS(.v12)],
    products: [.library(name: "RedNativeIdentity", targets: ["RedNativeIdentity"])],
    targets: [
        .target(name: "RedNativeIdentity"),
        .testTarget(name: "RedNativeIdentityTests", dependencies: ["RedNativeIdentity"])
    ]
)
