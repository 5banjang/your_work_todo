export type TodoStatus = "todo" | "in_progress" | "waiting" | "done";

export type UrgencyLevel = "safe" | "warning" | "danger" | "overdue";

export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
}

export interface GeoFence {
    lat: number;
    lng: number;
    radius: number; // meters
    label: string;
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
    checklist: ChecklistItem[];

    // Location
    geoFence?: GeoFence;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}

export interface ParsedInput {
    title: string;
    deadline: Date | null;
    rawText: string;
}
