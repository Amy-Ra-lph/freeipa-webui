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
import { OAuth2Scope } from "src/hooks/useOAuth2ScopeSettingsData";
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
  OAuth2ScopeModPayload,
  useOauth2ScopeModMutation,
} from "src/services/rpcOAuth2";
// Components
import IpaTextInput from "src/components/Form/IpaTextInput/IpaTextInput";
import TabLayout from "src/components/layouts/TabLayout";
import SecondaryButton from "src/components/layouts/SecondaryButton";
import HelpTextWithIconLayout from "src/components/layouts/HelpTextWithIconLayout";
import IpaTextContent from "src/components/Form/IpaTextContent/IpaTextContent";
import TitleLayout from "src/components/layouts/TitleLayout";

interface PropsToSettings {
  scope: Partial<OAuth2Scope>;
  originalScope: Partial<OAuth2Scope>;
  metadata: Metadata;
  onScopeChange: (scope: Partial<OAuth2Scope>) => void;
  onRefresh: () => void;
  isModified: boolean;
  isDataLoading?: boolean;
  modifiedValues: () => Partial<OAuth2Scope>;
  onResetValues: () => void;
  pathname: string;
}

const OAuth2ScopesSettings = (props: PropsToSettings) => {
  const dispatch = useAppDispatch();

  useUpdateRoute({ pathname: props.pathname });

  const [isDataLoading, setIsDataLoading] = React.useState(false);

  const { ipaObject, recordOnChange } = asRecord(
    props.scope,
    props.onScopeChange
  );

  const [saveScope] = useOauth2ScopeModMutation();

  const onRevert = () => {
    props.onScopeChange(props.originalScope);
    props.onRefresh();
    dispatch(
      addAlert({
        name: "revert-success",
        title: "OAuth2 scope data reverted",
        variant: "success",
      })
    );
  };

  const buildPayload = (
    modifiedValues: Partial<OAuth2Scope>,
    keyArray: string[]
  ): OAuth2ScopeModPayload => {
    const payload: OAuth2ScopeModPayload = {
      scopeName: props.scope.cn?.toString() as string,
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
      "oauth2scope",
      "oauth2scopedescription",
      "oauth2enabled",
    ]);

    saveScope(payload).then((response) => {
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
          props.onScopeChange(data.result.result);
          dispatch(
            addAlert({
              name: "success",
              title: "OAuth2 scope '" + props.scope.cn + "' updated",
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
          dataCy="oauth2-scopes-tab-settings-button-refresh"
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
          dataCy="oauth2-scopes-tab-settings-button-revert"
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
          dataCy="oauth2-scopes-tab-settings-button-save"
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
            scrollableSelector="#oauth2-scope-page"
            expandable={{ default: "expandable", md: "nonExpandable" }}
            className="pf-v6-u-mt-md"
          >
            <JumpLinksItem key={0} href="#general-settings">
              General
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
                    dataCy="oauth2-scopes-tab-settings-textbox-cn"
                    name={"cn"}
                    ariaLabel={"Name"}
                    ipaObject={ipaObject}
                    objectName="oauth2scope"
                    metadata={props.metadata}
                  />
                </FormGroup>
                <FormGroup label="Scope" fieldId="oauth2scope">
                  <IpaTextInput
                    dataCy="oauth2-scopes-tab-settings-textbox-oauth2scope"
                    name={"oauth2scope"}
                    ariaLabel={"Scope"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2scope"
                    metadata={props.metadata}
                  />
                </FormGroup>
                <FormGroup
                  label="Description"
                  fieldId="oauth2scopedescription"
                >
                  <IpaTextInput
                    dataCy="oauth2-scopes-tab-settings-textbox-oauth2scopedescription"
                    name={"oauth2scopedescription"}
                    ariaLabel={"Description"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2scope"
                    metadata={props.metadata}
                  />
                </FormGroup>
                <FormGroup label="Enabled" fieldId="oauth2enabled">
                  <IpaTextInput
                    dataCy="oauth2-scopes-tab-settings-textbox-oauth2enabled"
                    name={"oauth2enabled"}
                    ariaLabel={"Enabled"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2scope"
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

export default OAuth2ScopesSettings;
