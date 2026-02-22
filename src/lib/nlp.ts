import * as chrono from "chrono-node";
import type { ParsedInput } from "@/types/todo";

// Korean casual date/time references
const KOREAN_DATE_MAP: Record<string, () => Date> = {
    오늘: () => new Date(),
    내일: () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d;
    },
    모레: () => {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        return d;
    },
    "이번 주": () => {
        const d = new Date();
        const day = d.getDay();
        d.setDate(d.getDate() + (7 - day));
        return d;
    },
    "다음 주": () => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d;
    },
};

const KOREAN_TIME_REGEX =
    /(?:(오전|오후|아침|저녁|밤)\s*)?(\d{1,2})\s*시\s*(?:(\d{1,2})\s*분)?/;
const KOREAN_DEADLINE_REGEX = /(.+?)까지\s*/;

/**
 * Parse Korean natural language input into title + deadline.
 * e.g. "내일 오후 3시까지 유튜브 썸네일 제작"
 *      → { title: "유튜브 썸네일 제작", deadline: tomorrow 15:00 }
 */
export function parseSmartInput(raw: string): ParsedInput {
    const text = raw.trim();
    if (!text) return { title: "", deadline: null, rawText: text };

    let deadline: Date | null = null;
    let remaining = text;

    // 1) Try to extract "~까지" pattern
    const deadlineMatch = text.match(KOREAN_DEADLINE_REGEX);
    if (deadlineMatch) {
        const beforeDeadline = deadlineMatch[1].trim();
        remaining = text.slice(deadlineMatch[0].length).trim();

        // Try Korean date keywords
        for (const [keyword, dateFn] of Object.entries(KOREAN_DATE_MAP)) {
            if (beforeDeadline.includes(keyword)) {
                deadline = dateFn();

                // Add time if specified
                const timeMatch = beforeDeadline.match(KOREAN_TIME_REGEX);
                if (timeMatch && deadline) {
                    let hours = parseInt(timeMatch[2], 10);
                    const minutes = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
                    const period = timeMatch[1];

                    if (period === "오후" || period === "저녁" || period === "밤") {
                        if (hours < 12) hours += 12;
                    } else if (period === "오전" || period === "아침") {
                        if (hours === 12) hours = 0;
                    }

                    deadline.setHours(hours, minutes, 0, 0);
                }
                break;
            }
        }

        // Fallback to chrono-node for English / ISO dates
        if (!deadline) {
            const parsed = chrono.parseDate(beforeDeadline);
            if (parsed) deadline = parsed;
        }
    }

    // 2) If no "까지" pattern, try chrono on the whole string
    if (!deadline) {
        const parsed = chrono.parse(text);
        if (parsed.length > 0) {
            deadline = parsed[0].start.date();
            // Remove the matched date text from the title
            const matchStart = parsed[0].index;
            const matchEnd = matchStart + parsed[0].text.length;
            remaining =
                (text.slice(0, matchStart) + " " + text.slice(matchEnd)).trim();
        }
    }

    // Clean up remaining title
    remaining = remaining.replace(/\s+/g, " ").trim();

    return {
        title: remaining || text,
        deadline,
        rawText: text,
    };
}
