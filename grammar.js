// this code is a modified version of grammar.js in @Azganoth/tree-sitter-lua
const PREC = {
  OR: 1,
  AND: 2,
  COMPARE: 3,
  CONCAT: 4,
  ADDSUB: 5,
  MULDIV: 6,
  UNARY: 7,
  CARET: 8,
  CAST: 9,
  CALL: 10,
  TYPEOR: 11,
  TYPEAND: 12,
  TYPEOPT: 13,
  TYPEPARAM: 14,
};

const WHITESPACE = /\s/;
const NAME = /[a-zA-Z_][0-9a-zA-Z_]*/;
const DECIMAL_DIGIT = /[0-9_]/;
const HEX_DIGIT = /[0-9a-fA-F_]/;
const BINARY_DIGIT = /[01_]/;
const DIRECTIVE = /--!/;

const _numeral = (digit) =>
  choice(
    repeat1(digit),
    seq(repeat1(digit), ".", repeat(digit)),
    seq(repeat(digit), ".", repeat1(digit)),
  );

const _exponent_part = (...delimiters) =>
  seq(
    choice(...delimiters),
    optional(choice("+", "-")),
    repeat1(DECIMAL_DIGIT),
  );

const _list_strict = (rule, sep) => seq(rule, repeat(seq(sep, rule)));
const _list = (rule, sep) => seq(rule, repeat(seq(sep, rule)), optional(sep));

module.exports = grammar({
  name: 'luau',
  rules: {
    chunk: $ => optional($._block),

    block: $ => $._block,
    _block: $ => 
      choice(
        $.ret_stmt,
        seq(repeat1($.statement), optional($.ret_stmt))
      ),

    ret_stmt: $ => seq("return", optional($.explist), optional(";")),

    statement: $ =>
      choice(
        $.var_stmt,
        $.local_var_stmt,
        $.call_stmt,
        $.break_stmt,
        $.continue_stmt,
        $.do_stmt,
        $.while_stmt,
        $.repeat_stmt,
        $.if_stmt,
        $.for_range_stmt,
        $.for_in_stmt,
        $.fn_stmt,
        $.local_fn_stmt,
        $.type_stmt
      ),

    local_fn_stmt: $ => seq("local", "function", field("name", $.name), $._fn_body),

    fn_stmt: $ => seq(
      "function",
      field(
        "name",
        choice($.name, $._tbl_fn_member)),
      $._fn_body),
    _tbl_fn_member: $ => seq($._tbl_ident, choice($._field_named, $._method_name)),
    _tbl_ident: $ => field("table", choice($.name, $._tbl_field_named)),
    _tbl_field_named: $ => seq($._tbl_ident, $._field_named),

    for_in_stmt: $ => seq(
      "for", field("bindings", alias($._b_list, $.bindinglist)),
      "in", field("iterator", alias($._v_list, $.explist)),
      "do", optional(field("body", $.block)), "end"),
    _b_list: $ => _list_strict(field("binding", $.binding), ","),
    _v_list: $ => _list_strict(field("value", $.exp), ","),

    for_range_stmt: $ => seq(
      "for", field("binding", $.binding),
      "=", field("min", $.exp),
      ",", field("max", $.exp),
      optional(seq(",", field("step", $.exp))),
      "do", optional(field("body", $.block)), "end"),

    if_stmt: $ => seq(
      "if", field("condition", $.exp),
      "then", optional(field("consequence", $.block)),
      repeat(field("alternative", $.elseif_clause)),
      optional(field("alternative", $.else_clause)),
      "end"),
    elseif_clause: $ => seq(
      "elseif", field("condition", $.exp),
      "then", optional(field("consequence", $.block))),
    else_clause: $ => seq("else", optional(field("body", $.block))),

    repeat_stmt: $ => seq(
      "repeat", optional(field("body", $.block)),
      "until", field("condition", $.exp)),

    while_stmt: $ => seq(
      "while", field("condition", $.exp),
      "do", optional(field("body", $.block)), "end"),

    do_stmt: $ => seq("do", optional(field("body", $.block)), "end"),

    break_stmt: () => "break",
    continue_stmt: () => "continue",

    local_var_stmt: $ => seq(
      "local",
      $.bindinglist,
      optional(seq("=", $.explist))),

    var_stmt: $ => seq(
      $.varlist, $._assign, alias($._v_list, $.explist)),
    varlist: $ => _list_strict($.var, ","),

    type_stmt: $ => seq(
      optional(seq("export", token.immediate(" "))),
      "type", token.immediate(" "),
      choice(
        field("name", $.name),
        seq(field("module", $.name), ".", field("name", $.name))),
      optional(seq("<", $._type_stmt_genlist, ">")),
      "=",
      $.type
    ),
    _type_stmt_gen: $ => seq(field("generic", $.name), optional(seq("=", $.type))),
    _type_stmt_genlist: $ => choice(
      seq(_list_strict($._type_stmt_gen, ","), optional(seq(",", $._type_stmt_packlist))),
      $._type_stmt_packlist),
    _type_stmt_pack: $ => seq(field("genpack", $.name), "...", optional(seq("=", $.typepack))),
    _type_stmt_packlist: $ => _list_strict($._type_stmt_pack, ","),

    _assign: $ => choice(
      "=",
      "+=",
      "-=",
      "*=",
      "/=",
      "%=",
      "^=",
      "..="),

    exp: $ => choice(
      $.nil,
      $.boolean,
      $.number,
      $.string,
      $.vararg,
      $.callback,
      $.prefixexp,
      $.table,
      $.unexp,
      $.binexp,
      $.ifexp),

    explist: $ => _list_strict($.exp, ","),

    binexp: $ => choice(
      ...[
        ["or", PREC.OR],
        ["and", PREC.AND],
        ["==", PREC.COMPARE],
        ["~=", PREC.COMPARE],
        ["<", PREC.COMPARE],
        [">", PREC.COMPARE],
        ["<=", PREC.COMPARE],
        [">=", PREC.COMPARE],
        ["+", PREC.ADDSUB],
        ["-", PREC.ADDSUB],
        ["*", PREC.MULDIV],
        ["/", PREC.MULDIV],
        ["%", PREC.MULDIV]
      ].map(([op, pri]) =>
        prec.left(pri, seq( field("arg0", $.exp), field("op", op), field("arg1", $.exp) ))),
      ...[
        ["..", PREC.CONCAT],
        ["^", PREC.CARET],
      ].map(([op, pri]) =>
        prec.right(pri, seq( field("arg0", $.exp), field("op", op), field("arg1", $.exp) ))),
      prec.left(PREC.CAST, seq( field("arg", $.exp), field("op", "::"), field("cast", $.type)))),

    unexp: $ => choice(
      ...["not", "#", "-"].map(op =>
        prec.left(PREC.UNARY, seq(field("op", op), field("arg", $.exp))))),

    ifexp: $ => seq("if", $.exp, "then",
      repeat($._ifexp_elseif),
      "else", $.exp),
    _ifexp_elseif: $ => seq("elseif", $.exp, "then"),

    table: $ => seq("{", optional($.fieldlist), "}"),
    fieldlist: $ =>
      seq(_list($.field, $.fieldsep), optional($.fieldsep)),
    field: $ => seq(
      optional(seq(
        choice( field("key", $.name), seq("[", field("key", $.exp), "]") ),
        "=")),
      field("value", $.exp)),
    fieldsep: () => choice(",", ";"),

    prefix: $ => choice($.var, $.call_stmt, $.exp_wrap),
    prefixexp: $ => $.prefix,
    _prefixexp: $ => prec(PREC.CALL, $.prefix),

    exp_wrap: $ => seq("(", $.exp, ")"),

    call_stmt: $ => seq(
      field("invoked", choice(
        $._prefixexp,
        $._tbl_method)),
      field("arglist", $.arglist)),
    _tbl_method: $ => seq(field("table", $.prefixexp), $._method_name),
    _method_name: $ => seq(":", field("method", $.name)),
    arglist: $ => choice(
      seq("(", optional($.explist), ")"),
      $.table,
      $.string),

    binding: $ => seq(
      field("name", $.name),
      optional(seq(":", field("annotation", $.type)))),

    bindinglist: $ => _list_strict($.binding, ","),

    var: $ => choice($.name, $._tbl_var),
    _tbl_var: $ => seq(
      field("table", choice(
        $.name,
        $._tbl_var,
        $.call_stmt,
        $.exp_wrap)),
      choice($._field_indexed, $._field_named)),
    _field_named: $ => seq(".", field("field", $.name)),
    _field_indexed: $ => seq("[", field("field", $.exp), "]"),

    callback: $ => seq("function", $._fn_body),
    _fn_body: $ => seq(
      optional(seq("<", field("generics", $.typegenlist), ">")),
      "(", optional(field("parameters", $.parlist)), ")",
      optional(seq(":", field("return_type", $.type))),
      optional(field("body", $.block)),
      "end"),
    parlist: $ => choice(
      seq( _list_strict(field("binding", $.binding), ","), optional(seq(",", $._param_vararg)) ),
      $._param_vararg),
    _param_vararg: $ => seq($.vararg, optional(seq(":", $.type))),

    type: $ => choice(
      $.simpletype,
      $.bintype,
      $.untype),
    simpletype: $ => choice(
      $._type_nil,
      $._type_singleton,
      $._type_module,
      $._type_named,
      $._type_typeof,
      $._type_func,
      $._type_wrap,
      $._type_table),
    _type_named: $ => prec.right(PREC.TYPEPARAM, seq(
      field("typename", $.name),
      optional(seq("<", $.typeparlist, ">")))),
    _type_module: $ => seq(field("module", $.name), ".", $._type_named),
    _type_singleton: $ => choice($.string, $.boolean),

    typelist: $ => prec.dynamic(1, choice(
      seq( _list_strict($.type, ","), optional(seq(",", $._typelist_variadic)) ),
      $._typelist_variadic)),
    _typelist_variadic: $ => prec.dynamic(1, seq("...", $.type)),

    _type_nil: () => "nil",

    _type_wrap: $ => prec.dynamic(1, seq("(", $.type, ")")),

    typepar: $ => choice($.type, $.typepack),

    typeparlist: $ => _list_strict($.typepar, ","),

    typepack: $ => choice($._typepack_wrap, $._typepack_variadic, $._typepack_generic),
    _typepack_wrap: $ => seq("(", optional($.typelist), ")"),
    _typepack_variadic: $ => seq("...", alias($.type, $.variadic)),
    _typepack_generic: $ => seq(alias($.name, $.generic), "..."),

    _type_typeof: $ => seq("typeof", "(", $.exp, ")"),

    _type_func: $ => seq(optional($._typefunc_gen), alias($._typefunc_wrap, $.typefuncpar), alias($.typepar, $.typeret)),
    _typefunc_gen: $ => seq("<", $.typegenlist, ">"),
    _typefunc_wrap: $ => prec.dynamic(0, seq("(", optional($._typefunc_parlist), ")", "->")),
    _typefunc_par: $ => seq(optional(seq(field("param", $.name), ":")), $.type),
    _typefunc_parlist: $ => choice(
      seq( _list_strict($._typefunc_par, ","), optional(seq(",", $._typefunc_partail)) ),
      $._typefunc_partail),
    _typefunc_partail: $ => choice($._typepack_variadic, $._typepack_generic),

    _type_table: $ => seq("{", optional($._typetable_content), "}"),
    _typetable_content: $ => choice($._typetable_entrylist, $._typetable_array),
    _typetable_array: $ => alias($.type, $.arraytype),
    _typetable_entry: $ => choice($._typetable_index, $._typetable_prop),
    _typetable_entrylist: $ => _list($._typetable_entry, $.fieldsep),
    _typetable_index: $ => seq("[", field("index", $.type), "]", ":", field("value", $.type)),
    _typetable_prop: $ => seq(field("prop", $.name), ":", field("value", $.type)),

    bintype: $ => choice(
      ...[
        ["&", PREC.TYPEAND], 
        ["|", PREC.TYPEOR]
      ].map(([op, pri]) => 
          prec.left(pri, seq(field("arg0", $.type), field("op", op), field("arg1", $.type))) ),
      ),

    untype: $ => prec.left(PREC.TYPEOPT, seq(field("arg", $.type), field("op", "?"))),

    typegen: $ => field("generic", $.name),
    typegenlist: $ => choice(
      seq(_list_strict($.typegen, ","), optional(seq(",", $._typegen_packlist))),
      $._typegen_packlist),
    _typegen_pack: $ => seq(field("genpack", $.name), "..."),
    _typegen_packlist: $ => _list_strict($._typegen_pack, ","),

    number: $ => token(
      seq(optional("-"), choice(
        seq(_numeral(DECIMAL_DIGIT), optional(_exponent_part("e", "E"))),
        seq(choice("0x", "0X"), repeat1(HEX_DIGIT)),
        seq(choice("0b", "0B"), repeat1(BINARY_DIGIT))))),
    vararg: () => "...",

    string: $ => seq($._string_start, optional($._string_content), $._string_end),

    boolean: () => choice("true", "false"),
    nil: () => "nil",

    name: () => NAME,

    comment: $ => seq($._comment_start, optional($._comment_content), $._comment_end),
  },

  extras: $ => [WHITESPACE, $.comment],

  externals: $ => [
    $._comment_start,
    $._comment_content,
    $._comment_end,
    $._string_start,
    $._string_content,
    $._string_end],

  inline: $ => [$.prefix, $.fieldsep],

  supertypes: $ => [$.prefixexp, $.exp, $.statement, $.type],
  conflicts: $ => [
    [$._typefunc_par, $.typelist              ],
    [$._typefunc_par,             $._type_wrap],
    [$._typefunc_par, $.typelist, $._type_wrap],

    [$._typelist_variadic, $._typepack_variadic]],

  word: $ => $.name,
});
