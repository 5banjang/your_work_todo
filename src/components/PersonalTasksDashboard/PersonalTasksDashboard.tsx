"use client";

import React from "react";
import { useTodos } from "@/context/TodoContext";
import type { Todo } from "@/types/todo";
import TaskDashboard from "@/components/TaskDashboard/TaskDashboard";

interface PersonalTasksDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PersonalTasksDashboard({ isOpen, onClose }: PersonalTasksDashboardProps) {
    const { todos } = useTodos();

    // 내 할 일 (category가 'personal'인 것)
    const personalTasks = todos.filter(t => t.category === "personal");

    // 상태별 그룹핑 (내 할 일은 보통 보낸 사람이 없으므로 상태별로 보여주는 게 좋습니다)
    const groupedByStatus = personalTasks.reduce((acc, t) => {
        const s = t.status === "todo" ? "할 일" : (t.status === "done" ? "완료됨" : "진행 중");
        if (!acc[s]) acc[s] = [];
        acc[s].push(t);
        return acc;
    }, {} as Record<string, Todo[]>);

    return (
        <TaskDashboard
            isOpen={isOpen}
            onClose={onClose}
            groupedTasks={groupedByStatus}
            title="내 할 일 (비공개)"
            icon="🔒"
            selectedTitle={(status) => `상태: ${status}`}
            emptyIcon="📝"
            emptyText="아직 나만의 할 일이 없습니다."
            emptySubText="할 일을 입력할 때 '내 할 일로' 버튼을 눌러보세요."
        />
    );
}
