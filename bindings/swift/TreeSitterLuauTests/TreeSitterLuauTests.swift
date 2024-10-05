import XCTest
import SwiftTreeSitter
import TreeSitterLuau

final class TreeSitterLuauTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_luau())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Luau grammar")
    }
}
