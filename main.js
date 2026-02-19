// main.js - KOKO Logic
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";

// --- Firebase Configuration ---
// TO USER: Replace this with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase (Safely handle if config is not provided)
let db;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) {
    console.error("Firebase initialization failed. Using Mock Mode.", e);
    // Mock Database for demonstration if Firebase is not configured
    db = setupMockDb();
}

// --- Application Logic ---

const appState = {
    currentTaskId: new URLSearchParams(window.location.search).get('taskId'),
    tasks: []
};

// DOM Elements
const elements = {
    loading: document.getElementById('loading'),
    assignerView: document.getElementById('assigner-view'),
    performerView: document.getElementById('performer-view'),
    taskTitleInput: document.getElementById('task-title'),
    assigneeNameInput: document.getElementById('assignee-name'),
    createTaskBtn: document.getElementById('create-task-btn'),
    taskList: document.getElementById('task-list'),
    completeTaskBtn: document.getElementById('complete-task-btn'),
    performerStatus: document.getElementById('performer-status'),
    displayAssigneeName: document.getElementById('display-assignee-name'),
    displayTaskTitle: document.getElementById('display-task-title'),
    completionView: document.getElementById('completion-view'),
    toast: document.getElementById('toast')
};

// Initialize View
window.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();
    
    if (appState.currentTaskId) {
        showView('performer');
        await loadPerformerTask(appState.currentTaskId);
    } else {
        showView('assigner');
        listenToAllTasks();
    }
    
    hideLoading();
});

// --- View Management ---

function showView(view) {
    elements.assignerView.classList.add('hidden');
    elements.performerView.classList.add('hidden');
    
    if (view === 'performer') {
        elements.performerView.classList.remove('hidden');
    } else {
        elements.assignerView.classList.remove('hidden');
    }
}

function hideLoading() {
    elements.loading.classList.add('hidden');
}

// --- Assigner Actions ---

elements.createTaskBtn.addEventListener('click', async () => {
    const title = elements.taskTitleInput.value.trim();
    const name = elements.assigneeNameInput.value.trim();
    
    if (!title || !name) {
        alert('할 일과 이름을 모두 입력해주세요!');
        return;
    }
    
    elements.createTaskBtn.disabled = true;
    elements.createTaskBtn.textContent = '생성 중...';
    
    try {
        const docRef = await addDoc(collection(db, "tasks"), {
            title: title,
            assignee: name,
            status: 'pending',
            createdAt: new Date().getTime()
        });
        
        const taskUrl = `${window.location.origin}${window.location.pathname}?taskId=${docRef.id}`;
        copyToClipboard(taskUrl);
        showToast();
        
        elements.taskTitleInput.value = '';
        elements.assigneeNameInput.value = '';
    } catch (e) {
        console.error("Error adding document: ", e);
    } finally {
        elements.createTaskBtn.disabled = false;
        elements.createTaskBtn.innerHTML = '<i data-lucide="link"></i> 링크 생성 및 복사';
        lucide.createIcons();
    }
});

function listenToAllTasks() {
    onSnapshot(collection(db, "tasks"), (querySnapshot) => {
        const tasks = [];
        querySnapshot.forEach((doc) => {
            tasks.push({ id: doc.id, ...doc.data() });
        });
        // Sort by newest
        tasks.sort((a, b) => b.createdAt - a.createdAt);
        renderTaskList(tasks);
    });
}

function renderTaskList(tasks) {
    if (tasks.length === 0) return;
    
    elements.taskList.innerHTML = '';
    tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'task-card';
        const isDone = task.status === 'done';
        
        card.innerHTML = `
            <div class="task-info">
                <h4>${task.title}</h4>
                <p>${task.assignee}님에게 시킴</p>
            </div>
            <div class="badge ${isDone ? 'badge-done' : 'badge-pending'}">
                ${isDone ? '완료' : '진행 중'}
            </div>
        `;
        elements.taskList.appendChild(card);
    });
}

// --- Performer Actions ---

async function loadPerformerTask(id) {
    const docRef = doc(db, "tasks", id);
    
    // Set up real-time listener for this specific task
    onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            elements.displayAssigneeName.textContent = `${data.assignee}님, 안녕하세요!`;
            elements.displayTaskTitle.textContent = data.title;
            
            if (data.status === 'done') {
                elements.performerStatus.textContent = '완료됨';
                elements.performerStatus.style.background = 'oklch(0.9 0.1 150)';
                elements.performerStatus.style.color = 'oklch(0.4 0.1 150)';
                elements.completeTaskBtn.classList.add('hidden');
                elements.completionView.classList.remove('hidden');
            }
        } else {
            alert('유효하지 않은 링크입니다.');
            window.location.search = '';
        }
    });
}

elements.completeTaskBtn.addEventListener('click', async () => {
    const docRef = doc(db, "tasks", appState.currentTaskId);
    elements.completeTaskBtn.disabled = true;
    
    try {
        await updateDoc(docRef, { status: 'done' });
        // Confetti effect can be added here
    } catch (e) {
        console.error("Error updating document: ", e);
    }
});

// --- Helpers ---

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
}

function showToast() {
    elements.toast.classList.add('show');
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// Mock DB implementation for local preview without real Firebase config
function setupMockDb() {
    return {
        // Very basic mock to prevent errors in local preview
        collection: () => ({}),
        doc: () => ({}),
        addDoc: async () => ({ id: 'mock-id-' + Math.random() }),
        updateDoc: async () => {},
        onSnapshot: (ref, callback) => {
            // Mock empty list immediately
            if (typeof ref === 'function') callback({ forEach: () => {} });
            return () => {};
        }
    };
}
