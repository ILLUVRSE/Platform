import { Card, CompanyTile, GameState, PlayerState, PropertyState, Tile } from "@/types/game";

export function indexToCoord(index: number) {
  if (index <= 10) return { x: 10 - index, y: 10 };
  if (index <= 20) return { x: 0, y: 10 - (index - 10) };
  if (index <= 30) return { x: index - 20, y: 0 };
  return { x: 10, y: index - 30 };
}

export function ownsAllInSector(
  playerId: number,
  sector: string,
  tiles: Tile[],
  props: Record<number, PropertyState>
) {
  const sectorIndices = tiles
    .map((t, idx) => ({ t, idx }))
    .filter(({ t }) => t.kind === "company" && t.sector === sector)
    .map((x) => x.idx);
  if (sectorIndices.length === 0) return false;
  return sectorIndices.every((idx) => props[idx]?.ownerId === playerId);
}

export function countOwned(
  playerId: number,
  tiles: Tile[],
  props: Record<number, PropertyState>,
  kind: "etf" | "index"
) {
  return tiles.reduce((acc, t, idx) => {
    if (t.kind === kind && props[idx]?.ownerId === playerId) return acc + 1;
    return acc;
  }, 0);
}

export function calcRent(
  tile: Tile,
  tileIndex: number,
  owner: PlayerState | undefined,
  props: Record<number, PropertyState>,
  tiles: Tile[],
  lastRollTotal: number
) {
  if (!owner) return 0;
  const propState = props[tileIndex];
  if (propState?.mortgaged) return 0;
  if (tile.kind === "company") {
    const upgrades = propState?.upgrades ?? 0;
    let base = tile.rents[Math.min(upgrades, 5)];
    // Classic rule: if you own the whole color set and no upgrades, base rent doubles.
    if (upgrades === 0 && ownsAllInSector(owner.id, tile.sector, tiles, props)) {
      base = base * 2;
    }
    return base;
  }
  if (tile.kind === "etf") {
    const count = countOwned(owner.id, tiles, props, "etf");
    if (count < 1) return 0;
    return tile.rentScale[Math.min(count - 1, tile.rentScale.length - 1)];
  }
  if (tile.kind === "index") {
    const count = countOwned(owner.id, tiles, props, "index");
    const mult = count >= 2 ? tile.rentMultiplier.both : tile.rentMultiplier.one;
    return lastRollTotal * mult;
  }
  return 0;
}

export function renderTileLabel(tile: Tile) {
  if (tile.kind === "company" || tile.kind === "etf" || tile.kind === "index") return tile.ticker;
  if (tile.kind === "tax") return tile.label;
  return tile.kind;
}

export function playerColor(idx: number) {
  const colors = ["#22c55e", "#3b82f6", "#f97316", "#e11d48"];
  return colors[idx % colors.length];
}

export function settleBankruptcies(
  state: GameState,
  debtorIds: number[],
  creditorId: number | null
): GameState {
  if (debtorIds.length === 0) return state;
  let next = { ...state };
  const transfers: Record<number, PropertyState> = { ...next.properties };
  const bankAuctionQueue = new Set(next.bankAuctionQueue || []);

  // Transfer or release properties from bankrupt players
  Object.entries(transfers).forEach(([idxStr, val]) => {
    const idx = Number(idxStr);
    if (debtorIds.includes(val.ownerId)) {
      if (creditorId !== null) {
        transfers[idx] = { ...val, ownerId: creditorId, upgrades: 0, mortgaged: val.mortgaged };
      } else {
        delete transfers[idx];
        bankAuctionQueue.add(idx);
      }
    }
  });

  next = {
    ...next,
    properties: transfers,
    bankAuctionQueue: Array.from(bankAuctionQueue.values()),
    players: next.players.map((p, i) =>
      debtorIds.includes(i) ? { ...p, bankrupt: true, cash: 0 } : p
    ),
    log: [
      `${debtorIds.map((i) => next.players[i].name).join(", ")} bankrupt${
        creditorId !== null ? ` to ${next.players[creditorId].name}` : " to bank"
      }; properties ${creditorId !== null ? "transferred" : "released"}`,
      ...next.log,
    ],
  };

  return next;
}

export function applyPayment(
  state: GameState,
  payerId: number,
  amount: number,
  recipientId: number | null
): GameState {
  let next = { ...state };
  const payer = next.players[payerId];
  if (payer.bankrupt) return next;
  const recipient = recipientId !== null ? next.players[recipientId] : null;

  const updatedPlayers = next.players.map((p, idx) => {
    if (idx === payerId) return { ...p, cash: p.cash - amount };
    if (recipient && idx === recipientId) return { ...p, cash: p.cash + amount };
    return p;
  });

  next = { ...next, players: updatedPlayers };

  if (updatedPlayers[payerId].cash < 0) {
    next = settleBankruptcies(next, [payerId], recipientId);
  }
  return next;
}
