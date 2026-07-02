import React, { useState } from "react";
// PatternFly
import { Content, ContentVariants, Button } from "@patternfly/react-core";
// Layouts
import ModalWithFormLayout from "src/components/layouts/ModalWithFormLayout";
// Tables
import DeletedElementsTable from "src/components/tables/DeletedElementsTable";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
// Data types
import { ErrorData, OAuth2Scope } from "src/utils/datatypes/globalDataTypes";
// Modals
import ErrorModal from "src/components/modals/ErrorModal";
import { BatchRPCResponse } from "src/services/rpc";
import { useRemoveScopesMutation } from "src/services/rpcOAuth2";

interface ButtonsData {
  updateIsDeleteButtonDisabled: (value: boolean) => void;
  updateIsDeletion: (value: boolean) => void;
}

interface SelectedScopesData {
  selectedScopes: OAuth2Scope[];
  clearSelectedScopes: () => void;
}

interface PropsToDeleteScopes {
  show: boolean;
  handleModalToggle: () => void;
  selectedScopesData: SelectedScopesData;
  buttonsData: ButtonsData;
  onRefresh?: () => void;
}

const DeleteOAuth2Scopes = (props: PropsToDeleteScopes) => {
  const dispatch = useAppDispatch();

  // Define the column names that will be displayed on the confirmation table.
  const deleteColumnNames = ["cn", "description"];

  const [executeScopesDelCommand] = useRemoveScopesMutation();

  const [spinning, setBtnSpinning] = React.useState<boolean>(false);

  // List of fields
  const fields = [
    {
      id: "question-text",
      pfComponent: (
        <Content component={ContentVariants.p}>
          Are you sure you want to remove the selected scopes?
        </Content>
      ),
    },
    {
      id: "deleted-scopes-table",
      pfComponent: (
        <DeletedElementsTable
          mode="passing_full_data"
          elementsToDelete={props.selectedScopesData.selectedScopes}
          columnNames={deleteColumnNames}
          elementType="OAuth2 scope"
          idAttr="cn"
        />
      ),
    },
  ];

  // Close modal
  const closeModal = () => {
    props.handleModalToggle();
  };

  // Handle API error data
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
  };

  const errorModalActions = [
    <Button
      key="cancel"
      variant="link"
      onClick={onCloseErrorModal}
      data-cy="modal-button-ok"
    >
      OK
    </Button>,
  ];

  const handleAPIError = (error: FetchBaseQueryError | SerializedError) => {
    if ("code" in error) {
      setErrorTitle("IPA error " + error.code + ": " + error.name);
      if (error.message !== undefined) {
        setErrorMessage(error.message);
      }
    } else if ("data" in error) {
      const errorData = error.data as ErrorData;
      const errorCode = errorData.code as string;
      const errorName = errorData.name as string;
      const errorMessage = errorData.error as string;

      setErrorTitle("IPA error " + errorCode + ": " + errorName);
      setErrorMessage(errorMessage);
    }
    setIsModalErrorOpen(true);
  };

  const deleteScopes = () => {
    setBtnSpinning(true);

    // Delete elements
    executeScopesDelCommand(props.selectedScopesData.selectedScopes).then(
      (response) => {
        if ("data" in response) {
          const data = response.data as BatchRPCResponse;
          const result = data.result;

          if (result) {
            if ("error" in result.results[0] && result.results[0].error) {
              const errorData = {
                code: result.results[0].error_code,
                name: result.results[0].error_name,
                error: result.results[0].error,
              } as ErrorData;

              const error = {
                status: "CUSTOM_ERROR",
                data: errorData,
              } as FetchBaseQueryError;

              // Handle error
              handleAPIError(error);
              setBtnSpinning(false);
            } else {
              props.selectedScopesData.clearSelectedScopes();
              props.buttonsData.updateIsDeleteButtonDisabled(true);
              props.buttonsData.updateIsDeletion(true);

              dispatch(
                addAlert({
                  name: "remove-oauth2-scopes-success",
                  title: "OAuth2 scopes removed",
                  variant: "success",
                })
              );

              setBtnSpinning(false);
              closeModal();
              // Refresh data
              if (props.onRefresh !== undefined) {
                props.onRefresh();
              }
            }
          }
        }
      }
    );
  };

  // Set the Modal and Action buttons for 'Delete' option
  const modalActionsDelete: JSX.Element[] = [
    <Button
      key="delete-oauth2-scopes"
      variant="danger"
      onClick={deleteScopes}
      form="delete-oauth2-scopes-modal"
      spinnerAriaValueText="Deleting"
      spinnerAriaLabel="Deleting"
      isLoading={spinning}
      isDisabled={spinning}
      data-cy="modal-button-delete"
    >
      {spinning ? "Deleting" : "Delete"}
    </Button>,
    <Button
      key="cancel-delete-oauth2-scopes"
      variant="link"
      onClick={closeModal}
      data-cy="modal-button-cancel"
    >
      Cancel
    </Button>,
  ];

  const modalDelete: JSX.Element = (
    <>
      <ModalWithFormLayout
        dataCy="delete-oauth2-scopes-modal"
        variantType="medium"
        modalPosition="top"
        offPosition="76px"
        title="Remove OAuth2 scopes"
        formId="remove-oauth2-scopes-modal"
        fields={fields}
        show={props.show}
        onClose={closeModal}
        actions={modalActionsDelete}
      />
      {isModalErrorOpen && (
        <ErrorModal
          dataCy="delete-oauth2-scopes-modal-error"
          title={errorTitle}
          isOpen={isModalErrorOpen}
          onClose={onCloseErrorModal}
          actions={errorModalActions}
          errorMessage={errorMessage}
        />
      )}
    </>
  );

  return modalDelete;
};

export default DeleteOAuth2Scopes;
