"use client";

import React from "react";
import { useTodos } from "@/context/TodoContext";
import type { Todo } from "@/types/todo";
import TaskDashboard from "@/components/TaskDashboard/TaskDashboard";

interface DelegationDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DelegationDashboard({ isOpen, onClose }: DelegationDashboardProps) {
    const { todos } = useTodos();
    const myNickname = typeof window !== "undefined" ? localStorage.getItem("your-todo-nickname") || "누군가" : "누군가";

    // 내가 만들고 다른 사람에게 위임했거나 배치 공유한 할 일
    const myDelegatedTasks = todos.filter(t => t.createdBy === myNickname && (t.batchId || (t.assigneeName && t.assigneeName !== myNickname)));

    // 담당자별 그룹핑
    const groupedByAssignee = myDelegatedTasks.reduce((acc, t) => {
        const name = t.assigneeName || "⏳ 수신 대기중 (미확인)";
        if (!acc[name]) acc[name] = [];
        acc[name].push(t);
        return acc;
    }, {} as Record<string, Todo[]>);

    return (
        <TaskDashboard
            isOpen={isOpen}
            onClose={onClose}
            groupedTasks={groupedByAssignee}
            title="지시 현황판 (보낸 일)"
            icon="📤"
            selectedTitle={(name) => `${name}님의 지시 현황`}
            emptyIcon="📬"
            emptyText="아직 다른 사람에게 전달한 할 일이 없습니다."
            emptySubText="메인 리스트에서 여러 항목을 체크한 뒤 [공유하기]를 눌러 링크를 전달해보세요."
            readOnly={true}
        />
    );
}
