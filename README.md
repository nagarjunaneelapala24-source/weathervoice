# WeatherVoice

WeatherVoice resolves villages, towns, and cities with OpenWeather, presents current conditions, generates a natural-language announcement, and reads it aloud with the browser Web Speech API.

## Setup

1. Create an OpenWeather account and generate an API key.
2. Copy `.env.example` to `.env.local` and set the server-only `OPENWEATHER_API_KEY`.
3. Install dependencies with `pnpm install` and start with `pnpm dev`.

The Settings panel also supports a personal OpenWeather key. Personal keys are validated server-side, sent only with the weather request, kept in React memory for the current page session, and never stored in a database, localStorage, sessionStorage, URLs, responses, or logs. Refreshing the page removes the personal key.

## Deploy to Vercel

Import the project into Vercel, add `OPENWEATHER_API_KEY` under Project Settings → Environment Variables, and deploy. Users can optionally configure their own key from Settings. Speech synthesis runs in each visitor's browser, so browser support and voice availability may vary.
