"use client";

import React, { useEffect, useState } from "react";
import styles from "./LaunchAppButton.module.css";

interface LaunchAppButtonProps {
    todoId: string;
    workspaceId?: string;
}

export default function LaunchAppButton({ todoId, workspaceId }: LaunchAppButtonProps) {
    const [isPWA, setIsPWA] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Check if already in standalone mode
        if (typeof window !== "undefined") {
            const isStandalone = window.matchMedia("(display-mode: standalone)").matches
                || (window.navigator as any).standalone
                || document.referrer.includes("android-app://");
            setIsPWA(isStandalone);
        }
    }, []);

    if (isPWA || !isVisible) return null;

    return (
        <div className={styles.banner}>
            <div className={styles.content}>
                <span className={styles.icon}>📱</span>
                <div className={styles.textGroup}>
                    <p className={styles.title}>앱으로 더 편리하게 관리하세요</p>
                    <p className={styles.desc}>이미 설치되어 있다면 바로 저장되어 열립니다.</p>
                </div>
            </div>
            <div className={styles.actions}>
                <button
                    className={styles.launchBtn}
                    onClick={() => {
                        // Redirect with workspace ID and import_todo parameter
                        // This allows PWA standalone app to parse parameters on launch
                        const targetW = workspaceId || "";
                        window.location.href = `/?w=${targetW}&import_todo=${todoId}&received=true`;
                    }}
                >
                    앱 열기 & 저장
                </button>
                <button className={styles.closeBtn} onClick={() => setIsVisible(false)}>
                    ✕
                </button>
            </div>
        </div>
    );
}
