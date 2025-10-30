-- Suggested Postgres schema (same as earlier)
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE districts (
  id SERIAL PRIMARY KEY,
  state TEXT NOT NULL,
  district_name TEXT NOT NULL,
  district_code TEXT UNIQUE NOT NULL,
  geom GEOMETRY(Polygon, 4326)
);

CREATE TABLE monthly_metrics (
  id SERIAL PRIMARY KEY,
  state TEXT NOT NULL,
  district_code TEXT NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  jobs_generated BIGINT,
  avg_days_per_person NUMERIC,
  payment_delay_days NUMERIC,
  money_spent NUMERIC,
  beneficiaries BIGINT,
  raw_json JSONB,
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(district_code, year, month)
);
