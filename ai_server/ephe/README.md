# Swiss Ephemeris Data Files (JPL DE431)

This directory stores the high-precision ephemeris data files required by `pyswisseph` for NASA-grade astronomical calculations.

## Required Files

For professional astrological calculations, download the following files from the [Swiss Ephemeris FTP](https://www.astro.com/ftp/swisseph/ephe/):

### Essential (Required)
| File | Size | Description |
|------|------|-------------|
| `sepl_18.se1` | ~9 MB | Planets 1800-2399 AD |
| `semo_18.se1` | ~13 MB | Moon 1800-2399 AD |
| `seas_18.se1` | ~0.5 MB | Asteroids |

### Extended Range (Optional)
- `sepl_06.se1` - Planets 600-1799 AD
- `sepl_24.se1` - Planets 2400-3027 AD

## Download Instructions

### Option 1: Direct Download
```bash
cd /Users/harshkasana/PROJECTS/hastrology/ai_server/ephe

# Essential files
curl -O https://www.astro.com/ftp/swisseph/ephe/sepl_18.se1
curl -O https://www.astro.com/ftp/swisseph/ephe/semo_18.se1
curl -O https://www.astro.com/ftp/swisseph/ephe/seas_18.se1
```

### Option 2: Full Archive
Download the complete package from:
https://www.astro.com/ftp/swisseph/ephe/archive_gzip/

```bash
wget https://www.astro.com/ftp/swisseph/ephe/archive_gzip/sweph_18.tar.gz
tar -xzf sweph_18.tar.gz
```

## Fallback Mode

If ephemeris files are not found, the service will automatically fall back to the **Moshier method** (built into pyswisseph). This provides slightly lower precision but requires no external files.

| Method | Moon Precision | Notes |
|--------|---------------|-------|
| JPL DE431 (.se1) | Sub-arcsecond | Professional grade |
| Moshier | ~2 arcminutes | Acceptable fallback |

## Configuration

Set the ephemeris path in `.env`:
```
EPHEMERIS_PATH=./ephe
```

> **Note**: The `.se1` files are binary data files and should NOT be committed to git. They are added to `.gitignore`.
