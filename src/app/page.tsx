"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TodoProvider, useTodos } from "@/context/TodoContext";
import SmartInput from "@/components/SmartInput/SmartInput";
import TodoList from "@/components/TodoList/TodoList";
import KanbanBoard from "@/components/KanbanBoard/KanbanBoard";
import BottomNav from "@/components/BottomNav/BottomNav";
import ShareModal from "@/components/ShareModal/ShareModal";
import ShareListModal from "@/components/ShareListModal/ShareListModal";
import GeoFenceAlert from "@/components/GeoFenceAlert/GeoFenceAlert";
import { useGeoFence } from "@/hooks/useGeoFence";
import ThemeSelector from "@/components/ThemeSelector/ThemeSelector";
import type { Todo } from "@/types/todo";
import styles from "./page.module.css";

function Header({ onShareList }: { onShareList: () => void }) {
  const { viewMode, fcmToken, requestPushPermission } = useTodos();
  const [permGranted, setPermGranted] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

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
          Your To-Do
        </h1>
        <p className={styles.subtitle}>
          {viewMode === "list" ? "오늘의 할 일" : "프로젝트 보드"}
        </p>
      </div>
      <div className={styles.headerRight}>
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
            /* OFF State: Crossed out gray bell */
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" opacity="0.8">
              <path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5" />
              <path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              <line x1="2" y1="2" x2="22" y2="22" stroke="var(--color-danger)" strokeWidth="2" />
            </svg>
          )}
        </button>
        <button
          className={styles.shareListBtn}
          onClick={onShareList}
          type="button"
          aria-label="리스트 공유"
          title="전체 리스트 공유"
          style={{ marginLeft: 8 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" strokeLinecap="round" />
            <polyline points="16,6 12,2 8,6" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" />
          </svg>
        </button>
        <div style={{ marginLeft: 8 }}>
          <ThemeSelector />
        </div>
      </div>
    </header>
  );
}

function MainContent() {
  const { viewMode, todos } = useTodos();
  const [settingsTodo, setSettingsTodo] = useState<Todo | null>(null);
  const [showShareList, setShowShareList] = useState(false);
  const { triggeredTodo, clearTrigger } = useGeoFence();

  const handleOpenSettings = useCallback((todo: Todo) => {
    setSettingsTodo(todo);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setSettingsTodo(null);
  }, []);

  return (
    <>
      <Header onShareList={() => setShowShareList(true)} />
      <main className="app-content">
        {viewMode === "list" && <SmartInput />}

        <AnimatePresence mode="wait">
          {viewMode === "list" ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <TodoList onSettings={handleOpenSettings} />
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

      <BottomNav />

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

      {/* GeoFence Alert */}
      <AnimatePresence>
        {triggeredTodo && (
          <GeoFenceAlert
            locationLabel={triggeredTodo.label}
            onConfirm={clearTrigger}
            onDismiss={clearTrigger}
          />
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
