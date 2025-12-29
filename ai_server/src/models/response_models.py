"""
Response Pydantic models
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict


class LuckyAssets(BaseModel):
    """Lucky assets for the day"""
    number: str = Field(..., description="Lucky number")
    color: str = Field(..., description="Lucky color")
    power_hour: str = Field(..., description="Power hour (e.g. '3-4 PM')")


class HoroscopeCardFront(BaseModel):
    """Front side of the horoscope card"""
    tagline: str = Field(..., description="Witty GenZ hook")
    luck_score: int = Field(..., description="Luck score (0-100)")
    vibe_status: str = Field(..., description="Cosmic status (Stellar, Shaky, etc.)")
    energy_emoji: str = Field(..., description="Emoji representing the energy")
    zodiac_sign: str = Field(..., description="User's zodiac sign")


class HoroscopeCardBack(BaseModel):
    """Back side of the horoscope card"""
    detailed_reading: str = Field(..., description="Deep insight (3-4 sentences)")
    hustle_alpha: str = Field(..., description="Career/financial advice based on age")
    shadow_warning: str = Field(..., description="Specific precautions")
    lucky_assets: LuckyAssets = Field(..., description="Lucky assets object")


class AstroCard(BaseModel):
    """Complete astro card with front and back"""
    front: HoroscopeCardFront = Field(..., description="Front of the card")
    back: HoroscopeCardBack = Field(..., description="Back of the card")
    ruling_planet: str = Field(..., description="Ruling planet theme (sun, moon, mars, mercury, jupiter, venus, saturn)")
    
    # For backwards compatibility, allow ruling_planet_theme as alias
    @property
    def ruling_planet_theme(self) -> str:
        return self.ruling_planet


class HoroscopeResponse(BaseModel):
    """Response model for horoscope generation - single card"""
    card: AstroCard = Field(..., description="Single astro card with front and back")
    cached: Optional[bool] = Field(default=False, description="Whether response was served from cache")
    
    class Config:
        json_schema_extra = {
            "example": {
                "card": {
                    "front": {
                        "tagline": "Relentless Founder Mode",
                        "luck_score": 92,
                        "vibe_status": "Stellar",
                        "energy_emoji": "⚡️",
                        "zodiac_sign": "Leo"
                    },
                    "back": {
                        "detailed_reading": "Your solar house is radiating confidence, making this a peak day for visibility. However, Saturn's shadow suggests your internal energy doesn't match your external 'hustle'—don't burn out by noon.",
                        "hustle_alpha": "A pivot you've been considering is finally supported by the stars. Execute after lunch.",
                        "shadow_warning": "High risk of 'digital friction.' Double-check all sent emails for tone; your bluntness might be mistaken for aggression today.",
                        "lucky_assets": {
                            "number": "1",
                            "color": "Crimson",
                            "power_hour": "11:11 AM"
                        }
                    },
                    "ruling_planet_theme": "mars"
                },
                "cached": False
            }
        }


# Legacy response model for backwards compatibility
class LegacyHoroscopeResponse(BaseModel):
    """Legacy response model - single text horoscope"""
    horoscope_text: str = Field(..., description="Generated horoscope text")
    cached: Optional[bool] = Field(default=False, description="Whether response was served from cache")


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(default="ok", description="Service status")
    message: str = Field(..., description="Status message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "ok",
                "message": "Horoscope Generator API is running"
            }
        }


class ErrorResponse(BaseModel):
    """Error response model"""
    detail: str = Field(..., description="Error details")
    
    class Config:
        json_schema_extra = {
            "example": {
                "detail": "An error occurred"
            }
        }

