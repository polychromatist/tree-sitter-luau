rm -Force -Recurse ".\queries" -ErrorAction SilentlyContinue
xcopy /i /e ".\nvim-queries" ".\queries"
