//------------------
// Within DedicatedWorker.js (web worker thread)
//------------------

// Attach to the onmessage event to listen for messages from the caller
self.onmessage = function (evt) {
    // Grab the data that was passed to us. The UI is passing JSON objects which have a 'cmd' property to indicate what action the UI thread want's us to perform
    var objMessage = evt.data;

    // If the app has just started up then...
    if (objMessage.cmd === "start") {
        onStart(objMessage.currentPage, objMessage.pagesLoaded);
    }
    // The UI thread has requested us to load in the next page of data...
    else if(objMessage.cmd === "getNextPage"){
        getNextPage(objMessage.pageIndex);
    }
    // The UI thread has asked us to close...
    else if (objMessage.cmd === "close") {
        self.close();
    }
}


// We don't want to waste the user's storage or data usage/network bandwidth so we will only request more data from the server if there is less than 2 pages past the current
// page
function onStart(iCurrentPage, iPagesLoaded) {
    var iPagesAfterCurrent = (iPagesLoaded - (iCurrentPage + 1));// iCurrentPage is zero-based in the UI
    while (iPagesAfterCurrent < 2) {
        // Ask for the next page of data to be loaded in and increment the counters (we call getNextPage the necessary number of times to load in the extra pages need)
        getNextPage(iPagesLoaded);
        iPagesLoaded++;
        iPagesAfterCurrent++;
    }
}


// Helper that asks the server-side code for the next page of data needed by the list
function getNextPage(iPage) {
    // Build up our object that will hold the data we want to send to the server-side code
    var objData = { "sPageIndex": iPage };

    // The URI to the server-side code steps back a folder because we are within the DedicatedWorker.js file which is in the js folder of the solution. If the 
    // DedicatedWorker.js file was also at the root, we would not need the '../' portion in the URI)
    var xhrRequest = new XMLHttpRequest();
    xhrRequest.open("POST", "../main.aspx/GetNextPage", false);
    xhrRequest.setRequestHeader("Content-Type", "application/json");
    xhrRequest.send(JSON.stringify(objData));

    // The request was made synchronously so return the response from the server to the UI thread as soon as we get it
    self.postMessage(xhrRequest.responseText);
}