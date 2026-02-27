"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import styles from "./GuideModal.module.css";

interface GuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const GUIDE_STEP_KEYS = [
    { titleKey: "guide.step1.title", descKey: "guide.step1.desc", tipKey: "guide.step1.tip", icon: "✏️" },
    { titleKey: "guide.step2.title", descKey: "guide.step2.desc", tipKey: "guide.step2.tip", icon: "📋" },
    { titleKey: "guide.step3.title", descKey: "guide.step3.desc", tipKey: "guide.step3.tip", icon: "🔔" },
    { titleKey: "guide.step4.title", descKey: "guide.step4.desc", tipKey: "guide.step4.tip", icon: "📮" },
    { titleKey: "guide.step5.title", descKey: "guide.step5.desc", tipKey: "guide.step5.tip", icon: "📤" },
    { titleKey: "guide.step6.title", descKey: "guide.step6.desc", tipKey: "guide.step6.tip", icon: "🔗" },
    { titleKey: "guide.step7.title", descKey: "guide.step7.desc", tipKey: "guide.step7.tip", icon: "👤" },
    { titleKey: "guide.step8.title", descKey: "guide.step8.desc", tipKey: "guide.step8.tip", icon: "📲" },
    { titleKey: "guide.step9.title", descKey: "guide.step9.desc", tipKey: "guide.step9.tip", icon: "🔄" },
    { titleKey: "guide.step10.title", descKey: "guide.step10.desc", tipKey: "guide.step10.tip", icon: "🎨" },
];

export default function GuideModal({ isOpen, onClose }: GuideModalProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const { t } = useLanguage();

    const handleClose = () => {
        setCurrentStep(0);
        onClose();
    };

    const nextStep = () => {
        if (currentStep < GUIDE_STEP_KEYS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleClose();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const step = GUIDE_STEP_KEYS[currentStep];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className={styles.overlay} onClick={handleClose}>
                    <motion.div
                        className={styles.modal}
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.header}>
                            <h2 className={styles.title}>{t("guide.title")}</h2>
                            <span className={styles.stepCounter}>{currentStep + 1} / {GUIDE_STEP_KEYS.length}</span>
                            <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                                </svg>
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
                                        <div className={styles.iconBox}>{step.icon}</div>
                                        <h3 className={styles.subtitle}>{t(step.titleKey)}</h3>
                                    </div>

                                    <p className={styles.text}>{t(step.descKey)}</p>

                                    {step.tipKey && (
                                        <div className={styles.tipBox}>
                                            <span className={styles.tipIcon}>💡</span>
                                            <span className={styles.tipText}>{t(step.tipKey)}</span>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            <div className={styles.dots}>
                                {GUIDE_STEP_KEYS.map((_, idx) => (
                                    <button
                                        key={idx}
                                        className={`${styles.dot} ${idx === currentStep ? styles.activeDot : ''}`}
                                        onClick={() => setCurrentStep(idx)}
                                        aria-label={`Step ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className={styles.footer}>
                            {currentStep > 0 && (
                                <button className={styles.prevBtn} onClick={prevStep}>
                                    {t("guide.prev")}
                                </button>
                            )}
                            <button className={styles.nextBtn} onClick={nextStep}>
                                {currentStep === GUIDE_STEP_KEYS.length - 1 ? t("guide.finish") : t("guide.next")}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
