"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTodos } from "@/context/TodoContext";
import { useLanguage } from "@/context/LanguageContext";
import styles from "./DeviceSyncModal.module.css";

interface DeviceSyncModalProps {
    onClose: () => void;
}

export default function DeviceSyncModal({ onClose }: DeviceSyncModalProps) {
    const { user, loginWithGoogle, logout } = useTodos();
    const { t } = useLanguage();

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

                <h2 className={styles.title}>{t("sync.accountTitle")}</h2>
                <p className={styles.subtitle}>
                    {t("sync.desc")}
                </p>

                <div className={styles.content}>
                    <div className={styles.buttonGroup} style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", width: "100%", marginTop: "16px" }}>

                        {user ? (
                            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
                                <div style={{
                                    padding: "16px",
                                    background: "rgba(255, 255, 255, 0.05)",
                                    borderRadius: "12px",
                                    border: "1px solid var(--color-border)",
                                    color: "var(--color-text-primary)",
                                    textAlign: "center",
                                    width: "100%",
                                    maxWidth: "300px"
                                }}>
                                    <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "8px" }}>{t("sync.currentAccount")}</div>
                                    <div style={{ fontWeight: "bold" }}>{user.email || user.displayName}</div>
                                </div>
                                <button
                                    onClick={logout}
                                    style={{
                                        width: "100%",
                                        maxWidth: "300px",
                                        padding: "14px",
                                        borderRadius: "8px",
                                        background: "rgba(239, 68, 68, 0.1)",
                                        color: "#ef4444",
                                        border: "1px solid rgba(239, 68, 68, 0.2)",
                                        fontWeight: "bold",
                                        cursor: "pointer"
                                    }}
                                >
                                    {t("sync.logout")}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={loginWithGoogle}
                                style={{
                                    width: "100%",
                                    maxWidth: "300px",
                                    padding: "16px",
                                    borderRadius: "12px",
                                    background: "#ffffff",
                                    color: "#000",
                                    fontWeight: "bold",
                                    border: "1px solid #ddd",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "12px",
                                    fontSize: "1rem"
                                }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                {t("sync.loginGoogle")}
                            </button>
                        )}

                        <p className={styles.instruction} style={{ marginTop: "16px", fontSize: "0.85rem", opacity: 0.8, textAlign: "center", lineHeight: "1.5" }}>
                            {t("sync.loginNote")}
                        </p>

                    </div>
                </div>
            </motion.div>
        </div>
    );
}
