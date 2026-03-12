// =========================================================
// DATA LAYER
// =========================================================
let useLocalStorage = true;
try { localStorage.setItem('_test', '1'); localStorage.removeItem('_test'); } catch(e) { useLocalStorage = false; }
if (!useLocalStorage) {
  const b = document.createElement('div'); b.className='warning-banner'; b.textContent='⚠ localStorage unavailable — data will not persist.';
  document.body.insertBefore(b, document.body.firstChild);
}
const memStore = {};
function store(key, val) {
  if (arguments.length === 1) {
    if (useLocalStorage) { try { return JSON.parse(localStorage.getItem(key)); } catch(e) { return null; } }
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
function fmtDate(d) { const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }); }
function daysBetween(a, b) { return Math.ceil((new Date(b+'T00:00:00') - new Date(a+'T00:00:00')) / 86400000); }

function showToast(message, type='info') {
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
  $('today-date').textContent = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });

  const today = todayStr();
  const activeGoals = goals.filter(g => !g.completed).length;
  const todayTasks = tasks.filter(t => t.date === today && !t.completed).length;
  const todaySessions = pomoLog.filter(l => l.date === today && l.type === 'focus').length;
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate()-7);
  const weekRatings = ratings.filter(r => new Date(r.completedAt) >= weekAgo);
  const avgRating = weekRatings.length ? (weekRatings.reduce((s,r)=>s+r.rating,0)/weekRatings.length).toFixed(1) : '—';

  $('home-stats').innerHTML = [
    createStatCard('Active Goals', activeGoals, 'In progress', 'var(--accent)'),
    createStatCard('Due Today', todayTasks, 'Tasks remaining', 'var(--info)'),
    createStatCard('Pomodoros', todaySessions, 'Sessions today', 'var(--danger)'),
    createStatCard('Avg Rating', avgRating, 'This week', 'var(--success)')
  ].join('');

  // Populate goal dropdown for quick add
  const goalSel = $('qa-goal');
  goalSel.innerHTML = '<option value="">None</option>' + goals.filter(g=>!g.completed).map(g=>`<option value="${g.id}">${g.title}</option>`).join('');
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
  if (!title) { $('qa-title').classList.add('error'); $('qa-title-err').style.display='block'; valid=false; } else { $('qa-title').classList.remove('error'); $('qa-title-err').style.display='none'; }
  if (!date || date < todayStr()) { $('qa-date').classList.add('error'); $('qa-date-err').style.display='block'; valid=false; } else { $('qa-date').classList.remove('error'); $('qa-date-err').style.display='none'; }
  if (!valid) return;
  tasks.push({ id: Date.now(), title, date, priority: $('qa-priority').value, goalId: $('qa-goal').value || null, completed: false, createdAt: new Date().toISOString() });
  saveAll(); $('qa-title').value=''; $('quick-add-form').style.display='none';
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
  ['task-goal','qa-goal'].forEach(id => {
    const el = $(id); if (!el) return;
    el.innerHTML = '<option value="">None</option>' + active.map(g => `<option value="${g.id}">${g.title}</option>`).join('');
  });
}

function createGoalCard(g) {
  const today = new Date(); today.setHours(0,0,0,0);
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
  const offset = circumference - (Math.min(pct,100) / 100) * circumference;

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
      <svg class="goal-progress-ring" viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="none" stroke="var(--border)" stroke-width="5"/><circle cx="32" cy="32" r="24" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" transform="rotate(-90 32 32)"/><text x="32" y="36" text-anchor="middle" fill="var(--text-primary)" font-size="12" font-family="DM Mono,monospace">${g.completed ? '✓' : Math.round(pct)+'%'}</text></svg>
    </div>
    ${g.description ? `<button class="details-toggle" onclick="toggleDesc(${g.id})">Details ▼</button><div class="goal-desc" id="desc-${g.id}">${esc(g.description)}</div>` : ''}
    <div class="goal-actions">
      ${!g.completed ? `<button class="btn btn-success btn-sm" onclick="completeGoal(${g.id})">✓ Complete</button>` : ''}
      <button class="btn btn-danger btn-sm" onclick="deleteGoal(${g.id})">Delete</button>
    </div>
  </div>`;
}

function esc(s) { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

function toggleDesc(id) {
  const el = $('desc-'+id);
  if (!el) return;
  const show = !el.classList.contains('show');
  el.classList.toggle('show', show);
  el.previousElementSibling.textContent = show ? 'Details ▲' : 'Details ▼';
}

function completeGoal(id) { const g = goals.find(x=>x.id===id); if(g){g.completed=true; g.completedAt=new Date().toISOString(); saveAll(); renderGoals(); showToast('Goal completed! 🎉','success');} }
function deleteGoal(id) { goals = goals.filter(x=>x.id!==id); saveAll(); renderGoals(); showToast('Goal deleted','info'); }

// Goal form submit
$('goal-submit').addEventListener('click', () => {
  const title = $('goal-title').value.trim();
  const deadline = $('goal-deadline').value;
  let valid = true;
  if (!title) { $('goal-title').classList.add('error'); $('goal-title-err').style.display='block'; valid=false; } else { $('goal-title').classList.remove('error'); $('goal-title-err').style.display='none'; }
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1); const minDate = tomorrow.toISOString().split('T')[0];
  if (!deadline || deadline < minDate) { $('goal-deadline').classList.add('error'); $('goal-deadline-err').style.display='block'; valid=false; } else { $('goal-deadline').classList.remove('error'); $('goal-deadline-err').style.display='none'; }
  if (!valid) return;
  goals.push({ id:Date.now(), title, description:$('goal-desc').value.trim(), deadline, category:$('goal-category').value, completed:false, createdAt:new Date().toISOString() });
  saveAll(); $('goal-title').value=''; $('goal-desc').value=''; $('goal-deadline').value='';
  showToast('Goal created! 🎯','success'); renderGoals();
});

// =========================================================
// CALENDAR
// =========================================================
function renderCalendar() {
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  $('cal-month-label').textContent = `${monthNames[calMonth]} ${calYear}`;

  const first = new Date(calYear, calMonth, 1);
  const last = new Date(calYear, calMonth+1, 0);
  const startDay = first.getDay();
  const daysInMonth = last.getDate();
  const prevLast = new Date(calYear, calMonth, 0).getDate();

  const today = todayStr();
  const catColors = { Health:'#22c55e', Career:'#3b82f6', Learning:'#a855f7', Personal:'#f59e0b', Financial:'#14b8a6' };

  let html = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div class="calendar-day-name">${d}</div>`).join('');

  // Previous month padding
  for (let i = startDay-1; i >= 0; i--) { html += `<div class="calendar-day other-month">${prevLast-i}</div>`; }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = dateStr === today;
    const dayGoals = goals.filter(g => g.deadline === dateStr);
    const dayTasks = tasks.filter(t => t.date === dateStr);
    let dots = '';
    if (dayGoals.length || dayTasks.length) {
      const colors = new Set();
      dayGoals.forEach(g => colors.add(catColors[g.category] || 'var(--accent)'));
      if (dayTasks.length) colors.add('var(--text-secondary)');
      dots = `<div class="calendar-dots">${[...colors].slice(0,3).map(c=>`<div class="calendar-dot" style="background:${c}"></div>`).join('')}</div>`;
    }
    html += `<div class="calendar-day${isToday?' today':''}" onclick="showDayPanel('${dateStr}')">${d}${dots}</div>`;
  }

  // Next month padding
  const totalCells = startDay + daysInMonth;
  const remaining = (7 - totalCells % 7) % 7;
  for (let i = 1; i <= remaining; i++) { html += `<div class="calendar-day other-month">${i}</div>`; }

  $('calendar-grid').innerHTML = html;
}

$('cal-prev').addEventListener('click', () => { calMonth--; if(calMonth<0){calMonth=11;calYear--;} renderCalendar(); });
$('cal-next').addEventListener('click', () => { calMonth++; if(calMonth>11){calMonth=0;calYear++;} renderCalendar(); });

function showDayPanel(dateStr) {
  const panel = $('day-panel');
  const dayGoals = goals.filter(g => g.deadline === dateStr);
  const dayTasks = tasks.filter(t => t.date === dateStr);
  if (!dayGoals.length && !dayTasks.length) { panel.classList.remove('show'); return; }
  $('day-panel-title').textContent = fmtDate(dateStr);
  let items = '';
  dayGoals.forEach(g => { items += `<div class="day-panel-item">🎯 <span class="badge badge-${g.category.toLowerCase()}">${g.category}</span> ${esc(g.title)}</div>`; });
  dayTasks.forEach(t => { items += `<div class="day-panel-item">${t.completed?'✅':'☐'} ${esc(t.title)} <span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span></div>`; });
  $('day-panel-items').innerHTML = items;
  panel.classList.add('show');
}

// =========================================================
// TASKS
// =========================================================
function renderTasks() {
  populateGoalDropdowns();
  const today = todayStr();
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate()+7);
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
  if (groups.today.length) { html += `<div class="task-group"><h3>Today</h3>${groups.today.map(t=>createTaskItem(t)).join('')}</div>`; }
  else { html += `<div class="task-group"><h3>Today</h3><div class="empty-state" style="padding:16px"><p>You're all clear today! 🎉</p></div></div>`; }
  if (groups.tomorrow.length) html += `<div class="task-group"><h3>Tomorrow</h3>${groups.tomorrow.map(t=>createTaskItem(t)).join('')}</div>`;
  if (groups.week.length) html += `<div class="task-group"><h3>This Week</h3>${groups.week.map(t=>createTaskItem(t)).join('')}</div>`;
  if (groups.later.length) html += `<div class="task-group"><h3>Later</h3>${groups.later.map(t=>createTaskItem(t)).join('')}</div>`;
  if (completed.length) html += `<div class="task-group"><h3>Completed</h3>${completed.map(t=>createTaskItem(t)).join('')}</div>`;

  $('tasks-list').innerHTML = html;
}

function createTaskItem(t) {
  const past = !t.completed && t.date < todayStr();
  const goal = t.goalId ? goals.find(g => g.id == t.goalId) : null;
  return `<div class="task-item${t.completed?' completed':''}">
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
  if (!title) { $('task-title').classList.add('error'); $('task-title-err').style.display='block'; valid=false; } else { $('task-title').classList.remove('error'); $('task-title-err').style.display='none'; }
  if (!date || date < todayStr()) { $('task-date').classList.add('error'); $('task-date-err').style.display='block'; valid=false; } else { $('task-date').classList.remove('error'); $('task-date-err').style.display='none'; }
  if (!valid) return;
  tasks.push({ id:Date.now(), title, date, priority:$('task-priority').value, goalId:$('task-goal').value||null, completed:false, createdAt:new Date().toISOString() });
  saveAll(); $('task-title').value=''; $('task-date').value='';
  showToast('Task added! ✅','success'); renderTasks();
});

// =========================================================
// RATING MODAL
// =========================================================
let ratingTaskId = null, selectedRating = null;

function openRatingModal(taskId) {
  ratingTaskId = taskId; selectedRating = null;
  const t = tasks.find(x=>x.id===taskId);
  $('modal-task-name').textContent = `"${t.title}"`;
  $('modal-title').textContent = `How well did you do on:`;
  let btns = '';
  for (let i=1;i<=10;i++) btns += `<button class="rating-btn" data-val="${i}" onclick="selectRating(${i})">${i}</button>`;
  $('rating-grid').innerHTML = btns;
  $('modal-submit').disabled = true;
  $('rating-modal').classList.add('show');
}

function selectRating(v) {
  selectedRating = v;
  document.querySelectorAll('.rating-btn').forEach(b => b.classList.toggle('selected', parseInt(b.dataset.val)===v));
  $('modal-submit').disabled = false;
}

$('modal-submit').addEventListener('click', () => {
  if (!selectedRating) return;
  const t = tasks.find(x=>x.id===ratingTaskId);
  if (t) { t.completed=true; t.completedAt=new Date().toISOString(); }
  ratings.push({ taskTitle:t.title, rating:selectedRating, completedAt:new Date().toISOString(), date:todayStr() });
  saveAll();
  $('rating-modal').classList.remove('show');
  showToast('Logged! Keep it up 🔥','success');
  renderTasks(); renderHome();
});
$('modal-cancel').addEventListener('click', () => { $('rating-modal').classList.remove('show'); });

// =========================================================
// POMODORO
// =========================================================
let pomoState = { running:false, paused:false, seconds:0, total:0, interval:null, session:1, mode:'focus',
  focusLen:25, breakLen:5, longBreakLen:15, longBreakEvery:4 };

function renderPomodoro() {
  const todayFocus = pomoLog.filter(l => l.date === todayStr() && l.type === 'focus');
  const totalMin = todayFocus.reduce((s,l) => s + l.duration, 0);
  $('total-focus').textContent = `Total focus today: ${totalMin} min`;
  let logHtml = '';
  if (!todayFocus.length && !pomoLog.filter(l=>l.date===todayStr()).length) logHtml='<p style="color:var(--text-secondary);font-size:.85rem">No sessions yet today.</p>';
  else {
    pomoLog.filter(l=>l.date===todayStr()).reverse().forEach(l => {
      logHtml += `<div class="session-entry"><span>${l.type==='focus'?'🍅':'☕'} ${l.type.charAt(0).toUpperCase()+l.type.slice(1)} — ${l.duration} min</span><span class="mono" style="color:var(--text-secondary)">${l.time}</span></div>`;
    });
  }
  $('session-log-list').innerHTML = logHtml;
}

$('pomo-start').addEventListener('click', () => {
  pomoState.focusLen = Math.min(120,Math.max(1, parseInt($('pomo-focus').value)||25));
  pomoState.breakLen = Math.min(60,Math.max(1, parseInt($('pomo-break').value)||5));
  pomoState.longBreakLen = Math.min(60,Math.max(1, parseInt($('pomo-long-break').value)||15));
  pomoState.longBreakEvery = Math.min(10,Math.max(2, parseInt($('pomo-interval').value)||4));
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
  const m = Math.floor(pomoState.seconds/60); const s = pomoState.seconds%60;
  const display = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
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
  pomoLog.push({ date: todayStr(), type: pomoState.mode, duration: dur, time: new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) });
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
  clearInterval(pomoState.interval); pomoState.running=false; pomoState.paused=false;
  $('pomo-config').style.display='block'; $('pomo-timer').style.display='none';
  $('mini-timer').style.display='none'; document.title='Momentum — Productivity Dashboard';
});

$('timer-skip').addEventListener('click', () => {
  if (pomoState.running) { clearInterval(pomoState.interval); onTimerEnd(); }
});

// =========================================================
// STATS
// =========================================================
function renderStats() {
  // Stat cards
  const totalCompleted = tasks.filter(t=>t.completed).length;
  const avgR = ratings.length ? (ratings.reduce((s,r)=>s+r.rating,0)/ratings.length).toFixed(1) : '—';
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate()-7);
  const weekFocus = pomoLog.filter(l=>new Date(l.date+'T00:00:00')>=weekAgo && l.type==='focus').reduce((s,l)=>s+l.duration,0);
  const completedGoals = goals.filter(g=>g.completed).length;
  const goalRate = goals.length ? Math.round(completedGoals/goals.length*100)+'%' : '—';

  // Best rated task
  const titleRatings = {};
  ratings.forEach(r => { if(!titleRatings[r.taskTitle]) titleRatings[r.taskTitle]=[]; titleRatings[r.taskTitle].push(r.rating); });
  let bestTask = '—', bestAvg = 0;
  Object.entries(titleRatings).forEach(([t,rs]) => { const a=rs.reduce((s,v)=>s+v,0)/rs.length; if(a>bestAvg){bestAvg=a;bestTask=t;} });

  // Most completed task type
  const titleCounts = {}; tasks.filter(t=>t.completed).forEach(t => { titleCounts[t.title]=(titleCounts[t.title]||0)+1; });
  let mostTask = '—', mostCount = 0;
  Object.entries(titleCounts).forEach(([t,c]) => { if(c>mostCount){mostCount=c;mostTask=t;} });

  $('stats-cards').innerHTML = [
    createStatCard('Tasks Completed', totalCompleted, 'All time', 'var(--success)'),
    createStatCard('Avg Rating', avgR, 'All tasks', 'var(--accent)'),
    createStatCard('Focus This Week', weekFocus+' min', 'Pomodoro total', 'var(--danger)'),
    createStatCard('Goal Rate', goalRate, `${completedGoals}/${goals.length} goals`, 'var(--info)'),
    createStatCard('Best Rated', bestAvg ? bestAvg.toFixed(1) : '—', bestTask.length>20?bestTask.slice(0,20)+'…':bestTask, 'var(--accent)'),
    createStatCard('Most Done', mostCount||'—', mostTask.length>20?mostTask.slice(0,20)+'…':mostTask, 'var(--success)')
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
    const id = 'chart-' + title.replace(/[^a-zA-Z0-9]/g,'_');
    chartsContainer.innerHTML += `<div class="chart-container"><h3>${esc(title)} — Performance Over Time</h3><canvas id="${id}" height="220"></canvas></div>`;
    requestAnimationFrame(() => renderChart(id, points, title));
  });
}

function renderChart(canvasId, dataPoints, title) {
  const canvas = $(canvasId); if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr; canvas.height = 220 * dpr;
  ctx.scale(dpr, dpr);
  const W = rect.width, H = 220;
  const pad = { top:20, right:20, bottom:40, left:40 };
  const plotW = W - pad.left - pad.right, plotH = H - pad.top - pad.bottom;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#a3a3a3' : '#78716c';
  const gridColor = isDark ? '#333' : '#e7e5e4';

  // Grid
  ctx.strokeStyle = gridColor; ctx.lineWidth = 0.5; ctx.font = '11px DM Mono, monospace'; ctx.fillStyle = textColor;
  for (let i = 0; i <= 10; i += 2) {
    const y = pad.top + plotH - (i / 10) * plotH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left+plotW, y); ctx.stroke();
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
    ctx.fillText(`${dt.getMonth()+1}/${dt.getDate()}`, xs[i], H - 8);
  }

  // Line
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top+plotH);
  grad.addColorStop(0, '#fbbf24'); grad.addColorStop(1, '#f59e0b');
  ctx.strokeStyle = grad; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  ctx.beginPath();
  xs.forEach((x, i) => { if (i===0) ctx.moveTo(x, ys[i]); else ctx.lineTo(x, ys[i]); });
  ctx.stroke();

  // Points
  xs.forEach((x, i) => {
    ctx.beginPath(); ctx.arc(x, ys[i], 4, 0, Math.PI*2);
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
// INIT
// =========================================================
(function init() {
  applyTheme(settings.theme);
  initCalendar();
  renderHome();
  // Set default dates
  $('task-date').value = todayStr();
  $('qa-date').value = todayStr();
  // Update mini timer when switching sections
  const origShow = showSection;
  setInterval(() => {
    if (pomoState.running && !pomoState.paused) updateTimerUI();
  }, 500);
})();
