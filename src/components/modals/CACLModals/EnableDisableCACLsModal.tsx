import React, { useState } from "react";
import { Button, Content, ContentVariants } from "@patternfly/react-core";
// Layouts
import ModalWithFormLayout from "src/components/layouts/ModalWithFormLayout";
import { CertACL } from "src/utils/datatypes/globalDataTypes";
// RPC
import {
  Command,
  BatchRPCResponse,
  useBatchMutCommandMutation,
  ErrorResult,
} from "src/services/rpc";
import {
  useDisableCACLMutation,
  useEnableCACLMutation,
} from "src/services/rpcCACLs";
// Errors
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
import ErrorModal from "src/components/modals/ErrorModal";
// Data types
import { ErrorData } from "src/utils/datatypes/globalDataTypes";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
// Redux
import { useAppDispatch } from "src/store/hooks";

interface ButtonsData {
  updateIsEnableButtonDisabled: (value: boolean) => void;
  updateIsDisableButtonDisabled: (value: boolean) => void;
  updateIsDisableEnableOp: (value: boolean) => void;
}

interface SelectedCACLsData {
  selectedCACLs: CertACL[];
  clearSelectedCACLs: () => void;
}

interface PropsToEnableDisableCACLs {
  show: boolean;
  handleModalToggle: () => void;
  optionSelected: boolean; // 'enable': false | 'disable': true
  selectedCACLsData: SelectedCACLsData;
  buttonsData?: ButtonsData;
  onRefresh?: () => void;
  singleCACL?: boolean | false;
}

const EnableDisableCACLsModal = (props: PropsToEnableDisableCACLs) => {
  const dispatch = useAppDispatch();

  // Define 'executeEnableDisableCommand' to batch enable/disable CA ACLs
  const [executeEnableDisableCommand] = useBatchMutCommandMutation();
  // Single CA ACL operations
  const [enableSingleCACL] = useEnableCACLMutation();
  const [disableSingleCACL] = useDisableCACLMutation();

  // Define which action (enable | disable) based on 'optionSelected'
  const action = !props.optionSelected ? "enable" : "disable";

  const cacls = props.selectedCACLsData.selectedCACLs.map((cacl) => cacl.cn);

  // List of fields
  const fields = [
    {
      id: "question-text",
      pfComponent: (
        <>
          <Content component={ContentVariants.p}>
            Are you sure you want to {action} selected entries?
          </Content>
          <Content component={ContentVariants.p}>
            <i>{cacls.join(", ")}</i>
          </Content>
        </>
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
      data-cy="modal-button-ok"
      key="ok"
      variant="link"
      onClick={onCloseErrorModal}
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

  // Modify CA ACL status using IPA commands
  const modifyStatus = (newStatus: boolean, selectedCACLs: CertACL[]) => {
    // Prepare CA ACL params
    const idsToChangeStatusPayload: Command[] = [];
    const changeStatusParams = {};
    const option = props.optionSelected ? "caacl_disable" : "caacl_enable";

    // Make the API call (depending on 'singleCACL' value)
    if (props.singleCACL === undefined || !props.singleCACL) {
      selectedCACLs.map((cacl) => {
        const payloadItem = {
          method: option,
          params: [cacl.cn, changeStatusParams],
        } as Command;

        idsToChangeStatusPayload.push(payloadItem);
      });

      executeEnableDisableCommand(idsToChangeStatusPayload).then((response) => {
        if ("data" in response) {
          const data = response.data as BatchRPCResponse;
          const result = data.result;
          const error = data.error as FetchBaseQueryError | SerializedError;

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
            } else {
              if (props.buttonsData !== undefined) {
                // Update 'isDisableEnableOp' to notify table that an updating operation is performed
                props.buttonsData.updateIsDisableEnableOp(true);

                // Update buttons
                if (!props.optionSelected) {
                  // Enable
                  props.buttonsData.updateIsEnableButtonDisabled(true);
                  props.buttonsData.updateIsDisableButtonDisabled(false);
                  // Set alert: success
                  dispatch(
                    addAlert({
                      name: "enable-cacl-success",
                      title: "CA ACL enabled",
                      variant: "success",
                    })
                  );
                } else if (props.optionSelected) {
                  // Disable
                  props.buttonsData.updateIsEnableButtonDisabled(false);
                  props.buttonsData.updateIsDisableButtonDisabled(true);
                  // Set alert: success
                  dispatch(
                    addAlert({
                      name: "disable-cacl-success",
                      title: "CA ACL disabled",
                      variant: "success",
                    })
                  );
                }
              }

              // Reset selected CA ACLs
              props.selectedCACLsData.clearSelectedCACLs();

              // Refresh data
              if (props.onRefresh !== undefined) {
                props.onRefresh();
              }
            }
          } else if (error) {
            // Handle error
            handleAPIError(error);
          }
          // Close modal
          closeModal();
        }
      });
    } else {
      // Single CA ACL operation
      let command;
      if (option === "caacl_disable") {
        command = disableSingleCACL;
      } else {
        command = enableSingleCACL;
      }

      const payload = props.selectedCACLsData.selectedCACLs[0];

      command(payload).then((response) => {
        if ("data" in response) {
          if (response.data.result) {
            // Close modal
            closeModal();
            // Set alert: success
            dispatch(
              addAlert({
                name: "enable-cacl-success",
                title:
                  "Enabled CA ACL '" +
                  props.selectedCACLsData.selectedCACLs[0].cn +
                  "'",
                variant: "success",
              })
            );
            // Reset selected CA ACLs
            props.selectedCACLsData.clearSelectedCACLs();
            // Refresh data
            if (props.onRefresh !== undefined) {
              props.onRefresh();
            }
          } else if (response.data.error) {
            // Set alert: error
            const errorMessage = response.data.error as ErrorResult;
            dispatch(
              addAlert({
                name: "enable-cacl-error",
                title: errorMessage.message,
                variant: "danger",
              })
            );
          }
        }
      });
    }
  };

  // Set the Modal and Action buttons for 'Disable' option
  const modalActionsDisable: JSX.Element[] = [
    <Button
      key="disable-cacls"
      variant="primary"
      onClick={() =>
        modifyStatus(
          props.optionSelected,
          props.selectedCACLsData.selectedCACLs
        )
      }
      form="cacls-enable-disable-cacls-modal"
      data-cy="modal-button-disable"
    >
      Disable
    </Button>,
    <Button
      key="cancel-disable-cacl"
      variant="link"
      onClick={closeModal}
      data-cy="modal-button-cancel"
    >
      Cancel
    </Button>,
  ];

  const modalDisable: JSX.Element = (
    <ModalWithFormLayout
      dataCy="disable-cacls-modal"
      variantType="medium"
      modalPosition="top"
      offPosition="76px"
      title="Disable confirmation"
      formId="cacls-enable-disable-cacls-modal"
      fields={fields}
      show={props.show}
      onClose={closeModal}
      actions={modalActionsDisable}
    />
  );

  // Set the Modal and Action buttons for 'Enable' option
  const modalActionsEnable: JSX.Element[] = [
    <Button
      key="enable-cacls"
      variant="primary"
      onClick={() =>
        modifyStatus(
          props.optionSelected,
          props.selectedCACLsData.selectedCACLs
        )
      }
      form="cacls-enable-disable-cacls-modal"
      data-cy="modal-button-enable"
    >
      Enable
    </Button>,
    <Button
      key="cancel-enable-cacl"
      variant="link"
      onClick={closeModal}
      data-cy="modal-button-cancel"
    >
      Cancel
    </Button>,
  ];

  const modalEnable: JSX.Element = (
    <ModalWithFormLayout
      dataCy="enable-cacls-modal"
      variantType="medium"
      modalPosition="top"
      offPosition="76px"
      title="Enable confirmation"
      formId="cacls-enable-disable-cacls-modal"
      fields={fields}
      show={props.show}
      onClose={closeModal}
      actions={modalActionsEnable}
    />
  );

  // Render 'EnableDisableCACLsModal'
  return (
    <>
      {!props.optionSelected ? modalEnable : modalDisable}
      {isModalErrorOpen && (
        <ErrorModal
          dataCy="enable-disable-cacls-modal-error"
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

export default EnableDisableCACLsModal;
