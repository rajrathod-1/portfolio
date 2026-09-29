import React from "react";

/**
 * Each project gets a small architecture sketch drawn from its own bullets,
 * in the site's palette. Stock photography would say nothing about the work;
 * these at least show the shape of the system.
 */

const BOX_HEIGHT = 26;

const Box: React.FC<{
  x: number;
  y: number;
  w: number;
  label: string;
  accent?: "line" | "blue" | "violet" | "amber";
  h?: number;
}> = ({ x, y, w, label, accent = "line", h = BOX_HEIGHT }) => (
  <g>
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={5}
      fill="none"
      stroke={`var(--${accent})`}
      strokeWidth={1.25}
    />
    <text
      x={x + w / 2}
      y={y + h / 2 + 3.2}
      textAnchor="middle"
      fontSize={9}
      fontFamily="ui-monospace, monospace"
      fill={accent === "line" ? "var(--mute)" : `var(--${accent})`}
    >
      {label}
    </text>
  </g>
);

/** Straight connector with a small arrow head. */
const Arrow: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dashed?: boolean;
}> = ({ x1, y1, x2, y2, dashed = false }) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 4.5;
  const tip = { x: x2, y: y2 };
  const left = {
    x: x2 - head * Math.cos(angle - 0.45),
    y: y2 - head * Math.sin(angle - 0.45),
  };
  const right = {
    x: x2 - head * Math.cos(angle + 0.45),
    y: y2 - head * Math.sin(angle + 0.45),
  };

  return (
    <g stroke="var(--line)" fill="var(--line)">
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        strokeWidth={1.25}
        strokeDasharray={dashed ? "3 3" : undefined}
      />
      <polygon
        points={`${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`}
        stroke="none"
      />
    </g>
  );
};

const Caption: React.FC<{ x: number; y: number; text: string }> = ({
  x,
  y,
  text,
}) => (
  <text
    x={x}
    y={y}
    fontSize={8}
    fontFamily="ui-monospace, monospace"
    fill="var(--mute)"
    opacity={0.8}
  >
    {text}
  </text>
);

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg
    viewBox="0 0 320 150"
    preserveAspectRatio="xMidYMid meet"
    className="h-full w-full"
    role="img"
  >
    {children}
  </svg>
);

/** RAG service: retrieval and the model behind a tool-use layer. */
const RagDiagram: React.FC = () => (
  <Frame>
    <title>Agent loop calling tools, a vector index and a cache</title>
    <Box x={10} y={62} w={64} label="request" />
    <Arrow x1={76} y1={75} x2={100} y2={75} />
    <Box x={102} y={62} w={78} label="agent loop" accent="violet" />

    <Arrow x1={182} y1={70} x2={212} y2={38} />
    <Box x={214} y={24} w={94} label="tool layer" />

    <Arrow x1={182} y1={75} x2={212} y2={75} />
    <Box x={214} y={62} w={94} label="FAISS index" accent="blue" />

    <Arrow x1={182} y1={82} x2={212} y2={112} />
    <Box x={214} y={100} w={94} label="redis cache" />

    <Caption x={10} y={124} text="multi-step" />
    <Caption x={10} y={136} text="workflows" />
    <Caption x={214} y={140} text="sub-200ms p95" />
  </Frame>
);

/** Source text through parsing, inference and evaluation. */
const InterpreterDiagram: React.FC = () => (
  <Frame>
    <title>Source through parser, type inference and evaluator</title>
    <Box x={10} y={38} w={64} label="source" />
    <Arrow x1={76} y1={51} x2={100} y2={51} />
    <Box x={102} y={38} w={84} label="parser" accent="blue" />
    <Arrow x1={188} y1={51} x2={214} y2={51} />
    <Box x={216} y={38} w={92} label="AST" />

    <Arrow x1={262} y1={66} x2={262} y2={96} />
    <Box x={216} y={98} w={92} label="evaluator" />

    <Arrow x1={144} y1={66} x2={144} y2={96} dashed />
    <Box x={102} y={98} w={84} label="infer types" accent="violet" />

    <Caption x={10} y={106} text="rejected" />
    <Caption x={10} y={118} text="before it runs" />
  </Frame>
);

/** Clients through the proxy to backends, with telemetry on the side. */
const ProxyDiagram: React.FC = () => (
  <Frame>
    <title>Clients through a multithreaded proxy to backend servers</title>
    <Box x={10} y={62} w={62} label="clients" />
    <Arrow x1={74} y1={75} x2={98} y2={75} />
    <Box x={100} y={62} w={74} label="L4 proxy" accent="blue" />

    <Arrow x1={176} y1={70} x2={210} y2={40} />
    <Box x={212} y={26} w={96} label="backend a" />

    <Arrow x1={176} y1={75} x2={210} y2={75} />
    <Box x={212} y={62} w={96} label="backend b" />

    <Arrow x1={137} y1={90} x2={137} y2={112} dashed />
    <Box x={95} y={114} w={84} label="telemetry" accent="amber" h={22} />

    <Caption x={212} y={104} text="round robin" />
    <Caption x={10} y={110} text="epoll," />
    <Caption x={10} y={122} text="thread pool" />
  </Frame>
);

const DIAGRAMS: Record<string, React.FC> = {
  rag: RagDiagram,
  interpreter: InterpreterDiagram,
  proxy: ProxyDiagram,
};

const ProjectDiagram: React.FC<{ id: string; className?: string }> = ({
  id,
  className = "",
}) => {
  const Diagram = DIAGRAMS[id];
  if (!Diagram) return null;

  return (
    <div
      className={`flex items-center justify-center overflow-hidden bg-ink px-4 py-3 ${className}`}
    >
      <Diagram />
    </div>
  );
};

export default ProjectDiagram;
