"use client";

import React from "react";
import { useTodos } from "@/context/TodoContext";
import type { Todo } from "@/types/todo";
import TaskDashboard from "@/components/TaskDashboard/TaskDashboard";

interface ReceivedTasksDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ReceivedTasksDashboard({ isOpen, onClose }: ReceivedTasksDashboardProps) {
    const { todos, user } = useTodos();
    const myNickname = typeof window !== "undefined" ? localStorage.getItem("your-todo-nickname") || "누군가" : "누군가";

    // 내가 받은 할 일 (다른 사람이 만들고 나에게 배정된 것)
    const myReceivedTasks = todos.filter(t => {
        const isForMe = t.assigneeName === myNickname;
        const isNotCreatedByMe = user ? t.userId !== user.uid : t.createdBy !== myNickname;
        return isForMe && isNotCreatedByMe;
    });

    // 보낸 사람별 그룹핑
    const groupedBySender = myReceivedTasks.reduce((acc, t) => {
        const sender = t.createdBy || "누군가";
        if (!acc[sender]) acc[sender] = [];
        acc[sender].push(t);
        return acc;
    }, {} as Record<string, Todo[]>);

    return (
        <TaskDashboard
            isOpen={isOpen}
            onClose={onClose}
            groupedTasks={groupedBySender}
            title="수신함 (받은 일)"
            icon="📥"
            selectedTitle={(name) => `${name}님이 보낸 일`}
            emptyIcon="📭"
            emptyText="아직 다른 사람에게서 받은 할 일이 없습니다."
            emptySubText="누군가 공유 링크를 통해 회원님을 담당자로 지정하면 이곳에 나타납니다."
        />
    );
}
