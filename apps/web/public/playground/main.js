import * as THREE from "/vendor/three/three.module.js";

const sceneEl = document.getElementById("scene");
const startOverlay = document.getElementById("start");
const startBtn = document.getElementById("startBtn");
const agentListEl = document.getElementById("agentList");
const agentNameEl = document.getElementById("agentName");
const agentRoleEl = document.getElementById("agentRole");
const agentTagsEl = document.getElementById("agentTags");
const actionSelectEl = document.getElementById("actionSelect");
const directiveEl = document.getElementById("directive");
const sendBtn = document.getElementById("sendBtn");
const requestStatusEl = document.getElementById("requestStatus");
const statusFeedEl = document.getElementById("statusFeed");
const locationListEl = document.getElementById("locationList");
const promptEl = document.getElementById("prompt");
const promptTextEl = document.getElementById("promptText");
const enterBtn = document.getElementById("enterBtn");

const actionOptions = [
  { value: "status.check", label: "Status check" },
  { value: "repo.sync", label: "Sync GitHub repo" },
  { value: "repo.scan", label: "Scan repo for changes" },
  { value: "assets.index", label: "Index local assets" },
  { value: "platform.health", label: "Check platform APIs" },
  { value: "storysphere.draft", label: "Draft StorySphere beat" },
  { value: "liveloop.schedule", label: "Prepare LiveLoop rundown" }
];

const capabilityPalette = {
  generator: "#5fd0ff",
  catalog: "#7bf5b3",
  scheduler: "#f6c65b",
  liveloop: "#ff7c5c",
  proof: "#ffd166",
  moderator: "#ff8aa0",
  monitor: "#9bb0ff",
  assistant: "#36e0c3",
  custom: "#c8d7ff"
};

const parkZones = [
  {
    id: "ace-hq",
    name: "ACE HQ",
    description: "Agent creation, manifest craft, orchestration.",
    category: "Core Command",
    color: "#182748",
    accent: "#36e0c3",
    size: [10, 10, 16],
    position: [-8, 0, 10],
    href: "/ace/create"
  },
  {
    id: "orchestration-atrium",
    name: "Orchestration Atrium",
    description: "Mission routing, dispatch lanes, escalation desk.",
    category: "Core Command",
    color: "#182748",
    accent: "#4af1d2",
    size: [12, 8, 10],
    position: [4, 0, 14],
    href: "/playground"
  },
  {
    id: "approval-hall",
    name: "Approval Hall",
    description: "Human approvals and policy checkpoints.",
    category: "Core Command",
    color: "#182748",
    accent: "#5fd0ff",
    size: [7, 6, 7],
    position: [-2, 0, 2],
    href: "/control-panel/approvals"
  },
  {
    id: "repo-workshop",
    name: "Repo Workshop",
    description: "GitHub syncs, diffs, and code review prep.",
    category: "Data & Assets",
    color: "#1b2a3f",
    accent: "#7bf5b3",
    size: [18, 10, 7],
    position: [-34, 0, 2],
    href: "/developers"
  },
  {
    id: "asset-bay",
    name: "Asset Bay",
    description: "Content library intake, tagging, delivery.",
    category: "Data & Assets",
    color: "#1b2a3f",
    accent: "#7bf5b3",
    size: [20, 12, 8],
    position: [-32, 0, 20],
    href: "/studio"
  },
  {
    id: "memory-vault",
    name: "Memory Vault",
    description: "Long-term knowledge and twin memory storage.",
    category: "Data & Assets",
    color: "#1b2a3f",
    accent: "#5fd0ff",
    size: [10, 8, 12],
    position: [-18, 0, 4],
    href: "/products"
  },
  {
    id: "api-hub",
    name: "API Hub",
    description: "Platform endpoints, health checks, routing.",
    category: "Data & Assets",
    color: "#1b2a3f",
    accent: "#9bb0ff",
    size: [8, 6, 9],
    position: [-12, 0, -4],
    href: "/developers#api"
  },
  {
    id: "storysphere-studio",
    name: "StorySphere Studio",
    description: "Narrative direction, scene authoring, canon.",
    category: "Creation & Story",
    color: "#2a1b16",
    accent: "#f6c65b",
    size: [12, 10, 12],
    position: [18, 0, 16],
    href: "/storysphere"
  },
  {
    id: "world-lab",
    name: "World Lab",
    description: "Worldbuilding, environment systems, lore.",
    category: "Creation & Story",
    color: "#2a1b16",
    accent: "#ffb703",
    size: [10, 8, 10],
    position: [30, 0, 8],
    href: "/storysphere"
  },
  {
    id: "character-twin-wing",
    name: "Character Twin Wing",
    description: "Digital twin personality and voice tuning.",
    category: "Creation & Story",
    color: "#2a1b16",
    accent: "#ffd166",
    size: [9, 8, 9],
    position: [26, 0, 26],
    href: "/storysphere"
  },
  {
    id: "liveloop-stage",
    name: "LiveLoop Stage",
    description: "Live broadcast planning and show flow.",
    category: "Broadcast",
    color: "#1c203c",
    accent: "#ff7c5c",
    size: [14, 10, 11],
    position: [28, 0, -28],
    href: "/liveloop"
  },
  {
    id: "news-tower",
    name: "News Tower",
    description: "News division newsroom, editorial hub, live coverage.",
    category: "Media",
    color: "#1c203c",
    accent: "#ff9f6e",
    size: [8, 8, 22],
    position: [24, 0, -6],
    href: "/news"
  },
  {
    id: "marketplace",
    name: "Marketplace",
    description: "ILLUVRSE store + Amazon storefront commerce.",
    category: "Commerce",
    color: "#1b2136",
    accent: "#f6c65b",
    size: [22, 12, 8],
    position: [-30, 0, -18],
    href: "/marketplace"
  },
  {
    id: "telemetry-ops",
    name: "Telemetry Ops",
    description: "System health, latency, cost dashboards.",
    category: "Infrastructure",
    color: "#161f36",
    accent: "#9bb0ff",
    size: [9, 7, 9],
    position: [-20, 0, -16],
    href: "/status"
  },
  {
    id: "incident-bay",
    name: "Incident Bay",
    description: "Alerts, incident response, recovery drills.",
    category: "Infrastructure",
    color: "#161f36",
    accent: "#ff8aa0",
    size: [12, 8, 8],
    position: [-34, 0, -26],
    href: "/control-panel"
  },
  {
    id: "moms-kitchen",
    name: "Mom's Kitchen",
    description: "HGTV meal planner + cafe for the agent campus.",
    category: "Hospitality",
    color: "#2c1f1a",
    accent: "#ffb703",
    size: [10, 8, 6],
    position: [6, 0, 28],
    href: "/food"
  },
  {
    id: "gridstock-exchange",
    name: "GridStock Exchange",
    description: "CNBC-style market floor and Wall Street sim.",
    category: "Finance",
    color: "#151c2e",
    accent: "#5fc5ff",
    size: [12, 10, 18],
    position: [34, 0, -2],
    href: "/gridstock"
  },
  {
    id: "gamegrid-arena",
    name: "GameGrid Arena",
    description: "Arcade + stadium, GameGrid launchpad.",
    category: "Experience",
    color: "#18203a",
    accent: "#9bb0ff",
    size: [24, 16, 5],
    position: [6, 0, -18],
    href: "/studio/gamegrid"
  }
];

const fallbackAgents = [
  {
    id: "ace-orchestrator",
    name: "Orchestrator",
    role: "Mission Control",
    hub: "Orchestration Atrium",
    location: "Orchestration Atrium",
    capabilities: ["assistant", "scheduler"]
  },
  {
    id: "mission-planner",
    name: "Mission Planner",
    role: "Dispatch Planner",
    hub: "ACE HQ",
    location: "ACE HQ",
    capabilities: ["scheduler", "assistant"]
  },
  {
    id: "approval-clerk",
    name: "Approval Clerk",
    role: "Policy Desk",
    hub: "Approval Hall",
    location: "Approval Hall",
    capabilities: ["proof", "assistant"]
  },
  {
    id: "repo-scout",
    name: "Repo Scout",
    role: "GitHub Navigator",
    hub: "Repo Workshop",
    location: "Repo Workshop",
    capabilities: ["monitor", "assistant"]
  },
  {
    id: "asset-curator",
    name: "Asset Curator",
    role: "Library Ops",
    hub: "Asset Bay",
    location: "Asset Bay",
    capabilities: ["catalog", "assistant"]
  },
  {
    id: "memory-keeper",
    name: "Memory Keeper",
    role: "Knowledge Vault",
    hub: "Memory Vault",
    location: "Memory Vault",
    capabilities: ["assistant", "monitor"]
  },
  {
    id: "api-ops",
    name: "API Ops",
    role: "Platform Sentinel",
    hub: "API Hub",
    location: "API Hub",
    capabilities: ["monitor", "assistant"]
  },
  {
    id: "storysphere-director",
    name: "StorySphere Director",
    role: "Narrative Control",
    hub: "StorySphere Studio",
    location: "StorySphere Studio",
    capabilities: ["generator", "assistant"]
  },
  {
    id: "world-lab-architect",
    name: "World Lab Architect",
    role: "Worldbuilding",
    hub: "World Lab",
    location: "World Lab",
    capabilities: ["generator", "catalog"]
  },
  {
    id: "twin-manager",
    name: "Twin Manager",
    role: "Character Twins",
    hub: "Character Twin Wing",
    location: "Character Twin Wing",
    capabilities: ["assistant", "catalog"]
  },
  {
    id: "liveloop-producer",
    name: "LiveLoop Producer",
    role: "Broadcast Ops",
    hub: "LiveLoop Stage",
    location: "LiveLoop Stage",
    capabilities: ["liveloop", "scheduler"]
  },
  {
    id: "news-desk",
    name: "News Desk",
    role: "News Ops",
    hub: "News Tower",
    location: "News Tower",
    capabilities: ["monitor", "liveloop"]
  },
  {
    id: "marketplace-steward",
    name: "Marketplace Steward",
    role: "Commerce Ops",
    hub: "Marketplace",
    location: "Marketplace",
    capabilities: ["catalog", "assistant"]
  },
  {
    id: "telemetry-analyst",
    name: "Telemetry Analyst",
    role: "System Health",
    hub: "Telemetry Ops",
    location: "Telemetry Ops",
    capabilities: ["monitor", "assistant"]
  },
  {
    id: "incident-responder",
    name: "Incident Responder",
    role: "Recovery Lead",
    hub: "Incident Bay",
    location: "Incident Bay",
    capabilities: ["moderator", "monitor"]
  },
  {
    id: "gamegrid-marshal",
    name: "GameGrid Marshal",
    role: "Arcade Ops",
    hub: "GameGrid Arena",
    location: "GameGrid Arena",
    capabilities: ["assistant", "generator"]
  }
];

const world = {
  radius: 48,
  floor: 0
};

const gameState = {
  started: false
};

const input = {
  keys: new Set(),
  dragging: false,
  lastX: 0,
  lastY: 0,
  moved: 0
};

const player = {
  position: new THREE.Vector3(0, 0, 22),
  yaw: Math.PI,
  pitch: 0.08,
  height: 2.6,
  speed: 6,
  sprint: 10
};

const cameraVectors = {
  eye: new THREE.Vector3(),
  look: new THREE.Vector3()
};

const zoneTargets = [];
const zoneLookup = new Map();
const towerBeams = [];
const towerLights = [];

let agents = [];
let selectedAgent = null;
let statusHistory = [];
let statusStream = null;
const agentCards = new Map();

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
renderer.setSize(sceneEl.clientWidth, sceneEl.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
sceneEl.appendChild(renderer.domElement);
renderer.domElement.style.cursor = "grab";

const scene = new THREE.Scene();
scene.background = new THREE.Color("#0b1022");
scene.fog = new THREE.Fog("#0b1022", 18, 90);

const camera = new THREE.PerspectiveCamera(45, sceneEl.clientWidth / sceneEl.clientHeight, 0.1, 200);

const clock = new THREE.Clock();

const lights = createLights();
lights.forEach((light) => scene.add(light));

const sky = createSky();
scene.add(sky);

const ground = createGround();
scene.add(ground);

const canalRoutes = buildCanalRoutes();
const canals = createCanals(canalRoutes);
scene.add(canals);

const bridges = createBridges();
scene.add(bridges);

const gondolaFleet = createGondolaFleet(canalRoutes);
scene.add(gondolaFleet.group);

const lanterns = createLanterns();
scene.add(lanterns);

const plaza = createPlaza();
scene.add(plaza);

const core = createCore();
scene.add(core.group);

const buildings = createBuildings();
buildings.forEach((building) => scene.add(building.group));

const signalLines = createSignalLines(buildings, core.group.position);
scene.add(signalLines.group);

const selectionGroup = createSelection();
scene.add(selectionGroup.group);

let kioskTargets = [];
let kioskGroups = [];

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function updateCamera() {
  const eye = cameraVectors.eye;
  const look = cameraVectors.look;
  eye.set(player.position.x, player.position.y + player.height, player.position.z);
  look.set(
    Math.sin(player.yaw) * Math.cos(player.pitch),
    Math.sin(player.pitch),
    Math.cos(player.yaw) * Math.cos(player.pitch)
  );
  camera.position.copy(eye);
  camera.lookAt(eye.x + look.x, eye.y + look.y, eye.z + look.z);
}

updateCamera();

function createLights() {
  const ambient = new THREE.AmbientLight("#c9d5ff", 0.6);
  const key = new THREE.DirectionalLight("#ffffff", 0.9);
  key.position.set(20, 28, 12);
  const fill = new THREE.DirectionalLight("#75d8ff", 0.35);
  fill.position.set(-12, 18, -8);
  const accent = new THREE.PointLight("#36e0c3", 0.8, 50, 2);
  accent.position.set(-12, 8, 10);
  const accentTwo = new THREE.PointLight("#f6c65b", 0.7, 40, 2);
  accentTwo.position.set(14, 6, -10);
  return [ambient, key, fill, accent, accentTwo];
}

function createSkyTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#0a0f1f");
  gradient.addColorStop(0.5, "#0b1c2f");
  gradient.addColorStop(1, "#101b2e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(95, 197, 255, 0.12)";
  ctx.beginPath();
  ctx.arc(420, 160, 160, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(246, 198, 91, 0.12)";
  ctx.beginPath();
  ctx.arc(120, 120, 120, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSky() {
  const texture = createSkyTexture();
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(140, 40, 40), material);
  return dome;
}

function createGroundTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#0f172e";
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= size; i += 48) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(54, 224, 195, 0.2)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 170, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createGround() {
  const texture = createGroundTexture();
  const material = new THREE.MeshStandardMaterial({
    color: "#0d142a",
    roughness: 0.9,
    metalness: 0.1,
    map: texture
  });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(50, 80), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}

function buildCanalRoutes() {
  const y = 0.05;
  return [
    {
      id: "west-loop",
      width: 6.2,
      speed: 0.022,
      boats: 2,
      points: [
        new THREE.Vector3(-42, y, 14),
        new THREE.Vector3(-22, y, 14),
        new THREE.Vector3(-16, y, -4),
        new THREE.Vector3(-28, y, -22),
        new THREE.Vector3(-40, y, -22),
        new THREE.Vector3(-42, y, 14)
      ],
      closed: true
    },
    {
      id: "north-loop",
      width: 4.6,
      speed: 0.02,
      boats: 2,
      points: [
        new THREE.Vector3(-40, y, 24),
        new THREE.Vector3(-12, y, 26),
        new THREE.Vector3(6, y, 30),
        new THREE.Vector3(24, y, 26),
        new THREE.Vector3(36, y, 18),
        new THREE.Vector3(14, y, 18),
        new THREE.Vector3(-18, y, 20),
        new THREE.Vector3(-40, y, 24)
      ],
      closed: true
    },
    {
      id: "central-loop",
      width: 3.8,
      speed: 0.028,
      boats: 1,
      points: [
        new THREE.Vector3(-14, y, 8),
        new THREE.Vector3(-2, y, 12),
        new THREE.Vector3(10, y, 10),
        new THREE.Vector3(16, y, 2),
        new THREE.Vector3(8, y, -6),
        new THREE.Vector3(-6, y, -2),
        new THREE.Vector3(-14, y, 8)
      ],
      closed: true
    },
    {
      id: "south-loop",
      width: 5.4,
      speed: 0.021,
      boats: 2,
      points: [
        new THREE.Vector3(-42, y, -18),
        new THREE.Vector3(-10, y, -18),
        new THREE.Vector3(10, y, -20),
        new THREE.Vector3(34, y, -24),
        new THREE.Vector3(34, y, -8),
        new THREE.Vector3(14, y, -10),
        new THREE.Vector3(-6, y, -14),
        new THREE.Vector3(-42, y, -18)
      ],
      closed: true
    },
    {
      id: "east-loop",
      width: 4.8,
      speed: 0.023,
      boats: 2,
      points: [
        new THREE.Vector3(12, y, 12),
        new THREE.Vector3(34, y, 12),
        new THREE.Vector3(40, y, 2),
        new THREE.Vector3(34, y, -14),
        new THREE.Vector3(18, y, -14),
        new THREE.Vector3(12, y, -4),
        new THREE.Vector3(12, y, 12)
      ],
      closed: true
    }
  ];
}

function buildCanalSegments(points, width, material) {
  const group = new THREE.Group();
  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i];
    const end = points[i + 1];
    const dir = new THREE.Vector3().subVectors(end, start);
    const length = dir.length();
    if (length <= 0.01) continue;
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const segment = new THREE.Mesh(new THREE.BoxGeometry(length, 0.22, width), material);
    segment.position.set(mid.x, start.y, mid.z);
    segment.rotation.y = Math.atan2(dir.x, dir.z);
    segment.receiveShadow = true;
    group.add(segment);
  }
  return group;
}

function createCanals(routes) {
  const group = new THREE.Group();
  const waterMat = new THREE.MeshStandardMaterial({
    color: "#0a2a3f",
    roughness: 0.15,
    metalness: 0.85,
    transparent: true,
    opacity: 0.72,
    emissive: "#103b55",
    emissiveIntensity: 0.3
  });
  waterMat.depthWrite = false;

  routes.forEach((route) => {
    const pathGroup = buildCanalSegments(route.points, route.width, waterMat);
    group.add(pathGroup);
  });

  return group;
}

function createGondola(accent) {
  const group = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({
    color: "#111a2f",
    roughness: 0.6,
    metalness: 0.2,
    emissive: accent,
    emissiveIntensity: 0.18
  });
  const cabinMat = new THREE.MeshStandardMaterial({
    color: "#0b1428",
    roughness: 0.5,
    metalness: 0.3,
    emissive: accent,
    emissiveIntensity: 0.35
  });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.24, 3.2), hullMat);
  hull.position.y = 0.12;

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), hullMat);
  nose.position.set(0, 0.16, 1.55);
  const tail = nose.clone();
  tail.position.z = -1.55;

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 1.2), cabinMat);
  cabin.position.set(0, 0.45, 0);

  const lanternMat = new THREE.MeshStandardMaterial({
    color: "#1a2138",
    emissive: accent,
    emissiveIntensity: 1.4
  });
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), lanternMat);
  lantern.position.set(0, 0.6, 0.5);

  const glow = new THREE.PointLight(accent, 0.35, 6, 2);
  glow.position.set(0, 0.65, 0.5);

  group.add(hull, nose, tail, cabin, lantern, glow);
  return group;
}

function createGondolaFleet(routes) {
  const group = new THREE.Group();
  const gondolas = [];
  const accentCycle = ["#36e0c3", "#f6c65b", "#5fc5ff", "#ff7c5c"];
  routes.forEach((route, routeIndex) => {
    const curve = new THREE.CatmullRomCurve3(route.points, route.closed);
    const boats = route.boats ?? 1;
    for (let i = 0; i < boats; i += 1) {
      const accent = accentCycle[(routeIndex + i) % accentCycle.length];
      const gondola = createGondola(accent);
      const t = (i / boats + routeIndex * 0.12) % 1;
      gondola.position.copy(curve.getPointAt(t));
      group.add(gondola);
      gondolas.push({
        mesh: gondola,
        curve,
        t,
        speed: route.speed ?? 0.02,
        offset: Math.random() * Math.PI * 2
      });
    }
  });
  return { group, gondolas };
}

function createBridge(position, rotation, length = 8) {
  const group = new THREE.Group();
  const deckMat = new THREE.MeshStandardMaterial({ color: "#1a223a", roughness: 0.6, metalness: 0.2 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(length, 0.35, 3), deckMat);
  deck.position.y = 0.3;
  deck.rotation.y = rotation;
  group.add(deck);

  const railMat = new THREE.MeshStandardMaterial({ color: "#28334f", roughness: 0.5, metalness: 0.3 });
  const railLeft = new THREE.Mesh(new THREE.BoxGeometry(length, 0.25, 0.2), railMat);
  railLeft.position.set(0, 0.6, 1.5);
  railLeft.rotation.y = rotation;
  const railRight = railLeft.clone();
  railRight.position.z = -1.5;
  group.add(railLeft, railRight);

  group.position.copy(position);
  return group;
}

function createBridges() {
  const group = new THREE.Group();
  const specs = [
    { position: new THREE.Vector3(-6, 0, 8), rotation: Math.PI / 2, length: 9 },
    { position: new THREE.Vector3(8, 0, 10), rotation: Math.PI / 2, length: 9 },
    { position: new THREE.Vector3(-20, 0, -16), rotation: 0, length: 10 },
    { position: new THREE.Vector3(6, 0, -18), rotation: Math.PI / 2, length: 12 },
    { position: new THREE.Vector3(18, 0, 22), rotation: Math.PI / 2, length: 9 },
    { position: new THREE.Vector3(-28, 0, 22), rotation: 0, length: 10 },
    { position: new THREE.Vector3(30, 0, -12), rotation: 0, length: 8 }
  ];
  specs.forEach((spec) => {
    group.add(createBridge(spec.position, spec.rotation, spec.length));
  });
  return group;
}

function createLantern(position, color) {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: "#222b45", roughness: 0.6, metalness: 0.4 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2, 10), poleMat);
  pole.position.y = 1;
  const lanternMat = new THREE.MeshStandardMaterial({
    color: "#10192c",
    emissive: color,
    emissiveIntensity: 1.2
  });
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), lanternMat);
  lantern.position.y = 2.1;
  const light = new THREE.PointLight(color, 0.6, 8, 2);
  light.position.y = 2.2;
  group.add(pole, lantern, light);
  group.position.copy(position);
  return group;
}

function createLanterns() {
  const group = new THREE.Group();
  const lanterns = [
    [-4, 0, 6],
    [4, 0, 6],
    [-4, 0, -6],
    [4, 0, -6],
    [-12, 0, 18],
    [-18, 0, 14],
    [16, 0, 14],
    [22, 0, 10]
  ];
  lanterns.forEach((pos, idx) => {
    const color = idx % 2 === 0 ? "#36e0c3" : "#f6c65b";
    group.add(createLantern(new THREE.Vector3(pos[0], pos[1], pos[2]), color));
  });
  return group;
}

function createPlaza() {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CircleGeometry(12, 60),
    new THREE.MeshStandardMaterial({ color: "#101a34", roughness: 0.6, metalness: 0.3 })
  );
  base.rotation.x = -Math.PI / 2;
  base.position.y = 0.05;

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(12.5, 14.5, 80),
    new THREE.MeshStandardMaterial({ color: "#0d162e", roughness: 0.7, metalness: 0.25 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.08;

  group.add(base, ring);
  return group;
}

function createCore() {
  const group = new THREE.Group();
  const glowMat = new THREE.MeshStandardMaterial({
    color: "#1a2748",
    emissive: "#36e0c3",
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.6
  });

  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.8, 0.14, 18, 90), glowMat);
  ring.rotation.x = Math.PI / 2;
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 0), glowMat);
  const auraMat = new THREE.MeshStandardMaterial({
    color: "#36e0c3",
    emissive: "#36e0c3",
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.2
  });
  const aura = new THREE.Mesh(new THREE.SphereGeometry(2.4, 32, 32), auraMat);

  group.add(ring, orb, aura);
  group.position.set(0, 12, 0);
  return { group, ring, orb, aura };
}

function createWindowTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#162343";
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "rgba(90, 255, 230, 0.35)";
  for (let y = 16; y < size; y += 28) {
    for (let x = 14; x < size; x += 28) {
      const width = 10 + ((x + y) % 4);
      const height = 14 + ((x + y) % 6);
      ctx.fillRect(x, y, width, height);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createLabelTexture(text, accent) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(10, 16, 30, 0.8)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

  ctx.fillStyle = "#f5f7ff";
  let fontSize = 28;
  ctx.font = `bold ${fontSize}px Outfit, sans-serif`;
  while (ctx.measureText(text).width > canvas.width - 24 && fontSize > 14) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px Outfit, sans-serif`;
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createBuilding(zone) {
  const group = new THREE.Group();
  const windowTexture = createWindowTexture();
  const material = new THREE.MeshStandardMaterial({
    color: zone.color,
    roughness: 0.55,
    metalness: 0.25,
    map: windowTexture,
    emissive: zone.accent,
    emissiveIntensity: 0.35,
    emissiveMap: windowTexture
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(zone.size[0], zone.size[2], zone.size[1]), material);
  mesh.position.y = zone.size[2] / 2;
  group.add(mesh);

  const labelTexture = createLabelTexture(zone.name, zone.accent);
  if (labelTexture) {
    const labelMat = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true });
    const label = new THREE.Mesh(new THREE.PlaneGeometry(zone.size[0] * 0.9, zone.size[0] * 0.45), labelMat);
    label.position.set(0, zone.size[2] + 1.2, 0);
    group.add(label);
  }

  const towerHeight = Math.max(3.5, zone.size[2] * 0.35);
  const towerMat = new THREE.MeshStandardMaterial({
    color: "#10192c",
    emissive: zone.accent,
    emissiveIntensity: 0.9,
    roughness: 0.25,
    metalness: 0.7
  });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, towerHeight, 16), towerMat);
  shaft.position.y = zone.size[2] + towerHeight / 2;
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), towerMat);
  beacon.position.y = zone.size[2] + towerHeight + 0.35;

  const beamMat = new THREE.MeshStandardMaterial({
    color: zone.accent,
    emissive: zone.accent,
    emissiveIntensity: 1,
    transparent: true,
    opacity: 0.25
  });
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.2, 20, 1, true), beamMat);
  beam.position.y = zone.size[2] + towerHeight + 2.1;
  beam.rotation.x = Math.PI;

  const towerLight = new THREE.PointLight(zone.accent, 1, 22, 2);
  towerLight.position.y = zone.size[2] + towerHeight + 0.6;

  group.add(shaft, beacon, beam, towerLight);

  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(zone.size[0] * 1.4, zone.size[2] + towerHeight + 3, zone.size[1] * 1.4),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
  );
  hitbox.position.y = (zone.size[2] + towerHeight) / 2;
  hitbox.userData.zoneId = zone.id;
  hitbox.userData.href = zone.href;
  group.add(hitbox);

  group.position.set(zone.position[0], zone.position[1], zone.position[2]);

  zoneLookup.set(zone.id, zone);
  zoneTargets.push(hitbox);
  towerBeams.push(beam);
  towerLights.push(towerLight);

  const towerTop = new THREE.Vector3(
    zone.position[0],
    zone.position[1] + zone.size[2] + towerHeight + 2.2,
    zone.position[2]
  );

  return { group, zone, towerTop };
}

function createBuildings() {
  return parkZones.map((zone) => createBuilding(zone));
}

function createSignalLines(buildingNodes, target) {
  const group = new THREE.Group();
  const lines = [];
  buildingNodes.forEach((node) => {
    const start = node.towerTop.clone();
    const end = target.clone();
    const mid = start.clone().lerp(end, 0.5);
    mid.y += 6;
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const points = curve.getPoints(24);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
      color: node.zone.accent,
      dashSize: 1,
      gapSize: 0.7,
      transparent: true,
      opacity: 0.6
    });
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    group.add(line);
    lines.push(line);
  });
  return { group, lines };
}

function createBadgeTexture(text, accent) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "rgba(8, 14, 28, 0.8)";
  ctx.beginPath();
  ctx.arc(64, 64, 58, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.fillStyle = "#f5f7ff";
  ctx.font = "bold 34px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createAgentKiosk(agent, position) {
  const group = new THREE.Group();
  const accent = agent.accent || "#36e0c3";
  const baseMat = new THREE.MeshStandardMaterial({
    color: "#1a2748",
    emissive: accent,
    emissiveIntensity: 0.4,
    roughness: 0.35,
    metalness: 0.6
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.5, 24), baseMat);
  base.position.y = 0.25;

  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2.4, 18), baseMat);
  column.position.y = 1.6;

  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 16, 40), baseMat);
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 2.4;

  const badgeTexture = createBadgeTexture(agent.name.slice(0, 2).toUpperCase(), accent);
  if (badgeTexture) {
    const badgeMat = new THREE.MeshBasicMaterial({ map: badgeTexture, transparent: true });
    const badge = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), badgeMat);
    badge.position.set(0, 2.8, 0);
    group.add(badge);
  }

  const hitbox = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.8, 4.2, 16),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
  );
  hitbox.position.y = 2.1;
  hitbox.userData.agentId = agent.id;

  group.add(base, column, halo, hitbox);
  group.position.copy(position);
  group.userData.agentId = agent.id;

  return { group, halo, hitbox };
}

function createSelection() {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.2, 1.6, 48),
    new THREE.MeshBasicMaterial({ color: "#36e0c3", transparent: true, opacity: 0.8, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.25, 3.5, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: "#36e0c3", transparent: true, opacity: 0.35 })
  );
  beam.position.y = 1.8;
  group.add(ring, beam);
  group.visible = false;
  return { group, ring, beam };
}

function buildKioskPositions(count) {
  const radius = Math.min(world.radius - 14, 9 + Math.min(12, count * 0.7));
  const positions = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (i / Math.max(1, count)) * Math.PI * 2;
    positions.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }
  return positions;
}

function setAgents(next) {
  const previousId = selectedAgent?.id;
  agents = next.map((agent) => ({
    ...agent,
    accent: agent.accent || capabilityPalette[agent.capabilities?.[0]] || "#36e0c3"
  }));
  renderAgentList();
  renderLocationList();
  rebuildKiosks();
  const match = previousId ? agents.find((entry) => entry.id === previousId) : null;
  const fallback = agents[0] ?? null;
  if (match) {
    selectAgent(match.id);
  } else if (fallback) {
    selectAgent(fallback.id);
  }
}

function renderAgentList() {
  agentCards.clear();
  agentListEl.innerHTML = "";
  agents.forEach((agent) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "agent-card";
    card.style.setProperty("--accent", agent.accent || "#36e0c3");
    card.dataset.agentId = agent.id;

    const title = document.createElement("div");
    title.className = "agent-title";
    title.textContent = agent.name;

    const sub = document.createElement("div");
    sub.className = "agent-sub";
    const locationLabel = agent.location || agent.hub || "Campus";
    sub.textContent = `${agent.role} | ${locationLabel}`;

    const status = document.createElement("div");
    status.className = "agent-status";
    status.textContent = "idle";

    card.append(title, sub, status);
    card.addEventListener("click", () => selectAgent(agent.id));

    agentListEl.appendChild(card);
    agentCards.set(agent.id, { card, statusEl: status });
  });
}

function renderLocationList() {
  if (!locationListEl) return;
  locationListEl.innerHTML = "";
  parkZones.forEach((zone) => {
    const row = document.createElement("div");
    row.className = "location-row";
    row.style.borderColor = `${zone.accent}55`;

    const name = document.createElement("div");
    name.className = "location-name";
    name.textContent = zone.name;

    const desc = document.createElement("div");
    desc.className = "location-desc";
    desc.textContent = zone.description;

    const pill = document.createElement("div");
    pill.className = "location-pill";
    pill.textContent = zone.category;
    pill.style.color = zone.accent;
    pill.style.border = `1px solid ${zone.accent}55`;

    row.append(name, desc, pill);
    locationListEl.appendChild(row);
  });
}

function rebuildKiosks() {
  kioskGroups.forEach((kiosk) => scene.remove(kiosk.group));
  kioskTargets = [];
  kioskGroups = [];

  const positions = buildKioskPositions(agents.length || 1);
  agents.forEach((agent, index) => {
    const kiosk = createAgentKiosk(agent, positions[index]);
    scene.add(kiosk.group);
    kioskGroups.push(kiosk);
    kioskTargets.push(kiosk.hitbox);
    agent.kiosk = kiosk;
  });
}

function renderAgentTags(agent) {
  agentTagsEl.innerHTML = "";
  const tags = [agent.location, agent.hub, ...(agent.capabilities || [])].filter(Boolean);
  const uniqueTags = [...new Set(tags)];
  uniqueTags.forEach((tag) => {
    const span = document.createElement("span");
    span.className = "agent-tag";
    span.textContent = tag;
    agentTagsEl.appendChild(span);
  });
}

function selectAgent(agentId) {
  const agent = agents.find((entry) => entry.id === agentId);
  if (!agent) return;
  selectedAgent = agent;

  agentNameEl.textContent = agent.name;
  const locationLabel = agent.location || agent.hub || "Campus";
  agentRoleEl.textContent = `${agent.role} | ${locationLabel}`;
  renderAgentTags(agent);

  agentCards.forEach(({ card }, id) => {
    card.classList.toggle("active", id === agentId);
  });

  if (agent.kiosk) {
    selectionGroup.group.position.copy(agent.kiosk.group.position);
    selectionGroup.group.visible = true;
  }

  statusHistory = [];
  statusFeedEl.innerHTML = "";
  pushFeed({ status: "focus", message: `Tracking ${agent.name} status.`, timestamp: Date.now() });

  if (statusStream) {
    statusStream.close();
  }
  statusStream = startStatusStream(agent.id);
  refreshStatus(agent.id);
}

function formatTime(value) {
  const date = new Date(value);
  const pad = (num) => String(num).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function pushFeed(entry) {
  statusHistory = [entry, ...statusHistory].slice(0, 8);
  statusFeedEl.innerHTML = "";
  statusHistory.forEach((item) => {
    const row = document.createElement("div");
    row.className = "feed-row";

    const time = document.createElement("div");
    time.className = "feed-time";
    time.textContent = formatTime(item.timestamp || Date.now());

    const status = document.createElement("div");
    status.className = "feed-status";
    status.textContent = item.status || "update";

    const msg = document.createElement("div");
    msg.className = "feed-msg";
    msg.textContent = item.message || item.action || "";

    row.append(time, status, msg);
    statusFeedEl.appendChild(row);
  });
}

function updateStatus(agentId, status) {
  const cardEntry = agentCards.get(agentId);
  if (cardEntry) {
    cardEntry.statusEl.textContent = status.status || "idle";
  }
  if (selectedAgent && selectedAgent.id === agentId) {
    pushFeed({
      status: status.status || "update",
      message: status.message || status.action || "",
      timestamp: status.timestamp || Date.now()
    });
  }
}

function setRequestStatus(message, variant) {
  requestStatusEl.textContent = message;
  requestStatusEl.classList.remove("success", "error");
  if (variant) {
    requestStatusEl.classList.add(variant);
  }
}

async function requestAction() {
  if (!selectedAgent) {
    setRequestStatus("Select an agent first.", "error");
    return;
  }
  const action = actionSelectEl.value;
  const directive = directiveEl.value.trim();
  if (!directive) {
    setRequestStatus("Add a directive for the agent.", "error");
    return;
  }

  setRequestStatus("Submitting approval request...", "");

  try {
    const res = await fetch("/api/agent/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: selectedAgent.id,
        action,
        payload: { directive, source: "playground", timestamp: Date.now() },
        manifest: selectedAgent.manifest,
        requestedBy: "Playground"
      })
    });

    const payload = await res.json();
    if (!res.ok) {
      setRequestStatus(payload.error || "Request failed.", "error");
      return;
    }

    const requestId = payload?.request?.id || "pending";
    setRequestStatus(`Approval requested (${requestId}).`, "success");
    pushFeed({
      status: "approval",
      message: `Request ${requestId} submitted for ${selectedAgent.name}.`,
      timestamp: Date.now()
    });
    directiveEl.value = "";
  } catch (err) {
    setRequestStatus("Request failed. Check network or API.", "error");
  }
}

function startStatusStream(agentId) {
  const stream = new EventSource(`/api/agent/stream?id=${encodeURIComponent(agentId)}`);
  stream.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      updateStatus(agentId, data);
    } catch {
      // ignore bad messages
    }
  };
  stream.onerror = () => {
    pushFeed({ status: "stream", message: "Status stream disconnected.", timestamp: Date.now() });
  };
  return stream;
}

async function refreshStatus(agentId) {
  try {
    const res = await fetch(`/api/agent/status?id=${encodeURIComponent(agentId)}`);
    if (!res.ok) return;
    const data = await res.json();
    const latest = data.statuses?.[0];
    if (latest) {
      updateStatus(agentId, latest);
    }
  } catch {
    // ignore
  }
}

function handleResize() {
  const { clientWidth, clientHeight } = sceneEl;
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight);
}

function isTyping() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function handlePointerDown(event) {
  if (!gameState.started) return;
  input.dragging = true;
  input.moved = 0;
  input.lastX = event.clientX;
  input.lastY = event.clientY;
  renderer.domElement.style.cursor = "grabbing";
}

function handlePointerMove(event) {
  if (!gameState.started) return;
  if (!input.dragging) {
    updateHover(event);
    return;
  }
  const dx = event.clientX - input.lastX;
  const dy = event.clientY - input.lastY;
  input.lastX = event.clientX;
  input.lastY = event.clientY;
  input.moved += Math.abs(dx) + Math.abs(dy);

  player.yaw -= dx * 0.003;
  player.pitch = clamp(player.pitch - dy * 0.002, -0.35, 0.55);
  updateCamera();
}

function handlePointerUp(event) {
  if (!gameState.started) return;
  if (input.moved < 6) {
    pickInteractive(event);
  }
  input.dragging = false;
  renderer.domElement.style.cursor = "grab";
}

function updateHover(event) {
  const targets = [...zoneTargets, ...kioskTargets];
  if (!targets.length) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(targets, true);
  renderer.domElement.style.cursor = hits.length ? "pointer" : "grab";
}

function findUserData(node, key) {
  let current = node;
  while (current) {
    if (current.userData && current.userData[key]) return current.userData[key];
    current = current.parent;
  }
  return null;
}

function pickInteractive(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects([...zoneTargets, ...kioskTargets], true);
  if (!hits.length) return;
  const zoneId = findUserData(hits[0].object, "zoneId");
  if (zoneId) {
    const zone = zoneLookup.get(zoneId);
    if (zone) {
      openZone(zone);
      return;
    }
  }
  const agentId = findUserData(hits[0].object, "agentId");
  if (agentId) {
    selectAgent(agentId);
  }
}

function openZone(zone) {
  if (!zone || !zone.href) return;
  const opened = window.open(zone.href, "_blank", "noopener");
  if (opened) opened.opener = null;
}

const enterState = {
  zone: null,
  lastOpen: 0
};

function updateProximity() {
  if (!gameState.started) {
    if (promptEl) promptEl.classList.add("hidden");
    enterState.zone = null;
    return;
  }
  let closest = null;
  let best = Infinity;
  parkZones.forEach((zone) => {
    const dx = player.position.x - zone.position[0];
    const dz = player.position.z - zone.position[2];
    const dist = Math.hypot(dx, dz);
    const radius = Math.max(zone.size[0], zone.size[1]) * 0.55;
    const threshold = Math.max(7, radius);
    if (dist < threshold && dist < best) {
      best = dist;
      closest = zone;
    }
  });

  enterState.zone = closest;
  if (!promptEl || !promptTextEl) return;
  if (closest) {
    promptTextEl.textContent = `Press E or Enter to enter ${closest.name}`;
    promptEl.classList.remove("hidden");
  } else {
    promptEl.classList.add("hidden");
  }
}

function attemptEnter() {
  if (!gameState.started || !enterState.zone) return;
  const now = Date.now();
  if (now - enterState.lastOpen < 800) return;
  enterState.lastOpen = now;
  openZone(enterState.zone);
}

function updateMovement(delta) {
  if (!gameState.started) return;
  if (!input.keys.size || isTyping()) {
    updateCamera();
    return;
  }

  const forward = new THREE.Vector3(Math.sin(player.yaw), 0, Math.cos(player.yaw));
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  const move = new THREE.Vector3();

  if (input.keys.has("w")) move.add(forward);
  if (input.keys.has("s")) move.sub(forward);
  if (input.keys.has("d")) move.add(right);
  if (input.keys.has("a")) move.sub(right);

  if (move.lengthSq() > 0) {
    move.normalize();
    const speed = input.keys.has("shift") ? player.sprint : player.speed;
    player.position.addScaledVector(move, speed * delta);
  }

  const radial = new THREE.Vector2(player.position.x, player.position.z);
  if (radial.length() > world.radius) {
    radial.setLength(world.radius);
    player.position.x = radial.x;
    player.position.z = radial.y;
  }
  player.position.y = world.floor;
  updateCamera();
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.getElapsedTime();

  updateMovement(delta);
  updateProximity();

  core.ring.rotation.z = elapsed * 0.5;
  core.orb.rotation.y = elapsed * 0.6;
  core.aura.material.opacity = 0.16 + Math.sin(elapsed * 2) * 0.04;

  if (selectionGroup.group.visible) {
    const pulse = 1 + Math.sin(elapsed * 3) * 0.05;
    selectionGroup.ring.scale.set(pulse, pulse, pulse);
    selectionGroup.beam.material.opacity = 0.25 + 0.1 * Math.sin(elapsed * 2.2);
  }

  towerBeams.forEach((beam, index) => {
    beam.material.opacity = 0.18 + 0.08 * Math.sin(elapsed * 2 + index);
  });
  towerLights.forEach((light, index) => {
    light.intensity = 0.9 + 0.3 * Math.sin(elapsed * 2.4 + index);
  });

  gondolaFleet.gondolas.forEach((gondola, index) => {
    gondola.t = (gondola.t + gondola.speed * delta) % 1;
    const pos = gondola.curve.getPointAt(gondola.t);
    const next = gondola.curve.getPointAt((gondola.t + 0.01) % 1);
    const bob = Math.sin(elapsed * 2 + gondola.offset + index) * 0.04;
    gondola.mesh.position.set(pos.x, pos.y + 0.12 + bob, pos.z);
    gondola.mesh.lookAt(next.x, gondola.mesh.position.y, next.z);
  });

  signalLines.lines.forEach((line, index) => {
    line.material.dashOffset = (line.material.dashOffset ?? 0) - delta * (1 + index * 0.03);
  });

  kioskGroups.forEach((kiosk, index) => {
    const offset = elapsed * 1.1 + index;
    kiosk.halo.rotation.z = offset * 0.6;
  });

  renderer.render(scene, camera);
}

startBtn.addEventListener("click", () => {
  startOverlay.classList.add("hidden");
  gameState.started = true;
});

sendBtn.addEventListener("click", requestAction);

actionOptions.forEach((option) => {
  const entry = document.createElement("option");
  entry.value = option.value;
  entry.textContent = option.label;
  actionSelectEl.appendChild(entry);
});

renderer.domElement.addEventListener("pointerdown", handlePointerDown);
renderer.domElement.addEventListener("pointermove", handlePointerMove);
window.addEventListener("pointerup", handlePointerUp);
window.addEventListener("resize", handleResize);

if (enterBtn) {
  enterBtn.addEventListener("click", attemptEnter);
}

window.addEventListener("keydown", (event) => {
  if (isTyping()) return;
  const key = event.key.toLowerCase();
  if (["w", "a", "s", "d", "shift"].includes(key)) {
    input.keys.add(key);
  }
  if (key === "e" || key === "enter") {
    attemptEnter();
  }
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  input.keys.delete(key);
});

function hubForCapability(capability) {
  if (capability === "liveloop") return "LiveLoop Stage";
  if (capability === "catalog") return "Asset Bay";
  if (capability === "proof") return "Approval Hall";
  if (capability === "moderator") return "Incident Bay";
  if (capability === "monitor") return "Telemetry Ops";
  return "ACE HQ";
}

async function loadRegistryAgents() {
  try {
    const res = await fetch("/api/ace/registry");
    if (!res.ok) return null;
    const data = await res.json();
    const entries = data.entries || [];
    if (!entries.length) return null;
    return entries.slice(0, 16).map((entry) => {
      const manifest = entry.manifest || {};
      const capabilities = manifest.capabilities || ["assistant"];
      const metadata = manifest.metadata || {};
      const role = typeof metadata.role === "string" ? metadata.role : manifest.archetype || "Agent";
      const hub = typeof metadata.hub === "string" ? metadata.hub : hubForCapability(capabilities[0]);
      const location =
        typeof metadata.location === "string" ? metadata.location : typeof metadata.hub === "string" ? metadata.hub : hub;
      return {
        id: manifest.id || entry.id,
        name: manifest.name || entry.name || entry.id,
        role,
        hub,
        location,
        capabilities,
        accent: capabilityPalette[capabilities[0]] || "#36e0c3",
        manifest
      };
    });
  } catch {
    return null;
  }
}

setAgents(fallbackAgents);
loadRegistryAgents().then((registry) => {
  if (registry && registry.length) {
    setAgents(registry);
    pushFeed({ status: "registry", message: "Loaded agents from ACE registry.", timestamp: Date.now() });
  }
});

animate();
