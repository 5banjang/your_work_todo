"use client";

import React, { useEffect, useState } from "react";
import styles from "./InstallPrompt.module.css";

// 전역 변수로 beforeinstallprompt 이벤트를 조기 캡처
// (컴포넌트 마운트 전에 이벤트가 발생할 수 있으므로)
declare global {
    interface Window {
        __deferredInstallPrompt?: any;
    }
}

// 모듈 로드 시점에 즉시 이벤트 리스너 등록 (React 마운트보다 빠름)
if (typeof window !== "undefined") {
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        window.__deferredInstallPrompt = e;
    }, { once: true });
}

function isIOSSafari(): boolean {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|Chrome/.test(ua);
    return isIOS && isSafari;
}

function isStandalone(): boolean {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (isStandalone()) {
            setIsInstalled(true);
            return;
        }

        // 이미 캡처된 이벤트가 있으면 사용
        if (window.__deferredInstallPrompt) {
            setDeferredPrompt(window.__deferredInstallPrompt);
            setIsInstallable(true);
        }

        // 이후에 발생하는 이벤트도 대응
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
            window.__deferredInstallPrompt = e;
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
            setShowIOSGuide(false);
            window.__deferredInstallPrompt = undefined;
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        // iOS Safari에서는 beforeinstallprompt가 없으므로 수동 안내 표시
        if (isIOSSafari() && !isStandalone()) {
            setShowIOSGuide(true);
        }

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`Install prompt response: ${outcome}`);
            setDeferredPrompt(null);
            setIsInstallable(false);
            window.__deferredInstallPrompt = undefined;
        } else if (isIOSSafari()) {
            setShowIOSGuide(true);
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        setShowIOSGuide(false);
    };

    if (isInstalled || dismissed) return null;

    // Android/Desktop: beforeinstallprompt 기반
    if (isInstallable) {
        return (
            <button onClick={handleInstallClick} className={styles.installBtn} aria-label="앱 설치하기">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 10l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                앱 다운로드
            </button>
        );
    }

    // iOS Safari: 수동 설치 안내
    if (showIOSGuide) {
        return (
            <div className={styles.iosGuide}>
                <div className={styles.iosGuideContent}>
                    <span className={styles.iosGuideIcon}>📲</span>
                    <div className={styles.iosGuideText}>
                        <strong>앱으로 설치하기</strong>
                        <span>
                            하단 공유 버튼
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ display: "inline", verticalAlign: "middle", margin: "0 2px" }}>
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" strokeLinecap="round" strokeLinejoin="round" />
                                <polyline points="16 6 12 2 8 6" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            → &quot;홈 화면에 추가&quot;
                        </span>
                    </div>
                    <button className={styles.iosGuideDismiss} onClick={handleDismiss} aria-label="닫기">✕</button>
                </div>
            </div>
        );
    }

    return null;
}
