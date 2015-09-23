/* 
 * JSINQ, JavaScript integrated query
 * Copyright (c) 2010 Kai Jäger. Some rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the license.txt file. 
 */

(function() {
	// This is the data we will write our query against. It could be something
	// that you have retrieved from a web-server via XMLHttpRequest, something
	// the user has typed in or something you have generated on the fly.
	var data = {
		customers: [
			{id: 1, firstname: 'John', lastname: 'Smith', gender: 'male'},
			{id: 2, firstname: 'Jessica', lastname: 'Johnson', 
				gender: 'female'},
			{id: 3, firstname: 'Michael', lastname: 'Williams', 
				gender: 'male'},
			{id: 4, firstname: 'Amber', lastname: 'Davis', gender: 'female'},
			{id: 5, firstname: 'Jonathan', lastname: 'Robinson', 
				gender: 'male'},
			{id: 6, firstname: 'Angela', lastname: 'Hill', gender: 'female'},
			{id: 7, firstname: 'Richard', lastname: 'Bailey', gender: 'male'},
			{id: 8, firstname: 'Shannon', lastname: 'Brooks', 
				gender: 'female'},
			{id: 9, firstname: 'Samuel', lastname: 'Patterson', 
				gender: 'male'},
			{id: 10, firstname: 'Taylor', lastname: 'Griffin', 
				gender: 'female'}
		]
	};

	// To be able to write queries against your data, you will first have to
	// wrap your data in an enumerable like this:
	var enumerable = new jsinq.Enumerable(data.customers);
	
	// Finally, we define our query. It consists of an orderBy clause that
	// will order our customers by their lastname and a select clause that
	// will emit <tr> nodes that we will later put into our results table.
	// Note that whatever the select clause returns will become part of the
	// result set of the query. 
	var result = enumerable.orderBy(function(customer) {
		return customer.lastname;
	}).select(function(customer) {
		// If we were using a JavaScript framework, this could be much nicer.
		var tr = document.createElement('tr');
		var td;
		for (var field in customer) {
			td = document.createElement('td');
			td.appendChild(document.createTextNode(customer[field]));
			tr.appendChild(td);
		}
		return tr;
	});
	
	// This refers to the <tbody> element of our results table.
	var resultContainer = document.getElementById('results');	
	
	// Finally we iterate over the result set and append each <tr> element
	// to our results table.
	result.each(function(element) {
		resultContainer.appendChild(element);
	});
})();