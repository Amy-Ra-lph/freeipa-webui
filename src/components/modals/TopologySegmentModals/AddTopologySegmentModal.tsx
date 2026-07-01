import React from "react";
// PatternFly
import { Button } from "@patternfly/react-core";
// Layouts
import ModalWithFormLayout, {
  Field,
} from "src/components/layouts/ModalWithFormLayout";
import InputRequiredText from "src/components/layouts/InputRequiredText";
// RPC
import { useAddTopologySegmentMutation } from "src/services/rpcTopologySegments";
// Redux
import { useAppDispatch } from "src/store/hooks";
import { addAlert } from "src/store/Global/alerts-slice";
// Errors
import { SerializedError } from "@reduxjs/toolkit";

interface PropsToAddModal {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onRefresh: () => void;
  suffixCn: string;
}

const AddTopologySegmentModal = (props: PropsToAddModal) => {
  const dispatch = useAppDispatch();

  // API
  const [addSegment] = useAddTopologySegmentMutation();

  // States
  const [isAddButtonSpinning, setIsAddButtonSpinning] = React.useState(false);
  const [segmentName, setSegmentName] = React.useState("");
  const [leftNode, setLeftNode] = React.useState("");
  const [rightNode, setRightNode] = React.useState("");

  // Reset fields
  const cleanAndCloseModal = () => {
    setSegmentName("");
    setLeftNode("");
    setRightNode("");
    props.onClose();
  };

  // Add segment handler
  const onAddSegment = () => {
    setIsAddButtonSpinning(true);

    addSegment({
      suffixCn: props.suffixCn,
      cn: segmentName,
      iparepltoposegmentleftnode: leftNode,
      iparepltoposegmentrightnode: rightNode,
    }).then((response) => {
      if ("data" in response) {
        if (response.data?.result) {
          dispatch(
            addAlert({
              name: "add-topology-segment-success",
              title: "New topology segment added",
              variant: "success",
            })
          );
          // Clean and close
          cleanAndCloseModal();
          props.onRefresh();
        } else if (response.data?.error) {
          dispatch(
            addAlert({
              name: "add-topology-segment-error",
              title:
                (response.data.error as SerializedError).message ||
                "Error when adding topology segment",
              variant: "danger",
            })
          );
        }
      }
      setIsAddButtonSpinning(false);
    });
  };

  // Fields
  const fields: Field[] = [
    {
      id: "topology-segment-name",
      name: "Segment name",
      pfComponent: (
        <InputRequiredText
          dataCy="add-topology-segment-name"
          id="add-topology-segment-name"
          name="segment-name"
          value={segmentName}
          onChange={(value: string) => setSegmentName(value)}
        />
      ),
    },
    {
      id: "topology-segment-left-node",
      name: "Left node",
      pfComponent: (
        <InputRequiredText
          dataCy="add-topology-segment-left-node"
          id="add-topology-segment-left-node"
          name="left-node"
          value={leftNode}
          onChange={(value: string) => setLeftNode(value)}
        />
      ),
    },
    {
      id: "topology-segment-right-node",
      name: "Right node",
      pfComponent: (
        <InputRequiredText
          dataCy="add-topology-segment-right-node"
          id="add-topology-segment-right-node"
          name="right-node"
          value={rightNode}
          onChange={(value: string) => setRightNode(value)}
        />
      ),
    },
  ];

  // Actions
  const actions = [
    <Button
      data-cy="modal-button-add"
      key="add-topology-segment"
      variant="primary"
      onClick={onAddSegment}
      isDisabled={
        isAddButtonSpinning ||
        segmentName.length === 0 ||
        leftNode.length === 0 ||
        rightNode.length === 0
      }
      isLoading={isAddButtonSpinning}
      spinnerAriaValueText="Adding"
      spinnerAriaLabel="Adding"
    >
      {isAddButtonSpinning ? "Adding" : "Add"}
    </Button>,
    <Button
      data-cy="modal-button-cancel"
      key="cancel"
      variant="link"
      onClick={cleanAndCloseModal}
    >
      Cancel
    </Button>,
  ];

  return (
    <ModalWithFormLayout
      dataCy="add-topology-segment-modal"
      variantType="small"
      modalPosition="top"
      offPosition="76px"
      title={props.title}
      formId="add-topology-segment-modal"
      fields={fields}
      show={props.isOpen}
      onClose={cleanAndCloseModal}
      actions={actions}
    />
  );
};

export default AddTopologySegmentModal;
