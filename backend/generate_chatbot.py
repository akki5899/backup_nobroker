#!/usr/bin/env python3
"""Helper script to generate chatbot.py"""
import os

CHATBOT_PATH = os.path.join(os.path.dirname(__file__), "app", "api", "v1", "chatbot.py")

content = r'''from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
import httpx
import random
import logging
import os as _os

from ...core.database import get_db
from ...models.chat_lead import ChatLead

logger = logging.getLogger(__name__)

router = APIRouter()


class ChatMessage(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    suggestions: List[str] = []


class LeadCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    requirement: Optional[str] = None


class LeadResponse(BaseModel):
    id: int
    name: str
    email: str
    message: str


RESPONSES = {
    "greeting": [
        "Hello! I'm PropBot, your property assistant. How can I help you today?",
        "Hi there! Welcome to PropDirect. What can I assist you with?",
        "Hey! I'm here to help you with property-related questions.",
    ],
    "property_search": [
        "I can help you find properties! Try searching by location, budget, or property type on our main page.",
        "Looking for a property? Use our advanced search filters to find exactly what you need.",
        "You can browse properties by rent/sale, location, and amenities. Check out our listings!",
    ],
    "pricing": [
        "Property prices vary by location and type. You can filter by budget range in our search.",
        "For accurate pricing, check our latest listings or contact property owners directly.",
        "Prices depend on location, size, and amenities. Browse our listings for current rates!",
    ],
    "contact": [
        "You can contact property owners directly through our platform after viewing their listings.",
        "Each property has contact details. Just click on any property to get owner information.",
        "We connect you directly with property owners - no middlemen, no brokerage!",
    ],
    "features": [
        "PropDirect offers zero brokerage, direct owner contact, verified listings, and advanced search filters.",
        "Key features include: property search, wishlist, direct messaging, and detailed property info.",
        "We provide a complete property platform with search, favorites, owner contact, and more!",
    ],
    "help": [
        "I can help with property search, pricing info, platform features, and general questions.",
        "Feel free to ask about finding properties, contacting owners, or using our platform.",
        "I'm here to assist with property-related queries and guide you through PropDirect!",
    ],
    "default": [
        "I'm still learning! For detailed help, browse our property listings or contact support.",
        "That's interesting! For specific queries, check our help section or contact support.",
        "I might not have the perfect answer, but our team is always ready to help!",
    ],
}

SUGGESTIONS = [
    "How do I search for properties?",
    "What are your key features?",
    "How can I contact property owners?",
    "Tell me about pricing",
    "How does PropDirect work?",
]


def get_response_type(message: str) -> str:
    message = message.lower().strip()
    if any(w in message for w in ["hi", "hello", "hey", "good morning", "good evening"]):
        return "greeting"
    if any(w in message for w in ["search", "find", "property", "house", "apartment", "rent", "buy"]):
        return "property_search"
    if any(w in message for w in ["price", "cost", "budget", "expensive", "cheap", "rate"]):
        return "pricing"
    if any(w in message for w in ["contact", "owner", "call", "phone", "email", "reach"]):
        return "contact"
    if any(w in message for w in ["feature", "service", "offer", "provide", "benefit"]):
        return "features"
    if any(w in message for w in ["help", "assist", "support", "guide", "how"]):
        return "help"
    return "default"


def get_fallback_response(message: str) -> ChatResponse:
    """Keyword-matching fallback when LLM is unavailable."""
    response_type = get_response_type(message)
    response = random.choice(RESPONSES[response_type])
    suggestions = []
    if response_type in ["greeting", "help"]:
        suggestions = random.sample(SUGGESTIONS, 3)
    return ChatResponse(response=response, suggestions=suggestions)


SYSTEM_PROMPT = (
    "You are PropBot, the AI assistant for PropDirect, a zero-brokerage real estate platform in India. "
    "You help users find properties, answer questions about services, and provide general real estate advice. "
    "Keep responses concise (2-3 sentences max). Be friendly and professional. "
    "If users ask about specific listings, suggest they use the search functionality on the website. "
    "Do not make up property prices or availability. "
    "PropDirect features: zero brokerage, direct owner contact, verified listings, advanced search, wishlist, map view."
)

HF_API_URL = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta"


async def get_llm_response(user_message: str) -> Optional[str]:
    """Call Hugging Face free Inference API. Returns None on failure for graceful fallback."""
    try:
        sys_open = "<" + "|system|" + ">"
        end_tag = "<" + "|end|" + ">"
        usr_open = "<" + "|user|" + ">"
        ast_open = "<" + "|assistant|" + ">"

        prompt = (
            f"{sys_open}\n{SYSTEM_PROMPT}{end_tag}\n"
            f"{usr_open}\n{user_message}{end_tag}\n"
            f"{ast_open}\n"
        )

        hf_token = _os.environ.get("HF_API_TOKEN", "")
        headers = {"Content-Type": "application/json"}
        if hf_token:
            headers["Authorization"] = f"Bearer {hf_token}"

        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 200,
                "temperature": 0.7,
                "top_p": 0.9,
                "return_full_text": False,
            },
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(HF_API_URL, json=payload, headers=headers)

        if resp.status_code != 200:
            logger.warning(f"HF API returned {resp.status_code}: {resp.text[:200]}")
            return None

        data = resp.json()
        if isinstance(data, list) and len(data) > 0:
            text = data[0].get("generated_text", "").strip()
            # Clean up any remaining special tokens
            for tag in [end_tag, sys_open, usr_open, ast_open]:
                text = text.replace(tag, "")
            return text.strip() if text.strip() else None
        return None
    except Exception as e:
        logger.warning(f"LLM call failed: {e}")
        return None


@router.post("/chat", response_model=ChatResponse)
async def chat_with_bot(message: ChatMessage):
    """Chat endpoint - tries LLM first, falls back to keyword matching."""
    llm_response = await get_llm_response(message.message)

    if llm_response:
        response_type = get_response_type(message.message)
        suggestions = []
        if response_type in ["greeting", "help"]:
            suggestions = random.sample(SUGGESTIONS, 3)
        return ChatResponse(response=llm_response, suggestions=suggestions)

    # Fallback to keyword matching
    return get_fallback_response(message.message)


@router.post("/collect-lead", response_model=LeadResponse)
def collect_lead(lead: LeadCreate, db: Session = Depends(get_db)):
    """Collect user information from chatbot interaction."""
    db_lead = ChatLead(
        name=lead.name.strip(),
        email=lead.email.strip(),
        phone=lead.phone.strip() if lead.phone else None,
        requirement=lead.requirement.strip() if lead.requirement else None,
        source="chatbot",
    )
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return LeadResponse(
        id=db_lead.id,
        name=db_lead.name,
        email=db_lead.email,
        message="Thank you! Our team will reach out to you shortly.",
    )
'''

with open(CHATBOT_PATH, 'w') as f:
    f.write(content.lstrip('\n'))

print(f"Written chatbot.py to {CHATBOT_PATH}")
