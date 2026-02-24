"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./GuideModal.module.css";
import Image from "next/image";

interface GuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GuideModal({ isOpen, onClose }: GuideModalProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            title: "스마트 입력 기능",
            icon: "✨",
            image: null,
            desc: `"내일 오후 3시까지 미팅 준비" 처럼 입력하면 시스템이 문장을 분석하여 마감일과 내용을 시간순으로 분리합니다.`
        },
        {
            title: "할 일 일괄 카톡 공유",
            icon: "🔗",
            image: "/images/guide_multishare.png",
            desc: `여러 개의 할 일을 선택하여 한 번에 카카오톡으로 전송하세요. 상대방이 링크를 열어 할 일을 완수하면 내 스마트폰으로 즉각 푸시 알림이 옵니다.`
        },
        {
            title: "PC-모바일 실시간 연동 (QR)",
            icon: "📱",
            image: "/images/guide_qrsync.png",
            desc: `PC 화면 상단의 [기기 동기화] 모니터 아이콘을 누르고, 모바일 앱에서 카메라로 해당 QR 코드를 찍으면 즉시 두 기기의 할 일 데이터가 동기화됩니다.`
        },
        {
            title: "푸시 알림 수신 조건",
            icon: "🔔",
            image: null,
            desc: `상단 파란색 종 아이콘을 눌러 알림 권한을 켜주세요. 아이폰(iOS) 사용자는 하단 공유 버튼을 눌러 반드시 [홈 화면에 추가] 로 앱을 설치해야만 알림이 제대로 옵니다.`
        }
    ];

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            setCurrentStep(0);
            onClose();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

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
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className={styles.stepContainer}
                                >
                                    <div className={styles.stepHeader}>
                                        <div className={styles.iconBox}>{steps[currentStep].icon}</div>
                                        <h3 className={styles.subtitle}>{steps[currentStep].title}</h3>
                                    </div>

                                    {steps[currentStep].image && (
                                        <div className={styles.imageWrapper}>
                                            <Image
                                                src={steps[currentStep].image}
                                                alt={steps[currentStep].title}
                                                width={400}
                                                height={300}
                                                className={styles.stepImage}
                                            />
                                        </div>
                                    )}

                                    <p className={styles.text}>{steps[currentStep].desc}</p>
                                </motion.div>
                            </AnimatePresence>

                            <div className={styles.dots}>
                                {steps.map((_, idx) => (
                                    <span
                                        key={idx}
                                        className={`${styles.dot} ${idx === currentStep ? styles.activeDot : ''}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className={styles.footer}>
                            {currentStep > 0 && (
                                <button className={styles.prevBtn} onClick={prevStep}>
                                    이전
                                </button>
                            )}
                            <button className={styles.nextBtn} onClick={nextStep}>
                                {currentStep === steps.length - 1 ? '시작하기' : '다음'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
