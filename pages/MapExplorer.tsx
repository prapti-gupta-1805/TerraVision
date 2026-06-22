import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { Layer } from '../types';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import L from 'leaflet';
import 'leaflet.heat';
import type { StreetViewLocation } from '../public/data/streetViewLocations';
import { fetchDelhiAQIStations, getAQIColor, getAQILevel, Station } from '../services/xmlAqiService';
import { analyzeRegionForGreenCorridor } from '../services/geminiService';
import { analyzeRegionData } from '../services/geminiService';
import { suggestCityGreenCorridors } from '../services/geminiService';
import { getPopulationOverview, getPopulationWardMapData } from '../services/geminiService';
import type { PopulationOverview, PopulationWardMapFeature, RegionPolygon } from '../services/geminiService';

// Mock Data
const MOCK_LOCATIONS = {
  center: [28.6139, 77.2090] as [number, number], // New Delhi
  project: [28.6129, 77.2290] as [number, number],
  ev_stations: [
    [28.6100, 77.2000],
    [28.6200, 77.2100],
    [28.6150, 77.1900],
    [28.6050, 77.2150],
  ] as [number, number][],
  trees: [
    [28.6145, 77.2095], [28.6140, 77.2085], [28.6135, 77.2100], [28.6155, 77.2080],
    [28.6160, 77.2110], [28.6125, 77.2070], [28.6110, 77.2090], [28.6130, 77.2060],
  ] as [number, number][],
  solar_potential: [
    [28.6180, 77.2050],
    [28.6190, 77.2060],
    [28.6170, 77.2040],
  ] as [number, number][],
  corridor_path: [
    [28.6129, 77.2290],
    [28.6100, 77.2250],
    [28.6080, 77.2200],
    [28.6050, 77.2150],
    [28.6000, 77.2100]
  ] as [number, number][]
};

const layersData: Layer[] = [
  { id: 'ev', name: 'EV Count', icon: 'ev_station', active: false, colorClass: 'text-blue-600', bgClass: 'bg-blue-100' },
  { id: 'tree', name: 'Tree Cover', icon: 'forest', active: true, colorClass: 'text-green-600', bgClass: 'bg-green-100' },
  { id: 'solar', name: 'Solar Panels', icon: 'wb_sunny', active: false, colorClass: 'text-yellow-600', bgClass: 'bg-yellow-100' },
  { id: 'hotspot', name: 'Hotspot Layer', icon: 'device_thermostat', active: true, colorClass: 'text-red-600', bgClass: 'bg-red-100' },
  { id: 'aqi', name: 'Air Quality Index', icon: 'air', active: false, colorClass: 'text-orange-600', bgClass: 'bg-orange-100' },
  { id: 'population', name: 'Population (2022)', icon: 'groups', active: false, colorClass: 'text-pink-600', bgClass: 'bg-pink-100' },
  { id: 'corridor', name: 'Green Corridors', icon: 'alt_route', active: true, colorClass: 'text-white', bgClass: 'bg-primary', isAi: true },
  { id: 'shade', name: 'Shade Coverage', icon: 'beach_access', active: false, colorClass: 'text-purple-600', bgClass: 'bg-purple-100' },
];

const MapExplorer: React.FC = () => {
  const [layers, setLayers] = useState<Layer[]>(layersData);
  const [selectedProject, setSelectedProject] = useState<boolean>(false);
  const [selectedStreetView, setSelectedStreetView] = useState<StreetViewLocation | null>(null);

  // Analysis Mode State
  const [isAnalysisMode, setIsAnalysisMode] = useState(false);
  const [regionAnalysis, setRegionAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [drawnRegionPoints, setDrawnRegionPoints] = useState<RegionPolygon>([]);
  const [populationOverview, setPopulationOverview] = useState<PopulationOverview | null>(null);
  const [isPopulationLoading, setIsPopulationLoading] = useState(false);
  const [isGeneratingCityCorridors, setIsGeneratingCityCorridors] = useState(false);
  const [cityCorridorSummary, setCityCorridorSummary] = useState<string>('');
  const [cityCorridorCount, setCityCorridorCount] = useState(0);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupsRef = useRef<{ [key: string]: L.LayerGroup }>({});
  const analysisLayerRef = useRef<L.LayerGroup | null>(null);
  const heatMapLayerRef = useRef<any>(null);
  const populationHeatLayerRef = useRef<any>(null);

  const getPopulationDensityColor = (normalized: number): string => {
    if (normalized > 0.85) return '#7e1d47';
    if (normalized > 0.65) return '#be185d';
    if (normalized > 0.45) return '#db2777';
    if (normalized > 0.25) return '#ec4899';
    if (normalized > 0.1) return '#f472b6';
    return '#fbcfe8';
  };

  const drawManualRegion = (points: RegionPolygon, enableVertexEditing = false) => {
    if (!analysisLayerRef.current) return;

    analysisLayerRef.current.clearLayers();

    if (!points.length) return;

    if (points.length >= 3) {
      L.polygon(points as any, {
        color: '#2563eb',
        weight: 2,
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        dashArray: '6, 6'
      }).addTo(analysisLayerRef.current);
    } else {
      L.polyline(points as any, {
        color: '#2563eb',
        weight: 3,
        opacity: 0.8,
        dashArray: '6, 6'
      }).addTo(analysisLayerRef.current);
    }

    points.forEach((point, idx) => {
      if (enableVertexEditing) {
        const vertexMarker = L.marker(point, {
          draggable: true,
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          })
        }).addTo(analysisLayerRef.current);

        vertexMarker.on('dragend', (event: L.DragEndEvent) => {
          const dragged = event.target as L.Marker;
          const latLng = dragged.getLatLng();

          setDrawnRegionPoints(prev => prev.map((p, pIdx) => (
            pIdx === idx ? [latLng.lat, latLng.lng] as [number, number] : p
          )));

          setRegionAnalysis(null);
        });
      } else {
        L.circleMarker(point, {
          radius: 5,
          color: '#2563eb',
          fillColor: idx === points.length - 1 ? '#1d4ed8' : '#3b82f6',
          fillOpacity: 0.95,
          weight: 2
        }).addTo(analysisLayerRef.current);
      }
    });
  };

  const clearManualRegion = () => {
    setDrawnRegionPoints([]);
    setRegionAnalysis(null);
    if (analysisLayerRef.current) {
      analysisLayerRef.current.clearLayers();
    }
  };

  const centerFromPolygon = (polygon: RegionPolygon): [number, number] => {
    if (!polygon.length) return MOCK_LOCATIONS.center;
    const sum = polygon.reduce(
      (acc, point) => [acc[0] + point[0], acc[1] + point[1]],
      [0, 0] as [number, number],
    );
    return [sum[0] / polygon.length, sum[1] / polygon.length];
  };

  const analyzeManualRegion = async () => {
    const map = mapInstanceRef.current;
    if (!map || drawnRegionPoints.length < 3 || !analysisLayerRef.current) return;

    const center = centerFromPolygon(drawnRegionPoints);

    drawManualRegion(drawnRegionPoints, true);

    try {
      setIsAnalyzing(true);
      setSelectedProject(false);

      map.flyToBounds(L.latLngBounds(drawnRegionPoints as any), { padding: [24, 24], duration: 1.2 });

      const regionMetrics = await analyzeRegionData(center[0], center[1], drawnRegionPoints);
      const recommendations = [
        { title: regionMetrics.stats.trees < 10 ? 'Increase Tree Canopy' : 'Preserve Existing Canopy', impact: 'High', icon: 'forest', desc: regionMetrics.stats.trees < 10 ? 'Low local tree density detected. Plant native roadside and median trees.' : 'Protect mature trees and fill small canopy gaps to maintain cooling.' },
        { title: regionMetrics.stats.solar < 4 ? 'Boost Rooftop Solar' : 'Expand Solar Storage', impact: 'Medium', icon: 'wb_sunny', desc: regionMetrics.stats.solar < 4 ? 'Few solar installations found. Prioritize rooftops with strong sunlight exposure.' : 'Good solar presence. Add storage and connect public facilities for better resilience.' },
        { title: regionMetrics.stats.ev < 2 ? 'Add EV Access Points' : 'Improve EV Coverage', impact: 'Medium', icon: 'ev_station', desc: regionMetrics.stats.ev < 2 ? 'EV infrastructure is sparse. Add public chargers near high-footfall roads.' : 'EV network exists. Improve distribution to reduce local charging deserts.' },
        { title: regionMetrics.stats.population > 75000 ? 'High Population Pressure' : 'Balanced Population Load', impact: regionMetrics.stats.population > 75000 ? 'High' : 'Medium', icon: 'groups', desc: regionMetrics.stats.population > 0 ? `Estimated ward population around this region is ${regionMetrics.stats.population.toLocaleString('en-IN')}. Prioritize dense-corridor cooling and pedestrian-first mobility.` : 'Population data not directly mapped to this locality. Use ward layer insights for planning.' }
      ];

      const selectedRegionData = {
        coordinates: center,
        polygon: drawnRegionPoints,
        name: regionMetrics.name,
        heatScore: regionMetrics.heatScore,
        greenScore: regionMetrics.greenScore,
        stats: regionMetrics.stats,
        recommendations,
        corridorSuggestion: null as any
      };

      setRegionAnalysis(selectedRegionData);

      if (layers.find(l => l.id === 'corridor')?.active) {
        const activeLayers = layers.filter(l => l.active).map(l => l.name);
        const corridorSuggestion = await analyzeRegionForGreenCorridor(
          center[0],
          center[1],
          activeLayers,
          selectedRegionData,
          drawnRegionPoints,
        );

        if (corridorSuggestion.success && corridorSuggestion.corridorPath.length > 0) {
          L.polyline(corridorSuggestion.corridorPath, {
            color: '#11d432',
            weight: 6,
            dashArray: '10, 10',
            opacity: 0.85
          }).addTo(analysisLayerRef.current);

          L.polyline(corridorSuggestion.corridorPath, {
            color: '#11d432',
            weight: 20,
            opacity: 0.2,
            lineCap: 'round'
          }).addTo(analysisLayerRef.current);

          corridorSuggestion.corridorPath.forEach((point, idx) => {
            if (idx === 0 || idx === corridorSuggestion.corridorPath.length - 1) {
              L.circleMarker(point, {
                radius: 6,
                color: '#11d432',
                fillColor: '#11d432',
                fillOpacity: 0.85,
                weight: 2
              }).addTo(analysisLayerRef.current);
            }
          });

          setRegionAnalysis((prev: any) => ({
            ...prev,
            corridorSuggestion: {
              type: corridorSuggestion.corridorType,
              reasoning: corridorSuggestion.reasoning,
              features: corridorSuggestion.features
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error analyzing manual region:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleLayer = (id: string) => {
    if (id === 'hotspot' || id === 'aqi') {
      setLayers(prev => {
        const clicked = prev.find(l => l.id === id);
        const nextState = clicked ? !clicked.active : true;
        return prev.map(l => {
          if (l.id === 'hotspot' || l.id === 'aqi') {
            return { ...l, active: nextState };
          }
          return l;
        });
      });
      return;
    }
    setLayers(prev => prev.map(l => l.id === id ? { ...l, active: !l.active } : l));
  };

  const ensureLayerActive = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, active: true } : l));
  };

  const renderCityCorridors = (corridors: Array<{ id: string; path: [number, number][]; corridorType: string; priority: string; reasoning: string; zones: string[] }>) => {
    const map = mapInstanceRef.current;
    const corridorLayer = layerGroupsRef.current.corridor;
    if (!map || !corridorLayer) return;

    corridorLayer.clearLayers();

    const bounds: L.LatLngExpression[] = [];

    corridors.forEach((corridor) => {
      const color = corridor.priority === 'High' ? '#16a34a' : corridor.priority === 'Medium' ? '#22c55e' : '#4ade80';

      L.polyline(corridor.path, {
        color,
        weight: 6,
        dashArray: '10, 10',
        opacity: 0.9,
      })
        .bindPopup(
          `<div class="text-sm"><strong>${corridor.corridorType}</strong><br/>Priority: ${corridor.priority}<br/>Zones: ${corridor.zones.join(', ')}<br/><span class="text-xs">${corridor.reasoning}</span></div>`,
        )
        .addTo(corridorLayer);

      L.polyline(corridor.path, {
        color,
        weight: 16,
        opacity: 0.15,
        lineCap: 'round',
      }).addTo(corridorLayer);

      const start = corridor.path[0];
      const end = corridor.path[corridor.path.length - 1];

      L.circleMarker(start, {
        radius: 5,
        color,
        fillColor: color,
        fillOpacity: 0.9,
        weight: 2,
      }).addTo(corridorLayer);

      L.circleMarker(end, {
        radius: 5,
        color,
        fillColor: color,
        fillOpacity: 0.9,
        weight: 2,
      }).addTo(corridorLayer);

      corridor.path.forEach((point) => bounds.push(point));
    });

    if (bounds.length > 0) {
      map.flyToBounds(bounds as any, { padding: [40, 40], duration: 1.4 });
    }
  };

  const handleSuggestCityCorridors = async () => {
    if (isGeneratingCityCorridors) return;
    setIsGeneratingCityCorridors(true);
    setCityCorridorSummary('');

    try {
      const result = await suggestCityGreenCorridors();

      if (!result.success) {
        setCityCorridorSummary(result.error || 'Unable to generate city-wide corridors right now.');
        return;
      }

      renderCityCorridors(result.corridors);
      ensureLayerActive('corridor');
      setCityCorridorCount(result.corridors.length);
      setCityCorridorSummary(result.citySummary);
      setSelectedProject(false);
      setRegionAnalysis(null);
    } catch (error) {
      setCityCorridorSummary(error instanceof Error ? error.message : 'Unexpected error while generating city corridors.');
    } finally {
      setIsGeneratingCityCorridors(false);
    }
  };

  // Initialize Map
  useEffect(() => {
    const timer = setTimeout(() => {
        if (mapContainerRef.current && !mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false
        }).setView(MOCK_LOCATIONS.center, 14);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        mapInstanceRef.current = map;

        // Initialize layer groups
        layerGroupsRef.current = {
            ev: L.layerGroup().addTo(map),
            tree: L.layerGroup().addTo(map),
            solar: L.layerGroup().addTo(map),
            hotspot: L.layerGroup().addTo(map),
            aqi: L.layerGroup().addTo(map),
          population: L.layerGroup().addTo(map),
            corridor: L.layerGroup().addTo(map),
            shade: L.layerGroup().addTo(map),
            project: L.layerGroup().addTo(map)
        };

        // Initialize Analysis Layer
        analysisLayerRef.current = L.layerGroup().addTo(map);
        
        // EV charging stations icon
        const evIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full border-2 border-white shadow-md"><span class="material-symbols-outlined text-[18px]">ev_station</span></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        // Load EV charging stations from GeoJSON
        fetch('/data/ev_charging_stations.geojson')
          .then(res => res.json())
          .then((data: any) => {
            if (data.features) {
              data.features.forEach((feature: any) => {
                const geom = feature.geometry;
                if (!geom) return;

                if (geom.type === 'Point') {
                  const [lng, lat] = geom.coordinates;
                  L.marker([lat, lng], { icon: evIcon }).addTo(layerGroupsRef.current.ev);
                } else if (geom.type === 'Polygon') {
                  const coords = geom.coordinates?.[0];
                  if (!coords || !coords.length) return;
                  const lngs = coords.map((c: number[]) => c[0]);
                  const lats = coords.map((c: number[]) => c[1]);
                  const avgLng = lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length;
                  const avgLat = lats.reduce((a: number, b: number) => a + b, 0) / lats.length;
                  L.marker([avgLat, avgLng], { icon: evIcon }).addTo(layerGroupsRef.current.ev);
                }
              });
            }
          })
          .catch(err => console.error('Error loading EV stations GeoJSON:', err));

        // Load tree cover data from GeoJSON
        fetch('/data/tree_cover_vegetation.geojson')
          .then(res => res.json())
          .then((data: any) => {
            if (data.features) {
              data.features.forEach((feature: any) => {
                const geom = feature.geometry;
                if (!geom) return;

                if (geom.type === 'Point') {
                  const [lng, lat] = geom.coordinates;
                  L.circleMarker([lat, lng], {
                    radius: 8,
                    color: '#16a34a',
                    fillColor: '#22c55e',
                    fillOpacity: 0.7,
                    weight: 2
                  }).addTo(layerGroupsRef.current.tree);
                } else if (geom.type === 'Polygon') {
                  const coords = geom.coordinates[0].map((c: number[]) => [c[1], c[0]]);
                  L.polygon(coords, {
                    color: '#16a34a',
                    fillColor: '#22c55e',
                    fillOpacity: 0.6,
                    weight: 2
                  }).addTo(layerGroupsRef.current.tree);
                }
              });
            }
          })
          .catch(err => console.error('Error loading tree cover GeoJSON:', err));

        // Load solar panels data from GeoJSON
        fetch('/data/solarPanelsDATA.geojson')
          .then(res => res.json())
          .then((data: any) => {
            if (data.features) {
              data.features.forEach((feature: any) => {
                const geom = feature.geometry;
                const props = feature.properties || {};
                if (!geom) return;

                const solarIcon = L.divIcon({
                  className: 'custom-div-icon',
                  html: `<div class="flex items-center justify-center w-7 h-7 bg-yellow-100 text-yellow-600 rounded-full border-2 border-white shadow-md"><span class="material-symbols-outlined text-[16px]">solar_power</span></div>`,
                  iconSize: [28, 28],
                  iconAnchor: [14, 14],
                });

                if (geom.type === 'Point') {
                  const [lng, lat] = geom.coordinates;
                  L.marker([lat, lng], { icon: solarIcon })
                    .bindPopup(`<div class="text-sm"><strong>Solar Panel</strong><br/>${props.name || 'Installation'}</div>`)
                    .addTo(layerGroupsRef.current.solar);
                } else if (geom.type === 'Polygon') {
                  const coords = geom.coordinates[0].map((c: number[]) => [c[1], c[0]]);
                  const lngs = geom.coordinates[0].map((c: number[]) => c[0]);
                  const lats = geom.coordinates[0].map((c: number[]) => c[1]);
                  const avgLng = lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length;
                  const avgLat = lats.reduce((a: number, b: number) => a + b, 0) / lats.length;
                  L.polygon(coords, {
                    color: '#eab308',
                    fillColor: '#fbbf24',
                    fillOpacity: 0.5,
                    weight: 2
                  }).addTo(layerGroupsRef.current.solar);
                  L.marker([avgLat, avgLng], { icon: solarIcon })
                    .bindPopup(`<div class="text-sm"><strong>Solar Panel</strong><br/>${props.name || 'Installation'}</div>`)
                    .addTo(layerGroupsRef.current.solar);
                }
              });
            }
          })
          .catch(err => console.error('Error loading solar panels GeoJSON:', err));

        // AQI Layer - Initialize empty, will be populated when toggled
        layerGroupsRef.current.aqi = L.layerGroup();

        // Green corridors will be generated on demand for the full city dataset.

        // Project Pin
        const projectIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="relative flex items-center justify-center w-8 h-8 cursor-pointer group">
                    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                    <div class="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg border-2 border-white transform transition-transform group-hover:scale-110">
                        <span class="material-symbols-outlined text-[18px]">star</span>
                    </div>
                    </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        const projectMarker = L.marker(MOCK_LOCATIONS.project, { icon: projectIcon }).addTo(layerGroupsRef.current.project);
        projectMarker.on('click', () => {
            setSelectedProject(true);
            setRegionAnalysis(null);
            map.flyTo([MOCK_LOCATIONS.project[0], MOCK_LOCATIONS.project[1] - 0.005], 15, { animate: true });
        });

        setTimeout(() => {
            map.invalidateSize();
        }, 100);
        }
    }, 100);

    return () => {
        clearTimeout(timer);
    };
  }, []);

  // Analysis Mode Logic
  useEffect(() => {
      const map = mapInstanceRef.current;
      if (!map) return;

      const handleMapClick = (e: L.LeafletMouseEvent) => {
        if (!isAnalysisMode) return;
        const { lat, lng } = e.latlng;
        const nextPoints = [...drawnRegionPoints, [lat, lng] as [number, number]];
        setDrawnRegionPoints(nextPoints);
        setRegionAnalysis(null);
        setSelectedProject(false);
          drawManualRegion(nextPoints, true);
      };

      map.on('click', handleMapClick);

      // Update cursor
      if (mapContainerRef.current) {
          mapContainerRef.current.style.cursor = isAnalysisMode ? 'crosshair' : 'grab';
      }

      if (isAnalysisMode) {
      map.doubleClickZoom.disable();
      } else {
      map.doubleClickZoom.enable();
      }

      return () => {
          map.off('click', handleMapClick);
        map.doubleClickZoom.enable();
      }
    }, [isAnalysisMode, drawnRegionPoints]);

    useEffect(() => {
      if (!isAnalysisMode) return;
      drawManualRegion(drawnRegionPoints, true);
    }, [drawnRegionPoints, isAnalysisMode]);

  // Update Layers Visibility
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    layers.forEach(layer => {
      const group = layerGroupsRef.current[layer.id];
      if (group) {
        if (layer.active) {
          if (!mapInstanceRef.current!.hasLayer(group)) {
             mapInstanceRef.current!.addLayer(group);
          }
        } else {
          if (mapInstanceRef.current!.hasLayer(group)) {
             mapInstanceRef.current!.removeLayer(group);
          }
        }
      }
      
      // Handle heat map layer for AQI
      if (layer.id === 'aqi' && heatMapLayerRef.current) {
        if (layer.active) {
          if (!mapInstanceRef.current!.hasLayer(heatMapLayerRef.current)) {
            mapInstanceRef.current!.addLayer(heatMapLayerRef.current);
          }
        } else {
          if (mapInstanceRef.current!.hasLayer(heatMapLayerRef.current)) {
            mapInstanceRef.current!.removeLayer(heatMapLayerRef.current);
          }
        }
      }

      // Handle heat map layer for Population
      if (layer.id === 'population' && populationHeatLayerRef.current) {
        if (layer.active) {
          if (!mapInstanceRef.current!.hasLayer(populationHeatLayerRef.current)) {
            mapInstanceRef.current!.addLayer(populationHeatLayerRef.current);
          }
        } else {
          if (mapInstanceRef.current!.hasLayer(populationHeatLayerRef.current)) {
            mapInstanceRef.current!.removeLayer(populationHeatLayerRef.current);
          }
        }
      }
    });

    const projectGroup = layerGroupsRef.current['project'];
    const corridorActive = layers.find(l => l.id === 'corridor')?.active;
    if (corridorActive) {
        if (!mapInstanceRef.current!.hasLayer(projectGroup)) mapInstanceRef.current!.addLayer(projectGroup);
    } else {
        if (mapInstanceRef.current!.hasLayer(projectGroup)) mapInstanceRef.current!.removeLayer(projectGroup);
    }

  }, [layers]);

  // Load AQI data from XML when AQI layer is toggled
  useEffect(() => {
    const aqiLayer = layers.find(l => l.id === 'aqi');
    if (!aqiLayer?.active || !mapInstanceRef.current) return;

    const loadAQIData = async () => {
      console.log('📊 Loading Delhi AQI data from XML...');
      
      // Clear previous markers
      if (layerGroupsRef.current.aqi) {
        layerGroupsRef.current.aqi.clearLayers();
      }

      // Fetch Delhi AQI stations from XML
      const stations = await fetchDelhiAQIStations();
      
      console.log(`✅ Got ${stations.length} Delhi AQI stations`);

      // Create heat map data from AQI stations
      const heatData: [number, number, number][] = [];
      
      stations.forEach((station: Station) => {
        const color = getAQIColor(station.aqi);
        
        // Normalize AQI value to 0-1 scale for heat map (max AQI ~500)
        const intensity = Math.min(station.aqi / 300, 1.0);
        
        // Add main point with high intensity
        heatData.push([station.latitude, station.longitude, intensity]);
        
        // Add deterministic surrounding points for large coverage area
        for (let i = 0; i < 50; i++) {
          const angle = (i / 50) * 2 * Math.PI;
          const distance = ((i % 10) + 1) / 10 * 0.03;
          const lat = station.latitude + Math.cos(angle) * distance;
          const lng = station.longitude + Math.sin(angle) * distance;
          heatData.push([lat, lng, intensity * (1 - distance / 0.03)]);
        }

        // Add deterministic lattice points for smoother blending
        for (let i = 0; i < 30; i++) {
          const angle = (i / 30) * 2 * Math.PI;
          const offset = ((i % 6) - 2.5) * 0.006;
          const lat = station.latitude + Math.cos(angle * 3) * 0.014 + offset;
          const lng = station.longitude + Math.sin(angle * 2) * 0.014 - offset;
          heatData.push([lat, lng, intensity * 0.7]);
        }
        
        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow-lg" style="background-color: ${color}; opacity: 0.9">
            <span class="text-white text-xs font-bold">${station.aqi}</span>
          </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const popupContent = `
          <div class="text-sm p-2 font-semibold">
            <div><strong>${station.id}</strong></div>
            <div class="text-xs mt-1">AQI: ${station.aqi} - ${station.level}</div>
            ${station.primaryPollutant ? `<div class="text-xs">Primary: ${station.primaryPollutant}</div>` : ''}
            <div class="text-xs text-gray-500">Updated: ${station.lastupdate}</div>
          </div>
        `;

        L.marker([station.latitude, station.longitude], { icon })
          .bindPopup(popupContent)
          .addTo(layerGroupsRef.current.aqi);
      });
      
      // Create or update heat map layer
      if (heatMapLayerRef.current && mapInstanceRef.current!.hasLayer(heatMapLayerRef.current)) {
        mapInstanceRef.current!.removeLayer(heatMapLayerRef.current);
      }
      
      heatMapLayerRef.current = (L as any).heatLayer(heatData, {
        radius: 60,
        blur: 50,
        maxZoom: 13,
        minOpacity: 0.5,
        max: 1.0,
        gradient: {
          0.0: '#22c55e',
          0.2: '#84cc16',
          0.4: '#eab308',
          0.6: '#f97316',
          0.8: '#ef4444',
          1.0: '#991b1b'
        }
      });
      
      // Add heat map if AQI layer is active
      if (layers.find(l => l.id === 'aqi')?.active) {
        mapInstanceRef.current!.addLayer(heatMapLayerRef.current);
      }
    };

    loadAQIData();
  }, [layers]);

  // Load Population insights and ward-wise map overlays when population layer is toggled
  useEffect(() => {
    const populationLayer = layers.find(l => l.id === 'population');
    if (!mapInstanceRef.current || !layerGroupsRef.current.population) return;

    const loadPopulationInsights = async () => {
      setIsPopulationLoading(Boolean(populationLayer?.active));

      // Clear previous population markers/heat every toggle pass.
      layerGroupsRef.current.population.clearLayers();
      if (populationHeatLayerRef.current && mapInstanceRef.current!.hasLayer(populationHeatLayerRef.current)) {
        mapInstanceRef.current!.removeLayer(populationHeatLayerRef.current);
      }

      if (!populationLayer?.active) {
        setIsPopulationLoading(false);
        return;
      }

      try {
        const [overview, wardMapData] = await Promise.all([
          getPopulationOverview(),
          getPopulationWardMapData(),
        ]);
        setPopulationOverview(overview);

        if (!wardMapData.features.length) return;

        const minDensity = wardMapData.minDensity;
        const maxDensity = Math.max(minDensity + 1, wardMapData.maxDensity);
        const densityDelta = Math.max(1, maxDensity - minDensity);

        const heatData: [number, number, number][] = [];

        wardMapData.features.forEach((feature: PopulationWardMapFeature) => {
          const normalizedDensity = (feature.densityPerKm2 - minDensity) / densityDelta;
          const color = getPopulationDensityColor(normalizedDensity);

          const wardFeatureGeojson = {
            type: 'Feature',
            properties: {
              Ward_Name: feature.wardName,
              Ward_No: feature.wardNo,
              totalPopulation: feature.totalPopulation,
              densityPerKm2: feature.densityPerKm2,
            },
            geometry: feature.geometry,
          } as any;

          L.geoJSON(wardFeatureGeojson, {
            style: {
              color: '#9f1239',
              weight: 1,
              fillColor: color,
              fillOpacity: 0.45,
              interactive: !isAnalysisMode,
            },
          })
            .bindPopup(
              `<div class="text-sm"><strong>${feature.wardName}</strong><br/>Ward No: ${feature.wardNo}<br/>Population: ${feature.totalPopulation.toLocaleString('en-IN')}<br/>Density: ${Math.round(feature.densityPerKm2).toLocaleString('en-IN')} / km²</div>`,
            )
            .addTo(layerGroupsRef.current.population);

          if (feature.centroid) {
            heatData.push([
              feature.centroid[0],
              feature.centroid[1],
              0.2 + Math.max(0, Math.min(1, normalizedDensity)) * 0.8,
            ]);
          }
        });

        populationHeatLayerRef.current = (L as any).heatLayer(heatData, {
          radius: 44,
          blur: 32,
          maxZoom: 13,
          minOpacity: 0.32,
          max: 1.0,
          gradient: {
            0.0: '#fde68a',
            0.4: '#f472b6',
            0.7: '#db2777',
            1.0: '#9d174d',
          },
        });

        if (layers.find(l => l.id === 'population')?.active) {
          mapInstanceRef.current!.addLayer(populationHeatLayerRef.current);
        }

        const [minLat, minLng, maxLat, maxLng] = wardMapData.delhiBounds;
        if (Number.isFinite(minLat) && Number.isFinite(minLng) && Number.isFinite(maxLat) && Number.isFinite(maxLng)) {
          mapInstanceRef.current!.fitBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [24, 24], duration: 1.0 });
        }
      } catch (error) {
        console.error('Error loading population data:', error);
        setPopulationOverview(null);
      } finally {
        setIsPopulationLoading(false);
      }
    };

    loadPopulationInsights();
  }, [layers, isAnalysisMode]);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-200 font-display">
      <Navbar />
      <div className="relative flex-1 w-full overflow-hidden">
        {/* Map Container */}
        <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full" />

        {/* Analyze Mode Overlay Hint */}
        {isAnalysisMode && !regionAnalysis && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[450] bg-blue-600 text-white px-6 py-2 rounded-full shadow-lg font-bold animate-bounce">
            Click points to draw a region and drag points to reshape, then analyze
            </div>
        )}

        {/* Floating Sidebar */}
        <div className="absolute left-6 top-6 bottom-6 z-[400] w-80 flex flex-col gap-4 pointer-events-none">
            {/* Search */}
            <div className="pointer-events-auto bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-2 border border-slate-200">
            <div className="flex items-center gap-2 px-3 h-12">
                <span className="material-symbols-outlined text-slate-400">search</span>
                <input
                type="text"
                placeholder="Search city or coordinates"
                className="bg-transparent border-none focus:ring-0 w-full text-sm font-medium placeholder:text-slate-400 text-slate-800 focus:outline-none"
                defaultValue="New Delhi, India"
                />
            </div>
            </div>

            {/* Layers Panel */}
            <div className="pointer-events-auto flex-1 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB9-Nb3aRjGhOZIvN0KnPMSCH1Zq92I-mzZxS0U1KKqDca_jO2kceKq5myUjsXLytS3mDwBh_8JpgvEr5-6NYLgYbrLTOzglmiYqPQvebCV2LI7wmd61GQw_NzYgECi1g85NUmYby48JcdKPo9ikuUXWOibAvfk_bMHMxfugGKzUE8pdBSb1qocLpcEkNrYyQK12HeixNX7J6sf4CPtwSe1qAlTFPmP8z-lpkN3StUs9scGECNNA_6r-dywHEeiRfgosGIY8YTUeg')"}}></div>
                <div>
                    <h1 className="text-slate-900 text-base font-bold leading-tight">Data Layers</h1>
                    <p className="text-primary text-xs font-medium uppercase tracking-wider">Map Overlays</p>
                </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {layers.map((layer) => (
                    <label
                    key={layer.id}
                    className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${layer.active ? (layer.isAi ? 'bg-primary/10 border border-primary/20' : layer.bgClass.replace('100', '50')) : 'hover:bg-slate-50'}`}
                    onClick={() => toggleLayer(layer.id)}
                    >
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${layer.isAi ? 'bg-primary text-white shadow-sm' : `${layer.bgClass} ${layer.colorClass}`}`}>
                        <span className="material-symbols-outlined text-[20px]">{layer.icon}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">{layer.name}</span>
                            {layer.isAi && <span className="text-[10px] text-primary uppercase font-bold tracking-wider">AI Suggested</span>}
                        </div>
                    </div>
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${layer.active ? 'bg-primary' : 'bg-slate-200'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${layer.active ? 'translate-x-6' : 'translate-x-1'}`}></span>
                    </div>
                    </label>
                ))}
            </div>
            </div>
        </div>

        {/* Right Controls */}
        <div className="absolute right-6 top-6 z-[400] flex flex-col items-end gap-4 pointer-events-none">
            <button
                className={`pointer-events-auto group relative flex items-center justify-center overflow-hidden rounded-full h-12 px-6 shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${isAnalysisMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-slate-900 hover:bg-slate-50'}`}
                onClick={() => {
                    const nextMode = !isAnalysisMode;
                    setIsAnalysisMode(nextMode);
                    if(nextMode) {
                        setRegionAnalysis(null);
                        setSelectedProject(false);
                        clearManualRegion();
                    } else {
                        clearManualRegion();
                    }
                }}
            >
                <span className="material-symbols-outlined mr-2 text-[20px]">{isAnalysisMode ? 'close' : 'manage_search'}</span>
                <span className="text-sm font-bold tracking-wide">{isAnalysisMode ? 'Exit Analysis Mode' : 'Analyze Region'}</span>
            </button>

            {isAnalysisMode && (
              <>
                <button
                  className={`pointer-events-auto group relative flex items-center justify-center overflow-hidden rounded-full h-11 px-5 shadow-lg transition-all duration-300 ${drawnRegionPoints.length >= 3 && !isAnalyzing ? 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-105 active:scale-95' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}
                  onClick={analyzeManualRegion}
                  disabled={drawnRegionPoints.length < 3 || isAnalyzing}
                >
                  <span className="material-symbols-outlined mr-2 text-[18px]">analytics</span>
                  <span className="text-xs font-bold tracking-wide">
                    {isAnalyzing ? 'Analyzing Region...' : `Analyze Selected Region (${drawnRegionPoints.length} points)`}
                  </span>
                </button>

                <button
                  className="pointer-events-auto group relative flex items-center justify-center overflow-hidden rounded-full h-10 px-5 bg-white text-slate-700 border border-slate-200 shadow transition-all duration-300 hover:bg-slate-50"
                  onClick={clearManualRegion}
                >
                  <span className="material-symbols-outlined mr-2 text-[18px]">ink_eraser</span>
                  <span className="text-xs font-bold tracking-wide">Clear Region Selection</span>
                </button>
              </>
            )}

            <button
            className="pointer-events-auto group relative flex items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-primary hover:bg-green-500 text-slate-900 shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
            onClick={handleSuggestCityCorridors}
            >
                <span className={`material-symbols-outlined mr-2 text-[20px] ${isGeneratingCityCorridors ? 'animate-spin' : 'animate-pulse'}`}>{isGeneratingCityCorridors ? 'progress_activity' : 'auto_awesome'}</span>
                <span className="text-sm font-bold tracking-wide">
                  {isGeneratingCityCorridors ? 'Generating City Corridors...' : 'Suggest Green Corridors'}
                </span>
            </button>

            {(cityCorridorSummary || cityCorridorCount > 0) && (
              <div className="pointer-events-auto max-w-sm bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 p-3 text-xs text-slate-700">
                {cityCorridorCount > 0 && (
                  <div className="font-bold text-primary mb-1">{cityCorridorCount} Corridors Suggested</div>
                )}
                {cityCorridorSummary && <div>{cityCorridorSummary}</div>}
              </div>
            )}

            <div className="pointer-events-auto flex flex-col bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 overflow-hidden mt-4">
                <button className="flex w-10 h-10 items-center justify-center hover:bg-slate-100 border-b border-slate-100 text-slate-700" onClick={() => mapInstanceRef.current?.zoomIn()}><span className="material-symbols-outlined">add</span></button>
                <button className="flex w-10 h-10 items-center justify-center hover:bg-slate-100 text-slate-700" onClick={() => mapInstanceRef.current?.zoomOut()}><span className="material-symbols-outlined">remove</span></button>
            </div>
        </div>

        {/* Legend */}
        <div className="absolute right-6 bottom-6 z-[400] pointer-events-auto bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 p-4 w-64">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Legend</h3>
                <span className="material-symbols-outlined text-slate-400 text-[18px] cursor-pointer">expand_more</span>
            </div>
            <div className="space-y-3">
                <div>
                    <div className="flex justify-between text-[10px] font-medium text-slate-600 mb-1">
                    <span>Urban Heat</span>
                    <span>Intensity</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gradient-to-r from-yellow-200 via-orange-400 to-red-600"></div>
                </div>
                <div>
                    <div className="flex justify-between text-[10px] font-medium text-slate-600 mb-1">
                    <span>Corridor Feasibility</span>
                    <span>AI Score</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gradient-to-r from-slate-200 to-primary"></div>
                </div>
            </div>
        </div>

        {/* Population Panel */}
        {layers.find(l => l.id === 'population')?.active && (
          <div className="absolute right-6 bottom-44 z-[420] pointer-events-auto bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 p-4 w-80 max-h-[44vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Delhi Population 2022</h3>
              <span className="material-symbols-outlined text-pink-500 text-[18px]">groups</span>
            </div>

            {isPopulationLoading && (
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-pink-500 border-t-transparent"></span>
                Loading population dataset...
              </div>
            )}

            {!isPopulationLoading && populationOverview && (
              <>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-pink-50 border border-pink-100 rounded-lg p-2">
                    <div className="text-[10px] text-pink-700 uppercase font-bold">Total Population</div>
                    <div className="text-sm font-extrabold text-slate-800">{populationOverview.totalPopulation.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="bg-fuchsia-50 border border-fuchsia-100 rounded-lg p-2">
                    <div className="text-[10px] text-fuchsia-700 uppercase font-bold">Total Wards</div>
                    <div className="text-sm font-extrabold text-slate-800">{populationOverview.wardsCount}</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 mb-2">Top wards by population ({populationOverview.wardsCount} wards in dataset):</div>
                <div className="space-y-1.5">
                  {populationOverview.topWards.slice(0, 8).map((ward) => (
                    <div key={ward.wardNo} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-md px-2 py-1.5">
                      <div className="text-xs font-semibold text-slate-700 truncate pr-2">#{ward.wardNo} {ward.ward}</div>
                      <div className="text-xs font-bold text-pink-700">{ward.totalPopulation.toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!isPopulationLoading && !populationOverview && (
              <div className="text-xs text-slate-500">Unable to load population dataset.</div>
            )}
          </div>
        )}

        {/* 1. PROJECT DETAILS / STREET VIEW CARD */}
        <div
            className={`absolute top-4 right-4 bottom-4 w-[480px] z-[500] flex flex-col bg-surface-light shadow-2xl rounded-2xl border border-gray-200 overflow-hidden transition-transform duration-300 ease-in-out ${selectedProject && !selectedStreetView ? 'translate-x-0' : 'translate-x-[120%]'}`}
        >
            <div className="relative h-64 w-full bg-slate-900 shrink-0">
                <BeforeAfterSlider
                    beforeImage="https://lh3.googleusercontent.com/aida-public/AB6AXuAFH6zu0Et-9Sr7LNGZ9Q4TJ_qqqYygiv3BHgpi6kDsXvunnapFePQ-7YY19y85eCxta4UU9sbrqOAvWxcVpiqoYaQomwpcrWvBEOTfsn0hC2P0hMIYdyQCs_p24K-8CH_OrfQ2-pycbIpol6uk6A9kWM4Az9Lw83mqbVXwa2eq_H4aR8Bmt1UTGuaz-qyKeHojAGWqMmjxEODYUYI_K731styzmAQjkkw9Z2J7oAovwIx_qsmocc1nVhKGws5DaMITrJFGykpcOg"
                    afterImage="https://lh3.googleusercontent.com/aida-public/AB6AXuA_zSknFTIPjy5_EZF6yIggEP5tC0qAKaRybv0DHDRPJ0mN2tjaNZy5vYJ5xUw-ARmRmfR30EUJn8TG2ZBK5KZTB6PkGoBgxm0vU4ZI_Kitnb_u2u8FqAvmp9RoAlpZd84URks9ck-b0yKlbqbryYMFllNwgoQ03QcYZWiOE7_QP5SObleVBq368VbCSv3T0JtCB7q9-IcYjx10yoj5HU1nb1YDDiRv0KumaP_iNeY0V2LM6RyPpYxXEIQkbcwA6sWjv-BBOa4SRg"
                    labelBefore="Current"
                    labelAfter="AI Proposed"
                />
                <button onClick={() => setSelectedProject(false)} className="absolute top-4 right-4 p-2 bg-black/50 text-white hover:bg-black/70 rounded-full backdrop-blur-sm transition-colors z-30">
                   <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
                <div className="absolute bottom-4 left-4 z-30">
                    <span className="px-3 py-1 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">Street View AI</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="flex flex-col gap-2 mb-6">
                    <div className="flex items-center gap-2">
                         <h1 className="text-slate-900 text-2xl font-bold leading-tight">Green Corridor Phase 1</h1>
                         <span className="material-symbols-outlined text-green-500">verified</span>
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Proposed transformation for West 4th Avenue connector.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <MetricCard icon="forest" label="Trees" value="+145" subValue="Native Species" subColor="text-green-600" />
                    <MetricCard icon="thermostat" label="Cooling" value="-2.4°C" subValue="Surface Temp" subColor="text-blue-500" iconBg="bg-blue-100" iconColor="text-blue-500" />
                </div>

                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Project Highlights</h3>
                <div className="space-y-3">
                    <HighlightRow icon="directions_bike" title="Protected Cycle Lane" desc="2.5km of dedicated lanes connecting north to south." />
                    <HighlightRow icon="water_drop" title="Stormwater Management" desc="Bioswales integrated into medians to reduce runoff." />
                    <HighlightRow icon="solar_power" title="Smart Lighting" desc="Solar-powered adaptive street lights." />
                </div>

                <button className="w-full mt-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">download</span> Download Proposal PDF
                </button>
            </div>
        </div>

        {/* STREET VIEW LOCATION DRAWER */}
        <div
            className={`absolute top-4 right-4 bottom-4 w-[480px] z-[500] flex flex-col bg-surface-light shadow-2xl rounded-2xl border border-gray-200 overflow-hidden transition-transform duration-300 ease-in-out ${selectedStreetView ? 'translate-x-0' : 'translate-x-[120%]'}`}
        >
            {selectedStreetView && (
              <>
                <div className="relative w-full shrink-0">
                  <BeforeAfterSlider
                      beforeImage={selectedStreetView.beforeImage}
                      afterImage={selectedStreetView.afterImage}
                      labelBefore="Before"
                      labelAfter="After"
                  />
                  <button 
                    onClick={() => setSelectedStreetView(null)} 
                    className="absolute top-4 right-4 p-2 bg-black/50 text-white hover:bg-black/70 rounded-full backdrop-blur-sm transition-colors z-30"
                  >
                     <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                  <div className="absolute bottom-4 left-4 z-30">
                      <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">Street View</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <div className="flex flex-col gap-2 mb-6">
                      <div className="flex items-center gap-2">
                           <h1 className="text-slate-900 text-2xl font-bold leading-tight">{selectedStreetView.name}</h1>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-blue-500 text-[18px]">location_on</span>
                          <p className="text-sm text-gray-500">
                            {selectedStreetView.coords[0].toFixed(4)}, {selectedStreetView.coords[1].toFixed(4)}
                          </p>
                      </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6">
                      <p className="text-sm text-blue-900 leading-relaxed">
                        {selectedStreetView.description}
                      </p>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">category</span> Transformation Category
                    </h3>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        selectedStreetView.category === 'tree' ? 'bg-green-100 text-green-700' :
                        selectedStreetView.category === 'solar' ? 'bg-yellow-100 text-yellow-700' :
                        selectedStreetView.category === 'corridor' ? 'bg-primary/10 text-primary' :
                        selectedStreetView.category === 'shade' ? 'bg-purple-100 text-purple-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {selectedStreetView.category}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">lightbulb</span> Key Features
                    </h3>
                    {selectedStreetView.category === 'tree' && (
                      <>
                        <HighlightRow icon="forest" title="Tree Canopy" desc="Added dense urban tree coverage for cooling and air quality." />
                        <HighlightRow icon="park" title="Green Spaces" desc="Integrated pocket parks and vegetation zones." />
                      </>
                    )}
                    {selectedStreetView.category === 'solar' && (
                      <>
                        <HighlightRow icon="solar_power" title="Solar Panels" desc="Rooftop and carport solar installations for clean energy." />
                        <HighlightRow icon="bolt" title="Energy Storage" desc="Grid-tied battery systems for stable power supply." />
                      </>
                    )}
                    {selectedStreetView.category === 'corridor' && (
                      <>
                        <HighlightRow icon="alt_route" title="Green Corridor" desc="Continuous vegetation pathway connecting urban areas." />
                        <HighlightRow icon="pedal_bike" title="Bike Lanes" desc="Dedicated cycling infrastructure for sustainable transport." />
                      </>
                    )}
                    {selectedStreetView.category === 'shade' && (
                      <>
                        <HighlightRow icon="beach_access" title="Shade Structures" desc="Modern canopy systems for pedestrian comfort." />
                        <HighlightRow icon="cool_to_dry" title="Cool Surfaces" desc="Heat-reflective materials to reduce urban heat island effect." />
                      </>
                    )}
                    {selectedStreetView.category === 'mixed' && (
                      <>
                        <HighlightRow icon="forest" title="Tree Coverage" desc="Comprehensive urban forestry integration." />
                        <HighlightRow icon="solar_power" title="Solar Energy" desc="Renewable energy infrastructure deployment." />
                        <HighlightRow icon="alt_route" title="Green Corridors" desc="Connected green spaces for biodiversity." />
                      </>
                    )}
                  </div>

                  <button className="w-full mt-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined">auto_awesome</span> Generate AI Proposal
                  </button>
                </div>
              </>
            )}
        </div>

        {/* 2. REGION ANALYSIS DRAWER */}
        <div
            className={`absolute top-4 right-4 bottom-4 w-[400px] z-[500] flex flex-col bg-surface-light shadow-2xl rounded-2xl border border-gray-200 overflow-hidden transition-transform duration-300 ease-in-out ${regionAnalysis && !selectedStreetView ? 'translate-x-0' : 'translate-x-[120%]'}`}
        >
             <div className="bg-blue-600 p-6 text-white shrink-0 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-10 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                 <div className="relative z-10">
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2 bg-white/20 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                            <span className="material-symbols-outlined text-sm">analytics</span> AI Analysis
                        </div>
                        <button onClick={() => setRegionAnalysis(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><span className="material-symbols-outlined">close</span></button>
                     </div>
                     <h2 className="text-2xl font-bold mb-1">{regionAnalysis?.name || "Region Analysis"}</h2>
                     <p className="text-blue-100 text-sm">Based on satellite & sensor data</p>
                 </div>
             </div>

             <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                 {regionAnalysis && (
                     <>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col items-center justify-center gap-1">
                                <span className="text-3xl font-black text-slate-800">{regionAnalysis.heatScore}</span>
                                <span className="text-xs font-bold text-red-500 uppercase">Heat Risk</span>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col items-center justify-center gap-1">
                                <span className="text-3xl font-black text-slate-800">{regionAnalysis.greenScore}%</span>
                                <span className="text-xs font-bold text-green-500 uppercase">Green Cover</span>
                            </div>
                        </div>

                        {/* REGION COUNTS SECTION */}
                        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-gray-500">inventory_2</span> Region Assets
                        </h3>
                        <div className="grid grid-cols-5 gap-2 mb-6 border-b border-gray-200 pb-6">
                            <div className="flex flex-col items-center p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                                <span className="material-symbols-outlined text-green-600 mb-1">forest</span>
                                <span className="text-lg font-bold text-slate-800">{regionAnalysis.stats.trees}</span>
                                <span className="text-[10px] text-gray-400 uppercase">Trees</span>
                            </div>
                            <div className="flex flex-col items-center p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                                <span className="material-symbols-outlined text-blue-600 mb-1">ev_station</span>
                                <span className="text-lg font-bold text-slate-800">{regionAnalysis.stats.ev}</span>
                                <span className="text-[10px] text-gray-400 uppercase">EVs</span>
                            </div>
                            <div className="flex flex-col items-center p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                                <span className="material-symbols-outlined text-yellow-600 mb-1">solar_power</span>
                                <span className="text-lg font-bold text-slate-800">{regionAnalysis.stats.solar}</span>
                                <span className="text-[10px] text-gray-400 uppercase">Solar</span>
                            </div>
                            <div className="flex flex-col items-center p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                              <span className="material-symbols-outlined text-pink-600 mb-1">groups</span>
                              <span className="text-sm font-bold text-slate-800">{(regionAnalysis.stats.population || 0).toLocaleString('en-IN')}</span>
                              <span className="text-[10px] text-gray-400 uppercase">Population</span>
                            </div>
                            <div className="flex flex-col items-center p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                                <span className="material-symbols-outlined text-purple-600 mb-1">square_foot</span>
                                <span className="text-lg font-bold text-slate-800">{regionAnalysis.stats.area}</span>
                                <span className="text-[10px] text-gray-400 uppercase">km²</span>
                            </div>
                        </div>

                        {/* AI CORRIDOR SUGGESTION */}
                        {regionAnalysis.corridorSuggestion && (
                            <>
                                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-green-600">route</span> AI Green Corridor
                                </h3>
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200 shadow-sm mb-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="material-symbols-outlined text-green-600 bg-green-100 p-1.5 rounded-lg">eco</span>
                                        <span className="font-bold text-green-900 text-sm capitalize">{regionAnalysis.corridorSuggestion.type} Corridor</span>
                                        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-600 text-white">AI Generated</span>
                                    </div>
                                    <p className="text-xs text-green-800 mb-3 leading-relaxed">{regionAnalysis.corridorSuggestion.reasoning}</p>
                                    <div className="space-y-1">
                                        {regionAnalysis.corridorSuggestion.features.map((feature: string, idx: number) => (
                                            <div key={idx} className="flex items-start gap-2 text-xs text-green-700">
                                                <span className="material-symbols-outlined text-green-600 text-sm mt-0.5">check_circle</span>
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Loading indicator for AI analysis */}
                        {isAnalyzing && (
                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6 flex items-center gap-3">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                                <span className="text-xs text-blue-800 font-medium">AI analyzing optimal corridor placement...</span>
                            </div>
                        )}

                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">auto_awesome</span> AI Recommendations
                        </h3>

                        <div className="space-y-3">
                            {regionAnalysis.recommendations.map((rec: any, idx: number) => (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-primary/30 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary bg-primary/10 p-1 rounded text-lg">{rec.icon}</span>
                                            <span className="font-bold text-slate-800 text-sm">{rec.title}</span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rec.impact === 'High' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>{rec.impact} Impact</span>
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed pl-8">{rec.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 bg-blue-50 border border-blue-100 p-4 rounded-xl">
                            <p className="text-xs text-blue-800 font-medium text-center">Selecting this zone for intervention could reduce local temperatures by an estimated 1.5°C.</p>
                        </div>
                     </>
                 )}
             </div>
        </div>

      </div>
    </div>
  );
};

const MetricCard = ({ icon, label, value, subValue, subColor, iconBg = "bg-primary/10", iconColor = "text-primary" }: any) => (
    <div className="bg-gray-50 p-4 rounded-xl flex flex-col gap-1 border border-transparent hover:border-primary/30 transition-colors">
       <div className="flex items-center gap-2 mb-1">
          <div className={`${iconBg} p-1.5 rounded-lg ${iconColor}`}>
             <span className="material-symbols-outlined text-[20px]">{icon}</span>
          </div>
          <span className="text-xs font-bold text-gray-500 uppercase">{label}</span>
       </div>
       <p className="text-2xl font-bold text-slate-900">{value}</p>
       <p className={`text-xs ${subColor} font-medium`}>{subValue}</p>
    </div>
);

const HighlightRow = ({ icon, title, desc }: any) => (
    <div className="flex gap-3 items-start p-3 hover:bg-gray-50 rounded-lg transition-colors">
        <span className="material-symbols-outlined text-gray-400 mt-0.5">{icon}</span>
        <div>
            <h4 className="text-sm font-bold text-slate-800">{title}</h4>
            <p className="text-xs text-gray-500 leading-snug">{desc}</p>
        </div>
    </div>
);

export default MapExplorer;