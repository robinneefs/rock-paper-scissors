"""Cuts the cabinet marquee art out of the user's "RPS Rivals" mock-up sheet (experiment).

Run with: python3 tools/make-marquee.py   (needs Pillow)

Writes apps/game/public/assets/marquee.png: 254x98 native pixels, the marquee art area of the
cabinet with the square monitor (see config/layout.ts). The sheet's marquee is 291x78, so it is
scaled to the full 98 px height and the sides are trimmed to 254 px, which keeps the logo and
tagline whole and crops into the two side portraits.
"""

from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SHEET = ROOT / "docs/mockups/redesign/mockups-game-2.png"
OUT = ROOT / "apps/game/public/assets/marquee.png"

BOX = (33, 284, 324, 362)  # the main-menu cabinet's marquee art in the sheet (291x78)
SIZE = (254, 98)


def main() -> None:
    art = Image.open(SHEET).convert("RGB").crop(BOX)
    scale = SIZE[1] / art.height
    art = art.resize((round(art.width * scale), SIZE[1]), Image.LANCZOS)
    left = (art.width - SIZE[0]) // 2
    art = art.crop((left, 0, left + SIZE[0], SIZE[1]))
    art = art.filter(ImageFilter.UnsharpMask(radius=1, percent=60, threshold=2))
    art.save(OUT)
    print(f"wrote {OUT.relative_to(ROOT)} ({art.width}x{art.height})")


if __name__ == "__main__":
    main()
