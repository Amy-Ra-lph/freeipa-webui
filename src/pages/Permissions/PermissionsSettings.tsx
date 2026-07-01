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
import { asRecord } from "src/utils/permissionsUtils";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import useUpdateRoute from "src/hooks/useUpdateRoute";
// Data types
import { Permission, Metadata } from "src/utils/datatypes/globalDataTypes";
// RPC
import { ErrorResult } from "src/services/rpc";
import { useSavePermissionMutation } from "src/services/rpcPermissions";

interface PropsToSettings {
  permission: Partial<Permission>;
  originalPermission: Partial<Permission>;
  metadata: Metadata;
  onPermissionChange: (permission: Partial<Permission>) => void;
  onRefresh: () => void;
  isModified: boolean;
  isDataLoading?: boolean;
  modifiedValues: () => Partial<Permission>;
  onResetValues: () => void;
  onOpenContextualPanel?: () => void;
}

const PermissionsSettings = (props: PropsToSettings) => {
  const dispatch = useAppDispatch();

  // API
  const [savePermission] = useSavePermissionMutation();

  // Update current route data to Redux and highlight the current page in the Nav bar
  useUpdateRoute({ pathname: "permissions", noBreadcrumb: true });

  // Get 'ipaObject' and 'recordOnChange' to use in form fields
  const { ipaObject, recordOnChange } = asRecord(
    props.permission,
    props.onPermissionChange
  );

  const [isSaving, setSaving] = useState(false);

  // 'Save' handler method
  const onSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const modifiedValues = props.modifiedValues();
    modifiedValues.cn = props.permission.cn;
    setSaving(true);

    savePermission(modifiedValues).then((response) => {
      if ("data" in response) {
        if (response.data?.result) {
          dispatch(
            addAlert({
              name: "save-success",
              title: "Permission modified",
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
    props.onPermissionChange(props.originalPermission);
    dispatch(
      addAlert({
        name: "revert-success",
        title: "Permission data reverted",
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
          data-cy="permissions-tab-settings-button-refresh"
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
          data-cy="permissions-tab-settings-button-revert"
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
          data-cy="permissions-tab-settings-button-save"
          isDisabled={!props.isModified || isSaving}
          type="submit"
          form="permissions-settings-form"
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
              id="permission-settings"
              text="Permission settings"
            />
            <Form
              className="pf-v6-u-mt-sm pf-v6-u-mb-lg pf-v6-u-mr-md"
              id="permissions-settings-form"
              isHorizontal
              onSubmit={onSave}
            >
              <FormGroup label="Permission name" fieldId="cn">
                <IpaTextInput
                  dataCy="permissions-tab-settings-textinput-cn"
                  name="cn"
                  ariaLabel="Permission name"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="permission"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup label="Description" fieldId="description">
                <IpaTextArea
                  dataCy="permissions-tab-settings-textarea-description"
                  name="description"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="permission"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup label="Rights" fieldId="ipapermright">
                <IpaTextInput
                  dataCy="permissions-tab-settings-textinput-ipapermright"
                  name="ipapermright"
                  ariaLabel="Rights"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="permission"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup label="Bind rule type" fieldId="ipapermbindruletype">
                <IpaTextInput
                  dataCy="permissions-tab-settings-textinput-ipapermbindruletype"
                  name="ipapermbindruletype"
                  ariaLabel="Bind rule type"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="permission"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup label="Type" fieldId="type">
                <IpaTextInput
                  dataCy="permissions-tab-settings-textinput-type"
                  name="type"
                  ariaLabel="Type"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="permission"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup label="Attributes" fieldId="attrs">
                <IpaTextInput
                  dataCy="permissions-tab-settings-textinput-attrs"
                  name="attrs"
                  ariaLabel="Attributes"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="permission"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup label="Subtree" fieldId="ipapermlocation">
                <IpaTextInput
                  dataCy="permissions-tab-settings-textinput-ipapermlocation"
                  name="ipapermlocation"
                  ariaLabel="Subtree"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="permission"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup label="Target DN" fieldId="ipapermtarget">
                <IpaTextInput
                  dataCy="permissions-tab-settings-textinput-ipapermtarget"
                  name="ipapermtarget"
                  ariaLabel="Target DN"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="permission"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup label="Target filter" fieldId="ipapermtargetfilter">
                <IpaTextInput
                  dataCy="permissions-tab-settings-textinput-ipapermtargetfilter"
                  name="ipapermtargetfilter"
                  ariaLabel="Target filter"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="permission"
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

export default PermissionsSettings;
