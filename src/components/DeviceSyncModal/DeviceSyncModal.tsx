"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { doc, setDoc, onSnapshot, deleteDoc, getDoc } from "firebase/firestore";
import { getSyncId, useTodos } from "@/context/TodoContext";
import styles from "./DeviceSyncModal.module.css";

interface DeviceSyncModalProps {
    onClose: () => void;
}

export default function DeviceSyncModal({ onClose }: DeviceSyncModalProps) {
    const [tab, setTab] = useState<"show" | "scan">("show");
    const [token, setToken] = useState<string>("");
    const [manualCodeInput, setManualCodeInput] = useState<string>("");
    const [status, setStatus] = useState<"idle" | "awaiting_choice" | "success" | "error">("idle");
    const [scannedToken, setScannedToken] = useState<string | null>(null);
    const { activeSyncId: currentSyncId, updateSyncId } = useTodos();

    // For "show" tab (PC)
    useEffect(() => {
        if (tab !== "show" || !isFirebaseConfigured() || !db || !currentSyncId) return;

        // Generate a simple 6-digit code for manual entry
        const newToken = Math.floor(100000 + Math.random() * 900000).toString();
        setToken(newToken);

        // Create a temporary document in Firestore to wait for the scan
        const docRef = doc(db, "syncRequests", newToken);
        setDoc(docRef, { status: "pending", syncId: currentSyncId, createdAt: new Date() }).catch(console.error);

        const unsubscribe = onSnapshot(docRef, (snap) => {
            const data = snap.data();
            if (data && data.status === "completed" && data.syncId) {
                // If the mobile device sent a different syncId to us, we adopt it.
                // If they chose to take ours, data.syncId will equal our currentSyncId.
                if (data.syncId !== currentSyncId) {
                    updateSyncId(data.syncId);
                }
                setStatus("success");
                setTimeout(() => {
                    onClose();
                }, 1500);
            }
        });

        return () => {
            unsubscribe();
            deleteDoc(docRef).catch(console.error);
        };
    }, [tab]);

    // For "scan" tab (Mobile)
    const handleScan = async (result: any) => {
        if (!result || !result[0] || !result[0].rawValue || status !== "idle") return;
        const code = result[0].rawValue as string;
        if (!code.includes("|")) return; // Only process valid Your To-Do QR codes

        setScannedToken(code);
        setStatus("awaiting_choice");
    };

    const handleManualSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!manualCodeInput || manualCodeInput.length < 6 || status !== "idle" || !db) return;

        try {
            const docRef = doc(db, "syncRequests", manualCodeInput);
            const snap = await getDoc(docRef);
            if (snap.exists() && snap.data().syncId) {
                setScannedToken(`${manualCodeInput}|${snap.data().syncId}`);
                setStatus("awaiting_choice");
            } else {
                alert("유효하지 않은 연결 코드이거나 만료되었습니다.");
            }
        } catch (error) {
            console.error(error);
            alert("코드를 확인하는 중 오류가 발생했습니다.");
        }
    };

    const handleSyncChoice = async (keepMyData: boolean) => {
        if (!scannedToken || !isFirebaseConfigured() || !db) return;

        try {
            // Extract the PC's syncId loosely from the token string
            const parts = scannedToken.split('|');
            const pcToken = parts[0];
            let pcSyncId = parts.length > 1 ? parts[1] : null;

            const docRef = doc(db, "syncRequests", pcToken);

            // Fallback: If QR didn't contain pcSyncId, try to fetch it from the DB
            if (!pcSyncId) {
                const snap = await getDoc(docRef);
                if (snap.exists() && snap.data().syncId) {
                    pcSyncId = snap.data().syncId;
                }
            }

            // If the user wants to pull from PC but we STILL don't have pcSyncId, it means the PC is using an old cached version
            if (!keepMyData && !pcSyncId) {
                alert("연결된 PC가 이전 버전입니다.\\nPC 화면을 새로고침(또는 앱 재시작)한 뒤 다시 QR을 스캔해주세요.");
                setStatus("idle");
                setScannedToken(null);
                setTab("show");
                return;
            }

            const targetSyncId = keepMyData ? currentSyncId : (pcSyncId || currentSyncId);

            if (!keepMyData && pcSyncId) {
                // I will delete my local data and adopt the PC's syncId
                updateSyncId(pcSyncId);
            }

            await setDoc(
                docRef,
                { status: "completed", syncId: targetSyncId, completedAt: new Date() },
                { merge: true }
            );

            setStatus("success");

            // Allow time for Firebase sync & local storage to persist before reload
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            console.error("Sync error:", error);
            setStatus("error");
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
                <p className={styles.subtitle}>PC와 모바일을 실시간으로 연결하세요</p>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tabBtn} ${tab === "show" ? styles.active : ""}`}
                        onClick={() => { setTab("show"); setStatus("idle"); }}
                    >
                        PC (QR 생성)
                    </button>
                    <button
                        className={`${styles.tabBtn} ${tab === "scan" ? styles.active : ""}`}
                        onClick={() => { setTab("scan"); setStatus("idle"); }}
                    >
                        모바일 (QR 스캔)
                    </button>
                </div>

                <div className={styles.content}>
                    {status === "success" ? (
                        <div className={styles.successMessage}>
                            <div className={styles.successIcon}>✓</div>
                            <p>{tab === "show" ? "동기화 완료! 잠시 후 새로고침됩니다." : "연결 완료! 데이터를 동기화합니다."}</p>
                        </div>
                    ) : status === "awaiting_choice" ? (
                        <div className={styles.choiceContainer}>
                            <h3 className={styles.choiceTitle}>어느 기기의 데이터를 유지할까요?</h3>
                            <p className={styles.choiceSubtitle}>두 기기가 연결되었습니다. 기준이 될 데이터를 선택하세요.</p>
                            <div className={styles.choiceButtons}>
                                <button className={styles.choiceBtnPrimary} onClick={() => handleSyncChoice(true)}>
                                    📱 현재 폰의 데이터 유지<br />
                                    <small>(PC의 화면이 폰 기준으로 바뀝니다)</small>
                                </button>
                                <button className={styles.choiceBtnSecondary} onClick={() => handleSyncChoice(false)}>
                                    💻 PC의 데이터 가져오기<br />
                                    <small>(현재 폰의 화면이 PC 기준으로 바뀝니다)</small>
                                </button>
                            </div>
                        </div>
                    ) : tab === "show" ? (
                        <div className={styles.qrContainer}>
                            {token && currentSyncId ? (
                                <>
                                    <div className={styles.qrBg}>
                                        {/* encode PC's syncId in the QR code: "token|pcSyncId" */}
                                        <QRCodeSVG value={`${token}|${currentSyncId}`} size={180} bgColor={"#ffffff"} fgColor={"#000000"} level={"L"} />
                                    </div>
                                    <p className={styles.instruction}>모바일 앱 카메라로 QR 코드를 스캔하거나,<br />아래의 6자리 코드를 직접 입력하세요.</p>
                                    <div className={styles.codeDisplay}>
                                        {token}
                                    </div>
                                </>
                            ) : (
                                <p>QR 코드를 생성하는 중...</p>
                            )}
                        </div>
                    ) : (
                        <div className={styles.scannerContainer}>
                            <div className={styles.scannerWrapper}>
                                <Scanner onScan={handleScan} />
                            </div>
                            <p className={styles.instruction}>PC 화면의 QR 코드를 사각형 안에 맞춰주세요.</p>

                            <div className={styles.manualEntryDivider}>또는</div>

                            <form className={styles.manualEntryForm} onSubmit={handleManualSubmit}>
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="6자리 연결 코드 입력"
                                    value={manualCodeInput}
                                    onChange={(e) => setManualCodeInput(e.target.value.replace(/[^0-9]/g, ''))}
                                    className={styles.manualInput}
                                />
                                <button type="submit" className={styles.manualSubmitBtn} disabled={manualCodeInput.length < 6}>
                                    연결
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
