"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTodos } from "@/context/TodoContext";
import type { Todo, ChecklistItem } from "@/types/todo";
import { generateId } from "@/lib/utils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import styles from "./ShareModal.module.css";

interface ShareModalProps {
    todo: Todo;
    onClose: () => void;
}

export default function ShareModal({ todo, onClose }: ShareModalProps) {
    const { updateTodo, deleteTodo } = useTodos();
    const initDate = todo.deadline ? new Date(todo.deadline) : new Date();

    const [targetYear, setTargetYear] = useState(initDate.getFullYear().toString());
    const [targetMonth, setTargetMonth] = useState((initDate.getMonth() + 1).toString().padStart(2, "0"));
    const [targetDate, setTargetDate] = useState(initDate.getDate().toString().padStart(2, "0"));
    const initHour = initDate.getHours();
    const [timeFormat, setTimeFormat] = useState(initHour >= 12 ? "PM" : "AM");
    const [targetHour, setTargetHour] = useState((initHour % 12 === 0 ? 12 : initHour % 12).toString().padStart(2, "0"));
    const [targetMinute, setTargetMinute] = useState((Math.floor(initDate.getMinutes() / 10) * 10).toString().padStart(2, "0"));
    const [remindMinutes, setRemindMinutes] = useState("30");
    const [copied, setCopied] = useState(false);

    const handleSetToday = useCallback(() => {
        const now = new Date();
        setTargetYear(now.getFullYear().toString());
        setTargetMonth((now.getMonth() + 1).toString().padStart(2, "0"));
        setTargetDate(now.getDate().toString().padStart(2, "0"));
        const h = now.getHours();
        setTimeFormat(h >= 12 ? "PM" : "AM");
        setTargetHour((h % 12 === 0 ? 12 : h % 12).toString().padStart(2, "0"));
        setTargetMinute((Math.floor(now.getMinutes() / 10) * 10).toString().padStart(2, "0"));
    }, []);



    const handleSave = useCallback(() => {
        let deadlineDate: Date | null = null;
        if (targetYear && targetMonth && targetDate && targetHour && targetMinute) {
            let h = parseInt(targetHour);
            if (timeFormat === "PM" && h !== 12) h += 12;
            if (timeFormat === "AM" && h === 12) h = 0;
            deadlineDate = new Date(`${targetYear}-${targetMonth}-${targetDate}T${h.toString().padStart(2, "0")}:${targetMinute}:00`);
        }

        let remindAt: Date | null = null;
        if (deadlineDate && remindMinutes) {
            remindAt = new Date(deadlineDate.getTime() - parseInt(remindMinutes) * 60 * 1000);
        }

        updateTodo(todo.id, {
            checklist: [],
            deadline: deadlineDate,
            remindAt,
            shareLink: typeof window !== "undefined" ? `${window.location.origin}/share/${todo.id}` : "",
        });

        onClose();
    }, [todo.id, targetYear, targetMonth, targetDate, targetHour, targetMinute, timeFormat, remindMinutes, updateTodo, onClose]);

    const handleDelete = useCallback(() => {
        deleteTodo(todo.id);
        onClose();
    }, [todo.id, deleteTodo, onClose]);

    const handleCopyLink = useCallback(() => {
        const url = `${window.location.origin}/share/${todo.id}`;
        const text = `[할 일 요청]\n${todo.title}\n\n👉 링크에서 확인 및 완료하기:\n${url}`;

        if (navigator.share) {
            navigator.share({
                title: "할 일 요청",
                text: text,
            }).catch(() => { });
        } else {
            navigator.clipboard.writeText(text).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    }, [todo.title, todo.id]);

    return (
        <AnimatePresence>
            <motion.div
                className={styles.backdrop}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className={styles.modal}
                    initial={{ opacity: 0, y: 60, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 60, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={styles.header}>
                        <h2 className={styles.title}>작업 설정</h2>
                        <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="닫기">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    {/* Task Title */}
                    <div className={styles.taskTitle}>
                        <span className={styles.taskIcon}>📋</span>
                        {todo.title}
                    </div>

                    {/* Scrollable content */}
                    <div className={styles.scrollContent}>
                        {/* Deadline */}
                        <div className={styles.field}>
                            <label className={styles.label}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                    <path d="M16 2v4M8 2v4M3 10h18" />
                                </svg>
                                마감일
                            </label>
                            <div className={styles.dateRow}>
                                <select value={targetYear} onChange={(e) => setTargetYear(e.target.value)} className={styles.selectSmall}>
                                    {[0, 1, 2].map((i) => {
                                        const y = (new Date().getFullYear() + i).toString();
                                        return <option key={y} value={y}>{y}년</option>;
                                    })}
                                </select>
                                <select value={targetMonth} onChange={(e) => setTargetMonth(e.target.value)} className={styles.selectSmall}>
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const m = (i + 1).toString().padStart(2, "0");
                                        return <option key={m} value={m}>{i + 1}월</option>;
                                    })}
                                </select>
                                <select value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className={styles.selectSmall}>
                                    {Array.from({ length: 31 }, (_, i) => {
                                        const d = (i + 1).toString().padStart(2, "0");
                                        return <option key={d} value={d}>{i + 1}일</option>;
                                    })}
                                </select>
                            </div>
                            <div className={styles.dateRow}>
                                <select value={timeFormat} onChange={(e) => setTimeFormat(e.target.value)} className={styles.selectSmall}>
                                    <option value="AM">오전</option>
                                    <option value="PM">오후</option>
                                </select>
                                <select value={targetHour} onChange={(e) => setTargetHour(e.target.value)} className={styles.selectSmall}>
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const h = (i === 0 ? 12 : i).toString().padStart(2, "0");
                                        return <option key={h} value={h}>{h}시</option>;
                                    })}
                                </select>
                                <select value={targetMinute} onChange={(e) => setTargetMinute(e.target.value)} className={styles.selectSmall}>
                                    {["00", "10", "20", "30", "40", "50"].map((m) => (
                                        <option key={m} value={m}>{m}분</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Remind Timer */}
                        <div className={styles.field}>
                            <label className={styles.label}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 6v6l4 2" strokeLinecap="round" />
                                </svg>
                                리마인드
                            </label>
                            <select
                                value={remindMinutes}
                                onChange={(e) => setRemindMinutes(e.target.value)}
                                className={styles.select}
                            >
                                <option value="10">10분 전</option>
                                <option value="30">30분 전</option>
                                <option value="60">1시간 전</option>
                                <option value="180">3시간 전</option>
                                <option value="1440">1일 전</option>
                            </select>
                        </div>



                        {/* Removed Location Section */}

                    </div>

                    <div className={styles.actions}>
                        <button className={`${styles.actionBtn} ${styles.btnNeutral}`} onClick={handleSetToday} type="button">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <path d="M16 2v4M8 2v4M3 10h18" />
                                <circle cx="12" cy="14" r="2" />
                            </svg>
                            오늘
                        </button>
                        <button className={`${styles.actionBtn} ${styles.btnDanger}`} onClick={handleDelete} type="button">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            삭제
                        </button>
                        <button className={`${styles.actionBtn} ${styles.btnNeutral}`} onClick={handleCopyLink} type="button">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            {copied ? "복사됨" : "공유"}
                        </button>
                        <button className={`${styles.actionBtn} ${styles.btnSuccess}`} onClick={handleSave} type="button">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                <polyline points="17 21 17 13 7 13 7 21" />
                                <polyline points="7 3 7 8 15 8" />
                            </svg>
                            저장
                        </button>
                    </div>
                </motion.div>
            </motion.div>

        </AnimatePresence>
    );
}
