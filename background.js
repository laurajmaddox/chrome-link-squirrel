/* Returns and removes a URL of specified link_type from Chrome storage
Defaults to oldest link unless 'newest' or 'random' is chosen by user */
var getUrl = function (linkType, result) {
    var activeUrl, i;
    if (linkType === "newest") {
        activeUrl = result.urlStack.pop();
    } else if (linkType === "random") {
        i = Math.floor(Math.random() * result.urlStack.length);
        activeUrl = result.urlStack[i];
        result.urlStack.splice(i, 1);
    } else {
        activeUrl = result.urlStack.shift();
    }

    return activeUrl;
};

/* Updates count of saved links displayed in browser action badge */
var updateBadge = function (urlCount) {
    if (urlCount > 0) {
        chrome.browserAction.setBadgeText({"text": urlCount.toString()});
        chrome.browserAction.setBadgeBackgroundColor({"color": [0, 0, 0, 255]});
    } else {
        chrome.browserAction.setBadgeText({"text": ""});
    }
};

/* Saves updated link list to Chrome storage */
var saveList = function (urlList) {
    chrome.storage.sync.set(urlList);
    updateBadge(urlList.urlStack.length);
};

/* Adds a new URL object to the existing saved link array */
var saveLink = function (tab) {
    var newUrl = {"url": tab.url, "saved": Date.now()};
    chrome.storage.sync.get("urlStack", function (result) {
        if (Object.keys(result).length === 0) {
            result.urlStack = [newUrl];
        } else {
            result.urlStack.push(newUrl);
        }
        saveList(result);
    });
};

/* Loads a saved URL in new Chrome tab */
var loadLink = function (linkType) {
    chrome.storage.sync.get("urlStack", function (result) {
        var activeUrl = getUrl(linkType, result);
        if (activeUrl) {
            chrome.tabs.create({"url": activeUrl.url});
            saveList(result);
        } else {
            alert("Your list of saved links is empty");
        }
    });
};


/*
=================================================
EVENT HANDLERS
=================================================
*/

/* Add actions to context menu during installation */
chrome.runtime.onInstalled.addListener(function () {
    var i = 0;
    actions = [
        {"id": "save", "title": "Save this page"},
        {"id": "random", "title": "Load random"},
        {"id": "newest", "title": "Load most recent"}
    ];
    for (i = 0; i < actions.length; i += 1) {
        chrome.contextMenus.create({
            "title": actions[i].title,
            "contexts": ["browser_action"],
            "id": actions[i].id
        });
    }
    chrome.storage.sync.get("urlStack", function (result) {
        if (Object.keys(result).length === 0) {
            saveList({"urlStack": []});
        }
    });
});

/* Save URL or load a saved URL from browser action context menu */
chrome.contextMenus.onClicked.addListener(function (info, tab) {
    if (info.menuItemId === "save") {
        saveLink(tab);
    } else {
        loadLink(info.menuItemId);
    }
});

/* Open oldest URL in new tab on browser action click */
chrome.browserAction.onClicked.addListener(loadLink);
