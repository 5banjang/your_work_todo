"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./ThemeSelector.module.css";
import { useTheme } from "@/context/ThemeContext";

type ThemeOption = { id: "pro" | "kids" | "family", label: string, icon: string, color: string };

const THEMES: ThemeOption[] = [
    { id: "pro", label: "Pro", icon: "✨", color: "#06d6a0" }, // Cyan accent
    { id: "kids", label: "Kids", icon: "🎈", color: "#fca311" }, // Yellow/Orange accent
    { id: "family", label: "Family", icon: "🏠", color: "#fb8500" }, // Warm coral/orange
];

export default function ThemeSelector() {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const activeTheme = THEMES.find(t => t.id === theme) || THEMES[0];

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={styles.container} ref={dropdownRef}>
            <button
                className={styles.trigger}
                onClick={() => setIsOpen(!isOpen)}
                style={{ borderColor: activeTheme.color }}
                title={`현재 테마: ${activeTheme.label}`}
            >
                <span className={styles.icon}>{activeTheme.icon}</span>
            </button>

            {isOpen && (
                <div className={`${styles.dropdown} glass-card`}>
                    <div className={styles.header}>테마 선택</div>
                    <ul className={styles.list}>
                        {THEMES.map((t) => (
                            <li key={t.id}>
                                <button
                                    className={`${styles.option} ${theme === t.id ? styles.active : ""}`}
                                    onClick={() => {
                                        setTheme(t.id);
                                        setIsOpen(false);
                                    }}
                                >
                                    <span className={styles.optionIcon}>{t.icon}</span>
                                    <span className={styles.optionLabel}>{t.label}</span>
                                    {theme === t.id && (
                                        <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
