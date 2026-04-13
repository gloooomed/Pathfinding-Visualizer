'use client';

import React, { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Polyline, CircleMarker, useMap, useMapEvent } from 'react-leaflet';
import L, { LatLngExpression, LatLngLiteral, LeafletMouseEvent } from 'leaflet';

const INDIA_CENTER: LatLngExpression = [22.3511148, 78.6677428];

// custom markers — the dots you'll love
const startIcon = new L.DivIcon({
    className: '',
    html: '<div style="width:14px;height:14px;background:#22c55e;border:2.5px solid #15803d;border-radius:50%;box-shadow:0 0 14px rgba(34,197,94,0.85)"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
});

const endIcon = new L.DivIcon({
    className: '',
    html: '<div style="width:14px;height:14px;background:#ef4444;border:2.5px solid #b91c1c;border-radius:50%;box-shadow:0 0 14px rgba(239,68,68,0.85)"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
});

// fly to bounds once we get a route — the map equivalent of "look at this"
function FlyToRoute({ coords }: { coords: LatLngExpression[] }) {
    const map = useMap();
    useEffect(() => {
        if (coords.length >= 2) {
            const bounds = L.latLngBounds(coords as [number, number][]);
            map.fitBounds(bounds.pad(0.2));
        }
    }, [coords, map]);
    return null;
}

function ClickToSet({ onSelect }: { onSelect: (latlng: LatLngLiteral) => void }) {
    useMapEvent('click', (e: LeafletMouseEvent) => onSelect(e.latlng));
    return null;
}

// the part where we pretend to implement Dijkstra ourselves
async function fetchOsrmRoute(start: LatLngLiteral, end: LatLngLiteral) {
    const coords = `${start.lng},${start.lat};${end.lng},${end.lat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&alternatives=false&steps=false`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Routing service error');
    const data = await res.json();
    if (!data.routes || data.routes.length === 0) throw new Error('No route found');
    const route = data.routes[0];
    const geometry = route.geometry.coordinates as [number, number][];
    const latlngs: LatLngExpression[] = geometry.map(([lon, lat]) => [lat, lon]);
    const distanceKm = Math.round(route.distance / 100) / 10;
    const durationMin = Math.round(route.duration / 6) / 10;
    return { latlngs, distanceKm, durationMin };
}

export default function IndiaMapDijkstra() {
    const [start, setStart] = useState<LatLngLiteral | null>(null);
    const [end, setEnd] = useState<LatLngLiteral | null>(null);
    const [routeCoords, setRouteCoords] = useState<LatLngExpression[]>([]);
    const [animatedCount, setAnimatedCount] = useState(0);
    const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('fast');
    const [distanceKm, setDistanceKm] = useState<number | null>(null);
    const [durationMin, setDurationMin] = useState<number | null>(null);
    const [isRouting, setIsRouting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const [infoOpen, setInfoOpen] = useState(true);

    // fetch route whenever start + end are both set
    useEffect(() => {
        if (!start || !end) return;
        let cancelled = false;
        setIsRouting(true);
        setError(null);
        setAnimatedCount(0);

        fetchOsrmRoute(start, end)
            .then(({ latlngs, distanceKm, durationMin }) => {
                if (cancelled) return;
                setRouteCoords(latlngs);
                setDistanceKm(distanceKm);
                setDurationMin(durationMin);
                setIsComplete(false);
            })
            .catch((e) => {
                if (cancelled) return;
                setRouteCoords([]);
                setDistanceKm(null);
                setDurationMin(null);
                setError(e.message || 'Failed to compute route');
            })
            .finally(() => !cancelled && setIsRouting(false));

        return () => { cancelled = true; };
    }, [start, end]);

    // animate the route drawing — the satisfying part
    useEffect(() => {
        if (routeCoords.length === 0) return;
        setAnimatedCount(0);
        const baseMs = speed === 'fast' ? 8 : speed === 'normal' ? 14 : 24;
        const step = Math.max(1, Math.ceil(routeCoords.length / 1800));

        const timer = setInterval(() => {
            setAnimatedCount((c) => {
                if (c >= routeCoords.length) { clearInterval(timer); setIsComplete(true); return c; }
                return Math.min(routeCoords.length, c + step);
            });
        }, baseMs);
        return () => clearInterval(timer);
    }, [routeCoords, speed]);

    const instructions = !start
        ? 'Tap anywhere on the map to set START point'
        : !end
            ? 'Tap anywhere to set END point'
            : isRouting
                ? 'Computing shortest road path...'
                : 'Tap again to reset and pick a new route';

    function handleMapSelect(latlng: LatLngLiteral) {
        if (!start) {
            setStart(latlng); setEnd(null);
            setRouteCoords([]); setDistanceKm(null); setDurationMin(null); setIsComplete(false);
        } else if (!end) {
            setEnd(latlng);
        } else {
            setStart(latlng); setEnd(null);
            setRouteCoords([]); setDistanceKm(null); setDurationMin(null); setIsComplete(false);
        }
    }

    const handleReset = () => {
        setStart(null); setEnd(null); setRouteCoords([]);
        setDistanceKm(null); setDurationMin(null); setError(null); setIsComplete(false);
    };

    const gmapsUrl = React.useMemo(() => {
        if (!start || !end) return null;
        return `https://www.google.com/maps/dir/?api=1&origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&travelmode=driving`;
    }, [start, end]);

    return (
        <div className="bg-black text-gray-200 flex flex-col" style={{ height: 'calc(100vh - 49px)' }}>

            {/* ====== HEADER BAR ====== */}
            <div className="glass border-b border-white/[0.06] px-3 sm:px-5 py-2.5 shrink-0">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-x-4 gap-y-2">

                    {/* title + instruction pill — always visible */}
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-bold text-white tracking-wide font-mono whitespace-nowrap">
                            REAL-WORLD ROUTING
                        </span>
                        <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full border font-mono truncate max-w-[180px] sm:max-w-none ${isRouting
                                ? 'border-cyan-700 bg-cyan-900/30 text-cyan-300 animate-pulse'
                                : 'border-zinc-700 bg-zinc-900/50 text-gray-400'
                            }`}>
                            {instructions}
                        </span>
                    </div>

                    {/* speed control — now always visible, not shy anymore */}
                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-[10px] text-gray-500 font-mono tracking-wide hidden xs:inline">SPEED</span>
                        <div className="flex rounded-lg border border-zinc-800 overflow-hidden text-[11px] font-mono">
                            {(['slow', 'normal', 'fast'] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSpeed(s)}
                                    className={`px-2.5 sm:px-3 py-1.5 transition-colors capitalize ${speed === s ? 'bg-zinc-700 text-white' : 'text-gray-500 hover:bg-zinc-800 hover:text-gray-300'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* distance + time badges — the payoff */}
                    {distanceKm != null && durationMin != null && (
                        <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-900/30 border border-emerald-700/60 text-emerald-300 flex items-center gap-1.5">
                                <svg viewBox="0 0 16 16" className="w-3 h-3" fill="currentColor"><path d="M8 1a5 5 0 100 10A5 5 0 008 1zm0 1.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7zM8 8.25V5h1v2.75l1.75 1.75-.75.75L8 8.25z" opacity="0" /><path d="M8 0C5.24 0 3 2.24 3 5c0 3.75 5 11 5 11s5-7.25 5-11c0-2.76-2.24-5-5-5zm0 7.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" /></svg>
                                {distanceKm} km
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-amber-900/30 border border-amber-700/60 text-amber-300 flex items-center gap-1.5">
                                <svg viewBox="0 0 16 16" className="w-3 h-3" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11zM8.75 4v4.25l2.5 2.5-1.06 1.06-2.94-2.94V4h1.5z" /></svg>
                                {durationMin} min
                            </span>
                        </div>
                    )}

                    <button
                        onClick={handleReset}
                        className="px-3 py-1.5 text-[11px] font-mono rounded-lg border border-zinc-700 text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                        RESET
                    </button>
                </div>
            </div>

            {/* ====== MAP ====== */}
            <div className="relative flex-1 min-h-0">
                <MapContainer center={INDIA_CENTER} zoom={5} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                    />

                    {/* collapsible info card — top right, stays out of the way */}
                    <div className="leaflet-top leaflet-right" style={{ zIndex: 1000, pointerEvents: 'none' }}>
                        <div className="leaflet-control m-3 pointer-events-auto">
                            {infoOpen ? (
                                <div className="bg-black/85 backdrop-blur-md text-gray-200 border border-cyan-900/60 p-4 rounded-xl shadow-2xl max-w-[260px] sm:max-w-xs slide-down">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold text-cyan-400 text-sm flex items-center gap-1.5">
                                            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 3.5a1 1 0 110 2 1 1 0 010-2zM7 7h2v5H7V7z" /></svg>
                                            Real-World Dijkstra
                                        </h3>
                                        {/* hide the card — less is more */}
                                        <button
                                            onClick={() => setInfoOpen(false)}
                                            className="text-zinc-600 hover:text-zinc-300 transition-colors text-xs ml-2"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        Uses <span className="text-cyan-300">OSRM</span> routing — an open-source engine that runs Dijkstra&apos;s algorithm on real road networks. Same math, planet-scale graph.
                                    </p>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setInfoOpen(true)}
                                    className="bg-black/70 border border-cyan-900/50 text-cyan-400 text-xs px-3 py-1.5 rounded-lg hover:bg-black/90 transition-colors flex items-center gap-1.5"
                                >
                                    <svg viewBox="0 0 16 16" className="w-3 h-3" fill="currentColor"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 3.5a1 1 0 110 2 1 1 0 010-2zM7 7h2v5H7V7z" /></svg>
                                    Info
                                </button>
                            )}
                        </div>
                    </div>

                    <ClickToSet onSelect={handleMapSelect} />

                    {start && <Marker position={start} icon={startIcon} />}
                    {end && <Marker position={end} icon={endIcon} />}

                    {routeCoords.length > 1 && (
                        <>
                            {/* shadow glow behind route */}
                            <Polyline positions={routeCoords} pathOptions={{ color: '#06b6d4', weight: 10, opacity: 0.12 }} />
                            <Polyline positions={routeCoords} pathOptions={{ color: '#0f172a', weight: 7, opacity: 0.6 }} />
                            {/* the actual animated route */}
                            <Polyline positions={routeCoords.slice(0, animatedCount)} pathOptions={{ color: '#fbbf24', weight: 5, opacity: 0.95, lineCap: 'round' }} />
                            {/* glowing head segment */}
                            {animatedCount > 2 && (
                                <Polyline positions={routeCoords.slice(Math.max(0, animatedCount - 12), animatedCount)} pathOptions={{ color: '#22d3ee', weight: 7, opacity: 0.65, lineCap: 'round' }} />
                            )}
                            {/* the little dot at the front */}
                            {animatedCount > 0 && animatedCount <= routeCoords.length && (
                                <CircleMarker center={routeCoords[Math.min(animatedCount - 1, routeCoords.length - 1)] as LatLngExpression} radius={6} pathOptions={{ color: '#22d3ee', fillColor: '#22d3ee', fillOpacity: 1, weight: 2 }} />
                            )}
                            <FlyToRoute coords={routeCoords} />
                        </>
                    )}
                </MapContainer>
            </div>

            {/* error — when OSRM is having a bad day */}
            {error && (
                <div className="px-4 py-2 text-xs text-rose-400 bg-rose-950/30 border-t border-rose-900/50 font-mono shrink-0">
                    ✗ {error}
                </div>
            )}

            {/* open in google maps CTA — show after route is done */}
            {isComplete && gmapsUrl && (
                <div className="fixed right-4 bottom-6 flex items-center gap-3 glass border border-zinc-700 rounded-xl shadow-2xl px-4 py-3 fade-in" style={{ zIndex: 1000 }}>
                    <span className="text-sm text-gray-300 font-mono">Open in Google Maps?</span>
                    <a
                        href={gmapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm rounded-lg transition-colors"
                    >
                        Open ↗
                    </a>
                </div>
            )}
        </div>
    );
}
