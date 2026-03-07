"use client";

import { useEffect, useState } from "react";

/**
 * 공유 페이지에서 닉네임 확인/설정을 위한 커스텀 훅.
 * share/[id]와 share/batch/[id] 페이지에서 중복되었던 로직을 통합.
 */
export function useShareNickname() {
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

    const handleNicknameSave = (name: string) => {
        localStorage.setItem("your-todo-nickname", name);
        setMyNickname(name);
        setShowNicknameModal(false);
    };

    return {
        myNickname,
        showNicknameModal,
        handleNicknameSave,
    };
}
