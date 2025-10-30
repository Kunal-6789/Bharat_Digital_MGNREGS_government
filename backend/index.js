// backend/index.js
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const SNAPSHOT_PATH = path.resolve(__dirname, "../data/snapshots.json");

// 🧠 Load snapshots in memory
function loadSnapshots() {
  try {
    const raw = fs.readFileSync(SNAPSHOT_PATH, "utf8");
    const data = JSON.parse(raw);
    return data;
  } catch (e) {
    console.error("Failed to load snapshots:", e.message);
    return { meta: { updated_at: null }, districts: {} };
  }
}

let SNAPSHOTS = loadSnapshots();

fs.watchFile(SNAPSHOT_PATH, () => {
  console.log("♻️ Detected snapshot change — reloading...");
  SNAPSHOTS = loadSnapshots();
});

// ✅ Get all data (for frontend)
app.get("/api/snapshots", (req, res) => {
  try {
    const data = fs.readFileSync(SNAPSHOT_PATH, "utf-8");
    res.json(JSON.parse(data));
  } catch (err) {
    console.error("Failed to load snapshots:", err);
    res.status(500).json({ error: "Unable to load snapshots data" });
  }
});

// ✅ Health endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", snapshot_updated: SNAPSHOTS.meta.updated_at });
});

// ✅ Districts list WITH metrics (for UI)
app.get("/api/districts", (req, res) => {
  const list = Object.keys(SNAPSHOTS.districts).map((k) => {
    const [state, code] = k.split("|");
    const d = SNAPSHOTS.districts[k];
    return {
      state,
      district_code: code,
      district_name: d.district_name,
      metrics: d.metrics, // include metrics!
    };
  });

  res.json({
    updated_at: SNAPSHOTS.meta.updated_at,
    districts: list,
  });
});

// ✅ Single district metrics
app.get("/api/metrics/:state/:district_code", (req, res) => {
  const { state, district_code } = req.params;
  const key = `${state}|${district_code}`;
  const d = SNAPSHOTS.districts[key];
  if (!d)
    return res
      .status(404)
      .json({ error: "District not found in snapshot", key });
  return res.json({ source: "snapshot", meta: SNAPSHOTS.meta, data: d });
});

// ✅ Search endpoint
app.get("/api/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const list = Object.keys(SNAPSHOTS.districts)
    .map((k) => {
      const [state, code] = k.split("|");
      const d = SNAPSHOTS.districts[k];
      return { state, district_code: code, district_name: d.district_name };
    })
    .filter(
      (x) =>
        x.district_name.toLowerCase().includes(q) ||
        x.district_code.toLowerCase().includes(q)
    );
  res.json({ count: list.length, results: list });
});

// ✅ Reload snapshots manually
app.post("/api/admin/reload", (req, res) => {
  SNAPSHOTS = loadSnapshots();
  res.json({ reloaded: true, snapshot_updated: SNAPSHOTS.meta.updated_at });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend v2 listening on port ${PORT}`));
