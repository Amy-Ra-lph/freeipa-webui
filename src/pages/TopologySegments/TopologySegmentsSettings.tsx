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
import { asRecord } from "src/utils/topologySegmentsUtils";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import useUpdateRoute from "src/hooks/useUpdateRoute";
// Data types
import {
  TopologySegment,
  Metadata,
} from "src/utils/datatypes/globalDataTypes";
// RPC
import { ErrorResult } from "src/services/rpc";
import { useSaveTopologySegmentMutation } from "src/services/rpcTopologySegments";

interface PropsToSettings {
  suffixCn: string;
  segment: Partial<TopologySegment>;
  originalSegment: Partial<TopologySegment>;
  metadata: Metadata;
  onSegmentChange: (segment: Partial<TopologySegment>) => void;
  onRefresh: () => void;
  isModified: boolean;
  isDataLoading?: boolean;
  modifiedValues: () => Partial<TopologySegment>;
  onResetValues: () => void;
  onOpenContextualPanel?: () => void;
}

const TopologySegmentsSettings = (props: PropsToSettings) => {
  const dispatch = useAppDispatch();

  // API
  const [saveSegment] = useSaveTopologySegmentMutation();

  // Update current route data to Redux and highlight the current page in the Nav bar
  useUpdateRoute({ pathname: "topology-segments", noBreadcrumb: true });

  // Get 'ipaObject' and 'recordOnChange' to use in form fields
  const { ipaObject, recordOnChange } = asRecord(
    props.segment,
    props.onSegmentChange
  );

  const [isSaving, setSaving] = useState(false);

  // 'Save' handler method
  const onSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const modifiedValues = props.modifiedValues();
    modifiedValues.cn = props.segment.cn;
    setSaving(true);

    saveSegment({
      suffixCn: props.suffixCn,
      segment: modifiedValues,
    }).then((response) => {
      if ("data" in response) {
        if (response.data?.result) {
          dispatch(
            addAlert({
              name: "save-success",
              title: "Topology segment modified",
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
    props.onSegmentChange(props.originalSegment);
    dispatch(
      addAlert({
        name: "revert-success",
        title: "Topology segment data reverted",
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
          data-cy="topology-segments-tab-settings-button-refresh"
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
          data-cy="topology-segments-tab-settings-button-revert"
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
          data-cy="topology-segments-tab-settings-button-save"
          isDisabled={!props.isModified || isSaving}
          type="submit"
          form="topology-segments-settings-form"
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
              id="topology-segment-settings"
              text="Topology segment settings"
            />
            <Form
              className="pf-v6-u-mt-sm pf-v6-u-mb-lg pf-v6-u-mr-md"
              id="topology-segments-settings-form"
              isHorizontal
              onSubmit={onSave}
            >
              <FormGroup label="Segment name" fieldId="cn">
                <IpaTextInput
                  dataCy="topology-segments-tab-settings-textinput-cn"
                  name="cn"
                  ariaLabel="Segment name"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="topologysegment"
                  metadata={props.metadata}
                  readOnly
                />
              </FormGroup>
              <FormGroup label="Left node" fieldId="iparepltoposegmentleftnode">
                <IpaTextInput
                  dataCy="topology-segments-tab-settings-textinput-leftnode"
                  name="iparepltoposegmentleftnode"
                  ariaLabel="Left node"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="topologysegment"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup
                label="Right node"
                fieldId="iparepltoposegmentrightnode"
              >
                <IpaTextInput
                  dataCy="topology-segments-tab-settings-textinput-rightnode"
                  name="iparepltoposegmentrightnode"
                  ariaLabel="Right node"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="topologysegment"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup
                label="Direction"
                fieldId="iparepltoposegmentdirection"
              >
                <IpaTextInput
                  dataCy="topology-segments-tab-settings-textinput-direction"
                  name="iparepltoposegmentdirection"
                  ariaLabel="Direction"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="topologysegment"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup label="Timeout" fieldId="nsds5replicatimeout">
                <IpaTextInput
                  dataCy="topology-segments-tab-settings-textinput-timeout"
                  name="nsds5replicatimeout"
                  ariaLabel="Timeout"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="topologysegment"
                  metadata={props.metadata}
                />
              </FormGroup>
              <FormGroup label="Enabled" fieldId="nsds5replicaenabled">
                <IpaTextInput
                  dataCy="topology-segments-tab-settings-textinput-enabled"
                  name="nsds5replicaenabled"
                  ariaLabel="Enabled"
                  ipaObject={ipaObject}
                  onChange={recordOnChange}
                  objectName="topologysegment"
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

export default TopologySegmentsSettings;
