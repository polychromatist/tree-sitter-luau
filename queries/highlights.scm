;; Keywords

"return" @keyword.return

[
 "in"
 "local"
] @keyword

(break_stmt) @keyword

(do_stmt
[
  "do"
  "end"
] @keyword)

(while_stmt
[
  "while"
  "do"
  "end"
] @repeat)

(repeat_stmt
[
  "repeat"
  "until"
] @repeat)

(if_stmt
[
  "if"
  "elseif"
  "else"
  "then"
  "end"
] @conditional)

(elseif_clause
[
  "elseif"
  "then"
  "end"
] @conditional)

(else_clause
[
  "else"
  "end"
] @conditional)

(for_in_stmt
[
  "for"
  "do"
  "end"
] @repeat)

(for_range_stmt
[
  "for"
  "do"
  "end"
] @repeat)

(fn_stmt
[
  "function"
  "end"
] @keyword.function)

(callback
[
  "function"
  "end"
] @keyword.function)

;; Operators

[
 "and"
 "not"
 "or"
] @keyword.operator

[
  "+"
  "-"
  "*"
  "/"
  "%"
  "^"
  "#"
  "=="
  "~="
  "<="
  ">="
  "<"
  ">"
  "="
  "+="
  "-="
  "*="
  "/="
  "%="
  "^="
  "&"
  "|"
  ".."
] @operator

;; Punctuations

[
  ";"
  ":"
  ","
  "."
] @punctuation.delimiter

;; Brackets

[
 "("
 ")"
 "["
 "]"
 "{"
 "}"
] @punctuation.bracket

;; Variables

(identifier) @variable

((name) @variable.global
  (#any-of? @variable.global
  "_G" "_VERSION"))
((identifier) @variable.builtin
  (#any-of? @variable.builtin
  "self"))

;; Constants

((identifier) @constant
 (#lua-match? @constant "^[A-Z][A-Z_0-9]*$"))

(vararg) @constant

(nil) @constant.builtin

[
  (false)
  (true)
] @boolean

;; Tables

(field key: (name) @field)

(var field: (name) @field)

(table
[
  "{"
  "}"
] @constructor)

;; Functions

(param (name) @parameter)

(call_stmt invoked: (var . (name) @function.call .))
(call_stmt invoked: (var field: (name) @function.call .))
(call_stmt method: (name) @method.call)
(fn_stmt name: (name) @function)
(fn_stmt field: (name) @function .)
(fn_stmt method: (name) @method)
(local_fn_stmt (name) @function)

; (function_call name: (dot_index_expression field: (identifier) @function.call))
; (function_declaration name: (dot_index_expression field: (identifier) @function))

; (method_index_expression method: (identifier) @method)

(function_call
  (identifier) @function.builtin
  (#any-of? @function.builtin
    "assert" "collectgarbage" "error" "gcinfo" "getfenv" "getmetatable" "ipairs"
    "loadstring" "next" "newproxy" "pairs" "pcall" "print"
    "rawequal" "rawget" "rawlen" "rawset" "require" "select" "setfenv" "setmetatable"
    "tonumber" "tostring" "type" "typeof" "unpack" "xpcall"))

;; Others

(comment) @comment @spell

; (hash_bang_line) @comment

(number) @number

(string) @string @spell

;; Error
(ERROR) @error
