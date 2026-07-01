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
import IpaCheckbox from "src/components/Form/IpaCheckbox";
// Layouts
import TitleLayout from "src/components/layouts/TitleLayout";
import HelpTextWithIconLayout from "src/components/layouts/HelpTextWithIconLayout";
import TabLayout from "src/components/layouts/TabLayout";
// Utils
import { asRecord } from "src/utils/certProfilesUtils";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import useUpdateRoute from "src/hooks/useUpdateRoute";
// Data types
import { CertProfile, Metadata } from "src/utils/datatypes/globalDataTypes";
// RPC
import { ErrorResult } from "src/services/rpc";
import { useSaveCertProfileMutation } from "src/services/rpcCertProfiles";

interface PropsToSettings {
  certProfile: Partial<CertProfile>;
  originalCertProfile: Partial<CertProfile>;
  metadata: Metadata;
  onCertProfileChange: (certProfile: Partial<CertProfile>) => void;
  onRefresh: () => void;
  isModified: boolean;
  isDataLoading?: boolean;
  modifiedValues: () => Partial<CertProfile>;
  onResetValues: () => void;
  onOpenContextualPanel?: () => void;
}

const CertProfilesSettings = (props: PropsToSettings) => {
  const dispatch = useAppDispatch();

  // API
  const [saveCertProfile] = useSaveCertProfileMutation();

  // Update current route data to Redux and highlight the current page in the Nav bar
  useUpdateRoute({ pathname: "cert-profiles", noBreadcrumb: true });

  // Get 'ipaObject' and 'recordOnChange' to use in form fields
  const { ipaObject, recordOnChange } = asRecord(
    props.certProfile,
    props.onCertProfileChange
  );

  const [isSaving, setSaving] = useState(false);

  // 'Save' handler method
  const onSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const modifiedValues = props.modifiedValues();
    modifiedValues.cn = props.certProfile.cn;
    setSaving(true);

    saveCertProfile(modifiedValues).then((response) => {
      if ("data" in response) {
        if (response.data?.result) {
          dispatch(
            addAlert({
              name: "save-success",
              title: "Certificate profile modified",
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
    props.onCertProfileChange(props.originalCertProfile);
    dispatch(
      addAlert({
        name: "revert-success",
        title: "Certificate profile data reverted",
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
          data-cy="certprofiles-tab-settings-button-refresh"
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
          data-cy="certprofiles-tab-settings-button-revert"
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
          data-cy="certprofiles-tab-settings-button-save"
          isDisabled={!props.isModified || isSaving}
          type="submit"
          form="certprofiles-settings-form"
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
              id="certprofile-settings"
              text="Certificate profile settings"
            />
            <Form
              className="pf-v6-u-mt-sm pf-v6-u-mb-lg pf-v6-u-mr-md"
              id="certprofiles-settings-form"
              isHorizontal
              onSubmit={onSave}
            >
              <FormGroup label="Profile name" fieldId="cn">
                <IpaTextInput
                  dataCy="certprofiles-tab-settings-textinput-cn"
                  name="cn"
                  ariaLabel="Profile name"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="certprofile"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup label="Description" fieldId="description">
                <IpaTextArea
                  dataCy="certprofiles-tab-settings-textarea-description"
                  name="description"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="certprofile"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup
                label="Store issued certificates"
                fieldId="ipacertprofilestoreissued"
              >
                <IpaCheckbox
                  dataCy="certprofiles-tab-settings-checkbox-storeissued"
                  name="ipacertprofilestoreissued"
                  value="ipacertprofilestoreissued"
                  text="Store issued certificates"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="certprofile"
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

export default CertProfilesSettings;
