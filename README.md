Momentum is a refined, dark-mode-first productivity dashboard designed to help you stay focused, track your goals, and measure your performance over time.

What the Dashboard Does

Home View: Provides a quick overview of your day, including a time-based greeting, today's date, and summary statistics for goals, tasks, and Pomodoro sessions.
Goal Tracking: Allows you to set long-term goals with deadlines and categories. It visualizes progress using circular rings and a monthly calendar.
Task Management: Simple task list grouped by urgency (Today, Tomorrow, This Week, Later). Integrates with goals and features a performance rating system.
Pomodoro Timer: A customizable focus timer with session tracking and break intervals to boost productivity.
Performance Stats: Deep-dive into your productivity with statistics and automated line charts that track your performance ratings for specific tasks over time.

Interactive Features Implemented

1. Dark/Light Mode Toggle: Smooth theme switching using CSS custom properties, persisted for future sessions.
2. Goal Visualization: Dynamic circular progress rings that change color based on proximity to the deadline.
3. Interactive Calendar: A monthly grid that highlights days with active goals or tasks; clicking a day shows specific items in a side panel.
4. Self-Rating System: When completing a task, you're prompted to rate your performance (1–10). This data is then used to generate performance charts.
5. Smart Pomodoro Timer: Animates an SVG ring as time passes, updates the browser tab with the countdown, and provides a mini-timer in the header when you navigate to other sections.
6. Canvas Performance Charts: Automatically generates line charts using the pure Canvas API for any task title with 5 or more rating data points.
7. Data Persistence: All your goals, tasks, settings, and logs are saved to localStorage, ensuring your data is there when you return.
8. Toast Notifications: Real-time feedback for actions like adding tasks, completing goals, or timer sessions.
9. Form Validation: Strict enforcement of required fields and future-dated deadlines/tasks with inline error messaging.

Technology Stack

HTML5: Semantic structure.
CSS3: Vanilla CSS with Grid, Flexbox, and Custom Properties.
JavaScript: Pure Vanilla JS for all state management and logic.
Google Fonts: DM Serif Display, DM Sans, and DM Mono.