/* 
 * JSINQ, JavaScript integrated query
 * Copyright (c) 2010 Kai Jäger. Some rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the license.txt file. 
 */
 
// Test data
var TEST_DATA = [
	{id: 1, firstname: "Bob", lastname: "Carlson"},
	{id: 2, firstname: "Pete", lastname: "Jackson"},
	{id: 3, firstname: "Cindy", lastname: "Smith"},
	{id: 4, firstname: "Alice", lastname: "Wilkinson"},
	{id: 5, firstname: "Frank", lastname: "McGee"},
	{id: 6, firstname: "Joanne", lastname: "Jackson"},
	{id: 7, firstname: "Marcy", lastname: "Goldberg"},
	{id: 8, firstname: "Keith", lastname: "Wade"},
	{id: 9, firstname: "Jonathan", lastname: "Hill"},
	{id: 10, firstname: "Aaron", lastname: "Lamar"}
];

var MORE_TEST_DATA = [
	{id: 1, item: 1, quantity: 5},
	{id: 5, item: 5, quantity: 1},
	{id: 8, item: 9, quantity: 2},
	{id: 3, item: 4, quantity: 4}
];

new Test.Unit.Runner({
	// from ... into
	testQueryContinuation: function() {
		var query = new jsinq.Query('\
			from a in $0 \
			group a by a.firstname into g \
			select { color: g.getKey(), count: g.count() } \
		');
		query.setValue(0, new jsinq.Enumerable(TEST_DATA));
		var result = query.execute();
		this.assertEqual(TEST_DATA.length, result.count());
	},
		
	// from ... select
	testDegenerateQuery: function() {
		var query = new jsinq.Query('\
			from a in $0 \
			select a \
		');
		query.setValue(0, new jsinq.Enumerable(TEST_DATA));
		var result = query.execute();
		this.assert(result.sequenceEqual(new jsinq.Enumerable(TEST_DATA)));
	},	
		
	// from ... from ... select
	testSecondFromClause: function() {
		var query = new jsinq.Query('\
			from a in $0 \
			from b in $1 \
			select {id: c.id, item: b.item, quantity: b.quantity} \
		');
		query.setValue(0, new jsinq.Enumerable(TEST_DATA));
		query.setValue(1, new jsinq.Enumerable(MORE_TEST_DATA));
		var result = query.execute();
		this.assertEqual(TEST_DATA.length * MORE_TEST_DATA.length,
			result.count());
	},		
		
	// from ... from ... orderby ... select
	testSecondFromOrderby: function() {
		var query = new jsinq.Query('\
			from a in $0 \
			from b in $1 \
			orderby a.lastname descending \
			select {id: c.id, item: b.item, quantity: b.quantity} \
		');
		query.setValue(0, new jsinq.Enumerable(TEST_DATA));
		query.setValue(1, new jsinq.Enumerable(MORE_TEST_DATA));
		var result = query.execute();
		this.assertEqual(TEST_DATA.length * MORE_TEST_DATA.length,
			result.count());
	},
		
	// from ... let ... where ... select
	testLetClause: function() {
		var query = new jsinq.Query('\
			from a in $0 \
			let t = a.lastname.length + a.firstname.length \
			where t >= 5 \
			select {id: a.id, t: t} \
		');
		query.setValue(0, new jsinq.Enumerable(TEST_DATA));
		var result = query.execute();
		this.assertEqual(TEST_DATA.length, result.count());
	},
		
	// from ... join ... select
	testJoin: function() {
		var query = new jsinq.Query('\
			from a in $0 \
			join b in $1 on a.id equals b.id \
			select {firstname: a.firstname} \
		');
		query.setValue(0, new jsinq.Enumerable(TEST_DATA));
		query.setValue(1, new jsinq.Enumerable(MORE_TEST_DATA));
		var result = query.execute();
		this.assertEqual(MORE_TEST_DATA.length, result.count());
	},
	
	// from ... join into ... let ... where ... select
	testJoinInto: function() {
		var query = new jsinq.Query('\
			from a in $0 \
			join b in $1 on a.id equals b.id into c \
			let d = c.count() \
			where d > 0 \
			select {firstname: a.firstname, count: d} \
		');
		query.setValue(0, new jsinq.Enumerable(TEST_DATA));
		query.setValue(1, new jsinq.Enumerable(MORE_TEST_DATA));
		var result = query.execute();
		this.assertEqual(MORE_TEST_DATA.length, result.count());
	},
	
	// from ... orderby ... select
	testOrderBy: function() {
		var query = new jsinq.Query('\
			from a in $0 \
			orderby a.lastname, a.firstname descending \
			select a \
		');
		query.setValue(0, new jsinq.Enumerable(TEST_DATA));
		var result = query.execute();
		this.assertEqual(TEST_DATA.length, result.count());		
	}
 });