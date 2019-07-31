/*
d3 Network graph plotting and simulation activity

Useful websites:
https://d3js.org/
https://www.youtube.com/watch?v=9qsiJX8aINE
https://bl.ocks.org/shimizu/e6209de87cdddde38dadbb746feaf3a3
https://www.d3indepth.com/enterexit/
https://stackoverflow.com/questions/32026194/how-to-add-a-background-color-to-d3-text-elements
*/

// d3 included in html script tag

var width = 960,
	height = 750;

var r = 4;

var data = {'nodes':nodeList, 'edges':edgeList};

var canvas = d3.select('#graph-canvas');
var svg = canvas.append('svg');

var nodeList = [{'name':'CompA', 'x':23, 'y':343}, {'name':'CompB', 'x':2, 'y':342}],
	edgeList = [{'source':'CompA', 'target':'CompB'}];
	// nodeGroup = svg.append("g"),
	// node = nodeGroup.data(nodeList).selectAll("circle").enter().append("circle").attr("r", r),
	// edgeGroup = svg.append("g"),
	// link = edgeGroup.data(edgeList).selectAll("line").enter().append("line").attr("stroke", "black");

canvas.attr("width", width)
	.attr("height", height);

svg.attr("width", width)
	.attr("height", height);

var simulation = d3.forceSimulation()
	.force("collide", d3.forceCollide( r ))
	.force("charge", d3.forceManyBody().strength(-2000))
	.force("x", d3.forceX(width/2))
	.force("y", d3.forceY(height/2))
	.force("link", d3.forceLink().id( d => d.name ));

var linkGroup = svg.append("g")
	.attr("class", "links");
var nodeGroup = svg.append("g")
	.attr("class", "nodes");

// Inisialise link and node so can be merged inside restart()
var link = linkGroup.selectAll(".link");
var node = nodeGroup.selectAll(".node");

restart();

function restart(){
	// Redefine and restart simulation
	simulation.nodes(nodeList).on("tick", tickUpdate);
	simulation.force("link").links(edgeList);

	link = linkGroup.selectAll(".link")
		.data(edgeList)
		.enter()
		.append("line")
		.attr("class", "link")
		// .attr("stroke", "black")
		.each(function(d){
			if (d.status == 'Active') {
				d3.select(this)
					.attr("stroke", "green")
					.attr("stroke-width", 5);
			}
			else if (d.status == 'Resigned'){
				d3.select(this)
					.attr("stroke", "grey")
					.attr("stroke-width", 3);
			}
			else if (d.status == 'Dissolved'){
				d3.select(this)
					.attr("stroke", "red")
					.attr("stroke-width", 3);
			}
			else{
				d3.select(this)
					.attr("stroke", "black");
			}
		})
		.merge(link);

	// If edges have been removed from data, remove them from the DOM
	// "exit" is the opposite of "enter" - a selection of the DOM objects
	// which no longer have a piece of 'data' associated with them.
	link.exit().remove();

	node = nodeGroup.selectAll(".node")
		.data(nodeList)
		.enter()
		.append("g")
		.attr("class", "node")
		.each(function(d){
			let selection = d3.select(this);

			// Create selections and set default values
			selection.append("circle")
				.attr("r", r)
				.attr("stroke-width", 3)
				.attr("stroke", "black")
				.attr("fill", "white");

			selection.append("text")
				.text((d) => d.name)
				.attr("text-anchor", "right")
				.attr("dx", r + 2)
				.attr("dy", r)
				.attr("fill", "black")
				.attr("font-size", 12)
				.attr("font-weight", "bold")
				.call(getBoundingBox); // get Text's bounding box selection and save to d
			
			selection.insert("rect", "text") // 'insert rect before text element'
				.attr("x", (d) => d.bbox.x*1.1)
				.attr("y", (d) => d.bbox.y)
				.attr("width", (d) => d.bbox.width)
				.attr("height", (d) => d.bbox.height)
				.attr("fill", "#F5F5F5");

			let circle = selection.select("circle");
			let rect = selection.select("rect");
			let text = selection.select("text");

			// Edit node colour and size depending type
			if(d.type == 'officer'){
				// Distinguish between not searched and fully searched officers
				if(d.searchType == 'none'){
					circle.attr("fill", "white");
				}
				else if(d.searchType == 'complete'){
					circle.attr("fill", "black");
				}
				else{
					circle.attr("fill", "white");
				}
			}
			else if(d.type == 'company'){
				circle.attr("r", r + 3)
					.attr("stroke", "black");

				if(d.searchType == 'primary-url-only'){
					circle.attr("fill", "green");
				}
				else if(d.searchType == 'secondary-url-only'){
					circle.attr("fill", "red");
				}
				else if(d.searchType == 'complete'){
					circle.attr("fill", "black");
				}
				else{
					circle.attr("fill", "white");
				}
			}
			else{//default

			}
		})
		.merge(node)
		.call(d3.drag()
			.on("start", dragStarted)
			.on("drag", beingDragged)
			.on("end", dragEnded))
		.on("click", submitAndReceiveClick);

	// "Exit" any removed nodes
	node.exit().remove();

	simulation.alpha(1).restart();

	function tickUpdate(){
		link.attr("x1", d => d.source.x)
			.attr("y1", d => d.source.y)
			.attr("x2", d => d.target.x)
			.attr("y2", d => d.target.y);

		node.attr("transform", d => "translate("+d.x+","+ d.y+")" );

	}//end tickUpdate()

	function getBoundingBox(selection) {
	    selection.each(function(d){d.bbox = this.getBBox();})
	}//end getBB

}//end restart()

// drag functions from:
// https://bl.ocks.org/shimizu/e6209de87cdddde38dadbb746feaf3a3
function dragStarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
function beingDragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragEnded(d) {
    if (!d3.event.active) simulation.alphaTarget(0.2);
    d.fx = d3.event.x;
    d.fy = d3.event.y;
} 

function handleNewDataAndGraph(newData){
	const inputNodes = newData.nodes;
	const inputEdges = newData.edges;

	nodeList = nodeList.concat(inputNodes);
	edgeList = edgeList.concat(inputEdges);

	restart();

}


/*
Handle Companies House URL form submission.

Useful websites:
https://blog.bitsrc.io/a-beginners-guide-to-server-side-web-development-with-node-js-17385da09f93
https://alligator.io/nodejs/express-basics/
http://qnimate.com/express-js-middleware-tutorial/
https://nodejs.org/api/http.html
https://stackoverflow.com/questions/36512859/how-to-make-synchronous-http-call-using-promises-in-nodejs
*/
$('#new-url-form').submit(submitAndReceiveForm);

function submitAndReceiveForm(event){
	// Code from: https://www.sanwebe.com/2016/07/ajax-form-submit-examples-using-jquery
	event.preventDefault(); //prevent default action 
	var post_url = $(this).attr("action"); //get form action url
	var request_method = $(this).attr("method"); //get form GET/POST method
	var form_data = $(this).serialize(); //Encode form elements for submission

	// Use ajax to submit call to server and get response
	$.ajax({
		url : post_url,
		type: request_method,
		data : form_data,
		success : 
			function(response){
				// Send data to method to handle and plot
				handleNewDataAndGraph(response);
				//$("#graph-canvas").html(JSON.stringify(response));
			},
		error : 
			function(jqXHR, textStatus, errorThrown){
				console.log(errorThrown);
			}
	});
}

function submitAndReceiveClick(d){
	var post_url = '/node-click-submit/';
	var request_method = 'GET';
	var form_data = 'company-url=';

	// Get relevant form data depending on type and searchType of the node that was clicked.
	if(d.type == 'officer'){
		if(d.searchType == 'none'){
			form_data += d.urlSecondary;
		}
		else if(d.searchType == 'complete'){
			form_data += "No data needs to be searched"; // Will cause server to return nothing
			throw new Error("No search should occur for already fully searched node");
		}
		else{
			throw new Error("Error. Have a fully searched 'officer' node. Should not be possible (this should be a Person node).");
		}
	}
	else if (d.type == 'company'){
		if(d.searchType == 'primary-url-only'){
			form_data += d.urlSecondary;
		}
		else if(d.searchType == 'secondary-url-only'){
			form_data += d.urlPrimary;
		}
		else if(d.searchType == 'none'){
			form_data += d.urlPrimary;
		}
		else if(d.searchType == 'complete'){
			form_data += "No data needs to be searched"; // Will cause server to return nothing
			throw new Error("No search should occur for already fully searched node");
		}
		else{
			throw new Error("No search type matched in submitAndReceiveClick method.");
		}
	}
	else if(d.type == 'person'){
		throw new Error("Error. Should not be able to search a person");
	}
	else{
		throw new Error("No 'type' was matched in submitAndReceive method.")
	}


	// Use ajax to submit call to server and get response
	$.ajax({
		url : post_url,
		type: request_method,
		data : form_data,
		success : 
			function(response){
				// Send data to method to handle and plot
				handleNewDataAndGraph(response);
				//$("#graph-canvas").html(JSON.stringify(response));
			},
		error : 
			function(jqXHR, textStatus, errorThrown){
				console.log(errorThrown);
			}
	});
}



























