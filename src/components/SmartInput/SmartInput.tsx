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
    const inputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Ignore if the active element is already an input or textarea
            const activeTag = document.activeElement?.tagName;
            if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") {
                return;
            }
            // Ignore modifier keys and functional keys (like Shift, Control, F1, etc)
            if (e.ctrlKey || e.metaKey || e.altKey || e.key.length > 1) {
                return;
            }
            // Ignore if a modal is open (checking for z-index or a class like .modal might be tricky,
            // but for now focusing is safe)
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

            addTodo(title, finalDeadline);

            setValue("");
            inputRef.current?.blur();
        },
        [value, addTodo]
    );

    return (
        <form onSubmit={handleSubmit} className={styles.container}>
            <div className={`${styles.inputWrapper} ${isFocused ? styles.focused : ""}`}>
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
                    placeholder={t("input.placeholder")}
                    className={styles.input}
                    id="smart-input"
                />
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

