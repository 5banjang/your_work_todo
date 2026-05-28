"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTodos } from "@/context/TodoContext";
import TodoCard from "@/components/TodoCard/TodoCard";
import styles from "@/components/TaskDashboard/TaskDashboard.module.css";

interface PersonalTasksDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PersonalTasksDashboard({ isOpen, onClose }: PersonalTasksDashboardProps) {
    const { todos } = useTodos();

    if (!isOpen) return null;

    // 내 할 일 (category가 'personal'인 것)
    const personalTasks = todos.filter(t => t.category === "personal");

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
                            <span className={styles.icon}>🔒</span>
                            내 할 일 (비공개)
                        </h2>
                        <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="닫기">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    <div className={styles.content}>
                        {personalTasks.length === 0 ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>📝</div>
                                <p>아직 나만의 할 일이 없습니다.</p>
                                <small>할 일을 입력할 때 입력창의 🔒 자물쇠 아이콘을 켜보세요.</small>
                            </div>
                        ) : (
                            <div className={styles.taskList}>
                                {personalTasks.map(todo => (
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
