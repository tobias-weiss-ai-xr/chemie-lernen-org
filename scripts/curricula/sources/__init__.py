"""Source scrapers for each Bundesland's chemistry curriculum.

Every source module exposes a single async function:

    async def scrape() -> StateCurriculum | None:

Return None when the source is unavailable / not yet implemented.

State metadata map documents what's known about each state.
"""

from . import (
    bb, be, bw, by, hb, he, hh, mv, ni, nrw, rp, sl, sn, st, sh, th,
)

REGISTRY = {
    "bb": bb,
    "be": be,
    "bw": bw,
    "by": by,
    "hb": hb,
    "he": he,
    "hh": hh,
    "mv": mv,
    "ni": ni,
    "nrw": nrw,
    "rp": rp,
    "sl": sl,
    "sn": sn,
    "st": st,
    "sh": sh,
    "th": th,
}

STATE_META = {
    "BW": {"name": "Baden-Württemberg",  "status": "✅ working",  "format": "HTML",        "url": "https://www.bildungsplaene-bw.de"},
    "BY": {"name": "Bayern",             "status": "✅ working",  "format": "HTML",        "url": "https://www.lehrplanplus.bayern.de"},
    "BE": {"name": "Berlin",             "status": "✅ working", "format": "PDF",         "url": "https://bildungsserver.berlin-brandenburg.de/"},
    "BB": {"name": "Brandenburg",        "status": "✅ working", "format": "PDF",         "url": "https://bildungsserver.berlin-brandenburg.de/"},
    "HB": {"name": "Bremen",             "status": "✅ working", "format": "PDF",         "url": "https://www.lis.bremen.de/"},
    "HH": {"name": "Hamburg",            "status": "✅ working", "format": "PDF",         "url": "https://bildungsplaene.bildungshamburg.de/"},
    "HE": {"name": "Hessen",             "status": "✅ working", "format": "PDF",         "url": "https://kultusministerium.hessen.de/"},
    "MV": {"name": "Mecklenburg-Vorpommern", "status": "✅ working", "format": "PDF",       "url": "https://www.bildung-mv.de/"},
    "NI": {"name": "Niedersachsen",      "status": "✅ working", "format": "PDF",         "url": "https://www.nibis.de/"},
    "NW": {"name": "Nordrhein-Westfalen",  "status": "✅ working", "format": "Playwright+PDF",  "url": "https://www.schulentwicklung.nrw.de/lehrplaene/"},
    "RP": {"name": "Rheinland-Pfalz",    "status": "✅ working", "format": "PDF",         "url": "https://lehrplaene.bildung-rp.de/"},
    "SL": {"name": "Saarland",           "status": "✅ working", "format": "PDF+Playwright",  "url": "https://www.saarland.de/mbk/"},
    "SN": {"name": "Sachsen",            "status": "✅ working", "format": "HTML",        "url": "https://www.schulportal.sachsen.de/lplandb/"},
    "ST": {"name": "Sachsen-Anhalt",     "status": "✅ working", "format": "PDF",         "url": "https://www.bildung-lsa.de/"},
    "SH": {"name": "Schleswig-Holstein", "status": "✅ working", "format": "PDF",         "url": "https://fachportal.lernnetz.de/sh/fachanforderungen.html"},
    "TH": {"name": "Thüringen",          "status": "✅ working", "format": "PDF",         "url": "https://www.schulportal-thueringen.de/"},
}
