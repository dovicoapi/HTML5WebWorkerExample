//------------------
// Within main.js (UI thread)
//------------------

var g_iItemsPerPage = 5;
var g_iPageDisplayed = 0; // zero-based index of the list's displayed page of data
var g_iPagesLoaded = 0;
var g_bListFullyLoaded = false;

var g_arrJQueryReferences = [];// Array that holds cached jQuery references
var gDedicatedWorker = null;

$(document).ready(function () {
    // Update the web storage with the initial values streamed down by the server (a JSON array in a script block on the web page) and then cause the list to display the first
    // page of data
    updateLocalStorage(g_arrInitData);
    adjustListForNewPage(0);

    // If dedicated web workers are supported by this browser then...
    if (window.Worker) {
        // Create our worker and wire up the error and message handlers
        gDedicatedWorker = new Worker("js/DedicatedWorker.js");
        gDedicatedWorker.onerror = handleError;
        gDedicatedWorker.onmessage = handleMessage;

        // Pass a message to the worker telling it that the app has started
        gDedicatedWorker.postMessage({ "cmd": "start", "currentPage": g_iPageDisplayed, "pagesLoaded": g_iPagesLoaded });
    }
    else {
        alert("Dedicated web workers are not supported by this browser.");
    }

    // Wire up the Previous and Next button click events
    GetjQueryReference("cmdListPageUp").click(function () { adjustListForNewPage((g_iPageDisplayed - 1)); });
    GetjQueryReference("cmdListPageDown").click(function () { adjustListForNewPage((g_iPageDisplayed + 1)); });

    // Wire up a window.unload event to close our worker thread
    $(window).unload(function () {
        // If the browser supported workers, ask the worker to close
        if (gDedicatedWorker !== null) {
            gDedicatedWorker.postMessage({ "cmd": "close" });
            gDedicatedWorker = null;
        }
    });
});


// Helper to return and cache jQuery references (sCtrlID is expected without the '#')
function GetjQueryReference(sCtrlID) {
    // Grab the requested control from our global array. If we don't have a control reference yet then...
    var $jQueryObj = g_arrJQueryReferences[sCtrlID];
    if (($jQueryObj === null) || (typeof $jQueryObj === "undefined")) {
        // Grab the reference from the DOM and add it to our array
        $jQueryObj = $(("#" + sCtrlID));
        g_arrJQueryReferences[sCtrlID] = $jQueryObj;
    }

    // Return the jQuery object to the caller
    return $jQueryObj;
}


// Helper to update the HTML5 Web Storage with the list of page data (iPageIndex is zero-based)
function updateLocalStorage(arrPageData) {
    var sListItem = "";
    var objListItem = null;

    // Loop through the array items...
    var iArrayLen = arrPageData.length;
    for (var iArrayIndex = 0; iArrayIndex < iArrayLen; iArrayIndex++) {
        // Only add the new item to web storage if it's not already there
        sListItem = localStorage.getItem(iArrayIndex);
        if (sListItem === null) {
            objListItem = arrPageData[iArrayIndex];
            localStorage.setItem(objListItem.EmpId, JSON.stringify(objListItem));
        }
    }

    // Update our pages loaded count based on the number of records now in storage (a partial page can cause our count to be a fraction like 3.6. We want to deal with whole
    // numbers but also want to see the partial pages so we round up)
    g_iPagesLoaded = Math.ceil((localStorage.length / g_iItemsPerPage));
}


// Helper to adjust the list with the requested page of data (iPageIndex is zero-based)
function adjustListForNewPage(iPageToDisplay) {
    // Remember the current page index
    g_iPageDisplayed = iPageToDisplay;

    // Determine the first index of the page requested
    var iFirstIndex = (iPageToDisplay * g_iItemsPerPage);
    var iLastIndex = (iFirstIndex + g_iItemsPerPage);
    var iListItemIndex = 0;
    var sKey = "", sItemID = "", sItemCaption = "", sItemBase64Image = "";
    var objListItem = null;

    // Loop from the first index of the current page to one less than the value calculated for the last index of the page (g_iItemsPerPage
    // is a one-based value and our indexes are zero-based which is why we go one loop less)
    for (var iCurIndex = iFirstIndex; iCurIndex < iLastIndex; iCurIndex++) {
        // Clear the values in the event there is no data for the current list item
        sItemID = "", sItemCaption = "", sItemBase64Image = "";

        // Grab the current web storage key by its index. If the object exists then grab its values
        sKey = localStorage.key(iCurIndex);
        if (sKey !== null) {
            objListItem = JSON.parse(localStorage.getItem(sKey));
            sItemID = objListItem.EmpId;
            sItemCaption = objListItem.EmpName;
            sItemBase64Image = objListItem.EmpImg;
        }

        // Adjust the current list item's contents
        adjustListItemContents(iListItemIndex, sItemID, sItemCaption, sItemBase64Image);
        iListItemIndex++;
    }

    // Only do the following code if the current browser supports web workers and if the list is not yet fully loaded....
    if ((gDedicatedWorker !== null) && (!g_bListFullyLoaded)) {
        // Check to see how many pages have been loaded past the current one
        var iPagesAfterCurrent = (g_iPagesLoaded - (g_iPageDisplayed + 1));// g_iPageDisplayed is zero-based
        if (iPagesAfterCurrent < 2) {
            // Pass in a message to the worker indicating that the app has started, what our paging amount is, and the amount of items currently stored
            gDedicatedWorker.postMessage({ "cmd": "getNextPage", "pageIndex": g_iPagesLoaded });
        }
    }

    // Cause the previous/next buttons to be enabled/disabled appropriately based on the current page we're on and the number of pages loaded
    updatePrevAndNextButtonStates();
}


// Helper to cause the Previous/Next buttons to be enabled or disabled depending on if there are additional pages or not
function updatePrevAndNextButtonStates() {
    // Disable the previous button if we are on the first page. Disable the Next button if we are on the last page currently loaded
    GetjQueryReference("cmdListPageUp").prop("disabled", (g_iPageDisplayed === 0));
    GetjQueryReference("cmdListPageDown").prop("disabled", (g_iPageDisplayed === (g_iPagesLoaded - 1))); // g_iPagesLoaded is one-based
}


// Helper to adjust the individual list items
function adjustListItemContents(iListItemIndex, sItemID, sItemCaption, sItemBase64Image) {
    // Based on the index, create our control's ID without the # character (Not using the GetjQueryReference helper in this case because we need to attach a click event
    // handler if we haven't already obtained a reference to the control before)
    var sCtrlID = ("divListItem" + iListItemIndex.toString());

    // If we don't have a control reference in the array yet then...
    var $divListItem = g_arrJQueryReferences[sCtrlID];
    if (($divListItem === null) || (typeof $divListItem === "undefined")) {
        // Grab the reference from the DOM and set up a click event handler at the same time
        $divListItem = $(("#" + sCtrlID));
        g_arrJQueryReferences[sCtrlID] = $divListItem;
        $divListItem.click(function () { OnClickListItem($(this)); });
    }

    // Adjust the list item's ID, image (use the transparent image if there is no item for this list item), and caption    
    $divListItem.attr("data-ItemId", sItemID);
    $("img", $divListItem).attr("src", (sItemID === "" ? "images/transparent.gif" : ("data:image/png;base64," + sItemBase64Image)));
    $("span", $divListItem).text(sItemCaption);
}


// Click event handler for our list items
function OnClickListItem($objListItem) {
    // If the list doesn't have an item then exit now
    var sSelItemID = $objListItem.attr("data-ItemId")
    if (sSelItemID === "") { return; }

    // Remove any previous selections in our list and then cause the currently selected item to indicate that it's selected
    $("#divEmployeeList .ListItemSelected").removeClass("ListItemSelected");
    $objListItem.addClass("ListItemSelected");
}



// OnError event listener for our Web Worker
function handleError(evtError) {
    if (typeof evtError === "string") {
        alert("Error: " + evtError);
    }
    else if (evtError.message) {
        alert("Error...Message: " + evtError.message + ", File name: " + evtError.filename + ", Line number: " + evtError.lineno);
    }
    else {
        alert("Unknown error");
    }
}


// OnMessage event listener for our Web Worker
function handleMessage(evtMessage) {
    // Turn the string into JSON. If an array was returned then...
    var objJSON = JSON.parse(evtMessage.data);
    if (objJSON.d !== null) {
        // Store the array and update the Previous/Next button state
        updateLocalStorage(objJSON.d);
        updatePrevAndNextButtonStates();
    }
    else { // No data was returned. The list is now fully loaded.
        g_bListFullyLoaded = true;
    }
}
