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
import { OAuth2Vendor } from "src/hooks/useOAuth2VendorSettingsData";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import useUpdateRoute from "src/hooks/useUpdateRoute";
import { addAlert } from "src/store/Global/alerts-slice";
// Icons
import { OutlinedQuestionCircleIcon } from "@patternfly/react-icons";
// RPC
import {
  OAuth2VendorModPayload,
  useOauth2VendorModMutation,
} from "src/services/rpcOAuth2";
// Components
import IpaTextInput from "src/components/Form/IpaTextInput/IpaTextInput";
import TabLayout from "src/components/layouts/TabLayout";
import SecondaryButton from "src/components/layouts/SecondaryButton";
import HelpTextWithIconLayout from "src/components/layouts/HelpTextWithIconLayout";
import IpaTextContent from "src/components/Form/IpaTextContent/IpaTextContent";
import TitleLayout from "src/components/layouts/TitleLayout";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const unwrapSpecialTypes = (value: any): any => {
  if (Array.isArray(value) && value.length > 0) {
    if (value[0]?.__datetime__) {
      return [value[0].__datetime__];
    }
    if (value[0]?.__base64__) {
      return [value[0].__base64__];
    }
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
  // Unwrap __datetime__ and __base64__ objects so IpaTextInput gets plain strings
  if (ipaObject.oauth2vendornotafter) {
    ipaObject.oauth2vendornotafter = unwrapSpecialTypes(
      ipaObject.oauth2vendornotafter
    );
  }
  if (ipaObject.oauth2vendorcacert) {
    ipaObject.oauth2vendorcacert = unwrapSpecialTypes(
      ipaObject.oauth2vendorcacert
    );
  }
  function recordOnChange(ipaObject: Record<string, any>) {
    onElementChange(ipaObject);
  }
  return { ipaObject, recordOnChange };
};

interface PropsToSettings {
  vendor: Partial<OAuth2Vendor>;
  originalVendor: Partial<OAuth2Vendor>;
  metadata: Metadata;
  onVendorChange: (vendor: Partial<OAuth2Vendor>) => void;
  onRefresh: () => void;
  isModified: boolean;
  isDataLoading?: boolean;
  modifiedValues: () => Partial<OAuth2Vendor>;
  onResetValues: () => void;
  pathname: string;
}

const OAuth2VendorsSettings = (props: PropsToSettings) => {
  const dispatch = useAppDispatch();

  useUpdateRoute({ pathname: props.pathname });

  const [isDataLoading, setIsDataLoading] = React.useState(false);

  const { ipaObject, recordOnChange } = asRecord(
    props.vendor,
    props.onVendorChange
  );

  const [saveVendor] = useOauth2VendorModMutation();

  const onRevert = () => {
    props.onVendorChange(props.originalVendor);
    props.onRefresh();
    dispatch(
      addAlert({
        name: "revert-success",
        title: "Vendor data reverted",
        variant: "success",
      })
    );
  };

  const buildPayload = (
    modifiedValues: Partial<OAuth2Vendor>,
    keyArray: string[]
  ): OAuth2VendorModPayload => {
    const payload: OAuth2VendorModPayload = {
      vendorName: props.vendor.cn?.toString() as string,
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
      "oauth2vendorcacert",
      "oauth2vendorscope",
      "oauth2vendornotafter",
      "oauth2vendorcontact",
      "oauth2vendorrekorurl",
      "oauth2enabled",
      "description",
    ]);

    saveVendor(payload).then((response) => {
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
          props.onVendorChange(data.result.result);
          dispatch(
            addAlert({
              name: "success",
              title:
                "Trusted vendor '" + props.vendor.cn + "' updated",
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
          dataCy="oauth2-vendors-tab-settings-button-refresh"
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
          dataCy="oauth2-vendors-tab-settings-button-revert"
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
          dataCy="oauth2-vendors-tab-settings-button-save"
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
            scrollableSelector="#oauth2-vendor-page"
            expandable={{ default: "expandable", md: "nonExpandable" }}
            className="pf-v6-u-mt-md"
          >
            <JumpLinksItem key={0} href="#general-settings">
              General
            </JumpLinksItem>
            <JumpLinksItem key={1} href="#trust-settings">
              Trust settings
            </JumpLinksItem>
            <JumpLinksItem key={2} href="#expiry-settings">
              Expiry
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
                    dataCy="oauth2-vendors-tab-settings-textbox-cn"
                    name={"cn"}
                    ariaLabel={"Name"}
                    ipaObject={ipaObject}
                    objectName="oauth2vendor"
                    metadata={props.metadata}
                  />
                </FormGroup>
                <FormGroup label="Enabled" fieldId="oauth2enabled">
                  <IpaTextInput
                    dataCy="oauth2-vendors-tab-settings-textbox-oauth2enabled"
                    name={"oauth2enabled"}
                    ariaLabel={"Enabled"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2vendor"
                    metadata={props.metadata}
                  />
                </FormGroup>
                <FormGroup label="Contact" fieldId="oauth2vendorcontact">
                  <IpaTextInput
                    dataCy="oauth2-vendors-tab-settings-textbox-oauth2vendorcontact"
                    name={"oauth2vendorcontact"}
                    ariaLabel={"Contact"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2vendor"
                    metadata={props.metadata}
                  />
                </FormGroup>
                <FormGroup label="Description" fieldId="description">
                  <IpaTextInput
                    dataCy="oauth2-vendors-tab-settings-textbox-description"
                    name={"description"}
                    ariaLabel={"Description"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2vendor"
                    metadata={props.metadata}
                  />
                </FormGroup>
              </Form>
            </FlexItem>
          </Flex>
          <TitleLayout
            key={1}
            headingLevel="h2"
            id="trust-settings"
            text="Trust settings"
            className="pf-v6-u-mt-lg pf-v6-u-mb-md"
          />
          <Flex direction={{ default: "column", lg: "row" }}>
            <FlexItem flex={{ default: "flex_1" }}>
              <Form className="pf-v6-u-mb-lg">
                <FormGroup
                  label="CA certificate (PEM)"
                  fieldId="oauth2vendorcacert"
                >
                  <IpaTextInput
                    dataCy="oauth2-vendors-tab-settings-textbox-oauth2vendorcacert"
                    name={"oauth2vendorcacert"}
                    ariaLabel={"CA certificate"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2vendor"
                    metadata={props.metadata}
                  />
                </FormGroup>
                <FormGroup
                  label="Scope ceiling"
                  fieldId="oauth2vendorscope"
                >
                  <IpaTextInput
                    dataCy="oauth2-vendors-tab-settings-textbox-oauth2vendorscope"
                    name={"oauth2vendorscope"}
                    ariaLabel={"Scope ceiling"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2vendor"
                    metadata={props.metadata}
                  />
                </FormGroup>
                <FormGroup
                  label="Rekor URL"
                  fieldId="oauth2vendorrekorurl"
                >
                  <IpaTextInput
                    dataCy="oauth2-vendors-tab-settings-textbox-oauth2vendorrekorurl"
                    name={"oauth2vendorrekorurl"}
                    ariaLabel={"Rekor URL"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2vendor"
                    metadata={props.metadata}
                  />
                </FormGroup>
              </Form>
            </FlexItem>
          </Flex>
          <TitleLayout
            key={2}
            headingLevel="h2"
            id="expiry-settings"
            text="Expiry"
            className="pf-v6-u-mt-lg pf-v6-u-mb-md"
          />
          <Flex direction={{ default: "column", lg: "row" }}>
            <FlexItem flex={{ default: "flex_1" }}>
              <Form className="pf-v6-u-mb-lg">
                <FormGroup
                  label="Expires (YYYYMMDDHHmmssZ)"
                  fieldId="oauth2vendornotafter"
                >
                  <IpaTextInput
                    dataCy="oauth2-vendors-tab-settings-textbox-oauth2vendornotafter"
                    name={"oauth2vendornotafter"}
                    ariaLabel={"Expires"}
                    ipaObject={ipaObject}
                    onChange={recordOnChange}
                    objectName="oauth2vendor"
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

export default OAuth2VendorsSettings;
