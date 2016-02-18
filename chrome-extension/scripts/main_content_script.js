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

function onWindowLoaded (windowEvent) {
    console.log("Window loaded");
}

window.addEventListener ("load", onWindowLoaded, false);

