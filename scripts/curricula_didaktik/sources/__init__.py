"""Source scrapers for didactic guidelines + module catalogs.

Each source module exposes a single function:

    def scrape() -> list[DidacticGuideline] | ModuleCatalog | None:
"""

from __future__ import annotations

from . import (
    kmk,
    marburg_modulhandbuch,
    modulhandbuch_framework,
    mit_ocw,
    tum,
    eth_zurich,
    lmu_muenchen,
    rwth_aachen,
    cambridge,
    imperial,
    stanford,
    u_tokyo,
    kth,
    caltech,
    fu_berlin,
    heidelberg,
    oxford,
    tu_wien,
)

DIDAKTIK_REGISTRY = {
    "kmk": kmk,
    "marburg_modulhandbuch": marburg_modulhandbuch,
}

MODULHANDBUCH_REGISTRY = {
    "mit_ocw": mit_ocw,
    "tum": tum,
    "eth_zurich": eth_zurich,
    "lmu_muenchen": lmu_muenchen,
    "rwth_aachen": rwth_aachen,
    "cambridge": cambridge,
    "imperial": imperial,
    "stanford": stanford,
    "u_tokyo": u_tokyo,
    "kth": kth,
    "caltech": caltech,
    "fu_berlin": fu_berlin,
    "heidelberg": heidelberg,
    "oxford": oxford,
    "tu_wien": tu_wien,
}

REGISTRY = {**DIDAKTIK_REGISTRY, **MODULHANDBUCH_REGISTRY}

SOURCE_META = {
    "kmk": {
        "name": "KMK Fachprofile & Bildungsstandards",
        "status": "working",
        "url": "https://www.kmk.org/themen/allgemeinbildende-schulen/unterrichtsfaecher/chemie.html",
        "subset": "chemie",
    },
    "marburg_modulhandbuch": {
        "name": "Modulhandbuch Lehramt Chemie (Marburg)",
        "status": "user-provided",
        "url": "https://www.uni-marburg.de/de/fb15/studium/studiengaenge/lehramt-chemie",
        "subset": "chemie",
    },
    "mit_ocw": {
        "name": "MIT OpenCourseWare (chemistry)",
        "status": "working",
        "url": "https://ocw.mit.edu/courses/chemistry/",
        "subset": "modulhandbuch",
    },
    "tum": {
        "name": "TU München Chemie",
        "status": "working",
        "url": "https://www.ch.tum.de/en/bachelor-s-program-chemistry/",
        "subset": "modulhandbuch",
    },
    "eth_zurich": {
        "name": "ETH Zürich Chemie",
        "status": "working",
        "url": "https://chab.ethz.ch/",
        "subset": "modulhandbuch",
    },
    "lmu_muenchen": {
        "name": "LMU München Chemie",
        "status": "working",
        "url": "https://www.cup.uni-muenchen.de/studium/",
        "subset": "modulhandbuch",
    },
    "rwth_aachen": {
        "name": "RWTH Aachen Chemie",
        "status": "working",
        "url": "https://www.chemie.rwth-aachen.de/",
        "subset": "modulhandbuch",
    },
    "cambridge": {
        "name": "University of Cambridge Chemistry (Tripos)",
        "status": "working",
        "url": "https://www.natsci.tripos.cam.ac.uk/",
        "subset": "modulhandbuch",
    },
    "imperial": {
        "name": "Imperial College London Chemistry",
        "status": "working",
        "url": "https://www.imperial.ac.uk/chemistry/",
        "subset": "modulhandbuch",
    },
    "stanford": {
        "name": "Stanford University Chemistry",
        "status": "working",
        "url": "https://chemistry.stanford.edu/",
        "subset": "modulhandbuch",
    },
    "u_tokyo": {
        "name": "University of Tokyo Chemistry",
        "status": "working",
        "url": "https://www.chem.s.u-tokyo.ac.jp/en/",
        "subset": "modulhandbuch",
    },
    "kth": {
        "name": "KTH Royal Institute of Technology (Engineering Chemistry)",
        "status": "working",
        "url": "https://www.kth.se/student/kurser/programme/TTKEM",
        "subset": "modulhandbuch",
    },
    "caltech": {
        "name": "Caltech Chemistry & Chemical Engineering",
        "status": "working",
        "url": "https://www.cce.caltech.edu/academics/",
        "subset": "modulhandbuch",
    },
    "fu_berlin": {
        "name": "Freie Universität Berlin Chemistry & Biochemistry",
        "status": "working",
        "url": "https://www.bcp.fu-berlin.de/studium/",
        "subset": "modulhandbuch",
    },
    "heidelberg": {
        "name": "Heidelberg University Chemistry",
        "status": "working",
        "url": "https://www.uni-heidelberg.de/studium/",
        "subset": "modulhandbuch",
    },
    "oxford": {
        "name": "University of Oxford Chemistry",
        "status": "working",
        "url": "https://www.chem.ox.ac.uk/teaching/",
        "subset": "modulhandbuch",
    },
    "tu_wien": {
        "name": "TU Wien Technical Chemistry",
        "status": "working",
        "url": "https://www.tuwien.at/studium/",
        "subset": "modulhandbuch",
    },
}
