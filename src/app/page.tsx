"use client";

import React, { useState, useCallback, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { TodoProvider, useTodos } from "@/context/TodoContext";
import { generateId } from "@/lib/utils";
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
import { isFirebaseConfigured } from "@/lib/firebase";
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
                title="기기 동기화"
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

        {typeof window !== "undefined" && !isFirebaseConfigured() && (
          <div style={{
            background: "rgba(255, 50, 50, 0.1)",
            border: "1px solid rgba(255, 50, 50, 0.5)",
            color: "#ff6b6b",
            padding: "12px",
            borderRadius: "8px",
            margin: "0 20px 16px",
            fontSize: "0.85rem",
            textAlign: "center",
            lineHeight: "1.4"
          }}>
            ⚠️ <strong>클라우드(DB) 연결 실패!</strong><br />
            Vercel 환경 변수가 정상적으로 설정되지 않았습니다.<br />
            현재 작성하는 할 일은 기기 간 동기화되지 않습니다.
          </div>
        )}

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

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeW, setActiveW] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState<boolean>(false);
  const [pasteUrl, setPasteUrl] = useState("");

  useEffect(() => {
    const w = searchParams?.get("w");
    if (!w) {
      const lastW = localStorage.getItem("last_workspace");
      if (lastW) {
        // We have a stored workspace, redirect to it
        router.replace(`/?w=${lastW}`);
      } else {
        // FIRST LAUNCH or PWA FRESH LAUNCH!
        // Show the Welcome Screen, DO NOT auto-generate.
        setShowWelcome(true);
      }
    } else {
      // We have an active workspace in URL
      localStorage.setItem("last_workspace", w);
      setActiveW(w);
      setShowWelcome(false);
    }
  }, [searchParams, router]);

  const handleCreateNew = () => {
    const newW = generateId() + "-" + generateId();
    window.location.href = `/?w=${newW}`;
  };

  const handleJoinExisting = (e: React.FormEvent) => {
    e.preventDefault();
    const urlTrimmed = pasteUrl.trim();
    const wMatch = urlTrimmed.match(/[?&]w=([^&]+)/);
    const idToUse = wMatch ? wMatch[1] : (urlTrimmed.startsWith('w=') ? urlTrimmed.replace('w=', '') : null);

    if (idToUse) {
      window.location.href = `/?w=${idToUse}`;
    } else if (urlTrimmed && !urlTrimmed.includes('http') && !urlTrimmed.includes('=')) {
      window.location.href = `/?w=${urlTrimmed}`;
    } else {
      alert('올바른 작업실 주소(또는 ID)가 아닙니다.');
    }
  };

  if (showWelcome) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "24px", color: "var(--color-text-primary)", background: "var(--color-bg-base)", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: "100%", maxWidth: "340px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "8px", textAlign: "center", fontWeight: "bold" }}>환영합니다 👋</h1>
          <p style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)", marginBottom: "32px", textAlign: "center", lineHeight: "1.5" }}>
            홈 화면 앱(또는 새 브라우저) 환경입니다.<br />
            어떻게 시작할까요?
          </p>

          <div style={{ width: "100%", background: "var(--color-bg-elevated)", padding: "24px", borderRadius: "16px", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "24px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>

            <button
              onClick={handleCreateNew}
              style={{ width: "100%", padding: "16px", borderRadius: "12px", background: "var(--color-accent-cyan)", color: "#000", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "1.05rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              새로운 할일 시작
            </button>

            <div style={{ width: "100%", height: "1px", background: "var(--color-border)", position: "relative", margin: "4px 0" }}>
              <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "var(--color-bg-elevated)", padding: "0 12px", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>또는</span>
            </div>

            <form onSubmit={handleJoinExisting} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "0.95rem", fontWeight: "bold", color: "var(--color-text-primary)", display: "block", marginBottom: "4px" }}>기존 작업실 연결 (동기화 복원)</label>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", lineHeight: "1.4" }}>
                  사파리나 카카오톡 브라우저에서 '복사'한 주소를 붙여넣어 주세요.
                </p>
              </div>
              <input
                type="text"
                value={pasteUrl}
                onChange={(e) => setPasteUrl(e.target.value)}
                placeholder="예: https://.../?w=..."
                style={{ width: "100%", padding: "14px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-text-primary)", fontSize: "0.95rem", outline: "none" }}
              />
              <button
                type="submit"
                disabled={!pasteUrl}
                style={{ width: "100%", padding: "14px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.1)", color: "var(--color-text-primary)", fontWeight: "bold", border: "none", cursor: pasteUrl ? "pointer" : "not-allowed", opacity: pasteUrl ? 1 : 0.4, transition: "opacity 0.2s" }}
              >
                주소 연결하기
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!activeW) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "var(--color-text-muted)" }}>
        <div style={{
          width: "30px", height: "30px", border: "2px solid var(--color-accent-cyan)",
          borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite"
        }} />
      </div>
    );
  }

  return (
    <TodoProvider key={activeW} workspaceId={activeW}>
      <MainContent />
    </TodoProvider>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "var(--color-text-muted)" }}>
        <div style={{
          width: "30px", height: "30px", border: "2px solid var(--color-accent-cyan)",
          borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite"
        }} />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
