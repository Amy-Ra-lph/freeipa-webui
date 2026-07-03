import React from "react";
// PatternFly
import { Button, TextInput } from "@patternfly/react-core";
// Components
import ModalWithFormLayout, {
  Field,
} from "src/components/layouts/ModalWithFormLayout";
// RPC
import {
  OAuth2ClientAddPayload,
  useOauth2ClientAddMutation,
} from "src/services/rpcOAuth2";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";

interface PropsToAddModal {
  isOpen: boolean;
  onCloseModal: () => void;
  onRefresh: () => void;
  title: string;
}

const AddOAuth2ClientModal = (props: PropsToAddModal) => {
  const dispatch = useAppDispatch();

  const [clientName, setClientName] = React.useState("");
  const [clientId, setClientId] = React.useState("");

  const [addClient] = useOauth2ClientAddMutation();

  const resetFields = () => {
    setClientName("");
    setClientId("");
  };

  const onSubmit = () => {
    const payload: OAuth2ClientAddPayload = {
      cn: clientName,
      oauth2clientid: clientId || clientName,
    };

    addClient(payload).then((response) => {
      if ("data" in response) {
        if (response.data?.error) {
          dispatch(
            addAlert({
              name: "add-oauth2client-error",
              title: (response.data.error as Error).message,
              variant: "danger",
            })
          );
        } else {
          dispatch(
            addAlert({
              name: "add-oauth2client-success",
              title: "OAuth2 client '" + clientName + "' added",
              variant: "success",
            })
          );
          resetFields();
          props.onRefresh();
          props.onCloseModal();
        }
      }
    });
  };

  const fields: Field[] = [
    {
      id: "oauth2-client-name",
      name: "Client name",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-client-name"
          id="oauth2-client-name"
          name="cn"
          value={clientName}
          onChange={(_event, value) => setClientName(value)}
          type="text"
          aria-label="client name"
          isRequired
        />
      ),
      fieldRequired: true,
    },
    {
      id: "oauth2-client-id",
      name: "Client ID",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-client-id"
          id="oauth2-client-id"
          name="oauth2clientid"
          value={clientId}
          onChange={(_event, value) => setClientId(value)}
          type="text"
          aria-label="client ID"
        />
      ),
    },
  ];

  const actions = [
    <Button
      data-cy="modal-button-add"
      key="add"
      variant="primary"
      isDisabled={clientName === ""}
      onClick={onSubmit}
    >
      Add
    </Button>,
    <Button
      data-cy="modal-button-cancel"
      key="cancel"
      variant="link"
      onClick={() => {
        resetFields();
        props.onCloseModal();
      }}
    >
      Cancel
    </Button>,
  ];

  return (
    <ModalWithFormLayout
      dataCy="add-oauth2-client-modal"
      variantType="small"
      modalPosition="top"
      title={props.title}
      formId="add-oauth2-client-form"
      fields={fields}
      show={props.isOpen}
      onClose={() => {
        resetFields();
        props.onCloseModal();
      }}
      actions={actions}
    />
  );
};

export default AddOAuth2ClientModal;
