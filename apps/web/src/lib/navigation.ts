export type NavItem = {
  label: string;
  href: string;
  description?: string;
};

function normalizeUrl(url: string) {
  if (url.length > 1 && url.endsWith("/")) return url.slice(0, -1);
  return url;
}

export const surfaceUrls = {
  food: normalizeUrl(process.env.NEXT_PUBLIC_FOOD_URL ?? "/food"),
  gridstock: normalizeUrl(process.env.NEXT_PUBLIC_GRIDSTOCK_URL ?? "/gridstock")
};

const { food: foodUrl, gridstock: gridstockUrl } = surfaceUrls;

export const platformSurfaces: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "StorySphere", href: "/storysphere" },
  { label: "LiveLoop", href: "/liveloop" },
  { label: "News", href: "/news" },
  { label: "Food", href: foodUrl },
  { label: "GridStock", href: gridstockUrl }
];

export const platformCreate: NavItem[] = [
  { label: "ACE", href: "/ace/create" },
  { label: "Playground", href: "/playground" },
  { label: "Studio", href: "/studio" }
];

export const platformOperate: NavItem[] = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Control-Panel", href: "/control-panel" },
  { label: "Developers", href: "/developers" },
  { label: "Status", href: "/status" }
];

export const topNavItems: NavItem[] = [
  { label: "Products", href: "/products" },
  { label: "Playground", href: "/playground" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "News", href: "/news" },
  { label: "Food", href: foodUrl },
  { label: "GridStock", href: gridstockUrl },
  { label: "Developers", href: "/developers" },
  { label: "About", href: "/about" }
];

export const footerNav = {
  product: [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: "StorySphere", href: "/storysphere" },
    { label: "LiveLoop", href: "/liveloop" },
    { label: "Food", href: foodUrl },
    { label: "GridStock", href: gridstockUrl },
    { label: "Marketplace", href: "/marketplace" }
  ],
  docs: [
    { label: "Developers", href: "/developers" },
    { label: "API Reference", href: "/developers#api" },
    { label: "Status", href: "/status" }
  ],
  company: [
    { label: "About / Trust", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
    { label: "Legal", href: "/legal" }
  ]
};
