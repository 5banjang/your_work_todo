"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Todo, TodoStatus } from "@/types/todo";
import { generateId } from "@/lib/utils";
import { db, isFirebaseConfigured, messaging } from "@/lib/firebase";
import {
    collection,
    doc,
    onSnapshot,
    setDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    deleteField
} from "firebase/firestore";
import { getToken, onMessage } from "firebase/messaging";

interface TodoContextType {
    todos: Todo[];
    viewMode: "list" | "board";
    setViewMode: (mode: "list" | "board") => void;
    addTodo: (title: string, deadline: Date | null) => void;
    updateTodo: (id: string, updates: Partial<Todo>) => void;
    deleteTodo: (id: string) => void;
    completeTodo: (id: string) => void;
    uncompleteTodo: (id: string) => void;
    clearCompletedTodos: () => Promise<void>;
    reorderTodos: (activeId: string, overId: string) => void;
    moveTodoStatus: (id: string, status: TodoStatus) => void;
    fcmToken: string | null;
    requestPushPermission: () => Promise<void>;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

const STORAGE_KEY = "your-todo-data";



export function TodoProvider({ children }: { children: ReactNode }) {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [viewMode, setViewMode] = useState<"list" | "board">("list");
    const [isLoaded, setIsLoaded] = useState(false);
    const [fcmToken, setFcmToken] = useState<string | null>(null);

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

        newlyCompleted.forEach(t => {
            const doPush = () => {
                const soundOn = localStorage.getItem("your-todo-sound") !== "false";
                const vibrateOn = localStorage.getItem("your-todo-vibrate") !== "false";
                const who = t.lastCompletedBy || "누군가";
                const title = "완료 알림";
                const options: any = {
                    body: `${who}님이 '${t.title}' 할 일을 완료했습니다!`,
                    icon: "/icons/icon-192.png",
                    vibrate: vibrateOn ? [200, 100, 200] : undefined,
                    silent: !soundOn && !vibrateOn
                };

                if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                    try {
                        // Mobile browsers often ban new Notification() and require ServiceWorker
                        navigator.serviceWorker.ready.then((reg) => {
                            if (reg) {
                                reg.showNotification(title, options).catch((err) => {
                                    console.error("SW showNotification error:", err);
                                    new Notification(title, options); // fallback
                                });
                            } else {
                                new Notification(title, options);
                            }
                        }).catch(() => {
                            new Notification(title, options); // fallback
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
                    let reg = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
                    if (!reg) {
                        reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
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
            const title = payload.notification?.title || "알림";
            const options = {
                body: payload.notification?.body || "새 알림이 도착했습니다.",
                icon: "/icons/icon-192.png",
                vibrate: [200, 100, 200]
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
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as Todo[];
                const restored = parsed.map((t) => ({
                    ...t,
                    deadline: t.deadline ? new Date(t.deadline) : null,
                    remindAt: t.remindAt ? new Date(t.remindAt) : null,
                    createdAt: new Date(t.createdAt),
                    updatedAt: new Date(t.updatedAt),
                    completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
                    batchId: t.batchId,
                }));
                setTodos(restored);
            } else {
                setTodos([]);
            }
        } catch {
            setTodos([]);
        }
        setIsLoaded(true);
    }, []);

    // Load from Firestore or localStorage
    useEffect(() => {
        if (isFirebaseConfigured() && db) {
            const todosRef = collection(db, "todos");
            const unsubscribe = onSnapshot(todosRef, (snapshot) => {
                const newTodos: Todo[] = [];
                snapshot.forEach((d) => {
                    const data = d.data();
                    newTodos.push({
                        id: d.id,
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
                        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
                        completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : undefined,
                    } as Todo);
                });
                newTodos.sort((a, b) => a.order - b.order);
                setTodos(newTodos);
                setIsLoaded(true);
            }, (error) => {
                console.error("Firestore error:", error);
                loadLocal();
            });
            return () => unsubscribe();
        } else {
            loadLocal();
        }
    }, [loadLocal]);

    // Save to localStorage ONLY if firebase is not configured
    useEffect(() => {
        if (isLoaded && (!isFirebaseConfigured() || !db)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
        }
    }, [todos, isLoaded]);

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
    }, [todos]);

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

    const clearCompletedTodos = useCallback(async () => {
        const myNickname = typeof window !== "undefined" ? localStorage.getItem("your-todo-nickname") || "누군가" : "누군가";
        const completedTodos = todos.filter(t => {
            if (t.status !== "done") return false;
            const involvesMe = t.createdBy === myNickname || t.createdBy === "me" || t.assigneeName === myNickname;
            if (!involvesMe) return false;
            const isDelegatedByMe = t.createdBy === myNickname && t.assigneeName && t.assigneeName !== myNickname;
            return !isDelegatedByMe;
        });
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
            setTodos((prev) => prev.filter(t => t.status !== "done"));
        }
    }, [todos]);

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
