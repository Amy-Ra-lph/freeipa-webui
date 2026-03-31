import React from "react";
// PatternFly
import { Button, TextInput } from "@patternfly/react-core";
// Components
import ModalWithFormLayout, {
  Field,
} from "src/components/layouts/ModalWithFormLayout";
// RPC
import {
  OAuth2WorkloadAddPayload,
  useOauth2WorkloadAddMutation,
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

const AddOAuth2WorkloadModal = (props: PropsToAddModal) => {
  const dispatch = useAppDispatch();

  const [workloadName, setWorkloadName] = React.useState("");
  const [workloadType, setWorkloadType] = React.useState("agent");
  const [spiffeId, setSpiffeId] = React.useState("");
  const [owner, setOwner] = React.useState("");
  const [servicePrincipal, setServicePrincipal] = React.useState("");
  const [description, setDescription] = React.useState("");

  const [addWorkload] = useOauth2WorkloadAddMutation();

  const resetFields = () => {
    setWorkloadName("");
    setWorkloadType("agent");
    setSpiffeId("");
    setOwner("");
    setServicePrincipal("");
    setDescription("");
  };

  const onSubmit = () => {
    const payload: OAuth2WorkloadAddPayload = {
      cn: workloadName,
      oauth2workloadtype: workloadType || undefined,
      oauth2spiffeid: spiffeId || undefined,
      oauth2workloadowner: owner || undefined,
      oauth2workloadserviceprincipal: servicePrincipal || undefined,
      description: description || undefined,
    };

    addWorkload(payload).then((response) => {
      if ("data" in response) {
        if (response.data?.error) {
          dispatch(
            addAlert({
              name: "add-oauth2workload-error",
              title: (response.data.error as Error).message,
              variant: "danger",
            })
          );
        } else {
          dispatch(
            addAlert({
              name: "add-oauth2workload-success",
              title: "OAuth2 workload '" + workloadName + "' added",
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
      id: "oauth2-workload-name",
      name: "Workload name",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-workload-name"
          id="oauth2-workload-name"
          name="cn"
          value={workloadName}
          onChange={(_event, value) => setWorkloadName(value)}
          type="text"
          aria-label="workload name"
          isRequired
        />
      ),
      fieldRequired: true,
    },
    {
      id: "oauth2-workload-type",
      name: "Type",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-workload-type"
          id="oauth2-workload-type"
          name="oauth2workloadtype"
          value={workloadType}
          onChange={(_event, value) => setWorkloadType(value)}
          type="text"
          aria-label="workload type"
        />
      ),
    },
    {
      id: "oauth2-workload-spiffeid",
      name: "SPIFFE ID",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-workload-spiffeid"
          id="oauth2-workload-spiffeid"
          name="oauth2spiffeid"
          value={spiffeId}
          onChange={(_event, value) => setSpiffeId(value)}
          type="text"
          aria-label="SPIFFE ID"
        />
      ),
    },
    {
      id: "oauth2-workload-owner",
      name: "Owner",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-workload-owner"
          id="oauth2-workload-owner"
          name="oauth2workloadowner"
          value={owner}
          onChange={(_event, value) => setOwner(value)}
          type="text"
          aria-label="workload owner"
        />
      ),
    },
    {
      id: "oauth2-workload-service-principal",
      name: "Service principal",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-workload-service-principal"
          id="oauth2-workload-service-principal"
          name="oauth2workloadserviceprincipal"
          value={servicePrincipal}
          onChange={(_event, value) => setServicePrincipal(value)}
          type="text"
          aria-label="service principal"
          placeholder="e.g. agent/host.example.com"
        />
      ),
    },
    {
      id: "oauth2-workload-description",
      name: "Description",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-workload-desc"
          id="oauth2-workload-description"
          name="description"
          value={description}
          onChange={(_event, value) => setDescription(value)}
          type="text"
          aria-label="workload description"
        />
      ),
    },
  ];

  const actions = [
    <Button
      data-cy="modal-button-add"
      key="add"
      variant="primary"
      isDisabled={workloadName === ""}
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
      dataCy="add-oauth2-workload-modal"
      variantType="small"
      modalPosition="top"
      title={props.title}
      formId="add-oauth2-workload-form"
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

export default AddOAuth2WorkloadModal;
