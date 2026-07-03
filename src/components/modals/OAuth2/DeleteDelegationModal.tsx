import React from "react";
// PatternFly
import { Content, ContentVariants, Button } from "@patternfly/react-core";
// Components
import ModalWithFormLayout from "src/components/layouts/ModalWithFormLayout";
import DeletedElementsTable from "src/components/tables/DeletedElementsTable";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
// RPC
import { useOauth2DelegationDeleteMutation } from "src/services/rpcOAuth2";
import { BatchRPCResponse } from "src/services/rpc";
// Data types
import { ErrorData } from "src/utils/datatypes/globalDataTypes";
// Modals
import ErrorModal from "src/components/modals/ErrorModal";

interface OAuth2Delegation {
  cn: string;
  dn: string;
  oauth2delegatesource: string[];
  oauth2delegatetarget: string[];
  oauth2delegatescope: string[];
  oauth2enabled: string[];
}

interface ButtonsData {
  updateIsDeleteButtonDisabled: (value: boolean) => void;
  updateIsDeletion: (value: boolean) => void;
}

interface SelectedData {
  selectedElements: OAuth2Delegation[];
  clearSelectedElements: () => void;
}

interface PropsToDelete {
  show: boolean;
  onClose: () => void;
  selectedData: SelectedData;
  buttonsData: ButtonsData;
  columnNames: string[];
  keyNames: string[];
  onRefresh: () => void;
}

const DeleteOAuth2DelegationModal = (props: PropsToDelete) => {
  const dispatch = useAppDispatch();

  const [deleteDelegations] = useOauth2DelegationDeleteMutation();

  const [spinning, setBtnSpinning] = React.useState(false);

  const fields = [
    {
      id: "question-text",
      pfComponent: (
        <Content component={ContentVariants.p}>
          Are you sure you want to delete the selected delegation rule(s)?
        </Content>
      ),
    },
    {
      id: "deleted-elements-table",
      pfComponent: (
        <DeletedElementsTable
          mode="passing_full_data"
          elementsToDelete={props.selectedData.selectedElements}
          columnNames={props.columnNames}
          columnIds={props.keyNames}
          elementType="OAuth2 delegation rule"
          idAttr="cn"
        />
      ),
    },
  ];

  const [isModalErrorOpen, setIsModalErrorOpen] = React.useState(false);
  const [errorTitle, setErrorTitle] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");

  const closeAndCleanErrorParameters = () => {
    setIsModalErrorOpen(false);
    setErrorTitle("");
    setErrorMessage("");
  };

  const handleAPIError = (error: FetchBaseQueryError | SerializedError) => {
    if ("code" in error) {
      setErrorTitle("IPA error " + error.code + ": " + error.name);
      if (error.message !== undefined) {
        setErrorMessage(error.message);
      }
    } else if ("data" in error) {
      const errorData = error.data as ErrorData;
      setErrorTitle("IPA error " + errorData.code + ": " + errorData.name);
      setErrorMessage(errorData.error);
    }
    setIsModalErrorOpen(true);
  };

  const deleteOAuth2Delegations = () => {
    setBtnSpinning(true);

    const elementsToDelete = props.selectedData.selectedElements.map(
      (element) => element.cn.toString()
    );

    deleteDelegations(elementsToDelete).then((response) => {
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

            handleAPIError(error);
            setBtnSpinning(false);
          } else {
            props.selectedData.clearSelectedElements();
            props.buttonsData.updateIsDeleteButtonDisabled(true);
            props.buttonsData.updateIsDeletion(true);

            dispatch(
              addAlert({
                name: "remove-oauth2delegations-success",
                title: "OAuth2 delegation rules removed",
                variant: "success",
              })
            );

            setBtnSpinning(false);
            props.onClose();
            props.onRefresh();
          }
        }
      }
    });
  };

  const modalActionsDelete: JSX.Element[] = [
    <Button
      data-cy="modal-button-delete"
      key="delete-oauth2delegations"
      variant="danger"
      onClick={deleteOAuth2Delegations}
      form="delete-oauth2delegations-modal"
      spinnerAriaValueText="Deleting"
      spinnerAriaLabel="Deleting"
      isLoading={spinning}
      isDisabled={spinning}
    >
      {spinning ? "Deleting" : "Delete"}
    </Button>,
    <Button
      data-cy="modal-button-cancel"
      key="cancel-delete-oauth2delegations"
      variant="link"
      onClick={props.onClose}
    >
      Cancel
    </Button>,
  ];

  return (
    <>
      <ModalWithFormLayout
        dataCy="delete-oauth2delegations-modal"
        variantType="medium"
        modalPosition="top"
        offPosition="76px"
        title="Remove OAuth2 delegation rules"
        formId="remove-oauth2delegations-modal"
        fields={fields}
        show={props.show}
        onClose={props.onClose}
        actions={modalActionsDelete}
      />
      {isModalErrorOpen && (
        <ErrorModal
          dataCy="delete-oauth2delegations-modal-error"
          title={errorTitle}
          isOpen={isModalErrorOpen}
          onClose={closeAndCleanErrorParameters}
          actions={[
            <Button
              data-cy="modal-button-ok"
              key="cancel"
              variant="link"
              onClick={closeAndCleanErrorParameters}
            >
              OK
            </Button>,
          ]}
          errorMessage={errorMessage}
        />
      )}
    </>
  );
};

export default DeleteOAuth2DelegationModal;
