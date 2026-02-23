"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTodos } from "@/context/TodoContext";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { formatTimeRemaining } from "@/lib/utils";
import styles from "./ShareListModal.module.css";

interface ShareListModalProps {
    onClose: () => void;
}

export default function ShareListModal({ onClose }: ShareListModalProps) {
    const { todos, updateTodo } = useTodos();
    const [copied, setCopied] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(
        new Set(todos.filter((t) => t.status !== "done").map((t) => t.id))
    );

    const activeTodos = todos.filter((t) => t.status !== "done");
    const doneTodos = todos.filter((t) => t.status === "done");

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const toggleAll = useCallback(() => {
        if (selectedIds.size === todos.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(todos.map((t) => t.id)));
        }
    }, [selectedIds.size, todos]);

    const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);

    // Generate shareable link and text
    const shareText = useMemo(() => {
        const selected = todos.filter((t) => selectedIds.has(t.id));
        if (selected.length === 0) return "";

        // Use a consistent batchId while the modal is open to prevent changing the link
        const batchIdToken = currentBatchId || Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        if (!currentBatchId) setCurrentBatchId(batchIdToken);

        const shareUrl = `${window.location.origin}/share/batch/${batchIdToken}`;

        const lines: string[] = [];
        lines.push("📋 할 일 리스트 공유");
        lines.push(`총 ${selected.length}건 (진행 중 ${selected.filter(t => t.status !== "done").length}건)`);
        lines.push("");
        lines.push("👉 링크에서 모두 확인 및 완료하기:");
        lines.push(shareUrl);

        return lines.join("\n");
    }, [todos, selectedIds]);

    const processBatchSave = useCallback(async () => {
        if (!currentBatchId || selectedIds.size === 0) return;

        // Update all selected tasks with the generated batchId
        const promises = Array.from(selectedIds).map(id => {
            return updateTodo(id, { batchId: currentBatchId });
        });
        await Promise.all(promises);
    }, [selectedIds, currentBatchId, updateTodo]);

    const handleCopy = useCallback(async () => {
        await processBatchSave();
        navigator.clipboard.writeText(shareText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [shareText, processBatchSave]);

    const handleNativeShare = useCallback(async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "할 일 리스트",
                    text: shareText,
                });
            } catch {
                // User cancelled
            }
        } else {
            handleCopy();
        }
    }, [shareText, handleCopy]);

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
                        <h2 className={styles.title}>📋 리스트 공유</h2>
                        <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="닫기">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    {/* Select all */}
                    <div className={styles.selectAll}>
                        <button
                            className={styles.selectAllBtn}
                            onClick={toggleAll}
                            type="button"
                        >
                            <span className={`${styles.checkbox} ${selectedIds.size === todos.length ? styles.checked : ""}`}>
                                {selectedIds.size === todos.length ? "✓" : ""}
                            </span>
                            전체 선택 ({selectedIds.size}/{todos.length})
                        </button>
                    </div>

                    {/* Scrollable list */}
                    <div className={styles.scrollContent}>
                        {/* Active todos */}
                        {activeTodos.length > 0 && (
                            <div className={styles.section}>
                                <p className={styles.sectionLabel}>진행 중 ({activeTodos.length})</p>
                                {activeTodos.map((todo) => (
                                    <button
                                        key={todo.id}
                                        className={styles.todoRow}
                                        onClick={() => toggleSelect(todo.id)}
                                        type="button"
                                    >
                                        <span className={`${styles.checkbox} ${selectedIds.has(todo.id) ? styles.checked : ""}`}>
                                            {selectedIds.has(todo.id) ? "✓" : ""}
                                        </span>
                                        <div className={styles.todoInfo}>
                                            <span className={styles.todoTitle}>{todo.title}</span>
                                            <span className={styles.todoMeta}>
                                                {todo.deadline
                                                    ? format(todo.deadline, "M/d a h:mm", { locale: ko })
                                                    : "마감일 없음"
                                                }
                                                {todo.assigneeName && ` · ${todo.assigneeName}`}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Done todos */}
                        {doneTodos.length > 0 && (
                            <div className={styles.section}>
                                <p className={styles.sectionLabel}>완료 ({doneTodos.length})</p>
                                {doneTodos.map((todo) => (
                                    <button
                                        key={todo.id}
                                        className={`${styles.todoRow} ${styles.todoRowDone}`}
                                        onClick={() => toggleSelect(todo.id)}
                                        type="button"
                                    >
                                        <span className={`${styles.checkbox} ${selectedIds.has(todo.id) ? styles.checked : ""}`}>
                                            {selectedIds.has(todo.id) ? "✓" : ""}
                                        </span>
                                        <div className={styles.todoInfo}>
                                            <span className={styles.todoTitleDone}>{todo.title}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Preview */}
                        {selectedIds.size > 0 && (
                            <div className={styles.previewSection}>
                                <p className={styles.sectionLabel}>미리보기</p>
                                <pre className={styles.previewText}>{shareText}</pre>
                            </div>
                        )}
                    </div>

                    {/* Share actions */}
                    <div className={styles.actions}>
                        <button className={styles.copyBtn} onClick={handleCopy} type="button">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <rect x="9" y="9" width="13" height="13" rx="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            {copied ? "복사됨!" : "텍스트 복사"}
                        </button>
                        <button className={styles.shareBtn} onClick={handleNativeShare} type="button">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" strokeLinecap="round" />
                                <polyline points="16,6 12,2 8,6" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" />
                            </svg>
                            공유하기
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
