let clipboardItems = [];

document.addEventListener('DOMContentLoaded', () => {
    loadClipboardItems();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('saveButton').addEventListener('click', saveClipboardItem);
    document.getElementById('searchInput').addEventListener('input', filterClipboardItems);
    
    // Listen for paste events in the textarea
    document.getElementById('clipboardContent').addEventListener('paste', (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        e.target.value = text;
    });
}

async function loadClipboardItems() {
    const result = await chrome.storage.local.get('clipboardItems');
    clipboardItems = result.clipboardItems || [];
    renderClipboardItems(clipboardItems);
}

async function saveClipboardItem() {
    const content = document.getElementById('clipboardContent').value.trim();
    const tagsInput = document.getElementById('tagInput').value.trim();
    
    if (!content) return;

    const tags = tagsInput.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

    const newItem = {
        id: Date.now(),
        content,
        tags,
        timestamp: new Date().toISOString()
    };

    clipboardItems.unshift(newItem);
    await chrome.storage.local.set({ clipboardItems });
    
    // Clear inputs
    document.getElementById('clipboardContent').value = '';
    document.getElementById('tagInput').value = '';
    
    renderClipboardItems(clipboardItems);
}

function renderClipboardItems(items) {
    const container = document.getElementById('clipsContainer');
    container.innerHTML = '';

    items.forEach(item => {
        const itemElement = createClipboardItemElement(item);
        container.appendChild(itemElement);
    });
}

function createClipboardItemElement(item) {
    const div = document.createElement('div');
    div.className = 'clip-item';
    
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
    
    const actions = document.createElement('div');
    actions.className = 'clip-actions';
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => deleteClipboardItem(item.id));

    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.textContent = 'Copy';
    copyButton.addEventListener('click', () => copyToClipboard(item.content, copyButton));
    
    actions.appendChild(deleteButton);
    actions.appendChild(copyButton);
    
    div.appendChild(content);
    div.appendChild(tags);
    div.appendChild(actions);
    
    return div;
}

async function copyToClipboard(text, button) {
    try {
        await navigator.clipboard.writeText(text);
        
        // Visual feedback
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = originalText;
async function deleteClipboardItem(itemId) {
    // Remove the item from the clipboardItems array
    clipboardItems = clipboardItems.filter(item => item.id !== itemId);
    
    // Update chrome.storage.local
    await chrome.storage.local.set({ clipboardItems });
    
    // Re-render the list
    renderClipboardItems(clipboardItems);
}

        }, 1500);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
}

function filterClipboardItems(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    const filteredItems = clipboardItems.filter(item => {
        return item.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
               item.content.toLowerCase().includes(searchTerm);
    });
    
    renderClipboardItems(filteredItems);
}
