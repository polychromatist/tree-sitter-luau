## tree-sitter-luau

Luau grammar for [tree-sitter](https://github.com/tree-sitter/tree-sitter)

### Enabling Highlighting Queries for [Helix Editor](https://github.com/helix-editor/helix)

1. Find the user `languages.toml` file [docs](https://docs.helix-editor.com/languages.html)
  - Linux and Mac: `~/.config/helix`
  - Windows: `%appdata%\helix`, _not_ localappdata
2. Append two entries inside `languages.toml`:
  ```toml
  [[language]]
  name = "luau"
  scope = "source.luau"
  injection-regex = "^luau$"
  file-types = ["luau"]
  comment-tokens = ["--", "---"]
  block-comment-tokens = [
    {start = "--[[", end = "]]"},
    {start = "--[=[", end = "]=]"},
    {start = "--[==[", end = "]==]"}
  ]
  indent = { tab-width = 2, unit = "  "}
  roots = [ "aftman.toml", "default.project.json", "wally.toml", "rokit.toml", "selene.toml", ".darklua.json", "foreman.toml", ".luaurc" ]

  [[grammar]]
  name = "luau"
  source = { git = "https://github.com/polychromatist/tree-sitter-luau", rev = "d57b5420002e38de704ee415625f2f012eb97dc2" }
  ```
3. Run `.\scripts\clone_helix_queries.ps1` (or manually clone from `.\helix-queries\` into `<helix-config>\runtime\queries\luau`)
4. Run `hx -g fetch` and `hx -g build`

