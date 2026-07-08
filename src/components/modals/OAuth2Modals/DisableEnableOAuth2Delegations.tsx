import React from "react";
// PatternFly
import { Button } from "@patternfly/react-core";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
// RPC
import {
  useDisableDelegationsMutation,
  useEnableDelegationsMutation,
} from "src/services/rpcOAuth2";
// Components
import ConfirmationModal from "../ConfirmationModal";
// Utils
import capitalizeFirstLetter from "src/utils/utils";
// Data types
import { OAuth2Delegation } from "src/utils/datatypes/globalDataTypes";

interface DisableEnableOAuth2DelegationsProps {
  isOpen: boolean;
  onClose: () => void;
  elementsList: string[];
  setElementsList: (elementsList: OAuth2Delegation[]) => void;
  operation: "enable" | "disable";
  onRefresh: () => void;
}

const DisableEnableOAuth2Delegations = (
  props: DisableEnableOAuth2DelegationsProps
) => {
  const dispatch = useAppDispatch();

  const [disableDelegation] = useDisableDelegationsMutation();
  const [enableDelegation] = useEnableDelegationsMutation();

  const onEnableDisable = () => {
    const operation =
      props.operation === "enable" ? enableDelegation : disableDelegation;

    operation(props.elementsList).then((response) => {
      if ("data" in response) {
        const { data } = response;
        if (data?.error) {
          dispatch(
            addAlert({ name: "error", title: data.error, variant: "danger" })
          );
        }
        if (data?.result) {
          dispatch(
            addAlert({
              name: "success",
              title: "Delegation status changed",
              variant: "success",
            })
          );
          props.setElementsList([]);
          props.onRefresh();
          onClose();
        }
      }
    });
  };

  const onClose = () => {
    props.setElementsList([]);
    props.onClose();
  };

  const onCloseWithoutClearingElements = () => {
    props.onClose();
  };

  const modalActions: JSX.Element[] = [
    <Button
      data-cy="modal-button-ok"
      key={props.operation + "-oauth2-delegations"}
      variant="primary"
      onClick={onEnableDisable}
    >
      OK
    </Button>,
    <Button
      data-cy="modal-button-cancel"
      key={"cancel-" + props.operation + "-oauth2-delegations"}
      variant="secondary"
      onClick={onCloseWithoutClearingElements}
    >
      Cancel
    </Button>,
  ];

  return (
    <ConfirmationModal
      dataCy="oauth2-delegations-enable-disable-modal"
      title={capitalizeFirstLetter(props.operation) + " confirmation"}
      isOpen={props.isOpen}
      onClose={onClose}
      actions={modalActions}
      messageText={
        "Are you sure you want to " +
        props.operation +
        " the following delegation(s)?"
      }
      messageObj={props.elementsList.join(", ")}
    />
  );
};

export default DisableEnableOAuth2Delegations;
