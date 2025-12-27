export type StoredSearch = {
  query: string;
  scopeId: string;
  timestamp: number;
};

export type StoredJump = {
  title: string;
  href: string;
  timestamp: number;
};

export type ApplySearchDetail = {
  query: string;
  scopeId?: string;
};

const RECENT_SEARCHES_KEY = "illuvrse:search:recent";
const SAVED_SEARCHES_KEY = "illuvrse:search:saved";
const RECENT_JUMPS_KEY = "illuvrse:search:jumps";
const PERSONALIZATION_KEY = "illuvrse:search:personalization";
export const SEARCH_UPDATE_EVENT = "illuvrse-search-update";
export const SEARCH_APPLY_EVENT = "illuvrse-search-apply";

const MAX_RECENT_SEARCHES = 6;
const MAX_SAVED_SEARCHES = 8;
const MAX_RECENT_JUMPS = 6;

const isBrowser = () => typeof window !== "undefined";

const safeParse = <T>(value: string | null): T[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const readList = <T>(key: string): T[] => {
  if (!isBrowser()) return [];
  try {
    return safeParse<T>(window.localStorage.getItem(key));
  } catch {
    return [];
  }
};

const emitUpdate = () => {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(SEARCH_UPDATE_EVENT));
};

const writeList = <T>(key: string, list: T[]) => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    return;
  }
  emitUpdate();
};

const normalizeQuery = (query: string) => query.trim().toLowerCase();

const isSameSearch = (a: StoredSearch, b: StoredSearch) =>
  a.scopeId === b.scopeId && normalizeQuery(a.query) === normalizeQuery(b.query);

export const getRecentSearches = () => readList<StoredSearch>(RECENT_SEARCHES_KEY);

export const getSavedSearches = () => readList<StoredSearch>(SAVED_SEARCHES_KEY);

export const getRecentJumps = () => readList<StoredJump>(RECENT_JUMPS_KEY);

export const getPersonalizationEnabled = () => {
  if (!isBrowser()) return true;
  try {
    const value = window.localStorage.getItem(PERSONALIZATION_KEY);
    if (value === null) return true;
    return value === "true";
  } catch {
    return true;
  }
};

export const setPersonalizationEnabled = (enabled: boolean) => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(PERSONALIZATION_KEY, String(enabled));
  } catch {
    return;
  }
  emitUpdate();
};

export const recordRecentSearch = (query: string, scopeId: string) => {
  if (!getPersonalizationEnabled()) return;
  const trimmed = query.trim();
  if (!trimmed) return;
  const entry: StoredSearch = { query: trimmed, scopeId, timestamp: Date.now() };
  const existing = getRecentSearches();
  const next = [entry, ...existing.filter((item) => !isSameSearch(item, entry))].slice(
    0,
    MAX_RECENT_SEARCHES
  );
  writeList(RECENT_SEARCHES_KEY, next);
};

export const saveSearch = (query: string, scopeId: string) => {
  const trimmed = query.trim();
  if (!trimmed) return;
  const entry: StoredSearch = { query: trimmed, scopeId, timestamp: Date.now() };
  const existing = getSavedSearches();
  const next = [entry, ...existing.filter((item) => !isSameSearch(item, entry))].slice(
    0,
    MAX_SAVED_SEARCHES
  );
  writeList(SAVED_SEARCHES_KEY, next);
};

export const removeSavedSearch = (query: string, scopeId: string) => {
  const trimmed = query.trim();
  if (!trimmed) return;
  const next = getSavedSearches().filter(
    (item) => !(item.scopeId === scopeId && normalizeQuery(item.query) === normalizeQuery(trimmed))
  );
  writeList(SAVED_SEARCHES_KEY, next);
};

export const recordJump = (title: string, href: string) => {
  if (!getPersonalizationEnabled()) return;
  if (!title || !href) return;
  const entry: StoredJump = { title, href, timestamp: Date.now() };
  const existing = getRecentJumps();
  const next = [entry, ...existing.filter((item) => item.href !== href)].slice(
    0,
    MAX_RECENT_JUMPS
  );
  writeList(RECENT_JUMPS_KEY, next);
};

export const clearSearchHistory = () => {
  writeList(RECENT_SEARCHES_KEY, []);
  writeList(RECENT_JUMPS_KEY, []);
};

export const clearRecentActivity = () => {
  clearSearchHistory();
};

export const dispatchApplySearch = (detail: ApplySearchDetail) => {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(SEARCH_APPLY_EVENT, { detail }));
};
