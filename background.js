// Background service worker for document storage and data persistence
chrome.runtime.onInstalled.addListener(async () => {
    // Create documents directory
    const documentsDir = 'tagged_clipboard_documents';
    try {
        // Request filesystem access
        const fs = await window.requestFileSystem(window.PERSISTENT, 1024*1024);
        fs.root.getDirectory(documentsDir, {create: true});
    } catch (error) {
        console.error('Error creating documents directory:', error);
    }
    
    // Initialize storage
    chrome.storage.local.get('clipboardItems', async (result) => {
        if (!result.clipboardItems) {
            // Load data from local storage file if exists
            try {
                const response = await fetch(chrome.runtime.getURL('storage/clipboard_data.json'));
                if (response.ok) {
                    const data = await response.json();
                    await chrome.storage.local.set({ clipboardItems: data });
                } else {
                    // Initialize empty if no stored data
                    chrome.storage.local.set({ clipboardItems: [] });
                }
            } catch (error) {
                console.error('Error loading stored data:', error);
                // Initialize empty if error loading data
                chrome.storage.local.set({ clipboardItems: [] });
            }
        }
    });
});
