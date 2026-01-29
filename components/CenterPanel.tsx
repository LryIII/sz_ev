
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, Link, Link2Off, ArrowDown, Map as MapIcon, RotateCcw } from 'lucide-react';
import { GridZone, Vehicle, TransferItem } from '../types';
import { GRID_SHAPES, getTransferData, getPolygonCenter, VEHICLE_CLUSTERS, REGION_TO_GRID } from '../constants';
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
  selectedClusterId?: string;
  onOptimizedTimeChange?: (time: number) => void;
}

const SHENZHEN_CENTER: [number, number] = [22.5500, 114.0850];

const generateTimelineGradient = (scenario: 'baseline' | 'optimized') => {
  const stops = [];
  const colorScale = (load: number) => {
    if (load > 90) return '#7f1d1d'; 
    if (load > 85) return '#ef4444'; 
    if (load > 70) return '#f97316'; 
    if (load > 50) return '#eab308'; 
    if (load > 35) return '#22c55e'; 
    return '#15803d'; 
  };
  for (let i = 0; i <= 24; i++) {
    const timeFactor = Math.sin((i - 6) / 3);
    let currentLoad = 60 + (timeFactor * 25); 
    if (i >= 17 && i <= 20) currentLoad += 15; 
    if (scenario === 'optimized') {
      if (currentLoad > 75) currentLoad *= 0.8;
      else if (currentLoad < 45) currentLoad += 10;
    }
    const percentage = (i / 24) * 100;
    stops.push(`${colorScale(currentLoad)} ${percentage}%`);
  }
  return `linear-gradient(to right, ${stops.join(', ')})`;
};

export const CenterPanel: React.FC<CenterPanelProps> = ({ 
  currentGrid, 
  onGridSelect, 
  time: timeA,
  setTime: setTimeA,
  gridZones,
  isPlaying,
  togglePlay,
  selectedClusterId = 'all',
  onOptimizedTimeChange
}) => {
  const [timeB, setTimeB] = useState<number>(timeA);
  const [isSynced, setIsSynced] = useState<boolean>(true);

  const mapARef = useRef<L.Map | null>(null);
  const mapBRef = useRef<L.Map | null>(null);
  const isSyncing = useRef(false);

  useEffect(() => {
    if (isSynced) setTimeB(timeA);
  }, [timeA, isSynced]);

  // Notify parent whenever optimized time changes
  useEffect(() => {
    onOptimizedTimeChange?.(timeB);
  }, [timeB, onOptimizedTimeChange]);

  const toggleSync = () => setIsSynced(!isSynced);
  const resetView = () => {
      if (mapARef.current) mapARef.current.setView(SHENZHEN_CENTER, 11);
      if (mapBRef.current) mapBRef.current.setView(SHENZHEN_CENTER, 11);
  };

  const handleMapMove = (sourceMap: L.Map, targetMap: L.Map) => {
      if (!sourceMap || !targetMap || isSyncing.current) return;
      isSyncing.current = true;
      targetMap.setView(sourceMap.getCenter(), sourceMap.getZoom(), { animate: false });
      setTimeout(() => { isSyncing.current = false; }, 50);
  };

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

  const gradientA = useMemo(() => generateTimelineGradient('baseline'), []);
  const gradientB = useMemo(() => generateTimelineGradient('optimized'), []);

  return (
    <div className="h-full flex flex-col gap-1 relative group bg-tech-panel/20 p-1 border border-tech-cyan/10">
      
      <style>{`
        .tech-map-tiles {
            filter: invert(100%) hue-rotate(180deg) brightness(90%) contrast(120%) saturate(60%);
        }
        .leaflet-container { background: #020617 !important; }
        
        .timeline-slider {
            -webkit-appearance: none; appearance: none;
            height: 10px; border-radius: 5px; outline: none;
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
        }
        .timeline-slider::-webkit-slider-thumb {
            -webkit-appearance: none; appearance: none;
            width: 6px; height: 20px; background: #ffffff;
            border: 1px solid #000; cursor: pointer;
            box-shadow: 0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(0,255,255,0.4);
            border-radius: 2px; transition: transform 0.1s;
        }
        .timeline-slider::-webkit-slider-thumb:hover { transform: scaleX(1.5); }

        @keyframes dash-flow { to { stroke-dashoffset: -20; } }
        .transfer-line { animation: dash-flow 0.8s linear infinite; }
        
        /* Dash Border Animation for Cluster Distribution */
        @keyframes border-march {
            from { stroke-dashoffset: 0; }
            to { stroke-dashoffset: -20; }
        }
        .cluster-dist-border {
            stroke-dasharray: 10, 5;
            animation: border-march 1s linear infinite;
        }

        /* Cluster Label Style */
        .cluster-map-label {
            background: rgba(0, 0, 0, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.6);
            color: #ffffff;
            font-family: 'JetBrains Mono', monospace;
            font-size: 9px;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 2px;
            white-space: nowrap;
            box-shadow: 0 0 10px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.2);
            pointer-events: none;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .cluster-map-label::before {
            content: '';
            width: 4px; height: 4px; background: #00ffff; border-radius: 50%;
            box-shadow: 0 0 5px #00ffff;
        }
      `}</style>

      {/* --- MAP A: Baseline Scenario --- */}
      <div className="flex-1 relative flex flex-col border border-tech-orange/20 rounded bg-tech-bg/50 overflow-hidden min-h-[200px]">
         <div className="absolute top-2 left-2 z-[400] bg-black/80 backdrop-blur px-2 py-1 rounded text-xs text-tech-orange border border-tech-orange/50 shadow-lg font-bold flex items-center gap-2 pointer-events-none uppercase tracking-tighter">
            <MapIcon size={12} />
            <span>视图 A: 负荷基线与车群分布</span>
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
                selectedClusterId={selectedClusterId}
             />
         </div>

         {/* Time Control A */}
         <div className="h-12 bg-black/60 flex flex-col justify-center px-4 z-[400] border-t border-tech-orange/20 relative">
             <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-mono text-tech-orange font-bold uppercase tracking-widest">基线周期 (Baseline)</span>
                <span className="text-[11px] font-mono text-white bg-tech-orange/20 px-1.5 rounded border border-tech-orange/30">
                    {formatTime(timeA)}
                </span>
             </div>
             <div className="relative flex items-center h-5">
                <input 
                    type="range" min="0" max="24" step="0.1"
                    value={timeA}
                    onChange={(e) => setTimeA(parseFloat(e.target.value))}
                    className="timeline-slider w-full"
                    style={{ background: gradientA }}
                />
                <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-[3px] pointer-events-none opacity-30">
                    {[0,6,12,18,24].map(h => <div key={h} className="w-px h-3 bg-white"></div>)}
                </div>
             </div>
         </div>
      </div>

      {/* --- CONTROL BAR --- */}
      <div className="h-8 flex items-center justify-center gap-4 bg-tech-panel border-y border-tech-cyan/30 z-[500] relative shadow-xl shrink-0">
         <button onClick={togglePlay} className={`transition-colors ${isPlaying ? 'text-tech-cyan' : 'text-tech-dim hover:text-white'}`}>
           {isPlaying ? <Pause size={16} /> : <Play size={16} />}
         </button>
         <button onClick={resetView} className="text-tech-dim hover:text-tech-cyan transition-colors" title="重置视角">
             <RotateCcw size={14} />
         </button>
         <div className="flex items-center gap-2">
            <span className="text-[10px] text-tech-dim uppercase tracking-wider">同步时间</span>
            <button onClick={toggleSync} className={`p-1 rounded transition-all ${isSynced ? 'bg-tech-cyan text-black' : 'bg-white/10 text-tech-dim'}`}>
                {isSynced ? <Link size={14} /> : <Link2Off size={14} />}
            </button>
         </div>
      </div>

      {/* --- MAP B: Optimized Scenario --- */}
      <div className="flex-1 relative flex flex-col border border-tech-green/20 rounded bg-tech-bg/50 overflow-hidden min-h-[200px]">
         <div className="absolute top-2 left-2 z-[400] bg-black/80 backdrop-blur px-2 py-1 rounded text-xs text-tech-green border border-tech-green/50 shadow-lg font-bold flex items-center gap-2 pointer-events-none">
            <MapIcon size={12} />
            <span>视图 B: 区域负荷转移潜力 (优化)</span>
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
         <div className="h-12 bg-black/60 flex flex-col justify-center px-4 z-[400] border-t border-tech-green/20 relative">
             <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-mono text-tech-green font-bold uppercase tracking-widest">优化周期 (Optimized)</span>
                <span className={`text-[11px] font-mono px-1.5 rounded border ${isSynced ? 'text-tech-dim border-white/10' : 'text-white bg-tech-green/20 border-tech-green/30'}`}>
                    {formatTime(timeB)}
                </span>
             </div>
             <div className="relative flex items-center h-5">
                <input 
                    type="range" min="0" max="24" step="0.1" value={timeB}
                    onChange={(e) => !isSynced && setTimeB(parseFloat(e.target.value))}
                    disabled={isSynced}
                    className="timeline-slider w-full"
                    style={{ background: gradientB, opacity: isSynced ? 0.7 : 1 }}
                />
                <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-[3px] pointer-events-none opacity-30">
                    {[0,6,12,18,24].map(h => <div key={h} className="w-px h-3 bg-white"></div>)}
                </div>
             </div>
         </div>
      </div>
    </div>
  );
};

interface LeafletMapInstanceProps {
    mapId: string;
    onMapReady: (map: L.Map) => void;
    gridZones: GridZone[];
    time: number;
    scenario: 'baseline' | 'optimized';
    currentGrid: string | null;
    onGridSelect: (id: string | null) => void;
    selectedClusterId?: string;
}

const LeafletMapInstance: React.FC<LeafletMapInstanceProps> = ({ 
    mapId, onMapReady, gridZones, time, scenario, currentGrid, onGridSelect, selectedClusterId = 'all'
}) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const gridLayerRef = useRef<L.LayerGroup | null>(null);
    const lineLayerRef = useRef<L.LayerGroup | null>(null);
    const labelLayerRef = useRef<L.LayerGroup | null>(null);

    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;
        const map = L.map(mapContainerRef.current, {
            center: SHENZHEN_CENTER, zoom: 11, zoomControl: true, minZoom: 10, maxZoom: 16, fadeAnimation: false 
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            className: 'tech-map-tiles', maxZoom: 18
        }).addTo(map);
        gridLayerRef.current = L.layerGroup().addTo(map);
        lineLayerRef.current = L.layerGroup().addTo(map);
        labelLayerRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
        onMapReady(map);
        return () => { if (mapInstanceRef.current) mapInstanceRef.current.remove(); };
    }, [mapId]); 

    useEffect(() => {
        const map = mapInstanceRef.current;
        const layerGroup = gridLayerRef.current;
        const lineGroup = lineLayerRef.current;
        const labelGroup = labelLayerRef.current;
        if (!map || !layerGroup || !lineGroup || !labelGroup) return;

        layerGroup.clearLayers();
        lineGroup.clearLayers();
        labelGroup.clearLayers();

        // Check if we should show cluster distribution hints
        const cluster = VEHICLE_CLUSTERS.find(c => c.id === selectedClusterId);
        const homeGrids = (scenario === 'baseline' && !currentGrid && cluster) ? REGION_TO_GRID[cluster.region] || [] : [];

        // Draw transfer lines for Map B if a grid is selected
        if (scenario === 'optimized' && currentGrid) {
            const transferItems = getTransferData(currentGrid, time);
            const sourceShape = GRID_SHAPES[currentGrid];
            if (sourceShape) {
                const sourceCenter = getPolygonCenter(sourceShape);
                transferItems.forEach(item => {
                    const targetShape = GRID_SHAPES[item.target];
                    if (targetShape) {
                        const targetCenter = getPolygonCenter(targetShape);
                        // Draw line
                        L.polyline([sourceCenter, targetCenter], {
                            color: '#4ade80', // tech-green
                            weight: Math.max(1, item.amount / 12), // Dynamic weight based on amount
                            opacity: 0.8,
                            dashArray: '4, 6',
                            className: 'transfer-line' // Apply CSS animation
                        }).addTo(lineGroup);
                    }
                });
            }
        }

        gridZones.forEach(zone => {
            const points = GRID_SHAPES[zone.id];
            if (!points) return; 

            const timeFactor = Math.sin((time - 6) / 3); 
            let currentLoad = Math.max(0, Math.min(100, zone.load + (timeFactor * 20)));
            if (time > 17 && time < 20) currentLoad += 20;

            if (scenario === 'optimized') {
                if (currentLoad > 80) currentLoad *= 0.75;
                else if (currentLoad < 40) currentLoad += 15;
            }

            const isSelected = currentGrid === zone.id;
            const isHomeGrid = homeGrids.includes(zone.id);
            const isOverload = currentLoad > 85;

            let color = '#06b6d4'; 
            let fillOpacity = currentLoad / 200;
            let strokeColor = color;
            let strokeWidth = 1;
            let className = 'transition-all duration-300';

            if (scenario === 'baseline') {
                if (isOverload) { color = '#ef4444'; fillOpacity = 0.5; }
                if (isSelected) {
                    color = isOverload ? '#ef4444' : '#ffffff';
                    fillOpacity = isOverload ? 0.8 : 0.6;
                    strokeColor = '#ffffff'; strokeWidth = 3;
                } else if (isHomeGrid) {
                    // Enhanced border for home grids
                    strokeColor = '#ffffff';
                    strokeWidth = 2;
                    className += ' cluster-dist-border';
                    
                    // Add floating label at center
                    const center = getPolygonCenter(points);
                    const icon = L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div class="cluster-map-label">${cluster?.name.split(' ')[0]}区</div>`,
                        iconSize: [80, 20],
                        iconAnchor: [40, 10]
                    });
                    L.marker(center, { icon }).addTo(labelGroup);
                }
            } else {
                // Scenario B logic
                if (currentGrid) {
                    const transferItems = getTransferData(currentGrid, time);
                    const isTarget = transferItems.some(item => item.target === zone.id);
                    if (isSelected) { 
                        color = '#ef4444'; fillOpacity = 0.7; strokeColor = '#ffffff'; strokeWidth = 3; 
                        
                        // Add "Click to return" tooltip on the selected grid
                        const center = getPolygonCenter(points);
                        const returnIcon = L.divIcon({
                            className: 'custom-div-icon',
                            html: `<div class="px-2 py-1 bg-black/90 border border-white/20 text-white text-[9px] rounded shadow-lg whitespace-nowrap -translate-x-1/2 -translate-y-full mb-3 pointer-events-none flex items-center gap-1 z-[1000]"><span class="w-1.5 h-1.5 rounded-full bg-tech-cyan animate-pulse"></span>点击以返回总体</div>`,
                            iconSize: [0, 0]
                        });
                        L.marker(center, { icon: returnIcon, zIndexOffset: 1000 }).addTo(labelGroup);

                    } else if (isTarget) { 
                        color = '#22c55e'; fillOpacity = 0.6; strokeColor = '#4ade80'; strokeWidth = 2; 
                    } else { 
                        color = isOverload ? '#ef4444' : '#0f172a'; fillOpacity = isOverload ? 0.3 : 0.4; 
                    }
                } else {
                    if (isOverload) { color = '#ef4444'; fillOpacity = 0.4; }
                    else { color = '#22c55e'; fillOpacity = 0.3; }
                }
            }

            const poly = L.polygon(points, { color: strokeColor, weight: strokeWidth, fillColor: color, fillOpacity: fillOpacity, className: className });
            poly.on('click', () => onGridSelect(isSelected ? null : zone.id));
            poly.addTo(layerGroup);
        });
    }, [gridZones, time, scenario, currentGrid, onGridSelect, selectedClusterId]);

    return <div ref={mapContainerRef} className="w-full h-full bg-tech-bg" />;
};

const formatTime = (t: number) => {
    const h = Math.floor(t) % 24;
    const m = Math.floor((t % 1) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};
