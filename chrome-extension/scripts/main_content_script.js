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
var path;
var pathColor = 'red';

function setupTextItem() {
    if (textItem) {
        return;
    }

    textItem = new paper.PointText({
	content: 'Click and drag to draw',
	point: new paper.Point(20, 30),
	fillColor: 'white',
});

}

function onCanvasMouseDown(mouseEvent) {
    console.log(mouseEvent);
    mouseDown = true;
    setupTextItem();

    // If we produced a path before, deselect it:
	if (path) {
		path.selected = false;
	}

	// Create a new path and set its stroke color to black:
	path = new paper.Path({
        segments: [new paper.Point(mouseEvent.x, mouseEvent.layerY)],
		strokeColor: pathColor,
		// Select the path, so we can see its segment points:
		fullySelected: false
	});
}

function onCanvasMouseMove(mouseEvent) {
    if (mouseDown == false) {
        // Mouse is not currently pressed, so disregard.
        return;
    }
    
    path.add(new paper.Point(mouseEvent.x, mouseEvent.layerY)); 

	// Update the content of the text item to show how many
	// segments it has:
	// textItem.content = 'Segment count: ' + path.segments.length;
    textItem.content = 'Saving...'
}

function onCanvasMouseUp(mouseEvent) {
    console.log(mouseEvent);
    mouseDown = false;

    var segmentCount = path.segments.length;

	// When the mouse is released, simplify it:
	path.simplify(10);

	path.fullySelected = false;

	var newSegmentCount = path.segments.length;
	var difference = segmentCount - newSegmentCount;
	var percentage = 100 - Math.round(newSegmentCount / segmentCount * 100);
	// textItem.content = difference + ' of the ' + segmentCount + ' segments were removed. Saving ' + percentage + '%';
    textItem.content = "Saved"
}

// ----------------------------------------------------------------------------------------------------------------------------------------------
// DOCUMENT EVENTS
// ----------------------------------------------------------------------------------------------------------------------------------------------

function onDrawButtonClicked() {
    console.log("Draw Button Clicked");

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

