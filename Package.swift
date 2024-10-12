// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "TreeSitterLuau",
    products: [
        .library(name: "TreeSitterLuau", targets: ["TreeSitterLuau"]),
    ],
    dependencies: [
        .package(url: "https://github.com/ChimeHQ/SwiftTreeSitter", from: "0.8.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterLuau",
            dependencies: [],
            path: ".",
            sources: [
                "src/parser.c",
                "src/scanner.c"
                // NOTE: if your language has an external scanner, add it here.
            ],
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterLuauTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterLuau",
            ],
            path: "bindings/swift/TreeSitterLuauTests"
        )
    ],
    cLanguageStandard: .c11
)
