/* 
 * JSINQ, JavaScript integrated query
 * Copyright (c) 2010 Kai Jäger. Some rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the license.txt file. 
 */

(function() {
	function addRow(parent, caption) {
		var row = document.createElement("div");
		row.appendChild(document.createTextNode(caption));
		parent.appendChild(row);		
	}
	
	var source1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
	var source2 = ["one", "two", "three", "four", "five", "six", "seven",
		"eight", "nine"];
	
	var source1Element = document.getElementById("source1");
	var source2Element = document.getElementById("source2");
	var resultElement = document.getElementById("result");
	
	var source1Enumerable = new jsinq.Enumerable(source1);
	var source2Enumerable = new jsinq.Enumerable(source2);
	var result = source1Enumerable.zip(source2Enumerable, 
		function(first, second) {
			return first + " " + second;
		});
		
	source1Enumerable.each(function(element) {
		addRow(source1Element, element);
	});		
		
	source2Enumerable.each(function(element) {
		addRow(source2Element, element);
	});			
	
	result.each(function(element) {
		addRow(resultElement, element);
	});
})();