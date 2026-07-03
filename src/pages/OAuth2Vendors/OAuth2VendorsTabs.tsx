import React from "react";
import { useNavigate } from "react-router";
// PatternFly
import { Tab, Tabs, TabTitleText } from "@patternfly/react-core";
// Components
import BreadCrumb, { BreadCrumbItem } from "src/components/layouts/BreadCrumb";
import TitleLayout from "src/components/layouts/TitleLayout";
import DataSpinner from "src/components/layouts/DataSpinner";
// Hooks
import { CnParams, useSafeParams } from "src/utils/paramsUtils";
import useOAuth2VendorSettingsData from "src/hooks/useOAuth2VendorSettingsData";
// Pages
import OAuth2VendorsSettings from "./OAuth2VendorsSettings";

const URL_PREFIX = "/oauth2-vendors";

interface PropsToTabs {
  section: string;
}

const OAuth2VendorsTabs = (props: PropsToTabs) => {
  const { cn } = useSafeParams<CnParams>(["cn"]);
  const navigate = useNavigate();

  const settingsData = useOAuth2VendorSettingsData(cn);

  const breadcrumbItems: BreadCrumbItem[] = [
    {
      name: "Trusted vendors",
      url: URL_PREFIX,
    },
    {
      name: cn,
      url: `${URL_PREFIX}/${cn}`,
      isActive: true,
    },
  ];

  const [activeTabKey, setActiveTabKey] = React.useState(props.section);

  React.useEffect(() => {
    setActiveTabKey(props.section);
  }, [props.section]);

  if (settingsData.isLoading) {
    return <DataSpinner />;
  }

  return (
    <>
      <BreadCrumb
        className="pf-v5-u-mb-md"
        preText=""
        breadcrumbItems={breadcrumbItems}
      />
      <TitleLayout
        id={cn}
        headingLevel="h1"
        text={cn}
        preText="Trusted vendor:"
      />
      <Tabs
        activeKey={activeTabKey}
        onSelect={(_event, tabIndex) => {
          setActiveTabKey(tabIndex as string);
          navigate(`${URL_PREFIX}/${cn}`);
        }}
        isBox={false}
        mountOnEnter
        unmountOnExit
      >
        <Tab
          eventKey="settings"
          title={<TabTitleText>Settings</TabTitleText>}
        >
          <OAuth2VendorsSettings
            vendor={settingsData.vendor}
            originalVendor={settingsData.originalVendor}
            metadata={settingsData.metadata}
            onVendorChange={settingsData.setVendor}
            onRefresh={settingsData.refetch}
            isModified={settingsData.modified}
            modifiedValues={settingsData.modifiedValues}
            onResetValues={settingsData.resetValues}
            pathname="oauth2-vendors"
          />
        </Tab>
      </Tabs>
    </>
  );
};

export default OAuth2VendorsTabs;
