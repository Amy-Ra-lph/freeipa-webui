import React from "react";
// PatternFly
import { Content, ContentVariants, Button } from "@patternfly/react-core";
// Layouts
import ModalWithFormLayout from "src/components/layouts/ModalWithFormLayout";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
// Errors
import { SerializedError } from "@reduxjs/toolkit";
// Data types
import { CertificateAuthority } from "src/utils/datatypes/globalDataTypes";
// RPC
import {
  useEnableCertAuthorityMutation,
  useDisableCertAuthorityMutation,
} from "src/services/rpcCertAuthorities";

interface EnableDisableCertAuthorityModalProps {
  isOpen: boolean;
  onClose: () => void;
  ca: CertificateAuthority;
  isEnable: boolean;
  onRefresh: () => void;
}

const EnableDisableCertAuthorityModal = (
  props: EnableDisableCertAuthorityModalProps
) => {
  const dispatch = useAppDispatch();

  // API calls
  const [enableCertAuthority] = useEnableCertAuthorityMutation();
  const [disableCertAuthority] = useDisableCertAuthorityMutation();

  // States
  const [spinning, setSpinning] = React.useState(false);

  const caName = Array.isArray(props.ca.cn) ? props.ca.cn[0] : props.ca.cn;
  const action = props.isEnable ? "Enable" : "Disable";
  const actionLower = props.isEnable ? "enable" : "disable";
  const actionPast = props.isEnable ? "enabled" : "disabled";

  const onConfirm = () => {
    setSpinning(true);

    const mutation = props.isEnable
      ? enableCertAuthority(caName)
      : disableCertAuthority(caName);

    mutation.then((response) => {
      if ("data" in response) {
        const data = response.data?.result;
        const error = response.data?.error as SerializedError;

        if (error) {
          dispatch(
            addAlert({
              name: `${actionLower}-cert-authority-error`,
              title: error.message,
              variant: "danger",
            })
          );
        }

        if (data) {
          dispatch(
            addAlert({
              name: `${actionLower}-cert-authority-success`,
              title: `Certificate authority "${caName}" ${actionPast}`,
              variant: "success",
            })
          );
          props.onRefresh();
          props.onClose();
        }
      }
      setSpinning(false);
    });
  };

  const fields = [
    {
      id: "question-text",
      pfComponent: (
        <Content component={ContentVariants.p}>
          Are you sure you want to {actionLower} certificate authority &quot;
          {caName}&quot;?
        </Content>
      ),
    },
  ];

  const modalActions: JSX.Element[] = [
    <Button
      key={`${actionLower}-cert-authority`}
      variant={props.isEnable ? "primary" : "danger"}
      onClick={onConfirm}
      form={`${actionLower}-cert-authority-modal`}
      spinnerAriaValueText={`${action}ing`}
      spinnerAriaLabel={`${action}ing`}
      isLoading={spinning}
      isDisabled={spinning}
      data-cy={`modal-button-${actionLower}`}
    >
      {spinning ? `${action}ing` : action}
    </Button>,
    <Button
      key="cancel"
      variant="link"
      onClick={props.onClose}
      data-cy="modal-button-cancel"
    >
      Cancel
    </Button>,
  ];

  return (
    <ModalWithFormLayout
      dataCy={`${actionLower}-cert-authority-modal`}
      variantType="small"
      modalPosition="top"
      offPosition="76px"
      title={`${action} certificate authority`}
      formId={`${actionLower}-cert-authority-modal`}
      fields={fields}
      show={props.isOpen}
      onClose={props.onClose}
      actions={modalActions}
    />
  );
};

export default EnableDisableCertAuthorityModal;
