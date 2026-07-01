import React, { useState } from "react";
// PatternFly
import {
  Button,
  Flex,
  Form,
  FormGroup,
  Sidebar,
  SidebarContent,
  SidebarPanel,
} from "@patternfly/react-core";
// Forms
import IpaTextInput from "src/components/Form/IpaTextInput";
import IpaTextArea from "src/components/Form/IpaTextArea";
// Layouts
import TitleLayout from "src/components/layouts/TitleLayout";
import HelpTextWithIconLayout from "src/components/layouts/HelpTextWithIconLayout";
import TabLayout from "src/components/layouts/TabLayout";
// Utils
import { asRecord } from "src/utils/certAuthoritiesUtils";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import useUpdateRoute from "src/hooks/useUpdateRoute";
// Data types
import {
  CertificateAuthority,
  Metadata,
} from "src/utils/datatypes/globalDataTypes";
// RPC
import { ErrorResult } from "src/services/rpc";
import { useSaveCertAuthorityMutation } from "src/services/rpcCertAuthorities";

interface PropsToSettings {
  certAuthority: Partial<CertificateAuthority>;
  originalCertAuthority: Partial<CertificateAuthority>;
  metadata: Metadata;
  onCertAuthorityChange: (ca: Partial<CertificateAuthority>) => void;
  onRefresh: () => void;
  isModified: boolean;
  isDataLoading?: boolean;
  modifiedValues: () => Partial<CertificateAuthority>;
  onResetValues: () => void;
  onOpenContextualPanel?: () => void;
}

const CertAuthoritiesSettings = (props: PropsToSettings) => {
  const dispatch = useAppDispatch();

  // API
  const [saveCertAuthority] = useSaveCertAuthorityMutation();

  // Update current route data to Redux and highlight the current page in the Nav bar
  useUpdateRoute({ pathname: "cert-authorities", noBreadcrumb: true });

  // Get 'ipaObject' and 'recordOnChange' to use in form fields
  const { ipaObject, recordOnChange } = asRecord(
    props.certAuthority,
    props.onCertAuthorityChange
  );

  const [isSaving, setSaving] = useState(false);

  // 'Save' handler method
  const onSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const modifiedValues = props.modifiedValues();
    modifiedValues.cn = props.certAuthority.cn;
    setSaving(true);

    saveCertAuthority(modifiedValues).then((response) => {
      if ("data" in response) {
        if (response.data?.result) {
          dispatch(
            addAlert({
              name: "save-success",
              title: "Certificate authority modified",
              variant: "success",
            })
          );
          props.onRefresh();
        } else if (response.data?.error) {
          const errorMessage = response.data.error as ErrorResult;
          dispatch(
            addAlert({
              name: "save-error",
              title: errorMessage.message,
              variant: "danger",
            })
          );
          props.onResetValues();
        }
        setSaving(false);
      }
    });
  };

  // 'Revert' handler method
  const onRevert = () => {
    props.onCertAuthorityChange(props.originalCertAuthority);
    dispatch(
      addAlert({
        name: "revert-success",
        title: "Certificate authority data reverted",
        variant: "success",
      })
    );
  };

  // Toolbar
  const toolbarFields = [
    {
      key: 0,
      element: (
        <Button
          variant="secondary"
          data-cy="cert-authorities-tab-settings-button-refresh"
          onClick={props.onRefresh}
        >
          Refresh
        </Button>
      ),
    },
    {
      key: 1,
      element: (
        <Button
          variant="secondary"
          data-cy="cert-authorities-tab-settings-button-revert"
          isDisabled={!props.isModified}
          onClick={onRevert}
        >
          Revert
        </Button>
      ),
    },
    {
      key: 2,
      element: (
        <Button
          variant="primary"
          data-cy="cert-authorities-tab-settings-button-save"
          isDisabled={!props.isModified || isSaving}
          type="submit"
          form="cert-authorities-settings-form"
          isLoading={isSaving}
          spinnerAriaValueText="Saving"
          spinnerAriaLabel="Saving"
        >
          {isSaving ? "Saving" : "Save"}
        </Button>
      ),
    },
  ];

  // Render component
  return (
    <TabLayout id="settings-page" toolbarItems={toolbarFields}>
      <Sidebar isPanelRight>
        <SidebarPanel variant="sticky">
          <HelpTextWithIconLayout
            textContent="Help"
            onClick={props.onOpenContextualPanel}
          />
        </SidebarPanel>
        <SidebarContent className="pf-v6-u-mr-xl">
          <Flex direction={{ default: "column" }} flex={{ default: "flex_1" }}>
            <TitleLayout
              key={0}
              headingLevel="h2"
              id="cert-authority-settings"
              text="Certificate authority settings"
            />
            <Form
              className="pf-v6-u-mt-sm pf-v6-u-mb-lg pf-v6-u-mr-md"
              id="cert-authorities-settings-form"
              isHorizontal
              onSubmit={onSave}
            >
              <FormGroup label="CA name" fieldId="cn">
                <IpaTextInput
                  dataCy="cert-authorities-tab-settings-textinput-cn"
                  name="cn"
                  ariaLabel="CA name"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="ca"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup label="Description" fieldId="description">
                <IpaTextArea
                  dataCy="cert-authorities-tab-settings-textarea-description"
                  name="description"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="ca"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup label="Subject DN" fieldId="ipacasubjectdn">
                <IpaTextInput
                  dataCy="cert-authorities-tab-settings-textinput-ipacasubjectdn"
                  name="ipacasubjectdn"
                  ariaLabel="Subject DN"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="ca"
                  metadata={props.metadata}
                  readOnly
                />
              </FormGroup>
              <FormGroup label="Issuer DN" fieldId="ipacaissuerdn">
                <IpaTextInput
                  dataCy="cert-authorities-tab-settings-textinput-ipacaissuerdn"
                  name="ipacaissuerdn"
                  ariaLabel="Issuer DN"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="ca"
                  metadata={props.metadata}
                  readOnly
                />
              </FormGroup>
              <FormGroup label="CA ID" fieldId="ipacaid">
                <IpaTextInput
                  dataCy="cert-authorities-tab-settings-textinput-ipacaid"
                  name="ipacaid"
                  ariaLabel="CA ID"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="ca"
                  metadata={props.metadata}
                  readOnly
                />
              </FormGroup>
            </Form>
          </Flex>
        </SidebarContent>
      </Sidebar>
    </TabLayout>
  );
};

export default CertAuthoritiesSettings;
