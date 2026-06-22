# Map Explorer Component Documentation

## Overview

The **MapExplorer** component is an interactive mapping application for visualizing and analyzing urban sustainability data in Delhi. It integrates real-time environmental data, AI-powered analysis, and street view transformations to help plan green infrastructure improvements.

## Table of Contents

1. [Architecture](#architecture)
2. [Key Features](#key-features)
3. [Map Initialization](#map-initialization)
4. [Data Layers](#data-layers)
5. [AI Integration](#ai-integration)
6. [Street View Locations](#street-view-locations)
7. [Analysis Mode](#analysis-mode)
8. [State Management](#state-management)
9. [Data Flow](#data-flow)
10. [API Integration](#api-integration)

---

## Architecture

### Component Structure

```
MapExplorer
├── Map Container (Leaflet)
├── Left Sidebar
│   ├── Search Bar
│   └── Layers Panel (toggleable)
├── Right Controls
│   ├── Analysis Mode Toggle
│   ├── AI Corridor Suggestion
│   └── Zoom Controls
├── Floating Drawers
│   ├── Project Details Drawer
│   ├── Street View Drawer
│   └── Region Analysis Drawer
└── Legend
```

### Technologies Used

- **React** (18.x) - UI framework
- **TypeScript** - Type safety
- **Leaflet** (1.9.x) - Interactive maps
- **leaflet.heat** - Heat map visualization
- **Gemini AI** - AI-powered analysis (via backend API)
- **Tailwind CSS** - Styling

---

## Key Features

### 1. **Interactive Map Layers**
- EV Charging Stations
- Tree Cover & Vegetation
- Solar Panel Installations
- Urban Heat Hotspots
- Air Quality Index (AQI) with heat map
- Green Corridors
- Shade Coverage

### 2. **AI-Powered Analysis**
- Region-based environmental assessment
- AI-generated green corridor suggestions
- Real-time recommendations based on active layers

### 3. **Street View Transformations**
- Before/after visualizations
- Category-based filtering (tree, solar, corridor, shade, mixed)
- Interactive comparison slider

### 4. **Real-Time Data**
- Live AQI data from Delhi monitoring stations (XML feed)
- GeoJSON-based infrastructure data
- Dynamic heat map visualization

---

## Map Initialization

### Process Flow

```typescript
useEffect(() => {
  // 1. Create Leaflet map instance
  const map = L.map(container).setView([28.6139, 77.2090], 14);
  
  // 2. Add base tile layer (CartoDB Voyager)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);
  
  // 3. Initialize layer groups for each data type
  layerGroupsRef.current = {
    ev: L.layerGroup(),
    tree: L.layerGroup(),
    solar: L.layerGroup(),
    // ... etc
  };
  
  // 4. Load GeoJSON data for each layer
  // 5. Create markers and polygons
  // 6. Set up click handlers
}, []);
```

### Map Configuration

- **Center**: New Delhi (28.6139°N, 77.2090°E)
- **Initial Zoom**: 14
- **Max Zoom**: 20
- **Tile Provider**: CartoDB Voyager (light, clean aesthetic)

### Why CartoDB Voyager?
- Clean, minimalist design
- Good label visibility
- Optimized for data overlay
- No attribution clutter

---

## Data Layers

### 1. EV Charging Stations

**Data Source**: `/data/ev_charging_stations.geojson`

**Implementation**:
```typescript
fetch('/data/ev_charging_stations.geojson')
  .then(res => res.json())
  .then(data => {
    data.features.forEach(feature => {
      if (feature.geometry.type === 'Point') {
        const [lng, lat] = feature.geometry.coordinates;
        L.marker([lat, lng], { icon: evIcon }).addTo(layerGroupsRef.current.ev);
      }
    });
  });
```

**Marker Style**:
- Icon: `ev_station` (Material Symbols)
- Color: Blue (#3b82f6)
- Background: Light blue circle
- Border: White, 2px

**Data Handling**:
- Supports both Point and Polygon geometries
- For polygons, calculates centroid and places marker there
- All coordinates converted from GeoJSON format [lng, lat] to Leaflet format [lat, lng]

---

### 2. Tree Cover & Vegetation

**Data Source**: `/data/tree_cover_vegetation.geojson`

**Implementation**:
- **Points**: Rendered as circle markers (radius: 8px)
- **Polygons**: Rendered as filled polygons with transparency

**Visual Style**:
- Color: Green (#16a34a)
- Fill: Light green (#22c55e)
- Opacity: 60-70%
- Weight: 2px

**Purpose**: Shows existing urban forestry and green spaces

---

### 3. Solar Panels

**Data Source**: `/data/solarPanelsDATA.geojson`

**Features**:
- Interactive popups with installation details
- Icon markers for point locations
- Polygon overlays for larger installations
- Dual rendering: polygon + center marker

**Visual Style**:
- Color: Yellow (#eab308)
- Fill: Amber (#fbbf24)
- Icon: `solar_power`
- Popup: Shows installation name

**Smart Rendering**:
```typescript
if (geom.type === 'Polygon') {
  // 1. Draw polygon
  L.polygon(coords, { color: '#eab308', fillOpacity: 0.5 });
  
  // 2. Calculate centroid
  const avgLat = lats.reduce((a, b) => a + b) / lats.length;
  const avgLng = lngs.reduce((a, b) => a + b) / lngs.length;
  
  // 3. Place marker at center
  L.marker([avgLat, avgLng], { icon: solarIcon });
}
```

---

### 4. Urban Heat Hotspots

**Data Source**: Hardcoded locations (mock data)

**Implementation**:
```typescript
const hotspots = [
  [28.6110, 77.2050],
  [28.6180, 77.2150]
];

hotspots.forEach(loc => {
  L.circle(loc, {
    radius: 300, // meters
    color: 'transparent',
    fillColor: '#ef4444', // red
    fillOpacity: 0.2
  });
});
```

**Purpose**: Indicates areas with elevated surface temperatures

---

### 5. Air Quality Index (AQI)

**Data Source**: `/data/rss_feed (1).xml` (Delhi government feed)

**Process Flow**:

```
1. Toggle AQI layer ON
   ↓
2. fetchDelhiAQIStations() called
   ↓
3. Parse XML → extract stations
   ↓
4. For each station:
   - Create AQI marker with color-coded circle
   - Generate 50 surrounding points (radius spread)
   - Add 30 random points for blending
   ↓
5. Build heat map from all points
   ↓
6. Apply gradient (green → yellow → red)
   ↓
7. Render on map with opacity 0.5
```

**Heat Map Configuration**:
```typescript
L.heatLayer(heatData, {
  radius: 60,           // Influence radius
  blur: 50,             // Blur amount
  maxZoom: 13,          // Max zoom for effect
  minOpacity: 0.5,      // Minimum opacity
  gradient: {
    0.0: '#22c55e',     // Green (good)
    0.2: '#84cc16',     // Lime
    0.4: '#eab308',     // Yellow
    0.6: '#f97316',     // Orange
    0.8: '#ef4444',     // Red
    1.0: '#991b1b'      // Dark red (severe)
  }
});
```

**AQI Marker Colors**:
| AQI Range | Level | Color |
|-----------|-------|-------|
| 0-50 | Good | Green |
| 51-100 | Satisfactory | Yellow |
| 101-200 | Moderately Polluted | Orange |
| 201-300 | Poor | Red |
| 301-400 | Very Poor | Dark Red |
| 400+ | Severe | Very Dark Red |

**Smart Point Generation**:
- **1 main point** at station location with full intensity
- **50 circular points** around station (0-3km radius) for smooth coverage
- **30 random points** for blending between stations
- **Intensity decay** based on distance from center

This creates a realistic, smooth AQI gradient across Delhi instead of discrete circles.

---

### 6. Green Corridors

**Data Source**: Mock corridor path + AI-generated suggestions

**Static Corridor**:
```typescript
const corridorPath = [
  [28.6129, 77.2290],
  [28.6100, 77.2250],
  [28.6080, 77.2200],
  [28.6050, 77.2150],
  [28.6000, 77.2100]
];

// Main corridor line
L.polyline(corridorPath, {
  color: '#11d432',
  weight: 6,
  dashArray: '10, 10',
  opacity: 0.8
});

// Halo effect (glow)
L.polyline(corridorPath, {
  color: '#11d432',
  weight: 20,
  opacity: 0.2,
  lineCap: 'round'
});
```

**AI-Generated Corridors**: See [AI Integration](#ai-integration) section

**Interactive Elements**:
- Click corridor → Opens project details drawer
- Click project marker → Zooms to location + opens drawer

---

### 7. Shade Coverage

**Data Source**: To be implemented (placeholder layer)

**Purpose**: Would show areas with natural or artificial shade structures

---

## AI Integration

### Overview

The AI integration uses **Gemini 2.0 Flash** via a secure backend API to analyze regions and suggest optimal green corridor placements.

### Architecture

```
Frontend (MapExplorer)
    ↓ (POST /api/gemini)
Backend API (Vercel Serverless Function)
    ↓ (Gemini AI SDK)
Google Gemini AI
    ↓ (JSON response)
Backend API
    ↓ (Structured data)
Frontend (Render on map)
```

### Process Flow

#### 1. User Clicks Map in Analysis Mode

```typescript
const handleMapClick = async (e: L.LeafletMouseEvent) => {
  if (!isAnalysisMode) return;
  
  const { lat, lng } = e.latlng;
  
  // Draw selection box
  L.polygon(bounds, { ... }).addTo(analysisLayerRef.current);
  
  // Generate mock regional data
  const mockRegionData = {
    coordinates: [lat, lng],
    heatScore: Math.random() * 30 + 60,
    greenScore: Math.random() * 40 + 20,
    stats: { trees, ev, solar, area }
  };
  
  // Show analysis drawer
  setRegionAnalysis(mockRegionData);
};
```

#### 2. AI Corridor Analysis (if corridor layer active)

```typescript
if (layers.find(l => l.id === 'corridor')?.active) {
  setIsAnalyzing(true);
  
  const corridorSuggestion = await analyzeRegionForGreenCorridor(
    lat,
    lng,
    activeLayers,
    mockRegionData
  );
  
  if (corridorSuggestion.success) {
    // Draw AI-suggested corridor
    L.polyline(corridorSuggestion.corridorPath, { ... });
    
    // Update analysis with corridor info
    setRegionAnalysis(prev => ({
      ...prev,
      corridorSuggestion: {
        type: corridorSuggestion.corridorType,
        reasoning: corridorSuggestion.reasoning,
        features: corridorSuggestion.features
      }
    }));
  }
  
  setIsAnalyzing(false);
}
```

#### 3. Backend API Request

**Request Payload**:
```json
{
  "action": "analyze-corridor",
  "centerLat": 28.6139,
  "centerLng": 77.2090,
  "activeLayers": ["Tree Cover", "Solar Potential", "AQI"],
  "regionData": {
    "heatScore": 75,
    "greenScore": 35,
    "stats": { "trees": 120, "ev": 5, "solar": 25, "area": "1.2" }
  }
}
```

#### 4. Gemini AI Prompt

```
You are an urban planning AI analyzing a region in Delhi at coordinates (28.6139, 77.2090).

Region Data:
- Heat Score: 75/100
- Green Coverage: 35%
- Existing Trees: 120
- Active Layers: Tree Cover, Solar Potential, AQI

Task: Suggest an optimal green corridor placement for this area.

Respond ONLY with valid JSON:
{
  "corridorType": "urban-biodiversity|cooling|mixed-use|connectivity",
  "pathPoints": [[lat1, lng1], [lat2, lng2], ...],
  "reasoning": "brief explanation",
  "features": ["feature1", "feature2", "feature3"]
}
```

#### 5. AI Response Processing

**Backend**:
```typescript
const result = await model.generateContent({ ... });
const responseText = result.response.text();

// Extract JSON from response
const jsonMatch = responseText.match(/\{[\s\S]*\}/);
const corridorData = JSON.parse(jsonMatch[0]);

return {
  success: true,
  corridorPath: corridorData.pathPoints,
  corridorType: corridorData.corridorType,
  reasoning: corridorData.reasoning,
  features: corridorData.features
};
```

**Frontend**:
```typescript
// Draw corridor on map
L.polyline(corridorSuggestion.corridorPath, {
  color: '#11d432',
  weight: 6,
  dashArray: '10, 10'
}).addTo(analysisLayerRef.current);

// Add endpoint markers
corridorSuggestion.corridorPath.forEach((point, idx) => {
  if (idx === 0 || idx === last) {
    L.circleMarker(point, { ... });
  }
});
```

#### 6. Display in Drawer

```tsx
{regionAnalysis.corridorSuggestion && (
  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl">
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-green-600">eco</span>
      <span className="font-bold">{corridorType} Corridor</span>
      <span className="badge">AI Generated</span>
    </div>
    <p className="text-xs">{reasoning}</p>
    <div className="space-y-1">
      {features.map(feature => (
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined">check_circle</span>
          <span>{feature}</span>
        </div>
      ))}
    </div>
  </div>
)}
```

### AI Corridor Types

1. **Urban Biodiversity**: Focuses on native species and wildlife connectivity
2. **Cooling Corridor**: Maximizes temperature reduction through shade and evapotranspiration
3. **Mixed-Use**: Combines multiple benefits (trees, cycling, recreation)
4. **Connectivity**: Links existing green spaces for pedestrian/cyclist movement

### Security

- ✅ API key stored server-side only (not exposed to browser)
- ✅ Backend validates requests
- ✅ CORS enabled for frontend access
- ✅ Rate limiting can be added at API level

---

## Street View Locations

### Overview

Street view locations are predefined points with before/after transformation images showing the impact of sustainability interventions.

### Data Structure

```typescript
interface StreetViewLocation {
  coords: [number, number];  // [lat, lng]
  name: string;              // Display name
  category: 'tree' | 'solar' | 'corridor' | 'shade' | 'mixed';
  beforeImage: string;       // URL
  afterImage: string;        // URL
  description: string;       // Transformation description
}
```

### Filtering Logic

```typescript
function getStreetViewLocationsByLayers(activeLayerIds: string[]) {
  return STREET_VIEW_LOCATIONS.filter(location => {
    // If corridor layer active, show corridor/mixed locations
    if (activeLayerIds.includes('corridor')) {
      return ['corridor', 'mixed'].includes(location.category);
    }
    
    // If tree layer active, show tree locations
    if (activeLayerIds.includes('tree')) {
      return ['tree', 'mixed'].includes(location.category);
    }
    
    // ... similar logic for other layers
  });
}
```

### Rendering

**Blue Circle Overlay**:
```typescript
L.circle(location.coords, {
  radius: 150,              // 150 meters
  color: '#3b82f6',         // Blue
  fillColor: '#3b82f6',
  fillOpacity: 0.3,
  weight: 2
});
```

**Center Marker**:
```typescript
const icon = L.divIcon({
  html: `<div class="w-10 h-10 bg-blue-500 text-white rounded-full">
    <span class="material-symbols-outlined">visibility</span>
  </div>`
});

L.marker(location.coords, { icon });
```

### Interaction

```typescript
const handleClick = () => {
  setSelectedStreetView(location);
  setSelectedProject(false);
  setRegionAnalysis(null);
};

circle.on('click', handleClick);
marker.on('click', handleClick);
```

### Before/After Slider

Component: `BeforeAfterSlider`

**Features**:
- Drag slider to reveal transformation
- Smooth clip-path animation
- Labels for "Before" and "After"
- Chevron indicators

---

## Analysis Mode

### Activation

```typescript
const [isAnalysisMode, setIsAnalysisMode] = useState(false);

// Toggle button
<button onClick={() => setIsAnalysisMode(!isAnalysisMode)}>
  {isAnalysisMode ? 'Exit Analysis Mode' : 'Analyze Region'}
</button>
```

### UI Changes

1. **Cursor**: Changes to crosshair
2. **Hint Overlay**: Shows "Click anywhere on the map to analyze region"
3. **Map Click Handler**: Activates region analysis

### Click Handler Logic

```typescript
map.on('click', async (e) => {
  if (!isAnalysisMode) return;
  
  // 1. Clear previous analysis
  analysisLayerRef.current.clearLayers();
  
  // 2. Draw selection box (400m x 400m)
  const bounds = [
    [lat + 0.004, lng - 0.004],
    [lat + 0.004, lng + 0.004],
    [lat - 0.004, lng + 0.004],
    [lat - 0.004, lng - 0.004]
  ];
  L.polygon(bounds, { color: '#2563eb', dashArray: '6, 6' });
  
  // 3. Add center marker with bounce animation
  L.marker([lat, lng], { icon: bouncingDot });
  
  // 4. Zoom to region
  map.flyTo([lat, lng], 16, { duration: 1.5 });
  
  // 5. Generate analysis data
  const analysis = generateMockRegionData(lat, lng);
  setRegionAnalysis(analysis);
  
  // 6. Call AI for corridor suggestion (if enabled)
  if (corridorLayerActive) {
    const aiSuggestion = await analyzeRegionForGreenCorridor(...);
    // ... render corridor
  }
});
```

### Region Analysis Data

**Generated Metrics**:
- **Heat Score**: Random 60-90 (higher = hotter)
- **Green Coverage**: Random 20-60%
- **Asset Count**: Trees, EV stations, solar panels, area (km²)
- **Recommendations**: 3 AI-suggested interventions

**Recommendations Format**:
```typescript
{
  title: "Increase Tree Canopy",
  impact: "High|Medium",
  icon: "forest",
  desc: "Plant 200+ native shade trees to reduce surface temps by 3°C."
}
```

---

## State Management

### Component State

```typescript
// Layers
const [layers, setLayers] = useState<Layer[]>(layersData);

// Drawer States
const [selectedProject, setSelectedProject] = useState<boolean>(false);
const [selectedStreetView, setSelectedStreetView] = useState<StreetViewLocation | null>(null);
const [regionAnalysis, setRegionAnalysis] = useState<any>(null);

// Analysis Mode
const [isAnalysisMode, setIsAnalysisMode] = useState(false);
const [isAnalyzing, setIsAnalyzing] = useState(false);
```

### Refs (Persistent)

```typescript
// Map instance
const mapInstanceRef = useRef<L.Map | null>(null);

// Layer groups
const layerGroupsRef = useRef<{ [key: string]: L.LayerGroup }>({});

// Special layers
const analysisLayerRef = useRef<L.LayerGroup | null>(null);
const streetViewLayerRef = useRef<L.LayerGroup | null>(null);
const heatMapLayerRef = useRef<any>(null);
```

### Why Refs?

- Refs persist across re-renders
- Leaflet objects don't need to be in React state
- Prevents unnecessary re-renders
- Direct access to map API

### Layer Toggle Logic

```typescript
const toggleLayer = (id: string) => {
  setLayers(prev => prev.map(l => 
    l.id === id ? { ...l, active: !l.active } : l
  ));
};

// Effect to sync with map
useEffect(() => {
  layers.forEach(layer => {
    const group = layerGroupsRef.current[layer.id];
    if (layer.active) {
      map.addLayer(group);
    } else {
      map.removeLayer(group);
    }
  });
}, [layers]);
```

---

## Data Flow

### 1. Map Initialization Flow

```
Component Mount
    ↓
Create Map Instance
    ↓
Add Base Tile Layer
    ↓
Initialize Layer Groups
    ↓
Fetch GeoJSON Data (parallel)
    ├── EV Stations
    ├── Tree Cover
    └── Solar Panels
    ↓
Parse & Render Markers
    ↓
Set up Event Listeners
    ↓
Map Ready
```

### 2. Layer Toggle Flow

```
User Clicks Layer Toggle
    ↓
setState(layers) updated
    ↓
useEffect([layers]) triggered
    ↓
Check layer.active flag
    ↓
Add/Remove from map
    ↓
Special handling for AQI
    ├── Fetch XML data
    ├── Generate heat map
    └── Render
```

### 3. Analysis Mode Flow

```
User Clicks "Analyze Region"
    ↓
isAnalysisMode = true
    ↓
Cursor → crosshair
    ↓
User Clicks Map
    ↓
Draw selection box
    ↓
Generate analysis data
    ↓
Show drawer
    ↓
If corridor layer active
    ↓
Call AI API
    ↓
Wait for response
    ↓
Parse JSON
    ↓
Draw corridor on map
    ↓
Update drawer with AI data
```

### 4. Street View Flow

```
Layers Updated
    ↓
getStreetViewLocationsByLayers()
    ↓
Filter by active layers
    ↓
Clear existing markers
    ↓
Render new markers + circles
    ↓
User Clicks Circle/Marker
    ↓
setSelectedStreetView(location)
    ↓
Drawer Opens
    ↓
BeforeAfterSlider Rendered
```

---

## API Integration

### 1. GeoJSON Files

**Format**:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point|Polygon",
        "coordinates": [lng, lat] // or [[lng, lat], ...]
      },
      "properties": {
        "name": "...",
        // ... other metadata
      }
    }
  ]
}
```

**Loading**:
```typescript
fetch('/data/file.geojson')
  .then(res => res.json())
  .then(data => {
    data.features.forEach(feature => {
      // Process each feature
    });
  })
  .catch(err => console.error(err));
```

### 2. AQI XML Feed

**Source**: `/data/rss_feed (1).xml`

**Structure**:
```xml
<root>
  <State id="Delhi">
    <City id="Delhi">
      <Station id="Station Name" latitude="28.xxx" longitude="77.xxx" lastupdate="...">
        <Air_Quality_Index Value="150" Predominant_Parameter="PM2.5"/>
      </Station>
    </City>
  </State>
</root>
```

**Parser**: `services/xmlAqiService.ts`

**Functions**:
- `fetchDelhiAQIStations()`: Returns `Station[]`
- `getAQILevel(aqi)`: Returns level name
- `getAQIColor(aqi)`: Returns hex color

### 3. Gemini AI API

**Endpoint**: `/api/gemini` (Vercel serverless function)

**Request Format**:
```typescript
POST /api/gemini
Content-Type: application/json

{
  "action": "analyze-corridor",
  "centerLat": number,
  "centerLng": number,
  "activeLayers": string[],
  "regionData": {
    heatScore: number,
    greenScore: number,
    stats: { ... }
  }
}
```

**Response Format**:
```typescript
{
  "success": boolean,
  "corridorPath": [number, number][],
  "corridorType": string,
  "reasoning": string,
  "features": string[],
  "error"?: string
}
```

**Frontend Service**: `services/geminiService.ts`

**Function**: `analyzeRegionForGreenCorridor(lat, lng, layers, data)`

---

## Performance Optimizations

### 1. Lazy Loading

- GeoJSON files loaded on demand
- AQI data fetched only when layer toggled
- Heat map generated once and cached

### 2. Refs for Non-Reactive Data

- Map instance in ref (not state)
- Layer groups in ref
- Prevents unnecessary re-renders

### 3. Debounced Interactions

- Map click handler waits for analysis mode check
- Layer toggles batch update

### 4. Efficient Rendering

- Circle markers instead of full icons for trees
- SVG icons for better performance
- Opacity instead of full overlays

### 5. Memory Management

- Clear layers before re-rendering
- Remove event listeners on cleanup
- Invalidate map size after updates

---

## Error Handling

### 1. GeoJSON Loading

```typescript
fetch('/data/file.geojson')
  .catch(err => {
    console.error('Error loading GeoJSON:', err);
    // Fail silently, layer just won't show
  });
```

### 2. AQI Data

```typescript
const stations = await fetchDelhiAQIStations();
if (stations.length === 0) {
  console.error('No AQI data available');
  return; // Don't render heat map
}
```

### 3. AI API

```typescript
try {
  const result = await analyzeRegionForGreenCorridor(...);
  if (!result.success) {
    console.error('AI analysis failed:', result.error);
    // Show error message in drawer
  }
} catch (error) {
  console.error('Error calling AI:', error);
} finally {
  setIsAnalyzing(false); // Always stop loading spinner
}
```

---

## Future Enhancements

### Planned Features

1. **Real-time Weather Integration**
   - Temperature overlay
   - Wind patterns
   - Precipitation data

2. **User-Generated Corridors**
   - Draw custom paths
   - Save/share designs
   - Community voting

3. **3D Visualization**
   - Building heights
   - Tree canopy in 3D
   - Shadow analysis

4. **Time-series Analysis**
   - Historical AQI trends
   - Seasonal changes
   - Growth projections

5. **Mobile Optimization**
   - Touch gestures
   - Responsive drawers
   - Offline mode

### Technical Improvements

1. **Caching Strategy**
   - IndexedDB for GeoJSON
   - Service worker for offline
   - Redis for API responses

2. **WebSocket Integration**
   - Real-time AQI updates
   - Live collaboration
   - Instant notifications

3. **Advanced AI**
   - Multi-objective optimization
   - Cost-benefit analysis
   - Climate scenario modeling

---

## Troubleshooting

### Map Not Rendering

**Check**:
1. Container ref is attached
2. Container has explicit height
3. Leaflet CSS imported
4. Map invalidateSize() called

### Layers Not Showing

**Check**:
1. Layer group added to map
2. GeoJSON loaded successfully
3. Coordinates in correct format [lat, lng]
4. Layer toggle state is active

### Heat Map Not Visible

**Check**:
1. leaflet.heat plugin loaded
2. AQI data fetched successfully
3. Heat points in correct format [lat, lng, intensity]
4. Gradient colors defined

### AI Analysis Failing

**Check**:
1. Backend API running
2. GEMINI_API_KEY environment variable set
3. Request payload valid
4. CORS enabled
5. Network tab in browser DevTools

---

## Code Examples

### Adding a New Layer

```typescript
// 1. Add to layers data
const layersData: Layer[] = [
  // ... existing layers
  { 
    id: 'water', 
    name: 'Water Bodies', 
    icon: 'water', 
    active: false,
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-100'
  }
];

// 2. Initialize layer group
layerGroupsRef.current = {
  // ... existing
  water: L.layerGroup().addTo(map)
};

// 3. Load data
fetch('/data/water_bodies.geojson')
  .then(res => res.json())
  .then(data => {
    data.features.forEach(feature => {
      const coords = feature.geometry.coordinates[0].map(c => [c[1], c[0]]);
      L.polygon(coords, {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.4
      }).addTo(layerGroupsRef.current.water);
    });
  });
```

### Custom Marker Icon

```typescript
const customIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div class="flex items-center justify-center w-10 h-10 
                bg-purple-500 text-white rounded-full 
                border-2 border-white shadow-lg">
      <span class="material-symbols-outlined">park</span>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

L.marker([lat, lng], { icon: customIcon }).addTo(layerGroup);
```

### Interactive Popup

```typescript
const popupContent = `
  <div class="p-3">
    <h3 class="font-bold text-lg mb-2">${title}</h3>
    <p class="text-sm text-gray-600">${description}</p>
    <button class="mt-3 px-4 py-2 bg-primary text-white rounded-lg">
      View Details
    </button>
  </div>
`;

marker.bindPopup(popupContent, {
  maxWidth: 300,
  className: 'custom-popup'
});
```

---

## Conclusion

The **MapExplorer** component is a sophisticated urban planning tool that combines:
- Real-time environmental data
- AI-powered analysis
- Interactive visualizations
- Street-level transformations

It provides actionable insights for creating sustainable, livable cities through data-driven decision making.

---

## Additional Resources

- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [Leaflet.heat Plugin](https://github.com/Leaflet/Leaflet.heat)
- [GeoJSON Specification](https://geojson.org/)
- [Gemini AI API Docs](https://ai.google.dev/docs)
- [Delhi Open Data Portal](https://data.gov.in/)

---

**Last Updated**: February 1, 2026  
**Version**: 1.0.0  
**Maintainer**: Development Team
