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

const KOREAN_NUMBER_MAP: Record<string, number> = {
    "한": 1, "두": 2, "세": 3, "네": 4, "다섯": 5, "여섯": 6, "일곱": 7, "여덟": 8, "아홉": 9, "열": 10, "열한": 11, "열두": 12,
    "일": 1, "이": 2, "삼": 3, "사": 4, "오": 5, "육": 6, "칠": 7, "팔": 8, "구": 9, "십": 10, "십일": 11, "십이": 12
};

const KOREAN_TIME_REGEX = /(?:(오전|오후|아침|저녁|낮|밤)\s*)?(\d{1,2}|[가-힣]{1,2})\s*시\s*(?:(\d{1,2})\s*분|반)?/;
const KOREAN_DATE_REGEX = /(오늘|내일|내이|모레|이번\s*주|다음\s*주)/;

/**
 * Parse Korean natural language input into title + deadline.
 * e.g. "내일 오후 3시까지 유튜브 썸네일 검토"
 *      → { title: "유튜브 썸네일 검토", deadline: tomorrow 15:00 }
 */
export function parseSmartInput(raw: string): ParsedInput {
    const text = raw.trim();
    if (!text) return { title: "", deadline: null, rawText: text };

    let deadline: Date | null = null;
    let remaining = text;

    // 1) Extract Korean Date explicitly
    const dateMatch = text.match(KOREAN_DATE_REGEX);
    let baseDate = new Date(); // Default to today

    if (dateMatch) {
        let keyword = dateMatch[1].replace(/\s+/g, " "); // normalize spaces
        if (keyword === "내이") keyword = "내일"; // handle common typo
        const dateFn = KOREAN_DATE_MAP[keyword];

        if (dateFn) {
            baseDate = dateFn();
            deadline = baseDate;
            // Remove just the date string for now
            remaining = remaining.replace(dateMatch[0], "");
        }
    }

    // 2) Extract Korean Time specifically
    const timeMatch = remaining.match(KOREAN_TIME_REGEX);

    if (timeMatch) {
        if (!deadline) deadline = baseDate; // Lock in the baseDate if it was strictly time-based

        const period = timeMatch[1];
        const hoursStr = timeMatch[2];

        let hours = parseInt(hoursStr, 10);
        if (isNaN(hours)) {
            hours = KOREAN_NUMBER_MAP[hoursStr] || 0;
        }

        let minutes = 0;
        if (timeMatch[0].includes("반")) {
            minutes = 30;
        } else if (timeMatch[3]) {
            minutes = parseInt(timeMatch[3], 10);
        }

        if (period === "오후" || period === "저녁" || period === "밤") {
            if (hours < 12) hours += 12;
        } else if (period === "오전" || period === "아침") {
            if (hours === 12) hours = 0;
        }

        deadline.setHours(hours, minutes, 0, 0);

        remaining = remaining.replace(timeMatch[0], "");
    }

    if (deadline) {
        // Clean trailing particles leftover from natural speech
        remaining = remaining.replace(/(에|까지|에까지|부터)\s*$/g, "");
        remaining = remaining.replace(/\s+(에|까지|에까지|부터)\s+/g, " ");
        remaining = remaining.replace(/^(에|까지|에까지|부터)\s+/g, "");
    }

    // 3) Fallback to chrono-node if neither Korean date nor time caught anything
    if (!deadline) {
        const parsed = chrono.parse(text);
        if (parsed.length > 0) {
            deadline = parsed[0].start.date();
            const matchStart = parsed[0].index;
            const matchEnd = matchStart + parsed[0].text.length;
            remaining = (text.slice(0, matchStart) + " " + text.slice(matchEnd)).trim();
            remaining = remaining.replace(/(에|까지|에까지|부터)\s*$/g, "");
        }
    }

    // Clean up remaining title whitespace
    remaining = remaining.replace(/\s+/g, " ").trim();

    // One final cleanup for trailing particles attached directly to words
    remaining = remaining.replace(/(에|까지|에까지|부터)$/, "").trim();

    return {
        title: remaining || text,
        deadline,
        rawText: text,
    };
}
