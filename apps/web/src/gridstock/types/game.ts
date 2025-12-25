// src/types/game.ts
export type TileKind =
  | "go"
  | "company"
  | "etf"
  | "index"
  | "event"
  | "tax"
  | "jail"
  | "free"
  | "gotojail";

export type DeckType = "market" | "company";

export interface CompanyTile {
  kind: "company";
  id: string;
  ticker: string;
  name: string;
  sector: string;
  color: string;
  price: number;
  upgradeCost: number;
  rents: [number, number, number, number, number, number]; // by upgrade level 0-5
}

export interface EtfTile {
  kind: "etf";
  id: string;
  ticker: string;
  price: number;
  rentScale: [number, number, number, number]; // count owned -> rent
}

export interface IndexFundTile {
  kind: "index";
  id: string;
  ticker: string;
  price: number;
  rentMultiplier: { one: number; both: number }; // dice roll multiplier
}

export interface EventTile {
  kind: "event";
  deck: DeckType;
}

export interface TaxTile {
  kind: "tax";
  label: string;
  flat?: number;
  percent?: number; // apply to cash for simplicity
}

export interface SpecialTile {
  kind: "go" | "jail" | "free" | "gotojail";
  label: string;
}

export type Tile = CompanyTile | EtfTile | IndexFundTile | EventTile | TaxTile | SpecialTile;

export interface Card {
  id: string;
  deck: DeckType;
  text: string;
  effect:
    | { type: "collect"; amount: number }
    | { type: "pay"; amount: number }
    | { type: "move"; offset: number }
    | { type: "goto"; position: number }
    | { type: "jail" }
    | { type: "getout" }
    | { type: "collectFromAll"; amount: number }
    | { type: "payPerProperty"; amount: number }
    | { type: "moveToNearest"; kind: "etf" | "index"; payDouble?: boolean }
    | { type: "upgradeFree" }
    | { type: "mortgageRelief" };
}

export interface PropertyState {
  ownerId: number;
  upgrades: number;
  mortgaged?: boolean;
}

export interface PlayerState {
  id: number;
  name: string;
  isAI?: boolean;
  cash: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  bankrupt: boolean;
  getOutOfJail?: number;
}

export interface GameState {
  tiles: Tile[];
  properties: Record<number, PropertyState>;
  players: PlayerState[];
  currentPlayer: number;
  consecutiveDoubles: number;
  bankAuctionQueue?: number[];
  marketDeck: Card[];
  companyDeck: Card[];
  discardMarket: Card[];
  discardCompany: Card[];
  log: string[];
  lastRoll: [number, number] | null;
}
