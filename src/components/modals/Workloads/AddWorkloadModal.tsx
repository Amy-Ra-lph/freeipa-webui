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
}

const AddWorkloadModal = (props: PropsToAddModal) => {
  const dispatch = useAppDispatch();

  const [workloadName, setWorkloadName] = React.useState("");
  const [workloadType, setWorkloadType] = React.useState("agent");
  const [owner, setOwner] = React.useState("");
  const [servicePrincipal, setServicePrincipal] = React.useState("");
  const [skills, setSkills] = React.useState("");
  const [cardTtl, setCardTtl] = React.useState("");
  const [description, setDescription] = React.useState("");

  const [addWorkload] = useOauth2WorkloadAddMutation();

  const resetFields = () => {
    setWorkloadName("");
    setWorkloadType("agent");
    setOwner("");
    setServicePrincipal("");
    setSkills("");
    setCardTtl("");
    setDescription("");
  };

  const onSubmit = () => {
    const skillArray = skills
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload: OAuth2WorkloadAddPayload = {
      cn: workloadName,
      oauth2workloadtype: workloadType || "",
      oauth2workloadowner: owner || undefined,
      oauth2workloadserviceprincipal: servicePrincipal || undefined,
      oauth2workloadskill: skillArray.length > 0 ? skillArray : undefined,
      oauth2workloadcardttl: cardTtl ? parseInt(cardTtl, 10) : undefined,
      description: description || undefined,
    };

    addWorkload(payload).then((response) => {
      if ("data" in response) {
        if (response.data?.error) {
          dispatch(
            addAlert({
              name: "add-workload-error",
              title: (response.data.error as Error).message,
              variant: "danger",
            })
          );
        } else {
          dispatch(
            addAlert({
              name: "add-workload-success",
              title: "Workload '" + workloadName + "' added",
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
      id: "workload-name",
      name: "Workload name",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-workload-name"
          id="workload-name"
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
      id: "workload-type",
      name: "Type",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-workload-type"
          id="workload-type"
          name="oauth2workloadtype"
          value={workloadType}
          onChange={(_event, value) => setWorkloadType(value)}
          type="text"
          aria-label="workload type"
        />
      ),
    },
    {
      id: "workload-owner",
      name: "Owner",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-workload-owner"
          id="workload-owner"
          name="oauth2workloadowner"
          value={owner}
          onChange={(_event, value) => setOwner(value)}
          type="text"
          aria-label="workload owner"
        />
      ),
    },
    {
      id: "workload-service-principal",
      name: "Service principal",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-workload-service-principal"
          id="workload-service-principal"
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
      id: "workload-skills",
      name: "Skills (comma-separated)",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-workload-skills"
          id="workload-skills"
          name="oauth2workloadskill"
          value={skills}
          onChange={(_event, value) => setSkills(value)}
          type="text"
          aria-label="workload skills"
          placeholder="e.g. code-review, deploy, monitor"
        />
      ),
    },
    {
      id: "workload-card-ttl",
      name: "Card TTL (seconds)",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-workload-card-ttl"
          id="workload-card-ttl"
          name="oauth2workloadcardttl"
          value={cardTtl}
          onChange={(_event, value) => setCardTtl(value)}
          type="number"
          aria-label="card TTL"
          placeholder="e.g. 3600"
        />
      ),
    },
    {
      id: "workload-description",
      name: "Description",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-workload-desc"
          id="workload-description"
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
      dataCy="add-workload-modal"
      variantType="small"
      modalPosition="top"
      title="Add workload"
      formId="add-workload-form"
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

export default AddWorkloadModal;
