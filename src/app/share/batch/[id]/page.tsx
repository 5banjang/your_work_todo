"use client";

import React, { useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import { MainContent } from "@/app/page";
import { TodoProvider } from "@/context/TodoContext";
import NicknameModal from "@/components/NicknameModal/NicknameModal";
import { useShareNickname } from "@/hooks/useShareNickname";
import styles from "../../[id]/share.module.css";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

function BatchShareContent() {
    const params = useParams();
    const batchId = params.id as string;
    const { myNickname, showNicknameModal, handleNicknameSave } = useShareNickname();

    // Perform bindings in the background. If a task isn't assigned, assign to this user.
    // IF MULTIPLE PEOPLE use the same batchId, we clone the tasks for each person.
    useEffect(() => {
        if (!myNickname || !db || !batchId) return;

        const applyBinding = async () => {
            try {
                const todosRef = collection(db as any, "todos");
                const q = query(todosRef, where("batchId", "==", batchId));
                const snapshot = await getDocs(q);

                const existingTasks = snapshot.docs.map(d => d.data());

                // Find original template tasks (those not assigned yet, or created by the sender)
                // Actually, let's look for tasks in this batch that DO NOT belong to myNickname yet.
                const myExistingInBatch = existingTasks.filter(t => t.assigneeName === myNickname);
                const templateTasks = existingTasks.filter(t => !t.assigneeName || (t.createdBy !== myNickname && !myExistingInBatch.some(m => m.title === t.title)));

                if (templateTasks.length > 0 && myExistingInBatch.length === 0) {
                    const { generateId } = await import("@/lib/utils");
                    const { doc, setDoc } = await import("firebase/firestore");

                    for (const t of templateTasks) {
                        const newId = generateId();
                        const clonedTask = {
                            ...t,
                            id: newId,
                            assigneeName: myNickname,
                            status: "todo",
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            // Keep batchId so sender sees it
                        };
                        delete (clonedTask as any).completedAt;
                        delete (clonedTask as any).lastCompletedBy;

                        await setDoc(doc(db as any, "todos", newId), clonedTask).catch(e => console.error(e));
                    }
                }
            } catch (err) {
                console.error("Cloning/Binding error:", err);
            }
        };
        applyBinding();
    }, [batchId, myNickname]);

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
