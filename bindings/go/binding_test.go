package tree_sitter_luau_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/tree-sitter/tree-sitter-luau"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_luau.Language())
	if language == nil {
		t.Errorf("Error loading Luau grammar")
	}
}
