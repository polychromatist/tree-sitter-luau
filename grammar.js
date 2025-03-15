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

const WHITESPACE = /[\s\n\r]/;
const NAME = /[a-zA-Z_][0-9a-zA-Z_]*/;
const ATTRNAME = /[0-9a-zA-Z_]+/;
const DECIMAL_DIGIT = /[0-9]/;
const HEX_DIGIT = /[0-9a-fA-F]/;
const BINARY_DIGIT = /[01]/;
const UNICODE_ESCAPE_CODEPOINT_ARG = /[0-9a-fA-F]{1,16}/;
const DECIMAL_BYTE_ESCAPE_ARG = /[0-9]{1,3}/;
const HEX_BYTE_ESCAPE_ARG = /[0-9a-fA-F]{2}/;
// const DIRECTIVE = /--!/;

const _num_und = (digit) => repeat(choice(digit, "_"))

const _numeral = (digit) =>
  choice(
    seq(digit, _num_und(digit)),
    seq(digit, _num_und(digit), ".", _num_und(digit)),
    seq(".", digit, _num_und(digit)),
  );

const _exponent_part = (...delimiters) =>
  seq(
    choice(...delimiters),
    optional(choice("+", "-")),
    repeat("_"),
    DECIMAL_DIGIT,
    _num_und(DECIMAL_DIGIT)
  );

const _list_strict = (rule, sep) => seq(rule, repeat(seq(sep, rule)));
const _list = (rule, sep) => seq(rule, repeat(seq(sep, rule)), optional(sep));
const _list_vrd = (rule, rulevrd, sep) => choice( seq(_list_strict(rule, sep), optional(seq(sep, rulevrd))), rulevrd )

const _escapable = ($, rule) => repeat1(seq(rule, repeat($.escape_sequence)))

module.exports = grammar({
  name: "luau",
  extras: $ => [WHITESPACE, $.comment],

  externals: $ => [
    "true",
    "or",
    "not",
    "then",
    "break",
    "nil",
    "if",
    "else",
    "false",
    "return",
    "while",
    "in",
    "repeat",
    "elseif",
    "function",
    "end",
    "for",
    "until",
    "local",
    "do",
    "and",
    $._comment_start,
    $._comment_content,
    $._comment_end,
    $._string_start,
    $._string_content,
    $._string_end,
    $.interp_start,
    $.interp_content,
    $.interp_brace_open,
    $.interp_brace_close,
    $.interp_end,
    $.simple_escape,
    $._unicode_escape_sequence,
    $._dec_byte_escape_sequence,
    $._hex_byte_escape_sequence
  ],

  inline: $ => [$.prefix, $.fieldsep],

  supertypes: $ => [$.prefixexp, $.exp, $.statement, $.type],
  
  conflicts: $ => [
    [$._fntype_param, $.typelist             ],
    [$._fntype_param,              $.wraptype],
    [$._fntype_param, $.typelist,  $.wraptype],
    [$._typelist_vrd, $._typepack_vrd]],

  word: $ => $.name,
  rules: {
    chunk: $ => optional($._block),

    block: $ => $._block,
    _block: $ => choice(
      $.ret_stmt,
      seq(
        repeat1(seq(
          $.statement,
          optional(";"))
        ),
        optional($.ret_stmt)
      )
    ),

    ret_stmt: $ => seq(
      "return",
      optional(alias($._explist, $.explist)),
      optional(";")
    ),

    statement: $ => choice(
      $.var_stmt,
      $.assign_stmt,
      $.call_stmt,
      $.local_var_stmt,
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
      $.type_stmt,
      $.type_fn_stmt
    ),

    local_fn_stmt: $ => seq(
      optional($._attrlist),
      "local",
      "function",
      field("function_name", $.name),
      $._fn_body
    ),

    fn_stmt: $ => seq(
      optional($._attrlist),
      "function",
      choice(
        field("function_name", $.name),
        seq(
          field("table_name", $.name),
          $._tbl_fn_member
        )
      ),
      $._fn_body
    ),
    _tbl_fn_member: $ => choice(
      /*
      seq(
        ".",
        field("field_name", $.name)
      ),*/
      seq(
        // alias($._tbl_fn_field, $.key),
        alias($._key_named, $.key),
        optional($._tbl_fn_member)
      ),
      seq(
        ":",
        field("method_name", $.name)
      )
    ),
    /*
    _tbl_fn_field: $ => seq(
      ".",
      field("field_name", $.name)
    ),*/

    _attrlist: $ => repeat1($.attribute),
    
    for_in_stmt: $ => seq(
      "for",
      $.bindinglist,
      "in",
      alias($._explist, $.explist),
      "do",
      optional(field("body", $.block)),
      "end"
    ),

    for_range_stmt: $ => seq(
      "for",
       $.binding,
      "=",
       field("start", $.exp),
      ",",
       field("stop", $.exp),
      optional(seq(
        ",",
         field("step", $.exp))
      ),
      "do",
      optional(field("body", $.block)),
      "end"
    ),

    if_stmt: $ => seq(
      "if",
      field("condition", $.exp),
      "then",
      optional(field("consequence", $.block)),
      repeat(field("alternative", $.elseif_clause)),
      optional(field("alternative", $.else_clause)),
      "end"
    ),
    
    elseif_clause: $ => seq(
      "elseif",
      field("condition", $.exp),
      "then",
      optional(field("consequence", $.block))
    ),
    
    else_clause: $ => seq(
      "else",
      optional(field("body", $.block))
    ),

    repeat_stmt: $ => seq(
      "repeat",
      optional(field("body", $.block)),
      "until",
      field("condition", $.exp)
    ),

    while_stmt: $ => seq(
      "while",
      field("condition", $.exp),
      "do",
      optional(field("body", $.block)),
      "end"
    ),

    do_stmt: $ => seq(
      "do",
      optional(field("body", $.block)),
      "end"
    ),

    break_stmt: $ => "break",
    
    continue_stmt: () => "continue",

    local_var_stmt: $ => seq(
      "local",
      $.bindinglist,
      optional(seq(
        field("assign_symbol", "="),
        alias($._explist, $.explist)
      ))
    ),

    var_stmt: $ => seq(
      field("left", $.var),
      field("assign_symbol", $._assign),
      field("right", $.exp)
    ),
    
    assign_stmt: $ => seq(
      alias($._varlist, $.varlist),
      field("assign_symbol", "="),
      alias($._explist, $.explist)
    ),
    _varlist: $ => _list_strict($.var, ","),

    // the "export" and "type" keywords are not always parsed as such
    // whitespace must follow, and it must be part of a type statement
    // in an expression, "type" and "export" are not keywords
    type_stmt: $ => seq(
      optional(seq(
        "export",
        token.immediate(WHITESPACE)
      )),
      "type",
      token.immediate(WHITESPACE),
      $._type_assign
    ),

    type_fn_stmt: $ => seq(
      optional(seq(
        "export",
        token.immediate(WHITESPACE)
      )),
      "type",
      token.immediate(WHITESPACE),
      prec(1, "function"),
      field("function_name", $.name),
      $._fn_body
    ),

    _type_assign: $ => seq(
      field("left", $.name),
      optional(seq(
        "<",
        $._type_stmt_genlist,
        ">"
      )),
      field("assign_symbol", "="),
      field("right", $._outertype)
    ),
    
    genericdef: $ => seq(
      field("generic_type_name", $.generic),
      optional(seq(
        field("assign_symbol", "="),
        field("type_value", $._outertype)
      ))
    ),
    _type_stmt_genlist: $ => _list_vrd($.genericdef, $._type_stmt_packlist, ","),
    
    genpackdef: $ => seq(
      $.genpack,
      optional(seq(
        field("assign_symbol", "="),
        field("typepack_value", $.typepack)
      ))
    ),
    _type_stmt_packlist: $ => _list_strict($.genpackdef, ","),

    _assign: () => choice(
      "+=",
      "-=",
      "*=",
      "//=",
      "/=",
      "%=",
      "^=",
      "..="),

    exp: $ => choice(
      $.nil,
      $.boolean,
      $.number,
      $.string,
      $.string_interp,
      $.vararg,
      $.anon_fn,
      $.prefixexp,
      $.table,
      $.unexp,
      $.binexp,
      $.cast,
      $.ifexp
    ),

    _explist: $ => _list_strict($.exp, ","),

    binexp: $ => choice(
      ...[
        ["or",  PREC.OR],
        ["and", PREC.AND],
        ["==",  PREC.COMPARE],
        ["~=",  PREC.COMPARE],
        ["<",   PREC.COMPARE],
        [">",   PREC.COMPARE],
        ["<=",  PREC.COMPARE],
        [">=",  PREC.COMPARE],
        ["+",   PREC.ADDSUB],
        ["-",   PREC.ADDSUB],
        ["*",   PREC.MULDIV],
        ["//",  PREC.MULDIV],
        ["/",   PREC.MULDIV],
        ["%",   PREC.MULDIV]
      ].map(([op, pri]) =>
        prec.left(pri, seq(
          field("left", $.exp),
          field("operator", op),
          field("right", $.exp))
        )
      ),
      ...[
        ["..", PREC.CONCAT],
        ["^",  PREC.CARET],
      ].map(([op, pri]) =>
        prec.right(pri, seq(
          field("left", $.exp),
          field("operator", op),
          field("right", $.exp)
        ))
      )
    ),

    cast: $ => prec.left(PREC.CAST, seq(
      field("left", $.exp),
      field("operator", "::"),
      field("right", $._outertype)
    )),

    unexp: $ => choice(
      ...["not", "#", "-"].map(op =>
        prec.left(PREC.UNARY, seq(
          field("operator", op),
          field("operand", $.exp)
        ))
      )
    ),

    ifexp: $ => seq(
      "if",
      $.exp,
      "then",
      $.exp,
      repeat($._ifexp_elseif),
      "else",
      $.exp,
    ),
    _ifexp_elseif: $ => seq(
      "elseif",
      $.exp,
      "then",
      $.exp,
    ),

    table: $ => seq("{", optional($._fieldlist), "}"),
    _fieldlist: $ => seq(
      _list($.field, $.fieldsep),
      optional($.fieldsep)
    ),
    field: $ => seq(
      optional(seq(
        choice(
          field("field_name", $.name),
          seq(
            "[",
            field("field_indexer", $.exp),
            "]"
          )
        ),
        field("assign_symbol", "=")
      )),
      field("value", $.exp)
    ),
    fieldsep: () => choice(",", ";"),

    prefix: $ => choice(
      $.var, 
      $.call_stmt, 
      $.exp_wrap
    ),
    prefixexp: $ => $.prefix,
    _prefixexp: $ => prec(PREC.CALL, $.prefix),

    exp_wrap: $ => seq("(", $.exp, ")"),

    call_stmt: $ => seq(
      choice(
        field("invoked", $._prefixexp),
        $._tbl_method
      ),
      $.arglist),
    _tbl_method: $ => seq(
      field("method_table", $.prefixexp),
      $._method_name
    ),
    _method_name: $ => seq(
      ":",
      field("method_name", $.name)
    ),
    arglist: $ => choice(
      seq(
        "(",
        optional($._explist),
        ")"
      ),
      $.table,
      $.string
    ),

    binding: $ => seq(
      field("variable_name", $.name),
      optional(seq(
        ":",
        field("type_specifier", $._outertype)
      ))
    ),

    bindinglist: $ => _list_strict($.binding, ","),

    var: $ => choice(
      field("variable_name", $.name),
      $._tbl_seq
    ),
    _tbl_seq: $ => seq(
      choice(
        field("table_name", $.name),
        $._tbl_seq,
        $.call_stmt,
        $.exp_wrap),
      $.key
    ),
    key: $ => choice(
      $._key_named,
      seq(
        "[",
        field("field_indexer", $.exp),
        "]"
      )
    ),
    _key_named: $ => seq(
      ".",
      field("field_name", $.name)
    ),
    /*
    field_named: $ => seq(
      ".",
      $.name
    ),
    _field_indexed: $ => seq(
      "[",
      field("field", $.exp),
      "]"
    ),*/

    anon_fn: $ => seq("function", $._fn_body),
    _fn_body: $ => seq(
      optional(seq(
        "<",
        $._genlist,
        ">"
      )),
      "(",
      optional($.paramlist),
      ")",
      optional(seq(
        ":",
        field("return_type", choice(
          $.typepack,
          $._outertype
        ))
      )),
      optional(field("body", $.block)),
      "end"
    ),
    
    paramlist: $ => _list_vrd($.param, alias($._param_vararg, $.param), ","),
    param: $ => seq(
      field("parameter_name", $.name),
      optional(seq(
        ":",
        field("type_specifier", $._outertype)
      ))
    ),
    _param_vararg: $ => seq(
      $.vararg,
      optional(seq(
        ":",
        field("type_specifier", $._outertype)
      ))
    ),

    type: $ => choice(
      $.namedtype,
      $.wraptype,
      $.dyntype,
      $.fntype,
      $.tbtype,
      $.singleton,
      $.bintype,
      $.untype),
    
    // _outertype is type but it can be decorated with an initial "&" or "|"
    _outertype: $ => seq(
      optional(field("operator", choice("&", "|"))),
      $.type),
    
    singleton: $ => choice($.string, $.nil, $.boolean),
    
    namedtype: $ => prec.right(PREC.TYPEPARAM, seq(
      optional(seq(
        field("module_namespace", $.name),
        "."
      )),
      field("type_name", $.name),
      optional(seq("<", $._typeparamlist, ">"))
    )),

    typelist: $ => prec.dynamic(1,
      _list_vrd($._outertype, $._typelist_vrd, ",")
    ),
    _typelist_vrd: $ => prec.dynamic(1, $.variadic),

    wraptype: $ => prec.dynamic(1, seq("(", $._outertype, ")")),

    typeparam: $ => choice($._outertype, $.typepack),

    _typeparamlist: $ => _list_strict($.typeparam, ","),

    typepack: $ => choice($._typepack_wrap, $._typepack_vrd, $._typepack_gen),
    _typepack_wrap: $ => seq("(", optional($.typelist), ")"),
    _typepack_vrd: $ => $.variadic,
    _typepack_gen: $ => $.genpack,

    variadic: $ => seq("...", $.type),

    dyntype: $ => seq("typeof", "(", $.exp, ")"),

    fntype: $ => seq(
      optional($._fntype_gen),
      // alias($._fntype_wrap, $.paramlist),
      $.paramtypelist,
      field("return_type", choice(
        $.typepack,
        $.type
      ))
    ),
    _fntype_gen: $ => seq("<", $._genlist, ">"),
    paramtypelist: $ => prec.dynamic(0, seq(
      "(",
      optional($._fntype_paramlist),
      ")",
      "->"
    )),
    _fntype_param: $ => seq(
      optional(seq($.name, ":")),
      $._outertype
    ),
    _fntype_paramlist: $ => _list_vrd($._fntype_param, $._fntype_paramlist_vrd, ","),
    _fntype_paramlist_vrd: $ => choice(
      $._typepack_vrd,
      $._typepack_gen
    ),

    tbtype: $ => seq(
      "{",
      optional($._tbtype_content),
      "}"
    ),
    _tbtype_content: $ => choice(
      $.kvtypelist,
      $._array_type
    ),
    _array_type: $ => seq(
      optional($.readwrite),
      field("array_type_specifier", $._outertype)
    ),
    // _tbtype_array: $ => alias($._outertype, $.array),
    _tbtype_kv: $ => seq(
      optional($.readwrite),
      choice(
        $.indexertype,
        $.proptype
      ),
    ),
    kvtypelist: $ => _list($._tbtype_kv, $.fieldsep),
    indexertype: $ => seq(
      "[",
      field("indexer_type_specifier", $._outertype),
      "]",
      ":",
      field("value_type_specifier", $._outertype)
    ),
    proptype: $ => seq(
      field("field_name", $.name),
      ":",
      field("type_specifier", $._outertype)
    ),

    // bintype should not accept _outertype
    bintype: $ => choice(
      ...[
        ["&", PREC.TYPEAND], 
        ["|", PREC.TYPEOR]
      ].map(
        ([op, pri]) => prec.left(pri, seq(
          field("left", $.type),
          field("operator", op),
          field("right", $.type)))
        ),
      ),

    untype: $ => prec.left(PREC.TYPEOPT, seq(
      field("operand", $.type),
      field("operator", "?"))
    ),

    generic: $ => $.name,
    _genlist: $ => _list_vrd($.generic, $._genpack_list, ","),
    
    genpack: $ => seq(
      field("generic_typepack_name", $.name),
      "..."
    ),
    _genpack_list: $ => _list_strict($.genpack, ","),

    number: () => token(
      seq(choice(
        seq(_numeral(DECIMAL_DIGIT), optional(_exponent_part("e", "E"))),
        seq("0", repeat("_"), choice("x", "X"), _num_und(HEX_DIGIT)),
        seq("0", repeat("_"), choice("b", "B"), _num_und(BINARY_DIGIT))))),
    vararg: () => "...",

    string: $ => seq(
      $._string_start,
      repeat(choice(
        $._string_content,
        $._escape_sequence
      )),
      $._string_end
    ),
    
    string_interp: $ => seq(
      $.interp_start,
      repeat(choice(
        $.interp_content,
        $._escape_sequence,
        $.interp_exp
      )),
      $.interp_end
    ),
    
    interp_exp: $ => seq(
      $.interp_brace_open,
      $.exp,
      $.interp_brace_close
    ),

    _escape_sequence: $ => choice(
      $.simple_escape,
      $.unicode_escape,
      $.dec_byte_escape,
      $.hex_byte_escape
    ),
    unicode_escape: $ => seq(
      $._unicode_escape_sequence,
      token.immediate(prec(1, "{")),
      alias(token.immediate(UNICODE_ESCAPE_CODEPOINT_ARG), "codepoint"),
      token.immediate("}")
    ),
    dec_byte_escape: $ => seq(
      $._dec_byte_escape_sequence,
      token.immediate(DECIMAL_BYTE_ESCAPE_ARG)
    ),
    hex_byte_escape: $ => seq(
      $._hex_byte_escape_sequence,
      token.immediate(HEX_BYTE_ESCAPE_ARG)
    ),

    boolean: () => choice("true", "false"),
    
    nil: () => "nil",

    name: () => NAME,

    readwrite: () => choice(
      "read",
      "write"
    ),
    
    attribute: $ => choice(
      seq("@",
        field("attribute_name", token.immediate(ATTRNAME))),
      seq(
        "@[",
        $._parattrlist,
        "]"
      )
    ),
    _parattrlist: $ => _list_strict($.parattr, ","),

    parattr: $ => seq(
      field("attribute_name", $.name),
      $.parattr_param
    ),
    
    parattr_param: $ => choice(
      seq("(", optional($._litlist), ")"),
      $.littable,
      $.string),

    literal: $ => choice(
      $.nil,
      $.boolean,
      $.number,
      $.string,
      $.littable),
    _litlist: $ => _list_strict($.literal, ","),

    littable: $ => seq(
      "{",
      optional($._litfieldlist),
      "}"),
    _litfieldlist: $ => _list($.litfield, ","),
    
    litfield: $ => seq(optional(seq($.name, "=")), $.literal),

    comment: $ => seq($._comment_start, optional($._comment_content), $._comment_end),
  },

});
