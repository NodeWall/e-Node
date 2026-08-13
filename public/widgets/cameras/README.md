# Cameras Widget

## Dependencies (Linux)
- None (YouTube embed)

## Fastify Endpoints
- None

## Frontend Logic
- 2x2 grid: Ocean (YouTube uercaVcv3Lw) + Alps (YouTube BTMjD7_evjE) + 2 placeholders
- Click on dashboard widget opens `cameras.html` in iframe
- In Spoke (cameras.html): click on camera -> `.fullscreen-camera` class -> position:fixed 100vw/100vh
- Escape key or second click exits fullscreen

## Spoke Fullscreen CSS
```css
.camera-cell.fullscreen-camera {
  position: fixed !important; top: 0 !important; left: 0 !important;
  width: 100vw !important; height: 100vh !important; z-index: 5000 !important;
  border-radius: 0 !important; border: none !important;
}
```
