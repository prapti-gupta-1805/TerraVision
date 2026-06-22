export interface Station {
  id: string;
  latitude: number;
  longitude: number;
  aqi: number;
  level: string;
  color: string;
  primaryPollutant: string;
  lastupdate: string;
}

/**
 * Get AQI level name based on AQI value
 */
export const getAQILevel = (aqi: number): string => {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderately Polluted';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
};

/**
 * Get color for AQI level
 */
export const getAQIColor = (aqi: number): string => {
  if (aqi <= 50) return '#22c55e'; // Green
  if (aqi <= 100) return '#eab308'; // Yellow
  if (aqi <= 200) return '#f97316'; // Orange
  if (aqi <= 300) return '#ef4444'; // Red
  if (aqi <= 400) return '#991b1b'; // Dark Red
  return '#7c1d1d'; // Very Dark Red
};

/**
 * Fetch and parse Delhi AQI stations from XML file
 */
export const fetchDelhiAQIStations = async (): Promise<Station[]> => {
  try {
    console.log('📄 Fetching AQI XML data...');
    
    // Fetch the XML file
    const response = await fetch('/data/rss_feed.xml');
    if (!response.ok) {
      console.error('❌ Failed to fetch XML:', response.status);
      return [];
    }

    const xmlText = await response.text();
    console.log('✅ XML loaded, parsing...');

    // Parse XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Check for parsing errors
    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
      console.error('❌ XML parsing error');
      return [];
    }

    // Find Delhi state and city
    const states = xmlDoc.getElementsByTagName('State');
    let delhiStations: Station[] = [];

    for (let i = 0; i < states.length; i++) {
      const state = states[i];
      if (state.getAttribute('id') === 'Delhi') {
        console.log('🔍 Found Delhi state');

        // Get all cities in Delhi
        const cities = state.getElementsByTagName('City');
        for (let j = 0; j < cities.length; j++) {
          const city = cities[j];
          console.log(`📍 Processing city: ${city.getAttribute('id')}`);

          // Get all stations in this city
          const stationElements = city.getElementsByTagName('Station');
          for (let k = 0; k < stationElements.length; k++) {
            const stationElem = stationElements[k];
            
            try {
              const stationId = stationElem.getAttribute('id') || 'Unknown';
              const latitude = parseFloat(stationElem.getAttribute('latitude') || '0');
              const longitude = parseFloat(stationElem.getAttribute('longitude') || '0');
              const lastupdate = stationElem.getAttribute('lastupdate') || '';

              // Get Air Quality Index value
              const aqiElements = stationElem.getElementsByTagName('Air_Quality_Index');
              if (aqiElements.length > 0) {
                const aqiValue = parseInt(aqiElements[0].getAttribute('Value') || '0');
                const primaryPollutant = aqiElements[0].getAttribute('Predominant_Parameter') || 'PM2.5';

                delhiStations.push({
                  id: stationId,
                  latitude,
                  longitude,
                  aqi: aqiValue,
                  level: getAQILevel(aqiValue),
                  color: getAQIColor(aqiValue),
                  primaryPollutant,
                  lastupdate,
                });

                console.log(`✅ Station: ${stationId}, AQI: ${aqiValue}`);
              }
            } catch (error) {
              console.error('Error parsing station:', error);
            }
          }
        }
      }
    }

    console.log(`📊 Total Delhi stations found: ${delhiStations.length}`);
    return delhiStations;
  } catch (error) {
    console.error('❌ Error fetching Delhi AQI stations:', error);
    return [];
  }
};
