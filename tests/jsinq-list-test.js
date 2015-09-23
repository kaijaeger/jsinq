/* 
 * JSINQ, JavaScript integrated query
 * Copyright (c) 2010 Kai Jäger. Some rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the license.txt file. 
 */

var TEST_DATA = ["a", "b", true, 32, 99, new Date()];
var SORT_TEST_DATA = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
var SORT_TEST_DATA2 = ["AA", "AB", "AC", "AD", "AE", "AF", "AG"];
var SORT_TEST_DATA3 = [1, 3, 5, 7, 9, 11, 13];

new Test.Unit.Runner({
	// jsinq.List
	testConstructor: function() {
		var list = new jsinq.List();
		this.assertEqual(true, list instanceof jsinq.List);
	},
		
	// jsinq.List.item
	testItem: function() {
		var list = new jsinq.List();
		this.assertRaise("ArgumentOutOfRangeException", function() {
			var temp = list.item(0);
		});
		
		for (var i = 0; i < TEST_DATA.length; i++)
		{
			list.add(TEST_DATA[i]);
			this.assertEqual(list.item(i), TEST_DATA[i]);
		}
		
		this.assertRaise("ArgumentOutOfRangeException", function() {
			var temp = list.item(list.count());
		});
		
		this.assertRaise("ArgumentOutOfRangeException", function() {
			var temp = list.item(-1);
		});
	},		
	
	// jsinq.List.set
	testSet: function() {
		var list = new jsinq.List();
		this.assertRaise("ArgumentOutOfRangeException", function() {
			list.set(0, TEST_DATA[0]);
		});
		
		for (var i = 0; i < 10; i++)
		{
			list.add(i);
		}
		for (i = 0; i < 10; i++)
		{
			list.set(i, 10 - i);
			this.assertEqual(10 - i, list.item(i));
		}
		
		this.assertRaise("ArgumentOutOfRangeException", function() {
			list.set(list.count(), TEST_DATA[0]);
		});
		
		this.assertRaise("ArgumentOutOfRangeException", function() {
			list.set(-1, TEST_DATA[0]);
		});
	},			
	
	// jsinq.List.add
	testAdd: function() {
		var list = new jsinq.List();
		for (var i = 0; i < TEST_DATA.length; i++)
		{
			list.add(TEST_DATA[i]);
			this.assertEqual(list.item(i), TEST_DATA[i]);
			this.assertEqual(i + 1, list.count());
		}
	},
		
	// jsinq.List.addRange
	testAddRange: function() {
		var list = new jsinq.List();
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		this.assertEqual(TEST_DATA.length * 2, list.count());
		for (var i = 0; i < TEST_DATA.length * 2; i++)
		{
			this.assertEqual(TEST_DATA[i % TEST_DATA.length], list.item(i));
		}
	},
		
	// jsinq.List.readOnly
	testAsReadOnly: function() {
		var list = new jsinq.List();
		var readonly = list.asReadOnly();
		this.assertEqual(true, readonly.isReadOnly());
		
		this.assertEqual(0, readonly.count());
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		this.assertEqual(list.count(), readonly.count());
		
		this.assertRaise("NotSupportedException", function() {
			readonly.add(1);
		});
		this.assertRaise("NotSupportedException", function() {
			readonly.clear();
		});
		this.assertRaise("NotSupportedException", function() {
			readonly.insert(0, 1);
		});
		this.assertRaise("NotSupportedException", function() {
			readonly.remove(0);
		});
		this.assertRaise("NotSupportedException", function() {
			readonly.removeAt(0);
		});
	},
		
	// jsinq.List.binarySearch
	testBinarySearch: function() {
		var list = new jsinq.List();
		this.assertEqual(~list.count(), list.binarySearch(SORT_TEST_DATA3[0]));
		
		list.addRange(new jsinq.Enumerable(SORT_TEST_DATA3));
		for (var i = 0; i < list.count(); i++) {
			this.assertEqual(i, list.binarySearch(list.item(i)));
		}
		
		var value;
		for (i = 0; i < list.count(); i++) {
			value = list.item(i) + 1;
			this.assertEqual(~(i + 1), list.binarySearch(value));
		}
		
		list = new jsinq.List(new jsinq.Enumerable(SORT_TEST_DATA2));
		for (i = 1; i < list.count() - 1; i++) {
			this.assertEqual(i, list.binarySearch(1, 
				list.count() - 2, list.item(i), function(a, b) {
					return a.charAt(1) > b.charAt(1) ? 1 : 
						a.charAt(1) < b.charAt(1) ? -1 : 0;
				}));
		}
	},
		
	// jsinq.List.clear
	testClear: function() {
		var list = new jsinq.List();
		this.assertEqual(0, list.count());
		list.clear();
		this.assertEqual(0, list.count());
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		this.assertEqual(TEST_DATA.length, list.count());
		list.clear();
		this.assertEqual(0, list.count());
	},
		
	// jsinq.List.copyTo
	testCopyTo: function() {
		var list = new jsinq.List();		
		var target = [];
		list.copyTo(target);
		this.assertEqual(0, target.length);
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		list.copyTo(target);
		this.assertEqual(target.length, list.count());
		for (var i = 0; i < list.count(); i++) {
			this.assertEqual(TEST_DATA[i], target[i]);
		}		
		target = [];
		list.copyTo(target, 120);
		this.assertEqual(target.length, 120 + list.count());
		for (var i = 120; i < list.count(); i++) {
			this.assertEqual(TEST_DATA[i], target[i]);
		}
		target = [];
		list.copyTo(3, target, 5, 2);		
		for (var i = 5; i < target.length; i++) {
			this.assertEqual(TEST_DATA[i - 2], target[i]);
		}
	},
		
	// jsinq.List.exists
	testExists: function() {
		var list = new jsinq.List();
		this.assertEqual(false, list.exists(function(e) { return true; }));
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		for (var i = 0; i < TEST_DATA.length; i++) {
			this.assertEqual(true, 
				list.exists(function(e) { return e == TEST_DATA[i]; }));
		}
	},
		
	// jsinq.List.find
	testFind: function() {
		var list = new jsinq.List();
		this.assertEqual(null, list.find(function(e) { return true; }));
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		for (var i = 0; i < TEST_DATA.length; i++) {
			this.assertEqual(TEST_DATA[i], 
				list.find(function(e) { return e == TEST_DATA[i]; }));
		}
	},
		
	// jsinq.List.findAll
	testFindAll: function() {
		var list = new jsinq.List();
		var results = list.findAll(function(e) { return true; });
		this.assertEqual(true, results instanceof jsinq.List);
		this.assertEqual(0, results.count());
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		results = list.findAll(function(e) { return true; });
		this.assertEqual(list.count(), results.count());
		for (var i = 0; i < list.count(); i++) {
			this.assertEqual(list.item(i), results.item(i));
		}
	},
		
	// jsinq.List.findIndex
	testFindIndex: function() {
		var list = new jsinq.List();
		this.assertEqual(-1, list.findIndex(function(element) {
			return true;
		}));
		
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		for (var i = 0; i < list.count(); i++) {
			this.assertEqual(i, list.findIndex(function(element) {
				return element == list.item(i);
			}));			
		}

		var expect;
		for (i = 0; i < list.count(); i++) {
			expect = i;
			if (i == 0) {
				expect = -1;
			}
			this.assertEqual(expect, list.findIndex(1, function(element) {
				return element == list.item(i);
			}));			
		}
		
		for (i = 0; i < list.count(); i++) {
			expect = i;
			if (i == 0 || i == list.count() - 1) {
				expect = -1;
			}
			this.assertEqual(expect, list.findIndex(1, list.count() - 2, 
				function(element) {
					return element == list.item(i);
				}));			
		}
	},
		
	// jsinq.List.findLast
	testFindLast: function() {
		var list = new jsinq.List();
		this.assertEqual(null, list.findLast(TEST_DATA[0]));
		
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		for (var i = 0; i < list.count(); i++) {
			this.assertEqual(TEST_DATA[i], list.findLast(function(element) {
				return element == TEST_DATA[i];
			}));
		}
		
		list.clear();
		list.addRange(jsinq.Enumerable.range(0, 20));
		for (var i = 0; i < parseInt(list.count() / 2); i++) {
			this.assertEqual(true, list.findLast(function(element) {
				return element % 10  == i;
			}) >= 10);
		}
	},
		
	// jsinq.List.findLastIndex
	testFindLastIndex: function() {
		var list = new jsinq.List();
		this.assertEqual(-1, list.findLastIndex(function(element) {
			return true;
		}));
		
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		for (var i = 0; i < list.count(); i++) {
			this.assertEqual(i, list.findLastIndex(function(element) {
				return element == list.item(i);
			}));			
		}

		var expect;
		for (i = 0; i < list.count(); i++) {
			expect = i;
			if (i == 0) {
				expect = -1;
			}
			this.assertEqual(expect, list.findLastIndex(1, function(element) {
				return element == list.item(i);
			}));			
		}
		
		for (i = 0; i < list.count(); i++) {
			expect = i;
			if (i == 0 || i == list.count() - 1) {
				expect = -1;
			}
			this.assertEqual(expect, list.findLastIndex(1, list.count() - 2, 
				function(element) {
					return element == list.item(i);
				}));			
		}
		
		list.clear();
		list.addRange(jsinq.Enumerable.range(0, 5));
		list.addRange(jsinq.Enumerable.range(0, 5));
		
		for (var i = 0; i < 5; i++) {
			this.assertEqual(5 + i, list.findLastIndex(function(element) {
				return element == i;
			}));
		}		
	},
		
	// jsinq.List.forEach
	testForEeach: function() {
		var _this = this;
		
		var list = new jsinq.List();
		var timesInvoked = 0;
		list.forEach(function() { ++timesInvoked; });
		this.assertEqual(0, timesInvoked);
		
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		var index = 0;
		list.forEach(function(e) {
			_this.assertEqual(TEST_DATA[index++], e);
		});
		this.assertEqual(TEST_DATA.length, index);
	},
		
	// jsinq.List.getEnumerator
	testGetEnumerator: function() {
		var list = new jsinq.List();
		genericTestEnumerable.call(this, list, true);
		
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		genericTestEnumerable.call(this, list, true);
	},
		
	// jsinq.List.getRange
	testGetRange: function() {
		var list = new jsinq.List();
		this.assertRaise("ArgumentOutOfRangeException", function() {
			list.getRange(0, list.count());
		});
		
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		this.assertRaise("ArgumentOutOfRangeException", function() {
			list.getRange(-1, list.count());
		});
		this.assertRaise("ArgumentOutOfRangeException", function() {
			list.getRange(0, list.count() + 1);
		});
		
		var range = list.getRange(0, list.count());
		this.assertEqual(true, range instanceof jsinq.List);
		this.assertEqual(range.count(), list.count());
		for (var i = 0; i < range.count(); i++) {
			this.assertEqual(range.item(i), list.item(i));
		}
		
		range = list.getRange(1, list.count() - 2);
		this.assertEqual(range.count(), list.count() - 2);
		var index = 0;
		for (var i = 1; i < range.count() - 1; i++) {
			this.assertEqual(range.item(index++), list.item(i));
		}
	},
		
	// jsinq.List.indexOf
	testIndexOf: function() {
		var list = new jsinq.List();
		this.assertEqual(-1, list.indexOf(TEST_DATA[0]));
		
		this.assertRaise("ArgumentOutOfRangeException", function() {
			list.indexOf(1, -1);
		});		
		
		this.assertRaise("ArgumentOutOfRangeException", function() {
			list.indexOf(1, 1);
		});		
		
		this.assertRaise("ArgumentOutOfRangeException", function() {
			list.indexOf(1, 0, 1);
		});			
		
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		
		for (var i = 0; i < list.count(); i++) {
			this.assertEqual(i, list.indexOf(TEST_DATA[i]));
		}
		
		var startIndex = parseInt(TEST_DATA.length / 2);
		var expect;
		for (var i = 0; i < list.count(); i++) {
			expect = i;
			if (i < startIndex) {
				expect = -1;
			}
			this.assertEqual(expect, list.indexOf(TEST_DATA[i], startIndex));
		}
		
		for (var i = 0; i < list.count(); i++) {
			expect = i;
			if (i == 0 || i == list.count() - 1) {
				expect = -1;
			}
			this.assertEqual(expect, list.indexOf(TEST_DATA[i], 1, 
				list.count() - 2));
		}	
		
		list.clear();
		list.addRange(jsinq.Enumerable.range(0, 5));
		list.addRange(jsinq.Enumerable.range(0, 5));
		
		for (var i = 0; i < 5; i++) {
			this.assertEqual(i, list.indexOf(i));
		}
	},
		
	// jsinq.List.insert
	testInsert: function() {
		var list = new jsinq.List();
		
		this.assertRaise("ArgumentOutOfRangeException", function() {
			list.insert(-1, TEST_DATA[0]);
		});

		this.assertRaise("ArgumentOutOfRangeException", function() {
			list.insert(1, TEST_DATA[0]);
		});
		
		for (var i = 0; i < TEST_DATA.length; i++) {
			list.insert(0, TEST_DATA[i]);
			this.assertEqual(i + 1, list.count());
		}
		
		for (i = TEST_DATA.length - 1; i >= 0; i--) {
			this.assertEqual(TEST_DATA[TEST_DATA.length - 1 - i], 
				list.item(i));
		}		
		
		list.clear();
		list.addRange(jsinq.Enumerable.repeat(0, 10));

		for (i = 0; i < 10; i++) {
			list.insert(2 * i, 1);
		}
		
		for (i = 0; i < list.count(); i++) {
			this.assertEqual((i + 1) % 2, list.item(i));
		}		
	},
		
	// jsinq.List.inserRange
	testInsertRange: function() {
		var list = new jsinq.List();
		
		this.assertRaise("ArgumentOutOfRangeException", function() {
			list.insert(-1, new jsinq.Enumerable(TEST_DATA));
		});

		this.assertRaise("ArgumentOutOfRangeException", function() {
			list.insert(1, new jsinq.Enumerable(TEST_DATA[0]));
		});	
		
		for (var i = 0; i < 10; i++) {
			list.insertRange(0, new jsinq.Enumerable(TEST_DATA));
			this.assertEqual((i + 1) * TEST_DATA.length, list.count());
		}	
		
		for (i = 0; i < list.count(); i++) {
			this.assertEqual(TEST_DATA[i % TEST_DATA.length], 
				list.item(i));
		}	
		
		list.clear();
		list.addRange(jsinq.Enumerable.repeat(0, 10));
		
		for (i = 0; i < 10; i++) {
			list.insertRange(6 * i, jsinq.Enumerable.repeat(1, 5));
		}		
		
		for (i = 0; i < list.count(); i++) {
			this.assertEqual((i + 1) % 6 == 0 ? 0 : 1, list.item(i));
		}			
	},
		
	// jsinq.List.indexOf
	testLastIndexOf: function() {
		var list = new jsinq.List();
		this.assertEqual(-1, list.lastIndexOf(TEST_DATA[0]));
		
		this.assertRaise("ArgumentOutOfRangeException", function() {
			list.indexOf(1, -1);
		});		
		
		this.assertRaise("ArgumentOutOfRangeException", function() {
			list.indexOf(1, 1);
		});		
		
		this.assertRaise("ArgumentOutOfRangeException", function() {
			list.indexOf(1, 0, 1);
		});		
		
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		
		for (var i = 0; i < list.count(); i++) {
			this.assertEqual(i, list.lastIndexOf(TEST_DATA[i]));
		}
		
		var startIndex = parseInt(TEST_DATA.length / 2);
		var expect;
		for (var i = 0; i < list.count(); i++) {
			expect = i;
			if (i < startIndex) {
				expect = -1;
			}
			this.assertEqual(expect, list.lastIndexOf(TEST_DATA[i], 
				startIndex));
		}
		
		for (var i = 0; i < list.count(); i++) {
			expect = i;
			if (i == 0 || i == list.count() - 1) {
				expect = -1;
			}
			this.assertEqual(expect, list.lastIndexOf(TEST_DATA[i], 1, 
				list.count() - 2));
		}	
		
		list.clear();
		list.addRange(jsinq.Enumerable.range(0, 5));
		list.addRange(jsinq.Enumerable.range(0, 5));
		
		for (var i = 0; i < 5; i++) {
			this.assertEqual(5 + i, list.lastIndexOf(i));
		}
	},
		
	// jsinq.List.remove
	testRemove: function() {
		var list = new jsinq.List();
		this.assertEqual(false, list.remove(TEST_DATA[0]));
		
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		for (var i = 0; i < TEST_DATA.length; i++) {
			this.assertEqual(true, list.remove(TEST_DATA[i]));
			this.assertEqual(TEST_DATA.length - (i + 1), list.count());
		}
		this.assertEqual(0, list.count());
	},
		
	// jsinq.List.removeAll
	testRemoveAll: function() {
		var list = new jsinq.List();
		this.assertEqual(0, list.removeAll(function() { return true; }));
		
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		this.assertEqual(TEST_DATA.length, 
			list.removeAll(function() { return true; }));
		this.assertEqual(0, list.count());
		
		var index = 0;
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		this.assertEqual(parseInt(TEST_DATA.length / 2), 
			list.removeAll(function() { return index++ % 2 == 0; }));
		this.assertEqual(parseInt(TEST_DATA.length / 2), list.count());
	},
		
	// jsinq.List.removeAt
	testRemoveAt: function() {
		var list = new jsinq.List();
		this.assertRaise("ArgumentOutOfRangeException", function() {
			list.removeAt(0);
		});
		
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		this.assertRaise("ArgumentOutOfRangeException", function() {
			list.removeAt(-1);
		});
		this.assertRaise("ArgumentOutOfRangeException", function() {
			list.removeAt(list.count());
		});
		
		for (var i = 0; i < TEST_DATA.length; i++) {
			this.assertEqual(TEST_DATA.length - i, list.count());
			this.assertEqual(TEST_DATA[i], list.item(0));
			list.removeAt(0);
		}
		this.assertEqual(0, list.count());
		
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		for (var i = TEST_DATA.length - 1; i >= 0; i--) {
			this.assertEqual(TEST_DATA[i], list.item(list.count() - 1));
			this.assertEqual(i + 1, list.count());
			list.removeAt(list.count() - 1);
		}
	},
		
	// jsinq.List.removeRange
	testRemoveRange: function() {
		var list = new jsinq.List();
		this.assertRaise("ArgumentOutOfRangeException", function() {
			list.removeRange(0, list.count());
		});
		
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		this.assertRaise("ArgumentOutOfRangeException", function() {
			list.removeRange(-1, list.count());
		});
		this.assertRaise("ArgumentOutOfRangeException", function() {
			list.removeRange(0, list.count() + 1);
		});
		
		list.removeRange(0, list.count());
		this.assertEqual(0, list.count());
		
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		list.removeRange(1, list.count() - 2);
		this.assertEqual(2, list.count());
		this.assertEqual(TEST_DATA[0], list.item(0));
		this.assertEqual(TEST_DATA[TEST_DATA.length - 1], list.item(1));
	},
		
	// jsinq.List.reverse
	testReverse: function() {
		var list = new jsinq.List();
		list.reverse();
		this.assertEqual(0, list.count());
		
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		list.reverse();
		this.assertEqual(TEST_DATA.length, list.count());
		
		var index = 0;
		for (var i = TEST_DATA.length - 1; i >= 0; i--) {
			this.assertEqual(TEST_DATA[i], list.item(index++));
		}
		
		list = new jsinq.List();
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		list.reverse(1, list.count() - 2);
		this.assertEqual(TEST_DATA[0], list.item(0));
		this.assertEqual(TEST_DATA[TEST_DATA.length - 1], 
			list.item(TEST_DATA.length - 1));

		index = 1;
		for (i = TEST_DATA.length - 2; i >= 1; i--) {
			this.assertEqual(TEST_DATA[i], list.item(index++));
		}
	},
		
	// jsinq.List.sort
	testSort: function() {
		var list = new jsinq.List();
		list.sort();
		this.assertEqual(0, list.count());
		
		list.addRange(new jsinq.Enumerable(SORT_TEST_DATA));
		list.sort();
		this.assertEqual(SORT_TEST_DATA.length, list.count());
		var last = -0xFFFFFFFF;
		for (var i = 0; i < list.count(); i++) {
			this.assertEqual(true, list.item(i) > last);
			last = list.item(i);
		}
		
		list = new jsinq.List(new jsinq.Enumerable(SORT_TEST_DATA2));
		list.sort(function(a, b) { 
			if (a.charAt(1) > b.charAt(1)) {
				return -1;
			} else if (a.charAt(1) < b.charAt(1)) {
				return 1;
			} else {
				return 0;
			}
		});
		last = "Z";
		for (i = 0; i < list.count(); i++) {
			this.assertEqual(true, list.item(i).charAt(1) < last);
			last = list.item(i).charAt(1);
		}
		
		list = new jsinq.List(new jsinq.Enumerable(SORT_TEST_DATA));
		list.sort(1, list.count() - 2, jsinq.Comparer.getDefault());
		this.assertEqual(SORT_TEST_DATA.length, list.count());
		this.assertEqual(SORT_TEST_DATA[0], list.item(0));
		this.assertEqual(SORT_TEST_DATA[SORT_TEST_DATA.length - 1], 
			list.item(SORT_TEST_DATA.length - 1));
		last = -0xFFFFFFFF;
		for (i = 1; i < list.count() - 1; i++) {
			this.assertEqual(true, list.item(i) > last);
			last = list.item(i);
		}
	},
		
	// jsinq.List.toArray
	testToArray: function() {
		var list = new jsinq.List();
		var array = list.toArray();
		this.assertEqual(true, array instanceof Array);
		this.assertEqual(0, array.length);
		
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		array = list.toArray();
		this.assertEqual(TEST_DATA.length, array.length);
		for (var i = 0; i < array.length; i++) {
			this.assertEqual(TEST_DATA[i], array[i]);
		}
	},
		
	// jsinq.List.trueForAll
	testTrueForAll: function() {
		var _this = this;
		
		var list = new jsinq.List();
		var result = list.trueForAll(function() { return true; });
		this.assertEqual(false, result);
		
		list.addRange(new jsinq.Enumerable(TEST_DATA));
		var index = 0;
		result = list.trueForAll(function(e) { 
			_this.assertEqual(TEST_DATA[index], e);
			return e == TEST_DATA[index++]; 
		});
		this.assertEqual(TEST_DATA.length, index);
		this.assertEqual(true, result);
		
		result = list.trueForAll(function() { return false; });
		this.assertEqual(false, result);
	}
 });