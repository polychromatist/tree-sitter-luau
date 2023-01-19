#include <tree_sitter/parser.h>
#include <wctype.h>

enum TokenType
{
  COMMENT_START,
  COMMENT_CONTENT,
  COMMENT_END,
  STRING_START,
  STRING_CONTENT,
  STRING_END,
  INTERP_START,
  INTERP_CONTENT,
  INTERP_BRACE_OPEN,
  INTERP_BRACE_CLOSE,
  INTERP_END
};

static void consume(TSLexer *lexer)
{
  lexer->advance(lexer, false);
}
static void skip(TSLexer *lexer)
{
  lexer->advance(lexer, true);
}
static bool consume_if(TSLexer *lexer, const int32_t character)
{
  if (lexer->lookahead == character)
  {
    consume(lexer);
    return true;
  }

  return false;
}

const char SQ_STRING_DELIMITER = '\'';
const char DQ_STRING_DELIMITER = '"';
const char TICK_DELIMITER = '`';

enum StartedToken
{
  SHORT_COMMENT = 1,
  SHORT_SQ_STRING,
  SHORT_DQ_STRING,
  LONG_COMMENT,
  LONG_STRING,
  TICK_STRING,
  INTERP_EXPRESSION,
};

struct ScannerState
{
  enum StartedToken started;
  unsigned int depth;
  unsigned int idepth;
};

void *tree_sitter_luau_external_scanner_create()
{
  // this used to be allocated without instantiation
  struct ScannerState* state = malloc(sizeof(struct ScannerState));

  state->started = 0;
  state->depth = 0;
  state->idepth = 0;

  return state;
}

void tree_sitter_luau_external_scanner_destroy(void *payload)
{
  free(payload);
}

unsigned int tree_sitter_luau_external_scanner_serialize(void *payload, char *buffer)
{
  struct ScannerState *state = payload;
  buffer[0] = state->started;
  buffer[1] = state->depth;
  buffer[2] = state->idepth;
  return 3;
}

void tree_sitter_luau_external_scanner_deserialize(void *payload, const char *buffer, unsigned int length)
{
  if (length == 3)
  {
    struct ScannerState *state = payload;
    state->started = buffer[0];
    state->depth = buffer[1];
    state->idepth = buffer[2];
  }
}

static unsigned int get_depth(TSLexer *lexer)
{
  unsigned int current_depth = 0;
  while (consume_if(lexer, '='))
  {
    current_depth += 1;
  }

  return current_depth;
}

static bool scan_depth(TSLexer *lexer, unsigned int remaining_depth)
{
  while (remaining_depth > 0 && consume_if(lexer, '='))
  {
    remaining_depth -= 1;
  }

  return remaining_depth == 0;
}

static void escape_handler(TSLexer *lexer)
{
  
  if (consume_if(lexer, '\\') && !lexer->eof(lexer))
  {
    if (consume_if(lexer, 'z') && !lexer->eof(lexer))
    {
      while ((consume_if(lexer, ' ') || consume_if(lexer, '\t') || consume_if(lexer, '\n')) && !lexer->eof(lexer));
    }
  }
}

bool tree_sitter_luau_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols)
{
  struct ScannerState *state = payload;
  switch (state->started)
  {
    case SHORT_COMMENT:
    {
        // try to match the short comment's end (new line or eof)
        if (lexer->lookahead == '\n' || lexer->eof(lexer))
        {
          if (valid_symbols[COMMENT_END])
          {
            state->started = state->idepth > 0 ? INTERP_EXPRESSION : 0;

            lexer->result_symbol = COMMENT_END;
            return true;
          }
        }
        else if (valid_symbols[COMMENT_CONTENT])
        {
          // consume all characters till a short comment's end
          do
          {
            consume(lexer);
          } while (lexer->lookahead != '\n' && !lexer->eof(lexer));

          lexer->result_symbol = COMMENT_CONTENT;
          return true;
        }

        break;
    }
    case SHORT_SQ_STRING:
    case SHORT_DQ_STRING:
    {
        // define the short string's delimiter
        const char delimiter = state->started == SHORT_SQ_STRING ? SQ_STRING_DELIMITER : DQ_STRING_DELIMITER;

        // try to match the short string's end (" or ')
        if (consume_if(lexer, delimiter))
        {
          if (valid_symbols[STRING_END])
          {
            state->started = state->idepth > 0 ? INTERP_EXPRESSION : 0;

            lexer->result_symbol = STRING_END;
            return true;
          }
        }
        else if (lexer->lookahead != '\n' && !lexer->eof(lexer))
        {
          if (valid_symbols[STRING_CONTENT]) {
            // consume any character till a short string's end, new line or eof
            do
            {
              escape_handler(lexer);
              
              consume(lexer);
            } while (lexer->lookahead != delimiter && lexer->lookahead != '\n' && !lexer->eof(lexer));

            lexer->result_symbol = STRING_CONTENT;
            return true;
          }
        }

        break;
    }
    case TICK_STRING:
    {
        const char delimiter = TICK_DELIMITER;
        
        if (consume_if(lexer, delimiter))
        {
          if (valid_symbols[INTERP_END])
          {
            state->started = state->idepth > 0 ? INTERP_EXPRESSION : 0;
            
            lexer->result_symbol = INTERP_END;
            return true;
          }
        }
        else if (consume_if(lexer, '{')) {
          state->idepth++;
          state->started = INTERP_EXPRESSION;
          lexer->result_symbol = INTERP_BRACE_OPEN;
          return true;
        } 
        else if (lexer->lookahead != '\n' && !lexer->eof(lexer))
        {
          if (valid_symbols[INTERP_CONTENT])
          {
            do
            { 
              if (lexer->lookahead == '{') {
                break;
              }
              else
              {
                escape_handler(lexer);
              }
              
              consume(lexer);
            } while (lexer->lookahead != delimiter && lexer->lookahead != '\n' && !lexer->eof(lexer));
            
            lexer->result_symbol = INTERP_CONTENT;
            return true;           
          }
        }
        
        break;
    }
    case LONG_COMMENT:
    case LONG_STRING:
    {
        const bool is_inside_a_comment = state->started == LONG_COMMENT;

        bool some_characters_were_consumed = false;
        if (is_inside_a_comment ? valid_symbols[COMMENT_END] : valid_symbols[STRING_END])
        {
          // try to match the long comment's/string's end (]=*])
          if (consume_if(lexer, ']'))
          {
            if (scan_depth(lexer, state->depth) && consume_if(lexer, ']'))
            {
              state->started = state->idepth > 0 ? INTERP_EXPRESSION : 0;
              state->depth = 0;

              lexer->result_symbol = is_inside_a_comment ? COMMENT_END : STRING_END;
              return true;
            }

            some_characters_were_consumed = true;
          }
        }

        if (is_inside_a_comment ? valid_symbols[COMMENT_CONTENT] : valid_symbols[STRING_CONTENT])
        {
          if (!some_characters_were_consumed)
          {
            if (lexer->eof(lexer))
            {
              break;
            }

            // consume the next character as it can't start a long comment's/string's end ([)
            consume(lexer);
          }

          // consume any character till a long comment's/string's end or eof
          while (true)
          {
            lexer->mark_end(lexer);
            if (consume_if(lexer, ']'))
            {
              if (scan_depth(lexer, state->depth))
              {
                if (consume_if(lexer, ']'))
                {
                  break;
                }
              }
              else
              {
                continue;
              }
            }

            if (lexer->eof(lexer))
            {
              break;
            }

            consume(lexer);
        
          }

          lexer->result_symbol = is_inside_a_comment ? COMMENT_CONTENT : STRING_CONTENT;
          return true;
        }

        break;
    }
    case INTERP_EXPRESSION:
    {
        while (iswspace(lexer->lookahead))
        {
          skip(lexer);
        }
        if (valid_symbols[INTERP_BRACE_CLOSE]) {
          if (consume_if(lexer, '}')) {
            state->idepth--;
            state->started = TICK_STRING;
            lexer->result_symbol = INTERP_BRACE_CLOSE;
            return true;
          }
        }
    }
    default:
    {
        // ignore all whitespace
        while (iswspace(lexer->lookahead))
        {
          skip(lexer);
        }
        
        state->started = 0;

        if (valid_symbols[COMMENT_START])
        {
          // try to match a short comment's start (--)
          if (consume_if(lexer, '-'))
          {
            if (consume_if(lexer, '-'))
            {
              state->started = SHORT_COMMENT;

              // try to match a long comment's start (--[=*[)
              lexer->mark_end(lexer);
              if (consume_if(lexer, '['))
              {
                unsigned int possible_depth = get_depth(lexer);

                if (consume_if(lexer, '['))
                {
                  state->started = LONG_COMMENT;
                  state->depth = possible_depth;

                  lexer->mark_end(lexer);
                }
              }

              lexer->result_symbol = COMMENT_START;
              return true;
            }

            break;
          }
        }

        if (valid_symbols[STRING_START])
        {
          // try to match a short single-quoted string's start (")
          if (consume_if(lexer, SQ_STRING_DELIMITER))
          {
            state->started = SHORT_SQ_STRING;
          }
          // try to match a short double-quoted string's start (')
          else if (consume_if(lexer, DQ_STRING_DELIMITER))
          {
            state->started = SHORT_DQ_STRING;
          }
          // try to match a long string's start ([=*[)
          else if (consume_if(lexer, '['))
          {
            unsigned int possible_depth = get_depth(lexer);

            if (consume_if(lexer, '['))
            {
              state->started = LONG_STRING;
              state->depth = possible_depth;
            }
          }
      
          if (state->started)
          {
            lexer->result_symbol = STRING_START;
            return true;
          }
        }

        if (valid_symbols[INTERP_START])
        {
          if (consume_if(lexer, TICK_DELIMITER))
          {
            state->started = TICK_STRING;
            lexer->result_symbol = INTERP_START;
            return true;
          }
        }
        
        state->started = state->idepth > 0 ? INTERP_EXPRESSION : 0;
        
        break;
    }
  }

  return false;
}
