/* 
 * JSINQ, JavaScript integrated query
 * Copyright (c) 2010 Kai Jäger. Some rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the license.txt file. 
 */

var PRIMITIVE_TEST_KEYS = [
	"primitiveTestKey",
	6,
	true,
	false,
	100,
	9.53
];

var COMPLEX_TEST_KEYS = [
	{test: "Test"},
	new Date(),
	new Number(5),
	[1, 2, 3],
	{test: [1, 2, 3]},
	document.createElement('div')
];

var TEST_VALUES = [
	[1, 2, 3],
	new Date(),
	"Hello World",
	true,
	42,
	12.53493
];

new Test.Unit.Runner({
	// jsinq.Dictionary
	testConstructor: function() {
		var dictionary = new jsinq.Dictionary();
		this.assertEqual(0, dictionary.count());
		
		var comparer = jsinq.Comparer.getDefault();
		dictionary = new jsinq.Dictionary(comparer);
		this.assertEqual(comparer, dictionary.getComparer());
	},
		
	// jsinq.Dictionary.item
	testItem: function() {
		var dictionary = new jsinq.Dictionary();
		this.assertEqual(0, dictionary.count());
		
		var comparer = new jsinq.EqualityComparer();
		dictionary = new jsinq.Dictionary(comparer);
		this.assertRaise("KeyNotFoundException", function() {
			dictionary.item("fail");
		});
		
		dictionary = new jsinq.Dictionary();
		
		dictionary.add(PRIMITIVE_TEST_KEYS[0], TEST_VALUES[0]);
		this.assertEqual(TEST_VALUES[0], 
			dictionary.item(PRIMITIVE_TEST_KEYS[0]));
		
		dictionary.add(COMPLEX_TEST_KEYS[0], TEST_VALUES[1]);
		
		this.assertEqual(TEST_VALUES[1], 
			dictionary.item(COMPLEX_TEST_KEYS[0]));		
		
		dictionary.remove(PRIMITIVE_TEST_KEYS[0]);
		dictionary.remove(COMPLEX_TEST_KEYS[0]);
		
		this.assertRaise("KeyNotFoundException", function() {
			dictionary.item(PRIMITIVE_TEST_KEYS[0]);
		});			
		
		this.assertRaise("KeyNotFoundException", function() {
			dictionary.item(COMPLEX_TEST_KEYS[0]);
		});		
	},
		
	// jsinq.Dictionary.item
	testSet: function() {	
		var dictionary = new jsinq.Dictionary();
		for (var i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			dictionary.set(PRIMITIVE_TEST_KEYS[i], TEST_VALUES[i]);
		}
		for (i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			dictionary.set(COMPLEX_TEST_KEYS[i], TEST_VALUES[i]);
		}	
		for (i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			this.assertEqual(TEST_VALUES[i], 
				dictionary.item(PRIMITIVE_TEST_KEYS[i]));
		}	
		for (i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			this.assertEqual(TEST_VALUES[i], 
				dictionary.item(COMPLEX_TEST_KEYS[i]));
		}	
		
		for (i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			dictionary.set(COMPLEX_TEST_KEYS[i], i);
		}			
		
		this.assertEqual(PRIMITIVE_TEST_KEYS.length + COMPLEX_TEST_KEYS.length,
			dictionary.count());
	},
		
	// jsinq.Dictionary.count
	testCount: function() {
		var dictionary = new jsinq.Dictionary();
		this.assertEqual(0, dictionary.count());
		
		var expectedCount = 0;
		for (var i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			dictionary.set(PRIMITIVE_TEST_KEYS[i], TEST_VALUES[i]);
			++expectedCount;
			this.assertEqual(expectedCount, dictionary.count());
		}
		
		for (i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			dictionary.set(COMPLEX_TEST_KEYS[i], TEST_VALUES[i]);
			++expectedCount;
			this.assertEqual(expectedCount, dictionary.count());
		}		
		
		for (var i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			dictionary.remove(PRIMITIVE_TEST_KEYS[i]);
			--expectedCount;
			this.assertEqual(expectedCount, dictionary.count());
		}	
		
		for (i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			dictionary.remove(COMPLEX_TEST_KEYS[i]);
			--expectedCount;
			this.assertEqual(expectedCount, dictionary.count());
		}		
		
		dictionary.set(PRIMITIVE_TEST_KEYS[0], TEST_VALUES[0]);
		this.assertEqual(1, dictionary.count());
		dictionary.clear();
		this.assertEqual(0, dictionary.count());
	},
		
	// jsinq.Dictionary.getComparer
	testGetComparer: function() {
		var dictionary = new jsinq.Dictionary();
		this.assertEqual(null, dictionary.getComparer());

		var comparer = new jsinq.EqualityComparer();
		dictionary = new jsinq.Dictionary(comparer);
		this.assertEqual(comparer, dictionary.getComparer());	
		
		dictionary = new jsinq.Dictionary(jsinq.EqualityComparer.getDefault());
		this.assertEqual(jsinq.EqualityComparer.getDefault(), 
			dictionary.getComparer());	
	},
		
	// jsinq.Dictionary.add
	testAdd: function() {
		var dictionary = new jsinq.Dictionary();
		for (var i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			this.assertNothingRaised(function() {
				dictionary.add(PRIMITIVE_TEST_KEYS[i], TEST_VALUES[i]);
			});
		}		
		this.assertEqual(COMPLEX_TEST_KEYS.length, dictionary.count());
		for (i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			this.assertNothingRaised(function() {
				dictionary.add(COMPLEX_TEST_KEYS[i], TEST_VALUES[i]);
			});
		}		
		this.assertEqual(PRIMITIVE_TEST_KEYS.length + COMPLEX_TEST_KEYS.length, 
			dictionary.count());		
		for (i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			this.assertEqual(TEST_VALUES[i], 
				dictionary.item(PRIMITIVE_TEST_KEYS[i]));
		}	
		for (i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			this.assertEqual(TEST_VALUES[i], 
				dictionary.item(COMPLEX_TEST_KEYS[i]));
		}	
		
		for (var i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			this.assertRaise("ArgumentException", function() {
				dictionary.add(PRIMITIVE_TEST_KEYS[i], TEST_VALUES[i]);
			});
		}		
		for (i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			this.assertRaise("ArgumentException", function() {
				dictionary.add(COMPLEX_TEST_KEYS[i], TEST_VALUES[i]);
			});
		}			
	},
		
	// jsinq.Dictionary.tryAdd
	testTryAdd: function() {
		var dictionary = new jsinq.Dictionary();
		var result;
		for (var i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			result = dictionary.tryAdd(PRIMITIVE_TEST_KEYS[i], TEST_VALUES[i]);
			this.assertEqual(true, result);
		}		
		for (i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			result = dictionary.tryAdd(COMPLEX_TEST_KEYS[i], TEST_VALUES[i]);
			this.assertEqual(true, result);
		}		
		
		for (var i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			result = dictionary.tryAdd(PRIMITIVE_TEST_KEYS[i], TEST_VALUES[i]);
			this.assertEqual(false, result);
		}		
		for (i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			result = dictionary.tryAdd(COMPLEX_TEST_KEYS[i], TEST_VALUES[i]);
			this.assertEqual(false, result);
		}			
	},		
		
	// jsinq.Dictionary.keys
	testKeys: function() {
		var dictionary = new jsinq.Dictionary();
		var keys = dictionary.keys();
		this.assertEqual(0, keys.count());
		genericTestEnumerable.call(this, keys);
		
		for (var i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			dictionary.set(PRIMITIVE_TEST_KEYS[i], TEST_VALUES[i]);
		}
		keys = dictionary.keys();
		this.assertEqual(PRIMITIVE_TEST_KEYS.length, keys.count());
		
		for (var i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			this.assertEqual(true, keys.contains(PRIMITIVE_TEST_KEYS[i]));
		}
		
		for (var i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			dictionary.set(COMPLEX_TEST_KEYS[i], TEST_VALUES[i]);
		}
		keys = dictionary.keys();
		this.assertEqual(PRIMITIVE_TEST_KEYS.length +
			COMPLEX_TEST_KEYS.length, keys.count());
				
		for (var i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			this.assertEqual(true, keys.contains(COMPLEX_TEST_KEYS[i]));
		}	
		genericTestEnumerable.call(this, keys);
	},
		
	// jsinq.Dictionary.values
	testValues: function() {
		var dictionary = new jsinq.Dictionary();
		var values = dictionary.values();
		this.assertEqual(0, values.count());
		genericTestEnumerable.call(this, values);
		
		for (var i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			dictionary.set(PRIMITIVE_TEST_KEYS[i], TEST_VALUES[i]);
		}
		values = dictionary.values();
		this.assertEqual(PRIMITIVE_TEST_KEYS.length, values.count());
		
		for (var i = 0; i < TEST_VALUES.length; i++) {
			this.assertEqual(true, values.contains(TEST_VALUES[i]));
		}
		
		dictionary.clear();
		
		for (var i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			dictionary.set(COMPLEX_TEST_KEYS[i], TEST_VALUES[i]);
		}
		values = dictionary.values();
		this.assertEqual(COMPLEX_TEST_KEYS.length, values.count());
		
		for (var i = 0; i < TEST_VALUES.length; i++) {
			this.assertEqual(true, values.contains(TEST_VALUES[i]));
		}	
		genericTestEnumerable.call(this, values);
	},
		
	// jsinq.Dictionary.clear
	testClear: function() {
		var dictionary = new jsinq.Dictionary();
		dictionary.clear();
		this.assertEqual(0, dictionary.count());
		
		for (var i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			dictionary.set(PRIMITIVE_TEST_KEYS[i], TEST_VALUES[i]);
		}
		for (var i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			dictionary.set(COMPLEX_TEST_KEYS[i], TEST_VALUES[i]);
		}
		
		dictionary.clear();
		
		for (var i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			this.assertEqual(false, 
				dictionary.containsKey(PRIMITIVE_TEST_KEYS[i]));
		}
		for (var i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			this.assertEqual(false, 
				dictionary.containsKey(COMPLEX_TEST_KEYS[i]));
		}		
	},
		
	// jsinq.Dictionary.containsKey
	testContainsKey: function() {	
		var dictionary = new jsinq.Dictionary();
		
		for (var i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			dictionary.set(PRIMITIVE_TEST_KEYS[i], TEST_VALUES[i]);
		}
		for (var i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			dictionary.set(COMPLEX_TEST_KEYS[i], TEST_VALUES[i]);
		}		
		
		for (var i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			this.assertEqual(true, 
				dictionary.containsKey(PRIMITIVE_TEST_KEYS[i]));
		}
		for (var i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			this.assertEqual(true, 
				dictionary.containsKey(COMPLEX_TEST_KEYS[i]));
		}	
		
		dictionary.clear();
		
		for (var i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			this.assertEqual(false, 
				dictionary.containsKey(PRIMITIVE_TEST_KEYS[i]));
		}
		for (var i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			this.assertEqual(false, 
				dictionary.containsKey(COMPLEX_TEST_KEYS[i]));
		}			
	},
		
	// jsinq.Dictionary.containsValue
	testContainsValue: function() {		
		var dictionary = new jsinq.Dictionary();
		
		for (var i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			dictionary.set(PRIMITIVE_TEST_KEYS[i], TEST_VALUES[i]);
		}
		for (i = 0; i < TEST_VALUES.length; i++) {
			this.assertEqual(true, 
				dictionary.containsValue(TEST_VALUES[i]));
		}	
		
		dictionary.clear();
		
		for (i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			dictionary.set(COMPLEX_TEST_KEYS[i], TEST_VALUES[i]);
		}
		for (i = 0; i < TEST_VALUES.length; i++) {
			this.assertEqual(true, 
				dictionary.containsValue(TEST_VALUES[i]));
		}	
		
		dictionary.clear();
		
		for (i = 0; i < TEST_VALUES.length; i++) {
			this.assertEqual(false, 
				dictionary.containsValue(TEST_VALUES[i]));
		}			
	},		
		
	// jsinq.Dictionary.getEnumerator
	testGetEnumerator: function() {
		var dictionary = new jsinq.Dictionary();
		genericTestEnumerable.call(this, dictionary);
		
		for (var i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			dictionary.set(PRIMITIVE_TEST_KEYS[i], TEST_VALUES[i]);
		}
		for (i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			dictionary.set(COMPLEX_TEST_KEYS[i], TEST_VALUES[i]);
		}
		
		var enumerator = dictionary.getEnumerator();
		var count = 0;
		while (enumerator.moveNext()) {
			var current = enumerator.current();
			++count;
			this.assertEqual(dictionary.item(current.key), current.value);
		}
		
		this.assertEqual(PRIMITIVE_TEST_KEYS.length + COMPLEX_TEST_KEYS.length,
			count);
	},
		
	// jsinq.Dictionary.toArray
	testToArray: function() {		
		var dictionary = new jsinq.Dictionary();
		var array = dictionary.toArray();
		
		this.assertEqual(0, array.length);
		
		for (var i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			dictionary.set(PRIMITIVE_TEST_KEYS[i], TEST_VALUES[i]);
		}
		for (i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			dictionary.set(COMPLEX_TEST_KEYS[i], TEST_VALUES[i]);
		}	
		array = dictionary.toArray();
		
		this.assertEqual(dictionary.count(), array.length);
		
		for (var i = 0; i < array.length; i++) {
			this.assertEqual(true, dictionary.containsKey(array[i].key));
			this.assertEqual(dictionary.item(array[i].key), array[i].value);
		}
	},
		
	// jsinq.Dictionary.remove
	testRemove: function() {		
		var dictionary = new jsinq.Dictionary();
		this.assertEqual(false, dictionary.remove(PRIMITIVE_TEST_KEYS[0]));
		this.assertEqual(false, dictionary.remove(COMPLEX_TEST_KEYS[0]));
		
		for (var i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			dictionary.set(PRIMITIVE_TEST_KEYS[i], TEST_VALUES[i]);
		}
		for (i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			dictionary.set(COMPLEX_TEST_KEYS[i], TEST_VALUES[i]);
		}	
		
		var count = dictionary.count();
		
		for (i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			dictionary.remove(PRIMITIVE_TEST_KEYS[i]);
			this.assertEqual(false, 
				dictionary.containsKey(PRIMITIVE_TEST_KEYS[i]));
			--count;
			this.assertEqual(count, dictionary.count());
		}
		for (i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			dictionary.remove(COMPLEX_TEST_KEYS[i]);
			this.assertEqual(false, 
				dictionary.containsKey(COMPLEX_TEST_KEYS[i]));
			--count;
			this.assertEqual(count, dictionary.count());
		}			
	},
		
	// jsinq.Dictionary.toString
	testToString: function() {		
		var dictionary = new jsinq.Dictionary();
		var string = dictionary.toString();		
		this.assertEqual(0, string.length);
		
		for (var i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			dictionary.set(PRIMITIVE_TEST_KEYS[i], TEST_VALUES[i]);
		}
		for (i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			dictionary.set(COMPLEX_TEST_KEYS[i], TEST_VALUES[i]);
		}	
		
		string = dictionary.toString();	
		
		for (i = 0; i < PRIMITIVE_TEST_KEYS.length; i++) {
			this.assertEqual(true, string.indexOf(
				PRIMITIVE_TEST_KEYS[i].toString() + ":" +
				TEST_VALUES[i]) > -1);
		}
		for (i = 0; i < COMPLEX_TEST_KEYS.length; i++) {
			dictionary.set(COMPLEX_TEST_KEYS[i], TEST_VALUES[i]);
			this.assertEqual(true, string.indexOf(
				COMPLEX_TEST_KEYS[i].toString() + ":" +
				TEST_VALUES[i]) > -1);			
		}	
	}	
 });