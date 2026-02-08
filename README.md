# Smart Schematic v2

Interactive web viewer for KiCad schematics.

## Features

- Interactive KiCad schematic viewer in the browser
- Auto-fit schematic on load
- Mouse wheel zoom and click-drag pan navigation
- Click components to view value, footprint and datasheet
- BOM integration using CSV
- Variant support to hide DNP (Do Not Populate) components
- Lightweight and runs entirely client-side (no installation required)


## Tech stack
- HTML / CSS / JavaScript
- SVG parsing
- CSV BOM parsing

## Demo
Open index.html locally or via GitHub Pages.

## Example future capabilities

- Search and jump to components (R45, U3, J1…)
- Highlight critical circuits and signals
- Add functional annotations (ex: "Buzzer sounds when line voltage drops below 100V")
- Multi-variant BOM support for product families
