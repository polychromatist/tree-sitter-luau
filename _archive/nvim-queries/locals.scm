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
 (anon_fn)
] @local.scope

(var_stmt
  (var (name) @local.definition))

(local_var_stmt
  (binding (name) @local.definition))

(fn_stmt
  . name: (name) @local.definition)
  (#set! definition.function.scope "parent")

(local_fn_stmt
  (name) @local.definition)

(fn_stmt
  method: (name) @definition.function)
  (#set! definition.method.scope "parent")

(for_in_stmt
  (binding (name) @local.definition))

(for_range_stmt
  . (binding (name) @local.definition))

(param (name) @local.definition)

(param (vararg) @local.definition)

[
  (name)
] @local.reference
