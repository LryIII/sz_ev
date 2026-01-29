import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Link, Link2Off, ArrowDown, Map as MapIcon, RotateCcw } from 'lucide-react';
import { GridZone, Vehicle, TransferItem } from '../types';
import { GRID_SHAPES, getTransferData, getPolygonCenter } from '../constants';
import L from 'leaflet';

// Safe fix for default marker icons in Leaflet
try {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
} catch (e) {
  console.warn("Leaflet icon fix failed:", e);
}

interface CenterPanelProps {
  currentGrid: string | null;
  onGridSelect: (id: string | null) => void;
  vehicles: Vehicle[];
  time: number;
  setTime: React.Dispatch<React.SetStateAction<number>>;
  gridZones: GridZone[];
  isPlaying: boolean;
  togglePlay: () => void;
}

// Adjusted center to match new LON_START/LON_END in constants.ts
const SHENZHEN_CENTER: [number, number] = [22.5500, 114.0850];

export const CenterPanel: React.FC<CenterPanelProps> = ({ 
  currentGrid, 
  onGridSelect, 
  vehicles,
  time: timeA,
  setTime: setTimeA,
  gridZones,
  isPlaying,
  togglePlay
}) => {
  const [timeB, setTimeB] = useState<number>(timeA);
  const [isSynced, setIsSynced] = useState<boolean>(true);

  // Refs for Map instances to handle sync
  const mapARef = useRef<L.Map | null>(null);
  const mapBRef = useRef<L.Map | null>(null);
  const isSyncing = useRef(false);

  // Sync Time Logic
  useEffect(() => {
    if (isSynced) {
        setTimeB(timeA);
    }
  }, [timeA, isSynced]);

  const toggleSync = () => setIsSynced(!isSynced);
  
  // Reset View Handler
  const resetView = () => {
      if (mapARef.current) mapARef.current.setView(SHENZHEN_CENTER, 11);
      if (mapBRef.current) mapBRef.current.setView(SHENZHEN_CENTER, 11);
  };

  // Sync Maps View Logic
  const handleMapMove = (sourceMap: L.Map, targetMap: L.Map) => {
      if (!sourceMap || !targetMap) return;
      if (isSyncing.current) return;

      isSyncing.current = true;
      const center = sourceMap.getCenter();
      const zoom = sourceMap.getZoom();
      
      targetMap.setView(center, zoom, { animate: false });
      
      // Debounce sync flag reset
      setTimeout(() => { isSyncing.current = false; }, 50);
  };

  // Attach Sync Event Listeners
  useEffect(() => {
      const mapA = mapARef.current;
      const mapB = mapBRef.current;

      if (mapA && mapB) {
          const onMoveA = () => handleMapMove(mapA, mapB);
          const onMoveB = () => handleMapMove(mapB, mapA);

          mapA.on('move', onMoveA);
          mapB.on('move', onMoveB);

          return () => {
              mapA.off('move', onMoveA);
              mapB.off('move', onMoveB);
          };
      }
  }, [mapARef.current, mapBRef.current]);


  return (
    <div className="h-full flex flex-col gap-1 relative group bg-tech-panel/20 p-1 border border-tech-cyan/10">
      
      <style>{`
        /* Optimized Dark Mode Filter for Map Tiles */
        .tech-map-tiles {
            filter: invert(100%) hue-rotate(180deg) brightness(90%) contrast(120%) saturate(60%);
        }
        .leaflet-container {
            background: #020617 !important; 
        }
        .leaflet-control-attribution {
            background: rgba(0,0,0,0.5) !important;
            color: #64748b !important;
            font-size: 8px !important;
        }
        .leaflet-control-zoom {
            border: 1px solid rgba(6, 182, 212, 0.3) !important;
            box-shadow: none !important;
        }
        .leaflet-control-zoom a {
            background-color: #0f172a !important;
            color: #06b6d4 !important;
            border-bottom: 1px solid rgba(6, 182, 212, 0.3) !important;
        }
        .leaflet-control-zoom a:hover {
            background-color: #06b6d4 !important;
            color: #000 !important;
        }
        /* Pulse Animation for High Potential Targets */
        @keyframes pulse-target-border {
            0% { stroke-opacity: 0.6; stroke-width: 2; }
            50% { stroke-opacity: 1; stroke-width: 4; }
            100% { stroke-opacity: 0.6; stroke-width: 2; }
        }
        .target-zone-pulse {
            animation: pulse-target-border 2s infinite ease-in-out;
        }
        
        @keyframes dash-flow {
            to { stroke-dashoffset: -20; }
        }
        .transfer-line {
            animation: dash-flow 0.8s linear infinite;
        }
      `}</style>

      {/* --- MAP A: Baseline Scenario --- */}
      <div className="flex-1 relative flex flex-col border border-tech-orange/20 rounded bg-tech-bg/50 overflow-hidden min-h-[200px]">
         <div className="absolute top-2 left-2 z-[400] bg-black/80 backdrop-blur px-2 py-1 rounded text-xs text-tech-orange border border-tech-orange/50 shadow-lg font-bold flex items-center gap-2 pointer-events-none">
            <MapIcon size={12} />
            <span>Map A: 原始负荷基线 (Baseline)</span>
         </div>
         
         <div className="relative w-full h-full z-0">
             <LeafletMapInstance 
                mapId="map-a"
                onMapReady={(map) => { mapARef.current = map; }}
                gridZones={gridZones}
                time={timeA}
                scenario="baseline"
                currentGrid={currentGrid}
                onGridSelect={onGridSelect}
             />
         </div>

         {/* Time Control A */}
         <div className="h-8 bg-black/40 flex items-center px-4 gap-4 z-[400] border-t border-tech-orange/20 relative">
             <span className="text-[10px] font-mono text-tech-orange w-12 text-right">
                {formatTime(timeA)}
             </span>
             <input 
              type="range" min="0" max="24" step="0.1"
              value={timeA}
              onChange={(e) => setTimeA(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-tech-dim/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-tech-orange"
             />
         </div>
      </div>

      {/* --- CONTROL BAR --- */}
      <div className="h-8 flex items-center justify-center gap-4 bg-tech-panel border-y border-tech-cyan/30 z-[500] relative shadow-xl shrink-0">
         <button 
          onClick={togglePlay}
          className={`transition-colors ${isPlaying ? 'text-tech-cyan' : 'text-tech-dim hover:text-white'}`}
          title={isPlaying ? "暂停模拟" : "开始模拟"}
         >
           {isPlaying ? <Pause size={16} /> : <Play size={16} />}
         </button>

         <button 
            onClick={resetView}
            className="text-tech-dim hover:text-tech-cyan transition-colors"
            title="重置地图视角"
         >
             <RotateCcw size={14} />
         </button>

         <div className="flex items-center gap-2">
            <span className="text-[10px] text-tech-dim uppercase tracking-wider">Timeline Sync</span>
            <button 
                onClick={toggleSync}
                className={`p-1 rounded transition-all ${isSynced ? 'bg-tech-cyan text-black' : 'bg-white/10 text-tech-dim'}`}
                title="同步时间轴"
            >
                {isSynced ? <Link size={14} /> : <Link2Off size={14} />}
            </button>
         </div>

         <div className="absolute right-4 text-tech-dim/50 animate-bounce">
            <ArrowDown size={14} />
         </div>
      </div>

      {/* --- MAP B: Optimized Scenario --- */}
      <div className="flex-1 relative flex flex-col border border-tech-green/20 rounded bg-tech-bg/50 overflow-hidden min-h-[200px]">
         <div className="absolute top-2 left-2 z-[400] bg-black/80 backdrop-blur px-2 py-1 rounded text-xs text-tech-green border border-tech-green/50 shadow-lg font-bold flex items-center gap-2 pointer-events-none">
            <MapIcon size={12} />
            <span>Map B: 区域负荷时空转移潜力</span>
         </div>
         
         <div className="relative w-full h-full z-0">
             <LeafletMapInstance 
                mapId="map-b"
                onMapReady={(map) => { mapBRef.current = map; }}
                gridZones={gridZones}
                time={timeB}
                scenario="optimized"
                currentGrid={currentGrid}
                onGridSelect={onGridSelect}
             />
         </div>

         {/* Time Control B */}
         <div className="h-8 bg-black/40 flex items-center px-4 gap-4 z-[400] border-t border-tech-green/20 relative">
             <span className="text-[10px] font-mono text-tech-green w-12 text-right">
                {formatTime(timeB)}
             </span>
             <input 
              type="range" min="0" max="24" step="0.1"
              value={timeB}
              onChange={(e) => !isSynced && setTimeB(parseFloat(e.target.value))}
              disabled={isSynced}
              className={`flex-1 h-1 bg-tech-dim/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-tech-green ${isSynced ? 'opacity-50' : ''}`}
             />
         </div>
      </div>

    </div>
  );
};

// --- Leaflet Map Instance Component ---
interface LeafletMapInstanceProps {
    mapId: string;
    onMapReady: (map: L.Map) => void;
    gridZones: GridZone[];
    time: number;
    scenario: 'baseline' | 'optimized';
    currentGrid: string | null;
    onGridSelect: (id: string | null) => void;
}

const LeafletMapInstance: React.FC<LeafletMapInstanceProps> = ({ 
    mapId, onMapReady, gridZones, time, scenario, currentGrid, onGridSelect 
}) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const gridLayerRef = useRef<L.LayerGroup | null>(null);
    const lineLayerRef = useRef<L.LayerGroup | null>(null);

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstanceRef.current) return;

        try {
            const map = L.map(mapContainerRef.current, {
                center: SHENZHEN_CENTER,
                zoom: 11,
                zoomControl: true,
                attributionControl: true,
                minZoom: 10,
                maxZoom: 16,
                fadeAnimation: false 
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
                className: 'tech-map-tiles',
                maxZoom: 18
            }).addTo(map);

            gridLayerRef.current = L.layerGroup().addTo(map);
            lineLayerRef.current = L.layerGroup().addTo(map); // Layer for transfer lines
            mapInstanceRef.current = map;
            
            setTimeout(() => { map.invalidateSize(); }, 200);
            onMapReady(map);

        } catch (error) {
            console.error("Error initializing map:", error);
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [mapId]); 

    // Update Grid Overlays
    useEffect(() => {
        const map = mapInstanceRef.current;
        const layerGroup = gridLayerRef.current;
        const lineGroup = lineLayerRef.current;
        if (!map || !layerGroup || !lineGroup) return;

        layerGroup.clearLayers();
        lineGroup.clearLayers();

        // Determine targets for Map B highlighting using shared logic
        let targetZones: string[] = [];
        let transferItems: TransferItem[] = [];
        if (scenario === 'optimized' && currentGrid) {
            transferItems = getTransferData(currentGrid, time);
            targetZones = transferItems.map(item => item.target);
        }

        gridZones.forEach(zone => {
            const points = GRID_SHAPES[zone.id];
            if (!points) return; 

            // Calculate Load
            const timeFactor = Math.sin((time - 6) / 3); 
            let currentLoad = Math.max(0, Math.min(100, zone.load + (timeFactor * 20)));
            if (time > 17 && time < 20) currentLoad += 20;

            if (scenario === 'optimized') {
                if (currentLoad > 80) currentLoad *= 0.75;
                else if (currentLoad < 40) currentLoad += 15;
            }

            const isSelected = currentGrid === zone.id;
            const isTarget = targetZones.includes(zone.id);
            const isOverload = currentLoad > 85;

            // Find specific transfer amount for this zone if it's a target
            const transferItem = isTarget ? transferItems.find(t => t.target === zone.id) : null;
            const amount = transferItem?.amount || 0;

            // --- Styling Logic ---
            let color = '#06b6d4'; // Cyan default
            let fillOpacity = currentLoad / 200;
            let className = 'transition-all duration-300';
            let strokeColor = color;
            let strokeWidth = 1;

            if (scenario === 'baseline') {
                if (isOverload) { color = '#ef4444'; fillOpacity = 0.5; } // Red
                
                if (isSelected) {
                    if (isOverload) {
                        color = '#ef4444';
                        fillOpacity = 0.8;
                        strokeColor = '#ffffff';
                        strokeWidth = 3;
                    } else {
                        color = '#ffffff';
                        fillOpacity = 0.6;
                        strokeWidth = 2;
                    }
                }
            } 
            else if (scenario === 'optimized') {
                if (currentGrid) {
                    if (isSelected) {
                        color = '#ef4444'; 
                        fillOpacity = 0.7;
                        strokeColor = '#ffffff';
                        strokeWidth = 3;
                    } else if (isTarget) {
                        // Dynamic Green: Higher transfer amount = Brighter green
                        // Low potential (<5MW) = Gray-green (#526d5e)
                        // High potential (>10MW) = Bright green (#22c55e)
                        const potentialScale = Math.min(1, amount / 12);
                        
                        if (potentialScale > 0.6) {
                            color = '#22c55e'; // Vibrant Green
                            className += ' target-zone-pulse';
                            strokeColor = '#4ade80';
                            strokeWidth = 2;
                        } else if (potentialScale > 0.3) {
                            color = '#4ade80'; // Medium Green
                            strokeColor = '#4ade80';
                            strokeWidth = 1;
                        } else {
                            color = '#526d5e'; // Gray-green for weak targets
                            strokeColor = '#64748b';
                            strokeWidth = 1;
                        }
                        
                        fillOpacity = 0.4 + (potentialScale * 0.4);
                    } else {
                        if (isOverload) {
                            color = '#ef4444';
                            fillOpacity = 0.3; 
                            strokeColor = '#ef4444';
                        } else {
                            color = '#0f172a'; // Dark slate
                            fillOpacity = 0.4;
                            strokeColor = '#1e293b';
                        }
                    }
                } else {
                    if (isOverload) { color = '#ef4444'; fillOpacity = 0.4; }
                    else if (currentLoad > 40 && currentLoad < 75) { color = '#22c55e'; fillOpacity = 0.3; }
                    else { color = '#eab308'; fillOpacity = 0.3; }
                }
            }

            // Create Polygon
            const poly = L.polygon(points, {
                color: strokeColor,
                weight: strokeWidth,
                fillColor: color,
                fillOpacity: fillOpacity,
                className: className
            });

            // Interaction
            poly.on('click', () => onGridSelect(isSelected ? null : zone.id));
            
            // Tooltip Logic
            let tooltipContent = `
                <div class="font-mono text-xs">
                    <div class="font-bold text-white">${zone.id}</div>
                    ${isTarget ? `<div class="text-green-400 font-bold mt-1">潜力: ${amount} MW</div>` : ''}
                </div>
            `;
            
            if (isSelected) {
                tooltipContent = `
                    <div class="font-mono text-xs text-center">
                        <div class="font-bold text-white text-lg">${zone.id}</div>
                        <div class="text-tech-cyan text-[10px] mt-1 italic border-t border-tech-cyan/30 pt-1">
                            点击以返回总体
                        </div>
                    </div>
                `;
            }

            if (!currentGrid || isSelected || isTarget) {
                poly.bindTooltip(tooltipContent, {
                    permanent: false,
                    direction: 'center',
                    className: 'bg-black/80 border border-white/20 p-2 rounded shadow-xl'
                });
            }

            poly.addTo(layerGroup);

            // Draw Lines for Map B if needed
            if (scenario === 'optimized' && currentGrid && isTarget) {
                const sourceShape = GRID_SHAPES[currentGrid];
                const targetShape = GRID_SHAPES[zone.id];
                if (sourceShape && targetShape) {
                    const p1 = getPolygonCenter(sourceShape);
                    const p2 = getPolygonCenter(targetShape);
                    
                    // Scale line visual properties by amount
                    const weight = Math.max(1.5, amount / 3);
                    const opacity = 0.4 + (amount / 20);
                    
                    // Main dashed line
                    L.polyline([p1, p2], {
                        color: amount > 8 ? '#22c55e' : '#64748b', // Stronger color for high transfer
                        weight: weight,
                        dashArray: '8, 8',
                        opacity: opacity,
                        className: 'transfer-line'
                    }).addTo(lineGroup);

                    // Add a directional arrow head at 75% distance
                    const angle = Math.atan2(p2[0] - p1[0], p2[1] - p1[1]) * 180 / Math.PI;
                    const midLat = p1[0] + (p2[0] - p1[0]) * 0.75;
                    const midLon = p1[1] + (p2[1] - p1[1]) * 0.75;
                    
                    const arrowIcon = L.divIcon({
                        className: '',
                        html: `<div style="transform: rotate(${angle}deg); color: ${amount > 8 ? '#22c55e' : '#94a3b8'}; opacity: ${opacity + 0.2};">
                                <svg width="${10 + weight}" height="${10 + weight}" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2L18 12H6L12 2Z" />
                                </svg>
                               </div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    });
                    
                    L.marker([midLat, midLon], { icon: arrowIcon }).addTo(lineGroup);
                }
            }
        });

    }, [gridZones, time, scenario, currentGrid, onGridSelect]);

    return <div ref={mapContainerRef} className="w-full h-full bg-tech-bg" />;
};

const formatTime = (t: number) => {
    const h = Math.floor(t) % 24;
    const m = Math.floor((t % 1) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};