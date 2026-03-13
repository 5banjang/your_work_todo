"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Todo, TodoStatus } from "@/types/todo";
import { generateId } from "@/lib/utils";
import { db, isFirebaseConfigured, messaging, ensureAnonymousLogin, auth, googleProvider, signInWithPopup, onAuthStateChanged, signOut } from "@/lib/firebase";
import { type User } from "firebase/auth";
import {
    collection,
    doc,
    onSnapshot,
    setDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    deleteField,
    query,
    where,
    getDocs
} from "firebase/firestore";
import { getToken, onMessage } from "firebase/messaging";
import { playIfSoundEnabled, initAudioOnUserGesture } from "@/lib/notificationSound";

interface TodoContextType {
    todos: Todo[];
    viewMode: "list" | "board";
    setViewMode: (mode: "list" | "board") => void;
    addTodo: (title: string, deadline: Date | null) => void;
    updateTodo: (id: string, updates: Partial<Todo>) => void;
    deleteTodo: (id: string) => void;
    completeTodo: (id: string) => void;
    uncompleteTodo: (id: string) => void;
    clearCompletedTodos: (idsToClear?: string[]) => Promise<void>;
    reorderTodos: (activeId: string, overId: string) => void;
    moveTodoStatus: (id: string, status: TodoStatus) => void;
    fcmToken: string | null;
    requestPushPermission: () => Promise<void>;
    activeWorkspaceId: string;

    // Auth
    user: User | null;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

const STORAGE_KEY = "your-todo-data";

export function TodoProvider({ children, batchId, todoId, workspaceId }: { children: ReactNode; batchId?: string; todoId?: string; workspaceId?: string }) {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [viewMode, setViewMode] = useState<"list" | "board">("list");
    const [isLoaded, setIsLoaded] = useState(false);
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    // activeWorkspaceId is derived directly from props, defaulting to empty string if not provided
    const activeWorkspaceId = workspaceId || "";

    const prevTodosRef = React.useRef<Todo[]>([]);
    const nicknameRef = React.useRef("");

    useEffect(() => {
        const syncNickname = () => {
            nicknameRef.current = localStorage.getItem("your-todo-nickname") || "누군가";
        };
        syncNickname();
        window.addEventListener("storage", syncNickname);
        return () => window.removeEventListener("storage", syncNickname);
    }, []);

    // 모바일 AudioContext autoplay 우회: 사용자 첫 터치 시 resume
    useEffect(() => {
        initAudioOnUserGesture();
    }, []);

    // 앱 로드 시 알림 권한이 이미 있으면 자동으로 FCM 토큰 등록
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!("Notification" in window)) return;
        if (Notification.permission !== "granted") return;
        // 이미 권한이 있으므로 토큰만 자동 등록
        const autoRegisterToken = async () => {
            try {
                const msg = messaging();
                if (!msg) return;
                let reg = await navigator.serviceWorker.getRegistration("/sw.js");
                if (!reg) {
                    reg = await navigator.serviceWorker.register("/sw.js");
                }
                const token = await getToken(msg, {
                    serviceWorkerRegistration: reg,
                    vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY
                });
                if (token && isFirebaseConfigured() && db) {
                    const nickname = localStorage.getItem("your-todo-nickname") || "누군가";
                    await setDoc(doc(db, "fcmTokens", token), {
                        token,
                        userNickname: nickname,
                        updatedAt: new Date()
                    }, { merge: true });
                    setFcmToken(token);
                    console.log("FCM token auto-registered:", token.substring(0, 20) + "...");
                }
            } catch (err) {
                console.error("Auto FCM token registration failed:", err);
            }
        };
        autoRegisterToken();
    }, []);

    // 파이어베이스 익명 로그인 및 Auth 리스너 설정
    useEffect(() => {
        if (isFirebaseConfigured()) {
            ensureAnonymousLogin();
            if (auth) {
                const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                    // Ignore anonymous users in this `user` state to treat them as guests UI-wise
                    if (currentUser && !currentUser.isAnonymous) {
                        setUser(currentUser);
                    } else {
                        setUser(null);
                    }
                });
                return () => unsubscribe();
            }
        }
    }, []);

    const loginWithGoogle = useCallback(async () => {
        if (!auth) return;
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Google login failed:", error);
            alert("로그인에 실패했습니다.");
        }
    }, []);

    const logout = useCallback(async () => {
        if (!auth) return;
        try {
            await signOut(auth);
            setUser(null);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    }, []);

    // Detect when someone ELSE completes a todo and fire a local push notification
    useEffect(() => {
        if (!isLoaded) return;
        const prev = prevTodosRef.current;
        const currentTodos = todos;
        const myNickname = nicknameRef.current;

        const newlyCompleted = currentTodos.filter(t => {
            if (t.status !== "done") return false;
            const old = prev.find(p => p.id === t.id);
            if (!old || old.status === "done") return false;
            // Only notify if someone else completed it, or if both have no name, assume it's me for now if it originated locally
            // We use a simple check: if lastCompletedBy matches my nickname, don't notify.
            if (t.lastCompletedBy && t.lastCompletedBy === myNickname) return false;
            return true;
        });

        if (newlyCompleted.length > 0) {
            // 소리 재생 (설정이 켜져 있을 때)
            playIfSoundEnabled();
        }

        newlyCompleted.forEach(t => {
            const doPush = () => {
                const vibrateOn = localStorage.getItem("your-todo-vibrate") !== "false";
                const who = t.lastCompletedBy || "누군가";
                const title = "완료 알림";
                const options: any = {
                    body: `${who}님이 '${t.title}' 할 일을 완료했습니다!`,
                    icon: "/icons/icon-192.png",
                    vibrate: vibrateOn ? [200, 100, 200] : undefined,
                    silent: true  // 소리는 Web Audio API로 별도 재생하므로 OS 알림 소리는 끔
                };

                if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                    try {
                        navigator.serviceWorker.ready.then((reg) => {
                            if (reg) {
                                reg.showNotification(title, options).catch((err) => {
                                    console.error("SW showNotification error:", err);
                                    new Notification(title, options);
                                });
                            } else {
                                new Notification(title, options);
                            }
                        }).catch(() => {
                            new Notification(title, options);
                        });
                    } catch (e) {
                        console.error("Push Notification Error:", e);
                    }
                }
            };
            doPush();
        });

        prevTodosRef.current = currentTodos;
    }, [todos, isLoaded]);

    const requestPushPermission = async () => {
        if (!("Notification" in window)) return;
        try {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                const msg = messaging();
                if (msg) {
                    let reg = await navigator.serviceWorker.getRegistration("/sw.js");
                    if (!reg) {
                        reg = await navigator.serviceWorker.register("/sw.js");
                    }
                    const token = await getToken(msg, {
                        serviceWorkerRegistration: reg,
                        vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY
                    });
                    console.log("FCM Token received:", token);
                    setFcmToken(token);

                    // Save token to Firestore so Cloud Functions can broadcast to this device
                    if (isFirebaseConfigured() && db && token) {
                        try {
                            const nickname = localStorage.getItem("your-todo-nickname") || "누군가";
                            await setDoc(doc(db, "fcmTokens", token), {
                                token: token,
                                userNickname: nickname,
                                updatedAt: new Date()
                            }, { merge: true });
                            console.log("FCM Token saved to DB for user:", nickname);
                        } catch (tokenErr) {
                            console.error("Error saving FCM token to DB:", tokenErr);
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Failed to get push permission:", err);
        }
    };

    // Listen for foreground push messages
    useEffect(() => {
        const msg = messaging();
        if (!msg) return;

        const unsubscribe = onMessage(msg, (payload) => {
            console.log("Foreground push received:", payload);

            // 포그라운드에서 FCM 수신 시 멜로디 재생
            playIfSoundEnabled();

            const vibrateOn = localStorage.getItem("your-todo-vibrate") !== "false";
            const title = payload.notification?.title || "알림";
            const options = {
                body: payload.notification?.body || "새 알림이 도착했습니다.",
                icon: "/icons/icon-192.png",
                vibrate: vibrateOn ? [200, 100, 200] : undefined,
                silent: true  // 소리는 Web Audio API로 별도 재생
            };
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                try {
                    navigator.serviceWorker.ready.then((reg) => {
                        if (reg) {
                            reg.showNotification(title, options).catch((err) => {
                                console.error("SW showNotification error:", err);
                                new Notification(title, options);
                            });
                        } else {
                            new Notification(title, options);
                        }
                    }).catch(() => {
                        new Notification(title, options);
                    });
                } catch (e) {
                    console.error("Foreground Push Error:", e);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    const loadLocal = useCallback(() => {
        // 로컬 저장소(localStorage) 의존성 완전 제거:
        // Vercel에서 환경변수 누락 시 임시 저장되는 현상을 방지하여,
        // 클라우드 동기화 실패 상황을 사용자가 확실히 인지할 수 있도록 유도합니다.
        setTodos([]);
        setIsLoaded(true);
        if (typeof window !== "undefined" && !isFirebaseConfigured()) {
            console.error(
                "🚨 파이어베이스 연결 실패: Vercel 환경 변수(NEXT_PUBLIC_FIREBASE_*)가 누락되었거나 잘못되었습니다. 동기화가 불가능합니다."
            );
        }
    }, []);

    // Load from Firestore or localStorage
    useEffect(() => {
        if (!batchId && !todoId && !activeWorkspaceId) return; // Wait until init

        if (isFirebaseConfigured() && db) {
            // Migrate old items without syncId (skip if in view-only mode)
            if (!batchId && !todoId) {
                const migrateLegacy = async () => {
                    try {
                        const allDocsSnap = await getDocs(collection(db!, "todos"));
                        const batch = writeBatch(db!);
                        let count = 0;
                        allDocsSnap.forEach(d => {
                            if (!d.data().syncId) {
                                batch.update(d.ref, { syncId: activeWorkspaceId });
                                count++;
                            }
                        });
                        if (count > 0) {
                            await batch.commit();
                            console.log(`Migrated ${count} legacy todos to syncId: ${activeWorkspaceId}`);
                        }
                    } catch (e) {
                        console.error("Migration failed", e);
                    }
                };
                migrateLegacy();
            }

            // Migrate to userId if logged in
            if (!batchId && !todoId && user && activeWorkspaceId) {
                const migrateToUser = async () => {
                    try {
                        const qSync = query(collection(db!, "todos"), where("syncId", "==", activeWorkspaceId));
                        const snap = await getDocs(qSync);
                        const batch = writeBatch(db!);
                        let count = 0;
                        snap.forEach(d => {
                            const data = d.data();
                            if (!data.userId || data.userId !== user.uid) {
                                batch.update(d.ref, { userId: user.uid });
                                count++;
                            }
                        });
                        if (count > 0) {
                            await batch.commit();
                            console.log(`Migrated ${count} todos to user: ${user.uid}`);
                        }
                    } catch (e) {
                        console.error("Migration to user failed", e);
                    }
                };
                migrateToUser();
            }

            if (todoId) {
                const docRef = doc(db, "todos", todoId);
                const unsubscribe = onSnapshot(docRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const d = snapshot;
                        const data = d.data();
                        setTodos([{
                            id: d.id,
                            title: data.title,
                            description: data.description,
                            status: data.status,
                            deadline: data.deadline?.toDate ? data.deadline.toDate() : null,
                            assigneeName: data.assigneeName,
                            createdBy: data.createdBy,
                            checklist: data.checklist || [],
                            syncId: data.syncId,
                            userId: data.userId,
                            batchId: data.batchId,
                            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                        } as Todo]);
                    } else {
                        setTodos([]);
                    }
                    setIsLoaded(true);
                });
                return () => unsubscribe();
            }

            const todosRef = collection(db, "todos");
            let unsubscribes: (() => void)[] = [];

            const mergeSnapshots = () => {
                const combined = Array.from(tasksMap.values());
                combined.sort((a, b) => a.order - b.order);
                setTodos(combined);
                setIsLoaded(true);
            };

            const tasksMap = new Map<string, Todo>();

            const handleSnapshot = (snapshot: any) => {
                snapshot.docChanges().forEach((change: any) => {
                    const data = change.doc.data();
                    const todoId = change.doc.id;
                    if (change.type === "removed") {
                        tasksMap.delete(todoId);
                    } else {
                        tasksMap.set(todoId, {
                            id: todoId,
                            title: data.title,
                            description: data.description,
                            status: data.status,
                            order: typeof data.order === 'number' ? data.order : 0,
                            deadline: data.deadline?.toDate ? data.deadline.toDate() : null,
                            remindAt: data.remindAt?.toDate ? data.remindAt.toDate() : null,
                            assigneeId: data.assigneeId,
                            assigneeName: data.assigneeName,
                            createdBy: data.createdBy,
                            shareLink: data.shareLink,
                            batchId: data.batchId,
                            checklist: data.checklist || [],
                            geoFence: data.geoFence,
                            syncId: data.syncId,
                            userId: data.userId,
                            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
                            completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : undefined,
                        } as Todo);
                    }
                });
                mergeSnapshots();
            };

            if (batchId) {
                const q = query(todosRef, where("batchId", "==", batchId));
                unsubscribes.push(onSnapshot(q, handleSnapshot, (err) => {
                    console.error("Firestore error:", err);
                    loadLocal();
                }));
            } else {
                const myNickname = typeof window !== "undefined" ? localStorage.getItem("your-todo-nickname") || "누군가" : "누군가";

                // 1. My tasks (userId if logged in, otherwise syncId)
                if (user) {
                    const qUser = query(todosRef, where("userId", "==", user.uid));
                    unsubscribes.push(onSnapshot(qUser, handleSnapshot, (err) => {
                        console.error("Firestore error (userId):", err);
                        loadLocal();
                    }));
                } else if (activeWorkspaceId) {
                    const qSync = query(todosRef, where("syncId", "==", activeWorkspaceId));
                    unsubscribes.push(onSnapshot(qSync, handleSnapshot, (err) => {
                        console.error("Firestore error (syncId):", err);
                        loadLocal();
                    }));
                }

                // 2. Tasks assigned to me
                if (myNickname && myNickname !== "누군가") {
                    const qAssignee = query(todosRef, where("assigneeName", "==", myNickname));
                    unsubscribes.push(onSnapshot(qAssignee, handleSnapshot, (err) => {
                        console.error("Firestore error (assignee):", err);
                    }));
                }
            }

            return () => {
                unsubscribes.forEach(unsub => unsub());
            };
        } else {
            loadLocal();
        }
    }, [activeWorkspaceId, batchId, todoId, loadLocal, user]);

    // 로컬 저장소 백업 로직 제거됨 (클라우드 동기화 100% 강제)
    useEffect(() => {
        // 로컬에 저장하지 않습니다.
    }, [todos, isLoaded, batchId, todoId]);

    const addTodo = useCallback(async (title: string, deadline: Date | null) => {
        const now = new Date();
        const newId = generateId();
        const myNickname = typeof window !== "undefined" ? localStorage.getItem("your-todo-nickname") || "누군가" : "누군가";

        const baseTodo = {
            title,
            status: "todo",
            order: 0,
            deadline,
            remindAt: null,
            createdBy: myNickname,
            checklist: [],
            createdAt: now,
            updatedAt: now,
            syncId: activeWorkspaceId,
            ...(user ? { userId: user.uid } : {}),
        };

        if (isFirebaseConfigured() && db) {
            try {
                const batch = writeBatch(db!);
                // Prepend: we set this to 0, push all others by 1
                todos.forEach(t => {
                    const docRef = doc(db!, "todos", t.id);
                    batch.update(docRef, { order: t.order + 1, updatedAt: new Date() });
                });
                const newDocRef = doc(db!, "todos", newId);
                batch.set(newDocRef, { ...baseTodo, order: 0 });
                await batch.commit();
            } catch (err) {
                console.error("Error adding todo:", err);
            }
        } else {
            const newTodo: Todo = { id: newId, ...baseTodo } as Todo;
            setTodos((prev) => [newTodo, ...prev.map((t) => ({ ...t, order: t.order + 1 }))]);
        }
    }, [todos, activeWorkspaceId]);

    const updateTodo = useCallback(async (id: string, updates: Partial<Todo>) => {
        if (isFirebaseConfigured() && db) {
            try {
                const docRef = doc(db!, "todos", id);
                // Remove undefined values to avoid Firestore errors
                const cleanUpdates = { ...updates, updatedAt: new Date() } as Record<string, any>;
                Object.keys(cleanUpdates).forEach(key => {
                    if (cleanUpdates[key] === undefined) delete cleanUpdates[key];
                });
                await updateDoc(docRef, cleanUpdates);
            } catch (err) {
                console.error("Error updating todo:", err);
            }
        } else {
            setTodos((prev) =>
                prev.map((t) =>
                    t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
                )
            );
        }
    }, []);

    const deleteTodo = useCallback(async (id: string) => {
        if (isFirebaseConfigured() && db) {
            try {
                await deleteDoc(doc(db!, "todos", id));
            } catch (err) {
                console.error("Error deleting todo:", err);
            }
        } else {
            setTodos((prev) => prev.filter((t) => t.id !== id));
        }
    }, []);

    const completeTodo = useCallback(async (id: string) => {
        const nickname = typeof window !== "undefined" ? localStorage.getItem("your-todo-nickname") || "누군가" : "누군가";
        if (isFirebaseConfigured() && db) {
            try {
                await updateDoc(doc(db!, "todos", id), {
                    status: "done",
                    completedAt: new Date(),
                    updatedAt: new Date(),
                    lastCompletedBy: nickname
                });
            } catch (err) {
                console.error("Error completing todo:", err);
            }
        } else {
            setTodos((prev) =>
                prev.map((t) =>
                    t.id === id
                        ? { ...t, status: "done" as TodoStatus, completedAt: new Date(), updatedAt: new Date(), lastCompletedBy: nickname }
                        : t
                )
            );
        }
    }, []);

    const uncompleteTodo = useCallback(async (id: string) => {
        if (isFirebaseConfigured() && db) {
            try {
                await updateDoc(doc(db!, "todos", id), {
                    status: "todo",
                    completedAt: deleteField(),
                    updatedAt: new Date()
                });
            } catch (err) {
                console.error("Error uncompleting todo:", err);
            }
        } else {
            setTodos((prev) =>
                prev.map((t) =>
                    t.id === id
                        ? { ...t, status: "todo" as TodoStatus, completedAt: undefined, updatedAt: new Date() }
                        : t
                )
            );
        }
    }, []);

    const clearCompletedTodos = useCallback(async (idsToClear?: string[]) => {
        const myNickname = typeof window !== "undefined" ? localStorage.getItem("your-todo-nickname") || "누군가" : "누군가";

        let completedTodos: Todo[] = [];

        if (idsToClear && idsToClear.length > 0) {
            // 명시적으로 지울 ID 목록을 받은 경우 (UI에서 보이는 항목과 100% 일치시킴)
            completedTodos = todos.filter(t => idsToClear.includes(t.id));
        } else {
            // 기존 폴백 로직
            completedTodos = todos.filter(t => {
                if (t.status !== "done") return false;
                // 공유 모드 (batchId) 일 때는 현재 보이는 항목들 소유권 검사 없이 전부 지울 수 있도록 허용
                if (batchId) return true;

                // 구글 로그인한 경우: Firestore에서 `userId`로 쿼리해 온 데이터이므로 기본적으로 모두 내 데이터입니다.
                if (user) {
                    const sentOutbox = t.createdBy === myNickname && !!t.batchId;
                    const manuallyDelegated = t.createdBy === myNickname && t.assigneeName && t.assigneeName !== myNickname;
                    return !sentOutbox && !manuallyDelegated;
                }

                // 로그인하지 않은 경우 (기존 로직 유지)
                const involvesMe = t.createdBy === myNickname || t.createdBy === "me" || t.assigneeName === myNickname;
                if (!involvesMe) return false;

                // Filter out tasks I sent out: if I created it AND it has a batchId (shared via link)
                const sentOutbox = t.createdBy === myNickname && !!t.batchId;
                const manuallyDelegated = t.createdBy === myNickname && t.assigneeName && t.assigneeName !== myNickname;
                return !sentOutbox && !manuallyDelegated;
            });
        }

        if (completedTodos.length === 0) return;

        if (isFirebaseConfigured() && db) {
            try {
                // Batch delete all done items (Firebase limits batches to 500 operations, usually safe for this)
                const batch = writeBatch(db!);
                completedTodos.forEach(t => {
                    batch.delete(doc(db!, "todos", t.id));
                });
                await batch.commit();
            } catch (err) {
                console.error("Error clearing completed todos:", err);
            }
        } else {
            setTodos((prev) => prev.filter(t => !completedTodos.find(c => c.id === t.id)));
        }
    }, [todos, batchId, user]);

    const reorderTodos = useCallback(async (activeId: string, overId: string) => {
        const oldIndex = todos.findIndex((t) => t.id === activeId);
        const newIndex = todos.findIndex((t) => t.id === overId);
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = [...todos];
        const [moved] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, moved);
        const mapped = reordered.map((t, i) => ({ ...t, order: i }));

        if (isFirebaseConfigured() && db) {
            try {
                const batch = writeBatch(db!);
                mapped.forEach(t => {
                    const docRef = doc(db!, "todos", t.id);
                    batch.update(docRef, { order: t.order, updatedAt: new Date() });
                });
                await batch.commit();
            } catch (err) {
                console.error("Error reordering todos:", err);
            }
        } else {
            setTodos(mapped);
        }
    }, [todos]);

    const moveTodoStatus = useCallback(async (id: string, status: TodoStatus) => {
        const nickname = typeof window !== "undefined" ? localStorage.getItem("your-todo-nickname") || "누군가" : "누군가";
        if (isFirebaseConfigured() && db) {
            try {
                const updatePayload: Record<string, any> = {
                    status,
                    updatedAt: new Date(),
                };
                if (status === "done") {
                    updatePayload.completedAt = new Date();
                    updatePayload.lastCompletedBy = nickname;
                } else {
                    updatePayload.completedAt = deleteField();
                    updatePayload.lastCompletedBy = deleteField();
                }
                await updateDoc(doc(db!, "todos", id), updatePayload);
            } catch (err) {
                console.error("Error moving todo status:", err);
            }
        } else {
            setTodos((prev) =>
                prev.map((t) =>
                    t.id === id
                        ? {
                            ...t,
                            status,
                            updatedAt: new Date(),
                            completedAt: status === "done" ? new Date() : undefined,
                            lastCompletedBy: status === "done" ? nickname : undefined,
                        }
                        : t
                )
            );
        }
    }, []);

    return (
        <TodoContext.Provider
            value={{
                todos,
                viewMode,
                setViewMode,
                addTodo,
                updateTodo,
                deleteTodo,
                completeTodo,
                uncompleteTodo,
                clearCompletedTodos,
                reorderTodos,
                moveTodoStatus,
                fcmToken,
                requestPushPermission,
                activeWorkspaceId,
                user,
                loginWithGoogle,
                logout,
            }}
        >
            {children}
        </TodoContext.Provider>
    );
}

export function useTodos() {
    const ctx = useContext(TodoContext);
    if (!ctx) throw new Error("useTodos must be used within a TodoProvider");
    return ctx;
}
