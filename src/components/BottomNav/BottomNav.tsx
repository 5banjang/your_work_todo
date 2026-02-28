"use client";

import React from "react";
import { useTodos } from "@/context/TodoContext";
import { useLanguage } from "@/context/LanguageContext";
import styles from "./BottomNav.module.css";

interface BottomNavProps {
    onGuideClick: () => void;
}

export default function BottomNav({ onGuideClick }: BottomNavProps) {
    const { viewMode, setViewMode } = useTodos();
    const { t } = useLanguage();

    return (
        <nav className={styles.nav} id="bottom-nav">
            <button
                className={`${styles.tab} ${viewMode === "list" ? styles.active : ""}`}
                onClick={() => setViewMode("list")}
                type="button"
                aria-label={t("nav.list")}
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
                </svg>
                <span>{t("nav.list")}</span>
            </button>

            <button
                className={`${styles.tab} ${viewMode === "board" ? styles.active : ""}`}
                onClick={() => setViewMode("board")}
                type="button"
                aria-label={t("nav.board")}
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                <span>{t("nav.board")}</span>
            </button>

            <button className={styles.tab} type="button" aria-label={t("nav.guide")} onClick={onGuideClick}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>{t("nav.guide")}</span>
            </button>
            <span style={{ position: "absolute", bottom: "4px", left: "8px", fontSize: "9px", color: "rgba(255,255,255,0.2)" }}>
                v3.5.1
            </span>
        </nav>
    );
}
