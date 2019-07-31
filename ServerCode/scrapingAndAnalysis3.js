/*
Methods to scrape and analyse companies house webpages. v3.

The following methods aim to:
- verify the URL is a valid companies house URL with either a /company/ or /officers/ extension.
- go to the webpage and scrape it for information about a company's officers, or an officer's "appointments".
- create a list of standardised nodes with officer/company information.
- create a list of standardised edges between above nodes.
- return to the server for sending to the client.
*/

module.exports = {

	scrapeWebsite: function(url){

		// Import required libraries:
		var RequestPromise = require('request-promise');
		var cheerio = require('cheerio');
		var EventEmitter = require('events').EventEmitter;
		var jsnx = require('jsnetworkx');

		// Define functions:
		/* 
		Check to see if inputted node URL is valid Companies house url.
		If it is, find which type of address it is (company or officers) and resolve that.
		Make sure company url is home page of the company, i.e. .../company/00001111 and not .../company/00001111/officers etc.
		*/
		function urlCheck(inputUrl){
			return new Promise((resolve, reject) => {
				// Do something which calls resolve(someval); or reject('fail reason');
				
				// Check various conditions. If any fail, call reject('...'), otherwise call resolve('url type: company or person')
				// If url doesn't include beta.companieshouse.gov.uk:
				if(!inputUrl.includes("beta.companieshouse.gov.uk")){
					reject("Input URL does not include \" beta.companieshouse.gov.uk\"");
				}
				// Valid URL. Determine if URL is for company or person.
				// If URL is for company will include "/company/" and should have company number after.
				// Use regex to match this situation, noting company numbers are 8 long, either all numbers of 2 letters then 6 numbers
				else if(regexMatch = inputUrl.match(/beta.companieshouse.gov.uk\/company\/[0-9A-Za-z]{2}[0-9]{6}/)){
					// regex expression DID match inputUrl, therefore inputUrl is company with correct format company number.
					formattedUrl = 'https://' + regexMatch[0];

					// Company URL. Can directly analyse company URL so return for analysis.
					resolve({type: 'company', url: formattedUrl});

				}
				// No regex expression for officers URL because it is not as standardised as company URL unfortunately.
				else if(inputUrl.includes("beta.companieshouse.gov.uk/officers/")){
					// Officer URL. Need to investigate whether officer is Person or Company and then return appropriate dict to inform this.
					resolve({type: 'officer', url: inputUrl});
				}
				else{
					reject("Unknown URL. URL does not include \"/company/company-number\" or \"/officers/\" so address format unknown. Input URL is: " + inputUrl);
				}
			});
		}//end nodeUrlCheck



		/*
		After URL check, get data by calling appropriate get function.
		*/
		function collectData(typeAndUrl){
			type = typeAndUrl.type;
			url = typeAndUrl.url;

			if (type == 'company'){
				return getCompanyData(url);
			}
			else if (type == 'officer'){
				return getOfficerData(url);
			}
			else{
				throw new Error('Type passed to collectData function is not \'company\' or \'officer\' so problem further upstream.');
			}
		}//end collectData



		/*
		Get company data.

		For a company URL, the head (company) node data is on a different webpage to the officers' data.
		Call both websites asynchronously and do the data gathering separately in different functions.
		After both functions have returned - get edges, combine data in dict, and return.
		*/
		function getCompanyData(url){
			// URL is in form ".../company/00001111" as standardised by urlCheck
			// Company details found in "url". Company officer details found in url + "/officers"
			var companyOfficersUrl = url + '/officers';

			// Call methods to get both company data & company officer's data asynchronously
			return Promise.all([getCompanyHeadNodeData(url), getCompanyOfficersData(companyOfficersUrl)])
			.then( ([companyData, officersData]) => {
				console.log('inside first PromiseAll .then statement');
				console.log('CompanyData: ', companyData, 'OfficersData: ', officersData);
				let headNode = companyData;
				let nodes = officersData;
				return [headNode, nodes];
			})

		}//end getCompanyData

		/*
		Method to get only the company node's core data (i.e. no child data from .../officers webpage).
		*/
		function getCompanyHeadNodeData(url){
			return RequestPromise(url)
			.then((htmlBody) => {
				let $ = cheerio.load(htmlBody);

				console.log('getCompanyHeadNodeData');

				let companyNumber = $('#company-number strong').text();
				let companyName = $('#company-name').text();

				return {
					'type': 'company',
					'searchType': 'primary-url-only',
					'name': companyName,
					'urlPrimary': url,
					'otherData': ['Company Number: ' + companyNumber]
				}
			})
			.then((output) => {
				console.log('getCompanyHeadNodeData2', output);
				return output;
			})
			.catch((err) => {
				throw err;
			})
		}//end getCompanyNodeData

		/*
		Method to get only a company's officers from the /company/.../officers webpage.
		*/
		function getCompanyOfficersData(companyOfficersUrl){
			return RequestPromise(companyOfficersUrl)
			.then((htmlBody) => {
				let $ = cheerio.load(htmlBody);

				console.log('getCompanyOfficersData');

				// Get the number of officers for the for loop
				let noOfficersStr = $('#company-appointments').text();
				let noOfficers = parseInt(noOfficersStr.substring(0, noOfficersStr.indexOf('officers') - 1))

				// Number of officers listed per page is limited to 35
				const maxNoOfficersPerPage = 35;

				// Only get the first page of officers:
				noOfficers = Math.min(noOfficers, maxNoOfficersPerPage);

				// Setup output list to push nodes to
				let output = [];

				for(let i = 1; i < noOfficers + 1; i++){
					// Get each officer's info in turn
					let officerName = $('#officer-name-' + i).text().trim();
					
					let officerHTML = $('#officer-name-' + i).html();
					
					let officerUrl = officerHTML.substring(officerHTML.indexOf('"') + 1)
					officerUrl = 'https://beta.companieshouse.gov.uk' + officerUrl.substring(0, officerUrl.indexOf('"'))
					
					let officerStatus = $('#officer-status-tag-' + i).text();
					
					console.log(officerName, officerUrl, officerStatus);
					output.push({
						'type' : 'officer',
						'searchType': 'none',
						'name' : officerName,
						'urlSecondary' : officerUrl,
						'status' : officerStatus,
						'otherData' : ['Officer status: ' + officerStatus]
					});
				}

				return output;
			})
			.then((output) => {
				console.log('getCompanyOfficersData2', output);
				return output;
			})
		}//end getCompanyOfficersData



		/*
		Get officer's appointments webpage data

		Both officer's head node data and officer's appointments' data are on the same webpage so only make one http request (unlike company url).
		After head and child nodes data retrieved, get edges, combine data in dict, and return.
		*/
		function getOfficerData(url){
			return RequestPromise(url)
			.then((htmlBody) => {
				let $ = cheerio.load(htmlBody);

				// Get head node data:

				let headNodeName = $('#officer-name').text();
				let headNodeType;
				let headNodeSearchType;

				// Test whether this officer is a company or a person by searching for a date-of-birth value (only person has this)
				if($('#officer-date-of-birth-value').text()){
					// Officer date of birth exists, therefore officer is a person
					headNodeType = 'person';
					headNodeSearchType = 'complete';
				}
				else{
					headNodeType = 'company';
					headNodeSearchType = 'secondary-url-only';
				}

				let headNode = {
					'type': headNodeType,
					'searchType': headNodeSearchType,
					'name': headNodeName,
					'urlPrimary': url,
					'status': 'unknown',
					'otherData': []
				}


				// Get child nodes data:

				let nodes = [];

				let noAppointmentsStr = $('#personal-appointments').text().trim();
				// Use regex lookbehind (?<) positive matching (?=)
				// Give the text that is directly preceeded by "appointments ".
				// For appointments page, this should be the number of appointments. Parse to int.
				let noAppointments = parseInt(noAppointmentsStr.match(/(?<=appointments ).*$/))

				// The number of appointments listed per page is limited to 35.
				const maxNoAppointmentsPerPage = 35;

				// Only get first page worth of appointments:
				noAppointments = Math.min(noAppointments, maxNoAppointmentsPerPage);
				
				for(let i = 1; i < noAppointments + 1; i++){
					// Get each appointment's info in turn. Every appointment is a company
					let companyNameText = $('#company-name-' + i).text().trim();

					// For appointments, companyNameText is of form: companyName (companyNumber)
					// regex: match everything before (^.*) the company number (?= AA000011)
					// regex returns a list. 1st element [0] is the matched text.
					let companyName = companyNameText.match(/^.*(?= \([0-9a-zA-Z]{2}[0-9]{6}\))/)[0];
					let companyNumber = companyNameText.match(/[0-9a-zA-Z]{2}[0-9]{6}/)[0];

					// Company URLs are standardised:
					let companyUrl = 'https://beta.companieshouse.gov.uk/company/' + companyNumber;

					// Company still active or dissolved
					let companyStatus = $('#company-status-value-' + i).text().trim();

					// Appointment status: Active or Resigned
					let appointmentStatus = $('#appointment-status-tag-' + i).text().trim();

					nodes.push({
						'type' : 'company',
						'searchType': 'none',
						'name' : companyName,
						'urlPrimary' : companyUrl,
						'status' : appointmentStatus,
						'otherData' : ['Appointment status: ' + appointmentStatus, 'Company status: ' + companyStatus]
					})
				}

				return [headNode, nodes];
			})
		}



		/*
		Get list of edges.

		Given a head node and a list of child nodes, create a list of edges from the head node to each child node.
		*/
		function createEdges([headNode, nodes]){
			console.log('inside createEdges\nheadNode: ', headNode, '\nnodes: ', nodes);
			// Return a promise so everything evaluates asynchronously and correctly
			return new Promise((res, rej) => {
				// For each node, create a link (ok to use "item in list" as is a standard array... unless arrays have been redefined by d3 or something)
				edges = [];
				for (let i = 0; i < nodes.length; i++){
					node = nodes[i];
					// TODO: define edge direction by headNode and node types
					edges.push({'source':headNode.name, 'target':node.name, 'status':node.status});
				}
				// Add headnode to the FRONT of nodes list
				nodes = [headNode].concat(nodes);

				res({'nodes':nodes, 'edges':edges});
			})
			
		}



		// Actually call functions and return promise
		return urlCheck(url)
		.then((args) => {
			console.log('urlCheck return val:', args);
			return collectData(args);
		})
		.then((args) => {
			console.log('Creating edges from collected data.');
			return createEdges(args);
		})
		.catch((err) => {
			console.log('Error occurred inside scrapingAndAnalysis.js.\n', err);
			// Propagate error up
			throw err;
		})		



	}//end scrapeWebsite function

}

