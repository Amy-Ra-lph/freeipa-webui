import React from "react";
import {
  Card,
  CardBody,
  Flex,
  FlexItem,
  Label,
} from "@patternfly/react-core";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
} from "@patternfly/react-icons";
import {
  HealthScore,
  TopologyPattern,
  TopologyAnalysis,
} from "src/utils/topologyAnalysis";
import { ProposedSegment } from "src/hooks/useTopologyComparison";

interface TopologyDeltaSummaryProps {
  currentHealth: HealthScore;
  proposedHealth: HealthScore;
  currentPattern: TopologyPattern;
  proposedPattern: TopologyPattern;
  currentAnalysis: TopologyAnalysis;
  proposedAnalysis: TopologyAnalysis;
  additions: ProposedSegment[];
  removals: string[];
}

const TopologyDeltaSummary = ({
  currentHealth,
  proposedHealth,
  currentPattern,
  proposedPattern,
  currentAnalysis,
  proposedAnalysis,
  additions,
  removals,
}: TopologyDeltaSummaryProps) => {
  const healthDelta = proposedHealth.score - currentHealth.score;
  const patternChanged = proposedPattern.patternLabel !== currentPattern.patternLabel;

  const currentArtPoints = currentAnalysis.articulationPoints.size;
  const proposedArtPoints = proposedAnalysis.articulationPoints.size;
  const artPointDelta = proposedArtPoints - currentArtPoints;

  const currentBridges = currentAnalysis.bridges.size;
  const proposedBridges = proposedAnalysis.bridges.size;
  const bridgeDelta = proposedBridges - currentBridges;

  const DeltaIcon = ({ delta }: { delta: number }) => {
    if (delta > 0) return <ArrowUpIcon />;
    if (delta < 0) return <ArrowDownIcon />;
    return <MinusIcon />;
  };

  return (
    <Card className="topology-delta-summary" data-cy="topology-delta-summary">
      <CardBody>
        <Flex
          spaceItems={{ default: "spaceItemsLg" }}
          alignItems={{ default: "alignItemsCenter" }}
        >
          <FlexItem>
            <Label
              color={healthDelta > 0 ? "green" : healthDelta < 0 ? "red" : "blue"}
            >
              <DeltaIcon delta={healthDelta} />
              {" "}Health: {healthDelta > 0 ? "+" : ""}
              {healthDelta} ({proposedHealth.score}/100)
            </Label>
          </FlexItem>
          {patternChanged && (
            <FlexItem>
              <Label color="purple">
                Pattern: {currentPattern.patternLabel} → {proposedPattern.patternLabel}
              </Label>
            </FlexItem>
          )}
          <FlexItem>
            <Label color="grey">
              +{additions.length} segment{additions.length !== 1 ? "s" : ""},{" "}
              -{removals.length} segment{removals.length !== 1 ? "s" : ""}
            </Label>
          </FlexItem>
          {artPointDelta !== 0 && (
            <FlexItem>
              <Label color={artPointDelta < 0 ? "green" : "orange"}>
                Articulation points: {artPointDelta > 0 ? "+" : ""}
                {artPointDelta} ({proposedArtPoints})
              </Label>
            </FlexItem>
          )}
          {bridgeDelta !== 0 && (
            <FlexItem>
              <Label color={bridgeDelta < 0 ? "green" : "orange"}>
                Bridges: {bridgeDelta > 0 ? "+" : ""}
                {bridgeDelta} ({proposedBridges})
              </Label>
            </FlexItem>
          )}
        </Flex>
      </CardBody>
    </Card>
  );
};

export default TopologyDeltaSummary;
