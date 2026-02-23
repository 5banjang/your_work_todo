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
                                        "내일 오후 3시까지 유튜브 썸네일 검토" 처럼 입력하면 시스템이 문장을 분석하여 마감일과 내용을 자동으로 분리해줍니다.
                                    </p>
                                </div>
                            </div>



                            <div className={styles.guideItem}>
                                <div className={styles.iconBox}>🔗</div>
                                <div>
                                    <h3 className={styles.subtitle}>할 일 공유 & 푸시 알림</h3>
                                    <p className={styles.text}>
                                        상단의 공유 버튼을 눌러 여러 개의 할 일을 한 번에 카카오톡으로 전송하세요. 상대방이 완수하면 내 스마트폰으로 즉시 **"완료 푸시 알림(진동/소리)"**이 도착합니다!
                                    </p>
                                </div>
                            </div>

                            <div className={styles.guideItem}>
                                <div className={styles.iconBox}>🔔</div>
                                <div>
                                    <h3 className={styles.subtitle}>알림 수신 필수 조건</h3>
                                    <p className={styles.text}>
                                        상단의 파란색 종 모양 아이콘을 눌러 알림 권한을 켜주세요. <strong>특히 아이폰(iOS) 사용자의 경우</strong> 브라우저 하단 공유 버튼을 눌러 <strong>[홈 화면에 추가]</strong> 한 뒤, 바탕화면의 앱 아이콘으로 접속해야만 카톡처럼 정상적으로 알림을 받을 수 있습니다.
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
