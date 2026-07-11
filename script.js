const STORAGE_KEY = 'finanzas-personales-data';

const budgetInput = document.getElementById('budgetInput');
const saveBudgetBtn = document.getElementById('saveBudgetBtn');
const descriptionInput = document.getElementById('descriptionInput');
const categoryInput = document.getElementById('categoryInput');
const amountInput = document.getElementById('amountInput');
const addExpenseBtn = document.getElementById('addExpenseBtn');
const clearExpensesBtn = document.getElementById('clearExpensesBtn');

const budgetValue = document.getElementById('budgetValue');
const spentValue = document.getElementById('spentValue');
const remainingValue = document.getElementById('remainingValue');
const percentageValue = document.getElementById('percentageValue');
const alertMessage = document.getElementById('alertMessage');
const expenseList = document.getElementById('expenseList');
const expenseChart = document.getElementById('expenseChart');
const chartLegend = document.getElementById('chartLegend');
const installBtn = document.getElementById('installBtn');
const assistantInput = document.getElementById('assistantInput');
const assistantBtn = document.getElementById('assistantBtn');
const assistantResponse = document.getElementById('assistantResponse');

let budget = 0;
let expenses = [];
const chartColors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];
let deferredPrompt = null;

function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ budget, expenses }));
}

function loadData() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) {
      return { budget: 0, expenses: [] };
    }

    const parsedData = JSON.parse(savedData);
    return {
      budget: Number(parsedData.budget) || 0,
      expenses: Array.isArray(parsedData.expenses) ? parsedData.expenses : []
    };
  } catch (error) {
    console.warn('No se pudieron cargar los datos guardados.', error);
    return { budget: 0, expenses: [] };
  }
}

function updateSummary() {
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = budget - totalSpent;
  const percentage = budget > 0 ? (totalSpent / budget) * 100 : 0;

  budgetValue.textContent = formatCurrency(budget);
  spentValue.textContent = formatCurrency(totalSpent);
  remainingValue.textContent = formatCurrency(remaining);
  percentageValue.textContent = `${percentage.toFixed(1)}%`;

  let message = '';
  let alertClass = 'alert-card';

  if (budget <= 0) {
    message = 'Agrega un presupuesto para comenzar.';
  } else if (percentage >= 100) {
    message = '⚠️ Has excedido tu presupuesto.';
    alertClass = 'alert-card alert-danger';
  } else if (percentage >= 90) {
    message = '⚠️ Estás muy cerca de exceder tu presupuesto.';
    alertClass = 'alert-card alert-warning';
  } else if (percentage >= 75) {
    message = '⚠️ Estás usando una gran parte de tu presupuesto.';
    alertClass = 'alert-card alert-warning';
  } else {
    message = '✅ Vas bien con tu presupuesto.';
    alertClass = 'alert-card alert-success';
  }

  alertMessage.textContent = message;
  alertMessage.parentElement.className = `card ${alertClass}`;
}

function renderExpenses() {
  expenseList.innerHTML = '';

  if (expenses.length === 0) {
    expenseList.innerHTML = '<li class="expense-item">No hay gastos registrados.</li>';
    renderChart();
    return;
  }

  expenses.forEach((expense, index) => {
    const li = document.createElement('li');
    li.className = 'expense-item';
    li.innerHTML = `
      <div>
        <strong>${expense.description}</strong>
        <div>${expense.category || 'General'} · ${formatCurrency(expense.amount)}</div>
      </div>
      <button data-index="${index}">Eliminar</button>
    `;
    expenseList.appendChild(li);
  });

  renderChart();
}

function renderChart() {
  const ctx = expenseChart.getContext('2d');
  const totalsByCategory = {};

  expenses.forEach((expense) => {
    const category = expense.category || 'General';
    totalsByCategory[category] = (totalsByCategory[category] || 0) + expense.amount;
  });

  const categories = Object.keys(totalsByCategory);
  const values = Object.values(totalsByCategory);

  chartLegend.innerHTML = '';

  if (categories.length === 0) {
    ctx.clearRect(0, 0, expenseChart.width, expenseChart.height);
    chartLegend.innerHTML = '<p>No hay datos para mostrar.</p>';
    return;
  }

  categories.forEach((category, index) => {
    const item = document.createElement('div');
    item.className = 'chart-legend-item';
    item.innerHTML = `
      <span class="chart-color" style="background:${chartColors[index % chartColors.length]}"></span>
      <span>${category}: ${formatCurrency(totalsByCategory[category])}</span>
    `;
    chartLegend.appendChild(item);
  });

  const total = values.reduce((sum, value) => sum + value, 0);
  let startAngle = -0.5 * Math.PI;

  ctx.clearRect(0, 0, expenseChart.width, expenseChart.height);

  values.forEach((value, index) => {
    const sliceAngle = (value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(140, 140);
    ctx.arc(140, 140, 120, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = chartColors[index % chartColors.length];
    ctx.fill();
    startAngle += sliceAngle;
  });

  ctx.beginPath();
  ctx.arc(140, 140, 60, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

function initialize() {
  const savedData = loadData();
  budget = savedData.budget;
  expenses = savedData.expenses;
  updateSummary();
  renderExpenses();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch((error) => {
      console.warn('No se pudo registrar el service worker:', error);
    });
  });
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.style.display = 'inline-block';
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) {
    alert('La instalación no está disponible en este momento. Prueba abrir la app en un navegador compatible.');
    return;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    console.log('Instalación aceptada');
  }
  deferredPrompt = null;
  installBtn.style.display = 'none';
});

assistantBtn.addEventListener('click', async () => {
  const prompt = assistantInput.value.trim();
  if (!prompt) {
    assistantResponse.textContent = 'Escribe una pregunta para obtener ayuda.';
    return;
  }

  const isLocal = window.location.protocol === 'file:';
  if (isLocal) {
    assistantResponse.textContent = 'El asistente IA solo funciona en Vercel. Abre tu app en: https://tu-proyecto.vercel.app';
    return;
  }

  assistantResponse.textContent = 'Consultando a la IA...';

  try {
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, expenses, budget })
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Error del servidor.');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'No se pudo consultar la IA.');
    }

    assistantResponse.textContent = data.reply;
  } catch (error) {
    assistantResponse.textContent = error.message || 'No se pudo completar la solicitud.';
  }
});

window.addEventListener('appinstalled', () => {
  installBtn.style.display = 'none';
});

saveBudgetBtn.addEventListener('click', () => {
  const value = parseFloat(budgetInput.value);
  if (!isNaN(value) && value >= 0) {
    budget = value;
    saveData();
    updateSummary();
    budgetInput.value = '';
  }
});

addExpenseBtn.addEventListener('click', () => {
  const description = descriptionInput.value.trim();
  const category = categoryInput.value;
  const amount = parseFloat(amountInput.value);

  if (!description) {
    alert('Ingresa una descripción.');
    return;
  }

  if (isNaN(amount) || amount < 0) {
    alert('Ingresa un monto válido.');
    return;
  }

  expenses.push({ description, category, amount });
  saveData();
  descriptionInput.value = '';
  amountInput.value = '';
  categoryInput.value = 'General';
  renderExpenses();
  updateSummary();
});

clearExpensesBtn.addEventListener('click', () => {
  expenses = [];
  saveData();
  renderExpenses();
  updateSummary();
});

expenseList.addEventListener('click', (event) => {
  if (event.target.tagName === 'BUTTON') {
    const index = parseInt(event.target.dataset.index, 10);
    expenses.splice(index, 1);
    saveData();
    renderExpenses();
    updateSummary();
  }
});

initialize();
