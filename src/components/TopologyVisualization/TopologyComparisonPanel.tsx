import React from "react";
import {
  Card,
  CardBody,
  CardTitle,
  Flex,
  FlexItem,
  Label,
  Progress,
} from "@patternfly/react-core";
import { NodeModel, EdgeModel } from "@patternfly/react-topology";
import TopologyVisualization from "./TopologyVisualization";
import {
  HealthScore,
  TopologyPattern,
  TopologyAnalysis,
  healthScoreVariant,
} from "src/utils/topologyAnalysis";

interface TopologyComparisonPanelProps {
  label: string;
  nodes: NodeModel[];
  edges: EdgeModel[];
  healthScore: HealthScore;
  pattern: TopologyPattern;
  analysis: TopologyAnalysis;
}

const progressVariant = (
  pts: number,
  max: number
): "success" | "warning" | "danger" | undefined => {
  const pct = max > 0 ? (pts / max) * 100 : 0;
  if (pct >= 80) return "success";
  if (pct >= 50) return "warning";
  return "danger";
};

const TopologyComparisonPanel = ({
  label,
  nodes,
  edges,
  healthScore,
  pattern,
  analysis,
}: TopologyComparisonPanelProps) => {
  const articulationPointCount = analysis.articulationPoints.size;
  const bridgeCount = analysis.bridges.size;

  return (
    <div className="topology-comparison-panel">
      <Card>
        <CardTitle>{label}</CardTitle>
        <CardBody>
          <Flex
            spaceItems={{ default: "spaceItemsMd" }}
            alignItems={{ default: "alignItemsCenter" }}
          >
            <FlexItem>
              <Label
                color={
                  healthScoreVariant(healthScore.score) === "success"
                    ? "green"
                    : healthScoreVariant(healthScore.score) === "warning"
                      ? "orange"
                      : "red"
                }
              >
                Health: {healthScore.score}/100 ({healthScore.label})
              </Label>
            </FlexItem>
            <FlexItem>
              <Label color="blue">{pattern.patternLabel}</Label>
            </FlexItem>
            {articulationPointCount > 0 && (
              <FlexItem>
                <Label color="orange">
                  {articulationPointCount} articulation point
                  {articulationPointCount !== 1 ? "s" : ""}
                </Label>
              </FlexItem>
            )}
            {bridgeCount > 0 && (
              <FlexItem>
                <Label color="orange">
                  {bridgeCount} bridge
                  {bridgeCount !== 1 ? "s" : ""}
                </Label>
              </FlexItem>
            )}
          </Flex>
          <Flex
            direction={{ default: "column" }}
            spaceItems={{ default: "spaceItemsSm" }}
            style={{ marginTop: "12px" }}
          >
            {healthScore.breakdown.map((comp) => (
              <FlexItem key={comp.key}>
                <Progress
                  value={
                    comp.max > 0
                      ? Math.round((comp.pts / comp.max) * 100)
                      : 0
                  }
                  title={`${comp.name} (${comp.pts}/${comp.max})`}
                  label={`${comp.pts}/${comp.max}`}
                  variant={progressVariant(comp.pts, comp.max)}
                />
              </FlexItem>
            ))}
          </Flex>
        </CardBody>
      </Card>
      <div className="topology-comparison-panel__graph">
        <TopologyVisualization
          nodes={nodes}
          edges={edges}
          articulationPoints={
            new Set(
              [...analysis.articulationPoints].map((n) => `node-${n}`)
            )
          }
          bridges={analysis.bridges}
        />
      </div>
    </div>
  );
};

export default TopologyComparisonPanel;
