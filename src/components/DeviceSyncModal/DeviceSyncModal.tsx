"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTodos } from "@/context/TodoContext";
import QRCode from "react-qr-code";
import styles from "./DeviceSyncModal.module.css";

interface DeviceSyncModalProps {
    onClose: () => void;
}

export default function DeviceSyncModal({ onClose }: DeviceSyncModalProps) {
    const { activeSyncId } = useTodos();
    const [syncLink, setSyncLink] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && activeSyncId) {
            const baseUrl = window.location.origin;
            setSyncLink(`${baseUrl}/sync/${activeSyncId}`);
        }
    }, [activeSyncId]);

    const handleCopy = async () => {
        if (!syncLink) return;
        try {
            await navigator.clipboard.writeText(syncLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            if (navigator.vibrate) navigator.vibrate(50);
        } catch (err) {
            console.error("Failed to copy link", err);
            prompt("아래 링크를 복사하세요:", syncLink);
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

                <h2 className={styles.title}>모바일-PC 기기 연동</h2>
                <p className={styles.subtitle}>
                    아래 QR코드를 스마트폰 기본 카메라로 비추거나, <br />
                    링크를 복사하여 카카오톡 등으로 보내 접속하세요.
                </p>

                <div className={styles.content}>
                    <div style={{
                        background: "white",
                        padding: "16px",
                        borderRadius: "16px",
                        display: "inline-block",
                        marginBottom: "24px"
                    }}>
                        {syncLink ? (
                            <QRCode value={syncLink} size={150} />
                        ) : (
                            <div style={{ width: 150, height: 150, background: "#eee" }} />
                        )}
                    </div>

                    <div className={styles.buttonGroup} style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", width: "100%" }}>
                        <button
                            className={styles.manualSubmitBtn}
                            onClick={handleCopy}
                            style={{ width: "100%", maxWidth: "300px", padding: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                        >
                            {copied ? (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    복사 완료!
                                </>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                    연동 링크 복사하기
                                </>
                            )}
                        </button>

                        <p className={styles.instruction} style={{ marginTop: "8px", fontSize: "0.85rem", opacity: 0.8 }}>
                            접속 즉시 이 기기와 <strong>실시간으로 동기화</strong>됩니다.<br />
                            (인증번호 입력 과정 생략)
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
