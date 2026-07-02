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
import { useAddClientMutation } from "src/services/rpcOAuth2";

interface PropsToAddClient {
  show: boolean;
  handleModalToggle: () => void;
  onOpenAddModal?: () => void;
  onCloseAddModal?: () => void;
  onRefresh?: () => void;
}

const AddOAuth2Client = (props: PropsToAddClient) => {
  const dispatch = useAppDispatch();
  const [executeClientAddCommand] = useAddClientMutation();

  const [addSpinning, setAddBtnSpinning] = React.useState<boolean>(false);
  const [clientName, setClientName] = React.useState("");
  const [description, setDescription] = React.useState("");

  // Add button is disabled until the user fills the required fields
  const [buttonDisabled, setButtonDisabled] = useState(true);

  useEffect(() => {
    if (clientName === "") {
      setButtonDisabled(true);
    } else {
      setButtonDisabled(false);
    }
  }, [clientName]);

  // List of fields
  const fields = [
    {
      id: "modal-form-client-name",
      name: "Client name",
      pfComponent: (
        <InputRequiredText
          dataCy="modal-textbox-client-name"
          id="modal-form-client-name"
          name="modal-form-client-name"
          value={clientName}
          onChange={setClientName}
          requiredHelperText="Required value"
        />
      ),
      fieldRequired: true,
    },
    {
      id: "modal-form-client-desc",
      name: "Description",
      pfComponent: (
        <TextArea
          id="modal-form-client-desc"
          name="modal-form-client-desc"
          value={description}
          onChange={(_event, value) => setDescription(value)}
          data-cy="modal-textbox-description"
          aria-label="Client description"
          autoResize
        />
      ),
    },
  ];

  // Helper method to clean the fields
  const cleanAllFields = () => {
    setClientName("");
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

  // Add client data
  const addClientData = async () => {
    // Add client via API call
    await executeClientAddCommand([clientName, description]).then(
      (client) => {
        if ("data" in client) {
          const data = client.data as BatchRPCResponse;
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
                name: "add-oauth2-client-success",
                title: "New OAuth2 client added",
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

  const addClientHandler = () => {
    setAddBtnSpinning(true);
    addClientData().then(() => {
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

    addClientHandler();
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
      key="add-new-client"
      name="add"
      isDisabled={buttonDisabled || addSpinning}
      type="submit"
      form="add-oauth2-client-modal"
      spinnerAriaValueText="Adding"
      spinnerAriaLabel="Adding"
      isLoading={addSpinning}
    >
      {addSpinning ? "Adding" : "Add"}
    </Button>,
    <Button
      data-cy="modal-button-cancel"
      key="cancel-new-client"
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
        dataCy="add-oauth2-client-modal"
        variantType="small"
        modalPosition="top"
        offPosition="76px"
        title="Add OAuth2 client"
        formId="add-oauth2-client-modal"
        fields={fields}
        show={props.show}
        onSubmit={addClientHandler}
        onClose={cleanAndCloseModal}
        actions={modalActions}
      />
      {isModalErrorOpen && (
        <ErrorModal
          dataCy="add-oauth2-client-modal-error"
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

export default AddOAuth2Client;
