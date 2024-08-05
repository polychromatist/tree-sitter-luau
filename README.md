## tree-sitter-luau

Luau grammar for [tree-sitter](https://github.com/tree-sitter/tree-sitter)

### Enabling Highlighting Queries for [Helix Editor](https://github.com/helix-editor/helix)

1. Find the user `languages.toml` file [docs](https://docs.helix-editor.com/languages.html)
  - Linux and Mac: `~/.config/helix`
  - Windows: `%AppData%\helix`
2. Append two entries inside `languages.toml`:
  ```toml
  [[language]]
  name = "luau"
  scope = "source.luau"
  injection-regex = "^luau$"
  file-types = ["luau"]
  comment-token = "--"
  indent = { tab-width = 2, unit = "  "}
  # language-server = { command = "luau-lsp", args = ["lsp", "--definitions=<path-to-robloxTypes.d.lua>"] }
  roots = [ "aftman.toml", "default.project.json", "wally.toml" ]

  [[grammar]]
  name = "luau"
  source = { git = "https://github.com/polychromatist/tree-sitter-luau" }
  ```
3. Run `.\scripts\clone_helix_queries.ps1` (or manually clone from `.\helix-queries\` into `<helix-config>\runtime\queries\luau`)
4. Run `hx --grammar fetch` and `hx --grammar build`

