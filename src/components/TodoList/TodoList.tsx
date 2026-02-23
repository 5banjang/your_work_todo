"use client";

import React from "react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { useTodos } from "@/context/TodoContext";
import type { Todo } from "@/types/todo";
import TodoCard from "@/components/TodoCard/TodoCard";

interface TodoListProps {
    onSettings?: (todo: Todo) => void;
}

function SortableTodoCard({ todo, onSettings }: { todo: Todo; onSettings?: (todo: Todo) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: todo.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : "auto",
    };

    return (
        <div ref={setNodeRef} style={style}>
            <TodoCard todo={todo} dragHandleProps={{ ...attributes, ...listeners }} onSettings={onSettings} />
        </div>
    );
}

export default function TodoList({ onSettings }: TodoListProps) {
    const { todos, reorderTodos, clearCompletedTodos } = useTodos();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
    );

    const activeTodos = todos.filter((t) => t.status !== "done");
    const doneTodos = todos.filter((t) => t.status === "done");

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            reorderTodos(active.id as string, over.id as string);
        }
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={activeTodos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <AnimatePresence mode="popLayout">
                    {activeTodos.map((todo, i) => (
                        <motion.div
                            key={todo.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: 200, scale: 0.9 }}
                            transition={{ delay: i * 0.05, duration: 0.25 }}
                        >
                            <SortableTodoCard todo={todo} onSettings={onSettings} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </SortableContext>

            {doneTodos.length > 0 && (
                <div style={{ marginTop: "var(--space-6)" }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "var(--space-3)",
                    }}>
                        <p
                            style={{
                                fontSize: "var(--text-xs)",
                                color: "var(--color-text-muted)",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                fontWeight: "var(--weight-semibold)",
                                margin: 0
                            }}
                        >
                            완료됨 ({doneTodos.length})
                        </p>
                        <button
                            onClick={() => {
                                if (window.confirm("완료된 모든 항목을 영구적으로 삭제하시겠습니까?")) {
                                    clearCompletedTodos();
                                }
                            }}
                            style={{
                                background: "none",
                                border: "none",
                                color: "var(--color-text-danger, #ef4444)", /* Adjust color as needed */
                                fontSize: "var(--text-xs)",
                                cursor: "pointer",
                                opacity: 0.8,
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                padding: "0.25rem 0.5rem",
                                borderRadius: "4px"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.opacity = "1"}
                            onMouseOut={(e) => e.currentTarget.style.opacity = "0.8"}
                        >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                            모두 지우기
                        </button>
                    </div>
                    {doneTodos.map((todo) => (
                        <TodoCard key={todo.id} todo={todo} />
                    ))}
                </div>
            )}
        </DndContext>
    );
}
