import { differenceInMinutes, differenceInHours, isPast } from "date-fns";
import type { UrgencyLevel } from "@/types/todo";

/**
 * Calculate urgency level based on time remaining until deadline.
 */
export function getUrgencyLevel(deadline: Date | null): UrgencyLevel {
    if (!deadline) return "safe";

    if (isPast(deadline)) return "overdue";

    const minutesLeft = differenceInMinutes(deadline, new Date());

    if (minutesLeft <= 60) return "danger"; // < 1hr
    if (minutesLeft <= 180) return "warning"; // < 3hrs

    return "safe";
}

/**
 * Format remaining time as a human-readable Korean string.
 */
export function formatTimeRemaining(deadline: Date | null): string {
    if (!deadline) return "";

    if (isPast(deadline)) return "마감 초과";

    const now = new Date();
    const mins = differenceInMinutes(deadline, now);

    if (mins < 1) return "곧 마감";
    if (mins < 60) return `${mins}분 남음`;

    const hrs = differenceInHours(deadline, now);
    if (hrs < 24) {
        const remainMins = mins % 60;
        return remainMins > 0 ? `${hrs}시간 ${remainMins}분 남음` : `${hrs}시간 남음`;
    }

    const days = Math.floor(hrs / 24);
    const remainHrs = hrs % 24;
    return remainHrs > 0 ? `${days}일 ${remainHrs}시간 남음` : `${days}일 남음`;
}

/**
 * Generate a unique-enough ID (for client-side).
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
