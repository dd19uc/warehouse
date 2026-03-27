let USERS = [{ username: 'Crownee', password: '2005' }];

// Load users from localStorage
function loadUsers() {
  const stored = localStorage.getItem('warehouse-users');
  if (stored) {
    USERS = JSON.parse(stored);
  }
}

function saveUsers() {
  localStorage.setItem('warehouse-users', JSON.stringify(USERS));
}

loadUsers();

// � TOAST NOTIFICATION SYSTEM
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-close');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// �🔐 Session Management
function saveSession(username) {
  localStorage.setItem('warehouse-current-user', username);
}

function loadSession() {
  const username = localStorage.getItem('warehouse-current-user');
  return username;
}

function clearSession() {
  localStorage.removeItem('warehouse-current-user');
}

// Check if user is already logged in on page load
const currentUser = loadSession();
if (currentUser && USERS.some(u => u.username === currentUser)) {
  loginScreen.classList.add('hidden');
  dashboard.classList.remove('hidden');
  loadItems();
}

const loginScreen = document.getElementById('loginScreen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const registerForm = document.getElementById('registerForm');
const registerError = document.getElementById('registerError');
const loginFormContainer = document.getElementById('loginFormContainer');
const registerFormContainer = document.getElementById('registerFormContainer');
const toggleRegisterBtn = document.getElementById('toggleRegisterBtn');
const toggleLoginBtn = document.getElementById('toggleLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Debug logging
console.log('✅ registerForm:', !!registerForm);
console.log('✅ registerError:', !!registerError);
console.log('✅ toggleRegisterBtn:', !!toggleRegisterBtn);
console.log('✅ toggleLoginBtn:', !!toggleLoginBtn);
console.log('✅ loginFormContainer:', !!loginFormContainer);
console.log('✅ registerFormContainer:', !!registerFormContainer);

const btnAdd = document.getElementById('btnAdd');
const btnClear = document.getElementById('btnClear');
const btnExport = document.getElementById('btnExport');
const itemFormCard = document.getElementById('itemFormCard');
const formTitle = document.getElementById('formTitle');
const itemForm = document.getElementById('itemForm');
const cancelBtn = document.getElementById('cancelBtn');
const searchInput = document.getElementById('searchInput');
const alertsBox = document.getElementById('alertsBox');

const itemIdInput = document.getElementById('itemId');
const itemNameInput = document.getElementById('itemName');
const itemCategoryInput = document.getElementById('itemCategory');
const itemQuantityInput = document.getElementById('itemQuantity');
const itemMinStockInput = document.getElementById('itemMinStock');
const itemNoteInput = document.getElementById('itemNote');

const itemsBody = document.getElementById('itemsBody');
const emptyMessage = document.getElementById('emptyMessage');

// 📊 Stats DOM Elements
const statTotal = document.getElementById('statTotal');
const statLow = document.getElementById('statLow');
const statOut = document.getElementById('statOut');
const statHealth = document.getElementById('statHealth');
const totalBarFill = document.getElementById('totalBarFill');
const lowBarFill = document.getElementById('lowBarFill');
const outBarFill = document.getElementById('outBarFill');
const healthBarFill = document.getElementById('healthBarFill');

let items = [];
let editMode = false;
let filteredItems = [];
let chart = null;
let currentCategoryFilter = 'all';

function saveItems() { localStorage.setItem('warehouse-items', JSON.stringify(items)); }
function loadItems() { const raw = localStorage.getItem('warehouse-items'); if (raw) items = JSON.parse(raw); updateItemsTable(); updateStats(); updateChart(); }

function getItemStatus(quantity, minStock) {
  if (quantity <= 0) return { text: 'Out of Stock', class: 'status-danger' };
  if (quantity <= minStock) return { text: 'Low Stock', class: 'status-warning' };
  return { text: 'In Stock', class: 'status-ok' };
}

function getStockPercentage(quantity, minStock) {
  if (minStock === 0) return 100;
  return Math.min(100, Math.max(0, (quantity / minStock) * 100));
}

/* 📊 Stats Calculation */
function updateStats() {
  const total = items.length;
  const lowStock = items.filter(i => i.quantity > 0 && i.quantity <= i.minStock).length;
  const outOfStock = items.filter(i => i.quantity <= 0).length;

  // Calculate overall health percentage
  let totalHealth = 0;
  if (items.length > 0) {
    items.forEach(item => {
      const percentage = getStockPercentage(item.quantity, item.minStock);
      totalHealth += percentage;
    });
    totalHealth = Math.round(totalHealth / items.length);
  }

  // Update stat cards with animation
  statTotal.textContent = total;
  statLow.textContent = lowStock;
  statOut.textContent = outOfStock;
  statHealth.textContent = totalHealth + '%';

  // Animate bars
  const lowPercentage = total === 0 ? 0 : (lowStock / total) * 100;
  const outPercentage = total === 0 ? 0 : (outOfStock / total) * 100;

  totalBarFill.style.setProperty('--percentage', '100%');
  lowBarFill.style.setProperty('--percentage', lowPercentage + '%');
  outBarFill.style.setProperty('--percentage', outPercentage + '%');
  healthBarFill.style.setProperty('--percentage', totalHealth + '%');
}

function updateAlerts() {
  const lowStockItems = items.filter(i => i.quantity <= i.minStock);

  if (!lowStockItems.length) {
    alertsBox.classList.add('hidden');
    return;
  }

  alertsBox.classList.remove('hidden');
  alertsBox.innerHTML = '<h3>⚠️ Alert: Low Stock Items</h3><ul>';

  lowStockItems.forEach(item => {
    let msg = `${item.name} (${item.quantity}/${item.minStock})`;
    if (item.quantity <= 0) {
      msg = `🔴 ${item.name} - Out of Stock`;
    } else {
      msg = `⚠️ ${item.name} - Low Stock (${item.quantity}/${item.minStock})`;
    }
    alertsBox.innerHTML += `<li>${msg}</li>`;
  });

  alertsBox.innerHTML += '</ul>';
}

function updateItemsTable() {
  const searchTerm = searchInput.value.toLowerCase().trim();

  if (searchTerm) {
    filteredItems = items.filter(item =>
      item.name.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm)
    );
  } else {
    filteredItems = items;
  }

  // Apply category filter
  if (currentCategoryFilter !== 'all') {
    filteredItems = filteredItems.filter(item => item.category === currentCategoryFilter);
  }

  itemsBody.innerHTML = '';
  if (!filteredItems.length) {
    emptyMessage.classList.remove('hidden');
    emptyMessage.textContent = currentCategoryFilter !== 'all'
      ? `No items in "${currentCategoryFilter}" category.`
      : 'No items yet. Add one to get started!';
    return;
  }
  emptyMessage.classList.add('hidden');

  filteredItems.forEach(item => {
    const status = getItemStatus(item.quantity, item.minStock);
    const stockPercentage = getStockPercentage(item.quantity, item.minStock);
    let progressClass = 'progress-fill';
    if (item.quantity <= 0) {
      progressClass += ' critical';
    } else if (item.quantity <= item.minStock) {
      progressClass += ' warning';
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>
        <div class="stock-progress">
          <div class="progress-bar">
            <div class="${progressClass}" style="--percentage: ${stockPercentage}%;"></div>
          </div>
          <span class="progress-text">${item.quantity}</span>
        </div>
      </td>      <td>
        <div class=\"qty-actions\">
          <button class=\"qty-btn qty-minus\" data-id=\"${item.id}\">−</button>
          <span class=\"qty-display\">${item.quantity}</span>
          <button class=\"qty-btn qty-plus\" data-id=\"${item.id}\">+</button>
        </div>
      </td>      <td>${item.minStock}</td>
      <td><span class="${status.class}">${status.text}</span></td>
      <td>${item.note || '-'}</td>
      <td>
        <button class="btn secondary" data-action="edit" data-id="${item.id}">Edit</button>
        <button class="btn danger" data-action="delete" data-id="${item.id}">Delete</button>
      </td>
    `;
    itemsBody.appendChild(tr);
  });
}

function showForm(mode = 'add', item = null) {
  editMode = mode === 'edit';
  itemFormCard.classList.remove('hidden');
  formTitle.textContent = editMode ? 'Edit Item' : 'Add New Item';

  if (editMode && item) {
    itemIdInput.value = item.id;
    itemNameInput.value = item.name;
    itemCategoryInput.value = item.category;
    itemQuantityInput.value = item.quantity;
    itemMinStockInput.value = item.minStock;
    itemNoteInput.value = item.note;
  } else {
    itemForm.reset();
    itemIdInput.value = '';
    itemMinStockInput.value = '5';
  }
  
  // Focus on name input and setup keyboard shortcuts
  setTimeout(() => itemNameInput.focus(), 50);
}

function hideForm() { 
  itemFormCard.classList.add('hidden'); 
  itemForm.reset(); 
  itemIdInput.value = ''; 
  editMode = false; 
}

// 📄 PRINT REPORT FUNCTION
function printReport() {
  const printWindow = window.open('', '', 'height=800,width=1000');
  const timestamp = new Date().toLocaleString();
  
  let itemsHTML = '<tr><th>Item</th><th>Category</th><th>Qty</th><th>Min</th><th>Status</th></tr>';
  items.forEach(item => {
    const status = getItemStatus(item.quantity, item.minStock);
    itemsHTML += `<tr>
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.quantity}</td>
      <td>${item.minStock}</td>
      <td>${status.text}</td>
    </tr>`;
  });
  
  const total = items.length;
  const lowStock = items.filter(i => i.quantity > 0 && i.quantity <= i.minStock).length;
  const outOfStock = items.filter(i => i.quantity <= 0).length;
  let totalHealth = 0;
  if (items.length > 0) {
    items.forEach(item => {
      const percentage = getStockPercentage(item.quantity, item.minStock);
      totalHealth += percentage;
    });
    totalHealth = Math.round(totalHealth / items.length);
  }
  
  printWindow.document.write(`
    <html><head><title>Warehouse Inventory Report</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      h1 { color: #1f5db2; }
      .summary { background: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
      th { background: #1f5db2; color: white; }
      .timestamp { color: #666; font-size: 0.9em; }
    </style>
    </head><body>
    <h1>📦 Warehouse Inventory Report</h1>
    <p class="timestamp">Generated: ${timestamp}</p>
    <div class="summary">
      <p><strong>Total Items:</strong> ${total}</p>
      <p><strong>Low Stock Items:</strong> ${lowStock}</p>
      <p><strong>Out of Stock:</strong> ${outOfStock}</p>
      <p><strong>Overall Health:</strong> ${totalHealth}%</p>
    </div>
    <table>${itemsHTML}</table>
  </body></html>`);
  printWindow.document.close();
  printWindow.print();
}

/* 📊 Chart.js Integration */
function updateChart() {
  const ctx = document.getElementById('categoryChart').getContext('2d');
  const categoryCount = {};
  const categoryColors = {
    'Food': '#10b981',
    'Equipment': '#3b82f6',
    'Supplies': '#f59e0b'
  };

  items.forEach(item => {
    categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
  });

  const labels = Object.keys(categoryCount);
  const data = Object.values(categoryCount);
  const colors = labels.map(label => categoryColors[label] || '#8b5cf6');

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.data.datasets[0].backgroundColor = colors;
    chart.update();
  } else {
    chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: 'rgba(255, 255, 255, 0.8)',
          borderWidth: 3,
          hoverOffset: 8,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 13, weight: '600' },
              color: '#1f5db2',
              padding: 15,
              usePointStyle: true,
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 800,
          easing: 'easeInOutQuart'
        }
      }
    });
  }
}

loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (USERS.some(u => u.username === username && u.password === password)) {
    loginError.textContent = '';
    saveSession(username);
    showToast(`👋 Welcome back, ${username}!`, 'success');
    loginScreen.classList.add('hidden');
    dashboard.classList.remove('hidden');
    loadItems();
  } else {
    loginError.textContent = 'Username or password is incorrect.';
    showToast('❌ Login failed. Please try again.', 'error');
  }
});

/* 🔐 Register Handler */
if (registerForm) {
  registerForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const password2 = document.getElementById('regPassword2').value.trim();

    // Validation
    if (username.length < 3) {
      registerError.textContent = 'Username must be at least 3 characters.';
      showToast('⚠️ Username must be at least 3 characters.', 'warning');
      return;
    }

    if (password.length < 4) {
      registerError.textContent = 'Password must be at least 4 characters.';
      showToast('⚠️ Password must be at least 4 characters.', 'warning');
      return;
    }

    if (password !== password2) {
      registerError.textContent = 'Passwords do not match.';
      showToast('⚠️ Passwords do not match.', 'warning');
      return;
    }

    if (USERS.some(u => u.username === username)) {
      registerError.textContent = 'Username already exists. Choose another.';
      showToast('⚠️ Username already exists.', 'warning');
      return;
    }

    // Create new user
    USERS.push({ username, password });
    saveUsers();

    registerError.textContent = '';
    showToast(`✅ Account created! Welcome ${username}!`, 'success');

    // Clear form and switch to login
    registerForm.reset();
    registerFormContainer.classList.add('hidden');
    loginFormContainer.classList.remove('hidden');
    document.getElementById('username').focus();
  });
} else {
  console.error('registerForm element not found');
}

/* 🔄 Toggle Between Login and Register */
if (toggleRegisterBtn) {
  toggleRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginFormContainer.classList.add('hidden');
    registerFormContainer.classList.remove('hidden');
    registerError.textContent = '';
    document.getElementById('regUsername').focus();
  });
} else {
  console.error('toggleRegisterBtn element not found');
}

if (toggleLoginBtn) {
  toggleLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    registerFormContainer.classList.add('hidden');
    loginFormContainer.classList.remove('hidden');
    loginError.textContent = '';
    document.getElementById('username').focus();
  });
} else {
  console.error('toggleLoginBtn element not found');
}

logoutBtn.addEventListener('click', () => {
  clearSession();
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  showToast('👋 Logged out successfully!', 'success');
  dashboard.classList.add('hidden');
  loginScreen.classList.remove('hidden');
});

btnAdd.addEventListener('click', () => showForm('add'));
cancelBtn.addEventListener('click', hideForm);

// 🎯 Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  // Esc to close form
  if (e.key === 'Escape' && !itemFormCard.classList.contains('hidden')) {
    hideForm();
  }
  // Ctrl+Enter to submit form
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !itemFormCard.classList.contains('hidden')) {
    itemForm.dispatchEvent(new Event('submit'));
  }
});

searchInput.addEventListener('input', updateItemsTable);

// 🏷️ Category Filter
document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentCategoryFilter = tab.dataset.filter;
    updateItemsTable();
  });
});

// 📄 Print Button
const btnPrint = document.getElementById('btnPrint');
if (btnPrint) {
  btnPrint.addEventListener('click', printReport);
}

itemForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = itemNameInput.value.trim();
  const category = itemCategoryInput.value;
  const quantity = Number(itemQuantityInput.value);
  const minStock = Number(itemMinStockInput.value);
  const note = itemNoteInput.value.trim();

  if (!name || !category || quantity < 0 || minStock < 0) {
    showToast('⚠️ Please fill all required fields correctly.', 'warning');
    return;
  }

  // Check for duplicate items (when adding new)
  if (!editMode) {
    const isDuplicate = items.some(i => i.name.toLowerCase() === name.toLowerCase() && i.category === category);
    if (isDuplicate) {
      showToast(`⚠️ "${name}" already exists in ${category}!`, 'warning');
      return;
    }
    
    items.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      category,
      quantity,
      minStock,
      note,
    });
    showToast(`✅ "${name}" added successfully!`, 'success');
  } else {
    const id = itemIdInput.value;
    const idx = items.findIndex(i => i.id === id);
    if (idx > -1) {
      items[idx] = { ...items[idx], name, category, quantity, minStock, note };
      showToast(`✅ "${name}" updated successfully!`, 'success');
    }
  }

  saveItems();
  updateItemsTable();
  updateStats();
  updateChart();
  updateAlerts();
  hideForm();
});

itemsBody.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  
  const id = btn.dataset.id;
  
  // Handle quick action buttons (+/-)
  if (btn.classList.contains('qty-plus') || btn.classList.contains('qty-minus')) {
    const item = items.find(i => i.id === id);
    if (item) {
      const change = btn.classList.contains('qty-plus') ? 1 : -1;
      const newQty = Math.max(0, item.quantity + change);
      item.quantity = newQty;
      saveItems();
      updateItemsTable();
      updateStats();
      updateChart();
      updateAlerts();
      
      const action = btn.classList.contains('qty-plus') ? 'increased' : 'decreased';
      showToast(`✅ "${item.name}" quantity ${action} to ${newQty}`, 'success', 2000);
    }
    return;
  }
  
  if (btn.dataset.action === 'edit') {
    const item = items.find(i => i.id === id);
    if (item) showForm('edit', item);
  }
  if (btn.dataset.action === 'delete') {
    const item = items.find(i => i.id === id);
    if (confirm(`Delete "${item.name}"?`)) {
      items = items.filter(i => i.id !== id);
      saveItems();
      updateItemsTable();
      updateStats();
      updateChart();
      updateAlerts();
      showToast(`🗑️ "${item.name}" deleted`, 'warning', 2000);
    }
  }
});

btnClear.addEventListener('click', () => {
  if (items.length && confirm('Are you sure you want to delete ALL items? This cannot be undone.')) {
    items = [];
    saveItems();
    updateItemsTable();
    updateStats();
    updateChart();
    updateAlerts();
    showToast('🗑️ All items cleared! Starting fresh.', 'warning');
  } else if (!items.length) {
    showToast('ℹ️ Inventory is already empty.', 'info');
  }
});

btnExport.addEventListener('click', () => {
  if (!items.length) {
    showToast('⚠️ No items to export.', 'warning');
    return;
  }
  const csvRows = ['Name,Category,Quantity,Minimum Stock,Note'];
  items.forEach(i => {
    const line = [i.name, i.category, i.quantity, i.minStock, i.note || ''].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    csvRows.push(line);
  });
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `warehouse-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`✅ Exported ${items.length} items to CSV!`, 'success');
});

loadItems();
