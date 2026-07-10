import logging
from fastapi import FastAPI, HTTPException

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

class PatientProfile(BaseModel):
    patient_id: str = Field(..., min_length=2)
    name: str
    age: Optional[int] = None
    sex: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    allergies: List[str] = []
    chronic_conditions: List[str] = []
    current_medications: List[str] = []
    past_surgeries: List[str] = []
    family_history: List[str] = []
    lifestyle_notes: Optional[str] = None
    important_notes: Optional[str] = None

class DoctorNotePayload(BaseModel):
    note: str

def serialize_doc(doc):
    doc["_id"] = str(doc["_id"])
    for key in ("created_at", "updated_at", "reviewed_at"):
        if doc.get(key):
            doc[key] = doc[key].isoformat()
    return doc

async def get_patient_or_404(patient_id: str):
    patient = await db_helper.db.patients.find_one({"patient_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

async def list_pending_cases():
    cursor = db_helper.db.triage_cases.find({"status": "pending_review"}).sort("created_at", -1)
    cases = []
    async for doc in cursor:
        patient = await db_helper.db.patients.find_one({"patient_id": doc["patient_id"]})
        item = serialize_doc(doc)
        item["patient"] = serialize_doc(patient) if patient else None
        cases.append(item)
    return cases

@app.post("/api/patients")
async def upsert_patient(profile: PatientProfile):
    now = datetime.datetime.utcnow()
    payload = profile.model_dump()
    payload["updated_at"] = now
    result = await db_helper.db.patients.update_one(
        {"patient_id": profile.patient_id},
        {"$set": payload, "$setOnInsert": {"created_at": now}},
        upsert=True,
    )
    patient = await db_helper.db.patients.find_one({"patient_id": profile.patient_id})
    return {"status": "created" if result.upserted_id else "updated", "patient": serialize_doc(patient)}

@app.get("/api/patients")
async def get_patients():
    cursor = db_helper.db.patients.find().sort("updated_at", -1)
    patients = []
    async for patient in cursor:
        last_case = await db_helper.db.triage_cases.find_one(
            {"patient_id": patient["patient_id"]},
            sort=[("created_at", -1)],
        )
        item = serialize_doc(patient)
        item["last_case"] = serialize_doc(last_case) if last_case else None
        patients.append(item)
    return patients

@app.get("/api/patients/{patient_id}")
async def get_patient(patient_id: str):
    patient = await get_patient_or_404(patient_id)
    return serialize_doc(patient)

@app.get("/api/patients/{patient_id}/history")
async def get_patient_history(patient_id: str):
    await get_patient_or_404(patient_id)
    cursor = db_helper.db.triage_cases.find({"patient_id": patient_id}).sort("created_at", -1)
    history = []
    async for case in cursor:
        history.append(serialize_doc(case))
    return history

@app.post("/api/triage")
async def process_triage(payload: TriagePayload):
    try:
        patient = await db_helper.db.patients.find_one({"patient_id": payload.patient_id})
        if not patient:
            now = datetime.datetime.utcnow()
            patient = {
                "patient_id": payload.patient_id,
                "name": f"Patient {payload.patient_id}",
                "age": None,
                "sex": None,
                "phone": None,
                "email": None,
                "blood_group": None,
                "emergency_contact": None,
                "allergies": [],
                "chronic_conditions": [],
                "current_medications": [],
                "past_surgeries": [],
                "family_history": [],
                "lifestyle_notes": None,
                "important_notes": None,
                "created_at": now,
                "updated_at": now,
            }
            await db_helper.db.patients.insert_one(patient)

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
                "associated_symptoms": summary_data.get("associated_symptoms", []),
                "red_flags": summary_data.get("red_flags", []),
                "relevant_history": summary_data.get("relevant_history"),
                "medications": summary_data.get("medications", []),
                "allergies": summary_data.get("allergies", []),
                "recommended_priority": summary_data.get("recommended_priority", summary_data.get("severity_level")),
                "ai_summary": summary_data.get("ai_summary", ""),
                "conversation": [msg.model_dump() for msg in payload.history],
                "doctor_notes": [],
                "status": "pending_review",
                "created_at": datetime.datetime.utcnow()
            }
            await db_helper.db.triage_cases.insert_one(record)
            await db_helper.db.patients.update_one(
                {"patient_id": payload.patient_id},
                {"$set": {"updated_at": datetime.datetime.utcnow()}}
            )
            return {"status": "completed", "data": summary_data}
        
        return {"status": "conversing", "message": ai_response.get("message", "Continue...")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/clinician/cases")
async def get_cases():
    try:
        return await list_pending_cases()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/doctor/cases")
async def get_doctor_cases():
    try:
        return await list_pending_cases()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/clinician/cases/{case_id}/resolve")
async def resolve_case(case_id: str):
    result = await db_helper.db.triage_cases.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": {"status": "reviewed", "reviewed_at": datetime.datetime.utcnow()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"status": "success"}

@app.post("/api/doctor/cases/{case_id}/notes")
async def add_doctor_note(case_id: str, payload: DoctorNotePayload):
    note = {
        "note": payload.note,
        "created_at": datetime.datetime.utcnow(),
    }
    result = await db_helper.db.triage_cases.update_one(
        {"_id": ObjectId(case_id)},
        {"$push": {"doctor_notes": note}, "$set": {"updated_at": datetime.datetime.utcnow()}},
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"status": "success", "note": note}

@app.get("/healthz")
async def healthz():
    return {"status": "healthy"}
