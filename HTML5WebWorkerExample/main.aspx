<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="main.aspx.cs" Inherits="HTML5WebWorkerExample.main" EnableViewState="false" %>
<!DOCTYPE html>
<html>
    <head>
        <title></title>
        <link href="css/main.css" rel="stylesheet" />
    </head>
    <body>
        <form id="form1" runat="server">
            <hgroup>
                <h1>HTML5 Web Worker example...</h1>
            </hgroup>
        
            <ul>
                <li>Initial page of data streamed down with the page to reduce network requests and so that the list can be presented to the user as quickly as possible</li>
                <li>An HTML5 Dedicated Web Worker is used to pre-fetch additional items for the list and are cached with HTML5 Web Storage</li>
                <li>Images used in this example list were found on the following site: <a href="http://www.webdesignhot.com/" target="_blank">http://www.webdesignhot.com/</a></li>
            </ul>

            <div id="divEmployeeList">
                <input id="cmdListPageUp" type="button" value="Previous" disabled="disabled" />

                <!-- Transparent 1x1 pixel image so that we don't see a missing image placeholder before we have a chance to set the image -->
                <div id="divListItem0"><img src="images/transparent.gif" /><span></span></div>
                <div id="divListItem1"><img src="images/transparent.gif" /><span></span></div>
                <div id="divListItem2"><img src="images/transparent.gif" /><span></span></div>
                <div id="divListItem3"><img src="images/transparent.gif" /><span></span></div>
                <div id="divListItem4"><img src="images/transparent.gif" /><span></span></div>

                <input id="cmdListPageDown" type="button" value="Next" disabled="disabled" />
            </div>
        </form>

        <script src="js/jquery-1.9.0.js"></script>
        <script src="js/main.js"></script>
    </body>
</html>
