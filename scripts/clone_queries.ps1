rm -Force "$env:LOCALAPPDATA\nvim\after\queries\luau\*"
cp -Recurse -Force "$HOME\myroot\tree-sitter-luau\queries\*" "$env:LOCALAPPDATA\nvim\after\queries\luau"
