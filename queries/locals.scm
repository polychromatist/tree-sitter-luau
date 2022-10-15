; defined in part due to:
; (1) https://github.com/nvim-treesitter/nvim-treesitter/blob/master/queries/lua/locals.scm
; global spec:
; (2) https://tree-sitter.github.io/tree-sitter/using-parsers#pattern-matching-with-queries
; nvim extended spec:
; (3) https://github.com/nvim-treesitter/nvim-treesitter/blob/master/CONTRIBUTING.md#parser-configurations

; Scopes

[
 (chunk)
 (do_stmt)
 (if_stmt)
 (while_stmt)
 (repeat_stmt)
 (for_range_stmt)
 (for_in_stmt)
 (fn_stmt)
 (local_fn_stmt)
 (callback)
] @scope

; Definitions

(var_stmt
  (var (name) @definition.var))

(local_var_stmt
  (binding (name) @definition.var))

(var_stmt
  (var
    table: (name)
    . (_)* @definition.associated
    field: (name) @definition.var .))

(fn_stmt
  name: (name) @definition.function)
  (#set! definition.function.scope "parent")

(local_fn_stmt
  (name) @definition.function)

(fn_stmt
  table: (name)
  . (_)* @definition.associated
  field: (name) @definition.function .)
  (#set! definition.method.scope "parent")

(fn_stmt
  table: (name)
  . (_)* @definition.associated
  method (name) @definition.function .)
  (#set! definition.method.scope "parent")

(for_in_stmt
  (binding (name) @definition.var))

(for_range_stmt
  (binding . (name) @definition.var))

(param (name) @definition.parameter)

(param (vararg) @definition.parameter)

; References

[
  (name)
] @reference
