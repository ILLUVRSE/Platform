// src/data/gameCards.ts
import { Card } from "@/types/game";

export const MARKET_CARDS: Card[] = [
  { id: "m1", deck: "market", text: "Fed cut: collect $150", effect: { type: "collect", amount: 150 } },
  { id: "m2", deck: "market", text: "Oil spike: pay $100", effect: { type: "pay", amount: 100 } },
  { id: "m3", deck: "market", text: "Market crash: pay $200", effect: { type: "pay", amount: 200 } },
  { id: "m4", deck: "market", text: "Short squeeze: collect $200", effect: { type: "collect", amount: 200 } },
  { id: "m5", deck: "market", text: "Volatility spike: move back 3", effect: { type: "move", offset: -3 } },
  { id: "m6", deck: "market", text: "Treasury windfall: collect $100", effect: { type: "collect", amount: 100 } },
  { id: "m7", deck: "market", text: "Advance to GO", effect: { type: "goto", position: 0 } },
  { id: "m8", deck: "market", text: "Go to Jail", effect: { type: "jail" } },
  { id: "m9", deck: "market", text: "Sector rally: collect $25 from each player", effect: { type: "collectFromAll", amount: 25 } },
  { id: "m10", deck: "market", text: "Rotate to nearest ETF, pay double if owned", effect: { type: "moveToNearest", kind: "etf", payDouble: true } },
];

export const COMPANY_CARDS: Card[] = [
  { id: "c1", deck: "company", text: "Product recall: pay $100", effect: { type: "pay", amount: 100 } },
  { id: "c2", deck: "company", text: "Blockbuster launch: collect $150", effect: { type: "collect", amount: 150 } },
  { id: "c3", deck: "company", text: "Cost cutting: collect $100", effect: { type: "collect", amount: 100 } },
  { id: "c4", deck: "company", text: "Regulatory fine: go to Jail", effect: { type: "jail" } },
  { id: "c5", deck: "company", text: "Executive bonus: collect $75", effect: { type: "collect", amount: 75 } },
  { id: "c6", deck: "company", text: "Spin-off: collect $50", effect: { type: "collect", amount: 50 } },
  { id: "c7", deck: "company", text: "Advance 5 spaces", effect: { type: "move", offset: 5 } },
  { id: "c8", deck: "company", text: "Pay corporate tax $150", effect: { type: "pay", amount: 150 } },
  { id: "c9", deck: "company", text: "Get Out of Jail Free", effect: { type: "getout" } },
  { id: "c10", deck: "company", text: "Facility upgrade: pay $25 per property you own", effect: { type: "payPerProperty", amount: 25 } },
  { id: "c11", deck: "company", text: "Nearest Index fund, pay double if owned", effect: { type: "moveToNearest", kind: "index", payDouble: true } },
  { id: "c12", deck: "company", text: "Free upgrade voucher: add one upgrade where allowed", effect: { type: "upgradeFree" } },
  { id: "c13", deck: "company", text: "Mortgage relief: unmortgage one property for free", effect: { type: "mortgageRelief" } },
];
