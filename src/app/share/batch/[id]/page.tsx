"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot } from "firebase/firestore";
import type { Todo } from "@/types/todo";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import styles from "../../[id]/share.module.css";
import { motion, AnimatePresence } from "framer-motion";
import NicknameModal from "@/components/NicknameModal/NicknameModal";

function BatchShareContent() {
    const params = useParams();
    const router = useRouter();
    const batchId = params.id as string;

    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [myNickname, setMyNickname] = useState<string | null>(null);
    const [showNicknameModal, setShowNicknameModal] = useState(false);

    // Check for nickname first, if none exists, show modal
    useEffect(() => {
        const nickname = localStorage.getItem("your-todo-nickname");
        if (nickname) {
            setMyNickname(nickname);
        } else {
            setShowNicknameModal(true);
        }
    }, []);

    // Load and bind only after nickname is established
    useEffect(() => {
        if (!db || !batchId || !myNickname) return;

        const applyBindingAndListen = async () => {
            try {
                // Fetch all tasks matching the batchId
                const q = query(collection(db as any, "todos"), where("batchId", "==", batchId));
                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    setError(true);
                    setLoading(false);
                    return;
                }

                // If user has a nickname, bind tasks to them if not already bound
                if (myNickname) {
                    const updatePromises = snapshot.docs.map(async (document) => {
                        const data = document.data();
                        // Only bind if it hasn't been assigned to someone else
                        if (!data.assigneeName || data.assigneeName === myNickname) {
                            if (data.assigneeName !== myNickname) {
                                await updateDoc(doc(db as any, "todos", document.id), { assigneeName: myNickname });
                            }
                        }
                    });
                    await Promise.all(updatePromises);
                }

                // Now listen to real-time updates for these specific tasks
                const unsubscribe = onSnapshot(q, (snap) => {
                    const fetchedTodos: Todo[] = [];
                    snap.forEach((document) => {
                        const data = document.data();
                        fetchedTodos.push({
                            id: document.id,
                            title: data.title,
                            description: data.description,
                            status: data.status,
                            deadline: data.deadline?.toDate ? data.deadline.toDate() : null,
                            assigneeName: data.assigneeName,
                            createdBy: data.createdBy,
                            checklist: data.checklist || [],
                        } as Todo);
                    });

                    // Sort order: done at the bottom, then by deadline
                    fetchedTodos.sort((a, b) => {
                        if (a.status === "done" && b.status !== "done") return 1;
                        if (b.status === "done" && a.status !== "done") return -1;
                        if (a.deadline && b.deadline) return a.deadline.getTime() - b.deadline.getTime();
                        if (a.deadline) return -1;
                        if (b.deadline) return 1;
                        return 0;
                    });

                    setTodos(fetchedTodos);
                    setLoading(false);
                }, (err) => {
                    console.error("Snapshot error:", err);
                    setError(true);
                    setLoading(false);
                });

                return unsubscribe;
            } catch (err) {
                console.error("Error fetching batch:", err);
                setError(true);
                setLoading(false);
            }
        };

        let unsubPromise = applyBindingAndListen();

        return () => {
            unsubPromise.then(unsub => {
                if (unsub) unsub();
            });
        };
    }, [batchId]);

    const handleComplete = async (todoId: string, currentStatus: string) => {
        if (!db) return;
        const newStatus = currentStatus === "done" ? "todo" : "done";
        try {
            const nickname = localStorage.getItem("your-todo-nickname") || "누군가";
            const updateData: any = {
                status: newStatus,
                updatedAt: new Date()
            };
            if (newStatus === "done") {
                updateData.completedAt = new Date();
                updateData.lastCompletedBy = nickname;
            } else {
                updateData.completedAt = null;
            }

            await updateDoc(doc(db, "todos", todoId), updateData);
        } catch (err) {
            console.error("Error toggling completion:", err);
        }
    };

    const handleNicknameSave = (name: string) => {
        localStorage.setItem("your-todo-nickname", name);
        setMyNickname(name);
        setShowNicknameModal(false);
    };

    if (showNicknameModal && !myNickname) {
        return <NicknameModal isOpen={true} onSave={handleNicknameSave} />;
    }

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p>요청받은 할 일 목록을 불러오고 이름표를 붙이는 중입니다...</p>
            </div>
        );
    }

    if (error || todos.length === 0) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorIcon}>⚠️</div>
                <h2>할 일 목록을 찾을 수 없습니다</h2>
                <p>링크가 만료되었거나 삭제된 할 일입니다.</p>
                <Link href="/" className={styles.homeBtn}>
                    홈으로 가기
                </Link>
            </div>
        );
    }

    const activeCount = todos.filter(t => t.status !== "done").length;
    const isAllDone = todos.length > 0 && activeCount === 0;

    return (
        <div className={styles.container}>
            <AnimatePresence>
                {isAllDone && (
                    <motion.div
                        className={styles.successCelebration}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        🎉 모든 지시사항을 완료하셨습니다! 🎉
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.senderInfo}>
                        <span className={styles.avatar}>👤</span>
                        <div>
                            <p className={styles.senderName}>{todos[0]?.createdBy}</p>
                            <p className={styles.reqText}>요청하신 할 일 목록입니다.</p>
                        </div>
                    </div>
                </div>

                <div className={styles.statsRow}>
                    <div className={styles.statBox}>
                        <span className={styles.statLabel}>전체</span>
                        <span className={styles.statValue}>{todos.length}</span>
                    </div>
                    <div className={styles.statBox}>
                        <span className={styles.statLabel}>남음</span>
                        <span className={styles.statValue}>{activeCount}</span>
                    </div>
                </div>

                <div className={styles.todoList}>
                    {todos.map(todo => {
                        const isDone = todo.status === "done";
                        return (
                            <motion.div
                                key={todo.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`${styles.todoItem} ${isDone ? styles.doneItem : ""}`}
                            >
                                <button
                                    className={`${styles.checkbox} ${isDone ? styles.checked : ""}`}
                                    onClick={() => handleComplete(todo.id, todo.status)}
                                    aria-label="완료 토글"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </button>

                                <div className={styles.todoContent}>
                                    <h3 className={styles.todoTitle}>{todo.title}</h3>
                                    {todo.deadline && (
                                        <div className={styles.deadlineBadge}>
                                            <span className={styles.icon}>⏰</span>
                                            {format(todo.deadline, "M월 d일 a h:mm", { locale: ko })}
                                            마감
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <div className={styles.footer}>
                    <Link href="/" className={styles.openAppBtn}>
                        Your To-Do 앱 열기
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function BatchSharePage() {
    return (
        <Suspense fallback={
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p>로딩 중...</p>
            </div>
        }>
            <BatchShareContent />
        </Suspense>
    );
}
