"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import NicknameModal from "@/components/NicknameModal/NicknameModal";
import { useShareNickname } from "@/hooks/useShareNickname";
import styles from "../../[id]/share.module.css";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, setDoc, doc, getDoc } from "firebase/firestore";
import { generateId } from "@/lib/utils";

function TemplateShareContent() {
    const params = useParams();
    const router = useRouter();
    const todoId = params.id as string;
    const { myNickname, showNicknameModal, handleNicknameSave } = useShareNickname();
    const [loadingMsg, setLoadingMsg] = useState("마스터 템플릿 정보를 가져오는 중...");

    useEffect(() => {
        if (!myNickname || !db || !todoId) return;

        const processTemplateCopy = async () => {
            try {
                setLoadingMsg("나에게 할당된 작업 확인 중...");
                const todosRef = collection(db as any, "todos");

                // Check if a copy of this template is already assigned to this user
                const q = query(
                    todosRef,
                    where("parentTemplateId", "==", todoId),
                    where("assigneeName", "==", myNickname)
                );
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    // An copy already exists! Redirect to that copy's share page
                    const existingId = snapshot.docs[0].id;
                    setLoadingMsg("이미 생성된 전용 페이지로 이동 중...");
                    router.replace(`/share/${existingId}`);
                    return;
                }

                // If not, fetch the original master todo template
                setLoadingMsg("새로운 개인 할 일 복제본 생성 중...");
                const templateDocRef = doc(db as any, "todos", todoId);
                const templateSnap = await getDoc(templateDocRef);

                if (templateSnap.exists()) {
                    const templateData = templateSnap.data();

                    const newTodoId = generateId();
                    const now = new Date();
                    const clonedTask = {
                        ...templateData,
                        id: newTodoId,
                        assigneeName: myNickname,
                        status: "todo",
                        parentTemplateId: todoId,
                        createdAt: now,
                        updatedAt: now,
                    };
                    
                    // Clear fields that shouldn't copy directly
                    delete (clonedTask as any).completedAt;
                    delete (clonedTask as any).lastCompletedBy;
                    delete (clonedTask as any).shareLink; // It will be generated when they customize it

                    await setDoc(doc(db as any, "todos", newTodoId), clonedTask);
                    setLoadingMsg("전용 할 일 페이지 준비 완료. 이동 중...");
                    router.replace(`/share/${newTodoId}`);
                } else {
                    setLoadingMsg("존재하지 않는 템플릿 링크이거나 삭제된 마스터 작업입니다.");
                }
            } catch (err) {
                console.error("Template Copy error:", err);
                setLoadingMsg("오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
            }
        };

        processTemplateCopy();
    }, [todoId, myNickname, router]);

    if (showNicknameModal && !myNickname) {
        return <NicknameModal isOpen={true} onSave={handleNicknameSave} />;
    }

    return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>{loadingMsg}</p>
        </div>
    );
}

export default function TemplateSharePage() {
    return (
        <Suspense fallback={
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p>로딩 중...</p>
            </div>
        }>
            <TemplateShareContent />
        </Suspense>
    );
}
