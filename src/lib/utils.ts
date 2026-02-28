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
 * Format remaining time as a human-readable localized string.
 * @param deadline - The deadline date
 * @param t - Translation function (optional, falls back to Korean)
 */
export function formatTimeRemaining(deadline: Date | null, t?: (key: string) => string): string {
    if (!deadline) return "";

    const tr = t || ((key: string) => {
        const fallback: Record<string, string> = {
            "time.overdue": "마감 초과",
            "time.soon": "곧 마감",
            "time.minutesLeft": "분 남음",
            "time.hoursMinutesLeft": "시간 {m}분 남음",
            "time.hoursLeft": "시간 남음",
            "time.daysHoursLeft": "일 {h}시간 남음",
            "time.daysLeft": "일 남음",
        };
        return fallback[key] || key;
    });

    if (isPast(deadline)) return tr("time.overdue");

    const now = new Date();
    const mins = differenceInMinutes(deadline, now);

    if (mins < 1) return tr("time.soon");
    if (mins < 60) return `${mins}${tr("time.minutesLeft")}`;

    const hrs = differenceInHours(deadline, now);
    if (hrs < 24) {
        const remainMins = mins % 60;
        if (remainMins > 0) {
            return `${hrs}${tr("time.hoursMinutesLeft").replace("{m}", String(remainMins))}`;
        }
        return `${hrs}${tr("time.hoursLeft")}`;
    }

    const days = Math.floor(hrs / 24);
    const remainHrs = hrs % 24;
    if (remainHrs > 0) {
        return `${days}${tr("time.daysHoursLeft").replace("{h}", String(remainHrs))}`;
    }
    return `${days}${tr("time.daysLeft")}`;
}

/**
 * Generate a unique-enough ID (for client-side).
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
