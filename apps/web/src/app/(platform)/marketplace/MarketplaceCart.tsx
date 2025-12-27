"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export type CartItemInput = {
  sku: string;
  name: string;
  price: number;
  currency: string;
  category: string;
  image: {
    gradient: string;
    accent: string;
  };
};

type CartItem = CartItemInput & {
  quantity: number;
};

const CART_EVENT = "illuvrse:marketplace:add";

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);

export function AddToCartButton({
  item,
  className,
  children
}: {
  item: CartItemInput;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (typeof window === "undefined") return;
        window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: item }));
      }}
    >
      {children ?? "Add to cart"}
    </button>
  );
}

export function MarketplaceCartDock({ buttonClassName }: { buttonClassName?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<CartItemInput>).detail;
      if (!detail) return;
      setItems((prev) => {
        const existing = prev.find((entry) => entry.sku === detail.sku);
        if (!existing) {
          return [...prev, { ...detail, quantity: 1 }];
        }
        return prev.map((entry) =>
          entry.sku === detail.sku ? { ...entry, quantity: entry.quantity + 1 } : entry
        );
      });
      setOpen(true);
    };

    window.addEventListener(CART_EVENT, handler as EventListener);
    return () => window.removeEventListener(CART_EVENT, handler as EventListener);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const itemCount = useMemo(
    () => items.reduce((count, item) => count + item.quantity, 0),
    [items]
  );
  const currency = items[0]?.currency ?? "USD";
  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items]
  );

  const hasItems = items.length > 0;
  const buttonBase =
    "hidden items-center gap-2 rounded-full border border-[color:var(--border)] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--forest)] transition hover:border-[color:var(--forest)] md:inline-flex";

  return (
    <>
      <button type="button" className={`${buttonBase} ${buttonClassName ?? ""}`} onClick={() => setOpen(true)}>
        Cart
        <span className="rounded-full bg-[color:var(--forest)] px-2 py-0.5 text-[10px] font-semibold text-white">
          {itemCount}
        </span>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--forest)] shadow-card md:hidden"
      >
        Cart
        <span className="rounded-full bg-[color:var(--forest)] px-2 py-0.5 text-[10px] font-semibold text-white">
          {itemCount}
        </span>
      </button>
      {open ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="marketplace-cart-title">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md border-l border-[color:var(--border)] bg-[color:var(--bg-cream)] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-[color:var(--border)] bg-white/85 px-5 py-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                    Marketplace cart
                  </div>
                  <h3 id="marketplace-cart-title" className="mt-1 text-lg font-semibold text-[color:var(--text)]">
                    {itemCount} items
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!hasItems}
                    onClick={() => setItems([])}
                    className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${hasItems ? "border-[color:var(--border)] text-[color:var(--forest)]" : "border-slate-200 text-slate-400 cursor-not-allowed"}`}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--forest)]"
                  >
                    Close
                  </button>
                </div>
              </div>

              {hasItems ? (
                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                  {items.map((item) => (
                    <div
                      key={item.sku}
                      className="flex gap-3 rounded-2xl border border-[color:var(--border)] bg-white/80 p-4 shadow-sm"
                    >
                      <div className="relative h-14 w-14 flex-none overflow-hidden rounded-xl border border-[color:var(--border)]">
                        <div className="absolute inset-0" style={{ background: item.image.gradient }} />
                        <div
                          className="absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-90"
                          style={{ background: item.image.accent }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                            <div className="text-xs text-slate-500">{item.category}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setItems((prev) => prev.filter((entry) => entry.sku !== item.sku))
                            }
                            className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-700"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setItems((prev) =>
                                  prev
                                    .map((entry) =>
                                      entry.sku === item.sku
                                        ? { ...entry, quantity: entry.quantity - 1 }
                                        : entry
                                    )
                                    .filter((entry) => entry.quantity > 0)
                                )
                              }
                              className="h-7 w-7 rounded-full border border-[color:var(--border)] bg-white text-sm font-semibold text-[color:var(--forest)]"
                            >
                              -
                            </button>
                            <span className="text-sm font-semibold text-slate-900">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setItems((prev) =>
                                  prev.map((entry) =>
                                    entry.sku === item.sku
                                      ? { ...entry, quantity: entry.quantity + 1 }
                                      : entry
                                  )
                                )
                              }
                              className="h-7 w-7 rounded-full border border-[color:var(--border)] bg-white text-sm font-semibold text-[color:var(--forest)]"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-sm font-semibold text-slate-900">
                            {formatCurrency(item.price * item.quantity, item.currency)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center text-sm text-slate-600">
                  <div className="rounded-full border border-[color:var(--border)] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--forest)]">
                    Cart empty
                  </div>
                  <p>Browse listings and add items to start checkout.</p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--forest)]"
                  >
                    Continue shopping
                  </button>
                </div>
              )}

              <div className="border-t border-[color:var(--border)] bg-white/85 px-5 py-4">
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Subtotal</span>
                    <span className="text-base font-semibold text-slate-900">
                      {formatCurrency(subtotal, currency)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Taxes and delivery fees calculated during checkout.
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  <Link
                    href="/checkout"
                    className={`rounded-full px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] shadow-card ${hasItems ? "bg-[color:var(--forest)] text-white" : "pointer-events-none bg-slate-200 text-slate-500"}`}
                    aria-disabled={!hasItems}
                  >
                    Proceed to checkout
                  </Link>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--forest)]"
                  >
                    Keep shopping
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
