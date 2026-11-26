# -*- coding: utf-8 -*-
"""アプリのアイコン（片麻岩ふうの縞をもつ岩とルーペ）を作る。 python tools/make_icons.py"""
import math, os, random
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BG = (124, 63, 29)


def draw(size):
    S = 4 * size  # 大きく描いて縮める（ふちをなめらかに）
    u = S / 100
    im = Image.new("RGB", (S, S), BG)
    # 岩のかたち（角ばった多角形）
    rock = [(14, 60), (22, 34), (44, 22), (66, 26), (82, 42), (86, 64), (70, 80), (40, 82), (20, 76)]
    rock = [(x * u, y * u) for x, y in rock]
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).polygon(rock, fill=255)
    tex = Image.new("RGB", (S, S), (236, 228, 214))
    d = ImageDraw.Draw(tex)
    # 片麻状の縞（白と黒の帯、ゆるく波打つ）
    y = 14 * u
    k = 0
    while y < 92 * u:
        h = (4 + 3 * ((k * 7) % 3)) * u
        col = (52, 47, 43) if k % 2 else (236, 228, 214)
        pts = [(x * u, y + 2.2 * u * math.sin(x * 0.09 + k)) for x in range(0, 101, 4)]
        d.line(pts, fill=col, width=int(h))
        y += h * 0.9
        k += 1
    # ざくろ石の赤い粒
    rnd = random.Random(3)
    for _ in range(9):
        cx, cy, r = rnd.uniform(26, 74) * u, rnd.uniform(32, 74) * u, rnd.uniform(1.6, 2.8) * u
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(176, 38, 46))
    im.paste(tex, (0, 0), mask)
    ImageDraw.Draw(im).line(rock + [rock[0]], fill=(60, 30, 14), width=int(1.6 * u), joint="curve")
    # ルーペ
    dd = ImageDraw.Draw(im)
    cx, cy, r = 64 * u, 62 * u, 15 * u
    dd.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(255, 255, 255), width=int(4.5 * u))
    dd.line([(cx + r * 0.72, cy + r * 0.72), (cx + r * 1.6, cy + r * 1.6)], fill=(255, 255, 255), width=int(7 * u))
    return im.resize((size, size), Image.LANCZOS)


for s in (192, 512):
    draw(s).save(os.path.join(ROOT, f"icon-{s}.png"))
    print("icon", s)
