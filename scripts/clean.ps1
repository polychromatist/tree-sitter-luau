rm -Recurse -Force .\build\ -ErrorAction SilentlyContinue
# rm -Recurse -Force .\bindings\ -ErrorAction SilentlyContinue
rm -Force .\parser.exp -ErrorAction SilentlyContinue
rm -Force .\parser.obj -ErrorAction SilentlyContinue
rm -Force .\parser.lib -ErrorAction SilentlyContinue
rm -Force .\scanner.obj -ErrorAction SilentlyContinue
rm -Force .\src\parser.obj -ErrorAction SilentlyContinue
rm -Force .\src\scanner.exp -ErrorAction SilentlyContinue
rm -Force .\src\scanner.lib -ErrorAction SilentlyContinue
rm -Force .\src\scanner.obj -ErrorAction SilentlyContinue
rm -Force ".\tree-sitter-luau.wasm" -ErrorAction SilentlyContinue
rm -Force ".\package-lock.json" -ErrorAction SilentlyContinue
rm -Recurse -Force ".\node_modules\"  -ErrorAction SilentlyContinue
# rm -Force ".\.editorconfig" -ErrorAction SilentlyContinue
# rm -Force ".\.gitattributes" -ErrorAction SilentlyContinue
# rm -Force ".\Makefile" -ErrorAction SilentlyContinue
# rm -Force ".\Package.swift" -ErrorAction SilentlyContinue
# rm -Force ".\pyproject.toml" -ErrorAction SilentlyContinue
# rm -Force ".\setup.py" -ErrorAction SilentlyContinue
