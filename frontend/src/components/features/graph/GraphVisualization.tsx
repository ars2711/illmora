"use client";

import React, { useCallback } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";

interface KnowledgeGraphProps {
  initialNodes: Node[];
  initialEdges: Edge[];
}

export function KnowledgeGraph({
  initialNodes,
  initialEdges,
}: KnowledgeGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="w-full h-[600px] border border-gray-200 rounded-lg shadow-sm bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        connectionMode={ConnectionMode.Loose}
        attributionPosition="bottom-right"
      >
        <Background gap={12} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
