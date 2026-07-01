import React, { useState } from "react";
// PatternFly
import {
  Button,
  Flex,
  Form,
  FormGroup,
  Label,
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
import { asRecord } from "src/utils/caclsUtils";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import useUpdateRoute from "src/hooks/useUpdateRoute";
// Data types
import { CertACL, Metadata } from "src/utils/datatypes/globalDataTypes";
// RPC
import { ErrorResult } from "src/services/rpc";
import { useSaveCACLMutation } from "src/services/rpcCACLs";

interface PropsToSettings {
  cacl: Partial<CertACL>;
  originalCACL: Partial<CertACL>;
  metadata: Metadata;
  onCACLChange: (cacl: Partial<CertACL>) => void;
  onRefresh: () => void;
  isModified: boolean;
  isDataLoading?: boolean;
  modifiedValues: () => Partial<CertACL>;
  onResetValues: () => void;
  onOpenContextualPanel?: () => void;
}

const CACLsSettings = (props: PropsToSettings) => {
  const dispatch = useAppDispatch();

  // API
  const [saveCACL] = useSaveCACLMutation();

  // Update current route data to Redux and highlight the current page in the Nav bar
  useUpdateRoute({ pathname: "ca-acls", noBreadcrumb: true });

  // Get 'ipaObject' and 'recordOnChange' to use in form fields
  const { ipaObject, recordOnChange } = asRecord(
    props.cacl,
    props.onCACLChange
  );

  const [isSaving, setSaving] = useState(false);

  // 'Save' handler method
  const onSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const modifiedValues = props.modifiedValues();
    modifiedValues.cn = props.cacl.cn;
    setSaving(true);

    saveCACL(modifiedValues).then((response) => {
      if ("data" in response) {
        if (response.data?.result) {
          dispatch(
            addAlert({
              name: "save-success",
              title: "CA ACL modified",
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
    props.onCACLChange(props.originalCACL);
    dispatch(
      addAlert({
        name: "revert-success",
        title: "CA ACL data reverted",
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
          data-cy="cacls-tab-settings-button-refresh"
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
          data-cy="cacls-tab-settings-button-revert"
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
          data-cy="cacls-tab-settings-button-save"
          isDisabled={!props.isModified || isSaving}
          type="submit"
          form="cacls-settings-form"
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
              id="cacl-settings"
              text="CA ACL settings"
            />
            <Form
              className="pf-v6-u-mt-sm pf-v6-u-mb-lg pf-v6-u-mr-md"
              id="cacls-settings-form"
              isHorizontal
              onSubmit={onSave}
            >
              <FormGroup label="ACL name" fieldId="cn">
                <IpaTextInput
                  dataCy="cacls-tab-settings-textinput-cn"
                  name="cn"
                  ariaLabel="ACL name"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="caacl"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup label="Description" fieldId="description">
                <IpaTextArea
                  dataCy="cacls-tab-settings-textarea-description"
                  name="description"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="caacl"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup label="Enabled" fieldId="ipaenabledflag">
                <Label
                  data-cy="cacls-tab-settings-label-ipaenabledflag"
                  color={ipaObject.ipaenabledflag ? "green" : "red"}
                >
                  {ipaObject.ipaenabledflag ? "Enabled" : "Disabled"}
                </Label>
              </FormGroup>
              <FormGroup label="CA category" fieldId="ipacacategory">
                <IpaTextInput
                  dataCy="cacls-tab-settings-textinput-ipacacategory"
                  name="ipacacategory"
                  ariaLabel="CA category"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="caacl"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup
                label="Certificate profile category"
                fieldId="ipacertprofilecategory"
              >
                <IpaTextInput
                  dataCy="cacls-tab-settings-textinput-ipacertprofilecategory"
                  name="ipacertprofilecategory"
                  ariaLabel="Certificate profile category"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="caacl"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup label="User category" fieldId="usercategory">
                <IpaTextInput
                  dataCy="cacls-tab-settings-textinput-usercategory"
                  name="usercategory"
                  ariaLabel="User category"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="caacl"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup label="Host category" fieldId="hostcategory">
                <IpaTextInput
                  dataCy="cacls-tab-settings-textinput-hostcategory"
                  name="hostcategory"
                  ariaLabel="Host category"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="caacl"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup label="Service category" fieldId="servicecategory">
                <IpaTextInput
                  dataCy="cacls-tab-settings-textinput-servicecategory"
                  name="servicecategory"
                  ariaLabel="Service category"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="caacl"
                  metadata={props.metadata}
                />
              </FormGroup>
            </Form>
          </Flex>
        </SidebarContent>
      </Sidebar>
    </TabLayout>
  );
};

export default CACLsSettings;
