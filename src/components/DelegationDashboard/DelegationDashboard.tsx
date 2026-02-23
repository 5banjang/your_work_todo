"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTodos } from "@/context/TodoContext";
import type { Todo } from "@/types/todo";
import styles from "./DelegationDashboard.module.css";
import TodoCard from "@/components/TodoCard/TodoCard";

interface DelegationDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DelegationDashboard({ isOpen, onClose }: DelegationDashboardProps) {
    const { todos } = useTodos();
    const myNickname = typeof window !== "undefined" ? localStorage.getItem("your-todo-nickname") || "누군가" : "누군가";

    // Get all tasks that I have delegated to others, OR shared via batch link
    const myDelegatedTasks = todos.filter(t => t.createdBy === myNickname && (t.batchId || (t.assigneeName && t.assigneeName !== myNickname)));

    // Group by assignee name
    const groupedByAssignee = myDelegatedTasks.reduce((acc, t) => {
        const name = t.assigneeName || "⏳ 수신 대기중 (미확인)";
        if (!acc[name]) acc[name] = [];
        acc[name].push(t);
        return acc;
    }, {} as Record<string, Todo[]>);

    const assignees = Object.keys(groupedByAssignee).sort();

    const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);

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
                            {selectedAssignee ? (
                                <button className={styles.backBtn} onClick={() => setSelectedAssignee(null)}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                        <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            ) : (
                                <span className={styles.icon}>📤</span>
                            )}
                            {selectedAssignee ? `${selectedAssignee}님의 지시 현황` : "지시 현황판 (보낸 일)"}
                        </h2>
                        <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="닫기">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    <div className={styles.content}>
                        {!selectedAssignee ? (
                            assignees.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>📬</div>
                                    <p>아직 다른 사람에게 전달한 할 일이 없습니다.</p>
                                    <small>메인 리스트에서 여러 항목을 체크한 뒤 [공유하기]를 눌러 링크를 전달해보세요.</small>
                                </div>
                            ) : (
                                <div className={styles.assigneeGrid}>
                                    {assignees.map(name => {
                                        const tasks = groupedByAssignee[name];
                                        const doneCount = tasks.filter(t => t.status === "done").length;
                                        const progress = tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0;

                                        return (
                                            <button key={name} className={styles.assigneeCard} onClick={() => setSelectedAssignee(name)}>
                                                <div className={styles.assigneeNameRow}>
                                                    <span className={styles.assigneeName}>{name}</span>
                                                    <span className={styles.taskCount}>{doneCount} / {tasks.length} 개 완료</span>
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
                                {groupedByAssignee[selectedAssignee]?.map(todo => (
                                    <div key={todo.id} className={styles.taskItemWrapper}>
                                        <TodoCard todo={todo} readOnly={true} />
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
