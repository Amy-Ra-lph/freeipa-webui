import React from "react";
// PatternFly
import { Button, TextArea, TextInput } from "@patternfly/react-core";
// Components
import ModalWithFormLayout, {
  Field,
} from "src/components/layouts/ModalWithFormLayout";
// RPC
import {
  OAuth2VendorAddPayload,
  useOauth2VendorAddMutation,
} from "src/services/rpcOAuth2";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";

interface PropsToAddModal {
  isOpen: boolean;
  onCloseModal: () => void;
  onRefresh: () => void;
  title: string;
}

const AddOAuth2VendorModal = (props: PropsToAddModal) => {
  const dispatch = useAppDispatch();

  const [vendorName, setVendorName] = React.useState("");
  const [caCert, setCaCert] = React.useState("");
  const [scope, setScope] = React.useState("");
  const [contact, setContact] = React.useState("");
  const [expires, setExpires] = React.useState("");
  const [rekorUrl, setRekorUrl] = React.useState("");
  const [description, setDescription] = React.useState("");

  // Validation state
  const [caCertValidated, setCaCertValidated] = React.useState<
    "default" | "error"
  >("default");
  const [expiresValidated, setExpiresValidated] = React.useState<
    "default" | "error"
  >("default");

  const [addVendor] = useOauth2VendorAddMutation();

  const resetFields = () => {
    setVendorName("");
    setCaCert("");
    setScope("");
    setContact("");
    setExpires("");
    setRekorUrl("");
    setDescription("");
    setCaCertValidated("default");
    setExpiresValidated("default");
  };

  const validateCaCert = (value: string): boolean => {
    if (!value) return true; // required handled by isDisabled
    return /^-----BEGIN CERTIFICATE-----[\s\S]+-----END CERTIFICATE-----\s*$/.test(
      value.trim()
    );
  };

  const validateExpires = (value: string): boolean => {
    if (!value) return true; // optional field
    return /^\d{14}Z$/.test(value);
  };

  const onSubmit = () => {
    const payload: OAuth2VendorAddPayload = {
      cn: vendorName,
      oauth2vendorcacert: caCert,
      oauth2vendorscope: scope ? scope.split(",").map(s => s.trim()) : undefined,
      oauth2vendorcontact: contact || undefined,
      oauth2vendornotafter: expires || undefined,
      oauth2vendorrekorurl: rekorUrl || undefined,
      description: description || undefined,
    };

    addVendor(payload).then((response) => {
      if ("data" in response) {
        if (response.data?.error) {
          dispatch(
            addAlert({
              name: "add-oauth2vendor-error",
              title: (response.data.error as Error).message,
              variant: "danger",
            })
          );
        } else {
          dispatch(
            addAlert({
              name: "add-oauth2vendor-success",
              title: "Trusted vendor '" + vendorName + "' added",
              variant: "success",
            })
          );
          resetFields();
          props.onRefresh();
          props.onCloseModal();
        }
      }
    });
  };

  const fields: Field[] = [
    {
      id: "oauth2-vendor-name",
      name: "Vendor name",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-vendor-name"
          id="oauth2-vendor-name"
          name="cn"
          value={vendorName}
          onChange={(_event, value) => setVendorName(value)}
          type="text"
          aria-label="vendor name"
          isRequired
        />
      ),
      fieldRequired: true,
    },
    {
      id: "oauth2-vendor-cacert",
      name: "CA certificate (PEM)",
      pfComponent: (
        <TextArea
          data-cy="modal-textbox-cacert"
          id="oauth2-vendor-cacert"
          name="oauth2vendorcacert"
          value={caCert}
          onChange={(_event, value) => {
            setCaCert(value);
            setCaCertValidated(
              validateCaCert(value) ? "default" : "error"
            );
          }}
          aria-label="CA certificate"
          isRequired
          validated={caCertValidated}
          rows={6}
          placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
        />
      ),
      fieldRequired: true,
    },
    {
      id: "oauth2-vendor-scope",
      name: "Scope ceiling (comma-separated)",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-scope"
          id="oauth2-vendor-scope"
          name="oauth2vendorscope"
          value={scope}
          onChange={(_event, value) => setScope(value)}
          type="text"
          aria-label="scope ceiling"
          placeholder="e.g. openid, db:read, mcp:execute"
        />
      ),
    },
    {
      id: "oauth2-vendor-contact",
      name: "Contact email",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-contact"
          id="oauth2-vendor-contact"
          name="oauth2vendorcontact"
          value={contact}
          onChange={(_event, value) => setContact(value)}
          type="email"
          aria-label="contact email"
          placeholder="e.g. security@vendor.example.com"
        />
      ),
    },
    {
      id: "oauth2-vendor-expires",
      name: "Expires (YYYYMMDDHHmmssZ)",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-expires"
          id="oauth2-vendor-expires"
          name="oauth2vendornotafter"
          value={expires}
          onChange={(_event, value) => {
            setExpires(value);
            setExpiresValidated(
              validateExpires(value) ? "default" : "error"
            );
          }}
          type="text"
          aria-label="expires"
          validated={expiresValidated}
          placeholder="e.g. 20261231235959Z"
        />
      ),
    },
    {
      id: "oauth2-vendor-rekor-url",
      name: "Rekor URL",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-rekor-url"
          id="oauth2-vendor-rekor-url"
          name="oauth2vendorrekorurl"
          value={rekorUrl}
          onChange={(_event, value) => setRekorUrl(value)}
          type="url"
          aria-label="Rekor URL"
          placeholder="e.g. http://rekor.vendor.example.com:3000"
        />
      ),
    },
    {
      id: "oauth2-vendor-description",
      name: "Description",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-description"
          id="oauth2-vendor-description"
          name="description"
          value={description}
          onChange={(_event, value) => setDescription(value)}
          type="text"
          aria-label="description"
        />
      ),
    },
  ];

  const actions = [
    <Button
      data-cy="modal-button-add"
      key="add"
      variant="primary"
      isDisabled={
        vendorName === "" ||
        caCert === "" ||
        caCertValidated === "error" ||
        expiresValidated === "error"
      }
      onClick={onSubmit}
    >
      Add
    </Button>,
    <Button
      data-cy="modal-button-cancel"
      key="cancel"
      variant="link"
      onClick={() => {
        resetFields();
        props.onCloseModal();
      }}
    >
      Cancel
    </Button>,
  ];

  return (
    <ModalWithFormLayout
      dataCy="add-oauth2-vendor-modal"
      variantType="small"
      modalPosition="top"
      title={props.title}
      formId="add-oauth2-vendor-form"
      fields={fields}
      show={props.isOpen}
      onClose={() => {
        resetFields();
        props.onCloseModal();
      }}
      actions={actions}
    />
  );
};

export default AddOAuth2VendorModal;
