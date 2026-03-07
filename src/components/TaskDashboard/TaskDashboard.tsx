"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Todo } from "@/types/todo";
import styles from "./TaskDashboard.module.css";
import TodoCard from "@/components/TodoCard/TodoCard";

interface TaskDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    /** 그룹별로 묶인 할 일 목록. key = 그룹 이름 (사람 이름) */
    groupedTasks: Record<string, Todo[]>;
    /** 대시보드 제목 (아무도 선택 안 했을 때) */
    title: string;
    /** 대시보드 아이콘 이모지 */
    icon: string;
    /** 그룹 선택 후 제목 포맷 e.g. (name) => `${name}님이 보낸 일` */
    selectedTitle: (name: string) => string;
    /** 빈 상태 아이콘 이모지 */
    emptyIcon: string;
    /** 빈 상태 메인 텍스트 */
    emptyText: string;
    /** 빈 상태 보조 텍스트 */
    emptySubText: string;
    /** TodoCard를 readOnly로 표시할지 여부 */
    readOnly?: boolean;
}

export default function TaskDashboard({
    isOpen,
    onClose,
    groupedTasks,
    title,
    icon,
    selectedTitle,
    emptyIcon,
    emptyText,
    emptySubText,
    readOnly = false,
}: TaskDashboardProps) {
    const groupNames = Object.keys(groupedTasks).sort();
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

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
                            {selectedGroup ? (
                                <button className={styles.backBtn} onClick={() => setSelectedGroup(null)}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                        <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            ) : (
                                <span className={styles.icon}>{icon}</span>
                            )}
                            {selectedGroup ? selectedTitle(selectedGroup) : title}
                        </h2>
                        <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="닫기">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    <div className={styles.content}>
                        {!selectedGroup ? (
                            groupNames.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>{emptyIcon}</div>
                                    <p>{emptyText}</p>
                                    <small>{emptySubText}</small>
                                </div>
                            ) : (
                                <div className={styles.groupGrid}>
                                    {groupNames.map(name => {
                                        const tasks = groupedTasks[name];
                                        const doneCount = tasks.filter(t => t.status === "done").length;
                                        const progress = tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0;

                                        return (
                                            <button key={name} className={styles.groupCard} onClick={() => setSelectedGroup(name)}>
                                                <div className={styles.nameRow}>
                                                    <span className={styles.name}>{name}</span>
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
                                {groupedTasks[selectedGroup]?.map(todo => (
                                    <div key={todo.id} className={styles.taskItemWrapper}>
                                        <TodoCard todo={todo} readOnly={readOnly} />
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
