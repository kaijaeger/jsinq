/* 
 * JSINQ, JavaScript integrated query
 * Copyright (c) 2010 Kai Jäger. Some rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the license.txt file. 
 */
 
 if (typeof jsinq == 'undefined') {
	jsinq = {};
 }
 
(function() { 
	/**
	 * An exception that is thrown when the translation of a query expression
	 * has failed because it contained syntactic errors. A description of
	 * the error is given in the message field of the exception object. The
	 * position of the error can be obtained via the line, offset and 
	 * context fields of the exception.
	 * @constructor
	 * @param message The error message
	 * @param line The line at which the error occurred
	 * @param offset The character offset from the beginning og the line where
	 * 	the error occurred
	 * @param context A string that contains the part of the query expression
	 * 	where the error occurred
	 */
	function QueryTranslationException(message, line, offset, context) {
		this.message = message;
		this.line = line;
		this.offset = offset;
		this.context = context;
	}
	QueryTranslationException.prototype = new Error();
	QueryTranslationException.prototype.name = 'QueryTranslationException';
	 
	// A list of keywords that are reserved in either ECMAScript or LINQ. This
	// list is used to determine whether a string of characters may be used
	// as an identifier (see function isIdentifier).
	var reservedWords = ['break', 'else', 'new', 'var', 'case', 'finally', 
		'return', 'void', 'catch', 'for', 'switch', 'while', 'continue', 
		'function', 'this', 'with', 'default', 'if', 'throw', 'delete', 
		'in', 'try', 'do', 'instanceof', 'typeof', 'abstract', 'enum', 
		'int', 'short', 'boolean', 'export', 'interface', 'static', 'byte', 
		'extends', 'long', 'super', 'char', 'final', 'native', 'synchronized', 
		'class', 'float', 'package', 'throws', 'const', 'goto', 'private', 
		'transient', 'debugger', 'implements', 'protected', 'volatile', 
		'double', 'import', 'public', 'from', 'where', 'select', 'group',
		'into', 'orderby', 'join', 'let', 'on', 'equals', 'by', 'ascending',
		'descending'];
	
	// Characters which according to the ECMAScript language specification are
	// considered whitespace or line terminators.
	var whitespaceCharacters = ['\u000A', '\u000D', '\u2028', '\u2029', 
		'\u0009', '\u000B', '\u000C', '\u0020', '\u00A0', '\u1680', '\u180E',
		'\u2000', '\u2001', '\u2002', '\u2003', '\u2004', '\u2005', '\u2006', 
		'\u2007', '\u2008', '\u2009', '\u200A', '\u202F', '\u205F', '\u3000'];
	
	// A list of binary operators as specified by the ECMAScript language
	// specification.
	var binaryOperators = ['<', '>', '<=', '>=', '==', '!=', '===', '!==', 
		'+', '-', '*', '%', '<<', '>>', '>>>', '&', '|', '^', '&&', '||', 
		'=', '+=', '-=', '*=', '%=', '<<=', '>>=', '>>>=', '&=', '|=', '^=', 
		'/', '/='];
	
	// Length in characters of the longest binary operator 
	var MAX_BINARY_OPERATOR_CHARACTERS = 4;
	
	// Helper function that, given a linear array turns it into a look-up table
	// and returns a function that, given a value, returns true if that value
	// exists in the look-up table.
	function createLookUpFunction(array) {
		return (function() {
			var lookUpTable = {};
			for (var i = 0; i < array.length; i++) {
				lookUpTable[array[i]] = true;
			}
			
			return function(value) {
				return typeof lookUpTable[value] != 'undefined';
			}
		})();
	}
	
	// Returns true if the given character is one which may appear at the
	// beginning of an identifier. This specifically excludes numbers.
	// Todo: The ECMAScript language specification allows for identifiers to
	// start with any unicode letter or with a unicode escape sequence. This
	// function does not take this into account.
	function isIdentifierStart(value) {
		value = value.charAt(0);
		return value == '$' || value == '_' || 
			(value >= 'a' && value <= 'z') || (value >= 'A' && value <= 'Z');
	}
	
	// Returns true if the given character is one which may appear anywhere
	// in an identifier but not necessarily at the beginning. This specifically
	// includes numbers.
	// Todo: According to the ECMAScript language specification, identifier
	// parts can also be unicode combining marks, unicode digits, unicode
	// connector punctuation or unicode escape sequences. This function does
	// not return true for any of those.
	function isIdentifierPart(value) {
		return isIdentifierStart(value) || isDecimalDigit(value);
	}
	
	// Returns true if the given character is decimal digit.
	function isDecimalDigit(value) {
		return value >= '0' && value <= '9';
	}
	
	// Returns true if the given character is a hexadecimal digit.
	function isHexDigit(value) {
		return isDecimalDigit(value) || value >= 'a' && value <= 'f' ||
			value >= 'A' && value <= 'F';
	}
	
	// Returns true if the specified string is a reserved keyword
	var isReservedWord = createLookUpFunction(reservedWords);	
	
	// Returns true if the specified character is whitespace or a line 
	// terminator.
	var isWhitespaceCharacter = createLookUpFunction(whitespaceCharacters);
	
	// Returns ture if the specified string is a binary operator.
	var isBinaryOperator = createLookUpFunction(binaryOperators);
	
	// Constructor for a parse error object. An instance of ParseError is
	// returned by the parsers when they fail to consume input.
	// A parser error consists of an error message and a field 
	// "unparsedCharacters" which is used both to determine how much input
	// the parser consumed before failing and to find the line number and 
	// offset of where the error happened.
	function ParseError(message) {
		this.message = message;
		this.unparsedCharacters = -1;
	}
	
	// This function returns true if the parse error does not denote a 
	// complete failure, but a partial success (i.e. the parser consumed some
	// input before failing). The parameter "rest" is the input originally fed
	// to the parser.
	ParseError.prototype.isPartialSuccess = function(rest) {
		rest = rest.replace(/^\s+/g, '');
		return this.unparsedCharacters > -1 &&
			this.unparsedCharacters < rest.length;
	};
	
	// Function that receives a string containing a query expression and 
	// that returns either the parse tree of that expression or an error 
	// message.
	var parseQuery = (function() {
		var parsers = this;
		
		// A parser combinator for sequential composition which, given two
		// parsers, succeeds only if both parsers succeed. It invokes the 
		// second parser with the input left over by the first parser. 
		// This function is called in an unusual manner to achieve something
		// similar to operator overloading. It allows parsers to be combined
		// using dot notation, i.e. terminal('a').terminal('b') will invoke
		// terminal('a') and then terminal('b') with whatever is left of the
		// input string.
		// The label field is used to produce more meaningful error messages.
		function sequence(right, label) {	
			var _this = this;
			var func = null;
			if (typeof _this == 'function') {
				func = function(input) {
					var result1 = _this(input);
					if (result1 instanceof ParseError) {
						return result1;
					}

					var result2 = right(result1.rest);
					if (result2 instanceof ParseError) {
						result2.unparsedCharacters = result1.rest.length;
						return result2;
					}
					
					return {
						parsed: result1.parsed.concat(result2.parsed),
						rest: result2.rest
					};
				};
			} else {
				func = right; 
			}
			for (var method in parsers) {
				if (typeof parsers[method] == 'function') {
					func[method] = parsers[method];
				}
			}
			func.label = label;
			return func;
		}			
		
		// A parser that consumes a specific character sequence (a terminal).
		this.terminal = function(terminal) {
			return sequence.call(this, function(input) {
				var terminalLength = terminal.length;
				if (input.substring(0, terminalLength) == terminal) {
					return {
						parsed: [terminal],
						rest: input.substring(terminalLength)
					};
				} else {
					return new ParseError("'" + terminal + "' expected");
				}
			}, "'" + terminal + "'");
		};	
		
		// Receives any number of parsers and uses the first one that does not
		// fail. Only fails if all the parsers passed to it fail. This
		// corresponds to the following in EBNF notation:
		// p = (p1 | p2 | p3 | ...)
		this.oneOf = function() {
			var parsers = [];
			for (var i = 0; i < arguments.length; i++) {
				parsers.push(arguments[i]);
			}
			return sequence.call(this, function(input) {
				var result;				
				var minUnparsedChars = input.length;
				var bestParserError = null;
				for (var i = 0; i < parsers.length; i++) {
					result = parsers[i](input);
					if (!(result instanceof ParseError)) {
						return result;
					} else if (result.isPartialSuccess(input)) {
						minUnparsedChars = result.unparsedCharacters;
						bestParserError = result;						
					}
				}
				
				if (bestParserError) {
					return bestParserError;
				}
				
				var labels = [];
				for (var i = 0; i < parsers.length; i++) {
					labels.push(parsers[i].label);
				}
				var last = labels.pop();
				if (labels.length > 0) {
					last = 'or ' + last;
				}
				return new ParseError('Expecting ' + 
					labels.join(', ') + ' ' + last);
			});	
		};
		
		// Applies the specified parser zero or more times. This corresponds
		// to the following in EBNF notation:
		// p = {p1}
		this.zeroOrMore = function(parser) {
			return sequence.call(this, function(input) {
				var last = input;
				var accumulated = [];
				var result;				
				do {
					result = parser(last);
					if (!(result instanceof ParseError)) {
						last = result.rest;
						accumulated = accumulated.concat(result.parsed);
					}
				} while (!(result instanceof ParseError));
				
				if (result.isPartialSuccess(last)) {
					return result;
				}				
				
				return {
					parsed: accumulated,
					rest: last
				};
			});	
		};
		
		// Applies the specified parser at least once and for as long as it
		// continues to consume input. Corresponds to the following in EBNF:
		// p = p1 {p1}
		this.oneOrMore = function(parser) {
			return sequence.call(this, function(input) {
				var last = input;
				var accumulated = [];
				var result;
				do {
					result = parser(last);
					if (!(result instanceof ParseError)) {
						last = result.rest;
						accumulated = accumulated.concat(result.parsed);
					}
				} while (!(result instanceof ParseError));
				
				if (result.isPartialSuccess(last)) {
					return result;
				}
				
				if (accumulated.length > 0) {
					return {
						parsed: accumulated,
						rest: last
					};
				} else {					
					return new ParseError('Expecting one or more ' +
						input.label);
				}
			});
		};
		
		// Optionally applies the specified parser. Corresponds to the 
		// following in EBNF:
		// p = [p1]
		this.optional = function(parser) {
			return sequence.call(this, function(input) {
				var result = parser(input);
				if (!(result instanceof ParseError)) {
					return result;
				} else {
					if (result.isPartialSuccess(input)) {
						return result;
					}
					return {
						parsed: [],
						rest: input
					};
				}
			});
		};
		
		// Applies the specified parser but does not record its output. Fails
		// if the specified parser fails.
		this.skip = function(parser) {
			return sequence.call(this, function(input) {
				var result = parser(input);
				if (!(result instanceof ParseError)) {
					result.parsed = [];					
				}
				return result;
			});			
		};		
		
		// Wraps a parser into lambda. This is so that parsers defined using
		// sequential composition can themselves be used in other sequentially
		// composed parsers. Also used to give a label to a parser, which
		// allows for better error messages.
		this.asParser = function(label) {
			var func = this;
			return function() {
				return sequence.call(this, function(input) {
					return func(input);
				}, label);
			};
		};
		
		// Lazily invokes the specified parser. This is used to define
		// recursive which would otherwise enter an infinite recursive loop
		// upon their definition. Also used to refer to parsers which are
		// not yet defined.
		this.lazy = function(parser) {
			return sequence.call(this, function(input) {
				return parser()(input);
			});				
		};
		
		// Invokes the specified parser and groups the result.
		this.group = function(parser) {
			return sequence.call(this, function(input) {
				var result = parser(input);
				if (!(result instanceof ParseError)) {
					return {
						parsed: [result.parsed],
						rest: result.rest
					};
				} else {
					return result;
				}
			});		
		}
		
		// Takes the result of a parser and flattens it into a single value.
		this.flatten = function(parser) {
			return sequence.call(this, function(input) {
				var result = parser(input);
				if (!(result instanceof ParseError)) {
					return {
						parsed: [result.parsed.join(' ')],
						rest: result.rest
					};
				} else {
					return result;
				}
			});		
		}		
		
		// Consumes a single whitespace character.
		this.whitespace = function() {
			return sequence.call(this, function(input) {	
				if (input.length > 0 && 
					isWhitespaceCharacter(input.charAt(0))) {
					return {
						parsed: [input.substring(0, 1)],
						rest: input.substring(1)
					};
				} else {
					return new ParseError('Expecting whitespace');
				}
			}, 'whitespace');
		};		
		
		// Consumes any number of whitespace characters but fails if no 
		// whitespace is consumed. The whitespace is not added to the parse
		// tree.
		this.mandatoryWhitespace = 
			this.skip(
				this.oneOrMore(
					this.whitespace()
				)
			).asParser('whitespace');
		
		// Consumes any number of whitespace characters or none at all.
		// Does not fail if no whitespace is consumed. THe whitespace is not
		// added to the parse tree.
		this.optionalWhitespace =
			this.skip(
				this.zeroOrMore(
					this.whitespace()
				)
			).asParser('whitespace');
		
		// The following parsers are used to accept ECMAScript expressions.
		// Note that JSINQ does not actually do anything with the expressions
		// other than to put them into anonymous functions. Expressions are
		// parsed to reliably separate them from the query keywords. 
		// The grammar used below is adapted from the ECMAScript language
		// specification. However, it has been heavily simplified and is often
		// more permissive than the original grammar.
		// The expression parser may also be helpful for implementing nested
		// queries in the future.
		
		// Parses an identifier. Note that this does not comply with the
		// ECMAScript language specification in that it neither supports
		// unicode identifiers nor unicode escape sequences.
		this.identifier = function() {
			return sequence.call(this, function(input) {	
				if (input.length < 1) {
					return new ParseError('Unexpected end of file');
				}
				if (!isIdentifierStart(input.charAt(0))) {
					return new ParseError('Invalid character found, ' +
						'expecting identifier.');
				}				
				var index = 1;
				while (index < input.length && 
					isIdentifierPart(input.charAt(index))) {
					++index;
				}
				var identifier = input.substring(0, index);
				if (isReservedWord(identifier)) {
					return new ParseError('Reserved word \'' + identifier + 
						'\' cannot be used as identifier');
				}
				
				// Translate placeholders in the query expression into 
				// subscripting into the query parameters array.
				// Todo: This is probably not the best place for this.
				var regExp = new RegExp('^\\$[0-9]+$', 'g');
				if (regExp.test(identifier)) {
					identifier = '_$qp[' + identifier.substring(1) + ']';
				}
				
				return {
					parsed: [identifier],
					rest: input.substring(index)
				};
			}, 'identifier');
		};			
		
		// Parses a binary operator (see operator table at the beginning of 
		// this file). Only binary operators composed of special characters
		// are consumed (this excludes 'in' and 'instanceof').
		this.binaryOperator = function() {
			return sequence.call(this, function(input) {
				for (var i = MAX_BINARY_OPERATOR_CHARACTERS; i >= 1; i--) {
					var operator = input.substring(0, i);
					if (isBinaryOperator(operator)) {
						return {
							parsed: operator,
							rest: input.substring(i)							
						};
					}
				}
				return new ParseError('Expecting binary operator');
			}, 'binary operator');
		};
		
		// Parses a string literal, delimited by either single- or double-
		// quotation marks.
		this.stringLiteral = function() {
			return sequence.call(this, function(input) {
				if (input.length < 2 || input.charAt(0) != '"' && 
					input.charAt(0) != "'") {
					return new ParseError('Malformed string literal');
				}
				var delimiter = input.charAt(0);
				var last = delimiter;
				var current;	
				for (var i = 1; i < input.length; i++) {
					current = input.charAt(i);
					if (current == delimiter && last != '\\') {
						++i;
						return {
							parsed: [input.substring(0, i)],
							rest: input.substring(i)
						};
					}
					last = current;
				}
				return new ParseError('Unterminated string literal');
			}, 'string literal');
		};
		
		// Parses a number literal, i.e. a decimal number, a hex number or
		// a floating point number in either decimal or exponential notation.
		this.numericLiteral = function() {
			return sequence.call(this, function(input) {
				if (input.length < 1) {
					return new ParseError('Unexpected end of file');
				}
				
				var digitFunction = isDecimalDigit;
				var wantDecimalSeparator = true;
				var wantExponent = false;	
				var wantSign = false;
				var startIndex = 0;
				
				if (input.substring(0, 2).toLowerCase() == '0x') {
					digitFunction = isHexDigit;
					wantDecimalSeparator = false;
					startIndex = 2;
				} else if (input.charAt(0) == '.') {
					wantDecimalSeparator = false;
					wantExponent = true;
					startIndex = 1;
				}
				
				var index = startIndex;
				for (var i = startIndex; i < input.length; i++) {
					var current = input.charAt(i);
					if (wantDecimalSeparator && current == '.') {
						wantDecimalSeparator = false;
						wantExponent = true;
					} else if (wantExponent && (current == 'e' ||
						current == 'E')) {
						wantExponent = false;
						wantSign = true;
					} else if (wantSign && (current == '+' || 
						current == '-')) {
						wantSign = false;
					} else if (digitFunction(current)) {
						wantSign = false;
					} else {
						break;
					}
					++index;
				}
				if (index == startIndex) {
					return new ParseError('Invalid number');
				}
				return {
					parsed: [input.substring(0, index)],
					rest: input.substring(index)
				};
			}, 'number literal');
		};
		
		// Parses the body of a function expression (i.e. an inline function
		// definition). The actual contents of the function body are ignored.
		// (What this parser really does is to count curly braces).
		this.functionExpressionBody = function() {
			return sequence.call(this, function(input) {
				if (input.charAt(0) != '{') {
					return new ParseError("'{' expected");
				}
				var last = '';
				var inString = false;
				var stringTerminator = '';
				var curlyOpenCount = 1;
				for (var i = 1; i < input.length; i++) {
					var current = input.charAt(i);
					if (!inString) {
						if (current == '{') {
							++curlyOpenCount;
						} else if (current == '}') {
							--curlyOpenCount;
						} else if (current == '"' || current == "'") {
							inString = true;
							stringTerminator = current;
						}
					} else {
						if (current == stringTerminator && last != '\\') {
							inString = false;
						}
					}
					last = current;
					if (curlyOpenCount == 0) {
						++i;
						return {
							parsed: [input.substring(0, i)],
							rest: input.substring(i)
						};
					}
				}
				return new ParseError('Unexpected end of file');
			}, 'function expression');
		};
		
		// The following productions are adapted from the ECMAScript grammar.
		
		this.arrayLiteral =
			this.terminal('[').
			optionalWhitespace().
			optional(			
				this.optional(
					this.lazy(function() {
						return parsers.secondaryExpression();
					})
				).				
				zeroOrMore(
					this.optionalWhitespace().
					terminal(',').
					optionalWhitespace().
					optional(
						this.lazy(function() {
							return parsers.secondaryExpression();
						})
					)
				).
				optionalWhitespace()
			).
			optionalWhitespace().
			terminal(']').
			asParser('array literal');
		
		this.propertyName = 
			this.oneOf(
				this.identifier(),
				this.stringLiteral(),
				this.numericLiteral()
			).asParser('property name');
		
		this.propertyNameAndValue = 
			this.propertyName().
			optionalWhitespace().
			terminal(':').
			optionalWhitespace().
			lazy(function() {
				return parsers.secondaryExpression();
			}).
			asParser('property name and value');	
		
		this.objectLiteral =
			this.terminal('{').
			optionalWhitespace().
			optional(
				this.propertyNameAndValue().
				zeroOrMore(
					this.optionalWhitespace().
					terminal(',').
					optionalWhitespace().
					propertyNameAndValue()
				)
			).
			optionalWhitespace().
			terminal('}').
			asParser('object literal');
		
		this.literal =
			this.oneOf(
				this.terminal('null'),
				this.terminal('true'),
				this.terminal('false'),
				this.terminal('Infinity'),
				this.numericLiteral(),
				this.stringLiteral(),
				this.arrayLiteral(),
				this.objectLiteral()
			).asParser('literal');
		
		this.primaryExpression = 
			this.oneOf(
				this.terminal('this'),
				this.identifier(),
				this.literal(),
				this.terminal('(').
				optionalWhitespace().
				lazy(function() {
					return parsers.expression()
				}).
				optionalWhitespace().
				terminal(')')
			).asParser('primary expression');
		
		this.parameters = 
			this.terminal('(').
			optionalWhitespace().
			optional(
				this.lazy(function() {
					return parsers.secondaryExpression();
				}).
				zeroOrMore(				
					this.optionalWhitespace().
					terminal(',').
					optionalWhitespace().
					lazy(function() {
						return parsers.secondaryExpression();
					})
				)
			).
			optionalWhitespace().
			terminal(')').
			asParser('arguments');
				
		this.functionExpression =
			this.terminal('function').
			optional(
				this.mandatoryWhitespace().				
				identifier()
			).
			optionalWhitespace().
			terminal('(').
			optionalWhitespace().
			optional(
				this.identifier().
				zeroOrMore(
					this.optionalWhitespace().
					terminal(',').
					optionalWhitespace().
					identifier()
				)
			).
			optionalWhitespace().
			terminal(')').			
			optionalWhitespace().
			functionExpressionBody().
			asParser('function expression');		
		
		this.leftHandSideExpression =
			this.zeroOrMore(
				this.terminal('new').
				mandatoryWhitespace()
			).
			oneOf(
				this.primaryExpression(),
				this.functionExpression()
			).
			zeroOrMore(
				this.oneOf(
					this.optionalWhitespace().				
					parameters(),
					this.optionalWhitespace().				
					terminal('[').				
					optionalWhitespace().
					lazy(function() {
						return parsers.secondaryExpression();
					}).
					optionalWhitespace().
					terminal(']'),
					this.optionalWhitespace().
					terminal('.').
					optionalWhitespace().
					identifier()
				)
			).asParser('left-hand-side expression');
		
		this.unaryExpression =
			this.zeroOrMore(
				this.oneOf(
					this.terminal('delete').
					mandatoryWhitespace(),
					this.terminal('void').
					mandatoryWhitespace(),
					this.terminal('typeof').
					mandatoryWhitespace(),
					this.terminal('++'),
					this.terminal('--'),
					this.terminal('+'),
					this.terminal('-'),
					this.terminal('~'),
					this.terminal('!')
				).
				optionalWhitespace()
			).
			leftHandSideExpression().
			zeroOrMore(
				this.optionalWhitespace().
				oneOf(
					this.terminal('++'),
					this.terminal('--')
				)
			).
			asParser('unary expression');
		
		this.secondaryExpression =
			this.flatten(
				this.unaryExpression().
				zeroOrMore(
					this.optionalWhitespace().
					oneOf(
						this.binaryOperator(),
						this.terminal('in').
						mandatoryWhitespace(),
						this.terminal('instanceof').
						mandatoryWhitespace()
					).
					optionalWhitespace().
					unaryExpression()
				)
			).asParser('expression');
		
		this.expression = 
			this.flatten(
				this.secondaryExpression().
				zeroOrMore(
					this.optionalWhitespace().
					terminal(',').
					optionalWhitespace().
					secondaryExpression()
				)
			).asParser('expression');
		
		// The following is an almost direct translation of the LINQ grammar 
		// given in the official C# Language Specification into combinatory 
		// parsers.
		
		this.fromClause = 
			this.terminal('from').
			group(
				this.mandatoryWhitespace().
				identifier().
				mandatoryWhitespace().
				skip(
					this.terminal('in')
				).
				mandatoryWhitespace().
				expression()
			).asParser('from clause');
		
		this.letClause = 			
			this.terminal('let').
			group(
				this.mandatoryWhitespace().
				identifier().
				optionalWhitespace().
				skip(
					this.terminal('=')
				).
				optionalWhitespace().
				expression()
			).asParser('let clause');
		
		this.whereClause =
			this.terminal('where').
			group(
				this.mandatoryWhitespace().
				expression()				
			).asParser('where clause');
		
		this.joinClause = 
			this.terminal('join').
			group(
				this.mandatoryWhitespace().
				identifier().
				mandatoryWhitespace().
				skip(
					this.terminal('in')
				).
				mandatoryWhitespace().
				expression().
				mandatoryWhitespace().
				skip(
					this.terminal('on')
				).
				mandatoryWhitespace().
				expression().
				mandatoryWhitespace().
				skip(
					this.terminal('equals')
				).
				mandatoryWhitespace().
				expression()
			).asParser('join clause');	
		
		this.joinIntoClause = 
			this.terminal('join').
			group(
				this.mandatoryWhitespace().
				identifier().
				mandatoryWhitespace().
				skip(
					this.terminal('in')
				).
				mandatoryWhitespace().
				expression().
				mandatoryWhitespace().
				skip(
					this.terminal('on')
				).
				mandatoryWhitespace().
				expression().
				mandatoryWhitespace().
				skip(
					this.terminal('equals')
				).
				mandatoryWhitespace().
				expression().
				mandatoryWhitespace().
				skip(
					this.terminal('into')
				).
				mandatoryWhitespace().
				identifier()
			).asParser('join into clause');			
		
		this.orderingDirection = 
			this.oneOf(
				this.skip(				
					this.terminal('ascending')
				), 
				this.terminal('descending')
			).asParser('ordering direction');
		
		this.ordering = 
			this.group(
				this.secondaryExpression().				
				optional(
					this.mandatoryWhitespace().
					orderingDirection()
				)
			).asParser('ordering');
		
		this.orderings =
			this.ordering().
			zeroOrMore(
				this.optionalWhitespace().
				skip(
					this.terminal(',')
				).
				optionalWhitespace().
				ordering()
			).asParser('orderings');
		
		this.orderByClause =
			this.terminal('orderby').
			group(
				this.mandatoryWhitespace().
				orderings()
			).asParser('orderby clause');

		this.selectClause =
			this.terminal('select').
			group(
				this.mandatoryWhitespace().
				expression()
			).asParser('select clause');
		
		this.groupClause = 
			this.terminal('group').
			group(
				this.mandatoryWhitespace().
				expression().
				mandatoryWhitespace().
				skip(
					this.terminal('by')
				).
				mandatoryWhitespace().
				expression()
			).asParser('group by clause');
		
		this.selectOrGroupClause =
			this.group(
				this.oneOf(
					this.selectClause(),
					this.groupClause()
				)
			).asParser('select or group by clause');
		
		this.queryBodyClause =
			this.group(
				this.oneOf(
					this.fromClause(),
					this.letClause(),
					this.whereClause(),
					this.joinIntoClause(),
					this.joinClause(),
					this.orderByClause()
				)
			).asParser('query body');
		
		this.queryBodyClauses = 
			this.queryBodyClause().
			zeroOrMore(
				this.mandatoryWhitespace().
				queryBodyClause()
			).asParser('query body');
		
		this.queryBody = 
			this.optional(
				this.queryBodyClauses().
				mandatoryWhitespace()
			).			
			selectOrGroupClause().
			optional(
				this.group(
					this.mandatoryWhitespace().
					lazy(function() { 
						return parsers.queryContinuation(); 
					})
				)
			).asParser('query body');
		
		this.queryContinuation =
			this.terminal('into').
			group(
				this.mandatoryWhitespace().
				identifier().
				mandatoryWhitespace().
				lazy(function() { 
					return parsers.queryBody(); 
				})
			).asParser('into clause');	
		
		this.queryExpression =
			this.optionalWhitespace().			
			group(
				this.fromClause()
			).
			mandatoryWhitespace().
			queryBody();
		
		return this.queryExpression;
	}).call({});
	
	// Function that receives a query expression tree (as produced by the
	// parseQuery function) and translates it into JavaScript code.
	var compileQuery = (function() {
		// Values returned by a visitor function that tell the tree-
		// traverser if and how to continue. 			
		// Parent = continue with parent node, Continue = continue with next
		// node, Abort = abort the traversal
		var TRAVERSE_PARENT = 1;
		var TRAVERSE_CONTINUE = 2;
		var TRAVERSE_ABORT = 3;
		
		// Prefix for transparent identifiers injected during query 
		// transformation
		var TRANSPARENT_IDENTIFIER_PREFIX = '_$ti';
		
		// Sequencing-mechanism for transparent identifiers
		var lastTransparentIdentifier = 0;
		
		// Keeps track of transparent identifiers and which other transparent
		// identifiers they capture.
		var transparentIdentifiers = {};
		
		// Returns true if the specified identifier is "transparent" (i.e.
		// generated by the compiler)
		function isTransparentIdentifier(identifier) {
			return identifier.substring(0, 
				TRANSPARENT_IDENTIFIER_PREFIX.length) == 
				TRANSPARENT_IDENTIFIER_PREFIX;
		}
		
		// Retrieves a transparent identifier for an object that captures
		// multiple range variables. The names of the captured range variables
		// are passed to this function.
		function getTransparentIdentifierFor() {
			lastTransparentIdentifier++;
			var identifier = TRANSPARENT_IDENTIFIER_PREFIX + 
				lastTransparentIdentifier;				
			var transparentMembers = [];
			for (var i = 0; i < arguments.length; i++) {
				if (isTransparentIdentifier(arguments[i])) {
					transparentMembers.push(arguments[i]);
				}
			}			
			transparentIdentifiers[identifier] = transparentMembers;			
			return identifier;
		}
		
		// Emits the JavaScript source code for a lambda expression with the
		// specified parameters and body.
		function emitLambda(parameters, body) {
			var code = ['function(', parameters.join(', '), ') {'];
			
			var withOpen = [];
			var withClose = [];
			var resolveStack = [];
			
			// If any of the parameters of the lambda expression is a 
			// transparent identifier, put a with statement around the
			// body of the lambda so that its members are in scope. Do this
			// "recursively" if necessary.
			for (var i = 0; i < parameters.length; i++) {
				if (isTransparentIdentifier(parameters[i])) {
					resolveStack.push(parameters[i]);
					do {
						var topOfStack = resolveStack.pop();
						withOpen.push('with (', topOfStack, ') {');
						withClose.push('}');
						var child = transparentIdentifiers[topOfStack];
						if (transparentIdentifiers[topOfStack].length > 0) {
							resolveStack.push(child[0]);
						} else {
							break;
						}
					} while (true);			
				}
			}
			
			code = code.concat(withOpen);
			code.push(body);
			code = code.concat(withClose);			
			code.push('}');
			return code.join('');
		}
		
		// The query compiler works by repeatedly applying transformations
		// to the expression tree. Each transformation is associated with a
		// specific pattern of query clauses and it is applied for as long as
		// that specific pattern occurs in the expression tree. Additionally,
		// transformations are grouped into sections and each section is again
		// applied repeatedly until all patterns it recognizes have either been
		// compiled to JavaScript code or transformed into something else.
		// The transformations are kept in the following array. They are 
		// applied in the order in which they are specified. 
		// Note that this corresponds directly to the point "Query expression
		// translation" in the C# Language Specification.
		
		var transformations = [
			// Select and groupby clauses with continuations
			[
				{
					pattern: ['*', 'into', null],
					transformer: function(root, match) {
						var intoClause = root[match[1]];
						
						root[match[1]] = intoClause[1][1];
						for (var j = 2; j < intoClause[1].length; j++) {
							root.splice(match[1] + (j - 1), 0, 
								intoClause[1][j]);
						}	
						root.unshift([
							'from',
							[
								intoClause[1][0],
								root.splice(0, match[0])
							]
						]);
						return true;
					}
				}
			],
			// Degenerate query expressions
			[
				{
					pattern: ['from', 'select', null],
					transformer: function(root, match) {
						var fromClause = root[match[0]][1];
						var selectClause = root[match[1]][1];
						if (match[1] - match[0] > 1) {
							return false;
						}
						if (fromClause[0] == selectClause[0]) {
							root.splice(match[0], 2, [
								'compiled',
								[
									'(', fromClause[1], ').select(',
									emitLambda([fromClause[0]], 'return ' + 
										fromClause[0] + ';'), ')'
								]
							]);
							return true;
						}
						return false;
					}
				}
			],
			// From, let, where, join and orderby clauses
			[
				{
					pattern: ['from', 'from', 'select', null],
					transformer: function(root, match) {
						var firstFromClause = root[match[0]][1];
						var secondFromClause = root[match[1]][1];
						var selectClause = root[match[2]][1];

						if (match[1] - match[0] > 1) {
							return false;
						}
						
						root.splice(match[0], 2, [
							'compiled',
							[
								'(', firstFromClause[1], ')'
							]
						]);
					
						root.splice(match[1], 1, [
							'compiled',
							[
								'.selectMany(',
								emitLambda([firstFromClause[0]], 'return ' +
									secondFromClause[1] + ';'), ', ',
								emitLambda([firstFromClause[0], 
									secondFromClause[0]], 'return ' + 
									selectClause[0] + ';'), ')'
							]
						]);
						return true;
					}
				},
				{
					pattern: ['from', 'from'],
					transformer: function(root, match) {
						var firstFromClause = root[match[0]][1];
						var secondFromClause = root[match[1]][1];
						root.splice(match[0], 1, [
							'from',
							[
								getTransparentIdentifierFor(firstFromClause[0], 
									secondFromClause[0]),
								firstFromClause[1]
							]
						]);
						root.splice(match[1], 1, [
							'compiled',
							[
								'.selectMany(', emitLambda(
									[firstFromClause[0]], 'return ' + 
									secondFromClause[1] + ';'), 
								', ', emitLambda([firstFromClause[0], 
									secondFromClause[0]], 'return { \'' + 
									firstFromClause[0] + '\':' +
									firstFromClause[0] + ', \'' + 
									secondFromClause[0] + '\':' + 
									secondFromClause[0] + '};'), ')'
							]
						]);
						return true;
					}
				},
				{
					pattern: ['from', 'let'],
					transformer: function(root, match) {
						var fromClause = root[match[0]][1];
						var letClause = root[match[1]][1];
						root.splice(match[0], 1, [
							'from',
							[
								getTransparentIdentifierFor(fromClause[0],
									letClause[0]),
								fromClause[1]
							]
						]);
						root.splice(match[1], 1, [
							'compiled',
							[
								'.select(', emitLambda([fromClause[0]], 
									'return {\'' + fromClause[0] + '\': ' + 
									fromClause[0] + ', \'' + letClause[0] +
									'\': ' + letClause[1] + '};'), ')'
							]
						]);
						return true;
					}
				},
				{
					pattern: ['from', 'where'],
					transformer: function(root, match) {
						var fromClause = root[match[0]][1];
						var whereClause = root[match[1]][1];
						root.splice(match[1], 1, [
							'compiled',
							[
								'.where(', emitLambda([fromClause[0]], 
									'return ' + whereClause[0] + ';'), ')'
							]
						]);
						return true;
					}				
				},
				{
					pattern: ['from', 'join', 'select', null],
					transformer: function(root, match) {
						var fromClause = root[match[0]][1];
						var joinClause = root[match[1]][1];
						var selectClause = root[match[2]][1];												
						
						if (match[2] - match[1] > 1) {
							return false;
						}						
						
						// Exclude join-intos
						if (joinClause.length > 4) {
							return false;
						}
						root.splice(match[0], 1, [
							'compiled',
							[
								'(', fromClause[1], ')'
							]
						]);					
						root.splice(match[1], 2, [
							'compiled',
							[
								'.join(', joinClause[1], ', ', 
								emitLambda([fromClause[0]], 'return ' + 
									joinClause[2] + ';'), ', ', 
								emitLambda([joinClause[0]], 'return ' + 
									joinClause[3] + ';'), ', ', 
								emitLambda([fromClause[0], joinClause[0]], 
									'return ' + selectClause[0] + ';'), ')'
							]
						]);
						return true;
					}
				},
				{
					pattern: ['from', 'join'],
					transformer: function(root, match) {
						var fromClause = root[match[0]][1];
						var joinClause = root[match[1]][1];
						// Exclude join-intos
						if (joinClause.length > 4) {
							return false;
						}
						root.splice(match[0], 1, [
							'from',
							[
								getTransparentIdentifierFor(fromClause[0],
									joinClause[0]),
								fromClause[1]
							]
						]);
						root.splice(match[1], 1, [
							'compiled',
							[
								'.join(', joinClause[1], 
								', ', emitLambda([fromClause[0]], 'return ' +
									joinClause[2] + ';'), ', ', 
								emitLambda([joinClause[0]], 'return ' + 
									joinClause[3] + ';'), ', ',
								emitLambda([fromClause[0], joinClause[0]], 
									'return {\'' + fromClause[0] + '\': ' +
									fromClause[0] + ', \'' + joinClause[0] + 
									'\': ' + joinClause[0] + '};'), ')'
							]
						]);
						return true;
					}
				},
				{
					pattern: ['from', 'join', 'select', null],
					transformer: function(root, match) {
						var fromClause = root[match[0]][1];
						var joinClause = root[match[1]][1];
						var selectClause = root[match[2]][1];
						
						if (match[2] - match[1] > 1) {
							return false;
						}
						if (joinClause.length < 5) {
							return false;
						}						
						
						root.splice(match[0], 1, [
							'compiled',
							[
								'(', fromClause[1], ')'
							]
						]);
						root.splice(match[1], 2, [
							'compiled',
							[
								'.groupJoin(', joinClause[1], ', ', 
								emitLambda([fromClause[0]], 'return ' + 
									joinClause[2] + ';'), ', ', 
								emitLambda([joinClause[0]], 'return ' + 
									joinClause[3] + ';'), ', ',
								emitLambda([fromClause[0], joinClause[4]], 
									'return ' + selectClause[0] + ';'), ')'
							]
						]);
						return true;
					}
				},
				{
					pattern: ['from', 'join'],
					transformer: function(root, match) {
						var fromClause = root[match[0]][1];
						var joinClause = root[match[1]][1];
						
						if (joinClause.length < 5) {
							return false;
						}												
						
						root.splice(match[0], 1, [
							'from',
							[
								getTransparentIdentifierFor(fromClause[0],
									joinClause[4]),
								fromClause[1]
							]
						]);
						root.splice(match[1], 1, [
							'compiled',
							[
								'.groupJoin(', joinClause[1], ', ', 
								emitLambda([fromClause[0]], 'return ' +
									joinClause[2] + ';'), ', ',
								emitLambda([joinClause[0]], 'return ' + 
									joinClause[3] + ';'), ', ',
								emitLambda([fromClause[0], joinClause[4]], 
									'return {\'' + fromClause[0] + '\': ' +
									fromClause[0] + ', \'' + joinClause[4] + 
									'\': ' + joinClause[4] + '};'), ')'
							]
						]);
						return true;
					}
				},
				{
					pattern: ['from', 'orderby'],
					transformer: function(root, match) {
						var fromClause = root[match[0]][1];
						var orderbyClause = root[match[1]][1];
						var orderingPostfix = '';
						if (orderbyClause[0].length > 1) {
							orderingPostfix = 'Descending';
						}
						
						var code = ['.orderBy', orderingPostfix, '(', 
							emitLambda([fromClause[0]], 'return ' + 
								orderbyClause[0][0] + ';'), ')'];
						
						for (var i = 1; i < orderbyClause.length; i++) {
							orderingPostfix = '';
							if (orderbyClause[i].length > 1) {
								orderingPostfix = 'Descending';
							}
							code.push('.thenBy', orderingPostfix, '(',
								emitLambda([fromClause[0]], 'return ' +
									orderbyClause[i][0] + ';'), ')');
						}
						
						root.splice(match[1], 1, [
							'compiled',
							code
						]);
						return true;
					}				
				}
			],
			// Select clauses
			[
				{
					pattern: ['from', 'select', null],
					transformer: function(root, match) {
						var fromClause = root[match[0]][1];
						var selectClause = root[match[1]][1];					
						root.splice(match[0], 1, [
							'compiled',
							[
								'(', fromClause[1], ')'
							]
						]);
						root.splice(match[1], 1, [
							'compiled',
							[
								'.select(', emitLambda([fromClause[0]], 
									'return ' + selectClause[0] + ';'), ')'
							]
						]);
						return true;
					}				
				}
			],
			// Groupby clauses
			[
				{
					pattern: ['from', 'group', null],
					transformer: function(root, match) {
						var fromClause = root[match[0]][1];
						var groupClause = root[match[1]][1];					
						root.splice(match[0], 1, [
							'compiled',
							[
								'(', fromClause[1], ')'
							]
						]);
						var code = ['.groupBy(', emitLambda([fromClause[0]], 
							'return ' + groupClause[1] + ';')];
						
						if (fromClause[0] != groupClause[0]) {
							code.push(', ', emitLambda([fromClause[0]], 
								'return ' + groupClause[0] + ';'));
						}
						code.push(')');
								
						root.splice(match[1], 1, [
							'compiled',
							code
						]);					
						return true;
					}				
				}	
			]
		];

		// Traverses the expression tree in post-order and invokes the 
		// specified visitor function for each node in the tree.
		function postOrderTraverse(root, visitor) {
			var i;
			for (i = 0; i < root.length; i++) {
				if (root[i][0] == 'from' && root[i][1][1] instanceof Array) {
					postOrderTraverse(root[i][1][1], visitor);
				} else if (root[i][0] == 'compiled') {					
					for (var j = 0; j < root[i][1].length; j++) {
						if (root[i][1][j] instanceof Array) {
							postOrderTraverse(root[i][1][j], visitor);
						}
					}
				}
				var result = visitor(root, i, root[i]);
				if (result == TRAVERSE_PARENT) {
					break;
				} else if (result == TRAVERSE_ABORT) {
					return;
				}
			}
			visitor(root, i, null);
		}
		
		// Applies the transformations specified above.
		function applyTransformations(expressionTree) {			
			var transformationBlockCount = transformations.length;
			var transformationCount;
			var transformation;
			var pattern;
			var patternIndex;
			var match;
			var transformationApplied;
			var blockApplied;
			
			// This function performs the pattern matching used to determine
			// which transformation to apply.
			function visitor(root, index, node) {
				var nodeType = null;
				if (node != null) {
					nodeType = node[0];					
				}
					
				// Ignore node that are already compiled
				if (nodeType == 'compiled') {
					return TRAVERSE_CONTINUE
				}				
				
				var expectedNodeType = pattern[patternIndex];
				var nextExpectedNodeType = 
					pattern[patternIndex + 1];				
			
				if (nodeType == expectedNodeType) {					
					match.push(index);					
					++patternIndex;
				} else if (expectedNodeType == '*') {
					if (nodeType == nextExpectedNodeType &&
						typeof match[patternIndex] != 'undefined') {
						patternIndex += 2;
						match.push(index);
					} else {
						if (typeof match[patternIndex] == 'undefined') {
							match[patternIndex] = 0;
						}	
						match[patternIndex]++;
					}
				} else {
					if (node == null) {
						patternIndex = 0;
						match = [];
					}
					return TRAVERSE_PARENT;
				}
				
				if (node == null) {					
					var returnCode = TRAVERSE_PARENT;
					if (patternIndex >= pattern.length) {
						var applied = transformation.transformer(root, match);
						if (applied) {
							returnCode = TRAVERSE_ABORT;
							transformationApplied = true;
							blockApplied = true;
						}
					}
					patternIndex = 0;
					match = [];
					return returnCode;
				}
				
				return TRAVERSE_CONTINUE;
			}
			
			for (var i = 0; i < transformationBlockCount; i++) {
				transformationBlock = transformations[i];
				transformationCount = transformationBlock.length;
				do {
					blockApplied = false;
					for (var j = 0; j < transformationCount; j++) {
						transformation = transformationBlock[j];
						do {				
							pattern = transformation.pattern;
							patternIndex = 0;
							match = [];
							transformationApplied = false;
							postOrderTraverse(expressionTree, visitor);
						} while (transformationApplied);
					}
				} while (blockApplied);
			}
			
			return expressionTree;
		}
		
		// After all transformations have been applied, the expression tree
		// consists only of nodes that contain JavaScript code. This function
		// traverses the expression tree one last time, gathers the JavaScript
		// code and finally returns it as a string.
		function gatherCode(expressionTree) {
			var code = [];
			
			function traverser(root) {
				var i;
				for (i = 0; i < root.length; i++) {					
					if (root[i][0] == 'compiled') {
						for (var j = 0; j < root[i][1].length; j++) {
							if (root[i][1][j] instanceof Array) {
								traverser(root[i][1][j]);
							} else {
								code = code.concat(root[i][1][j]);		
							}
						}
					}
				}
			}
			traverser(expressionTree);						
			return code.join('');
		}
		
		return function(expressionTree) {
			// Reset the transparent identifier list and -counter
			lastTransparentIdentifier = 0;
			transparentIdentifiers = {};
			
			if (expressionTree instanceof ParseError) {
				throw expressionTree;
			} else if (expressionTree.rest.replace(/^\s+/, '').length > 0) {
				throw new ParseError('End of file expected', 
					expressionTree.rest.length);
			}
			
			expressionTree = applyTransformations(expressionTree.parsed);			
			return 'return ' + gatherCode(expressionTree) + ';';
		};
	})();
	
	// Given a ParseError object, this function retrieves the line number,
	// offset and context of the error from the original query string.
	function getErrorContext(error, query) {
		var totalOffset = query.length - error.unparsedCharacters;
		var context = {
			line: 1,
			offset: 1,
			context: 0
		};

		var lastBreak = 0;
		var lastCharacter = '';
		for (var i = 0; i < totalOffset; i++) {
			var character = query.charAt(i);
			if (character == "\r" || character == "\n" && 
				lastCharacter != "\r") {
				++context.line;
				lastBreak = i;
			}		
		}
		context.offset = totalOffset - lastBreak;
		context.context = query.substring(totalOffset);
		return context;
	}
 
	/**
	 * Constructor for a query object. A query object works a lot like a
	 * prepared statement in that invoking the constructor will compile but
	 * not execute the query. Such a query object can be applied to the same
	 * or even to different datasets any number of times without having to 
	 * re-compile the query. Inside the query expression, you may use 
	 * placeholders for variables that you wish to pass into the query from 
	 * the outside. Such placeholders begin with a dollar-sign ($) and are
	 * followed by an index. You can assign concrete values to these 
	 * placeholders by invoking the setValue method on the query object.
	 * An examplary query that uses placeholders is the following:
	 * 		from c in $0 select c.lastname
	 * Upon invoking this constructor, the query is compiled into JavaScript
	 * code. Syntactical errors in the query expression will cause the
	 * constructor to throw a QueryTranslationException. Semantic errors
	 * in the query expression (such as the use of undeclared variables) do
	 * not usually surface at this stage. Instead, their appearence is 
	 * generally deferred until the execute method is invoked.
	 * @constructor
	 * @param query The string containing the query
	 */
	function Query(query) {		
		var queryParameters = [];
		var queryFunction = null;
		try {
			queryFunction = new Function('_$qp', 
				compileQuery(parseQuery(query)));
		} catch (e) {			
			if (e instanceof ParseError) {
				var errorContext = getErrorContext(e, query);
				throw new QueryTranslationException(e.message,
					errorContext.line, errorContext.offset, 
					errorContext.context);
			} else {
				throw e;
			}
		}
		
		/**
		 * Binds a specified value to a placeholder
		 * @param index Index of the placeholder
		 * @param value The value to bind to the placeholder
		 */		
		this.setValue = function(index, value) {
			if (queryFunction == null) {
				throw new jsinq.InvalidOperationException();
			}
			queryParameters[index] = value;	
		};		

		/**
		 * Executes the query and returns the result
		 * @return The result of the query
		 */		
		this.execute = function() {
			if (queryFunction == null) {
				throw new jsinq.InvalidOperationException();
			}
			return queryFunction(queryParameters);
		};
		
		/**
		 * Returns the anonymous function that executes the query
		 * @return The query function
		 */
		this.getQueryFunction = function() {
			if (queryFunction == null) {
				throw new jsinq.InvalidOperationException();
			}			
			return queryFunction;
		};
	}
	
	this.QueryTranslationException = QueryTranslationException;
	this.Query = Query;
 }).call(jsinq);