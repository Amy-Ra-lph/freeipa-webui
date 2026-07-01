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
import { asRecord } from "src/utils/topologySuffixesUtils";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import useUpdateRoute from "src/hooks/useUpdateRoute";
// Data types
import { TopologySuffix, Metadata } from "src/utils/datatypes/globalDataTypes";
// RPC
import { ErrorResult } from "src/services/rpc";
import { useSaveTopologySuffixMutation } from "src/services/rpcTopologySuffixes";

interface PropsToSettings {
  suffix: Partial<TopologySuffix>;
  originalSuffix: Partial<TopologySuffix>;
  metadata: Metadata;
  onSuffixChange: (suffix: Partial<TopologySuffix>) => void;
  onRefresh: () => void;
  isModified: boolean;
  isDataLoading?: boolean;
  modifiedValues: () => Partial<TopologySuffix>;
  onResetValues: () => void;
  onOpenContextualPanel?: () => void;
}

const TopologySuffixesSettings = (props: PropsToSettings) => {
  const dispatch = useAppDispatch();

  // API
  const [saveSuffix] = useSaveTopologySuffixMutation();

  // Update current route data to Redux and highlight the current page in the Nav bar
  useUpdateRoute({ pathname: "topology-suffixes", noBreadcrumb: true });

  // Get 'ipaObject' and 'recordOnChange' to use in form fields
  const { ipaObject, recordOnChange } = asRecord(
    props.suffix,
    props.onSuffixChange
  );

  const [isSaving, setSaving] = useState(false);

  // 'Save' handler method
  const onSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const modifiedValues = props.modifiedValues();
    modifiedValues.cn = props.suffix.cn;
    setSaving(true);

    saveSuffix(modifiedValues).then((response) => {
      if ("data" in response) {
        if (response.data?.result) {
          dispatch(
            addAlert({
              name: "save-success",
              title: "Topology suffix modified",
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
    props.onSuffixChange(props.originalSuffix);
    dispatch(
      addAlert({
        name: "revert-success",
        title: "Topology suffix data reverted",
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
          data-cy="topology-suffixes-tab-settings-button-refresh"
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
          data-cy="topology-suffixes-tab-settings-button-revert"
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
          data-cy="topology-suffixes-tab-settings-button-save"
          isDisabled={!props.isModified || isSaving}
          type="submit"
          form="topology-suffixes-settings-form"
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
              id="topology-suffix-settings"
              text="Topology suffix settings"
            />
            <Form
              className="pf-v6-u-mt-sm pf-v6-u-mb-lg pf-v6-u-mr-md"
              id="topology-suffixes-settings-form"
              isHorizontal
              onSubmit={onSave}
            >
              <FormGroup label="Suffix name" fieldId="cn">
                <IpaTextInput
                  dataCy="topology-suffixes-tab-settings-textinput-cn"
                  name="cn"
                  ariaLabel="Suffix name"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="topologysuffix"
                  metadata={props.metadata}
                  readOnly
                />
              </FormGroup>
              <FormGroup label="Suffix DN" fieldId="iparepltopoconfroot">
                <IpaTextInput
                  dataCy="topology-suffixes-tab-settings-textinput-iparepltopoconfroot"
                  name="iparepltopoconfroot"
                  ariaLabel="Suffix DN"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="topologysuffix"
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

export default TopologySuffixesSettings;
