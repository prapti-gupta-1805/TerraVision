import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, LineChart, Line, YAxis, CartesianGrid, Legend } from 'recharts';
import { fetchDelhiAQIStations } from '../services/xmlAqiService';

// Baseline data from 2024
const BASELINE_YEAR = 2024;
const BASELINE_TEMP = 28.5; // Average temperature in °C for Delhi
const BASELINE_AQI = 180; // Average AQI for Delhi
const BASELINE_CO2 = 15000; // CO2 emissions in tons per year
const BASELINE_GREEN_COVERAGE = 22; // Green coverage % in Delhi
const BASELINE_SOLAR_CAPACITY = 150; // Solar capacity in GWh
const BASELINE_EV_ADOPTION = 8; // EV adoption % in Delhi

const INITIAL_DATA = [
  { name: 'JAN', uv: 24.5 },
  { name: 'FEB', uv: 23.2 },
  { name: 'MAR', uv: 21.8 },
  { name: 'APR', uv: 20.4 },
  { name: 'MAY', uv: 19.1 },
  { name: 'JUN', uv: 17.5 },
  { name: 'JUL', uv: 15.2 },
];

const Dashboard: React.FC = () => {
  const [monthlyData, setMonthlyData] = useState(INITIAL_DATA);
  const [yearlyData, setYearlyData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('month');
  
  const data = timeRange === 'month' ? monthlyData : yearlyData;
  
  // Control parameters
  const selectedYear = 2026; // Fixed to current year
  const [greenDensity, setGreenDensity] = useState(35); // %
  const [solarPanelAdoption, setSolarPanelAdoption] = useState(25); // %
  const [evAdoption, setEvAdoption] = useState(15); // %
  
  // Calculated metrics
  const [currentAQI, setCurrentAQI] = useState(BASELINE_AQI);
  const [tempReduction, setTempReduction] = useState(0);
  const [co2Reduction, setCo2Reduction] = useState(0);
  const [treeCount, setTreeCount] = useState(12450);
  const [solarCapacity, setSolarCapacity] = useState(450);
  const [evImpact, setEvImpact] = useState(8500);
  const [realTimeAQI, setRealTimeAQI] = useState<number | null>(null);

  // Fetch real-time AQI data
  useEffect(() => {
    const loadAQIData = async () => {
      const stations = await fetchDelhiAQIStations();
      if (stations.length > 0) {
        const avgAQI = Math.round(
          stations.reduce((sum, station) => sum + station.aqi, 0) / stations.length
        );
        setRealTimeAQI(avgAQI);
      }
    };
    loadAQIData();
  }, []);

  // Calculate impact based on parameters
  useEffect(() => {
    const yearsSince2024 = selectedYear - BASELINE_YEAR;
    
    // Temperature reduction formula
    // Each 1% green density increase reduces temp by 0.08°C
    // Each 1% solar panel reduces urban heat by 0.03°C
    const greenTempImpact = (greenDensity - BASELINE_GREEN_COVERAGE) * 0.08;
    const solarTempImpact = (solarPanelAdoption - (BASELINE_SOLAR_CAPACITY / 10)) * 0.03;
    const calculatedTempReduction = greenTempImpact + solarTempImpact;
    setTempReduction(parseFloat(calculatedTempReduction.toFixed(2)));
    
    // AQI reduction formula
    // Each 1% green density reduces AQI by 3 points
    // Each 1% EV adoption reduces AQI by 2.5 points
    const greenAQIImpact = (greenDensity - BASELINE_GREEN_COVERAGE) * 3;
    const evAQIImpact = (evAdoption - BASELINE_EV_ADOPTION) * 2.5;
    const baseAQI = realTimeAQI || BASELINE_AQI;
    const newAQI = Math.max(10, baseAQI - greenAQIImpact - evAQIImpact);
    setCurrentAQI(Math.round(newAQI));
    
    // CO2 reduction (tons/year)
    // Each 1% green density absorbs 50 tons CO2/year
    // Each 1% solar reduces emissions by 80 tons/year
    // Each 1% EV adoption reduces by 100 tons/year
    const greenCO2 = (greenDensity - BASELINE_GREEN_COVERAGE) * 50;
    const solarCO2 = (solarPanelAdoption - (BASELINE_SOLAR_CAPACITY / 10)) * 80;
    const evCO2 = (evAdoption - BASELINE_EV_ADOPTION) * 100;
    setCo2Reduction(Math.round(greenCO2 + solarCO2 + evCO2));
    
    // Tree count (estimated from green density)
    // Each 1% green density = ~500 trees
    const estimatedTrees = Math.round(greenDensity * 500);
    setTreeCount(estimatedTrees);
    
    // Solar capacity (GWh annually)
    const estimatedSolar = Math.round(solarPanelAdoption * 20);
    setSolarCapacity(estimatedSolar);
    
    // EV daily impact (rides/day)
    const estimatedEVRides = Math.round(evAdoption * 600);
    setEvImpact(estimatedEVRides);
    
    // Update temperature chart based on year and parameters
    const monthlyChartData = [
      { name: 'JAN', uv: BASELINE_TEMP - calculatedTempReduction + (yearsSince2024 * 0.2) - 3.5 },
      { name: 'FEB', uv: BASELINE_TEMP - calculatedTempReduction + (yearsSince2024 * 0.2) - 2.8 },
      { name: 'MAR', uv: BASELINE_TEMP - calculatedTempReduction + (yearsSince2024 * 0.2) - 1.5 },
      { name: 'APR', uv: BASELINE_TEMP - calculatedTempReduction + (yearsSince2024 * 0.2) },
      { name: 'MAY', uv: BASELINE_TEMP - calculatedTempReduction + (yearsSince2024 * 0.2) + 1.8 },
      { name: 'JUN', uv: BASELINE_TEMP - calculatedTempReduction + (yearsSince2024 * 0.2) + 3.2 },
      { name: 'JUL', uv: BASELINE_TEMP - calculatedTempReduction + (yearsSince2024 * 0.2) + 4.5 },
      { name: 'AUG', uv: BASELINE_TEMP - calculatedTempReduction + (yearsSince2024 * 0.2) + 4.2 },
      { name: 'SEP', uv: BASELINE_TEMP - calculatedTempReduction + (yearsSince2024 * 0.2) + 2.8 },
      { name: 'OCT', uv: BASELINE_TEMP - calculatedTempReduction + (yearsSince2024 * 0.2) + 0.5 },
      { name: 'NOV', uv: BASELINE_TEMP - calculatedTempReduction + (yearsSince2024 * 0.2) - 1.2 },
      { name: 'DEC', uv: BASELINE_TEMP - calculatedTempReduction + (yearsSince2024 * 0.2) - 2.8 },
    ];
    setMonthlyData(monthlyChartData);
    
    // Generate yearly data (2020-2026)
    const yearlyChartData = [
      { name: '2020', uv: BASELINE_TEMP + 1.2 },
      { name: '2021', uv: BASELINE_TEMP + 0.9 },
      { name: '2022', uv: BASELINE_TEMP + 0.6 },
      { name: '2023', uv: BASELINE_TEMP + 0.3 },
      { name: '2024', uv: BASELINE_TEMP },
      { name: '2025', uv: BASELINE_TEMP - calculatedTempReduction * 0.5 + 0.2 },
      { name: '2026', uv: BASELINE_TEMP - calculatedTempReduction + 0.4 },
    ];
    setYearlyData(yearlyChartData);
  }, [selectedYear, greenDensity, solarPanelAdoption, evAdoption, realTimeAQI]);

  const handleAction = (action: string) => {
    alert(`Initiating simulation: ${action}`);
  };

  const handleExportReport = () => {
    const reportData = {
      location: 'Delhi NCR',
      date: new Date().toLocaleDateString(),
      year: selectedYear,
      parameters: {
        greenDensity: `${greenDensity}%`,
        solarPanelAdoption: `${solarPanelAdoption}%`,
        evAdoption: `${evAdoption}%`,
      },
      metrics: {
        temperatureReduction: `${tempReduction.toFixed(1)}°C`,
        projectedAQI: currentAQI,
        co2Offset: `${co2Reduction.toLocaleString()} tons`,
        treeCount: treeCount.toLocaleString(),
        solarCapacity: `${solarCapacity} GWh`,
        evDailyImpact: `${evImpact.toLocaleString()} rides`,
      },
      realTimeAQI: realTimeAQI || 'N/A',
    };

    const reportText = `DELHI ENVIRONMENTAL IMPACT REPORT\n` +
      `Generated: ${reportData.date}\n` +
      `Projection Year: ${reportData.year}\n\n` +
      `PARAMETERS:\n` +
      `- Green Coverage Density: ${reportData.parameters.greenDensity}\n` +
      `- Solar Panel Adoption: ${reportData.parameters.solarPanelAdoption}\n` +
      `- EV Adoption Rate: ${reportData.parameters.evAdoption}\n\n` +
      `ENVIRONMENTAL IMPACT:\n` +
      `- Temperature Reduction: ${reportData.metrics.temperatureReduction}\n` +
      `- Projected AQI: ${reportData.metrics.projectedAQI}\n` +
      `- CO₂ Offset: ${reportData.metrics.co2Offset}\n` +
      `- Trees Planted: ${reportData.metrics.treeCount}\n` +
      `- Solar Capacity: ${reportData.metrics.solarCapacity}\n` +
      `- Daily EV Impact: ${reportData.metrics.evDailyImpact}\n\n` +
      `REAL-TIME DATA:\n` +
      `- Current AQI: ${reportData.realTimeAQI}\n`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Delhi_Environmental_Report_${selectedYear}_${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background-light dark:bg-background-dark font-display text-text-main">
      <Navbar />
      <main className="flex-1 px-6 py-8 md:px-12 lg:px-24 max-w-[1600px] mx-auto w-full">
         
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="flex flex-col gap-2">
               <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                  <span className="material-symbols-outlined text-lg">location_on</span> Delhi NCR
               </div>
               <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-text-main">Delhi Environmental Impact Dashboard</h1>
               <p className="text-text-muted max-w-2xl font-body">Real-time visualization of Delhi's urban sustainability initiatives and environmental impact projections using live AQI data from monitoring stations across the capital.</p>
            </div>
            <div className="flex gap-3">
               <button 
                  onClick={() => setTimeRange(timeRange === 'month' ? 'year' : 'month')}
                  className="flex items-center gap-2 px-5 h-11 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-[#2a4d31] font-bold text-sm text-text-main hover:bg-gray-50 dark:hover:bg-surface-dark/80 transition-colors shadow-sm"
               >
                  <span className="material-symbols-outlined text-gray-500 dark:text-text-muted">calendar_month</span> {timeRange === 'month' ? 'This Month' : 'This Year'}
               </button>
               <button 
                 onClick={handleExportReport}
                 className="flex items-center gap-2 px-5 h-11 rounded-xl bg-primary hover:bg-green-600 text-[#0d1b10] font-bold text-sm transition-colors shadow-lg shadow-primary/30"
               >
                  <span className="material-symbols-outlined">download</span> Export Report
               </button>
            </div>
         </div>

         {/* MAIN GRID: Controls on Left, Visualizations on Right */}
         <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
            
            {/* LEFT SIDE: CONTROL PANEL */}
            <div className="xl:col-span-4 space-y-6">
               <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 border-2 border-primary/30 p-6 shadow-lg sticky top-6">
                  <div className="flex items-center gap-3 mb-6">
                     <span className="material-symbols-outlined text-primary text-3xl">tune</span>
                     <div>
                        <h2 className="text-xl font-bold text-text-main">Impact Controls</h2>
                        <p className="text-xs text-text-muted">Adjust in real-time</p>
                     </div>
                  </div>

                  <div className="space-y-5">
                     {/* Green Density Slider */}
                     <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-200 dark:border-[#2a4d31]">
                        <div className="flex justify-between items-center mb-3">
                           <label className="text-xs font-bold text-text-main flex items-center gap-2">
                              <span className="material-symbols-outlined text-green-600 text-lg">forest</span>
                              Green Density
                           </label>
                           <span className="text-xl font-black text-green-600">{greenDensity}%</span>
                        </div>
                        <input
                           type="range"
                           min="15"
                           max="60"
                           value={greenDensity}
                           onChange={(e) => setGreenDensity(parseInt(e.target.value))}
                           className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 dark:text-text-muted mt-2">
                           <span>15%</span>
                           <span>60%</span>
                        </div>
                     </div>

                     {/* Solar Panel Adoption Slider */}
                     <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-200 dark:border-[#2a4d31]">
                        <div className="flex justify-between items-center mb-3">
                           <label className="text-xs font-bold text-text-main flex items-center gap-2">
                              <span className="material-symbols-outlined text-yellow-600 text-lg">solar_power</span>
                              Solar Panels
                           </label>
                           <span className="text-xl font-black text-yellow-600">{solarPanelAdoption}%</span>
                        </div>
                        <input
                           type="range"
                           min="5"
                           max="50"
                           value={solarPanelAdoption}
                           onChange={(e) => setSolarPanelAdoption(parseInt(e.target.value))}
                           className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-600"
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 dark:text-text-muted mt-2">
                           <span>5%</span>
                           <span>50%</span>
                        </div>
                     </div>

                     {/* EV Adoption Slider */}
                     <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-200 dark:border-[#2a4d31]">
                        <div className="flex justify-between items-center mb-3">
                           <label className="text-xs font-bold text-text-main flex items-center gap-2">
                              <span className="material-symbols-outlined text-blue-600 text-lg">electric_car</span>
                              EV Adoption
                           </label>
                           <span className="text-xl font-black text-blue-600">{evAdoption}%</span>
                        </div>
                        <input
                           type="range"
                           min="5"
                           max="40"
                           value={evAdoption}
                           onChange={(e) => setEvAdoption(parseInt(e.target.value))}
                           className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 dark:text-text-muted mt-2">
                           <span>5%</span>
                           <span>40%</span>
                        </div>
                     </div>
                  </div>

                  {/* Impact Summary */}
                  <div className="mt-6 bg-white dark:bg-surface-dark p-4 rounded-xl border-2 border-primary/20">
                     <h3 className="text-xs font-bold text-text-main mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">analytics</span>
                        Impact for {selectedYear}
                     </h3>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                           <p className="text-xl font-black text-red-600">{tempReduction.toFixed(1)}°C</p>
                           <p className="text-[10px] text-gray-500 dark:text-text-muted">Temp ↓</p>
                        </div>
                        <div className="text-center bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                           <p className="text-xl font-black text-green-600">{currentAQI}</p>
                           <p className="text-[10px] text-gray-500 dark:text-text-muted">AQI</p>
                        </div>
                        <div className="text-center bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                           <p className="text-xl font-black text-blue-600">{co2Reduction.toLocaleString()}</p>
                           <p className="text-[10px] text-gray-500 dark:text-text-muted">CO₂ (tons)</p>
                        </div>
                        <div className="text-center bg-primary/10 p-3 rounded-lg">
                           <p className="text-xl font-black text-primary">{((greenDensity / BASELINE_GREEN_COVERAGE - 1) * 100).toFixed(0)}%</p>
                           <p className="text-[10px] text-gray-500 dark:text-text-muted">Growth</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* RIGHT SIDE: VISUALIZATIONS */}
            <div className="xl:col-span-8 space-y-6">
               
               {/* Stats Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <DashboardStat title="Total New Trees" value={treeCount.toLocaleString()} change={`+${Math.round((treeCount / 12450 - 1) * 100)}%`} icon="forest" progress={Math.min(100, (treeCount / 20000) * 100)} sub="Target: 30,000 by 2030" />
                  <DashboardStat title="Daily EV Impact" value={evImpact.toLocaleString()} change={`+${Math.round((evImpact / 8500 - 1) * 100)}%`} icon="electric_car" progress={Math.min(100, (evAdoption / 40) * 100)} sub="Rides per day" />
                  <DashboardStat title="Solar Capacity" value={solarCapacity} change={`+${Math.round((solarCapacity / 450 - 1) * 100)}%`} icon="solar_power" progress={Math.min(100, (solarPanelAdoption / 50) * 100)} sub="GWh Annually" />
                  <DashboardStat 
                     title="Air Quality Index" 
                     value={currentAQI} 
                     change={currentAQI <= 50 ? 'Good' : currentAQI <= 100 ? 'Moderate' : currentAQI <= 200 ? 'Poor' : 'Severe'} 
                     isStatus 
                     icon="air" 
                     progress={Math.max(0, 100 - (currentAQI / 3))} 
                     sub={realTimeAQI ? `Real-time: ${realTimeAQI}` : 'PM2.5 Levels (µg/m³)'} 
                  />
               </div>

               {/* Charts Row */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Temperature Chart */}
                  <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-surface-dark p-6 border border-gray-100 dark:border-[#2a4d31] shadow-sm">
                     <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                        <div>
                           <h3 className="text-lg font-bold mb-1 text-text-main">Urban Heat Island Mitigation</h3>
                           <p className="text-xs text-gray-500 dark:text-text-muted">{timeRange === 'month' ? 'Monthly' : 'Yearly'} temperature vs {BASELINE_YEAR} baseline ({BASELINE_TEMP}°C avg)</p>
                        </div>
                        <div className="text-right">
                           <p className="text-3xl font-bold tracking-tight text-text-main">{tempReduction > 0 ? '-' : '+'}{Math.abs(tempReduction)}°C</p>
                           <p className="text-xs font-medium text-primary">Projected for {selectedYear}</p>
                        </div>
                     </div>
                     
                     <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data}>
                            <defs>
                              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#11d432" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#11d432" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#7ec583', fontSize: 11}} dy={10}/>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                            <Area type="monotone" dataKey="uv" stroke="#11d432" strokeWidth={3} fillOpacity={1} fill="url(#colorUv)" />
                          </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  {/* Green Cover Chart */}
                  <div className="rounded-2xl bg-white dark:bg-surface-dark p-6 border border-gray-100 dark:border-[#2a4d31] shadow-sm">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-text-main">Green Cover Distribution</h3>
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">{greenDensity}%</span>
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="relative size-32 shrink-0 rounded-full" style={{ 
                           background: `conic-gradient(#11d432 0% ${greenDensity * 0.6}%, #0d9624 ${greenDensity * 0.6}% ${greenDensity * 1.2}%, #a6eeb1 ${greenDensity * 1.2}% 100%)` 
                        }}>
                           <div className="absolute inset-4 rounded-full bg-white dark:bg-surface-dark flex items-center justify-center flex-col">
                              <span className="text-2xl font-bold text-text-main">{greenDensity}%</span>
                              <span className="text-[10px] uppercase text-gray-400 dark:text-text-muted font-bold tracking-wider">Coverage</span>
                           </div>
                        </div>
                        <div className="flex flex-col gap-3 flex-1">
                           <LegendItem color="bg-primary" label="Parks" value={`${Math.round(greenDensity * 0.45)}%`} />
                           <LegendItem color="bg-[#0d9624]" label="Vertical" value={`${Math.round(greenDensity * 0.30)}%`} />
                           <LegendItem color="bg-[#a6eeb1]" label="Rooftops" value={`${Math.round(greenDensity * 0.25)}%`} />
                        </div>
                     </div>
                  </div>

                  {/* CO2 Chart */}
                  <div className="rounded-2xl bg-white dark:bg-surface-dark p-6 border border-gray-100 dark:border-[#2a4d31] shadow-sm">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-text-main">CO₂ Offset Sources</h3>
                        <div className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                           <span className="material-symbols-outlined text-sm">arrow_upward</span> {Math.round((co2Reduction / 1000) * 10)}%
                        </div>
                     </div>
                     <div className="flex items-end justify-between gap-2 h-32 w-full mt-auto">
                        <Bar height={`${Math.min(100, solarPanelAdoption * 2)}%`} label="Solar" />
                        <Bar height={`${Math.min(100, greenDensity * 1.5)}%`} label="Trees" />
                        <Bar height={`${Math.min(100, evAdoption * 2.5)}%`} label="EVs" />
                        <Bar height={`${Math.min(100, (solarPanelAdoption + evAdoption) / 2)}%`} label="Other" />
                     </div>
                  </div>

               </div>
            </div>
         </div>

         {/* Actions */}
         <div className="rounded-2xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-[#2a4d31] p-6 shadow-sm">
            <h3 className="font-bold text-lg text-text-main mb-4">Simulation & Planning Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <ActionCard icon="add_location_alt" color="green" title="New Green Zone" sub="Designate park area" onClick={() => handleAction('New Green Zone')} />
               <ActionCard icon="water_drop" color="blue" title="Simulate Flood" sub="Test drainage capacity" onClick={() => handleAction('Flood Simulation')} />
               <ActionCard icon="wb_sunny" color="amber" title="Solar Heatmap" sub="Analyze roof potential" onClick={() => handleAction('Solar Heatmap')} />
               <ActionCard icon="hub" color="purple" title="Deploy EV Hub" sub="Charging infrastructure" onClick={() => handleAction('Deploy EV Hub')} />
            </div>
         </div>
      </main>
    </div>
  );
};

const DashboardStat = ({ title, value, change, icon, progress, sub, isStatus }: any) => (
   <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-surface-dark p-6 shadow-sm border border-gray-100 dark:border-[#2a4d31] transition-all hover:shadow-md cursor-default">
      <div className="absolute right-0 top-0 p-4 opacity-10 dark:opacity-20 group-hover:opacity-20 dark:group-hover:opacity-30 transition-opacity pointer-events-none">
         <span className="material-symbols-outlined text-8xl text-primary">{icon}</span>
      </div>
      <div className="flex flex-col gap-1 relative z-10">
         <span className="text-sm font-medium text-gray-500 dark:text-text-muted">{title}</span>
         <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-text-main">{value}</span>
            <span className="text-xs font-bold text-primary flex items-center bg-primary/10 px-1.5 py-0.5 rounded-md">
                {change} {!isStatus && <span className="material-symbols-outlined text-xs">trending_up</span>} {isStatus && <span className="material-symbols-outlined text-xs">check_circle</span>}
            </span>
         </div>
         <span className="text-xs text-gray-400 dark:text-text-muted mt-2">{sub}</span>
      </div>
      <div className="mt-4 h-1 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
         <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
      </div>
   </div>
);

const LegendItem = ({ color, label, value }: any) => (
   <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
         <div className={`size-2.5 rounded-full ${color}`}></div>
         <span className="text-gray-600 dark:text-text-muted">{label}</span>
      </div>
      <span className="font-bold text-text-main">{value}</span>
   </div>
);

const Bar = ({ height, label }: any) => (
   <div className="flex flex-col items-center gap-2 flex-1 group cursor-pointer">
      <div className="w-full bg-primary/20 dark:bg-primary/30 rounded-t-lg relative h-full group-hover:bg-primary/30 dark:group-hover:bg-primary/40 transition-colors overflow-hidden">
         <div className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all duration-500" style={{ height }}></div>
      </div>
      <span className="text-xs font-bold text-gray-400 dark:text-text-muted">{label}</span>
   </div>
);

const ActionCard = ({ icon, color, title, sub, onClick }: any) => {
    const colorClasses: any = {
        green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 group-hover:bg-primary dark:group-hover:bg-primary group-hover:text-white',
        blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white',
        amber: 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white',
        purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500 group-hover:text-white',
    };
    const textColors: any = {
        green: 'group-hover:text-primary',
        blue: 'group-hover:text-blue-500',
        amber: 'group-hover:text-amber-500',
        purple: 'group-hover:text-purple-500',
    }

    return (
        <button onClick={onClick} className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-gray-300 dark:border-[#2a4d31] hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group text-left">
           <div className={`size-10 rounded-lg flex items-center justify-center transition-colors ${colorClasses[color]}`}>
              <span className="material-symbols-outlined">{icon}</span>
           </div>
           <div>
              <p className={`font-bold text-sm transition-colors text-text-main ${textColors[color]}`}>{title}</p>
              <p className="text-xs text-gray-500 dark:text-text-muted">{sub}</p>
           </div>
        </button>
    )
}

export default Dashboard;