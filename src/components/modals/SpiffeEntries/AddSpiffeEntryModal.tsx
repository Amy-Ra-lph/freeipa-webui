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

const AddSpiffeEntryModal = (props: PropsToAddModal) => {
  const dispatch = useAppDispatch();

  const [entryName, setEntryName] = React.useState("");
  const [spiffeId, setSpiffeId] = React.useState("");
  const [workloadType, setWorkloadType] = React.useState("agent");
  const [owner, setOwner] = React.useState("");
  const [servicePrincipal, setServicePrincipal] = React.useState("");
  const [skills, setSkills] = React.useState("");
  const [cardTtl, setCardTtl] = React.useState("");
  const [description, setDescription] = React.useState("");

  const [addWorkload] = useOauth2WorkloadAddMutation();

  const resetFields = () => {
    setEntryName("");
    setSpiffeId("");
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
      cn: entryName,
      oauth2workloadtype: workloadType || "",
      oauth2spiffeid: spiffeId,
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
              name: "add-spiffe-entry-error",
              title: (response.data.error as Error).message,
              variant: "danger",
            })
          );
        } else {
          dispatch(
            addAlert({
              name: "add-spiffe-entry-success",
              title: "SPIFFE entry '" + entryName + "' added",
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
      id: "spiffe-entry-name",
      name: "Entry name",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-spiffe-entry-name"
          id="spiffe-entry-name"
          name="cn"
          value={entryName}
          onChange={(_event, value) => setEntryName(value)}
          type="text"
          aria-label="entry name"
          isRequired
        />
      ),
      fieldRequired: true,
    },
    {
      id: "spiffe-entry-spiffeid",
      name: "SPIFFE ID",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-spiffe-entry-spiffeid"
          id="spiffe-entry-spiffeid"
          name="oauth2spiffeid"
          value={spiffeId}
          onChange={(_event, value) => setSpiffeId(value)}
          type="text"
          aria-label="SPIFFE ID"
          isRequired
          placeholder="spiffe://example.com/workload"
        />
      ),
      fieldRequired: true,
    },
    {
      id: "spiffe-entry-type",
      name: "Type",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-spiffe-entry-type"
          id="spiffe-entry-type"
          name="oauth2workloadtype"
          value={workloadType}
          onChange={(_event, value) => setWorkloadType(value)}
          type="text"
          aria-label="workload type"
        />
      ),
    },
    {
      id: "spiffe-entry-owner",
      name: "Owner",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-spiffe-entry-owner"
          id="spiffe-entry-owner"
          name="oauth2workloadowner"
          value={owner}
          onChange={(_event, value) => setOwner(value)}
          type="text"
          aria-label="entry owner"
        />
      ),
    },
    {
      id: "spiffe-entry-service-principal",
      name: "Service principal",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-spiffe-entry-service-principal"
          id="spiffe-entry-service-principal"
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
      id: "spiffe-entry-skills",
      name: "Skills (comma-separated)",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-spiffe-entry-skills"
          id="spiffe-entry-skills"
          name="oauth2workloadskill"
          value={skills}
          onChange={(_event, value) => setSkills(value)}
          type="text"
          aria-label="entry skills"
          placeholder="e.g. code-review, deploy, monitor"
        />
      ),
    },
    {
      id: "spiffe-entry-card-ttl",
      name: "Card TTL (seconds)",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-spiffe-entry-card-ttl"
          id="spiffe-entry-card-ttl"
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
      id: "spiffe-entry-description",
      name: "Description",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-spiffe-entry-desc"
          id="spiffe-entry-description"
          name="description"
          value={description}
          onChange={(_event, value) => setDescription(value)}
          type="text"
          aria-label="entry description"
        />
      ),
    },
  ];

  const actions = [
    <Button
      data-cy="modal-button-add"
      key="add"
      variant="primary"
      isDisabled={entryName === "" || spiffeId === ""}
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
      dataCy="add-spiffe-entry-modal"
      variantType="small"
      modalPosition="top"
      title="Add SPIFFE entry"
      formId="add-spiffe-entry-form"
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

export default AddSpiffeEntryModal;
