import json
import re
import datetime
from typing import Optional, Dict, Any, Tuple
from pydantic import BaseModel, Field, validator

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.exceptions import OutputParserException

from ..config.settings import settings
from ..config.logger import logger
from .cache_service import cache_service

# --- Pydantic Models for Strict Schema Enforcement ---

class LuckyAssets(BaseModel):
    number: str = Field(..., description="Lucky number or special time like 11:11")
    color: str = Field(..., description="A descriptive color name")
    power_hour: str = Field(..., description="A specific time of day")

class HoroscopeFront(BaseModel):
    tagline: str = Field(..., description="Witty GenZ hook")
    luck_score: int = Field(..., ge=0, le=100)
    vibe_status: str = Field(..., description="Stellar, Ascending, Shaky, or Eclipse")
    energy_emoji: str
    zodiac_sign: str

class HoroscopeBack(BaseModel):
    detailed_reading: str
    hustle_alpha: str
    shadow_warning: str
    lucky_assets: LuckyAssets

class AstroCard(BaseModel):
    front: HoroscopeFront
    back: HoroscopeBack
    ruling_planet: str

# --- Improved Service Implementation ---

class HoroscopeService:
    def __init__(self):
        try:
            # Using 1.5-flash for speed and better JSON adherence
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash", 
                google_api_key=settings.google_api_key,
                temperature=0.8,
                max_retries=3
            )
            self.output_parser = JsonOutputParser(pydantic_object=AstroCard)
            self.prompt = ChatPromptTemplate.from_template(
                template=ASTRO_CARDS_PROMPT,
                partial_variables={"format_instructions": self.output_parser.get_format_instructions()}
            )
            self.chain = self.prompt | self.llm 
            logger.info("Gemini 1.5-Flash service initialized")
        except Exception as e:
            logger.error(f"Initialization failed: {e}")
            raise

    def _get_zodiac_sign(self, day: int, month: int) -> str:
        """Determines zodiac sign to help the LLM and theme logic"""
        zodiac_map = [
            (20, "Capricorn"), (19, "Aquarius"), (20, "Pisces"), (20, "Aries"),
            (21, "Taurus"), (21, "Gemini"), (22, "Cancer"), (23, "Leo"),
            (23, "Virgo"), (23, "Libra"), (22, "Scorpio"), (21, "Sagittarius"),
            (31, "Capricorn")
        ]
        return zodiac_map[month-1][1] if day > zodiac_map[month-1][0] else zodiac_map[month-2][1]

    def _determine_theme(self, dob: str) -> str:
        """Determines ruling planet based on traditional Zodiac rulers"""
        try:
            date = self._parse_date(dob)
            sign = self._get_zodiac_sign(date.day, date.month)
            rulers = {
                "Aries": "mars", "Scorpio": "mars",
                "Taurus": "venus", "Libra": "venus",
                "Gemini": "mercury", "Virgo": "mercury",
                "Cancer": "moon", "Leo": "sun",
                "Sagittarius": "jupiter", "Pisces": "jupiter",
                "Capricorn": "saturn", "Aquarius": "saturn"
            }
            return rulers.get(sign, "jupiter")
        except:
            return "sun"

    def _get_age_segment(self, age: int) -> str:
        if age < 25: return "EARLY_HUSTLE (Growth & Risks)"
        if age < 35: return "PIVOT_ERA (ROI & Personal Brand)"
        return "LEGACY_MODE (Stability & Assets)"

    async def generate_horoscope(
        self, dob: str, birth_time: str, birth_place: str, use_cache: bool = True
    ) -> Tuple[Dict[str, Any], bool]:
        
        theme = self._determine_theme(dob)
        age = self._calculate_age(dob)
        age_segment = self._get_age_segment(age)

        if use_cache:
            cached = cache_service.get(dob, birth_time, birth_place)
            if cached:
                return json.loads(cached), True

        try:
            # Agentic Call
            raw_output = await self.chain.ainvoke({
                "dob": dob,
                "age": str(age),
                "age_segment": age_segment,
                "birth_time": birth_time,
                "birth_place": birth_place,
                "ruling_planet": theme
            })

            # Robust Parsing
            # If standard parser fails, we use regex to extract JSON from markdown blocks
            try:
                card_data = self.output_parser.parse(raw_output.content)
            except:
                match = re.search(r"\{.*\}", raw_output.content, re.DOTALL)
                if match:
                    card_data = json.loads(match.group())
                else:
                    raise OutputParserException("No JSON found in LLM response")

            # Validate against Pydantic model
            validated_card = AstroCard(**card_data)
            final_json = validated_card.model_dump()

            if use_cache:
                cache_service.set(dob, birth_time, birth_place, json.dumps(final_json))

            return final_json, False

        except Exception as e:
            logger.error(f"Generation failure: {e}")
            return self._get_fallback_card(theme), False

    def _get_fallback_card(self, theme: str) -> Dict[str, Any]:
        return AstroCard(
            front=HoroscopeFront(
                tagline="The stars are currently offline.",
                luck_score=50,
                vibe_status="Shaky",
                energy_emoji="📡",
                zodiac_sign="Unknown"
            ),
            back=HoroscopeBack(
                detailed_reading="Mercury is having a moment. Your cosmic connection is temporarily interrupted.",
                hustle_alpha="Focus on the physical world while we reconnect the astral link.",
                shadow_warning="Avoid overthinking technical glitches today.",
                lucky_assets=LuckyAssets(number="404", color="Space Gray", power_hour="Soon")
            ),
            ruling_planet=theme
        ).model_dump()