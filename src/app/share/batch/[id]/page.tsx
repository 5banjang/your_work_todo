"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import { MainContent } from "@/app/page";
import { TodoProvider } from "@/context/TodoContext";
import NicknameModal from "@/components/NicknameModal/NicknameModal";
import styles from "../../[id]/share.module.css";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

function BatchShareContent() {
    const params = useParams();
    const batchId = params.id as string;
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
        if (!myNickname || !db || !batchId) return;

        const applyBinding = async () => {
            try {
                const q = query(collection(db as any, "todos"), where("batchId", "==", batchId));
                const snapshot = await getDocs(q);

                const updatePromises = snapshot.docs.map(async (document) => {
                    const data = document.data();
                    if (!data.assigneeName || data.assigneeName === myNickname) {
                        if (data.assigneeName !== myNickname) {
                            await updateDoc(doc(db as any, "todos", document.id), { assigneeName: myNickname }).catch(e => console.error(e));
                        }
                    }
                });
                Promise.all(updatePromises).catch(console.error);
            } catch (err) {
                console.error("Binding error:", err);
            }
        };
        applyBinding();
    }, [batchId, myNickname]);

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
                <p>요청받은 할 일 목록을 준비하는 중입니다...</p>
            </div>
        );
    }

    return (
        <TodoProvider batchId={batchId}>
            <MainContent isSharedMode={true} />
        </TodoProvider>
    );
}

export default function BatchSharePage() {
    return (
        <Suspense fallback={
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p>로딩 중...</p>
            </div>
        }>
            <BatchShareContent />
        </Suspense>
    );
}
