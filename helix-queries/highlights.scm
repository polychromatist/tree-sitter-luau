"return" @keyword.control.return

"local" @keyword.storage.modifier

(break_stmt) @keyword
(continue_stmt) @keyword

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
] @keyword.control.repeat)

(repeat_stmt
[
  "repeat"
  "until"
] @keyword.control.repeat)

(if_stmt
[
  "if"
  "elseif"
  "else"
  "then"
  "end"
] @keyword.control.conditional)

(elseif_clause
[
  "elseif"
  "then"
  "end"
] @keyword.control.conditional)

(else_clause
[
  "else"
  "end"
] @keyword.control.conditional)

(for_in_stmt
[
  "for"
  "do"
  "end"
] @keyword.control.repeat)

(for_range_stmt
[
  "for"
  "do"
  "end"
] @keyword.control.repeat)

(fn_stmt
[
  "function"
  "end"
] @keyword.storage.type)

(local_fn_stmt
[
 "function"
 "end"
] @keyword.storage.type)

(callback
[
  "function"
  "end"
] @keyword.storage.type)

;; Operators

[
 "and"
 "not"
 "or"
 "in"
] @keyword.operator

(ifexp
[
 "if"
 "then"
 "elseif"
 "else"
] @keyword.operator)

(type_stmt "export" @keyword.storage.modifier) 
(type_stmt "type" @keyword.storage.type) 
[
  "+"
  "-"
  "*"
  "/"
  "//"
  "%"
  "^"
  "#"
  "=="
  "~="
  "<="
  ">="
  op: "<"
  op: ">"
  "="
  "&"
  "|"
  "+="
  "-="
  "*="
  "/="
  "//="
  "%="
  "^="
  "..="
  "->"
  "::"
  ".."
] @operator

[
  ";"
  ":"
  ","
  "."
] @punctuation.delimiter

[
 "("
 ")"
 "["
 "]"
 "{"
 "}"
] @punctuation.bracket


(exp (vararg) @constant)

(nil) @constant.builtin

(boolean) @constant.builtin.boolean

(param (name) @variable.parameter)

(generic (name) @type)

(namedtype . module: (name) @namespace . (name) @type)

(namedtype . (name) @type.builtin !module
  (#match? @type.builtin "^(number|string|any|never|unknown|boolean|thread|userdata)$"))

(namedtype . (name) @type !module)

(type_stmt . (name) @type)

(tbtype prop: (name) @variable.other.member)

(var . (name) @function.builtin !table
  (#match? @function.builtin "^(assert|collectgarbage|error|gcinfo|getfenv|getmetatable|ipairs|loadstring|next|newproxy|pairs|pcall|print|rawequal|rawget|rawlen|rawset|require|select|setfenv|setmetatable|tonumber|tostring|type|typeof|unpack|xpcall)$"))

(_ table: (name) @variable.builtin (#eq? @variable.builtin "bit32")
   . (name)? @function.builtin
   (#match? @function.builtin "^(arshift|lrotate|lshift|replace|rrotate|rshift|btest|bxor|band|bnot|bor|countlz|countrz|extract)$")
)

(_ table: (name) @variable.builtin (#eq? @variable.builtin "coroutine")
   . (name)? @function.builtin
   (#match? @function.builtin "^(close|create|isyieldable|resume|running|status|wrap|yield)$")
)

(_ table: (name) @variable.builtin (#eq? @variable.builtin "debug")
   . (name)? @function.builtin
   (#match? @function.builtin "^(info|traceback|profilebegin|profileend|resetmemorycategory|setmemorycategory)$")
)

(_ table: (name) @variable.builtin (#eq? @variable.builtin "math")
   . (name)? @function.builtin
   (#match? @function.builtin "^(abs|acos|asin|atan|atan2|ceil|clamp|cos|cosh|deg|exp|floor|fmod|frexp|ldexp|log|log10|max|min|modf|noise|pow|rad|random|randomseed|round|sign|sin|sinh|sqrt|tan|tanh)$")
)

(_ table: (name) @variable.builtin (#eq? @variable.builtin "math")
   . (name)? @constant.builtin
   (#match? @constant.builtin "^(huge|pi)$")
)

(_ table: (name) @variable.builtin (#eq? @variable.builtin "os")
   . (name)? @function.builtin
   (#match? @function.builtin "^(clock|date|difftime|time)$")
)

(_ table: (name) @variable.builtin (#eq? @variable.builtin "string")
   . (name)? @function.builtin
   (#match? @function.builtin "^(byte|char|find|format|gmatch|gsub|len|lower|match|pack|packsize|rep|reverse|split|sub|unpack|upper)$")
)

(_ table: (name) @variable.builtin (#eq? @variable.builtin "table")
   . (name)? @function.builtin
   (#match? @function.builtin "^(create|clear|clone|concat|foreach|foreachi|find|freeze|getn|insert|isfrozen|maxn|move|pack|remove|sort|unpack)$")
)

(_ table: (name) @variable.builtin (#eq? @variable.builtin "task")
   . (name)? @function.builtin
   (#match? @function.builtin "^(cancel|defer|delay|desynchronize|spawn|wait)$")
)

(_ table: (name) @variable.builtin (#eq? @variable.builtin "utf8")
   . (name)? @function.builtin
   (#match? @function.builtin "^(char|charpattern|codepoint|codes|graphemes|len|offset|nfcnormalize|nfdnormalize)$")
)

(var . (name) @variable.builtin (#match? @variable.builtin "^(_G|_VERSION|self|bit32|coroutine|debug|math|os|string|table|task|utf8)$"))

(field key: (name) @function.method value: (callback))
(call_stmt invoked: (var (name) @function .))

(call_stmt method: (name) @function.method)
(fn_stmt method: (name) @function.method)
(fn_stmt name: (name) @function)
(local_fn_stmt (name) @function)

(field key: (name) @variable.other.member)
(var field: (name) @variable.other.member)

((name) @constant
 (#match? @constant "^[A-Z][A-Z_0-9]*$"))

(table
[
  "{"
  "}"
] @constructor)

(comment) @comment

(number) @constant.numeric

(interp_start) @punctuation.special
(interp_content) @string
(interp_brace_open) @punctuation.special
(interp_brace_close) @punctuation.special
(interp_end) @punctuation.special

(string) @string

(var (name) @variable !field)

;; Error
(ERROR) @error
