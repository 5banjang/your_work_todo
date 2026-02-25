"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTodos } from "@/context/TodoContext";
import styles from "./DeviceSyncModal.module.css";

interface DeviceSyncModalProps {
    onClose: () => void;
}

export default function DeviceSyncModal({ onClose }: DeviceSyncModalProps) {
    const { activeWorkspaceId } = useTodos();
    const [syncLink, setSyncLink] = useState("");
    const [copied, setCopied] = useState(false);
    const [pasteUrl, setPasteUrl] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined" && activeWorkspaceId) {
            const baseUrl = window.location.origin;
            setSyncLink(`${baseUrl}/?w=${activeWorkspaceId}`);
        }
    }, [activeWorkspaceId]);

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

                <h2 className={styles.title}>작업실(Workspace) 주소</h2>
                <p className={styles.subtitle}>
                    아래 링크를 복사하여 카카오톡으로 보내거나<br />
                    다른 기기의 주소창에 붙여넣으면 즉시 똑같은 화면이 열립니다.
                </p>

                <div className={styles.content}>
                    <div className={styles.buttonGroup} style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", width: "100%", marginTop: "16px" }}>
                        <div style={{
                            width: "100%",
                            maxWidth: "300px",
                            padding: "12px",
                            background: "rgba(255, 255, 255, 0.05)",
                            borderRadius: "8px",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text-secondary)",
                            fontSize: "0.85rem",
                            wordBreak: "break-all",
                            textAlign: "center",
                            marginBottom: "8px"
                        }}>
                            {syncLink || "주소 생성 중..."}
                        </div>

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
                                    주소 복사 완료!
                                </>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                    내 작업실 주소 복사하기
                                </>
                            )}
                        </button>

                        <p className={styles.instruction} style={{ marginTop: "8px", fontSize: "0.85rem", opacity: 0.8 }}>
                            로그인 없이 이 주소만 있으면 언제든 접속 가능합니다.
                        </p>

                        <div style={{ width: "100%", margin: "24px 0 16px", borderBottom: "1px solid var(--color-border)", position: "relative" }}>
                            <span style={{ position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", background: "var(--color-bg-elevated)", padding: "0 10px", fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: 500 }}>홈 화면 앱 전용</span>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (pasteUrl.includes('w=')) {
                                    window.location.href = pasteUrl.trim();
                                } else {
                                    alert('올바른 작업실 링크가 아닙니다.');
                                }
                            }}
                            style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", maxWidth: "300px" }}
                        >
                            <label style={{ fontSize: "0.85rem", color: "var(--color-text-primary)", alignSelf: "flex-start", fontWeight: 600 }}>아이폰 등 홈 화면에 추가한 앱 환경인가요?</label>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <input
                                    type="text"
                                    value={pasteUrl}
                                    onChange={(e) => setPasteUrl(e.target.value)}
                                    placeholder="PC에서 복사해온 링크 붙여넣기..."
                                    style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "rgba(255, 255, 255, 0.05)", color: "var(--color-text-primary)", fontSize: "0.9rem" }}
                                />
                                <button type="submit" disabled={!pasteUrl} style={{ padding: "0 16px", borderRadius: "8px", background: "var(--color-accent-cyan)", color: "#000", fontWeight: "bold", border: "none", opacity: !pasteUrl ? 0.5 : 1, cursor: pasteUrl ? "pointer" : "not-allowed" }}>
                                    이동
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
