// Data structure
var todoData = {
    selected: [],
    inventory: [],
    pending: [],
    completed: []
};
// Load data from localStorage
function loadData() {
    var saved = localStorage.getItem('todoData');
    if (saved) {
        todoData = JSON.parse(saved);
    }
}
// Save data to localStorage
function saveData() {
    localStorage.setItem('todoData', JSON.stringify(todoData));
}
// Render selected items
function renderSelected() {
    var container = document.getElementById('selectedItems');
    if (!container)
        return;
    container.innerHTML = '';
    var _loop_1 = function (i) {
        var item = todoData.selected[i];
        var div = document.createElement('div');
        if (item) {
            div.className = 'selected-item';
            div.textContent = item.text;
            div.onclick = function (e) {
                e.stopPropagation();
                showKebabMenu(div, item, i);
            };
        }
        else {
            div.className = 'selected-item empty';
            div.textContent = 'Empty slot';
        }
        container.appendChild(div);
    };
    for (var i = 0; i < 5; i++) {
        _loop_1(i);
    }
}
// Remove all open dropdown menus
function removeAllMenus() {
    document.querySelectorAll('.kebab-menu, .inventory-menu').forEach(function (m) { return m.remove(); });
}
// Position a fixed-position menu below a trigger element
function positionMenuBelow(menu, trigger) {
    var rect = trigger.getBoundingClientRect();
    menu.style.left = "".concat(rect.left, "px");
    menu.style.top = "".concat(rect.bottom + 5, "px");
    // Adjust if menu overflows viewport
    requestAnimationFrame(function () {
        var menuRect = menu.getBoundingClientRect();
        if (menuRect.bottom > window.innerHeight) {
            menu.style.top = "".concat(rect.top - menuRect.height - 5, "px");
        }
        if (menuRect.right > window.innerWidth) {
            menu.style.left = "".concat(window.innerWidth - menuRect.width - 10, "px");
        }
    });
}
// Show kebab menu for selected items
function showKebabMenu(element, item, index) {
    removeAllMenus();
    var menu = document.createElement('div');
    menu.className = 'kebab-menu';
    var options = [
        { text: 'Completed', action: function () { return completeItem(item, index); } },
        { text: 'Bump back to inventory', action: function () { return bumpToInventory(item, index); } },
        { text: 'Pending other actions', action: function () { return moveToPending(item, index); } },
        { text: 'Edit item', action: function () { return editItem(item, index, 'selected'); } },
        { text: 'Delete item', action: function () { return deleteItem(item, index, 'selected'); } }
    ];
    options.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.textContent = opt.text;
        btn.onclick = function () {
            opt.action();
            menu.remove();
        };
        menu.appendChild(btn);
    });
    document.body.appendChild(menu);
    positionMenuBelow(menu, element);
    // Hover-based menu closing
    var isHoveringItem = true;
    var isHoveringMenu = false;
    var checkAndClose = function () {
        setTimeout(function () {
            if (!isHoveringItem && !isHoveringMenu) {
                menu.remove();
                element.onmouseleave = null;
            }
        }, 50);
    };
    element.onmouseleave = function () {
        isHoveringItem = false;
        checkAndClose();
    };
    element.onmouseenter = function () {
        isHoveringItem = true;
    };
    menu.onmouseenter = function () {
        isHoveringMenu = true;
    };
    menu.onmouseleave = function () {
        isHoveringMenu = false;
        checkAndClose();
    };
    // Close menu when clicking outside
    setTimeout(function () {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                element.onmouseleave = null;
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 0);
}
// Actions for selected items
function completeItem(item, index) {
    todoData.completed.unshift(item);
    todoData.selected.splice(index, 1);
    saveData();
    renderSelected();
}
function bumpToInventory(item, index) {
    todoData.inventory.unshift(item);
    todoData.selected.splice(index, 1);
    saveData();
    renderSelected();
    renderInventory();
}
function moveToPending(item, index) {
    todoData.pending.push(item);
    todoData.selected.splice(index, 1);
    saveData();
    renderSelected();
}
function editItem(item, index, location) {
    var newText = prompt('Edit item:', item.text);
    if (newText && newText.trim()) {
        item.text = newText.trim();
        saveData();
        if (location === 'selected')
            renderSelected();
        if (location === 'inventory')
            renderInventory();
    }
}
function deleteItem(item, index, location) {
    if (confirm('Delete this item?')) {
        todoData[location].splice(index, 1);
        saveData();
        if (location === 'selected')
            renderSelected();
        if (location === 'inventory')
            renderInventory();
    }
}
// Render inventory items
function renderInventory() {
    var container = document.getElementById('inventoryItems');
    if (!container)
        return;
    container.innerHTML = '';
    // Add the "Add New Item" button at the top
    var addItemBtn = document.createElement('div');
    addItemBtn.className = 'inventory-item add-item-btn';
    addItemBtn.textContent = '+ Add New Item';
    addItemBtn.onclick = function (e) {
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
    todoData.inventory.forEach(function (item, index) {
        var div = document.createElement('div');
        div.className = 'inventory-item';
        div.textContent = item.text;
        div.onclick = function (e) {
            e.stopPropagation();
            showInventoryMenu(div, item, index);
        };
        container.appendChild(div);
    });
}
// Show inventory menu
function showInventoryMenu(element, item, index) {
    removeAllMenus();
    var menu = document.createElement('div');
    menu.className = 'inventory-menu';
    var options = [
        { text: 'Select as important to-do', action: function () { return selectAsImportant(item, index); } },
        { text: 'Edit item', action: function () { return editInventoryItem(item, index); } },
        { text: 'Delete item', action: function () { return deleteInventoryItem(index); } }
    ];
    options.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.textContent = opt.text;
        btn.onclick = function () {
            opt.action();
            menu.remove();
        };
        menu.appendChild(btn);
    });
    document.body.appendChild(menu);
    positionMenuBelow(menu, element);
    // Hover-based menu closing
    var isHoveringItem = true;
    var isHoveringMenu = false;
    var checkAndClose = function () {
        setTimeout(function () {
            if (!isHoveringItem && !isHoveringMenu) {
                menu.remove();
                element.onmouseleave = null;
            }
        }, 50);
    };
    element.onmouseleave = function () {
        isHoveringItem = false;
        checkAndClose();
    };
    element.onmouseenter = function () {
        isHoveringItem = true;
    };
    menu.onmouseenter = function () {
        isHoveringMenu = true;
    };
    menu.onmouseleave = function () {
        isHoveringMenu = false;
        checkAndClose();
    };
    // Close menu when clicking outside
    setTimeout(function () {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                element.onmouseleave = null;
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 0);
}
function selectAsImportant(item, index) {
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
function editInventoryItem(item, index) {
    var newText = prompt('Edit item:', item.text);
    if (newText && newText.trim()) {
        item.text = newText.trim();
        saveData();
        renderInventory();
    }
}
function deleteInventoryItem(index) {
    if (confirm('Delete this item?')) {
        todoData.inventory.splice(index, 1);
        saveData();
        renderInventory();
    }
}
// Overlay functions
function showOverlay(content) {
    var overlay = document.getElementById('overlay');
    var overlayContent = document.getElementById('overlayContent');
    if (!overlay || !overlayContent)
        return;
    overlayContent.innerHTML = content;
    overlay.classList.add('active');
}
function hideOverlay() {
    var overlay = document.getElementById('overlay');
    if (!overlay)
        return;
    overlay.classList.remove('active');
}
// Pending items functions
function pushPendingToSelected(index) {
    if (todoData.selected.length >= 5) {
        alert('All selected slots are full. Please complete or move an item first.');
        return;
    }
    var item = todoData.pending.splice(index, 1)[0];
    todoData.selected.push(item);
    saveData();
    renderSelected();
    var pendingBtn = document.getElementById('pendingBtn');
    pendingBtn === null || pendingBtn === void 0 ? void 0 : pendingBtn.click();
}
function bumpPendingToInventory(index) {
    var item = todoData.pending.splice(index, 1)[0];
    todoData.inventory.unshift(item);
    saveData();
    renderInventory();
    var pendingBtn = document.getElementById('pendingBtn');
    pendingBtn === null || pendingBtn === void 0 ? void 0 : pendingBtn.click();
}
function editPendingItem(index) {
    var newText = prompt('Edit item:', todoData.pending[index].text);
    if (newText && newText.trim()) {
        todoData.pending[index].text = newText.trim();
        saveData();
        var pendingBtn = document.getElementById('pendingBtn');
        pendingBtn === null || pendingBtn === void 0 ? void 0 : pendingBtn.click();
    }
}
function deletePendingItem(index) {
    if (confirm('Delete this item?')) {
        todoData.pending.splice(index, 1);
        saveData();
        var pendingBtn = document.getElementById('pendingBtn');
        pendingBtn === null || pendingBtn === void 0 ? void 0 : pendingBtn.click();
    }
}
// Add new item function
function addNewItem(e) {
    e.preventDefault();
    var input = document.getElementById('newItemInput');
    if (!input)
        return;
    var text = input.value.trim();
    if (text) {
        todoData.inventory.unshift({ text: text });
        saveData();
        renderInventory();
        // Highlight the newly added item (second child, after the add-item-btn)
        var container = document.getElementById('inventoryItems');
        if (container && container.children[1]) {
            container.children[1].classList.add('newly-added');
        }
        hideOverlay();
    }
}
// Show add item overlay
function showAddItemOverlay() {
    var content = "\n        <div class=\"overlay-header\">\n            <h2>Add New Item</h2>\n            <button class=\"close-btn\" onclick=\"hideOverlay()\">\u00D7</button>\n        </div>\n        <form class=\"input-form\" onsubmit=\"addNewItem(event)\">\n            <input type=\"text\" id=\"newItemInput\" placeholder=\"Enter your to-do item...\" required autofocus autocomplete=\"off\">\n            <button type=\"submit\">Add to Inventory</button>\n        </form>\n    ";
    showOverlay(content);
}
// Initialize event listeners
function initializeEventListeners() {
    // Pending items button
    var pendingBtn = document.getElementById('pendingBtn');
    if (pendingBtn) {
        pendingBtn.onclick = function () {
            var content = "\n                <div class=\"overlay-header\">\n                    <h2>Pending Items</h2>\n                    <button class=\"close-btn\" onclick=\"hideOverlay()\">\u00D7</button>\n                </div>\n            ";
            if (todoData.pending.length === 0) {
                content += '<div class="empty-state">No pending items</div>';
            }
            else {
                content += '<div class="pending-list">';
                todoData.pending.forEach(function (item, index) {
                    content += "\n                        <div class=\"pending-item\">\n                            <div class=\"pending-item-text\">".concat(item.text, "</div>\n                            <div class=\"pending-actions\">\n                                <button onclick=\"pushPendingToSelected(").concat(index, ")\">Push to selected</button>\n                                <button onclick=\"bumpPendingToInventory(").concat(index, ")\">Bump to inventory</button>\n                                <button onclick=\"editPendingItem(").concat(index, ")\">Edit</button>\n                                <button onclick=\"deletePendingItem(").concat(index, ")\">Delete</button>\n                            </div>\n                        </div>\n                    ");
                });
                content += '</div>';
            }
            showOverlay(content);
        };
    }
    // Completed items button
    var completedBtn = document.getElementById('completedBtn');
    if (completedBtn) {
        completedBtn.onclick = function () {
            var content = "\n                <div class=\"overlay-header\">\n                    <h2>Completed Items</h2>\n                    <button class=\"close-btn\" onclick=\"hideOverlay()\">\u00D7</button>\n                </div>\n            ";
            if (todoData.completed.length === 0) {
                content += '<div class="empty-state">No completed items yet</div>';
            }
            else {
                content += '<div class="completed-list">';
                todoData.completed.forEach(function (item) {
                    content += "<div class=\"completed-item\">".concat(item.text, "</div>");
                });
                content += '</div>';
            }
            showOverlay(content);
        };
    }
    // Close overlay when clicking outside
    var overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.onclick = function (e) {
            if (e.target.id === 'overlay') {
                hideOverlay();
            }
        };
    }
}
// Initialize app
document.addEventListener('DOMContentLoaded', function () {
    loadData();
    renderSelected();
    renderInventory();
    initializeEventListeners();
});
// Make functions available globally for inline onclick handlers
window.hideOverlay = hideOverlay;
window.pushPendingToSelected = pushPendingToSelected;
window.bumpPendingToInventory = bumpPendingToInventory;
window.editPendingItem = editPendingItem;
window.deletePendingItem = deletePendingItem;
window.addNewItem = addNewItem;
