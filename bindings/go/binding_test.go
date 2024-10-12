package tree_sitter_luau_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_luau "github.com/polychromatist/tree-sitter-luau/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_luau.Language())
	if language == nil {
		t.Errorf("Error loading Luau grammar")
	}
}
