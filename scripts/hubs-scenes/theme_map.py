"""Map each element `theme` (44 distinct) to one of the 5 scene archetypes.

Tunable — reviewed after first visual pass. Archetypes:
  ElementRoom, PeriodicPavilion, LabWing, ExperimentalRoom, Lobby
"""
THEME_TO_ARCHETYPE = {
    # ElementRoom — signature chemie-blue single-element showcase (tech / science)
    "technology": "ElementRoom",
    "nuclear": "ElementRoom",
    "research": "ElementRoom",
    "medical": "ElementRoom",
    "semiconductor": "ElementRoom",
    "space": "ElementRoom",
    "aerospace": "ElementRoom",
    "science": "ElementRoom",
    "theoretical": "ElementRoom",
    "cosmic": "ElementRoom",
    "solar": "ElementRoom",
    "lighting": "ElementRoom",
    "lights": "ElementRoom",
    "light": "ElementRoom",
    "energy": "ElementRoom",
    "electric": "ElementRoom",
    "atmosphere": "ElementRoom",
    "precision": "ElementRoom",
    "radiation": "ElementRoom",
    "silicon": "ElementRoom",
    "electronics": "ElementRoom",
    # PeriodicPavilion — warm gold, showcase / history / rare
    "history": "PeriodicPavilion",
    "historical": "PeriodicPavilion",
    "precious": "PeriodicPavilion",
    "treasure": "PeriodicPavilion",
    "gem": "PeriodicPavilion",
    "skeleton": "PeriodicPavilion",
    "desert": "PeriodicPavilion",
    "security": "PeriodicPavilion",
    "protection": "PeriodicPavilion",
    # LabWing — teal, lab / industry
    "industry": "LabWing",
    "welding": "LabWing",
    "forge": "LabWing",
    "kitchen": "LabWing",
    # ExperimentalRoom — ember, reactive / experimental
    "experimental": "ExperimentalRoom",
    "toxic": "ExperimentalRoom",
    "biological": "ExperimentalRoom",
    "liquid": "ExperimentalRoom",
    "life": "ExperimentalRoom",
    "swimming": "ExperimentalRoom",
    "pyrotechnics": "ExperimentalRoom",
    "breath": "ExperimentalRoom",
    "fire": "ExperimentalRoom",
    "volcano": "ExperimentalRoom",
    # Lobby — bone, welcome / intro
    "discovery": "Lobby",
}


def archetype_for(theme):
    return THEME_TO_ARCHETYPE.get(theme, "ElementRoom")
