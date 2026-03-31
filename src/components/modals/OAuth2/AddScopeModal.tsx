import React from "react";
// PatternFly
import { Button, TextInput } from "@patternfly/react-core";
// Components
import ModalWithFormLayout, {
  Field,
} from "src/components/layouts/ModalWithFormLayout";
// RPC
import {
  OAuth2ScopeAddPayload,
  useOauth2ScopeAddMutation,
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

const AddOAuth2ScopeModal = (props: PropsToAddModal) => {
  const dispatch = useAppDispatch();

  const [scopeName, setScopeName] = React.useState("");
  const [scopeValue, setScopeValue] = React.useState("");
  const [scopeDesc, setScopeDesc] = React.useState("");

  const [addScope] = useOauth2ScopeAddMutation();

  const resetFields = () => {
    setScopeName("");
    setScopeValue("");
    setScopeDesc("");
  };

  const onSubmit = () => {
    const payload: OAuth2ScopeAddPayload = {
      cn: scopeName,
      oauth2scope: scopeValue || scopeName,
      oauth2scopedescription: scopeDesc || undefined,
    };

    addScope(payload).then((response) => {
      if ("data" in response) {
        if (response.data?.error) {
          dispatch(
            addAlert({
              name: "add-oauth2scope-error",
              title: (response.data.error as Error).message,
              variant: "danger",
            })
          );
        } else {
          dispatch(
            addAlert({
              name: "add-oauth2scope-success",
              title: "OAuth2 scope '" + scopeName + "' added",
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
      id: "oauth2-scope-name",
      name: "Scope name",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-scope-name"
          id="oauth2-scope-name"
          name="cn"
          value={scopeName}
          onChange={(_event, value) => setScopeName(value)}
          type="text"
          aria-label="scope name"
          isRequired
        />
      ),
      fieldRequired: true,
    },
    {
      id: "oauth2-scope-value",
      name: "Scope value",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-scope-value"
          id="oauth2-scope-value"
          name="oauth2scope"
          value={scopeValue}
          onChange={(_event, value) => setScopeValue(value)}
          type="text"
          aria-label="scope value"
        />
      ),
    },
    {
      id: "oauth2-scope-description",
      name: "Description",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-scope-desc"
          id="oauth2-scope-description"
          name="oauth2scopedescription"
          value={scopeDesc}
          onChange={(_event, value) => setScopeDesc(value)}
          type="text"
          aria-label="scope description"
        />
      ),
    },
  ];

  const actions = [
    <Button
      data-cy="modal-button-add"
      key="add"
      variant="primary"
      isDisabled={scopeName === ""}
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
      dataCy="add-oauth2-scope-modal"
      variantType="small"
      modalPosition="top"
      title={props.title}
      formId="add-oauth2-scope-form"
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

export default AddOAuth2ScopeModal;
