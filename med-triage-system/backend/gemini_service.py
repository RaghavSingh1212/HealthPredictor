import json
import logging
from config import settings

logger = logging.getLogger(__name__)

MOCK_API_KEYS = {"", "dev-mock-key", "your-gemini-api-key-here", "REPLACE_ME"}

SYSTEM_PROMPT = """
You are a highly secure, empathetic, and professional medical intake assistant operating under strict HIPAA compliance rules. 
Your goal is to converse with a patient to gather their current symptoms, duration, severity, and basic medical history.
Do not provide a medical diagnosis. 

Once you have gathered sufficient information, or if the patient requests to finish, you MUST output a final structured summary wrapped in markdown JSON code block.

The JSON structure must exactly match:
{
  "is_complete": true,
  "summary": {
    "chief_complaint": "string",
    "symptoms_duration": "string",
    "severity_level": "Low/Medium/High/Emergency",
    "reported_symptoms": ["string"],
    "relevant_history": "string"
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

    finish_requested = any(
        word in last_user.lower()
        for word in ("finish", "done", "complete", "submit", "that's all")
    )

    if user_turns >= 3 or finish_requested:
        symptoms = [s.strip() for s in last_user.replace(",", ";").split(";") if s.strip()]
        if not symptoms:
            symptoms = [last_user[:80] or "Unspecified symptoms"]
        return {
            "is_complete": True,
            "summary": {
                "chief_complaint": user_messages[0][:200] if user_messages else "General complaint",
                "symptoms_duration": user_messages[1][:100] if user_turns > 1 else "Not specified",
                "severity_level": "Medium",
                "reported_symptoms": symptoms[:5],
                "relevant_history": user_messages[-1][:200] if user_turns > 2 else "None reported",
            },
        }

    follow_ups = [
        "Thank you for sharing. How long have you been experiencing these symptoms?",
        "Could you describe the severity (mild, moderate, severe) and any relevant medical history?",
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
