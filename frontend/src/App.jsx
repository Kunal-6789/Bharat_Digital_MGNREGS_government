// App.jsx
import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import DistrictCard from './components/DistrictCard'
import { Search } from 'lucide-react'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'

export default function App() {
  const [query, setQuery] = useState('')
  const [lang, setLang] = useState('hi')
  const [list, setList] = useState([])
  const [meta, setMeta] = useState({})
  const [loading, setLoading] = useState(true)

  // ✅ Load districts from backend (includes metrics)
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const res = await axios.get(`${API}/districts`)
        // res.data.districts is an array where each item has metrics
        setList(res.data.districts || [])
        setMeta({ updated_at: res.data.updated_at })
      } catch (err) {
        console.error('Fetch failed:', err)
        alert('Unable to load districts. Check backend is running.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // client-side filtered list for search
  const filtered = useMemo(() => {
    if (!query || query.trim().length < 1) return list
    const q = query.toLowerCase()
    return list.filter(
      d =>
        d.district_name.toLowerCase().includes(q) ||
        d.district_code.toLowerCase().includes(q)
    )
  }, [list, query])

  // compute state averages (safe numeric parsing)
  const stateAvg = useMemo(() => {
    if (!list || list.length === 0) return null
    let count = 0, jobs = 0, days = 0, delay = 0, money = 0
    for (const d of list) {
      const latest = d.metrics?.latest
      if (!latest) continue
      count++
      jobs += Number(latest.jobs_generated || 0)
      days += Number(latest.avg_days_per_person || 0)
      delay += Number(latest.payment_delay_days || 0)
      money += Number(latest.money_spent || latest.total_wages || 0)
    }
    if (count === 0) return null
    return {
      jobs: Math.round(jobs / count),
      avg_days: Number((days / count).toFixed(1)),
      delay: Number((delay / count).toFixed(1)),
      money_spent: Math.round(money / count)
    }
  }, [list])

  // compute ranking by jobs_generated (desc)
  const ranks = useMemo(() => {
    const arr = list.map(d => ({ code: d.district_code, jobs: Number(d.metrics?.latest?.jobs_generated || 0) }))
    arr.sort((a,b) => b.jobs - a.jobs)
    const map = {}
    arr.forEach((it, idx) => { map[it.code] = idx + 1 })
    return { map, total: arr.length }
  }, [list])

  // Voice input (unchanged)
  function startVoice() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice not supported in this browser')
      return
    }
    const rec = new SpeechRecognition()
    rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onresult = e => {
      const t = e.results[0][0].transcript
      setQuery(t)
    }
    rec.onerror = err => {
      console.error('Speech error', err)
      alert('Voice input error')
    }
    rec.start()
  }

  // Explain with TTS (unchanged)
  function explain(d) {
    const latest = d.metrics?.latest || {}
    const text =
      lang === 'hi'
        ? `${d.district_name} में ${latest.jobs_generated || 0} नौकरियाँ, औसत ${latest.avg_days_per_person || 0} दिन, भुगतान देरी ${latest.payment_delay_days || 0} दिन।`
        : `${d.district_name}: ${latest.jobs_generated || 0} jobs, avg ${latest.avg_days_per_person || 0} days, payment delay ${latest.payment_delay_days || 0} days.`
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
    window.speechSynthesis.speak(u)
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="header-card">
        <h1 className="brand">हमारी आवाज़ — MGNREGA (MAH)</h1>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                lang === "hi"
                  ? "जिला खोजें या बोलें..."
                  : "Search district or speak..."
              }
              className="search-input"
            />
            <button
              onClick={startVoice}
              className="voice-btn absolute right-3 top-1/2 -translate-y-1/2"
              title={lang === "hi" ? "वॉइस इनपुट" : "Voice input"}
            >
              🎙️
            </button>
          </div>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="border rounded-xl px-4 py-2 bg-white"
          >
            <option value="hi">हिन्दी</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="district-card">
          <div className="small">
            {lang === "hi" ? "कुल जिलों की संख्या" : "Total districts"}
          </div>
          <div className="metric">{list.length}</div>
        </div>

        <div className="district-card">
          <div className="small">
            {lang === "hi" ? "राज्य" : "State"}
          </div>
          <div className="text-3xl font-bold text-orange-500">
            {lang === "hi" ? "महाराष्ट्र" : "Maharashtra"}
          </div>
        </div>

        <div className="district-card">
          <div className="small">
            {lang === "hi" ? "अंतिम अपडेट" : "Last updated"}
          </div>
          <div className="metric text-blue-600">{meta.updated_at || "N/A"}</div>
        </div>
      </div>

      {/* District List */}
      {loading ? (
        <div className="text-center text-gray-600 py-20">
          {lang === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}
        </div>
      ) : (
        <div className="district-list">
          {filtered.map((d) => (
            <DistrictCard
              key={d.district_code}
              d={d}
              lang={lang}
              onExplain={explain}
              stateAvg={stateAvg}
              rank={ranks.map[d.district_code]}
              totalDistricts={ranks.total}
            />
          ))}
        </div>
      )}
    </div>
  )
}
