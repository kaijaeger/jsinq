/* 
 * JSINQ, JavaScript integrated query
 * Copyright (c) 2010 Kai Jäger. Some rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the license.txt file. 
 */

(function() {
	// This is the query that sorts the table. Note that we define the query
	// just once but use it many times, whenever the user clicks one of the
	// column headers. Also note the two placeholders, $0 holds the contents
	// of the table while $1 indicates the column that will be sorted.
	var query = new jsinq.Query('\
		from tr in $0 \
		orderby tr.childNodes[$1].firstChild.nodeValue \
		select tr \
	');	

	// Because the contents of the table do not change at runtime we can
	// simply select the table rows we wish to sort once and then pass them
	// to the query using the setValue method.
	var tableBody = document.getElementById('table-body');
	var trs = tableBody.getElementsByTagName('tr');
	query.setValue(0, new jsinq.Enumerable(trs));
	
	// This function is invoked whenever one of the column headers is clicked.
	function sortTable(index) {
		// The index parameter contains the index of the column that the user
		// wishes to sort. We pass this into the query and then execute it.
		query.setValue(1, index);
		var result = query.execute();
		
		// Take the rows which are not sorted and put the back into the table
		// body.
		result.each(function(element) {
			tableBody.appendChild(element);
		});	
	}
	
	// Create onclick handlers for all the table headers. This is boilerplate
	// code that your JavaScript framework can usually help you with.
	var tableHeaders = document.getElementById('table-head').
		getElementsByTagName('td');
	
	for (var i = 0; i < tableHeaders.length; i++) {
		tableHeaders[i].onclick = (function(index) { 
			return function() { sortTable.call(this, index); }; 
		})(i);
	}
})();