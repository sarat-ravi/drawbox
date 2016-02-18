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
// CANVAS EVENTS
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
    drawbox.startPath("me", mouseEvent.x, mouseEvent.layerY);
}

function onCanvasMouseMove(mouseEvent) {
    drawbox.moveCursor("me", mouseEvent.x, mouseEvent.layerY);
    if (mouseDown) {
        textItem.content = 'Saving...'
        drawbox.drawPath("me", mouseEvent.x, mouseEvent.layerY);
    }
}

function onCanvasMouseUp(mouseEvent) {
    console.log(mouseEvent);
    mouseDown = false;
    textItem.content = "Saved"
    drawbox.commitPath("me");
}

// ----------------------------------------------------------------------------------------------------------------------------------------------
// DOCUMENT EVENTS
// ----------------------------------------------------------------------------------------------------------------------------------------------

function onDrawButtonClicked() {
    console.log("Draw Button Clicked");

    // Create current user.
    drawbox.addUser("me", "Sarat Tallamraju", "red");

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
}

function renderCustomViews() {
    $('title').text("Sarat");

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
        renderCustomViews();
    }, 500);
}

window.addEventListener ("load", onWindowLoaded, false);

