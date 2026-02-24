"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import { MainContent } from "@/app/page";
import { TodoProvider } from "@/context/TodoContext";
import NicknameModal from "@/components/NicknameModal/NicknameModal";
import styles from "./share.module.css";
import { db } from "@/lib/firebase";
import { updateDoc, doc, getDoc } from "firebase/firestore";

function SingleShareContent() {
    const params = useParams();
    const todoId = params.id as string;
    const [myNickname, setMyNickname] = useState<string | null>(null);
    const [showNicknameModal, setShowNicknameModal] = useState(false);

    useEffect(() => {
        try {
            const nickname = localStorage.getItem("your-todo-nickname");
            if (nickname) {
                setMyNickname(nickname);
            } else {
                setShowNicknameModal(true);
            }
        } catch (err) {
            console.warn("localStorage access denied", err);
            setShowNicknameModal(true);
        }
    }, []);

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

    const handleNicknameSave = (name: string) => {
        localStorage.setItem("your-todo-nickname", name);
        setMyNickname(name);
        setShowNicknameModal(false);
    };

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
