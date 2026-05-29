"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTodos } from "@/context/TodoContext";
import type { Todo } from "@/types/todo";
import { generateId } from "@/lib/utils";
import styles from "./ShareModal.module.css";

interface ShareModalProps {
    todo: Todo;
    onClose: () => void;
}

export default function ShareModal({ todo, onClose }: ShareModalProps) {
    const { updateTodo, deleteTodo } = useTodos();
    const initDate = todo.deadline ? new Date(todo.deadline) : new Date();

    const [targetYear, setTargetYear] = useState(initDate.getFullYear().toString());
    const [targetMonth, setTargetMonth] = useState((initDate.getMonth() + 1).toString().padStart(2, "0"));
    const [targetDate, setTargetDate] = useState(initDate.getDate().toString().padStart(2, "0"));
    const initHour = initDate.getHours();
    const [timeFormat, setTimeFormat] = useState(initHour >= 12 ? "PM" : "AM");
    const [targetHour, setTargetHour] = useState((initHour % 12 === 0 ? 12 : initHour % 12).toString().padStart(2, "0"));
    const [targetMinute, setTargetMinute] = useState((Math.floor(initDate.getMinutes() / 10) * 10).toString().padStart(2, "0"));
    const [remindMinutes, setRemindMinutes] = useState("30");
    const [copied, setCopied] = useState(false);

    // Advanced Sharing state
    const [templateCopied, setTemplateCopied] = useState(false);
    const [batchNicknames, setBatchNicknames] = useState("");
    const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
    const [generatedBatchLinks, setGeneratedBatchLinks] = useState<{ name: string; url: string }[]>([]);
    const [allBatchCopied, setAllBatchCopied] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleSetToday = useCallback(() => {
        const now = new Date();
        setTargetYear(now.getFullYear().toString());
        setTargetMonth((now.getMonth() + 1).toString().padStart(2, "0"));
        setTargetDate(now.getDate().toString().padStart(2, "0"));
        const h = now.getHours();
        setTimeFormat(h >= 12 ? "PM" : "AM");
        setTargetHour((h % 12 === 0 ? 12 : h % 12).toString().padStart(2, "0"));
        setTargetMinute((Math.floor(now.getMinutes() / 10) * 10).toString().padStart(2, "0"));
    }, []);

    const handleSave = useCallback(() => {
        let deadlineDate: Date | null = null;
        if (targetYear && targetMonth && targetDate && targetHour && targetMinute) {
            let h = parseInt(targetHour);
            if (timeFormat === "PM" && h !== 12) h += 12;
            if (timeFormat === "AM" && h === 12) h = 0;
            deadlineDate = new Date(`${targetYear}-${targetMonth}-${targetDate}T${h.toString().padStart(2, "0")}:${targetMinute}:00`);
        }

        let remindAt: Date | null = null;
        if (deadlineDate && remindMinutes) {
            remindAt = new Date(deadlineDate.getTime() - parseInt(remindMinutes) * 60 * 1000);
        }

        updateTodo(todo.id, {
            checklist: [],
            deadline: deadlineDate,
            remindAt,
            shareLink: typeof window !== "undefined" ? `${window.location.origin}/share/${todo.id}` : "",
        });

        onClose();
    }, [todo.id, targetYear, targetMonth, targetDate, targetHour, targetMinute, timeFormat, remindMinutes, updateTodo, onClose]);

    const handleDelete = useCallback(() => {
        deleteTodo(todo.id);
        onClose();
    }, [todo.id, deleteTodo, onClose]);

    const handleCopyLink = useCallback(() => {
        const url = `${window.location.origin}/share/${todo.id}`;
        const text = `[할 일 요청]\n${todo.title}\n\n👉 링크에서 확인 및 완료하기:\n${url}`;

        if (navigator.share) {
            navigator.share({
                title: "할 일 요청",
                text: text,
            }).catch(() => { });
        } else {
            navigator.clipboard.writeText(text).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    }, [todo.title, todo.id]);

    // Handle Advanced Options
    const handleCopyTemplateLink = useCallback(() => {
        const url = `${window.location.origin}/share/template/${todo.id}`;
        const text = `[할 일 배정 - 단체 템플릿]\n${todo.title}\n\n👉 아래 링크에서 본인 이름을 입력해 할 일을 생성하고 완료해 주세요:\n${url}`;
        navigator.clipboard.writeText(text).then(() => {
            setTemplateCopied(true);
            setTimeout(() => setTemplateCopied(false), 2000);
        });
    }, [todo.id, todo.title]);

    const handleGenerateBatch = useCallback(async () => {
        const names = batchNicknames.split(",")
            .map(n => n.trim())
            .filter(n => n.length > 0);

        if (names.length === 0) return;
        setIsGeneratingBatch(true);

        try {
            const { db, isFirebaseConfigured } = await import("@/lib/firebase");
            const { writeBatch, doc } = await import("firebase/firestore");

            if (isFirebaseConfigured() && db) {
                const batch = writeBatch(db);
                const newLinks: { name: string, url: string }[] = [];
                const now = new Date();

                let deadlineDate: Date | null = null;
                if (targetYear && targetMonth && targetDate && targetHour && targetMinute) {
                    let h = parseInt(targetHour);
                    if (timeFormat === "PM" && h !== 12) h += 12;
                    if (timeFormat === "AM" && h === 12) h = 0;
                    deadlineDate = new Date(`${targetYear}-${targetMonth}-${targetDate}T${h.toString().padStart(2, "0")}:${targetMinute}:00`);
                }

                let remindAt: Date | null = null;
                if (deadlineDate && remindMinutes) {
                    remindAt = new Date(deadlineDate.getTime() - parseInt(remindMinutes) * 60 * 1000);
                }

                for (const name of names) {
                    const newId = generateId();
                    const clonedTodo = {
                        title: todo.title,
                        description: todo.description || "",
                        status: "todo",
                        order: todo.order || 0,
                        deadline: deadlineDate,
                        remindAt: remindAt,
                        createdBy: todo.createdBy || "누군가",
                        checklist: todo.checklist || [],
                        syncId: todo.syncId || "",
                        category: todo.category || "shared",
                        assigneeName: name,
                        createdAt: now,
                        updatedAt: now
                    };

                    if (todo.userId) {
                        (clonedTodo as any).userId = todo.userId;
                    }

                    const docRef = doc(db, "todos", newId);
                    batch.set(docRef, clonedTodo);

                    newLinks.push({
                        name,
                        url: `${window.location.origin}/share/${newId}`
                    });
                }

                await batch.commit();
                setGeneratedBatchLinks(newLinks);
            }
        } catch (err) {
            console.error("Failed to generate batch copies:", err);
            alert("일괄 복제 중 오류가 발생했습니다.");
        } finally {
            setIsGeneratingBatch(false);
        }
    }, [batchNicknames, todo, targetYear, targetMonth, targetDate, targetHour, targetMinute, timeFormat, remindMinutes]);

    const handleCopyAllBatchLinks = useCallback(() => {
        if (generatedBatchLinks.length === 0) return;
        const text = generatedBatchLinks.map(link => `[${link.name}님 배정 할 일]\n${todo.title}\n👉 완료하기: ${link.url}`).join("\n\n");
        navigator.clipboard.writeText(text).then(() => {
            setAllBatchCopied(true);
            setTimeout(() => setAllBatchCopied(false), 2000);
        });
    }, [generatedBatchLinks, todo.title]);

    const handleCopySingleLink = useCallback((url: string, index: number) => {
        const text = `[할 일 요청]\n${todo.title}\n\n👉 링크에서 완료하기:\n${url}`;
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        });
    }, [todo.title]);

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
                        <h2 className={styles.title}>작업 설정</h2>
                        <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="닫기">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    {/* Task Title */}
                    <div className={styles.taskTitle}>
                        <span className={styles.taskIcon}>📋</span>
                        {todo.title}
                    </div>

                    {/* Scrollable content */}
                    <div className={styles.scrollContent}>
                        {/* Deadline */}
                        <div className={styles.field}>
                            <label className={styles.label}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                    <path d="M16 2v4M8 2v4M3 10h18" />
                                </svg>
                                마감일
                            </label>
                            <div className={styles.dateRow}>
                                <select value={targetYear} onChange={(e) => setTargetYear(e.target.value)} className={styles.selectSmall}>
                                    {[0, 1, 2].map((i) => {
                                        const y = (new Date().getFullYear() + i).toString();
                                        return <option key={y} value={y}>{y}년</option>;
                                    })}
                                </select>
                                <select value={targetMonth} onChange={(e) => setTargetMonth(e.target.value)} className={styles.selectSmall}>
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const m = (i + 1).toString().padStart(2, "0");
                                        return <option key={m} value={m}>{i + 1}월</option>;
                                    })}
                                </select>
                                <select value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className={styles.selectSmall}>
                                    {Array.from({ length: 31 }, (_, i) => {
                                        const d = (i + 1).toString().padStart(2, "0");
                                        return <option key={d} value={d}>{i + 1}일</option>;
                                    })}
                                </select>
                            </div>
                            <div className={styles.dateRow}>
                                <select value={timeFormat} onChange={(e) => setTimeFormat(e.target.value)} className={styles.selectSmall}>
                                    <option value="AM">오전</option>
                                    <option value="PM">오후</option>
                                </select>
                                <select value={targetHour} onChange={(e) => setTargetHour(e.target.value)} className={styles.selectSmall}>
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const h = (i === 0 ? 12 : i).toString().padStart(2, "0");
                                        return <option key={h} value={h}>{h}시</option>;
                                    })}
                                </select>
                                <select value={targetMinute} onChange={(e) => setTargetMinute(e.target.value)} className={styles.selectSmall}>
                                    {["00", "10", "20", "30", "40", "50"].map((m) => (
                                        <option key={m} value={m}>{m}분</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Remind Timer */}
                        <div className={styles.field}>
                            <label className={styles.label}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 6v6l4 2" strokeLinecap="round" />
                                </svg>
                                리마인드
                            </label>
                            <select
                                value={remindMinutes}
                                onChange={(e) => setRemindMinutes(e.target.value)}
                                className={styles.select}
                            >
                                <option value="10">10분 전</option>
                                <option value="30">30분 전</option>
                                <option value="60">1시간 전</option>
                                <option value="180">3시간 전</option>
                                <option value="1440">1일 전</option>
                            </select>
                        </div>

                        {/* 고급 공유 및 할당 옵션 */}
                        <div className={styles.advancedSection}>
                            <h3 className={styles.sectionHeader}>🔗 다인 할당 및 공유 옵션</h3>

                            {/* 대안 1: 템플릿 링크 생성 */}
                            <div className={styles.shareOptionBox}>
                                <div className={styles.optionTitle}>
                                    <span className={styles.optionNumber}>대안 1</span>
                                    <strong>단체 대화방 공유 템플릿 링크</strong>
                                </div>
                                <p className={styles.optionDesc}>
                                    💡 <strong>사용 방법:</strong> 링크를 단체방에 한 번만 공유해두세요. 
                                    수신자들이 이 링크에 접속해 이름을 입력하면, 자동으로 각자 전용의 개별 할 일이 
                                    복사 생성되어 대시보드에 실시간으로 동기화됩니다.
                                </p>
                                <div className={styles.copyRow}>
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={typeof window !== "undefined" ? `${window.location.origin}/share/template/${todo.id}` : ""} 
                                        className={styles.readOnlyInput}
                                    />
                                    <button 
                                        type="button" 
                                        className={styles.copyBtn} 
                                        onClick={handleCopyTemplateLink}
                                    >
                                        {templateCopied ? "복사됨" : "링크 복사"}
                                    </button>
                                </div>
                            </div>

                            {/* 대안 2: 일괄 복제 생성기 */}
                            <div className={styles.shareOptionBox}>
                                <div className={styles.optionTitle}>
                                    <span className={styles.optionNumber}>대안 2</span>
                                    <strong>개별 일괄 복제 링크 생성 (Batch Link)</strong>
                                </div>
                                <p className={styles.optionDesc}>
                                    💡 <strong>사용 방법:</strong> 아래에 수신자들의 이름을 쉼표(,)로 구분해 입력 후 생성하세요. 
                                    동일한 내용의 할 일이 담당자 인원만큼 복제 생성되어, 각각 전달할 수 있는 전용 완료 링크를 리스트업해 줍니다.
                                </p>
                                
                                <div className={styles.batchInputGroup}>
                                    <input 
                                        type="text" 
                                        placeholder="이름 목록 (예: 홍길동, 김철수, 이영희)" 
                                        value={batchNicknames} 
                                        onChange={(e) => setBatchNicknames(e.target.value)}
                                        className={styles.textInput}
                                    />
                                    <button 
                                        type="button" 
                                        className={styles.generateBtn} 
                                        onClick={handleGenerateBatch}
                                        disabled={!batchNicknames.trim() || isGeneratingBatch}
                                    >
                                        {isGeneratingBatch ? "생성 중..." : "일괄 생성"}
                                    </button>
                                </div>

                                {/* Generated Links list */}
                                {generatedBatchLinks.length > 0 && (
                                    <div className={styles.generatedList}>
                                        <div className={styles.generatedHeader}>
                                            <span>생성된 개별 링크 ({generatedBatchLinks.length}건)</span>
                                            <button 
                                                type="button" 
                                                className={styles.copyAllBtn} 
                                                onClick={handleCopyAllBatchLinks}
                                            >
                                                {allBatchCopied ? "전체 복사 완료!" : "전체 링크 복사"}
                                            </button>
                                        </div>
                                        <div className={styles.linkListContainer}>
                                            {generatedBatchLinks.map((linkObj, idx) => (
                                                <div key={idx} className={styles.linkListItem}>
                                                    <span className={styles.linkAssignee}>{linkObj.name}</span>
                                                    <input 
                                                        type="text" 
                                                        readOnly 
                                                        value={linkObj.url} 
                                                        className={styles.linkListUrl}
                                                    />
                                                    <button 
                                                        type="button" 
                                                        className={styles.linkListCopyBtn} 
                                                        onClick={() => handleCopySingleLink(linkObj.url, idx)}
                                                    >
                                                        {copiedIndex === idx ? "복사됨" : "복사"}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button className={`${styles.actionBtn} ${styles.btnNeutral}`} onClick={handleSetToday} type="button">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <path d="M16 2v4M8 2v4M3 10h18" />
                                <circle cx="12" cy="14" r="2" />
                            </svg>
                            오늘
                        </button>
                        <button className={`${styles.actionBtn} ${styles.btnDanger}`} onClick={handleDelete} type="button">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            삭제
                        </button>
                        <button className={`${styles.actionBtn} ${styles.btnNeutral}`} onClick={handleCopyLink} type="button">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            {copied ? "복사됨" : "공유"}
                        </button>
                        <button className={`${styles.actionBtn} ${styles.btnSuccess}`} onClick={handleSave} type="button">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                <polyline points="17 21 17 13 7 13 7 21" />
                                <polyline points="7 3 7 8 15 8" />
                            </svg>
                            저장
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
