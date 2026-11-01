"""Pull a neoBotics assembly into the shop: its still image and its meshes.

    python make/neobotics.py <neoBotics build dir> <product slug> <layer>=<#colour> ...

The build dir is an assembled model's `cad/` folder, as `neobotics build
library/<category>/<item>` leaves it (results/library/.../_assembly/cad).
Its component STLs are merged into one binary STL per layer, a layer being
every mesh drawn in that colour, and written to ui/models/<slug>/<layer>.stl;
its part.png has its axis triad blanked and is cropped, scaled and written to ui/img/products/<slug>.webp.
Needs Pillow (it is in the neoBotics environment). The rows that point at
these files (products.image, meshes) live in ui/demo.js.
"""
import json
import struct
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMAGE_SIZE = 800  # longest side, px
TRIAD = (200, 220)  # the axis triad neoBotics draws in the bottom-left corner, px


def triangles(stl: Path) -> bytes:
    """The 50-byte triangle records of a binary STL."""
    data = stl.read_bytes()
    (count,) = struct.unpack_from("<I", data, 80)
    if 84 + 50 * count != len(data):
        raise SystemExit(f"{stl}: not a binary STL")
    return data[84:]


def main(cad: Path, slug: str, layers: list[str]) -> None:
    summary = json.loads((cad / "summary.json").read_text())
    by_colour = {colour.lower(): name for name, colour in (l.split("=") for l in layers)}
    merged: dict[str, list[bytes]] = {name: [] for name in by_colour.values()}
    for component in summary["components"]:
        for mesh in component["meshes"]:
            name = by_colour.get(mesh["color"].lower())
            if name is None:
                raise SystemExit(f"{component['name']}: no layer for colour {mesh['color']}")
            merged[name].append(triangles(cad / mesh["stl"]))

    out = ROOT / "ui" / "models" / slug
    out.mkdir(parents=True, exist_ok=True)
    for name, parts in merged.items():
        body = b"".join(parts)
        header = f"VequIR {slug} {name}".encode().ljust(80, b" ")
        (out / f"{name}.stl").write_bytes(header + struct.pack("<I", len(body) // 50) + body)
        print(f"{out / name}.stl  {len(body) // 50} triangles")

    image = Image.open(cad / "part.png").convert("RGBA")
    image.paste((0, 0, 0, 0), (0, image.height - TRIAD[1], TRIAD[0], image.height))
    image = image.crop(image.getbbox())
    image.thumbnail((IMAGE_SIZE, IMAGE_SIZE), Image.LANCZOS)
    still = ROOT / "ui" / "img" / "products" / f"{slug}.webp"
    still.parent.mkdir(parents=True, exist_ok=True)
    image.save(still, quality=86, method=6)
    print(f"{still}  {image.size[0]}×{image.size[1]}")


if __name__ == "__main__":
    if len(sys.argv) < 4:
        raise SystemExit(__doc__)
    main(Path(sys.argv[1]), sys.argv[2], sys.argv[3:])
