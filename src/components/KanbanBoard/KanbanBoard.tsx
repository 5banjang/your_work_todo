"use client";

import React from "react";
import { useTodos } from "@/context/TodoContext";
import { getUrgencyLevel, formatTimeRemaining } from "@/lib/utils";
import type { TodoStatus } from "@/types/todo";
import styles from "./KanbanBoard.module.css";

const COLUMNS: { status: TodoStatus; label: string; color: string }[] = [
    { status: "todo", label: "할 일", color: "blue" },
    { status: "in_progress", label: "진행 중", color: "amber" },
    { status: "waiting", label: "상대방 완료 대기", color: "purple" },
    { status: "done", label: "최종 완료", color: "green" },
];

export default function KanbanBoard() {
    const { todos, moveTodoStatus } = useTodos();

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
                const columnTodos = todos.filter((t) => t.status === col.status);
                return (
                    <div
                        key={col.status}
                        className={styles.column}
                        onDrop={(e) => handleDrop(e, col.status)}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                    >
                        <div className={`${styles.columnHeader} ${styles[`header-${col.color}`]}`}>
                            <span className={`${styles.columnDot} ${styles[`dot-${col.color}`]}`} />
                            <span className={styles.columnLabel}>{col.label}</span>
                            <span className={styles.columnCount}>{columnTodos.length}</span>
                        </div>

                        <div className={styles.columnBody}>
                            {columnTodos.map((todo) => {
                                const urgency = getUrgencyLevel(todo.deadline);
                                const timeText = formatTimeRemaining(todo.deadline);
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
