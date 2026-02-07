import os # Ensure os is imported
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware # Import CORSMiddleware
from pydantic import BaseModel, Field
import httpx
from typing import Optional

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"], # Allows only your frontend origin
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)

# Correctly mount the static files directory relative to the script's location
app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "static")), name="static")

# Configuration for your friend's ML FastAPI
# You will need to replace this with the actual URL of your friend's API
ML_API_BASE_URL = os.getenv("ML_API_BASE_URL", "https://draughtiest-delisa-attached.ngrok-free.dev") # Updated with friend's ngrok URL

class CriticalParameters(BaseModel):
    timestamp: int
    machineId: str
    machineName: str
    rpm: float
    torque: float
    loadWeight: int
    motorTemp: float
    windingTemp: float
    bearingTemp: float
    ambientTemp: float
    vibrationX: float
    vibrationY: float
    vibrationZ: float
    vibrationMagnitude: float
    voltage: float
    current: float
    powerConsumption: float
    powerFactor: float
    harmonicDistortion: float
    efficiency: int
    operatingHours: int
    startStopCycles: int
    wearLevel: int
    bearingWear: int
    insulationResistance: int
    humidity: float
    isRunning: bool # Added based on your example
    target_url: Optional[str] = None # URL of the friend's backend, if overridden

@app.post("/send_critical_data")
async def send_critical_data(params: CriticalParameters):

    if params.target_url:
        ml_api_endpoint = params.target_url
    else:
        ml_api_endpoint = f"{(ML_API_BASE_URL).rstrip('/')}/predict"

    # ✅ Extract ONLY ML-relevant fields
    payload = {k: getattr(params, k) for k in [
        "rpm",
        "torque",
        "loadWeight",
        "motorTemp",
        "windingTemp",
        "bearingTemp",
        "ambientTemp",
        "vibrationX",
        "vibrationY",
        "vibrationZ",
        "vibrationMagnitude",
        "voltage",
        "current",
        "powerConsumption",
        "powerFactor",
        "harmonicDistortion",
        "efficiency",
        "operatingHours",
        "humidity"
    ]}

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(ml_api_endpoint, json=payload)

            # 🔍 Log ML backend response
            print("ML status:", response.status_code)
            print("ML response:", response.text)

            response.raise_for_status()
            return response.json()

    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail=f"Cannot connect to ML backend at {ml_api_endpoint}"
        )

    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"ML backend error: {e.response.text}"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
        
@app.get("/")
async def read_root():
    return {"message": "ML API Client is running. Go to /static/index.html to use the manual sender."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)