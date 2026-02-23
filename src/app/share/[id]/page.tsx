"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
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
                    <span className={styles.icon}>📋</span>
                    <h1 className={styles.title}>{todo.title}</h1>
                </div>

                <div className={styles.infoBox}>
                    <div className={styles.infoRow}>
                        <span className={styles.label}>마감일</span>
                        <span className={styles.value}>
                            {todo.deadline ? format(todo.deadline, "yyyy년 M월 d일 (EEE) a h:mm", { locale: ko }) : "지정 안 됨"}
                        </span>
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
            </motion.div>
        </div>
    );
}
