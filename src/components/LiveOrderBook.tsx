import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { levels, seedBook, spread } from "@/lib/orderbook";

// three.js is ~160KB gzipped, so it is only fetched when someone is actually
// going to look at it.
const OrderBook3D = lazy(() => import("@/components/OrderBook3D"));

/** Static depth ladder: the fallback, and what shows before the 3D loads. */
const DepthLadder: React.FC<{ note: string }> = ({ note }) => {
  const book = useRef(seedBook()).current;
  const bids = levels(book.bids).slice(0, 7);
  const asks = levels(book.asks).slice(-7).reverse();
  const widest = Math.max(...[...bids, ...asks].map((l) => l.size), 1);
  const { bid, ask } = spread(book);

  const Row: React.FC<{ price: number; size: number; side: "bid" | "ask" }> = ({
    price,
    size,
    side,
  }) => (
    <div className="flex items-center gap-2 font-mono text-[0.7rem]">
      <span className={side === "bid" ? "w-10 text-green" : "w-10 text-red"}>
        {price}
      </span>
      <span
        className={`h-2 rounded-sm ${side === "bid" ? "bg-green/60" : "bg-red/60"}`}
        style={{ width: `${(size / widest) * 100}%` }}
      />
      <span className="text-mute">{size}</span>
    </div>
  );

  return (
    <div className="flex h-full w-full flex-col justify-center gap-1 bg-ink p-4">
      {asks.map((l) => (
        <Row key={`a${l.price}`} {...l} side="ask" />
      ))}
      <div className="my-1 font-mono text-[0.7rem] text-mute">
        spread{" "}
        <span className="text-fog">
          {bid !== undefined && ask !== undefined ? ask - bid : "—"}
        </span>
      </div>
      {bids.map((l) => (
        <Row key={`b${l.price}`} {...l} side="bid" />
      ))}
      <p className="mt-2 font-mono text-[0.65rem] text-mute">{note}</p>
    </div>
  );
};

/**
 * The live order book panel. Renders in 3D on capable devices, and a static
 * depth ladder on phones or under reduced motion, where an auto-rotating
 * WebGL canvas is the wrong thing to serve.
 */
const LiveOrderBook: React.FC = () => {
  const reducedMotion = useReducedMotion();
  const wideEnough = useMediaQuery("(min-width: 850px)");
  const finePointer = useMediaQuery("(pointer: fine)");
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const use3D = wideEnough && finePointer && !reducedMotion;

  useEffect(() => {
    const node = ref.current;
    if (!node || !use3D) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [use3D]);

  if (!use3D) {
    return (
      <div className="h-full w-full">
        <DepthLadder
          note={
            reducedMotion
              ? "static view · reduced motion"
              : "simulated depth · open on a larger screen for the 3D book"
          }
        />
      </div>
    );
  }

  return (
    <div ref={ref} className="h-full w-full">
      {inView ? (
        <Suspense fallback={<DepthLadder note="loading the 3D book…" />}>
          <OrderBook3D />
        </Suspense>
      ) : (
        <DepthLadder note="simulated depth" />
      )}
    </div>
  );
};

export default LiveOrderBook;
