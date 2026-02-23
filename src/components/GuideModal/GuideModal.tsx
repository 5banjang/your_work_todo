"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./GuideModal.module.css";

interface GuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GuideModal({ isOpen, onClose }: GuideModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className={styles.overlay} onClick={onClose}>
                    <motion.div
                        className={styles.modal}
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.header}>
                            <h2 className={styles.title}>💡 Your To-Do 사용 가이드</h2>
                            <button className={styles.closeBtn} onClick={onClose} aria-label="닫기">
                                ×
                            </button>
                        </div>
                        <div className={styles.content}>
                            <div className={styles.guideItem}>
                                <div className={styles.iconBox}>✨</div>
                                <div>
                                    <h3 className={styles.subtitle}>스마트 입력</h3>
                                    <p className={styles.text}>
                                        "내일 오후 3시까지 유튜브 썸네일 검토" 처럼 자연스럽게 입력하면 AI가 마감일과 내용을 자동으로 분리해줍니다.
                                    </p>
                                </div>
                            </div>

                            <div className={styles.guideItem}>
                                <div className={styles.iconBox}>👆</div>
                                <div>
                                    <h3 className={styles.subtitle}>강력한 제스처</h3>
                                    <p className={styles.text}>
                                        할 일을 **오른쪽으로 스와이프**하면 완료 처리되고, **왼쪽으로 스와이프**하면 삭제됩니다.
                                    </p>
                                </div>
                            </div>

                            <div className={styles.guideItem}>
                                <div className={styles.iconBox}>🔗</div>
                                <div>
                                    <h3 className={styles.subtitle}>할 일 공유 & 푸시 알림</h3>
                                    <p className={styles.text}>
                                        상단의 공유 버튼을 눌러 여러 개의 할 일을 카카오톡으로 전송하세요. 상대방이 완수하면 내 폰으로 즉시 **"완료 알림(진동/소리)"**이 도착합니다!
                                    </p>
                                </div>
                            </div>

                            <div className={styles.guideItem}>
                                <div className={styles.iconBox}>🔔</div>
                                <div>
                                    <h3 className={styles.subtitle}>알림 조건</h3>
                                    <p className={styles.text}>
                                        상단의 파란색 종 모양 아이콘이 켜져 있어야 합니다. 모바일 기기의 경우 권한 허용 후 홈 화면에 바로가기를 추가해야 정상 작동합니다.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.footer}>
                            <button className={styles.confirmBtn} onClick={onClose}>
                                확인했습니다
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
