import React from "react";
// PatternFly
import { Content, ContentVariants, Button } from "@patternfly/react-core";
// Layouts
import ModalWithFormLayout from "src/components/layouts/ModalWithFormLayout";
import DeletedElementsTable from "src/components/tables/DeletedElementsTable";
// Redux
import { addAlert } from "src/store/Global/alerts-slice";
import { useAppDispatch } from "src/store/hooks";
// Errors
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
import { ErrorData, TopologySegment } from "src/utils/datatypes/globalDataTypes";
import ErrorModal from "src/components/modals/ErrorModal";
import { BatchRPCResponse } from "src/services/rpc";
// RPC
import { useDeleteTopologySegmentsMutation } from "src/services/rpcTopologySegments";

interface DeleteTopologySegmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  elementsToDelete: TopologySegment[];
  clearSelectedElements: () => void;
  columnNames: string[];
  columnIds: string[];
  onRefresh: () => void;
  updateIsDeleteButtonDisabled: (value: boolean) => void;
  updateIsDeletion: (value: boolean) => void;
  suffixCn: string;
}

const DeleteTopologySegmentsModal = (
  props: DeleteTopologySegmentsModalProps
) => {
  const dispatch = useAppDispatch();

  // API
  const [deleteSegments] = useDeleteTopologySegmentsMutation();

  // State
  const [isDeleteButtonSpinning, setIsDeleteButtonSpinning] =
    React.useState(false);
  const [showErrorModal, setShowErrorModal] = React.useState(false);
  const [errorTitle, setErrorTitle] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");

  // Handle API error data
  const handleAPIError = (error: FetchBaseQueryError | SerializedError) => {
    if ("code" in error) {
      setErrorTitle("IPA error " + error.code + ": " + error.name);
      if (error.message !== undefined) {
        setErrorMessage(error.message);
      }
    }
    setShowErrorModal(true);
  };

  // Delete handler
  const onDeleteSegments = () => {
    setIsDeleteButtonSpinning(true);

    deleteSegments({
      suffixCn: props.suffixCn,
      segments: props.elementsToDelete,
    }).then((response) => {
      if ("data" in response) {
        const data = response.data as BatchRPCResponse;
        const result = data?.result;

        if (result) {
          // Some items may have failed
          if ("error" in result.results[0] && result.results[0].error) {
            const errorData = {
              code: result.results[0].error_code,
              name: result.results[0].error_name,
              error: result.results[0].error,
            } as ErrorData;

            const error = {
              code: errorData.code,
              name: errorData.name,
              message: errorData.error,
            } as SerializedError;

            handleAPIError(error);
          } else {
            props.clearSelectedElements();
            props.updateIsDeleteButtonDisabled(true);
            props.updateIsDeletion(true);

            dispatch(
              addAlert({
                name: "delete-topology-segments-success",
                title: "Topology segments removed",
                variant: "success",
              })
            );

            props.onClose();
            props.onRefresh();
          }
        }
        setIsDeleteButtonSpinning(false);
      }
    });
  };

  // Close error modal
  const onCloseErrorModal = () => {
    setShowErrorModal(false);
  };

  // Fields
  const fields = [
    {
      id: "question-text",
      pfComponent: (
        <Content component={ContentVariants.p}>
          Are you sure you want to remove the selected topology segments?
        </Content>
      ),
    },
    {
      id: "deleted-elements-table",
      pfComponent: (
        <DeletedElementsTable
          mode="passing_full_data"
          elementsToDelete={props.elementsToDelete}
          columnNames={props.columnNames}
          columnIds={props.columnIds}
          elementType="TopologySegment"
          idAttr="cn"
        />
      ),
    },
  ];

  // Actions
  const actions = [
    <Button
      data-cy="modal-button-delete"
      key="delete-topology-segments"
      variant="danger"
      onClick={onDeleteSegments}
      isDisabled={isDeleteButtonSpinning}
      isLoading={isDeleteButtonSpinning}
      spinnerAriaValueText="Deleting"
      spinnerAriaLabel="Deleting"
    >
      {isDeleteButtonSpinning ? "Deleting" : "Delete"}
    </Button>,
    <Button
      data-cy="modal-button-cancel"
      key="cancel"
      variant="link"
      onClick={props.onClose}
    >
      Cancel
    </Button>,
  ];

  return (
    <>
      <ModalWithFormLayout
        dataCy="delete-topology-segments-modal"
        variantType="medium"
        modalPosition="top"
        offPosition="76px"
        title="Remove topology segments"
        formId="delete-topology-segments-modal"
        fields={fields}
        show={props.isOpen}
        onClose={props.onClose}
        actions={actions}
      />
      {showErrorModal && (
        <ErrorModal
          dataCy="delete-topology-segments-error-modal"
          title={errorTitle}
          isOpen={showErrorModal}
          onClose={onCloseErrorModal}
          actions={[
            <Button
              data-cy="modal-button-ok"
              key="cancel-error"
              variant="link"
              onClick={onCloseErrorModal}
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

export default DeleteTopologySegmentsModal;
