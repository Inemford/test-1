/**
 * NutriTrack - Pure Vanilla JavaScript Calorie & Macro Tracker
 * Persistent local storage, zero external libraries, zero backend.
 */

(function () {
  'use strict';

  // --- STORAGE KEY & DEFAULT STATE ---
  const STORAGE_KEY = 'nutritrack_app_data_v1';

  const DEFAULT_SETTINGS = {
    dailyCalorieGoal: 2000,
    proteinGoal: 140,
    carbsGoal: 210,
    fatGoal: 65,
    waterGoal: 8
  };

  // State in memory
  let appState = {
    settings: { ...DEFAULT_SETTINGS },
    logs: {} // Keyed by 'YYYY-MM-DD'
  };

  // Current active date in YYYY-MM-DD format
  let currentDate = getTodayDateString();

  // --- DATE UTILITIES ---

  function getTodayDateString() {
    const today = new Date();
    return formatDateKey(today);
  }

  function formatDateKey(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function parseDateKey(dateKey) {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function shiftDate(dateKey, dayOffset) {
    const d = parseDateKey(dateKey);
    d.setDate(d.getDate() + dayOffset);
    return formatDateKey(d);
  }

  function getFriendlyDateLabel(dateKey) {
    const todayKey = getTodayDateString();
    const d = parseDateKey(dateKey);
    
    // Relative labels
    if (dateKey === todayKey) {
      return `Today, ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    }

    const yesterdayKey = shiftDate(todayKey, -1);
    if (dateKey === yesterdayKey) {
      return `Yesterday, ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    }

    const tomorrowKey = shiftDate(todayKey, 1);
    if (dateKey === tomorrowKey) {
      return `Tomorrow, ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    }

    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  // --- LOCAL STORAGE PERSISTENCE ---

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        appState.settings = Object.assign({}, DEFAULT_SETTINGS, parsed.settings || {});
        appState.logs = parsed.logs || {};
      }
    } catch (e) {
      console.error('Failed to parse saved state from localStorage:', e);
      appState = {
        settings: { ...DEFAULT_SETTINGS },
        logs: {}
      };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
      showToast('Error saving data to browser storage', 'danger');
    }
  }

  function getDayLog(dateKey) {
    if (!appState.logs[dateKey]) {
      appState.logs[dateKey] = {
        water: 0,
        items: []
      };
    }
    return appState.logs[dateKey];
  }

  // --- DATA MUTATIONS ---

  function addFoodItem(item) {
    const day = getDayLog(currentDate);
    const newItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: item.name.trim(),
      meal: item.meal,
      calories: Math.round(Number(item.calories) || 0),
      protein: parseFloat(item.protein) || 0,
      carbs: parseFloat(item.carbs) || 0,
      fat: parseFloat(item.fat) || 0,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    day.items.push(newItem);
    saveState();
    renderAll();
    showToast(`Added "${newItem.name}" (${newItem.calories} kcal)`, 'success');
  }

  function updateFoodItem(itemId, updatedFields) {
    const day = getDayLog(currentDate);
    const index = day.items.findIndex(it => it.id === itemId);
    if (index !== -1) {
      day.items[index] = {
        ...day.items[index],
        name: updatedFields.name.trim(),
        meal: updatedFields.meal,
        calories: Math.round(Number(updatedFields.calories) || 0),
        protein: parseFloat(updatedFields.protein) || 0,
        carbs: parseFloat(updatedFields.carbs) || 0,
        fat: parseFloat(updatedFields.fat) || 0
      };
      saveState();
      renderAll();
      showToast(`Updated "${day.items[index].name}"`, 'success');
    }
  }

  function deleteFoodItem(itemId) {
    const day = getDayLog(currentDate);
    const item = day.items.find(it => it.id === itemId);
    const name = item ? item.name : 'Item';
    day.items = day.items.filter(it => it.id !== itemId);
    saveState();
    renderAll();
    showToast(`Removed "${name}"`, 'danger');
  }

  function clearDayLog(dateKey) {
    if (confirm(`Are you sure you want to clear all logged food and water for ${getFriendlyDateLabel(dateKey)}?`)) {
      appState.logs[dateKey] = {
        water: 0,
        items: []
      };
      saveState();
      renderAll();
      showToast('Cleared daily entries', 'danger');
    }
  }

  function setWater(glasses) {
    const day = getDayLog(currentDate);
    day.water = Math.max(0, glasses);
    saveState();
    renderWater();
  }

  function changeWater(delta) {
    const day = getDayLog(currentDate);
    setWater((day.water || 0) + delta);
  }

  // --- UI RENDERING ---

  function renderAll() {
    renderDateNav();
    renderDashboardSummary();
    renderWater();
    renderMealSections();
  }

  function renderDateNav() {
    const datePicker = document.getElementById('datePicker');
    const dateLabel = document.getElementById('dateDisplayLabel');
    if (datePicker) datePicker.value = currentDate;
    if (dateLabel) dateLabel.textContent = getFriendlyDateLabel(currentDate);
  }

  function calculateDailyTotals(dateKey) {
    const day = getDayLog(dateKey);
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    day.items.forEach(item => {
      calories += Number(item.calories) || 0;
      protein += Number(item.protein) || 0;
      carbs += Number(item.carbs) || 0;
      fat += Number(item.fat) || 0;
    });

    return {
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10
    };
  }

  function renderDashboardSummary() {
    const totals = calculateDailyTotals(currentDate);
    const calGoal = appState.settings.dailyCalorieGoal || 2000;
    const remaining = calGoal - totals.calories;
    const percent = calGoal > 0 ? Math.round((totals.calories / calGoal) * 100) : 0;

    // Elements
    const consumedEl = document.getElementById('caloriesConsumedDisplay');
    const goalEl = document.getElementById('calorieGoalDisplay');
    const remainingEl = document.getElementById('caloriesRemainingDisplay');
    const remainingLabelEl = document.getElementById('remainingStatLabel');
    const statusBadgeEl = document.getElementById('calorieStatusBadge');
    const progressBar = document.getElementById('calorieProgressBar');
    const progressPercentText = document.getElementById('progressPercentText');
    const budgetDiffText = document.getElementById('budgetDiffText');

    if (consumedEl) consumedEl.textContent = totals.calories;
    if (goalEl) goalEl.textContent = calGoal;

    if (remaining >= 0) {
      if (remainingLabelEl) remainingLabelEl.textContent = 'Remaining';
      if (remainingEl) {
        remainingEl.textContent = remaining;
        remainingEl.className = 'stat-number color-success';
      }
      if (statusBadgeEl) {
        statusBadgeEl.textContent = percent >= 95 ? 'Target Met' : 'On Track';
        statusBadgeEl.className = 'status-badge badge-on-track';
      }
      if (budgetDiffText) budgetDiffText.textContent = `${remaining} kcal left`;
    } else {
      const overage = Math.abs(remaining);
      if (remainingLabelEl) remainingLabelEl.textContent = 'Over Budget';
      if (remainingEl) {
        remainingEl.textContent = `+${overage}`;
        remainingEl.className = 'stat-number color-danger';
      }
      if (statusBadgeEl) {
        statusBadgeEl.textContent = 'Over Target';
        statusBadgeEl.className = 'status-badge badge-over-budget';
      }
      if (budgetDiffText) budgetDiffText.textContent = `${overage} kcal over`;
    }

    // Main Progress Bar
    if (progressBar) {
      const clampedWidth = Math.min(percent, 100);
      progressBar.style.width = clampedWidth + '%';

      if (percent > 100) {
        progressBar.className = 'progress-fill progress-fill-danger';
      } else if (percent > 90) {
        progressBar.className = 'progress-fill progress-fill-warn';
      } else {
        progressBar.className = 'progress-fill progress-fill-normal';
      }
    }

    if (progressPercentText) {
      progressPercentText.textContent = `${percent}% of daily goal`;
    }

    // Macro Meters
    const protGoal = appState.settings.proteinGoal || 140;
    const carbGoal = appState.settings.carbsGoal || 210;
    const fatGoal = appState.settings.fatGoal || 65;

    document.getElementById('proteinConsumed').textContent = totals.protein;
    document.getElementById('proteinGoal').textContent = protGoal;
    document.getElementById('proteinProgressBar').style.width = Math.min((totals.protein / protGoal) * 100, 100) + '%';

    document.getElementById('carbsConsumed').textContent = totals.carbs;
    document.getElementById('carbsGoal').textContent = carbGoal;
    document.getElementById('carbsProgressBar').style.width = Math.min((totals.carbs / carbGoal) * 100, 100) + '%';

    document.getElementById('fatConsumed').textContent = totals.fat;
    document.getElementById('fatGoal').textContent = fatGoal;
    document.getElementById('fatProgressBar').style.width = Math.min((totals.fat / fatGoal) * 100, 100) + '%';
  }

  function renderWater() {
    const day = getDayLog(currentDate);
    const count = day.water || 0;
    const goal = appState.settings.waterGoal || 8;

    document.getElementById('waterGlassesCount').textContent = count;
    document.getElementById('waterGoalGlasses').textContent = goal;

    const container = document.getElementById('waterCupVisuals');
    if (!container) return;
    container.innerHTML = '';

    // Render clickable cup icons up to max(goal, count)
    const totalSlots = Math.max(goal, count);
    for (let i = 1; i <= totalSlots; i++) {
      const cup = document.createElement('div');
      cup.className = 'water-cup-icon' + (i <= count ? ' filled' : '');
      cup.title = `Set to ${i} glass${i > 1 ? 'es' : ''}`;
      cup.innerHTML = `💧`;
      cup.addEventListener('click', () => {
        // If clicking current count, toggle down by 1, otherwise set to i
        if (i === count) {
          setWater(count - 1);
        } else {
          setWater(i);
        }
      });
      container.appendChild(cup);
    }
  }

  function renderMealSections() {
    const day = getDayLog(currentDate);
    const categories = ['breakfast', 'lunch', 'dinner', 'snack'];

    categories.forEach(cat => {
      const listEl = document.getElementById(`${cat}ItemsList`);
      const statsEl = document.getElementById(`${cat}Stats`);
      if (!listEl) return;

      const items = day.items.filter(it => it.meal === cat);
      const catCalories = items.reduce((sum, it) => sum + (Number(it.calories) || 0), 0);
      if (statsEl) {
        statsEl.textContent = `${catCalories} kcal`;
      }

      listEl.innerHTML = '';

      if (items.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'empty-state';
        emptyMsg.textContent = `No items logged for ${cat}`;
        listEl.appendChild(emptyMsg);
        return;
      }

      items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'food-item-row';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'food-item-info';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'food-item-title';
        titleDiv.textContent = item.name;

        const macrosDiv = document.createElement('div');
        macrosDiv.className = 'food-item-macros';

        let macroParts = [];
        if (item.protein > 0) macroParts.push(`<span class="macro-tag-p">P: ${item.protein}g</span>`);
        if (item.carbs > 0) macroParts.push(`<span class="macro-tag-c">C: ${item.carbs}g</span>`);
        if (item.fat > 0) macroParts.push(`<span class="macro-tag-f">F: ${item.fat}g</span>`);
        if (item.timestamp) macroParts.push(`<span>${item.timestamp}</span>`);

        macrosDiv.innerHTML = macroParts.join(' • ');

        infoDiv.appendChild(titleDiv);
        infoDiv.appendChild(macrosDiv);

        const rightDiv = document.createElement('div');
        rightDiv.className = 'food-item-right';

        const calsSpan = document.createElement('span');
        calsSpan.className = 'food-item-cals';
        calsSpan.textContent = `${item.calories} kcal`;

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'item-action-btn';
        editBtn.title = 'Edit item';
        editBtn.innerHTML = '✏️';
        editBtn.addEventListener('click', () => {
          openEditFoodModal(item);
        });

        // Delete button
        const delBtn = document.createElement('button');
        delBtn.className = 'item-action-btn';
        delBtn.title = 'Delete item';
        delBtn.innerHTML = '🗑️';
        delBtn.addEventListener('click', () => {
          deleteFoodItem(item.id);
        });

        rightDiv.appendChild(calsSpan);
        rightDiv.appendChild(editBtn);
        rightDiv.appendChild(delBtn);

        row.appendChild(infoDiv);
        row.appendChild(rightDiv);
        listEl.appendChild(row);
      });
    });
  }

  // --- MODALS HANDLING ---

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  function openAddFoodModal(defaultMeal = 'breakfast') {
    document.getElementById('foodModalTitle').textContent = 'Add Food Entry';
    document.getElementById('editFoodItemId').value = '';
    document.getElementById('foodNameInput').value = '';
    document.getElementById('foodMealSelect').value = defaultMeal;
    document.getElementById('foodCaloriesInput').value = '';
    document.getElementById('foodProteinInput').value = '';
    document.getElementById('foodCarbsInput').value = '';
    document.getElementById('foodFatInput').value = '';
    openModal('foodModal');
    setTimeout(() => {
      document.getElementById('foodNameInput').focus();
    }, 50);
  }

  function openEditFoodModal(item) {
    document.getElementById('foodModalTitle').textContent = 'Edit Food Entry';
    document.getElementById('editFoodItemId').value = item.id;
    document.getElementById('foodNameInput').value = item.name;
    document.getElementById('foodMealSelect').value = item.meal;
    document.getElementById('foodCaloriesInput').value = item.calories;
    document.getElementById('foodProteinInput').value = item.protein || '';
    document.getElementById('foodCarbsInput').value = item.carbs || '';
    document.getElementById('foodFatInput').value = item.fat || '';
    openModal('foodModal');
    setTimeout(() => {
      document.getElementById('foodNameInput').focus();
    }, 50);
  }

  function openSettingsModal() {
    document.getElementById('settingCalorieGoal').value = appState.settings.dailyCalorieGoal;
    document.getElementById('settingProteinGoal').value = appState.settings.proteinGoal;
    document.getElementById('settingCarbsGoal').value = appState.settings.carbsGoal;
    document.getElementById('settingFatGoal').value = appState.settings.fatGoal;
    document.getElementById('settingWaterGoal').value = appState.settings.waterGoal;
    openModal('settingsModal');
  }

  function openHistoryModal() {
    renderHistoryChart();
    openModal('historyModal');
  }

  function renderHistoryChart() {
    const container = document.getElementById('historyBarsContainer');
    if (!container) return;
    container.innerHTML = '';

    const calGoal = appState.settings.dailyCalorieGoal || 2000;
    
    // Generate the last 7 days ending at currentDate
    const days = [];
    for (let i = 6; i >= 0; i--) {
      days.push(shiftDate(currentDate, -i));
    }

    // Determine max scale
    let maxVal = calGoal;
    const totals = days.map(dKey => {
      const tot = calculateDailyTotals(dKey);
      if (tot.calories > maxVal) maxVal = tot.calories;
      return { dateKey: dKey, cals: tot.calories };
    });

    // Make chart slightly taller than max
    const chartMax = Math.max(maxVal * 1.15, calGoal * 1.15, 1000);

    totals.forEach(item => {
      const d = parseDateKey(item.dateKey);
      const isToday = item.dateKey === getTodayDateString();
      const isCurrentActive = item.dateKey === currentDate;
      const isOver = item.cals > calGoal;

      const barGroup = document.createElement('div');
      barGroup.className = 'chart-bar-group';
      barGroup.title = `${item.dateKey}: ${item.cals} kcal (Click to view)`;
      barGroup.style.cursor = 'pointer';

      // Click bar to jump to that day
      barGroup.addEventListener('click', () => {
        currentDate = item.dateKey;
        closeModal('historyModal');
        renderAll();
      });

      const barWrapper = document.createElement('div');
      barWrapper.className = 'chart-bar-wrapper';

      const bar = document.createElement('div');
      bar.className = 'chart-bar' + (isOver ? ' bar-over' : '') + (isCurrentActive ? ' bar-today' : '');
      const heightPercent = Math.max((item.cals / chartMax) * 100, 3);
      bar.style.height = `${heightPercent}%`;

      const valLabel = document.createElement('span');
      valLabel.className = 'chart-bar-val';
      valLabel.textContent = item.cals > 0 ? item.cals : '0';
      bar.appendChild(valLabel);

      barWrapper.appendChild(bar);

      const dayLabel = document.createElement('div');
      dayLabel.className = 'chart-bar-label';
      dayLabel.innerHTML = `${d.toLocaleDateString(undefined, { weekday: 'short' })}<br>${d.getDate()}`;
      if (isCurrentActive) {
        dayLabel.style.fontWeight = 'bold';
        dayLabel.style.color = '#2563eb';
      }

      barGroup.appendChild(barWrapper);
      barGroup.appendChild(dayLabel);
      container.appendChild(barGroup);
    });
  }

  // --- TOAST FEEDBACK ---

  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'danger' ? 'toast-danger' : 'toast-success'}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease-out';
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 200);
    }, 2800);
  }

  // --- BACKUP & RESTORE DATA ---

  function exportData() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nutritrack_backup_${getTodayDateString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Backup file exported', 'success');
  }

  function importData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed && (parsed.logs || parsed.settings)) {
          appState.settings = Object.assign({}, DEFAULT_SETTINGS, parsed.settings || {});
          appState.logs = parsed.logs || {};
          saveState();
          renderAll();
          showToast('Data restored successfully!', 'success');
        } else {
          showToast('Invalid backup file format', 'danger');
        }
      } catch (err) {
        console.error('Import error:', err);
        showToast('Error parsing JSON backup file', 'danger');
      }
    };
    reader.readAsText(file);
  }

  function resetAllData() {
    if (confirm('WARNING: This will permanently delete all your logged food entries, history, and goals. Are you sure?')) {
      localStorage.removeItem(STORAGE_KEY);
      appState = {
        settings: { ...DEFAULT_SETTINGS },
        logs: {}
      };
      currentDate = getTodayDateString();
      saveState();
      renderAll();
      showToast('All data has been reset', 'danger');
    }
  }

  // --- EVENT LISTENERS INITIALIZATION ---

  function setupEventListeners() {
    // Date Navigation
    document.getElementById('prevDayBtn').addEventListener('click', () => {
      currentDate = shiftDate(currentDate, -1);
      renderAll();
    });

    document.getElementById('nextDayBtn').addEventListener('click', () => {
      currentDate = shiftDate(currentDate, 1);
      renderAll();
    });

    document.getElementById('datePicker').addEventListener('change', (e) => {
      if (e.target.value) {
        currentDate = e.target.value;
        renderAll();
      }
    });

    // Clear Day button
    document.getElementById('clearDayBtn').addEventListener('click', () => {
      clearDayLog(currentDate);
    });

    // Open Modals
    document.getElementById('openAddFoodModalBtn').addEventListener('click', () => {
      openAddFoodModal('breakfast');
    });

    document.getElementById('openQuickCaloriesModalBtn').addEventListener('click', () => {
      document.getElementById('quickCaloriesAmount').value = '';
      openModal('quickCalModal');
      setTimeout(() => {
        document.getElementById('quickCaloriesAmount').focus();
      }, 50);
    });

    document.getElementById('settingsBtn').addEventListener('click', openSettingsModal);
    document.getElementById('historyBtn').addEventListener('click', openHistoryModal);

    // Add to Meal buttons inside cards
    document.querySelectorAll('.add-to-meal-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const meal = e.currentTarget.getAttribute('data-meal');
        openAddFoodModal(meal);
      });
    });

    // Close Modal buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.currentTarget.getAttribute('data-close-modal');
        closeModal(modalId);
      });
    });

    // Close on clicking backdrop
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeModal(overlay.id);
        }
      });
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
          closeModal(modal.id);
        });
      }
    });

    // Water Tracker Buttons
    document.getElementById('addWaterBtn').addEventListener('click', () => changeWater(1));
    document.getElementById('minusWaterBtn').addEventListener('click', () => changeWater(-1));

    // Preset Chips
    document.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        const cals = btn.getAttribute('data-cals');
        const protein = btn.getAttribute('data-protein') || 0;
        const carbs = btn.getAttribute('data-carbs') || 0;
        const fat = btn.getAttribute('data-fat') || 0;

        addFoodItem({
          name: name,
          meal: 'snack',
          calories: cals,
          protein: protein,
          carbs: carbs,
          fat: fat
        });
      });
    });

    // Food Form Submit
    document.getElementById('foodEntryForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const editId = document.getElementById('editFoodItemId').value;
      const itemData = {
        name: document.getElementById('foodNameInput').value,
        meal: document.getElementById('foodMealSelect').value,
        calories: document.getElementById('foodCaloriesInput').value,
        protein: document.getElementById('foodProteinInput').value,
        carbs: document.getElementById('foodCarbsInput').value,
        fat: document.getElementById('foodFatInput').value
      };

      if (editId) {
        updateFoodItem(editId, itemData);
      } else {
        addFoodItem(itemData);
      }
      closeModal('foodModal');
    });

    // Quick Calories Form Submit
    document.getElementById('quickCalForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const cals = document.getElementById('quickCaloriesAmount').value;
      const meal = document.getElementById('quickMealSelect').value;

      if (cals && Number(cals) > 0) {
        addFoodItem({
          name: `Quick Calories (${cals} kcal)`,
          meal: meal,
          calories: cals,
          protein: 0,
          carbs: 0,
          fat: 0
        });
        closeModal('quickCalModal');
      }
    });

    // Settings Form Submit
    document.getElementById('settingsForm').addEventListener('submit', (e) => {
      e.preventDefault();
      appState.settings.dailyCalorieGoal = parseInt(document.getElementById('settingCalorieGoal').value, 10) || 2000;
      appState.settings.proteinGoal = parseInt(document.getElementById('settingProteinGoal').value, 10) || 140;
      appState.settings.carbsGoal = parseInt(document.getElementById('settingCarbsGoal').value, 10) || 210;
      appState.settings.fatGoal = parseInt(document.getElementById('settingFatGoal').value, 10) || 65;
      appState.settings.waterGoal = parseInt(document.getElementById('settingWaterGoal').value, 10) || 8;

      saveState();
      renderAll();
      closeModal('settingsModal');
      showToast('Goals updated successfully!', 'success');
    });

    // Footer actions
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    document.getElementById('importDataFileInput').addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        importData(e.target.files[0]);
        e.target.value = ''; // Reset input
      }
    });
    document.getElementById('resetAllDataBtn').addEventListener('click', resetAllData);
  }

  // --- INITIALIZATION ---
  function init() {
    loadState();
    setupEventListeners();
    renderAll();
  }

  // Kick off when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

