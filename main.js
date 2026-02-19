// main.js - KOKO Logic (에러 방지 및 테스트 모드 강화)
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // 실제 키로 바꾸기 전까지는 테스트 모드로 동작합니다.
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

let db;
let isMockMode = false;

// Firebase 초기화 시도
try {
    if (firebaseConfig.apiKey === "YOUR_API_KEY") {
        throw new Error("Firebase 키가 설정되지 않았습니다. 테스트 모드로 시작합니다.");
    }
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) {
    console.warn(e.message);
    isMockMode = true;
    db = setupMockDb();
}

// --- DOM 요소 참조 ---
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

const appState = {
    currentTaskId: new URLSearchParams(window.location.search).get('taskId')
};

// --- 초기화 실행 ---
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // 아이콘 생성
        if (window.lucide) {
            lucide.createIcons();
        }

        if (appState.currentTaskId) {
            showView('performer');
            loadPerformerTask(appState.currentTaskId);
        } else {
            showView('assigner');
            listenToAllTasks();
        }
    } catch (error) {
        console.error("초기화 중 오류 발생:", error);
    } finally {
        // 어떤 경우에도 로딩 화면은 숨깁니다.
        setTimeout(hideLoading, 500);
    }
});

// --- 기능 함수들 ---

function showView(view) {
    elements.assignerView.classList.add('hidden');
    elements.performerView.classList.add('hidden');
    if (view === 'performer') elements.performerView.classList.remove('hidden');
    else elements.assignerView.classList.remove('hidden');
}

function hideLoading() {
    if (elements.loading) elements.loading.classList.add('hidden');
}

// 할 일 생성
elements.createTaskBtn.addEventListener('click', async () => {
    const title = elements.taskTitleInput.value.trim();
    const name = elements.assigneeNameInput.value.trim();
    
    if (!title || !name) {
        alert('할 일과 이름을 모두 입력해주세요!');
        return;
    }
    
    elements.createTaskBtn.disabled = true;
    const originalText = elements.createTaskBtn.innerHTML;
    elements.createTaskBtn.textContent = '생성 중...';
    
    try {
        const newTask = {
            title: title,
            assignee: name,
            status: 'pending',
            createdAt: new Date().getTime()
        };

        let taskId;
        if (isMockMode) {
            taskId = db.addDoc(newTask).id;
        } else {
            const docRef = await addDoc(collection(db, "tasks"), newTask);
            taskId = docRef.id;
        }
        
        const taskUrl = `${window.location.origin}${window.location.pathname}?taskId=${taskId}`;
        await copyToClipboard(taskUrl);
        showToast();
        
        elements.taskTitleInput.value = '';
        elements.assigneeNameInput.value = '';
    } catch (e) {
        console.error("태스크 생성 실패:", e);
        alert('링크 생성 중 오류가 발생했습니다.');
    } finally {
        elements.createTaskBtn.disabled = false;
        elements.createTaskBtn.innerHTML = originalText;
        lucide.createIcons();
    }
});

// 목록 실시간 감시
function listenToAllTasks() {
    if (isMockMode) {
        db.onSnapshot(null, (tasks) => renderTaskList(tasks));
    } else {
        onSnapshot(collection(db, "tasks"), (querySnapshot) => {
            const tasks = [];
            querySnapshot.forEach((doc) => {
                tasks.push({ id: doc.id, ...doc.data() });
            });
            tasks.sort((a, b) => b.createdAt - a.createdAt);
            renderTaskList(tasks);
        });
    }
}

function renderTaskList(tasks) {
    if (!elements.taskList) return;
    elements.taskList.innerHTML = '';
    
    if (tasks.length === 0) {
        elements.taskList.innerHTML = `
            <div class="empty-state">
                <i data-lucide="clipboard-list"></i>
                <p>아직 등록된 할 일이 없습니다.</p>
            </div>`;
    } else {
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
    lucide.createIcons();
}

// 받는 사람 화면 데이터 로드
async function loadPerformerTask(id) {
    if (isMockMode) {
        db.onSnapshot(id, (task) => {
            if (task) updatePerformerUI(task);
            else alert('존재하지 않는 할 일입니다.');
        });
    } else {
        const docRef = doc(db, "tasks", id);
        onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) updatePerformerUI(docSnap.data());
        });
    }
}

function updatePerformerUI(data) {
    elements.displayAssigneeName.textContent = `${data.assignee}님, 안녕하세요!`;
    elements.displayTaskTitle.textContent = data.title;
    
    if (data.status === 'done') {
        elements.performerStatus.textContent = '완료됨';
        elements.performerStatus.style.background = 'oklch(0.9 0.1 150)';
        elements.performerStatus.style.color = 'oklch(0.4 0.1 150)';
        elements.completeTaskBtn.classList.add('hidden');
        elements.completionView.classList.remove('hidden');
    }
}

elements.completeTaskBtn.addEventListener('click', async () => {
    elements.completeTaskBtn.disabled = true;
    try {
        if (isMockMode) {
            db.updateDoc(appState.currentTaskId, { status: 'done' });
        } else {
            const docRef = doc(db, "tasks", appState.currentTaskId);
            await updateDoc(docRef, { status: 'done' });
        }
    } catch (e) {
        alert('상태 업데이트에 실패했습니다.');
        elements.completeTaskBtn.disabled = false;
    }
});

// --- 유틸리티 ---

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        // 폴백: 구형 브라우저 대응
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

function showToast() {
    elements.toast.classList.add('show');
    setTimeout(() => elements.toast.classList.remove('show'), 3000);
}

// --- 테스트용 가짜 데이터베이스 (LocalStorage 사용) ---
function setupMockDb() {
    const STORAGE_KEY = 'koko_mock_tasks';
    const getTasks = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const saveTasks = (tasks) => localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));

    return {
        addDoc: (data) => {
            const id = 'mock_' + Date.now();
            const tasks = getTasks();
            tasks[id] = { ...data, id };
            saveTasks(tasks);
            return { id };
        },
        updateDoc: (id, data) => {
            const tasks = getTasks();
            if (tasks[id]) {
                tasks[id] = { ...tasks[id], ...data };
                saveTasks(tasks);
                window.dispatchEvent(new Event('storage')); // 같은 창에서도 감지되도록
            }
        },
        onSnapshot: (id, callback) => {
            const handler = () => {
                const tasks = getTasks();
                if (id) callback(tasks[id]);
                else callback(Object.values(tasks).sort((a,b) => b.createdAt - a.createdAt));
            };
            window.addEventListener('storage', handler);
            handler(); // 초기 실행
            return () => window.removeEventListener('storage', handler);
        }
    };
}
