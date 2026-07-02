import React, { useEffect, useState } from "react";
// PatternFly
import { Button, TextArea } from "@patternfly/react-core";
// Layouts
import SecondaryButton from "src/components/layouts/SecondaryButton";
import ModalWithFormLayout from "src/components/layouts/ModalWithFormLayout";
import InputRequiredText from "src/components/layouts/InputRequiredText";
// Modals
import ErrorModal from "src/components/modals/ErrorModal";
// Errors
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import { BatchRPCResponse } from "src/services/rpc";
import { useAddScopeMutation } from "src/services/rpcOAuth2";

interface PropsToAddScope {
  show: boolean;
  handleModalToggle: () => void;
  onOpenAddModal?: () => void;
  onCloseAddModal?: () => void;
  onRefresh?: () => void;
}

const AddOAuth2Scope = (props: PropsToAddScope) => {
  const dispatch = useAppDispatch();
  const [executeScopeAddCommand] = useAddScopeMutation();

  const [addSpinning, setAddBtnSpinning] = React.useState<boolean>(false);
  const [scopeName, setScopeName] = React.useState("");
  const [description, setDescription] = React.useState("");

  // Add button is disabled until the user fills the required fields
  const [buttonDisabled, setButtonDisabled] = useState(true);

  useEffect(() => {
    if (scopeName === "") {
      setButtonDisabled(true);
    } else {
      setButtonDisabled(false);
    }
  }, [scopeName]);

  // List of fields
  const fields = [
    {
      id: "modal-form-scope-name",
      name: "Scope name",
      pfComponent: (
        <InputRequiredText
          dataCy="modal-textbox-scope-name"
          id="modal-form-scope-name"
          name="modal-form-scope-name"
          value={scopeName}
          onChange={setScopeName}
          requiredHelperText="Required value"
        />
      ),
      fieldRequired: true,
    },
    {
      id: "modal-form-scope-desc",
      name: "Description",
      pfComponent: (
        <TextArea
          id="modal-form-scope-desc"
          name="modal-form-scope-desc"
          value={description}
          onChange={(_event, value) => setDescription(value)}
          data-cy="modal-textbox-description"
          aria-label="Scope description"
          autoResize
        />
      ),
    },
  ];

  // Helper method to clean the fields
  const cleanAllFields = () => {
    setScopeName("");
    setDescription("");
    setAddBtnSpinning(false);
  };

  // Clean fields and close modal (To prevent data persistence when reopen modal)
  const cleanAndCloseModal = () => {
    cleanAllFields();
    props.handleModalToggle();
  };

  // Define status flags to determine user added successfully or error
  let isAdditionSuccess = true;

  // Add scope data
  const addScopeData = async () => {
    // Add scope via API call
    await executeScopeAddCommand([scopeName, description]).then(
      (scope) => {
        if ("data" in scope) {
          const data = scope.data as BatchRPCResponse;
          const error = data.error as FetchBaseQueryError | SerializedError;

          if (error) {
            // Set status flag: error
            isAdditionSuccess = false;
            // Handle error
            handleAPIError(error);
          } else {
            // Set alert: success
            dispatch(
              addAlert({
                name: "add-oauth2-scope-success",
                title: "New OAuth2 scope added",
                variant: "success",
              })
            );

            // Set status flag: success
            isAdditionSuccess = true;
            // Refresh data
            if (props.onRefresh !== undefined) {
              props.onRefresh();
            }
          }
        }
      }
    );
  };

  const addScopeHandler = () => {
    setAddBtnSpinning(true);
    addScopeData().then(() => {
      if (!isAdditionSuccess) {
        // Close the modal without cleaning fields
        if (props.onCloseAddModal !== undefined) {
          props.onCloseAddModal();
        }
        setAddBtnSpinning(false);
      } else {
        // Clean data and close modal
        cleanAndCloseModal();
      }
    });
  };

  // Error handling
  const [isModalErrorOpen, setIsModalErrorOpen] = useState(false);
  const [errorTitle, setErrorTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const closeAndCleanErrorParameters = () => {
    setIsModalErrorOpen(false);
    setErrorTitle("");
    setErrorMessage("");
  };

  const onCloseErrorModal = () => {
    closeAndCleanErrorParameters();
    // Show Add modal
    if (props.onOpenAddModal !== undefined) {
      props.onOpenAddModal();
    }
  };

  const onRetry = () => {
    // Keep the add modal closed until the operation is done...
    if (props.onCloseAddModal !== undefined) {
      props.onCloseAddModal();
    }

    // Close the error modal
    closeAndCleanErrorParameters();

    addScopeHandler();
  };

  const errorModalActions = [
    <SecondaryButton
      key="retry"
      onClickHandler={onRetry}
      dataCy="modal-button-retry"
    >
      Retry
    </SecondaryButton>,
    <Button
      key="cancel"
      variant="link"
      onClick={onCloseErrorModal}
      data-cy="modal-button-cancel"
    >
      Cancel
    </Button>,
  ];

  const handleAPIError = (error: FetchBaseQueryError | SerializedError) => {
    if ("code" in error) {
      setErrorTitle("IPA error " + error.code + ": " + error.name);
      if (error.message !== undefined) {
        setErrorMessage(error.message);
      }
    }
    setIsModalErrorOpen(true);
  };

  // Buttons that will be shown at the end of the form
  const modalActions = [
    <Button
      data-cy="modal-button-add"
      key="add-new-scope"
      name="add"
      isDisabled={buttonDisabled || addSpinning}
      type="submit"
      form="add-oauth2-scope-modal"
      spinnerAriaValueText="Adding"
      spinnerAriaLabel="Adding"
      isLoading={addSpinning}
    >
      {addSpinning ? "Adding" : "Add"}
    </Button>,
    <Button
      data-cy="modal-button-cancel"
      key="cancel-new-scope"
      variant="link"
      onClick={cleanAndCloseModal}
    >
      Cancel
    </Button>,
  ];

  // Render component
  return (
    <>
      <ModalWithFormLayout
        dataCy="add-oauth2-scope-modal"
        variantType="small"
        modalPosition="top"
        offPosition="76px"
        title="Add OAuth2 scope"
        formId="add-oauth2-scope-modal"
        fields={fields}
        show={props.show}
        onSubmit={addScopeHandler}
        onClose={cleanAndCloseModal}
        actions={modalActions}
      />
      {isModalErrorOpen && (
        <ErrorModal
          dataCy="add-oauth2-scope-modal-error"
          title={errorTitle}
          isOpen={isModalErrorOpen}
          onClose={onCloseErrorModal}
          actions={errorModalActions}
          errorMessage={errorMessage}
        />
      )}
    </>
  );
};

export default AddOAuth2Scope;
