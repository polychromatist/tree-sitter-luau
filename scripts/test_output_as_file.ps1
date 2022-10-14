tree-sitter test | ForEach-Object { $_ -replace '\x1b\[[0-9;]*m','' } | Out-File -FilePath outfile.txt
