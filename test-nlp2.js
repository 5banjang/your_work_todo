const chrono = require('chrono-node');

const KOREAN_DATE_MAP = {
    "오늘": () => new Date(),
    "내일": () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d;
    },
    "모레": () => {
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

const KOREAN_NUMBER_MAP = {
    "한": 1, "두": 2, "세": 3, "네": 4, "다섯": 5, "여섯": 6, "일곱": 7, "여덟": 8, "아홉": 9, "열": 10, "열한": 11, "열두": 12,
    "일": 1, "이": 2, "삼": 3, "사": 4, "오": 5, "육": 6, "칠": 7, "팔": 8, "구": 9, "십": 10, "십일": 11, "십이": 12 
};

// match (오전/오후/아침/저녁/밤) + (숫자 or 한글) + 시 + (숫자 + 분)
const KOREAN_TIME_REGEX = /(?:(오전|오후|아침|저녁|낮|밤)\s*)?(\d{1,2}|[가-힣]{1,2})\s*시\s*(?:(\d{1,2})\s*분|반)?/;
const KOREAN_DATE_REGEX = /(오늘|내일|내이|모레|이번\s*주|다음\s*주)/; // added "내이" as a common typo for "내일"

function parseSmartInput(raw) {
    const text = raw.trim();
    if (!text) return { title: "", deadline: null, rawText: text };

    let deadline = null;
    let remaining = text;

    // 1) Extract Korean Date
    const dateMatch = text.match(KOREAN_DATE_REGEX);
    let baseDate = new Date(); // default to today if no date specified
    
    if (dateMatch) {
        let keyword = dateMatch[1].replace(/\s+/g, " ");
        if (keyword === "내이") keyword = "내일"; // handle typo
        const dateFn = KOREAN_DATE_MAP[keyword];
        if (dateFn) {
            baseDate = dateFn();
            deadline = baseDate;
            remaining = remaining.replace(dateMatch[0], "");
        }
    }

    // 2) Extract Korean Time
    const timeMatch = remaining.match(KOREAN_TIME_REGEX);
    if (timeMatch) {
        if (!deadline) deadline = baseDate; // We found time, so we set deadline to baseDate (which is today or the matched date)

        const period = timeMatch[1];
        let hoursStr = timeMatch[2];
        
        let hours = parseInt(hoursStr, 10);
        if (isNaN(hours)) {
             hours = KOREAN_NUMBER_MAP[hoursStr] || 0; // fallback to 0 if not found, though regex should limit
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

    // If we only found date without time, reset time to 00:00:00 (or keep current time? Let's leave it as what dateFn returns, but maybe set to end of day? 
    // Usually if they just say "오늘" it means by end of today. But for now let's just use baseDate.

    if (deadline) {
       // remove trailing particles
       remaining = remaining.replace(/(에|까지|에까지|부터)\s*$/g, "");
       // also remove them if they are left in the middle due to replacement
       remaining = remaining.replace(/\s+(에|까지|에까지|부터)\s+/g, " ");
       remaining = remaining.replace(/^(에|까지|에까지|부터)\s+/g, "");
    }

    // 3) Fallback to chrono-node
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

    remaining = remaining.replace(/\s+/g, " ").trim();

    // Final clean up of specific trailing particles attached to words like "7시까지" -> "7시" was removed leaving "까지"
    remaining = remaining.replace(/(에|까지|에까지|부터)$/, "").trim();

    return {
        title: remaining || text,
        deadline,
        rawText: text,
    };
}

console.log(parseSmartInput("내이 오후 3시까지 놀기"));
console.log(parseSmartInput("아침 7시까지 똥싸기"));
console.log(parseSmartInput("아침 일곱시 토스트 먹기"));
console.log(parseSmartInput("저녁 일곱시 반에 회의"));
console.log(parseSmartInput("오늘 밤 열시에 취침"));
