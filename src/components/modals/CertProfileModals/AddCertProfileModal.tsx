import React from "react";
// PatternFly
import { Button, Checkbox, TextArea } from "@patternfly/react-core";
// Components
import ModalWithFormLayout, {
  Field,
} from "src/components/layouts/ModalWithFormLayout";
import InputRequiredText from "src/components/layouts/InputRequiredText";
// RPC
import { useAddCertProfileMutation } from "src/services/rpcCertProfiles";
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

const AddCertProfileModal = (props: PropsToAddModal) => {
  const dispatch = useAppDispatch();

  // API calls
  const [addCertProfile] = useAddCertProfileMutation();

  // States
  const [isAddButtonSpinning, setIsAddButtonSpinning] = React.useState(false);
  const [profileName, setProfileName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [storeIssued, setStoreIssued] = React.useState(false);

  // Clear fields
  const clearFields = () => {
    setProfileName("");
    setDescription("");
    setStoreIssued(false);
  };

  // 'Add' button handler
  const onAddCertProfile = () => {
    setIsAddButtonSpinning(true);

    addCertProfile({
      cn: profileName,
      description: description || undefined,
      ipacertprofilestoreissued: storeIssued,
    }).then((response) => {
      if ("data" in response) {
        const data = response.data?.result;
        const error = response.data?.error as SerializedError;

        if (error) {
          dispatch(
            addAlert({
              name: "add-certprofile-error",
              title: error.message,
              variant: "danger",
            })
          );
        }

        if (data) {
          dispatch(
            addAlert({
              name: "add-certprofile-success",
              title: "New certificate profile added",
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
      id: "modal-form-certprofile-name",
      name: "Profile name",
      pfComponent: (
        <InputRequiredText
          dataCy="modal-textbox-certprofile-name"
          id="modal-form-certprofile-name"
          name="cn"
          value={profileName}
          onChange={setProfileName}
          requiredHelperText="Required value"
        />
      ),
      fieldRequired: true,
    },
    {
      id: "modal-form-certprofile-description",
      name: "Description",
      pfComponent: (
        <TextArea
          data-cy="modal-textbox-description"
          id="modal-form-certprofile-description"
          name="description"
          value={description}
          aria-label="Certificate profile description"
          onChange={(_event, value: string) => setDescription(value)}
          autoResize
        />
      ),
    },
    {
      id: "modal-form-certprofile-storeissued",
      name: "Store issued certificates",
      pfComponent: (
        <Checkbox
          data-cy="modal-checkbox-storeissued"
          id="modal-form-certprofile-storeissued"
          name="ipacertprofilestoreissued"
          label="Store issued certificates"
          aria-label="Store issued certificates"
          isChecked={storeIssued}
          onChange={(_event, checked: boolean) => setStoreIssued(checked)}
        />
      ),
    },
  ];

  // Actions
  const modalActions: JSX.Element[] = [
    <Button
      data-cy="modal-button-add"
      key="add-new"
      isDisabled={isAddButtonSpinning || profileName === ""}
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
        dataCy="add-certprofile-modal"
        variantType={"small"}
        modalPosition={"top"}
        offPosition={"76px"}
        title={props.title}
        formId="add-modal-form"
        fields={fields}
        show={props.isOpen}
        onSubmit={() => onAddCertProfile()}
        onClose={cleanAndCloseModal}
        actions={modalActions}
      />
    </>
  );
};

export default AddCertProfileModal;
