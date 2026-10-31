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
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}&appid=${encodeURIComponent(apiKey)}`, { signal: AbortSignal.timeout(8000), cache: 'no-store' })
  } catch {
    throw new Error('WEATHER_PROVIDER_TIMEOUT')
  }
  if (!response.ok) {
    if (response.status === 401) throw new Error('OPENWEATHER_API_KEY_INVALID')
    if (response.status === 403) throw new Error('WEATHER_PROVIDER_FORBIDDEN')
    if (response.status === 404) throw new Error('LOCATION_NOT_FOUND')
    if (response.status === 429) throw new Error('RATE_LIMITED')
    throw new Error('WEATHER_PROVIDER_ERROR')
  }
  return response.json()
}

export async function validateOpenWeatherKey(apiKey: string) {
  await fetchOpenWeather('/data/2.5/weather?q=London&units=metric', apiKey)
}

export async function resolveLocations(location: string, apiKey = process.env.OPENWEATHER_API_KEY) {
  if (!apiKey) throw new Error('OPENWEATHER_API_KEY_MISSING')
  const data = await fetchOpenWeather(`/geo/1.0/direct?q=${encodeURIComponent(location.trim())}&limit=5`, apiKey)
  return data.map((place: LocationResult) => ({ name: place.name, state: place.state, country: place.country, lat: place.lat, lon: place.lon })) as LocationResult[]
}

export async function getWeatherString(location: LocationResult, apiKey = process.env.OPENWEATHER_API_KEY): Promise<WeatherResult> {
  if (!apiKey) throw new Error('OPENWEATHER_API_KEY_MISSING')
  const data = await fetchOpenWeather(`/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&units=metric`, apiKey)
  const weather = data.weather?.[0]
  if (!weather || !data.main) throw new Error('WEATHER_PROVIDER_ERROR')
  const temperature = Math.round(data.main.temp)
  const feelsLike = Math.round(data.main.feels_like)
  const windSpeed = Number(data.wind?.speed ?? 0).toFixed(1)
  return { name: location.name, state: location.state, country: location.country, lat: location.lat, lon: location.lon, temperature, feelsLike, humidity: data.main.humidity, windSpeed, clouds: data.clouds?.all ?? 0, description: weather.description, icon: weather.icon, updatedAt: new Date().toISOString(), announcement: `The current weather in ${location.name}${location.state ? `, ${location.state}` : ''}, ${location.country} is ${weather.description}. The temperature is ${temperature} degrees Celsius, with humidity at ${data.main.humidity} percent. Wind speed is ${windSpeed} metres per second, and it feels like ${feelsLike} degrees Celsius.` }
}
