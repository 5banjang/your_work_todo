"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { doc, setDoc, onSnapshot, deleteDoc } from "firebase/firestore";
import { getSyncId, setSyncId } from "@/context/TodoContext";
import { generateId } from "@/lib/utils";
import styles from "./DeviceSyncModal.module.css";

interface DeviceSyncModalProps {
    onClose: () => void;
}

export default function DeviceSyncModal({ onClose }: DeviceSyncModalProps) {
    const [tab, setTab] = useState<"show" | "scan">("show");
    const [token, setToken] = useState<string>("");
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const currentSyncId = getSyncId();

    // For "show" tab (PC)
    useEffect(() => {
        if (tab !== "show" || !isFirebaseConfigured() || !db) return;

        const newToken = `sync-${generateId()}`;
        setToken(newToken);

        // Create a temporary document in Firestore to wait for the scan
        const docRef = doc(db, "syncRequests", newToken);
        setDoc(docRef, { status: "pending", createdAt: new Date() }).catch(console.error);

        const unsubscribe = onSnapshot(docRef, (snap) => {
            const data = snap.data();
            if (data && data.status === "completed" && data.syncId) {
                setSyncId(data.syncId);
                setStatus("success");
                setTimeout(() => {
                    window.location.reload();
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
        if (!result || !result[0] || !result[0].rawValue) return;
        const scannedToken = result[0].rawValue;
        if (!scannedToken.startsWith("sync-")) return;

        if (isFirebaseConfigured() && db) {
            try {
                const docRef = doc(db, "syncRequests", scannedToken);
                await setDoc(
                    docRef,
                    { status: "completed", syncId: currentSyncId, completedAt: new Date() },
                    { merge: true }
                );
                setStatus("success");
                setTimeout(() => {
                    onClose();
                }, 2000);
            } catch (error) {
                console.error("Sync error:", error);
                setStatus("error");
            }
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
                            <p>{tab === "show" ? "동기화 완료! 잠시 후 새로고침됩니다." : "스캔 완료! PC 화면을 확인하세요."}</p>
                        </div>
                    ) : tab === "show" ? (
                        <div className={styles.qrContainer}>
                            {token ? (
                                <>
                                    <div className={styles.qrBg}>
                                        <QRCodeSVG value={token} size={180} bgColor={"#ffffff"} fgColor={"#000000"} level={"L"} />
                                    </div>
                                    <p className={styles.instruction}>모바일 앱에서 이 QR 코드를 스캔하세요.</p>
                                </>
                            ) : (
                                <p>QR 코드를 생성하는 중...</p>
                            )}
                        </div>
                    ) : (
                        <div className={styles.scannerContainer}>
                            <Scanner onScan={handleScan} />
                            <p className={styles.instruction}>PC 화면의 QR 코드를 사각형 안에 맞춰주세요.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
