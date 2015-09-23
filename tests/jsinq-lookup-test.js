/* 
 * JSINQ, JavaScript integrated query
 * Copyright (c) 2010 Kai Jäger. Some rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the license.txt file. 
 */

new Test.Unit.Runner({
	// jsinq.Lookup.applyResultSelector
	testApplyResultSelector: function() {
		var enumerable = jsinq.Enumerable.range(0, 50);
		var lookup = enumerable.toLookup(function(element) {
			return element % 5;
		});
		var result = lookup.applyResultSelector(function(key, element) {
			return element;
		});
		
		genericTestEnumerable.call(this, result, true);
		
		var list = result.toList();
		this.assertEqual(50, list.count());

		list.sort();
		
		for (var i = 0; i < 50; i++) {
			this.assertEqual(i, list.item(i));
		}
	}
 });