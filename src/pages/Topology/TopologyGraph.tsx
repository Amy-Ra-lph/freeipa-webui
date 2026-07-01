import React from "react";
// PatternFly
import { Flex, FlexItem, Label, PageSection, Tooltip } from "@patternfly/react-core";
import { ExclamationTriangleIcon } from "@patternfly/react-icons";
import {
  EdgeStyle,
  NodeShape,
  NodeModel,
  EdgeModel,
  NodeStatus,
} from "@patternfly/react-topology";
// Components
import TitleLayout from "src/components/layouts/TitleLayout";
import ToolbarLayout, {
  ToolbarItem,
} from "src/components/layouts/ToolbarLayout";
import SecondaryButton from "src/components/layouts/SecondaryButton";
import DataSpinner from "src/components/layouts/DataSpinner";
import TopologyVisualization from "src/components/TopologyVisualization/TopologyVisualization";
// Hooks
import { useTopologyGraph } from "src/hooks/useTopologyGraph";
import useUpdateRoute from "src/hooks/useUpdateRoute";
// Analysis
import {
  computeTopologyAnalysis,
  computeHealthScore,
  classifyTopologyPattern,
  healthScoreVariant,
} from "src/utils/topologyAnalysis";

// Constants
const NODE_SHAPE = NodeShape.ellipse;
const NODE_DIAMETER = 70;

// Main component
const TopologyGraph = () => {
  const { isLoading, refetch, servers, topologySegments } = useTopologyGraph();

  // Update current route data to Redux and highlight the current page in the Nav bar
  const { browserTitle } = useUpdateRoute({ pathname: "topology-graph" });

  // Set the page title to be shown in the browser tab
  React.useEffect(() => {
    document.title = browserTitle;
  }, [browserTitle]);

  // Transform server data to node models
  const nodes: NodeModel[] = React.useMemo(
    () =>
      servers.map((server) => ({
        id: `node-${server.cn}`,
        type: "node",
        label: server.cn,
        status: NodeStatus.info,
        width: NODE_DIAMETER,
        height: NODE_DIAMETER,
        shape: NODE_SHAPE,
        data: { badge: "Server" },
      })),
    [servers]
  );

  // Transform topology segments to edge models
  const edges: EdgeModel[] = React.useMemo(
    () =>
      topologySegments.map((segment) => ({
        id: `edge-${segment.iparepltoposegmentleftnode}-${segment.iparepltoposegmentrightnode}`,
        type: "edge",
        source: `node-${segment.iparepltoposegmentleftnode}`,
        target: `node-${segment.iparepltoposegmentrightnode}`,
        edgeStyle: EdgeStyle.default,
        data: { suffixType: segment.suffixType, segmentCN: segment.cn },
      })),
    [topologySegments]
  );

  // Topology analysis
  const healthScore = React.useMemo(
    () =>
      servers.length > 0
        ? computeHealthScore(servers, topologySegments)
        : null,
    [servers, topologySegments]
  );
  const analysis = React.useMemo(
    () =>
      servers.length > 0
        ? computeTopologyAnalysis(servers, topologySegments)
        : null,
    [servers, topologySegments]
  );
  const pattern = React.useMemo(
    () =>
      servers.length > 0
        ? classifyTopologyPattern(servers, topologySegments)
        : null,
    [servers, topologySegments]
  );

  // Toolbar items
  const toolbarItems: ToolbarItem[] = [
    {
      key: 0,
      element: (
        <SecondaryButton
          dataCy="topology-graph-button-refresh"
          onClickHandler={refetch}
        >
          Refresh
        </SecondaryButton>
      ),
    },
    {
      key: 1,
      element: (
        <SecondaryButton
          dataCy="topology-graph-button-add"
          onClickHandler={() => {}}
        >
          Add
        </SecondaryButton>
      ),
    },
    {
      key: 2,
      element: (
        <SecondaryButton
          dataCy="topology-graph-button-delete"
          onClickHandler={() => {}}
        >
          Delete
        </SecondaryButton>
      ),
    },
    ...(healthScore
      ? [
          {
            key: 3,
            element: (
              <Flex
                spaceItems={{ default: "spaceItemsSm" }}
                alignItems={{ default: "alignItemsCenter" }}
              >
                <FlexItem>
                  <Tooltip
                    content={
                      pattern
                        ? `${pattern.patternLabel}: ${pattern.description}`
                        : "Topology pattern"
                    }
                  >
                    <Label
                      color={
                        healthScoreVariant(healthScore.score) === "success"
                          ? "green"
                          : healthScoreVariant(healthScore.score) === "warning"
                            ? "orange"
                            : "red"
                      }
                      data-cy="topology-health-badge"
                    >
                      {healthScore.score} {healthScore.label}
                    </Label>
                  </Tooltip>
                </FlexItem>
                {analysis && analysis.articulationPoints.size > 0 && (
                  <FlexItem>
                    <Tooltip
                      content={`${analysis.articulationPoints.size} single point(s) of failure`}
                    >
                      <Label color="orange" icon={<ExclamationTriangleIcon />}>
                        {analysis.articulationPoints.size}
                      </Label>
                    </Tooltip>
                  </FlexItem>
                )}
              </Flex>
            ),
          },
        ]
      : []),
  ];

  // Spinner on loading state
  if (isLoading) {
    return <DataSpinner />;
  }

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <TitleLayout
          id="topology-graph-page"
          headingLevel="h1"
          text="Topology Graph"
        />
      </PageSection>
      <PageSection hasBodyWrapper={false} isFilled={true}>
        <ToolbarLayout toolbarItems={toolbarItems} />
        <TopologyVisualization
          nodes={nodes}
          edges={edges}
          articulationPoints={
            analysis
              ? new Set([...analysis.articulationPoints].map((n) => `node-${n}`))
              : undefined
          }
          bridges={analysis?.bridges}
        />
      </PageSection>
    </>
  );
};

export default TopologyGraph;
