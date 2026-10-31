import { getWeatherString, resolveLocations, type LocationResult } from '@/lib/weather'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const location = typeof body.location === 'string' ? body.location.trim() : ''
    if (!location || location.length > 120) {
      return NextResponse.json({ error: 'Enter a valid location name.' }, { status: 400 })
    }
    let selected: LocationResult | undefined = body.selected
    if (!selected) {
      const matches = await resolveLocations(location)
      if (!matches.length) return NextResponse.json({ error: 'We could not find that place. Try adding a state or country.' }, { status: 404 })
      if (matches.length > 1) return NextResponse.json({ matches }, { status: 300 })
      selected = matches[0]
    }
    const weather = await getWeatherString(selected)
    return NextResponse.json({ weather })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'WEATHER_PROVIDER_ERROR'
    const messages: Record<string, string> = {
      OPENWEATHER_API_KEY_MISSING: 'Weather service is not configured yet. Add OPENWEATHER_API_KEY to continue.',
      OPENWEATHER_API_KEY_INVALID: 'The weather service key is invalid or inactive.',
      RATE_LIMITED: 'Weather updates are temporarily limited. Please try again shortly.',
      LOCATION_NOT_FOUND: 'We could not find that place.',
      WEATHER_PROVIDER_ERROR: 'The weather service returned an unexpected response.',
    }
    return NextResponse.json({ error: messages[code] ?? 'Unable to fetch weather right now.' }, { status: 502 })
  }
}
