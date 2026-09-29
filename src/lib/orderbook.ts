/**
 * A small price-time priority order book, used to drive the 3D visual on the
 * projects section. Same rules as the C++ engine it illustrates: limit orders
 * rest on the book, incoming orders cross against the best opposing price
 * first, and equal prices are filled in arrival order.
 *
 * Pure and deterministic given an rng, so the matching rules are unit tested.
 */

export type Side = "bid" | "ask";

export interface Order {
  id: number;
  side: Side;
  /** Integer ticks, to keep floating point out of the matching. */
  price: number;
  size: number;
}

export interface Trade {
  price: number;
  size: number;
  /** The side of the incoming order that caused the trade. */
  takerSide: Side;
}

export interface Level {
  price: number;
  size: number;
}

export interface Book {
  /** Best bid first (descending price). */
  bids: Order[];
  /** Best ask first (ascending price). */
  asks: Order[];
  lastTrades: Trade[];
  nextId: number;
}

export type Rng = () => number;

export const MID_PRICE = 100;
export const PRICE_BAND = 12;

export function createBook(): Book {
  return { bids: [], asks: [], lastTrades: [], nextId: 1 };
}

/**
 * Price-time priority: better price first, then earlier arrival. The new order
 * goes before the first *strictly worse* price, which puts it behind everything
 * already resting at its own price rather than ahead of it.
 */
function insertResting(resting: Order[], order: Order): Order[] {
  const worse =
    order.side === "bid"
      ? (a: Order) => a.price < order.price
      : (a: Order) => a.price > order.price;

  const index = resting.findIndex(worse);
  if (index === -1) return [...resting, order];
  return [...resting.slice(0, index), order, ...resting.slice(index)];
}

function crosses(incoming: Order, best: Order): boolean {
  return incoming.side === "bid"
    ? incoming.price >= best.price
    : incoming.price <= best.price;
}

/**
 * Matches an incoming order against the book, resting whatever is left over.
 * Returns the new book and the trades produced.
 */
export function submit(book: Book, incoming: Order): {
  book: Book;
  trades: Trade[];
} {
  const opposite = incoming.side === "bid" ? "asks" : "bids";
  let resting = [...book[opposite]];
  let remaining = incoming.size;
  const trades: Trade[] = [];

  while (remaining > 0 && resting.length && crosses(incoming, resting[0])) {
    const best = resting[0];
    const filled = Math.min(remaining, best.size);

    // The resting order sets the price: that is what price-time priority means.
    trades.push({ price: best.price, size: filled, takerSide: incoming.side });
    remaining -= filled;

    if (filled === best.size) {
      resting = resting.slice(1);
    } else {
      resting = [{ ...best, size: best.size - filled }, ...resting.slice(1)];
    }
  }

  const own = incoming.side === "bid" ? "bids" : "asks";
  const next: Book = {
    ...book,
    [opposite]: resting,
    [own]:
      remaining > 0
        ? insertResting(book[own], { ...incoming, size: remaining })
        : book[own],
    lastTrades: [...trades, ...book.lastTrades].slice(0, 12),
  };

  return { book: next, trades };
}

export function cancel(book: Book, id: number): Book {
  return {
    ...book,
    bids: book.bids.filter((o) => o.id !== id),
    asks: book.asks.filter((o) => o.id !== id),
  };
}

/** Collapses resting orders into one entry per price, for rendering. */
export function levels(orders: Order[]): Level[] {
  const byPrice = new Map<number, number>();
  for (const order of orders) {
    byPrice.set(order.price, (byPrice.get(order.price) ?? 0) + order.size);
  }
  return [...byPrice.entries()]
    .map(([price, size]) => ({ price, size }))
    .sort((a, b) => b.price - a.price);
}

export function spread(book: Book): { bid?: number; ask?: number } {
  return { bid: book.bids[0]?.price, ask: book.asks[0]?.price };
}

/**
 * One step of simulated flow: mostly resting limit orders near the touch,
 * occasionally an aggressive order that crosses and prints a trade.
 */
export function simulateStep(book: Book, rng: Rng = Math.random): Book {
  let next = book;

  // Keep the book from growing without bound.
  const resting = next.bids.length + next.asks.length;
  if (resting > 70) {
    const victim = [...next.bids, ...next.asks][Math.floor(rng() * resting)];
    if (victim) next = cancel(next, victim.id);
  }

  const side: Side = rng() > 0.5 ? "bid" : "ask";
  const { bid, ask } = spread(next);
  const reference = side === "bid" ? bid ?? MID_PRICE : ask ?? MID_PRICE;

  const aggressive = rng() > 0.72;
  const offset = Math.ceil(rng() * 4);
  const price = aggressive
    ? // Reach across the spread to take liquidity.
      side === "bid"
      ? (ask ?? MID_PRICE) + Math.floor(rng() * 2)
      : (bid ?? MID_PRICE) - Math.floor(rng() * 2)
    : side === "bid"
      ? reference - offset
      : reference + offset;

  const clamped = Math.max(
    MID_PRICE - PRICE_BAND,
    Math.min(MID_PRICE + PRICE_BAND, price)
  );

  const order: Order = {
    id: next.nextId,
    side,
    price: clamped,
    size: 1 + Math.floor(rng() * 9),
  };

  const result = submit({ ...next, nextId: next.nextId + 1 }, order);
  return result.book;
}

/** A book with some depth already on it, so the visual starts populated. */
export function seedBook(rng: Rng = Math.random, steps = 60): Book {
  let book = createBook();
  for (let i = 0; i < steps; i++) book = simulateStep(book, rng);
  return book;
}
