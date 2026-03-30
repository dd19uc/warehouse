// --- API Helpers ---
const API_BASE = 'http://localhost:4000/api';

async function apiLogin(username, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

async function apiRegister(username, password) {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

// --- Session Management ---
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
let sessionTimer = null;

function saveSession(user) {
  const sessionData = {
    ...user,
    loginTime: Date.now()
  };
  localStorage.setItem('warehouse-current-user', JSON.stringify(sessionData));
  resetSessionTimer();
}

function loadSession() {
  const raw = localStorage.getItem('warehouse-current-user');
  if (!raw) return null;
  try {
    const user = JSON.parse(raw);
    if (user.loginTime && Date.now() - user.loginTime > SESSION_TIMEOUT) {
      clearSession();
      showToast('⏱️ Your session has expired. Please log in again.', 'warning');
      window.location.reload();
      return null;
    }
    resetSessionTimer();
    return user;
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem('warehouse-current-user');
  if (sessionTimer) clearTimeout(sessionTimer);
}

function resetSessionTimer() {
  if (sessionTimer) clearTimeout(sessionTimer);
  const user = loadSession();
  if (user && user.loginTime) {
    const timeUntilExpiry = SESSION_TIMEOUT - (Date.now() - user.loginTime);
    if (timeUntilExpiry > 0) {
      sessionTimer = setTimeout(() => {
        clearSession();
        showToast('⏱️ Your session has expired. Please log in again.', 'warning');
        window.location.reload();
      }, timeUntilExpiry);
    }
  }
}

//  TOAST NOTIFICATION SYSTEM
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-close');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}



// ✅ DOM Elements
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

const btnAdd = document.getElementById('btnAdd');
const btnClear = document.getElementById('btnClear');
const btnExport = document.getElementById('btnExport');
const btnPrint = document.getElementById('btnPrint');
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


// --- Item API ---
async function apiGetItems(user_id) {
  const res = await fetch(`${API_BASE}/items?user_id=${encodeURIComponent(user_id)}`);
  return res.json();
}

async function apiAddItem(item) {
  const res = await fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  return res.json();
}

async function apiUpdateItem(id, item) {
  const res = await fetch(`${API_BASE}/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  return res.json();
}

async function apiDeleteItem(id) {
  const res = await fetch(`${API_BASE}/items/${id}`, { method: 'DELETE' });
  return res.json();
}

async function loadItems() {
  const currentUser = loadSession();
  if (!currentUser || !currentUser.id) {
    items = [];
    updateItemsTable();
    updateStats();
    updateChart();
    updateAlerts();
    return;
  }
  try {
    const data = await apiGetItems(currentUser.id);
    items = Array.isArray(data) ? data.map(item => ({
      ...item,
      minStock: item.minStock ?? item.min_stock ?? 0,
      quantity: Number(item.quantity ?? 0),
      min_stock: item.minStock ?? item.min_stock ?? 0
    })) : [];
  } catch {
    items = [];
  }
  updateItemsTable();
  updateStats();
  updateChart();
  updateAlerts();
}

function getItemStatus(quantity, minStock) {
  if (quantity <= 0) return { text: 'Out of Stock', class: 'status-danger' };
  if (quantity <= minStock) return { text: 'Low Stock', class: 'status-warning' };
  return { text: 'In Stock', class: 'status-ok' };
}

function getStockPercentage(quantity, minStock) {
  const q = Number(quantity);
  const m = Number(minStock);
  if (isNaN(q) || isNaN(m) || m === 0) return 100;
  return Math.min(100, Math.max(0, (q / m) * 100));
}

function updateStats() {
  if (!statTotal) return;
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

  statTotal.textContent = total;
  statLow.textContent = lowStock;
  statOut.textContent = outOfStock;
  statHealth.textContent = totalHealth + '%';

  const lowPercentage = total === 0 ? 0 : (lowStock / total) * 100;
  const outPercentage = total === 0 ? 0 : (outOfStock / total) * 100;

  if (totalBarFill) totalBarFill.style.setProperty('--percentage', '100%');
  if (lowBarFill) lowBarFill.style.setProperty('--percentage', lowPercentage + '%');
  if (outBarFill) outBarFill.style.setProperty('--percentage', outPercentage + '%');
  if (healthBarFill) healthBarFill.style.setProperty('--percentage', totalHealth + '%');
}

function updateAlerts() {
  if (!alertsBox) return;
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
  if (!itemsBody) return;
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

  if (searchTerm) {
    filteredItems = items.filter(item =>
      item.name.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm)
    );
  } else {
    filteredItems = items;
  }

  if (currentCategoryFilter !== 'all') {
    filteredItems = filteredItems.filter(item => item.category === currentCategoryFilter);
  }

  itemsBody.innerHTML = '';
  if (!filteredItems.length) {
    if (emptyMessage) {
      emptyMessage.classList.remove('hidden');
      emptyMessage.textContent = currentCategoryFilter !== 'all'
        ? `No items in "${currentCategoryFilter}" category.`
        : 'No items yet. Add one to get started!';
    }
    return;
  }
  if (emptyMessage) emptyMessage.classList.add('hidden');

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
      </td>
      <td>
        <div class="qty-actions">
          <button class="qty-btn qty-minus" data-id="${item.id}">−</button>
          <span class="qty-display">${item.quantity}</span>
          <button class="qty-btn qty-plus" data-id="${item.id}">+</button>
        </div>
      </td>
      <td>${item.minStock}</td>
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
  if (itemFormCard) itemFormCard.classList.remove('hidden');
  if (formTitle) formTitle.textContent = editMode ? 'Edit Item' : 'Add New Item';

  if (editMode && item) {
    if (itemIdInput) itemIdInput.value = item.id;
    if (itemNameInput) itemNameInput.value = item.name;
    if (itemCategoryInput) itemCategoryInput.value = item.category;
    if (itemQuantityInput) itemQuantityInput.value = item.quantity;
    if (itemMinStockInput) itemMinStockInput.value = item.minStock;
    if (itemNoteInput) itemNoteInput.value = item.note;
  } else {
    if (itemForm) itemForm.reset();
    if (itemIdInput) itemIdInput.value = '';
    if (itemMinStockInput) itemMinStockInput.value = '5';
  }

  if (itemNameInput) setTimeout(() => itemNameInput.focus(), 50);
}

function hideForm() {
  if (itemFormCard) itemFormCard.classList.add('hidden');
  if (itemForm) itemForm.reset();
  if (itemIdInput) itemIdInput.value = '';
  editMode = false;
}

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

function updateChart() {
  const chartCanvas = document.getElementById('categoryChart');
  if (!chartCanvas) return;
  const ctx = chartCanvas.getContext('2d');

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

  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded yet');
    return;
  }

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

// ✅ EVENT LISTENERS
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    if (!usernameInput || !passwordInput) return;

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    try {
      const result = await apiLogin(username, password);
      if (result.success && result.user) {
        if (loginError) loginError.textContent = '';
        saveSession(result.user);
        showToast(`👋 Welcome back, ${username}!`, 'success');
        if (loginScreen) loginScreen.classList.add('hidden');
        if (dashboard) dashboard.classList.remove('hidden');
        loadItems();
      } else {
        if (loginError) loginError.textContent = result.message || 'Username or password is incorrect.';
        showToast('❌ Login failed. Please try again.', 'error');
      }
    } catch (err) {
      if (loginError) loginError.textContent = 'Server error. Please try again.';
      showToast('❌ Login failed. Please try again.', 'error');
    }
  });
}

if (registerForm) {
  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    const regUsernameElem = document.getElementById('regUsername');
    const regPasswordElem = document.getElementById('regPassword');
    const regPassword2Elem = document.getElementById('regPassword2');

    if (!regUsernameElem || !regPasswordElem || !regPassword2Elem) return;

    const username = regUsernameElem.value.trim();
    const password = regPasswordElem.value.trim();
    const password2 = regPassword2Elem.value.trim();

    if (username.length < 3) {
      if (registerError) registerError.textContent = 'Username must be at least 3 characters.';
      showToast('⚠️ Username must be at least 3 characters.', 'warning');
      return;
    }

    if (password.length < 4) {
      if (registerError) registerError.textContent = 'Password must be at least 4 characters.';
      showToast('⚠️ Password must be at least 4 characters.', 'warning');
      return;
    }

    if (password !== password2) {
      if (registerError) registerError.textContent = 'Passwords do not match.';
      showToast('⚠️ Passwords do not match.', 'warning');
      return;
    }

    try {
      const result = await apiRegister(username, password);
      if (result.success && result.user) {
        if (registerError) registerError.textContent = '';
        showToast(`✅ Account created! Welcome ${username}!`, 'success');
        registerForm.reset();
        if (registerFormContainer) registerFormContainer.classList.add('hidden');
        if (loginFormContainer) loginFormContainer.classList.remove('hidden');
        const usernameField = document.getElementById('username');
        if (usernameField) usernameField.focus();
      } else {
        if (registerError) registerError.textContent = result.message || 'Registration failed.';
        showToast('⚠️ ' + (result.message || 'Registration failed.'), 'warning');
      }
    } catch (err) {
      if (registerError) registerError.textContent = 'Server error. Please try again.';
      showToast('⚠️ Registration failed. Please try again.', 'warning');
    }
  });
}

if (toggleRegisterBtn) {
  toggleRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (loginFormContainer) loginFormContainer.classList.add('hidden');
    if (registerFormContainer) registerFormContainer.classList.remove('hidden');
    if (registerError) registerError.textContent = '';
    const regUsernameField = document.getElementById('regUsername');
    if (regUsernameField) regUsernameField.focus();
  });
}

if (toggleLoginBtn) {
  toggleLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (registerFormContainer) registerFormContainer.classList.add('hidden');
    if (loginFormContainer) loginFormContainer.classList.remove('hidden');
    if (loginError) loginError.textContent = '';
    const usernameField = document.getElementById('username');
    if (usernameField) usernameField.focus();
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    clearSession();
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    if (usernameField) usernameField.value = '';
    if (passwordField) passwordField.value = '';
    showToast('👋 Logged out successfully!', 'success');
    if (dashboard) dashboard.classList.add('hidden');
    if (loginScreen) loginScreen.classList.remove('hidden');
  });
}

if (btnAdd) {
  btnAdd.addEventListener('click', () => showForm('add'));
}

if (cancelBtn) {
  cancelBtn.addEventListener('click', hideForm);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && itemFormCard && !itemFormCard.classList.contains('hidden')) {
    hideForm();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && itemFormCard && !itemFormCard.classList.contains('hidden')) {
    if (itemForm) itemForm.dispatchEvent(new Event('submit'));
  }
});

if (searchInput) {
  searchInput.addEventListener('input', updateItemsTable);
}

document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentCategoryFilter = tab.dataset.filter;
    updateItemsTable();
  });
});

if (btnPrint) {
  btnPrint.addEventListener('click', printReport);
}

if (itemForm) {
  itemForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name = itemNameInput.value.trim();
    const category = itemCategoryInput.value;
    const quantity = Number(itemQuantityInput.value);
    const minStock = Number(itemMinStockInput.value);
    const note = itemNoteInput.value.trim();
    const currentUser = loadSession();

    if (!name || !category || isNaN(quantity) || quantity < 0 || isNaN(minStock) || minStock < 0) {
      showToast('⚠️ Please fill all required fields correctly.', 'warning');
      return;
    }
    if (!currentUser || !currentUser.id) {
      showToast('❌ Not logged in.', 'error');
      return;
    }

    if (!editMode) {
      // Check for duplicate on client (optional, server will allow same name)
      // const isDuplicate = items.some(i => i.name.toLowerCase() === name.toLowerCase() && i.category === category);
      // if (isDuplicate) {
      //   showToast(`⚠️ "${name}" already exists in ${category}!`, 'warning');
      //   return;
      // }
      try {
        await apiAddItem({ name, category, quantity, min_stock: minStock, note, user_id: currentUser.id });
        showToast(`✅ "${name}" added successfully!`, 'success');
      } catch {
        showToast('❌ Failed to add item.', 'error');
      }
    } else {
      const id = itemIdInput.value;
      try {
        await apiUpdateItem(id, { name, category, quantity, min_stock: minStock, note });
        showToast(`✅ "${name}" updated successfully!`, 'success');
      } catch {
        showToast('❌ Failed to update item.', 'error');
      }
    }
    await loadItems();
    hideForm();
  });
}

if (itemsBody) {
  itemsBody.addEventListener('click', async e => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const id = btn.dataset.id;

    if (btn.classList.contains('qty-plus') || btn.classList.contains('qty-minus')) {
      const item = items.find(i => i.id == id);
      if (item) {
        const change = btn.classList.contains('qty-plus') ? 1 : -1;
        const newQty = Math.max(0, item.quantity + change);
        try {
          await apiUpdateItem(id, { ...item, quantity: newQty });
          showToast(`✅ "${item.name}" quantity ${btn.classList.contains('qty-plus') ? 'increased' : 'decreased'} to ${newQty}`, 'success', 2000);
        } catch {
          showToast('❌ Failed to update quantity.', 'error');
        }
        await loadItems();
      }
      return;
    }

    if (btn.dataset.action === 'edit') {
      const item = items.find(i => i.id == id);
      if (item) showForm('edit', item);
    }
    if (btn.dataset.action === 'delete') {
      const item = items.find(i => i.id == id);
      if (item && confirm(`Delete "${item.name}"?`)) {
        try {
          await apiDeleteItem(id);
          showToast(`🗑️ "${item.name}" deleted`, 'warning', 2000);
        } catch {
          showToast('❌ Failed to delete item.', 'error');
        }
        await loadItems();
      }
    }
  });
}

if (btnClear) {
  btnClear.addEventListener('click', async () => {
    if (items.length && confirm('Are you sure you want to delete ALL items? This cannot be undone.')) {
      for (const item of items) {
        try { await apiDeleteItem(item.id); } catch { }
      }
      await loadItems();
      showToast('🗑️ All items cleared! Starting fresh.', 'warning');
    } else if (!items.length) {
      showToast('ℹ️ Inventory is already empty.', 'info');
    }
  });
}

if (btnExport) {
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
    a.download = `warehouse-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`✅ Exported ${items.length} items to CSV!`, 'success');
  });
}

// 🚀 INITIALIZATION
function init() {
  // Hide both screens initially to prevent blink
  if (loginScreen) loginScreen.classList.add('hidden');
  if (dashboard) dashboard.classList.add('hidden');
  setTimeout(() => {
    try {
      let currentUser = loadSession();
      if (loginScreen && dashboard) {
        if (currentUser && currentUser.username && currentUser.id) {
          loginScreen.classList.add('hidden');
          dashboard.classList.remove('hidden');
        } else {
          loginScreen.classList.remove('hidden');
          dashboard.classList.add('hidden');
        }
      }
      loadItems();
    } catch (err) {
      if (loginScreen) loginScreen.classList.remove('hidden');
      if (dashboard) dashboard.classList.add('hidden');
    }
  }, 0);
}

init();
