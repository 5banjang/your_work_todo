export type TodoStatus = "todo" | "in_progress" | "waiting" | "done";

export type UrgencyLevel = "safe" | "warning" | "danger" | "overdue";

export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
}



export interface Todo {
    id: string;
    title: string;
    description?: string;
    status: TodoStatus;
    order: number;

    // Timers
    deadline: Date | null;
    remindAt: Date | null;

    // Delegation
    assigneeId?: string;
    assigneeName?: string;
    createdBy: string;
    shareLink?: string;
    batchId?: string;
    checklist: ChecklistItem[];


    // Metadata
    syncId?: string;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    lastCompletedBy?: string;
}

export interface ParsedInput {
    title: string;
    deadline: Date | null;
    rawText: string;
}
