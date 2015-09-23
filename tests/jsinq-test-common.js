/* 
 * JSINQ, JavaScript integrated query
 * Copyright (c) 2010 Kai Jäger. Some rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the license.txt file. 
 */
 
// Basic test that any Enumerable should pass
function genericTestEnumerable(enumerable, checkContents) {
	if (arguments.length < 2) {
		checkContents = true;
	}
	this.assert(enumerable instanceof jsinq.Enumerable);
	var enumerator = enumerable.getEnumerator();
	var elements = [];
	while (enumerator.moveNext()) {
		var current;
		this.assertNothingRaised(function() { 
			current = enumerator.current(); 
		});
		elements.push(current);
	}
	this.assertRaise(jsinq.InvalidOperationException.prototype.name,
		function() { enumerator.current(); });	
	enumerator.reset();
	var count = 0;
	while (enumerator.moveNext()) {
		current;
		this.assertNothingRaised(function() { 
			current = enumerator.current(); 
		});
		if (checkContents) {
			this.assertEqual(current, elements[count]);
		}
		++count;
	}
	this.assertEqual(elements.length, count);	
}