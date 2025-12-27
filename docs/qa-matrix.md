# QA Matrix

## Browsers
- Desktop: Chrome (latest), Firefox (latest), Safari (latest)
- Mobile: iOS Safari, Android Chrome

## Headsets
- Meta Quest 2 (WebXR)
- Meta Quest 3 (WebXR)

## Core Flows
- ACE create → sign → policy verdict
- Playground 3D load + agent actions + SSE status
- World state presence and multi-user join
- Marketplace checkout → Finance receipt → ArtifactPublisher delivery

## Performance Targets
- 3D scene load: < 5s on desktop
- SSE latency: < 2s status updates
- World state update: < 1s broadcast

## Fallbacks
- Non-VR browser mode must render control-room and controls.
- If WebXR unsupported, show VR disabled message.
