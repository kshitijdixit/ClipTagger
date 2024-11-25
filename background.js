// Background service worker for future functionality
chrome.runtime.onInstalled.addListener(() => {
    // Initialize storage if needed
    chrome.storage.local.get('clipboardItems', (result) => {
        if (!result.clipboardItems) {
            chrome.storage.local.set({ clipboardItems: [] });
        }
    });
});
