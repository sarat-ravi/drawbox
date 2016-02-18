console.log("Extension Says Hello");

var port = chrome.runtime.connect({name: "drawbox.port"});

chrome.extension.sendMessage({action: "getCurrentTabId"}, function(response) {
    console.log("The actual tab id is: " + response.value);
});

chrome.extension.sendMessage({action: "showPageActionForCurrentTab"});

port.onMessage.addListener(function(message) {
    console.log("[Content Script]: Received message: " + JSON.stringify(message));
}); 

port.postMessage({action : "get", key: "status"});

// ----------------------------------------------------------------------------------------------------------------------------------------------
// CURRENT USER STATE
// ----------------------------------------------------------------------------------------------------------------------------------------------

var currentUrl = "https_asdf_blah_com";
var currentUserId = "me";
var currentUserFullName = "Sarat Tallamraju";
var currentUserPathColor = "red";

// ----------------------------------------------------------------------------------------------------------------------------------------------
// REMOTE EVENTS
// ----------------------------------------------------------------------------------------------------------------------------------------------
var firebaseRef = new Firebase("https://drawbox.firebaseio.com");
var currentPageRef;
var currentUserRef;

var lastSyncedMouseState = {};

function onRemoteUserAdded(userSnapshot) {
    var userId = userSnapshot.key();
    if (userId == currentUserId) { return; }
    console.log("remote user added");
    var userMetadata = userSnapshot.val();

    drawbox.addUser(userId, userMetadata.fullName, userMetadata.pathColor);
}

function onRemoteUserChanged(userSnapshot) {
    var userId = userSnapshot.key();
    if (userId == currentUserId) { return; }
    // console.log("remote user changed");
    if (!(userId in lastSyncedMouseState)) {
        lastSyncedMouseState[userId] = false;
    }

    var userMetadata = userSnapshot.val();

    var cursor_position = userMetadata.cursor_position;
    drawbox.moveCursor(userId, cursor_position[0], cursor_position[1]);

    var remoteUserMouseDown = userMetadata.mouseDown;
    var previousMouseDown = lastSyncedMouseState[userId];
    if (previousMouseDown == false && remoteUserMouseDown == true) {
        console.log("remote path started");
        drawbox.startPath(userId, cursor_position[0], cursor_position[1]);
    } else if (previousMouseDown == true && remoteUserMouseDown == false) {
        console.log("remote path ended");
        drawbox.commitPath(userId);
    } else {
        if (remoteUserMouseDown) {
            drawbox.drawPath(userId, cursor_position[0], cursor_position[1]);
        }
    }
    lastSyncedMouseState[userId] = remoteUserMouseDown;
}

function deleteLocalPaths() {
    currentUserRef.remove();
}

function onRemoteUserRemoved(userSnapshot) {
    console.log(userSnapshot);
    var userId = userSnapshot.key();
    if (userId == currentUserId) { return; }
    console.log("remote user removed");
    var userMetadata = userSnapshot.val();
    drawbox.eraseAllPaths(userId);
    drawbox.eraseAllPaths(currentUserId);
    deleteLocalPaths();
    drawingDisabled();
}

function setupCollaboration(url, userId, fullName, pathColor) {
    var currentPageRef = firebaseRef.child(url);
    currentPageRef.update({"url": url});

    currentUserRef = currentPageRef.child(userId);
    currentUserRef.update({
        "fullName": fullName,
        "pathColor": pathColor,
        "mouseDown": false,
        "cursor_position": [0,0],
        "userId": userId
    });

    currentPageRef.on('child_added', onRemoteUserAdded);
    currentPageRef.on('child_changed', onRemoteUserChanged);
    currentPageRef.on('child_removed', onRemoteUserRemoved);
}

function publishLocalCursorPosition(x, y) {
    currentUserRef.update({"cursor_position": [x, y]});
}

function publishNewLocalPath() {

    currentUserRef.update({
        "mouseDown": true
    });
}

function commitLocalPath() {

    currentUserRef.update({
        "mouseDown": false
    });
}

// ----------------------------------------------------------------------------------------------------------------------------------------------
// LOCAL EVENTS
// ----------------------------------------------------------------------------------------------------------------------------------------------

var mouseDown = false;
var textItem;

function setupTextItem() {
    if (textItem) { return; }
    textItem = new paper.PointText({ content: 'Click and drag to draw', point: new paper.Point(20, 30), fillColor: 'white', });
}

function onCanvasMouseDown(mouseEvent) {
    console.log(mouseEvent);
    mouseDown = true;
    setupTextItem();
    drawbox.startPath(currentUserId, mouseEvent.x, mouseEvent.layerY);
    publishNewLocalPath();
}

function onCanvasMouseMove(mouseEvent) {
    drawbox.moveCursor(currentUserId, mouseEvent.x, mouseEvent.layerY);
    publishLocalCursorPosition(mouseEvent.x, mouseEvent.layerY);
    if (mouseDown) {
        textItem.content = 'Saving...'
        drawbox.drawPath(currentUserId, mouseEvent.x, mouseEvent.layerY);
    }
}

function onCanvasMouseUp(mouseEvent) {
    console.log(mouseEvent);
    mouseDown = false;
    textItem.content = "Saved"
    drawbox.commitPath(currentUserId);
    commitLocalPath();
}

// ----------------------------------------------------------------------------------------------------------------------------------------------
// DOCUMENT EVENTS
// ----------------------------------------------------------------------------------------------------------------------------------------------

var isDrawingEnabled = false;

function drawingDisabled() {
    console.log("Clear Button Clicked");
    renderDrawButton();
    drawbox.eraseAllPaths(currentUserId);
    deleteLocalPaths();

    $('#drawbox-canvas').remove();
    isDrawingEnabled = false;
}

function drawingEnabled() {
    console.log("Draw Button Clicked");
    renderClearButton();

    // Create current user.
    drawbox.addUser(currentUserId, currentUserFullName, currentUserPathColor);

    // Setup Collaboration
    setupCollaboration(currentUrl, currentUserId, currentUserFullName, currentUserPathColor);

    // Inject Canvas
    var canvasHtml = $("<canvas id='drawbox-canvas' resize></canvas>");
    var previewContainerClass = ".preview-content-container";
    canvasHtml.prependTo(previewContainerClass);

    // Identify canvas and its container
    var canvas = document.getElementById('drawbox-canvas');
    var superContainer = document.getElementsByClassName("preview-content-container")[0];

    // Style Canvas to fit preview body
    canvas.style.width = superContainer.scrollWidth+"px";
    canvas.style.height = superContainer.scrollHeight+"px";
    canvas.style['z-index'] = 1000;
    canvas.width=superContainer.scrollWidth;
    canvas.height=superContainer.scrollHeight;
    canvas.style.overflow = 'visible';
    canvas.style.position = 'absolute';

    // Setup Canvas
    paper.setup(canvas);

    // wire up canvas 
    canvas.addEventListener("mousedown", onCanvasMouseDown);
    canvas.addEventListener("mousemove", onCanvasMouseMove);
    canvas.addEventListener("mouseup", onCanvasMouseUp);
    isDrawingEnabled = true;
}

function onDrawButtonClicked() {
    if (!isDrawingEnabled) {
        drawingEnabled();
    } else {
        drawingDisabled();
    }
}

function renderClearButton() {
    var existingDrawButton = $('.drawbox-draw-button');
    existingDrawButton.remove()

    // Inject Draw Button
    var drawButton = $("<button class='btn responsive-header-button btn-preview-header-open-new drawbox-draw-button' data-tooltip='' data-tooltip-position='bottom' aria-label='Draw' data-type='preview-edit-draw' aria-haspopup='true' data-resin-target='draw'><span class='btn-preview-header-text'>Clear</span></button>");
    var buttonContainerClass = '.preview-header-right';
    drawButton.prependTo(buttonContainerClass);

    // Wire up Draw Button to Event
    drawButton.click(onDrawButtonClicked);
}

function renderDrawButton() {
    var existingDrawButton = $('.drawbox-draw-button');
    existingDrawButton.remove()

    // Inject Draw Button
    var drawButton = $("<button class='btn responsive-header-button btn-preview-header-open-new drawbox-draw-button' data-tooltip='' data-tooltip-position='bottom' aria-label='Draw' data-type='preview-edit-draw' aria-haspopup='true' data-resin-target='draw'><span class='btn-preview-header-text'>Draw</span></button>");
    var buttonContainerClass = '.preview-header-right';
    drawButton.prependTo(buttonContainerClass);

    // Wire up Draw Button to Event
    drawButton.click(onDrawButtonClicked);
}

function onWindowLoaded (windowEvent) {
    console.log("Window loaded");
    setTimeout(function() {
        renderDrawButton();
    }, 500);
}

window.addEventListener ("load", onWindowLoaded, false);

