export type LocationResult = {
  name: string
  state?: string
  country: string
  lat: number
  lon: number
}

export type WeatherResult = LocationResult & {
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: string
  clouds: number
  description: string
  icon: string
  updatedAt: string
  announcement: string
}

const API_BASE = 'https://api.openweathermap.org'

async function fetchOpenWeather(path: string, apiKey: string) {
  const response = await fetch(`${API_BASE}${path}&appid=${encodeURIComponent(apiKey)}`, {
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  })
  if (!response.ok) {
    if (response.status === 401) throw new Error('OPENWEATHER_API_KEY_INVALID')
    if (response.status === 404) throw new Error('LOCATION_NOT_FOUND')
    if (response.status === 429) throw new Error('RATE_LIMITED')
    throw new Error('WEATHER_PROVIDER_ERROR')
  }
  return response.json()
}

export async function resolveLocations(location: string): Promise<LocationResult[]> {
  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) throw new Error('OPENWEATHER_API_KEY_MISSING')
  const query = encodeURIComponent(location.trim())
  const data = await fetchOpenWeather(`/geo/1.0/direct?q=${query}&limit=5`, apiKey)
  return data.map((place: LocationResult) => ({
    name: place.name,
    state: place.state,
    country: place.country,
    lat: place.lat,
    lon: place.lon,
  }))
}

export async function getWeatherString(location: LocationResult): Promise<WeatherResult> {
  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) throw new Error('OPENWEATHER_API_KEY_MISSING')
  const data = await fetchOpenWeather(`/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&units=metric`, apiKey)
  const weather = data.weather?.[0]
  if (!weather || !data.main) throw new Error('WEATHER_PROVIDER_ERROR')
  const place = { name: location.name, state: location.state, country: location.country, lat: location.lat, lon: location.lon }
  const result = {
    ...place,
    temperature: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    windSpeed: Number(data.wind?.speed ?? 0).toFixed(1),
    clouds: data.clouds?.all ?? 0,
    description: weather.description,
    icon: weather.icon,
    updatedAt: new Date().toISOString(),
    announcement: `The current weather in ${location.name}${location.state ? `, ${location.state}` : ''}, ${location.country} is ${weather.description}. The temperature is ${Math.round(data.main.temp)} degrees Celsius, with humidity at ${data.main.humidity} percent. Wind speed is ${Number(data.wind?.speed ?? 0).toFixed(1)} metres per second, and it feels like ${Math.round(data.main.feels_like)} degrees Celsius.`,
  }
  return result
}
