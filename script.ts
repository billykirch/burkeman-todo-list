// Type definitions
interface TodoItem {
    text: string;
}

interface TodoData {
    selected: TodoItem[];
    inventory: TodoItem[];
    pending: TodoItem[];
    completed: TodoItem[];
}

// Data structure
let todoData: TodoData = {
    selected: [],
    inventory: [],
    pending: [],
    completed: []
};

// Load data from localStorage
function loadData(): void {
    const saved = localStorage.getItem('todoData');
    if (saved) {
        todoData = JSON.parse(saved);
    }
}

// Save data to localStorage
function saveData(): void {
    localStorage.setItem('todoData', JSON.stringify(todoData));
}

// Render selected items
function renderSelected(): void {
    const container = document.getElementById('selectedItems');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 0; i < 5; i++) {
        const item = todoData.selected[i];
        const div = document.createElement('div');
        
        if (item) {
            div.className = 'selected-item';
            div.textContent = item.text;
            div.onclick = (e: MouseEvent) => {
                e.stopPropagation();
                showKebabMenu(div, item, i);
            };
        } else {
            div.className = 'selected-item empty';
            div.textContent = 'Empty slot';
        }
        
        container.appendChild(div);
    }
}

// Remove all open dropdown menus
function removeAllMenus(): void {
    document.querySelectorAll('.kebab-menu, .inventory-menu').forEach(m => m.remove());
}

// Position a fixed-position menu below a trigger element
function positionMenuBelow(menu: HTMLElement, trigger: HTMLElement): void {
    const rect = trigger.getBoundingClientRect();
    menu.style.left = `${rect.left}px`;
    menu.style.top = `${rect.bottom + 5}px`;

    // Adjust if menu overflows viewport
    requestAnimationFrame(() => {
        const menuRect = menu.getBoundingClientRect();
        if (menuRect.bottom > window.innerHeight) {
            menu.style.top = `${rect.top - menuRect.height - 5}px`;
        }
        if (menuRect.right > window.innerWidth) {
            menu.style.left = `${window.innerWidth - menuRect.width - 10}px`;
        }
    });
}

// Show kebab menu for selected items
function showKebabMenu(element: HTMLElement, item: TodoItem, index: number): void {
    removeAllMenus();

    const menu = document.createElement('div');
    menu.className = 'kebab-menu';

    const options = [
        { text: 'Completed', action: () => completeItem(item, index) },
        { text: 'Bump back to inventory', action: () => bumpToInventory(item, index) },
        { text: 'Pending other actions', action: () => moveToPending(item, index) },
        { text: 'Edit item', action: () => editItem(item, index, 'selected') },
        { text: 'Delete item', action: () => deleteItem(item, index, 'selected') }
    ];

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = opt.text;
        btn.onclick = () => {
            opt.action();
            menu.remove();
        };
        menu.appendChild(btn);
    });

    document.body.appendChild(menu);
    positionMenuBelow(menu, element);

    // Hover-based menu closing
    let isHoveringItem = true;
    let isHoveringMenu = false;

    const checkAndClose = () => {
        setTimeout(() => {
            if (!isHoveringItem && !isHoveringMenu) {
                menu.remove();
                element.onmouseleave = null;
            }
        }, 50);
    };

    element.onmouseleave = () => {
        isHoveringItem = false;
        checkAndClose();
    };

    element.onmouseenter = () => {
        isHoveringItem = true;
    };

    menu.onmouseenter = () => {
        isHoveringMenu = true;
    };

    menu.onmouseleave = () => {
        isHoveringMenu = false;
        checkAndClose();
    };

    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e: MouseEvent) {
            if (!menu.contains(e.target as Node)) {
                menu.remove();
                element.onmouseleave = null;
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 0);
}

// Actions for selected items
function completeItem(item: TodoItem, index: number): void {
    todoData.completed.unshift(item);
    todoData.selected.splice(index, 1);
    saveData();
    renderSelected();
}

function bumpToInventory(item: TodoItem, index: number): void {
    todoData.inventory.unshift(item);
    todoData.selected.splice(index, 1);
    saveData();
    renderSelected();
    renderInventory();
}

function moveToPending(item: TodoItem, index: number): void {
    todoData.pending.push(item);
    todoData.selected.splice(index, 1);
    saveData();
    renderSelected();
}

function editItem(item: TodoItem, index: number, location: keyof TodoData): void {
    const newText = prompt('Edit item:', item.text);
    if (newText && newText.trim()) {
        item.text = newText.trim();
        saveData();
        if (location === 'selected') renderSelected();
        if (location === 'inventory') renderInventory();
    }
}

function deleteItem(item: TodoItem, index: number, location: keyof TodoData): void {
    if (confirm('Delete this item?')) {
        todoData[location].splice(index, 1);
        saveData();
        if (location === 'selected') renderSelected();
        if (location === 'inventory') renderInventory();
    }
}

// Render inventory items
function renderInventory(): void {
    const container = document.getElementById('inventoryItems');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Add the "Add New Item" button at the top
    const addItemBtn = document.createElement('div');
    addItemBtn.className = 'inventory-item add-item-btn';
    addItemBtn.textContent = '+ Add New Item';
    addItemBtn.onclick = (e: MouseEvent) => {
        e.stopPropagation();
        showAddItemOverlay();
    };
    container.appendChild(addItemBtn);
    
    // if (todoData.inventory.length === 0) {
    //     const emptyMsg = document.createElement('div');
    //     emptyMsg.className = 'empty-state';
    //     emptyMsg.textContent = 'No items in inventory. Click above to add new items.';
    //     container.appendChild(emptyMsg);
    //     return;
    // }
    
    todoData.inventory.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'inventory-item';
        div.textContent = item.text;
        div.onclick = (e: MouseEvent) => {
            e.stopPropagation();
            showInventoryMenu(div, item, index);
        };
        container.appendChild(div);
    });
}

// Show inventory menu
function showInventoryMenu(element: HTMLElement, item: TodoItem, index: number): void {
    removeAllMenus();

    const menu = document.createElement('div');
    menu.className = 'inventory-menu';

    const options = [
        { text: 'Select as important to-do', action: () => selectAsImportant(item, index) },
        { text: 'Edit item', action: () => editInventoryItem(item, index) },
        { text: 'Delete item', action: () => deleteInventoryItem(index) }
    ];

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = opt.text;
        btn.onclick = () => {
            opt.action();
            menu.remove();
        };
        menu.appendChild(btn);
    });

    document.body.appendChild(menu);
    positionMenuBelow(menu, element);

    // Hover-based menu closing
    let isHoveringItem = true;
    let isHoveringMenu = false;

    const checkAndClose = () => {
        setTimeout(() => {
            if (!isHoveringItem && !isHoveringMenu) {
                menu.remove();
                element.onmouseleave = null;
            }
        }, 50);
    };

    element.onmouseleave = () => {
        isHoveringItem = false;
        checkAndClose();
    };

    element.onmouseenter = () => {
        isHoveringItem = true;
    };

    menu.onmouseenter = () => {
        isHoveringMenu = true;
    };

    menu.onmouseleave = () => {
        isHoveringMenu = false;
        checkAndClose();
    };

    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e: MouseEvent) {
            if (!menu.contains(e.target as Node)) {
                menu.remove();
                element.onmouseleave = null;
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 0);
}

function selectAsImportant(item: TodoItem, index: number): void {
    if (todoData.selected.length >= 5) {
        alert('All selected slots are full. Please complete or move an item first.');
        return;
    }
    todoData.selected.push(item);
    todoData.inventory.splice(index, 1);
    saveData();
    renderSelected();
    renderInventory();
}

function editInventoryItem(item: TodoItem, index: number): void {
    const newText = prompt('Edit item:', item.text);
    if (newText && newText.trim()) {
        item.text = newText.trim();
        saveData();
        renderInventory();
    }
}

function deleteInventoryItem(index: number): void {
    if (confirm('Delete this item?')) {
        todoData.inventory.splice(index, 1);
        saveData();
        renderInventory();
    }
}

// Overlay functions
function showOverlay(content: string): void {
    const overlay = document.getElementById('overlay');
    const overlayContent = document.getElementById('overlayContent');
    if (!overlay || !overlayContent) return;
    
    overlayContent.innerHTML = content;
    overlay.classList.add('active');
}

function hideOverlay(): void {
    const overlay = document.getElementById('overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
}

// Pending items functions
function pushPendingToSelected(index: number): void {
    if (todoData.selected.length >= 5) {
        alert('All selected slots are full. Please complete or move an item first.');
        return;
    }
    const item = todoData.pending.splice(index, 1)[0];
    todoData.selected.push(item);
    saveData();
    renderSelected();
    const pendingBtn = document.getElementById('pendingBtn') as HTMLButtonElement;
    pendingBtn?.click();
}

function bumpPendingToInventory(index: number): void {
    const item = todoData.pending.splice(index, 1)[0];
    todoData.inventory.unshift(item);
    saveData();
    renderInventory();
    const pendingBtn = document.getElementById('pendingBtn') as HTMLButtonElement;
    pendingBtn?.click();
}

function editPendingItem(index: number): void {
    const newText = prompt('Edit item:', todoData.pending[index].text);
    if (newText && newText.trim()) {
        todoData.pending[index].text = newText.trim();
        saveData();
        const pendingBtn = document.getElementById('pendingBtn') as HTMLButtonElement;
        pendingBtn?.click();
    }
}

function deletePendingItem(index: number): void {
    if (confirm('Delete this item?')) {
        todoData.pending.splice(index, 1);
        saveData();
        const pendingBtn = document.getElementById('pendingBtn') as HTMLButtonElement;
        pendingBtn?.click();
    }
}

// Add new item function
function addNewItem(e: Event): void {
    e.preventDefault();
    const input = document.getElementById('newItemInput') as HTMLInputElement;
    if (!input) return;
    
    const text = input.value.trim();
    
    if (text) {
        todoData.inventory.unshift({ text });
        saveData();
        renderInventory();
        // Highlight the newly added item (second child, after the add-item-btn)
        const container = document.getElementById('inventoryItems');
        if (container && container.children[1]) {
            container.children[1].classList.add('newly-added');
        }
        hideOverlay();
    }
}

// Show add item overlay
function showAddItemOverlay(): void {
    const content = `
        <div class="overlay-header">
            <h2>Add New Item</h2>
            <button class="close-btn" onclick="hideOverlay()">×</button>
        </div>
        <form class="input-form" onsubmit="addNewItem(event)">
            <input type="text" id="newItemInput" placeholder="Enter your to-do item..." required autofocus autocomplete="off">
            <button type="submit">Add to Inventory</button>
        </form>
    `;
    showOverlay(content);
}

// Initialize event listeners
function initializeEventListeners(): void {
    // Pending items button
    const pendingBtn = document.getElementById('pendingBtn');
    if (pendingBtn) {
        pendingBtn.onclick = () => {
            let content = `
                <div class="overlay-header">
                    <h2>Pending Items</h2>
                    <button class="close-btn" onclick="hideOverlay()">×</button>
                </div>
            `;
            
            if (todoData.pending.length === 0) {
                content += '<div class="empty-state">No pending items</div>';
            } else {
                content += '<div class="pending-list">';
                todoData.pending.forEach((item, index) => {
                    content += `
                        <div class="pending-item">
                            <div class="pending-item-text">${item.text}</div>
                            <div class="pending-actions">
                                <button onclick="pushPendingToSelected(${index})">Push to selected</button>
                                <button onclick="bumpPendingToInventory(${index})">Bump to inventory</button>
                                <button onclick="editPendingItem(${index})">Edit</button>
                                <button onclick="deletePendingItem(${index})">Delete</button>
                            </div>
                        </div>
                    `;
                });
                content += '</div>';
            }
            
            showOverlay(content);
        };
    }

    // Completed items button
    const completedBtn = document.getElementById('completedBtn');
    if (completedBtn) {
        completedBtn.onclick = () => {
            let content = `
                <div class="overlay-header">
                    <h2>Completed Items</h2>
                    <button class="close-btn" onclick="hideOverlay()">×</button>
                </div>
            `;
            
            if (todoData.completed.length === 0) {
                content += '<div class="empty-state">No completed items yet</div>';
            } else {
                content += '<div class="completed-list">';
                todoData.completed.forEach(item => {
                    content += `<div class="completed-item">${item.text}</div>`;
                });
                content += '</div>';
            }
            
            showOverlay(content);
        };
    }

    // Close overlay when clicking outside
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.onclick = (e: MouseEvent) => {
            if ((e.target as HTMLElement).id === 'overlay') {
                hideOverlay();
            }
        };
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderSelected();
    renderInventory();
    initializeEventListeners();
});

// Extend Window interface for TypeScript
interface Window {
    hideOverlay: () => void;
    pushPendingToSelected: (index: number) => void;
    bumpPendingToInventory: (index: number) => void;
    editPendingItem: (index: number) => void;
    deletePendingItem: (index: number) => void;
    addNewItem: (e: Event) => void;
}

// Make functions available globally for inline onclick handlers
window.hideOverlay = hideOverlay;
window.pushPendingToSelected = pushPendingToSelected;
window.bumpPendingToInventory = bumpPendingToInventory;
window.editPendingItem = editPendingItem;
window.deletePendingItem = deletePendingItem;
window.addNewItem = addNewItem;
