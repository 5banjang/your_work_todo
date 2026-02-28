"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTodos } from "@/context/TodoContext";
import { useLanguage } from "@/context/LanguageContext";
import type { Todo } from "@/types/todo";
import styles from "./ReceivedTasksDashboard.module.css";
import TodoCard from "@/components/TodoCard/TodoCard";

interface ReceivedTasksDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ReceivedTasksDashboard({ isOpen, onClose }: ReceivedTasksDashboardProps) {
    const { todos } = useTodos();
    const { t: tr } = useLanguage();
    const myNickname = typeof window !== "undefined" ? localStorage.getItem("your-todo-nickname") || tr("notification.someone") : tr("notification.someone");

    // Get all tasks that are assigned to ME, but NOT created by me (unless it's a batch share I accepted from myself for some reason, but mainly it's tracking Inbox)
    const myReceivedTasks = todos.filter(t => t.assigneeName === myNickname && t.createdBy !== myNickname);

    // Group by sender (createdBy)
    const groupedBySender = myReceivedTasks.reduce((acc, t) => {
        const sender = t.createdBy || tr("notification.someone");
        if (!acc[sender]) acc[sender] = [];
        acc[sender].push(t);
        return acc;
    }, {} as Record<string, Todo[]>);

    const senders = Object.keys(groupedBySender).sort();

    const [selectedSender, setSelectedSender] = useState<string | null>(null);

    if (!isOpen) return null;

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
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={styles.header}>
                        <h2 className={styles.title}>
                            {selectedSender ? (
                                <button className={styles.backBtn} onClick={() => setSelectedSender(null)}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                        <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            ) : (
                                <span className={styles.icon}>📥</span>
                            )}
                            {selectedSender ? `${selectedSender}${tr("received.fromSender")}` : tr("received.inboxTitle")}
                        </h2>
                        <button className={styles.closeBtn} onClick={onClose} type="button" aria-label={tr("settings.close")}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    <div className={styles.content}>
                        {!selectedSender ? (
                            senders.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>📭</div>
                                    <p>{tr("received.emptyMsg")}</p>
                                    <small>{tr("received.emptyHint")}</small>
                                </div>
                            ) : (
                                <div className={styles.senderGrid}>
                                    {senders.map(sender => {
                                        const tasks = groupedBySender[sender];
                                        const doneCount = tasks.filter(t => t.status === "done").length;
                                        const progress = tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0;

                                        return (
                                            <button key={sender} className={styles.senderCard} onClick={() => setSelectedSender(sender)}>
                                                <div className={styles.senderNameRow}>
                                                    <span className={styles.senderName}>{sender}</span>
                                                    <span className={styles.taskCount}>{doneCount} / {tasks.length} {tr("delegation.progress")}</span>
                                                </div>
                                                <div className={styles.progressBarBg}>
                                                    <div className={styles.progressBarFill} style={{ width: `${progress}%` }} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )
                        ) : (
                            <div className={styles.taskList}>
                                {groupedBySender[selectedSender]?.map(todo => (
                                    <div key={todo.id} className={styles.taskItemWrapper}>
                                        <TodoCard todo={todo} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
