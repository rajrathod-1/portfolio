import assert from "node:assert/strict";
import test from "node:test";
import {
  createBook,
  cancel,
  levels,
  seedBook,
  simulateStep,
  spread,
  submit,
  type Book,
  type Order,
} from "./orderbook.ts";

const limit = (
  id: number,
  side: Order["side"],
  price: number,
  size: number
): Order => ({ id, side, price, size });

function bookWith(orders: Order[]): Book {
  let book = createBook();
  for (const order of orders) book = submit(book, order).book;
  return book;
}

test("a resting order sits on the book and does not trade", () => {
  const { book, trades } = submit(createBook(), limit(1, "bid", 99, 5));
  assert.equal(trades.length, 0);
  assert.equal(book.bids.length, 1);
  assert.equal(book.asks.length, 0);
});

test("bids sort by best price first, asks by lowest", () => {
  const book = bookWith([
    limit(1, "bid", 98, 1),
    limit(2, "bid", 101, 1),
    limit(3, "bid", 99, 1),
    limit(4, "ask", 105, 1),
    limit(5, "ask", 102, 1),
  ]);
  assert.deepEqual(
    book.bids.map((o) => o.price),
    [101, 99, 98]
  );
  assert.deepEqual(
    book.asks.map((o) => o.price),
    [102, 105]
  );
});

test("equal prices keep arrival order", () => {
  const book = bookWith([
    limit(1, "bid", 100, 1),
    limit(2, "bid", 100, 1),
    limit(3, "bid", 100, 1),
  ]);
  assert.deepEqual(
    book.bids.map((o) => o.id),
    [1, 2, 3],
    "first in should be first in the queue"
  );
});

test("a crossing order trades at the resting order's price", () => {
  const seeded = bookWith([limit(1, "ask", 100, 5)]);
  // Willing to pay 103, but the resting ask is 100, so it fills at 100.
  const { trades } = submit(seeded, limit(2, "bid", 103, 5));
  assert.equal(trades.length, 1);
  assert.equal(trades[0].price, 100);
  assert.equal(trades[0].size, 5);
  assert.equal(trades[0].takerSide, "bid");
});

test("a large order sweeps several levels, best price first", () => {
  const seeded = bookWith([
    limit(1, "ask", 102, 2),
    limit(2, "ask", 100, 3),
    limit(3, "ask", 101, 4),
  ]);
  const { book, trades } = submit(seeded, limit(4, "bid", 102, 8));
  assert.deepEqual(
    trades.map((t) => [t.price, t.size]),
    [
      [100, 3],
      [101, 4],
      [102, 1],
    ],
    "cheapest liquidity is taken first"
  );
  assert.equal(book.asks[0].size, 1, "the 102 level is partly filled");
});

test("an unfilled remainder rests on the book", () => {
  const seeded = bookWith([limit(1, "ask", 100, 2)]);
  const { book, trades } = submit(seeded, limit(2, "bid", 100, 6));
  assert.equal(trades[0].size, 2);
  assert.equal(book.asks.length, 0, "the ask is consumed");
  assert.equal(book.bids.length, 1, "the leftover rests");
  assert.equal(book.bids[0].size, 4);
});

test("orders that do not cross never trade", () => {
  const seeded = bookWith([limit(1, "ask", 105, 5)]);
  const { trades } = submit(seeded, limit(2, "bid", 104, 5));
  assert.equal(trades.length, 0);
});

test("cancel removes a resting order by id without touching others", () => {
  const seeded = bookWith([limit(1, "bid", 99, 1), limit(2, "bid", 98, 1)]);
  const after = cancel(seeded, 1);
  assert.deepEqual(
    after.bids.map((o) => o.id),
    [2]
  );
});

test("levels aggregate size at each price", () => {
  const book = bookWith([
    limit(1, "bid", 100, 3),
    limit(2, "bid", 100, 4),
    limit(3, "bid", 99, 2),
  ]);
  assert.deepEqual(levels(book.bids), [
    { price: 100, size: 7 },
    { price: 99, size: 2 },
  ]);
});

test("the simulation keeps the book sane over many steps", () => {
  let seed = 42;
  const rng = () => {
    // Deterministic LCG, so a failure here is reproducible.
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  let book = seedBook(rng, 40);
  for (let i = 0; i < 400; i++) book = simulateStep(book, rng);

  const { bid, ask } = spread(book);
  if (bid !== undefined && ask !== undefined) {
    assert.ok(bid < ask, `crossed book: bid ${bid} >= ask ${ask}`);
  }
  assert.ok(
    book.bids.every((o) => o.size > 0) && book.asks.every((o) => o.size > 0),
    "no zero-size orders are left resting"
  );
  assert.ok(
    book.bids.length + book.asks.length < 120,
    "the book does not grow without bound"
  );
});
