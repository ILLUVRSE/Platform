import * as THREE from "/vendor/three/three.module.js";
import { GLTFLoader } from "/vendor/three/examples/jsm/loaders/GLTFLoader.js";

const sceneEl = document.getElementById("scene");
const inventoryEl = document.getElementById("inventory");
const activityEl = document.getElementById("activity");
const objectiveEl = document.getElementById("objective");
const promptEl = document.getElementById("prompt");
const startOverlay = document.getElementById("start");
const endOverlay = document.getElementById("end");
const endText = document.getElementById("endText");
const dialogOverlay = document.getElementById("dialog");
const dialogName = document.getElementById("dialogName");
const dialogText = document.getElementById("dialogText");
const dialogNext = document.getElementById("dialogNext");
const dialogClose = document.getElementById("dialogClose");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
renderer.setSize(sceneEl.clientWidth, sceneEl.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
sceneEl.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = createSkyTexture();
scene.fog = new THREE.Fog("#1b3b66", 35, 140);

const gltfLoader = new GLTFLoader();

const camera = new THREE.PerspectiveCamera(
  58,
  sceneEl.clientWidth / sceneEl.clientHeight,
  0.1,
  200
);

const clock = new THREE.Clock();
const island = {
  radius: 58,
  seaLevel: -1.4,
  shoreLevel: -0.2,
};
const raceTrack = {
  radius: 48,
  width: 4.2,
  speed: 0.55,
  angle: 0,
};
const world = {
  radius: island.radius - 4,
  center: new THREE.Vector3(0, 0, 0),
};
const waveRingConfig = {
  radius: world.radius + 6,
  width: 8,
};
const mapAnchors = {
  wumpa: {
    name: "Wumpa Island",
    center: new THREE.Vector3(0, 0, 0),
    radius: 18,
    color: "#3fae5f",
    labelColor: "#ff7a1f",
  },
  badlands: {
    name: "Badlands",
    center: new THREE.Vector3(-28, 0, 26),
    radius: 18,
    color: "#8b5a2b",
    labelColor: "#f59e0b",
  },
  ripto: {
    name: "Ripto City",
    center: new THREE.Vector3(30, 0, 14),
    radius: 16,
    color: "#7a1f2d",
    labelColor: "#fb7185",
  },
  artisan: {
    name: "Artisan Homeworld",
    center: new THREE.Vector3(20, 0, -30),
    radius: 16,
    color: "#63c59a",
    labelColor: "#38bdf8",
  },
};

const input = {
  keys: new Set(),
  dragging: false,
  lastX: 0,
  lastY: 0,
};

const cameraRig = {
  yaw: Math.PI * 0.25,
  pitch: 0.35,
  distance: 13,
  height: 3.5,
};

const inventory = {
  wumpa: 0,
  gem: 0,
  cog: 0,
  crystal: 0,
  keys: 0,
};

const quests = {
  crash: { type: "wumpa", required: 3, started: false, completed: false },
  coco: { type: "cog", required: 3, started: false, completed: false },
  spyro: { type: "gem", required: 3, started: false, completed: false },
};

const timeTrial = {
  active: false,
  time: 0,
  best: loadBestTime(),
  lastLap: null,
  gateArmed: true,
  gateAngle: 0,
  lastTick: 0,
  minLap: 6,
};

const npcConfigs = {
  crash: {
    id: "crash",
    name: "Crash",
    nameColor: "#ff7a1f",
    intro: "Whoa! That rift is wild. Grab 3 Wumpa so I can power a jump pad.",
    request: "Keep hunting Wumpa.",
    complete: "Nice haul! Here is a rift key.",
    idle: "I am ready when you are.",
    bobOffset: 0,
    modelPath: "assets/models/crash.glb",
    scale: 1.1,
    fallbackBuilder: buildCrashModel,
    position: new THREE.Vector3(-16, 0, 10),
  },
  coco: {
    id: "coco",
    name: "Coco",
    nameColor: "#ffd166",
    intro: "I can stabilize the portal, but I need 3 cogs to build the rig.",
    request: "Any luck finding cogs?",
    complete: "Perfect! Here is your rift key.",
    idle: "Keep an eye on those portal readings.",
    bobOffset: 1.4,
    modelPath: "assets/models/coco.glb",
    scale: 1.05,
    fallbackBuilder: buildCocoModel,
    position: new THREE.Vector3(18, 0, 8),
  },
  spyro: {
    id: "spyro",
    name: "Spyro",
    nameColor: "#7a4bff",
    intro: "The rift likes shiny stuff. Find me 3 gems to calm it down.",
    request: "Keep searching for gems.",
    complete: "Sparkling! Take this rift key.",
    idle: "The portal feels steady now.",
    bobOffset: 2.8,
    modelPath: "assets/models/spyro.glb",
    scale: 1.1,
    fallbackBuilder: buildSpyroModel,
    position: new THREE.Vector3(0, 0, -16),
  },
};

const gameState = {
  started: false,
  dialogOpen: false,
  finished: false,
  activeNpc: null,
  dialogLines: [],
  dialogIndex: 0,
  controlMode: "player",
  inCave: false,
};

const temp = {
  vec3: new THREE.Vector3(),
  vec3b: new THREE.Vector3(),
  move: new THREE.Vector3(),
};

const hudCache = {
  inventory: "",
  objective: "",
  activity: "",
};

const terrain = createTerrain();
scene.add(terrain);

const water = createWater();
scene.add(water);

const track = createTrack();
scene.add(track);

const timeGate = createTimeGate();
scene.add(timeGate.group);

const raceCar = createRaceCar();
scene.add(raceCar.group);

const kart = createKart();
scene.add(kart.group);

const waveRing = createWaveRing();
scene.add(waveRing.group);

const surf = createSurfboard();
scene.add(surf.group);

const lights = createLights();
scene.add(lights.group);

const props = [];
const obstacles = [];
spawnProps();

const regionLandmarks = createRegionLandmarks();
scene.add(regionLandmarks.group);

const skyRift = createSkyRift();
scene.add(skyRift.group);

const cave = createCave();
scene.add(cave.group);
scene.add(cave.interior);

const portal = createPortal();
scene.add(portal.group);
portal.group.visible = false;

const poster = createPoster();
scene.add(poster);

const player = createPlayer();
scene.add(player.group);

const npcs = createNpcs();

const collectibles = createCollectibles();
const caveCollectibles = createCaveCollectibles();

updateHud();

startBtn.addEventListener("click", () => {
  resetGame();
  gameState.started = true;
  startOverlay.classList.add("hidden");
});

restartBtn.addEventListener("click", () => {
  resetGame();
  endOverlay.classList.add("hidden");
  gameState.started = true;
  gameState.finished = false;
});

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
    event.preventDefault();
  }

  if (key === "e" && gameState.started && !gameState.finished) {
    if (gameState.dialogOpen) {
      advanceDialog();
    } else if (gameState.controlMode === "kart") {
      exitKart();
    } else if (gameState.controlMode === "surf") {
      exitSurf();
    } else {
      attemptInteract();
    }
  }

  if (key === "escape" && gameState.dialogOpen) {
    closeDialog();
  }

  input.keys.add(key);
});

window.addEventListener("keyup", (event) => {
  input.keys.delete(event.key.toLowerCase());
});

renderer.domElement.addEventListener("pointerdown", (event) => {
  input.dragging = true;
  input.lastX = event.clientX;
  input.lastY = event.clientY;
  renderer.domElement.setPointerCapture(event.pointerId);
});

renderer.domElement.addEventListener("pointermove", (event) => {
  if (!input.dragging) {
    return;
  }
  const dx = event.clientX - input.lastX;
  const dy = event.clientY - input.lastY;
  input.lastX = event.clientX;
  input.lastY = event.clientY;

  cameraRig.yaw -= dx * 0.005;
  cameraRig.pitch = clamp(cameraRig.pitch - dy * 0.004, 0.15, 1.1);
});

renderer.domElement.addEventListener("pointerup", (event) => {
  input.dragging = false;
  renderer.domElement.releasePointerCapture(event.pointerId);
});

window.addEventListener("resize", () => {
  const { clientWidth, clientHeight } = sceneEl;
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight);
});

function resetGame() {
  inventory.wumpa = 0;
  inventory.gem = 0;
  inventory.cog = 0;
  inventory.crystal = 0;
  inventory.keys = 0;
  Object.values(quests).forEach((quest) => {
    quest.started = false;
    quest.completed = false;
  });
  portal.group.visible = false;
  portal.active = false;
  gameState.dialogOpen = false;
  gameState.activeNpc = null;
  gameState.dialogLines = [];
  gameState.dialogIndex = 0;
  gameState.finished = false;
  gameState.controlMode = "player";
  gameState.inCave = false;
  player.group.visible = true;
  resetKart();
  resetSurf();
  resetCave();
  resetTimeTrial();
  closeDialog();

  player.group.position.set(0, 0, 18);
  player.velocity.set(0, 0, 0);
  updatePlayerHeight();

  collectibles.forEach((item) => {
    respawnCollectible(item, true);
  });
  caveCollectibles.forEach((item) => {
    item.collected = false;
    item.mesh.visible = true;
  });

  updateHud();
}

function updateHud() {
  const inventoryText = `Wumpa ${inventory.wumpa} | Gems ${inventory.gem} | Cogs ${inventory.cog} | Crystals ${inventory.crystal} | Keys ${inventory.keys}/3`;
  if (inventoryText !== hudCache.inventory) {
    inventoryEl.textContent = inventoryText;
    hudCache.inventory = inventoryText;
  }

  const activityText = getActivityText();
  if (activityText !== hudCache.activity) {
    activityEl.textContent = activityText;
    hudCache.activity = activityText;
  }

  const objectiveText = getObjectiveText();
  if (objectiveText !== hudCache.objective) {
    objectiveEl.textContent = objectiveText;
    hudCache.objective = objectiveText;
  }
}

function getObjectiveText() {
  if (!quests.crash.started || !quests.coco.started || !quests.spyro.started) {
    return "Talk to Crash, Coco, and Spyro.";
  }
  if (!portal.active) {
    const parts = [];
    if (!quests.crash.completed) {
      parts.push(`Crash needs ${remainingCount("crash")} Wumpa`);
    }
    if (!quests.coco.completed) {
      parts.push(`Coco needs ${remainingCount("coco")} Cogs`);
    }
    if (!quests.spyro.completed) {
      parts.push(`Spyro needs ${remainingCount("spyro")} Gems`);
    }
    if (parts.length > 0) {
      return parts.join(". ");
    }
    return "Collect the 3 rift keys from the trio.";
  }
  if (!gameState.finished) {
    return "Enter the portal at the center.";
  }
  return "Rift secured. Nice run.";
}

function getActivityText() {
  const bestText = Number.isFinite(timeTrial.best) ? formatTime(timeTrial.best) : "--:--";
  const lastText = Number.isFinite(timeTrial.lastLap) ? formatTime(timeTrial.lastLap) : "--:--";
  const crystalLine = `Crystals ${inventory.crystal}/${cave.crystalTotal}`;

  if (gameState.controlMode === "kart") {
    const lapText = timeTrial.active ? `Lap ${formatTime(timeTrial.time)}` : "Cross the banner to start";
    return `Kart Time Trial\n${lapText}\nBest ${bestText} | Last ${lastText}`;
  }

  if (gameState.controlMode === "surf") {
    return "Wave Ring\nCarve with WASD\nPress E to dismount";
  }

  if (gameState.inCave) {
    return `Cave Run\n${crystalLine}\nFind the exit portal`;
  }

  return `Explore Wumpa Island hub\nBadlands SW | Ripto City E | Artisan NE\nRift overhead | ${crystalLine}`;
}

function remainingCount(id) {
  const quest = quests[id];
  return Math.max(quest.required - inventory[quest.type], 0);
}

function getGroundHeight(x, z) {
  if (gameState.inCave) {
    return cave.floorY;
  }
  return Math.max(terrainHeight(x, z), island.seaLevel + 0.1);
}

function updatePlayerHeight() {
  const ground = getGroundHeight(player.group.position.x, player.group.position.z);
  player.baseY = ground + 1.4;
  player.group.position.y = player.baseY + Math.sin(clock.elapsedTime * 6) * 0.08;
}

function update(delta) {
  updateNpcAnimations(delta);
  updateCollectibles(delta);
  updateCaveCollectibles(delta);
  updatePortal(delta);
  updateWater(delta);
  updateRift(delta);
  updateRaceCar(delta);
  updateSurfIdle(delta);

  if (!gameState.started || gameState.dialogOpen || gameState.finished) {
    updateCamera(delta);
    updatePrompt();
    return;
  }

  if (gameState.controlMode === "player") {
    updatePlayerMovement(delta);
  } else if (gameState.controlMode === "kart") {
    updateKartMovement(delta);
  } else if (gameState.controlMode === "surf") {
    updateSurfMovement(delta);
  }

  updateTimeTrial(delta);
  updateCamera(delta);
  checkPortalEntry();
  updatePrompt();
}

function updatePlayerMovement(delta) {
  const forward = temp.vec3.set(Math.sin(cameraRig.yaw), 0, Math.cos(cameraRig.yaw));
  const right = temp.vec3b.set(forward.z, 0, -forward.x);

  const move = temp.move.set(0, 0, 0);
  const hasForward = input.keys.has("w") || input.keys.has("arrowup");
  const hasBack = input.keys.has("s") || input.keys.has("arrowdown");
  const hasLeft = input.keys.has("a") || input.keys.has("arrowleft");
  const hasRight = input.keys.has("d") || input.keys.has("arrowright");

  if (hasForward) {
    move.add(forward);
  }
  if (hasBack) {
    move.sub(forward);
  }
  if (hasLeft) {
    move.sub(right);
  }
  if (hasRight) {
    move.add(right);
  }

  if (move.lengthSq() > 0) {
    move.normalize();
  }

  const sprint = input.keys.has("shift");
  const targetSpeed = player.speed * (sprint ? 1.6 : 1);
  player.velocity.x = THREE.MathUtils.lerp(player.velocity.x, move.x * targetSpeed, 0.12);
  player.velocity.z = THREE.MathUtils.lerp(player.velocity.z, move.z * targetSpeed, 0.12);

  player.group.position.x += player.velocity.x * delta;
  player.group.position.z += player.velocity.z * delta;

  if (gameState.inCave) {
    resolveCaveBounds();
  } else {
    resolveWorldBounds(player.group.position, player.radius);
    resolveObstaclesFor(player.group.position, player.radius);
  }
  updatePlayerHeight();

  if (player.velocity.lengthSq() > 0.2) {
    player.group.rotation.y = Math.atan2(player.velocity.x, player.velocity.z);
  }
}

function resolveWorldBounds(position, radius) {
  const flat = temp.vec3.set(position.x, 0, position.z);
  const distance = flat.length();
  const limit = world.radius - radius;
  if (distance > limit) {
    flat.normalize();
    position.x = flat.x * limit;
    position.z = flat.z * limit;
  }
}

function resolveCaveBounds() {
  const offset = temp.vec3.set(
    player.group.position.x - cave.center.x,
    0,
    player.group.position.z - cave.center.z
  );
  const distance = offset.length();
  const limit = cave.radius - player.radius;
  if (distance > limit) {
    offset.normalize();
    player.group.position.x = cave.center.x + offset.x * limit;
    player.group.position.z = cave.center.z + offset.z * limit;
  }
}

function resolveObstaclesFor(position, radius) {
  obstacles.forEach((obstacle) => {
    const dx = position.x - obstacle.position.x;
    const dz = position.z - obstacle.position.z;
    const dist = Math.hypot(dx, dz);
    const minDist = obstacle.radius + radius;
    if (dist < minDist) {
      const push = (minDist - dist) / (dist || 1);
      position.x += dx * push;
      position.z += dz * push;
    }
  });
}

function updateCamera(delta) {
  const target = getCameraTarget();
  const settings = getCameraSettings();
  const camX = target.x + Math.sin(cameraRig.yaw) * settings.distance * Math.cos(cameraRig.pitch);
  const camZ = target.z + Math.cos(cameraRig.yaw) * settings.distance * Math.cos(cameraRig.pitch);
  const camY = target.y + settings.height + Math.sin(cameraRig.pitch) * settings.distance;

  camera.position.lerp(temp.vec3.set(camX, camY, camZ), 0.12);
  camera.lookAt(target.x, target.y + settings.lookHeight, target.z);
}

function getCameraTarget() {
  if (gameState.controlMode === "kart") {
    return kart.group.position;
  }
  if (gameState.controlMode === "surf") {
    return surf.group.position;
  }
  return player.group.position;
}

function getCameraSettings() {
  if (gameState.controlMode === "kart") {
    return { distance: 16, height: 4.5, lookHeight: 1.1 };
  }
  if (gameState.controlMode === "surf") {
    return { distance: 15, height: 3.8, lookHeight: 1.0 };
  }
  if (gameState.inCave) {
    return { distance: 9, height: 2.4, lookHeight: 1.0 };
  }
  return { distance: cameraRig.distance, height: cameraRig.height, lookHeight: 1.2 };
}

function updatePrompt() {
  if (!gameState.started || gameState.dialogOpen || gameState.finished) {
    promptEl.classList.add("hidden");
    return;
  }

  if (gameState.controlMode === "kart") {
    promptEl.textContent = "Press E to exit kart";
    promptEl.classList.remove("hidden");
    return;
  }

  if (gameState.controlMode === "surf") {
    promptEl.textContent = "Press E to exit surfboard";
    promptEl.classList.remove("hidden");
    return;
  }

  const interactable = getNearestInteractable();
  if (!interactable) {
    promptEl.classList.add("hidden");
    return;
  }

  if (interactable.type === "npc") {
    promptEl.textContent = `Press E to talk to ${interactable.npc.name}`;
  } else if (interactable.type === "kart") {
    promptEl.textContent = "Press E to drive the kart";
  } else if (interactable.type === "surf") {
    promptEl.textContent = "Press E to ride the surfboard";
  } else if (interactable.type === "cave") {
    promptEl.textContent = "Press E to enter the cave";
  } else if (interactable.type === "caveExit") {
    promptEl.textContent = "Press E to exit the cave";
  }

  promptEl.classList.remove("hidden");
}

function attemptInteract() {
  const interactable = getNearestInteractable();
  if (!interactable) {
    return;
  }

  if (interactable.type === "npc") {
    openDialog(interactable.npc);
  } else if (interactable.type === "kart") {
    enterKart();
  } else if (interactable.type === "surf") {
    enterSurf();
  } else if (interactable.type === "cave") {
    enterCave();
  } else if (interactable.type === "caveExit") {
    exitCave();
  }
}

function getNearestNpc() {
  let nearest = null;
  let bestDist = Infinity;

  npcs.forEach((npc) => {
    const dist = npc.group.position.distanceTo(player.group.position);
    if (dist < 4.2 && dist < bestDist) {
      bestDist = dist;
      nearest = npc;
    }
  });

  return nearest;
}

function getNearestInteractable() {
  if (gameState.controlMode !== "player") {
    return null;
  }

  const candidates = [];
  if (gameState.inCave) {
    candidates.push({
      type: "caveExit",
      position: cave.exitPosition,
      radius: 3,
    });
  } else {
    npcs.forEach((npc) => {
      candidates.push({
        type: "npc",
        npc,
        position: npc.group.position,
        radius: 4.2,
      });
    });
    candidates.push({
      type: "kart",
      position: kart.group.position,
      radius: 3.2,
    });
    candidates.push({
      type: "surf",
      position: surf.group.position,
      radius: 3.0,
    });
    candidates.push({
      type: "cave",
      position: cave.entrancePosition,
      radius: 3.5,
    });
  }

  let nearest = null;
  let bestDist = Infinity;

  candidates.forEach((candidate) => {
    const dist = candidate.position.distanceTo(player.group.position);
    if (dist < candidate.radius && dist < bestDist) {
      bestDist = dist;
      nearest = candidate;
    }
  });

  return nearest;
}

function openDialog(npc) {
  gameState.dialogOpen = true;
  gameState.activeNpc = npc;
  gameState.dialogLines = buildDialogue(npc);
  gameState.dialogIndex = 0;
  dialogName.textContent = npc.name;
  dialogText.textContent = gameState.dialogLines[0] || "...";
  dialogOverlay.classList.remove("hidden");
}

function advanceDialog() {
  if (!gameState.dialogOpen) {
    return;
  }
  gameState.dialogIndex += 1;
  if (gameState.dialogIndex >= gameState.dialogLines.length) {
    closeDialog();
    return;
  }
  dialogText.textContent = gameState.dialogLines[gameState.dialogIndex];
}

function closeDialog() {
  gameState.dialogOpen = false;
  dialogOverlay.classList.add("hidden");
  updateHud();
}

function enterKart() {
  gameState.controlMode = "kart";
  player.group.visible = false;
  player.velocity.set(0, 0, 0);
  kart.speed = 0;
  kart.heading = kart.group.rotation.y;
  timeTrial.gateArmed = true;
  player.group.position.copy(kart.group.position);
  updateHud();
}

function exitKart() {
  gameState.controlMode = "player";
  player.group.visible = true;
  const exitOffset = temp.vec3.set(1.6, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), kart.heading);
  player.group.position.copy(kart.group.position).add(exitOffset);
  player.velocity.set(0, 0, 0);
  updatePlayerHeight();
  updateHud();
}

function enterSurf() {
  gameState.controlMode = "surf";
  player.group.visible = false;
  player.velocity.set(0, 0, 0);
  surf.speed = surf.baseSpeed;
  surf.angle = surf.anchorAngle;
  positionSurfOnRing();
  player.group.position.copy(surf.group.position);
  updateHud();
}

function exitSurf() {
  gameState.controlMode = "player";
  player.group.visible = true;
  const shoreRadius = world.radius - 3;
  const x = Math.cos(surf.angle) * shoreRadius;
  const z = Math.sin(surf.angle) * shoreRadius;
  player.group.position.set(x, 0, z);
  player.velocity.set(0, 0, 0);
  updatePlayerHeight();
  resetSurf();
  updateHud();
}

function enterCave() {
  gameState.inCave = true;
  cave.interior.visible = true;
  player.group.position.copy(cave.spawnPosition);
  player.velocity.set(0, 0, 0);
  updatePlayerHeight();
  updateHud();
}

function exitCave() {
  gameState.inCave = false;
  cave.interior.visible = false;
  player.group.position.copy(cave.exitSurface);
  player.velocity.set(0, 0, 0);
  updatePlayerHeight();
  updateHud();
}

function resetKart() {
  kart.speed = 0;
  kart.heading = kart.spawnHeading;
  kart.group.position.copy(kart.spawnPosition);
  kart.group.rotation.y = kart.heading;
}

function resetSurf() {
  surf.speed = 0;
  surf.angle = surf.anchorAngle;
  surf.group.position.copy(surf.anchor);
  surf.group.rotation.y = surf.anchorRotation;
  surf.group.rotation.z = 0;
}

function resetCave() {
  cave.interior.visible = false;
}

function resetTimeTrial() {
  timeTrial.active = false;
  timeTrial.time = 0;
  timeTrial.lastLap = null;
  timeTrial.gateArmed = true;
  timeTrial.lastTick = 0;
}

function buildDialogue(npc) {
  const quest = quests[npc.id];
  const lines = [];

  if (!quest.started) {
    quest.started = true;
    lines.push(npc.intro);
  }

  if (!quest.completed) {
    const remaining = quest.required - inventory[quest.type];
    if (remaining > 0) {
      lines.push(`${npc.request} You still need ${remaining}.`);
      return lines;
    }

    inventory[quest.type] -= quest.required;
    quest.completed = true;
    inventory.keys += 1;
    lines.push(npc.complete);
    if (inventory.keys >= 3) {
      unlockPortal();
    }
    return lines;
  }

  lines.push(npc.idle);
  return lines;
}

dialogNext.addEventListener("click", () => {
  advanceDialog();
});

dialogClose.addEventListener("click", () => {
  closeDialog();
});

function unlockPortal() {
  portal.active = true;
  portal.group.visible = true;
  updateHud();
}

function checkPortalEntry() {
  if (!portal.active || gameState.finished || gameState.inCave) {
    return;
  }
  const dist = portal.group.position.distanceTo(player.group.position);
  if (dist < 2.6) {
    gameState.finished = true;
    endText.textContent = "Crash, Coco, and Spyro sealed the rift with your help.";
    endOverlay.classList.remove("hidden");
    updateHud();
  }
}

function updateNpcAnimations(delta) {
  npcs.forEach((npc) => {
    npc.group.position.y = npc.baseY + Math.sin(clock.elapsedTime * 2 + npc.bobOffset) * 0.15;
    const targetAngle = Math.atan2(
      player.group.position.x - npc.group.position.x,
      player.group.position.z - npc.group.position.z
    );
    npc.group.rotation.y = lerpAngle(npc.group.rotation.y, targetAngle, 0.08);
    if (npc.wings) {
      npc.wings.forEach((wing, index) => {
        wing.rotation.z = Math.sin(clock.elapsedTime * 5 + index) * 0.3;
      });
    }
  });
}

function updateCollectibles(delta) {
  collectibles.forEach((item) => {
    if (item.hidden) {
      item.timer -= delta;
      if (item.timer <= 0) {
        respawnCollectible(item);
      }
      return;
    }
    item.mesh.rotation.y += delta * 1.5;
    item.mesh.position.y = item.baseY + Math.sin(clock.elapsedTime * 2 + item.offset) * 0.3;

    const dist = item.mesh.position.distanceTo(player.group.position);
    if (dist < 1.4) {
      collectItem(item);
    }
  });
}

function updateCaveCollectibles(delta) {
  if (!gameState.inCave) {
    return;
  }

  caveCollectibles.forEach((item) => {
    if (item.collected) {
      return;
    }
    item.mesh.rotation.y += delta * 1.2;
    item.mesh.position.y = item.baseY + Math.sin(clock.elapsedTime * 2 + item.offset) * 0.15;
    const worldPos = item.mesh.getWorldPosition(temp.vec3);
    const dist = worldPos.distanceTo(player.group.position);
    if (dist < 1.1) {
      collectCaveCrystal(item);
    }
  });
}

function collectItem(item) {
  item.hidden = true;
  item.mesh.visible = false;
  item.timer = 6 + Math.random() * 4;
  inventory[item.type] += 1;
  updateHud();
}

function collectCaveCrystal(item) {
  item.collected = true;
  item.mesh.visible = false;
  inventory.crystal += 1;
  updateHud();
}

function respawnCollectible(item, initial) {
  const point = randomLandPoint(8);
  item.mesh.position.set(point.x, terrainHeight(point.x, point.z) + 1.2, point.z);
  item.baseY = item.mesh.position.y;
  item.hidden = false;
  item.mesh.visible = true;
  item.timer = initial ? 0 : 6;
}

function updatePortal(delta) {
  if (!portal.active) {
    return;
  }
  portal.ring.rotation.z += delta * 0.8;
  portal.core.rotation.y -= delta * 0.6;
  const pulse = 0.6 + Math.sin(clock.elapsedTime * 3) * 0.12;
  portal.core.material.opacity = pulse;
}

function updateWater() {
  water.position.y = island.seaLevel + 0.05 + Math.sin(clock.elapsedTime * 0.7) * 0.03;
  waveRing.group.position.y = water.position.y + 0.02;
}

function updateRift(delta) {
  skyRift.outer.rotation.z += delta * 0.25;
  skyRift.inner.rotation.z -= delta * 0.35;
  skyRift.swirl.rotation.z += delta * 0.2;
  const pulse = 0.85 + Math.sin(clock.elapsedTime * 1.4) * 0.08;
  skyRift.core.scale.setScalar(pulse);
  skyRift.core.material.opacity = 0.45 + Math.sin(clock.elapsedTime * 1.8) * 0.1;
}

function updateRaceCar(delta) {
  raceTrack.angle = (raceTrack.angle + delta * raceTrack.speed) % (Math.PI * 2);
  const x = Math.cos(raceTrack.angle) * raceTrack.radius;
  const z = Math.sin(raceTrack.angle) * raceTrack.radius;
  const y = Math.max(terrainHeight(x, z), island.seaLevel + 0.05) + 0.25;
  raceCar.group.position.set(x, y, z);

  const tangentX = -Math.sin(raceTrack.angle);
  const tangentZ = Math.cos(raceTrack.angle);
  raceCar.group.rotation.y = Math.atan2(tangentX, tangentZ);
}

function updateKartMovement(delta) {
  const hasForward = input.keys.has("w") || input.keys.has("arrowup");
  const hasBack = input.keys.has("s") || input.keys.has("arrowdown");
  const hasLeft = input.keys.has("a") || input.keys.has("arrowleft");
  const hasRight = input.keys.has("d") || input.keys.has("arrowright");

  const accelInput = (hasForward ? 1 : 0) - (hasBack ? 1 : 0);
  if (accelInput !== 0) {
    kart.speed += accelInput * kart.acceleration * delta;
  } else {
    kart.speed = THREE.MathUtils.lerp(kart.speed, 0, kart.drag * delta);
  }

  const maxReverse = -kart.maxSpeed * 0.4;
  kart.speed = clamp(kart.speed, maxReverse, kart.maxSpeed);

  const steerInput = (hasLeft ? 1 : 0) - (hasRight ? 1 : 0);
  const speedFactor = Math.max(Math.abs(kart.speed) / kart.maxSpeed, 0.35);
  if (kart.speed !== 0) {
    kart.heading += steerInput * kart.turnSpeed * speedFactor * delta * Math.sign(kart.speed);
  }

  const forward = temp.vec3.set(Math.sin(kart.heading), 0, Math.cos(kart.heading));
  kart.group.position.x += forward.x * kart.speed * delta;
  kart.group.position.z += forward.z * kart.speed * delta;

  resolveWorldBounds(kart.group.position, kart.radius);
  resolveObstaclesFor(kart.group.position, kart.radius);

  const ground = Math.max(
    terrainHeight(kart.group.position.x, kart.group.position.z),
    island.seaLevel + 0.05
  );
  kart.group.position.y = ground + kart.hoverHeight;
  kart.group.rotation.y = kart.heading;

  player.group.position.copy(kart.group.position);
}

function updateSurfMovement(delta) {
  const hasForward = input.keys.has("w") || input.keys.has("arrowup");
  const hasBack = input.keys.has("s") || input.keys.has("arrowdown");
  const hasLeft = input.keys.has("a") || input.keys.has("arrowleft");
  const hasRight = input.keys.has("d") || input.keys.has("arrowright");

  const targetSpeed = surf.baseSpeed + (hasForward ? surf.boost : 0) - (hasBack ? surf.brake : 0);
  surf.speed = THREE.MathUtils.lerp(surf.speed, targetSpeed, 0.08);
  surf.speed = clamp(surf.speed, surf.minSpeed, surf.maxSpeed);

  const steer = (hasLeft ? 1 : 0) - (hasRight ? 1 : 0);
  surf.angle += ((surf.speed / surf.radius) + steer * surf.turnSpeed) * delta;

  const wave = Math.sin(clock.elapsedTime * 2.5 + surf.angle * 4.2) * surf.waveHeight;
  const x = Math.cos(surf.angle) * surf.radius;
  const z = Math.sin(surf.angle) * surf.radius;
  surf.group.position.set(x, water.position.y + 0.3 + wave, z);

  const tangent = surf.angle + Math.PI / 2;
  surf.group.rotation.y = tangent;
  surf.group.rotation.z = Math.sin(clock.elapsedTime * 3 + surf.angle * 2) * 0.12;

  player.group.position.copy(surf.group.position);
}

function positionSurfOnRing() {
  const wave = Math.sin(clock.elapsedTime * 2.5 + surf.angle * 4.2) * surf.waveHeight;
  const x = Math.cos(surf.angle) * surf.radius;
  const z = Math.sin(surf.angle) * surf.radius;
  surf.group.position.set(x, water.position.y + 0.3 + wave, z);
  surf.group.rotation.y = surf.angle + Math.PI / 2;
  surf.group.rotation.z = 0;
}

function updateTimeTrial(delta) {
  if (gameState.controlMode !== "kart") {
    if (timeTrial.active) {
      timeTrial.active = false;
      timeTrial.time = 0;
      timeTrial.lastLap = null;
      timeTrial.lastTick = 0;
      updateHud();
    }
    return;
  }

  if (timeTrial.active) {
    timeTrial.time += delta;
    const tick = Math.floor(timeTrial.time * 10);
    if (tick !== timeTrial.lastTick) {
      timeTrial.lastTick = tick;
      updateHud();
    }
  }

  const onTrack = isOnTrack(kart.group.position);
  const angle = Math.atan2(kart.group.position.z, kart.group.position.x);
  const gateDelta = normalizeAngle(angle - timeTrial.gateAngle);
  const nearGate = onTrack && Math.abs(gateDelta) < 0.2;

  if (nearGate) {
    if (timeTrial.gateArmed) {
      handleGateCross();
      timeTrial.gateArmed = false;
    }
  } else {
    timeTrial.gateArmed = true;
  }
}

function updateSurfIdle() {
  if (gameState.controlMode === "surf") {
    return;
  }
  surf.group.position.x = surf.anchor.x;
  surf.group.position.z = surf.anchor.z;
  surf.group.position.y =
    water.position.y + 0.1 + Math.sin(clock.elapsedTime * 1.6 + surf.anchorAngle) * 0.08;
  surf.group.rotation.y = surf.anchorRotation;
  surf.group.rotation.z = Math.sin(clock.elapsedTime * 1.2) * 0.05;
}

function isOnTrack(position) {
  const distance = Math.hypot(position.x, position.z);
  return Math.abs(distance - raceTrack.radius) < raceTrack.width * 0.6;
}

function handleGateCross() {
  if (!timeTrial.active) {
    timeTrial.active = true;
    timeTrial.time = 0;
    timeTrial.lastLap = null;
    timeTrial.lastTick = 0;
    updateHud();
    return;
  }

  if (timeTrial.time < timeTrial.minLap) {
    return;
  }

  timeTrial.lastLap = timeTrial.time;
  if (!Number.isFinite(timeTrial.best) || timeTrial.time < timeTrial.best) {
    timeTrial.best = timeTrial.time;
    saveBestTime(timeTrial.best);
  }
  timeTrial.time = 0;
  timeTrial.lastTick = 0;
  updateHud();
}

function formatTime(seconds) {
  const total = Math.max(seconds, 0);
  const minutes = Math.floor(total / 60);
  const secs = (total % 60).toFixed(1).padStart(4, "0");
  return `${minutes}:${secs}`;
}

function loadBestTime() {
  try {
    const stored = localStorage.getItem("wumpaIslandBest");
    const value = Number(stored);
    return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
  } catch (error) {
    return Number.POSITIVE_INFINITY;
  }
}

function saveBestTime(value) {
  try {
    localStorage.setItem("wumpaIslandBest", String(value));
  } catch (error) {
    // Ignore storage errors on locked-down browsers.
  }
}

function createTerrain() {
  const geometry = new THREE.PlaneGeometry(160, 160, 60, 60);
  geometry.rotateX(-Math.PI / 2);

  const colors = [];
  const sea = new THREE.Color("#1e3f66");
  const sand = new THREE.Color("#d9c38c");
  const beach = new THREE.Color("#f1d9a8");
  const grass = new THREE.Color("#3fae5f");
  const jungle = new THREE.Color("#2f8f6f");
  const rock = new THREE.Color("#6b6f7a");

  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const y = terrainHeight(x, z);
    position.setY(i, y);

    const color = new THREE.Color();
    if (y < island.seaLevel + 0.15) {
      color.copy(sea);
    } else if (y < island.seaLevel + 0.5) {
      color.lerpColors(
        sand,
        beach,
        clamp((y - (island.seaLevel + 0.15)) / 0.35, 0, 1)
      );
    } else if (y < 1.2) {
      color.copy(beach);
    } else if (y < 2.6) {
      color.lerpColors(grass, jungle, clamp((y - 1.2) / 1.4, 0, 1));
    } else if (y < 4) {
      color.lerpColors(jungle, rock, clamp((y - 2.6) / 1.4, 0, 1));
    } else {
      color.copy(rock);
    }
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshLambertMaterial({
    vertexColors: true,
  });

  return new THREE.Mesh(geometry, material);
}

function createWater() {
  const geometry = new THREE.PlaneGeometry(220, 220, 1, 1);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshPhongMaterial({
    color: "#1b6aa5",
    transparent: true,
    opacity: 0.7,
    shininess: 80,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = island.seaLevel + 0.05;
  return mesh;
}

function createWaveRing() {
  const inner = waveRingConfig.radius - waveRingConfig.width * 0.5;
  const outer = waveRingConfig.radius + waveRingConfig.width * 0.5;
  const geometry = new THREE.RingGeometry(inner, outer, 96, 1);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.MeshPhongMaterial({
    color: "#2f8fe8",
    transparent: true,
    opacity: 0.55,
    shininess: 90,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = island.seaLevel + 0.05;
  return { group: mesh };
}

function createSurfboard() {
  const group = new THREE.Group();
  const boardMat = new THREE.MeshStandardMaterial({
    color: "#f4c95d",
    roughness: 0.5,
    flatShading: true,
  });
  const stripeMat = new THREE.MeshStandardMaterial({
    color: "#ff7a1f",
    roughness: 0.4,
    flatShading: true,
  });
  const finMat = new THREE.MeshStandardMaterial({
    color: "#1b1f3a",
    roughness: 0.7,
    flatShading: true,
  });

  const board = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 0.6), boardMat);
  board.position.y = 0.06;
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.22), stripeMat);
  stripe.position.set(0, 0.1, 0);
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 6), finMat);
  fin.position.set(0, -0.05, -0.2);
  fin.rotation.x = Math.PI;

  group.add(board, stripe, fin);

  const anchorAngle = Math.PI * 0.75;
  const anchorRadius = world.radius - 2;
  const anchor = new THREE.Vector3(
    Math.cos(anchorAngle) * anchorRadius,
    island.seaLevel + 0.15,
    Math.sin(anchorAngle) * anchorRadius
  );
  group.position.copy(anchor);

  const anchorRotation = anchorAngle + Math.PI / 2;
  group.rotation.y = anchorRotation;

  return {
    group,
    anchor,
    anchorAngle,
    anchorRotation,
    radius: waveRingConfig.radius,
    baseSpeed: 6,
    boost: 3,
    brake: 3,
    minSpeed: 2,
    maxSpeed: 10,
    speed: 0,
    angle: anchorAngle,
    turnSpeed: 0.9,
    waveHeight: 0.35,
  };
}

function createTrack() {
  const inner = raceTrack.radius - raceTrack.width * 0.5;
  const outer = raceTrack.radius + raceTrack.width * 0.5;
  const geometry = new THREE.RingGeometry(inner, outer, 96, 1);
  geometry.rotateX(-Math.PI / 2);

  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const ground = Math.max(terrainHeight(x, z), island.seaLevel + 0.05);
    const y = ground + 0.04;
    position.setY(i, y);
  }
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: "#d9c38c",
    roughness: 0.95,
    metalness: 0,
    flatShading: true,
    side: THREE.DoubleSide,
  });

  return new THREE.Mesh(geometry, material);
}

function createTimeGate() {
  const group = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({
    color: "#3f2a1d",
    roughness: 0.85,
    flatShading: true,
  });
  const bannerMat = new THREE.MeshStandardMaterial({
    color: "#f4c95d",
    roughness: 0.4,
    metalness: 0,
    flatShading: true,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: "#1fd3e5",
    roughness: 0.4,
    flatShading: true,
  });

  const postGeo = new THREE.BoxGeometry(0.35, 2.4, 0.35);
  const postLeft = new THREE.Mesh(postGeo, postMat);
  postLeft.position.set(-raceTrack.width * 0.55, 1.2, 0);
  const postRight = postLeft.clone();
  postRight.position.x = raceTrack.width * 0.55;

  const banner = new THREE.Mesh(
    new THREE.BoxGeometry(raceTrack.width * 1.2, 0.35, 0.3),
    bannerMat
  );
  banner.position.set(0, 2.25, 0);

  const stripeLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.32), trimMat);
  stripeLeft.position.set(-raceTrack.width * 0.45, 2.25, 0);
  const stripeRight = stripeLeft.clone();
  stripeRight.position.x = raceTrack.width * 0.45;

  group.add(postLeft, postRight, banner, stripeLeft, stripeRight);

  const angle = timeTrial.gateAngle;
  const x = Math.cos(angle) * raceTrack.radius;
  const z = Math.sin(angle) * raceTrack.radius;
  const y = Math.max(terrainHeight(x, z), island.seaLevel + 0.05);
  group.position.set(x, y, z);
  group.rotation.y = angle + Math.PI / 2;

  return { group };
}

function createRaceCar() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: "#ff3b30",
    roughness: 0.6,
    flatShading: true,
  });
  const cabinMat = new THREE.MeshStandardMaterial({
    color: "#1f6bff",
    roughness: 0.6,
    flatShading: true,
  });
  const wheelMat = new THREE.MeshStandardMaterial({
    color: "#2b2b2b",
    roughness: 0.9,
    flatShading: true,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: "#f8fafc",
    roughness: 0.4,
    flatShading: true,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 3.2), bodyMat);
  base.position.y = 0.35;

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.25, 0.9), bodyMat);
  hood.position.set(0, 0.55, 1.05);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 1.0), cabinMat);
  cabin.position.set(0, 0.7, -0.2);

  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 0.2), trimMat);
  spoiler.position.set(0, 0.75, -1.35);

  const wheelGeo = new THREE.BoxGeometry(0.35, 0.35, 0.7);
  const wheelFL = new THREE.Mesh(wheelGeo, wheelMat);
  wheelFL.position.set(-0.9, 0.15, 0.9);
  const wheelFR = wheelFL.clone();
  wheelFR.position.x = 0.9;
  const wheelBL = wheelFL.clone();
  wheelBL.position.z = -0.9;
  const wheelBR = wheelFR.clone();
  wheelBR.position.z = -0.9;

  group.add(base, hood, cabin, spoiler, wheelFL, wheelFR, wheelBL, wheelBR);

  return { group };
}

function createKart() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: "#ff7a1f",
    roughness: 0.6,
    flatShading: true,
  });
  const seatMat = new THREE.MeshStandardMaterial({
    color: "#1b1f3a",
    roughness: 0.7,
    flatShading: true,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: "#f4c95d",
    roughness: 0.5,
    flatShading: true,
  });
  const wheelMat = new THREE.MeshStandardMaterial({
    color: "#2b2b2b",
    roughness: 0.9,
    flatShading: true,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.28, 2.4), bodyMat);
  base.position.y = 0.28;
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.2, 0.7), bodyMat);
  nose.position.set(0, 0.45, 1.0);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.55, 0.9), seatMat);
  seat.position.set(0, 0.62, -0.1);
  const engine = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.32, 0.6), trimMat);
  engine.position.set(0, 0.55, -1.0);
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 0.3), trimMat);
  bumper.position.set(0, 0.2, 1.3);

  const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.35, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelFL = new THREE.Mesh(wheelGeo, wheelMat);
  wheelFL.position.set(-0.9, 0.22, 0.8);
  const wheelFR = wheelFL.clone();
  wheelFR.position.x = 0.9;
  const wheelBL = wheelFL.clone();
  wheelBL.position.z = -0.9;
  const wheelBR = wheelFR.clone();
  wheelBR.position.z = -0.9;

  group.add(base, nose, seat, engine, bumper, wheelFL, wheelFR, wheelBL, wheelBR);

  const spawnAngle = Math.PI * 0.15;
  const spawnRadius = raceTrack.radius + 6;
  const spawnPosition = new THREE.Vector3(
    Math.cos(spawnAngle) * spawnRadius,
    0,
    Math.sin(spawnAngle) * spawnRadius
  );
  const hoverHeight = 0.24;
  spawnPosition.y =
    Math.max(terrainHeight(spawnPosition.x, spawnPosition.z), island.seaLevel + 0.05) + hoverHeight;

  const heading = spawnAngle + Math.PI / 2;
  group.position.copy(spawnPosition);
  group.rotation.y = heading;

  return {
    group,
    speed: 0,
    heading,
    spawnPosition,
    spawnHeading: heading,
    radius: 1.6,
    acceleration: 16,
    maxSpeed: 18,
    drag: 4,
    turnSpeed: 2.2,
    hoverHeight,
  };
}

function createLights() {
  const group = new THREE.Group();

  const hemi = new THREE.HemisphereLight("#bfe8ff", "#2c4f3a", 0.9);
  group.add(hemi);

  const sun = new THREE.DirectionalLight("#ffd27a", 1);
  sun.position.set(20, 30, 10);
  group.add(sun);

  const rim = new THREE.PointLight("#2fd2c4", 0.35, 45);
  rim.position.set(-18, 12, -14);
  group.add(rim);

  return { group };
}

function createPortal() {
  const group = new THREE.Group();
  const ringGeo = new THREE.RingGeometry(2.2, 2.8, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: "#1fd3e5",
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;

  const coreGeo = new THREE.CircleGeometry(2.1, 32);
  const coreMat = new THREE.MeshBasicMaterial({
    color: "#7a4bff",
    transparent: true,
    opacity: 0.5,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.rotation.x = -Math.PI / 2;

  const glowGeo = new THREE.TorusGeometry(2.6, 0.18, 8, 32);
  const glowMat = new THREE.MeshBasicMaterial({
    color: "#ff7a1f",
    transparent: true,
    opacity: 0.65,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.rotation.x = Math.PI / 2;

  group.add(ring, core, glow);
  group.position.set(0, terrainHeight(0, 0) + 0.2, 0);

  return { group, ring, core, active: false };
}

function createPoster() {
  const loader = new THREE.TextureLoader();
  const texture = loader.load("assets/crash5-spyro.png");
  texture.colorSpace = THREE.SRGBColorSpace;

  const geometry = new THREE.PlaneGeometry(10, 14);
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(-8, terrainHeight(-8, -6) + 7, -6);
  mesh.rotation.y = Math.PI * 0.25;

  return mesh;
}

function createRegionLandmarks() {
  const group = new THREE.Group();
  group.add(createWumpaHub());
  group.add(createBadlands());
  group.add(createRiptoCity());
  group.add(createArtisanHomeworld());
  group.add(createOceanChains());
  return { group };
}

function createWumpaHub() {
  const group = new THREE.Group();
  const center = mapAnchors.wumpa.center;
  group.add(createRegionPatch(center, mapAnchors.wumpa.radius, mapAnchors.wumpa.color, 0.03));

  const hutMat = new THREE.MeshStandardMaterial({
    color: "#a0683d",
    roughness: 0.8,
    flatShading: true,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: "#355f3c",
    roughness: 0.9,
    flatShading: true,
  });
  const doorMat = new THREE.MeshStandardMaterial({
    color: "#2b1b14",
    roughness: 0.9,
    flatShading: true,
  });
  const tikiMat = new THREE.MeshStandardMaterial({
    color: "#6b3f26",
    roughness: 0.9,
    flatShading: true,
  });
  const tikiAccentMat = new THREE.MeshStandardMaterial({
    color: "#f4c95d",
    roughness: 0.7,
    flatShading: true,
  });
  const dockMat = new THREE.MeshStandardMaterial({
    color: "#8b5a2b",
    roughness: 0.85,
    flatShading: true,
  });

  const hutOffsets = [
    new THREE.Vector3(-6, 0, 3),
    new THREE.Vector3(4, 0, 6),
    new THREE.Vector3(6, 0, -2),
  ];
  hutOffsets.forEach((offset) => {
    const hut = createHut(hutMat, roofMat, doorMat);
    placeOnTerrain(hut.group, center.x + offset.x, center.z + offset.z);
    group.add(hut.group);
    registerObstacle(hut.group.position, hut.radius);
  });

  const tiki = createTiki(tikiMat, tikiAccentMat);
  placeOnTerrain(tiki.group, center.x - 2, center.z - 6);
  group.add(tiki.group);
  registerObstacle(tiki.group.position, tiki.radius);

  const dock = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.3, 1.4), dockMat);
  dock.rotation.y = -0.3;
  placeOnTerrain(dock, center.x + 7, center.z + 9, -0.1);
  group.add(dock);
  registerObstacle(dock.position, 2.4);

  const marker = createRegionMarker(mapAnchors.wumpa.name, mapAnchors.wumpa.labelColor);
  marker.position.set(center.x, terrainHeight(center.x, center.z) + 7.5, center.z);
  group.add(marker);

  return group;
}

function createBadlands() {
  const group = new THREE.Group();
  const center = mapAnchors.badlands.center;
  group.add(createRegionPatch(center, mapAnchors.badlands.radius, mapAnchors.badlands.color, 0.03));

  const lab = createLabModule();
  placeOnTerrain(lab, center.x - 5, center.z + 2);
  group.add(lab);
  registerObstacle(lab.position, 4.2);

  const tower = createScrapTower();
  placeOnTerrain(tower, center.x + 6, center.z - 4);
  group.add(tower);
  registerObstacle(tower.position, 3.2);

  const ventMat = new THREE.MeshStandardMaterial({
    color: "#4b3324",
    roughness: 0.9,
    flatShading: true,
  });
  const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 2.2, 6), ventMat);
  vent.position.y = 1.1;
  const ventGroup = new THREE.Group();
  ventGroup.add(vent);
  placeOnTerrain(ventGroup, center.x + 1, center.z + 7);
  group.add(ventGroup);
  registerObstacle(ventGroup.position, 1.4);

  const scrapGeo = new THREE.DodecahedronGeometry(1.1, 0);
  for (let i = 0; i < 4; i += 1) {
    const scrap = new THREE.Mesh(scrapGeo, ventMat);
    const x = center.x - 2 + Math.cos(i * 1.5) * 4;
    const z = center.z - 6 + Math.sin(i * 1.2) * 3;
    scrap.position.set(x, terrainHeight(x, z) + 0.8, z);
    group.add(scrap);
    registerObstacle(scrap.position, 1.3);
  }

  const marker = createRegionMarker(mapAnchors.badlands.name, mapAnchors.badlands.labelColor);
  marker.position.set(center.x, terrainHeight(center.x, center.z) + 7.2, center.z);
  group.add(marker);

  return group;
}

function createRiptoCity() {
  const group = new THREE.Group();
  const center = mapAnchors.ripto.center;
  group.add(createRegionPatch(center, mapAnchors.ripto.radius, mapAnchors.ripto.color, 0.03));

  const volcano = createVolcano();
  placeOnTerrain(volcano.group, center.x + 2, center.z + 1);
  group.add(volcano.group);
  registerObstacle(volcano.group.position, 6.2);

  const spireOffsets = [
    new THREE.Vector3(-6, 0, -2),
    new THREE.Vector3(5, 0, 6),
    new THREE.Vector3(8, 0, -5),
  ];
  spireOffsets.forEach((offset, index) => {
    const spire = createRiptoSpire(4.5 + index * 1.2);
    placeOnTerrain(spire, center.x + offset.x, center.z + offset.z);
    group.add(spire);
    registerObstacle(spire.position, 2);
  });

  const poolOffsets = [
    new THREE.Vector3(-4, 0, 7),
    new THREE.Vector3(4, 0, -7),
    new THREE.Vector3(9, 0, 1),
  ];
  poolOffsets.forEach((offset) => {
    const pool = createLavaPool(2.6);
    placeOnTerrain(pool, center.x + offset.x, center.z + offset.z, 0.08);
    group.add(pool);
  });

  const marker = createRegionMarker(mapAnchors.ripto.name, mapAnchors.ripto.labelColor);
  marker.position.set(center.x, terrainHeight(center.x, center.z) + 7.2, center.z);
  group.add(marker);

  return group;
}

function createArtisanHomeworld() {
  const group = new THREE.Group();
  const center = mapAnchors.artisan.center;
  group.add(createRegionPatch(center, mapAnchors.artisan.radius, mapAnchors.artisan.color, 0.03));

  const castle = createCastle();
  placeOnTerrain(castle, center.x, center.z + 2);
  group.add(castle);
  registerObstacle(castle.position, 4.8);

  const floatingOffsets = [
    new THREE.Vector3(-7, 0, -4),
    new THREE.Vector3(6, 0, -2),
    new THREE.Vector3(2, 0, 6),
  ];
  floatingOffsets.forEach((offset, index) => {
    const island = createFloatingIsland(2.4 + index * 0.2);
    const x = center.x + offset.x;
    const z = center.z + offset.z;
    const y = terrainHeight(x, z) + 6 + index * 0.6;
    island.position.set(x, y, z);
    group.add(island);
  });

  const marker = createRegionMarker(mapAnchors.artisan.name, mapAnchors.artisan.labelColor);
  marker.position.set(center.x, terrainHeight(center.x, center.z) + 7.2, center.z);
  group.add(marker);

  return group;
}

function createOceanChains() {
  const group = new THREE.Group();
  const angles = [0.3, 1.05, 1.9, 2.75, 3.7, 4.55, 5.4];
  const sandMat = new THREE.MeshStandardMaterial({
    color: "#f1d9a8",
    roughness: 0.9,
    flatShading: true,
  });
  const rockMat = new THREE.MeshStandardMaterial({
    color: "#3a4a5e",
    roughness: 0.9,
    flatShading: true,
  });
  const palmTrunkMat = new THREE.MeshStandardMaterial({
    color: "#8b5a2b",
    roughness: 0.9,
    flatShading: true,
  });
  const palmLeafMat = new THREE.MeshStandardMaterial({
    color: "#2f8f4f",
    roughness: 0.8,
    flatShading: true,
    side: THREE.DoubleSide,
  });

  angles.forEach((angle, index) => {
    const radius = world.radius - 2 + (index % 2);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const islet = createIsland(2.2 + (index % 3) * 0.3, sandMat, rockMat);
    const ground = Math.max(terrainHeight(x, z), islet.seaLevel - 0.2);
    islet.group.position.set(x, ground + 0.2, z);
    group.add(islet.group);
    registerObstacle(islet.group.position, islet.radius);

    if (index % 2 === 0) {
      const palm = createPalm(palmTrunkMat, palmLeafMat);
      palm.group.scale.setScalar(0.8);
      palm.group.position.set(x + 0.6, ground + 0.2, z - 0.4);
      group.add(palm.group);
      registerObstacle(palm.group.position, palm.radius * 0.8);
    }
  });

  const boat = createBoat();
  boat.position.set(4, island.seaLevel + 0.25, world.radius - 2);
  group.add(boat);

  const marker = createRegionMarker("Island Chains", "#1fd3e5");
  marker.position.set(0, island.seaLevel + 8, world.radius - 3);
  group.add(marker);

  return group;
}

function createSkyRift() {
  const group = new THREE.Group();
  group.position.set(0, 26, 0);

  const outerMat = new THREE.MeshBasicMaterial({
    color: "#1fd3e5",
    transparent: true,
    opacity: 0.6,
  });
  const innerMat = new THREE.MeshBasicMaterial({
    color: "#7a4bff",
    transparent: true,
    opacity: 0.6,
  });
  const swirlMat = new THREE.MeshBasicMaterial({
    color: "#ff7a1f",
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
  });
  const coreMat = new THREE.MeshBasicMaterial({
    color: "#8b5cf6",
    transparent: true,
    opacity: 0.45,
  });

  const outer = new THREE.Mesh(new THREE.TorusGeometry(12, 0.6, 8, 40), outerMat);
  outer.rotation.x = Math.PI / 2;
  const inner = new THREE.Mesh(new THREE.TorusGeometry(7.5, 0.4, 8, 32), innerMat);
  inner.rotation.x = Math.PI / 2;
  const swirl = new THREE.Mesh(new THREE.RingGeometry(3.5, 6.2, 32), swirlMat);
  swirl.rotation.x = -Math.PI / 2;
  const core = new THREE.Mesh(new THREE.SphereGeometry(2.4, 12, 12), coreMat);

  const glow = new THREE.PointLight("#7a4bff", 0.6, 60);
  glow.position.set(0, 0, 0);

  group.add(outer, inner, swirl, core, glow);

  return { group, outer, inner, swirl, core };
}

function createRegionPatch(center, radius, color, yOffset = 0.03) {
  const geometry = new THREE.CircleGeometry(radius, 48);
  geometry.rotateX(-Math.PI / 2);

  const baseY = terrainHeight(center.x, center.z);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const localX = position.getX(i);
    const localZ = position.getZ(i);
    const worldX = center.x + localX;
    const worldZ = center.z + localZ;
    const y = terrainHeight(worldX, worldZ) - baseY + yOffset;
    position.setY(i, y);
  }
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.95,
    flatShading: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(center.x, baseY, center.z);
  return mesh;
}

function createRegionMarker(label, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(8, 12, 24, 0.82)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
  let fontSize = 40;
  ctx.font = `bold ${fontSize}px "Space Grotesk", Trebuchet MS, sans-serif`;
  if (ctx.measureText(label).width > canvas.width - 40) {
    fontSize = 32;
    ctx.font = `bold ${fontSize}px "Space Grotesk", Trebuchet MS, sans-serif`;
  }
  ctx.fillStyle = "#f8fafc";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(8, 2, 1);
  return sprite;
}

function placeOnTerrain(group, x, z, yOffset = 0) {
  const ground = Math.max(terrainHeight(x, z), island.seaLevel + 0.05);
  group.position.set(x, ground + yOffset, z);
}

function registerObstacle(position, radius) {
  obstacles.push({ position, radius });
}

function createLabModule() {
  const group = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({
    color: "#4b5563",
    roughness: 0.85,
    flatShading: true,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: "#1fd3e5",
    roughness: 0.4,
    flatShading: true,
  });
  const base = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.6, 3.2), baseMat);
  base.position.y = 0.8;
  const tower = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.6, 1.4), baseMat);
  tower.position.set(1.6, 1.6, -0.8);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), accentMat);
  dome.position.set(-1.3, 1.8, 0.6);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.2, 0.3), accentMat);
  stripe.position.set(0, 1.1, 1.6);
  group.add(base, tower, dome, stripe);
  return group;
}

function createScrapTower() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: "#5f3b2e",
    roughness: 0.9,
    flatShading: true,
  });
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.6, 2.2), mat);
  base.position.y = 1.8;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.4, 1.2), mat);
  slab.position.set(0, 3.4, 0);
  group.add(base, slab);
  return group;
}

function createVolcano() {
  const group = new THREE.Group();
  const rockMat = new THREE.MeshStandardMaterial({
    color: "#3b1f2b",
    roughness: 0.9,
    flatShading: true,
  });
  const lavaMat = new THREE.MeshStandardMaterial({
    color: "#ff6b3d",
    emissive: "#ff3b1f",
    emissiveIntensity: 0.8,
    roughness: 0.4,
    flatShading: true,
  });

  const cone = new THREE.Mesh(new THREE.ConeGeometry(6, 8, 8), rockMat);
  cone.position.y = 4;
  const crater = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 4.6, 2, 8, 1, true), rockMat);
  crater.position.y = 7;
  const lava = new THREE.Mesh(new THREE.CircleGeometry(3.1, 16), lavaMat);
  lava.rotation.x = -Math.PI / 2;
  lava.position.y = 7.1;

  group.add(cone, crater, lava);
  return { group };
}

function createLavaPool(radius) {
  const material = new THREE.MeshStandardMaterial({
    color: "#ff6b3d",
    emissive: "#ff3b1f",
    emissiveIntensity: 0.7,
    roughness: 0.5,
    flatShading: true,
  });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 16), material);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

function createRiptoSpire(height) {
  const mat = new THREE.MeshStandardMaterial({
    color: "#40202d",
    roughness: 0.8,
    flatShading: true,
  });
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.4, height, 6), mat);
  mesh.position.y = height * 0.5;
  return mesh;
}

function createCastle() {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    color: "#b8c0d9",
    roughness: 0.8,
    flatShading: true,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: "#8cc9ff",
    roughness: 0.6,
    flatShading: true,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.2, 3.4), stoneMat);
  base.position.y = 1.1;
  const towerLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 3.4, 6), stoneMat);
  towerLeft.position.set(-2.3, 1.7, -0.4);
  const towerRight = towerLeft.clone();
  towerRight.position.x = 2.3;
  const keep = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 2.0), stoneMat);
  keep.position.set(0, 2.2, -0.2);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.2, 6, 12, Math.PI), accentMat);
  arch.rotation.z = Math.PI;
  arch.position.set(0, 1.2, 1.8);

  group.add(base, towerLeft, towerRight, keep, arch);
  return group;
}

function createFloatingIsland(radius) {
  const group = new THREE.Group();
  const grassMat = new THREE.MeshStandardMaterial({
    color: "#63c59a",
    roughness: 0.8,
    flatShading: true,
  });
  const rockMat = new THREE.MeshStandardMaterial({
    color: "#3a4a5e",
    roughness: 0.9,
    flatShading: true,
  });

  const top = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.8, radius, 1.2, 8), grassMat);
  top.position.y = 0.6;
  const base = new THREE.Mesh(new THREE.ConeGeometry(radius * 1.1, 2.6, 8), rockMat);
  base.position.y = -0.8;
  group.add(top, base);
  return group;
}

function createIsland(radius, sandMat, rockMat) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.1, radius * 1.2, 1.6, 8), rockMat);
  base.position.y = 0.6;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.9, radius * 1.0, 0.6, 8), sandMat);
  top.position.y = 1.4;
  group.add(base, top);
  return { group, radius: radius * 1.1, seaLevel: island.seaLevel };
}

function createBoat() {
  const group = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({
    color: "#8b5a2b",
    roughness: 0.8,
    flatShading: true,
  });
  const sailMat = new THREE.MeshStandardMaterial({
    color: "#f8fafc",
    roughness: 0.6,
    flatShading: true,
    side: THREE.DoubleSide,
  });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.5, 1.4), hullMat);
  hull.position.y = 0.25;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.2, 6), hullMat);
  mast.position.set(0, 1.35, 0);
  const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.8), sailMat);
  sail.position.set(0.75, 1.35, 0);
  sail.rotation.y = Math.PI / 2;
  group.add(hull, mast, sail);
  group.rotation.y = -0.4;
  return group;
}

function createCave() {
  const group = new THREE.Group();
  const rockMat = new THREE.MeshStandardMaterial({
    color: "#3b4c5c",
    roughness: 0.9,
    flatShading: true,
  });
  const glowMat = new THREE.MeshBasicMaterial({
    color: "#7a4bff",
    transparent: true,
    opacity: 0.8,
  });

  const entrance = new THREE.Group();
  const leftRock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 0), rockMat);
  leftRock.position.set(-1.5, 1.1, 0);
  const rightRock = leftRock.clone();
  rightRock.position.x = 1.5;
  const topRock = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.2, 2.2), rockMat);
  topRock.position.set(0, 2.3, 0);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), glowMat);
  glow.position.set(0, 1.0, 0.6);
  entrance.add(leftRock, rightRock, topRock, glow);

  const entrancePosition = new THREE.Vector3(
    mapAnchors.badlands.center.x + 4,
    0,
    mapAnchors.badlands.center.z - 8
  );
  entrancePosition.y = Math.max(
    terrainHeight(entrancePosition.x, entrancePosition.z),
    island.seaLevel + 0.1
  );
  entrance.position.copy(entrancePosition);
  const entranceFacing = Math.atan2(-entrancePosition.x, -entrancePosition.z);
  entrance.rotation.y = entranceFacing;

  group.add(entrance);

  const interior = new THREE.Group();
  interior.visible = false;
  interior.position.set(0, -12, 0);

  const floorMat = new THREE.MeshStandardMaterial({
    color: "#2a2f3a",
    roughness: 0.95,
    flatShading: true,
  });
  const wallMat = new THREE.MeshStandardMaterial({
    color: "#1b1f2c",
    roughness: 0.95,
    flatShading: true,
    side: THREE.DoubleSide,
  });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(7.2, 24), floorMat);
  floor.rotation.x = -Math.PI / 2;
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(7.4, 7.4, 4, 24, 1, true), wallMat);
  wall.position.y = 2;
  const ceiling = new THREE.Mesh(new THREE.CircleGeometry(7.4, 24), wallMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 4;
  const caveLight = new THREE.PointLight("#7a4bff", 0.6, 18);
  caveLight.position.set(0, 3, 0);
  interior.add(floor, wall, ceiling, caveLight);

  const exitRingMat = new THREE.MeshBasicMaterial({
    color: "#1fd3e5",
    transparent: true,
    opacity: 0.7,
  });
  const exitCoreMat = new THREE.MeshBasicMaterial({
    color: "#7a4bff",
    transparent: true,
    opacity: 0.5,
  });
  const exit = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.12, 8, 16), exitRingMat);
  ring.rotation.x = Math.PI / 2;
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.9, 16), exitCoreMat);
  core.rotation.x = -Math.PI / 2;
  exit.add(ring, core);
  exit.position.set(0, 1.1, -5);
  interior.add(exit);

  const exitOffset = new THREE.Vector3(0, 0, 3).applyAxisAngle(
    new THREE.Vector3(0, 1, 0),
    entranceFacing
  );

  return {
    group,
    interior,
    entrancePosition,
    exitPosition: interior.position.clone().add(exit.position),
    exitSurface: entrancePosition.clone().add(exitOffset),
    spawnPosition: interior.position.clone().add(new THREE.Vector3(0, 0, 4)),
    center: interior.position.clone(),
    floorY: interior.position.y,
    radius: 7,
    crystalTotal: 6,
  };
}

function createNameTag(label, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(8, 12, 24, 0.85)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
  ctx.font = "bold 32px \"Space Grotesk\", Trebuchet MS, sans-serif";
  ctx.fillStyle = "#f8fafc";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3.2, 0.8, 1);
  return sprite;
}

function alignModelToGround(model) {
  const box = new THREE.Box3().setFromObject(model);
  if (!Number.isFinite(box.min.y)) {
    return;
  }
  model.position.y -= box.min.y;
}

function attachNameTag(npc) {
  if (npc.nameTag) {
    return;
  }
  const tag = createNameTag(npc.name, npc.nameColor);
  const box = new THREE.Box3().setFromObject(npc.group);
  const height = Number.isFinite(box.max.y) ? box.max.y - box.min.y : 3;
  tag.position.set(0, height + 0.6, 0);
  npc.group.add(tag);
  npc.nameTag = tag;
}

function loadNpcModel(npc, config) {
  gltfLoader.load(
    config.modelPath,
    (gltf) => {
      const model = gltf.scene || gltf.scenes[0];
      if (!model) {
        const fallback = config.fallbackBuilder();
        fallback.scale.setScalar(config.scale);
        alignModelToGround(fallback);
        npc.group.add(fallback);
        attachNameTag(npc);
        return;
      }
      model.scale.setScalar(config.scale);
      alignModelToGround(model);
      npc.group.add(model);
      attachNameTag(npc);
    },
    undefined,
    () => {
      const fallback = config.fallbackBuilder();
      fallback.scale.setScalar(config.scale);
      alignModelToGround(fallback);
      npc.group.add(fallback);
      attachNameTag(npc);
    }
  );
}

function createNpc(config) {
  const npc = {
    id: config.id,
    name: config.name,
    group: new THREE.Group(),
    intro: config.intro,
    request: config.request,
    complete: config.complete,
    idle: config.idle,
    bobOffset: config.bobOffset,
    nameColor: config.nameColor,
  };
  npc.group.position.set(
    config.position.x,
    terrainHeight(config.position.x, config.position.z) + 1.2,
    config.position.z
  );
  npc.baseY = npc.group.position.y;
  scene.add(npc.group);
  loadNpcModel(npc, config);
  return npc;
}

function createPlayer() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: "#1fd3e5", roughness: 0.4 });
  const ringMat = new THREE.MeshStandardMaterial({ color: "#7a4bff", emissive: "#7a4bff" });

  const body = new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 16), bodyMat);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.2, 10, 24), ringMat);
  ring.rotation.x = Math.PI / 2;

  group.add(body, ring);
  group.position.set(0, 0, 18);

  return {
    group,
    velocity: new THREE.Vector3(),
    radius: 1.2,
    speed: 8,
  };
}

function createNpcs() {
  return [createNpc(npcConfigs.crash), createNpc(npcConfigs.coco), createNpc(npcConfigs.spyro)];
}

function buildCrashModel() {
  const group = new THREE.Group();
  const furMat = new THREE.MeshStandardMaterial({
    color: "#f05b1b",
    roughness: 0.9,
    metalness: 0,
    flatShading: true,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: "#2b0f0a",
    roughness: 0.95,
    metalness: 0,
    flatShading: true,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: "#2c56d6",
    roughness: 0.8,
    metalness: 0,
    flatShading: true,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: "#7a2e26",
    roughness: 0.65,
    metalness: 0,
    flatShading: true,
  });
  const shoeTrimMat = new THREE.MeshStandardMaterial({
    color: "#f8fafc",
    roughness: 0.4,
    metalness: 0,
    flatShading: true,
  });
  const gloveMat = new THREE.MeshStandardMaterial({
    color: "#3c1a11",
    roughness: 0.85,
    metalness: 0,
    flatShading: true,
  });
  const muzzleMat = new THREE.MeshStandardMaterial({
    color: "#f1b4a5",
    roughness: 0.75,
    metalness: 0,
    flatShading: true,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: "#f8fafc",
    roughness: 0.35,
    metalness: 0,
    flatShading: true,
  });
  const pupilMat = new THREE.MeshStandardMaterial({
    color: "#111827",
    roughness: 0.65,
    metalness: 0,
    flatShading: true,
  });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.15, 1.7, 4), furMat);
  torso.position.y = 0.35;
  torso.rotation.y = Math.PI * 0.08;

  const hips = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 0.55, 4), pantsMat);
  hips.position.y = -0.65;
  hips.rotation.y = Math.PI * 0.08;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.85, 5, 4), furMat);
  head.position.y = 1.6;
  head.position.z = 0.15;
  head.scale.set(1.2, 1.0, 1.35);

  const snout = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.42, 1.4), muzzleMat);
  snout.position.set(0, 1.25, 1.05);

  const jaw = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.38, 0.95), muzzleMat);
  jaw.position.set(0, 0.95, 1.0);

  const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.25), shoeTrimMat);
  teeth.position.set(0, 0.96, 1.35);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.7, 4), darkMat);
  nose.position.set(0, 1.2, 1.55);
  nose.rotation.x = Math.PI * 0.5;

  const earGeo = new THREE.ConeGeometry(0.38, 1.1, 3);
  const earLeft = new THREE.Mesh(earGeo, darkMat);
  earLeft.position.set(-0.75, 2.2, 0.1);
  earLeft.rotation.z = 0.35;
  earLeft.rotation.x = -0.2;
  const earRight = earLeft.clone();
  earRight.position.x = 0.75;
  earRight.rotation.z = -0.35;

  const spikeGeo = new THREE.ConeGeometry(0.22, 0.9, 3);
  for (let i = 0; i < 5; i += 1) {
    const spike = new THREE.Mesh(spikeGeo, furMat);
    spike.position.set(-0.32 + i * 0.18, 2.45, -0.25 - i * 0.14);
    spike.rotation.x = -0.55;
    group.add(spike);
  }

  const eyeLeft = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.38, 0.1), eyeMat);
  eyeLeft.position.set(-0.3, 1.55, 0.75);
  const eyeRight = eyeLeft.clone();
  eyeRight.position.x = 0.3;
  const pupilLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.1), pupilMat);
  pupilLeft.position.set(-0.3, 1.52, 0.86);
  const pupilRight = pupilLeft.clone();
  pupilRight.position.x = 0.3;

  const browLeft = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.1), darkMat);
  browLeft.position.set(-0.32, 1.78, 0.68);
  browLeft.rotation.z = 0.28;
  const browRight = browLeft.clone();
  browRight.position.x = 0.32;
  browRight.rotation.z = -0.28;

  const armGeo = new THREE.CylinderGeometry(0.2, 0.26, 1.1, 4);
  const armLeft = new THREE.Mesh(armGeo, furMat);
  armLeft.position.set(-1.2, 0.4, 0.1);
  armLeft.rotation.z = 0.7;
  const armRight = armLeft.clone();
  armRight.position.x = 1.2;
  armRight.rotation.z = -0.7;

  const handLeft = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.4, 0.75), gloveMat);
  handLeft.position.set(-1.55, 0.05, 0.25);
  const handRight = handLeft.clone();
  handRight.position.x = 1.55;

  const legGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.85, 4);
  const legLeft = new THREE.Mesh(legGeo, furMat);
  legLeft.position.set(-0.38, -1.25, 0.05);
  const legRight = legLeft.clone();
  legRight.position.x = 0.38;

  const shoeLeft = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.35, 1.6), shoeMat);
  shoeLeft.position.set(-0.48, -1.62, 0.4);
  const shoeRight = shoeLeft.clone();
  shoeRight.position.x = 0.48;

  const soleLeft = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.15, 1.65), darkMat);
  soleLeft.position.set(-0.48, -1.79, 0.4);
  const soleRight = soleLeft.clone();
  soleRight.position.x = 0.48;

  const stripeLeft = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.75), shoeTrimMat);
  stripeLeft.position.set(-0.25, -1.45, 0.4);
  const stripeLeft2 = stripeLeft.clone();
  stripeLeft2.position.x = -0.48;
  const stripeRight = stripeLeft.clone();
  stripeRight.position.x = 0.25;
  const stripeRight2 = stripeLeft.clone();
  stripeRight2.position.x = 0.48;

  group.add(
    torso,
    hips,
    head,
    snout,
    jaw,
    teeth,
    nose,
    earLeft,
    earRight,
    eyeLeft,
    eyeRight,
    pupilLeft,
    pupilRight,
    browLeft,
    browRight,
    armLeft,
    armRight,
    handLeft,
    handRight,
    legLeft,
    legRight,
    shoeLeft,
    shoeRight,
    soleLeft,
    soleRight,
    stripeLeft,
    stripeLeft2,
    stripeRight,
    stripeRight2
  );

  return group;
}

function buildCocoModel() {
  const group = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({
    color: "#f6c45f",
    roughness: 0.85,
    metalness: 0,
    flatShading: true,
  });
  const outfitMat = new THREE.MeshStandardMaterial({
    color: "#ff6b6b",
    roughness: 0.75,
    metalness: 0,
    flatShading: true,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: "#f1c24c",
    roughness: 0.8,
    metalness: 0,
    flatShading: true,
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: "#2c56d6",
    roughness: 0.7,
    metalness: 0,
    flatShading: true,
  });
  const bandMat = new THREE.MeshStandardMaterial({
    color: "#ff3b30",
    roughness: 0.7,
    metalness: 0,
    flatShading: true,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: "#f8fafc",
    roughness: 0.3,
    metalness: 0,
    flatShading: true,
  });
  const pupilMat = new THREE.MeshStandardMaterial({
    color: "#111827",
    roughness: 0.6,
    metalness: 0,
    flatShading: true,
  });
  const gadgetMat = new THREE.MeshStandardMaterial({
    color: "#1fd3e5",
    roughness: 0.5,
    metalness: 0,
    flatShading: true,
  });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, 1.5, 5), skinMat);
  torso.position.y = 0.3;
  torso.rotation.y = Math.PI * 0.08;

  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.0, 0.6, 5), outfitMat);
  skirt.position.y = -0.6;
  skirt.rotation.y = Math.PI * 0.08;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.7, 5, 4), skinMat);
  head.position.y = 1.3;

  const eyeLeft = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.28, 0.1), eyeMat);
  eyeLeft.position.set(-0.18, 1.28, 0.55);
  const eyeRight = eyeLeft.clone();
  eyeRight.position.x = 0.18;
  const pupilLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), pupilMat);
  pupilLeft.position.set(-0.18, 1.25, 0.65);
  const pupilRight = pupilLeft.clone();
  pupilRight.position.x = 0.18;

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.9, 5, 4), hairMat);
  hair.position.set(0.25, 1.55, -0.2);
  hair.scale.set(1.05, 0.85, 0.9);

  const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.4), hairMat);
  fringe.position.set(0.2, 1.4, 0.45);

  const ponytail = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 4), hairMat);
  ponytail.position.set(0.85, 1.2, -0.7);
  ponytail.rotation.x = -0.8;

  const headband = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 4, 8), bandMat);
  headband.rotation.x = Math.PI / 2;
  headband.position.set(0, 1.35, 0.1);

  const armGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.7, 4);
  const armLeft = new THREE.Mesh(armGeo, skinMat);
  armLeft.position.set(-0.85, 0.35, 0.1);
  armLeft.rotation.z = 0.55;
  const armRight = armLeft.clone();
  armRight.position.x = 0.85;
  armRight.rotation.z = -0.55;

  const handLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.4), skinMat);
  handLeft.position.set(-1.1, 0.05, 0.2);
  const handRight = handLeft.clone();
  handRight.position.x = 1.1;

  const gadget = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.4), gadgetMat);
  gadget.position.set(1.0, 0.05, 0.45);
  const antenna = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 4), gadgetMat);
  antenna.position.set(1.0, 0.25, 0.45);

  const legGeo = new THREE.CylinderGeometry(0.16, 0.2, 0.6, 4);
  const legLeft = new THREE.Mesh(legGeo, skinMat);
  legLeft.position.set(-0.28, -1.1, 0);
  const legRight = legLeft.clone();
  legRight.position.x = 0.28;

  const bootLeft = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 0.8), bootMat);
  bootLeft.position.set(-0.28, -1.4, 0.2);
  const bootRight = bootLeft.clone();
  bootRight.position.x = 0.28;

  const bootTipLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.4), bandMat);
  bootTipLeft.position.set(-0.28, -1.28, 0.55);
  const bootTipRight = bootTipLeft.clone();
  bootTipRight.position.x = 0.28;

  group.add(
    torso,
    skirt,
    head,
    eyeLeft,
    eyeRight,
    pupilLeft,
    pupilRight,
    hair,
    fringe,
    ponytail,
    headband,
    armLeft,
    armRight,
    handLeft,
    handRight,
    gadget,
    antenna,
    legLeft,
    legRight,
    bootLeft,
    bootRight,
    bootTipLeft,
    bootTipRight
  );

  return group;
}

function buildSpyroModel() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: "#6b46f2",
    roughness: 0.85,
    metalness: 0,
    flatShading: true,
  });
  const bellyMat = new THREE.MeshStandardMaterial({
    color: "#f1c24c",
    roughness: 0.8,
    metalness: 0,
    flatShading: true,
  });
  const wingMat = new THREE.MeshStandardMaterial({
    color: "#f6d46b",
    roughness: 0.75,
    metalness: 0,
    flatShading: true,
    side: THREE.DoubleSide,
  });
  const hornMat = new THREE.MeshStandardMaterial({
    color: "#f4c95d",
    roughness: 0.75,
    metalness: 0,
    flatShading: true,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: "#f8fafc",
    roughness: 0.3,
    metalness: 0,
    flatShading: true,
  });
  const pupilMat = new THREE.MeshStandardMaterial({
    color: "#111827",
    roughness: 0.6,
    metalness: 0,
    flatShading: true,
  });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 1.6, 5), bodyMat);
  body.position.y = 0.3;
  body.rotation.y = Math.PI * 0.08;

  const belly = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.8), bellyMat);
  belly.position.set(0, 0.2, 0.55);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.75, 5, 4), bodyMat);
  head.position.y = 1.15;
  head.position.z = 0.4;

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.9), bodyMat);
  snout.position.set(0, 1.0, 1.05);

  const eyeLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.1), eyeMat);
  eyeLeft.position.set(-0.2, 1.15, 0.85);
  const eyeRight = eyeLeft.clone();
  eyeRight.position.x = 0.2;
  const pupilLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.1), pupilMat);
  pupilLeft.position.set(-0.2, 1.12, 0.95);
  const pupilRight = pupilLeft.clone();
  pupilRight.position.x = 0.2;

  const hornLeft = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 4), hornMat);
  hornLeft.position.set(-0.35, 1.75, 0.25);
  hornLeft.rotation.z = 0.4;
  hornLeft.rotation.x = -0.2;

  const hornRight = hornLeft.clone();
  hornRight.position.x = 0.35;
  hornRight.rotation.z = -0.4;

  const spineGeo = new THREE.ConeGeometry(0.14, 0.5, 4);
  for (let i = 0; i < 4; i += 1) {
    const spine = new THREE.Mesh(spineGeo, hornMat);
    spine.position.set(0, 1.0 - i * 0.2, -0.05 - i * 0.4);
    spine.rotation.x = -0.6;
    group.add(spine);
  }

  const wingGeo = new THREE.PlaneGeometry(1.4, 1.1, 1, 1);
  const wingLeft = new THREE.Mesh(wingGeo, wingMat);
  wingLeft.position.set(-1.1, 0.55, -0.1);
  wingLeft.rotation.y = -0.6;
  wingLeft.rotation.z = 0.2;

  const wingRight = wingLeft.clone();
  wingRight.position.x = 1.1;
  wingRight.rotation.y = 0.6;
  wingRight.rotation.z = -0.2;

  const armGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.6, 4);
  const armLeft = new THREE.Mesh(armGeo, bodyMat);
  armLeft.position.set(-0.85, 0.3, 0.2);
  armLeft.rotation.z = 0.7;
  const armRight = armLeft.clone();
  armRight.position.x = 0.85;
  armRight.rotation.z = -0.7;

  const clawLeft = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 4), hornMat);
  clawLeft.position.set(-1.05, 0.05, 0.35);
  clawLeft.rotation.x = -0.2;
  const clawRight = clawLeft.clone();
  clawRight.position.x = 1.05;

  const legGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.7, 4);
  const legLeft = new THREE.Mesh(legGeo, bodyMat);
  legLeft.position.set(-0.3, -1.0, 0.1);
  const legRight = legLeft.clone();
  legRight.position.x = 0.3;

  const footLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.8), bodyMat);
  footLeft.position.set(-0.3, -1.3, 0.35);
  const footRight = footLeft.clone();
  footRight.position.x = 0.3;

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.08, 1.6, 4), bodyMat);
  tail.position.set(0, -0.3, -1.2);
  tail.rotation.x = -0.9;

  const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 4), hornMat);
  tailTip.position.set(0, -0.85, -1.95);
  tailTip.rotation.x = -0.9;

  group.add(
    body,
    belly,
    head,
    snout,
    eyeLeft,
    eyeRight,
    pupilLeft,
    pupilRight,
    hornLeft,
    hornRight,
    armLeft,
    armRight,
    clawLeft,
    clawRight,
    legLeft,
    legRight,
    footLeft,
    footRight,
    wingLeft,
    wingRight,
    tail,
    tailTip
  );

  return group;
}

function createCollectibles() {
  const list = [];
  const types = ["wumpa", "gem", "cog"];
  const count = 6;

  types.forEach((type) => {
    for (let i = 0; i < count; i += 1) {
      const mesh = createCollectibleMesh(type);
      scene.add(mesh);
      const item = {
        type,
        mesh,
        hidden: false,
        timer: 0,
        baseY: 0,
        offset: Math.random() * Math.PI * 2,
      };
      respawnCollectible(item, true);
      list.push(item);
    }
  });

  return list;
}

function createCaveCollectibles() {
  const list = [];
  const count = cave.crystalTotal;

  for (let i = 0; i < count; i += 1) {
    const mesh = createCrystalMesh();
    const angle = Math.random() * Math.PI * 2;
    const radius = rand(1.5, cave.radius - 1.5);
    mesh.position.set(Math.cos(angle) * radius, 0.9 + Math.random() * 0.4, Math.sin(angle) * radius);
    cave.interior.add(mesh);
    list.push({
      mesh,
      baseY: mesh.position.y,
      offset: Math.random() * Math.PI * 2,
      collected: false,
    });
  }

  cave.crystalTotal = list.length;
  return list;
}

function createCollectibleMesh(type) {
  let mesh;
  if (type === "wumpa") {
    const material = new THREE.MeshStandardMaterial({
      color: "#ff7a1f",
      roughness: 0.8,
      flatShading: true,
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 10), material);
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.4, 6), material);
    leaf.position.y = 0.7;
    const group = new THREE.Group();
    group.add(body, leaf);
    mesh = group;
  } else if (type === "gem") {
    const material = new THREE.MeshStandardMaterial({
      color: "#7a4bff",
      roughness: 0.6,
      flatShading: true,
    });
    mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.65, 0), material);
  } else {
    const material = new THREE.MeshStandardMaterial({
      color: "#22d3ee",
      roughness: 0.6,
      flatShading: true,
    });
    mesh = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.2, 8, 16), material);
  }
  return mesh;
}

function createCrystalMesh() {
  const material = new THREE.MeshStandardMaterial({
    color: "#7a4bff",
    roughness: 0.5,
    emissive: "#3b1ba6",
    emissiveIntensity: 0.5,
    flatShading: true,
  });
  const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), material);
  return mesh;
}

function createPalm(trunkMat, leafMat) {
  const group = new THREE.Group();
  const trunk1 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 1.2, 5), trunkMat);
  trunk1.position.y = 0.6;
  const trunk2 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 1.1, 5), trunkMat);
  trunk2.position.y = 1.65;
  trunk2.rotation.z = -0.1;
  const trunk3 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.0, 5), trunkMat);
  trunk3.position.y = 2.55;
  trunk3.rotation.z = -0.15;
  group.add(trunk1, trunk2, trunk3);

  const leafGeo = new THREE.BoxGeometry(0.12, 0.08, 2.2);
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6;
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(Math.sin(angle) * 0.9, 3.1, Math.cos(angle) * 0.9);
    leaf.rotation.y = angle;
    leaf.rotation.x = -Math.PI / 2.6;
    group.add(leaf);
  }

  return { group, radius: 1.8 };
}

function createTiki(tikiMat, accentMat) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.6, 0.9), tikiMat);
  body.position.y = 1.3;
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 0.9), tikiMat);
  head.position.y = 2.4;

  const eyeLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.1), accentMat);
  eyeLeft.position.set(-0.2, 1.6, 0.5);
  const eyeRight = eyeLeft.clone();
  eyeRight.position.x = 0.2;
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.1), accentMat);
  mouth.position.set(0, 1.1, 0.5);

  group.add(body, head, eyeLeft, eyeRight, mouth);
  return { group, radius: 1.2 };
}

function createHut(baseMat, roofMat, doorMat) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 1.2, 6), baseMat);
  base.position.y = 0.6;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.4, 6), roofMat);
  roof.position.y = 1.6;
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.2), doorMat);
  door.position.set(0, 0.35, 1.0);
  group.add(base, roof, door);
  return { group, radius: 2.2 };
}

function createBush(bushMat) {
  const group = new THREE.Group();
  const blob1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6, 0), bushMat);
  blob1.position.set(0, 0.4, 0);
  const blob2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), bushMat);
  blob2.position.set(0.5, 0.3, 0.2);
  const blob3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), bushMat);
  blob3.position.set(-0.4, 0.25, -0.2);
  group.add(blob1, blob2, blob3);
  return { group, radius: 0.9 };
}

function createCrate(crateMat, stripeMat) {
  const group = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), crateMat);
  const stripeA = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.25, 1.25), stripeMat);
  const stripeB = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.18, 1.25), stripeMat);
  group.add(box, stripeA, stripeB);
  return group;
}

function spawnProps() {
  const rockMat = new THREE.MeshStandardMaterial({
    color: "#3a4a5e",
    roughness: 0.9,
    flatShading: true,
  });
  const crateMat = new THREE.MeshStandardMaterial({
    color: "#8f5a3c",
    roughness: 0.8,
    flatShading: true,
  });
  const crateStripeMat = new THREE.MeshStandardMaterial({
    color: "#f4c95d",
    roughness: 0.6,
    flatShading: true,
  });
  const trunkMat = new THREE.MeshStandardMaterial({
    color: "#8b5a2b",
    roughness: 0.9,
    flatShading: true,
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: "#2f8f4f",
    roughness: 0.8,
    flatShading: true,
    side: THREE.DoubleSide,
  });
  const tikiMat = new THREE.MeshStandardMaterial({
    color: "#6b3f26",
    roughness: 0.9,
    flatShading: true,
  });
  const tikiAccentMat = new THREE.MeshStandardMaterial({
    color: "#f4c95d",
    roughness: 0.7,
    flatShading: true,
  });
  const hutMat = new THREE.MeshStandardMaterial({
    color: "#a0683d",
    roughness: 0.8,
    flatShading: true,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: "#355f3c",
    roughness: 0.9,
    flatShading: true,
  });
  const doorMat = new THREE.MeshStandardMaterial({
    color: "#2b1b14",
    roughness: 0.9,
    flatShading: true,
  });
  const bushMat = new THREE.MeshStandardMaterial({
    color: "#2f8f6f",
    roughness: 0.9,
    flatShading: true,
  });

  const placeProp = (group, radius, minDistance = 10, yOffset = 0) => {
    const point = randomLandPoint(minDistance);
    group.position.set(point.x, terrainHeight(point.x, point.z) + yOffset, point.z);
    scene.add(group);
    obstacles.push({ position: group.position, radius });
    props.push(group);
  };

  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 16; i += 1) {
    const scale = rand(0.7, 1.8);
    const point = randomLandPoint(10);
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.scale.setScalar(scale);
    rock.position.set(point.x, terrainHeight(point.x, point.z) + scale * 0.6, point.z);
    scene.add(rock);
    obstacles.push({ position: rock.position, radius: 1.2 * scale });
    props.push(rock);
  }

  for (let i = 0; i < 12; i += 1) {
    const palm = createPalm(trunkMat, leafMat);
    placeProp(palm.group, palm.radius, 12);
  }

  for (let i = 0; i < 6; i += 1) {
    const tiki = createTiki(tikiMat, tikiAccentMat);
    placeProp(tiki.group, tiki.radius, 14);
  }

  for (let i = 0; i < 3; i += 1) {
    const hut = createHut(hutMat, roofMat, doorMat);
    placeProp(hut.group, hut.radius, 18);
  }

  for (let i = 0; i < 10; i += 1) {
    const point = randomLandPoint(12);
    const crate = createCrate(crateMat, crateStripeMat);
    crate.position.set(point.x, terrainHeight(point.x, point.z) + 0.7, point.z);
    scene.add(crate);
    obstacles.push({ position: crate.position, radius: 1.4 });
    props.push(crate);
  }

  for (let i = 0; i < 14; i += 1) {
    const bush = createBush(bushMat);
    placeProp(bush.group, bush.radius, 8);
  }
}

function randomLandPoint(minDistance) {
  let x = 0;
  let z = 0;
  let distance = 0;
  let onTrack = false;
  let tries = 0;
  do {
    const angle = Math.random() * Math.PI * 2;
    const radius = rand(minDistance, world.radius - 2);
    x = Math.cos(angle) * radius;
    z = Math.sin(angle) * radius;
    distance = Math.hypot(x, z);
    onTrack = Math.abs(distance - raceTrack.radius) < raceTrack.width * 0.8;
    tries += 1;
  } while (
    (distance < minDistance || terrainHeight(x, z) < island.seaLevel + 0.25 || onTrack) &&
    tries < 20
  );

  return { x, z };
}

function terrainHeight(x, z) {
  // Wumpa Island falloff keeps a raised center and shores near sea level.
  const distance = Math.hypot(x, z);
  const falloff = clamp(1 - (distance / island.radius) ** 2, 0, 1);
  const noise =
    Math.sin(x * 0.08) * 1.4 +
    Math.sin(z * 0.1) * 1.1 +
    Math.sin((x + z) * 0.05) * 0.7;
  return island.seaLevel + 3.6 * falloff + noise * 0.5 * falloff;
}

function createSkyTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, "#5fb6ff");
  gradient.addColorStop(0.55, "#2b6fcf");
  gradient.addColorStop(1, "#0b183d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const sunX = size * 0.78;
  const sunY = size * 0.22;
  const sun = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 120);
  sun.addColorStop(0, "rgba(255, 217, 102, 0.9)");
  sun.addColorStop(1, "rgba(255, 217, 102, 0)");
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 120, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 90; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 1.6;
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.45})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 8; i += 1) {
    const cloudX = Math.random() * size * 0.9;
    const cloudY = Math.random() * size * 0.4 + size * 0.1;
    const cloudW = 40 + Math.random() * 60;
    const cloudH = 16 + Math.random() * 18;
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.beginPath();
    ctx.ellipse(cloudX, cloudY, cloudW, cloudH, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function normalizeAngle(angle) {
  const twoPi = Math.PI * 2;
  let wrapped = (angle + Math.PI) % twoPi;
  if (wrapped < 0) {
    wrapped += twoPi;
  }
  return wrapped - Math.PI;
}

function lerpAngle(start, end, amount) {
  const diff = ((end - start + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return start + diff * amount;
}

function loop() {
  requestAnimationFrame(loop);
  const delta = Math.min(clock.getDelta(), 0.05);
  update(delta);
  renderer.render(scene, camera);
}

loop();
