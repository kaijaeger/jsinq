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
	 * An exception that is thrown when an operation performed on an object was
	 * unsuccessful due to the state that the object was in.
	 * @constructor
	 */
	function InvalidOperationException() { }		
	InvalidOperationException.prototype = new Error();
	InvalidOperationException.prototype.name = 'InvalidOperationException';
	InvalidOperationException.prototype.message = 
		'Operation is not valid due to the current state of the object.';

	/**
	 * The exception that is thrown when one of the arguments provided to a method is not valid.
	 * @constructor
	 * @param parameter Name of the parameter that was out of range
	 */
	function ArgumentException(parameter) { 
		this.message += parameter;
	}
	ArgumentException.prototype = new Error();
	ArgumentException.prototype.name = 'ArgumentException';
	ArgumentException.prototype.message = 
		'Value provided for the following parameter is invalid: ';	
	
	/**
	 * An exception that is thrown when the value of a parameter is outside the
	 * allowable range.
	 * @constructor
	 * @param parameter Name of the parameter that was out of range
	 */
	function ArgumentOutOfRangeException(parameter) { 
		this.message += parameter;
	}
	ArgumentOutOfRangeException.prototype = new Error();
	ArgumentOutOfRangeException.prototype.name = 'ArgumentOutOfRangeException';
	ArgumentOutOfRangeException.prototype.message = 
		'Specified argument was out of the range of valid values.\r\n' +
		'Parameter name: ';
	
	/**
	 * The exception that is thrown when the key specified for accessing an 
	 * element in a collection does not match any key in the collection.
	 * @constructor
	 */
	function KeyNotFoundException() { }
	KeyNotFoundException.prototype = new Error();
	KeyNotFoundException.prototype.name = 'KeyNotFoundException';
	KeyNotFoundException.prototype.message = 'Key does not exist';	

	/**
	 * The exception that is thrown when an invoked method is not supported.
	 * @constructor
	 */
	function NotSupportedException() { }
	NotSupportedException.prototype = new Error();
	NotSupportedException.prototype.name = 'NotSupportedException';
	NotSupportedException.prototype.message = 'Method is not supported';	
	
	/**
	 * Provides a method to support the comparison of two objects for equality.
	 * @constructor
	 */
	function EqualityComparer() { }
	EqualityComparer.prototype = {
		/**
		 * Returns true if a and b are equal.
		 * @param a The first object
		 * @param b The second object
		 * @return True if a and b are equal
		 */
		equals: function(a, b) {
			return a == b;
		}	
	};

	(function() {
		var defaultComparer = new EqualityComparer();
		/**
		 * Returns the default comparer which uses JavaScript's built-in non-
		 * strict equals-operator to compare two values for equality.
		 * @return The default comparer
		 */
		EqualityComparer.getDefault = function() {
			return defaultComparer;
		};
		
		/**
		 * Creates a new quality comparer from the provided function
		 * @param func The comparer function
		 * @return A new equality comparer object
		 */
		EqualityComparer.fromFunction = function(func) {
			var comparer = new EqualityComparer();
			comparer.equals = func;
			return comparer;
		};
	})();		

	/**
	 * Provides a method to support the comparison of two objects.
	 * @constructor
	 */
	function Comparer() { }
	Comparer.prototype = {
		/**
		 * Returns a value less than zero if a is less than b, a value greater 
		 * zero if a is greater than b and zero if a equals b.
		 * @param a The first object
		 * @param b The second object
		 * @return A value indicating whether a is equal to, less than or
		 * 	greater than b
		 */
		compare: function(a, b) {
			return a < b ? -1 : (a > b ? 1 : 0);
		}
	};
	
	(function() {
		var defaultComparer = new Comparer();
		/**
		 * Returns the default comparer which uses JavaScript's built-in less-
		 * than and greater-than operators to compare two values.
		 * @return The default comparer
		 */
		Comparer.getDefault = function() {
			return defaultComparer;
		};
		
		/**
		 * Creates a new comparer from the provided function
		 * @param func The comparer function
		 * @return A new comparer object
		 */
		Comparer.fromFunction = function(func) {
			var comparer = new Comparer();
			comparer.compare = func;
			return comparer;
		};
	})();	

	/**
	 * Gives access to an Enumerator that can be used to enumerate the object.
	 * Invoke this constructor with either a scalar value to create a singleton
	 * list or with an array or a NodeList to make it enumerable.
	 * @constructor
	 * @param value The object to enumerate
	 */
	function Enumerable(value) {	
		if (arguments.length == 0) {
			value = [];
		} else if (typeof value.length == 'undefined' || (value.length > 0 && 
			typeof value[0] == 'undefined')) {
			value = [value];
		}
		
		/**
		 * Returns a new Enumerator
		 * @return A new enumerator
		 */
		this.getEnumerator = function() {
			return new function() {
				var index = -1;
						
				/**
				 * Moves the internal cursor to the next value. Returns false 
				 * if the cursor has been moved past the end of the collection.
				 * @return False if the cursor has been moved past the end of 
				 * 	the collection
				 */
				this.moveNext = function() {
					++index;
					return index < value.length;
				};					
							
				/**
				 * Returns the element in the collection that the internal  
				 * cursor currently points to. Make sure to call moveNext 
				 * before calling current. When calling current after an 
				 * unsuccessful call to moveNext, the method will throw an 
				 * exception.
				 * @return The current element
				 */
				this.current = function() {
					if (index < 0 || index >= value.length) {
						throw new InvalidOperationException();
					}
					return value[index];
				};	
						
				/**
				 * Places the internal cursor before the first element in the 
				 * collection.
				 */
				this.reset = function() {
					index = -1;
				};									
			};
		};
	}

	/**
	 * Returns an empty Enumerable
	 * @return An empty Enumerable
	 */
	Enumerable.empty = function() {	
		return new Enumerable();
	};

	/**
	 * Returns an Enumerable for the specified range of numbers
	 */
	Enumerable.range = function(start, count) {
		if (count < 0) {
			throw new ArgumentOutOfRangeException();
		}
		var func = function() {
			this.getEnumerator = function() {
				return new function() {
					var index = -1;
					var hasNext = false;
					this.moveNext = function() {
						hasNext = false;
						if (index < count - 1) {
							hasNext = true;
							++index;
							return true;
						}
						return false;
					};
					
					this.current = function() {
						if (hasNext) {
							return start + index;
						} else {
							throw new InvalidOperationException();	
						}
					};	
					
					this.reset = function() { 
						index = -1;
					};
				};
			};
		};
		func.prototype = Enumerable.prototype;
		return new func();
	};

	/**
	 * Returns an Enumerable that contains the specified element "count" times
	 */
	Enumerable.repeat = function(element, count) {
		if (count < 0) {
			throw new ArgumentOutOfRangeException();	
		}
		var func = function() {
			this.getEnumerator = function() {
				return new function() {
					var index = -1;
					var hasNext = false;
					this.moveNext = function() {
						hasNext = false;
						if (index < count - 1) {
							hasNext = true;
							++index;
							return true;
						}
						return false;
					};
					
					this.current = function() {
						if (hasNext) {
							return element;
						} else {
							throw new InvalidOperationException();	
						}
					};	
					
					this.reset = function() { 
						index = -1;
						hasNext = false;
					};
				};
			};
		};
		func.prototype = Enumerable.prototype;
		return new func();
	};

	Enumerable.prototype = (function() {
		// Identity function used as a default value for certain method 
		// overloads. See below.
		function identity(value) {
			return value;
		}
							
		// The two possible parameters for the orderBy function (see below)
		var ASCENDING = 1;
		var DESCENDING = -1;
		
		// Implementation of Enumerable.orderBy, Enumerable.orderByDescending 
		// as well as OrderedEnumerable.thenBy and 
		// OrderedEnumerable.thenByDescending. This is implemented here, to 
		// avoid code duplication. The function returns a different 
		// implementation of the orderBy function based on the direction 
		// parameter.
		function orderBy(direction) {
			return function(keySelector) {
				var _this = this;
				var parentSelectors = [];
				var comparer = Comparer.getDefault();
				if (arguments.length >= 3) {
					comparer = arguments[1];
					if (typeof comparer == "function") {
						comparer = Comparer.fromFunction(comparer);
					}
					parentSelectors = arguments[2];
				}	else if (arguments.length >= 2) {
					if (arguments[1] instanceof Array) {
						parentSelectors = arguments[1];
					} else {
						comparer = arguments[1];
						if (typeof comparer == "function") {
							comparer = Comparer.fromFunction(comparer);
						}
					}
				}			
				var selectors = [[keySelector, direction, comparer]];
				selectors = selectors.concat(parentSelectors);
				
				var func = function() {
					this.getEnumerator = function() {						
						return new function() {
							var itemEnumerator = null;
							
							function lazyInitialize() {
								var array = _this.toArray();
								array.sort(function(a, b) {
									var result = 0;
									var selector;
									var direction;
									var comparer;
									// Go through all selectors
									for (var i = selectors.length - 1; 
										i >= 0; i--) {
										result = 0;
										selector = selectors[i][0];
										direction = selectors[i][1];
										comparer = selectors[i][2];
										var keyA = selector(a);
										var keyB = selector(b);
										var compareResult = comparer.compare(
											keyA, keyB);
										if (compareResult != 0) {										
											return compareResult * direction;
										}																	
									}
									return 0;
								});
								itemEnumerator = (new Enumerable(array)).
									getEnumerator();
							}
							
							this.moveNext = function() {
								if (itemEnumerator == null) {
									lazyInitialize();
								}
								return itemEnumerator.moveNext();
							};
							
							this.current = function() {
								if (itemEnumerator == null) {
									throw new InvalidOperationException();
								}	
								return itemEnumerator.current();
							};
							
							this.reset = function() {
								if (itemEnumerator != null) {
									itemEnumerator.reset();
								}
							};
						};
					};
					
					// To avoid having to sort the Enumerable multiple times, 
					// thenBy does not actually perform any sorting at all. 
					// Instead, a chain of orderBy and thenBys essentially 
					// becomes an array of selectors. ThenBy then bypasses the 
					// previous orderBy and thenBys and returns a new 
					// Enumerator that sorts the original (unsorted) Enumerable
					// directly using the array of selectors (See above).
					this.thenBy = function(keySelector, comparer) {	
						var orderByFunc = orderBy(ASCENDING);
						if (arguments.length < 2) {
							comparer = Comparer.getDefault();
						}
						if (typeof comparer == "function") {
							comparer = Comparer.fromFunction(comparer);
						}						
						return orderByFunc.call(_this, keySelector, comparer, 
							selectors);
					};
					
					this.thenByDescending = function(keySelector, comparer) {
						var orderByFunc = orderBy(DESCENDING);
						if (arguments.length < 2) {
							comparer = Comparer.getDefault();
						}
						if (typeof comparer == "function") {
							comparer = Comparer.fromFunction(comparer);
						}												
						return orderByFunc.call(_this, keySelector, comparer, 
							selectors);		
					};
				};	
				func.prototype = Enumerable.prototype;
				return new func();				
			};
		}
		
		// Implementation of Enumerable.join and Enumerable.groupJoin. Again, 
		// this helps in avoiding code-duplication.
		function join(group) {
			return function (second, outerKeySelector, innerKeySelector, 
				resultSelector, comparer) {
				var _this = this;
				if (arguments.length < 5) {
					comparer = EqualityComparer.getDefault();
				}
				if (typeof comparer == "function") {
					comparer = EqualityComparer.fromFunction(comparer);
				}									
				
				var func = function() {
					this.getEnumerator = function() {
						return new function() {
							var dictionary = null;
							var enumerator = _this.getEnumerator();
							var hasNext = false;
							var firstElement;
							var secondElement;
							var secondList = null;
							var index = -1;
							
							function lazyInitialize() {
								dictionary = new Dictionary(comparer);
								var secondEnumerator = second.getEnumerator();
								while (secondEnumerator.moveNext()) {
									var current = secondEnumerator.current();
									var key = innerKeySelector(current);
									if (!dictionary.tryAdd(key, [current])) {
										var array = dictionary.item(key);
										array.push(current);
									}
								}
							}
							
							this.moveNext = function() {
								if (dictionary == null) {
									lazyInitialize();	
								}		
								var current;
								var key;
								if (group) {
									hasNext = enumerator.moveNext();
									if (hasNext) {										
										current = enumerator.current();
										key = outerKeySelector(current);
										firstElement = current;
										if (dictionary.containsKey(key)) {
											secondElement = new Enumerable(
												dictionary.item(key));
										} else {
											secondElement = Enumerable.empty();
										}
									}
								} else {
									if (secondList != null && ++index < 
										secondList.length) {
										secondElement = secondList[index];
										hasNext = true;
									} else {
										hasNext = false;
										while (enumerator.moveNext()) {
											current = enumerator.current();
											key = outerKeySelector(current);
											if (dictionary.containsKey(key)) {
												secondList = 
													dictionary.item(key);
												secondElement = secondList[0];
												index = 0;
												hasNext = true;
												firstElement = current;
												break;
											} else {
												continue;
											}														
										}
									}
								}
								return hasNext;
							};
							
							this.current = function() {
								if (!hasNext) {
									throw new InvalidOperationException();
								}
								return resultSelector(firstElement, 
									secondElement);
							};
							
							this.reset = function() {
								enumerator.reset();
							};
						};	
					};	
				};
				func.prototype = Enumerable.prototype;
				return new func();
			};
		}
		
		return {
			/**
			 * Accumulates the elements of an Enumerable using an accumulator 
			 * function. 
			 *
			 * Overloads:
			 *   aggregate(func)
			 *   aggregate(seed, func)
			 *   aggregate(seed, func, resultSelector)
			 */
			aggregate: function() {
				var enumerator = this.getEnumerator();
				
				var running;
				var func;
				var resultSelector = identity;
				if (arguments.length >= 2) {
					running = arguments[0];
					func = arguments[1];
					if (arguments.length >= 3) {
						resultSelector = arguments[2];
					}
				} else {
					if (!enumerator.moveNext()) {
						throw new InvalidOperationException();
					}						

					func = arguments[0];		
					running = enumerator.current();
				}
							
				while (enumerator.moveNext()) {
					running = func(running, enumerator.current());
				} 
				return resultSelector(running);
			},
			
			/**
			 * Returns true if all elements in the Enumerable satisfy the 
			 * specified condition.
			 */
			all: function(predicate) {		
				var enumerator = this.getEnumerator();
				while (enumerator.moveNext()) {
					if (!predicate(enumerator.current())) {
						return false;
					}
				}				
				return true;
			},
			
			/**
			 * Returns true if the Enumerable contains any elements or if at  
			 * least one of the elements in the Enumerable satisfy a specified 
			 * condition.
			 *
			 * Overloads:
			 *   any()
			 *   any(predicate)
			 */		
			any: function(predicate) {
				var enumerator = this.getEnumerator();
				if (arguments.length == 0) {
					return enumerator.moveNext();
				}
				var array = [];
				while (enumerator.moveNext()) {
					if (predicate(enumerator.current())) {
						return true;
					}
				}				
				return false;					
			},
			
			/**
			 * Returns the average of the elements in the Enumerable, 
			 * optionally using the specified selector function.
			 *
			 * Overloads:
			 *   average()
			 *   average(selector)
			 */		
			average: function(selector) {
				if (arguments.length == 0) {
					selector = identity;
				}
				
				var count = 1;
				var sum = this.aggregate(function(running, current) {
					++count;	
					return running + selector(current);
				});
				return sum / count;
			},
			
			/**
			 * Creates a new Enumerable that is the result of the concatenation
			 * of two Enumerables.
			 */		
			concat: function(second) {
				var _this = this;
				var func = function() {
					this.getEnumerator = function() {
						return new function() {
							var firstEnumerator = _this.getEnumerator();
							var secondEnumerator = second.getEnumerator();
							var enumerator = firstEnumerator;
							var canSwap = true;
							this.moveNext = function() {
								if (!enumerator.moveNext()) {
									if (canSwap) {
										enumerator = secondEnumerator;
										return enumerator.moveNext();
									}
									return false;
								}
								return true;
							};
							
							this.current = function() {
								return enumerator.current();
							};			
							
							this.reset = function() {
								canSwap = true;
								firstEnumerator.reset();
								secondEnumerator.reset();
								enumerator = firstEnumerator;
							};		
						};
					};
				};
				func.prototype = Enumerable.prototype;
				return new func();			
			},
			
			/**
			 * Returns true if the Enumerable contains the specified element.
			 * Optionally uses the specified comparer.
			 * 
			 * Overloads:
			 *   contains(value)
			 *   contains(value, comparer)
			 */		
			contains: function(value, comparer) {
				if (arguments.length == 1) {
					comparer = EqualityComparer.getDefault();
				}
				if (typeof comparer == "function") {
					comparer = EqualityComparer.fromFunction(comparer);
				}										
				return this.any(function(item) {
					return comparer.equals(item, value);
				});		
			},
			
			/**
			 * Returns the number of elements in the Enumerable. If a predicate
			 * function is specified, only those elements will be counted that
			 * satisfy the given condition.
			 */		
			count: function(predicate) {
				var count = 0;
				var enumerator = this.getEnumerator();
				var hasPredicate = typeof predicate == 'function';
				while (enumerator.moveNext()) {
					if ((hasPredicate && predicate(enumerator.current())) || 
						!hasPredicate) {
						++count;
					}						
				}				
				return count;
			},				
			
			/**
			 * Returns the Enumerable or a new Enumerable containing only the 
			 * specified default value, should the Enumerable be empty.
			 */		
			defaultIfEmpty: function(defaultValue) {
				var isEmpty = !this.any(function(item) {
					return true;
				});						
				if (isEmpty) {
					return new Enumerable(defaultValue);
				}
				return this;
			},
			
			/**
			 * Returns a new Enumerable that contains only distinct elements.
			 * Optionally uses a specified comparer.
			 *
			 * Overloads:
			 *   distinct()
			 *   distinct(comparer)
			 */		
			distinct: function(comparer) {
				var _this = this;					
				var hasComparer = arguments.length > 0;
				
				if (typeof comparer == "function") {
					comparer = EqualityComparer.fromFunction(comparer);
				}										
				
				var func = function() {
					this.getEnumerator = function() {
						return new function() {
							var enumerator = _this.getEnumerator();
							var dictionary;
							if (hasComparer) {	
								dictionary = new Dictionary(comparer);
							} else {
								dictionary = new Dictionary();
							}			
								
							this.moveNext = function() {
								while (enumerator.moveNext()) {
									if (dictionary.tryAdd(
										enumerator.current(), true)) {
										return true;											
									}
								}
								return false;
							};
							
							this.current = function() {
								return enumerator.current();
							};			
							
							this.reset = function() {
								enumerator.reset();
								dictionary.clear();
							};		
						};
					};
				};
				func.prototype = Enumerable.prototype;
				return new func();	
			},
			
			/**
			 * Returns the element at the specified offset or throws an 
			 * exception if the index is out of bounds.
			 */		
			elementAt: function(index) {
				var element;
				var found = this.any(function(item) {
					element = item;
					return index-- == 0;
				});	
				if (!found) {
					throw new ArgumentOutOfRangeException('index');
				}
				return element;
			},
			
			/**
			 * Same as elementAt, except it returns the specified defaultValue 
			 * if the given index is out of bounds. This differs from the LINQ 
			 * implementation in that the default value needs to be specified 
			 * explicitly.
			 */		
			elementAtOrDefault: function(index, defaultValue) {
				try {
					return this.elementAt(index);
				} catch (e) {
					return defaultValue;
				}	
			},
			
			/**
			 * Returns a new Enumerable containing all elements from this 
			 * Enumerable except those contained in a second Enumerable (i.e. 
			 * the set difference between two enumerables). Optionally uses the 
			 * specified comparer.
			 *
			 * Overloads:
			 *   except(second)
			 *   except(second, comparer)
			 */		
			except: function(second, comparer) {
				if (arguments.length < 2) {
					comparer = EqualityComparer.getDefault();
				}
				if (typeof comparer == "function") {
					comparer = EqualityComparer.fromFunction(comparer);
				}										
				return this.where(function(item) {
					return !second.any(function(compare) {
						return comparer.equals(item, compare);
					});
				});	
			},
			
			/**
			 * Returns the first element in the Enumerable or throws an 
			 * exception if the Enumerable is empty. If a predicate function 
			 * is specified, the method returns the first element that 
			 * satisfies the given condition. If the Enumerable is empty or no 
			 * element satisfies the specified condition, an exception is 
			 * thrown.
			 *
			 * Overloads:
			 *   first()
			 *   first(predicate)
			 */		
			first: function(predicate) {
				if (arguments.length == 0) {
					try {
						return this.elementAt(0);
					} catch (e) {
						throw new InvalidOperationException();	
					}
				} else {
					var element;
					var found = this.any(function(item) {
						if (predicate(item)) {
							element = item;
							return true;
						}
						return false;
					});
					if (!found) {
						throw new InvalidOperationException();
					}
					return element;
				}
			},
			
			/**
			 * Same as first, except it returns a specified defaultValue if 
			 * the Enumerable is empty or no element satisfies the specified 
			 * condition. This method is different from its LINQ counterpart 
			 * in that it requires the default value to be specified 
			 * explicitly.
			 *
			 * Overloads:
			 *   firstOrDefault(defaultValue)
			 *   firstOrDefault(predicate, defaultValue)
			 */		
			firstOrDefault: function() {
				if (arguments.length == 1) {
					var defaultValue = arguments[0];	
				} else if (arguments.length > 1) {
					var predicate = arguments[0];
					var defaultValue = arguments[1];
				}
				try {
					if (arguments.length > 1) {
						return this.first(predicate);
					} else {
						return this.first();
					}
				} catch (e) {
					return defaultValue;
				}						
			},
			
			/**
			 * Groups the elements in the Enumerable. Note that this method  
			 * resolves overloads based on function arity. Result selectors 
			 * are expected to have two or more formal parameters while 
			 * element- and key-selectors are expected to have just one.
			 *
			 * Overloads:
			 *   groupBy(keySelector)
			 *   groupBy(keySelector, comparer)
	 		 *   groupBy(keySelector, elementSelector)
			 *   groupBy(keySelector, resultSelector)
	 		 *   groupBy(keySelector, resultSelector, comparer)
			 *   groupBy(keySelector, elementSelector, comparer) 		 
			 *   groupBy(keySelector, elementSelector, resultSelector) 	
			 *   groupBy(keySelector, elementSelector, resultSelector, 
			 *           comparer) 	
			 */		
			groupBy: function() {
				var keySelector = arguments[0];
				var elementSelector = identity;
				var resultSelector = identity;
				var comparer = EqualityComparer.getDefault();
				
				// Resolve overloads
				// Todo: Dealing with overloads based on function arity is  
				// probably a bad idea. Maybe there is a better way?
				if (arguments.length == 2) {
					if (typeof arguments[1].equals == 'function') {
						comparer = arguments[1];
					} else if (arguments[1].arity >= 2) {
						resultSelector = arguments[1];
					} else {
						elementSelector = arguments[1];
					}
				} else if (arguments.length == 3) {
					if (arguments[1].arity >= 2) {
						resultSelector = arguments[1];
						comparer = arguments[2];
					} else {
						elementSelector = arguments[1];
						if (typeof arguments[2].equals == 'function') {
							comparer = arguments[2];
						} else {
							resultSelector = arguments[2];
						}
					}
				} else if (arguments.length > 3) {
					elementSelector = arguments[1];
					resultSelector = arguments[2];
					comparer = arguments[3];
				}
				if (typeof comparer == "function") {
					comparer = EqualityComparer.fromFunction(comparer);
				}										
				
				var _this = this;
				
				var func = function() {
					this.getEnumerator = function() {
						return new function() {
							var resultSet = null;
							var index = -1;
							
							function lazyInitialize() {
								var itemEnumerator = _this.getEnumerator();
								var dictionary = new Dictionary(comparer);
								
								while (itemEnumerator.moveNext()) {
									var current = itemEnumerator.current();
									var key = keySelector(current);	
									if (dictionary.containsKey(key)) {
										var array = dictionary.item(key);
										array.push(elementSelector(current));
									} else {
										dictionary.tryAdd(key, 
											[elementSelector(current)]);
									}
								}									
								resultSet = dictionary.toArray();
							}
							
							this.moveNext = function() {
								if (resultSet == null) {
									lazyInitialize();
								}
								++index;
								return index < resultSet.length;
							};
							
							this.current = function() {
								if (index < 0 || index >= resultSet.length) {
									throw new InvalidOperationException();
								}
								var current = resultSet[index];
								var elements = new Enumerable(
									current.value);
								if (resultSelector != identity) {		
									return resultSelector(current.key, 
										elements);
								} else {												
									return new Grouping(current.key, 
										elements);
								}
							};
							
							this.reset = function() {
								index = -1;
							};
						};
					};
				};
				func.prototype = Enumerable.prototype;
				return new func();
			},
			
			/**
			 * Correlates the elements in two Enumerables based on their keys 
			 * and groups the results. 
			 *
			 * Overloads:
			 *   groupJoin(inner, outerKeySelector, innerKeySelector, 
			 *             resultSelector)
			 *   groupJoin(inner, outerKeySelector, innerKeySelector, 
			 *             resultSelector, comparer)
			 */		
			groupJoin: join(true),
			
			/**
			 * Returns a new Enumerable that is the result of the intersection
			 * of two Enumerables. Optionally uses the specified comparer.
			 * 
			 * Overloads:
			 *   intersect(second)
			 *   intersect(second, comparer)
			 */		
			intersect: function(second, comparer) {
				if (arguments.length < 2) {
					comparer = EqualityComparer.getDefault();
				}
				if (typeof comparer == "function") {
					comparer = EqualityComparer.fromFunction(comparer);
				}										
				return this.distinct(comparer).where(function(item) {
					return second.contains(item, comparer);
				});
			},
			
			/**
			 * Correlates the elements in two Enumerables based on their 
			 * keys. 
			 *
			 * Overloads:
			 *   join(inner, outerKeySelector, innerKeySelector, 
			 *        resultSelector)
			 *   join(inner, outerKeySelector, innerKeySelector, 
			 *        resultSelector, comparer)
			 */		
			join: join(false),
			
			/**
			 * Returns the last element in the Enumerable or throws an 
			 * exception, if the Enumerable is empty. If a predicate function 
			 * is specified, the method returns the last element that 
			 * satisfies the given condition. If no element satisfies the 
			 * specified condition, an exception is thrown.
			 *
			 * Overloads:
			 *   last()
			 *   last(predicate)
			 */		
			last: function(predicate) {
				var hasPredicate = typeof predicate == 'function';
				
				var last;
				var isEmpty = true;
				this.any(function(item) {
					if (!hasPredicate || predicate(item)) {
						last = item;
						isEmpty = false;
					}
					return false;	
				});					
				
				if (isEmpty) {
					throw new InvalidOperationException();	
				}				
				return last;
			},
			
			/**
			 * Same as last, except it returns a specified defaultValue if the
			 * Enumerable is empty or not element satisfies the specified 
			 * condition. This method is different from its LINQ counterpart 
			 * in that it requires the default value to be specified 
			 * explicitly.
			 *
			 * Overloads:
			 *   lastOrDefault(defaultValue)
			 *   lastOrDefault(predicate, defaultValue)
			 */		
			lastOrDefault: function() {
				if (arguments.length == 1) {
					var defaultValue = arguments[0];	
				} else if (arguments.length > 1) {
					var predicate = arguments[0];
					var defaultValue = arguments[1];
				}
				try {
					if (arguments.length > 1) {
						return this.last(predicate);
					} else {
						return this.last();
					}
				} catch (e) {
					return defaultValue;
				}						
			},
			
			/**
			 * Returns the maximum value in the Enumerable.
			 * 
			 * Overloads:
			 *   max()
			 *   max(selector)
			 */		
			max: function(selector) {
				if (arguments.length == 0) {
					selector = identity;
				}
				var isFirst = true;
				return this.aggregate(function(running, current) {
					if (isFirst) {
						running = selector(running);
						isFirst = false;
					}
					return Math.max(running, selector(current));
				});
			},
			
			/**
			 * Returns the minimum value in the Enumerable.
			 * 
			 * Overloads:
			 *   min()
			 *   min(selector)
			 */		
			min: function(selector) {
				if (arguments.length == 0) {
					selector = identity;
				}
				var isFirst = true;
				return this.aggregate(function(running, current) {
					if (isFirst) {
						running = selector(running);
						isFirst = false;
					}
					return Math.min(running, selector(current));
				});
			},	
			
			/**
			 * Sorts the elements in the Enumerable in ascending order.
			 *
			 * Overloads:
			 *   orderBy(keySelector)
			 *   orderBy(keySelector, comparer)
			 */		
			orderBy: orderBy(ASCENDING),
			
			/**
			 * Sorts the elements in the Enumerable in descending order.
			 *
			 * Overloads:
			 *   orderByDescending(keySelector)
			 *   orderByDescending(keySelector, comparer)
			 */	
			orderByDescending: orderBy(DESCENDING),							
			
			/**
			 * Reverses the order of the elements in the Enumerable.
			 */		
			reverse: function() {
				var _this = this;
				var func = function() {
					this.getEnumerator = function() {
						return new function() {
							var enumerator = null;
							
							this.moveNext = function() {
								if (enumerator == null) {
									enumerator = new Enumerable(
										_this.toArray().reverse()).
										getEnumerator();
								}
								return enumerator.moveNext();
							};
							
							this.current = function() {
								if (enumerator == null) {
									throw new InvalidOperationException();
								}
								return enumerator.current();
							};
							
							this.reset = function() {
								if (enumerator != null) {
									enumerator.reset();
								}							
							};
						};
					}
				};
				func.prototype = Enumerable.prototype;
				return new func();			
			},
			
			/**
			 * Projects each of the elements in the Enumerable into a new 
			 * form. This differes from its LINQ counterpart in that the 
			 * selector function always receives the index of the current  
			 * element as its second parameter.
			 */		
			select: function(selector) {
				var _this = this;
				var func = function() {
					this.getEnumerator = function() {
						return new function() {
							var itemEnumerator = _this.getEnumerator();
							var index = -1;
							
							this.moveNext = function() {
								++index;
								return itemEnumerator.moveNext();							
							};
							
							this.current = function() {
								return selector(itemEnumerator.current(), 
									index);
							};			
							
							this.reset = function() {
								itemEnumerator.reset();
								index = -1;
							};		
						};
					};
				};
				func.prototype = Enumerable.prototype;
				return new func();
			},
			
			/**
			 * Projects each of the elements in the Enumerable into a new 
			 * Enumerable and then flattens the result into a single  
			 * Enumerable again. This differes from its LINQ counterpart in  
			 * that the collection selector function always receives the 
			 * index of the current element as its second parameter.
			 *
			 * Overloads:
			 *   selectMany(selector)
			 *   selectMany(collectionSelector, resultSelector)
			 */		
			selectMany: function(collectionSelector, resultSelector) {
				var hasResultSelector = arguments.length > 1;
				var _this = this;
				var func = function() {	
					this.getEnumerator = function() {
						return new function() {
							var itemEnumerator = _this.getEnumerator();
							var item = null;
							var subItemEnumerator = null;
							var hasCurrent = false;
							var index = 0;
				
							this.moveNext = function() {
								hasCurrent = false;
								var noMoveNext = true;
								while (true) {
									if (subItemEnumerator == null || 
										!subItemEnumerator.moveNext()) {
										if (!itemEnumerator.moveNext()) {										
											break;
										}
										item = itemEnumerator.current();
										subItemEnumerator = 
											collectionSelector(item, index++).
											getEnumerator();
										noMoveNext = false;
									}		
									if (noMoveNext || 
										subItemEnumerator.moveNext()) {
										hasCurrent = true;
										break;
									}
								}	
								return hasCurrent;
							};
								
							this.current = function() {
								if (!hasCurrent) {
									throw new InvalidOperationException();
								}
								if (hasResultSelector) {
									return resultSelector(item, 
										subItemEnumerator.current());
								} else {
									return subItemEnumerator.current();
								}
							};
							
							this.reset = function() {
								hasCurrent = false;
								subItemEnumerator = null;
								item = null;
								itemEnumerator.reset();
								index = 0;
							};
						};
					};
				};	
				func.prototype = Enumerable.prototype;
				return new func();
			},		
			
			/**
			 * Returns true if the Enumerable is identical to another 
			 * Enumerable by comparing the elements using an optional 
			 * comparer.
			 *
			 * Overloads:
			 *   sequenceEqual(second)
			 *   sequenceEqual(second, comparer)
			 */		
			sequenceEqual: function(second, comparer) {
				if (this == second) {
					return true;
				}
				if (arguments.length < 2) {
					comparer = EqualityComparer.getDefault();
				}				
				if (typeof comparer == "function") {
					comparer = EqualityComparer.fromFunction(comparer);
				}										
				var firstEnumerator = this.getEnumerator();
				var secondEnumerator = second.getEnumerator();
				
				while (firstEnumerator.moveNext() && 
					secondEnumerator.moveNext()) {
					if (!comparer.equals(firstEnumerator.current(), 
						secondEnumerator.current())) {
						return false;
					}
				}					
				return true;
			},
			
			/**
			 * Returns the only element in the Enumerable or throws an  
			 * exception either if the Enumerable is empty or if there is more 
			 * than one element in the Enumerable. Optionally tests the 
			 * returned element against a predicate function and throws an 
			 * exception if the element does not satisfy its condition.
			 *
			 * Overloads:
			 *   single()
			 *   single(predicate)
			 */		
			single: function(predicate) {
				var hasPredicate = arguments.length > 0;
				var enumerator = this.getEnumerator();
				if (!enumerator.moveNext()) {
					throw new InvalidOperationException();	
				} 
				var current = enumerator.current();
				if (enumerator.moveNext() || (hasPredicate && 
					!predicate(current))) {
					throw new InvalidOperationException();	
				}
				return current;
			},
			
			/**
			 * Same as single, except that a specified default value is 
			 * returned if the Enumerable is empty, contains more than one 
			 * element or if the element does not satisfy the specified 
			 * condition. This method differs from its LINQ counterpart in 
			 * that it requires the default value to be specified explicitly.
			 *
			 * Overloads:
			 *   singleOrDefault(defaultValue)
			 *   singleOrDefault(predicate, defaultValue)
			 */		
			singleOrDefault: function() {
				if (arguments.length == 1) {
					var defaultValue = arguments[0];	
				} else if (arguments.length > 1) {
					var predicate = arguments[0];
					var defaultValue = arguments[1];
				}
				try {
					if (arguments.length > 1) {
						return this.single(predicate);
					} else {
						return this.single();
					}
				} catch (e) {
					return defaultValue;
				}									
			},
			
			/**
			 * Returns a new Enumerable that is the result of skipping the 
			 * first "count" elements of the Enumerable.     
			 */		
			skip: function(count) {
				if (count == 0) {
					return this;
				}
				return this.skipWhile(function(item, index) {
					return index < count;
				});
			},
			
			/**
			 * Returns a new Enumerable that is the result of skipping all 
			 * elements from the beginning of the Enumerable that satisfy a  
			 * specified condition.
			 */		
			skipWhile: function(predicate) {
				var _this = this;
				var func = function() {
					this.getEnumerator = function() {
						return new function() {
							var enumerator = _this.getEnumerator();
							var isInitialized = false;
							var index = 0;
														
							this.moveNext = function() {
								if (!isInitialized) {
									var canMoveNext = false;
									while ((canMoveNext = 
										enumerator.moveNext()) &&
										predicate(enumerator.current(), 
										index++)) { }
									isInitialized = true;
									return canMoveNext;
								} else {
									return enumerator.moveNext();
								}
							};
							
							this.current = function() {
								return enumerator.current();
							};
							
							this.reset = function() {
								enumerator.reset();
								isInitialized = false;
								index = 0;
							};
						};
					};
				};	
				func.prototype = Enumerable.prototype;
				return new func();					
			},
			
			/**
			 * Returns the sum of the elements in the Enumerable, optionally 
			 * using a specified selector.
			 *
			 * Overloads:
			 *   sum()
			 *   sum(selector)
			 */		
			sum: function(selector) {
				if (arguments.length == 0) {
					selector = identity;
				}
				return this.aggregate(0, function(running, current) {
					return running + selector(current);
				});
			},		
			
			/**
			 * Returns a new Enumerable that is the result of extracting the 
			 * first "count" elements from the Enumerable.
			 */		
			take: function(count) {
				if (count == 0) {
					return Enumerable.empty();
				}
				return this.takeWhile(function(item, index) {
					return index < count;
				});					
			},		
			
			/**
			 * Returns a new Enumerable that is the result of extracting all 
			 * elements from the beginning of the Enumerable that satisfy the  
			 * specified condition.
			 */		
			takeWhile: function(predicate) {
				var _this = this;
				var func = function() {
					this.getEnumerator = function() {
						return new function() {
							var enumerator = _this.getEnumerator();
							var isOperational = true;
							var index = 0;
														
							this.moveNext = function() {
								if (isOperational) {
									isOperational = enumerator.moveNext() && 
										predicate(enumerator.current(), 
										index++);
								}
								return isOperational;
							};
							
							this.current = function() {
								if (!isOperational) {
									throw new InvalidOperationException();
								}
								return enumerator.current();
							};
							
							this.reset = function() {
								enumerator.reset();
								isOperational = true;
								index = 0;
							};
						};
					};
				};	
				func.prototype = Enumerable.prototype;
				return new func();						
			},
			
			/**
			 * Returns an array containg all the elements in Enumerable.
			 */		
			toArray: function() {
				var enumerator = this.getEnumerator();
				var array = [];
				while (enumerator.moveNext()) {
					array.push(enumerator.current());
				}				
				return array;
			},
			
			/**
			 * Returns a new Enumerable that is the union of two Enumerables. 
			 * Optionally uses the specified comparer.
			 *
			 * Overloads:
			 *   union(second)
			 *   union(second, comparer)
			 */		
			union: function(second, comparer) {
				if (arguments.length < 2) {
					comparer = EqualityComparer.getDefault();
				}
				if (typeof comparer == "function") {
					comparer = EqualityComparer.fromFunction(comparer);
				}										
				return this.concat(second).distinct(comparer);
			},
			
			/**
			 * Returns a new Enumerable that contains only the elements of the
			 * Enumerable that satisfy the specified condition.
			 */		
			where: function(predicate) {
				var _this = this;
				var func = function() {
					this.getEnumerator = function() {
						return new function() {
							var itemEnumerator = _this.getEnumerator();
							var current;
							var hasCurrent = false;
							this.moveNext = function() {
								hasCurrent = false;
								while (itemEnumerator.moveNext()) {
									current = itemEnumerator.current();
									if (predicate(current)) {
										hasCurrent = true;
										break;
									}
								}
								return hasCurrent;
							};
							
							this.current = function() {
								if (!hasCurrent) {
									throw new InvalidOperationException();
								}
								return current;
							};			
							
							this.reset = function() {
								itemEnumerator.reset();
								hasCurrent = false;
							};		
						};
					};
				};
				func.prototype = Enumerable.prototype;
				return new func();
			},
				
			/**
			 * Merges two sequences by using the specified predicate function.
			 */					
			zip: function(second, resultSelector) {
				var _this = this;
				
				var func = function() {
					this.getEnumerator = function() {
						return new function() {
							var firstEnumerator = _this.getEnumerator();
							var secondEnumerator = second.getEnumerator();
							var hasCurrent = false;
							
							this.moveNext = function() {
								if (firstEnumerator.moveNext() &&
									secondEnumerator.moveNext()) {
									hasCurrent = true;
									return true;
								} else {
									return false;
								}
							};
							
							this.current = function() {
								if (!hasCurrent) {
									throw new InvalidOperationException();
								}
								
								return resultSelector(firstEnumerator.current(),
									secondEnumerator.current());
							};
							
							this.reset = function() {
								firstEnumerator.reset();
								secondEnumerator.reset();
							};
						};		
					};
				};
				func.prototype = Enumerable.prototype;
				return new func();
			},
				
			/**
			 * Create a dictionary from an enumerable
			 *
			 * Overloads:
			 *   toDictionary(keySelector)
			 *   toDictionary(keySelector, comparer)
			 */
			toDictionary: function(keySelector, comparer) {
				if (typeof comparer == "function") {
					comparer = EqualityComparer.fromFunction(comparer);
				}						
				var enumerator = this.getEnumerator();
				
				var dictionary;
				
				if (arguments.length == 1) {
					dictionary = new Dictionary();
				} else if (arguments.length >= 2) {
					dictionary = new Dictionary(comparer);
				}
				
				var key; 
				var current;
				
				while (enumerator.moveNext()) {
					current = enumerator.current();
					key = keySelector(current);
					if (!dictionary.tryAdd(key, current)) {
						throw new ArgumentException("keySelector");
					}
				}
				
				return dictionary;
			},
			
			/**
			 * Creates a list from an enumerable
			 */
			toList: function() {
				return new List(this);
			},	
				
			/**
			 * Creates a lookup from an enumerable
			 *
			 * Overloads:
			 *   toLookup(keySelector)
			 *   toLookup(keySelector, comparer)
			 *   toLookup(keySelector, elementSelector)
			 *   toLookup(keySelector, elementSelector, comparer)
			 */
			toLookup: function(keySelector) {
				var keySelector = arguments[0];
				var elementSelector = null;
				var comparer = null;
				var lookup;
				
				switch (arguments.length) {
					case 2:
						if (typeof arguments[1] == 'function') {
							elementSelector = arguments[1];
						} else {
							comparer = arguments[1];
						}
						break;
					case 3:
						elementSelector = arguments[1];
						if (typeof arguments[2] == "function") {
							comparer = 
								EqualityComparer.fromFunction(arguments[2]);
						} else {
							comparer = arguments[2];
						}
						break;
				}
				
				if (comparer != null) {
					lookup = new Lookup(comparer);
				} else {
					lookup = new Lookup();
				}	
				
				var enumerator = this.getEnumerator();				
				
				var key; 
				var current;
				var grouping;
				
				while (enumerator.moveNext()) {
					current = enumerator.current();
					key = keySelector(current);
					
					try {
						grouping = lookup.item(key);
					} catch(e) {
						grouping = new Grouping(key);
						lookup.add(grouping);
					}
					
					if (elementSelector) {
						grouping.add(elementSelector(current));
					} else {
						grouping.add(current);
					}
				}
				
				return lookup;
			},
				
			/**
			 * Convenience method for enumerating an enumerator.
			 */	
			each: function(func) {
				var enumerator = this.getEnumerator();
				while (enumerator.moveNext()) {
					func(enumerator.current());
				}
			}
		};
	})();
	
	/**
	 * A collection of keys and values
	 * @constructor
	 */
	function Dictionary(comparer) {
		var isDefaultComparer = comparer == EqualityComparer.getDefault();
		
		if (arguments.length > 0 && !isDefaultComparer) {
			comparer = arguments[0];
		} else {
			comparer = null;
		}
		if (typeof comparer == "function") {
			comparer = EqualityComparer.fromFunction(comparer);
		}

		var count = 0;
		var primitiveItems = {};
		var complexItems = {};
		
		var MAX_HASH_PARTS = 8;
		var MAX_HASH_STRING_LENGTH = 24;
		var defaultObjectString = {}.toString();

		function hashComplexKey(key) {
			if (comparer != null) {
				return 0;
			}
			
			var stringRepresentation = key.toString().substring(0, 
				MAX_HASH_STRING_LENGTH);
			var constructor = key.constructor || "";
			var hashParts = [constructor.toString(), stringRepresentation];
			
			if (key.nodeName) {
				hashParts.push(key.nodeName);
			}
			if (key.parentNode && key.parentNode.nodeName) {
				hashParts.push(key.parentNode.nodeName);
			}		
			if (stringRepresentation == defaultObjectString) {		
				for (var field in key) {
					hashParts.push(field);
					hashParts.push(key[field].toString().substring(0, 
						MAX_HASH_STRING_LENGTH));
					if (hashParts.length > MAX_HASH_STRING_LENGTH) {
						break;
					}
				}
			}	
			
			return hashParts.join("");
		}		
		
		function isPrimitive(obj) {
			return typeof obj == 'string' || typeof obj == 'number' || 
				typeof key == 'boolean' || obj === null;
		}
		
		function lookUp(key, func) {
			var funcResult;
			
			if (comparer == null && isPrimitive(key)) {
				var value = primitiveItems[key];
				if (value instanceof Array) {
					funcResult = func(value[0]);							
				} else {
					funcResult = func();
				}						
				if (funcResult.length > 1) {
					if (typeof value == 'undefined') {
						++count;
					}
					primitiveItems[key] = [funcResult[1]];
				}						
				return funcResult[0];
			} else {
				var keyHash = hashComplexKey(key);				
				var candidates = complexItems[keyHash];				
				if (candidates instanceof Array) {
					var candidate;
					var candidatesLength = candidates.length;
					for (var i = 0; i < candidatesLength; i++) {
						candidate = candidates[i];
						if ((comparer != null && 
							comparer.equals(candidate.key, key)) ||
							(comparer == null && candidate.key == key)) {
							funcResult = func(candidate.value);
							if (funcResult.length > 1) {
								candidate.value = funcResult[1];
							}
							return funcResult[0];
						}
					}
				}
				funcResult = func();
				if (funcResult.length > 1) {
					var newKeyValuePair = {key: key, value: funcResult[1]};
					if (candidates  instanceof Array) {
						candidates.push(newKeyValuePair);
					} else {
						complexItems[keyHash] = [newKeyValuePair];
					}
					++count;
				}
				return funcResult[0];
			}					
		}
		
		function put(key, value, overwrite) {
			return lookUp(key, function(currentValue) {
				if (arguments.length == 0 || overwrite) {
					return [true, value];
				} else {
					return [false];
				}
			});			
		}
		
		/**
		 * Retrieves the value associated with the specified key
		 */
		this.item = function(key) {
			return lookUp(key, function(value) {
				if (arguments.length == 0) {
					throw new KeyNotFoundException(key);	
				}
				return [value];
			});	
		};
		
		/**
		 * Sets the value associated with the specified key. An existing
		 * value associated with the key will be replaced.
		 */		
		this.set = function(key, value) {
			put(key, value, true);
		};
		
		/**
		 * Returns the number of key-value pairs in this dictionary
		 */		
		this.count = function() {
			return count;
		};
		
		/**
		 * Retrieves the comparer associated with this dictionary
		 */		
		this.getComparer = function() {
			if (isDefaultComparer) {
				return EqualityComparer.getDefault();
			} else {
				return comparer;
			}
		};
		
		/**
		 * Adds the specified key and value to the dictionary 
		 */		
		this.add = function(key, value) {
			if (!put(key, value, false)) {
				throw new ArgumentException("key");
			}
		};
		
		/**
		 * Attempts to add the specified key and value to the dictionary.
		 * Returns a boolean value indicating whether the operation was
		 * successful.
		 */			
		this.tryAdd = function(key, value) {
			return put(key, value, false); 
		}
		
		/**
		 * Returns an array containing the keys in this dictionary
		 */		
		this.keys = function() {
			var keys = [];
			var elements = this.toArray();
			for (var i = 0; i < elements.length; i++) {
				keys.push(elements[i].key);
			}
			return new Enumerable(keys);
		};
		
		/**
		 * Returns an array containing the values in this dictionary
		 */		
		this.values = function() {
			var values = [];
			var elements = this.toArray();
			for (var i = 0; i < elements.length; i++) {
				values.push(elements[i].value);
			}
			return new Enumerable(values);			
		};
		
		/**
		 * Empties the dictionary
		 */		
		this.clear = function() {
			count = 0;
			primitiveItems = {};
			complexItems = {};
		};
		
		/**
		 * Returns a boolean value indicating whether the specified key
		 * is contained within the dictionary.
		 */		
		this.containsKey = function(key) {
			return lookUp(key, function(value) {
				return [arguments.length == 1];
			});
		};
		
		/**
		 * Returns a boolean value indicating whether the specified value
		 * is contained within the dictionary
		 */		
		this.containsValue = function(value) {
			var elements = this.toArray();
			for (var i = 0; i < elements.length; i++) {
				if (elements[i].value == value) {
					return true;
				}
			}
			return false;
		};
		
		/**
		 * Returns an enumerator that iterates over this dictionary
		 */		
		this.getEnumerator = function() {
			return new Enumerable(this.toArray()).getEnumerator();
		};
		
		/**
		 * Returns an array containing the keys and values in this dictionary
		 */			
		this.toArray = function() {
			var result = [];
			for (var key in primitiveItems) {
				result.push({key: key, value: primitiveItems[key][0]});
			}
			var elements;
			var i;
			for (key in complexItems) {
				elements = complexItems[key];
				for (i = 0; i < elements.length; i++) {
					result.push(elements[i]);
				}
			}			
			return result;		
		};
		
		/**
		 * Removes the specified key and the value associated with it from this
		 * dictionary. Returns a boolean value indicating whether the operation
		 * was successful.
		 */		
		this.remove = function(key) {
			if (isPrimitive(key) && 
				primitiveItems[key] instanceof Array) {
				delete primitiveItems[key];
				--count;
				return true;
			} else {
				var keyHash = hashComplexKey(key);
				var candidates = complexItems[keyHash];
				if (candidates instanceof Array) {
					for (var i = 0; i < candidates.length; i++) {
						if ((comparer != null && 
							comparer.equals(candidates[i].key, key)) ||
							(comparer == null && candidates[i].key == key)) {
							if (candidates.length > 1) {
								candidates.splice(i, 1);
							} else {
								delete complexItems[keyHash];
							}
							--count;
							return true;
						}
					}
				}
				return false;			
			}
		};
		
		/**
		 * Indicates whether this dictionary is read-only
		 */
		this.isReadOnly = function() {
			return false;
		};		
		
		/**
		 * Returns a string representing the dictionary
		 */		
		this.toString = function() {
			var parts = [];
			this.each(function(e) {
				parts.push(e.key.toString() + ":" + e.value.toString());
			});
			return parts.join(", ");
		};
	}
	Dictionary.prototype = Enumerable.prototype;	
	
	/**
	 * A list of objects that can be accessed through an index
	 * @constructor
	 */		
	var List = function(collection) {
		var items;
		var enumerable;
			
		if (typeof collection != "undefined") {
			items = collection.toArray();
		} else {
			items = [];
		}
		enumerable = new Enumerable(items);
		
		/**
 		 * Adds the specified item to the end of the list
		 */
		this.add = function(item) {
			items.push(item);
		};
		
		/**
		 * Retrieves the element at the specified index
		 */
		this.item = function(index) {
			if (index < 0 || index > items.length - 1) {
				throw new ArgumentOutOfRangeException("index");
			}
			return items[index];
		}
		
		/**
		 * Sets the element at the specified index
		 */
		this.set = function(index, value) {
			if (index < 0 || index > items.length - 1) {
				throw new ArgumentOutOfRangeException("index");
			}
			items[index] = value;
		}
		
		/**
		 * Adds the elements of the specified collection to the end of the list
		 */
		this.addRange = function(collection) {	
			var enumerator = collection.getEnumerator();
			while (enumerator.moveNext()) {
				items.push(enumerator.current());
			}
		};
		
		/**
		 * Return a read-only list wrapper for the current collection
		 */
		this.asReadOnly = function() {
			return new ReadOnlyCollection(this);
		};
		
		/**
		 * Searches a sorted list for the given element
		 *
		 * Overloads:
		 *  binarySearch(item)
		 *  binarySearch(item, comparer)
		 *  binarySearch(index, count, item, comparer)			 
		 */
		this.binarySearch = function() {
			var item;
			var comparer = Comparer.getDefault();
			var index = 0;
			var count = items.length;
			
			switch (arguments.length) {
				case 1:
					item = arguments[0];
					break;
				case 2:
					item = arguments[0];
					comparer = arguments[1];
					break;
				case 4:
					index = arguments[0];
					count = arguments[1];
					item = arguments[2];
					comparer = arguments[3];					
					break;
			}
			if (typeof comparer == "function") {
				comparer = Comparer.fromFunction(comparer);
			}			
			
			if (count == 0) {
				return ~count;
			} else if (count == 1) {
				if (comparer.compare(item, items[0]) == 0) {
					return 0;
				} else {
					return ~count;
				}
			}
			var left = index;
			var right = index + count - 1;
			
			var middle;
			var comparison;
			while (left <= right) {
				middle = parseInt((left + right) / 2);
				comparison = comparer.compare(item, items[middle]);
				if (comparison > 0) {
					left = middle + 1;
				} else if (comparison < 0) {
					right = middle - 1;
				} else {
					return middle;
				}
			}
			return ~left;
		};
		
		/**
		 * Empties the list
		 */
		this.clear = function() {
			items.length = 0;
		};
		
		/**
		 * Copies a range of elements from the list to the specified array
		 *
		 * Overloads:
		 *   copyTo(array)
		 *   copyTo(array, arrayIndex)
		 *   copyTo(index, array, arrayIndex, count)
		 */
		this.copyTo = function() {
			var array;
			var arrayIndex = 0;
			var index = 0;
			var last = items.length;
			
			switch (arguments.length) {
				case 1:
					array = arguments[0];
					break;
				case 2:
					array = arguments[0];
					arrayIndex = arguments[1];
					break;
				case 4:
					index = arguments[0];
					array = arguments[1];
					arrayIndex = arguments[2];
					last = index + arguments[3];
					break;
			}
			
			if (index < 0 || arrayIndex < 0 || last < 0) {
				throw new ArgumentOutOfRangeException();
			} else if (last > 0 && last > items.length) {
				throw new ArgumentException();
			}
				
			for (var i = index; i < last; i++, arrayIndex++) {
				array[arrayIndex] = items[i];
			}
		};
		
		/**
		 * Returns a boolean value indicating whether the list contains any
		 * elements satisfying the condition defined by the given predicate
		 * function
		 */
		this.exists = function(match) {
			for (var i = 0; i < items.length; i++) {
				if (match(items[i])) {
					return true;
				}
			}
			return false;
		};
		
		/**
		 * Returns the first occurrence of an element that satisfies the
		 * condition defined by the given predicate
		 */
		this.find = function(match) {
			var index = this.findIndex(match);
			if (index >= 0) {
				return items[index];
			} else {
				return null;
			}
		};
		
		/**
		 * Retrieves all the elements from the list that satisfy the condtion
		 * defined by the given predicate
		 */
		this.findAll = function(match) {
			var results = new List();
			for (var i = 0; i < items.length; i++) {
				if (match(items[i])) {
					results.add(items[i]);
				}
			}
			return results;			
		};
		
		/**
		 * Returns the index of the first element in the list that satisfies
		 * the condition defined by the given predicate
		 * 
		 * Overloads:
		 *   findIndex(predicate)
		 *   findIndex(startIndex, predicate)
		 *   findIndex(startIndex, count, predicate)
		 */
		this.findIndex = function() {
			var match = null;
			var startIndex = 0;
			var endIndex = 0;
			var count = items.length;
			
			switch (arguments.length) {
				case 1:
					match = arguments[0];
					break;
				case 2:
					startIndex = arguments[0];
					count = items.length - startIndex;
					match = arguments[1];
					break;
				case 3:
					startIndex = arguments[0];
					count = arguments[1];
					match = arguments[2];
					break;
			}
			
			if (startIndex < 0 || (items.length > 0 && 
				startIndex >= items.length) || count < 0 ||
				startIndex + count < 0 || startIndex + count > items.length) {
				throw new ArgumentOutOfRangeException();
			}

			endIndex = Math.min(items.length, startIndex + count);
			
			for (var i = startIndex; i < endIndex; i++) {
				if (match(items[i])) {
					return i;
				}
			}
			return -1;			
		};		
		
		/**
		 * Returns the last occurrence of an element that satisfies the
		 * condition defined by the given predicate
		 */
		this.findLast = function(match) {
			var index = this.findLastIndex(match);
			if (index >= 0) {
				return items[index];
			} else {
				return null;
			}			
		};
		
		/**
		 * Returns the index of the last element in the list that satisfies
		 * the condition defined by the given predicate
		 * 
		 * Overloads:
		 *   findLastIndex(predicate)
		 *   findLastIndex(startIndex, predicate)
		 *   findLastIndex(startIndex, count, predicate)
		 */
		this.findLastIndex = function() {
			var match = null;
			var startIndex = 0;
			var endIndex = 0;
			var count = items.length;
			
			switch (arguments.length) {
				case 1:
					match = arguments[0];
					break;
				case 2:
					startIndex = arguments[0];
					count = items.length - startIndex;
					match = arguments[1];
					break;
				case 3:
					startIndex = arguments[0];
					count = arguments[1];
					match = arguments[2];
					break;
			}
			
			if (startIndex < 0 || (items.length > 0 && 
				startIndex >= items.length) || count < 0 ||
				startIndex + count < 0 || startIndex + count > items.length) {
				throw new ArgumentOutOfRangeException();
			}			
			
			endIndex = Math.min(items.length, startIndex + count);
			
			for (var i = endIndex - 1; i >= startIndex; i--) {
				if (match(items[i])) {
					return i;
				}
			}
			return -1;			
		};
		
		/**
		 * Performs the specified action for each element in the list
		 */
		this.forEach = function(action) {
			for (var i = 0; i < items.length; i++) {
				action(items[i]);
			}			
		};
		
		/**
		 * Returns an enumerator that iterates through the list
		 */
		this.getEnumerator = function() {
			return enumerable.getEnumerator();
		};
		
		/**
		 * Extracts a range of elements from the list. The operation performs
		 * a shallow copy of the extracted elements, i.e. reference types
		 * are not cloned.
		 */
		this.getRange = function(index, count) {
			if (index < 0 || index >= items.length) {
				throw new ArgumentOutOfRangeException("index");
			}
			if (index + count > items.length) {
				throw new ArgumentOutOfRangeException("count");
			}
			
			var result = new List();
			var endIndex = index + count;
			for (var i = index; i < endIndex; i++) {
				result.add(items[i]);
			}				
			return result;
		};
		
		/**
		 * Returns the index of the first occurrence of the specified item
		 * in the list or a part thereof
		 *
		 * Overloads:
		 *   indexOf(item)
		 *   indexOf(item, index)
		 *   indexOf(item, index, count)		 
		 */
		this.indexOf = function(item, index, count) {
			var lambda = function(compare) {
				return compare == item;
			};
			
			switch (arguments.length) {
				case 1:
					return this.findIndex(lambda);
				case 2:
					return this.findIndex(index, items.length - index, lambda);
				case 3:
					return this.findIndex(index, count, lambda);
			}
		};
		
		/**
		 * Inserts the specified element into the list at the specified 
		 * position
		 */
		this.insert = function(index, item) {
			if (index < 0 || index > items.length) {
				throw new ArgumentOutOfRangeException("index");
			}
			
			items.splice(index, 0, item);
		};
		
		/**
		 * Inserts the elements in the specified collection into the list at 
		 * the specified position
		 */
		this.insertRange = function(index, collection) {
			if (index < 0 || index > items.length) {
				throw new ArgumentOutOfRangeException("index");
			}			
			
			var enumerator = collection.getEnumerator();
			var offset = 0;
			while (enumerator.moveNext()) {
				items.splice(index + offset, 0, enumerator.current());
				++offset;
			}
		};
		
		/**
		 * Returns the index of the last occurrence of the specified item
		 * in the list or a part thereof
		 *
		 * Overloads:
		 *   lastIndexOf(item)
		 *   lastIndexOf(item, index)
		 *   lastIndexOf(item, index, count)
		 */
		this.lastIndexOf = function(item, index, count) {
			var lambda = function(compare) {
				return compare == item;
			};
			
			switch (arguments.length) {
				case 1:
					return this.findLastIndex(lambda);
				case 2:
					return this.findLastIndex(index, items.length - index, 
						lambda);
				case 3:
					return this.findLastIndex(index, count, lambda);
			}
		};
		
		/**
		 * Removes the specified item from the list. Returns a boolean value
		 * indicating whether the operation was successful
		 */
		this.remove = function(item) {
			var index = this.indexOf(item);
			if (index > -1) {
				items.splice(index, 1);
				return true;
			} else {
				return false;
			}
		};
		
		/**
		 * Removes all the elements from the list that satisfy the condition
		 * defined by the given predicate
		 */
		this.removeAll = function(match) {
			var newArray = [];
			for (var i = 0; i < items.length; i++) {
				if (!match(items[i])) {
					newArray.push(items[i]);
				}
			}	
			var removed = items.length - newArray.length;
			items = newArray;
			enumerable = new Enumerable(items);
			return removed;
		};
		
		/**
		 * Removes the element at the given index from the list
		 */
		this.removeAt = function(index) {
			if (index < 0 || index >= items.length) {
				throw new ArgumentOutOfRangeException("index");
			}
			
			items.splice(index, 1);
		};
		
		/**
		 * Removes a range of elements from the list 
		 */
		this.removeRange = function(index, count) {
			if (index < 0 || index >= items.length) {
				throw new ArgumentOutOfRangeException("index");
			}
			
			if (index + count > items.length) {
				throw new ArgumentOutOfRangeException("count");
			}
			
			items.splice(index, count);
		};
		
		/**
		 * Reverses the order of the elements in the list
		 * 
		 * Overloads:
		 *   reverse()
		 *   reverse(index, count)
		 */
		this.reverse = function() {
			var index = 0;
			var count = items.length;
			
			if (arguments.length == 2) {
				index = arguments[0];
				count = arguments[1];
				var reversed = items.slice(index, index + count).reverse();
				for (var i = 0; i < reversed.length; i++) {
					items.splice(index + i, 1, reversed[i]);
				}
			} else {
				items = items.reverse();
			}
		};
		
		/**
		 * Sorts the elements in the list or a portion thereof
		 * 
		 * Overloads:
		 *   sort()
		 *   sort(comparer)
		 *   sort(index, count, comparer)
		 */
		this.sort = function() {
			var comparer = null;
			var index = 0;
			var count = items.length;
			
			var sortFunction = function(a, b) {
				if (comparer) {
					if (typeof comparer == "function") {
						return comparer(a, b);
					} else {
						return comparer.compare(a, b);
					}
				} else {
					if (b > a) {
						return 1;
					} else if (b == a) {
						return 0;
					} else {
						return -1;
					}
				}
			}
			
			if (arguments.length == 0) {
				comparer = Comparer.getDefault();
				items.sort(sortFunction);
			} else if (arguments.length == 1) {
				comparer = arguments[0];
				items.sort(sortFunction);
			} else if (arguments.length == 3) {
				index = arguments[0];
				count = arguments[1];
				comparer = arguments[2];
				var sorted = items.slice(index, index + count).
					sort(sortFunction);
				for (var i = 0; i < sorted.length; i++) {
					items.splice(index + i, 1, sorted[i]);
				}
			}
		};
		
		/**
		 * Returns an array containing the elements in the list
		 */
		this.toArray = function() {
			var copy = [];
			for (var i = 0; i < items.length; i++) {
				copy.push(items[i]);
			}
			return copy;
		};
		
		/**
		 * Returns a string representing the list
		 */
		this.toString = function() {
			return this.toArray().join(", ");			
		};
		
		/**
		 * Indicates whether this list is read-only
		 */
		this.isReadOnly = function() {
			return false;
		};
		
		/**
		 * Returns true if all elements in the list satisfy the condition
		 * defined by the given predicate
		 */
		this.trueForAll = function(match) {
			if (items.length == 0) {
				return false;
			}
			
			for (var i = 0; i < items.length; i++) {
				if (!match(items[i])) {
					return false;
				}
			}
			return true;
		};
	};
	List.prototype = Enumerable.prototype;
	
	/**
	 * A collection of items that cannot be modified
	 * @constructor
	 */
	var ReadOnlyCollection = function(list) {
		// Forward all supported methods
		this.contains = function(value) {
			return list.contains(value);
		};		
		
		this.copyTo = function(array, index) {
			return list.copyTo(array, index);
		};		
		
		this.count = function() {
			return list.count();
		};

		this.getEnumerator = function() {
			return list.getEnumerator();
		};		
		
		this.indexOf = function(value) {
			return list.indexOf(value);
		};		
		
		this.item = function() {
			return list.item();
		};
		
		this.toString = function() {
			return list.toString();
		};		
		
		this.isReadOnly = function() {
			return true;
		};
		
		// Throw an exception when invoking any one of the mutating methods
		this.add = this.clear = this.insert = this.remove = this.removeAt = 
			function() {
				throw new NotSupportedException();
			};
	};
	ReadOnlyCollection.prototype = Enumerable.prototype;
	
	/**
	 * Represents a collection of elements with a common key
	 * @constructor
	 */
	var Grouping = function(key, enumerable) {
		var items = [];
		if (!enumerable) {
			enumerable = new Enumerable(items);
		} else {
			items = null;
		}
		
		/**
		 * Retrieves the key of the grouping element
		 */
		this.key = key;
		
		// For backwards compatibility with JSINQ 1.0
		this.getKey = function() {
			return this.key;
		};
	
		// Used internally
		this.add = function(item) {
			items.push(item);
		};
	
		/**
		 * Returns an enumerator that iterates through the elements associated
		 * with this grouping
		 */
		this.getEnumerator = function() {
			return enumerable.getEnumerator();	
		};
	};
	Grouping.prototype = Enumerable.prototype;	
	
	/**
	 * Maps keys to enumerable sequences of values
	 * @constructor
	 */	
	var Lookup = function(comparer) {
		var dictionary;

		if (comparer) {
			dictionary = new Dictionary(comparer);
		} else {
			dictionary = new Dictionary();
		}
		
		// Used internally			
		this.add = function(item) {
			dictionary.add(item.key, item);
		};
		
		/**
		 * Applies a transform function to each key and its associated values 
		 * and returns the results
		 */		
		this.applyResultSelector = function(resultSelector) {
			var _this = this;
			
			var func = function() {
				this.getEnumerator = function() {
					return new function() {
						var groupEnumerator = _this.getEnumerator();
						var itemEnumerator = null;
						var currentKey;
						
						this.moveNext = function() {
							if (itemEnumerator == null || 
								!itemEnumerator.moveNext()) {
								if (groupEnumerator.moveNext()) {
									currentKey = groupEnumerator.current().key;
									itemEnumerator = 
										groupEnumerator.current().
										getEnumerator();
									return itemEnumerator.moveNext();
								} else {
									itemEnumerator = null;
									return false;
								}
							}
							return true;							
						};
						
						this.current = function() {
							if (itemEnumerator == null) {
								throw new InvalidOperationException();
							}
							return resultSelector(currentKey, 
								itemEnumerator.current());
						};			
						
						this.reset = function() {
							groupEnumerator.reset();
							itemEnumerator = null;
						};		
					};
				};
			};
			func.prototype = Enumerable.prototype;
			return new func();		
		};
		
		/**
		 * Determines whether the specified key exists in the lookup
		 */		
		this.contains = function(key) {
			return dictionary.containsKey(key);
		};
		
		/**
		 * Retrieves the Enumerable sequence of values associated with the
		 * specified key
		 */		
		 this.item = function(key) {
			 return dictionary.item(key);
		 };
		
		/**
		 * Returns the number of key/value collection pairs in the lookup
		 */				
		this.count = function() {
			return dictionary.count();
		};
		
		/**
		 * Retrieves the enumerator that iterates through the contents of
		 * this lookup
		 */
		this.getEnumerator = function() {
			return dictionary.values().getEnumerator();
		};
	};
	Lookup.prototype = Enumerable.prototype;
	
	// Public exports
	this.InvalidOperationException = InvalidOperationException;
	this.ArgumentException = ArgumentException;
	this.ArgumentOutOfRangeException = ArgumentOutOfRangeException;
	this.KeyNotFoundException = KeyNotFoundException;
	this.NotSupportedException = NotSupportedException;
	this.EqualityComparer = EqualityComparer;
	this.Comparer = Comparer;
	this.Enumerable = Enumerable;
	this.Dictionary = Dictionary;
	this.List = List;
	this.ReadOnlyCollection = ReadOnlyCollection;
	this.Grouping = Grouping;
	this.Lookup = Lookup;
}).call(jsinq);