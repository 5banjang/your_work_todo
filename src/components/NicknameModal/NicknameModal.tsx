"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./NicknameModal.module.css";

interface NicknameModalProps {
    isOpen: boolean;
    onSave: (nickname: string) => void;
}

export default function NicknameModal({ isOpen, onSave }: NicknameModalProps) {
    const [nickname, setNickname] = useState("");

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
                            <h2 className={styles.title}>환영합니다!</h2>
                            <p className={styles.description}>
                                할 일을 완료했을 때 일행에게 전송될<br />
                                <strong>본인의 이름(닉네임)</strong>을 먼저 입력해주세요.
                            </p>

                            <form onSubmit={handleSubmit} className={styles.form}>
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder="예: 홍길동, 아빠, 팀장님"
                                    className={styles.input}
                                    autoFocus
                                    maxLength={12}
                                />
                                <button
                                    type="submit"
                                    className={styles.submitBtn}
                                    disabled={!nickname.trim()}
                                >
                                    시작하기
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
