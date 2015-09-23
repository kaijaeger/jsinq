/* 
 * JSINQ, JavaScript integrated query
 * Copyright (c) 2010 Kai Jäger. Some rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the license.txt file. 
 */

(function() {
	// This refers to all the <tr> elements inside the input's <tbody>.
	// You would normally do that with your JavaScript framework.
	var input = document.getElementById('input').getElementsByTagName('tr');
	
	// Create an enumerable from the node list so that we can write queries
	// against it.
	var enumerable = new jsinq.Enumerable(input);
	
	// This query selects all rows from the input table where the value of the
	// id field is divisible by two and orders the results by the value of the
	// lastname field. Once again, the DOM-uglyness could be avoided by using
	// an appropriate JavaScript framework.
	var query = new jsinq.Query('\
		from tr in $0 \
		where tr.childNodes[0].firstChild.nodeValue % 2 == 0 \
		orderby tr.childNodes[2].firstChild.nodeValue \
		select tr.cloneNode(true) \
	');

	// Assign the enumerable to placeholder $0
	query.setValue(0, enumerable);
	
	// Execute the query and store the results in the result variable
	var result = query.execute();	
	
	// This refers to the <tbody> element of our results table.
	var resultContainer = document.getElementById('results');	
	
	// Finally we iterate over the result set and append each <tr> element
	// to our results table.
	result.each(function(element) {
		resultContainer.appendChild(element);
	});
})();