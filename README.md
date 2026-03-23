Momentum Dashboard

A personal productivity dashboard built with HTML, CSS, and vanilla JavaScript.

---

Dashboard Purpose

Momentum helps you track goals, tasks, Pomodoro sessions, and performance stats — all in one place. The Data Explorer section (new in this version) provides a filterable, searchable view of your productivity activity log.

---

Data Structure

Mock data lives in `data.js` as a global array: `MOCK_DATA`.

Each record has:

| Field      | Type     | Description                               |
| ---------- | -------- | ----------------------------------------- |
| `id`       | number   | Unique identifier                         |
| `name`     | string   | Activity title                            |
| `category` | string   | Work, Health, Learning, Finance, Personal |
| `status`   | string   | Done, In Progress, Pending                |
| `date`     | string   | ISO date YYYY-MM-DD                       |
| `value`    | number   | Completion score 0–100                    |
| `tags`     | string[] | Keyword tags for search                   |

User-created goals, tasks, and Pomodoro logs are stored in localStorage under momentum_* keys.

---

Filters Implemented

All filters in the Data Explorer section update the UI instantly (no page reload):

| Control                  | Behaviour                                               |
| ------------------------ | ------------------------------------------------------- |
| Search input             | Fuzzy match on activity name and tags                   |
| Category dropdown        | Filter by Work / Health / Learning / Finance / Personal |
| Status dropdown          | Filter by Done / In Progress / Pending                  |
| Sort toggle (A–Z / Z–A)  | Alphabetically sort the filtered results                |
| Card / Table view toggle | Switch between a responsive card grid and a data table  |
| Filter pills             | Active filters shown as removable pill chips            |

---

Responsive Design Choices

| Breakpoint | Behaviour |
| ---------- | --------- |

> 768 px (Desktop) | Full horizontal nav, multi-column card grids
> ≤ 768 px (Tablet/Mobile) | Hamburger menu replaces horizontal nav; nav items stack vertically with a smooth max-height slide animation
> ≤ 480 px (Small mobile) | Single-column layouts for stat cards and data cards

CSS techniques used:

* CSS Grid (auto-fill columns with minmax) for fluid card grids
* Flexbox for nav, toolbars, and badges
* CSS custom properties (variables) for consistent theming
* Smooth transitions on all interactive elements
* max-height animation for the mobile nav collapse

---

Files

| File         | Role                                                   |
| ------------ | ------------------------------------------------------ |
| `index.html` | Structure & markup                                     |
| `style.css`  | All styles (design system, components, responsive)     |
| `data.js`    | 30-record mock dataset                                 |
| `script.js`  | All interactivity, state management, and DOM rendering |
