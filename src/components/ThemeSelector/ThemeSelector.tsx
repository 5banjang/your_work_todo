"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./ThemeSelector.module.css";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

type ThemeOption = { id: "pro" | "kids" | "family", label: string, icon: string, color: string };

const THEMES: ThemeOption[] = [
    { id: "pro", label: "Pro", icon: "✨", color: "#13c8ec" },
    { id: "kids", label: "Kids", icon: "🎈", color: "#fca311" },
    { id: "family", label: "Family", icon: "🏠", color: "#fb8500" },
];

export default function ThemeSelector() {
    const { theme, setTheme } = useTheme();
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const activeTheme = THEMES.find(th => th.id === theme) || THEMES[0];

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
                title={activeTheme.label}
            >
                <span className={styles.icon}>{activeTheme.icon}</span>
            </button>

            {isOpen && (
                <div className={`${styles.dropdown} glass-card`}>
                    <div className={styles.header}>{t("theme.title")}</div>
                    <ul className={styles.list}>
                        {THEMES.map((th) => (
                            <li key={th.id}>
                                <button
                                    className={`${styles.option} ${theme === th.id ? styles.active : ""}`}
                                    onClick={() => {
                                        setTheme(th.id);
                                        setIsOpen(false);
                                    }}
                                >
                                    <span className={styles.optionIcon}>{th.icon}</span>
                                    <span className={styles.optionLabel}>{th.label}</span>
                                    {theme === th.id && (
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
