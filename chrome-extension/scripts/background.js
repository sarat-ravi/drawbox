console.log("Background of Extension says hello");

function getTabId() {
    return 1;
}

chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
    console.log("Received message");
    console.log(message);
    console.log(sender);
    if (message.action == "getCurrentTabId") {
        sendResponse({value: sender.tab.id});
    } else if (message.action == "showPageActionForCurrentTab") {
        chrome.pageAction.show(sender.tab.id);
    }
});

chrome.runtime.onConnect.addListener(function(port) {
    console.assert(port.name == "drawbox.port");
    port.onMessage.addListener(function(message) {
        console.log(message);
        if (message.action == "get") {
            if (message.key == "tabId") {
                port.postMessage({action: "put", key: "tabId", value: getTabId()});
            }
        }
    });
});
