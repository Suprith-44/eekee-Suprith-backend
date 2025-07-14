from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Literal
from pydantic import BaseModel, field_validator
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

# --- App Setup ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Firebase Initialization ---
load_dotenv()
firebase_cred_env = os.environ.get("FIREBASE_CRED")
CRED_PATH = firebase_cred_env if firebase_cred_env and os.path.exists(firebase_cred_env) else "credentials.json"

if not firebase_admin._apps:
    cred = credentials.Certificate(CRED_PATH)
    firebase_admin.initialize_app(cred)

db = firestore.client()

# --- Models ---
class Option(BaseModel):
    label: str
    icon: Optional[str] = None

class Question(BaseModel):
    type: Literal["single_choice", "multi_choice"]
    text: str
    canSkip: bool
    options: List[Option]
    maxSelections: Optional[int] = None
    order: int  # Index to insert at

    @field_validator("maxSelections")
    @classmethod
    def check_max_selections(cls, max_sel, info):
        if info.data.get("type") == "multi_choice" and max_sel is None:
            raise ValueError("maxSelections is required for multi_choice questions")
        return max_sel

class AnswerSubmission(BaseModel):
    answers: dict[str, List[str]]  # question_id -> list of selected option labels

# --- Routes ---
@app.post("/questions")
async def add_question(q: Question):
    data = q.model_dump()
    questions_ref = db.collection("questions3")

    # Shift orders of existing questions >= q.order
    docs = questions_ref.where("order", ">=", q.order).order_by("order").stream()
    batch = db.batch()
    for doc in docs:
        doc_ref = questions_ref.document(doc.id)
        batch.update(doc_ref, {"order": doc.to_dict()["order"] + 1})
    batch.commit()

    # Insert new question
    new_doc_ref = questions_ref.add(data)
    return {"message": "Question added", "id": new_doc_ref[1].id}

@app.get("/questions")
async def get_questions():
    docs = db.collection("questions2").order_by("order").stream()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

@app.post("/submit")
async def submit_answers(payload: AnswerSubmission, request: Request):
    try:
        db.collection("responses").add({
            "answers": payload.answers,
            "submittedAt": datetime.utcnow(),
            "clientIp": request.client.host
        })
        return {"message": "Answers submitted successfully"}
    except Exception as e:
        return {"error": str(e)}