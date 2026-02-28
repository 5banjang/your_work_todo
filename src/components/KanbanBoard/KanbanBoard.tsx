"use client";

import React from "react";
import { useTodos } from "@/context/TodoContext";
import { useLanguage } from "@/context/LanguageContext";
import { getUrgencyLevel, formatTimeRemaining } from "@/lib/utils";
import type { TodoStatus } from "@/types/todo";
import styles from "./KanbanBoard.module.css";

export default function KanbanBoard() {
    const { todos, moveTodoStatus, clearCompletedTodos } = useTodos();
    const { t } = useLanguage();

    const COLUMNS: { status: TodoStatus; label: string; color: string }[] = [
        { status: "todo", label: t("kanban.todo"), color: "blue" },
        { status: "in_progress", label: t("kanban.progress"), color: "amber" },
        { status: "waiting", label: t("kanban.waitingFull"), color: "purple" },
        { status: "done", label: t("kanban.doneFull"), color: "green" },
    ];

    const myNickname = typeof window !== "undefined" ? localStorage.getItem("your-todo-nickname") || t("notification.someone") : t("notification.someone");
    const { user } = useTodos();

    const myTodos = todos.filter((t) => {
        if (user) {
            const sentOutbox = t.createdBy === myNickname && !!t.batchId;
            const manuallyDelegated = t.createdBy === myNickname && t.assigneeName && t.assigneeName !== myNickname;
            return !sentOutbox && !manuallyDelegated;
        }

        const involvesMe = t.createdBy === myNickname || t.createdBy === "me" || t.assigneeName === myNickname;
        if (!involvesMe) return false;

        const sentOutbox = t.createdBy === myNickname && !!t.batchId;
        const manuallyDelegated = t.createdBy === myNickname && t.assigneeName && t.assigneeName !== myNickname;

        return !sentOutbox && !manuallyDelegated;
    });

    const handleDrop = (e: React.DragEvent, status: TodoStatus) => {
        e.preventDefault();
        const todoId = e.dataTransfer.getData("text/plain");
        if (todoId) moveTodoStatus(todoId, status);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.currentTarget.classList.add(styles.columnDragOver);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.currentTarget.classList.remove(styles.columnDragOver);
    };

    const handleDragStart = (e: React.DragEvent, todoId: string) => {
        e.dataTransfer.setData("text/plain", todoId);
        e.dataTransfer.effectAllowed = "move";
    };

    return (
        <div className={styles.board}>
            {COLUMNS.map((col) => {
                const columnTodos = myTodos.filter((t) => t.status === col.status);
                return (
                    <div
                        key={col.status}
                        className={styles.column}
                        onDrop={(e) => handleDrop(e, col.status)}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                    >
                        <div className={`${styles.columnHeader} ${styles[`header-${col.color}`]}`}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className={`${styles.columnDot} ${styles[`dot-${col.color}`]}`} />
                                <span className={styles.columnLabel}>{col.label}</span>
                                <span className={styles.columnCount}>{columnTodos.length}</span>
                            </div>

                            {col.status === 'done' && columnTodos.length > 0 && (
                                <button
                                    onClick={() => {
                                        if (window.confirm(t("list.confirmClear"))) {
                                            clearCompletedTodos();
                                        }
                                    }}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "var(--color-text-danger, #ef4444)",
                                        cursor: "pointer",
                                        opacity: 0.8,
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "4px",
                                        borderRadius: "4px"
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.opacity = "1"}
                                    onMouseOut={(e) => e.currentTarget.style.opacity = "0.8"}
                                    title={t("kanban.clearTitle")}
                                >
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        <div className={styles.columnBody}>
                            {columnTodos.map((todo) => {
                                const urgency = getUrgencyLevel(todo.deadline);
                                const timeText = formatTimeRemaining(todo.deadline, t);
                                return (
                                    <div
                                        key={todo.id}
                                        className={styles.kanbanCard}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, todo.id)}
                                    >
                                        <span className={styles.kanbanTitle}>{todo.title}</span>
                                        <div className={styles.kanbanMeta}>
                                            {timeText && (
                                                <span className={`${styles.kanbanTimer} ${styles[`timer-${urgency}`]}`}>
                                                    {timeText}
                                                </span>
                                            )}
                                            {todo.assigneeName && (
                                                <span className={styles.kanbanAvatar}>
                                                    {todo.assigneeName.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
