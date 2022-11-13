## tree-sitter-luau

Luau grammar for [tree-sitter](https://github.com/tree-sitter/tree-sitter)

<details>
  <summary>deploying in <a href="https://github.com/helix-editor/helix">helix editor</a></summary>

  1. create the `languages.toml` file if it doesn't already exist ([docs](https://docs.helix-editor.com/languages.html))
  2. append two entries inside `languages.toml`:
  ```toml
  [[language]]
  name = "luau"
  scope = "source.luau"
  injection-regex = "^luau$"
  file-types = ["luau", "server.lua", "client.lua"]
  comment-token = "--"
  indent = { tab-width = 2, unit = "  "}
  # language-server = { command = "luau-lsp", args = ["lsp", "--definitions=<path-to-robloxTypes.d.lua>"] }
  roots = [ "aftman.toml", "default.project.json", "wally.toml" ]

  [[grammar]]
  name = "luau"
  source = { git = "https://github.com/polychromatist/tree-sitter-luau" }
  ```
  3. run `.\scripts\clone_helix_queries.ps1` (or manually clone from `.\helix-queries\` into `<helix-config>\runtime\queries\luau`)
  4. run `hx --grammar fetch` && `hx --grammar build`

</details>

<details>
  <summary>Deploying in neovim</summary>
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
    
    - copy `.\nvim-queries\` folder's content (from this project) to `after\queries\luau`

  <details>
    <summary>Deploying <a href="https://github.com/johnnymorganz/luau-lsp">luau-lsp</a> for high quality linting</summary>

    1. download or compile `luau-lsp`: https://github.com/JohnnyMorganz/luau-lsp/releases
    2. make sure you have either an `aftman.toml`, `wally.toml`, or `default.project.json` file in the project root
    3. modify this lsp config skeleton & put in init.lua file:
    
```lua
local MY_LUAU_LSP_PATH = "C:\\bin\\luau-lsp.exe"
local MY_DIAGNOSTIC_KEY = "<C-N>" -- ctrl N
local MY_LOOKUP_KEY = "K" -- shift K

-- LSP Diagnostics Options Setup 
local sign = function(opts)
  vim.fn.sign_define(opts.name, {
    texthl = opts.name,
    text = opts.text,
    numhl = ''
  })
end

sign({name = 'DiagnosticSignError', text = ''})
sign({name = 'DiagnosticSignWarn', text = ''})
sign({name = 'DiagnosticSignHint', text = ''})
sign({name = 'DiagnosticSignInfo', text = ''})

vim.diagnostic.config({
    virtual_text = false,
    signs = true,
    update_in_insert = true,
    underline = true,
    severity_sort = false,
    float = {
        border = 'rounded',
        source = 'always',
        header = '',
        prefix = '',
    },
})

-- overwrite keymap on LSP enabled buffers
vim.api.nvim_create_autocmd('LspAttach', {
  callback = function(args)
    vim.keymap.set('n', MY_LOOKUP_KEY, vim.lsp.buf.hover, { buffer = args.buf })
    vim.keymap.set('n', MY_DIAGNOSTIC_KEY, function()
      vim.diagnostic.open_float(nil, { focusable = false })
    end, {buffer = true})
  end
})

-- autocmd-event LSP Server Start Callback
function _G.start_luau_lsp()
  vim.lsp.start({
    name = 'nvim-luau-lsp',
    cmd = {MY_LUAU_LSP_PATH, 'lsp'},
    root_dir = vim.fs.dirname(vim.fs.find({'aftman.toml', 'wally.toml', 'default.project.json'}, { upward = true })[1])
  })
end

-- enable signcolumn and register autocmd-event
vim.cmd([[
set signcolumn=yes
au BufRead,BufNewFile *.luau lua _G.start_luau_lsp()
]])
```
  
  </details>

</details>