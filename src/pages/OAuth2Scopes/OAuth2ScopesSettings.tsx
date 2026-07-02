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
import { asOAuth2ScopeRecord } from "../../utils/oauth2Utils";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import useUpdateRoute from "src/hooks/useUpdateRoute";
// Data types
import { OAuth2Scope, Metadata } from "../../utils/datatypes/globalDataTypes";
// RPC
import { ErrorResult } from "src/services/rpc";
import { useSaveScopeMutation } from "src/services/rpcOAuth2";

interface PropsToSettings {
  scope: Partial<OAuth2Scope>;
  originalScope: Partial<OAuth2Scope>;
  metadata: Metadata;
  onScopeChange: (scope: Partial<OAuth2Scope>) => void;
  onRefresh: () => void;
  isModified: boolean;
  isDataLoading?: boolean;
  modifiedValues: () => Partial<OAuth2Scope>;
  onResetValues: () => void;
}

const OAuth2ScopesSettings = (props: PropsToSettings) => {
  const dispatch = useAppDispatch();

  // API
  const [saveScope] = useSaveScopeMutation();

  // Update current route data to Redux and highlight the current page in the Nav bar
  useUpdateRoute({ pathname: "oauth2-scopes", noBreadcrumb: true });

  // Get 'ipaObject' and 'recordOnChange' to use in 'IpaTextInput'
  const { ipaObject, recordOnChange } = asOAuth2ScopeRecord(
    props.scope,
    props.onScopeChange
  );

  const [isSaving, setSaving] = useState(false);

  // 'Save' handler method
  const onSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const modifiedValues = props.modifiedValues();
    modifiedValues.cn = props.scope.cn;
    setSaving(true);

    saveScope(modifiedValues).then((response) => {
      if ("data" in response) {
        if (response.data?.result) {
          // Show toast notification: success
          dispatch(
            addAlert({
              name: "save-success",
              title: "OAuth2 scope modified",
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
    props.onScopeChange(props.originalScope);
    dispatch(
      addAlert({
        name: "revert-success",
        title: "OAuth2 scope data reverted",
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
          data-cy="oauth2-scopes-tab-settings-button-refresh"
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
          data-cy="oauth2-scopes-tab-settings-button-revert"
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
          data-cy="oauth2-scopes-tab-settings-button-save"
          isDisabled={!props.isModified || isSaving}
          type="submit"
          form="oauth2-scopes-settings-form"
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
          id="oauth2scope-settings"
          text="OAuth2 scope settings"
        />
        <Form
          className="pf-v6-u-mt-sm pf-v6-u-mb-lg pf-v6-u-mr-md"
          id="oauth2-scopes-settings-form"
          onSubmit={onSave}
        >
          <FormGroup label="Description" fieldId="description">
            <IpaTextArea
              dataCy="oauth2-scopes-tab-settings-textbox-description"
              name="description"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2scope"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup label="Scope Value" fieldId="oauth2scope">
            <IpaTextInput
              dataCy="oauth2-scopes-tab-settings-textbox-oauth2scope"
              name="oauth2scope"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2scope"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup label="Enabled" fieldId="oauth2enabled">
            <IpaCheckbox
              dataCy="oauth2-scopes-tab-settings-checkbox-oauth2enabled"
              name="oauth2enabled"
              value="oauth2enabled"
              text=""
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2scope"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
        </Form>
      </Flex>
    </TabLayout>
  );
};

export default OAuth2ScopesSettings;
