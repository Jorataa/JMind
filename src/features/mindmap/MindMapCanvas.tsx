"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
  type Connection,
  type Edge,
  type EdgeChange,
  type EdgeTypes,
  type Node,
  type NodeChange,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";

const ROOT_NODE_ID = "root";
const STORAGE_KEY = "jmind:mindmap:root";

type SavedMindMap = {
  nodes: Node[];
  edges: Edge[];
  nodeCount: number;
};

const rootNodeStyle: CSSProperties = {
  background: "#34d399",
  color: "#09090b",
  border: "none",
  borderRadius: "12px",
  padding: "10px 20px",
  fontWeight: 700,
  fontSize: "14px",
  fontFamily: "Arial, Helvetica, sans-serif",
  boxShadow: "0 14px 32px rgba(52,211,153,0.18)",
  cursor: "default",
};

const ideaNodeStyle: CSSProperties = {
  background: "#18181b",
  color: "#e4e4e7",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "10px",
  padding: "8px 16px",
  fontWeight: 500,
  fontSize: "13px",
  fontFamily: "Arial, Helvetica, sans-serif",
  boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
  cursor: "default",
};

const initialNodes: Node[] = [
  {
    id: ROOT_NODE_ID,
    data: { label: "JMind OS" },
    position: { x: 0, y: 0 },
    style: rootNodeStyle,
  },
];

const initialEdges: Edge[] = [];
const nodeTypes: NodeTypes = {};
const edgeTypes: EdgeTypes = {};

let nextNodeId = 1;

function getNodeId(): string {
  const id = `node-${nextNodeId}`;
  nextNodeId += 1;
  return id;
}

function getNextNodeId(nodes: Node[]): number {
  return nodes.reduce((highestId, node) => {
    const match = /^node-(\d+)$/.exec(node.id);
    if (!match) {
      return highestId;
    }

    return Math.max(highestId, Number(match[1]) + 1);
  }, 1);
}

function getNewNodePosition(nodeCount: number): { x: number; y: number } {
  const angle = (nodeCount * 137.5 * Math.PI) / 180;
  const radius = 160 + nodeCount * 20;

  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

export default function MindMapCanvas() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [nodeCount, setNodeCount] = useState<number>(0);
  const [hasLoadedSavedMap, setHasLoadedSavedMap] = useState<boolean>(false);

  useEffect(() => {
    const loadSavedMap = window.setTimeout(() => {
      try {
        const savedMap = window.localStorage.getItem(STORAGE_KEY);

        if (savedMap) {
          const parsedMap = JSON.parse(savedMap) as Partial<SavedMindMap>;

          if (Array.isArray(parsedMap.nodes) && Array.isArray(parsedMap.edges)) {
            setNodes(parsedMap.nodes);
            setEdges(parsedMap.edges);
            setNodeCount(
              typeof parsedMap.nodeCount === "number"
                ? parsedMap.nodeCount
                : Math.max(parsedMap.nodes.length - 1, 0)
            );
            nextNodeId = getNextNodeId(parsedMap.nodes);
          }
        }
      } catch (error) {
        console.warn("Could not load saved mind map.", error);
      } finally {
        setHasLoadedSavedMap(true);
      }
    }, 0);

    return () => window.clearTimeout(loadSavedMap);
  }, []);

  useEffect(() => {
    if (!hasLoadedSavedMap) {
      return;
    }

    const mapToSave: SavedMindMap = {
      nodes,
      edges,
      nodeCount,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mapToSave));
  }, [edges, hasLoadedSavedMap, nodeCount, nodes]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((currentNodes) => applyNodeChanges(changes, currentNodes));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges));
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((currentEdges) =>
      addEdge(
        {
          ...connection,
          animated: false,
          style: { stroke: "rgba(212,212,216,0.5)", strokeWidth: 1.5 },
        },
        currentEdges
      )
    );
  }, []);

  const addNode = useCallback(() => {
    const id = getNodeId();
    const position = getNewNodePosition(nodeCount);

    const newNode: Node = {
      id,
      data: { label: `Idea ${nodeCount + 1}` },
      position,
      style: ideaNodeStyle,
    };

    const newEdge: Edge = {
      id: `edge-${ROOT_NODE_ID}-${id}`,
      source: ROOT_NODE_ID,
      target: id,
      style: {
        stroke: "rgba(212,212,216,0.5)",
        strokeWidth: 1.5,
      },
    };

    setNodes((currentNodes) => [...currentNodes, newNode]);
    setEdges((currentEdges) => [...currentEdges, newEdge]);
    setNodeCount((currentCount) => currentCount + 1);
  }, [nodeCount]);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 border-b border-white/10 bg-zinc-950/70 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-sky-300" />
          <span className="text-[13px] font-medium text-zinc-200">
            JMind - Root Map
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-zinc-500">
            {nodes.length} node{nodes.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={addNode}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-[12px] font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/[0.08] active:bg-white/10"
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 11 11"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                x1="5.5"
                y1="1"
                x2="5.5"
                y2="10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="1"
                y1="5.5"
                x2="10"
                y2="5.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Add Node
          </button>
        </div>
      </div>

      <div className="h-[360px] bg-zinc-950 sm:h-[420px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.4 }}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={0.3}
          maxZoom={2}
          attributionPosition="bottom-right"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="rgba(212,212,216,0.18)"
          />
          <Controls
            style={{
              background: "#18181b",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              boxShadow: "0 10px 24px rgba(0,0,0,0.2)",
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
