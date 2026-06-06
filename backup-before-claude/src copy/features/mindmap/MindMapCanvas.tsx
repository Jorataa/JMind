"use client";

import { useState } from "react";
import ReactFlow from "reactflow";
import "reactflow/dist/style.css";

const initialNodes = [
  {
    id: "1",
    position: { x: 250, y: 100 },
    data: { label: "NJMind" },
  },
];

const initialEdges: any[] = [];

export default function MindMapCanvas() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const addNode = () => {
    const nodeId = String(nodes.length + 1);

    const newNode = {
      id: nodeId,

      position: {
        x: Math.random() * 500,
        y: 250 + Math.random() * 200,
      },

      data: {
        label: `Idea ${nodes.length}`,
      },
    };

    const newEdge = {
      id: `e1-${nodeId}`,
      source: "1",
      target: nodeId,
    };

    setNodes([...nodes, newNode]);
    setEdges([...edges, newEdge]);
  };

  return (
    <div>
      <button
        onClick={addNode}
        className="mb-4 rounded-lg bg-black px-4 py-2 text-white"
      >
        + Add Node
      </button>

      <div className="h-[600px] w-full rounded-2xl border bg-white">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
        />
      </div>
    </div>
  );
}