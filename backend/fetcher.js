/*
  fetcher.js — LIVE version
  Fetches MGNREGA data from data.gov.in and writes it to snapshots.json
*/

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.DATA_GOV_API_KEY || '';
const RESOURCE = process.env.DATA_GOV_RESOURCE_ID || '';
const STATE = process.env.STATE_NAME || 'Maharashtra';
const OUT = path.join(__dirname, '../data/snapshots.json');

async function fetchLive() {
  console.log('Fetching live data for state:', STATE);
  if (!API_KEY || !RESOURCE) {
    console.error('❌ Missing API key or resource id.');
    return;
  }

  const url = `https://api.data.gov.in/resource/${RESOURCE}`;
  try {
    const res = await axios.get(url, {
      params: {
        "api-key": API_KEY,
        format: "json",
        "filters[state_name]": STATE,
        limit: 10000,
      },
      timeout: 20000,
    });

    const records = res.data.records || [];
    console.log(`Fetched ${records.length} records from API.`);

    const snapshot = {
      meta: { updated_at: new Date().toISOString(), source: "data.gov.in live" },
      districts: {},
    };

    for (const rec of records) {
      const district = rec.district_name || "Unknown";
      const code = rec.district_code || district.replace(/\s+/g, "_");
      const key = `${STATE}|${code}`;

      if (!snapshot.districts[key]) {
        snapshot.districts[key] = {
          district_name: district,
          metrics: { latest: {}, history: [] },
        };
      }

      // Fill in key metrics
      const latest = snapshot.districts[key].metrics.latest;
      latest.year = parseInt(rec.financial_year || rec.year || new Date().getFullYear());
      latest.jobs_generated = Number(rec.total_persondays_generated || rec.persondays_generated || 0);
      latest.beneficiaries = Number(rec.no_of_households_worked || rec.households_worked || 0);
      latest.avg_days_per_person = Number(rec.avg_days_per_person || rec.average_days_per_household || 0);
      latest.payment_delay_days = Number(rec.average_delay_in_payment || rec.payment_delay_days || 0);
      latest.total_wages = Number(rec.total_wages_disbursed || rec.total_wages_paid || 0);
      latest.women_participation = Number(rec.percentage_of_women_participation || 0);
      latest.budget_utilization_percent = Number(rec.budget_utilization_percent || 0);

      // Append to history for graphs
      snapshot.districts[key].metrics.history.push({
        year: latest.year,
        jobs_generated: latest.jobs_generated,
      });
    }

    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(snapshot, null, 2));
    console.log("✅ Snapshot saved to", OUT);
  } catch (err) {
    console.error("❌ Fetch failed:", err.message);
  }
}

(async () => {
  if (!API_KEY) {
    console.log("⚠️ No DATA_GOV_API_KEY provided. Skipping live fetch.");
    return;
  }
  await fetchLive();
})();
