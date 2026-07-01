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
import { asRecord } from "src/utils/selfServiceUtils";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import useUpdateRoute from "src/hooks/useUpdateRoute";
// Data types
import {
  SelfServicePermission,
  Metadata,
} from "src/utils/datatypes/globalDataTypes";
// RPC
import { ErrorResult } from "src/services/rpc";
import { useSaveSelfServiceMutation } from "src/services/rpcSelfService";

interface PropsToSettings {
  selfService: Partial<SelfServicePermission>;
  originalSelfService: Partial<SelfServicePermission>;
  metadata: Metadata;
  onSelfServiceChange: (selfService: Partial<SelfServicePermission>) => void;
  onRefresh: () => void;
  isModified: boolean;
  isDataLoading?: boolean;
  modifiedValues: () => Partial<SelfServicePermission>;
  onResetValues: () => void;
  onOpenContextualPanel?: () => void;
}

const SelfServiceSettings = (props: PropsToSettings) => {
  const dispatch = useAppDispatch();

  // API
  const [saveSelfService] = useSaveSelfServiceMutation();

  // Update current route data to Redux
  useUpdateRoute({ pathname: "self-service", noBreadcrumb: true });

  // Get 'ipaObject' and 'recordOnChange' to use in form fields
  const { ipaObject, recordOnChange } = asRecord(
    props.selfService,
    props.onSelfServiceChange
  );

  const [isSaving, setSaving] = useState(false);

  // 'Save' handler method
  const onSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const modifiedValues = props.modifiedValues();
    modifiedValues.aciname = props.selfService.aciname;
    setSaving(true);

    saveSelfService(modifiedValues).then((response) => {
      if ("data" in response) {
        if (response.data?.result) {
          dispatch(
            addAlert({
              name: "save-success",
              title: "Self service permission modified",
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
    props.onSelfServiceChange(props.originalSelfService);
    dispatch(
      addAlert({
        name: "revert-success",
        title: "Self service permission data reverted",
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
          data-cy="self-service-tab-settings-button-refresh"
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
          data-cy="self-service-tab-settings-button-revert"
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
          data-cy="self-service-tab-settings-button-save"
          isDisabled={!props.isModified || isSaving}
          type="submit"
          form="self-service-settings-form"
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
              id="self-service-settings"
              text="Self service permission settings"
            />
            <Form
              className="pf-v6-u-mt-sm pf-v6-u-mb-lg pf-v6-u-mr-md"
              id="self-service-settings-form"
              isHorizontal
              onSubmit={onSave}
            >
              <FormGroup label="Self service name" fieldId="aciname">
                <IpaTextInput
                  dataCy="self-service-tab-settings-textinput-aciname"
                  name="aciname"
                  ariaLabel="Self service name"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="selfservice"
                  metadata={props.metadata}
                  readOnly
                />
              </FormGroup>
              <FormGroup
                label="Attributes"
                fieldId="attrs"
              >
                <IpaTextArea
                  dataCy="self-service-tab-settings-textarea-attrs"
                  name="attrs"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="selfservice"
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

export default SelfServiceSettings;
