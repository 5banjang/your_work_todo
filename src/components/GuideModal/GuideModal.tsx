"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./GuideModal.module.css";

interface GuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const GUIDE_STEPS = [
    {
        title: "할 일 입력하기",
        icon: "✏️",
        desc: `상단 입력창에 할 일을 입력하고 [+추가] 버튼을 누르세요.\n\n💡 "내일 오후 3시까지 보고서 제출" 처럼 자연스럽게 입력하면, 시스템이 자동으로 마감 시간과 내용을 분리해줍니다.`,
        tip: "한국어 날짜 표현(내일, 모레, 다음주 등)도 인식합니다!"
    },
    {
        title: "할 일 관리 버튼",
        icon: "📋",
        desc: `각 할 일 카드를 터치하면 3가지 버튼이 나타납니다:\n\n⚙️ 설정 — 마감일 변경, 체크리스트 추가 등\n🗑 회수(삭제) — 할 일을 삭제\n✅ 완료 — 할 일을 완료 처리`,
        tip: "완료된 할 일은 하단에 모이며, 일괄 삭제할 수 있어요."
    },
    {
        title: "🔔 알림 설정",
        icon: "🔔",
        desc: `상단의 종 아이콘을 눌러 알림을 켜주세요.\n\n켜두면 상대방이 할 일을 완료했을 때 소리와 진동으로 즉시 알림을 받습니다.\n\n⚙️ [설정] 버튼에서 소리/진동을 따로 on/off할 수 있습니다.`,
        tip: "알림을 받으려면 브라우저 알림 권한을 '허용'해야 합니다."
    },
    {
        title: "📮 받은 일 (수신함)",
        icon: "📮",
        desc: `다른 사람이 나에게 보낸 할 일 목록을 확인할 수 있습니다.\n\n받은 링크를 열면 할 일 목록이 보이고, [완료] 버튼을 눌러 처리하면 보낸 사람에게 알림이 갑니다.`,
        tip: "닉네임을 설정해두면 누가 완료했는지 상대방이 알 수 있어요."
    },
    {
        title: "📤 보낸 일 (지시 현황판)",
        icon: "📤",
        desc: `내가 다른 사람에게 보낸 할 일의 진행 상황을 한눈에 볼 수 있습니다.\n\n상대방이 공유 링크를 열어보면 '확인' 표시가, 완료하면 '완료' 표시가 됩니다.`,
        tip: "보낸 일 삭제도 여기서 가능합니다."
    },
    {
        title: "📤 할 일 공유하기",
        icon: "🔗",
        desc: `[공유] 버튼을 누르면 할 일을 선택하여 공유 링크를 만들 수 있습니다.\n\n📌 사용법:\n1. 공유할 할 일을 체크\n2. [링크 생성] 클릭\n3. 카카오톡이나 문자로 링크 전송\n\n상대방이 링크를 열면 할 일 목록이 보이고, 완료 시 나에게 알림이 옵니다.`,
        tip: "한 번에 여러 개의 할 일을 묶어서 보낼 수 있어요."
    },
    {
        title: "📱 공유 받은 사람 사용법",
        icon: "👤",
        desc: `링크를 받은 사람은:\n\n1. 링크를 열면 할 일 목록이 보입니다\n2. 각 할 일의 [완료] 버튼으로 처리\n3. 보낸 사람에게 자동으로 알림이 갑니다\n\n💡 자기 자신의 할 일을 입력하려면 메인 화면(홈)으로 돌아가서 상단 입력창에 입력하세요.`,
        tip: "공유 화면의 [내 할 일] 버튼으로 메인 화면으로 돌아갈 수 있어요."
    },
    {
        title: "📲 앱 설치하기 (PWA)",
        icon: "📲",
        desc: `📱 아이폰:\nSafari에서 하단 공유 버튼(□↑) → [홈 화면에 추가]\n\n🤖 안드로이드:\nChrome에서 메뉴(⋮) → [홈 화면에 추가] 또는 팝업 안내에서 [설치]\n\n💻 PC (Mac/Windows):\nChrome 주소창 오른쪽의 설치 아이콘(⊕) 클릭`,
        tip: "앱으로 설치하면 풀스크린으로 사용하고, 푸시 알림도 받을 수 있어요!"
    },
    {
        title: "🔄 기기 간 동기화",
        icon: "🔄",
        desc: `[기기연동] 버튼을 눌러 Google 계정으로 로그인하면, 같은 계정으로 로그인한 모든 기기(PC, 핸드폰)에서 할 일이 실시간으로 동기화됩니다.\n\n✅ PC에서 추가한 할 일이 핸드폰에서도 바로 보입니다\n✅ 핸드폰에서 완료하면 PC에서도 즉시 반영됩니다`,
        tip: "로그인 없이도 공유 링크를 통한 협업은 가능합니다."
    },
    {
        title: "🎨 테마 & 칸반 보드",
        icon: "🎨",
        desc: `✨ 테마: 상단의 [테마] 버튼으로 3가지 테마(Pro / Kids / Family)를 선택할 수 있습니다.\n\n📊 칸반 보드: 하단 [보드] 탭을 누르면 할 일을 상태별(할 일 → 진행 중 → 대기 → 완료)로 분류하여 볼 수 있습니다. 드래그해서 상태를 변경하세요.`,
        tip: "테마에 따라 폰트와 색상이 바뀌어 분위기가 달라져요!"
    }
];

export default function GuideModal({ isOpen, onClose }: GuideModalProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const handleClose = () => {
        setCurrentStep(0);
        onClose();
    };

    const nextStep = () => {
        if (currentStep < GUIDE_STEPS.length - 1) {
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

    const step = GUIDE_STEPS[currentStep];

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
                            <h2 className={styles.title}>📖 사용 가이드</h2>
                            <span className={styles.stepCounter}>{currentStep + 1} / {GUIDE_STEPS.length}</span>
                            <button className={styles.closeBtn} onClick={handleClose} aria-label="닫기">
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
                                        <h3 className={styles.subtitle}>{step.title}</h3>
                                    </div>

                                    <p className={styles.text}>{step.desc}</p>

                                    {step.tip && (
                                        <div className={styles.tipBox}>
                                            <span className={styles.tipIcon}>💡</span>
                                            <span className={styles.tipText}>{step.tip}</span>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            <div className={styles.dots}>
                                {GUIDE_STEPS.map((_, idx) => (
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
                                    ← 이전
                                </button>
                            )}
                            <button className={styles.nextBtn} onClick={nextStep}>
                                {currentStep === GUIDE_STEPS.length - 1 ? '✅ 완료' : '다음 →'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
