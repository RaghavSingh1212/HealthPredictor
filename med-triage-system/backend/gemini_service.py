import json
import logging
from config import settings

logger = logging.getLogger(__name__)

MOCK_API_KEYS = {"", "dev-mock-key", "your-gemini-api-key-here", "REPLACE_ME"}

SYSTEM_PROMPT = """
You are a highly secure, empathetic, and professional medical intake assistant operating under strict HIPAA compliance rules. 
Your goal is to converse with a patient to gather clinically useful intake details for a doctor.
Do not provide a medical diagnosis, treatment plan, prescription, or reassurance that symptoms are safe.

Ask short, relevant follow-up questions. Prioritize:
1. Chief complaint and body location
2. Onset, duration, progression, and severity from 1-10
3. Associated symptoms
4. Red flags such as chest pain, trouble breathing, fainting, confusion, severe bleeding, weakness on one side, severe allergic reaction, or suicidal intent
5. Relevant medical history, pregnancy status when relevant, past similar episodes
6. Current medications and allergies

If the patient mentions emergency red flags, mark severity_level and recommended_priority as "Emergency" and advise them to seek emergency care immediately while still preparing a summary for clinician review.

Once you have gathered sufficient information, or if the patient requests to finish, you MUST output a final structured summary wrapped in markdown JSON code block.

The JSON structure must exactly match:
{
  "is_complete": true,
  "summary": {
    "chief_complaint": "string",
    "symptoms_duration": "string",
    "severity_level": "Low/Medium/High/Emergency",
    "reported_symptoms": ["string"],
    "associated_symptoms": ["string"],
    "red_flags": ["string"],
    "relevant_history": "string",
    "medications": ["string"],
    "allergies": ["string"],
    "recommended_priority": "Low/Medium/High/Emergency",
    "ai_summary": "brief doctor-facing paragraph"
  }
}
If you are still gathering details, keep "is_complete" as false and provide your conversational response in a "message" key.
"""

_model = None


def _is_mock_mode() -> bool:
    return settings.GEMINI_API_KEY.strip() in MOCK_API_KEYS


def _get_model():
    global _model
    if _model is None:
        import google.generativeai as genai

        genai.configure(api_key=settings.GEMINI_API_KEY)
        _model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config={"response_mime_type": "application/json"},
            system_instruction=SYSTEM_PROMPT,
        )
    return _model


async def _mock_analyze_triage_chat(chat_history: list) -> dict:
    user_messages = [m["content"] for m in chat_history if m["role"] == "user"]
    user_turns = len(user_messages)
    last_user = user_messages[-1] if user_messages else ""
    all_text = " ".join(user_messages).lower()

    finish_requested = any(
        word in last_user.lower()
        for word in ("finish", "done", "complete", "submit", "that's all")
    )

    emergency_terms = [
        "chest pain",
        "trouble breathing",
        "shortness of breath",
        "faint",
        "confusion",
        "severe bleeding",
        "suicidal",
        "one side",
    ]
    red_flags = [term for term in emergency_terms if term in all_text]
    severity = "Emergency" if red_flags else "Medium"

    if user_turns >= 5 or finish_requested or red_flags:
        symptoms = [s.strip() for s in last_user.replace(",", ";").split(";") if s.strip()]
        if not symptoms:
            symptoms = [last_user[:80] or "Unspecified symptoms"]
        return {
            "is_complete": True,
            "summary": {
                "chief_complaint": user_messages[0][:200] if user_messages else "General complaint",
                "symptoms_duration": user_messages[1][:100] if user_turns > 1 else "Not specified",
                "severity_level": severity,
                "reported_symptoms": symptoms[:5],
                "associated_symptoms": user_messages[2:3] or [],
                "red_flags": red_flags,
                "relevant_history": user_messages[3][:200] if user_turns > 3 else "None reported",
                "medications": user_messages[4:5] or [],
                "allergies": [],
                "recommended_priority": severity,
                "ai_summary": "Mock intake summary generated from the patient conversation for clinician review.",
            },
        }

    follow_ups = [
        "Thank you for sharing. When did this start, and is it getting better, worse, or staying the same?",
        "On a scale of 1 to 10, how severe is it, and where exactly do you feel it?",
        "Are you having any related symptoms, such as fever, nausea, dizziness, chest pain, breathing trouble, weakness, or bleeding?",
        "Do you have any medical conditions, past similar episodes, recent injuries, surgeries, or pregnancy-related concerns?",
        "What medications are you currently taking, and do you have any allergies?",
    ]
    idx = min(max(user_turns - 1, 0), len(follow_ups) - 1)
    return {"is_complete": False, "message": follow_ups[idx]}


async def analyze_triage_chat(chat_history: list):
    if _is_mock_mode():
        logger.info("Using local dev mock triage (set GEMINI_API_KEY for live AI)")
        return await _mock_analyze_triage_chat(chat_history)

    formatted_contents = []
    for msg in chat_history:
        formatted_contents.append({"role": msg["role"], "parts": [msg["content"]]})

    response = _get_model().generate_content(formatted_contents)
    try:
        return json.loads(response.text)
    except Exception:
        return {"is_complete": False, "message": "Can you please elaborate more on your physical symptoms?"}
