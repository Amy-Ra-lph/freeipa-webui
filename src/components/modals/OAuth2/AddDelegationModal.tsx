import React from "react";
// PatternFly
import { Button, TextInput } from "@patternfly/react-core";
// Components
import ModalWithFormLayout, {
  Field,
} from "src/components/layouts/ModalWithFormLayout";
// RPC
import {
  OAuth2DelegationAddPayload,
  useOauth2DelegationAddMutation,
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

const AddOAuth2DelegationModal = (props: PropsToAddModal) => {
  const dispatch = useAppDispatch();

  const [ruleName, setRuleName] = React.useState("");
  const [source, setSource] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [scope, setScope] = React.useState("");
  const [hostgroup, setHostgroup] = React.useState("");
  const [service, setService] = React.useState("");
  const [description, setDescription] = React.useState("");

  const [addDelegation] = useOauth2DelegationAddMutation();

  const resetFields = () => {
    setRuleName("");
    setSource("");
    setTarget("");
    setScope("");
    setHostgroup("");
    setService("");
    setDescription("");
  };

  const onSubmit = () => {
    const payload: OAuth2DelegationAddPayload = {
      cn: ruleName,
      oauth2delegatesource: source,
      oauth2delegatetarget: target ? target.split(",").map(s => s.trim()) : undefined,
      oauth2delegatescope: scope ? scope.split(",").map(s => s.trim()) : undefined,
      oauth2delegatehostgroup: hostgroup ? hostgroup.split(",").map(s => s.trim()) : undefined,
      oauth2delegateservice: service ? service.split(",").map(s => s.trim()) : undefined,
      description,
    };

    addDelegation(payload).then((response) => {
      if ("data" in response) {
        if (response.data?.error) {
          dispatch(
            addAlert({
              name: "add-oauth2delegation-error",
              title: (response.data.error as Error).message,
              variant: "danger",
            })
          );
        } else {
          dispatch(
            addAlert({
              name: "add-oauth2delegation-success",
              title: "OAuth2 delegation rule '" + ruleName + "' added",
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
      id: "oauth2-delegation-rule-name",
      name: "Rule name",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-rule-name"
          id="oauth2-delegation-rule-name"
          name="cn"
          value={ruleName}
          onChange={(_event, value) => setRuleName(value)}
          type="text"
          aria-label="rule name"
          isRequired
        />
      ),
      fieldRequired: true,
    },
    {
      id: "oauth2-delegation-source",
      name: "Source workload",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-source"
          id="oauth2-delegation-source"
          name="oauth2delegatesource"
          value={source}
          onChange={(_event, value) => setSource(value)}
          type="text"
          aria-label="source workload"
          isRequired
        />
      ),
      fieldRequired: true,
    },
    {
      id: "oauth2-delegation-target",
      name: "Target user",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-target"
          id="oauth2-delegation-target"
          name="oauth2delegatetarget"
          value={target}
          onChange={(_event, value) => setTarget(value)}
          type="text"
          aria-label="target user"
        />
      ),
    },
    {
      id: "oauth2-delegation-scope",
      name: "Scope",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-scope"
          id="oauth2-delegation-scope"
          name="oauth2delegatescope"
          value={scope}
          onChange={(_event, value) => setScope(value)}
          type="text"
          aria-label="scope"
        />
      ),
    },
    {
      id: "oauth2-delegation-hostgroup",
      name: "Hostgroups (comma-separated)",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-hostgroup"
          id="oauth2-delegation-hostgroup"
          name="oauth2delegatehostgroup"
          value={hostgroup}
          onChange={(_event, value) => setHostgroup(value)}
          type="text"
          aria-label="hostgroups"
          placeholder="e.g. staging-hosts, prod-hosts"
        />
      ),
    },
    {
      id: "oauth2-delegation-service",
      name: "Permitted services (comma-separated)",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-service"
          id="oauth2-delegation-service"
          name="oauth2delegateservice"
          value={service}
          onChange={(_event, value) => setService(value)}
          type="text"
          aria-label="permitted services"
          placeholder="e.g. postgres/db1.example.com, ldap/idm1.example.com"
        />
      ),
    },
    {
      id: "oauth2-delegation-description",
      name: "Description",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-description"
          id="oauth2-delegation-description"
          name="description"
          value={description}
          onChange={(_event, value) => setDescription(value)}
          type="text"
          aria-label="description"
        />
      ),
    },
  ];

  const actions = [
    <Button
      data-cy="modal-button-add"
      key="add"
      variant="primary"
      isDisabled={ruleName === "" || source === ""}
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
      dataCy="add-oauth2-delegation-modal"
      variantType="small"
      modalPosition="top"
      title={props.title}
      formId="add-oauth2-delegation-form"
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

export default AddOAuth2DelegationModal;
