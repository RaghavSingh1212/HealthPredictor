import logging
from fastapi import FastAPI, HTTPException, status

logging.basicConfig(level=logging.INFO)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import datetime
from bson import ObjectId

from database import connect_to_mongo, close_mongo_connection, db_helper
from gemini_service import analyze_triage_chat

app = FastAPI(title="HIPAA Medical Triage API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Tighten in production Kubernetes setup
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_event_handler("startup", connect_to_mongo)
app.add_event_handler("shutdown", close_mongo_connection)

class ChatMessage(BaseModel):
    role: str # 'user' or 'model'
    content: str

class TriagePayload(BaseModel):
    patient_id: str
    history: List[ChatMessage]

@app.post("/api/triage")
async def process_triage(payload: TriagePayload):
    try:
        ai_response = await analyze_triage_chat([msg.model_dump() for msg in payload.history])
        
        # If AI flags it as a complete diagnostic summary, store it securely
        if ai_response.get("is_complete"):
            summary_data = ai_response.get("summary")
            record = {
                "patient_id": payload.patient_id,
                "chief_complaint": summary_data.get("chief_complaint"),
                "symptoms_duration": summary_data.get("symptoms_duration"),
                "severity_level": summary_data.get("severity_level"),
                "reported_symptoms": summary_data.get("reported_symptoms"),
                "relevant_history": summary_data.get("relevant_history"),
                "status": "pending_review",
                "created_at": datetime.datetime.utcnow()
            }
            await db_helper.db.patients.insert_one(record)
            return {"status": "completed", "data": summary_data}
        
        return {"status": "conversing", "message": ai_response.get("message", "Continue...")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/clinician/cases")
async def get_cases():
    try:
        cursor = db_helper.db.patients.find({"status": "pending_review"}).sort("created_at", -1)
        cases = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            doc["created_at"] = doc["created_at"].isoformat()
            cases.append(doc)
        return cases
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/clinician/cases/{case_id}/resolve")
async def resolve_case(case_id: str):
    result = await db_helper.db.patients.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": {"status": "reviewed", "reviewed_at": datetime.datetime.utcnow()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"status": "success"}

@app.get("/healthz")
async def healthz():
    return {"status": "healthy"}
