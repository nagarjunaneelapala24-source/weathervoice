'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowDown, Check, ChevronDown, Cloud, CloudSun, Droplets, Menu, Mic2, Pause, Play, Search, Square, Wind, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LocationResult, WeatherResult } from '@/lib/weather'

function speakText(text: string, onStart: () => void, onEnd: () => void, onError: () => void) {
  if (!('speechSynthesis' in window)) return onError()
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.94
  utterance.pitch = 1
  utterance.onstart = onStart
  utterance.onend = onEnd
  utterance.onerror = onError
  window.speechSynthesis.speak(utterance)
}

const examples = ['Tadepalligudem, Andhra Pradesh', 'London, United Kingdom', 'Nairobi, Kenya']

export default function Page() {
  const [query, setQuery] = useState('')
  const [weather, setWeather] = useState<WeatherResult | null>(null)
  const [matches, setMatches] = useState<LocationResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [speech, setSpeech] = useState<'ready' | 'speaking' | 'paused' | 'completed' | 'unavailable'>('ready')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  async function search(selected?: LocationResult, locationOverride?: string) {
    const location = selected ? selected.name : (locationOverride ?? query).trim()
    if (!location) { setError('Please enter a village, town, or city.'); inputRef.current?.focus(); return }
    setLoading(true); setError(''); setMatches([]); window.speechSynthesis?.cancel(); setSpeech('ready')
    try {
      const response = await fetch('/api/weather', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: selected ? undefined : location, selected }) })
      const data = await response.json()
      if (response.status === 300) setMatches(data.matches)
      else if (!response.ok) setError(data.error ?? 'Unable to fetch weather.')
      else { setWeather(data.weather); setQuery(`${data.weather.name}${data.weather.state ? `, ${data.weather.state}` : ''}`) }
    } catch { setError('We could not connect to the weather service. Please try again.') }
    finally { setLoading(false) }
  }

  const play = () => {
    if (!weather) return
    if (speech === 'paused') { window.speechSynthesis.resume(); setSpeech('speaking'); return }
    speakText(weather.announcement, () => setSpeech('speaking'), () => setSpeech('completed'), () => setSpeech('unavailable'))
  }
  const statusText = { ready: 'Ready to speak', speaking: 'Speaking now', paused: 'Paused', completed: 'Speech completed', unavailable: 'Speech synthesis unavailable' }[speech]
  const icon = weather ? `https://openweathermap.org/img/wn/${weather.icon}@2x.png` : ''

  return <div className="min-h-screen overflow-hidden bg-[#f6f9fc] text-[#11253f]">
    <header className="relative z-20 border-b border-[#dce8f0] bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <a href="#top" className="flex items-center gap-3" aria-label="WeatherVoice home">
          <span className="grid size-10 place-items-center rounded-xl bg-[#102c4d] text-[#9ce9df]"><CloudSun className="size-6" /></span>
          <span className="text-xl font-bold tracking-tight text-[#102c4d]">Weather<span className="text-[#1a9d94]">Voice</span></span>
        </a>
        <nav className="hidden items-center gap-9 text-sm font-medium text-[#66809a] md:flex"><a href="#top" className="text-[#102c4d]">Home</a><a href="#how-it-works" className="hover:text-[#102c4d]">How It Works</a><a href="#about" className="hover:text-[#102c4d]">About Project</a></nav>
        <Button variant="outline" className="hidden rounded-full border-[#cfe0ea] bg-white text-[#173b5d] sm:flex" onClick={() => inputRef.current?.focus()}><Mic2 data-icon="inline-start" /> Try it now</Button>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation"><Menu /></Button>
      </div>
    </header>

    <main id="top">
      <section className="relative mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:px-10 lg:pb-24">
        <div className="pointer-events-none absolute -right-32 -top-20 size-[420px] rounded-full bg-[#d9f1ed] blur-3xl" />
        <div className="relative grid items-center gap-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-20">
          <div><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#cde9e3] bg-[#eaf8f5] px-3 py-1.5 text-xs font-semibold uppercase tracking-[.16em] text-[#1a8179]"><span className="size-1.5 rounded-full bg-[#36b8a2]" /> Live weather, spoken clearly</div>
            <h1 className="max-w-xl text-5xl font-semibold leading-[1.05] tracking-[-.055em] text-[#102c4d] sm:text-6xl">Weather around you,<br /><span className="text-[#1b9b91]">spoken clearly.</span></h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-[#68819a]">Explore real-time weather updates for your village, town, or city. Listen to the forecast in one simple, natural announcement.</p>
            <form className="mt-9 flex max-w-xl flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); search() }}><div className="flex flex-1 items-center gap-3 rounded-xl border border-[#cddde8] bg-white px-4 py-1 shadow-[0_8px_30px_rgba(22,57,88,.06)]"><Search className="size-5 text-[#7892a7]" /><input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#94aabc]" placeholder="Enter village, town or city name…" aria-label="Location" /></div><Button type="submit" disabled={loading} className="h-[58px] rounded-xl bg-[#113451] px-7 text-white hover:bg-[#1c496d]">{loading ? 'Searching…' : 'Search weather'} <ArrowDown className="rotate-[-45deg]" data-icon="inline-end" /></Button></form>
            {error && <p role="alert" className="mt-3 text-sm font-medium text-[#c65b5b]">{error}</p>}
            {matches.length > 0 && <div className="mt-3 max-w-xl overflow-hidden rounded-xl border border-[#d8e5ed] bg-white shadow-lg"><p className="border-b border-[#edf2f5] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#7d97aa]">Choose a location</p>{matches.map((place) => <button key={`${place.lat}-${place.lon}`} onClick={() => { setQuery(place.name); search(place) }} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-[#f1faf8]"><span className="font-medium">{place.name}</span><span className="text-[#7d97aa]">{place.state ? `${place.state}, ` : ''}{place.country}</span></button>)}</div>}
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-[#8298aa]"><span>Try an example:</span>{examples.map((example) => <button key={example} onClick={() => { setQuery(example); search(undefined, example) }} className="rounded-full border border-[#dbe7ee] bg-white px-3 py-1.5 hover:border-[#9dd8d0] hover:text-[#178980]">{example}</button>)}</div>
          </div>
          <div className="relative mx-auto w-full max-w-[440px] lg:mr-0"><div className="absolute inset-6 rounded-[32px] bg-[#d7eee9] blur-2xl" /><div className="relative overflow-hidden rounded-[30px] bg-[#12385a] p-7 text-white shadow-[0_24px_70px_rgba(18,56,90,.22)]"><div className="absolute -right-16 -top-16 size-52 rounded-full bg-[#2d7b91]/35" /><div className="relative flex items-start justify-between"><div><p className="text-sm text-[#a8c7d4]">{weather ? `${weather.name}${weather.state ? `, ${weather.state}` : ''}` : 'Your local weather'}</p><p className="mt-1 text-xs text-[#8faebd]">{weather ? weather.country : 'Search a location to begin'}</p></div><span className="rounded-full bg-white/10 px-3 py-1 text-xs text-[#b8d6dd]">{weather ? 'Now' : 'Live'}</span></div><div className="relative mt-12 flex items-center gap-5">{weather ? <img src={icon} alt={weather.description} className="size-24" /> : <CloudSun className="size-24 stroke-[1.2] text-[#9ce9df]" />}<div><p className="text-6xl font-semibold tracking-[-.06em]">{weather ? `${weather.temperature}°` : '--°'}</p><p className="mt-1 capitalize text-[#c5dde1]">{weather?.description ?? 'Waiting for a location'}</p></div></div><div className="relative mt-10 grid grid-cols-3 divide-x divide-white/15 border-t border-white/15 pt-5 text-center"><div><Droplets className="mx-auto mb-2 size-4 text-[#9ce9df]" /><p className="text-lg font-semibold">{weather ? `${weather.humidity}%` : '--'}</p><p className="text-[11px] text-[#94b3c0]">Humidity</p></div><div><Wind className="mx-auto mb-2 size-4 text-[#9ce9df]" /><p className="text-lg font-semibold">{weather ? weather.windSpeed : '--'}</p><p className="text-[11px] text-[#94b3c0]">m/s wind</p></div><div><Cloud className="mx-auto mb-2 size-4 text-[#9ce9df]" /><p className="text-lg font-semibold">{weather ? `${weather.clouds}%` : '--'}</p><p className="text-[11px] text-[#94b3c0]">Cloud cover</p></div></div></div></div>
        </div>
      </section>

      {weather && <section className="border-y border-[#dce8f0] bg-white"><div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:px-10"><div><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#1c9a91]">Current conditions</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#102c4d]">A clear picture of your sky</h2></div><span className="flex items-center gap-1.5 text-xs text-[#7a91a3]"><Check className="size-4 text-[#1a9d94]" /> Updated {new Date(weather.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div><div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Feels like" value={`${weather.feelsLike}°C`} /><Metric label="Humidity" value={`${weather.humidity}%`} /><Metric label="Wind speed" value={`${weather.windSpeed} m/s`} /><Metric label="Cloud cover" value={`${weather.clouds}%`} /></div></div><div className="rounded-2xl border border-[#d5e8e5] bg-[#f0faf8] p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#278b82]">Voice announcement</p><h2 className="mt-2 text-xl font-semibold text-[#123b57]">Listen to weather report</h2></div><span className="grid size-11 place-items-center rounded-full bg-[#d3eee8] text-[#218f86]"><Mic2 className="size-5" /></span></div><p className="mt-4 text-sm leading-6 text-[#638696]">{weather.announcement}</p><div className="mt-5 flex flex-wrap items-center gap-2"><Button onClick={play} className="rounded-lg bg-[#123b57] text-white hover:bg-[#1f506e]"><Play data-icon="inline-start" /> {speech === 'speaking' ? 'Speaking' : 'Play announcement'}</Button><Button onClick={() => { if (speech === 'speaking') { window.speechSynthesis.pause(); setSpeech('paused') } else if (speech === 'paused') { window.speechSynthesis.resume(); setSpeech('speaking') } }} variant="outline" className="rounded-lg border-[#c9dedb] bg-white" disabled={speech === 'ready' || speech === 'completed'}>{speech === 'paused' ? <Play data-icon="inline-start" /> : <Pause data-icon="inline-start" />} {speech === 'paused' ? 'Resume' : 'Pause'}</Button><Button onClick={() => { window.speechSynthesis.cancel(); setSpeech('completed') }} variant="ghost" className="rounded-lg text-[#638696]" disabled={speech === 'ready' || speech === 'completed'}><Square data-icon="inline-start" /> Stop</Button></div><p className="mt-4 text-xs font-medium text-[#4d827f]">● {statusText}</p></div></div></section>}

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10"><div className="max-w-xl"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#1c9a91]">How it works</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#102c4d]">From location to spoken insight.</h2><p className="mt-4 leading-7 text-[#6b8498]">WeatherVoice connects live API data with natural-language templates and browser speech synthesis — a practical NLP course project without pretending to use a trained model.</p></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{['Location input', 'Geocoding', 'JSON retrieval', 'String generation', 'Speech synthesis'].map((step, i) => <div key={step} className="rounded-2xl border border-[#dce8f0] bg-white p-5"><span className="text-sm font-semibold text-[#35a99c]">0{i + 1}</span><h3 className="mt-7 font-semibold text-[#173b5a]">{step}</h3><p className="mt-2 text-sm leading-6 text-[#7890a3]">{['Enter any village, town, or city.', 'Resolve the best coordinates.', 'Fetch current OpenWeather data.', 'Turn fields into one clear report.', 'Read it aloud in your browser.'][i]}</p></div>)}</div></section>
    </main>
    <footer id="about" className="border-t border-[#dce8f0] bg-[#eef5f8]"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-[#7590a2] sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10"><div><span className="font-semibold text-[#173b5a]">WeatherVoice</span><span className="mx-2">·</span>NLP Course Project</div><div>OpenWeather API · Web Speech API · Values depend on provider data</div></div></footer>
  </div>
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-[#e0ebf0] bg-[#f8fbfd] p-4"><p className="text-xs text-[#8096a7]">{label}</p><p className="mt-2 text-lg font-semibold text-[#173b5a]">{value}</p></div> }
