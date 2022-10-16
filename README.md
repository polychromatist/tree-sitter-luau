## tree-sitter-luau

Luau grammar for [tree-sitter](https://github.com/tree-sitter/tree-sitter)
WIP

## how I deploy in neovim

1. have a c/c++ compiler and nodejs
2. install [nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter)
3. register parser in init.lua file (or equivalent) with this code fragment:
   ```lua
    local parser_config = require "nvim-treesitter.parsers".get_parser_configs()

    local luau_ts_path = "https://github.com/polychromatist/tree-sitter-luau"
    parser_config.luau = {
      install_info = {
        url = luau_ts_path,
        files = {"src/parser.c", "src/scanner.c"},
        branch = "main",
        generate_requires_npm = false,
        requires_generate_from_grammar = false
      },
    }
    ```
4. issue Ex command `:TSInstall luau`
5. in Neovim config directory (e.g. `%LOCALAPPDATA%\nvim`), do two things:
  - add a file `ftdetect\luau.vim` with the content:
  ```vim
  au BufRead,BufNewFile *.luau        set filetype=luau
  ```
  - copy `.\queries\` folder's content (from this project) to `after\queries\luau`
