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

function onDrawButtonClicked() {
    console.log("Draw Button Clicked");
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
    }, 2000);
}

window.addEventListener ("load", onWindowLoaded, false);

