// frontend/src/api.js

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function fetchSnapshots() {
  try {
    const res = await fetch(`${API_URL}/api/snapshots`);
    if (!res.ok) throw new Error("Failed to fetch snapshots");
    return res.json();
  } catch (err) {
    console.error("Error fetching snapshots:", err);
    throw err;
  }
}
