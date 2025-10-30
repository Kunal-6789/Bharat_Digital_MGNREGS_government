// DistrictCard.jsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";
import { useState } from "react";

export default function DistrictCard({ d, lang, onExplain, stateAvg, rank, totalDistricts }) {
  const [showCompare, setShowCompare] = useState(false);

  const history = d?.metrics?.history || [];
  const latest = d?.metrics?.latest || history[history.length - 1] || {
    jobs_generated: 0,
    avg_days_per_person: 0,
    payment_delay_days: 0,
    money_spent: 0
  };

  const statusForJobs = latest.jobs_generated > 150000 ? "good" : latest.jobs_generated < 70000 ? "poor" : "avg";
  const statusForDays = latest.avg_days_per_person >= 12 ? "good" : latest.avg_days_per_person < 9 ? "poor" : "avg";
  const statusForDelay = latest.payment_delay_days <= 3 ? "good" : latest.payment_delay_days > 14 ? "poor" : "avg";

  // pretty money display as crore if >1e7
  function formatMoney(v = 0) {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`
    if (v >= 100000) return `₹${(v / 100000).toFixed(2)} L`
    return `₹${v.toLocaleString()}`
  }

  // compute comparisons (if stateAvg present)
  const cmpJobs = stateAvg ? latest.jobs_generated - (stateAvg.jobs || 0) : null;
  const cmpDays = stateAvg ? latest.avg_days_per_person - (stateAvg.avg_days || 0) : null;
  const cmpDelay = stateAvg ? latest.payment_delay_days - (stateAvg.delay || 0) : null;
  const cmpMoney = stateAvg ? latest.money_spent - (stateAvg.money_spent || 0) : null;

  return (
    <div className="district-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-lg">
            {d.district_name} {rank ? <span className="text-sm text-gray-600">#{rank}/{totalDistricts}</span> : null}
          </div>
          <div className="small">
            {d.district_code} • {lang === "hi" ? "महाराष्ट्र" : "Maharashtra"}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => setShowCompare(s => !s)}
              className="px-3 py-1 rounded-lg border text-sm"
            >
              {lang === "hi" ? 'तुलना' : 'Compare'}
            </button>
            <button
              onClick={() => onExplain(d)}
              className="voice-btn"
              title={lang === "hi" ? "समझाएँ" : "Explain"}
            >
              🔊
            </button>
          </div>
        </div>
      </div>

      {/* Tiles: Jobs | Avg days | Delay | Money Spent */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
        <div className={"tile " + (statusForJobs==='good'?'tile-good':statusForJobs==='avg'?'tile-avg':'tile-poor')}>
          <div className="metric">{latest.jobs_generated?.toLocaleString() || 0}</div>
          <div className="small">{lang==='hi'?'नौकरियाँ':'Jobs'}</div>
        </div>

        <div className={"tile " + (statusForDays==='good'?'tile-good':statusForDays==='avg'?'tile-avg':'tile-poor')}>
          <div className="metric">{latest.avg_days_per_person || 0}</div>
          <div className="small">{lang==='hi'?'औसत दिन/व्यक्ति':'Avg days/person'}</div>
        </div>

        <div className={"tile " + (statusForDelay==='good'?'tile-good':statusForDelay==='avg'?'tile-avg':'tile-poor')}>
          <div className="metric">{latest.payment_delay_days || 0}</div>
          <div className="small">{lang==='hi'?'भुगतान देरी (दिन)':'Payment delay (days)'}</div>
        </div>

        <div className="tile tile-avg">
          <div className="metric">{formatMoney(latest.money_spent || 0)}</div>
          <div className="small">{lang==='hi'?'खर्च राशि':'Money Spent'}</div>
        </div>
      </div>

      {/* Compare panel */}
      {showCompare && stateAvg && (
        <div className="mt-3 p-3 bg-gray-50 rounded-md text-sm">
          <div className="font-semibold mb-1">{lang==='hi'?'राज्य औसत से तुलना':'Compared to state average'}</div>

          <div className="flex gap-3 flex-wrap">
            <div className="text-xs">
              {lang==='hi'?'नौकरियाँ':'Jobs'}: <strong>{cmpJobs >= 0 ? `+${cmpJobs.toLocaleString()}` : cmpJobs.toLocaleString()}</strong>
            </div>

            <div className="text-xs">
              {lang==='hi'?'औसत दिन':'Avg days'}: <strong>{cmpDays >= 0 ? `+${cmpDays}` : cmpDays}</strong>
            </div>

            <div className="text-xs">
              {lang==='hi'?'देरी (दिन)':'Delay (days)'}: <strong>{cmpDelay >= 0 ? `+${cmpDelay}` : cmpDelay}</strong>
            </div>

            <div className="text-xs">
              {lang==='hi'?'खर्च':'Money'}: <strong>{cmpMoney >= 0 ? `+${formatMoney(cmpMoney)}` : formatMoney(Math.abs(cmpMoney))}</strong>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-600">{lang==='hi'?'नोट: राज्य औसत समूचे राज्य के जिलों से निकाले गए औसत हैं।':'Note: state averages are computed across all districts.'}</div>
        </div>
      )}

      {/* Chart */}
      {history.length > 0 && (
        <div className="mt-3" style={{ height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="jobs_generated" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
