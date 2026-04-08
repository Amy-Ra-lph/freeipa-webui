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
import { useOauth2VendorDeleteMutation } from "src/services/rpcOAuth2";
import { BatchRPCResponse } from "src/services/rpc";
// Data types
import { ErrorData } from "src/utils/datatypes/globalDataTypes";
// Modals
import ErrorModal from "src/components/modals/ErrorModal";

interface OAuth2Vendor {
  cn: string;
  dn: string;
  oauth2vendorcontact: string[];
  oauth2vendorscope: string[];
  oauth2vendornotafter: string[];
  oauth2enabled: string[];
}

interface ButtonsData {
  updateIsDeleteButtonDisabled: (value: boolean) => void;
  updateIsDeletion: (value: boolean) => void;
}

interface SelectedData {
  selectedElements: OAuth2Vendor[];
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

const DeleteOAuth2VendorModal = (props: PropsToDelete) => {
  const dispatch = useAppDispatch();

  const [deleteVendors] = useOauth2VendorDeleteMutation();

  const [spinning, setBtnSpinning] = React.useState(false);

  const fields = [
    {
      id: "question-text",
      pfComponent: (
        <Content component={ContentVariants.p}>
          Are you sure you want to delete the selected trusted vendor(s)?
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
          elementType="Trusted vendor"
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

  const deleteOAuth2Vendors = () => {
    setBtnSpinning(true);

    const elementsToDelete = props.selectedData.selectedElements.map(
      (element) => element.cn.toString()
    );

    deleteVendors(elementsToDelete).then((response) => {
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
                name: "remove-oauth2vendors-success",
                title: "Trusted vendors removed",
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
      key="delete-oauth2vendors"
      variant="danger"
      onClick={deleteOAuth2Vendors}
      form="delete-oauth2vendors-modal"
      spinnerAriaValueText="Deleting"
      spinnerAriaLabel="Deleting"
      isLoading={spinning}
      isDisabled={spinning}
    >
      {spinning ? "Deleting" : "Delete"}
    </Button>,
    <Button
      data-cy="modal-button-cancel"
      key="cancel-delete-oauth2vendors"
      variant="link"
      onClick={props.onClose}
    >
      Cancel
    </Button>,
  ];

  return (
    <>
      <ModalWithFormLayout
        dataCy="delete-oauth2vendors-modal"
        variantType="medium"
        modalPosition="top"
        offPosition="76px"
        title="Remove trusted vendors"
        formId="remove-oauth2vendors-modal"
        fields={fields}
        show={props.show}
        onClose={props.onClose}
        actions={modalActionsDelete}
      />
      {isModalErrorOpen && (
        <ErrorModal
          dataCy="delete-oauth2vendors-modal-error"
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

export default DeleteOAuth2VendorModal;
