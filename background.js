// background.js
chrome.runtime.onInstalled.addListener(async () => {
    try {
        // Try to load existing backup file
        const downloadQuery = await chrome.downloads.search({
            filename: 'tagged_clipboard_backup.json',
            exists: true
        });
        
        if (downloadQuery.length > 0) {
            const backupFile = downloadQuery[0];
            const response = await fetch(`file://${backupFile.filename}`);
            if (response.ok) {
                const data = await response.json();
                await chrome.storage.local.set({ clipboardItems: data });
                console.log('Restored data from backup');
            }
        } else {
            // Initialize empty storage if no backup exists
            chrome.storage.local.set({ clipboardItems: [] });
        }
    } catch (error) {
        console.error('Error loading backup:', error);
        chrome.storage.local.set({ clipboardItems: [] });
    }
});

// Add backup functionality
chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (namespace === 'local' && changes.clipboardItems) {
        try {
            const data = JSON.stringify(changes.clipboardItems.newValue);
            const blob = new Blob([data], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            
            await chrome.downloads.download({
                url: url,
                filename: 'tagged_clipboard_backup.json',
                conflictAction: 'overwrite',
                saveAs: false
            });
            
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error creating backup:', error);
        }
    }
});
