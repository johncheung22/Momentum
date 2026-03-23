// =========================================================
// DATA LAYER
// =========================================================
let useLocalStorage = true;
try { localStorage.setItem('_test', '1'); localStorage.removeItem('_test'); } catch (e) { useLocalStorage = false; }
if (!useLocalStorage) {
  const b = document.createElement('div'); b.className = 'warning-banner'; b.textContent = '⚠ localStorage unavailable — data will not persist.';
  document.body.insertBefore(b, document.body.firstChild);
}
const memStore = {};
function store(key, val) {
  if (arguments.length === 1) {
    if (useLocalStorage) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
    return memStore[key] || null;
  }
  if (useLocalStorage) localStorage.setItem(key, JSON.stringify(val));
  else memStore[key] = val;
}

let goals = store('momentum_goals') || [];
let tasks = store('momentum_tasks') || [];
let ratings = store('momentum_ratings') || [];
let pomoLog = store('momentum_pomodoro_log') || [];
let settings = store('momentum_settings') || { theme: 'dark', userName: 'Friend' };

function saveAll() { store('momentum_goals', goals); store('momentum_tasks', tasks); store('momentum_ratings', ratings); store('momentum_pomodoro_log', pomoLog); store('momentum_settings', settings); }

// =========================================================
// UTILITIES
// =========================================================
const $ = id => document.getElementById(id);
function todayStr() { return new Date().toISOString().split('T')[0]; }
function fmtDate(d) { const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function daysBetween(a, b) { return Math.ceil((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000); }

function showToast(message, type = 'info') {
  const c = $('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = message;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3100);
}

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => { s.classList.remove('active'); });
  document.querySelectorAll('#main-nav a').forEach(a => a.classList.toggle('active', a.dataset.section === id));
  const sec = $('section-' + id);
  if (sec) { sec.classList.add('active'); }
  if (id === 'home') renderHome();
  else if (id === 'goals') renderGoals();
  else if (id === 'tasks') renderTasks();
  else if (id === 'pomodoro') renderPomodoro();
  else if (id === 'stats') renderStats();
}

// =========================================================
// THEME
// =========================================================
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  $('theme-toggle').textContent = t === 'dark' ? '🌙' : '☀️';
  settings.theme = t; saveAll();
}
$('theme-toggle').addEventListener('click', () => applyTheme(settings.theme === 'dark' ? 'light' : 'dark'));

// =========================================================
// NAV
// =========================================================
document.querySelectorAll('#main-nav a').forEach(a => a.addEventListener('click', e => { e.preventDefault(); showSection(a.dataset.section); }));

// =========================================================
// HOME
// =========================================================
function renderHome() {
  const h = new Date().getHours();
  const greet = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  $('greeting').textContent = `Good ${greet}, ${settings.userName} 👋`;
  $('today-date').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const today = todayStr();
  const activeGoals = goals.filter(g => !g.completed).length;
  const todayTasks = tasks.filter(t => t.date === today && !t.completed).length;
  const todaySessions = pomoLog.filter(l => l.date === today && l.type === 'focus').length;
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekRatings = ratings.filter(r => new Date(r.completedAt) >= weekAgo);
  const avgRating = weekRatings.length ? (weekRatings.reduce((s, r) => s + r.rating, 0) / weekRatings.length).toFixed(1) : '—';

  $('home-stats').innerHTML = [
    createStatCard('Active Goals', activeGoals, 'In progress', 'var(--accent)'),
    createStatCard('Due Today', todayTasks, 'Tasks remaining', 'var(--info)'),
    createStatCard('Pomodoros', todaySessions, 'Sessions today', 'var(--danger)'),
    createStatCard('Avg Rating', avgRating, 'This week', 'var(--success)')
  ].join('');

  // Populate goal dropdown for quick add
  const goalSel = $('qa-goal');
  goalSel.innerHTML = '<option value="">None</option>' + goals.filter(g => !g.completed).map(g => `<option value="${g.id}">${g.title}</option>`).join('');
}

function createStatCard(title, value, subtitle, color) {
  return `<div class="card stat-card"><div class="stat-title">${title}</div><div class="stat-value" style="color:${color}">${value}</div><div class="stat-sub">${subtitle}</div></div>`;
}

// Quick add
$('quick-add-btn').addEventListener('click', () => { $('quick-add-form').style.display = $('quick-add-form').style.display === 'none' ? 'block' : 'none'; $('qa-date').value = todayStr(); });
$('qa-cancel').addEventListener('click', () => { $('quick-add-form').style.display = 'none'; });
$('qa-submit').addEventListener('click', () => {
  const title = $('qa-title').value.trim();
  const date = $('qa-date').value;
  let valid = true;
  if (!title) { $('qa-title').classList.add('error'); $('qa-title-err').style.display = 'block'; valid = false; } else { $('qa-title').classList.remove('error'); $('qa-title-err').style.display = 'none'; }
  if (!date || date < todayStr()) { $('qa-date').classList.add('error'); $('qa-date-err').style.display = 'block'; valid = false; } else { $('qa-date').classList.remove('error'); $('qa-date-err').style.display = 'none'; }
  if (!valid) return;
  tasks.push({ id: Date.now(), title, date, priority: $('qa-priority').value, goalId: $('qa-goal').value || null, completed: false, createdAt: new Date().toISOString() });
  saveAll(); $('qa-title').value = ''; $('quick-add-form').style.display = 'none';
  showToast('Task added! 🎯', 'success'); renderHome();
});

// =========================================================
// GOALS
// =========================================================
let calYear, calMonth;
function initCalendar() { const n = new Date(); calYear = n.getFullYear(); calMonth = n.getMonth(); }

function renderGoals() {
  // Goal list
  const list = $('goals-list');
  if (!goals.length) { list.innerHTML = '<div class="empty-state"><p>No goals yet. Set your first goal →</p></div>'; }
  else { list.innerHTML = goals.map(g => createGoalCard(g)).join(''); }
  // Calendar
  renderCalendar();
  // Populate task form goal dropdowns
  populateGoalDropdowns();
}

function populateGoalDropdowns() {
  const active = goals.filter(g => !g.completed);
  ['task-goal', 'qa-goal'].forEach(id => {
    const el = $(id); if (!el) return;
    el.innerHTML = '<option value="">None</option>' + active.map(g => `<option value="${g.id}">${g.title}</option>`).join('');
  });
}

function createGoalCard(g) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const deadline = new Date(g.deadline + 'T00:00:00');
  const created = new Date(g.createdAt);
  const totalDays = Math.max(1, (deadline - created) / 86400000);
  const elapsed = (today - created) / 86400000;
  const pct = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));
  const daysLeft = daysBetween(todayStr(), g.deadline);
  const passed = daysLeft <= 0 && !g.completed;

  let color = pct <= 50 ? 'var(--success)' : pct <= 80 ? 'var(--accent)' : 'var(--danger)';
  if (g.completed) color = 'var(--success)';

  const circumference = 2 * Math.PI * 24;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;

  let timeStr = '';
  if (!passed && !g.completed && daysLeft > 0) {
    const yrs = Math.floor(daysLeft / 365); const mos = Math.floor((daysLeft % 365) / 30); const wks = Math.floor((daysLeft % 30) / 7); const ds = daysLeft % 7;
    if (yrs > 0) timeStr += `<span>${yrs}y</span>`;
    if (mos > 0) timeStr += `<span>${mos}mo</span>`;
    if (wks > 0) timeStr += `<span>${wks}w</span>`;
    if (ds > 0) timeStr += `<span>${ds}d</span>`;
  }

  const catClass = g.category.toLowerCase();
  return `<div class="card goal-card" data-id="${g.id}">
    <div class="goal-header">
      <div class="goal-info">
        <h3>${esc(g.title)}</h3>
        <div class="goal-meta">
          <span class="badge badge-${catClass}">${g.category}</span>
          ${g.completed ? '<span class="badge badge-complete">✓ Complete</span>' : passed ? '<span class="badge badge-passed">Deadline Passed</span>' : `<span>📅 ${fmtDate(g.deadline)}</span>`}
        </div>
        ${!passed && !g.completed && timeStr ? `<div class="time-remaining" style="margin-top:8px;font-size:.82rem;color:var(--text-secondary)">${timeStr} remaining</div>` : ''}
      </div>
      <svg class="goal-progress-ring" viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="none" stroke="var(--border)" stroke-width="5"/><circle cx="32" cy="32" r="24" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" transform="rotate(-90 32 32)"/><text x="32" y="36" text-anchor="middle" fill="var(--text-primary)" font-size="12" font-family="DM Mono,monospace">${g.completed ? '✓' : Math.round(pct) + '%'}</text></svg>
    </div>
    ${g.description ? `<button class="details-toggle" onclick="toggleDesc(${g.id})">Details ▼</button><div class="goal-desc" id="desc-${g.id}">${esc(g.description)}</div>` : ''}
    <div class="goal-actions">
      ${!g.completed ? `<button class="btn btn-success btn-sm" onclick="completeGoal(${g.id})">✓ Complete</button>` : ''}
      <button class="btn btn-danger btn-sm" onclick="deleteGoal(${g.id})">Delete</button>
    </div>
  </div>`;
}

function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function toggleDesc(id) {
  const el = $('desc-' + id);
  if (!el) return;
  const show = !el.classList.contains('show');
  el.classList.toggle('show', show);
  el.previousElementSibling.textContent = show ? 'Details ▲' : 'Details ▼';
}

function completeGoal(id) { const g = goals.find(x => x.id === id); if (g) { g.completed = true; g.completedAt = new Date().toISOString(); saveAll(); renderGoals(); showToast('Goal completed! 🎉', 'success'); } }
function deleteGoal(id) { goals = goals.filter(x => x.id !== id); saveAll(); renderGoals(); showToast('Goal deleted', 'info'); }

// Goal form submit
$('goal-submit').addEventListener('click', () => {
  const title = $('goal-title').value.trim();
  const deadline = $('goal-deadline').value;
  let valid = true;
  if (!title) { $('goal-title').classList.add('error'); $('goal-title-err').style.display = 'block'; valid = false; } else { $('goal-title').classList.remove('error'); $('goal-title-err').style.display = 'none'; }
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); const minDate = tomorrow.toISOString().split('T')[0];
  if (!deadline || deadline < minDate) { $('goal-deadline').classList.add('error'); $('goal-deadline-err').style.display = 'block'; valid = false; } else { $('goal-deadline').classList.remove('error'); $('goal-deadline-err').style.display = 'none'; }
  if (!valid) return;
  goals.push({ id: Date.now(), title, description: $('goal-desc').value.trim(), deadline, category: $('goal-category').value, completed: false, createdAt: new Date().toISOString() });
  saveAll(); $('goal-title').value = ''; $('goal-desc').value = ''; $('goal-deadline').value = '';
  showToast('Goal created! 🎯', 'success'); renderGoals();
});

// =========================================================
// CALENDAR
// =========================================================
function renderCalendar() {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  $('cal-month-label').textContent = `${monthNames[calMonth]} ${calYear}`;

  const first = new Date(calYear, calMonth, 1);
  const last = new Date(calYear, calMonth + 1, 0);
  const startDay = first.getDay();
  const daysInMonth = last.getDate();
  const prevLast = new Date(calYear, calMonth, 0).getDate();

  const today = todayStr();
  const catColors = { Health: '#22c55e', Career: '#3b82f6', Learning: '#a855f7', Personal: '#f59e0b', Financial: '#14b8a6' };

  let html = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<div class="calendar-day-name">${d}</div>`).join('');

  // Previous month padding
  for (let i = startDay - 1; i >= 0; i--) { html += `<div class="calendar-day other-month">${prevLast - i}</div>`; }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dateStr === today;
    const dayGoals = goals.filter(g => g.deadline === dateStr);
    const dayTasks = tasks.filter(t => t.date === dateStr);
    let dots = '';
    if (dayGoals.length || dayTasks.length) {
      const colors = new Set();
      dayGoals.forEach(g => colors.add(catColors[g.category] || 'var(--accent)'));
      if (dayTasks.length) colors.add('var(--text-secondary)');
      dots = `<div class="calendar-dots">${[...colors].slice(0, 3).map(c => `<div class="calendar-dot" style="background:${c}"></div>`).join('')}</div>`;
    }
    html += `<div class="calendar-day${isToday ? ' today' : ''}" onclick="showDayPanel('${dateStr}')">${d}${dots}</div>`;
  }

  // Next month padding
  const totalCells = startDay + daysInMonth;
  const remaining = (7 - totalCells % 7) % 7;
  for (let i = 1; i <= remaining; i++) { html += `<div class="calendar-day other-month">${i}</div>`; }

  $('calendar-grid').innerHTML = html;
}

$('cal-prev').addEventListener('click', () => { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); });
$('cal-next').addEventListener('click', () => { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar(); });

function showDayPanel(dateStr) {
  const panel = $('day-panel');
  const dayGoals = goals.filter(g => g.deadline === dateStr);
  const dayTasks = tasks.filter(t => t.date === dateStr);
  if (!dayGoals.length && !dayTasks.length) { panel.classList.remove('show'); return; }
  $('day-panel-title').textContent = fmtDate(dateStr);
  let items = '';
  dayGoals.forEach(g => { items += `<div class="day-panel-item">🎯 <span class="badge badge-${g.category.toLowerCase()}">${g.category}</span> ${esc(g.title)}</div>`; });
  dayTasks.forEach(t => { items += `<div class="day-panel-item">${t.completed ? '✅' : '☐'} ${esc(t.title)} <span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span></div>`; });
  $('day-panel-items').innerHTML = items;
  panel.classList.add('show');
}

// =========================================================
// TASKS
// =========================================================
function renderTasks() {
  populateGoalDropdowns();
  const today = todayStr();
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
  const weekStr = weekEnd.toISOString().split('T')[0];

  const groups = { today: [], tomorrow: [], week: [], later: [] };
  const completed = [];

  tasks.forEach(t => {
    if (t.completed) { completed.push(t); return; }
    if (t.date === today) groups.today.push(t);
    else if (t.date === tomorrowStr) groups.tomorrow.push(t);
    else if (t.date <= weekStr) groups.week.push(t);
    else groups.later.push(t);
  });

  let html = '';
  if (groups.today.length) { html += `<div class="task-group"><h3>Today</h3>${groups.today.map(t => createTaskItem(t)).join('')}</div>`; }
  else { html += `<div class="task-group"><h3>Today</h3><div class="empty-state" style="padding:16px"><p>You're all clear today! 🎉</p></div></div>`; }
  if (groups.tomorrow.length) html += `<div class="task-group"><h3>Tomorrow</h3>${groups.tomorrow.map(t => createTaskItem(t)).join('')}</div>`;
  if (groups.week.length) html += `<div class="task-group"><h3>This Week</h3>${groups.week.map(t => createTaskItem(t)).join('')}</div>`;
  if (groups.later.length) html += `<div class="task-group"><h3>Later</h3>${groups.later.map(t => createTaskItem(t)).join('')}</div>`;
  if (completed.length) html += `<div class="task-group"><h3>Completed</h3>${completed.map(t => createTaskItem(t)).join('')}</div>`;

  $('tasks-list').innerHTML = html;
}

function createTaskItem(t) {
  const past = !t.completed && t.date < todayStr();
  const goal = t.goalId ? goals.find(g => g.id == t.goalId) : null;
  return `<div class="task-item${t.completed ? ' completed' : ''}">
    <span class="task-check">${t.completed ? '✅' : '☐'}</span>
    <span class="task-title">${esc(t.title)}${past ? ' <span class="badge badge-passed">Past Due</span>' : ''}</span>
    ${goal ? `<span class="task-linked">🔗 ${esc(goal.title)}</span>` : ''}
    <span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span>
    <span class="task-date">${fmtDate(t.date)}</span>
    ${!t.completed ? `<button class="btn btn-success btn-sm" onclick="openRatingModal(${t.id})">Done</button>` : ''}
  </div>`;
}

// Task form
$('task-submit').addEventListener('click', () => {
  const title = $('task-title').value.trim();
  const date = $('task-date').value;
  let valid = true;
  if (!title) { $('task-title').classList.add('error'); $('task-title-err').style.display = 'block'; valid = false; } else { $('task-title').classList.remove('error'); $('task-title-err').style.display = 'none'; }
  if (!date || date < todayStr()) { $('task-date').classList.add('error'); $('task-date-err').style.display = 'block'; valid = false; } else { $('task-date').classList.remove('error'); $('task-date-err').style.display = 'none'; }
  if (!valid) return;
  tasks.push({ id: Date.now(), title, date, priority: $('task-priority').value, goalId: $('task-goal').value || null, completed: false, createdAt: new Date().toISOString() });
  saveAll(); $('task-title').value = ''; $('task-date').value = '';
  showToast('Task added! ✅', 'success'); renderTasks();
});

// =========================================================
// RATING MODAL
// =========================================================
let ratingTaskId = null, selectedRating = null;

function openRatingModal(taskId) {
  ratingTaskId = taskId; selectedRating = null;
  const t = tasks.find(x => x.id === taskId);
  $('modal-task-name').textContent = `"${t.title}"`;
  $('modal-title').textContent = `How well did you do on:`;
  let btns = '';
  for (let i = 1; i <= 10; i++) btns += `<button class="rating-btn" data-val="${i}" onclick="selectRating(${i})">${i}</button>`;
  $('rating-grid').innerHTML = btns;
  $('modal-submit').disabled = true;
  $('rating-modal').classList.add('show');
}

function selectRating(v) {
  selectedRating = v;
  document.querySelectorAll('.rating-btn').forEach(b => b.classList.toggle('selected', parseInt(b.dataset.val) === v));
  $('modal-submit').disabled = false;
}

$('modal-submit').addEventListener('click', () => {
  if (!selectedRating) return;
  const t = tasks.find(x => x.id === ratingTaskId);
  if (t) { t.completed = true; t.completedAt = new Date().toISOString(); }
  ratings.push({ taskTitle: t.title, rating: selectedRating, completedAt: new Date().toISOString(), date: todayStr() });
  saveAll();
  $('rating-modal').classList.remove('show');
  showToast('Logged! Keep it up 🔥', 'success');
  renderTasks(); renderHome();
});
$('modal-cancel').addEventListener('click', () => { $('rating-modal').classList.remove('show'); });

// =========================================================
// POMODORO
// =========================================================
let pomoState = {
  running: false, paused: false, seconds: 0, total: 0, interval: null, session: 1, mode: 'focus',
  focusLen: 25, breakLen: 5, longBreakLen: 15, longBreakEvery: 4
};

function renderPomodoro() {
  const todayFocus = pomoLog.filter(l => l.date === todayStr() && l.type === 'focus');
  const totalMin = todayFocus.reduce((s, l) => s + l.duration, 0);
  $('total-focus').textContent = `Total focus today: ${totalMin} min`;
  let logHtml = '';
  if (!todayFocus.length && !pomoLog.filter(l => l.date === todayStr()).length) logHtml = '<p style="color:var(--text-secondary);font-size:.85rem">No sessions yet today.</p>';
  else {
    pomoLog.filter(l => l.date === todayStr()).reverse().forEach(l => {
      logHtml += `<div class="session-entry"><span>${l.type === 'focus' ? '🍅' : '☕'} ${l.type.charAt(0).toUpperCase() + l.type.slice(1)} — ${l.duration} min</span><span class="mono" style="color:var(--text-secondary)">${l.time}</span></div>`;
    });
  }
  $('session-log-list').innerHTML = logHtml;
}

$('pomo-start').addEventListener('click', () => {
  pomoState.focusLen = Math.min(120, Math.max(1, parseInt($('pomo-focus').value) || 25));
  pomoState.breakLen = Math.min(60, Math.max(1, parseInt($('pomo-break').value) || 5));
  pomoState.longBreakLen = Math.min(60, Math.max(1, parseInt($('pomo-long-break').value) || 15));
  pomoState.longBreakEvery = Math.min(10, Math.max(2, parseInt($('pomo-interval').value) || 4));
  pomoState.session = 1; pomoState.mode = 'focus';
  startTimer(pomoState.focusLen * 60);
  $('pomo-config').style.display = 'none';
  $('pomo-timer').style.display = 'block';
});

function startTimer(totalSec) {
  pomoState.seconds = totalSec; pomoState.total = totalSec; pomoState.running = true; pomoState.paused = false;
  updateTimerUI();
  const isFocus = pomoState.mode === 'focus';
  $('timer-label').textContent = isFocus ? `Focus Session #${pomoState.session}` : 'Break Time ☕';
  $('timer-container').classList.toggle('timer-mode-break', !isFocus);
  $('timer-pause').textContent = '⏸ Pause';
  if (pomoState.interval) clearInterval(pomoState.interval);
  pomoState.interval = setInterval(() => {
    if (pomoState.paused) return;
    pomoState.seconds--;
    updateTimerUI();
    if (pomoState.seconds <= 0) { clearInterval(pomoState.interval); onTimerEnd(); }
  }, 1000);
}

function updateTimerUI() {
  const m = Math.floor(pomoState.seconds / 60); const s = pomoState.seconds % 60;
  const display = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  $('timer-display').textContent = display;
  document.title = `${display} — Momentum`;
  // Update ring
  const circumference = 2 * Math.PI * 120;
  const pct = 1 - (pomoState.seconds / pomoState.total);
  $('timer-ring').style.strokeDashoffset = circumference * (1 - pct);
  // Mini timer in header
  const mini = $('mini-timer');
  const activeSection = document.querySelector('.section.active');
  if (activeSection && activeSection.id !== 'section-pomodoro' && pomoState.running) {
    mini.style.display = 'inline-block'; mini.textContent = display;
  } else { mini.style.display = 'none'; }
}

function onTimerEnd() {
  const dur = Math.round(pomoState.total / 60);
  pomoLog.push({ date: todayStr(), type: pomoState.mode, duration: dur, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) });
  saveAll();
  showToast(pomoState.mode === 'focus' ? 'Focus session complete! Time for a break.' : 'Break over! Let\'s focus.', 'success');

  if (pomoState.mode === 'focus') {
    if (pomoState.session % pomoState.longBreakEvery === 0) { pomoState.mode = 'break'; startTimer(pomoState.longBreakLen * 60); }
    else { pomoState.mode = 'break'; startTimer(pomoState.breakLen * 60); }
  } else {
    pomoState.mode = 'focus'; pomoState.session++; startTimer(pomoState.focusLen * 60);
  }
  renderPomodoro();
}

$('timer-pause').addEventListener('click', () => {
  if (!pomoState.running) return;
  pomoState.paused = !pomoState.paused;
  $('timer-pause').textContent = pomoState.paused ? '▶ Resume' : '⏸ Pause';
});

$('timer-reset').addEventListener('click', () => {
  clearInterval(pomoState.interval); pomoState.running = false; pomoState.paused = false;
  $('pomo-config').style.display = 'block'; $('pomo-timer').style.display = 'none';
  $('mini-timer').style.display = 'none'; document.title = 'Momentum — Productivity Dashboard';
});

$('timer-skip').addEventListener('click', () => {
  if (pomoState.running) { clearInterval(pomoState.interval); onTimerEnd(); }
});

// =========================================================
// STATS
// =========================================================
function renderStats() {
  // Stat cards
  const totalCompleted = tasks.filter(t => t.completed).length;
  const avgR = ratings.length ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1) : '—';
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekFocus = pomoLog.filter(l => new Date(l.date + 'T00:00:00') >= weekAgo && l.type === 'focus').reduce((s, l) => s + l.duration, 0);
  const completedGoals = goals.filter(g => g.completed).length;
  const goalRate = goals.length ? Math.round(completedGoals / goals.length * 100) + '%' : '—';

  // Best rated task
  const titleRatings = {};
  ratings.forEach(r => { if (!titleRatings[r.taskTitle]) titleRatings[r.taskTitle] = []; titleRatings[r.taskTitle].push(r.rating); });
  let bestTask = '—', bestAvg = 0;
  Object.entries(titleRatings).forEach(([t, rs]) => { const a = rs.reduce((s, v) => s + v, 0) / rs.length; if (a > bestAvg) { bestAvg = a; bestTask = t; } });

  // Most completed task type
  const titleCounts = {}; tasks.filter(t => t.completed).forEach(t => { titleCounts[t.title] = (titleCounts[t.title] || 0) + 1; });
  let mostTask = '—', mostCount = 0;
  Object.entries(titleCounts).forEach(([t, c]) => { if (c > mostCount) { mostCount = c; mostTask = t; } });

  $('stats-cards').innerHTML = [
    createStatCard('Tasks Completed', totalCompleted, 'All time', 'var(--success)'),
    createStatCard('Avg Rating', avgR, 'All tasks', 'var(--accent)'),
    createStatCard('Focus This Week', weekFocus + ' min', 'Pomodoro total', 'var(--danger)'),
    createStatCard('Goal Rate', goalRate, `${completedGoals}/${goals.length} goals`, 'var(--info)'),
    createStatCard('Best Rated', bestAvg ? bestAvg.toFixed(1) : '—', bestTask.length > 20 ? bestTask.slice(0, 20) + '…' : bestTask, 'var(--accent)'),
    createStatCard('Most Done', mostCount || '—', mostTask.length > 20 ? mostTask.slice(0, 20) + '…' : mostTask, 'var(--success)')
  ].join('');

  // Rating table
  const tbody = $('rating-tbody');
  tbody.innerHTML = ratings.slice().reverse().map(r => `<tr><td>${esc(r.taskTitle)}</td><td><span style="color:var(--accent);font-weight:600">${r.rating}/10</span></td><td class="mono">${fmtDate(r.date)}</td></tr>`).join('');
  if (!ratings.length) tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--text-secondary)">No ratings yet</td></tr>';

  // Charts
  const chartsContainer = $('stats-charts');
  chartsContainer.innerHTML = '';
  Object.entries(titleRatings).forEach(([title, rs]) => {
    if (rs.length < 5) return;
    const points = ratings.filter(r => r.taskTitle === title).map(r => ({ date: r.date, rating: r.rating }));
    const id = 'chart-' + title.replace(/[^a-zA-Z0-9]/g, '_');
    chartsContainer.innerHTML += `<div class="chart-container"><h3>${esc(title)} — Performance Over Time</h3><canvas id="${id}" height="220"></canvas></div>`;
    requestAnimationFrame(() => renderChart(id, points, title));
  });
}

function renderChart(canvasId, dataPoints, title) {
  const canvas = $(canvasId); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr; canvas.height = 220 * dpr;
  ctx.scale(dpr, dpr);
  const W = rect.width, H = 220;
  const pad = { top: 20, right: 20, bottom: 40, left: 40 };
  const plotW = W - pad.left - pad.right, plotH = H - pad.top - pad.bottom;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#a3a3a3' : '#78716c';
  const gridColor = isDark ? '#333' : '#e7e5e4';

  // Grid
  ctx.strokeStyle = gridColor; ctx.lineWidth = 0.5; ctx.font = '11px DM Mono, monospace'; ctx.fillStyle = textColor;
  for (let i = 0; i <= 10; i += 2) {
    const y = pad.top + plotH - (i / 10) * plotH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + plotW, y); ctx.stroke();
    ctx.fillText(i, pad.left - 24, y + 4);
  }

  // Data
  const n = dataPoints.length;
  const xs = dataPoints.map((_, i) => pad.left + (i / (n - 1)) * plotW);
  const ys = dataPoints.map(p => pad.top + plotH - ((p.rating - 1) / 9) * plotH);

  // X labels
  ctx.textAlign = 'center';
  const step = Math.max(1, Math.floor(n / 6));
  for (let i = 0; i < n; i += step) {
    const dt = new Date(dataPoints[i].date + 'T00:00:00');
    ctx.fillText(`${dt.getMonth() + 1}/${dt.getDate()}`, xs[i], H - 8);
  }

  // Line
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
  grad.addColorStop(0, '#fbbf24'); grad.addColorStop(1, '#f59e0b');
  ctx.strokeStyle = grad; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  ctx.beginPath();
  xs.forEach((x, i) => { if (i === 0) ctx.moveTo(x, ys[i]); else ctx.lineTo(x, ys[i]); });
  ctx.stroke();

  // Points
  xs.forEach((x, i) => {
    ctx.beginPath(); ctx.arc(x, ys[i], 4, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b'; ctx.fill();
    ctx.strokeStyle = isDark ? '#242424' : '#fff'; ctx.lineWidth = 2; ctx.stroke();
  });

  // Hover tooltip
  canvas.onmousemove = e => {
    const bx = e.offsetX;
    let closest = -1, minD = Infinity;
    xs.forEach((x, i) => { const d = Math.abs(bx - x); if (d < minD) { minD = d; closest = i; } });
    if (closest >= 0 && minD < 20) {
      canvas.title = `${dataPoints[closest].date}: ${dataPoints[closest].rating}/10`;
      canvas.style.cursor = 'pointer';
    } else { canvas.title = ''; canvas.style.cursor = 'default'; }
  };
}

// =========================================================
// DATA EXPLORER
// =========================================================

// --- State -------------------------------------------------
const dataState = {
  query: '',
  category: '',
  status: '',
  sortDir: 'asc',
  view: 'cards',
};

// --- Colour maps -------------------------------------------
const catColorMap = {
  Work: { bg: 'rgba(59,130,246,.15)', text: '#3b82f6' },
  Health: { bg: 'rgba(34,197,94,.15)', text: '#22c55e' },
  Learning: { bg: 'rgba(168,85,247,.15)', text: '#a855f7' },
  Finance: { bg: 'rgba(20,184,166,.15)', text: '#14b8a6' },
  Personal: { bg: 'rgba(245,158,11,.15)', text: '#f59e0b' },
};
const statusColorMap = {
  'Done': { bg: 'rgba(34,197,94,.15)', text: '#22c55e' },
  'In Progress': { bg: 'rgba(245,158,11,.15)', text: '#f59e0b' },
  'Pending': { bg: 'rgba(239,68,68,.15)', text: '#ef4444' },
};

function buildBadge(label, colorObj) {
  return `<span class="data-badge" style="background:${colorObj.bg};color:${colorObj.text}">${label}</span>`;
}
function scoreBar(val) {
  const color = val >= 80 ? '#22c55e' : val >= 55 ? '#f59e0b' : '#ef4444';
  return `<div class="score-bar-wrap" title="Score: ${val}">
    <div class="score-bar" style="width:${val}%;background:${color}"></div>
    <span class="score-label">${val}</span>
  </div>`;
}

// --- Filter & Sort ----------------------------------------
function getFilteredData() {
  const q = dataState.query.toLowerCase();
  let result = MOCK_DATA.filter(item => {
    const matchQ = !q || item.name.toLowerCase().includes(q) || item.tags.some(t => t.includes(q));
    const matchCat = !dataState.category || item.category === dataState.category;
    const matchSt = !dataState.status || item.status === dataState.status;
    return matchQ && matchCat && matchSt;
  });
  result.sort((a, b) =>
    dataState.sortDir === 'asc'
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name)
  );
  return result;
}

// --- Filter pills -----------------------------------------
function renderFilterPills() {
  const pills = [];
  if (dataState.query) pills.push({ label: `"${dataState.query}"`, key: 'query' });
  if (dataState.category) pills.push({ label: dataState.category, key: 'category' });
  if (dataState.status) pills.push({ label: dataState.status, key: 'status' });
  $('filter-pills').innerHTML = pills.map(p =>
    `<span class="filter-pill" data-key="${p.key}">${p.label} ×</span>`
  ).join('');
  $('filter-pills').querySelectorAll('.filter-pill').forEach(el => {
    el.addEventListener('click', () => {
      const k = el.dataset.key;
      dataState[k] = '';
      if (k === 'query') $('data-search').value = '';
      if (k === 'category') $('data-category').value = '';
      if (k === 'status') $('data-status').value = '';
      renderData();
    });
  });
}

// --- Card view --------------------------------------------
function renderCardsView(data) {
  if (!data.length) return `<div class="empty-state"><p>😕 No activities match your filters.</p><p style="font-size:.82rem">Try clearing a filter above.</p></div>`;
  return `<div class="data-cards-grid">${data.map(item => {
    const cat = catColorMap[item.category] || catColorMap.Personal;
    const st = statusColorMap[item.status] || statusColorMap.Pending;
    return `<div class="data-card card" tabindex="0">
      <div class="data-card-header">
        ${buildBadge(item.category, cat)}
        ${buildBadge(item.status, st)}
      </div>
      <h3 class="data-card-title">${esc(item.name)}</h3>
      <div class="data-card-meta"><span>📅 ${fmtDate(item.date)}</span></div>
      ${scoreBar(item.value)}
      <div class="data-card-tags">${item.tags.map(t => `<span class="tag">#${t}</span>`).join('')}</div>
    </div>`;
  }).join('')}</div>`;
}

// --- Table view -------------------------------------------
function renderTableView(data) {
  if (!data.length) return `<div class="empty-state"><p>😕 No activities match your filters.</p><p style="font-size:.82rem">Try clearing a filter above.</p></div>`;
  const rows = data.map(item => {
    const cat = catColorMap[item.category] || catColorMap.Personal;
    const st = statusColorMap[item.status] || statusColorMap.Pending;
    return `<tr>
      <td>${esc(item.name)}</td>
      <td>${buildBadge(item.category, cat)}</td>
      <td>${buildBadge(item.status, st)}</td>
      <td class="mono">${fmtDate(item.date)}</td>
      <td>${scoreBar(item.value)}</td>
      <td class="data-tags-cell">${item.tags.map(t => `<span class="tag">#${t}</span>`).join('')}</td>
    </tr>`;
  }).join('');
  return `<div style="overflow-x:auto"><table class="stats-table data-table">
    <thead><tr><th>Activity</th><th>Category</th><th>Status</th><th>Date</th><th>Score</th><th>Tags</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

// --- Main render ------------------------------------------
function renderData() {
  const data = getFilteredData();
  const total = MOCK_DATA.length;
  $('data-count').textContent = data.length === total
    ? `Showing all ${total} activities`
    : `Showing ${data.length} of ${total} activities`;
  renderFilterPills();
  $('data-render').innerHTML = dataState.view === 'cards'
    ? renderCardsView(data)
    : renderTableView(data);
  $('data-sort').textContent = dataState.sortDir === 'asc' ? 'Sort: A\u2013Z \u2195' : 'Sort: Z\u2013A \u2195';
}

// --- Wire controls ----------------------------------------
function initDataExplorer() {
  $('data-search').addEventListener('input', e => { dataState.query = e.target.value.trim(); renderData(); });
  $('data-category').addEventListener('change', e => { dataState.category = e.target.value; renderData(); });
  $('data-status').addEventListener('change', e => { dataState.status = e.target.value; renderData(); });
  $('data-sort').addEventListener('click', () => { dataState.sortDir = dataState.sortDir === 'asc' ? 'desc' : 'asc'; renderData(); });
  $('view-cards').addEventListener('click', () => {
    dataState.view = 'cards';
    $('view-cards').classList.add('active');
    $('view-table').classList.remove('active');
    renderData();
  });
  $('view-table').addEventListener('click', () => {
    dataState.view = 'table';
    $('view-table').classList.add('active');
    $('view-cards').classList.remove('active');
    renderData();
  });
  // Hook Data nav link (data section not in original showSection switch)
  document.querySelectorAll('#main-nav a').forEach(a => {
    if (a.dataset.section === 'data') {
      a.addEventListener('click', e => {
        e.preventDefault();
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('#main-nav a').forEach(x => x.classList.toggle('active', x.dataset.section === 'data'));
        $('section-data').classList.add('active');
        renderData();
      });
    }
  });
  renderData();
}

// =========================================================
// HAMBURGER MENU
// =========================================================
(function initHamburger() {
  const ham = $('hamburger');
  const nav = $('main-nav');
  if (!ham) return;
  ham.addEventListener('click', () => {
    const open = nav.classList.toggle('nav-open');
    ham.classList.toggle('open', open);
    ham.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      nav.classList.remove('nav-open');
      ham.classList.remove('open');
      ham.setAttribute('aria-expanded', 'false');
    });
  });
})();

// =========================================================
// LIVE DATA (API)
// =========================================================

let apiState = {
  resource: store('momentum_last_resource') || 'users',
  query: '',
  filter: '',
  sortDir: 'asc',
  view: 'cards',
  page: 1,
  perPage: 6,
  rawData: [],
  loading: false,
  error: null
};

// --- Fetching ---------------------------------------------
async function fetchApiData() {
  apiState.loading = true;
  apiState.error = null;
  apiState.page = 1; // Reset to page 1 on new fetch
  renderLiveSection();

  try {
    const resp = await fetch(`https://jsonplaceholder.typicode.com/${apiState.resource}`);
    if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
    apiState.rawData = await resp.json();
  } catch (err) {
    apiState.error = err.message;
  } finally {
    apiState.loading = false;
    renderLiveSection();
  }
}

// --- Filtering & Sorting ----------------------------------
function getProcessedLiveData() {
  let data = [...apiState.rawData];
  const q = apiState.query.toLowerCase();

  // Search
  if (q) {
    data = data.filter(item => {
      if (apiState.resource === 'users') return item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q);
      if (apiState.resource === 'posts') return item.title.toLowerCase().includes(q) || item.body.toLowerCase().includes(q);
      if (apiState.resource === 'todos') return item.title.toLowerCase().includes(q);
      return false;
    });
  }

  // Filter dropdown
  if (apiState.filter) {
    if (apiState.resource === 'posts') data = data.filter(item => item.userId == apiState.filter);
    if (apiState.resource === 'todos') data = data.filter(item => apiState.filter === 'done' ? item.completed : !item.completed);
  }

  // Sort
  data.sort((a, b) => {
    const valA = (apiState.resource === 'users' ? a.name : a.title).toLowerCase();
    const valB = (apiState.resource === 'users' ? b.name : b.title).toLowerCase();
    return apiState.sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  return data;
}

// --- Renderers --------------------------------------------
function renderLiveSection() {
  const container = $('live-render');
  if (apiState.loading) {
    container.innerHTML = `<div class="api-loading"><div class="spinner"></div><p>Fetching ${apiState.resource}...</p></div>`;
    $('live-pagination').style.display = 'none';
    return;
  }
  if (apiState.error) {
    container.innerHTML = `<div class="card api-error"><p>⚠️ ${apiState.error}</p><button class="btn btn-primary btn-sm" onclick="fetchApiData()" style="margin-top:12px">Retry</button></div>`;
    $('live-pagination').style.display = 'none';
    return;
  }

  const processed = getProcessedLiveData();
  const start = (apiState.page - 1) * apiState.perPage;
  const paginated = processed.slice(start, start + apiState.perPage);
  const totalPages = Math.ceil(processed.length / apiState.perPage);

  // Update counts & info
  $('live-count').textContent = `Showing ${processed.length} ${apiState.resource}`;
  $('live-page-info').textContent = `Page ${apiState.page} of ${totalPages || 1}`;
  $('live-prev').disabled = apiState.page <= 1;
  $('live-next').disabled = apiState.page >= totalPages;
  $('live-pagination').style.display = processed.length > apiState.perPage ? 'flex' : 'none';

  if (!processed.length) {
    container.innerHTML = `<div class="empty-state"><p>No ${apiState.resource} found matching your filters.</p></div>`;
    return;
  }

  container.innerHTML = apiState.view === 'cards'
    ? renderLiveCards(paginated)
    : renderLiveTable(paginated);

  $('live-sort').textContent = apiState.sortDir === 'asc' ? 'Sort: A–Z ↕' : 'Sort: Z–A ↕';
}

function renderLiveCards(data) {
  return `<div class="data-cards-grid">${data.map(item => {
    if (apiState.resource === 'users') {
      return `<div class="card data-card">
        <div class="data-card-header"><span class="data-badge" style="background:rgba(59,130,246,.15);color:#3b82f6">ID: ${item.id}</span></div>
        <h3 class="data-card-title">${esc(item.name)}</h3>
        <p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:8px">@${esc(item.username)}</p>
        <div class="data-card-meta">
          <div>📧 ${esc(item.email)}</div>
          <div>📍 ${esc(item.address.city)}</div>
          <div>🏢 ${esc(item.company.name)}</div>
        </div>
      </div>`;
    }
    if (apiState.resource === 'posts') {
      return `<div class="card data-card">
        <div class="data-card-header"><span class="data-badge" style="background:rgba(168,85,247,.15);color:#a855f7">User ${item.userId}</span></div>
        <h3 class="data-card-title">${esc(item.title)}</h3>
        <p style="font-size:.88rem;color:var(--text-secondary);line-height:1.5">${esc(item.body.substring(0, 100))}...</p>
      </div>`;
    }
    if (apiState.resource === 'todos') {
      const color = item.completed ? '#22c55e' : '#f59e0b';
      return `<div class="card data-card">
        <div class="data-card-header"><span class="data-badge" style="background:${item.completed ? 'rgba(34,197,94,.15)' : 'rgba(245,158,11,.15)'};color:${color}">${item.completed ? 'Done' : 'Pending'}</span></div>
        <h3 class="data-card-title" style="${item.completed ? 'text-decoration:line-through;opacity:.7' : ''}">${esc(item.title)}</h3>
      </div>`;
    }
  }).join('')}</div>`;
}

function renderLiveTable(data) {
  let headers = '', rows = '';
  if (apiState.resource === 'users') {
    headers = '<th>Name</th><th>Email</th><th>City</th><th>Company</th>';
    rows = data.map(item => `<tr><td>${esc(item.name)}</td><td>${esc(item.email)}</td><td>${esc(item.address.city)}</td><td>${esc(item.company.name)}</td></tr>`).join('');
  } else if (apiState.resource === 'posts') {
    headers = '<th>User</th><th>Title</th><th>Body Snippet</th>';
    rows = data.map(item => `<tr><td>${item.userId}</td><td style="font-weight:500">${esc(item.title)}</td><td>${esc(item.body.substring(0, 60))}...</td></tr>`).join('');
  } else if (apiState.resource === 'todos') {
    headers = '<th>Status</th><th>Title</th>';
    rows = data.map(item => `<tr><td><span class="badge ${item.completed ? 'badge-complete' : 'badge-medium'}">${item.completed ? 'Done' : 'Pending'}</span></td><td style="${item.completed ? 'text-decoration:line-through;opacity:.7' : ''}">${esc(item.title)}</td></tr>`).join('');
  }
  return `<div style="overflow-x:auto"><table class="stats-table data-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

// --- Filters Setup ----------------------------------------
function updateLiveFilters() {
  const sel = $('live-filter');
  if (!sel) return;
  sel.innerHTML = '<option value="">All</option>';
  if (apiState.resource === 'posts') {
    for (let i = 1; i <= 10; i++) sel.innerHTML += `<option value="${i}">User ${i}</option>`;
  } else if (apiState.resource === 'todos') {
    sel.innerHTML += '<option value="done">Done</option><option value="pending">Pending</option>';
  }
}

// --- Wire controls ----------------------------------------
function initLiveExplorer() {
  // Tabs
  document.querySelectorAll('.resource-tab').forEach(btn => {
    if (btn.dataset.resource === apiState.resource) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    }

    btn.addEventListener('click', () => {
      document.querySelectorAll('.resource-tab').forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', b === btn);
      });
      apiState.resource = btn.dataset.resource;
      store('momentum_last_resource', apiState.resource);
      apiState.query = '';
      apiState.filter = '';
      $('live-search').value = '';
      updateLiveFilters();
      fetchApiData();
    });
  });

  // Search
  $('live-search').addEventListener('input', e => {
    apiState.query = e.target.value.trim();
    apiState.page = 1;
    renderLiveSection();
  });

  // Filter
  $('live-filter').addEventListener('change', e => {
    apiState.filter = e.target.value;
    apiState.page = 1;
    renderLiveSection();
  });

  // Sort
  $('live-sort').addEventListener('click', () => {
    apiState.sortDir = apiState.sortDir === 'asc' ? 'desc' : 'asc';
    renderLiveSection();
  });

  // Refresh
  $('live-refresh').addEventListener('click', fetchApiData);

  // View
  $('live-view-cards').addEventListener('click', () => {
    apiState.view = 'cards';
    $('live-view-cards').classList.add('active');
    $('live-view-table').classList.remove('active');
    renderLiveSection();
  });
  $('live-view-table').addEventListener('click', () => {
    apiState.view = 'table';
    $('live-view-table').classList.add('active');
    $('live-view-cards').classList.remove('active');
    renderLiveSection();
  });

  // Pagination
  $('live-prev').addEventListener('click', () => { if (apiState.page > 1) { apiState.page--; renderLiveSection(); } });
  $('live-next').addEventListener('click', () => { apiState.page++; renderLiveSection(); });

  // Hook Live nav link
  document.querySelectorAll('#main-nav a').forEach(a => {
    if (a.dataset.section === 'live') {
      a.addEventListener('click', e => {
        e.preventDefault();
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('#main-nav a').forEach(x => x.classList.toggle('active', x.dataset.section === 'live'));
        $('section-live').classList.add('active');
        if (!apiState.rawData.length) fetchApiData();
        else renderLiveSection();
      });
    }
  });

  updateLiveFilters();
}

// =========================================================
// INIT
// =========================================================
(function init() {
  applyTheme(settings.theme);
  initCalendar();
  renderHome();
  initDataExplorer();
  initLiveExplorer();
  $('task-date').value = todayStr();
  $('qa-date').value = todayStr();
  setInterval(() => {
    if (pomoState.running && !pomoState.paused) updateTimerUI();
  }, 500);
})();
