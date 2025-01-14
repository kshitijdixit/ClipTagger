// Global state
let clipboardItems = [];

// Utility Functions
async function loadClipboardItems() {
    try {
        const result = await chrome.storage.local.get('clipboardItems');
        clipboardItems = result.clipboardItems || [];
        renderClipboardItems(clipboardItems);
    } catch (error) {
        console.error('Error loading clipboard items:', error);
    }
}

async function saveClipboardItem() {
    try {
        const content = document.getElementById('clipboardContent').value;
        const docLink = document.getElementById('docLink').value;
        const docUpload = document.getElementById('docUpload').files[0];
        const tags = document.getElementById('tagInput').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);
        
        let docData = null;
        if (docUpload) {
            // Create a downloads folder for the extension
            const fileName = `${Date.now()}_${docUpload.name}`;
            
            // Convert file to blob URL
            const blob = new Blob([await docUpload.arrayBuffer()], {type: docUpload.type});
            const blobUrl = URL.createObjectURL(blob);
            
            // Download file to user's download directory
            const downloadId = await chrome.downloads.download({
                url: blobUrl,
                filename: `tagged_clipboard_documents/${fileName}`,
                saveAs: false
            });
            
            // Store download reference
            docData = {
                name: docUpload.name,
                downloadId: downloadId,
                type: docUpload.type
            };
            
            // Clean up blob URL
            URL.revokeObjectURL(blobUrl);
        }
        
        const newItem = {
            id: Date.now(),
            content,
            docLink: docLink || null,
            docFile: docData,
            tags,
            timestamp: new Date().toISOString()
        };
        
        clipboardItems.unshift(newItem);
        await chrome.storage.local.set({ clipboardItems });
        
        // Clear inputs
        document.getElementById('clipboardContent').value = '';
        document.getElementById('docLink').value = '';
        document.getElementById('docUpload').value = '';
        document.getElementById('tagInput').value = '';
        
        renderClipboardItems(clipboardItems);
    } catch (error) {
        console.error('Error saving clipboard item:', error);
    }
}

async function deleteClipboardItem(itemId) {
    try {
        const result = await chrome.storage.local.get('clipboardItems');
        let items = result.clipboardItems || [];
        items = items.filter(item => item.id !== itemId);
        
        await chrome.storage.local.set({ clipboardItems: items });
        clipboardItems = items;
        renderClipboardItems(items);
    } catch (error) {
        console.error('Error deleting item:', error);
    }
}

function openDocument(docFile) {
    try {
        chrome.downloads.show(docFile.downloadId);
    } catch (error) {
        console.error('Error opening document:', error);
    }
}

async function copyToClipboard(text, button) {
    try {
        await navigator.clipboard.writeText(text);
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 1500);
    } catch (error) {
        console.error('Failed to copy:', error);
    }
}

// DOM Functions
function createClipboardItemElement(item) {
    const clipElement = document.createElement('div');
    clipElement.className = 'clip-item';
    clipElement.dataset.id = item.id;
    
    const content = document.createElement('div');
    content.className = 'clip-content';
    content.textContent = item.content;
    
    if (item.docLink) {
        const link = document.createElement('a');
        link.href = item.docLink;
        link.textContent = 'Open Document Link';
        link.target = '_blank';
        link.className = 'doc-link';
        content.appendChild(link);
    }
    
    if (item.docFile) {
        const openButton = document.createElement('button');
        openButton.textContent = `Open ${item.docFile.name}`;
        openButton.className = 'open-button';
        openButton.onclick = () => openDocument(item.docFile);
        content.appendChild(openButton);
    }
    
    const tags = document.createElement('div');
    tags.className = 'clip-tags';
    item.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'tag';
        tagSpan.textContent = tag;
        tags.appendChild(tagSpan);
    });
    
    const clipActions = document.createElement('div');
    clipActions.className = 'clip-actions';
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = () => deleteClipboardItem(item.id);
    
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.textContent = 'Copy';
    copyButton.onclick = () => copyToClipboard(item.content, copyButton);
    
    clipActions.appendChild(deleteButton);
    clipActions.appendChild(copyButton);
    
    clipElement.appendChild(content);
    clipElement.appendChild(tags);
    clipElement.appendChild(clipActions);
    
    return clipElement;
}

function renderClipboardItems(items) {
    const container = document.getElementById('clipsContainer');
    container.innerHTML = '';
    items.forEach(item => {
        container.appendChild(createClipboardItemElement(item));
    });
}

function filterClipboardItems(searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    const filteredItems = clipboardItems.filter(item => {
        return item.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
               item.content.toLowerCase().includes(searchTerm);
    });
    renderClipboardItems(filteredItems);
}

// Event Listeners
// Add backup import functionality
async function importBackup(file) {
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        await chrome.storage.local.set({ clipboardItems: data });
        loadClipboardItems(); // Refresh the display
    } catch (error) {
        console.error('Error importing backup:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadClipboardItems();
    
    document.getElementById('saveButton').addEventListener('click', saveClipboardItem);
    
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterClipboardItems(e.target.value);
    });

    // Add backup import functionality
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    fileInput.onchange = (e) => {
        if (e.target.files.length > 0) {
            importBackup(e.target.files[0]);
        }
    };
    document.body.appendChild(fileInput);

    // Add import button
    const importButton = document.createElement('button');
    importButton.textContent = 'Import Backup';
    importButton.onclick = () => fileInput.click();
    document.querySelector('.filter-section').appendChild(importButton);
});
