"use client";

import React, { useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import { MainContent } from "@/app/page";
import { TodoProvider } from "@/context/TodoContext";
import NicknameModal from "@/components/NicknameModal/NicknameModal";
import { useShareNickname } from "@/hooks/useShareNickname";
import styles from "./share.module.css";
import { db } from "@/lib/firebase";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import LaunchAppButton from "@/components/LaunchAppButton/LaunchAppButton";

function SingleShareContent() {
    const params = useParams();
    const todoId = params.id as string;
    const { myNickname, showNicknameModal, handleNicknameSave } = useShareNickname();

    // Perform bindings in the background. If a task isn't assigned, assign to this user.
    useEffect(() => {
        if (!myNickname || !db || !todoId) return;

        const applyBinding = async () => {
            try {
                const docRef = doc(db as any, "todos", todoId);
                const snapshot = await getDoc(docRef);

                if (snapshot.exists()) {
                    const data = snapshot.data();
                    if (!data.assigneeName || data.assigneeName === myNickname) {
                        if (data.assigneeName !== myNickname) {
                            await updateDoc(docRef, { assigneeName: myNickname }).catch(e => console.error(e));
                        }
                    }
                }
            } catch (err) {
                console.error("Binding error:", err);
            }
        };
        applyBinding();
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
            <div style={{ padding: "10px", maxWidth: "800px", margin: "0 auto" }}>
                <LaunchAppButton />
            </div>
            <MainContent isSharedMode={true} />
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
