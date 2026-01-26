import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Pause, MapPin, AlertCircle, Layers, Globe, Grid, Loader2 } from 'lucide-react';
import { GridZone, Vehicle } from '../types';
import { COLORS } from '../constants';
// @ts-ignore - Leaflet is imported via importmap
import L from 'leaflet';

interface CenterPanelProps {
  currentGrid: string | null;
  onGridSelect: (id: string | null) => void;
  vehicles: Vehicle[];
  time: number;
  setTime: React.Dispatch<React.SetStateAction<number>>;
  gridZones: GridZone[];
}

// Zones to exclude (Sea areas / Corners)
// G-20 (Bottom-Left), G-24 (Bottom-Right)
const EXCLUDED_ZONES = ['G-20', 'G-24']; 

export const CenterPanel: React.FC<CenterPanelProps> = ({ 
  currentGrid, 
  onGridSelect, 
  vehicles,
  time,
  setTime,
  gridZones
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<'virtual' | 'real'>('virtual');

  // Auto-play time logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setTime((prev) => (prev >= 24 ? 0 : prev + 0.1));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, setTime]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  // KPI Calculations
  const totalVehicles = vehicles.length;
  const loadMW = useMemo(() => {
    // Calculate global load based on gridZones actual load
    const totalGridLoad = gridZones.reduce((acc, curr) => acc + curr.load, 0);
    // Base load + variable based on time
    const factor = Math.sin((time - 6) / 3) * 50;
    return ((totalGridLoad * 2) + 100 + factor).toFixed(1); // Rough scaling
  }, [time, gridZones]);
  
  const peakTime = "18:30";

  return (
    <div className="h-full flex flex-col relative group">
      {/* Top Floating KPI */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-4 pointer-events-none">
        <KpiBadge label="车辆总数" value={totalVehicles.toString()} unit="辆" />
        <KpiBadge label="当前负荷" value={loadMW} unit="兆瓦" highlight />
        <KpiBadge label="预测峰值" value={peakTime} unit="今日" />
      </div>

      {/* Main Map Stage */}
      <div className="flex-1 bg-tech-bg relative overflow-hidden rounded border border-tech-panel/50 shadow-inner">
        
        {viewMode === 'real' ? (
           <RealMap 
              gridZones={gridZones} 
              currentGrid={currentGrid} 
              onGridSelect={onGridSelect}
              vehicles={vehicles}
           />
        ) : (
          /* Virtual 2.5D Map View - Abstract Data Grid */
          <div className="w-full h-full flex items-center justify-center perspective-1000 bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#020617_100%)] animate-[fadeIn_0.5s_ease-out]" style={{ perspective: '1200px' }}>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
            
            {/* 3D Container - Moved Up Significantly (-60px) */}
            <div 
              className="relative w-[85%] aspect-square transition-transform duration-700 ease-out transform"
              style={{ transform: 'rotateX(35deg) scale(0.9) translateY(-60px)' }} 
            >
              {/* Floor Decoration */}
              <div className="absolute inset-0 border-2 border-tech-cyan/20 rounded shadow-[0_0_50px_rgba(6,182,212,0.15)] bg-tech-panel/30 backdrop-blur-sm" 
                   style={{ clipPath: 'polygon(0 0, 100% 0, 100% 80%, 80% 100%, 20% 100%, 0 80%)' }}> 
                   {/* Clipped corners visually on the container too */}
                  
                  {/* Grid Lines Background */}
                  <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#06b6d4_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:20%_20%]"></div>
                  {/* Corner Accents - Adjust positions for clipped shape */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-tech-cyan"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-tech-cyan"></div>
                  {/* Bottom corners moved in due to clip */}
                  <div className="absolute bottom-[20%] left-0 w-4 h-4 border-b-2 border-l-2 border-tech-cyan"></div> 
                  <div className="absolute bottom-[20%] right-0 w-4 h-4 border-b-2 border-r-2 border-tech-cyan"></div>
              </div>

              {/* Grid Zones Overlay */}
              <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 gap-1 p-1 z-10">
                {gridZones.map((zone, idx) => {
                  if (EXCLUDED_ZONES.includes(zone.id)) return <div key={zone.id} className="pointer-events-none" />; // Skip rendering

                  const isSelected = currentGrid === zone.id;
                  const isCritical = zone.load > 90;
                  // More subtle heatmap for abstract view
                  const opacity = Math.max(0.1, Math.min(zone.load / 100, 0.7)); 
                  
                  return (
                    <div
                      key={zone.id}
                      onClick={() => onGridSelect(isSelected ? null : zone.id)}
                      className={`
                        relative transition-all duration-300 cursor-pointer overflow-hidden
                        flex items-center justify-center group/cell rounded-sm
                        ${isSelected ? 'border-2 border-tech-cyanGlow shadow-[0_0_25px_#00ffff66] z-20 scale-105 bg-tech-blue/30' : 'border border-tech-cyan/10 hover:border-tech-cyan/50 hover:bg-white/5'}
                        ${isCritical ? 'border-tech-orange shadow-[inset_0_0_20px_rgba(255,69,0,0.5)] animate-pulse' : ''}
                      `}
                      style={{
                        backgroundColor: isSelected ? undefined : 
                          isCritical ? `rgba(255, 69, 0, ${opacity * 0.8})` : `rgba(6, 182, 212, ${opacity * 0.5})`
                      }}
                    >
                       {/* Zone ID - Always visible but subtle */}
                       <span className={`absolute top-1 left-1 text-[8px] font-mono transition-opacity ${
                           isSelected || isCritical ? 'text-white font-bold opacity-100' : 'text-tech-cyan/40 opacity-70'
                       }`}>
                          {zone.id}
                       </span>

                       {/* Load Value - Center */}
                       <div className="flex flex-col items-center">
                          <span className={`text-xs font-mono font-bold ${
                              isCritical ? 'text-tech-orange' : isSelected ? 'text-tech-cyanGlow' : 'text-white/60'
                          }`}>
                              {zone.load}%
                          </span>
                       </div>
                       
                       {/* Critical Icon */}
                       {isCritical && (
                           <div className="absolute bottom-1 right-1 text-tech-orange animate-bounce">
                               <AlertCircle size={10} />
                           </div>
                       )}
                    </div>
                  );
                })}
              </div>

              {/* Vehicle Scatter Layer */}
              {vehicles.map((v) => {
                 if (EXCLUDED_ZONES.includes(v.gridId)) return null;

                 const grid = gridZones.find(g => g.id === v.gridId);
                 if (!grid) return null;
                 if (currentGrid && currentGrid !== v.gridId) return null;

                 const hash = v.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                 const topOffset = (grid.y * 20) + 10 + ((hash % 14) - 7);
                 const leftOffset = (grid.x * 20) + 10 + ((hash % 14) - 7);

                 return (
                   <div 
                      key={v.id}
                      className="absolute w-1.5 h-1.5 rounded-full transition-all duration-1000 z-20"
                      style={{ 
                          top: `${topOffset}%`, 
                          left: `${leftOffset}%`,
                          backgroundColor: v.type === 'Operational' ? COLORS.cyanGlow : v.type === 'Private' ? COLORS.blue : COLORS.orange,
                          boxShadow: `0 0 6px ${v.type === 'Operational' ? COLORS.cyanGlow : COLORS.blue}`
                      }}
                   />
                 );
              })}
            </div>
            
            {/* Floor Reflection / Shadow - Adjusted for move up */}
            <div className="absolute bottom-[10%] w-[60%] h-[20px] bg-tech-cyan/20 blur-xl rounded-[100%] transform scale-y-50"></div>
          </div>
        )}

        {/* Bottom Right Controls: View Switcher & Indicator */}
        <div className="absolute bottom-24 right-4 flex flex-col items-end gap-3 pointer-events-auto z-[9999]">
            
            {/* View Mode Toggle Slider */}
            <div className="bg-tech-panel/90 border border-tech-cyan/30 rounded-lg p-1 flex gap-1 backdrop-blur-md shadow-lg">
                <button 
                    onClick={() => setViewMode('virtual')}
                    className={`
                        px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all
                        ${viewMode === 'virtual' ? 'bg-tech-cyan text-black shadow-[0_0_10px_#06b6d4]' : 'text-tech-dim hover:text-white hover:bg-white/5'}
                    `}
                >
                    <Grid size={14} />
                    虚拟区域
                </button>
                <button 
                    onClick={() => setViewMode('real')}
                    className={`
                        px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all
                        ${viewMode === 'real' ? 'bg-tech-cyan text-black shadow-[0_0_10px_#06b6d4]' : 'text-tech-dim hover:text-white hover:bg-white/5'}
                    `}
                >
                    <Globe size={14} />
                    真实地图
                </button>
            </div>

            {/* Current View Indicator */}
            <div className="flex flex-col items-end gap-1 pointer-events-none">
                <span className="text-tech-dim text-xs uppercase tracking-widest">当前视图</span>
                <div className="text-tech-cyanGlow font-mono text-xl font-bold flex items-center gap-2">
                    <MapPin size={18} />
                    {viewMode === 'real' ? "卫星地图 (OSM)" : (currentGrid ? `区域 ${currentGrid}` : "全域监测网格")}
                </div>
            </div>
        </div>

      </div>

      {/* Bottom Timeline Controls */}
      <div className="h-20 bg-tech-panel/90 border-t border-tech-cyan/20 backdrop-blur flex items-center px-6 gap-6 z-30">
        <button 
          onClick={togglePlay}
          className="w-10 h-10 rounded-full border border-tech-cyan text-tech-cyan hover:bg-tech-cyan hover:text-black flex items-center justify-center transition-colors"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <div className="flex-1 flex flex-col gap-2">
           <div className="flex justify-between text-xs font-mono text-tech-dim">
              <span>00:00</span>
              <span className={`transition-colors ${time > 24 ? 'text-tech-orange animate-pulse' : 'text-tech-cyan'}`}>
                 {Math.floor(time) % 24}:{Math.floor((time % 1) * 60).toString().padStart(2, '0')} 
                 {time > 24 && ' (预测模式)'}
              </span>
              <span>未来24小时</span>
           </div>
           <input 
              type="range" 
              min="0" 
              max="48" 
              step="0.1"
              value={time}
              onChange={(e) => setTime(parseFloat(e.target.value))}
              className="w-full h-1 bg-tech-dim/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-tech-cyan [&::-webkit-slider-thumb]:shadow-[0_0_10px_#06b6d4]"
           />
           {/* Tick marks */}
           <div className="w-full flex justify-between px-1">
              {[0, 6, 12, 18, 24, 30, 36, 42, 48].map(h => (
                  <div key={h} className={`w-px h-2 ${h > 24 ? 'bg-tech-orange/50' : 'bg-tech-dim/50'}`}></div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-component: Real Map (Leaflet) ---

interface RealMapProps {
    gridZones: GridZone[];
    currentGrid: string | null;
    onGridSelect: (id: string | null) => void;
    vehicles: Vehicle[];
}

const RealMap: React.FC<RealMapProps> = ({ gridZones, currentGrid, onGridSelect, vehicles }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const gridLayerRef = useRef<L.LayerGroup | null>(null);
    const vehicleLayerRef = useRef<L.LayerGroup | null>(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const [zoomLevel, setZoomLevel] = useState(10);

    // Zoom Threshold: > 12 = Details (Scatter), <= 12 = Aggregate (Bubbles)
    const ZOOM_THRESHOLD = 12;

    // Shenzhen Bounding Box for Grid Generation
    // North-West to South-East approx
    // SHIFTED UP (North) significantly to exclude Hong Kong border (South > 22.52)
    const BOUNDS = {
        north: 22.95, // Shifted North
        south: 22.52, // Shifted North to cut off HK border
        west: 113.75,
        east: 114.50 
    };

    // Calculate Polygon Centroid for Clustering
    const getPolygonCentroid = (points: [number, number][]): [number, number] => {
        let latSum = 0, lngSum = 0;
        points.forEach(p => {
            latSum += p[0];
            lngSum += p[1];
        });
        return [latSum / points.length, lngSum / points.length];
    };

    // Generate irregular grid shapes once
    const zoneShapes = useMemo(() => {
        const rows = 6; // 5 zones high + 1
        const cols = 6; // 5 zones wide + 1
        const latStep = (BOUNDS.north - BOUNDS.south) / 5;
        const lngStep = (BOUNDS.east - BOUNDS.west) / 5;
        
        // 1. Generate Mesh Vertices
        const vertices: [number, number][][] = [];

        for (let r = 0; r < rows; r++) {
            const rowPoints: [number, number][] = [];
            for (let c = 0; c < cols; c++) {
                // Base grid position
                let lat = BOUNDS.north - (r * latStep);
                let lng = BOUNDS.west + (c * lngStep);

                // Add "natural" distortion to internal vertices only
                // Boundary points must remain fixed to cover the box
                if (r > 0 && r < rows - 1 && c > 0 && c < cols - 1) {
                    // Use deterministic math based on indices so the map shape is stable but irregular
                    // Simulates geographical variance (mountains, coastlines)
                    const latOffset = (Math.sin(r * 2 + c) * 0.3 + Math.cos(c * 1.5)) * (latStep * 0.3);
                    const lngOffset = (Math.cos(r * 1.2 + c * 0.8) * 0.3 + Math.sin(r)) * (lngStep * 0.3);
                    
                    lat += latOffset;
                    lng += lngOffset;
                }
                
                rowPoints.push([lat, lng]);
            }
            vertices.push(rowPoints);
        }

        // 2. Form Polygons from Vertices
        // Map Zone ID (e.g., G-0 to G-24) to Polygon Points
        const shapes: Record<string, [number, number][]> = {};

        // Assuming gridZones are ordered by ID which maps to index 0..24
        for (let i = 0; i < 25; i++) {
             const x = i % 5;
             const y = Math.floor(i / 5);
             const id = `G-${i}`;
             const p1 = vertices[y][x];       // TL
             const p2 = vertices[y][x+1];     // TR
             const p3 = vertices[y+1][x+1];   // BR
             const p4 = vertices[y+1][x];     // BL
             shapes[id] = [p1, p2, p3, p4];
        }
        return shapes;
    }, []);

    useEffect(() => {
        if (!mapRef.current) return;
        if (mapInstance.current) return; // Initialize only once

        // Center map - Shifted view slightly North (22.65)
        const shenzhenCenter: [number, number] = [22.65, 114.1];

        // Create Map
        const map = L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false,
            minZoom: 9,
            maxZoom: 16
        }).setView(shenzhenCenter, 10);

        // Zoom Listener
        map.on('zoomend', () => {
            setZoomLevel(map.getZoom());
        });

        // Add Tile Layer
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        });

        tileLayer.on('loading', () => setIsLoading(true));
        tileLayer.on('load', () => setIsLoading(false));

        tileLayer.addTo(map);

        // Initialize Layer Groups
        gridLayerRef.current = L.layerGroup().addTo(map);
        vehicleLayerRef.current = L.layerGroup().addTo(map);

        // Darken filter
        if (mapRef.current) {
            const tiles = mapRef.current.querySelector('.leaflet-tile-pane');
            if (tiles) {
                // @ts-ignore
                tiles.style.filter = "invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)";
            }
        }

        mapInstance.current = map;

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    // --- Render Grids (Adjust styling based on zoom) ---
    useEffect(() => {
        if (!mapInstance.current || !gridLayerRef.current) return;

        const layerGroup = gridLayerRef.current;
        layerGroup.clearLayers();

        const isZoomedIn = zoomLevel > ZOOM_THRESHOLD;

        gridZones.forEach(zone => {
            if (EXCLUDED_ZONES.includes(zone.id)) return;
            const points = zoneShapes[zone.id];
            if (!points) return;

            const isSelected = currentGrid === zone.id;
            const isCritical = zone.load > 90;
            
            let color = COLORS.cyan;
            if (isCritical) color = COLORS.orange;
            if (isSelected) color = COLORS.cyanGlow;

            const opacity = Math.max(0.1, Math.min(zone.load / 100, 0.6));

            // Reduce grid fill opacity when zoomed in to let vehicles shine
            // Increase border weight when zoomed in for clarity
            const fillOp = isZoomedIn ? (isSelected ? 0.2 : 0.1) : (isSelected ? 0.3 : opacity * 0.5);
            const borderW = isZoomedIn ? (isSelected ? 3 : 1) : (isSelected ? 2 : 0.5);

            const poly = L.polygon(points, {
                color: isSelected ? COLORS.cyanGlow : color,
                weight: borderW,
                fillColor: color,
                fillOpacity: fillOp,
                className: 'transition-all duration-300' 
            });

            poly.on('click', () => {
                onGridSelect(isSelected ? null : zone.id);
            });
            
            // Only show detailed Tooltip on hover when zoomed in
            if (isZoomedIn) {
                poly.bindTooltip(`区域 ${zone.id} (负荷: ${zone.load}%)`, {
                    permanent: isSelected, 
                    direction: 'center',
                    className: 'bg-black/80 text-white border border-cyan-500 text-xs font-mono px-2 py-1 rounded shadow-lg'
                });
            }

            layerGroup.addLayer(poly);
        });

    }, [gridZones, currentGrid, onGridSelect, zoneShapes, zoomLevel]);

    // --- Render Vehicles (Clustered or Scatter) ---
    useEffect(() => {
        if (!mapInstance.current || !vehicleLayerRef.current) return;
        
        const layerGroup = vehicleLayerRef.current;
        layerGroup.clearLayers();

        const isZoomedIn = zoomLevel > ZOOM_THRESHOLD;

        if (isZoomedIn) {
            // HIGH ZOOM: Render Individual Vehicles (Scatter)
            vehicles.forEach(v => {
                 if (EXCLUDED_ZONES.includes(v.gridId)) return;
                 // If a specific grid is selected, filter others
                 if (currentGrid && currentGrid !== v.gridId) return;

                 const gridPoints = zoneShapes[v.gridId];
                 if (!gridPoints) return;

                 // Simple pseudo-random position within the zone based on Hash
                 // (Reusing similar logic to virtual view for determinism without complex point-in-poly math per frame)
                 const center = getPolygonCentroid(gridPoints);
                 const hash = v.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                 
                 // Add scatter jitter
                 const latJitter = (Math.sin(hash) * 0.015);
                 const lngJitter = (Math.cos(hash) * 0.015);

                 const lat = center[0] + latJitter;
                 const lng = center[1] + lngJitter;

                 const color = v.type === 'Operational' ? COLORS.cyanGlow : v.type === 'Private' ? COLORS.blue : COLORS.orange;

                 const marker = L.circleMarker([lat, lng], {
                     radius: 3,
                     fillColor: color,
                     color: color,
                     weight: 1,
                     opacity: 1,
                     fillOpacity: 0.8
                 });
                 
                 marker.bindPopup(`
                    <div class="text-xs font-mono bg-[#0f172a] text-white p-1">
                        <div class="font-bold border-b border-gray-600 mb-1">${v.plate}</div>
                        <div>车型: ${v.model}</div>
                        <div>类型: ${v.type}</div>
                        <div>SOC: ${v.soc}%</div>
                    </div>
                 `);

                 layerGroup.addLayer(marker);
            });
        } else {
            // LOW ZOOM: Render Aggregated Bubbles (Clusters)
            
            // 1. Group by Grid ID
            const clusters: Record<string, { count: number, typeCounts: any }> = {};
            
            vehicles.forEach(v => {
                if (EXCLUDED_ZONES.includes(v.gridId)) return;
                if (!clusters[v.gridId]) {
                    clusters[v.gridId] = { count: 0, typeCounts: {} };
                }
                clusters[v.gridId].count++;
            });

            // 2. Draw Bubbles
            Object.keys(clusters).forEach(gridId => {
                const data = clusters[gridId];
                const points = zoneShapes[gridId];
                if (!points) return;

                const center = getPolygonCentroid(points);
                
                // Size depends on count (logarithmic scale usually better, but linear for small counts ok)
                const size = Math.min(60, 20 + (data.count / 2)); 
                
                const icon = L.divIcon({
                    className: 'custom-cluster-icon',
                    html: `
                        <div class="flex items-center justify-center w-full h-full rounded-full bg-tech-blue/40 border border-tech-cyan/50 shadow-[0_0_15px_rgba(6,182,212,0.4)] backdrop-blur-sm animate-pulse-slow group cursor-pointer hover:bg-tech-cyan/60 hover:scale-110 transition-all">
                            <span class="text-white font-bold font-mono text-xs drop-shadow-md">${data.count}</span>
                        </div>
                    `,
                    iconSize: [size, size],
                    iconAnchor: [size / 2, size / 2] // Center it
                });

                const marker = L.marker(center, { icon });
                
                // Clicking cluster zooms in to that grid
                marker.on('click', () => {
                   if (mapInstance.current) {
                       mapInstance.current.setView(center, ZOOM_THRESHOLD + 1);
                       onGridSelect(gridId);
                   }
                });

                layerGroup.addLayer(marker);
            });
        }

    }, [vehicles, currentGrid, zoneShapes, zoomLevel, onGridSelect]);

    return (
        <div className="relative w-full h-full">
            <div ref={mapRef} className="w-full h-full bg-[#0f172a] relative z-0" />
            
            {/* Loading Overlay */}
             <div className={`absolute inset-0 z-20 flex items-center justify-center bg-[#0f172a] transition-opacity duration-700 ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                 <div className="flex flex-col items-center gap-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-2 border-tech-cyan/20 rounded-full"></div>
                        <div className="absolute inset-0 border-2 border-tech-cyan border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-4 bg-tech-cyan/10 rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-mono text-tech-cyan tracking-[0.2em] animate-pulse">CONNECTING SATELLITE</span>
                        <span className="text-[10px] text-tech-dim mt-1">LOADING GEOSPATIAL DATA...</span>
                    </div>
                 </div>
            </div>
            
            {/* Zoom Indicator for User Feedback */}
            <div className="absolute top-4 right-4 z-[9999] bg-black/60 backdrop-blur border border-white/10 px-2 py-1 rounded text-[10px] text-tech-cyan font-mono pointer-events-none">
                ZOOM: {zoomLevel} {zoomLevel > ZOOM_THRESHOLD ? '(DETAIL MODE)' : '(AGGREGATE MODE)'}
            </div>
        </div>
    );
};

const KpiBadge = ({ label, value, unit, highlight }: { label: string, value: string, unit: string, highlight?: boolean }) => (
    <div className={`
        bg-tech-panel/90 backdrop-blur border px-4 py-2 rounded shadow-lg flex flex-col items-center min-w-[120px] pointer-events-auto
        ${highlight ? 'border-tech-orange/50 shadow-tech-orange/20' : 'border-tech-cyan/30'}
    `}>
        <span className="text-[10px] text-tech-dim uppercase tracking-wider">{label}</span>
        <div className="flex items-baseline gap-1">
            <span className={`text-xl font-mono font-bold ${highlight ? 'text-tech-orange' : 'text-white'}`}>{value}</span>
            <span className="text-[10px] text-tech-dim">{unit}</span>
        </div>
    </div>
);