"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTodos } from "@/context/TodoContext";
import { useLanguage } from "@/context/LanguageContext";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { formatTimeRemaining } from "@/lib/utils";
import styles from "./ShareListModal.module.css";

interface ShareListModalProps {
    onClose: () => void;
}

export default function ShareListModal({ onClose }: ShareListModalProps) {
    const { todos, updateTodo } = useTodos();
    const { t: tr } = useLanguage();
    const [copied, setCopied] = useState(false);
    const myNickname = typeof window !== "undefined" ? localStorage.getItem("your-todo-nickname") || tr("notification.someone") : tr("notification.someone");

    const myTodos = useMemo(() => {
        return todos.filter((t) => {
            const involvesMe = t.createdBy === myNickname || t.createdBy === "me" || t.assigneeName === myNickname;
            if (!involvesMe) return false;

            const sentOutbox = t.createdBy === myNickname && !!t.batchId;
            const manuallyDelegated = t.createdBy === myNickname && t.assigneeName && t.assigneeName !== myNickname;

            return !sentOutbox && !manuallyDelegated;
        });
    }, [todos, myNickname]);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(
        new Set(myTodos.filter((t) => t.status !== "done").map((t) => t.id))
    );

    const activeTodos = myTodos.filter((t) => t.status !== "done");
    const doneTodos = myTodos.filter((t) => t.status === "done");

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const toggleAll = useCallback(() => {
        if (selectedIds.size === myTodos.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(myTodos.map((t) => t.id)));
        }
    }, [selectedIds.size, myTodos]);

    const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);

    // Generate shareable link and text
    const shareText = useMemo(() => {
        const selected = myTodos.filter((t) => selectedIds.has(t.id));
        if (selected.length === 0) return "";

        // Use a consistent batchId while the modal is open to prevent changing the link
        const batchIdToken = currentBatchId || Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        if (!currentBatchId) setCurrentBatchId(batchIdToken);

        const shareUrl = `${window.location.origin}/share/batch/${batchIdToken}`;

        const lines: string[] = [];
        lines.push(tr("shareList.shareHeader"));
        lines.push(`${tr("shareList.total")} ${selected.length}${tr("shareList.items")} (${tr("shareList.active")} ${selected.filter(t => t.status !== "done").length}${tr("shareList.items")})`);
        lines.push("");
        lines.push(tr("shareList.linkDesc"));
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
        await processBatchSave();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: tr("shareList.shareTitle"),
                    text: shareText,
                });
                onClose();
            } catch {
                onClose();
            }
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                setCopied(true);
                setTimeout(() => {
                    setCopied(false);
                    onClose();
                }, 1000);
            });
        }
    }, [shareText, processBatchSave, onClose]);

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
                        <h2 className={styles.title}>{tr("shareList.title")}</h2>
                        <button className={styles.closeBtn} onClick={onClose} type="button" aria-label={tr("settings.close")}>
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
                            {tr("shareList.selectAll")} ({selectedIds.size}/{todos.length})
                        </button>
                    </div>

                    {/* Scrollable list */}
                    <div className={styles.scrollContent}>
                        {/* Active todos */}
                        {activeTodos.length > 0 && (
                            <div className={styles.section}>
                                <p className={styles.sectionLabel}>{tr("shareList.inProgress")} ({activeTodos.length})</p>
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
                                                    : tr("shareList.noDeadline")
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
                                <p className={styles.sectionLabel}>{tr("shareList.done")} ({doneTodos.length})</p>
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

                    </div>

                    {/* Share actions */}
                    <div className={styles.actions}>
                        <button className={styles.shareBtn} onClick={handleNativeShare} type="button" style={{ width: '100%', padding: '16px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" strokeLinecap="round" />
                                <polyline points="16,6 12,2 8,6" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" />
                            </svg>
                            {copied ? tr("shareList.copiedDone") : tr("shareList.share")}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
