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
import { asOAuth2WorkloadRecord } from "../../utils/oauth2Utils";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import useUpdateRoute from "src/hooks/useUpdateRoute";
// Data types
import { OAuth2Workload, Metadata } from "../../utils/datatypes/globalDataTypes";
// RPC
import { ErrorResult } from "src/services/rpc";
import { useSaveWorkloadMutation } from "src/services/rpcOAuth2";

interface PropsToSettings {
  workload: Partial<OAuth2Workload>;
  originalWorkload: Partial<OAuth2Workload>;
  metadata: Metadata;
  onWorkloadChange: (workload: Partial<OAuth2Workload>) => void;
  onRefresh: () => void;
  isModified: boolean;
  isDataLoading?: boolean;
  modifiedValues: () => Partial<OAuth2Workload>;
  onResetValues: () => void;
}

const WorkloadsSettings = (props: PropsToSettings) => {
  const dispatch = useAppDispatch();

  // API
  const [saveWorkload] = useSaveWorkloadMutation();

  // Update current route data to Redux and highlight the current page in the Nav bar
  useUpdateRoute({ pathname: "workloads", noBreadcrumb: true });

  // Get 'ipaObject' and 'recordOnChange' to use in 'IpaTextInput'
  const { ipaObject, recordOnChange } = asOAuth2WorkloadRecord(
    props.workload,
    props.onWorkloadChange
  );

  const [isSaving, setSaving] = useState(false);

  // 'Save' handler method
  const onSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const modifiedValues = props.modifiedValues();
    modifiedValues.cn = props.workload.cn;
    setSaving(true);

    saveWorkload(modifiedValues).then((response) => {
      if ("data" in response) {
        if (response.data?.result) {
          // Show toast notification: success
          dispatch(
            addAlert({
              name: "save-success",
              title: "OAuth2 workload modified",
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
    props.onWorkloadChange(props.originalWorkload);
    dispatch(
      addAlert({
        name: "revert-success",
        title: "OAuth2 workload data reverted",
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
          data-cy="workloads-tab-settings-button-refresh"
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
          data-cy="workloads-tab-settings-button-revert"
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
          data-cy="workloads-tab-settings-button-save"
          isDisabled={!props.isModified || isSaving}
          type="submit"
          form="workloads-settings-form"
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
          id="oauth2workload-settings"
          text="OAuth2 workload settings"
        />
        <Form
          className="pf-v6-u-mt-sm pf-v6-u-mb-lg pf-v6-u-mr-md"
          id="workloads-settings-form"
          onSubmit={onSave}
        >
          <FormGroup label="Description" fieldId="description">
            <IpaTextArea
              dataCy="workloads-tab-settings-textbox-description"
              name="description"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2workload"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup label="Workload Type" fieldId="oauth2workloadtype">
            <IpaTextInput
              dataCy="workloads-tab-settings-textbox-oauth2workloadtype"
              name="oauth2workloadtype"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2workload"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup label="SPIFFE ID" fieldId="oauth2spiffeid">
            <IpaTextInput
              dataCy="workloads-tab-settings-textbox-oauth2spiffeid"
              name="oauth2spiffeid"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2workload"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup label="Owner" fieldId="oauth2workloadowner">
            <IpaTextInput
              dataCy="workloads-tab-settings-textbox-oauth2workloadowner"
              name="oauth2workloadowner"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2workload"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup label="Client" fieldId="oauth2workloadclient">
            <IpaTextInput
              dataCy="workloads-tab-settings-textbox-oauth2workloadclient"
              name="oauth2workloadclient"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2workload"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup
            label="Service Principal"
            fieldId="oauth2workloadserviceprincipal"
          >
            <IpaTextInput
              dataCy="workloads-tab-settings-textbox-oauth2workloadserviceprincipal"
              name="oauth2workloadserviceprincipal"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2workload"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup
            label="Max Token Lifetime"
            fieldId="oauth2workloadmaxtokenlifetime"
          >
            <IpaTextInput
              dataCy="workloads-tab-settings-textbox-oauth2workloadmaxtokenlifetime"
              name="oauth2workloadmaxtokenlifetime"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2workload"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup label="Vendor" fieldId="oauth2workloadvendor">
            <IpaTextInput
              dataCy="workloads-tab-settings-textbox-oauth2workloadvendor"
              name="oauth2workloadvendor"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2workload"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup label="Skills" fieldId="oauth2workloadskill">
            <IpaTextArea
              dataCy="workloads-tab-settings-textbox-oauth2workloadskill"
              name="oauth2workloadskill"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2workload"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup label="Card TTL" fieldId="oauth2workloadcardttl">
            <IpaTextInput
              dataCy="workloads-tab-settings-textbox-oauth2workloadcardttl"
              name="oauth2workloadcardttl"
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2workload"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
          <FormGroup label="Enabled" fieldId="oauth2enabled">
            <IpaCheckbox
              dataCy="workloads-tab-settings-checkbox-oauth2enabled"
              name="oauth2enabled"
              value="oauth2enabled"
              text=""
              ipaObject={ipaObject}
              onChange={recordOnChange}
              objectName="oauth2workload"
              metadata={props.metadata}
              alwaysWritable={true}
            />
          </FormGroup>
        </Form>
      </Flex>
    </TabLayout>
  );
};

export default WorkloadsSettings;
