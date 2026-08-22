#!/usr/bin/env python3
"""
generate_scenes.py — Generate self-contained glTF 2.0 (GLB) Hubs scene
archetypes for the per-element learning rooms.

Design mandate (human architecture + composition):
  * Golden ratio φ ≈ 1.618 for the room envelope:
      H = φ² m ≈ 2.618 (human-scale ceiling)
      W = φ·H  ≈ 4.236
      D = φ·W  ≈ 6.854
  * Golden-point focal axis: the element pedestal sits at
      (0.382·W, 0.618·D) offset from centre — never dead-centre.
      The back-wall light panel + floor inlay share this axis, so the
      room reads as one composed focal line (rule of thirds / φ).
  * Fibonacci sizing ladder (3,5,8,13,21,34,55) for plinth heights,
    baseboard height, panel size, decorative spacing.
  * Chemie palette per archetype.

Output: scripts/hubs-scenes/out/<archetype>.glb  (5 files)

No external glTF library required — raw GLB packing.
"""
import math
import json
import struct
import os

PHI = 1.6180339887

# ---- chemie palette (linear-ish RGB 0..1) ----
C = {
    "blue":   (0.118, 0.388, 0.702),   # #1e63b3
    "gold":   (0.878, 0.659, 0.180),   # #e0a82e
    "teal":   (0.102, 0.651, 0.627),   # #1aa6a0
    "ember":  (0.878, 0.325, 0.102),   # #e0531a
    "bone":   (0.949, 0.937, 0.902),   # #f2efe6
    "floor":  (0.851, 0.831, 0.784),   # #d9d4c8
    "sky_top":(0.043, 0.239, 0.400),   # #0b3d66
    "white":  (0.96, 0.96, 0.96),
    "warm":   (0.90, 0.86, 0.78),
}

ARCHETYPES = {
    "ElementRoom":      dict(accent=C["blue"],  floor=C["floor"], wall=(0.80,0.86,0.92), ceil=(0.90,0.93,0.97), ped=C["blue"],  label="ELEMENT RAUM"),
    "PeriodicPavilion": dict(accent=C["gold"],  floor=C["warm"],  wall=C["bone"],        ceil=C["bone"],        ped=C["gold"],  label="PERIODEN-PAVILLON", grid=True),
    "LabWing":          dict(accent=C["teal"],  floor=C["floor"], wall=(0.82,0.92,0.90), ceil=(0.90,0.96,0.95), ped=C["teal"],  label="LABOR-BEREICH"),
    "ExperimentalRoom": dict(accent=C["ember"], floor=(0.80,0.78,0.76), wall=(0.95,0.88,0.82), ceil=(0.93,0.90,0.87), ped=C["ember"], label="EXPERIMENTAL-RAUM"),
    "Lobby":            dict(accent=C["bone"],  floor=C["bone"],  wall=C["white"],       ceil=C["white"],       ped=(0.85,0.88,0.92), label="EMPFANG"),
}


# ----------------------------------------------------------------------------
# GLB writer
# ----------------------------------------------------------------------------
class Gltf:
    def __init__(self):
        self.buffer = bytearray()
        self.json = {
            "asset": {"version": "2.0", "generator": "chemie-hubs-scene-gen"},
            "scenes": [{"nodes": []}],
            "nodes": [], "meshes": [], "materials": [],
            "textures": [], "images": [], "accessors": [], "bufferViews": [],
            "samplers": [{"magFilter": 9729, "minFilter": 9729, "wrapS": 10497, "wrapT": 10497}],
        }
        self._off = 0

    def _align(self):
        while self._off % 4:
            self.buffer.append(0); self._off += 1

    def _view(self, data, target=None):
        self._align()
        start = self._off
        self.buffer.extend(data)
        self._off += len(data)
        bv = {"buffer": 0, "byteOffset": start, "byteLength": len(data)}
        if target:
            bv["target"] = target
        self.json["bufferViews"].append(bv)
        return len(self.json["bufferViews"]) - 1

    def _vec3(self, vecs):
        d = b"".join(struct.pack("<3f", *v) for v in vecs)
        return self._view(d, target=34962)

    def _vec2(self, vecs):
        d = b"".join(struct.pack("<2f", *v) for v in vecs)
        return self._view(d, target=34962)

    def _idx(self, idx):
        mx = max(idx) if idx else 0
        if mx > 65535:
            d = b"".join(struct.pack("<I", i) for i in idx); ct = 5125
        else:
            d = b"".join(struct.pack("<H", i) for i in idx); ct = 5123
        return self._view(d, target=34963), ct

    def accessor(self, bv, ct, count, kind, minmax=None):
        a = {"bufferView": bv, "componentType": ct, "count": count, "type": kind}
        if minmax:
            a["min"], a["max"] = minmax
        self.json["accessors"].append(a)
        return len(self.json["accessors"]) - 1

    def mesh(self, pos, nor, uv, idx, mat):
        pbi = self._vec3(pos); nbi = self._vec3(nor); ubi = self._vec2(uv)
        ibi, ict = self._idx(idx)
        xs = [p[0] for p in pos]; ys = [p[1] for p in pos]; zs = [p[2] for p in pos]
        pa = self.accessor(pbi, 5126, len(pos), "VEC3", minmax=([min(xs), min(ys), min(zs)], [max(xs), max(ys), max(zs)]))
        na = self.accessor(nbi, 5126, len(nor), "VEC3")
        ua = self.accessor(ubi, 5126, len(uv), "VEC2")
        ia = self.accessor(ibi, ict, len(idx) // 3, "SCALAR")
        self.json["meshes"].append({"primitives": [{"attributes": {"POSITION": pa, "NORMAL": na, "TEXCOORD_0": ua}, "indices": ia, "material": mat}]})
        return len(self.json["meshes"]) - 1

    def node(self, mesh=None, translation=None, rotation=None, scale=None):
        n = {}
        if mesh is not None:
            n["mesh"] = mesh
        if translation:
            n["translation"] = translation
        if rotation:
            n["rotation"] = rotation
        if scale:
            n["scale"] = scale
        self.json["nodes"].append(n)
        self.json["scenes"][0]["nodes"].append(len(self.json["nodes"]) - 1)
        return len(self.json["nodes"]) - 1

    def material(self, color=(0.8, 0.8, 0.8), metallic=0.0, roughness=0.9, emissive=(0, 0, 0), tex=None, double=False):
        pbr = {"baseColorFactor": [color[0], color[1], color[2], 1.0], "metallicFactor": metallic, "roughnessFactor": roughness}
        if tex is not None:
            pbr["baseColorTexture"] = {"index": tex}
        m = {"pbrMetallicRoughness": pbr, "emissiveFactor": list(emissive), "doubleSided": double}
        self.json["materials"].append(m)
        return len(self.json["materials"]) - 1

    def texture(self, img):
        import io
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        png = buf.getvalue()
        self._align()
        start = self._off
        self.buffer.extend(png)
        self._off += len(png)
        while self._off % 4:
            self.buffer.append(0); self._off += 1
        bv = {"buffer": 0, "byteOffset": start, "byteLength": len(png)}
        self.json["bufferViews"].append(bv)
        self.json["images"].append({"bufferView": len(self.json["bufferViews"]) - 1, "mimeType": "image/png"})
        self.json["textures"].append({"source": len(self.json["images"]) - 1})
        return len(self.json["textures"]) - 1

    def export(self, path):
        self.json["buffers"] = [{"byteLength": self._off}]
        js = json.dumps(self.json, separators=(",", ":")).encode("utf-8")
        while len(js) % 4:
            js += b" "
        binb = bytes(self.buffer)
        while len(binb) % 4:
            binb += b"\x00"
        total = 12 + 8 + len(js) + 8 + len(binb)
        out = struct.pack("<III", 0x46546C67, 2, total)
        out += struct.pack("<II", len(js), 0x4E4F534A) + js
        out += struct.pack("<II", len(binb), 0x004E4942) + binb
        with open(path, "wb") as f:
            f.write(out)


# ----------------------------------------------------------------------------
# geometry helpers
# ----------------------------------------------------------------------------
def unit_cube():
    faces = [
        ([(0.5, -0.5, -0.5), (0.5, 0.5, -0.5), (0.5, 0.5, 0.5), (0.5, -0.5, 0.5)], [1, 0, 0]),
        ([(-0.5, -0.5, 0.5), (-0.5, 0.5, 0.5), (-0.5, 0.5, -0.5), (-0.5, -0.5, -0.5)], [-1, 0, 0]),
        ([(-0.5, 0.5, -0.5), (-0.5, 0.5, 0.5), (0.5, 0.5, 0.5), (0.5, 0.5, -0.5)], [0, 1, 0]),
        ([(-0.5, -0.5, 0.5), (-0.5, -0.5, -0.5), (0.5, -0.5, -0.5), (0.5, -0.5, 0.5)], [0, -1, 0]),
        ([(-0.5, -0.5, 0.5), (0.5, -0.5, 0.5), (0.5, 0.5, 0.5), (-0.5, 0.5, 0.5)], [0, 0, 1]),
        ([(0.5, -0.5, -0.5), (-0.5, -0.5, -0.5), (-0.5, 0.5, -0.5), (0.5, 0.5, -0.5)], [0, 0, -1]),
    ]
    pos, nor, uv, idx = [], [], [], []
    for verts, n in faces:
        base = len(pos)
        for i, v in enumerate(verts):
            pos.append(v); nor.append(n); uv.append([i % 2, (i // 2) % 2])
        idx += [base, base + 1, base + 2, base, base + 2, base + 3]
    return pos, nor, uv, idx


def unit_quad():
    pos = [(-0.5, -0.5, 0), (0.5, -0.5, 0), (0.5, 0.5, 0), (-0.5, 0.5, 0)]
    nor = [(0, 0, 1)] * 4
    uv = [(0, 0), (1, 0), (1, 1), (0, 1)]
    return pos, nor, uv, [0, 1, 2, 0, 2, 3]


def cylinder(r, h, seg=20):
    pos, nor, uv, idx = [], [], [], []
    for i in range(seg):
        a0 = 2 * math.pi * i / seg; a1 = 2 * math.pi * (i + 1) / seg
        x0, z0 = math.cos(a0) * r, math.sin(a0) * r
        x1, z1 = math.cos(a1) * r, math.sin(a1) * r
        base = len(pos)
        pos += [(x0, 0, z0), (x1, 0, z1), (x1, h, z1), (x0, h, z0)]
        nor += [(math.cos(a0), 0, math.sin(a0)), (math.cos(a1), 0, math.sin(a1)), (math.cos(a1), 0, math.sin(a1)), (math.cos(a0), 0, math.sin(a0))]
        uv += [(i / seg, 0), ((i + 1) / seg, 0), ((i + 1) / seg, 1), (i / seg, 1)]
        idx += [base, base + 1, base + 2, base, base + 2, base + 3]
    c = len(pos); pos.append((0, 0, 0)); nor.append((0, -1, 0)); uv.append((0.5, 0.5))
    for i in range(seg):
        a0 = 2 * math.pi * i / seg; a1 = 2 * math.pi * (i + 1) / seg
        base = len(pos)
        pos += [(math.cos(a0) * r, 0, math.sin(a0) * r), (math.cos(a1) * r, 0, math.sin(a1) * r)]
        nor += [(0, -1, 0), (0, -1, 0)]
        uv += [(0.5 + math.cos(a0) * 0.5, 0.5 + math.sin(a0) * 0.5), (0.5 + math.cos(a1) * 0.5, 0.5 + math.sin(a1) * 0.5)]
        idx += [c, base + 1, base]
    c = len(pos); pos.append((0, h, 0)); nor.append((0, 1, 0)); uv.append((0.5, 0.5))
    for i in range(seg):
        a0 = 2 * math.pi * i / seg; a1 = 2 * math.pi * (i + 1) / seg
        base = len(pos)
        pos += [(math.cos(a0) * r, h, math.sin(a0) * r), (math.cos(a1) * r, h, math.sin(a1) * r)]
        nor += [(0, 1, 0), (0, 1, 0)]
        uv += [(0.5 + math.cos(a0) * 0.5, 0.5 + math.sin(a0) * 0.5), (0.5 + math.cos(a1) * 0.5, 0.5 + math.sin(a1) * 0.5)]
        idx += [c, base, base + 1]
    return pos, nor, uv, idx


def quat(axis, angle):
    x, y, z = axis
    s = math.sin(angle / 2)
    return [x * s, y * s, z * s, math.cos(angle / 2)]


def box_node(g, mat, size, pos, rot=None):
    return g.node(mesh=g.mesh(*unit_cube(), mat), translation=list(pos), rotation=rot, scale=list(size))


# ----------------------------------------------------------------------------
# textures (Pillow)
# ----------------------------------------------------------------------------
def signage_texture(label, accent):
    from PIL import Image, ImageDraw, ImageFont
    w, h = 512, 320  # ≈ φ ratio
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    ac = tuple(int(c * 255) for c in accent)
    # golden-section band
    d.rectangle([0, int(h * 0.30), w, int(h * 0.70)], fill=ac + (235,))
    # thin rule-of-thirds lines
    d.line([(0, int(h * 0.30)), (w, int(h * 0.30))], fill=(255, 255, 255, 160), width=3)
    d.line([(0, int(h * 0.70)), (w, int(h * 0.70))], fill=(255, 255, 255, 160), width=3)
    try:
        f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 46)
    except Exception:
        f = ImageFont.load_default()
    words = label.split()
    lines, cur = [], ""
    for wd in words:
        if len(cur + " " + wd) <= 14:
            cur = (cur + " " + wd).strip()
        else:
            lines.append(cur); cur = wd
    if cur:
        lines.append(cur)
    ty = h * 0.5 - (len(lines) * 50) / 2
    for ln in lines:
        d.text((w / 2, ty), ln, font=f, fill=(255, 255, 255, 255), anchor="mm")
        ty += 50
    return img


def grid_texture():
    from PIL import Image, ImageDraw
    w = h = 512
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    n = 8
    cell = w // n
    import random
    random.seed(7)
    for r in range(n):
        for c in range(n):
            shade = 200 + (r * n + c) % 40
            fill = (shade, shade, int(shade * 0.9), 60)
            d.rectangle([c * cell + 4, r * cell + 4, (c + 1) * cell - 4, (r + 1) * cell - 4], outline=(224, 168, 46, 120), width=2, fill=fill)
            if random.random() < 0.18:
                d.rectangle([c * cell + 10, r * cell + 10, (c + 1) * cell - 10, (r + 1) * cell - 10], fill=(30, 99, 179, 140))
    return img


# ----------------------------------------------------------------------------
# room builder
# ----------------------------------------------------------------------------
def build_room(arch_name, cfg):
    g = Gltf()
    W, H, D = 4.236, 2.618, 6.854
    quad = unit_quad()
    accent = cfg["accent"]

    mat_floor = g.material(cfg["floor"], roughness=0.95, double=True)
    mat_ceil = g.material(cfg["ceil"], roughness=1.0, double=True)
    mat_wall = g.material(cfg["wall"], roughness=0.9, double=True)
    # emissive accent materials give "light" without scene lights
    mat_panel  = g.material(accent, metallic=0.1, roughness=0.6, emissive=tuple(0.22 * c for c in accent))
    mat_base   = g.material(accent, roughness=0.7, emissive=tuple(0.06 * c for c in accent))
    mat_inlay  = g.material(accent, roughness=0.85, emissive=tuple(0.10 * c for c in accent))
    mat_ped    = g.material(cfg["ped"], metallic=0.1, roughness=0.55)
    mat_pedcap = g.material(accent, metallic=0.2, roughness=0.4)

    # ---- shell: floor / ceiling / 4 walls (golden-ratio envelope) ----
    g.node(mesh=g.mesh(*quad, mat_floor), rotation=quat((1, 0, 0), -math.pi / 2), scale=[W, D, 1])
    g.node(mesh=g.mesh(*quad, mat_ceil), rotation=quat((1, 0, 0), math.pi / 2), translation=[0, H, 0], scale=[W, D, 1])
    g.node(mesh=g.mesh(*quad, mat_wall), translation=[0, H / 2, -D / 2], scale=[W, H, 1])           # back
    g.node(mesh=g.mesh(*quad, mat_wall), rotation=quat((0, 1, 0), math.pi), translation=[0, H / 2, D / 2], scale=[W, H, 1])  # front
    g.node(mesh=g.mesh(*quad, mat_wall), rotation=quat((0, 1, 0), math.pi / 2), translation=[-W / 2, H / 2, 0], scale=[D, H, 1])  # left
    g.node(mesh=g.mesh(*quad, mat_wall), rotation=quat((0, 1, 0), -math.pi / 2), translation=[W / 2, H / 2, 0], scale=[D, H, 1])  # right

    # periodic-pavilion back wall uses the period grid
    if cfg.get("grid"):
        tex = g.texture(grid_texture())
        g.node(mesh=g.mesh(*quad, g.material((1, 1, 1), roughness=0.95, tex=tex, double=True)),
               translation=[0, H / 2, -D / 2 + 0.02], scale=[W, H, 1])

    # ---- golden-point focal axis: (x,z) = (0.382W, 0.618D) ----
    px = W * (0.382 - 0.5)   # ≈ -0.5
    pz = D * (0.618 - 0.5)   # ≈ +0.81

    # back-wall light panel on the focal axis (golden-section height)
    if not cfg.get("grid"):
        g.node(mesh=g.mesh(*quad, mat_panel), translation=[px, H * 0.5, -D / 2 + 0.04], scale=[1.6, H * 0.618, 1])

    # floor inlay (golden-ratio square) under the focal point
    g.node(mesh=g.mesh(*quad, mat_inlay), rotation=quat((1, 0, 0), -math.pi / 2),
           translation=[px, 0.012, pz], scale=[1.6, 1.6, 1])

    # baseboard (Fibonacci height 0.13) around the perimeter
    bh = 0.13
    g.node(mesh=g.mesh(*quad, mat_base), translation=[0, bh / 2, -D / 2 + 0.02], scale=[W, bh, 1])
    g.node(mesh=g.mesh(*quad, mat_base), rotation=quat((0, 1, 0), math.pi), translation=[0, bh / 2, D / 2 - 0.02], scale=[W, bh, 1])
    g.node(mesh=g.mesh(*quad, mat_base), rotation=quat((0, 1, 0), math.pi / 2), translation=[-W / 2 + 0.02, bh / 2, 0], scale=[D, bh, 1])
    g.node(mesh=g.mesh(*quad, mat_base), rotation=quat((0, 1, 0), -math.pi / 2), translation=[W / 2 - 0.02, bh / 2, 0], scale=[D, bh, 1])

    # ---- two-tier Fibonacci pedestal (0.55 + 0.45 = 1.0 m, human scale) ----
    box_node(g, mat_ped, (1.2, 0.55, 1.2), (px, 0.275, pz))
    box_node(g, mat_pedcap, (0.8, 0.45, 0.8), (px, 0.775, pz))
    box_node(g, mat_pedcap, (0.84, 0.04, 0.84), (px, 1.02, pz))  # gold cap lip

    # signage plaque on the focal axis, facing room centre (-Z) at eye-ish level
    tex = g.texture(signage_texture(cfg["label"], accent))
    mat_sign = g.material((1, 1, 1), roughness=0.7, tex=tex, double=True)
    g.node(mesh=g.mesh(*quad, mat_sign), rotation=quat((0, 1, 0), math.pi),
           translation=[px, 1.30, pz - 0.43], scale=[1.4, 0.875, 1])

    # ---- archetype-specific Fibonacci decorations ----
    if arch_name == "LabWing":
        mat_bench = g.material((0.7, 0.75, 0.74), roughness=0.8)
        for k in (-1, 1):
            box_node(g, mat_bench, (2.0, 0.55, 0.6), (k * 1.236, 0.275, -0.5))   # Fibonacci 1.236 spacing
        mat_col = g.material(accent, metallic=0.2, roughness=0.5)
        for k in (-1, 1):
            cy = cylinder(0.12, 2.0, 14)
            g.node(mesh=g.mesh(*cy, mat_col), translation=[k * 1.618, 1.0, 1.8])
    elif arch_name == "ExperimentalRoom":
        mat_ves = g.material(accent, metallic=0.3, roughness=0.4, emissive=tuple(0.25 * c for c in accent))
        ves = cylinder(0.34, 1.3, 22)
        g.node(mesh=g.mesh(*ves, mat_ves), translation=[px, 1.04, pz])
        mat_ring = g.material((0.6, 0.6, 0.6), roughness=0.8)
        for i in range(8):  # Fibonacci-friendly 8 around
            a = 2 * math.pi * i / 8
            box_node(g, mat_ring, (0.12, 0.12, 0.12), (px + math.cos(a) * 1.0, 0.06, pz + math.sin(a) * 1.0))
    elif arch_name == "ElementRoom":
        mat_acc = g.material(accent, metallic=0.2, roughness=0.5)
        box_node(g, mat_acc, (0.34, 0.34, 0.34), (px + 0.9, 0.17, pz - 0.9))
    elif arch_name == "Lobby":
        # central low welcome bench (human-scale seating)
        mat_low = g.material(cfg["ped"], roughness=0.7)
        g.node(mesh=g.mesh(*cylinder(0.9, 0.4, 28), mat_low), translation=[0, 0.2, 0])

    return g


def main():
    out = os.path.join(os.path.dirname(__file__), "out")
    os.makedirs(out, exist_ok=True)
    for name, cfg in ARCHETYPES.items():
        g = build_room(name, cfg)
        path = os.path.join(out, f"{name}.glb")
        g.export(path)
        print(f"wrote {path}  ({len(g.json['nodes'])} nodes, {len(g.json['meshes'])} meshes)")


if __name__ == "__main__":
    main()
