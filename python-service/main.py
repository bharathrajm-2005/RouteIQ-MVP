from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from sklearn.ensemble import IsolationForest

app = FastAPI(title="RouteIQ ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── MODELS ───────────────────────────────────────────────

class MetricRecord(BaseModel):
    slaRate: float
    avgDelayMin: float
    recordedAt: str

class DetectRequest(BaseModel):
    corridorKey: str
    metrics: List[MetricRecord]

class DetectResponse(BaseModel):
    anomalyDetected: bool
    severity: Optional[str] = None
    confidence: Optional[float] = None

class CourierInput(BaseModel):
    id: int
    name: str
    baseRatePerKg: float
    avgSlaRate: float
    isAnomalous: bool

class RankRequest(BaseModel):
    originPin: str
    destPin: str
    weightKg: float
    couriers: List[CourierInput]

class CarbonRequest(BaseModel):
    courierId: int
    distanceKm: float
    weightKg: float
    vehicleType: str

class CarbonResponse(BaseModel):
    carbonKg: float
    vehicleType: str
    emissionFactor: float

# ─── PIN DISTANCE MAP ────────────────────────────────────

PIN_COORDS = {
    "110001": (28.6139, 77.2090),  # Delhi
    "400001": (19.0760, 72.8777),  # Mumbai
    "560001": (12.9716, 77.5946),  # Bangalore
    "700001": (22.5726, 88.3639),  # Kolkata
    "600001": (13.0827, 80.2707),  # Chennai
    "302001": (26.9124, 75.7873),  # Jaipur
}

def estimate_distance(origin_pin: str, dest_pin: str) -> float:
    o = PIN_COORDS.get(origin_pin, (20.0, 78.0))
    d = PIN_COORDS.get(dest_pin, (20.0, 78.0))
    lat_diff = np.radians(d[0] - o[0])
    lon_diff = np.radians(d[1] - o[1])
    a = (np.sin(lat_diff / 2) ** 2 +
         np.cos(np.radians(o[0])) * np.cos(np.radians(d[0])) *
         np.sin(lon_diff / 2) ** 2)
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    return float(6371 * c * 1.3)  # km with road factor


# ─── EMISSION FACTORS ────────────────────────────────────

EMISSION_FACTORS = {
    "bike": 0.05,
    "van": 0.15,
    "truck": 0.20,
    "air": 0.60,
}

# ─── ENDPOINTS ────────────────────────────────────────────

@app.post("/detect", response_model=DetectResponse)
async def detect_anomaly(req: DetectRequest):
    """
    Train Isolation Forest on corridor metrics.
    Score the latest 5 records for anomalies.
    """
    if len(req.metrics) < 10:
        return DetectResponse(anomalyDetected=False)

    # Build feature matrix: [slaRate, avgDelayMin]
    X = np.array([[m.slaRate, m.avgDelayMin] for m in req.metrics])

    # Train Isolation Forest
    model = IsolationForest(
        n_estimators=100,
        contamination=0.1,
        random_state=42
    )
    model.fit(X)

    # Score latest 5 records (they are first in the list, ordered desc)
    latest = X[:5]
    predictions = model.predict(latest)
    scores = model.decision_function(latest)

    # Anomaly if any of the latest 5 are flagged (-1)
    anomaly_count = int(np.sum(predictions == -1))
    if anomaly_count >= 2:
        avg_score = float(np.mean(scores[predictions == -1]))
        severity = "high" if anomaly_count >= 4 or avg_score < -0.3 else "medium"
        confidence = round(min(1.0, anomaly_count / 5.0 + abs(avg_score)), 2)
        return DetectResponse(
            anomalyDetected=True,
            severity=severity,
            confidence=confidence
        )

    return DetectResponse(anomalyDetected=False)


@app.post("/rank")
async def rank_couriers(req: RankRequest):
    """
    Rank couriers by composite score of SLA, cost, and carbon.
    """
    distance_km = estimate_distance(req.originPin, req.destPin)
    if distance_km < 50:
        distance_km = 500.0  # Default for unknown pins

    results = []
    for c in req.couriers:
        estimated_cost = c.baseRatePerKg * req.weightKg * (1 + distance_km / 3000)
        predicted_sla = c.avgSlaRate * (0.4 if c.isAnomalous else 1.0)
        carbon_kg = (req.weightKg / 1000) * distance_km * EMISSION_FACTORS.get("van", 0.15)

        results.append({
            "courierId": c.id,
            "courierName": c.name,
            "predictedSlaRate": round(predicted_sla, 3),
            "estimatedCost": round(estimated_cost, 2),
            "estimatedCarbonKg": round(carbon_kg, 4),
            "isAnomalous": c.isAnomalous,
            "distanceKm": round(distance_km, 1),
        })

    # Normalize cost and carbon for scoring
    costs = [r["estimatedCost"] for r in results]
    carbons = [r["estimatedCarbonKg"] for r in results]
    max_cost = max(costs) if max(costs) > 0 else 1
    max_carbon = max(carbons) if max(carbons) > 0 else 1

    for r in results:
        norm_cost = r["estimatedCost"] / max_cost
        norm_carbon = r["estimatedCarbonKg"] / max_carbon
        score = (r["predictedSlaRate"] * 0.5) + ((1 - norm_cost) * 0.3) + ((1 - norm_carbon) * 0.2)
        r["recommendationScore"] = round(score, 4)

    # Sort by score descending
    results.sort(key=lambda x: x["recommendationScore"], reverse=True)

    return results


@app.post("/carbon", response_model=CarbonResponse)
async def calculate_carbon(req: CarbonRequest):
    """
    Calculate CO₂ emissions for a shipment.
    """
    factor = EMISSION_FACTORS.get(req.vehicleType, 0.15)
    carbon_kg = (req.weightKg / 1000) * req.distanceKm * factor

    return CarbonResponse(
        carbonKg=round(carbon_kg, 4),
        vehicleType=req.vehicleType,
        emissionFactor=factor
    )


@app.get("/health")
async def health():
    return {"status": "ok", "service": "RouteIQ ML Service"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
