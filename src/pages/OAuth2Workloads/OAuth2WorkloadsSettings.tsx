import React from "react";
// PatternFly
import {
  Button,
  CodeBlock,
  CodeBlockCode,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  JumpLinks,
  JumpLinksItem,
  Sidebar,
  SidebarContent,
  SidebarPanel,
} from "@patternfly/react-core";
// Data types
import { Metadata } from "src/utils/datatypes/globalDataTypes";
import { OAuth2Workload } from "src/hooks/useOAuth2WorkloadSettingsData";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import useUpdateRoute from "src/hooks/useUpdateRoute";
import { addAlert } from "src/store/Global/alerts-slice";
// Utils
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asRecord = (
  element: Record<string, any>,
  onElementChange: (element: Record<string, any>) => void
) => {
  const ipaObject = element as Record<string, any>;
  function recordOnChange(ipaObject: Record<string, any>) {
    onElementChange(ipaObject);
  }
  return { ipaObject, recordOnChange };
};
// Icons
import { OutlinedQuestionCircleIcon } from "@patternfly/react-icons";
// RPC
import {
  OAuth2WorkloadModPayload,
  useOauth2WorkloadModMutation,
  useLazyOauth2WorkloadShowCardQuery,
} from "src/services/rpcOAuth2";
// Components
import IpaTextInput from "src/components/Form/IpaTextInput/IpaTextInput";
import IpaNumberInput from "src/components/Form/IpaNumberInput";
import IpaTextArea from "src/components/Form/IpaTextArea";
import TabLayout from "src/components/layouts/TabLayout";
import SecondaryButton from "src/components/layouts/SecondaryButton";
import HelpTextWithIconLayout from "src/components/layouts/HelpTextWithIconLayout";
import IpaTextContent from "src/components/Form/IpaTextContent/IpaTextContent";
import TitleLayout from "src/components/layouts/TitleLayout";

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
  pathname: string;
}

const OAuth2WorkloadsSettings = (props: PropsToSettings) => {
  const dispatch = useAppDispatch();

  useUpdateRoute({ pathname: props.pathname });

  const [isDataLoading, setIsDataLoading] = React.useState(false);
  const [cardPreview, setCardPreview] = React.useState<string | null>(null);
  const [isCardLoading, setIsCardLoading] = React.useState(false);

  const { ipaObject, recordOnChange } = asRecord(
    props.workload,
    props.onWorkloadChange
  );

  const [saveWorkload] = useOauth2WorkloadModMutation();
  const [fetchShowCard] = useLazyOauth2WorkloadShowCardQuery();

  const onPreviewCard = () => {
    const workloadName = props.workload.cn?.toString();
    if (!workloadName) return;

    setIsCardLoading(true);
    setCardPreview(null);
    fetchShowCard(workloadName).then((response) => {
      setIsCardLoading(false);
      if (response.data) {
        setCardPreview(JSON.stringify(response.data, null, 2));
      } else if (response.error) {
        setCardPreview("Error loading agent card");
      }
    });
  };

  const onRevert = () => {
    props.onWorkloadChange(props.originalWorkload);
    props.onRefresh();
    dispatch(
      addAlert({
        name: "revert-success",
        title: "Workload identity data reverted",
        variant: "success",
      })
    );
  };

  const buildPayload = (
    modifiedValues: Partial<OAuth2Workload>,
    keyArray: string[]
  ): OAuth2WorkloadModPayload => {
    const payload: OAuth2WorkloadModPayload = {
      workloadName: props.workload.cn?.toString() as string,
    };

    keyArray.forEach((key) => {
      if (modifiedValues[key] !== undefined) {
        if (modifiedValues[key] === "") {
          payload[key] = [];
        } else {
          payload[key] = modifiedValues[key];
        }
      }
    });
    return payload;
  };

  const onSave = () => {
    setIsDataLoading(true);
    const modifiedValues = props.modifiedValues();

    const payload = buildPayload(modifiedValues, [
      "oauth2workloadtype",
      "oauth2spiffeid",
      "oauth2workloadowner",
      "oauth2workloadclient",
      "oauth2workloadserviceprincipal",
      "oauth2enabled",
      "oauth2maxtokenlifetime",
      "oauth2workloadskill",
      "oauth2workloadcardttl",
      "description",
    ]);

    saveWorkload(payload).then((response) => {
      if ("data" in response) {
        const data = response.data;
        if (data?.error) {
          dispatch(
            addAlert({
              name: "error",
              title: (data.error as Error).message,
              variant: "danger",
            })
          );
        }
        if (data?.result) {
          props.onWorkloadChange(data.result.result);
          dispatch(
            addAlert({
              name: "success",
              title:
                "Workload identity '" + props.workload.cn + "' updated",
              variant: "success",
            })
          );
          props.onResetValues();
        }
      }
      setIsDataLoading(false);
    });
  };

  const toolbarFields = [
    {
      key: 0,
      element: (
        <SecondaryButton
          dataCy="oauth2-workloads-tab-settings-button-refresh"
          onClickHandler={props.onRefresh}
        >
          Refresh
        </SecondaryButton>
      ),
    },
    {
      key: 1,
      element: (
        <SecondaryButton
          dataCy="oauth2-workloads-tab-settings-button-revert"
          isDisabled={!props.isModified || isDataLoading}
          onClickHandler={onRevert}
        >
          Revert
        </SecondaryButton>
      ),
    },
    {
      key: 2,
      element: (
        <SecondaryButton
          dataCy="oauth2-workloads-tab-settings-button-save"
          isDisabled={!props.isModified || isDataLoading}
          onClickHandler={onSave}
        >
          Save
        </SecondaryButton>
      ),
    },
  ];

  return (
    <TabLayout id="settings-page" toolbarItems={toolbarFields}>
      <Sidebar isPanelRight>
        <SidebarPanel variant="sticky">
          <HelpTextWithIconLayout
            textContent="Help"
            icon={
              <OutlinedQuestionCircleIcon className="pf-v6-u-primary-color-100 pf-v6-u-mr-sm" />
            }
          />
          <JumpLinks
            isVertical
            label="Jump to section"
            scrollableSelector="#oauth2-workload-page"
            expandable={{ default: "expandable", md: "nonExpandable" }}
            className="pf-v6-u-mt-md"
          >
            <JumpLinksItem key={0} href="#general-settings">
              General
            </JumpLinksItem>
            <JumpLinksItem key={1} href="#identity-settings">
              Identity
            </JumpLinksItem>
            <JumpLinksItem key={2} href="#token-settings">
              Token settings
            </JumpLinksItem>
            <JumpLinksItem key={3} href="#agent-card-settings">
              Agent Card
            </JumpLinksItem>
          </JumpLinks>
        </SidebarPanel>
        <SidebarContent className="pf-v6-u-mr-xl">
          <TitleLayout
            key={0}
            id="general-settings"
            text="General"
            headingLevel="h2"
            className="pf-v6-u-mt-lg pf-v6-u-mb-md"
          />
          <Flex direction={{ default: "column", lg: "row" }}>
            <FlexItem flex={{ default: "flex_1" }}>
              <Form className="pf-v6-u-mb-lg">
                <FormGroup label="Name" role="group">
                  <IpaTextContent
                    dataCy="oauth2-workloads-tab-settings-textbox-cn"
                    name={"cn"}
                    ariaLabel={"Name"}
                    ipaObject={ipaObject}
                    objectName="oauth2workload"
                    metadata={props.metadata}
                  />
                </FormGroup>
                <FormGroup
                  label="Type"
                  fieldId="oauth2workloadtype"
                >
                  <IpaTextInput
                    dataCy="oauth2-workloads-tab-settings-textbox-oauth2workloadtype"
                    name={"oauth2workloadtype"}
                    ariaLabel={"Type"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2workload"
                    metadata={props.metadata}
                  />
                </FormGroup>
                <FormGroup label="Enabled" fieldId="oauth2enabled">
                  <IpaTextInput
                    dataCy="oauth2-workloads-tab-settings-textbox-oauth2enabled"
                    name={"oauth2enabled"}
                    ariaLabel={"Enabled"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2workload"
                    metadata={props.metadata}
                  />
                </FormGroup>
                <FormGroup label="Description" fieldId="description">
                  <IpaTextInput
                    dataCy="oauth2-workloads-tab-settings-textbox-description"
                    name={"description"}
                    ariaLabel={"Description"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2workload"
                    metadata={props.metadata}
                  />
                </FormGroup>
              </Form>
            </FlexItem>
          </Flex>
          <TitleLayout
            key={1}
            headingLevel="h2"
            id="identity-settings"
            text="Identity"
            className="pf-v6-u-mt-lg pf-v6-u-mb-md"
          />
          <Flex direction={{ default: "column", lg: "row" }}>
            <FlexItem flex={{ default: "flex_1" }}>
              <Form className="pf-v6-u-mb-lg">
                <FormGroup
                  label="SPIFFE ID"
                  fieldId="oauth2spiffeid"
                >
                  <IpaTextInput
                    dataCy="oauth2-workloads-tab-settings-textbox-oauth2spiffeid"
                    name={"oauth2spiffeid"}
                    ariaLabel={"SPIFFE ID"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2workload"
                    metadata={props.metadata}
                  />
                </FormGroup>
                <FormGroup
                  label="Owner"
                  fieldId="oauth2workloadowner"
                >
                  <IpaTextInput
                    dataCy="oauth2-workloads-tab-settings-textbox-oauth2workloadowner"
                    name={"oauth2workloadowner"}
                    ariaLabel={"Owner"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2workload"
                    metadata={props.metadata}
                  />
                </FormGroup>
                <FormGroup
                  label="OAuth2 client"
                  fieldId="oauth2workloadclient"
                >
                  <IpaTextInput
                    dataCy="oauth2-workloads-tab-settings-textbox-oauth2workloadclient"
                    name={"oauth2workloadclient"}
                    ariaLabel={"OAuth2 client"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2workload"
                    metadata={props.metadata}
                  />
                </FormGroup>
                <FormGroup
                  label="Vendor"
                  fieldId="oauth2workloadvendor"
                >
                  <IpaTextInput
                    dataCy="oauth2-workloads-tab-settings-textbox-oauth2workloadvendor"
                    name={"oauth2workloadvendor"}
                    ariaLabel={"Vendor"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2workload"
                    metadata={props.metadata}
                  />
                </FormGroup>
                <FormGroup
                  label="Service principal"
                  fieldId="oauth2workloadserviceprincipal"
                >
                  <IpaTextInput
                    dataCy="oauth2-workloads-tab-settings-textbox-oauth2workloadserviceprincipal"
                    name={"oauth2workloadserviceprincipal"}
                    ariaLabel={"Service principal"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2workload"
                    metadata={props.metadata}
                  />
                </FormGroup>
              </Form>
            </FlexItem>
          </Flex>
          <TitleLayout
            key={2}
            headingLevel="h2"
            id="token-settings"
            text="Token settings"
            className="pf-v6-u-mt-lg pf-v6-u-mb-md"
          />
          <Flex direction={{ default: "column", lg: "row" }}>
            <FlexItem flex={{ default: "flex_1" }}>
              <Form className="pf-v6-u-mb-lg">
                <FormGroup
                  label="Max token lifetime"
                  fieldId="oauth2maxtokenlifetime"
                >
                  <IpaTextInput
                    dataCy="oauth2-workloads-tab-settings-textbox-oauth2maxtokenlifetime"
                    name={"oauth2maxtokenlifetime"}
                    ariaLabel={"Max token lifetime"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2workload"
                    metadata={props.metadata}
                  />
                </FormGroup>
              </Form>
            </FlexItem>
          </Flex>
          <TitleLayout
            key={3}
            headingLevel="h2"
            id="agent-card-settings"
            text="Agent Card"
            className="pf-v6-u-mt-lg pf-v6-u-mb-md"
          />
          <Flex direction={{ default: "column", lg: "row" }}>
            <FlexItem flex={{ default: "flex_1" }}>
              <Form className="pf-v6-u-mb-lg">
                <FormGroup
                  label="Skills (one per line)"
                  fieldId="oauth2workloadskill"
                >
                  <IpaTextArea
                    dataCy="oauth2-workloads-tab-settings-textarea-oauth2workloadskill"
                    name={"oauth2workloadskill"}
                    ariaLabel={"Skills"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2workload"
                    metadata={props.metadata}
                  />
                </FormGroup>
                <FormGroup
                  label="Card TTL (seconds)"
                  fieldId="oauth2workloadcardttl"
                >
                  <IpaNumberInput
                    dataCy="oauth2-workloads-tab-settings-number-oauth2workloadcardttl"
                    id="oauth2workloadcardttl"
                    name={"oauth2workloadcardttl"}
                    ariaLabel={"Card TTL (seconds)"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2workload"
                    metadata={props.metadata}
                    minValue={60}
                    maxValue={86400}
                    numCharsShown={6}
                  />
                </FormGroup>
                <FormGroup fieldId="preview-card">
                  <Button
                    variant="secondary"
                    onClick={onPreviewCard}
                    isLoading={isCardLoading}
                    isDisabled={isCardLoading}
                    data-cy="oauth2-workloads-tab-settings-button-preview-card"
                  >
                    Preview Card
                  </Button>
                </FormGroup>
                {cardPreview !== null && (
                  <FormGroup
                    label="Agent Card Preview"
                    fieldId="card-preview"
                  >
                    <CodeBlock>
                      <CodeBlockCode
                        data-cy="oauth2-workloads-tab-settings-card-preview"
                      >
                        {cardPreview}
                      </CodeBlockCode>
                    </CodeBlock>
                  </FormGroup>
                )}
              </Form>
            </FlexItem>
          </Flex>
        </SidebarContent>
      </Sidebar>
    </TabLayout>
  );
};

export default OAuth2WorkloadsSettings;
