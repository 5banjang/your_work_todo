"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./GeoFenceAlert.module.css";

interface GeoFenceAlertProps {
    locationLabel: string;
    onConfirm: () => void;
    onDismiss: () => void;
}

export default function GeoFenceAlert({ locationLabel, onConfirm, onDismiss }: GeoFenceAlertProps) {
    const [isVisible, setIsVisible] = useState(true);

    const handleConfirm = useCallback(() => {
        setIsVisible(false);
        setTimeout(onConfirm, 300);
    }, [onConfirm]);

    const handleDismiss = useCallback(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
    }, [onDismiss]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className={styles.overlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Map-like background */}
                    <div className={styles.mapBg}>
                        <div className={styles.mapGrid} />
                        {/* Geofence radius circle */}
                        <div className={styles.geoCircle}>
                            <div className={styles.geoCircleInner} />
                            <div className={styles.geoCirclePulse} />
                        </div>
                        {/* Pin */}
                        <div className={styles.pin}>
                            <svg viewBox="0 0 24 24" fill="var(--color-accent-cyan)" width="32" height="32">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" fill="var(--color-bg-primary)" />
                            </svg>
                        </div>
                        <span className={styles.radiusLabel}>100m</span>
                    </div>

                    {/* Alert card */}
                    <motion.div
                        className={styles.alertCard}
                        initial={{ y: 80, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 80, opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300, delay: 0.15 }}
                    >
                        <div className={styles.alertIcon}>
                            <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                                <circle cx="12" cy="12" r="10" stroke="var(--color-safe)" strokeWidth="2" />
                                <path d="m8 12 3 3 5-5" stroke="var(--color-safe)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div className={styles.alertContent}>
                            <p className={styles.alertTitle}>목표 장소에 도착했습니다</p>
                            <p className={styles.alertLocation}>{locationLabel}</p>
                        </div>
                        <div className={styles.alertActions}>
                            <button className={styles.confirmBtn} onClick={handleConfirm} type="button">
                                확인
                            </button>
                            <button className={styles.arriveBtn} onClick={handleConfirm} type="button">
                                도착 완료
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/**
 * Hook to watch geofence proximity.
 * Returns whether the user is within the specified radius.
 */
export function useGeoFenceWatch(
    targetLat: number,
    targetLng: number,
    radiusMeters: number,
    enabled: boolean
): { isNearby: boolean; distance: number | null; error: string | null } {
    const [isNearby, setIsNearby] = useState(false);
    const [distance, setDistance] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const watchIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (!enabled || !("geolocation" in navigator)) {
            if (!("geolocation" in navigator)) setError("위치 서비스를 지원하지 않습니다.");
            return;
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const dist = haversineDistance(
                    pos.coords.latitude,
                    pos.coords.longitude,
                    targetLat,
                    targetLng
                );
                setDistance(Math.round(dist));
                setIsNearby(dist <= radiusMeters);
                setError(null);
            },
            (err) => {
                setError(err.message);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
        );

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [enabled, targetLat, targetLng, radiusMeters]);

    return { isNearby, distance, error };
}

/** Haversine formula for distance between two coordinates in meters */
function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
