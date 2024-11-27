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
            
            // Use chrome.downloads.open to let user select the backup file
            chrome.downloads.download({
                url: chrome.runtime.getURL('backup-instructions.html'),
                filename: 'backup-instructions.html'
            });
            
            // Initialize with empty storage for now
            chrome.storage.local.set({ clipboardItems: [] });
        } else {
            // Initialize empty storage if no backup exists
            chrome.storage.local.set({ clipboardItems: [] });
        }
    } catch (error) {
        console.error('Error checking backup:', error);
        chrome.storage.local.set({ clipboardItems: [] });
    }
});

// Keep the existing backup creation code
chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (namespace === 'local' && changes.clipboardItems) {
        try {
            const data = JSON.stringify(changes.clipboardItems.newValue, null, 2);
            const blob = new Blob([data], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            
            await chrome.downloads.download({
                url: url,
                filename: 'tagged_clipboard_backup.json',
                conflictAction: 'overwrite',
                saveAs: false
            });
            
            URL.revokeObjectURL(url);
            console.log('Backup file created in Downloads folder');
        } catch (error) {
            console.error('Error creating backup:', error);
        }
    }
});
