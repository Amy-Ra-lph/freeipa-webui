/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
// PatternFly
import {
  Button,
  TextArea,
  TextInput,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
} from "@patternfly/react-core";
// Components
import ModalWithFormLayout, {
  Field,
} from "src/components/layouts/ModalWithFormLayout";
import InputRequiredText from "src/components/layouts/InputRequiredText";
// RPC
import { useAddVaultMutation } from "src/services/rpcVaults";
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

const AddVaultModal = (props: PropsToAddModal) => {
  const dispatch = useAppDispatch();

  // API calls
  const [addVault] = useAddVaultMutation();

  // States
  const [isAddButtonSpinning, setIsAddButtonSpinning] = React.useState(false);
  const [vaultName, setVaultName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [vaultPassword, setVaultPassword] = React.useState("");
  const [vaultPublicKey, setVaultPublicKey] = React.useState("");

  // Vault type select
  const [isTypeOpen, setIsTypeOpen] = React.useState(false);
  const [vaultType, setVaultType] = React.useState<
    "standard" | "symmetric" | "asymmetric"
  >("standard");

  const typeOnToggle = () => {
    setIsTypeOpen(!isTypeOpen);
  };

  const toggleType = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      data-cy="modal-select-vault-type-toggle"
      ref={toggleRef}
      onClick={typeOnToggle}
      className="pf-v6-u-w-100"
      isExpanded={isTypeOpen}
    >
      {vaultType}
    </MenuToggle>
  );

  const typeOnSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    selection: string | number | undefined
  ) => {
    if (selection && typeof selection === "string") {
      setVaultType(selection as "standard" | "symmetric" | "asymmetric");
    }
    setIsTypeOpen(false);
  };

  // Clear fields
  const clearFields = () => {
    setVaultName("");
    setDescription("");
    setVaultType("standard");
    setVaultPassword("");
    setVaultPublicKey("");
  };

  // 'Add' button handler
  const onAddVault = () => {
    setIsAddButtonSpinning(true);

    addVault({
      cn: vaultName,
      description: description || undefined,
      ipavaulttype: vaultType,
      ...(vaultType === "symmetric" && vaultPassword
        ? { password: vaultPassword }
        : {}),
      ...(vaultType === "asymmetric" && vaultPublicKey
        ? { ipavaultpublickey: vaultPublicKey }
        : {}),
    }).then((response) => {
      if ("data" in response) {
        const data = response.data?.result;
        const error = response.data?.error as SerializedError;

        if (error) {
          dispatch(
            addAlert({
              name: "add-vault-error",
              title: error.message,
              variant: "danger",
            })
          );
        }

        if (data) {
          dispatch(
            addAlert({
              name: "add-vault-success",
              title: "New vault added",
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
      id: "modal-form-vault-name",
      name: "Vault name",
      pfComponent: (
        <InputRequiredText
          dataCy="modal-textbox-vault-name"
          id="modal-form-vault-name"
          name="cn"
          value={vaultName}
          onChange={setVaultName}
          requiredHelperText="Required value"
        />
      ),
      fieldRequired: true,
    },
    {
      id: "modal-form-vault-description",
      name: "Description",
      pfComponent: (
        <TextArea
          data-cy="modal-textbox-description"
          id="modal-form-vault-description"
          name="description"
          value={description}
          aria-label="Vault description"
          onChange={(_event, value: string) => setDescription(value)}
          autoResize
        />
      ),
    },
    {
      id: "modal-form-vault-type",
      name: "Vault type",
      pfComponent: (
        <Select
          data-cy="modal-select-vault-type"
          id="modal-form-vault-type-select"
          isOpen={isTypeOpen}
          selected={vaultType}
          onSelect={typeOnSelect}
          onOpenChange={setIsTypeOpen}
          toggle={toggleType}
        >
          <SelectList>
            <SelectOption data-cy="vault-type-standard" value="standard">standard</SelectOption>
            <SelectOption data-cy="vault-type-symmetric" value="symmetric">symmetric</SelectOption>
            <SelectOption data-cy="vault-type-asymmetric" value="asymmetric">asymmetric</SelectOption>
          </SelectList>
        </Select>
      ),
      fieldRequired: true,
    },
  ];

  if (vaultType === "symmetric") {
    fields.push({
      id: "modal-form-vault-password",
      name: "Vault password",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-vault-password"
          type="password"
          id="modal-form-vault-password"
          name="password"
          value={vaultPassword}
          onChange={(_event, value: string) => setVaultPassword(value)}
          aria-label="Vault password"
        />
      ),
      fieldRequired: true,
    });
  }

  if (vaultType === "asymmetric") {
    fields.push({
      id: "modal-form-vault-public-key",
      name: "Public key (PEM)",
      pfComponent: (
        <TextArea
          data-cy="modal-textbox-vault-public-key"
          id="modal-form-vault-public-key"
          name="ipavaultpublickey"
          value={vaultPublicKey}
          onChange={(_event, value: string) => setVaultPublicKey(value)}
          aria-label="Vault public key in PEM format"
          autoResize
          placeholder="-----BEGIN PUBLIC KEY-----"
        />
      ),
      fieldRequired: true,
    });
  }

  // Actions
  const modalActions: JSX.Element[] = [
    <Button
      data-cy="modal-button-add"
      key="add-new"
      isDisabled={
        isAddButtonSpinning ||
        vaultName === "" ||
        (vaultType === "symmetric" && vaultPassword === "") ||
        (vaultType === "asymmetric" && vaultPublicKey === "")
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
        dataCy="add-vault-modal"
        variantType={"small"}
        modalPosition={"top"}
        offPosition={"76px"}
        title={props.title}
        formId="add-modal-form"
        fields={fields}
        show={props.isOpen}
        onSubmit={() => onAddVault()}
        onClose={cleanAndCloseModal}
        actions={modalActions}
      />
    </>
  );
};

export default AddVaultModal;
