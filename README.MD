﻿# What is JSINQ?

JSINQ is a complete implementation of LINQ to Objects in JavaScript. LINQ 
stands for "Language Integrated Query" and it is a component of Microsoft's 
.NET framework. With LINQ, you can write SQL-like queries against in-memory
collections, relational databases, XML documents and many other data sources.
LINQ to Objects, the part of LINQ that JSINQ implements in JavaScript, deals 
with querying in-memory data structures such as arrays, lists, etc.

## Release Notes for Version 1.0

* jsinq-enumerable.js renamed to jsinq.js as it now also hosts the new types
  jsinq.Dictionary and jsinq.List (see next two bullet points)
* New type jsinq.Dictionary, a faithful JavaScript implementation of 
  System.Collections.Generic.Dictionary. Supports both primitive and complex
  keys (complex keys are supported with limited efficiency)
* New type jsinq.List, a faithful JavaScript implementation of 
  System.Collections.Generic.List.
* New test suite for jsinq.Dictionary  
* New test suite for jsinq.List
* jsinq.Enumerable modified to use jsinq.Dictionary instead of specialized hash
  type that was used in previous versions.
* New .NET 4.0 query operator "zip" added to jsinq.Enumerable
* New method "each" for jsinq.Enumerable that simplifies enumeration

## How to use JSINQ

* Copy the files jsinq.js and jsinq-query.js from the build folder
  to a location in your project folder.
* Embed the JavaScript files into your HTML page using the following code
  <script type="text/javascript" src="jsinq.js"></script>
  <script type="text/javascript" src="jsinq-query.js"></script>
* Use JSINQ either using the method-chaining syntax:
  ```
  var result = 
    customers.groupBy(function(customer) { 
        return customer.lastname; 
    }).
    select(function(g) { 
        return {lastname: g.key, count: g.count()}; 
    }).
    orderByDescending(function(r) { 
        return r.count; 
    });
  ```
  or using query comprehension syntax:
  ```
  var query = new jsinq.Query('\
    from customer in $0 \
    group customer by customer.lastname into g \
    select {lastname: g.key, count: g.count()} \
    into r \
    orderby r.count descending \
    select r \
  ');

  query.setValue(0, customers);
  var result = query.execute();
  ```
* Look at the examples in the samples folder and read the reference at
  http://www.codeplex.com/jsinq
* Report bugs and give feedback. Thanks!


## Known issues
* The error messages generated by the query compiler are often inaccurate and
  the line numbers referred to in the error message are often not where the
  actual error is.
* The query compiler will fail to compile expressions that contain the new or
  typeof operator without a trailing whitespace, e.g. new(Object) will fail.
* The query parser does not currently understand regular expression literals.
  If you wish to use regular expressions in your query, use new RegExp(...)
  or define your regular expressions outside the query and pass them in via 
  placeholders (this is the preferred method).
* The test suite for jsinq.Query is inadequate and only tests a handful of
  mostly trivial queries.
