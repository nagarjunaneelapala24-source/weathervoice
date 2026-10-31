# WeatherVoice

A location-based weather announcement system for an NLP course project. It resolves a location with OpenWeather Geocoding, retrieves live current weather, turns the response into one natural-language announcement, and reads it aloud with the browser Web Speech API.

## Setup

1. Create an OpenWeather account and generate an API key.
2. Copy `.env.example` to `.env.local` and set `OPENWEATHER_API_KEY`.
3. Install dependencies with `pnpm install` and start with `pnpm dev`.

The key is only used by the server route at `/api/weather`; it is never sent to the browser.

## Deploy to Vercel

Import the project into Vercel, add `OPENWEATHER_API_KEY` under Project Settings → Environment Variables, and deploy. Speech synthesis runs in each visitor's browser, so browser support and voice availability may vary.
