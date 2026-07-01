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
// Layouts
import TitleLayout from "src/components/layouts/TitleLayout";
import HelpTextWithIconLayout from "src/components/layouts/HelpTextWithIconLayout";
import TabLayout from "src/components/layouts/TabLayout";
// Utils
import { asRecord } from "src/utils/delegationUtils";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import useUpdateRoute from "src/hooks/useUpdateRoute";
// Data types
import {
  DelegationPermission,
  Metadata,
} from "src/utils/datatypes/globalDataTypes";
// RPC
import { ErrorResult } from "src/services/rpc";
import { useSaveDelegationMutation } from "src/services/rpcDelegation";
// IPA Object utils
import IpaCheckboxes from "src/components/Form/IpaCheckboxes";
import IpaTextboxList from "src/components/Form/IpaTextboxList";

interface PropsToSettings {
  delegation: Partial<DelegationPermission>;
  originalDelegation: Partial<DelegationPermission>;
  metadata: Metadata;
  onDelegationChange: (delegation: Partial<DelegationPermission>) => void;
  onRefresh: () => void;
  isModified: boolean;
  isDataLoading?: boolean;
  modifiedValues: () => Partial<DelegationPermission>;
  onResetValues: () => void;
  onOpenContextualPanel?: () => void;
}

const DelegationSettings = (props: PropsToSettings) => {
  const dispatch = useAppDispatch();

  // API
  const [saveDelegation] = useSaveDelegationMutation();

  // Update current route data to Redux and highlight the current page in the Nav bar
  useUpdateRoute({ pathname: "delegation", noBreadcrumb: true });

  // Get 'ipaObject' and 'recordOnChange' to use in form fields
  const { ipaObject, recordOnChange } = asRecord(
    props.delegation,
    props.onDelegationChange
  );

  const [isSaving, setSaving] = useState(false);

  // 'Save' handler method
  const onSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const modifiedValues = props.modifiedValues();
    modifiedValues.aciname = props.delegation.aciname;
    setSaving(true);

    saveDelegation(modifiedValues).then((response) => {
      if ("data" in response) {
        if (response.data?.result) {
          dispatch(
            addAlert({
              name: "save-success",
              title: "Delegation modified",
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
    props.onDelegationChange(props.originalDelegation);
    dispatch(
      addAlert({
        name: "revert-success",
        title: "Delegation data reverted",
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
          data-cy="delegation-tab-settings-button-refresh"
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
          data-cy="delegation-tab-settings-button-revert"
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
          data-cy="delegation-tab-settings-button-save"
          isDisabled={!props.isModified || isSaving}
          type="submit"
          form="delegation-settings-form"
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
              headingLevel="h1"
              id="delegation-settings"
              text="Delegation settings"
            />
            <Form
              className="pf-v6-u-mt-sm pf-v6-u-mb-lg pf-v6-u-mr-md"
              id="delegation-settings-form"
              isHorizontal
              onSubmit={onSave}
            >
              <FormGroup label="Delegation name" fieldId="aciname">
                <IpaTextInput
                  dataCy="delegation-tab-settings-textinput-aciname"
                  name="aciname"
                  ariaLabel="Delegation name"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="delegation"
                  metadata={props.metadata}
                  readOnly={true}
                />
              </FormGroup>
              <FormGroup
                label="Delegated group"
                fieldId="group"
              >
                <IpaTextInput
                  dataCy="delegation-tab-settings-textinput-group"
                  name="group"
                  ariaLabel="Delegated group"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="delegation"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup
                label="Member group"
                fieldId="memberof"
              >
                <IpaTextInput
                  dataCy="delegation-tab-settings-textinput-memberof"
                  name="memberof"
                  ariaLabel="Member group"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="delegation"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup label="Permissions" fieldId="permissions">
                <IpaCheckboxes
                  dataCy="delegation-tab-settings-checkboxes-permissions"
                  name="permissions"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="delegation"
                  metadata={props.metadata}
                  options={[
                    { value: "read", text: "Read" },
                    { value: "write", text: "Write" },
                  ]}
                />
              </FormGroup>
              <FormGroup label="Attributes" fieldId="attrs">
                <IpaTextboxList
                  dataCy="delegation-tab-settings-textboxlist-attrs"
                  name="attrs"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="delegation"
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

export default DelegationSettings;
