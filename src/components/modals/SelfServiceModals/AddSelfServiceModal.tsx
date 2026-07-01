import React from "react";
// PatternFly
import { Button, TextArea } from "@patternfly/react-core";
// Components
import ModalWithFormLayout, {
  Field,
} from "src/components/layouts/ModalWithFormLayout";
import InputRequiredText from "src/components/layouts/InputRequiredText";
// RPC
import { useAddSelfServiceMutation } from "src/services/rpcSelfService";
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

const AddSelfServiceModal = (props: PropsToAddModal) => {
  const dispatch = useAppDispatch();

  // API calls
  const [addSelfService] = useAddSelfServiceMutation();

  // States
  const [isAddButtonSpinning, setIsAddButtonSpinning] = React.useState(false);
  const [selfServiceName, setSelfServiceName] = React.useState("");
  const [attrs, setAttrs] = React.useState("");

  // Clear fields
  const clearFields = () => {
    setSelfServiceName("");
    setAttrs("");
  };

  // 'Add' button handler
  const onAddSelfService = () => {
    setIsAddButtonSpinning(true);

    // Parse attrs: split by comma, trim whitespace, filter empty
    const attrsList = attrs
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a !== "");

    addSelfService({
      aciname: selfServiceName,
      attrs: attrsList,
    }).then((response) => {
      if ("data" in response) {
        const data = response.data?.result;
        const error = response.data?.error as SerializedError;

        if (error) {
          dispatch(
            addAlert({
              name: "add-self-service-error",
              title: error.message,
              variant: "danger",
            })
          );
        }

        if (data) {
          dispatch(
            addAlert({
              name: "add-self-service-success",
              title: "New self service permission added",
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
      id: "modal-form-self-service-name",
      name: "Self service name",
      pfComponent: (
        <InputRequiredText
          dataCy="modal-textbox-self-service-name"
          id="modal-form-self-service-name"
          name="aciname"
          value={selfServiceName}
          onChange={setSelfServiceName}
          requiredHelperText="Required value"
        />
      ),
      fieldRequired: true,
    },
    {
      id: "modal-form-self-service-attrs",
      name: "Attributes",
      pfComponent: (
        <TextArea
          data-cy="modal-textbox-attrs"
          id="modal-form-self-service-attrs"
          name="attrs"
          value={attrs}
          aria-label="Attributes (comma-separated)"
          onChange={(_event, value: string) => setAttrs(value)}
          autoResize
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
        isAddButtonSpinning || selfServiceName === "" || attrs.trim() === ""
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
        dataCy="add-self-service-modal"
        variantType={"small"}
        modalPosition={"top"}
        offPosition={"76px"}
        title={props.title}
        formId="add-modal-form"
        fields={fields}
        show={props.isOpen}
        onSubmit={() => onAddSelfService()}
        onClose={cleanAndCloseModal}
        actions={modalActions}
      />
    </>
  );
};

export default AddSelfServiceModal;
