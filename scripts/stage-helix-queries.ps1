rm -Force -Recurse ".\queries" -ErrorAction SilentlyContinue
xcopy /i /e ".\helix-queries" ".\queries"
