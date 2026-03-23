Here's the content with all formatting removed:

---

Momentum Dashboard

A personal productivity dashboard built with HTML, CSS, and vanilla JavaScript.

---

Dashboard Purpose

Momentum helps you track goals, tasks, Pomodoro sessions, and performance stats — all in one place. It includes a Data Explorer for mock productivity logs and a Live Data section for real-time API integration.

---

Live Data (API Integration)

The Live Data section connects to the JSONPlaceholder fake online REST API to demonstrate real-time data fetching and state management.

Features

Feature: Details
Multiple Resources: Switch between Users, Posts, and Todos
UI State Management: Handles Loading (spinner), Error (retry button), and Empty states
Interactive Controls: Search (by name/title/email), Filter (by User ID or Status), Sort (A-Z/Z-A), and Refresh
View Toggle: Switch between Card Grid and Table layouts for each resource
Pagination: Efficiently browse large datasets (6 items per page)
Persistence: Remembers your last-viewed resource using localStorage

API Endpoints Used

GET /users - Detailed user profiles
GET /posts - Blog post content
GET /todos - Task completion status

---

Data Explorer (Mock Data)

The Data Explorer section uses a static dataset in data.js (MOCK_DATA) to demonstrate basic filtering and sorting.

Filters Implemented

Control: Behaviour
Search input: Fuzzy match on activity name and tags
Category dropdown: Filter by Work / Health / Learning / Finance / Personal
Status dropdown: Filter by Done / In Progress / Pending
Sort toggle (A–Z / Z–A): Alphabetically sort the filtered results
Card / Table view toggle: Switch between a responsive card grid and a data table

---

Technical Design & Responsiveness

Technical Stack

HTML5: Semantic structure
CSS3: Vanilla CSS with custom properties (variables) and Flexbox/Grid
JavaScript: ES6+, Fetch API, Asynchronous JS, localStorage

Responsive Design

Desktop: Full horizontal nav, multi-column card grids.
Mobile/Tablet: Hamburger menu with smooth slide animation.
Micro-interactions: Hover effects, focus states, and loading spinners.

---

Project Files

index.html: Main structure.
style.css: All dashboard and API styles.
script.js: State management, Fetch logic, and DOM rendering.
data.js: Mock productivity dataset.
