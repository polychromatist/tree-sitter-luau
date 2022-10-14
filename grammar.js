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
const _list_vrd = (rule, rulevrd, sep) => choice( seq(_list_strict(rule, sep), optional(seq(sep, rulevrd))), rulevrd )

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

    ret_stmt: $ => seq("return", optional($._explist), optional(";")),

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
      "for", field("bindings", $._b_list),
      "in", field("iterator", $._v_list),
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

    local_var_stmt: $ => seq("local", $._bindinglist, optional(seq("=", $._explist))),

    var_stmt: $ => seq($._varlist, $._assign, $._explist),
    _varlist: $ => _list_strict($.var, ","),

    type_stmt: $ => seq(
      optional(seq("export", token.immediate(" "))),
      "type", token.immediate(" "),
      optional(seq(field("module", $.name), ".")),
      $.name,
      optional(seq("<", $._type_stmt_genlist, ">")),
      "=",
      $.type
    ),
    _type_stmt_gen: $ => seq($.generic, optional(seq("=", $.type))),
    _type_stmt_genlist: $ => _list_vrd($._type_stmt_gen, $._type_stmt_packlist, ","),
    /*
    _type_stmt_genlist: $ => choice(
      seq(_list_strict($._type_stmt_gen, ","), optional(seq(",", $._type_stmt_packlist))),
      $._type_stmt_packlist),*/
    _type_stmt_pack: $ => seq($.genpack, optional(seq("=", $.typepack))),
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
      $.cast,
      $.ifexp),

    _explist: $ => _list_strict($.exp, ","),

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
        prec.right(pri, seq( field("arg0", $.exp), field("op", op), field("arg1", $.exp) ))) ),


    cast: $ => prec.left(PREC.CAST, seq( field("arg", $.exp), field("op", "::"), field("cast", $.type))),

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
      seq("(", optional($._explist), ")"),
      $.table,
      $.string),

    binding: $ => seq(
      field("name", $.name),
      optional(seq(":", field("annotation", $.type)))),

    _bindinglist: $ => _list_strict($.binding, ","),

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
      optional(seq("<", $._genlist, ">")),
      "(", optional($._paramlist), ")",
      optional(seq(":", field("return_type", $.type))),
      optional(field("body", $.block)),
      "end"),
    _paramlist: $ => _list_vrd(alias($.binding, $.param), alias($._param_vararg, $.param), ","),
    /*
    paramlist: $ => choice(
      seq( _list_strict($.binding, ","), optional(seq(",", $._param_vararg)) ),
      $._param_vararg),*/
    _param_vararg: $ => seq($.vararg, optional(seq(":", $.type))),

    type: $ => choice(
      $.namedtype,
      $.wraptype,
      $.dyntype,
      $.fntype,
      $.tbtype,
      $.singleton,
      $.bintype,
      $.untype),
    /*
    simpletype: $ => choice(
      $._type_nil,
      $._type_singleton,
      $._type_module,
      $._type_named,
      $._type_typeof,
      $._type_func,
      $._type_table),*/
    singleton: $ => choice($.string, $.nil),
    namedtype: $ => prec.right(PREC.TYPEPARAM, seq(
      optional(seq(field("module", $.name), ".")),
      $.name,
      optional(seq("<", $._typeparamlist, ">")))),

    _typelist: $ => prec.dynamic(1, _list_vrd($.type, $._typelist_vrd, ",")),
    /*
    _typelist: $ => prec.dynamic(1,
      choice(
        seq(
          _list_strict($.type, ","),
          optional(seq(",", $._typelist_vrd))),
        $._typelist_vrd)),*/
    _typelist_vrd: $ => prec.dynamic(1, $.variadic),

    wraptype: $ => prec.dynamic(1, seq("(", $.type, ")")),

    typeparam: $ => choice($.type, $.typepack),

    _typeparamlist: $ => _list_strict($.typeparam, ","),

    typepack: $ => choice($._typepack_wrap, $._typepack_vrd, $._typepack_gen),
    _typepack_wrap: $ => seq("(", optional($._typelist), ")"),
    _typepack_vrd: $ => $.variadic,
    _typepack_gen: $ => $.genpack,

    variadic: $ => seq("...", $.type),

    dyntype: $ => seq("typeof", "(", $.exp, ")"),

    fntype: $ => seq(
      optional($._fntype_gen),
      alias($._fntype_wrap, $.paramlist),
      choice($.type, $.typepack)),
    _fntype_gen: $ => seq("<", $._genlist, ">"),
    _fntype_wrap: $ => prec.dynamic(0, seq("(", optional($._fntype_paramlist), ")", "->")),
    _fntype_param: $ => seq(optional(seq(field("param_name", $.name), ":")), $.type),
    _fntype_paramlist: $ => _list_vrd($._fntype_param, $._fntype_paramlist_vrd, ","),
    /*
    _fntype_parlist: $ => choice(
      seq( _list_strict($._typefunc_par, ","), optional(seq(",", $._typefunc_partail)) ),
      $._typefunc_partail),*/
    _fntype_paramlist_vrd: $ => choice($._typepack_vrd, $._typepack_gen),

    tbtype: $ => seq("{", optional($._tbtype_content), "}"),
    _tbtype_content: $ => choice($._tbtype_kvlist, $._tbtype_array),
    _tbtype_array: $ => alias($.type, $.array),
    _tbtype_kv: $ => choice($._tbtype_index, $._tbtype_prop),
    _tbtype_kvlist: $ => _list($._tbtype_kv, $.fieldsep),
    _tbtype_index: $ => seq("[", field("index", $.type), "]", ":", field("value", $.type)),
    _tbtype_prop: $ => seq(field("prop", $.name), ":", field("value", $.type)),

    bintype: $ => choice(
      ...[
        ["&", PREC.TYPEAND], 
        ["|", PREC.TYPEOR]
      ].map(([op, pri]) => 
          prec.left(pri, seq(field("arg0", $.type), field("op", op), field("arg1", $.type))) ),
      ),

    untype: $ => prec.left(PREC.TYPEOPT, seq(field("arg", $.type), field("op", "?"))),

    generic: $ => $.name,
    _genlist: $ => _list_vrd($.generic, $._genpack_list, ","),
    /*
    _typegenlist: $ => choice(
      seq(_list_strict($._typegen, ","), optional(seq(",", $._typegen_packlist))),
      $._typegen_packlist),*/
    genpack: $ => seq($.generic, "..."),
    _genpack_list: $ => _list_strict($.genpack, ","),

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
    [$._fntype_param, $._typelist             ],
    [$._fntype_param,               $.wraptype],
    [$._fntype_param, $._typelist,  $.wraptype],

    [$._typelist_vrd, $._typepack_vrd]],

  word: $ => $.name,
});
