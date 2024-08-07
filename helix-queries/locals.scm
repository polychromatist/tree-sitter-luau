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
 (anon_fn)
] @local.scope

; Definitions

(var_stmt
  (var (name) @local.definition))

(local_var_stmt
  (binding (name) @local.definition))

;(var_stmt
;  (var
;    table: (name)
;    (field (name) @definition.associated)
;    name: (name) @definition.var .))

(fn_stmt
  . name: (name) @local.definition)

(local_fn_stmt
  (name) @local.definition)

(fn_stmt
  method: (name) @local.definition)

(for_in_stmt
  (binding (name) @local.definition))

(for_range_stmt
  . (binding (name) @local.definition))

(param (name) @local.definition)

(param (vararg) @local.definition)

; References

(var (name) @local.reference)
