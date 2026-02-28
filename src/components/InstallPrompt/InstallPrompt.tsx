"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import styles from "./InstallPrompt.module.css";

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showManualGuide, setShowManualGuide] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        // Check if already installed (standalone mode)
        if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
            setIsInstalled(true);
            return;
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
            setShowManualGuide(false);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        // For browsers that don't support beforeinstallprompt (Samsung Internet, iOS Safari, Firefox),
        // show a manual install guide if it's on mobile
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const timer = setTimeout(() => {
            if (!deferredPrompt && isMobile) {
                setIsInstallable(true);
            }
        }, 2000);

        return () => {
            clearTimeout(timer);
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            // Chrome / Edge: native install prompt
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            setDeferredPrompt(null);
            setIsInstallable(false);
        } else {
            // Samsung Internet, iOS Safari, etc: show manual guide
            setShowManualGuide(true);
        }
    };

    if (isInstalled) return null;
    if (!isInstallable && !showManualGuide) return null;

    const isIOS = /iPhone|iPad|iPod/i.test(typeof navigator !== "undefined" ? navigator.userAgent : "");

    return (
        <>
            <button onClick={handleInstallClick} className={styles.installBtn} aria-label={t("install.download")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 10l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t("install.download")}
            </button>

            {showManualGuide && (
                <div className={styles.manualGuide} onClick={() => setShowManualGuide(false)}>
                    <div className={styles.guideCard} onClick={(e) => e.stopPropagation()}>
                        <h3 className={styles.guideTitle}>📱 앱 설치 방법</h3>
                        {isIOS ? (
                            <ol className={styles.guideSteps}>
                                <li>하단의 <strong>공유 버튼</strong> (□↑) 을 탭하세요</li>
                                <li><strong>&quot;홈 화면에 추가&quot;</strong> 를 탭하세요</li>
                                <li><strong>&quot;추가&quot;</strong> 를 탭하면 완료!</li>
                            </ol>
                        ) : (
                            <ol className={styles.guideSteps}>
                                <li>브라우저 <strong>메뉴</strong> (⋮ 또는 ≡)를 탭하세요</li>
                                <li><strong>&quot;홈 화면에 추가&quot;</strong> 또는 <strong>&quot;앱 설치&quot;</strong>를 탭하세요</li>
                                <li><strong>&quot;설치&quot;</strong> 를 탭하면 완료!</li>
                            </ol>
                        )}
                        <button className={styles.guideCloseBtn} onClick={() => setShowManualGuide(false)}>
                            닫기
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
