import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  MID_PRICE,
  PRICE_BAND,
  levels,
  seedBook,
  simulateStep,
  spread,
  type Book,
  type Level,
} from "@/lib/orderbook";

/** Reads a theme token so the scene follows the site's palette. */
function token(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

const BAR_WIDTH = 0.55;
const DEPTH_SCALE = 0.06;

/** One price level, growing and shrinking as liquidity changes. */
const LevelBar: React.FC<{
  level: Level;
  color: string;
  side: "bid" | "ask";
}> = ({ level, color, side }) => {
  const mesh = useRef<THREE.Mesh>(null);
  const target = Math.max(0.05, level.size * DEPTH_SCALE);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    // Ease toward the true size so changes read as movement, not popping.
    const current = mesh.current.scale.y;
    const next = current + (target - current) * Math.min(1, delta * 6);
    mesh.current.scale.y = next;
    mesh.current.position.y = next / 2;
  });

  const x = (level.price - MID_PRICE) * 0.62;
  const z = side === "bid" ? -0.45 : 0.45;

  return (
    <mesh ref={mesh} position={[x, 0.05, z]} scale={[1, 0.05, 1]}>
      <boxGeometry args={[BAR_WIDTH, 1, 0.7]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.85}
        roughness={0.45}
        metalness={0.1}
      />
    </mesh>
  );
};

/** A trade print: a flash at the crossing price that fades and rises. */
const TradeFlash: React.FC<{
  price: number;
  color: string;
  born: number;
  onDone: () => void;
}> = ({ price, color, born, onDone }) => {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!mesh.current) return;
    const age = (performance.now() - born) / 900;
    if (age >= 1) {
      onDone();
      return;
    }
    mesh.current.position.y = 0.4 + age * 1.6;
    const material = mesh.current.material as THREE.MeshBasicMaterial;
    material.opacity = 1 - age;
  });

  return (
    <mesh ref={mesh} position={[(price - MID_PRICE) * 0.62, 0.4, 0]}>
      <sphereGeometry args={[0.16, 12, 12]} />
      <meshBasicMaterial color={color} transparent opacity={1} />
    </mesh>
  );
};

interface Flash {
  key: number;
  price: number;
}

const Scene: React.FC<{ paused: boolean; onBook: (book: Book) => void }> = ({
  paused,
  onBook,
}) => {
  const [book, setBook] = useState<Book>(() => seedBook());
  const [flashes, setFlashes] = useState<Flash[]>([]);
  const flashId = useRef(0);
  const elapsed = useRef(0);

  const colors = useMemo(
    () => ({
      bid: token("--green", "#9ece6a"),
      ask: token("--red", "#f7768e"),
      trade: token("--amber", "#f0b45c"),
      grid: token("--line", "#26304a"),
    }),
    []
  );

  useFrame((_, delta) => {
    if (paused) return;
    elapsed.current += delta;
    if (elapsed.current < 0.22) return;
    elapsed.current = 0;

    setBook((prev) => {
      const next = simulateStep(prev);
      const printed = next.lastTrades.length - prev.lastTrades.length;
      if (printed > 0) {
        const trade = next.lastTrades[0];
        setFlashes((f) => [
          ...f.slice(-8),
          { key: flashId.current++, price: trade.price },
        ]);
      }
      onBook(next);
      return next;
    });
  });

  const bidLevels = useMemo(() => levels(book.bids), [book.bids]);
  const askLevels = useMemo(() => levels(book.asks), [book.asks]);

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 8, 5]} intensity={1.1} />

      {bidLevels.map((level) => (
        <LevelBar
          key={`bid-${level.price}`}
          level={level}
          color={colors.bid}
          side="bid"
        />
      ))}
      {askLevels.map((level) => (
        <LevelBar
          key={`ask-${level.price}`}
          level={level}
          color={colors.ask}
          side="ask"
        />
      ))}

      {flashes.map((flash) => (
        <TradeFlash
          key={flash.key}
          price={flash.price}
          color={colors.trade}
          born={performance.now()}
          onDone={() =>
            setFlashes((f) => f.filter((item) => item.key !== flash.key))
          }
        />
      ))}

      {/* The price axis the book sits on. */}
      <gridHelper
        args={[PRICE_BAND * 1.3, 14, colors.grid, colors.grid]}
        position={[0, 0, 0]}
      />

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        autoRotate={!paused}
        autoRotateSpeed={0.5}
      />
    </>
  );
};

/** Numbers beside the scene, so the visual is readable as data too. */
const Readout: React.FC<{ book: Book | null }> = ({ book }) => {
  if (!book) return null;
  const { bid, ask } = spread(book);
  const last = book.lastTrades[0];

  return (
    <div className="pointer-events-none absolute left-3 top-3 font-mono text-[0.7rem] leading-relaxed">
      <div className="text-mute">
        bid <span className="text-green">{bid ?? "—"}</span>
      </div>
      <div className="text-mute">
        ask <span className="text-red">{ask ?? "—"}</span>
      </div>
      <div className="text-mute">
        spread{" "}
        <span className="text-fog">
          {bid !== undefined && ask !== undefined ? ask - bid : "—"}
        </span>
      </div>
      {last && (
        <div className="text-mute">
          last <span className="text-amber">{last.price}</span>
          <span className="text-mute"> × {last.size}</span>
        </div>
      )}
    </div>
  );
};

const OrderBook3D: React.FC = () => {
  const [book, setBook] = useState<Book | null>(null);
  const [paused, setPaused] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  // Stop simulating when the panel is off screen or the tab is hidden.
  useEffect(() => {
    const node = wrapper.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setPaused(!entry.isIntersecting || document.hidden),
      { threshold: 0.1 }
    );
    observer.observe(node);

    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div ref={wrapper} className="relative h-full w-full bg-ink">
      <Canvas
        camera={{ position: [0, 5.5, 11], fov: 42 }}
        dpr={[1, 1.6]}
        frameloop={paused ? "demand" : "always"}
      >
        <Scene paused={paused} onBook={setBook} />
      </Canvas>

      <Readout book={book} />

      <p className="pointer-events-none absolute bottom-3 right-3 font-mono text-[0.65rem] text-mute">
        drag to orbit · simulated flow
      </p>
    </div>
  );
};

export default OrderBook3D;
