/*
Move to Express library expressServer creation as now starting to create
more complex client side needing e.g. app.js files to also be parsed.
More complex to do manually and Express handles this nicely for you.
*/

// Import path to successfully access files in other folders
const path = require('path');

// Import express and initialise instance
const express = require('express');
const expressServer = express();

// Define desired server port
var port = 8080;

// Serve up 'static' files from the publicly accessible 'Public' folder
expressServer.use(express.static('../Public/webapp/'));

// Send back index.html when user access root
expressServer.get('/', function(req, res){
	res.sendFile(path.join(__dirname, '../Public/webapp/index.html'));
});

// Special case when user requests server close
expressServer.get('/close', function(req, res){
	req.destroy();
	httpServer.close(() => console.log('Server closed'));
});

// New submitted URL form
// Clear previous data and restart
expressServer.use('/new-url-submit/', function(req, res, next){
	let query = req.query;
	let companyUrl = query['company-url'];
	console.log("Input URL", companyUrl)
	// Import module to scrape website
	var modules = require('./scrapingAndAnalysis3.js');

	// scrapeWebsite returns a promise
	// To use promise, need to do:
	// output.then(function(promiseReturnValue){//do something when value returned})
	output = modules.scrapeWebsite(companyUrl);
	output
	.then(
		function(promiseReturnValue){
			res.send(promiseReturnValue);
			console.log("Return value:", promiseReturnValue);
		}
	)
	.catch( 
		function(err){
			res.send(err);
		}
	);
});

// New submitted URL from graph node click
// Clear previous data and restart
expressServer.use('/node-click-submit/', function(req, res, next){
	console.log("Node click submit received.", req.query)
	let query = req.query;
	let companyUrl = query['company-url'];
	console.log("Input URL", companyUrl)
	// Import module to scrape website
	var modules = require('./scrapingAndAnalysis3.js');

	// scrapeWebsite returns a promise
	// To use promise, need to do:
	// output.then(function(promiseReturnValue){//do something when value returned})
	output = modules.scrapeWebsite(companyUrl);
	output
	.then(
		function(promiseReturnValue){
			res.send(promiseReturnValue);
			console.log("Return value:", promiseReturnValue);
		}
	)
	.catch( 
		function(err){
			res.send(err);
		}
	);
});

// Start expressServer listening on desired port.
// Create a separate httpServer and pass in expressServer to be able to close httpServer explicitly by user later
httpServer = require('http').createServer(expressServer);
httpServer.listen(port, (p = port) => console.log('App listening on port ' + p))

