from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[2]
STORE_DIR = ROOT / "apps" / "extension" / "assets" / "store"
CAPTURE_DIR = ROOT / "tmp" / "store-captures"

BG = "#f4eee4"
SURFACE = "#fff9f1"
LINE = "#dfd0bc"
INK = "#231912"
MUTED = "#6d5747"
ACCENT = "#bf6233"
ACCENT_DARK = "#8f431d"
REDIRECT = "#315d42"
MINT = "#dcece3"
PEACH = "#f4e3d5"
PROMO_BG_TOP = "#3a2016"
PROMO_BG_BOTTOM = "#b45f33"
SHADOW = (55, 32, 17, 26)

FONT_REGULAR = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 24)
FONT_BODY = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 24)
FONT_SEMIBOLD = ImageFont.truetype(r"C:\Windows\Fonts\seguisb.ttf", 26)
FONT_PROMO_BODY = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 28)


def make_canvas(size: tuple[int, int]) -> Image.Image:
    image = Image.new("RGBA", size, BG)
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((1, 1, size[0] - 2, size[1] - 2), radius=28, outline=LINE, width=2)
    draw.pieslice((size[0] - 310, -90, size[0] + 80, 230), start=90, end=270, fill="#ecd8c5")
    draw.pieslice((-180, size[1] - 260, 230, size[1] + 120), start=180, end=360, fill="#d9cec0")
    return image


def make_promo_canvas(size: tuple[int, int]) -> Image.Image:
    image = Image.new("RGBA", size, PROMO_BG_BOTTOM)
    overlay = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for y in range(size[1]):
        ratio = y / max(1, size[1] - 1)
        top = tuple(int(int(PROMO_BG_TOP[i : i + 2], 16) * (1 - ratio) + int(PROMO_BG_BOTTOM[i : i + 2], 16) * ratio) for i in (1, 3, 5))
        draw.line((0, y, size[0], y), fill=top + (255,), width=1)
    image.alpha_composite(overlay)
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((18, 18, size[0] - 18, size[1] - 18), radius=34, outline=(255, 228, 206, 70), width=2)
    draw.pieslice((size[0] - 180, -40, size[0] + 120, 170), start=80, end=280, fill=(255, 227, 200, 48))
    return image


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    return mask


def wrap_lines(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        probe = word if not current else f"{current} {word}"
        if draw.textbbox((0, 0), probe, font=font)[2] <= width:
            current = probe
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_paragraph(
    draw: ImageDraw.ImageDraw,
    text: str,
    xy: tuple[int, int],
    width: int,
    font: ImageFont.FreeTypeFont,
    fill: str,
    line_gap: int = 8,
) -> int:
    x, y = xy
    lines = wrap_lines(draw, text, font, width)
    ascent, descent = font.getmetrics()
    line_height = ascent + descent
    for line in lines:
        draw.text((x, y), line, font=font, fill=fill)
        y += line_height + line_gap
    return y


def fit_title_font(draw: ImageDraw.ImageDraw, text: str, width: int, max_lines: int, *, min_size: int, max_size: int) -> ImageFont.FreeTypeFont:
    for size in range(max_size, min_size - 1, -2):
        font = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", size)
        if len(wrap_lines(draw, text, font, width)) <= max_lines:
            return font
    return ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", min_size)


def draw_left_centered_text(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: str,
    *,
    padding_left: int,
) -> None:
    bbox = draw.textbbox((0, 0), text, font=font)
    text_height = bbox[3] - bbox[1]
    x = box[0] + padding_left
    y = box[1] + ((box[3] - box[1]) - text_height) // 2 - bbox[1]
    draw.text((x, y), text, font=font, fill=fill)


def add_shadow(base: Image.Image, box: tuple[int, int, int, int], radius: int) -> None:
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    draw.rounded_rectangle((box[0], box[1] + 14, box[2], box[3] + 14), radius=radius, fill=SHADOW)
    shadow = shadow.filter(ImageFilter.GaussianBlur(20))
    base.alpha_composite(shadow)


def add_browser_card(
    base: Image.Image,
    source: Image.Image,
    crop_box: tuple[int, int, int, int],
    box: tuple[int, int, int, int],
    *,
    fit: bool = True,
) -> None:
    x0, y0, x1, y1 = box
    width = x1 - x0
    height = y1 - y0
    radius = 28
    add_shadow(base, box, radius)

    card = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(card)
    draw.rounded_rectangle((0, 0, width - 1, height - 1), radius=radius, fill=SURFACE, outline=LINE, width=2)
    draw.rounded_rectangle((14, 14, width - 14, 48), radius=16, fill="#fffdf8", outline=LINE, width=1)
    for index, color in enumerate(("#f0c7b1", "#f0d7ab", "#c7ddcb")):
        left = 28 + index * 18
        draw.ellipse((left, 24, left + 10, 34), fill=color)

    inner = source.crop(crop_box)
    target_size = (width - 24, height - 76)
    if fit:
        framed = ImageOps.fit(inner, target_size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.0))
    else:
        framed = ImageOps.contain(inner, target_size, method=Image.Resampling.LANCZOS)
    px = (width - framed.width) // 2
    py = 62 + max(0, (target_size[1] - framed.height) // 2)
    card.paste(framed, (px, py), rounded_mask(framed.size, 18))
    base.alpha_composite(card, (x0, y0))


def add_header(
    base: Image.Image,
    badge: str,
    badge_fill: str,
    badge_text: str,
    title: str,
    body: str,
) -> int:
    draw = ImageDraw.Draw(base)
    draw.text((72, 54), "PromptShield", font=FONT_SEMIBOLD, fill=MUTED)
    badge_width = draw.textbbox((0, 0), badge, font=FONT_SEMIBOLD)[2] + 34
    badge_box = (72, 92, 72 + badge_width, 132)
    draw.rounded_rectangle(badge_box, radius=20, fill=badge_fill)
    draw_left_centered_text(draw, badge_box, badge, FONT_SEMIBOLD, badge_text, padding_left=17)
    title_font = fit_title_font(draw, title, 1040, 2, min_size=38, max_size=48)
    next_y = draw_paragraph(draw, title, (72, 160), 1040, title_font, INK, line_gap=6)
    if body:
        next_y = draw_paragraph(draw, body, (72, next_y + 10), 1060, FONT_BODY, MUTED, line_gap=6)
    return next_y + 14


def render_screenshot(
    target: Path,
    badge: str,
    badge_fill: str,
    badge_text: str,
    title: str,
    body: str,
    cards: list[dict],
) -> None:
    image = make_canvas((1280, 800))
    header_bottom = add_header(image, badge, badge_fill, badge_text, title, body)
    y_shift = max(0, header_bottom - 260)
    for card in cards:
        box = card["box"]
        add_browser_card(
            image,
            card["source"],
            card["crop_box"],
            (box[0], box[1] + y_shift, box[2], box[3] + y_shift),
            fit=card.get("fit", True),
        )
    image.convert("RGB").save(target, quality=95)


def render_promo_tiles(overview: Image.Image, events: Image.Image) -> None:
    small = make_promo_canvas((440, 280))
    draw = ImageDraw.Draw(small)
    draw.text((34, 34), "PromptShield", font=ImageFont.truetype(r"C:\Windows\Fonts\seguisb.ttf", 28), fill="#fff3e8")
    promo_small_title = fit_title_font(draw, "Protect prompts in-browser.", 180, 3, min_size=22, max_size=32)
    draw_paragraph(
        draw,
        "Protect prompts in-browser.",
        (34, 78),
        170,
        promo_small_title,
        "#fffaf4",
        line_gap=4,
    )
    add_browser_card(small, events, (760, 250, 1560, 790), (252, 40, 410, 210))
    small.convert("RGB").save(STORE_DIR / "promo-tile-small.png", quality=95)

    large = make_promo_canvas((920, 680))
    draw = ImageDraw.Draw(large)
    draw.text((36, 38), "PromptShield", font=ImageFont.truetype(r"C:\Windows\Fonts\seguisb.ttf", 32), fill="#fff3e8")
    promo_large_title = fit_title_font(draw, "Protect prompts before they leave the browser.", 380, 3, min_size=38, max_size=58)
    next_y = draw_paragraph(
        draw,
        "Protect prompts before they leave the browser.",
        (36, 104),
        380,
        promo_large_title,
        "#fffaf4",
        line_gap=6,
    )
    draw_paragraph(
        draw,
        "Browser-first intervention for secrets, customer data, and rollout governance.",
        (36, next_y + 14),
        380,
        FONT_PROMO_BODY,
        "#f5e9db",
        line_gap=8,
    )
    add_browser_card(large, overview, (250, 160, 1560, 820), (470, 84, 872, 344))
    add_browser_card(large, events, (760, 240, 1560, 800), (436, 374, 884, 610))
    large.convert("RGB").save(STORE_DIR / "promo-tile-large.png", quality=95)


def main() -> None:
    events = Image.open(CAPTURE_DIR / "events-source.png").convert("RGBA")
    overview = Image.open(CAPTURE_DIR / "overview-source.png").convert("RGBA")
    users = Image.open(CAPTURE_DIR / "users-panel.png").convert("RGBA")

    render_screenshot(
        STORE_DIR / "screenshot-01-block.png",
        "Block",
        PEACH,
        ACCENT_DARK,
        "Block risky prompts before they leave the browser.",
        "",
        [
            {
                "source": events,
                "crop_box": (220, 170, 1580, 820),
                "box": (72, 284, 1208, 740),
            }
        ],
    )

    render_screenshot(
        STORE_DIR / "screenshot-02-dashboard.png",
        "Dashboard",
        MINT,
        REDIRECT,
        "Track protection pressure and response mix in one view.",
        "",
        [
            {
                "source": overview,
                "crop_box": (235, 150, 1570, 810),
                "box": (72, 284, 1208, 742),
            }
        ],
    )

    render_screenshot(
        STORE_DIR / "screenshot-03-rollout.png",
        "Rollout",
        PEACH,
        ACCENT_DARK,
        "Issue short-lived codes and confirm active installs.",
        "",
        [
            {
                "source": overview,
                "crop_box": (1080, 170, 1560, 380),
                "box": (250, 314, 1030, 538),
                "fit": True,
            },
            {
                "source": users,
                "crop_box": (0, 0, 1252, 320),
                "box": (72, 548, 1208, 742),
            },
        ],
    )

    render_promo_tiles(overview, events)


if __name__ == "__main__":
    main()
