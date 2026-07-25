from PIL import Image, ImageChops, ImageFilter
from pathlib import Path

assets = Path(r"C:\Users\JoJo\.cursor\projects\g-ss\assets")
orig_light = orig_dark = None
for p in assets.glob("*.png"):
    im = Image.open(p)
    if im.size != (473, 1024):
        continue
    c = im.convert("RGB").getpixel((20, 20))
    lum = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    if lum > 100:
        orig_light = p
    else:
        orig_dark = p


def make_seamless(im: Image.Image) -> Image.Image:
    im = im.convert("RGB")
    w, h = im.size
    off = ImageChops.offset(im, w // 2, h // 2)
    src = im.load()
    o = off.load()
    out = Image.new("RGB", (w, h))
    d = out.load()
    cx = (w - 1) / 2.0
    cy = (h - 1) / 2.0
    for y in range(h):
        for x in range(w):
            ax = abs(x - cx) / cx
            ay = abs(y - cy) / cy
            t = max(ax, ay)
            t = t * t
            a = src[x, y]
            b = o[x, y]
            d[x, y] = (
                int(a[0] * (1 - t) + b[0] * t),
                int(a[1] * (1 - t) + b[1] * t),
                int(a[2] * (1 - t) + b[2] * t),
            )
    return out


def soft_rim(im: Image.Image) -> Image.Image:
    blurred = im.filter(ImageFilter.GaussianBlur(0.45))
    out = im.copy()
    sp = out.load()
    bp = blurred.load()
    w, h = out.size
    for x in range(w):
        for y in (0, 1, h - 2, h - 1):
            sp[x, y] = bp[x, y]
    for y in range(h):
        for x in (0, 1, w - 2, w - 1):
            sp[x, y] = bp[x, y]
    return out


def edge_delta(im: Image.Image) -> tuple[float, float]:
    w, h = im.size
    px = im.load()
    tb = sum(abs(px[x, 0][i] - px[x, h - 1][i]) for x in range(w) for i in range(3))
    lr = sum(abs(px[0, y][i] - px[w - 1, y][i]) for y in range(h) for i in range(3))
    return tb / (w * 3), lr / (h * 3)


def verify_tile(im: Image.Image, reps: int = 3) -> tuple[float, float]:
    w, h = im.size
    canvas = Image.new("RGB", (w * reps, h * reps))
    for yy in range(reps):
        for xx in range(reps):
            canvas.paste(im, (xx * w, yy * h))
    px = canvas.load()
    scores: list[float] = []
    for k in range(1, reps):
        x = k * w
        s = 0
        for y in range(h * reps):
            a = px[x - 1, y]
            b = px[x, y]
            s += abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])
        scores.append(s / (h * reps * 3))
    for k in range(1, reps):
        y = k * h
        s = 0
        for x in range(w * reps):
            a = px[x, y - 1]
            b = px[x, y]
            s += abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])
        scores.append(s / (w * reps * 3))
    return sum(scores) / len(scores), max(scores)


def build(path: Path, x0: int, y0: int, pw: int, ph: int, out_path: Path) -> None:
    src = Image.open(path).convert("RGB")
    tile = src.crop((x0, y0, x0 + pw * 2, y0 + ph * 2))
    seamless = soft_rim(make_seamless(tile))
    seamless.save(out_path, "PNG", optimize=True)
    tb, lr = edge_delta(seamless)
    mean_s, max_s = verify_tile(seamless)
    print(
        f"{out_path.name} {seamless.size} edge TB={tb:.2f} LR={lr:.2f} "
        f"tileSeam mean={mean_s:.2f} max={max_s:.2f}"
    )


assert orig_light and orig_dark
candidates = [
    (orig_light, 50, 220, 122, 114, Path(r"G:\webapp\public\bg-light.png")),
    (orig_dark, 50, 220, 120, 108, Path(r"G:\webapp\public\bg-dark.png")),
]
for args in candidates:
    build(*args)

# pick best among a few crops for light/dark
print("--- alternatives ---")
for y0 in (210, 230, 250):
    for pw, ph in ((122, 114), (122, 122), (120, 120)):
        tmp = Path(r"G:\webapp\public\_probe.png")
        build(orig_light, 40, y0, pw, ph, tmp)
        mean_s, max_s = verify_tile(Image.open(tmp))
        if max_s < 1.2:
            print(f"  GOOD light y0={y0} {pw}x{ph} max={max_s:.2f}")
