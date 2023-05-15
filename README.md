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


### Note on the Neovim case

There is now a Luau parser packaged in nvim-treesitter which will cause a conflict if naively overwritten.
[See the issue](https://github.com/polychromatist/tree-sitter-luau/issues/2#issuecomment-1540723013).
Due to this, the script `scripts/clone_queries.ps1` is now incorrect and has been removed.
As it stands (5/13/2023), the parser packaged in nvim-treesitter is somewhat OK, but [not fully correct](https://i.imgur.com/FSqjBjK.png). This is not my parser.
Here is the approach I used to overwrite it.

<details>
<summary>deploying in neovim, v2</summary>
<ol>
<li>have a c/c++ compiler and nodejs</li>
<li>install <a href="https://github.com/nvim-treesitter/nvim-treesitter">nvim-treesitter</a>, and make sure it's configured</li>
<li>clone or download this repository somewhere</li>
<li>register parser in init.lua file (or equivalent) with this code fragment:
<pre><code class="language-lua">
local parser_config = require "nvim-treesitter.parsers".get_parser_configs()

local myhome = os.getenv "USERPROFILE" or os.getenv "HOME" -- user profile path, if needed

local mypath = "CHANGE_THIS"

-- Example:
-- local mypath = myhome .. "/techstuff/hunter2/cloned_repos"

parser_config.luau = {
install_info = {
url = mypath .. "/tree-sitter-luau",
files = {"src/parser.c", "src/scanner.c"},
-- generate_requires_npm = false,
-- requires_generate_from_grammar = false
},
}
</code>
</pre>
</li>
<li>issue Ex command <code>:TSInstall luau</code></li>
<li>in Neovim config directory (e.g. `%LOCALAPPDATA%\nvim`):</li>
<ul>
<li>add a file `ftdetect\luau.vim` with the content:
<pre><code class="language-vim">
au BufRead,BufNewFile *.luau        set filetype=luau
</code></pre></li></ul>
<li>overwrite queries by appending a second code segment to the nvim init.lua file:
<pre><code class="language-lua">
-- set queries for luau. parser_config segment should be above
do
  for i, v in pairs{"highlights", "indents", "folds", "injections", "locals"} do
    local fd = io.open(mypath .. "/tree-sitter-luau/nvim-queries/" .. v .. ".scm")
    local txt = fd:read"*a"
    fd:close()
    vim.treesitter.query.set("luau", v, txt)
  end
end
</code></pre></li>
</ol>
<details>
<summary>Deploying <a href="https://github.com/johnnymorganz/luau-lsp">luau-lsp</a> for high quality linting</summary>

<ol>
<li>download or compile luau-lsp: https://github.com/JohnnyMorganz/luau-lsp/releases</li>
<li>make sure you have either an `aftman.toml`, `wally.toml`, or `default.project.json` file in the project root</li>
<li>modify this lsp config skeleton & put in init.lua file:</li>
<pre><code class="language-lua">
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
</code></pre></ol>

</details>

</details>
