import React, { useState } from "react";
import { Button, Content, ContentVariants } from "@patternfly/react-core";
// Layouts
import ModalWithFormLayout from "src/components/layouts/ModalWithFormLayout";
import { CertificateAuthority } from "src/utils/datatypes/globalDataTypes";
// RPC
import {
  Command,
  BatchRPCResponse,
  useBatchMutCommandMutation,
} from "src/services/rpc";
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

interface SelectedCertAuthoritiesData {
  selectedCertAuthorities: CertificateAuthority[];
  clearSelectedCertAuthorities: () => void;
}

interface PropsToEnableDisableCertAuthorities {
  show: boolean;
  handleModalToggle: () => void;
  optionSelected: boolean; // 'enable': false | 'disable': true
  selectedCertAuthoritiesData: SelectedCertAuthoritiesData;
  buttonsData?: ButtonsData;
  onRefresh?: () => void;
}

const EnableDisableCertAuthoritiesModal = (
  props: PropsToEnableDisableCertAuthorities
) => {
  const dispatch = useAppDispatch();

  const [executeEnableDisableCommand] = useBatchMutCommandMutation();

  const action = !props.optionSelected ? "enable" : "disable";

  const cas = props.selectedCertAuthoritiesData.selectedCertAuthorities.map(
    (ca) => (Array.isArray(ca.cn) ? ca.cn[0] : ca.cn)
  );

  const fields = [
    {
      id: "question-text",
      pfComponent: (
        <>
          <Content component={ContentVariants.p}>
            Are you sure you want to {action} selected entries?
          </Content>
          <Content component={ContentVariants.p}>
            <i>{cas.join(", ")}</i>
          </Content>
        </>
      ),
    },
  ];

  const closeModal = () => {
    props.handleModalToggle();
  };

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
      const errorMsg = errorData.error as string;

      setErrorTitle("IPA error " + errorCode + ": " + errorName);
      setErrorMessage(errorMsg);
    }
    setIsModalErrorOpen(true);
  };

  const modifyStatus = (
    _newStatus: boolean,
    selectedCAs: CertificateAuthority[]
  ) => {
    const idsToChangeStatusPayload: Command[] = [];
    const changeStatusParams = {};
    const option = props.optionSelected ? "ca_disable" : "ca_enable";

    selectedCAs.map((ca) => {
      const caName = Array.isArray(ca.cn) ? ca.cn[0] : ca.cn;
      const payloadItem = {
        method: option,
        params: [caName, changeStatusParams],
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

            const fetchError = {
              status: "CUSTOM_ERROR",
              data: errorData,
            } as FetchBaseQueryError;

            handleAPIError(fetchError);
          } else {
            if (props.buttonsData !== undefined) {
              props.buttonsData.updateIsDisableEnableOp(true);

              if (!props.optionSelected) {
                props.buttonsData.updateIsEnableButtonDisabled(true);
                props.buttonsData.updateIsDisableButtonDisabled(false);
                dispatch(
                  addAlert({
                    name: "enable-cert-authority-success",
                    title: "Certificate authority enabled",
                    variant: "success",
                  })
                );
              } else if (props.optionSelected) {
                props.buttonsData.updateIsEnableButtonDisabled(false);
                props.buttonsData.updateIsDisableButtonDisabled(true);
                dispatch(
                  addAlert({
                    name: "disable-cert-authority-success",
                    title: "Certificate authority disabled",
                    variant: "success",
                  })
                );
              }
            }

            props.selectedCertAuthoritiesData.clearSelectedCertAuthorities();

            if (props.onRefresh !== undefined) {
              props.onRefresh();
            }
          }
        } else if (error) {
          handleAPIError(error);
        }
        closeModal();
      }
    });
  };

  const modalActionsDisable: JSX.Element[] = [
    <Button
      key="disable-cert-authorities"
      variant="primary"
      onClick={() =>
        modifyStatus(
          props.optionSelected,
          props.selectedCertAuthoritiesData.selectedCertAuthorities
        )
      }
      form="cert-authorities-enable-disable-modal"
      data-cy="modal-button-disable"
    >
      Disable
    </Button>,
    <Button
      key="cancel-disable-cert-authority"
      variant="link"
      onClick={closeModal}
      data-cy="modal-button-cancel"
    >
      Cancel
    </Button>,
  ];

  const modalDisable: JSX.Element = (
    <ModalWithFormLayout
      dataCy="disable-cert-authorities-modal"
      variantType="medium"
      modalPosition="top"
      offPosition="76px"
      title="Disable confirmation"
      formId="cert-authorities-enable-disable-modal"
      fields={fields}
      show={props.show}
      onClose={closeModal}
      actions={modalActionsDisable}
    />
  );

  const modalActionsEnable: JSX.Element[] = [
    <Button
      key="enable-cert-authorities"
      variant="primary"
      onClick={() =>
        modifyStatus(
          props.optionSelected,
          props.selectedCertAuthoritiesData.selectedCertAuthorities
        )
      }
      form="cert-authorities-enable-disable-modal"
      data-cy="modal-button-enable"
    >
      Enable
    </Button>,
    <Button
      key="cancel-enable-cert-authority"
      variant="link"
      onClick={closeModal}
      data-cy="modal-button-cancel"
    >
      Cancel
    </Button>,
  ];

  const modalEnable: JSX.Element = (
    <ModalWithFormLayout
      dataCy="enable-cert-authorities-modal"
      variantType="medium"
      modalPosition="top"
      offPosition="76px"
      title="Enable confirmation"
      formId="cert-authorities-enable-disable-modal"
      fields={fields}
      show={props.show}
      onClose={closeModal}
      actions={modalActionsEnable}
    />
  );

  return (
    <>
      {!props.optionSelected ? modalEnable : modalDisable}
      {isModalErrorOpen && (
        <ErrorModal
          dataCy="enable-disable-cert-authorities-modal-error"
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

export default EnableDisableCertAuthoritiesModal;
