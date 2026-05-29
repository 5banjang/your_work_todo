"use client";

import React, { useState, useRef, useCallback } from "react";
import { parseSmartInput } from "@/lib/nlp";
import { useTodos } from "@/context/TodoContext";
import { useLanguage } from "@/context/LanguageContext";
import styles from "./SmartInput.module.css";

function getNow() { return new Date(); }

export default function SmartInput() {
    const { addTodo } = useTodos();
    const { t } = useLanguage();
    const [value, setValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [isPersonal, setIsPersonal] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            const activeTag = document.activeElement?.tagName;
            if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") {
                return;
            }
            if (e.ctrlKey || e.metaKey || e.altKey || e.key.length > 1) {
                return;
            }
            inputRef.current?.focus();
        };

        document.addEventListener("keydown", handleGlobalKeyDown);
        return () => document.removeEventListener("keydown", handleGlobalKeyDown);
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
    }, []);

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            const text = value.trim();
            if (!text) return;

            const parsed = parseSmartInput(text);
            const title = parsed.title || text;
            const finalDeadline = parsed.deadline || getNow();

            // Pass 'personal' or 'shared' category based on toggle state
            addTodo(title, finalDeadline, isPersonal ? 'personal' : 'shared');

            setValue("");
            setIsPersonal(false); // Reset toggle
            inputRef.current?.blur();
        },
        [value, addTodo, isPersonal]
    );

    return (
        <form onSubmit={handleSubmit} className={styles.container}>
            <div className={`${styles.inputWrapper} ${isFocused ? styles.focused : ""} ${isPersonal ? styles.personalMode : ""}`} style={{ position: "relative" }}>
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                <input
                    ref={inputRef}
                    autoFocus
                    type="text"
                    value={value}
                    onChange={handleChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 300)}
                    placeholder={isPersonal ? "나만 보는 할 일 등록..." : t("input.placeholder")}
                    className={styles.input}
                    id="smart-input"
                />
                
                {/* Personal lock toggle btn */}
                <button
                    type="button"
                    onClick={() => setIsPersonal(prev => !prev)}
                    style={{
                        background: isPersonal ? "rgba(0, 245, 255, 0.15)" : "transparent",
                        color: isPersonal ? "var(--color-accent-cyan, #00f5ff)" : "var(--color-text-muted, #64748b)",
                        border: isPersonal ? "1px solid rgba(0, 245, 255, 0.3)" : "1px solid transparent",
                        borderRadius: "8px",
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        flexShrink: 0,
                        marginRight: "4px"
                    }}
                    title={isPersonal ? "비공개 (나만 보기)" : "기본 공유 모드"}
                >
                    {isPersonal ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    )}
                </button>

                <button type="submit" className={styles.submitBtn}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{t("input.add")}</span>
                </button>
            </div>
        </form>
    );
}

