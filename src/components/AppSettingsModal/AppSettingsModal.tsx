"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import styles from "./AppSettingsModal.module.css";

interface AppSettingsModalProps {
    onClose: () => void;
}

export default function AppSettingsModal({ onClose }: AppSettingsModalProps) {
    const { t } = useLanguage();
    const [nickname, setNickname] = useState("");
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [vibrateEnabled, setVibrateEnabled] = useState(true);

    useEffect(() => {
        // Load existing settings
        const storedNickname = localStorage.getItem("your-todo-nickname") || "";
        setNickname(storedNickname);

        const storedSound = localStorage.getItem("your-todo-sound");
        if (storedSound !== null) setSoundEnabled(storedSound === "true");

        const storedVibrate = localStorage.getItem("your-todo-vibrate");
        if (storedVibrate !== null) setVibrateEnabled(storedVibrate === "true");
    }, []);

    const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setNickname(val);
        localStorage.setItem("your-todo-nickname", val);
    };

    const toggleSound = () => {
        const nextState = !soundEnabled;
        setSoundEnabled(nextState);
        localStorage.setItem("your-todo-sound", nextState ? "true" : "false");
    };

    const toggleVibrate = () => {
        const nextState = !vibrateEnabled;
        setVibrateEnabled(nextState);
        localStorage.setItem("your-todo-vibrate", nextState ? "true" : "false");
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <motion.div
                className={styles.modal}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.header}>
                    <h2 className={styles.title}>{t("settings.appTitle")}</h2>
                    <button className={styles.closeBtn} onClick={onClose} aria-label={t("settings.close")}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.section}>
                        <label className={styles.label}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            {t("settings.nicknameLabel")}
                        </label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder={t("settings.nicknamePlaceholder")}
                            value={nickname}
                            onChange={handleNicknameChange}
                            maxLength={20}
                        />
                    </div>

                    <div className={styles.section}>
                        <label className={styles.label}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                            </svg>
                            {t("settings.notifOptions")}
                        </label>

                        <div className={styles.toggleRow}>
                            <span className={styles.toggleLabel}>{t("settings.soundNotif")}</span>
                            <label>
                                <input type="checkbox" className={styles.toggleInput} checked={soundEnabled} onChange={toggleSound} />
                                <div className={styles.toggleTrack}>
                                    <div className={styles.toggleThumb} />
                                </div>
                            </label>
                        </div>

                        <div className={styles.toggleRow}>
                            <span className={styles.toggleLabel}>{t("settings.vibrateNotif")}</span>
                            <label>
                                <input type="checkbox" className={styles.toggleInput} checked={vibrateEnabled} onChange={toggleVibrate} />
                                <div className={styles.toggleTrack}>
                                    <div className={styles.toggleThumb} />
                                </div>
                            </label>
                        </div>

                    </div>
                </div>
            </motion.div>
        </div>
    );
}
