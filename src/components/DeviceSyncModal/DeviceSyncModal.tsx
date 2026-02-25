"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { doc, setDoc, onSnapshot, deleteDoc, getDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { useTodos } from "@/context/TodoContext";
import styles from "./DeviceSyncModal.module.css";

interface DeviceSyncModalProps {
    onClose: () => void;
}

type SyncMode = "select" | "generate" | "enter" | "success" | "error";

export default function DeviceSyncModal({ onClose }: DeviceSyncModalProps) {
    const [mode, setMode] = useState<SyncMode>("select");
    const [token, setToken] = useState<string>("");
    const [manualCodeInput, setManualCodeInput] = useState<string>("");

    const { activeSyncId: currentSyncId, updateSyncId } = useTodos();

    // Mode: "generate"
    useEffect(() => {
        if (mode !== "generate" || !isFirebaseConfigured() || !db || !currentSyncId) return;

        // Generate a 6-digit code
        const newToken = Math.floor(100000 + Math.random() * 900000).toString();
        setToken(newToken);

        const docRef = doc(db, "syncRequests", newToken);
        setDoc(docRef, { status: "pending", syncId: currentSyncId, createdAt: new Date() }).catch(console.error);

        const unsubscribe = onSnapshot(docRef, (snap) => {
            const data = snap.data();
            if (data && data.status === "completed" && data.syncId) {
                if (data.syncId !== currentSyncId) {
                    updateSyncId(data.syncId);
                }
                setMode("success");
                setTimeout(() => {
                    onClose();
                }, 1500);
            }
        });

        return () => {
            unsubscribe();
            deleteDoc(docRef).catch(console.error);
        };
    }, [mode, currentSyncId, updateSyncId, onClose]);

    const handleManualSubmit = async (e?: React.FormEvent, directCode?: string) => {
        if (e) e.preventDefault();
        const codeToUse = directCode || manualCodeInput;
        if (!codeToUse || codeToUse.length < 6 || mode !== "enter" || !db || !currentSyncId) return;

        try {
            const docRef = doc(db, "syncRequests", codeToUse);
            const snap = await getDoc(docRef);
            if (snap.exists() && snap.data().syncId) {
                const otherSyncId = snap.data().syncId;

                // Merge data: adopt otherSyncId, and move all local tasks to otherSyncId
                const todosRef = collection(db, "todos");
                const q = query(todosRef, where("syncId", "==", currentSyncId));
                const myTodosSnap = await getDocs(q);

                if (!myTodosSnap.empty) {
                    const batch = writeBatch(db);
                    myTodosSnap.forEach((d) => {
                        batch.update(d.ref, { syncId: otherSyncId, updatedAt: new Date() });
                    });
                    await batch.commit();
                }

                if (otherSyncId !== currentSyncId) {
                    updateSyncId(otherSyncId);
                }

                await setDoc(
                    docRef,
                    { status: "completed", syncId: otherSyncId, completedAt: new Date() },
                    { merge: true }
                );

                setMode("success");
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                alert("유효하지 않은 연결 코드이거나 만료되었습니다.");
            }
        } catch (error) {
            console.error("Sync error:", error);
            alert("코드를 확인하는 중 오류가 발생했습니다.");
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
                            <p className={styles.instruction}>상대방 기기에서 <strong>'인증번호 입력하기'</strong>를 누른 후<br />아래의 6자리 코드를 입력하세요.</p>
                            <div className={styles.codeDisplay}>
                                {token}
                            </div>
                            <button className={styles.backBtnText} onClick={() => setMode("select")}>
                                뒤로 가기
                            </button>
                        </div>
                    ) : mode === "enter" ? (
                        <div className={styles.enterContainer}>
                            <p className={styles.instruction}>상대방 기기 화면에 표시된<br />6자리 인증번호를 입력해주세요.</p>
                            <form className={styles.manualEntryForm} onSubmit={handleManualSubmit}>
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="6자리 인증번호"
                                    value={manualCodeInput}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
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
                                    <strong>인증번호 발급받기</strong>
                                    <span>이 기기에서 인증번호를 생성합니다</span>
                                </div>
                            </button>

                            <button className={styles.selectBtnSecondary} onClick={() => setMode("enter")}>
                                <span className={styles.selectBtnIcon}>⌨️</span>
                                <div className={styles.selectBtnText}>
                                    <strong>인증번호 입력하기</strong>
                                    <span>다른 기기의 인증번호를 입력합니다</span>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
