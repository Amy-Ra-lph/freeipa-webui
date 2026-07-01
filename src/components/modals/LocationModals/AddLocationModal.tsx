import React from "react";
// PatternFly
import { Button, TextArea } from "@patternfly/react-core";
// Components
import ModalWithFormLayout, {
  Field,
} from "src/components/layouts/ModalWithFormLayout";
import InputRequiredText from "src/components/layouts/InputRequiredText";
// RPC
import { useAddLocationMutation } from "src/services/rpcLocations";
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

const AddLocationModal = (props: PropsToAddModal) => {
  const dispatch = useAppDispatch();

  // API calls
  const [addLocation] = useAddLocationMutation();

  // States
  const [isAddButtonSpinning, setIsAddButtonSpinning] = React.useState(false);
  const [locationName, setLocationName] = React.useState("");
  const [description, setDescription] = React.useState("");

  // Clear fields
  const clearFields = () => {
    setLocationName("");
    setDescription("");
  };

  // 'Add' button handler
  const onAddLocation = () => {
    setIsAddButtonSpinning(true);

    addLocation({
      idnsname: locationName,
      description: description || undefined,
    }).then((response) => {
      if ("data" in response) {
        const data = response.data?.result;
        const error = response.data?.error as SerializedError;

        if (error) {
          dispatch(
            addAlert({
              name: "add-location-error",
              title: error.message,
              variant: "danger",
            })
          );
        }

        if (data) {
          dispatch(
            addAlert({
              name: "add-location-success",
              title: "New location added",
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
      id: "modal-form-location-name",
      name: "Location name",
      pfComponent: (
        <InputRequiredText
          dataCy="modal-textbox-location-name"
          id="modal-form-location-name"
          name="idnsname"
          value={locationName}
          onChange={setLocationName}
          requiredHelperText="Required value"
        />
      ),
      fieldRequired: true,
    },
    {
      id: "modal-form-location-description",
      name: "Description",
      pfComponent: (
        <TextArea
          data-cy="modal-textbox-description"
          id="modal-form-location-description"
          name="description"
          value={description}
          aria-label="Location description"
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
      isDisabled={isAddButtonSpinning || locationName === ""}
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
        dataCy="add-location-modal"
        variantType={"small"}
        modalPosition={"top"}
        offPosition={"76px"}
        title={props.title}
        formId="add-modal-form"
        fields={fields}
        show={props.isOpen}
        onSubmit={() => onAddLocation()}
        onClose={cleanAndCloseModal}
        actions={modalActions}
      />
    </>
  );
};

export default AddLocationModal;
