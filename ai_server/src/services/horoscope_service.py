"""
Horoscope generation service using Google Gemini
Generates specific structured astro cards
"""
import json
import datetime
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from typing import Optional, Dict, Any, Tuple

from ..config.settings import settings
from ..config.logger import logger
from .cache_service import cache_service

# Available ruling planet themes
RULING_PLANET_THEMES = [
    "sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"
]

ASTRO_CARDS_PROMPT = """You are a Cosmic Co-founder & Professional Astrologer. You blend high-fidelity mystical insight with modern, snackable 'GenZ' wit.

Your Goal: Generate ONE personalized astro card for a user born on {dob} (Age: {age}) at {birth_time} in {birth_place}.
The user is looking for "acceptance audacity" - use the 'Blame Factor' to attribute their feelings to cosmic movements (e.g. "Mars is squaring your Saturn").

THEME SELECTION: Generate content according to the {ruling_planet} theme. The ruling planet should influence the overall energy, tagline, and reading style.

### 1. AGE CONTEXT & HUSTLE ALPHA
User Age: {age}
- If Under 25: Focus 'hustle_alpha' on "Growth, Breaking Noise, and Risk-taking".
- If 25-34: Focus 'hustle_alpha' on "Relationship ROI, Career Pivots, and Digital Aura".
- If 35+: Focus 'hustle_alpha' on "Optimization, Stability, Asset Protection, and Mentorship".

### 2. VIBE STATUS LOGIC & TRUTH-TO-VIBE MAPPING
Calculate a 'luck_score' (0-100) based on planetary alignments.
Map the score to 'vibe_status' and Color Theme:
- 90-100: "Stellar" (Gold/Bright)
- 70-89: "Ascending" (Green/Blue)
- 40-69: "Shaky" (Orange/Amber)
- <40: "Shadow" or "Eclipse" (Deep Purple/Void) -> TAGLINE MUST BE MYSTERIOUS (e.g. "The Stars are Whispering... Be Still").

### 3. FEW-SHOT EXAMPLES (The "North Star" for Tone)

**Example 1: High Energy / Founder Mode**
"front": {{
    "tagline": "Main character energy activated",
    "luck_score": 92,
    "vibe_status": "Stellar",
    "energy_emoji": "🚀",
    "zodiac_sign": "Aries"
}},
"back": {{
    "detailed_reading": "With Jupiter trining your natal Sun, the universe is basically handing you the mic. That restlessness? It's not anxiety, it's rocket fuel. Launch the thing.",
    "hustle_alpha": "Aggressive growth. Send the DM you've been drafting.",
    "shadow_warning": "Don't trip over your own ego.",
    "lucky_assets": {{ "number": "1", "color": "Electric Blue", "power_hour": "9 AM" }}
}}

**Example 2: Shadow Day / Reflection**
"front": {{
    "tagline": "Silence is also a strategy...",
    "luck_score": 35,
    "vibe_status": "Eclipse",
    "energy_emoji": "🌑",
    "zodiac_sign": "Scorpio"
}},
"back": {{
    "detailed_reading": "Mercury is retrograde in your communication sector, meaning words are weapons today. That confusion you feel is a protective barrier. Stay behind it.",
    "hustle_alpha": "Do not sign anything. Review mode only.",
    "shadow_warning": "Avoid confrontation between 2-4 PM.",
    "lucky_assets": {{ "number": "0", "color": "Void Black", "power_hour": "Midnight" }}
}}

**Example 3: Relationship Focus / Magnetism**
"front": {{
    "tagline": "Your aura is glitching (in a good way)",
    "luck_score": 78,
    "vibe_status": "Ascending",
    "energy_emoji": "✨",
    "zodiac_sign": "Libra"
}},
"back": {{
    "detailed_reading": "Venus is entering your house of partnerships. People are staring because you're emitting a frequency of 'yes'. Use this magnetism while it lasts.",
    "hustle_alpha": "Network ruthlessly. Your ROI is in people today.",
    "shadow_warning": "Don't promise more than you can deliver.",
    "lucky_assets": {{ "number": "22", "color": "Rose Gold", "power_hour": "6 PM" }}
}}

### 4. OUTPUT FORMAT
Return valid JSON representing a SINGLE card object with this exact structure:
{{
  "front": {{
    "tagline": "string (witty GenZ hook aligned with {ruling_planet} theme)",
    "luck_score": int (0-100),
    "vibe_status": "string (Stellar/Ascending/Shaky/Eclipse)",
    "energy_emoji": "string (single emoji)",
    "zodiac_sign": "string (user's zodiac sign)"
  }},
  "back": {{
    "detailed_reading": "string (3-4 sentences with cosmic insights aligned to {ruling_planet})",
    "hustle_alpha": "string (actionable advice based on age and {ruling_planet} energy)",
    "shadow_warning": "string (specific precaution aligned to {ruling_planet} shadow)",
    "lucky_assets": {{
      "number": "string (lucky number, can be integer or special like '11:11')",
      "color": "string (color name like 'Crimson Red', 'Gold', etc.)",
      "power_hour": "string (time like '11:11 AM' or '2 PM')"
    }}
  }},
  "ruling_planet": "string (must be '{ruling_planet}')"
}}

IMPORTANT:
- Return ONLY valid JSON (no markdown, no code blocks).
- The 'ruling_planet' field should match the theme provided: '{ruling_planet}'.
- Ensure 'luck_score' is an integer between 0-100.
- Ensure 'vibe_status' matches the luck_score ranges:
  * 90-100: "Stellar"
  * 70-89: "Ascending"
  * 40-69: "Shaky"
  * <40: "Eclipse" or "Shadow"
- The tagline, reading, and advice should all reflect the {ruling_planet} theme's energy.
"""

class HoroscopeService:
    """Service for generating structured horoscope cards using AI"""

    def __init__(self):
        """Initialize the Gemini model"""
        try:
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                google_api_key=settings.google_api_key,
                temperature=0.85 
            )
            logger.info("Gemini model initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini model: {e}")
            raise

        self.prompt = ChatPromptTemplate.from_template(ASTRO_CARDS_PROMPT)
        self.chain = self.prompt | self.llm | StrOutputParser()

    def _parse_date(self, dob_str: str) -> datetime.date:
        """Parse DOB string in various formats to date object"""
        # Try different date formats
        formats = [
            "%Y-%m-%d",  # 1995-04-20
            "%B %d, %Y",  # April 20, 1995
            "%b %d, %Y",  # Apr 20, 1995
            "%d/%m/%Y",   # 20/04/1995
            "%m/%d/%Y",   # 04/20/1995
        ]
        
        for fmt in formats:
            try:
                return datetime.datetime.strptime(dob_str.strip(), fmt).date()
            except ValueError:
                continue
        
        raise ValueError(f"Unable to parse date: {dob_str}")

    def _calculate_age(self, dob_str: str) -> int:
        """Calculate age from DOB string (supports multiple formats)"""
        try:
            birth_date = self._parse_date(dob_str)
            today = datetime.date.today()
            age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            return age
        except Exception as e:
            logger.error(f"Error calculating age for dob {dob_str}: {e}")
            return 25 # Default fallback

    def _parse_cards_response(self, response_text: str, expected_theme: str) -> Dict[str, Any]:
        """
        Parse the AI response into structured single card data
        """
        try:
            # Clean up the response
            cleaned = response_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            data = json.loads(cleaned)
            
            # Handle both "ruling_planet" and "ruling_planet_theme" for backwards compatibility
            if "ruling_planet_theme" in data:
                data["ruling_planet"] = data.pop("ruling_planet_theme")
            
            # Validate structure
            if "front" not in data or "back" not in data:
                logger.warning("AI response missing front/back structure. Using fallback.")
                return self._get_fallback_card(expected_theme)
            
            # Ensure ruling_planet is set
            if "ruling_planet" not in data:
                data["ruling_planet"] = expected_theme
            
            # Validate front structure
            front = data["front"]
            required_front_fields = ["tagline", "luck_score", "vibe_status", "energy_emoji", "zodiac_sign"]
            if not all(field in front for field in required_front_fields):
                logger.warning("AI response missing required front fields. Using fallback.")
                return self._get_fallback_card(expected_theme)
            
            # Validate back structure
            back = data["back"]
            required_back_fields = ["detailed_reading", "hustle_alpha", "shadow_warning", "lucky_assets"]
            if not all(field in back for field in required_back_fields):
                logger.warning("AI response missing required back fields. Using fallback.")
                return self._get_fallback_card(expected_theme)
            
            # Validate lucky_assets structure
            if "lucky_assets" in back:
                assets = back["lucky_assets"]
                required_assets_fields = ["number", "color", "power_hour"]
                if not all(field in assets for field in required_assets_fields):
                    logger.warning("AI response missing required lucky_assets fields. Using fallback.")
                    return self._get_fallback_card(expected_theme)

            return data

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse card JSON: {e}")
            logger.error(f"Raw response: {response_text[:500]}")
            return self._get_fallback_card(expected_theme)

    def _get_fallback_card(self, theme: str = "mars") -> Dict[str, Any]:
        """Generate fallback card with new structure if AI parsing fails"""
        # Minimal fallback to avoid crash, matching new schema
        return {
            "front": {
                "tagline": "Cosmic interference detected...",
                "luck_score": 50,
                "vibe_status": "Shaky",
                "energy_emoji": "👾",
                "zodiac_sign": "Unknown"
            },
            "back": {
                "detailed_reading": "The stars are currently rebooting. Mercury might be tripping over a cable.",
                "hustle_alpha": "Pause and reflect.",
                "shadow_warning": "Avoid making big decisions right now.",
                "lucky_assets": {
                    "number": "404",
                    "color": "Gray",
                    "power_hour": "Now"
                }
            },
            "ruling_planet": theme
        }

    def _determine_theme(self, dob: str, birth_time: str) -> str:
        """
        Determine ruling planet theme based on birth details
        For now, we'll use a simple rotation based on day of year
        In the future, this could use actual astrological calculations
        """
        try:
            birth_date = self._parse_date(dob)
            day_of_year = birth_date.timetuple().tm_yday
            theme_index = day_of_year % len(RULING_PLANET_THEMES)
            return RULING_PLANET_THEMES[theme_index]
        except Exception as e:
            logger.warning(f"Error determining theme, defaulting to mars: {e}")
            return "mars"

    async def generate_horoscope(
        self,
        dob: str,
        birth_time: str,
        birth_place: str,
        use_cache: bool = True,
        theme: str = None
    ) -> Tuple[Dict[str, Any], bool]:
        """
        Generate personalized horoscope card (single card)
        """
        # Determine theme if not provided
        if not theme:
            theme = self._determine_theme(dob, birth_time)
        
        if use_cache:
            cached_horoscope = cache_service.get(dob, birth_time, birth_place)
            if cached_horoscope:
                try:
                    cached_data = json.loads(cached_horoscope)
                    # Check if cached data matches theme (or if it's a single card)
                    if isinstance(cached_data, dict) and "front" in cached_data and "back" in cached_data:
                        if cached_data.get("ruling_planet") == theme or cached_data.get("ruling_planet_theme") == theme:
                            return cached_data, True
                except json.JSONDecodeError:
                    pass

        try:
            age = self._calculate_age(dob)
            logger.info(f"Generating horoscope card for Age: {age}, Theme: {theme}")

            response_text = await self.chain.ainvoke({
                "dob": dob,
                "age": str(age),
                "birth_time": birth_time,
                "birth_place": birth_place,
                "ruling_planet": theme
            })

            card_data = self._parse_cards_response(response_text, theme)

            if use_cache:
                cache_service.set(dob, birth_time, birth_place, json.dumps(card_data))

            return card_data, False

        except Exception as e:
            logger.error(f"Error generating horoscope card: {e}")
            raise Exception(f"Failed to generate horoscope: {str(e)}")


# Global service instance
horoscope_service = HoroscopeService()

