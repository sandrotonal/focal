import os
import shutil
import numpy as np
from PIL import Image
import rembg

session = rembg.new_session('u2netp')
brain_dir = r'C:\Users\ACER NİTRO\.gemini\antigravity-ide\brain\673e32f4-d76d-4a56-9d9e-b74af5b33129'
assets_dir = os.path.join(os.path.dirname(__file__), '..', 'assets', 'onboarding')

configs = [
  ('rain', 'soundscape_rain_pure_1792531826494.jpg', 32, 55.0),
  ('storm', 'soundscape_storm_pure_1792531850835.jpg', 28, 50.0),
  ('ocean', 'soundscape_ocean_pure_1792531874273.jpg', 25, 45.0),
  ('zen', 'soundscape_zen_pure_1792531925752.jpg', 22, 40.0),
]

for name, fname, luma_thresh, luma_ramp in configs:
  src = os.path.join(brain_dir, fname)
  img = Image.open(src).convert('RGB')
  
  # 1. AI segmentation for foreground silhouette
  rembg_out = rembg.remove(img, session=session)
  rembg_a = np.array(rembg_out)[:,:,3].astype(np.float32) / 255.0

  # 2. Luminance un-premultiplication & black background suppression
  arr = np.array(img, dtype=np.float32)
  r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
  max_c = np.maximum(np.maximum(r, g), b)

  luma_alpha = np.clip((max_c - luma_thresh) / luma_ramp, 0.0, 1.0)
  final_alpha = rembg_a * luma_alpha

  # Defringe & brighten glass/glow to prevent dark black halos
  alpha_boost = np.power(np.clip(final_alpha, 0.05, 1.0), 0.5)
  clean_r = np.clip(r / alpha_boost, 0, 255)
  clean_g = np.clip(g / alpha_boost, 0, 255)
  clean_b = np.clip(b / alpha_boost, 0, 255)

  # Hard threshold for near-zero alpha to guarantee 100% transparent boundaries
  mask = final_alpha > 0.04
  final_alpha = np.where(mask, final_alpha * 255.0, 0.0).astype(np.uint8)

  out_rgba = np.dstack([clean_r.astype(np.uint8), clean_g.astype(np.uint8), clean_b.astype(np.uint8), final_alpha])
  out_img = Image.fromarray(out_rgba, 'RGBA')
  
  dest = os.path.join(assets_dir, f'soundscape_{name}.png')
  out_img.save(dest)
  print(f'Successfully generated transparent soundscape: {dest}')

print('All 4 soundscapes processed with genuine 32-bit alpha transparency and zero black halos.')
