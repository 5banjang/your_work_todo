"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTodos } from "@/context/TodoContext";
import { getUrgencyLevel, formatTimeRemaining } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import type { Todo } from "@/types/todo";
import styles from "./TodoCard.module.css";

interface TodoCardProps {
    todo: Todo;
    dragHandleProps?: Record<string, unknown>;
    onSettings?: (todo: Todo) => void;
    readOnly?: boolean;
}

export default function TodoCard({ todo, dragHandleProps, onSettings, readOnly }: TodoCardProps) {
    const { completeTodo, deleteTodo, updateTodo, uncompleteTodo } = useTodos();
    const { t } = useLanguage();
    const [timeText, setTimeText] = useState("");
    const urgency = getUrgencyLevel(todo.deadline);

    // Update timer text every 30s
    useEffect(() => {
        const update = () => setTimeText(formatTimeRemaining(todo.deadline, t));
        update();
        const interval = setInterval(update, 30000);
        return () => clearInterval(interval);
    }, [todo.deadline, t]);

    const handleDelete = () => {
        deleteTodo(todo.id);
        if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
    };



    const handleComplete = () => {
        completeTodo(todo.id);
        if (navigator.vibrate) navigator.vibrate(50);
    };

    if (todo.status === "done") {
        return (
            <motion.div
                className={`${styles.card} ${styles.cardDone}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 0.6, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
            >
                <div className={styles.dragHandle} {...dragHandleProps}>
                    <span>⠿</span>
                </div>
                <div className={styles.content}>
                    <span className={styles.titleDone}>{todo.title}</span>
                    <div className={styles.doneActions}>
                        <span className={styles.doneLabel}>{t("card.doneLabel")}</span>
                        {!readOnly && (
                            <button
                                className={styles.undoBtn}
                                onClick={() => {
                                    uncompleteTodo(todo.id);
                                    if (navigator.vibrate) navigator.vibrate(30);
                                }}
                                type="button"
                                aria-label={t("card.undo")}
                                title={t("card.undo")}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                    <path d="M3 12a9 9 0 1 1 9 9" strokeLinecap="round" />
                                    <path d="M3 21v-6h6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                {t("card.undo")}
                            </button>
                        )}
                        <button
                            className={`${styles.btn} ${styles.btnDanger}`}
                            style={{ padding: "4px 8px", fontSize: "0.75rem", marginLeft: "8px" }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete();
                            }}
                            type="button"
                            aria-label={t("card.delete")}
                            title={t("card.delete")}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {t("card.delete")}
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div className={`${styles.card} ${styles[`urgency-${urgency}`]}`}>
            <div className={styles.dragHandle} {...dragHandleProps}>
                <span>⠿</span>
            </div>
            <div className={styles.content}>
                <div className={styles.header}>
                    <span className={styles.title}>{todo.title}</span>
                    <div className={styles.headerActions}>

                        {todo.assigneeName && (
                            <span className={styles.assignee}>
                                <span className={styles.avatar}>
                                    {todo.assigneeName.charAt(0)}
                                </span>
                            </span>
                        )}
                    </div>
                </div>
                <div className={styles.meta}>
                    {timeText && (
                        <span className={`${styles.timer} ${styles[`timer-${urgency}`]}`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 6v6l4 2" strokeLinecap="round" />
                            </svg>
                            {timeText}
                        </span>
                    )}
                    {todo.checklist.length > 0 && (
                        <span className={styles.checklist}>
                            ✓ {todo.checklist.filter((c) => c.completed).length}/{todo.checklist.length}
                        </span>
                    )}

                </div>

                <div className={styles.explicitActions}>
                    {!readOnly && (
                        <button className={`${styles.btn} ${styles.btnNeutral}`} onClick={() => onSettings && onSettings(todo)} type="button">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                            {t("card.settings")}
                        </button>
                    )}

                    <button className={`${styles.btn} ${styles.btnDanger}`} onClick={handleDelete} type="button">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {t("card.delete")}
                    </button>

                    {!readOnly && (
                        <button className={`${styles.btn} ${styles.btnSuccess}`} onClick={handleComplete} type="button">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14">
                                <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {t("card.complete")}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
