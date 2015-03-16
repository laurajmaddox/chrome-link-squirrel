

/* Returns and removes a URL of specified link_type from Chrome storage
Defaults to oldest link unless 'newest' or 'random' is chosen by user */
function getUrl(link_type, result) {
    if (link_type === "newest") {
        var active_url = result.url_stack.pop();
    } else if (link_type === "random") {
        var i = Math.floor(Math.random() * result.url_stack.length);
        var active_url = result.url_stack[i];
        result.url_stack.splice(i, 1);
    } else {
       var active_url = result.url_stack.shift();
    }

    return active_url;
}

/* Loads a saved URL in new Chrome tab */
function loadLink(link_type) {
    chrome.storage.sync.get("url_stack", function (result) {
        var active_url = getUrl(link_type, result);
        if (active_url) {
            chrome.tabs.create({"url": active_url.url});
            saveList(result);
        } else {
            alert("Your list of saved links is empty");
        }
    });
}

/* Adds a new URL object to the existing saved link array */
function saveLink(tab) {
    var new_url = {"url": tab.url, "saved": Date.now()};
    chrome.storage.sync.get("url_stack", function (result) {
        if (Object.keys(result).length === 0) {
            result.url_stack = [new_url];
        } else {
            result.url_stack.push(new_url);
        }
        saveList(result);
    });
}

/* Saves updated link list to Chrome storage */
function saveList(url_list) {
    chrome.storage.sync.set(url_list);
    updateBadge(url_list.url_stack.length);
}

/* Updates count of saved links displayed in browser action badge */
function updateBadge(url_count) {
    if (url_count > 0) {
        chrome.browserAction.setBadgeText({"text": url_count.toString()});
        chrome.browserAction.setBadgeBackgroundColor({"color": [0,0,0,255]});
    } else {
        chrome.browserAction.setBadgeText({"text": ""});
    }
}


/*
=================================================
EVENT HANDLERS
=================================================
*/

/* Add actions to context menu during installation */
chrome.runtime.onInstalled.addListener(function () {
    actions = [
        {"id": "save", "title": "Save this page"},
        {"id": "random", "title": "Load random"},
        {"id": "newest", "title": "Load most recent"}
    ];
    for (var i = 0; i < actions.length; i++) {
        chrome.contextMenus.create({
            "title": actions[i].title,
            "contexts": ["browser_action"],
            "id": actions[i].id
        });
    }
    chrome.storage.sync.get("url_stack", function (result) {
        if (Object.keys(result).length === 0) {
            saveList({"url_stack": []});
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
