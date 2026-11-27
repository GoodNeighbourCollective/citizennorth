# Arranging photos (layout editor)

A local, drag-and-drop way to arrange photos on the site — the Squarespace-style step,
without leaving this codebase. It runs only on your computer; the public site never loads it.

## Start it

```bash
npm run layout
```

Open <http://localhost:4321> and go to any page. A dark **Layout mode** bar appears at the bottom.

## What you can do

| On a block (hover it) | |
|---|---|
| Drag it | Move it anywhere in its section. A red line shows where it lands. |
| ← / → | Move it one step earlier or later. |
| Full / Half / Third (project pages) | Width of the photo. Two Halves or three Thirds sit side by side. |
| Full / Large / Half / Medium / Third (homepage work grid) | Width of the project tile on a 12-column grid. |
| ✕ | Take the photo off the page. The file stays in its folder and goes back to the tray. |

**Photo tray** (bottom bar) lists every photo in the page's image folder that isn't on the page yet.
Click one to add it at the end, or drag it into place. To get new photos into the tray, export
web-sized copies (about 2400px on the long side) into the project's folder, e.g.
`images/fairmont-mayakoba/`, and reopen the tray. Use WebP, and name files for the property and space,
e.g. `fairmont-mayakoba-riviera-maya-main-pool-aerial.webp`.

**Save layout** writes the new order and sizes straight into the page's HTML file.
**Discard changes** reloads the page as last saved. Then commit and push as usual to publish.

## Which pages are arrangeable

- `work/fairmont-mayakoba/` — the whole case study (photos and text sections)
- `work/club-med-charlevoix/` — the case study; its "Image needed" slots can be removed as photos go in
- `index.html` — the Selected Work grid

New case studies start from `work/_template/` (not linked or indexed). Copy the folder, rename it, fill the brackets.

To make another section arrangeable, wrap it like the Fairmont page does: a
`<!-- layout:NAME -->` / `<!-- /layout:NAME -->` pair around a container with
`data-layout="NAME"`, and a `<!-- block:ID -->` comment before each child that has `data-block="ID"`.
New photos added in the editor get an empty `alt` — add a short description of each before publishing.
