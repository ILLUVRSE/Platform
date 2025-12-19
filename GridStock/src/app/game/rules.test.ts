import { describe, expect, it } from "vitest";
import { applyPayment, calcRent, settleBankruptcies } from "./rules";
import { GameState, PlayerState, Tile } from "@/types/game";

const basePlayers: PlayerState[] = [
  { id: 0, name: "P1", cash: 500, position: 0, inJail: false, jailTurns: 0, bankrupt: false },
  { id: 1, name: "P2", cash: 500, position: 0, inJail: false, jailTurns: 0, bankrupt: false },
];

const makeState = (overrides?: Partial<GameState>): GameState => ({
  tiles: [],
  properties: {},
  players: basePlayers,
  currentPlayer: 0,
  consecutiveDoubles: 0,
  bankAuctionQueue: [],
  marketDeck: [],
  companyDeck: [],
  discardMarket: [],
  discardCompany: [],
  log: [],
  lastRoll: null,
  ...overrides,
});

describe("calcRent", () => {
  const tiles: Tile[] = [
    {
      kind: "company",
      id: "A",
      ticker: "AAA",
      name: "AAA",
      sector: "Tech",
      color: "#000",
      price: 100,
      upgradeCost: 50,
      rents: [10, 20, 30, 40, 50, 60],
    },
    {
      kind: "company",
      id: "B",
      ticker: "BBB",
      name: "BBB",
      sector: "Tech",
      color: "#000",
      price: 100,
      upgradeCost: 50,
      rents: [10, 20, 30, 40, 50, 60],
    },
    { kind: "etf", id: "ETF", ticker: "ETF", price: 150, rentScale: [25, 50, 100, 200] },
    { kind: "index", id: "IDX", ticker: "IDX", price: 150, rentMultiplier: { one: 4, both: 10 } },
  ];

  it("doubles base rent when owning full sector with no upgrades", () => {
    const props = { 0: { ownerId: 0, upgrades: 0 }, 1: { ownerId: 0, upgrades: 0 } };
    const rent = calcRent(tiles[0], 0, basePlayers[0], props, tiles, 7);
    expect(rent).toBe(20);
  });

  it("returns zero if mortgaged", () => {
    const props = { 0: { ownerId: 0, upgrades: 0, mortgaged: true } };
    const rent = calcRent(tiles[0], 0, basePlayers[0], props, tiles, 7);
    expect(rent).toBe(0);
  });

  it("scales ETF rent by ownership count", () => {
    const props = { 2: { ownerId: 0, upgrades: 0 } };
    const rent = calcRent(tiles[2], 2, basePlayers[0], props, tiles, 7);
    expect(rent).toBe(25);
  });

  it("uses dice multiplier for index funds", () => {
    const props = { 3: { ownerId: 0, upgrades: 0 } };
    const rent = calcRent(tiles[3], 3, basePlayers[0], props, tiles, 6);
    expect(rent).toBe(24);
  });
});

describe("bankruptcy resolution", () => {
  it("transfers properties to creditor on bankruptcy", () => {
    const tiles: Tile[] = [
      {
        kind: "company",
        id: "A",
        ticker: "AAA",
        name: "AAA",
        sector: "Tech",
        color: "#000",
        price: 100,
        upgradeCost: 50,
        rents: [10, 20, 30, 40, 50, 60],
      },
    ];
    const state = makeState({
      tiles,
      properties: { 0: { ownerId: 0, upgrades: 0 } },
    });
    const next = settleBankruptcies(state, [0], 1);
    expect(next.properties[0].ownerId).toBe(1);
  });

  it("queues bank auctions when bankrupt to bank", () => {
    const state = makeState({
      tiles: [
        {
          kind: "company",
          id: "A",
          ticker: "AAA",
          name: "AAA",
          sector: "Tech",
          color: "#000",
          price: 100,
          upgradeCost: 50,
          rents: [10, 20, 30, 40, 50, 60],
        },
      ],
      properties: { 0: { ownerId: 0, upgrades: 0 } },
    });
    const next = applyPayment(state, 0, 600, null);
    expect(next.bankAuctionQueue?.includes(0)).toBe(true);
  });

  it("applyPayment triggers transfer to creditor when insolvent", () => {
    const state = makeState({
      tiles: [
        {
          kind: "company",
          id: "A",
          ticker: "AAA",
          name: "AAA",
          sector: "Tech",
          color: "#000",
          price: 100,
          upgradeCost: 50,
          rents: [10, 20, 30, 40, 50, 60],
        },
      ],
      properties: { 0: { ownerId: 0, upgrades: 0 } },
    });
    const next = applyPayment(state, 0, 1000, 1);
    expect(next.players[0].bankrupt).toBe(true);
    expect(next.properties[0].ownerId).toBe(1);
  });
});
