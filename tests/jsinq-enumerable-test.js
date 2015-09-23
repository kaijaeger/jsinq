/* 
 * JSINQ, JavaScript integrated query
 * Copyright (c) 2010 Kai Jäger. Some rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the license.txt file. 
 */

// Test data
var TEST_SCALAR = 2151352362;
var TEST_OTHER_SCALAR = 9329552521;
var TEST_ARRAY = [99, 44, 11, 9, 4, 14, 94, 29, 1, 0];
var TEST_ARRAY_DISJOINT = [6, 37, 111, 25, 3, 808, 65, 55, 1074, 5];

var TEST_DATA = [
	{firstname: "Bob", lastname: "Carlson", age: 37},
	{firstname: "Pete", lastname: "Jackson", age: 19},
	{firstname: "Cindy", lastname: "Smith", age: 48},
	{firstname: "Alice", lastname: "Wilkinson", age: 55},
	{firstname: "Frank", lastname: "McGee", age: 7},
	{firstname: "Joanne", lastname: "Jackson", age: 65},
	{firstname: "Marcy", lastname: "Goldberg", age: 24},
	{firstname: "Keith", lastname: "Wade", age: 26},
	{firstname: "Jonathan", lastname: "Hill", age: 33},
	{firstname: "Aaron", lastname: "Lamar", age: 9}
];

var TEST_PREDICATE = function(item) {
	return item > 100;	
};

var TEST_COMPARER = {
	equals: function(a, b) {
		return a.age == b.age;
	}
};

var TEST_PREDICATE_PASS_ARRAY = [101, 299, 877, 999, 101, 305, 593, 888];
var TEST_PREDICATE_FAIL_ARRAY = [17, 44, 9, 17, 93, 8, 11, 7, 4];
var TEST_PREDICATE_PASS_SINGLETON_ARRAY = [133];
var TEST_PREDICATE_FAIL_SINGLETON_ARRAY = [15];

new Test.Unit.Runner({
	// jsinq.EqualityComparer
	testEqualityComparer: function() {
		var _this = this;
		
		var testComparer = function(comparer) {
			_this.assert(comparer.equals(TEST_SCALAR, TEST_SCALAR));
			_this.assert(!comparer.equals(TEST_SCALAR, 0));
		};
		
		testComparer(new jsinq.EqualityComparer());
		testComparer(jsinq.EqualityComparer.getDefault());
	},
	
	// See item # 2936, reported by ndaz5
	testEqualityComparer_5326: function() {
		var equals = function(a, b) { return a == b; };
		var comparer = jsinq.EqualityComparer.fromFunction(equals);
		this.assert(comparer.equals == equals);
	},
	
	// jsinq.Comparer
	testComparer: function() {
		var _this = this;
		
		var testComparer = function(comparer) {
			_this.assertEqual(0, comparer.compare(TEST_SCALAR, TEST_SCALAR));
			_this.assert(comparer.compare(-100, 100) < 0);
			_this.assert(comparer.compare(100, -100) > 0);
		};
		
		testComparer(new jsinq.Comparer());
		testComparer(jsinq.Comparer.getDefault());
	},	
	
	// jsinq.Enumerable constructor
	testEmptyEnumerable: function() {		
		var _this = this;
		
		var enumerable = new jsinq.Enumerable();
		var enumerator = enumerable.getEnumerator();

		var testEmptyEnumerator = function(enumerator) {
			_this.assert(!enumerator.moveNext());
			_this.assertRaise(jsinq.InvalidOperationException.prototype.name,
				function() { enumerator.current(); });
		};

		testEmptyEnumerator(enumerator);		
		enumerator.reset();
		testEmptyEnumerator(enumerator);
	},
	
	// jsinq.Enumerable constructor
	testSingletonEnumerable: function() {
		var _this = this;
		var enumerable = new jsinq.Enumerable(TEST_SCALAR);
		var enumerator = enumerable.getEnumerator();
		
		var testSingletonEnumerator = function(enumerator, value) {
			_this.assert(enumerator.moveNext());
			_this.assertNothingRaised(function() { enumerator.current(); });
			var current = enumerator.current();
			_this.assertEqual(value, current);
			_this.assert(!enumerator.moveNext());
			_this.assertRaise(jsinq.InvalidOperationException.prototype.name,
				function() { enumerator.current(); });		
		};
		
		testSingletonEnumerator(enumerator, TEST_SCALAR);
		enumerator.reset();
		testSingletonEnumerator(enumerator, TEST_SCALAR);
	},
	
	// jsinq.Enumerable constructor
	testArrayEnumerable: function() {
		var _this = this;
		var enumerable = new jsinq.Enumerable(TEST_ARRAY);
		var enumerator = enumerable.getEnumerator();
		
		var testArrayEnumerator = function(enumerator, array) {
			var count = 0;
			while (enumerator.moveNext()) {
				_this.assertNothingRaised(function() { 
					enumerator.current(); 
				});
				var current = enumerator.current();
				_this.assertEqual(array[count], current);
				++count;
			}
			_this.assertEqual(array.length, count);
			_this.assert(!enumerator.moveNext());
			_this.assertRaise(jsinq.InvalidOperationException.prototype.name,
				function() { enumerator.current(); });		
		};
		
		testArrayEnumerator(enumerator, TEST_ARRAY);
		enumerator.reset();
		testArrayEnumerator(enumerator, TEST_ARRAY);
	},
	
	// jsinq.Enumerable constructor
	testNodeListEnumerable: function() {
		var _this = this;
		var node = document.createElement("div");
		for (var i = 0; i < TEST_ARRAY.length; i++) {
			var childNode = document.createElement("span");
			childNode.appendChild(document.createTextNode(TEST_ARRAY[i]));
			node.appendChild(childNode);
		}
		
		var enumerable = new jsinq.Enumerable(node.childNodes);
		var enumerator = enumerable.getEnumerator();
		
		var testNodeListEnumerator = function(enumerator, nodeList) {
			var count = 0;
			while (enumerator.moveNext()) {
				_this.assertNothingRaised(function() { 
					enumerator.current(); 
				});
				var current = enumerator.current();
				_this.assertEqual(current, nodeList[count]);
				_this.assertEqual(current.firstChild.nodeValue, 
					nodeList[count].firstChild.nodeValue);
				++count;
			}
			_this.assertEqual(nodeList.length, count);
			_this.assert(!enumerator.moveNext());
			_this.assertRaise(jsinq.InvalidOperationException.prototype.name,
				function() { enumerator.current(); });		
		};
		
		testNodeListEnumerator(enumerator, node.childNodes);
		enumerator.reset();
		testNodeListEnumerator(enumerator, node.childNodes);		
	},
	
	// jsinq.Enumerable.aggregate
	testAggregate: function() {
		var aggregateFunction = function(a, b) {
			return a + b;
		};
		
		var enumerable = new jsinq.Enumerable();
		
		this.assertRaise(jsinq.InvalidOperationException.prototype.name, 
			function() { enumerable.aggregate(aggregateFunction) });
		this.assertEqual(TEST_SCALAR, enumerable.aggregate(
			TEST_SCALAR, aggregateFunction));
		
		enumerable = new jsinq.Enumerable(TEST_ARRAY);
		var sum = 0;
		for (var i = 0; i < TEST_ARRAY.length; i++) {
			sum += TEST_ARRAY[i];
		}
		
		var calculatedSum = enumerable.aggregate(aggregateFunction);
		
		this.assertEqual(sum, calculatedSum);
		
		calculatedSum = enumerable.aggregate(TEST_SCALAR, aggregateFunction);
		
		this.assertEqual(sum + TEST_SCALAR, calculatedSum);
		
		var calculatedAverage = enumerable.aggregate(TEST_SCALAR, 
			aggregateFunction, function(result) { 
				return result / TEST_ARRAY.length; 
			}
		);
			
		this.assertEqual((TEST_SCALAR + sum) / TEST_ARRAY.length, 
			calculatedAverage);
	},
	
	// See item # 2936, reported by xanatos
	testAggregate_2936: function() {
		var aggregateFunction = function(a, b) { return a; };
		var resultSelector = function(a) { return a; };
		
		this.assertNothingRaised(function() {
			var enumerable = new jsinq.Enumerable();
			enumerable.aggregate(123, aggregateFunction);
		});
		
		this.assertNothingRaised(function() {
			var enumerable = new jsinq.Enumerable();
			enumerable.aggregate(123, aggregateFunction, resultSelector);
		});
	},
		
	// jsinq.Enumerable.all
	testAll: function() {
		var empty = new jsinq.Enumerable();
		
		this.assert(empty.all(TEST_PREDICATE));	
		
		var passList = new jsinq.Enumerable(TEST_PREDICATE_PASS_ARRAY);
		var failList = new jsinq.Enumerable(TEST_PREDICATE_FAIL_ARRAY);
		var singletonPassList = new jsinq.Enumerable(
			TEST_PREDICATE_PASS_SINGLETON_ARRAY);
		var singletonFailList = new jsinq.Enumerable(
			TEST_PREDICATE_FAIL_SINGLETON_ARRAY);
				
		this.assert(passList.all(TEST_PREDICATE));
		this.assert(!failList.all(TEST_PREDICATE));
		
		this.assert(singletonPassList.all(TEST_PREDICATE));
		this.assert(!singletonFailList.all(TEST_PREDICATE));
	},
	
	// jsinq.Enumerable.any
	testAny: function() {
		var empty = new jsinq.Enumerable();
		
		this.assert(!empty.any());
		this.assert(!empty.any(TEST_PREDICATE));
		
		var passList = new jsinq.Enumerable(TEST_PREDICATE_PASS_ARRAY);
		var failList = new jsinq.Enumerable(TEST_PREDICATE_FAIL_ARRAY);
		var singletonPassList = new jsinq.Enumerable(
			TEST_PREDICATE_PASS_SINGLETON_ARRAY);
		var singletonFailList = new jsinq.Enumerable(
			TEST_PREDICATE_FAIL_SINGLETON_ARRAY);
		
		this.assert(passList.any());
		this.assert(singletonPassList.any());
		
		this.assert(passList.any(TEST_PREDICATE));
		this.assert(!failList.any(TEST_PREDICATE));
		
		this.assert(singletonPassList.any(TEST_PREDICATE));
		this.assert(!singletonFailList.any(TEST_PREDICATE));		
	},
	
	// jsinq.Enumerable.average
	testAverage: function() {
		var enumerable = new jsinq.Enumerable();
		
		this.assertRaise(jsinq.InvalidOperationException.prototype.name, 
			function() { enumerable.average() });
		this.assertRaise(jsinq.InvalidOperationException.prototype.name, 
			function() { enumerable.average(
				function (item) { 
					return item; 
				}) 
			}
		);
			
		var average = 0;
		for (var i = 0; i < TEST_ARRAY.length; i++) {
			average += TEST_ARRAY[i];
		}
		average /= TEST_ARRAY.length;
		
		enumerable = new jsinq.Enumerable(TEST_ARRAY);
		
		var compuatedAverage = enumerable.average();		
		this.assertEqual(average, compuatedAverage);
		
		compuatedAverage = enumerable.average(function(item) { 
			return item; 
		});
		this.assertEqual(average, compuatedAverage);
	},
	
	// jsinq.Enumerable.concat
	testConcat: function() {
		var first = new jsinq.Enumerable();
		var second = new jsinq.Enumerable();
		
		var concatenated = first.concat(second);		
		this.assert(!concatenated.any());
		
		first = new jsinq.Enumerable(TEST_SCALAR);
		concatenated = first.concat(second);
		var enumerator = concatenated.getEnumerator();
		this.assert(enumerator.moveNext());
		this.assert(enumerator.current() == TEST_SCALAR);		
		this.assert(!enumerator.moveNext());
		genericTestEnumerable.call(this, concatenated);
		
		first = new jsinq.Enumerable();
		second = new jsinq.Enumerable(TEST_SCALAR);
		concatenated = first.concat(second);
		var enumerator = concatenated.getEnumerator();
		this.assert(enumerator.moveNext());
		this.assert(enumerator.current() == TEST_SCALAR);		
		this.assert(!enumerator.moveNext());
		genericTestEnumerable.call(this, concatenated);		
		
		first = new jsinq.Enumerable(TEST_ARRAY);
		second = new jsinq.Enumerable(TEST_PREDICATE_PASS_ARRAY);
		concatenated = first.concat(second);
		enumerator = concatenated.getEnumerator();
		var count = 0;
		while (enumerator.moveNext()) {
			var current;
			this.assertNothingRaised(function() { 
				current = enumerator.current(); 
			});
			if (count < TEST_ARRAY.length) {
				this.assertEqual(TEST_ARRAY[count], current);
			} else {
				this.assertEqual(
					TEST_PREDICATE_PASS_ARRAY[count - TEST_ARRAY.length], 
					current);
			}
			++count;
		}
		this.assertEqual(TEST_ARRAY.length + TEST_PREDICATE_PASS_ARRAY.length, 
			count);
		genericTestEnumerable.call(this, concatenated);
	},
	
	
	// jsinq.Enumerable.contains
	testContains: function() {
		var enumerable = new jsinq.Enumerable();
		this.assert(!enumerable.contains(TEST_SCALAR));
		
		enumerable = new jsinq.Enumerable(TEST_ARRAY);
		for (var i = 0; i < TEST_ARRAY.length; i++) {
			this.assert(enumerable.contains(TEST_ARRAY[i]));
		}
		
		for (i = 0; i < TEST_ARRAY_DISJOINT.length; i++) {
			this.assert(!enumerable.contains(TEST_ARRAY_DISJOINT[i]));
		}		
		
		enumerable = new jsinq.Enumerable(TEST_DATA);
		
		for (i = 0; i < TEST_DATA.length; i++) {
			this.assert(enumerable.contains(TEST_DATA[i], TEST_COMPARER));
		}		
	},
	
	// jsinq.Enumerable.count
	testCount: function() {
		var enumerable = new jsinq.Enumerable();
		this.assertEqual(enumerable.count(), 0);
		this.assertEqual(0, enumerable.count(TEST_PREDICATE));
		
		enumerable = new jsinq.Enumerable(TEST_SCALAR);
		this.assertEqual(1, enumerable.count());
		
		enumerable = new jsinq.Enumerable(TEST_ARRAY);
		this.assertEqual(TEST_ARRAY.length, enumerable.count());
		
		enumerable = new jsinq.Enumerable(TEST_PREDICATE_PASS_ARRAY);
		this.assertEqual(TEST_PREDICATE_PASS_ARRAY.length, enumerable.count(
			TEST_PREDICATE));

		enumerable = new jsinq.Enumerable(TEST_PREDICATE_FAIL_ARRAY);
		this.assertEqual(0, enumerable.count(TEST_PREDICATE));

		enumerable = new jsinq.Enumerable(
			TEST_PREDICATE_PASS_SINGLETON_ARRAY).concat(
			new jsinq.Enumerable(TEST_PREDICATE_FAIL_SINGLETON_ARRAY));
		this.assertEqual(1, enumerable.count(TEST_PREDICATE));
	},
	
	// jsinq.Enumerable.defaultIfEmpty
	testDefaultIfEmpty: function() {
		var enumerable = new jsinq.Enumerable();
		var defaultEnumerable = enumerable.defaultIfEmpty(TEST_SCALAR);
		this.assertEqual(defaultEnumerable.count(), 1);
		var enumerator = defaultEnumerable.getEnumerator();
		this.assert(enumerator.moveNext());
		this.assertEqual(enumerator.current(), TEST_SCALAR);
		this.assert(!enumerator.moveNext());
		genericTestEnumerable.call(this, defaultEnumerable);
		
		var enumerable = new jsinq.Enumerable(TEST_ARRAY);
		this.assertEqual(enumerable, enumerable.defaultIfEmpty(TEST_SCALAR));
	},
	
	// jsinq.Enumerable.distinct
	testDistinct: function() {
		var enumerable = new jsinq.Enumerable();
		this.assertEqual(0, enumerable.distinct().count());
		this.assertEqual(0, enumerable.distinct(TEST_COMPARER).count());
		
		enumerable = new jsinq.Enumerable(TEST_DATA).concat(
			new jsinq.Enumerable(TEST_DATA));
		this.assertEqual(TEST_DATA.length, enumerable.distinct().count());
		this.assertEqual(TEST_DATA.length, 
			enumerable.distinct(TEST_COMPARER).count());
		
		var array = [];
		for (var i = 0; i < 10; i++) {
			array.push(i);
			array.push(i);
		}
		enumerable = new jsinq.Enumerable(array).distinct();
		this.assertEqual(array.length / 2, enumerable.count());
		var expected = 0;
		var enumerator = enumerable.getEnumerator();
		while (enumerator.moveNext()) {
			this.assertEqual(expected++, enumerator.current());
		}
		genericTestEnumerable.call(this, enumerable);
	},
	
	// jsinq.Enumerable.elementAt
	testElementAt: function() {
		var enumerable = new jsinq.Enumerable();	
		this.assertRaise(jsinq.ArgumentOutOfRangeException.prototype.name, 
			function() { enumerable.elementAt(0); });
			
		enumerable = new jsinq.Enumerable(TEST_SCALAR);
		this.assertEqual(TEST_SCALAR, enumerable.elementAt(0));
		this.assertRaise(jsinq.ArgumentOutOfRangeException.prototype.name, 
			function() { enumerable.elementAt(1); });
			
		var array = [];
		for (var i = 0; i < 10; i++) {
			array.push(i);
		}
		enumerable = new jsinq.Enumerable(array);
		for (var i = 0; i < 10; i++) {
			this.assertEqual(i, enumerable.elementAt(i));
		}		
		this.assertRaise(jsinq.ArgumentOutOfRangeException.prototype.name, 
			function() { enumerable.elementAt(11); });
		this.assertRaise(jsinq.ArgumentOutOfRangeException.prototype.name, 
			function() { enumerable.elementAt(-1); });
	},
	
	// jsinq.Enumerable.elementAtOrDefault
	testElementAtOrDefault: function() {
		var enumerable = new jsinq.Enumerable();	
		this.assertEqual(TEST_SCALAR, enumerable.elementAtOrDefault(0, 
			TEST_SCALAR));

		var array = [];
		for (var i = 0; i < 10; i++) {
			array.push(i);
		}
		enumerable = new jsinq.Enumerable(array);
		for (var i = 0; i < 10; i++) {
			this.assertEqual(i, enumerable.elementAtOrDefault(i, TEST_SCALAR));
		}		
		this.assertEqual(TEST_SCALAR, enumerable.elementAtOrDefault(-1, 
			TEST_SCALAR));
		this.assertEqual(TEST_SCALAR, enumerable.elementAtOrDefault(11, 
			TEST_SCALAR));
	},
	
	// jsinq.Enumerable.empty
	testEmpty: function() {
		var _this = this;
		
		var enumerable = jsinq.Enumerable.empty();
		var enumerator = enumerable.getEnumerator();

		var testEmptyEnumerator = function(enumerator) {
			_this.assert(!enumerator.moveNext());
			_this.assertRaise(jsinq.InvalidOperationException.prototype.name,
				function() { enumerator.current(); });
		};

		testEmptyEnumerator(enumerator);		
		enumerator.reset();
		testEmptyEnumerator(enumerator);
	},
	
	// jsinq.Enumerable.except
	testExcept: function() {
		var first = new jsinq.Enumerable(TEST_ARRAY);
		var second = new jsinq.Enumerable();
		this.assertEqual(TEST_ARRAY.length, first.except(second).count());
		this.assertEqual(0, second.except(first).count());
		
		var firstArray = [];
		var secondArray = [];
		for (var i = 0; i < 20; i++) {
			firstArray.push(i);			
			if (i % 2 == 0) {
				secondArray.push(i);
			}
		}
		first = new jsinq.Enumerable(firstArray);
		second = new jsinq.Enumerable(secondArray);
		var except = first.except(second);
		this.assertEqual(10, except.count());
		var enumerator = except.getEnumerator();
		var expect = 1;
		while (enumerator.moveNext()) {
			this.assertEqual(expect, enumerator.current());
			expect += 2;
		}
		genericTestEnumerable.call(this, except);
	},
	
	// jsinq.Enumerable.first
	testFirst: function() {
		var enumerable = new jsinq.Enumerable();
		this.assertRaise(jsinq.InvalidOperationException.prototype.name,
				function() { enumerable.first(); });
		enumerable = new jsinq.Enumerable(TEST_SCALAR);
		this.assertEqual(TEST_SCALAR, enumerable.first());
		
		var array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
		enumerable = new jsinq.Enumerable(array);
		this.assertEqual(array[0], enumerable.first());
		for (var i = 0; i < array.length; i++) {
			this.assertEqual(i, enumerable.first(function(element) {
				return element == i;
			}));
		}
	},
	
	// jsinq.Enumerable.firstOrDefault
	testFirstOrDefault: function() {
		var enumerable = new jsinq.Enumerable();	
		this.assertEqual(TEST_SCALAR, enumerable.firstOrDefault(TEST_SCALAR));
		enumerable = new jsinq.Enumerable(TEST_PREDICATE_PASS_ARRAY);	
		this.assertEqual(TEST_PREDICATE_PASS_ARRAY[0], 
			enumerable.firstOrDefault(TEST_SCALAR));		
		this.assertEqual(TEST_PREDICATE_PASS_ARRAY[0], 
			enumerable.firstOrDefault(TEST_PREDICATE, TEST_SCALAR));
		enumerable = new jsinq.Enumerable(TEST_PREDICATE_FAIL_ARRAY);	
		this.assertEqual(TEST_SCALAR, enumerable.firstOrDefault(TEST_PREDICATE, 
			TEST_SCALAR));
	},
	
	// jsinq.Enumerable.groupBy
	testGroupBy: function() {
		var enumerable = new jsinq.Enumerable();	
		var grouped = enumerable.groupBy(function(item) { return item; });
		this.assertEqual(0, grouped.count());
		
		var array = [];
		var arrayComplexKey = [];
		
		for (var i = 0; i < 10; i++) {
			for (var j = 0; j < 10; j++) {
				array.push({
					key: i,
					value: j
				});			
				arrayComplexKey.push({
					key: {keyValue: i},
					value: j
				});							
			}
		}
		
		var keySelector = function(item) {
			return item.key;
		};
		
		var comparer = {
			equals: function(a, b) {
				return a.keyValue == b.keyValue;
			}
		};
		
		enumerable = new jsinq.Enumerable(array[0]);
		grouped = enumerable.groupBy(keySelector);
		this.assertEqual(1, grouped.count());
		this.assertEqual(0, grouped.first().getKey());
		
		enumerable = new jsinq.Enumerable(array);
		grouped = enumerable.groupBy(keySelector);
		this.assertEqual(10, grouped.count());
		
		var enumerator = grouped.getEnumerator();
		var index = 0;
		while (enumerator.moveNext()) {
			var current = enumerator.current();
			genericTestEnumerable.call(this, current, false);
			this.assertEqual(index++, current.getKey());
			var childEnumerator = current.getEnumerator();
			var childIndex = 0;
			while (childEnumerator.moveNext()) {
				this.assertEqual(childIndex++, 
					childEnumerator.current().value);
			}
			genericTestEnumerable.call(this, grouped, false);
		}
		genericTestEnumerable.call(this, grouped, false);
		
		enumerable = new jsinq.Enumerable(arrayComplexKey);
		grouped = enumerable.groupBy(keySelector, comparer);
		this.assertEqual(10, grouped.count());			
		
		enumerable = new jsinq.Enumerable(array);
		grouped = enumerable.groupBy(keySelector, function(item) {
			return item.value + 1;
		});
		this.assertEqual(10, grouped.count());						
		
		enumerable = new jsinq.Enumerable(array);
		grouped = enumerable.groupBy(keySelector, function(key, children) {
			return key.keyValue;
		});
		this.assertEqual(10, grouped.count());				
		
		enumerable = new jsinq.Enumerable(arrayComplexKey);
		grouped = enumerable.groupBy(keySelector, function(key, children) {
			return key.keyValue;
		}, comparer);
		this.assertEqual(10, grouped.count());			
		
		enumerable = new jsinq.Enumerable(arrayComplexKey);
		grouped = enumerable.groupBy(keySelector, function(item) {
			return item.value + 1;
		}, comparer);
		this.assertEqual(10, grouped.count());				
		
		enumerable = new jsinq.Enumerable(array);
		grouped = enumerable.groupBy(keySelector, function(item) {
			return item.value + 1;
		}, function(key, children) {
			return key;
		});
		this.assertEqual(10, grouped.count());	
		
		enumerable = new jsinq.Enumerable(arrayComplexKey);
		grouped = enumerable.groupBy(keySelector, function(item) {
			return item.value + 1;
		}, function(key, children) {
			return key.keyValue;
		}, comparer);
		this.assertEqual(10, grouped.count());									
	},
	
	// jsinq.Enumerable.groupJoin
	testGroupJoin: function() {
		var identity = function(item) {
			return item;
		};
		var first = new jsinq.Enumerable();
		var second = new jsinq.Enumerable();	
		var joined = first.groupJoin(second, identity, identity, identity);
		this.assertEqual(0, joined.count());
		genericTestEnumerable.call(this, joined);
		
		var firstArray = [];
		var secondArray = [];
		for (var i = 0; i < TEST_ARRAY.length; i++) {
			firstArray.push({
				key: TEST_ARRAY[i],
				value: i
			});
			secondArray.push({
				key: TEST_ARRAY[TEST_ARRAY.length - 1 - i],
				value: TEST_ARRAY.length - 1 - i
			});
		}
		var keySelector = function(item) {
			return item.key;
		};
		var resultSelector = function(item, subItems) {
			if (subItems.count() == 1) {
				return item.value == subItems.first().value;
			} else {
				return false;
			}
		};
		
		first = new jsinq.Enumerable(firstArray);
		joined = first.groupJoin(second, keySelector, keySelector, 
			resultSelector);
		this.assertEqual(firstArray.length, joined.count());
		genericTestEnumerable.call(this, joined);		
		
		second = new jsinq.Enumerable(secondArray);
		joined = first.groupJoin(second, keySelector, keySelector, 
			resultSelector);
		this.assertEqual(firstArray.length, joined.count());
		
		var enumerator = first.getEnumerator();
		while (enumerator.moveNext()) {
			var current = enumerator.current();
			this.assert(current);
		}
		genericTestEnumerable.call(this, joined);
		
		joined = first.groupJoin(second, identity, identity, resultSelector,
			{
				equals: function(a, b) {
					return a.value == b.value;
				}
			}
		);
		this.assertEqual(firstArray.length, joined.count());		
		genericTestEnumerable.call(this, joined);
	},
	
	// jsinq.Enumerable.intersect
	testIntersect: function() {
		var first = new jsinq.Enumerable();
		var second = new jsinq.Enumerable();
		var intersection = first.intersect(second);
		this.assertEqual(0, intersection.count());
		genericTestEnumerable.call(this, intersection);
		
		first = new jsinq.Enumerable(TEST_ARRAY);
		second = new jsinq.Enumerable(TEST_ARRAY);
		intersection = first.intersect(second);
		this.assertEqual(TEST_ARRAY.length, intersection.count());
		genericTestEnumerable.call(this, intersection);
		
		second = new jsinq.Enumerable(TEST_ARRAY_DISJOINT);
		intersection = first.intersect(second);
		this.assertEqual(0, intersection.count());
		genericTestEnumerable.call(this, intersection);
		
		var firstArray = [1, 2, 3, 4, 5, 6, 7, 8, 9];
		var secondArray = [4, 5, 6, 17, 88];
		first = new jsinq.Enumerable(firstArray);
		second = new jsinq.Enumerable(secondArray);		
		intersection = first.intersect(second);
		this.assertEqual(3, intersection.count());
		genericTestEnumerable.call(this, intersection);
		var enumerator = intersection.getEnumerator();
		var index = 0;
		while (enumerator.moveNext()) {
			this.assertEqual(secondArray[index++], enumerator.current());
		}
		
		first = new jsinq.Enumerable(TEST_DATA);
		second = new jsinq.Enumerable(TEST_DATA);
		intersection = first.intersect(second, TEST_COMPARER);
		this.assertEqual(TEST_DATA.length, intersection.count());
		genericTestEnumerable.call(this, intersection);
	},
	
	// jsinq.Enumerable.join
	testJoin: function() {
		var identity = function(item) {
			return item;
		};
		var first = new jsinq.Enumerable();
		var second = new jsinq.Enumerable();	
		var joined = first.join(second, identity, identity, identity);
		this.assertEqual(0, joined.count());
		genericTestEnumerable.call(this, joined);
		
		var firstArray = [];
		var secondArray = [];
		for (var i = 0; i < TEST_ARRAY.length; i++) {
			firstArray.push({
				key: TEST_ARRAY[i],
				value: i
			});
			secondArray.push({
				key: TEST_ARRAY[TEST_ARRAY.length - 1 - i],
				value: TEST_ARRAY.length - 1 - i
			});
		}
		var keySelector = function(item) {
			return item.key;
		};
		var resultSelector = function(firstElement, secondElement) {
			return firstElement.value == secondElement.value;
		};
		
		first = new jsinq.Enumerable(firstArray);
		joined = first.join(second, keySelector, keySelector, resultSelector);
		this.assertEqual(0, joined.count());
		
		second = new jsinq.Enumerable(secondArray);
		joined = first.join(second, keySelector, keySelector, resultSelector);
		this.assertEqual(firstArray.length, joined.count());
		
		var enumerator = first.getEnumerator();
		while (enumerator.moveNext()) {
			var current = enumerator.current();
			this.assert(current);
		}
		genericTestEnumerable.call(this, joined);
		
		joined = first.join(second, identity, identity, resultSelector,
			{
				equals: function(a, b) {
					return a.value == b.value;
				}
			}
		);
		this.assertEqual(firstArray.length, joined.count());		
		genericTestEnumerable.call(this, joined);
	},
	
	// jsinq.Enumerable.last
	testLast: function() {
		var enumerable = new jsinq.Enumerable();
		this.assertRaise(jsinq.InvalidOperationException.prototype.name,
				function() { enumerable.last(); });
		enumerable = new jsinq.Enumerable(TEST_SCALAR);
		this.assertEqual(TEST_SCALAR, enumerable.last());
		
		var array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
		enumerable = new jsinq.Enumerable(array);
		this.assertEqual(array[array.length - 1], enumerable.last());
		for (var i = 9; i > 0; i--) {
			this.assertEqual(i, enumerable.last(function(element) {
				return element == i;
			}));
		}
	},
	
	// jsinq.Enumerable.lastOrDefault
	testLastOrDefault: function() {
		var enumerable = new jsinq.Enumerable();	
		this.assertEqual(TEST_SCALAR, enumerable.lastOrDefault(TEST_SCALAR));
		enumerable = new jsinq.Enumerable(TEST_PREDICATE_PASS_ARRAY);	
		this.assertEqual(TEST_PREDICATE_PASS_ARRAY[
			TEST_PREDICATE_PASS_ARRAY.length - 1], 
			enumerable.lastOrDefault(TEST_SCALAR));		
		this.assertEqual(TEST_PREDICATE_PASS_ARRAY[
			TEST_PREDICATE_PASS_ARRAY.length - 1], 
			enumerable.lastOrDefault(TEST_PREDICATE, TEST_SCALAR));
		enumerable = new jsinq.Enumerable(TEST_PREDICATE_FAIL_ARRAY);	
		this.assertEqual(TEST_SCALAR, enumerable.lastOrDefault(TEST_PREDICATE, 
			TEST_SCALAR));
	},
	
	// jsinq.Enumerable.max
	testMax: function() {
		var enumerable = new jsinq.Enumerable();
		
		this.assertRaise(jsinq.InvalidOperationException.prototype.name, 
			function() { enumerable.max() });
		this.assertRaise(jsinq.InvalidOperationException.prototype.name, 
			function() { enumerable.max(function (item) { return item; }) });
			
		var max = 0;
		for (var i = 0; i < TEST_ARRAY.length; i++) {			
			max = Math.max(max, TEST_ARRAY[i]);
		}
		
		enumerable = new jsinq.Enumerable(TEST_ARRAY);
		
		var computedMax = enumerable.max();		
		this.assertEqual(max, computedMax);
		
		computedMax = enumerable.max(function(item) { return item; });
		this.assertEqual(max, computedMax);
	},
	
	// jsinq.Enumerable.min
	testMin: function() {
		var enumerable = new jsinq.Enumerable();
		
		this.assertRaise(jsinq.InvalidOperationException.prototype.name, 
			function() { enumerable.min() });
		this.assertRaise(jsinq.InvalidOperationException.prototype.name, 
			function() { enumerable.min(function (item) { return item; }) });
			
		var min = 0xFFFFFFFF;
		for (var i = 0; i < TEST_ARRAY.length; i++) {			
			min = Math.min(min, TEST_ARRAY[i]);
		}
		
		enumerable = new jsinq.Enumerable(TEST_ARRAY);
		
		var computedMin = enumerable.min();		
		this.assertEqual(min, computedMin);
		
		computedMin = enumerable.min(function(item) { return item; });
		this.assertEqual(min, computedMin);
	},
	
	// jsinq.Enumerable.orderBy
	testOrderBy: function() {
		var enumerable = new jsinq.Enumerable();
		var ordered = enumerable.orderBy(function() { return 0; });
		this.assertEqual(0, ordered.count());
		genericTestEnumerable.call(this, ordered);
		
		var array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
		enumerable = new jsinq.Enumerable(array);
		ordered = enumerable.orderBy(function(item) { return item; });
		this.assertEqual(array.length, ordered.count());
		var enumerator = ordered.getEnumerator();
		var index = 0;
		while (enumerator.moveNext()) {
			this.assertEqual(array[index++], enumerator.current());
		}
		genericTestEnumerable.call(this, ordered);
		
		enumerable = new jsinq.Enumerable(TEST_ARRAY);
		ordered = enumerable.orderBy(function(item) { return item; });
		this.assertEqual(TEST_ARRAY.length, ordered.count());
		enumerator = ordered.getEnumerator();
		var last = 0;
		while (enumerator.moveNext()) {
			this.assert(enumerator.current() >= last);
			last = enumerator.current();
		}
		genericTestEnumerable.call(this, ordered);
		
		var defaultComparer = jsinq.Comparer.getDefault();
		enumerable = new jsinq.Enumerable(TEST_ARRAY);
		ordered = enumerable.orderBy(function(item) { return item; }, {
			compare: function(a, b) {
				return defaultComparer.compare(b, a);
			}
		});
		this.assertEqual(TEST_ARRAY.length, ordered.count());
		enumerator = ordered.getEnumerator();
		last = 0xFFFFFFFF;
		while (enumerator.moveNext()) {
			this.assert(enumerator.current() <= last);
			last = enumerator.current();
		}		
		genericTestEnumerable.call(this, ordered);
	},
	
	// jsinq.Enumerable.orderByDescending
	testOrderByDescending: function() {
		var enumerable = new jsinq.Enumerable();
		var ordered = enumerable.orderByDescending(function() { return 0; });
		this.assertEqual(0, ordered.count());
		genericTestEnumerable.call(this, ordered);
		
		var array = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
		enumerable = new jsinq.Enumerable(array);
		ordered = enumerable.orderByDescending(function(item) { 
			return item; 
		});
		this.assertEqual(array.length, ordered.count());
		var enumerator = ordered.getEnumerator();
		var index = 0;
		while (enumerator.moveNext()) {
			this.assertEqual(array[index++], enumerator.current());
		}
		genericTestEnumerable.call(this, ordered);
		
		enumerable = new jsinq.Enumerable(TEST_ARRAY);
		ordered = enumerable.orderByDescending(function(item) { 
			return item; 
		});
		this.assertEqual(TEST_ARRAY.length, ordered.count());
		enumerator = ordered.getEnumerator();
		var last = 0xFFFFFFFF;
		while (enumerator.moveNext()) {
			this.assert(enumerator.current() <= last);
			last = enumerator.current();
		}
		genericTestEnumerable.call(this, ordered);
		
		var defaultComparer = jsinq.Comparer.getDefault();
		enumerable = new jsinq.Enumerable(TEST_ARRAY);
		ordered = enumerable.orderByDescending(
			function(item) { 
				return item; 
			}, {
				compare: function(a, b) {
					return defaultComparer.compare(b, a);
				}
			}
		);
		this.assertEqual(TEST_ARRAY.length, ordered.count());
		enumerator = ordered.getEnumerator();
		last = 0;
		while (enumerator.moveNext()) {
			this.assert(enumerator.current() >= last);
			last = enumerator.current();
		}		
		genericTestEnumerable.call(this, ordered);
	},
	
	// jsinq.Enumerable.range
	testRange: function() {
		this.assertRaise(jsinq.ArgumentOutOfRangeException.prototype.name,
			function() { jsinq.Enumerable.range(0, -1) });
		var enumerable = jsinq.Enumerable.range(0, 0);
		this.assertEqual(0, enumerable.count());
		genericTestEnumerable.call(this, enumerable);

		enumerable = jsinq.Enumerable.range(0, 10);
		this.assertEqual(10, enumerable.count());
		var enumerator = enumerable.getEnumerator();
		var index = 0;
		while (enumerator.moveNext()) {
			this.assertEqual(index++, enumerator.current());
		}
		genericTestEnumerable.call(this, enumerable);
		
		enumerable = jsinq.Enumerable.range(10, 10);
		this.assertEqual(10, enumerable.count());
		var enumerator = enumerable.getEnumerator();
		var index = 10;
		while (enumerator.moveNext()) {
			this.assertEqual(index++, enumerator.current());
		}		
		genericTestEnumerable.call(this, enumerable);
	},
	
	// jsinq.Enumerable.repeat
	testRepeat: function() {
		this.assertRaise(jsinq.ArgumentOutOfRangeException.prototype.name,
			function() { jsinq.Enumerable.repeat(0, -1) });
			
		var enumerable = jsinq.Enumerable.repeat(0, 0);
		this.assertEqual(0, enumerable.count());
		genericTestEnumerable.call(this, enumerable);		
		
		enumerable = jsinq.Enumerable.repeat(TEST_SCALAR, 10);
		this.assertEqual(10, enumerable.count());
		var enumerator = enumerable.getEnumerator();
		while (enumerator.moveNext()) {
			this.assertEqual(TEST_SCALAR, enumerator.current());
		}		
		genericTestEnumerable.call(this, enumerable);
	},
	
	// jsinq.Enumerable.reverse
	testReverse: function() {
		var enumerable = new jsinq.Enumerable();
		var reversed = enumerable.reverse();
		this.assertEqual(0, reversed.count());
		genericTestEnumerable.call(this, reversed);
		
		enumerable = new jsinq.Enumerable(TEST_ARRAY);
		reversed = enumerable.reverse();
		this.assertEqual(TEST_ARRAY.length, reversed.count());
		var index = TEST_ARRAY.length - 1;		
		var enumerator = reversed.getEnumerator();
		while (enumerator.moveNext()) {
			this.assertEqual(TEST_ARRAY[index--], enumerator.current());
		}				
		genericTestEnumerable.call(this, reversed);
	},	
	
	// jsinq.Enumerable.select
	testSelect: function() {
		var enumerable = new jsinq.Enumerable();
		var selected = enumerable.select(function(item) { return item; });
		this.assertEqual(0, selected.count());
		genericTestEnumerable.call(this, selected);
		
		enumerable = new jsinq.Enumerable(TEST_ARRAY);
		var counter = 0;
		var _this = this;
		selected = enumerable.select(function(item, index) { 
			_this.assertEqual(counter++, index);
			return item; 
		});
		this.assertEqual(TEST_ARRAY.length, selected.count());
		var enumerator = selected.getEnumerator();
		var index = 0;
		while (enumerator.moveNext()) {
			this.assertEqual(TEST_ARRAY[index++], enumerator.current());
		}
		selected = enumerable.select(function(item) { return item; });
		genericTestEnumerable.call(this, selected);
	},
	
	// jsinq.Enumerable.selectMany
	testSelectMany: function() {
		var enumerable = new jsinq.Enumerable();
		var selected = enumerable.selectMany(function(item) { 
			return jsinq.Enumerable.empty(); 
		});
		this.assertEqual(0, selected.count());
		genericTestEnumerable.call(this, selected);
		
		enumerable = new jsinq.Enumerable(TEST_ARRAY);
		var counter = 0;
		var _this = this;
		selected = enumerable.selectMany(function(item, index) { 
			_this.assertEqual(counter++, index);
			return new jsinq.Enumerable(item); 
		});
		this.assertEqual(TEST_ARRAY.length, selected.count());
		var enumerator = selected.getEnumerator();
		var index = 0;
		counter = 0;
		while (enumerator.moveNext()) {
			this.assertEqual(TEST_ARRAY[index++], enumerator.current());
		}
		selected = enumerable.selectMany(function(item) { 
			return new jsinq.Enumerable(item); 
		});
		genericTestEnumerable.call(this, selected);
		
		selected = enumerable.selectMany(function(item) { 
			return new jsinq.Enumerable(item); 
		}, function(item, subItem) {
			return subItem + 10;
		});	
		var enumerator = selected.getEnumerator();
		index = 0;
		while (enumerator.moveNext()) {
			this.assertEqual(TEST_ARRAY[index++] + 10, enumerator.current());
		}		
		genericTestEnumerable.call(this, selected);	
		
		selected = enumerable.selectMany(function(item) { 
			return new jsinq.Enumerable(TEST_ARRAY); 
		});			
		this.assertEqual(TEST_ARRAY.length * TEST_ARRAY.length, 
			selected.count());		
	},
	
	// jsinq.Enumerable.sequenceEqual
	testSequenceEqual: function() {
		var first = new jsinq.Enumerable();
		var second = new jsinq.Enumerable();
		this.assert(first.sequenceEqual(second));

		first = new jsinq.Enumerable(TEST_ARRAY);
		second = new jsinq.Enumerable(TEST_ARRAY);
		this.assert(first.sequenceEqual(second));
		
		second = new jsinq.Enumerable(TEST_PREDICATE_PASS_SINGLETON_ARRAY);
		this.assert(!first.sequenceEqual(second));
	},
	
	// jsinq.Enumerable.single
	testSingle: function() {
		var enumerable = new jsinq.Enumerable();
		this.assertRaise(jsinq.InvalidOperationException.prototype.name,
				function() { enumerable.single(); });
		enumerable = new jsinq.Enumerable(TEST_SCALAR);
		this.assertEqual(TEST_SCALAR, enumerable.single());
		
		enumerable = new jsinq.Enumerable(TEST_ARRAY);
		this.assertRaise(jsinq.InvalidOperationException.prototype.name,
				function() { enumerable.single(); });
				
		enumerable = new jsinq.Enumerable(TEST_PREDICATE_PASS_SINGLETON_ARRAY);
		this.assertEqual(TEST_PREDICATE_PASS_SINGLETON_ARRAY[0], 
			enumerable.single(TEST_PREDICATE));

		enumerable = new jsinq.Enumerable(TEST_PREDICATE_FAIL_SINGLETON_ARRAY);
		this.assertRaise(jsinq.InvalidOperationException.prototype.name,
				function() { enumerable.single(TEST_PREDICATE); });
	},
	
	// jsinq.Enumerable.singleOrDefault
	testSingleOrDefault: function() {
		var enumerable = new jsinq.Enumerable();
		this.assertEqual(TEST_SCALAR, enumerable.singleOrDefault(TEST_SCALAR));
		
		enumerable = new jsinq.Enumerable(TEST_SCALAR);
		this.assertEqual(TEST_SCALAR, enumerable.singleOrDefault(
			TEST_OTHER_SCALAR));
		
		enumerable = new jsinq.Enumerable(TEST_ARRAY);
		this.assertEqual(TEST_SCALAR, enumerable.singleOrDefault(TEST_SCALAR));
				
		enumerable = new jsinq.Enumerable(TEST_PREDICATE_PASS_SINGLETON_ARRAY);
		this.assertEqual(TEST_PREDICATE_PASS_SINGLETON_ARRAY[0], 
			enumerable.singleOrDefault(TEST_PREDICATE, TEST_SCALAR));

		enumerable = new jsinq.Enumerable(TEST_PREDICATE_FAIL_SINGLETON_ARRAY);
		this.assertEqual(TEST_SCALAR, enumerable.singleOrDefault(
			TEST_PREDICATE, TEST_SCALAR));
	},
	
	// jsinq.Enumerable.skip
	testSkip: function() {
		var enumerable = new jsinq.Enumerable();
		var skipped = enumerable.skip(10); 
		this.assertEqual(0, enumerable.count());
		genericTestEnumerable.call(this, skipped);
		
		enumerable = new jsinq.Enumerable(TEST_ARRAY);
		skipped = enumerable.skip(0);
		this.assertEqual(TEST_ARRAY.length, skipped.count());
		
		skipped = enumerable.skip(5);
		this.assertEqual(TEST_ARRAY.length - 5, skipped.count());
		var enumerator = skipped.getEnumerator();
		var index = 5;
		while (enumerator.moveNext()) {
			this.assertEqual(TEST_ARRAY[index++], enumerator.current());
		}
		genericTestEnumerable.call(this, skipped);
		
		skipped = enumerable.skip(TEST_ARRAY.length);
		this.assertEqual(0, skipped.count());
		
		skipped = enumerable.skip(TEST_ARRAY.length * 2);
		this.assertEqual(0, skipped.count());
	},
	
	// jsinq.Enumerable.skipWhile
	testSkipWhile: function() {
		var enumerable = new jsinq.Enumerable();
		var skipped = enumerable.skipWhile(TEST_PREDICATE); 
		this.assertEqual(0, skipped.count());
		genericTestEnumerable.call(this, skipped);

		enumerable = new jsinq.Enumerable(TEST_ARRAY);
		skipped = enumerable.skipWhile(function() { return true; }); 
		this.assertEqual(0, skipped.count());
		
		var array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
		enumerable = new jsinq.Enumerable(array);
		skipped = enumerable.skipWhile(function(value) {
			return value < 5;
		});
		this.assertEqual(5, skipped.count());
		var enumerator = skipped.getEnumerator();
		var index = 5;
		while (enumerator.moveNext()) {
			this.assertEqual(index++, enumerator.current());
		}
	},
	
	// jsinq.Enumerable.sum
	testSum: function() {
		var enumerable = new jsinq.Enumerable();
		
		this.assertNothingRaised(function() { enumerable.sum() });
		this.assertNothingRaised(
			function() { enumerable.sum(function (item) { return item; }) });
			
		this.assertEqual(0, enumerable.sum());
		
		var sum = 0;
		for (var i = 0; i < TEST_ARRAY.length; i++) {			
			sum += TEST_ARRAY[i];
		}
		
		enumerable = new jsinq.Enumerable(TEST_ARRAY);
		
		var computedSum = enumerable.sum();		
		this.assertEqual(sum, computedSum);
		
		computedSum = enumerable.sum(function(item) { return item; });
		this.assertEqual(sum, computedSum);
	},
	
	// jsinq.Enumerable.take
	testTake: function() {
		var enumerable = new jsinq.Enumerable();
		var taken = enumerable.take(10);
		this.assertEqual(0, taken.count());
		genericTestEnumerable.call(this, taken);
		
		enumerable = new jsinq.Enumerable(TEST_ARRAY);
		for (var i = 0; i < TEST_ARRAY.length; i++) {
			taken = enumerable.take(i);
			this.assertEqual(i, taken.count());
			var enumerator = taken.getEnumerator();
			var index = 0;
			while (enumerator.moveNext()) {
				this.assertEqual(TEST_ARRAY[index++], enumerator.current());
			}
			genericTestEnumerable.call(this, taken);
		}
	},
	
	// jsinq.Enumerable.takeWhile
	testTakeWhile: function() {
		var enumerable = new jsinq.Enumerable();
		var taken = enumerable.takeWhile(TEST_PREDICATE);
		this.assertEqual(0, taken.count());
		genericTestEnumerable.call(this, taken);
		
		var array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
		enumerable = new jsinq.Enumerable(array);
		taken = enumerable.takeWhile(function(value) {
			return value < 5;
		});
		this.assertEqual(5, taken.count());
		var enumerator = taken.getEnumerator();
		var index = 0;
		while (enumerator.moveNext()) {
			this.assertEqual(index++, enumerator.current());
		}
		genericTestEnumerable.call(this, taken);
	},
	
	// jsinq.Enumerable.thenBy
	testThenBy: function() {
		var enumerable = new jsinq.Enumerable();
		var ordered = enumerable.orderBy(function(item) { return item; }).
			thenBy(function(item) { return item; });
		this.assertEqual(0, ordered.count());
		genericTestEnumerable.call(this, ordered);
		
		var data = [];
		for (var i = 0; i < TEST_ARRAY.length; i++) {
			for (var j = 0; j < TEST_ARRAY.length; j++) {
				for (var k = 0; k < TEST_ARRAY.length; k++) {
					var element = {first: TEST_ARRAY[i], second: TEST_ARRAY[j], 
						third: TEST_ARRAY[k]};
					data.push(element);
				}
			}			
		}
		
		enumerable = new jsinq.Enumerable(data);
		ordered = enumerable.orderBy(function(item) {
			return item.first;
		}).thenBy(function(item) {
			return item.second
		}).thenBy(function(item) {
			return item.third;
		});
		this.assertEqual(data.length, ordered.count());
		
		var enumerator = ordered.getEnumerator();
		var lastFirst = -1;
		var lastSecond = -1;
		var lastThird = -1;
		while (enumerator.moveNext()) {
			var current = enumerator.current();
			this.assert(current.first >= lastFirst);
			if (current.first == lastFirst) {
				this.assert(current.second >= lastSecond);
				if (current.second == lastSecond) {
					this.assert(current.third >= lastThird);
				}
			}			
			lastFirst = current.first;
			lastSecond = current.second;
			lastThird = current.third;
		}
		genericTestEnumerable.call(this, ordered);
		
		var defaultComparer = jsinq.Comparer.getDefault();
		
		ordered = enumerable.orderBy(function(item) {
			return item.first;
		}).thenBy(function(item) {
			return item.second
		}, {
			compare: function(a, b) {
				return defaultComparer.compare(b, a);
			}
		});
		
		var enumerator = ordered.getEnumerator();
		var lastFirst = -1;
		var lastSecond = 0xFFFFFFFF;
		while (enumerator.moveNext()) {
			var current = enumerator.current();
			this.assert(current.first >= lastFirst);
			if (current.first == lastFirst) {
				this.assert(current.second <= lastSecond);
			}			
			lastFirst = current.first;
			lastSecond = current.second;
		}
		genericTestEnumerable.call(this, ordered);		
	},
	
	// jsinq.Enumerable.thenByDescending
	testThenByDescending: function() {
		var enumerable = new jsinq.Enumerable();
		var ordered = enumerable.orderByDescending(function(item) { 
			return item; 
		}).thenByDescending(function(item) { return item; });
		this.assertEqual(0, ordered.count());
		genericTestEnumerable.call(this, ordered);
		
		var data = [];
		for (var i = 0; i < TEST_ARRAY.length; i++) {
			for (var j = 0; j < TEST_ARRAY.length; j++) {
				for (var k = 0; k < TEST_ARRAY.length; k++) {
					var element = {first: TEST_ARRAY[i], second: TEST_ARRAY[j], 
						third: TEST_ARRAY[k]};
					data.push(element);
				}
			}			
		}
		
		enumerable = new jsinq.Enumerable(data);
		ordered = enumerable.orderByDescending(function(item) {
			return item.first;
		}).thenByDescending(function(item) {
			return item.second
		}).thenByDescending(function(item) {
			return item.third;
		});
		this.assertEqual(data.length, ordered.count());
		
		var enumerator = ordered.getEnumerator();
		var lastFirst = 0xFFFFFFFF;
		var lastSecond = 0xFFFFFFFF;
		var lastThird = 0xFFFFFFFF;
		while (enumerator.moveNext()) {
			var current = enumerator.current();
			this.assert(current.first <= lastFirst);
			if (current.first == lastFirst) {
				this.assert(current.second <= lastSecond);
				if (current.second == lastSecond) {
					this.assert(current.third <= lastThird);
				}
			}			
			lastFirst = current.first;
			lastSecond = current.second;
			lastThird = current.third;
		}
		genericTestEnumerable.call(this, ordered);
		
		var defaultComparer = jsinq.Comparer.getDefault();
		
		ordered = enumerable.orderByDescending(function(item) {
			return item.first;
		}).thenByDescending(function(item) {
			return item.second
		}, {
			compare: function(a, b) {
				return defaultComparer.compare(b, a);
			}
		});
		
		var enumerator = ordered.getEnumerator();
		var lastFirst = 0xFFFFFFFF;
		var lastSecond = -1;
		while (enumerator.moveNext()) {
			var current = enumerator.current();
			this.assert(current.first <= lastFirst);
			if (current.first == lastFirst) {
				this.assert(current.second >= lastSecond);
			}			
			lastFirst = current.first;
			lastSecond = current.second;
		}
		genericTestEnumerable.call(this, ordered);	
	},
	
	// jsinq.Enumerable.toArray
	testToArray: function() {
		var enumerable = new jsinq.Enumerable();
		var array = enumerable.toArray();
		this.assertEqual(0, array.length);
		
		array = (new jsinq.Enumerable(TEST_SCALAR)).toArray();
		this.assertEqual(1, array.length);
		this.assertEqual(TEST_SCALAR, array[0]);
		
		array = (new jsinq.Enumerable(TEST_ARRAY)).toArray();
		this.assertEqual(TEST_ARRAY.length, array.length);
		for (var i = 0; i < array.length; i++) {
			this.assertEqual(TEST_ARRAY[i], array[i]);
		}
	},
		
	// jsinq.Enumerable.toDictionary
	testToDictionary: function() {
		var enumerable = new jsinq.Enumerable();
		var dictionary = enumerable.toDictionary(function(element) {
			return element;
		});
		this.assertEqual(true, dictionary instanceof jsinq.Dictionary);
		this.assertEqual(0, dictionary.count());
		
		enumerable = new jsinq.Enumerable(TEST_ARRAY);
		var index = 0;
		var dictionary = enumerable.select(function(element) {
			return [index++, element];
		}).toDictionary(function(element) {
			return element[0];
		});
		
		for (var i = 0; i < TEST_ARRAY.length; i++) {
			this.assertEqual(TEST_ARRAY[i], dictionary.item(i)[1]);
		}
	},
		
	// jsinq.Enumerable.toLookup
	testToLookup: function() {
		var enumerable = new jsinq.Enumerable();
		var lookup = enumerable.toLookup(function(element) {
			return element;
		});
		this.assertEqual(true, lookup instanceof jsinq.Lookup);
		this.assertEqual(0, lookup.count());
		
		enumerable = jsinq.Enumerable.range(0, 10);
		lookup = enumerable.toLookup(function(element) {
			return element % 2;
		});
		
		var _this = this;
		lookup.each(function(element) {
			_this.assertEqual(true, element instanceof jsinq.Grouping);
			element.each(function(value) {
				_this.assertEqual(element.key, value % 2);
			});
		});
	},
		
	// jsinq.Enumerable.toList
	testToList: function() {
		var enumerable = new jsinq.Enumerable();
		var list = enumerable.toList();
		this.assertEqual(true, list instanceof jsinq.List);
		this.assertEqual(0, list.count());		
		
		enumerable = new jsinq.Enumerable(TEST_ARRAY);
		list = enumerable.toList();
		
		for (var i = 0; i < list.count(); i++) {
			this.assertEqual(TEST_ARRAY[i], list.item(i));
		}
	},
	
	// jsinq.Enumerable.union
	testUnion: function() {
		var first = new jsinq.Enumerable();
		var second = new jsinq.Enumerable();
		var union = first.union(second);
		this.assertEqual(0, union.count());
		genericTestEnumerable.call(this, union);
		
		first = new jsinq.Enumerable(TEST_ARRAY);
		union = first.union(second);
		this.assertEqual(TEST_ARRAY.length, union.count());
		genericTestEnumerable.call(this, union);

		second = new jsinq.Enumerable(TEST_ARRAY_DISJOINT);
		union = first.union(second);
		this.assertEqual(TEST_ARRAY.length + TEST_ARRAY_DISJOINT.length, 
			union.count());
		genericTestEnumerable.call(this, union);
			
		second = new jsinq.Enumerable(TEST_ARRAY);
		union = first.union(second);
		this.assertEqual(TEST_ARRAY.length, union.count());			
		var enumerator = union.getEnumerator();
		var index = 0;
		while (enumerator.moveNext()) {
			this.assertEqual(TEST_ARRAY[index++], enumerator.current());
		}
		genericTestEnumerable.call(this, union);
		
		first = new jsinq.Enumerable(TEST_DATA);
		second = new jsinq.Enumerable(TEST_DATA);
		union = first.union(second, TEST_COMPARER);
		this.assertEqual(TEST_DATA.length, union.count());
		genericTestEnumerable.call(this, union);		
	},
	
	// jsinq.Enumerable.where
	testWhere: function() {
		var enumerable = new jsinq.Enumerable();		
		var filtered = enumerable.where(TEST_PREDICATE);
		this.assertEqual(0, filtered.count());
		genericTestEnumerable.call(this, filtered);
		
		enumerable = new jsinq.Enumerable(TEST_ARRAY);
		filtered = enumerable.where(function() { return false; });
		this.assertEqual(0, filtered.count());
		genericTestEnumerable.call(this, filtered);
		
		var array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
		enumerable = new jsinq.Enumerable(array);
		filtered = enumerable.where(function(value) { 
			return value % 2 == 0; 
		});
		this.assertEqual(array.length / 2, filtered.count());
		var enumerator = filtered.getEnumerator();
		var index = 0;
		while (enumerator.moveNext()) {
			this.assertEqual(index, enumerator.current());
			index += 2;
		}
		genericTestEnumerable.call(this, filtered);
	},
		
	// jsinq.Enumerable.zip
	testZip: function() {
		var resultSelector = function(first, second) {
			return first + second;
		};
		
		var first = new jsinq.Enumerable();
		var second = new jsinq.Enumerable();
		var result = first.zip(second, resultSelector);
		this.assertEqual(0, result.count());
		genericTestEnumerable.call(this, result);
		
		first = new jsinq.Enumerable(TEST_ARRAY);
		second = new jsinq.Enumerable(TEST_ARRAY_DISJOINT);
		result = first.zip(second, resultSelector);
		this.assertEqual(Math.min(first.count(), second.count()), 
			result.count());
		genericTestEnumerable.call(this, result);
		
		var enumerator = result.getEnumerator();
		var index = 0;
		while (enumerator.moveNext()) {
			this.assertEqual(TEST_ARRAY[index] + TEST_ARRAY_DISJOINT[index], 
				enumerator.current());
			++index;
		}
	},
		
	// jsinq.Enumerable.each
	testEach: function() {
		var calls = 0;
		var enumerable = new jsinq.Enumerable();
		enumerable.each(function(e) {
			++calls;
		});
		this.assertEqual(0, calls);
		
		calls = 0;
		
		var _this = this;
		
		enumerable = new jsinq.Enumerable(TEST_ARRAY);
		enumerable.each(function(e) {
			_this.assertEqual(TEST_ARRAY[calls], e);
			++calls;
		});
		this.assertEqual(TEST_ARRAY.length, calls);
	}
 });