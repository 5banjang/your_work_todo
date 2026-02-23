"use client";

import { useEffect } from "react";

export default function KakaoRedirect() {
    useEffect(() => {
        if (typeof window === "undefined") return;

        const userAgent = navigator.userAgent.toLowerCase();
        const isKakaotalk = userAgent.includes("kakaotalk");

        if (isKakaotalk) {
            const targetUrl = window.location.href;

            // For iOS (Safari)
            if (userAgent.includes("iphone") || userAgent.includes("ipad") || userAgent.includes("ipod")) {
                // KakaoTalk specific schema to open external browser on iOS
                window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(targetUrl)}`;
            }
            // For Android (Chrome/Samsung Internet)
            else if (userAgent.includes("android")) {
                // KakaoTalk specific intent to open external browser on Android
                window.location.href = `intent://${targetUrl.replace(/^https?:\/\//i, '')}#Intent;scheme=https;package=com.android.chrome;end`;
            }
        }
    }, []);

    return null; // This component doesn't render anything
}
