"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import styles from "./NicknameModal.module.css";

interface NicknameModalProps {
    isOpen: boolean;
    onSave: (nickname: string) => void;
}

export default function NicknameModal({ isOpen, onSave }: NicknameModalProps) {
    const [nickname, setNickname] = useState("");
    const { t } = useLanguage();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = nickname.trim();
        if (trimmed) {
            onSave(trimmed);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className={styles.overlay}>
                    <motion.div
                        className={styles.modal}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className={styles.modalContent}>
                            <div className={styles.iconContainer}>
                                <span>👋</span>
                            </div>
                            <h2 className={styles.title}>{t("welcome.title")}</h2>
                            <p className={styles.description}>
                                {t("welcome.desc")}<br />
                                <strong>{t("welcome.descBold")}</strong>{t("welcome.descEnd")}
                            </p>

                            <form onSubmit={handleSubmit} className={styles.form}>
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder={t("welcome.placeholder")}
                                    className={styles.input}
                                    autoFocus
                                    maxLength={12}
                                />
                                <button
                                    type="submit"
                                    className={styles.submitBtn}
                                    disabled={!nickname.trim()}
                                >
                                    {t("welcome.start")}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
