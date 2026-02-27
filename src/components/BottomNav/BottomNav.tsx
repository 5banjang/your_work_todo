"use client";

import React from "react";
import { useTodos } from "@/context/TodoContext";
import styles from "./BottomNav.module.css";

interface BottomNavProps {
    onGuideClick: () => void;
}

export default function BottomNav({ onGuideClick }: BottomNavProps) {
    const { viewMode, setViewMode } = useTodos();

    return (
        <nav className={styles.nav} id="bottom-nav">
            <button
                className={`${styles.tab} ${viewMode === "list" ? styles.active : ""}`}
                onClick={() => setViewMode("list")}
                type="button"
                aria-label="리스트 뷰"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
                </svg>
                <span>리스트</span>
            </button>

            <button
                className={`${styles.tab} ${viewMode === "board" ? styles.active : ""}`}
                onClick={() => setViewMode("board")}
                type="button"
                aria-label="보드 뷰"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                <span>보드</span>
            </button>

            <button className={styles.tab} type="button" aria-label="사용 가이드" onClick={onGuideClick}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>사용법</span>
            </button>
            <span style={{ position: "absolute", bottom: "4px", left: "8px", fontSize: "9px", color: "rgba(255,255,255,0.2)" }}>
                v3.2.0
            </span>
        </nav>
    );
}
