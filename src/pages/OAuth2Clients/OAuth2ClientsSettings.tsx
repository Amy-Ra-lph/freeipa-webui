import React, { useState } from "react";
// PatternFly
import { Button, Flex, Form, FormGroup } from "@patternfly/react-core";
// Forms
import IpaTextArea from "src/components/Form/IpaTextArea";
import IpaTextInput from "src/components/Form/IpaTextInput";
import IpaCheckbox from "src/components/Form/IpaCheckbox/IpaCheckbox";
// Layouts
import TitleLayout from "src/components/layouts/TitleLayout";
import TabLayout from "src/components/layouts/TabLayout";
// Utils
import { asOAuth2ClientRecord } from "../../utils/oauth2Utils";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import useUpdateRoute from "src/hooks/useUpdateRoute";
// Data types
import { OAuth2Client, Metadata } from "../../utils/datatypes/globalDataTypes";
// RPC
import { ErrorResult } from "src/services/rpc";
import { useSaveClientMutation } from "src/services/rpcOAuth2";

interface PropsToSettings {
  client: Partial<OAuth2Client>;
  originalClient: Partial<OAuth2Client>;
  metadata: Metadata;
  onClientChange: (client: Partial<OAuth2Client>) => void;
  onRefresh: () => void;
  isModified: boolean;
  isDataLoading?: boolean;
  modifiedValues: () => Partial<OAuth2Client>;
  onResetValues: () => void;
}

const OAuth2ClientsSettings = (props: PropsToSettings) => {
  const dispatch = useAppDispatch();

  // API
  const [saveClient] = useSaveClientMutation();

  // Update current route data to Redux and highlight the current page in the Nav bar
  useUpdateRoute({ pathname: "oauth2-clients", noBreadcrumb: true });

  // Get 'ipaObject' and 'recordOnChange' to use in 'IpaTextInput'
  const { ipaObject, recordOnChange } = asOAuth2ClientRecord(
    props.client,
    props.onClientChange
  );

  const [isSaving, setSaving] = useState(false);

  // 'Save' handler method
  const onSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const modifiedValues = props.modifiedValues();
    modifiedValues.cn = props.client.cn;
    setSaving(true);

    saveClient(modifiedValues).then((response) => {
      if ("data" in response) {
        if (response.data?.result) {
          // Show toast notification: success
          dispatch(
            addAlert({
              name: "save-success",
              title: "OAuth2 client modified",
              variant: "success",
            })
          );
          props.onRefresh();
        } else if (response.data?.error) {
          // Show toast notification: error
          const errorMessage = response.data.error as unknown as ErrorResult;
          dispatch(
            addAlert({
              name: "save-error",
              title: errorMessage.message,
              variant: "danger",
            })
          );
          // Reset values. Disable 'revert' and 'save' buttons
          props.onResetValues();
        }
        setSaving(false);
      }
    });
  };

  // 'Revert' handler method
  const onRevert = () => {
    props.onClientChange(props.originalClient);
    dispatch(
      addAlert({
        name: "revert-success",
        title: "OAuth2 client data reverted",
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
          data-cy="oauth2-clients-tab-settings-button-refresh"
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
          data-cy="oauth2-clients-tab-settings-button-revert"
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
          data-cy="oauth2-clients-tab-settings-button-save"
          isDisabled={!props.isModified || isSaving}
          type="submit"
          form="oauth2-clients-settings-form"
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
      <Flex direction={{ default: "column" }} flex={{ default: "flex_1" }}>
        <TitleLayout
          key={0}
          headingLevel="h1"
          id="oauth2client-settings"
          text="OAuth2 client settings"
        />
        <Form
          className="pf-v6-u-mt-sm pf-v6-u-mb-lg pf-v6-u-mr-md"
          id="oauth2-clients-settings-form"
          onSubmit={onSave}
        >
          <FormGroup label="Description" fieldId="description">
            <IpaTextArea
              dataCy="oauth2-clients-tab-settings-textbox-description"
              name="description"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2client"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup label="Client ID" fieldId="oauth2clientid">
            <IpaTextInput
              dataCy="oauth2-clients-tab-settings-textbox-oauth2clientid"
              name="oauth2clientid"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2client"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup label="Client Type" fieldId="oauth2clienttype">
            <IpaTextInput
              dataCy="oauth2-clients-tab-settings-textbox-oauth2clienttype"
              name="oauth2clienttype"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2client"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup label="Grant Types" fieldId="oauth2granttype">
            <IpaTextArea
              dataCy="oauth2-clients-tab-settings-textbox-oauth2granttype"
              name="oauth2granttype"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2client"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup label="Redirect URIs" fieldId="oauth2redirecturi">
            <IpaTextArea
              dataCy="oauth2-clients-tab-settings-textbox-oauth2redirecturi"
              name="oauth2redirecturi"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2client"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup label="Scopes" fieldId="oauth2scope">
            <IpaTextArea
              dataCy="oauth2-clients-tab-settings-textbox-oauth2scope"
              name="oauth2scope"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2client"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup
            label="Token Lifetime (s)"
            fieldId="oauth2tokenlifetime"
          >
            <IpaTextInput
              dataCy="oauth2-clients-tab-settings-textbox-oauth2tokenlifetime"
              name="oauth2tokenlifetime"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2client"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup label="Enabled" fieldId="oauth2enabled">
            <IpaCheckbox
              dataCy="oauth2-clients-tab-settings-checkbox-oauth2enabled"
              name="oauth2enabled"
              value="oauth2enabled"
              text=""
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2client"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
        </Form>
      </Flex>
    </TabLayout>
  );
};

export default OAuth2ClientsSettings;
