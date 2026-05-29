# 📌 Project Context: your_work_todo

## 1. Next.js App Router Structure
The application uses the Next.js App Router (`src/app/`):

- **`/` (Main Page)**: `src/app/page.tsx`
  - Core dashboard containing Kanban board and list view.
  - Interacts with `TodoProvider` (`src/context/TodoContext.tsx`).
  - Implements category navigation (Personal vs. Shared tasks), Smart input (`SmartInput`), sound effects, and FCM push notifications registration.
  
- **`/share/[id]` (Single Task Share Page)**: `src/app/share/[id]/page.tsx`
  - Renders a standalone task page for external assignment.
  - Automatically fetches the workspace ID and binds the recipient's nickname to `assigneeName` in Firestore if blank.
  - Allows the assignee to mark the task completed ("이 일 완료하기"), updating the task status to `done` and `lastCompletedBy` to the assignee's nickname in Firestore.

- **`/share/batch/[id]` (Batch Share Page)**: `src/app/share/batch/[id]/page.tsx`
  - Used for sharing multiple selected todos under a single batch link.

---

## 2. Firebase Database Schema & Connection Status
Firebase configuration resides in `src/lib/firebase.ts`. It loads configuration keys from standard Vercel environment variables:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

If the Firebase config is missing, the app defaults to an empty state with console error alerts to prevent silent local storage fallbacks.

### Firestore Collections:
1. **`todos`**:
   - `id`: unique string ID
   - `title`: string
   - `description`: optional string
   - `status`: `'todo' | 'in_progress' | 'waiting' | 'done'`
   - `order`: number (re-ordering index)
   - `deadline`: Timestamp | null
   - `remindAt`: Timestamp | null
   - `assigneeId`: optional string
   - `assigneeName`: optional string
   - `createdBy`: string (nickname of the creator)
   - `shareLink`: optional string
   - `batchId`: optional string
   - `checklist`: array of `{ id, text, completed }`
   - `syncId`: string (Workspace ID)
   - `userId`: optional string (Google Auth UID)
   - `createdAt`: Timestamp
   - `updatedAt`: Timestamp
   - `completedAt`: optional Timestamp
   - `lastCompletedBy`: optional string
   - `category`: `'personal' | 'shared'`

2. **`fcmTokens`**:
   - `token`: string (Device FCM token)
   - `userNickname`: string
   - `updatedAt`: Timestamp

3. **`users`**:
   - `uid`: string (Auth UID)
   - `nickname`: string
   - `updatedAt`: Timestamp

---

## 3. Local Firebase Security Rules (`config/firebase-rules.json`)
The local database validation rules have been configured as:
```json
{
  "rules": {
    "todos": {
      ".read": "auth != null",
      ".write": "auth != null",
      "assigned_to": {
        ".validate": "newData.isString()"
      },
      "tracking_status": {
        ".validate": "newData.val() == 'pending' || newData.val() == 'accepted' || newData.val() == 'completed'"
      }
    }
  }
}
```

---

## 4. State Synchronization Mechanics
- The app uses client-side state combined with real-time Firestore listeners (`onSnapshot`).
- Active workspace ID controls the context queries.
- When logged in via Google Auth, the user's tasks are synced using `userId == user.uid`.
- Unauthenticated (guest) users sync using `syncId == activeWorkspaceId`.
- Foreground and background push notification alerts trigger melody sound playback and vibration.
