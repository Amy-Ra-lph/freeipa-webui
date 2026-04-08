import React from "react";
// PatternFly
import { PageSection, Tabs, Tab, TabTitleText } from "@patternfly/react-core";
// React Router DOM
import { useNavigate } from "react-router";
// Navigation
import { URL_PREFIX } from "src/navigation/NavRoutes";
import { NotFound } from "src/components/errors/PageErrors";
// Hooks
import { useOAuth2WorkloadSettingsData } from "src/hooks/useOAuth2WorkloadSettingsData";
// Components
import TitleLayout from "src/components/layouts/TitleLayout";
import DataSpinner from "src/components/layouts/DataSpinner";
import BreadCrumb, {
  BreadCrumbItem,
} from "src/components/layouts/BreadCrumb/BreadCrumb";
import OAuth2WorkloadsSettings from "./OAuth2WorkloadsSettings";
import { CnParams, useSafeParams } from "src/utils/paramsUtils";

// eslint-disable-next-line react/prop-types
const OAuth2WorkloadsTabs = ({ section }) => {
  const { cn } = useSafeParams<CnParams>(["cn"]);
  const navigate = useNavigate();
  const pathname = "oauth2-workloads";

  const [breadcrumbItems, setBreadcrumbItems] = React.useState<
    BreadCrumbItem[]
  >([]);

  const [id, setId] = React.useState("");

  const settingsData = useOAuth2WorkloadSettingsData(cn);

  const [activeTabKey, setActiveTabKey] = React.useState(section);

  const handleTabClick = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    tabIndex: number | string
  ) => {
    if (tabIndex === "settings") {
      navigate("/" + pathname + "/" + id);
    }
  };

  React.useEffect(() => {
    setId(cn);
    const currentPath: BreadCrumbItem[] = [
      {
        name: "Workload identities",
        url: URL_PREFIX + "/" + pathname,
      },
      {
        name: cn,
        url: URL_PREFIX + "/" + pathname + "/" + cn,
        isActive: true,
      },
    ];
    setBreadcrumbItems(currentPath);
    setActiveTabKey("settings");
  }, [cn]);

  if (settingsData.isLoading || !settingsData.workload) {
    return <DataSpinner />;
  }

  if (
    !settingsData.isLoading &&
    Object.keys(settingsData.workload).length === 0
  ) {
    return <NotFound />;
  }

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <BreadCrumb breadcrumbItems={breadcrumbItems} />
        <TitleLayout
          id={id}
          preText="Workload identity:"
          text={id}
          headingLevel="h1"
        />
      </PageSection>
      <PageSection hasBodyWrapper={false} type="tabs" isFilled>
        <Tabs
          activeKey={activeTabKey}
          onSelect={handleTabClick}
          variant="secondary"
          isBox
          className="pf-v6-u-ml-lg"
          mountOnEnter
          unmountOnExit
        >
          <Tab
            eventKey={"settings"}
            name="settings-details"
            title={<TabTitleText>Settings</TabTitleText>}
          >
            <OAuth2WorkloadsSettings
              workload={settingsData.workload}
              originalWorkload={settingsData.originalWorkload}
              metadata={settingsData.metadata}
              onWorkloadChange={settingsData.setWorkload}
              onRefresh={settingsData.refetch}
              isModified={settingsData.modified}
              isDataLoading={settingsData.isLoading}
              modifiedValues={settingsData.modifiedValues}
              onResetValues={settingsData.resetValues}
              pathname={pathname}
            />
          </Tab>
        </Tabs>
      </PageSection>
    </>
  );
};

export default OAuth2WorkloadsTabs;
