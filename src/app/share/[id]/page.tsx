"use client";

import React, { useEffect, useState, Suspense, useCallback } from "react";
import { useParams } from "next/navigation";
import { TodoProvider, useTodos } from "@/context/TodoContext";
import NicknameModal from "@/components/NicknameModal/NicknameModal";
import { useShareNickname } from "@/hooks/useShareNickname";
import styles from "./share.module.css";
import { db } from "@/lib/firebase";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import LaunchAppButton from "@/components/LaunchAppButton/LaunchAppButton";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

function ShareTaskCard({ todoId, todoWorkspaceId, myNickname }: { todoId: string; todoWorkspaceId: string; myNickname: string }) {
    const { todos, completeTodo } = useTodos();
    const todo = todos.find(t => t.id === todoId);
    const [actionDone, setActionDone] = useState(false);

    const handleCompleteTask = useCallback(() => {
        if (todo) {
            completeTodo(todo.id);
            setActionDone(true);
            if (navigator.vibrate) navigator.vibrate(50);
        }
    }, [todo, completeTodo]);

    if (!todo) {
        return (
            <div className={styles.loadingInner}>
                <div className={styles.spinnerSmall} />
                <p>할 일 정보를 불러오는 중...</p>
            </div>
        );
    }

    const formattedDeadline = todo.deadline ? format(new Date(todo.deadline), "yyyy년 MM월 dd일 a hh:mm", { locale: ko }) : "지정 안 됨";
    const formattedRemind = todo.remindAt ? format(new Date(todo.remindAt), "yyyy년 MM월 dd일 a hh:mm", { locale: ko }) : null;

    return (
        <div className={styles.cardContainer}>
            <div className={styles.cardHeader}>
                <span className={styles.badge}>📬 작업 요청</span>
                <h1 className={styles.title}>할 일 요청이 도착했습니다</h1>
            </div>

            <div className={styles.cardBody}>
                <div className={styles.taskSection}>
                    <div className={styles.senderInfo}>
                        <span className={styles.avatar}>{todo.createdBy ? todo.createdBy.charAt(0) : "👤"}</span>
                        <div>
                            <p className={styles.senderLabel}>보낸 사람</p>
                            <p className={styles.senderName}>{todo.createdBy || "누군가"}</p>
                        </div>
                    </div>

                    <div className={styles.taskContent}>
                        <p className={styles.taskLabel}>요청 내용</p>
                        <h2 className={styles.taskTitle}>{todo.title}</h2>
                    </div>

                    <div className={styles.dateMeta}>
                        <div className={styles.dateItem}>
                            <span className={styles.dateIcon}>📅</span>
                            <div>
                                <p className={styles.metaLabel}>마감 시간</p>
                                <p className={styles.metaValue}>{formattedDeadline}</p>
                            </div>
                        </div>
                        {formattedRemind && (
                            <div className={styles.dateItem}>
                                <span className={styles.dateIcon}>⏰</span>
                                <div>
                                    <p className={styles.metaLabel}>지정 알람</p>
                                    <p className={styles.metaValue}>{formattedRemind}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.actionSection}>
                    {todo.status === "done" ? (
                        <div className={styles.completedBadge}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="20" height="20">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>이 작업은 완료되었습니다!</span>
                            {todo.lastCompletedBy && <small>({todo.lastCompletedBy}님이 완료)</small>}
                        </div>
                    ) : (
                        <div className={styles.btnWrapper}>
                            <button
                                className={styles.completeBtn}
                                onClick={handleCompleteTask}
                                type="button"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                이 일 완료하기
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            <div className={styles.footerNote}>
                <p>앱을 설치하시면 나에게 할당된 모든 할 일을 모아보고 실시간 알림을 받을 수 있습니다.</p>
            </div>
        </div>
    );
}

function SingleShareContent() {
    const params = useParams();
    const todoId = params.id as string;
    const { myNickname, showNicknameModal, handleNicknameSave } = useShareNickname();
    const [workspaceId, setWorkspaceId] = useState<string>("");

    // Fetch workspace ID and bind assignee Name in background
    useEffect(() => {
        if (!db || !todoId) return;

        const fetchTodoAndBind = async () => {
            try {
                const docRef = doc(db as any, "todos", todoId);
                const snapshot = await getDoc(docRef);

                if (snapshot.exists()) {
                    const data = snapshot.data();
                    if (data.syncId) {
                        setWorkspaceId(data.syncId);
                    }
                    if (myNickname && (!data.assigneeName || data.assigneeName === myNickname)) {
                        if (data.assigneeName !== myNickname) {
                            await updateDoc(docRef, { assigneeName: myNickname }).catch(e => console.error(e));
                        }
                    }
                }
            } catch (err) {
                console.error("Binding error:", err);
            }
        };
        fetchTodoAndBind();
    }, [todoId, myNickname]);

    if (showNicknameModal && !myNickname) {
        return <NicknameModal isOpen={true} onSave={handleNicknameSave} />;
    }

    if (!myNickname) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p>요청받은 할 일을 준비하는 중입니다...</p>
            </div>
        );
    }

    return (
        <TodoProvider todoId={todoId}>
            <div className={styles.shareWrapper}>
                <div className={styles.bannerContainer}>
                    <LaunchAppButton todoId={todoId} workspaceId={workspaceId} />
                </div>
                <main className={styles.mainContainer}>
                    <ShareTaskCard todoId={todoId} todoWorkspaceId={workspaceId} myNickname={myNickname} />
                </main>
            </div>
        </TodoProvider>
    );
}

export default function SharePage() {
    return (
        <Suspense fallback={
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p>로딩 중...</p>
            </div>
        }>
            <SingleShareContent />
        </Suspense>
    );
}
