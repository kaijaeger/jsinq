/* 
 * JSINQ, JavaScript integrated query
 * Copyright (c) 2010 Kai Jäger. Some rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the license.txt file. 
 */
 
// This function creates a random well-formed query and returns it.
function generateFuzzQuery() {
	var queryBodyClauses = [
		'from i in e',
		'let i = true',
		'where true',
		'join i in true on true equals true',
		'join i in true on true equals true into i',
		'orderby true',
		'orderby true ascending',
		'orderby true descending',
		'orderby true, true',
		'orderby true ascending, true',
		'orderby true, true ascending'
	];

	var selectOrGroupClauses = [
		'select true',
		'group true by true'
	];

	var queryParts;
	var numQueryContinuations;
	var queryExpression;
	var query;
	
	function queryBody() {
		var numQueryBodyClauses = Math.floor(Math.random() * 20);
		for (var j = 0; j < numQueryBodyClauses; j++) {
			queryParts.push(queryBodyClauses[Math.floor(Math.random() * 
				queryBodyClauses.length)]);
		}
		queryParts.push(selectOrGroupClauses[Math.floor(Math.random() * 
			selectOrGroupClauses.length)]);
	}
	
	queryParts = ['from i in true'];
	queryBody();
	numQueryContinuations = Math.floor(Math.random() * 5);
	for (var k = 0; k < numQueryContinuations; k++) {
		queryParts.push('into i');
		queryBody();
	}
	queryExpression = queryParts.join("\n");
	return queryExpression;
}

var testsRemaining = 10000;
var successes = 0;
var failures = 0;

function runFuzzTest() {
	var query = generateFuzzQuery();
	
	try {
		var queryObject = new jsinq.Query(query);
		++successes;
	} catch (e) {
		document.getElementById('testlog').innerHTML += '<hr /><pre>' + query + '</pre><br /><span style="color: red">ERROR! ' + e.message + '</span>';
		++failures;
	}
	document.getElementById('successes').innerHTML = successes;
	document.getElementById('failures').innerHTML = failures;
	
	if (--testsRemaining > 0) {
		// So the browser stays responsive
		var timer = window.setTimeout(function() {
			runFuzzTest();
		}, 10);
	}
}