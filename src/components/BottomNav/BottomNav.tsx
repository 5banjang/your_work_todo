"use client";

import React from "react";
import { useTodos } from "@/context/TodoContext";
import styles from "./BottomNav.module.css";

export default function BottomNav() {
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

            <button className={styles.tab} type="button" aria-label="캘린더" onClick={() => alert("캘린더 기능은 추후 업데이트 될 예정입니다! 🚀")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
                </svg>
                <span>캘린더</span>
            </button>

            <button className={styles.tab} type="button" aria-label="설정" onClick={() => alert("전체 설정 기능은 추후 업데이트 될 예정입니다! 🚀")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" />
                </svg>
                <span>설정</span>
            </button>
        </nav>
    );
}
