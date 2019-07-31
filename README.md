# CompaniesHouseNetworkGraph
Javascript project (backend server and frontend webpage) to scrape companies house website for a company or person's profile and create a network graph of the 'ownership' structure.

## Instructions
The current setup is still being developed, but the instructions to run the code should not change significantly.

### Running the code
1. Clone the repo.
2. Move into the Server folder.
3.a Ensure node.js is installed.
3.b Run "node createServerExpress.js".
4. In a browser, go to "localhost:8080" and the website should load.

### Using the webpage
You will need to have a company or person in mind you want to search. Go to the companies house website (https://beta.companieshouse.gov.uk/) and make the search, navigating to the actual page of the person or company you are interested in. Copy the URL of the desired page and paste it into the search box of this program's webpage. Click search and wait a few seconds while the information is retrieved and displayed.
You can then drag nodes around to better display them, and click on a node to search that node's companies house page.

## Example webpages
To get you started, you can copy and paste one of the URLs below into the program's webpage search bar.
**Vodafone** https://beta.companieshouse.gov.uk/company/01471587
**Microsoft** https://beta.companieshouse.gov.uk/company/01624297
**Richard Branson** https://beta.companieshouse.gov.uk/officers/fPsul1-gLgzfRlgRvGBL14iNV3c/appointments

## Still to do
When a node is clicked, the results should come off of that node rather than produce a new set of separate nodes, as happens at the moment.
