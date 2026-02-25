"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { useTodos } from "@/context/TodoContext";
import styles from "./DeviceSyncModal.module.css";

interface DeviceSyncModalProps {
    onClose: () => void;
}

type SyncMode = "select" | "generate" | "enter" | "success" | "loading";

export default function DeviceSyncModal({ onClose }: DeviceSyncModalProps) {
    const [mode, setMode] = useState<SyncMode>("select");
    const [token, setToken] = useState<string>("");
    const [manualCodeInput, setManualCodeInput] = useState<string>("");

    const { activeSyncId: currentSyncId, updateSyncId } = useTodos();

    const generateShortCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars like I,1,O,0
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    // Initialize or fetch my permanent code
    useEffect(() => {
        if (!isFirebaseConfigured() || !db || !currentSyncId) return;

        const checkMyCode = async () => {
            try {
                // Find if I already have a code mapping
                const q = query(collection(db!, "syncCodes"), where("syncId", "==", currentSyncId));
                const snap = await getDocs(q);

                if (!snap.empty) {
                    // Use existing
                    setToken(snap.docs[0].id);
                } else {
                    // Generate new permanent code and save
                    const newCode = generateShortCode();
                    await setDoc(doc(db!, "syncCodes", newCode), {
                        syncId: currentSyncId,
                        createdAt: new Date()
                    });
                    setToken(newCode);
                }
            } catch (err) {
                console.error("Failed to init sync code:", err);
            }
        };

        checkMyCode();
    }, [currentSyncId]);

    const handleManualSubmit = async (e?: React.FormEvent, directCode?: string) => {
        if (e) e.preventDefault();
        const codeToUse = (directCode || manualCodeInput).toUpperCase();
        if (!codeToUse || codeToUse.length < 6 || mode !== "enter" || !db || !currentSyncId) return;

        setMode("loading");
        try {
            const docRef = doc(db!, "syncCodes", codeToUse);
            const snap = await getDoc(docRef);
            if (snap.exists() && snap.data().syncId) {
                const otherSyncId = snap.data().syncId;

                // Merge data: adopt otherSyncId, and move all local tasks to otherSyncId
                const todosRef = collection(db!, "todos");
                const q = query(todosRef, where("syncId", "==", currentSyncId));
                const myTodosSnap = await getDocs(q);

                if (!myTodosSnap.empty) {
                    const batch = writeBatch(db!);
                    myTodosSnap.forEach((d) => {
                        batch.update(d.ref, { syncId: otherSyncId, updatedAt: new Date() });
                    });
                    await batch.commit();
                }

                if (otherSyncId !== currentSyncId) {
                    updateSyncId(otherSyncId);
                }

                setMode("success");
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                alert("유효하지 않은 연동 코드입니다.");
                setMode("enter");
            }
        } catch (error) {
            console.error("Sync error:", error);
            alert("코드를 확인하는 중 오류가 발생했습니다.");
            setMode("enter");
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <motion.div
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
            >
                <button className={styles.closeBtn} onClick={onClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                <h2 className={styles.title}>기기 동기화</h2>
                <p className={styles.subtitle}>인증번호를 통해 실시간으로 기기를 연결하세요</p>

                <div className={styles.content}>
                    {mode === "success" ? (
                        <div className={styles.successMessage}>
                            <div className={styles.successIcon}>✓</div>
                            <p>연결 완료! 데이터가 동기화되었습니다.</p>
                        </div>

                    ) : mode === "generate" ? (
                        <div className={styles.generateContainer}>
                            <p className={styles.instruction}>이 아래의 <strong style={{ color: "var(--color-accent-cyan)" }}>영구적인 연동 코드</strong>를 다른 기기에서 입력하면<br />언제든 지금의 기기와 자동으로 연결됩니다.</p>
                            <div className={styles.codeDisplay}>
                                {token}
                            </div>
                            <button className={styles.backBtnText} onClick={() => setMode("select")}>
                                뒤로 가기
                            </button>
                        </div>
                    ) : mode === "enter" ? (
                        <div className={styles.enterContainer}>
                            <p className={styles.instruction}>상대방 기기 화면에 표시된<br />6자리 연동 코드를 영문/숫자로 입력해주세요.</p>
                            <form className={styles.manualEntryForm} onSubmit={handleManualSubmit}>
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="6자리 연동 코드"
                                    value={manualCodeInput}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                                        setManualCodeInput(val);
                                        if (val.length === 6) {
                                            handleManualSubmit(undefined, val);
                                        }
                                    }}
                                    className={styles.manualInput}
                                    autoFocus
                                />
                                <button type="submit" className={styles.manualSubmitBtn} disabled={manualCodeInput.length < 6}>
                                    연결
                                </button>
                            </form>
                            <button className={styles.backBtnText} onClick={() => { setMode("select"); setManualCodeInput(""); }}>
                                뒤로 가기
                            </button>
                        </div>
                    ) : (
                        <div className={styles.selectContainer}>
                            <button className={styles.selectBtnPrimary} onClick={() => setMode("generate")}>
                                <span className={styles.selectBtnIcon}>🔢</span>
                                <div className={styles.selectBtnText}>
                                    <strong>내 연결 코드 보기</strong>
                                    <span>내 기기의 고유 연동 코드를 확인합니다</span>
                                </div>
                            </button>

                            <button className={styles.selectBtnSecondary} onClick={() => setMode("enter")}>
                                <span className={styles.selectBtnIcon}>⌨️</span>
                                <div className={styles.selectBtnText}>
                                    <strong>다른 기기 코드 입력</strong>
                                    <span>기존에 쓰던 연동 코드를 입력해 복구합니다</span>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
