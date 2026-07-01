import React from "react";
// PatternFly
import { Button, TextArea } from "@patternfly/react-core";
// Components
import ModalWithFormLayout, {
  Field,
} from "src/components/layouts/ModalWithFormLayout";
import InputRequiredText from "src/components/layouts/InputRequiredText";
// RPC
import { useAddCACLMutation } from "src/services/rpcCACLs";
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

const AddCACLModal = (props: PropsToAddModal) => {
  const dispatch = useAppDispatch();

  // API calls
  const [addCACL] = useAddCACLMutation();

  // States
  const [isAddButtonSpinning, setIsAddButtonSpinning] = React.useState(false);
  const [caclName, setCaclName] = React.useState("");
  const [description, setDescription] = React.useState("");

  // Clear fields
  const clearFields = () => {
    setCaclName("");
    setDescription("");
  };

  // 'Add' button handler
  const onAddCACL = () => {
    setIsAddButtonSpinning(true);

    addCACL({
      cn: caclName,
      description: description || undefined,
    }).then((response) => {
      if ("data" in response) {
        const data = response.data?.result;
        const error = response.data?.error as SerializedError;

        if (error) {
          dispatch(
            addAlert({
              name: "add-cacl-error",
              title: error.message,
              variant: "danger",
            })
          );
        }

        if (data) {
          dispatch(
            addAlert({
              name: "add-cacl-success",
              title: "New CA ACL added",
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
      id: "modal-form-cacl-name",
      name: "ACL name",
      pfComponent: (
        <InputRequiredText
          dataCy="modal-textbox-cacl-name"
          id="modal-form-cacl-name"
          name="cn"
          value={caclName}
          onChange={setCaclName}
          requiredHelperText="Required value"
        />
      ),
      fieldRequired: true,
    },
    {
      id: "modal-form-cacl-description",
      name: "Description",
      pfComponent: (
        <TextArea
          data-cy="modal-textbox-description"
          id="modal-form-cacl-description"
          name="description"
          value={description}
          aria-label="CA ACL description"
          onChange={(_event, value: string) => setDescription(value)}
          autoResize
        />
      ),
    },
  ];

  // Actions
  const modalActions: JSX.Element[] = [
    <Button
      data-cy="modal-button-add"
      key="add-new"
      isDisabled={isAddButtonSpinning || caclName === ""}
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
        dataCy="add-cacl-modal"
        variantType={"small"}
        modalPosition={"top"}
        offPosition={"76px"}
        title={props.title}
        formId="add-modal-form"
        fields={fields}
        show={props.isOpen}
        onSubmit={() => onAddCACL()}
        onClose={cleanAndCloseModal}
        actions={modalActions}
      />
    </>
  );
};

export default AddCACLModal;
