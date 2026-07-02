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
import { asOAuth2DelegationRecord } from "../../utils/oauth2Utils";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import useUpdateRoute from "src/hooks/useUpdateRoute";
// Data types
import { OAuth2Delegation, Metadata } from "../../utils/datatypes/globalDataTypes";
// RPC
import { ErrorResult } from "src/services/rpc";
import { useSaveDelegationMutation } from "src/services/rpcOAuth2";

interface PropsToSettings {
  delegation: Partial<OAuth2Delegation>;
  originalDelegation: Partial<OAuth2Delegation>;
  metadata: Metadata;
  onDelegationChange: (delegation: Partial<OAuth2Delegation>) => void;
  onRefresh: () => void;
  isModified: boolean;
  isDataLoading?: boolean;
  modifiedValues: () => Partial<OAuth2Delegation>;
  onResetValues: () => void;
}

const OAuth2DelegationsSettings = (props: PropsToSettings) => {
  const dispatch = useAppDispatch();

  // API
  const [saveDelegation] = useSaveDelegationMutation();

  // Update current route data to Redux and highlight the current page in the Nav bar
  useUpdateRoute({ pathname: "oauth2-delegations", noBreadcrumb: true });

  // Get 'ipaObject' and 'recordOnChange' to use in 'IpaTextInput'
  const { ipaObject, recordOnChange } = asOAuth2DelegationRecord(
    props.delegation,
    props.onDelegationChange
  );

  const [isSaving, setSaving] = useState(false);

  // 'Save' handler method
  const onSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const modifiedValues = props.modifiedValues();
    modifiedValues.cn = props.delegation.cn;
    setSaving(true);

    saveDelegation(modifiedValues).then((response) => {
      if ("data" in response) {
        if (response.data?.result) {
          // Show toast notification: success
          dispatch(
            addAlert({
              name: "save-success",
              title: "OAuth2 delegation modified",
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
    props.onDelegationChange(props.originalDelegation);
    dispatch(
      addAlert({
        name: "revert-success",
        title: "OAuth2 delegation data reverted",
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
          data-cy="oauth2-delegations-tab-settings-button-refresh"
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
          data-cy="oauth2-delegations-tab-settings-button-revert"
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
          data-cy="oauth2-delegations-tab-settings-button-save"
          isDisabled={!props.isModified || isSaving}
          type="submit"
          form="oauth2-delegations-settings-form"
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
          id="oauth2delegation-settings"
          text="OAuth2 delegation settings"
        />
        <Form
          className="pf-v6-u-mt-sm pf-v6-u-mb-lg pf-v6-u-mr-md"
          id="oauth2-delegations-settings-form"
          onSubmit={onSave}
        >
          <FormGroup label="Description" fieldId="description">
            <IpaTextArea
              dataCy="oauth2-delegations-tab-settings-textbox-description"
              name="description"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2delegation"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup label="Source workload" fieldId="oauth2delegatesource">
            <IpaTextInput
              dataCy="oauth2-delegations-tab-settings-textbox-oauth2delegatesource"
              name="oauth2delegatesource"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2delegation"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup
            label="Target users/groups"
            fieldId="oauth2delegatetarget"
          >
            <IpaTextArea
              dataCy="oauth2-delegations-tab-settings-textbox-oauth2delegatetarget"
              name="oauth2delegatetarget"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2delegation"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup label="Permitted scopes" fieldId="oauth2delegatescope">
            <IpaTextArea
              dataCy="oauth2-delegations-tab-settings-textbox-oauth2delegatescope"
              name="oauth2delegatescope"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2delegation"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup
            label="Hostgroup restrictions"
            fieldId="oauth2delegatehostgroup"
          >
            <IpaTextArea
              dataCy="oauth2-delegations-tab-settings-textbox-oauth2delegatehostgroup"
              name="oauth2delegatehostgroup"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2delegation"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup label="Service principals" fieldId="oauth2delegateservice">
            <IpaTextArea
              dataCy="oauth2-delegations-tab-settings-textbox-oauth2delegateservice"
              name="oauth2delegateservice"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2delegation"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup label="Expiry" fieldId="oauth2delegatenotafter">
            <IpaTextInput
              dataCy="oauth2-delegations-tab-settings-textbox-oauth2delegatenotafter"
              name="oauth2delegatenotafter"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2delegation"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup
            label="Require attestation"
            fieldId="oauth2requireattestation"
          >
            <IpaCheckbox
              dataCy="oauth2-delegations-tab-settings-checkbox-oauth2requireattestation"
              name="oauth2requireattestation"
              value="oauth2requireattestation"
              text=""
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2delegation"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup label="Enabled" fieldId="oauth2enabled">
            <IpaCheckbox
              dataCy="oauth2-delegations-tab-settings-checkbox-oauth2enabled"
              name="oauth2enabled"
              value="oauth2enabled"
              text=""
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2delegation"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
        </Form>
      </Flex>
    </TabLayout>
  );
};

export default OAuth2DelegationsSettings;
