import { getWeatherString, resolveLocations, validateOpenWeatherKey, type LocationResult } from '@/lib/weather'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const mode = body.mode === 'personal' ? 'personal' : 'default'
    const personalKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : ''
    if (mode === 'personal' && (!personalKey || personalKey.length > 256)) return NextResponse.json({ error: 'Enter a valid OpenWeather API key.' }, { status: 400 })
    const apiKey = mode === 'personal' ? personalKey : process.env.OPENWEATHER_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'The default weather service is not configured. Add your own OpenWeather API key in Settings.' }, { status: 503 })
    if (body.validateOnly === true) {
      await validateOpenWeatherKey(apiKey)
      return NextResponse.json({ valid: true })
    }
    const location = typeof body.location === 'string' ? body.location.trim() : ''
    if (!location || location.length > 120) return NextResponse.json({ error: 'Enter a valid location name.' }, { status: 400 })
    let selected: LocationResult | undefined = body.selected
    if (!selected) {
      const matches = await resolveLocations(location, apiKey)
      if (!matches.length) return NextResponse.json({ error: 'We could not find that place. Try adding a state or country.' }, { status: 404 })
      if (matches.length > 1) return NextResponse.json({ matches }, { status: 300 })
      selected = matches[0]
    }
    return NextResponse.json({ weather: await getWeatherString(selected, apiKey) })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'WEATHER_PROVIDER_ERROR'
    const messages: Record<string, string> = { OPENWEATHER_API_KEY_MISSING: 'The default weather service is not configured. Add your own key in Settings.', OPENWEATHER_API_KEY_INVALID: 'This OpenWeather API key is invalid or inactive. Newly created keys can take up to two hours to activate.', RATE_LIMITED: 'Weather updates are temporarily limited. Please try again shortly.', LOCATION_NOT_FOUND: 'We could not find that place.', WEATHER_PROVIDER_FORBIDDEN: 'This OpenWeather key does not have access to the requested service.', WEATHER_PROVIDER_TIMEOUT: 'OpenWeather took too long to respond. Please try again.', WEATHER_PROVIDER_ERROR: 'The weather service returned an unexpected response.' }
    return NextResponse.json({ error: messages[code] ?? 'Unable to connect to the weather service right now.' }, { status: code === 'OPENWEATHER_API_KEY_INVALID' ? 401 : 502 })
  }
}
