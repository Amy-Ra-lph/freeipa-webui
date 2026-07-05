import React, { useState } from "react";
import {
  Button,
  Flex,
  FlexItem,
  FormGroup,
  Label,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
} from "@patternfly/react-core";
import {
  PlusCircleIcon,
  TimesIcon,
  UndoIcon,
} from "@patternfly/react-icons";
import { IpaServer, TopologySegment } from "src/utils/datatypes/globalDataTypes";
import { ProposedSegment } from "src/hooks/useTopologyComparison";

interface ProposedSegmentControlsProps {
  servers: IpaServer[];
  currentSegments: TopologySegment[];
  additions: ProposedSegment[];
  removals: string[];
  onAddSegment: (segment: ProposedSegment) => void;
  onRemoveSegment: (cn: string) => void;
  onUndoAdd: (index: number) => void;
  onUndoRemoval: (cn: string) => void;
}

const ProposedSegmentControls = ({
  servers,
  currentSegments,
  additions,
  removals,
  onAddSegment,
  onRemoveSegment,
  onUndoAdd,
  onUndoRemoval,
}: ProposedSegmentControlsProps) => {
  const [leftNode, setLeftNode] = useState("");
  const [rightNode, setRightNode] = useState("");
  const [isLeftOpen, setIsLeftOpen] = useState(false);
  const [isRightOpen, setIsRightOpen] = useState(false);

  const canAdd = leftNode !== "" && rightNode !== "" && leftNode !== rightNode;

  const handleAdd = () => {
    if (!canAdd) return;
    onAddSegment({
      leftNode,
      rightNode,
      direction: "both",
    });
    setLeftNode("");
    setRightNode("");
  };

  const activeSegments = currentSegments.filter(
    (seg) => !removals.includes(seg.cn)
  );

  const leftToggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => setIsLeftOpen(!isLeftOpen)}
      isExpanded={isLeftOpen}
      data-cy="proposed-left-node-toggle"
    >
      {leftNode || "Left node..."}
    </MenuToggle>
  );

  const rightToggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => setIsRightOpen(!isRightOpen)}
      isExpanded={isRightOpen}
      data-cy="proposed-right-node-toggle"
    >
      {rightNode || "Right node..."}
    </MenuToggle>
  );

  return (
    <div className="proposed-segment-controls" data-cy="proposed-segment-controls">
      {/* Add segment form */}
      <FormGroup label="Add segment" fieldId="proposed-add-segment">
        <Flex
          spaceItems={{ default: "spaceItemsSm" }}
          alignItems={{ default: "alignItemsFlexEnd" }}
        >
          <FlexItem>
            <Select
              aria-label="Left node"
              data-cy="proposed-left-node-select"
              toggle={leftToggle}
              onSelect={(_e, val) => {
                setLeftNode(val as string);
                setIsLeftOpen(false);
              }}
              selected={leftNode}
              isOpen={isLeftOpen}
              onOpenChange={setIsLeftOpen}
            >
              <SelectList>
                {servers.map((srv) => (
                  <SelectOption key={srv.cn} value={srv.cn} data-cy={`proposed-left-${srv.cn}`}>
                    {srv.cn}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </FlexItem>
          <FlexItem>
            <Select
              aria-label="Right node"
              data-cy="proposed-right-node-select"
              toggle={rightToggle}
              onSelect={(_e, val) => {
                setRightNode(val as string);
                setIsRightOpen(false);
              }}
              selected={rightNode}
              isOpen={isRightOpen}
              onOpenChange={setIsRightOpen}
            >
              <SelectList>
                {servers.map((srv) => (
                  <SelectOption key={srv.cn} value={srv.cn} data-cy={`proposed-right-${srv.cn}`}>
                    {srv.cn}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </FlexItem>
          <FlexItem>
            <Button
              variant="primary"
              icon={<PlusCircleIcon />}
              isDisabled={!canAdd}
              onClick={handleAdd}
              data-cy="proposed-add-button"
            >
              Add
            </Button>
          </FlexItem>
        </Flex>
      </FormGroup>

      {/* Pending additions */}
      {additions.length > 0 && (
        <FormGroup label="Pending additions" fieldId="pending-additions">
          <ul className="proposed-segment-controls__pending-list">
            {additions.map((a, i) => (
              <li key={i} className="proposed-segment-controls__pending-item">
                <Label color="green">
                  + {a.leftNode} ↔ {a.rightNode}
                </Label>
                <Button
                  variant="plain"
                  icon={<UndoIcon />}
                  onClick={() => onUndoAdd(i)}
                  aria-label={`Undo add ${a.leftNode} to ${a.rightNode}`}
                  data-cy={`proposed-undo-add-${i}`}
                />
              </li>
            ))}
          </ul>
        </FormGroup>
      )}

      {/* Existing segments (removable) */}
      <FormGroup label="Current segments" fieldId="current-segments-removable">
        <ul className="proposed-segment-controls__removals-list">
          {activeSegments.map((seg) => (
            <li key={seg.cn} className="proposed-segment-controls__removal-item">
              <Label>{seg.iparepltoposegmentleftnode} ↔ {seg.iparepltoposegmentrightnode}</Label>
              <Button
                variant="plain"
                icon={<TimesIcon />}
                onClick={() => onRemoveSegment(seg.cn)}
                aria-label={`Remove segment ${seg.cn}`}
                data-cy={`proposed-remove-${seg.cn}`}
              />
            </li>
          ))}
        </ul>
      </FormGroup>

      {/* Pending removals with undo */}
      {removals.length > 0 && (
        <FormGroup label="Pending removals" fieldId="pending-removals">
          <ul className="proposed-segment-controls__removals-list">
            {removals.map((cn) => {
              const seg = currentSegments.find((s) => s.cn === cn);
              return (
                <li key={cn} className="proposed-segment-controls__removal-item">
                  <Label color="red">
                    - {seg ? `${seg.iparepltoposegmentleftnode} ↔ ${seg.iparepltoposegmentrightnode}` : cn}
                  </Label>
                  <Button
                    variant="plain"
                    icon={<UndoIcon />}
                    onClick={() => onUndoRemoval(cn)}
                    aria-label={`Undo remove ${cn}`}
                    data-cy={`proposed-undo-remove-${cn}`}
                  />
                </li>
              );
            })}
          </ul>
        </FormGroup>
      )}
    </div>
  );
};

export default ProposedSegmentControls;
