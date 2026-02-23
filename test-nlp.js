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

const KOREAN_TIME_REGEX = /(?:(오전|오후|아침|저녁|밤)\s*)?(\d{1,2})\s*시\s*(?:(\d{1,2})\s*분)?/;
const KOREAN_DATE_REGEX = /(오늘|내일|모레|이번\s*주|다음\s*주)/;

function parseSmartInput(raw) {
    const text = raw.trim();
    if (!text) return { title: "", deadline: null, rawText: text };

    let deadline = null;
    let remaining = text;

    // 1) First pass: Try finding Korean keywords directly + optional time + optional particle (까지, 에, 에까지)
    // We can search for the date keyword first
    const dateMatch = text.match(KOREAN_DATE_REGEX);
    
    if (dateMatch) {
        const keyword = dateMatch[1].replace(/\s+/g, ' '); // normalize spaces
        const dateFn = KOREAN_DATE_MAP[keyword];
        
        if (dateFn) {
            deadline = dateFn();
            
            // Try to find a time near the date, e.g. "오전 6시", "아침 6시"
            // Let's just find KOREAN_TIME_REGEX anywhere in the string for simplicity,
            // or we slice the string from the dateMatch index.
            const timeMatch = text.match(KOREAN_TIME_REGEX);
            
            if (timeMatch) {
                let hours = parseInt(timeMatch[2], 10);
                const minutes = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
                const period = timeMatch[1];
                
                if (period === "오후" || period === "저녁" || period === "밤") {
                    if (hours < 12) hours += 12;
                } else if (period === "오전" || period === "아침") {
                    if (hours === 12) hours = 0;
                }
                
                deadline.setHours(hours, minutes, 0, 0);
                
                // Remove both date and time strings from title
                remaining = remaining.replace(dateMatch[0], '');
                remaining = remaining.replace(timeMatch[0], '');
            } else {
                // Remove just the date string
                remaining = remaining.replace(dateMatch[0], '');
            }
            
            // Also remove dangling particles like "까지", "에", "에까지", "부터" right after the removed parts
            remaining = remaining.replace(/(에|까지|에까지)/g, '');
        }
    }

    // 2) Fallback to chrono-node if no Korean date found
    if (!deadline) {
        const parsed = chrono.parse(text);
        if (parsed.length > 0) {
            deadline = parsed[0].start.date();
            const matchStart = parsed[0].index;
            const matchEnd = matchStart + parsed[0].text.length;
            remaining = (text.slice(0, matchStart) + " " + text.slice(matchEnd)).trim();
             remaining = remaining.replace(/(에|까지|에까지)/g, '');
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

console.log(parseSmartInput("내일 아침 6시에 신문배달해"));
console.log(parseSmartInput("유튜브 썸네일 검토 내일 오후 3시까지"));
console.log(parseSmartInput("모레 14시 회의"));
console.log(parseSmartInput("오늘 밤 11시 30분에 라면 먹기"));
