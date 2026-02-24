"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { TodoProvider, useTodos } from "@/context/TodoContext";
import SmartInput from "@/components/SmartInput/SmartInput";
import TodoList from "@/components/TodoList/TodoList";
import KanbanBoard from "@/components/KanbanBoard/KanbanBoard";
import BottomNav from "@/components/BottomNav/BottomNav";
import ShareModal from "@/components/ShareModal/ShareModal";
import ShareListModal from "@/components/ShareListModal/ShareListModal";
import ThemeSelector from "@/components/ThemeSelector/ThemeSelector";
import AppSettingsModal from "@/components/AppSettingsModal/AppSettingsModal";
import GuideModal from "@/components/GuideModal/GuideModal";
import DelegationDashboard from "@/components/DelegationDashboard/DelegationDashboard";
import ReceivedTasksDashboard from "@/components/ReceivedTasksDashboard/ReceivedTasksDashboard";
import DeviceSyncModal from "@/components/DeviceSyncModal/DeviceSyncModal";
import type { Todo } from "@/types/todo";
import styles from "./page.module.css";

function Header({ onShareList, onOpenDashboard, onOpenReceivedTasks, onOpenSync, isSharedMode }: { onShareList: () => void; onOpenDashboard: () => void; onOpenReceivedTasks: () => void; onOpenSync: () => void; isSharedMode?: boolean }) {
  const { viewMode, fcmToken, requestPushPermission } = useTodos();
  const [permGranted, setPermGranted] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const granted = Notification.permission === "granted";
      setPermGranted(granted);

      const storedPref = localStorage.getItem("your-todo-push-active");
      if (storedPref !== null) {
        setPushEnabled(granted && storedPref === "true");
      } else {
        setPushEnabled(granted);
      }
    }
  }, []);

  const handlePushReq = async () => {
    if (!permGranted) {
      await requestPushPermission();
      if (typeof window !== "undefined" && "Notification" in window) {
        const granted = Notification.permission === "granted";
        setPermGranted(granted);
        setPushEnabled(granted);
        localStorage.setItem("your-todo-push-active", granted ? "true" : "false");
      }
    } else {
      const nextState = !pushEnabled;
      setPushEnabled(nextState);
      localStorage.setItem("your-todo-push-active", nextState ? "true" : "false");
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <h1 className={styles.logo}>
          <span className={styles.logoIcon}>✦</span>
          {isSharedMode ? "요청받은 할 일" : "Your To-Do"}
        </h1>
        <p className={styles.subtitle}>
          {isSharedMode ? "공유된 지시 리스트입니다" : (viewMode === "list" ? "오늘의 할 일" : "프로젝트 보드")}
        </p>
      </div>
      <div className={styles.headerRight}>
        <div className={styles.iconBtnWrapper}>
          <button
            className={styles.shareListBtn}
            onClick={handlePushReq}
            type="button"
            aria-label="알림 설정"
            title={pushEnabled ? "푸시 알림 끄기" : "푸시 알림 켜기"}
          >
            {pushEnabled ? (
              /* ON State: Filled bell with ring waves */
              <svg viewBox="0 0 24 24" fill="var(--color-accent-cyan)" stroke="var(--color-accent-cyan)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" filter="drop-shadow(0 0 4px var(--color-accent-cyan-glow))">
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M4 2C2.8 3.7 2 5.7 2 8" stroke="var(--color-accent-cyan)" strokeWidth="2" fill="none" />
                <path d="M22 8c0-2.1-.8-4-2-5.8" stroke="var(--color-accent-cyan)" strokeWidth="2" fill="none" />
              </svg>
            ) : (
              /* OFF State: Empty transparent outline bell (no strike-through) */
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" opacity="0.8">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            )}
          </button>
          <span className={styles.iconLabel}>알림</span>
        </div>

        {isSharedMode && (
          <div className={styles.iconBtnWrapper}>
            <Link
              href="/"
              className={styles.shareListBtn}
              title="내 할 일 보기"
              aria-label="내 할 일 보기"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </Link>
            <span className={styles.iconLabel}>내 할 일</span>
          </div>
        )}

        {!isSharedMode && (
          <>
            <div className={styles.iconBtnWrapper}>
              <button
                className={styles.shareListBtn}
                onClick={onOpenReceivedTasks}
                type="button"
                aria-label="수신함 (받은 일)"
                title="수신함 (받은 일)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <path d="M22 12V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  <line x1="16" y1="18" x2="22" y2="18" />
                  <line x1="19" y1="15" x2="19" y2="21" />
                </svg>
              </button>
              <span className={styles.iconLabel}>받은 일</span>
            </div>

            <div className={styles.iconBtnWrapper}>
              <button
                className={styles.shareListBtn}
                onClick={onOpenDashboard}
                type="button"
                aria-label="지시 현황판"
                title="지시 현황판 (보낸 일)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                  <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                </svg>
              </button>
              <span className={styles.iconLabel}>보낸 일</span>
            </div>

            <div className={styles.iconBtnWrapper}>
              <button
                className={styles.shareListBtn}
                onClick={onShareList}
                type="button"
                aria-label="리스트 공유"
                title="전체 리스트 공유"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" strokeLinecap="round" />
                  <polyline points="16,6 12,2 8,6" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" />
                </svg>
              </button>
              <span className={styles.iconLabel}>공유</span>
            </div>
          </>
        )}

        <div className={styles.iconBtnWrapper}>
          <ThemeSelector />
          <span className={styles.iconLabel}>테마</span>
        </div>

        {!isSharedMode && (
          <>
            <div className={styles.iconBtnWrapper}>
              <button
                className={styles.shareListBtn}
                onClick={onOpenSync}
                type="button"
                aria-label="기기 동기화"
                title="기기 동기화 (QR 연동)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </button>
              <span className={styles.iconLabel}>기기연동</span>
            </div>

            <div className={styles.iconBtnWrapper}>
              <button
                className={styles.shareListBtn}
                onClick={() => setIsSettingsOpen(true)}
                type="button"
                aria-label="앱 설정"
                title="앱 설정"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                </svg>
              </button>
              <span className={styles.iconLabel}>정보</span>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {isSettingsOpen && (
          <AppSettingsModal onClose={() => setIsSettingsOpen(false)} />
        )}
      </AnimatePresence>
    </header>
  );
}

export function MainContent({ isSharedMode }: { isSharedMode?: boolean }) {
  const { viewMode, todos } = useTodos();
  const [settingsTodo, setSettingsTodo] = useState<Todo | null>(null);
  const [showShareList, setShowShareList] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showReceivedTasks, setShowReceivedTasks] = useState(false);
  const [showSync, setShowSync] = useState(false);

  const handleOpenSettings = useCallback((todo: Todo) => {
    setSettingsTodo(todo);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setSettingsTodo(null);
  }, []);

  return (
    <>
      <Header onShareList={() => setShowShareList(true)} onOpenDashboard={() => setShowDashboard(true)} onOpenReceivedTasks={() => setShowReceivedTasks(true)} onOpenSync={() => setShowSync(true)} isSharedMode={isSharedMode} />
      <main className="app-content">
        {!isSharedMode && viewMode === "list" && <SmartInput />}

        <AnimatePresence mode="wait">
          {viewMode === "list" ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <TodoList onSettings={handleOpenSettings} isSharedMode={isSharedMode} />
            </motion.div>
          ) : (
            <motion.div
              key="board"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <KanbanBoard />
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      <BottomNav onGuideClick={() => setShowGuide(true)} />

      {/* Individual todo settings */}
      <AnimatePresence>
        {settingsTodo && (
          <ShareModal todo={settingsTodo} onClose={handleCloseSettings} />
        )}
      </AnimatePresence>

      {/* List share */}
      <AnimatePresence>
        {showShareList && (
          <ShareListModal onClose={() => setShowShareList(false)} />
        )}
      </AnimatePresence>

      <DelegationDashboard isOpen={showDashboard} onClose={() => setShowDashboard(false)} />
      <ReceivedTasksDashboard isOpen={showReceivedTasks} onClose={() => setShowReceivedTasks(false)} />
      <GuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />

      <AnimatePresence>
        {showSync && (
          <DeviceSyncModal onClose={() => setShowSync(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

export default function Home() {
  return (
    <TodoProvider>
      <MainContent />
    </TodoProvider>
  );
}
