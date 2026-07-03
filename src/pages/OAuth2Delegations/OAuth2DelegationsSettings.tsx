import React from "react";
// PatternFly
import {
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
import { OAuth2Delegation } from "src/hooks/useOAuth2DelegationSettingsData";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import useUpdateRoute from "src/hooks/useUpdateRoute";
import { addAlert } from "src/store/Global/alerts-slice";
// Utils
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const unwrapDatetime = (value: any): any => {
  if (Array.isArray(value) && value.length > 0 && value[0]?.__datetime__) {
    return [value[0].__datetime__];
  }
  return value;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asRecord = (
  element: Record<string, any>,
  onElementChange: (element: Record<string, any>) => void
) => {
  const raw = element as Record<string, any>;
  const ipaObject = { ...raw };
  // Unwrap __datetime__ objects so IpaTextInput gets plain strings
  if (ipaObject.oauth2delegatenotafter) {
    ipaObject.oauth2delegatenotafter = unwrapDatetime(
      ipaObject.oauth2delegatenotafter
    );
  }
  function recordOnChange(ipaObject: Record<string, any>) {
    onElementChange(ipaObject);
  }
  return { ipaObject, recordOnChange };
};
// Icons
import { OutlinedQuestionCircleIcon } from "@patternfly/react-icons";
// RPC
import {
  OAuth2DelegationModPayload,
  useOauth2DelegationModMutation,
} from "src/services/rpcOAuth2";
// Components
import IpaTextInput from "src/components/Form/IpaTextInput/IpaTextInput";
import TabLayout from "src/components/layouts/TabLayout";
import SecondaryButton from "src/components/layouts/SecondaryButton";
import HelpTextWithIconLayout from "src/components/layouts/HelpTextWithIconLayout";
import IpaTextContent from "src/components/Form/IpaTextContent/IpaTextContent";
import TitleLayout from "src/components/layouts/TitleLayout";

interface PropsToSettings {
  delegation: Partial<OAuth2Delegation>;
  originalDelegation: Partial<OAuth2Delegation>;
  metadata: Metadata;
  onDelegationChange: (delegation: Partial<OAuth2Delegation>) => void;
  onRefresh: () => void;
  isModified: boolean;
  isDataLoading?: boolean;
  modifiedValues: () => Partial<OAuth2Delegation>;
  onResetValues: () => void;
  pathname: string;
}

const OAuth2DelegationsSettings = (props: PropsToSettings) => {
  const dispatch = useAppDispatch();

  useUpdateRoute({ pathname: props.pathname });

  const [isDataLoading, setIsDataLoading] = React.useState(false);

  const { ipaObject, recordOnChange } = asRecord(
    props.delegation,
    props.onDelegationChange
  );

  const [saveDelegation] = useOauth2DelegationModMutation();

  const onRevert = () => {
    props.onDelegationChange(props.originalDelegation);
    props.onRefresh();
    dispatch(
      addAlert({
        name: "revert-success",
        title: "Delegation rule data reverted",
        variant: "success",
      })
    );
  };

  const buildPayload = (
    modifiedValues: Partial<OAuth2Delegation>,
    keyArray: string[]
  ): OAuth2DelegationModPayload => {
    const payload: OAuth2DelegationModPayload = {
      delegationName: props.delegation.cn?.toString() as string,
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
      "oauth2delegatesource",
      "oauth2delegatetarget",
      "oauth2delegatescope",
      "oauth2delegatehostgroup",
      "oauth2delegateservice",
      "oauth2delegatenotafter",
      "oauth2enabled",
      "description",
    ]);

    saveDelegation(payload).then((response) => {
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
          props.onDelegationChange(data.result.result);
          dispatch(
            addAlert({
              name: "success",
              title:
                "Delegation rule '" + props.delegation.cn + "' updated",
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
          dataCy="oauth2-delegations-tab-settings-button-refresh"
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
          dataCy="oauth2-delegations-tab-settings-button-revert"
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
          dataCy="oauth2-delegations-tab-settings-button-save"
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
            scrollableSelector="#oauth2-delegation-page"
            expandable={{ default: "expandable", md: "nonExpandable" }}
            className="pf-v6-u-mt-md"
          >
            <JumpLinksItem key={0} href="#general-settings">
              General
            </JumpLinksItem>
            <JumpLinksItem key={1} href="#policy-settings">
              Policy
            </JumpLinksItem>
            <JumpLinksItem key={2} href="#constraints-settings">
              Constraints
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
                <FormGroup label="Rule name" role="group">
                  <IpaTextContent
                    dataCy="oauth2-delegations-tab-settings-textbox-cn"
                    name={"cn"}
                    ariaLabel={"Rule name"}
                    ipaObject={ipaObject}
                    objectName="oauth2delegation"
                    metadata={props.metadata}
                  />
                </FormGroup>
                <FormGroup label="Enabled" fieldId="oauth2enabled">
                  <IpaTextInput
                    dataCy="oauth2-delegations-tab-settings-textbox-oauth2enabled"
                    name={"oauth2enabled"}
                    ariaLabel={"Enabled"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2delegation"
                    metadata={props.metadata}
                  />
                </FormGroup>
                <FormGroup label="Description" fieldId="description">
                  <IpaTextInput
                    dataCy="oauth2-delegations-tab-settings-textbox-description"
                    name={"description"}
                    ariaLabel={"Description"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2delegation"
                    metadata={props.metadata}
                  />
                </FormGroup>
              </Form>
            </FlexItem>
          </Flex>
          <TitleLayout
            key={1}
            headingLevel="h2"
            id="policy-settings"
            text="Policy"
            className="pf-v6-u-mt-lg pf-v6-u-mb-md"
          />
          <Flex direction={{ default: "column", lg: "row" }}>
            <FlexItem flex={{ default: "flex_1" }}>
              <Form className="pf-v6-u-mb-lg">
                <FormGroup
                  label="Source workload"
                  fieldId="oauth2delegatesource"
                >
                  <IpaTextInput
                    dataCy="oauth2-delegations-tab-settings-textbox-oauth2delegatesource"
                    name={"oauth2delegatesource"}
                    ariaLabel={"Source workload"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2delegation"
                    metadata={props.metadata}
                  />
                </FormGroup>
                <FormGroup
                  label="Target users/groups"
                  fieldId="oauth2delegatetarget"
                >
                  <IpaTextInput
                    dataCy="oauth2-delegations-tab-settings-textbox-oauth2delegatetarget"
                    name={"oauth2delegatetarget"}
                    ariaLabel={"Target users/groups"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2delegation"
                    metadata={props.metadata}
                  />
                </FormGroup>
                <FormGroup
                  label="Permitted scopes"
                  fieldId="oauth2delegatescope"
                >
                  <IpaTextInput
                    dataCy="oauth2-delegations-tab-settings-textbox-oauth2delegatescope"
                    name={"oauth2delegatescope"}
                    ariaLabel={"Permitted scopes"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2delegation"
                    metadata={props.metadata}
                  />
                </FormGroup>
                <FormGroup
                  label="Permitted services"
                  fieldId="oauth2delegateservice"
                >
                  <IpaTextInput
                    dataCy="oauth2-delegations-tab-settings-textbox-oauth2delegateservice"
                    name={"oauth2delegateservice"}
                    ariaLabel={"Permitted services"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2delegation"
                    metadata={props.metadata}
                  />
                </FormGroup>
              </Form>
            </FlexItem>
          </Flex>
          <TitleLayout
            key={2}
            headingLevel="h2"
            id="constraints-settings"
            text="Constraints"
            className="pf-v6-u-mt-lg pf-v6-u-mb-md"
          />
          <Flex direction={{ default: "column", lg: "row" }}>
            <FlexItem flex={{ default: "flex_1" }}>
              <Form className="pf-v6-u-mb-lg">
                <FormGroup
                  label="Target hostgroup"
                  fieldId="oauth2delegatehostgroup"
                >
                  <IpaTextInput
                    dataCy="oauth2-delegations-tab-settings-textbox-oauth2delegatehostgroup"
                    name={"oauth2delegatehostgroup"}
                    ariaLabel={"Target hostgroup"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2delegation"
                    metadata={props.metadata}
                  />
                </FormGroup>
                <FormGroup
                  label="Expires"
                  fieldId="oauth2delegatenotafter"
                >
                  <IpaTextInput
                    dataCy="oauth2-delegations-tab-settings-textbox-oauth2delegatenotafter"
                    name={"oauth2delegatenotafter"}
                    ariaLabel={"Expires"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2delegation"
                    metadata={props.metadata}
                  />
                </FormGroup>
              </Form>
            </FlexItem>
          </Flex>
        </SidebarContent>
      </Sidebar>
    </TabLayout>
  );
};

export default OAuth2DelegationsSettings;
