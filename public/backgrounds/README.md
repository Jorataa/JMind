# Daily Wisdom backgrounds

The Daily Wisdom card renders a **cinematic CSS gradient** for each preset out of
the box, so it looks beautiful with no image files present. Each preset *also*
points at a photo here — when the file exists it fades in on top of the gradient
automatically (no code changes needed).

## Adding the real wallpapers

Drop the five photos in this folder using these exact names:

```
mountain.webp
ocean.webp
jellyfish.webp
forest.webp
aurora.webp
```

Recommended: **landscape, 16:9, ~1920×1080**.

### Optimizing from source files

If you have larger JPG/PNG/WEBP originals, put them in `public/backgrounds/_source/`
named after each preset (e.g. `_source/mountain.jpg`), then run:

```
npm run backgrounds:optimize
```

This resizes to 1920px wide and writes optimized `*.webp` files into this folder.
A `_source/` folder is ignored by the app — only the top-level `*.webp` files are served.
