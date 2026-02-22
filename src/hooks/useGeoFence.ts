"use client";

import { useEffect, useState } from "react";
import { useTodos } from "@/context/TodoContext";

// Haversine formula for distance between two lat/lng coordinates
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // Earth radius in metres
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // returns distance in metres
}

export function useGeoFence() {
    const { todos } = useTodos();
    const [triggeredTodo, setTriggeredTodo] = useState<{ id: string; label: string } | null>(null);

    useEffect(() => {
        if (!("geolocation" in navigator)) {
            console.warn("Geolocation is not supported by this browser.");
            return;
        }

        const triggeredSet = new Set<string>();

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;

                const geoTodos = todos.filter((t) => t.geoFence && t.status !== "done");

                for (const todo of geoTodos) {
                    const fence = todo.geoFence;
                    if (fence && !triggeredSet.has(todo.id)) {
                        const dist = getDistance(latitude, longitude, fence.lat, fence.lng);
                        if (dist <= fence.radius) {
                            triggeredSet.add(todo.id);
                            // Avoid setting a new trigger if one is currently active
                            setTriggeredTodo((prev) => prev ? prev : { id: todo.id, label: fence.label });
                        }
                    }
                }
            },
            (error) => {
                console.error("Geolocation watch error:", error);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 5000,
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [todos]);

    const clearTrigger = () => setTriggeredTodo(null);

    return { triggeredTodo, clearTrigger };
}
