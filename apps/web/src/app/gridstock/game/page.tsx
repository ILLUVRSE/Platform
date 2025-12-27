// src/app/game/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { SP500_BOARD } from "@gridstock/data/sp500Board";
import { COMPANY_CARDS, MARKET_CARDS } from "@gridstock/data/gameCards";
import { Card, GameState, PlayerState, PropertyState, Tile, CompanyTile } from "@gridstock/types/game";
import { Button } from "@gridstock/components/ui/Button";
import { Card as UICard } from "@gridstock/components/ui/Card";
import { Input } from "@gridstock/components/ui/Input";
import {
  applyPayment,
  calcRent,
  countOwned,
  indexToCoord,
  ownsAllInSector,
  playerColor,
  renderTileLabel,
  settleBankruptcies,
} from "./rules";

type PendingAction =
  | { type: "buy"; tileIndex: number }
  | { type: "none" };

const START_CASH = 1500;
const GAME_SAVES_KEY = "gridstock_game_saves";
const BAIL_AMOUNT = 50;
const AUCTION_SECONDS = 12;
const GAME_SETTINGS_KEY = "gridstock_game_settings";
const MAX_PLAYERS = 6;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initPlayers(count = 4, aiSlots: number[] = []): PlayerState[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    name: `Player ${i + 1}`,
    isAI: aiSlots.includes(i),
    cash: START_CASH,
    position: 0,
    inJail: false,
    jailTurns: 0,
    bankrupt: false,
  }));
}

function initState(opts?: { playerCount?: number; aiSlots?: number[] }): GameState {
  return {
    tiles: SP500_BOARD,
    properties: {},
    players: initPlayers(opts?.playerCount ?? 4, opts?.aiSlots ?? []),
    currentPlayer: 0,
    consecutiveDoubles: 0,
    bankAuctionQueue: [],
    marketDeck: shuffle(MARKET_CARDS),
    companyDeck: shuffle(COMPANY_CARDS),
    discardMarket: [],
    discardCompany: [],
    log: ["Game start: S&P 500 Edition"],
    lastRoll: null,
  };
}

export default function GamePage() {
  const [state, setState] = useState<GameState>(initState);
  const [pending, setPending] = useState<PendingAction>({ type: "none" });
  const [auction, setAuction] = useState<{
    tileIndex: number;
    participants: number[];
    activeBidder: number;
    highBid: number;
    highBidder: number | null;
    passes: number[];
    timer: number;
  } | null>(null);
  const [saves, setSaves] = useState<{ name: string; state: GameState; updatedAt: number }[]>([]);
  const [saveName, setSaveName] = useState("Autosave");
  const bootstrappedRef = React.useRef(false);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [settings, setSettings] = useState<{ playerCount: number; autoEndMs: number; aiSlots: number[] }>({
    playerCount: 4,
    autoEndMs: 20000,
    aiSlots: [2, 3],
  });
  const [rolling, setRolling] = useState(false);
  const [tradeTarget, setTradeTarget] = useState<number | null>(null);
  const [tradeProperty, setTradeProperty] = useState<number | null>(null);
  const [tradePrice, setTradePrice] = useState<number>(100);
  const [tradeReceiveProperty, setTradeReceiveProperty] = useState<number | null>(null);
  const [tradeCashDirection, setTradeCashDirection] = useState<"me" | "them">("them");
  const undoRef = useRef<GameState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captureUndo = () => {
    undoRef.current = state;
  };

  const aiRaiseCash = (playerId: number, amountNeeded: number) => {
    const working = { ...state };
    let player = working.players[playerId];
    const propsEntries = Object.entries(working.properties);
    const upgradable = propsEntries
      .filter(([_, p]) => p.ownerId === playerId && p.upgrades > 0)
      .sort(
        (a, b) =>
          ("upgradeCost" in working.tiles[Number(b[0])] ? (working.tiles[Number(b[0])] as CompanyTile).upgradeCost : 0) -
          ("upgradeCost" in working.tiles[Number(a[0])] ? (working.tiles[Number(a[0])] as CompanyTile).upgradeCost : 0)
      );
    for (const [idxStr, prop] of upgradable) {
      const idx = Number(idxStr);
      const tile = working.tiles[idx] as CompanyTile;
      const refund = Math.floor(tile.upgradeCost / 2);
      working.properties[idx] = { ...prop, upgrades: prop.upgrades - 1 };
      player = { ...player, cash: player.cash + refund };
      working.players = working.players.map((p, i) => (i === playerId ? player : p));
      if (player.cash >= amountNeeded) return working;
    }
    const mortgageable = propsEntries.filter(
      ([_, p]) => p.ownerId === playerId && !p.mortgaged && p.upgrades === 0
    );
    for (const [idxStr, prop] of mortgageable) {
      const idx = Number(idxStr);
      const tile = working.tiles[idx] as CompanyTile;
      const credit = Math.floor(tile.price * 0.5);
      working.properties[idx] = { ...prop, mortgaged: true };
      player = { ...player, cash: player.cash + credit };
      working.players = working.players.map((p, i) => (i === playerId ? player : p));
      if (player.cash >= amountNeeded) return working;
    }
    return working;
  };

  const current = state.players[state.currentPlayer];
  const lastRollTotal = state.lastRoll ? state.lastRoll[0] + state.lastRoll[1] : 0;

  const normalizeState = (value: GameState): GameState => ({
    ...initState({ playerCount: value.players?.length ?? 4 }),
    ...value,
    players: value.players.map((p, idx) => ({ isAI: false, ...p, id: idx })),
    consecutiveDoubles: value.consecutiveDoubles ?? 0,
    bankAuctionQueue: value.bankAuctionQueue ?? [],
  });

  const readSaves = () => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(GAME_SAVES_KEY);
      return raw ? (JSON.parse(raw) as { name: string; state: GameState; updatedAt: number }[]) : [];
    } catch {
      return [];
    }
  };

  const persistSaves = (list: { name: string; state: GameState; updatedAt: number }[]) => {
    setSaves(list);
    if (typeof window === "undefined") return;
    localStorage.setItem(GAME_SAVES_KEY, JSON.stringify(list));
  };

  useEffect(() => {
    const stored = readSaves();
    if (stored.length > 0) {
      const latest = [...stored].sort((a, b) => b.updatedAt - a.updatedAt)[0];
      setState(normalizeState(latest.state));
      setSaveName(latest.name);
    }
    setSaves(stored);
    bootstrappedRef.current = true;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(GAME_SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as typeof settings;
        setSettings(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(GAME_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!bootstrappedRef.current) return;
    const autosave = { name: "Autosave", state, updatedAt: Date.now() };
    const existing = readSaves().filter((s) => s.name !== "Autosave");
    persistSaves([autosave, ...existing].sort((a, b) => b.updatedAt - a.updatedAt));
  }, [state]);

  useEffect(() => {
    const alive = state.players.filter((p) => !p.bankrupt);
    if (alive.length === 1) {
      setWinnerId(alive[0].id);
    } else {
      setWinnerId(null);
    }
  }, [state.players]);

  const handleNextPlayer = (s: GameState): GameState => {
    let next = (s.currentPlayer + 1) % s.players.length;
    // Skip bankrupt players
    for (let i = 0; i < s.players.length; i++) {
      if (!s.players[next].bankrupt) break;
      next = (next + 1) % s.players.length;
    }
    return { ...s, currentPlayer: next, lastRoll: null, consecutiveDoubles: 0 };
  };

  const addLog = (s: GameState, msg: string): GameState => ({
    ...s,
    log: [msg, ...s.log].slice(0, 40),
  });

  const resolveCard = (s: GameState, card: Card): GameState => {
    const actor = s.players[s.currentPlayer];
    let next = addLog(s, `${actor.name} drew: ${card.text}`);
    const rollTotal = next.lastRoll ? next.lastRoll[0] + next.lastRoll[1] : 0;
    if (card.effect.type === "collect") {
      next = {
        ...next,
        players: next.players.map((p, i) =>
          i === s.currentPlayer ? { ...p, cash: p.cash + card.effect.amount } : p
        ),
      };
    } else if (card.effect.type === "pay") {
      next = applyPayment(next, s.currentPlayer, card.effect.amount, null);
    } else if (card.effect.type === "collectFromAll") {
      next.players.forEach((p, idx) => {
        if (idx !== s.currentPlayer && !p.bankrupt) {
          next = applyPayment(next, idx, card.effect.amount, s.currentPlayer);
        }
      });
      next = addLog(next, `${actor.name} collects $${card.effect.amount} from each player`);
    } else if (card.effect.type === "payPerProperty") {
      const owned = Object.values(next.properties).filter((prop) => prop.ownerId === s.currentPlayer).length;
      const total = card.effect.amount * owned;
      next = applyPayment(next, s.currentPlayer, total, null);
      next = addLog(next, `${actor.name} pays $${total} in upkeep across ${owned} properties`);
    } else if (card.effect.type === "move") {
      next = movePlayer(next, card.effect.offset);
      next = resolveLanding(next, rollTotal);
    } else if (card.effect.type === "goto") {
      next = moveTo(next, card.effect.position, false);
      next = resolveLanding(next, rollTotal);
    } else if (card.effect.type === "moveToNearest") {
      const targetIdx = findNearestOfKind(card.effect.kind, next.players[next.currentPlayer].position);
      next = moveTo(next, targetIdx, true);
      const tile = next.tiles[targetIdx];
      const prop = next.properties[targetIdx];
      if (card.effect.payDouble && prop && prop.ownerId !== next.currentPlayer) {
        const rent = calcRent(tile, targetIdx, next.players[prop.ownerId], next.properties, next.tiles, rollTotal);
        next = applyRent(next, tile, targetIdx, prop.ownerId, rent * 2);
      } else {
        next = resolveLanding(next, rollTotal);
      }
    } else if (card.effect.type === "upgradeFree") {
      const owned = Object.entries(next.properties).filter(([_, v]) => v.ownerId === next.currentPlayer);
      if (owned.length > 0) {
        const [idxStr, prop] = owned[0];
        const idx = Number(idxStr);
        const tile = next.tiles[idx];
        if (tile.kind === "company") {
          next = {
            ...next,
            properties: { ...next.properties, [idx]: { ...prop, upgrades: Math.min(5, prop.upgrades + 1) } },
          };
          next = addLog(next, `${actor.name} upgrades ${renderTileLabel(tile)} for free`);
        }
      }
    } else if (card.effect.type === "mortgageRelief") {
      const mortgaged = Object.entries(next.properties).find(
        ([_, v]) => v.ownerId === next.currentPlayer && v.mortgaged
      );
      if (mortgaged) {
        const [idxStr, prop] = mortgaged;
        const idx = Number(idxStr);
        next = {
          ...next,
          properties: { ...next.properties, [idx]: { ...prop, mortgaged: false } },
        };
        next = addLog(next, `${actor.name} clears a mortgage for free`);
      }
    } else if (card.effect.type === "jail") {
      next = sendToJail(next);
    } else if (card.effect.type === "getout") {
      next = {
        ...next,
        players: next.players.map((p, i) =>
          i === next.currentPlayer ? { ...p, getOutOfJail: (p.getOutOfJail ?? 0) + 1 } : p
        ),
      };
    }
    return next;
  };

  const drawCard = (s: GameState, deck: "market" | "company"): GameState => {
    const pile = deck === "market" ? s.marketDeck : s.companyDeck;
    const discard = deck === "market" ? s.discardMarket : s.discardCompany;
    let newDeck = pile;
    let newDiscard = discard;
    if (newDeck.length === 0) {
      newDeck = shuffle(discard);
      newDiscard = [];
    }
    const [card, ...rest] = newDeck;
    let next: GameState = { ...s };
    if (deck === "market") {
      next = { ...next, marketDeck: rest, discardMarket: [...newDiscard, card] };
    } else {
      next = { ...next, companyDeck: rest, discardCompany: [...newDiscard, card] };
    }
    return resolveCard(next, card);
  };

  const applyRent = (
    s: GameState,
    tile: Tile,
    tileIndex: number,
    ownerIndex: number,
    rent: number
  ): GameState => {
    if (rent <= 0) return s;
    const payer = s.players[s.currentPlayer];
    const owner = s.players[ownerIndex];
    if (owner.bankrupt || payer.bankrupt) return s;
    const next = applyPayment(s, s.currentPlayer, rent, ownerIndex);
    return addLog(
      next,
      `${payer.name} pays $${rent} to ${owner.name} for ${
        tile.kind === "company" ? tile.ticker : "rent"
      }`
    );
  };

  const startAuction = (tileIndex: number, reason: "skip" | "bank" = "skip") => {
    const participants = state.players
      .map((p, idx) => ({ p, idx }))
      .filter(({ p }) => !p.bankrupt && p.cash > 0)
      .map(({ idx }) => idx);
    if (participants.length === 0) return;
    const tile = state.tiles[tileIndex];
    setAuction({
      tileIndex,
      participants,
      activeBidder: 0,
      highBid: 0,
      highBidder: null,
      passes: [],
      timer: AUCTION_SECONDS,
    });
    setPending({ type: "none" });
    setState((s) =>
      addLog(
        s,
        `Auction started for ${renderTileLabel(tile)} (${reason === "bank" ? "bankruptcy" : "player skip"})`
      )
    );
  };

  const advanceBidder = (a: NonNullable<typeof auction>) => {
    let next = (a.activeBidder + 1) % a.participants.length;
    let attempts = 0;
    while (
      attempts < a.participants.length &&
      (a.passes.includes(a.participants[next]) ||
        state.players[a.participants[next]].bankrupt ||
        state.players[a.participants[next]].cash <= 0)
    ) {
      next = (next + 1) % a.participants.length;
      attempts++;
    }
    return next;
  };

  const handleAuctionBid = () => {
    setAuction((a) => {
      if (!a) return a;
      const bidder = a.participants[a.activeBidder];
      const cash = state.players[bidder]?.cash ?? 0;
      const nextBid = Math.max(10, a.highBid + 10);
      if (cash < nextBid) {
        return {
          ...a,
          passes: Array.from(new Set([...a.passes, bidder])),
          activeBidder: advanceBidder(a),
          timer: AUCTION_SECONDS,
        };
      }
      return {
        ...a,
        highBid: nextBid,
        highBidder: bidder,
        activeBidder: advanceBidder(a),
        timer: AUCTION_SECONDS,
      };
    });
  };

  const handleAuctionPass = () => {
    setAuction((a) => {
      if (!a) return a;
      const bidder = a.participants[a.activeBidder];
      return {
        ...a,
        passes: Array.from(new Set([...a.passes, bidder])),
        activeBidder: advanceBidder(a),
        timer: AUCTION_SECONDS,
      };
    });
  };

  const finalizeAuction = (winnerId: number | null, price: number, tileIndex: number) => {
    setAuction(null);
    setState((s) => {
      const tile = s.tiles[tileIndex];
      if (winnerId === null) {
        return addLog(s, `Auction for ${renderTileLabel(tile)} ended without a bid`);
      }
      const player = s.players[winnerId];
      if (player.cash < price) {
        return addLog(s, `${player.name} could not cover the winning bid for ${renderTileLabel(tile)}`);
      }
      const props = { ...s.properties, [tileIndex]: { ownerId: winnerId, upgrades: 0 } };
      const nextPlayers = s.players.map((p, idx) =>
        idx === winnerId ? { ...p, cash: p.cash - price } : p
      );
      return addLog(
        { ...s, players: nextPlayers, properties: props },
        `${player.name} wins ${renderTileLabel(tile)} for $${price}`
      );
    });
  };

  useEffect(() => {
    if (!auction) return;
    if (auction.timer <= 0) {
      handleAuctionPass();
      return;
    }
    const id = setTimeout(() => {
      setAuction((a) => (a ? { ...a, timer: a.timer - 1 } : a));
    }, 1000);
    return () => clearTimeout(id);
  }, [auction]);

  useEffect(() => {
    if (!auction) return;
    const active = auction.participants.filter(
      (p) => !auction.passes.includes(p) && !state.players[p].bankrupt && state.players[p].cash > 0
    );
    if (active.length === 0) {
      finalizeAuction(auction.highBidder, auction.highBid, auction.tileIndex);
    } else if (active.length === 1 && auction.highBidder !== null) {
      finalizeAuction(auction.highBidder, auction.highBid, auction.tileIndex);
    }
  }, [auction, state.players]);

  useEffect(() => {
    if (!auction) return;
    const bidderId = auction.participants[auction.activeBidder];
    const bidder = state.players[bidderId];
    if (!bidder?.isAI) return;
    const tile = state.tiles[auction.tileIndex];
    const desire = "price" in tile ? tile.price : 200;
    const willingBid = Math.min(bidder.cash * 0.8, desire * 1.4);
    const nextBid = Math.max(10, auction.highBid + 10);
    const shouldBid = nextBid <= willingBid;
    const action = shouldBid ? handleAuctionBid : handleAuctionPass;
    const id = setTimeout(action, 500);
    return () => clearTimeout(id);
  }, [auction, state.players, state.tiles]);

  useEffect(() => {
    if (auction) return;
    const queue = state.bankAuctionQueue || [];
    if (!queue.length) return;
    const [nextIdx, ...rest] = queue;
    setState((s) => ({ ...s, bankAuctionQueue: rest }));
    startAuction(nextIdx, "bank");
  }, [auction, state.bankAuctionQueue]);

  useEffect(() => {
    if (winnerId !== null) return;
    const actor = state.players[state.currentPlayer];
    if (!actor || actor.bankrupt) return;
    if (!actor.isAI) return;
    if (auction) return;
    const id = setTimeout(() => {
      if (pending.type === "buy") {
        const tile = state.tiles[(pending as { tileIndex: number }).tileIndex];
        const price = "price" in tile ? tile.price : 0;
        if (actor.cash > price * 1.2) handleBuy();
        else handleSkipBuy();
        return;
      }
      if (!state.lastRoll) {
        handleRoll();
      } else {
        handleEndTurn();
      }
    }, 600);
    return () => clearTimeout(id);
  }, [state, pending, auction, winnerId]);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (winnerId !== null || auction) return;
    const actor = state.players[state.currentPlayer];
    if (!actor || actor.bankrupt) return;
    if (actor.isAI) return;
    if (pending.type === "buy") return;
    if (!state.lastRoll) return;
    timerRef.current = setTimeout(() => {
      handleEndTurn();
    }, settings.autoEndMs);
  }, [state.currentPlayer, state.lastRoll, pending, auction, winnerId, settings.autoEndMs]);

  const moveTo = (s: GameState, position: number, awardGo: boolean): GameState => {
    const player = s.players[s.currentPlayer];
    const passedGo = awardGo && position < player.position;
    const updated = {
      ...player,
      position,
      cash: player.cash + (passedGo ? 200 : 0),
    };
    return {
      ...s,
      players: s.players.map((p, i) => (i === s.currentPlayer ? updated : p)),
    };
  };

  const sendToJail = (s: GameState): GameState => {
    const jailIndex = s.tiles.findIndex((t) => t.kind === "jail");
    const updated = s.players.map((p, i) =>
      i === s.currentPlayer
        ? { ...p, position: jailIndex >= 0 ? jailIndex : 10, inJail: true, jailTurns: 3 }
        : p
    );
    return addLog(
      { ...s, players: updated, consecutiveDoubles: 0 },
      `${s.players[s.currentPlayer].name} sent to Jail`
    );
  };

  const movePlayer = (s: GameState, offset: number): GameState => {
    const player = s.players[s.currentPlayer];
    const boardSize = s.tiles.length;
    const newPos = (player.position + offset + boardSize) % boardSize;
    const passedGo = offset > 0 && player.position + offset >= boardSize;
    const updatedPlayer = {
      ...player,
      position: newPos,
      cash: player.cash + (passedGo ? 200 : 0),
    };
    return {
      ...s,
      players: s.players.map((p, i) => (i === s.currentPlayer ? updatedPlayer : p)),
    };
  };

  const handlePayBail = () => {
    captureUndo();
    setState((s) => {
      const player = s.players[s.currentPlayer];
      if (!player.inJail || player.cash < BAIL_AMOUNT) return s;
      let next = applyPayment(s, s.currentPlayer, BAIL_AMOUNT, null);
      next = {
        ...next,
        players: next.players.map((p, i) =>
          i === next.currentPlayer ? { ...p, inJail: false, jailTurns: 0 } : p
        ),
      };
      return addLog(next, `${player.name} pays $${BAIL_AMOUNT} bail to exit jail`);
    });
  };

  const handleUseJailCard = () => {
    captureUndo();
    setState((s) => {
      const player = s.players[s.currentPlayer];
      if (!player.inJail || !(player.getOutOfJail && player.getOutOfJail > 0)) return s;
      const updated = {
        ...player,
        inJail: false,
        jailTurns: 0,
        getOutOfJail: player.getOutOfJail - 1,
      };
      return addLog(
        {
          ...s,
          players: s.players.map((p, i) => (i === s.currentPlayer ? updated : p)),
        },
        `${player.name} uses a Get Out of Jail card`
      );
    });
  };

  function handleRoll() {
    captureUndo();
    setPending({ type: "none" });
    setRolling(true);
    setState((s) => {
      let st = { ...s };
      const player = st.players[st.currentPlayer];
      if (player.bankrupt) {
        return handleNextPlayer(st);
      }
      if (player.inJail) {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const rolledDoubles = d1 === d2;
        let updatedPlayer = { ...player };
        if (rolledDoubles) {
          updatedPlayer = {
            ...player,
            inJail: false,
            jailTurns: 0,
          };
          st = addLog(st, `${player.name} leaves jail (doubles)`);
        } else {
          const jailTurns = Math.max(0, player.jailTurns - 1);
          updatedPlayer = {
            ...player,
            jailTurns,
            inJail: jailTurns > 0,
          };
          st = addLog(st, `${player.name} waits jail (${jailTurns} left)`);
          if (!updatedPlayer.inJail) {
            st = applyPayment(st, st.currentPlayer, BAIL_AMOUNT, null);
            st = addLog(st, `${player.name} pays $${BAIL_AMOUNT} after final jail attempt`);
          }
        }
        st = {
          ...st,
          players: st.players.map((p, i) => (i === st.currentPlayer ? updatedPlayer : p)),
        };
        if (updatedPlayer.inJail) return handleNextPlayer(st);
        // If freed, roll again for movement
        const total = d1 + d2;
        st = { ...st, lastRoll: [d1, d2], consecutiveDoubles: 0 };
        st = movePlayer(st, total);
        st = addLog(st, `${player.name} rolled ${d1} + ${d2} = ${total}`);
        st = resolveLanding(st, total);
        return st;
      }

      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const total = d1 + d2;
      const rolledDoubles = d1 === d2;
      const doubleCount = rolledDoubles ? st.consecutiveDoubles + 1 : 0;
      if (rolledDoubles && doubleCount >= 3) {
        st = addLog(st, `${player.name} rolled doubles three times and is sent to jail`);
        st = { ...st, consecutiveDoubles: 0, lastRoll: [d1, d2] };
        st = sendToJail(st);
        return st;
      }
      st = { ...st, lastRoll: [d1, d2], consecutiveDoubles: doubleCount };
      st = movePlayer(st, total);
      st = addLog(st, `${player.name} rolled ${d1} + ${d2} = ${total}`);
      st = resolveLanding(st, total);
      return st;
    });
    setTimeout(() => setRolling(false), 400);
  }

  const resolveLanding = (s: GameState, rollTotal: number): GameState => {
    const player = s.players[s.currentPlayer];
    const tile = s.tiles[player.position];
    const tileIndex = player.position;
    let next = { ...s };

    if (tile.kind === "go") {
      next = addLog(next, `${player.name} landed on GO and collects $200`);
      next = {
        ...next,
        players: next.players.map((p, i) => (i === s.currentPlayer ? { ...p, cash: p.cash + 200 } : p)),
      };
    } else if (tile.kind === "company" || tile.kind === "etf" || tile.kind === "index") {
      const ownerState = next.properties[tileIndex];
      if (!ownerState) {
        setPending({ type: "buy", tileIndex });
        return next;
      }
      if (ownerState.ownerId !== s.currentPlayer && !ownerState.mortgaged) {
        const owner = next.players[ownerState.ownerId];
        const rent = calcRent(tile, tileIndex, owner, next.properties, next.tiles, rollTotal);
        next = applyRent(next, tile, tileIndex, ownerState.ownerId, rent);
      }
    } else if (tile.kind === "event") {
      next = drawCard(next, tile.deck);
    } else if (tile.kind === "tax") {
      const playerCash = next.players[s.currentPlayer].cash;
      const percentCharge = tile.percent ? Math.floor(playerCash * tile.percent) : 0;
      const charge = Math.max(0, (tile.flat ?? 0) + percentCharge);
      next = addLog(next, `${player.name} pays $${charge} in ${tile.label}`);
      next = applyPayment(next, next.currentPlayer, charge, null);
    } else if (tile.kind === "gotojail") {
      next = sendToJail(next);
    }
    return next;
  };

  function handleBuy() {
    if (pending.type !== "buy") return;
    const tileIndex = pending.tileIndex;
    const tile = state.tiles[tileIndex];
    if (tile.kind !== "company" && tile.kind !== "etf" && tile.kind !== "index") {
      setPending({ type: "none" });
      return;
    }
    const buyer = state.players[state.currentPlayer];
    let workingState = state;
    if (buyer.cash < tile.price && buyer.isAI) {
      workingState = aiRaiseCash(state.currentPlayer, tile.price);
      setState(workingState);
    }
    const updatedBuyer = workingState.players[state.currentPlayer];
    if (updatedBuyer.cash < tile.price) {
      setState((s) => addLog(s, `${buyer.name} cannot afford ${renderTileLabel(tile)} — starting auction`));
      setPending({ type: "none" });
      startAuction(tileIndex, "skip");
      return;
    }
    captureUndo();
    setState((s) => {
      const props = { ...s.properties, [tileIndex]: { ownerId: s.currentPlayer, upgrades: 0 } };
      let next: GameState = { ...s, properties: props };
      next = applyPayment(next, s.currentPlayer, tile.price, null);
      next = addLog(next, `${buyer.name} bought ${renderTileLabel(tile)} for $${tile.price}`);
      return next;
    });
    setPending({ type: "none" });
  }

  function handleSkipBuy() {
    // Trigger simple auction: next non-bankrupt player gets option to buy at price
    if (pending.type !== "buy") return;
    const tileIndex = pending.tileIndex;
    const tile = state.tiles[tileIndex];
    if (tile.kind !== "company" && tile.kind !== "etf" && tile.kind !== "index") {
      setPending({ type: "none" });
      return;
    }
    captureUndo();
    startAuction(tileIndex, "skip");
    setPending({ type: "none" });
  }

  const handleManualSave = () => {
    const name = (saveName || "Manual").trim();
    if (!name) return;
    const entry = { name, state, updatedAt: Date.now() };
    const filtered = readSaves().filter((s) => s.name !== name);
    persistSaves([entry, ...filtered].sort((a, b) => b.updatedAt - a.updatedAt));
    setSaveName(name);
  };

  const handleLoadSave = (name: string) => {
    const found = saves.find((s) => s.name === name);
    if (!found) return;
    setState(normalizeState(found.state));
    setSaveName(name);
  };

  const handleResetGame = () => {
    setAuction(null);
    setPending({ type: "none" });
    const fresh = initState({ playerCount: settings.playerCount, aiSlots: settings.aiSlots });
    setState(fresh);
  };

  const handleUndo = () => {
    if (!undoRef.current) return;
    setState(undoRef.current);
    undoRef.current = null;
  };

  const handleRenamePlayer = (id: number, name: string) => {
    setState((s) => ({
      ...s,
      players: s.players.map((p) => (p.id === id ? { ...p, name } : p)),
    }));
  };

  const handleApplySettings = () => {
    const count = Math.max(2, Math.min(6, settings.playerCount));
    const aiSlots = Array.from(new Set(settings.aiSlots.filter((i) => i < count)));
    setSettings((prev) => ({ ...prev, playerCount: count, aiSlots }));
    const fresh = initState({ playerCount: count, aiSlots });
    setState(fresh);
    setAuction(null);
    setPending({ type: "none" });
    setWinnerId(null);
  };

  const handleTradeSubmit = () => {
    if (tradeProperty === null && tradeReceiveProperty === null) return;
    if (tradeTarget === null) return;
    const target = state.players[tradeTarget];
    if (!target || target.bankrupt) return;
    const giveProp = tradeProperty !== null ? state.properties[tradeProperty] : null;
    const recvProp = tradeReceiveProperty !== null ? state.properties[tradeReceiveProperty] : null;
    if (giveProp && giveProp.ownerId !== state.currentPlayer) return;
    if (recvProp && recvProp.ownerId !== tradeTarget) return;
    const payFrom = tradeCashDirection === "me" ? state.currentPlayer : tradeTarget;
    const payTo = tradeCashDirection === "me" ? tradeTarget : state.currentPlayer;
    const payer = state.players[payFrom];
    if (payer.cash < tradePrice) {
      setState((s) =>
        addLog(
          s,
          `${payer.name} cannot cover the cash portion of the trade (needs $${tradePrice})`
        )
      );
      return;
    }
    captureUndo();
    setState((s) => {
      const props = { ...s.properties };
      if (tradeProperty !== null && giveProp) {
        props[tradeProperty] = { ...giveProp, ownerId: tradeTarget, upgrades: 0 };
      }
      if (tradeReceiveProperty !== null && recvProp) {
        props[tradeReceiveProperty] = { ...recvProp, ownerId: s.currentPlayer, upgrades: 0 };
      }
      let next = applyPayment({ ...s, properties: props }, payFrom, tradePrice, payTo);
      next = addLog(
        next,
        `${s.players[s.currentPlayer].name} trades ${tradeProperty !== null ? renderTileLabel(s.tiles[tradeProperty]) : "cash"}${tradeReceiveProperty !== null ? ` for ${renderTileLabel(s.tiles[tradeReceiveProperty])}` : ""} with ${target.name}`
      );
      return next;
    });
  };

  const ownedCompanies = useMemo(
    () =>
      Object.entries(state.properties)
        .filter(([_, v]) => v.ownerId === state.currentPlayer)
        .map(([idx]) => Number(idx))
        .filter((idx) => state.tiles[idx].kind === "company"),
    [state.properties, state.currentPlayer, state.tiles]
  );

  const fullSets = useMemo(() => {
    const sectors = new Set(
      ownedCompanies
        .map((idx) => state.tiles[idx])
        .filter((t): t is CompanyTile => t.kind === "company")
        .map((t) => t.sector)
    );
    return Array.from(sectors).filter((sector) =>
      ownsAllInSector(state.currentPlayer, sector, state.tiles, state.properties)
    );
  }, [ownedCompanies, state.currentPlayer, state.properties, state.tiles]);

  const handleMortgage = (tileIndex: number) => {
    const tile = state.tiles[tileIndex];
    const prop = state.properties[tileIndex];
    if (!prop || prop.ownerId !== state.currentPlayer || prop.mortgaged) return;
    if (prop.upgrades > 0) return;
    captureUndo();
    const credit = Math.floor(("price" in tile ? tile.price : 0) * 0.5);
    setState((s) =>
      addLog(
        {
          ...s,
          properties: { ...s.properties, [tileIndex]: { ...prop, mortgaged: true } },
          players: s.players.map((p, i) =>
            i === s.currentPlayer ? { ...p, cash: p.cash + credit } : p
          ),
        },
        `${s.players[s.currentPlayer].name} mortgages ${renderTileLabel(tile)} for $${credit}`
      )
    );
  };

  const handleUnmortgage = (tileIndex: number) => {
    const tile = state.tiles[tileIndex];
    const prop = state.properties[tileIndex];
    if (!prop || prop.ownerId !== state.currentPlayer || !prop.mortgaged) return;
    const payoff = Math.ceil(("price" in tile ? tile.price : 0) * 0.55);
    const player = state.players[state.currentPlayer];
    if (player.cash < payoff) return;
    captureUndo();
    setState((s) =>
      addLog(
        {
          ...s,
          properties: { ...s.properties, [tileIndex]: { ...prop, mortgaged: false } },
          players: s.players.map((p, i) =>
            i === s.currentPlayer ? { ...p, cash: p.cash - payoff } : p
          ),
        },
        `${player.name} unmortgages ${renderTileLabel(tile)} for $${payoff}`
      )
    );
  };

  const handleUpgrade = (tileIndex: number) => {
    const tile = state.tiles[tileIndex];
    if (tile.kind !== "company") return;
    const prop = state.properties[tileIndex];
    if (!prop || prop.ownerId !== state.currentPlayer || prop.mortgaged) return;
    if (!ownsAllInSector(state.currentPlayer, tile.sector, state.tiles, state.properties)) return;
    if (prop.upgrades >= 5) return;
    // even-build: cannot build more than 1 higher than lowest in sector
    const sectorProps = Object.entries(state.properties)
      .filter(([idx, val]) => val.ownerId === state.currentPlayer && state.tiles[Number(idx)].kind === "company")
      .filter(([idx]) => (state.tiles[Number(idx)] as CompanyTile).sector === tile.sector)
      .map(([_, val]) => val.upgrades);
    const minUpg = Math.min(...sectorProps);
    if (prop.upgrades > minUpg) return;
    const player = state.players[state.currentPlayer];
    if (player.cash < tile.upgradeCost) return;
    captureUndo();
    const newProps = {
      ...state.properties,
      [tileIndex]: { ...prop, upgrades: prop.upgrades + 1 },
    };
    const newPlayers = state.players.map((p, i) =>
      i === state.currentPlayer ? { ...p, cash: p.cash - tile.upgradeCost } : p
    );
    setState((s) =>
      addLog(
        {
          ...s,
          properties: newProps,
          players: newPlayers,
        },
        `${player.name} upgraded ${tile.ticker} to level ${prop.upgrades + 1}`
      )
    );
  };

  const handleSellUpgrade = (tileIndex: number) => {
    const tile = state.tiles[tileIndex];
    if (tile.kind !== "company") return;
    const prop = state.properties[tileIndex];
    if (!prop || prop.ownerId !== state.currentPlayer) return;
    if (prop.upgrades <= 0) return;
    captureUndo();
    const refund = Math.floor(tile.upgradeCost / 2);
    const newProps = {
      ...state.properties,
      [tileIndex]: { ...prop, upgrades: prop.upgrades - 1 },
    };
    const newPlayers = state.players.map((p, i) =>
      i === state.currentPlayer ? { ...p, cash: p.cash + refund } : p
    );
    setState((s) =>
      addLog(
        {
          ...s,
          properties: newProps,
          players: newPlayers,
        },
        `${s.players[s.currentPlayer].name} sells an upgrade on ${tile.ticker} for $${refund}`
      )
    );
  };

  function handleEndTurn() {
    setPending({ type: "none" });
    undoRef.current = null;
    setState((s) => handleNextPlayer(s));
  }

  const tileAt = (x: number, y: number) => {
    // find index matching coord
    for (let i = 0; i < state.tiles.length; i++) {
      const coord = indexToCoord(i);
      if (coord.x === x && coord.y === y) return { tile: state.tiles[i], index: i };
    }
    return null;
  };

  const tokenPositions = useMemo(() => {
    const positions: Record<number, number[]> = {};
    state.players.forEach((p, idx) => {
      if (p.bankrupt) return;
      if (!positions[p.position]) positions[p.position] = [];
      positions[p.position].push(idx);
    });
    return positions;
  }, [state.players]);

  const playerInsights = useMemo(() => {
    return state.players.map((p, idx) => {
      const holdings = Object.entries(state.properties).filter(
        ([, prop]) => prop.ownerId === idx
      );
      let propertyValue = 0;
      const sectors = new Set<string>();
      holdings.forEach(([tileIdx, prop]) => {
        const tile = state.tiles[Number(tileIdx)];
        if (tile.kind !== "company") return;
        const base = prop.mortgaged ? tile.price * 0.5 : tile.price;
        const upgradesValue = (tile.upgradeCost ?? 0) * prop.upgrades;
        propertyValue += base + upgradesValue;
        sectors.add(tile.sector);
      });
      const monopolies = Array.from(sectors).filter((sector) =>
        ownsAllInSector(idx, sector, state.tiles, state.properties)
      );
      return {
        id: idx,
        name: p.name,
        cash: p.cash,
        netWorth: p.cash + propertyValue,
        monopolies,
      };
    });
  }, [state.players, state.properties, state.tiles]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
      <div>
        {winnerId !== null && (
          <UICard className="mb-4 border-green-500/50 bg-green-900/20">
            <div className="text-lg font-bold">Winner: {state.players[winnerId]?.name}</div>
            <div className="text-sm text-slate-300">Game over — reset or load a save to play again.</div>
          </UICard>
        )}
        <div className="grid grid-cols-11 grid-rows-11 gap-1 gs-panel rounded-2xl p-2">
          {Array.from({ length: 11 }).map((_, row) =>
            Array.from({ length: 11 }).map((_, col) => {
              const data = tileAt(col, 10 - row);
              if (!data) return <div key={`${row}-${col}`} className="bg-black/70" />;
              const { tile, index } = data;
              const owners = tokenPositions[index] || [];
              return (
                <TileCell
                  key={`${row}-${col}`}
                  tile={tile}
                  tileIndex={index}
                  property={state.properties[index]}
                  isCurrent={index === current.position}
                  owners={owners}
                />
              );
            })
          )}
        </div>
      </div>

      <div className="space-y-4">
        <UICard>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Current Player</div>
              <div className="text-xl font-bold">{current.name}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Cash</div>
              <div className="text-2xl font-bold text-emerald-300">${current.cash}</div>
            </div>
          </div>
          <div className="mt-3 flex gap-2 flex-wrap">
            <Button onClick={handleRoll} disabled={winnerId !== null}>
              Roll Dice
            </Button>
            {pending.type === "buy" && (
              <>
                <Button onClick={handleBuy} disabled={winnerId !== null}>
                  Buy
                </Button>
                <Button variant="secondary" onClick={handleSkipBuy} disabled={winnerId !== null}>
                  Auction
                </Button>
              </>
            )}
            <Button variant="secondary" onClick={handleEndTurn} disabled={winnerId !== null}>
              End Turn
            </Button>
            <Button variant="ghost" size="sm" onClick={handleUndo} disabled={!undoRef.current || winnerId !== null}>
              Undo
            </Button>
          </div>
          {current.inJail && (
            <div className="mt-2 flex gap-2 flex-wrap">
              <Button size="sm" variant="secondary" onClick={handlePayBail} disabled={current.cash < BAIL_AMOUNT}>
                Pay ${BAIL_AMOUNT} bail
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleUseJailCard}
                disabled={!current.getOutOfJail}
              >
                Use jail card ({current.getOutOfJail ?? 0})
              </Button>
              <span className="text-xs text-slate-400">
                Turns left: {current.jailTurns}
              </span>
            </div>
          )}
          {state.lastRoll && (
            <div className="mt-2 text-sm text-slate-400">
              Last roll: {state.lastRoll[0]} + {state.lastRoll[1]} = {state.lastRoll[0] + state.lastRoll[1]}
            </div>
          )}
          {rolling && <div className="text-xs text-emerald-300 mt-1 animate-pulse">Rolling…</div>}
          {pending.type === "buy" && (
            <div className="mt-2 text-sm text-amber-300">
              Opportunity: buy {renderTileLabel(state.tiles[pending.tileIndex])}
            </div>
          )}
        </UICard>

        <UICard>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-xs text-slate-400">Player pulse</div>
              <div className="text-sm text-slate-200">Net worth & monopolies</div>
            </div>
            <div className="text-xs text-slate-500">Live</div>
          </div>
          <div className="space-y-3">
            {playerInsights.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl gs-panel-soft px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: playerColor(p.id) }}
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-white">{p.name}</span>
                    {p.monopolies.length > 0 && (
                      <span className="text-[11px] text-amber-300">
                        Monopolies: {p.monopolies.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-300 font-semibold">${p.netWorth.toFixed(0)}</div>
                  <div className="text-xs text-slate-400">Cash ${p.cash}</div>
                </div>
              </div>
            ))}
          </div>
        </UICard>

        <UICard>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="text-xs text-slate-400 mb-1">Save slot</div>
                <Input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="w-full"
                  placeholder="Autosave"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={handleManualSave}>
                  Save
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleLoadSave(saveName)}>
                  Load
                </Button>
                <Button size="sm" variant="ghost" onClick={handleResetGame}>
                  Reset
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
              {saves.map((s) => (
                <button
                  key={s.name}
                  onClick={() => handleLoadSave(s.name)}
                  className="px-2 py-1 rounded border border-[color:var(--grid-border)] hover:border-[rgb(var(--grid-accent)/0.4)] text-left"
                  title={new Date(s.updatedAt).toLocaleString()}
                >
                  {s.name}
                </button>
              ))}
              {saves.length === 0 && <span>No saves yet — autosave will start once you play.</span>}
            </div>
          </div>
        </UICard>

        <UICard>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <div className="text-xs text-slate-400">Players</div>
                <Input
                  type="number"
                  min={2}
                  max={6}
                  value={settings.playerCount}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, playerCount: Number(e.target.value) || 2 }))
                  }
                  className="w-24"
                />
              </div>
              <div>
                <div className="text-xs text-slate-400">Auto-end</div>
                <select
                  className="gs-select rounded-full px-2 py-1 text-sm"
                  value={settings.autoEndMs}
                  onChange={(e) => setSettings((s) => ({ ...s, autoEndMs: Number(e.target.value) }))}
                >
                  <option value={10000}>10s</option>
                  <option value={20000}>20s</option>
                  <option value={30000}>30s</option>
                  <option value={45000}>45s</option>
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="text-xs text-slate-400 mb-1">AI slots</div>
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: settings.playerCount }).map((_, idx) => (
                    <label key={idx} className="text-xs flex items-center gap-1 border border-[color:var(--grid-border)] rounded px-2 py-1">
                      <input
                        type="checkbox"
                        checked={settings.aiSlots.includes(idx)}
                        onChange={(e) => {
                          setSettings((s) => {
                            const ai = new Set(s.aiSlots);
                            if (e.target.checked) ai.add(idx);
                            else ai.delete(idx);
                            return { ...s, aiSlots: Array.from(ai) };
                          });
                        }}
                      />
                      AI P{idx + 1}
                    </label>
                  ))}
                </div>
              </div>
              <Button size="sm" onClick={handleApplySettings}>
                Apply & Restart
              </Button>
            </div>
          </div>
        </UICard>

        {auction && (
          <UICard>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Auction</div>
                <div className="font-bold">{renderTileLabel(state.tiles[auction.tileIndex])}</div>
                <div className="text-xs text-slate-500">
                  High bid: ${auction.highBid}{" "}
                  {auction.highBidder !== null ? `by ${state.players[auction.highBidder].name}` : ""}
                </div>
              </div>
              <div className="text-xs text-slate-400">Timer: {auction.timer}s</div>
            </div>
            <div className="mt-2 text-sm text-slate-400">
              Current bidder: {state.players[auction.participants[auction.activeBidder]].name}
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={handleAuctionBid}>
                Bid +$10
              </Button>
              <Button size="sm" variant="secondary" onClick={handleAuctionPass}>
                Pass
              </Button>
            </div>
          </UICard>
        )}

        <UICard>
          <div className="font-bold mb-2">Owned & Upgrades</div>
          {ownedCompanies.length === 0 && <div className="text-sm text-slate-500">No companies yet.</div>}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {ownedCompanies.map((idx) => {
              const tile = state.tiles[idx] as CompanyTile;
              const prop = state.properties[idx];
              const canUpgrade =
                prop.upgrades < 5 &&
                ownsAllInSector(state.currentPlayer, tile.sector, state.tiles, state.properties) &&
                state.players[state.currentPlayer].cash >= tile.upgradeCost;
              const mortgageValue = Math.floor(tile.price * 0.5);
              const unmortgageCost = Math.ceil(tile.price * 0.55);
              return (
                <div key={idx} className="flex items-center justify-between text-sm gap-2">
                  <span className="flex-1">
                    {tile.ticker} ({tile.sector}) — Upg {prop.upgrades} {prop.mortgaged ? "(M)" : ""}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={!canUpgrade || prop.mortgaged} onClick={() => handleUpgrade(idx)}>
                      Upgrade (${tile.upgradeCost})
                    </Button>
                    <Button size="sm" variant="secondary" disabled={prop.upgrades === 0} onClick={() => handleSellUpgrade(idx)}>
                      Sell Upg (+${Math.floor(tile.upgradeCost / 2)})
                    </Button>
                    {!prop.mortgaged ? (
                      <Button size="sm" variant="secondary" disabled={prop.upgrades > 0} onClick={() => handleMortgage(idx)}>
                        Mortgage (+${mortgageValue})
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={state.players[state.currentPlayer].cash < unmortgageCost}
                        onClick={() => handleUnmortgage(idx)}
                      >
                        Unmortgage (${unmortgageCost})
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {fullSets.length > 0 && (
            <div className="text-xs text-emerald-300 mt-2">Monopolies: {fullSets.join(", ")}</div>
          )}
        </UICard>

        <UICard>
          <div className="font-bold mb-2">Quick Trade</div>
          <div className="text-xs text-slate-400 mb-1">Swap properties and cash; use cash direction for counteroffers.</div>
          <div className="flex flex-col gap-2">
            <select
              className="gs-select rounded-full px-2 py-1 text-sm"
              value={tradeProperty ?? ""}
              onChange={(e) => setTradeProperty(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Give: property (optional)</option>
              {ownedCompanies.map((idx) => (
                <option key={idx} value={idx}>
                  {renderTileLabel(state.tiles[idx])}
                </option>
              ))}
            </select>
            <select
              className="gs-select rounded-full px-2 py-1 text-sm"
              value={tradeReceiveProperty ?? ""}
              onChange={(e) => setTradeReceiveProperty(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Receive: property (optional)</option>
              {state.players
                .filter((p) => p.id !== state.currentPlayer && !p.bankrupt)
                .flatMap((p) =>
                  Object.entries(state.properties)
                    .filter(([_, prop]) => prop.ownerId === p.id && state.tiles[Number(_)].kind === "company")
                    .map(([idx]) => ({
                      idx: Number(idx),
                      owner: p,
                    }))
                )
                .map(({ idx, owner }) => (
                  <option key={idx} value={idx}>
                    {renderTileLabel(state.tiles[idx])} from {owner.name}
                  </option>
                ))}
            </select>
            <select
              className="gs-select rounded-full px-2 py-1 text-sm"
              value={tradeTarget ?? ""}
              onChange={(e) => setTradeTarget(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Target player</option>
              {state.players
                .filter((p) => p.id !== state.currentPlayer && !p.bankrupt)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.cash})
                  </option>
                ))}
            </select>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              Cash from
              <select
                className="gs-select rounded-full px-2 py-1 text-sm"
                value={tradeCashDirection}
                onChange={(e) => setTradeCashDirection(e.target.value as "me" | "them")}
              >
                <option value="them">Them</option>
                <option value="me">Me</option>
              </select>
              <Input
                type="number"
                min={0}
                value={tradePrice}
                onChange={(e) => setTradePrice(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <Button size="sm" onClick={handleTradeSubmit} disabled={tradeTarget === null}>
              Send Offer / Counter
            </Button>
          </div>
        </UICard>

        <UICard>
          <div className="font-bold mb-2">Players</div>
          <div className="space-y-2">
            {state.players.map((p, idx) => (
              <div
                key={p.id}
                className={`flex items-center justify-between text-sm ${idx === state.currentPlayer ? "text-white" : "text-slate-400"}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ background: playerColor(idx) }}
                  />
                  <Input
                    value={p.name}
                    onChange={(e) => handleRenamePlayer(p.id, e.target.value)}
                    className="px-2 py-1 text-xs w-28"
                  />
                  {p.isAI && <span className="text-[10px] text-emerald-300 uppercase">AI</span>}
                </div>
                <div>${p.cash}</div>
              </div>
            ))}
          </div>
        </UICard>

        <UICard>
          <div className="font-bold mb-2">Stats</div>
          <div className="text-xs text-slate-400 mb-2">Net worth includes cash + property cost (ignores mortgages discounts).</div>
          <div className="space-y-1 text-sm">
            {state.players.map((p) => {
              const owned = Object.entries(state.properties).filter(([_, val]) => val.ownerId === p.id);
              const propertyValue = owned.reduce((sum, [idx]) => {
                const tile = state.tiles[Number(idx)];
                if ("price" in tile) {
                  return sum + tile.price;
                }
                return sum;
              }, 0);
              const upgradesValue = owned.reduce((sum, [idx, val]) => {
                const tile = state.tiles[Number(idx)];
                if (tile.kind === "company") {
                  return sum + val.upgrades * (tile.upgradeCost / 2);
                }
                return sum;
              }, 0);
              const net = p.cash + propertyValue + upgradesValue;
              return (
                <div key={p.id} className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: playerColor(p.id) }} />
                    {p.name}
                  </span>
                  <span>${net.toFixed(0)}</span>
                </div>
              );
            })}
          </div>
        </UICard>

        <UICard>
          <div className="font-bold mb-2">Log</div>
          <div className="space-y-1 max-h-60 overflow-y-auto text-xs text-slate-300">
            {state.log.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        </UICard>
      </div>
    </div>
  );
}

function TileCell({
  tile,
  tileIndex,
  property,
  isCurrent,
  owners,
}: {
  tile: Tile;
  tileIndex: number;
  property?: PropertyState;
  isCurrent: boolean;
  owners: number[];
}) {
  const bg =
    tile.kind === "company"
      ? tile.color
      : tile.kind === "tax"
      ? "#4b5563"
      : tile.kind === "event"
      ? "#7c3aed"
      : tile.kind === "etf" || tile.kind === "index"
      ? "#0ea5e9"
      : "#111827";
  const label = renderTileLabel(tile);
  const rentDetails =
    tile.kind === "company"
      ? tile.rents.map((r, i) => `${i}:$${r}`).join(" ")
      : tile.kind === "etf"
      ? tile.rentScale.join("/")
      : tile.kind === "index"
      ? `x${tile.rentMultiplier.one}/${tile.rentMultiplier.both}`
      : "";
  const title = tile.kind === "company"
    ? `${label} • Rent ${tile.rents[property?.upgrades ?? 0]} ${property?.mortgaged ? "(mortgaged)" : ""} • ${rentDetails}`
    : `${label} ${rentDetails}`;
  return (
    <div
      className={`relative border border-[color:var(--grid-border)] rounded-sm p-1 text-[10px] leading-tight transition transform ${
        isCurrent ? "ring-2 ring-white/60 scale-[1.02]" : ""
      }`}
      style={{ background: bg }}
      title={title}
    >
      <div className="font-bold">{label}</div>
      {tile.kind === "company" && (
        <div className="text-[9px]">
          ${tile.price} / upg ${tile.upgradeCost}
        </div>
      )}
      {tile.kind === "tax" && <div className="text-[9px]">{tile.flat ? `$${tile.flat}` : ""}</div>}
      {property && (
        <div className="text-[9px]">
          Owner: P{property.ownerId + 1} • Upg {property.upgrades} {property.mortgaged ? "• M" : ""}
        </div>
      )}
      {isCurrent && <div className="absolute top-0 right-1 text-[10px]">●</div>}
      <div className="flex gap-1 mt-1 flex-wrap">
        {owners.map((o) => (
          <span
            key={o}
            className="w-2 h-2 rounded-full"
            style={{ background: playerColor(o) }}
            title={`P${o + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
  const findNearestOfKind = (kind: "etf" | "index", from: number) => {
    for (let step = 1; step < state.tiles.length; step++) {
      const idx = (from + step) % state.tiles.length;
      if (state.tiles[idx].kind === kind) return idx;
    }
    return from;
  };
