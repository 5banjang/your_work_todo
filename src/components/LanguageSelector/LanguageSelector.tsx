"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLanguage, LANGUAGES } from "@/context/LanguageContext";
import styles from "./LanguageSelector.module.css";

export default function LanguageSelector() {
    const { lang, setLang } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const active = LANGUAGES.find(l => l.id === lang) || LANGUAGES[0];

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={styles.container} ref={ref}>
            <button
                className={styles.trigger}
                onClick={() => setIsOpen(!isOpen)}
                title={`Language: ${active.label}`}
            >
                <span className={styles.flag}>{active.flag}</span>
            </button>
            {isOpen && (
                <div className={styles.dropdown}>
                    {LANGUAGES.map((l) => (
                        <button
                            key={l.id}
                            className={`${styles.option} ${lang === l.id ? styles.active : ""}`}
                            onClick={() => { setLang(l.id); setIsOpen(false); }}
                        >
                            <span className={styles.optionFlag}>{l.flag}</span>
                            <span className={styles.optionLabel}>{l.label}</span>
                            {lang === l.id && <span className={styles.check}>✓</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
