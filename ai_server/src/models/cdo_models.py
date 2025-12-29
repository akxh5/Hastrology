"""
Cosmic Data Object (CDO) Pydantic Models
High-fidelity data structure for pandit-level astrological calculations
"""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class PlanetPosition(BaseModel):
    """Position and state of a single planet"""
    planet: str = Field(..., description="Planet name (Sun, Moon, Mercury, etc.)")
    sign: str = Field(..., description="Zodiac sign the planet occupies")
    house: int = Field(..., ge=1, le=12, description="Whole Sign House number (1-12)")
    degree: float = Field(..., ge=0, lt=360, description="Absolute ecliptic longitude in degrees")
    sign_degree: float = Field(..., ge=0, lt=30, description="Degree within the sign (0-30)")
    speed: float = Field(..., description="Daily motion in degrees (negative = retrograde)")
    is_retrograde: bool = Field(default=False, description="True if planet is retrograde")
    dignity_score: int = Field(
        default=0, 
        ge=-5, 
        le=5, 
        description="Dignity: +5 domicile, +4 exalt, -4 detriment, -5 fall"
    )
    is_combust: bool = Field(default=False, description="Within 8.5° of Sun (weakened)")
    is_cazimi: bool = Field(default=False, description="Within 17' of Sun (empowered)")


class Aspect(BaseModel):
    """Aspect between two planets"""
    planet1: str = Field(..., description="First planet in the aspect")
    planet2: str = Field(..., description="Second planet in the aspect")
    aspect_type: Literal["conjunction", "opposition", "trine", "square", "sextile"] = Field(
        ..., description="Type of aspect"
    )
    orb: float = Field(..., ge=0, description="Orb/difference from exact aspect in degrees")
    is_applying: bool = Field(..., description="True if aspect is applying (tightening)")
    nature: Literal["hard", "soft", "neutral"] = Field(..., description="Nature of the aspect")


class TimeLordActivation(BaseModel):
    """Transit activation of the Time Lord (Lord of the Year)"""
    transiting_planet: str = Field(..., description="The transiting planet making the aspect")
    aspect_to_time_lord: str = Field(..., description="Type of aspect to Time Lord")
    orb: float = Field(..., description="Orb of the aspect")
    is_applying: bool = Field(..., description="Whether aspect is applying")
    intensity: Literal["high", "challenging", "supportive"] = Field(
        ..., description="Intensity level based on aspect type"
    )


class SectInfo(BaseModel):
    """Sect (day/night) status and its implications"""
    is_day_chart: bool = Field(..., description="True if Sun is above horizon")
    sect: Literal["Diurnal", "Nocturnal"] = Field(..., description="Chart sect")
    benefic_of_sect: str = Field(..., description="Most helpful benefic (Jupiter day, Venus night)")
    malefic_of_sect: str = Field(..., description="More manageable malefic in this sect")
    malefic_contrary_to_sect: str = Field(..., description="Most difficult malefic in this sect")
    malefic_severity: Literal["constructive", "challenging", "difficult"] = Field(
        ..., description="How harsh Saturn's influence is based on sect"
    )


class CosmicDataObject(BaseModel):
    """
    The complete Cosmic Data Object (CDO) - High-fidelity chart data
    for personalized, pandit-level astrological analysis
    """
    # Core Chart Info
    sect: SectInfo = Field(..., description="Sect status and benefic/malefic weights")
    ascendant_sign: str = Field(..., description="Rising sign (House 1)")
    ascendant_degree: float = Field(..., ge=0, lt=30, description="Degree within ascendant sign")
    is_cusp_ascendant: bool = Field(
        default=False, 
        description="True if Ascendant is within 1° of sign boundary (Cosmic Cusp)"
    )
    
    # Profections (Lord of the Year)
    profection_house: int = Field(..., ge=1, le=12, description="Current profection house (1-12)")
    time_lord: str = Field(..., description="Lord of the Year from Annual Profections")
    profection_theme: str = Field(..., description="Theme of the profected house")
    
    # Planetary Positions
    planets: List[PlanetPosition] = Field(..., description="All planetary positions")
    
    # Aspects
    aspects: List[Aspect] = Field(default_factory=list, description="Active aspects between planets")
    
    # Time Lord Activations (The "Blame Factor")
    time_lord_activations: List[TimeLordActivation] = Field(
        default_factory=list,
        description="Current transits aspecting the Time Lord"
    )
    
    # Afflictions
    afflicted_planets: List[str] = Field(
        default_factory=list,
        description="Planets with dignity_score <= -2 requiring remedies"
    )
    primary_affliction: Optional[str] = Field(
        default=None,
        description="The most afflicted planet (for Shadow Warning focus)"
    )


class CDOSummary(BaseModel):
    """Simplified CDO for AI prompt injection"""
    sect: str = Field(..., description="Diurnal or Nocturnal")
    ascendant: str = Field(..., description="e.g., 'Virgo at 16°'")
    is_cusp: bool = Field(default=False, description="Cosmic cusp alert")
    time_lord: str = Field(..., description="Lord of the Year")
    profection_house: int = Field(..., description="Current profection house")
    profection_theme: str = Field(..., description="Theme of profection house")
    major_aspect: Optional[str] = Field(
        default=None, 
        description="Most significant aspect today (e.g., 'Mars Square Saturn (Applying)')"
    )
    time_lord_activation: Optional[str] = Field(
        default=None,
        description="Transit aspecting Time Lord (e.g., 'Saturn transiting square your Time Lord Mercury')"
    )
    dignity_warning: Optional[str] = Field(
        default=None,
        description="Primary affliction if dignity < -2"
    )
    malefic_severity: str = Field(..., description="Saturn's intensity based on sect")
