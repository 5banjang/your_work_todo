# Project Overview: Your Work Todo (KOKO)

A specialized to-do list application where users can assign tasks to others. The "Assigner" creates a task and sends a unique link to the "Performer." When the Performer completes the task, the Assigner receives real-time feedback.

## Features & Capabilities
- **Real-time Task Tracking:** Assigner sees status changes instantly using Firebase Firestore.
- **Link-based Sharing:** Performers access tasks via unique URLs (e.g., `?taskId=...`).
- **Premium UI:** 
    - Glassmorphism design with `backdrop-filter`.
    - Modern typography using "Plus Jakarta Sans".
    - Vibrant colors using `oklch` color space.
    - Interactive Lucide icons.
- **Responsive Design:** Optimized for both mobile and desktop use.

## Current Progress
- [x] **Skeleton & Layout:** `index.html` updated with dual-view architecture.
- [x] **Styling:** `style.css` implemented with modern aesthetics and animations.
- [x] **Core Logic:** `main.js` handles task creation, link generation, and view switching.
- [x] **Real-time Sync:** Firestore integration (ready for config).

## Next Steps
1. **Firebase Config:** User needs to provide their Firebase project keys in `main.js`.
2. **Confetti Effect:** Add visual celebration when a task is completed.
3. **Task History:** Improve the list view with timestamps and delete options.
