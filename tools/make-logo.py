"""Builds the studio logo assets from the white master in docs/brand/.

Run with: python3 tools/make-logo.py   (needs Pillow: python3 -m pip install pillow)

Writes:
  docs/brand/logo-chain-shift-purple.png  full-size purple version of the master
  apps/game/public/assets/logo.png        the in-game logo, drawn at the game's native pixel size

The in-game copy is pixel perfect: scaled to LOGO_WIDTH on the 216x288 monitor grid and every pixel
either fully the logo colour or fully transparent (no soft edges), so it scales up sharp.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
MASTER = ROOT / "docs/brand/logo-chain-shift-white.png"
PURPLE_OUT = ROOT / "docs/brand/logo-chain-shift-purple.png"
GAME_OUT = ROOT / "apps/game/public/assets/logo.png"

# Violet #A35BFF: 5.3:1 contrast on the intro background (palette.black #07040F), above the
# WCAG AA 4.5:1 for text, while still reading clearly as purple.
PURPLE = (0xA3, 0x5B, 0xFF)
LOGO_WIDTH = 176  # native pixels; the monitor is 216 wide


def recolour(alpha: Image.Image) -> Image.Image:
    out = Image.new("RGBA", alpha.size, PURPLE + (0,))
    out.putalpha(alpha)
    return out


def main() -> None:
    master = Image.open(MASTER).convert("RGBA")
    recolour(master.getchannel("A")).save(PURPLE_OUT, optimize=True)

    alpha = master.getchannel("A").crop(master.getbbox())
    height = round(alpha.height * LOGO_WIDTH / alpha.width)
    alpha = alpha.resize((LOGO_WIDTH, height), Image.LANCZOS).point(lambda v: 255 if v >= 128 else 0)
    recolour(alpha).save(GAME_OUT, optimize=True)
    print(f"Wrote {PURPLE_OUT.relative_to(ROOT)} and {GAME_OUT.relative_to(ROOT)} ({LOGO_WIDTH}x{height})")


if __name__ == "__main__":
    main()
