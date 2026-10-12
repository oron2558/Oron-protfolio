import sys
from PIL import Image
m = sys.argv[1]
def save(im, name, q=78): im.save(f"{m}/{name}", "WEBP", quality=q, method=6)
r = Image.open(f"{m}/g-red.webp").convert("RGB"); save(r.resize((240, 320), Image.LANCZOS), "g-red-s.webp", 80)
p = Image.open(f"{m}/dana-portrait.webp").convert("RGB")  # 900x1592
p = p.crop((0, 40, 900, 40 + 1350)).resize((480, 720), Image.LANCZOS); save(p, "dana-portrait-n.webp", 80)
print("ok")
