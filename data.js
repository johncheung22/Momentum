// =========================================================
// MOCK DATA — Momentum Dashboard
// =========================================================
// 30 sample records representing productivity-related data.
// Each record has: id, name, category, status, date, value, tags
const MOCK_DATA = [
  { id: 1,  name: 'Complete Q2 Report',          category: 'Work',     status: 'Done',        date: '2026-03-01', value: 92, tags: ['report','analysis'] },
  { id: 2,  name: 'Morning Yoga Routine',         category: 'Health',   status: 'In Progress', date: '2026-03-23', value: 75, tags: ['fitness','wellness'] },
  { id: 3,  name: 'Read "Atomic Habits"',         category: 'Learning', status: 'Done',        date: '2026-02-28', value: 88, tags: ['books','habits'] },
  { id: 4,  name: 'Budget Review — March',        category: 'Finance',  status: 'Pending',     date: '2026-03-25', value: 60, tags: ['budget','planning'] },
  { id: 5,  name: 'Team Standup Prep',            category: 'Work',     status: 'Done',        date: '2026-03-22', value: 95, tags: ['meetings'] },
  { id: 6,  name: 'Meal Prep Sunday',             category: 'Health',   status: 'Done',        date: '2026-03-22', value: 80, tags: ['nutrition','cooking'] },
  { id: 7,  name: 'Spanish Duolingo Streak',      category: 'Learning', status: 'In Progress', date: '2026-03-23', value: 66, tags: ['language'] },
  { id: 8,  name: 'Refactor Auth Module',         category: 'Work',     status: 'In Progress', date: '2026-03-24', value: 70, tags: ['coding','backend'] },
  { id: 9,  name: 'Emergency Fund Top-Up',        category: 'Finance',  status: 'Done',        date: '2026-03-10', value: 100, tags: ['savings'] },
  { id: 10, name: 'Journal — Weekly Reflection',  category: 'Personal', status: 'Done',        date: '2026-03-21', value: 85, tags: ['mindfulness'] },
  { id: 11, name: 'Pull Request Review',          category: 'Work',     status: 'Pending',     date: '2026-03-24', value: 50, tags: ['coding','review'] },
  { id: 12, name: '5K Run Practice',              category: 'Health',   status: 'Done',        date: '2026-03-20', value: 90, tags: ['running','fitness'] },
  { id: 13, name: 'CSS Grid Deep Dive',           category: 'Learning', status: 'Done',        date: '2026-03-15', value: 78, tags: ['web','frontend'] },
  { id: 14, name: 'Tax Filing Prep',              category: 'Finance',  status: 'Pending',     date: '2026-03-30', value: 45, tags: ['taxes','documents'] },
  { id: 15, name: 'Write Blog Post',              category: 'Personal', status: 'In Progress', date: '2026-03-23', value: 55, tags: ['writing'] },
  { id: 16, name: 'Deploy Staging Env',           category: 'Work',     status: 'Done',        date: '2026-03-18', value: 97, tags: ['devops','coding'] },
  { id: 17, name: '8h Sleep Challenge — Week 2',  category: 'Health',   status: 'In Progress', date: '2026-03-23', value: 63, tags: ['sleep','wellness'] },
  { id: 18, name: 'Finish React Course',          category: 'Learning', status: 'Pending',     date: '2026-04-05', value: 40, tags: ['coding','frontend'] },
  { id: 19, name: 'Investments Rebalance',        category: 'Finance',  status: 'Done',        date: '2026-03-08', value: 82, tags: ['stocks','planning'] },
  { id: 20, name: 'Apartment Deep Clean',         category: 'Personal', status: 'Done',        date: '2026-03-16', value: 77, tags: ['chores'] },
  { id: 21, name: 'Code Review: UI Components',   category: 'Work',     status: 'Done',        date: '2026-03-19', value: 93, tags: ['frontend','review'] },
  { id: 22, name: 'Stretching 15min Daily',       category: 'Health',   status: 'In Progress', date: '2026-03-23', value: 68, tags: ['flexibility'] },
  { id: 23, name: 'Data Structures Refresher',    category: 'Learning', status: 'Done',        date: '2026-03-12', value: 84, tags: ['algorithms','coding'] },
  { id: 24, name: 'Track Monthly Expenses',       category: 'Finance',  status: 'Done',        date: '2026-03-14', value: 91, tags: ['tracking','budget'] },
  { id: 25, name: 'Call Family',                  category: 'Personal', status: 'Done',        date: '2026-03-19', value: 100, tags: ['family'] },
  { id: 26, name: 'Improve CI Pipeline',          category: 'Work',     status: 'Pending',     date: '2026-03-28', value: 58, tags: ['devops'] },
  { id: 27, name: 'Hydration Goal — 3L/day',      category: 'Health',   status: 'In Progress', date: '2026-03-23', value: 72, tags: ['hydration','wellness'] },
  { id: 28, name: 'Read System Design Primer',    category: 'Learning', status: 'Pending',     date: '2026-04-10', value: 35, tags: ['architecture'] },
  { id: 29, name: 'Side Project Kickoff',         category: 'Personal', status: 'In Progress', date: '2026-03-23', value: 62, tags: ['coding','creativity'] },
  { id: 30, name: 'Portfolio Update',             category: 'Work',     status: 'Pending',     date: '2026-03-31', value: 48, tags: ['career','design'] },
];
