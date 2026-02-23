"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { db, messaging } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { getToken } from "firebase/messaging";
import type { Todo } from "@/types/todo";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import styles from "./share.module.css";
import { motion } from "framer-motion";

export default function SharePage() {
    const params = useParams();
    const id = params.id as string;

    const [todo, setTodo] = useState<Todo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string | null>(null);

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
            await updateDoc(doc(db, "todos", id), {
                status: "done",
                completedAt: new Date(),
                updatedAt: new Date()
            });
        } catch (err) {
            console.error(err);
            alert("상태 업데이트에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>정보를 불러오는 중입니다...</div>
            </div>
        );
    }

    if (error || !todo) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>해당 할 일을 찾을 수 없거나 삭제되었습니다.</div>
            </div>
        );
    }

    const isDone = todo.status === "done";

    return (
        <div className={styles.container}>
            <motion.div
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className={styles.icon}>📋</span>
                        <h1 className={styles.title}>{todo.title}</h1>
                    </div>

                    <div className={styles.headerRight}>
                        <button
                            className={permGranted || fcmToken ? styles.bellBtnActive : styles.bellBtn}
                            onClick={requestPushPermission}
                            type="button"
                            aria-label="알림 설정"
                            title="푸시 알림 켜기"
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
                </div>

                <div className={styles.infoBox}>
                    <div className={styles.infoRow}>
                        <span className={styles.label}>마감일</span>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <span className={styles.value}>
                                {todo.deadline ? format(todo.deadline, "yyyy년 M월 d일 (EEE) a h:mm", { locale: ko }) : "지정 안 됨"}
                            </span>
                            {timeLeft && (
                                <span style={{ fontSize: '0.85rem', color: timeLeft === '기한 만료' ? '#ff4d4f' : 'var(--color-accent-cyan)', fontWeight: 600 }}>
                                    ⏳ {timeLeft}
                                </span>
                            )}
                        </div>
                    </div>
                    {todo.assigneeName && (
                        <div className={styles.infoRow}>
                            <span className={styles.label}>담당자</span>
                            <span className={styles.value}>{todo.assigneeName}</span>
                        </div>
                    )}
                </div>

                <div className={styles.actionContainer}>
                    {isDone ? (
                        <motion.div
                            className={styles.doneMessage}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                        >
                            ✅ 처리가 완료되었습니다
                        </motion.div>
                    ) : (
                        <button
                            className={styles.completeBtn}
                            onClick={handleComplete}
                            disabled={updating}
                        >
                            {updating ? "처리 중..." : "✓ 완료 처리하기"}
                        </button>
                    )}
                </div>

                <div className={styles.homeLinkContainer}>
                    <Link href="/" className={styles.createOwnBtn}>
                        ✨ 나만의 할 일 만들기
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
