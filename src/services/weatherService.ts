export interface WeatherCity {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
}

export const POPULAR_GREEK_CITIES: WeatherCity[] = [
  { id: 'athens', name: 'Αθήνα', region: 'Αττική', lat: 37.9838, lon: 23.7275 },
  { id: 'arta', name: 'Άρτα', region: 'Ήπειρος', lat: 39.1606, lon: 20.9853 },
  { id: 'thessaloniki', name: 'Θεσσαλονίκη', region: 'Κεντρική Μακεδονία', lat: 40.6401, lon: 22.9444 },
  { id: 'ioannina', name: 'Ιωάννινα', region: 'Ήπειρος', lat: 39.6650, lon: 20.8537 },
  { id: 'patras', name: 'Πάτρα', region: 'Αχαΐα', lat: 38.2466, lon: 21.7346 },
  { id: 'heraklion', name: 'Ηράκλειο', region: 'Κρήτη', lat: 35.3387, lon: 25.1442 },
  { id: 'larissa', name: 'Λάρισα', region: 'Θεσσαλία', lat: 39.6390, lon: 22.4191 },
  { id: 'preveza', name: 'Πρέβεζα', region: 'Ήπειρος', lat: 38.9592, lon: 20.7516 },
  { id: 'chania', name: 'Χανιά', region: 'Κρήτη', lat: 35.5138, lon: 24.0180 },
  { id: 'volos', name: 'Βόλος', region: 'Μαγνησία', lat: 39.3621, lon: 22.9422 },
  { id: 'rhodes', name: 'Ρόδος', region: 'Δωδεκάνησα', lat: 36.4349, lon: 28.2176 },
  { id: 'kalamata', name: 'Καλαμάτα', region: 'Μεσσηνία', lat: 37.0389, lon: 22.1142 },
  { id: 'corfu', name: 'Κέρκυρα', region: 'Ιόνιο', lat: 39.6243, lon: 19.9217 },
  { id: 'kavala', name: 'Καβάλα', region: 'Ανατολική Μακεδονία', lat: 40.9396, lon: 24.4129 },
  { id: 'nafplio', name: 'Ναύπλιο', region: 'Αργολίδα', lat: 37.5673, lon: 22.8055 },
];

export interface LiveWeatherData {
  cityName: string;
  regionName: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  uvIndex: number;
  evapotranspiration: number; // mm/day
  windSpeed: number; // km/h
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
  isDay: boolean;
  lastUpdated: string;
  smartTip: string;
  isLive: boolean;
  minTempToday: number;
  heatAlert: boolean;
  frostAlert: boolean;
}

function getWeatherCondition(code: number, isDay: boolean): { desc: string; icon: string } {
  switch (code) {
    case 0:
      return { desc: isDay ? 'Αίθριος / Ηλιόλουστος' : 'Καθαρός Ουρανός', icon: isDay ? '☀️' : '🌙' };
    case 1:
      return { desc: 'Κυρίως Αίθριος', icon: isDay ? '🌤️' : '🌙' };
    case 2:
      return { desc: 'Μερική Συννεφιά', icon: '⛅' };
    case 3:
      return { desc: 'Συννεφιά', icon: '☁️' };
    case 45:
    case 48:
      return { desc: 'Ομίχλη / Υγρασία', icon: '🌫️' };
    case 51:
    case 53:
    case 55:
      return { desc: 'Ψιχάλες / Ασθενής Βροχή', icon: '🌦️' };
    case 61:
    case 63:
    case 65:
      return { desc: 'Βροχόπτωση', icon: '🌧️' };
    case 71:
    case 73:
    case 75:
      return { desc: 'Χιονόπτωση', icon: '🌨️' };
    case 80:
    case 81:
    case 82:
      return { desc: 'Όμβροι / Μπόρες', icon: '🌧️' };
    case 95:
    case 96:
    case 99:
      return { desc: 'Καταιγίδα / Αστραπές', icon: '⛈️' };
    default:
      return { desc: 'Ήπιες Συνθήκες', icon: '🌤️' };
  }
}

function generateSmartTip(temp: number, humidity: number, uv: number, et: number, wind: number, rainCode: number): string {
  if (rainCode >= 51 && rainCode <= 99) {
    return '🌧️ Βροχόπτωση σε εξέλιξη: Αναστείλετε το αυτόματο πότισμα και ελέγξτε την αποστράγγιση στα πιατάκια για να μην σαπίσουν οι ρίζες.';
  }
  if (temp >= 33 || et >= 6.5) {
    return `🔥 Υψηλή εξάτμιση (${et}mm) & ζέστη (${temp}°C): Ποτίστε αποκλειστικά νωρίς το πρωί (06:00 - 07:30) στη ρίζα. Αποφύγετε μεσημεριανή διαβροχή.`;
  }
  if (wind >= 28) {
    return `💨 Ισχυρός άνεμος (${wind} km/h): Αυξημένη αφυδάτωση φύλλων στο μπαλκόνι. Ελέγξτε τη στήριξη ψηλών φυτών και συμπληρώστε υγρασία.`;
  }
  if (uv >= 8) {
    return `☀️ Πολύ υψηλός δείκτης UV (${uv}): Προστατέψτε ευαίσθητα σπορόφυτα, μπονσάι και καλλωπιστικά με ελαφρύ δίχτυ σκίασης 30-40%.`;
  }
  if (humidity <= 35 && temp >= 28) {
    return `🌵 Ξηρή ατμόσφαιρα (υγρασία ${humidity}%): Αυξήστε τον έλεγχο στις μικρές πήλινες γλάστρες που στεγνώνουν ραγδαία.`;
  }
  if (temp < 10) {
    return `❄️ Χαμηλή θερμοκρασία (${temp}°C): Ελαχιστοποιήστε το πότισμα, προστατέψτε τα παχύφυτα και μεταφέρετε τα ευαίσθητα εσωτερικά.`;
  }
  return `🌿 Ιδανικές συνθήκες ανάπτυξης: Κανονικό πότισμα ανάλογα με τον τύπο της γλάστρας. Εξαιρετική περίοδος για οργανική διαφυλλική θρέψη.`;
}

export async function fetchLiveWeatherData(
  cityOrCoords: WeatherCity | { name: string; region: string; lat: number; lon: number }
): Promise<LiveWeatherData> {
  const { lat, lon, name, region } = cityOrCoords;
  const nowTime = new Date().toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=uv_index_max,et0_fao_evapotranspiration,temperature_2m_min&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather API returned ${res.status}`);
    const data = await res.json();

    const current = data.current || {};
    const daily = data.daily || {};

    const temp = Math.round((current.temperature_2m ?? 26) * 10) / 10;
    const feelsLike = Math.round((current.apparent_temperature ?? temp) * 10) / 10;
    const humidity = Math.round(current.relative_humidity_2m ?? 50);
    const windSpeed = Math.round(current.wind_speed_10m ?? 12);
    const weatherCode = current.weather_code ?? 0;
    const isDay = current.is_day === 1;

    const uvIndex = daily.uv_index_max?.[0] !== undefined ? Math.round(daily.uv_index_max[0] * 10) / 10 : 6.5;
    const evapotranspiration = daily.et0_fao_evapotranspiration?.[0] !== undefined
      ? Math.round(daily.et0_fao_evapotranspiration[0] * 10) / 10
      : Math.round((temp * 0.18 + 1.2) * 10) / 10;

    const minTempToday = daily.temperature_2m_min?.[0] !== undefined
      ? Math.round(daily.temperature_2m_min[0] * 10) / 10
      : temp - 8;

    const cond = getWeatherCondition(weatherCode, isDay);
    const smartTip = generateSmartTip(temp, humidity, uvIndex, evapotranspiration, windSpeed, weatherCode);

    return {
      cityName: name,
      regionName: region,
      temperature: temp,
      feelsLike,
      humidity,
      uvIndex,
      evapotranspiration,
      windSpeed,
      weatherCode,
      weatherDescription: cond.desc,
      weatherIcon: cond.icon,
      isDay,
      lastUpdated: nowTime,
      smartTip,
      isLive: true,
      minTempToday,
      heatAlert: temp >= 33 || evapotranspiration >= 6.5,
      frostAlert: minTempToday <= 3,
    };
  } catch (error) {
    console.warn('Live weather fetch failed, using realistic fallback:', error);
    // Calculated realistic fallback based on month and time
    const month = new Date().getMonth(); // 0-11
    const baseTemp = [12, 13, 16, 20, 25, 30, 33, 33, 28, 23, 17, 13][month] || 25;
    const baseMinTemp = baseTemp - 8;
    const tip = generateSmartTip(baseTemp, 48, 7.2, 5.8, 14, 0);

    return {
      cityName: name,
      regionName: region,
      temperature: baseTemp,
      feelsLike: baseTemp + 1,
      humidity: 48,
      uvIndex: 7.2,
      evapotranspiration: 5.8,
      windSpeed: 14,
      weatherCode: 0,
      weatherDescription: 'Αίθριος / Ηλιόλουστος',
      weatherIcon: '☀️',
      isDay: true,
      lastUpdated: nowTime,
      smartTip: tip,
      isLive: false,
      minTempToday: baseMinTemp,
      heatAlert: baseTemp >= 33,
      frostAlert: baseMinTemp <= 3,
    };
  }
}
