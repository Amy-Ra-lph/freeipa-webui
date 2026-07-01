import React from "react";
import {
  ColaLayout,
  ComponentFactory,
  DefaultEdge,
  DefaultGroup,
  DefaultNode,
  Graph,
  GraphComponent,
  graphDropTargetSpec,
  isEdge,
  isNode,
  Layout,
  LayoutFactory,
  ModelKind,
  nodeDragSourceSpec,
  nodeDropTargetSpec,
  SELECTION_EVENT,
  Visualization,
  VisualizationProvider,
  VisualizationSurface,
  withPanZoom,
  withDndDrop,
  withDragNode,
  withTargetDrag,
  Edge,
  GraphElement,
  DragObjectWithType,
  Node as TopologyNode,
  NodeModel,
  EdgeModel,
} from "@patternfly/react-topology";
import {
  ServerIcon,
  ExclamationTriangleIcon,
} from "@patternfly/react-icons";

// Types
interface CustomNodeProps {
  element: GraphElement;
}

interface SuffixEdgeClass {
  ca: string;
  domain: string;
}

// Health overlay context — allows ComponentFactory-created nodes/edges
// to access health props without prop drilling.
interface HealthContextValue {
  articulationPoints: Set<string>;
  bridges: Set<string>;
  simulatingFailure: string | null;
  isolatedInSimulation: Set<string>;
}

const defaultHealthContext: HealthContextValue = {
  articulationPoints: new Set(),
  bridges: new Set(),
  simulatingFailure: null,
  isolatedInSimulation: new Set(),
};

const HealthContext = React.createContext<HealthContextValue>(
  defaultHealthContext
);

interface TopologyVisualizationProps {
  nodes: NodeModel[];
  edges: EdgeModel[];
  articulationPoints?: Set<string>;
  bridges?: Set<string>;
  onNodeSelect?: (nodeId: string | null) => void;
  simulatingFailure?: string | null;
  isolatedInSimulation?: Set<string>;
}

// Constants
const CONNECTOR_TARGET_DROP = "connector-target-drop";

const SUFFIX_EDGE_CLASS: SuffixEdgeClass = {
  ca: "topology-ca-blue-edge",
  domain: "topology-domain-orange-edge",
};

// Layout factory
const createLayoutFactory = (): LayoutFactory => {
  return (type: string, graph: Graph): Layout => {
    switch (type) {
      case "Cola":
        return new ColaLayout(graph);
      default:
        return new ColaLayout(graph, { layoutOnDrag: false });
    }
  };
};

// Health-aware node component — applies CSS classes based on health context.
// Replaces the original CustomStyledNode with conditional styling:
//   - simulated-removed: red + reduced opacity (topology-node-simulated-removed)
//   - isolated in simulation: gray + reduced opacity (topology-node-isolated)
//   - articulation point: orange + warning icon (topology-node-articulation)
//   - normal: green (topology-node-server)
const HealthAwareNode = ({ element }: CustomNodeProps) => {
  if (!isNode(element)) return null;
  const health = React.useContext(HealthContext);
  const nodeId = element.getId();

  let className = "topology-node-server";
  let showWarningIcon = false;

  if (health.simulatingFailure === nodeId) {
    className = "topology-node-simulated-removed";
  } else if (health.isolatedInSimulation.has(nodeId)) {
    className = "topology-node-isolated";
  } else if (health.articulationPoints.has(nodeId)) {
    className = "topology-node-articulation";
    showWarningIcon = true;
  }

  return (
    <DefaultNode element={element} className={className}>
      <g transform={`translate(23, 23)`}>
        <ServerIcon width={25} height={25} />
      </g>
      {showWarningIcon && (
        <g transform={`translate(50, 2)`}>
          <ExclamationTriangleIcon width={14} height={14} />
        </g>
      )}
    </DefaultNode>
  );
};

// Health-aware edge component — overlays health styling on top of suffix coloring.
// Priority order:
//   1. Edge touches simulated-removed node: grayed out (topology-edge-simulated-removed)
//   2. Bridge edge: dashed stroke (topology-bridge-edge)
//   3. Suffix coloring (ca=blue, domain=orange) — original behavior
const HealthAwareEdge = (props: { element: GraphElement }) => {
  if (!isEdge(props.element)) return null;
  const health = React.useContext(HealthContext);
  const edge = props.element as Edge;
  const data = edge.getData();

  // Check if either endpoint is the simulated-removed node
  const sourceId = edge.getSource()?.getId();
  const targetId = edge.getTarget()?.getId();
  const touchesSimulated =
    health.simulatingFailure != null &&
    (sourceId === health.simulatingFailure ||
      targetId === health.simulatingFailure);

  if (touchesSimulated) {
    return (
      <DefaultEdge {...props} className="topology-edge-simulated-removed" />
    );
  }

  // Check if this edge is a bridge — bridges are identified by the segment
  // CN string stored in the edge data.
  const segmentCN = data?.segmentCN as string | undefined;
  const isBridge = segmentCN != null && health.bridges.has(segmentCN);

  // Combine suffix class with bridge class when applicable
  const suffixClassName = SUFFIX_EDGE_CLASS[data?.suffixType] || "";
  const bridgeClassName = isBridge ? "topology-bridge-edge" : "";
  const combinedClassName = [suffixClassName, bridgeClassName]
    .filter(Boolean)
    .join(" ");

  return <DefaultEdge {...props} className={combinedClassName || undefined} />;
};

// Component factory
const createComponentFactory = (): ComponentFactory => {
  return (kind: ModelKind, type: string) => {
    switch (type) {
      case "group":
        return DefaultGroup;
      default:
        switch (kind) {
          case ModelKind.graph:
            return withDndDrop(graphDropTargetSpec())(
              withPanZoom()(GraphComponent)
            );
          case ModelKind.node:
            return withDndDrop(nodeDropTargetSpec())(
              withDragNode(nodeDragSourceSpec("node", true, true))(
                HealthAwareNode
              )
            );
          case ModelKind.edge:
            return withTargetDrag<
              DragObjectWithType,
              Node,
              { dragging?: boolean },
              {
                element: GraphElement;
              }
            >({
              item: { type: CONNECTOR_TARGET_DROP },
              begin: (_monitor, props) => {
                props.element.raise();
                return props.element;
              },
              drag: (event, _monitor, props) => {
                (props.element as Edge).setEndPoint(event.x, event.y);
              },
              end: (dropResult, monitor, props) => {
                if (monitor.didDrop() && dropResult && props) {
                  (props.element as Edge).setTarget(
                    dropResult as unknown as TopologyNode<NodeModel>
                  );
                }
                (props.element as Edge).setEndPoint();
              },
              collect: (monitor) => ({
                dragging: monitor.isDragging(),
              }),
            })(HealthAwareEdge);
          default:
            throw Error(`Unexpected ModelKind ${kind satisfies never}.`);
        }
    }
  };
};

/**
 * Component for rendering PatternFly Topology visualization
 * Encapsulates controller initialization, factories, and event handling.
 *
 * Optional health overlay props enable resilience visualization:
 * articulation points, bridge edges, failure simulation, and isolation.
 * All health props default to empty/null so the component is fully
 * backward compatible with existing callers.
 */
const TopologyVisualization = ({
  nodes,
  edges,
  articulationPoints,
  bridges,
  onNodeSelect,
  simulatingFailure = null,
  isolatedInSimulation,
}: TopologyVisualizationProps) => {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Stable ref for onNodeSelect to avoid re-creating the controller
  // every time the callback identity changes.
  const onNodeSelectRef = React.useRef(onNodeSelect);
  onNodeSelectRef.current = onNodeSelect;

  // Selection handler: updates internal state and calls onNodeSelect
  const handleSelection = React.useCallback((ids: string[]) => {
    setSelectedIds(ids);
    if (onNodeSelectRef.current) {
      // Pass the first selected node ID, or null when deselected
      onNodeSelectRef.current(ids.length > 0 ? ids[0] : null);
    }
  }, []);

  const controller = React.useMemo(() => {
    const newController = new Visualization();
    newController.registerLayoutFactory(createLayoutFactory());
    newController.registerComponentFactory(createComponentFactory());
    newController.addEventListener(SELECTION_EVENT, handleSelection);
    newController.fromModel(
      {
        nodes,
        edges,
        graph: { id: "model-graph", type: "graph", layout: "Cola" },
      },
      false
    );
    return newController;
  }, [nodes, edges, handleSelection]);

  // Build the health context value, memoized to avoid unnecessary re-renders
  // of every node and edge when unrelated props change.
  const healthValue = React.useMemo<HealthContextValue>(
    () => ({
      articulationPoints: articulationPoints ?? new Set(),
      bridges: bridges ?? new Set(),
      simulatingFailure: simulatingFailure ?? null,
      isolatedInSimulation: isolatedInSimulation ?? new Set(),
    }),
    [articulationPoints, bridges, simulatingFailure, isolatedInSimulation]
  );

  return (
    <HealthContext.Provider value={healthValue}>
      <VisualizationProvider controller={controller}>
        <VisualizationSurface state={{ selectedIds }} />
      </VisualizationProvider>
    </HealthContext.Provider>
  );
};

export default TopologyVisualization;
