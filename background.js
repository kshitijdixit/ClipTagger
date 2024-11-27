// Background service worker for document storage and data persistence
chrome.runtime.onInstalled.addListener(() => {
    // Initialize storage
    chrome.storage.local.get('clipboardItems', result => {
        if (!result.clipboardItems) {
            chrome.storage.local.set({ clipboardItems: [] });
        }
    });
});