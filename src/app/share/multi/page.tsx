"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { db, messaging } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { getToken } from "firebase/messaging";
import type { Todo } from "@/types/todo";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import styles from "../[id]/share.module.css";
import { motion, AnimatePresence } from "framer-motion";

function SharedTodoItem({ id, permGranted, fcmToken, onRequestPush }: { id: string, permGranted: boolean, fcmToken: string | null, onRequestPush: () => void }) {
    const [todo, setTodo] = useState<Todo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string | null>(null);

    useEffect(() => {
        if (!db) {
            setError(true);
            setLoading(false);
            return;
        }

        const docRef = doc(db, "todos", id);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setTodo({
                    id: docSnap.id,
                    title: data.title,
                    description: data.description,
                    status: data.status,
                    deadline: data.deadline?.toDate ? data.deadline.toDate() : null,
                    assigneeName: data.assigneeName,
                    createdBy: data.createdBy,
                    checklist: data.checklist || [],
                } as Todo);
            } else {
                setError(true);
            }
            setLoading(false);
        }, (err) => {
            console.error(err);
            setError(true);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id]);

    useEffect(() => {
        if (!todo?.deadline || todo.status === "done") {
            setTimeLeft(null);
            return;
        }

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const distance = todo.deadline!.getTime() - now;

            if (distance < 0) {
                return "기한 만료";
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            if (days > 0) return `${days}일 ${hours}시간 남음`;
            if (hours > 0) return `${hours}시간 ${minutes}분 남음`;
            return `${minutes}분 ${seconds}초 남음`;
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [todo?.deadline, todo?.status]);

    const handleComplete = async () => {
        if (!db || !todo) return;
        setUpdating(true);
        try {
            const nickname = localStorage.getItem("your-todo-nickname") || "누군가";
            await updateDoc(doc(db, "todos", id), {
                status: "done",
                completedAt: new Date(),
                updatedAt: new Date(),
                lastCompletedBy: nickname
            });
        } catch (err) {
            console.error(err);
            alert("상태 업데이트에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <div className={styles.card} style={{ padding: '1.5rem', textAlign: 'center', color: '#888' }}>로딩 중...</div>;
    }

    if (error || !todo) {
        return null; // hide deleted/not-found items
    }

    const isDone = todo.status === "done";

    return (
        <motion.div
            className={styles.card}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{ marginBottom: '1rem', padding: '1rem' }}
        >
            <div className={styles.header} style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <span className={styles.icon}>📋</span>
                    <h2 className={styles.title} style={{ fontSize: '1.1rem', margin: 0, flex: 1 }}>{todo.title}</h2>
                </div>
            </div>

            <div className={styles.infoBox} style={{ margin: '1rem 0' }}>
                <div className={styles.infoRow} style={{ padding: '0.5rem 0' }}>
                    <span className={styles.label}>마감일</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span className={styles.value} style={{ fontSize: '0.9rem' }}>
                            {todo.deadline ? format(todo.deadline, "yyyy년 M월 d일 (EEE) a h:mm", { locale: ko }) : "지정 안 됨"}
                        </span>
                        {timeLeft && (
                            <span style={{ fontSize: '0.8rem', color: timeLeft === '기한 만료' ? '#ff4d4f' : 'var(--color-accent-cyan)', fontWeight: 600 }}>
                                ⏳ {timeLeft}
                            </span>
                        )}
                    </div>
                </div>
                {todo.assigneeName && (
                    <div className={styles.infoRow} style={{ padding: '0.5rem 0', borderTop: '1px solid var(--color-bg-tertiary)' }}>
                        <span className={styles.label}>담당자</span>
                        <span className={styles.value} style={{ fontSize: '0.9rem' }}>{todo.assigneeName}</span>
                    </div>
                )}
            </div>

            <div className={styles.actionContainer} style={{ marginTop: '0', paddingTop: '0' }}>
                {isDone ? (
                    <div style={{ color: '#00f5ff', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center', padding: '0.5rem' }}>
                        ✅ 완료됨
                    </div>
                ) : (
                    <button
                        className={styles.completeBtn}
                        onClick={handleComplete}
                        disabled={updating}
                        style={{ padding: '0.5rem' }}
                    >
                        {updating ? "처리 중..." : "✓ 완료 처리하기"}
                    </button>
                )}
            </div>
        </motion.div>
    );
}

function MultiShareContent() {
    const searchParams = useSearchParams();
    const idsParam = searchParams.get("ids");
    const ids = idsParam ? idsParam.split(",").filter(Boolean) : [];

    // Notifications State
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [permGranted, setPermGranted] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            setPermGranted(Notification.permission === "granted");
        }
    }, []);

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
                    setFcmToken(token);
                    setPermGranted(true);
                }
            }
        } catch (err) {
            console.error("Failed to get push permission:", err);
        }
    };

    if (ids.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>공유된 할 일이 없습니다. 링크를 다시 확인해주세요.</div>
            </div>
        );
    }

    return (
        <div className={styles.container} style={{ alignItems: 'flex-start', padding: '2rem 1rem' }}>
            <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
                    <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>📋 공유된 리스트</h1>
                    <button
                        className={permGranted || fcmToken ? styles.bellBtnActive : styles.bellBtn}
                        onClick={requestPushPermission}
                        type="button"
                        aria-label="알림 설정"
                        title="푸시 알림 켜기"
                        style={{ position: 'static' }}
                    >
                        {permGranted || fcmToken ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="#00f5ff" strokeWidth="2" width="20" height="20">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        )}
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {ids.map(id => (
                        <SharedTodoItem
                            key={id}
                            id={id}
                            permGranted={permGranted}
                            fcmToken={fcmToken}
                            onRequestPush={requestPushPermission}
                        />
                    ))}
                </div>

                <div className={styles.homeLinkContainer} style={{ marginTop: '2rem' }}>
                    <Link href="/" className={styles.createOwnBtn}>
                        ✨ 나만의 할 일 만들기
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function MultiSharePage() {
    return (
        <Suspense fallback={<div className={styles.container}><div className={styles.loading}>로딩 중...</div></div>}>
            <MultiShareContent />
        </Suspense>
    );
}
