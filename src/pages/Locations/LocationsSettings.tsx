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
import { asRecord } from "src/utils/locationsUtils";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import useUpdateRoute from "src/hooks/useUpdateRoute";
// Data types
import { Location, Metadata } from "src/utils/datatypes/globalDataTypes";
// RPC
import { ErrorResult } from "src/services/rpc";
import { useSaveLocationMutation } from "src/services/rpcLocations";

interface PropsToSettings {
  location: Partial<Location>;
  originalLocation: Partial<Location>;
  metadata: Metadata;
  onLocationChange: (location: Partial<Location>) => void;
  onRefresh: () => void;
  isModified: boolean;
  isDataLoading?: boolean;
  modifiedValues: () => Partial<Location>;
  onResetValues: () => void;
  onOpenContextualPanel?: () => void;
}

const LocationsSettings = (props: PropsToSettings) => {
  const dispatch = useAppDispatch();

  // API
  const [saveLocation] = useSaveLocationMutation();

  // Update current route data to Redux and highlight the current page in the Nav bar
  useUpdateRoute({ pathname: "locations", noBreadcrumb: true });

  // Get 'ipaObject' and 'recordOnChange' to use in form fields
  const { ipaObject, recordOnChange } = asRecord(
    props.location,
    props.onLocationChange
  );

  const [isSaving, setSaving] = useState(false);

  // 'Save' handler method
  const onSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const modifiedValues = props.modifiedValues();
    modifiedValues.idnsname = props.location.idnsname;
    setSaving(true);

    saveLocation(modifiedValues).then((response) => {
      if ("data" in response) {
        if (response.data?.result) {
          dispatch(
            addAlert({
              name: "save-success",
              title: "Location modified",
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
    props.onLocationChange(props.originalLocation);
    dispatch(
      addAlert({
        name: "revert-success",
        title: "Location data reverted",
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
          data-cy="locations-tab-settings-button-refresh"
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
          data-cy="locations-tab-settings-button-revert"
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
          data-cy="locations-tab-settings-button-save"
          isDisabled={!props.isModified || isSaving}
          type="submit"
          form="locations-settings-form"
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
              id="location-settings"
              text="Location settings"
            />
            <Form
              className="pf-v6-u-mt-sm pf-v6-u-mb-lg pf-v6-u-mr-md"
              id="locations-settings-form"
              isHorizontal
              onSubmit={onSave}
            >
              <FormGroup label="Location name" fieldId="idnsname">
                <IpaTextInput
                  dataCy="locations-tab-settings-textinput-idnsname"
                  name="idnsname"
                  ariaLabel="Location name"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="location"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup label="Description" fieldId="description">
                <IpaTextArea
                  dataCy="locations-tab-settings-textarea-description"
                  name="description"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="location"
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

export default LocationsSettings;
