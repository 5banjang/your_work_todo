"use client";

import React, { useState, useEffect } from "react";
import NicknameModal from "@/components/NicknameModal/NicknameModal";

export default function GlobalNicknameCheck() {
    const [showModal, setShowModal] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Delay slightly strictly for a smoother entrance animation after page load
        const timer = setTimeout(() => {
            const savedName = localStorage.getItem("your-todo-nickname");
            if (!savedName || savedName.trim() === "") {
                setShowModal(true);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const handleSave = (name: string) => {
        localStorage.setItem("your-todo-nickname", name);
        setShowModal(false);
    };

    if (!isMounted) return null;

    return <NicknameModal isOpen={showModal} onSave={handleSave} />;
}
