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
        const tags = document.getElementById('tagInput').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);
        
        const newItem = {
            id: Date.now(),
            content,
            tags,
            timestamp: new Date().toISOString()
        };
        
        clipboardItems.unshift(newItem);
        await chrome.storage.local.set({ clipboardItems });
        
        // Clear input fields
        document.getElementById('clipboardContent').value = '';
        document.getElementById('tagInput').value = '';
        
        // Re-render the list
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
document.addEventListener('DOMContentLoaded', () => {
    loadClipboardItems();
    
    document.getElementById('saveButton').addEventListener('click', saveClipboardItem);
    
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterClipboardItems(e.target.value);
    });
});
