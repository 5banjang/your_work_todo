"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTodos, setSyncId, getSyncId } from "@/context/TodoContext";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { collection, query, where, getDocs, writeBatch } from "firebase/firestore";

function SyncContent() {
    const params = useParams();
    const router = useRouter();
    const { activeSyncId, updateSyncId } = useTodos();
    const newSyncId = params.id as string;

    const [statusText, setStatusText] = useState("기기 연동을 준비 중입니다...");

    useEffect(() => {
        if (!newSyncId) {
            router.replace("/");
            return;
        }

        if (!activeSyncId) return; // wait until context initializes the syncId

        const currentLocalSyncId = activeSyncId;

        // If trying to sync to the exact same ID, do nothing and redirect
        if (currentLocalSyncId === newSyncId) {
            window.location.href = "/";
            return;
        }

        const performMergeAndRedirect = async () => {
            setStatusText("기존 할 일 데이터를 안전하게 병합 중입니다...");

            // 1. Attempt to merge existing local tasks to the new sync ID.
            // If this fails (e.g. firestore validation error on legacy items), we just log it.
            // Failing to merge shouldn't stop the device from syncing to the new ID.
            try {
                if (isFirebaseConfigured() && db) {
                    const todosRef = collection(db, "todos");
                    const q = query(todosRef, where("syncId", "==", currentLocalSyncId));
                    const myTodosSnap = await getDocs(q);

                    if (!myTodosSnap.empty) {
                        const batch = writeBatch(db);
                        let count = 0;
                        myTodosSnap.forEach((d) => {
                            batch.update(d.ref, { syncId: newSyncId, updatedAt: new Date() });
                            count++;
                        });
                        await batch.commit();
                        console.log(`Merged ${count} tasks to new syncId: ${newSyncId}`);
                    }
                }
            } catch (err) {
                console.error("Non-fatal error during task merge:", err);
                // We do not abort. We proceed to link the device anyway.
            }

            // 2. Link the device definitively
            try {
                updateSyncId(newSyncId);

                if (typeof window !== "undefined") {
                    localStorage.removeItem("your-todo-data");
                }

                setStatusText("연동이 완료되었습니다! 이동합니다.");

                setTimeout(() => {
                    window.location.href = "/";
                }, 800);
            } catch (err) {
                console.error("Critical error setting sync ID:", err);
                setStatusText("기기 연동 중 치명적인 오류가 발생했습니다.");
                setTimeout(() => {
                    window.location.href = "/";
                }, 2000);
            }
        };

        performMergeAndRedirect();

    }, [newSyncId, router, activeSyncId, updateSyncId]);

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            width: "100vw",
            backgroundColor: "var(--color-bg)",
            color: "var(--color-text-primary)",
            fontFamily: "var(--font-pretendard)",
            padding: "20px",
            textAlign: "center"
        }}>
            <div style={{
                width: "40px",
                height: "40px",
                border: "3px solid var(--color-accent-cyan)",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                marginBottom: "20px"
            }} />
            <h2 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "8px" }}>기기 연동 진행 중...</h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>{statusText}</p>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

import { TodoProvider } from "@/context/TodoContext";

export default function SyncPage() {
    return (
        <TodoProvider>
            <Suspense fallback={
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100vh",
                    backgroundColor: "var(--color-bg)",
                    color: "var(--color-text-muted)"
                }}>
                    로딩 중...
                </div>
            }>
                <SyncContent />
            </Suspense>
        </TodoProvider>
    );
}
