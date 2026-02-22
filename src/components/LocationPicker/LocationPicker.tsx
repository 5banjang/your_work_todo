"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./LocationPicker.module.css";

interface LocationPickerProps {
    initialLat?: number;
    initialLng?: number;
    initialLabel?: string;
    onSelect: (lat: number, lng: number, label: string) => void;
    onClose: () => void;
}

export default function LocationPicker({
    initialLat = 37.5665, // Seoul City Hall default
    initialLng = 126.9780,
    initialLabel = "",
    onSelect,
    onClose,
}: LocationPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<any>(null);
    const [marker, setMarker] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState(initialLabel);
    const [selectedCoords, setSelectedCoords] = useState({ lat: initialLat, lng: initialLng });
    const [isLoaded, setIsLoaded] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Load Naver Maps Script
    useEffect(() => {
        const clientId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID;
        if (!clientId) {
            setErrorMsg("네이버 지도 Client ID가 설정되지 않았습니다 (.env.local 확인)");
            return;
        }

        if (window.naver && window.naver.maps) {
            setIsLoaded(true);
            return;
        }

        const script = document.createElement("script");
        script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder`;
        script.async = true;
        script.onload = () => setIsLoaded(true);
        script.onerror = () => setErrorMsg("지도 스크립트를 불러오지 못했습니다.");
        document.head.appendChild(script);

        return () => {
            // Document head cleanup not strictly necessary here, 
            // but we avoid creating multiple scripts.
        };
    }, []);

    // Initialize Map once loaded
    useEffect(() => {
        if (!isLoaded || !mapRef.current || !window.naver?.maps) return;

        const { naver } = window;
        const initialLocation = new naver.maps.LatLng(selectedCoords.lat, selectedCoords.lng);

        const newMap = new naver.maps.Map(mapRef.current, {
            center: initialLocation,
            zoom: 15,
            mapDataControl: false,
            scaleControl: false,
        });

        const newMarker = new naver.maps.Marker({
            position: initialLocation,
            map: newMap,
        });

        setMap(newMap);
        setMarker(newMarker);

        // Click on map to move marker
        naver.maps.Event.addListener(newMap, "click", (e: any) => {
            newMarker.setPosition(e.coord);
            setSelectedCoords({ lat: e.coord.y, lng: e.coord.x });

            // Reverse Geocoding to get address (basic implementation)
            naver.maps.Service.reverseGeocode({
                coords: e.coord,
            }, (status: any, response: any) => {
                if (status === naver.maps.Service.Status.OK) {
                    const items = response.v2.address;
                    if (items && items.jibunAddress) {
                        setSearchQuery(items.jibunAddress);
                    }
                }
            });
        });

    }, [isLoaded]); // Empty dependency array to mount only once initially

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim() || !window.naver?.maps?.Service) return;

        window.naver.maps.Service.geocode({
            query: searchQuery
        }, (status: any, response: any) => {
            if (status === window.naver.maps.Service.Status.ERROR || response.v2.meta.totalCount === 0) {
                alert("검색 결과가 없습니다.");
                return;
            }

            const item = response.v2.addresses[0];
            const newLat = parseFloat(item.y);
            const newLng = parseFloat(item.x);
            const newPos = new window.naver.maps.LatLng(newLat, newLng);

            map.setCenter(newPos);
            marker.setPosition(newPos);
            setSelectedCoords({ lat: newLat, lng: newLng });
        });
    };

    const handleConfirm = () => {
        onSelect(selectedCoords.lat, selectedCoords.lng, searchQuery || "지정된 위치");
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3 className={styles.title}>위치 지정 (지오펜싱)</h3>
                    <button type="button" onClick={onClose} className={styles.closeBtn}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {errorMsg && <div className={styles.error}>{errorMsg}</div>}

                <form onSubmit={handleSearch} className={styles.searchForm}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="주소나 장소를 검색하세요"
                        className={styles.searchInput}
                    />
                    <button type="submit" className={styles.searchBtn}>검색</button>
                </form>

                <div className={styles.mapContainer} ref={mapRef}>
                    {!isLoaded && !errorMsg && <div className={styles.loading}>지도 로딩 중...</div>}
                </div>

                <div className={styles.footer}>
                    <div className={styles.info}>
                        설정된 위치 반경 100m 이내 진입 시 알림이 발생합니다.
                    </div>
                    <button type="button" onClick={handleConfirm} className={styles.confirmBtn} disabled={!isLoaded}>
                        이 위치로 설정
                    </button>
                </div>
            </div>
        </div>
    );
}

// Global type augmentation for Naver Maps API
declare global {
    interface Window {
        naver: any;
    }
}
