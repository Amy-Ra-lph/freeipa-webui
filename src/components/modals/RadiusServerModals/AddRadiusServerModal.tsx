import React from "react";
// PatternFly
import { Button } from "@patternfly/react-core";
// Components
import ModalWithFormLayout, {
  Field,
} from "src/components/layouts/ModalWithFormLayout";
import InputRequiredText from "src/components/layouts/InputRequiredText";
// RPC
import { useAddRadiusServerMutation } from "src/services/rpcRadiusServers";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
// Errors
import { SerializedError } from "@reduxjs/toolkit";

interface PropsToAddModal {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onRefresh: () => void;
}

const AddRadiusServerModal = (props: PropsToAddModal) => {
  const dispatch = useAppDispatch();

  // API calls
  const [addRadiusServer] = useAddRadiusServerMutation();

  // States
  const [isAddButtonSpinning, setIsAddButtonSpinning] = React.useState(false);
  const [serverName, setServerName] = React.useState("");
  const [server, setServer] = React.useState("");
  const [secret, setSecret] = React.useState("");

  // Clear fields
  const clearFields = () => {
    setServerName("");
    setServer("");
    setSecret("");
  };

  // 'Add' button handler
  const onAddRadiusServer = () => {
    setIsAddButtonSpinning(true);

    addRadiusServer({
      cn: serverName,
      ipatokenradiusserver: server,
      ipatokenradiussecret: secret,
    }).then((response) => {
      if ("data" in response) {
        const data = response.data?.result;
        const error = response.data?.error as SerializedError;

        if (error) {
          dispatch(
            addAlert({
              name: "add-radius-server-error",
              title: error.message,
              variant: "danger",
            })
          );
        }

        if (data) {
          dispatch(
            addAlert({
              name: "add-radius-server-success",
              title: "New RADIUS server added",
              variant: "success",
            })
          );
          // Reset fields
          clearFields();
          // Update data
          props.onRefresh();
          props.onClose();
        }
      }
      // Reset button spinner
      setIsAddButtonSpinning(false);
    });
  };

  // Clean and close modal
  const cleanAndCloseModal = () => {
    clearFields();
    props.onClose();
  };

  const fields: Field[] = [
    {
      id: "modal-form-radius-server-name",
      name: "RADIUS proxy server",
      pfComponent: (
        <InputRequiredText
          dataCy="modal-textbox-radius-server-name"
          id="modal-form-radius-server-name"
          name="cn"
          value={serverName}
          onChange={setServerName}
          requiredHelperText="Required value"
        />
      ),
      fieldRequired: true,
    },
    {
      id: "modal-form-radius-server-server",
      name: "Server",
      pfComponent: (
        <InputRequiredText
          dataCy="modal-textbox-radius-server-server"
          id="modal-form-radius-server-server"
          name="ipatokenradiusserver"
          value={server}
          onChange={setServer}
          requiredHelperText="Required value"
        />
      ),
      fieldRequired: true,
    },
    {
      id: "modal-form-radius-server-secret",
      name: "Secret",
      pfComponent: (
        <InputRequiredText
          dataCy="modal-textbox-radius-server-secret"
          id="modal-form-radius-server-secret"
          name="ipatokenradiussecret"
          value={secret}
          onChange={setSecret}
          requiredHelperText="Required value"
        />
      ),
      fieldRequired: true,
    },
  ];

  // Actions
  const modalActions: JSX.Element[] = [
    <Button
      data-cy="modal-button-add"
      key="add-new"
      isDisabled={
        isAddButtonSpinning ||
        serverName === "" ||
        server === "" ||
        secret === ""
      }
      form="add-modal-form"
      type="submit"
    >
      Add
    </Button>,
    <Button
      data-cy="modal-button-cancel"
      key="cancel-new"
      variant="link"
      onClick={cleanAndCloseModal}
    >
      Cancel
    </Button>,
  ];

  return (
    <>
      <ModalWithFormLayout
        dataCy="add-radius-server-modal"
        variantType={"small"}
        modalPosition={"top"}
        offPosition={"76px"}
        title={props.title}
        formId="add-modal-form"
        fields={fields}
        show={props.isOpen}
        onSubmit={() => onAddRadiusServer()}
        onClose={cleanAndCloseModal}
        actions={modalActions}
      />
    </>
  );
};

export default AddRadiusServerModal;
