import React from "react";
// PatternFly
import { Button, TextArea } from "@patternfly/react-core";
// Components
import ModalWithFormLayout, {
  Field,
} from "src/components/layouts/ModalWithFormLayout";
import InputRequiredText from "src/components/layouts/InputRequiredText";
// RPC
import { useAddCertAuthorityMutation } from "src/services/rpcCertAuthorities";
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

const AddCertAuthorityModal = (props: PropsToAddModal) => {
  const dispatch = useAppDispatch();

  // API calls
  const [addCertAuthority] = useAddCertAuthorityMutation();

  // States
  const [isAddButtonSpinning, setIsAddButtonSpinning] = React.useState(false);
  const [caName, setCaName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [subjectDN, setSubjectDN] = React.useState("");

  // Clear fields
  const clearFields = () => {
    setCaName("");
    setDescription("");
    setSubjectDN("");
  };

  // 'Add' button handler
  const onAddCertAuthority = () => {
    setIsAddButtonSpinning(true);

    addCertAuthority({
      cn: caName,
      description: description || undefined,
      ipacasubjectdn: subjectDN,
    }).then((response) => {
      if ("data" in response) {
        const data = response.data?.result;
        const error = response.data?.error as SerializedError;

        if (error) {
          dispatch(
            addAlert({
              name: "add-cert-authority-error",
              title: error.message,
              variant: "danger",
            })
          );
        }

        if (data) {
          dispatch(
            addAlert({
              name: "add-cert-authority-success",
              title: "New certificate authority added",
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
      id: "modal-form-cert-authority-name",
      name: "CA name",
      pfComponent: (
        <InputRequiredText
          dataCy="modal-textbox-cert-authority-name"
          id="modal-form-cert-authority-name"
          name="cn"
          value={caName}
          onChange={setCaName}
          requiredHelperText="Required value"
        />
      ),
      fieldRequired: true,
    },
    {
      id: "modal-form-cert-authority-description",
      name: "Description",
      pfComponent: (
        <TextArea
          data-cy="modal-textbox-description"
          id="modal-form-cert-authority-description"
          name="description"
          value={description}
          aria-label="Certificate authority description"
          onChange={(_event, value: string) => setDescription(value)}
          autoResize
        />
      ),
    },
    {
      id: "modal-form-cert-authority-subject-dn",
      name: "Subject DN",
      pfComponent: (
        <InputRequiredText
          dataCy="modal-textbox-subject-dn"
          id="modal-form-cert-authority-subject-dn"
          name="ipacasubjectdn"
          value={subjectDN}
          onChange={setSubjectDN}
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
      isDisabled={isAddButtonSpinning || caName === "" || subjectDN === ""}
      isLoading={isAddButtonSpinning}
      spinnerAriaValueText="Adding"
      spinnerAriaLabel="Adding"
      form="add-modal-form"
      type="submit"
    >
      {isAddButtonSpinning ? "Adding" : "Add"}
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
        dataCy="add-cert-authority-modal"
        variantType={"small"}
        modalPosition={"top"}
        offPosition={"76px"}
        title={props.title}
        formId="add-modal-form"
        fields={fields}
        show={props.isOpen}
        onSubmit={() => onAddCertAuthority()}
        onClose={cleanAndCloseModal}
        actions={modalActions}
      />
    </>
  );
};

export default AddCertAuthorityModal;
