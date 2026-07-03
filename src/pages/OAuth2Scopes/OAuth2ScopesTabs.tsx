import React from "react";
// PatternFly
import { PageSection, Tabs, Tab, TabTitleText } from "@patternfly/react-core";
// React Router DOM
import { useNavigate } from "react-router";
// Navigation
import { URL_PREFIX } from "src/navigation/NavRoutes";
import { NotFound } from "src/components/errors/PageErrors";
// Hooks
import { useOAuth2ScopeSettingsData } from "src/hooks/useOAuth2ScopeSettingsData";
// Components
import TitleLayout from "src/components/layouts/TitleLayout";
import DataSpinner from "src/components/layouts/DataSpinner";
import BreadCrumb, {
  BreadCrumbItem,
} from "src/components/layouts/BreadCrumb/BreadCrumb";
import OAuth2ScopesSettings from "./OAuth2ScopesSettings";
import { CnParams, useSafeParams } from "src/utils/paramsUtils";

// eslint-disable-next-line react/prop-types
const OAuth2ScopesTabs = ({ section }) => {
  const { cn } = useSafeParams<CnParams>(["cn"]);
  const navigate = useNavigate();
  const pathname = "oauth2-scopes";

  const [breadcrumbItems, setBreadcrumbItems] = React.useState<
    BreadCrumbItem[]
  >([]);

  const [id, setId] = React.useState("");

  const settingsData = useOAuth2ScopeSettingsData(cn);

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
        name: "OAuth2 scopes",
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

  if (settingsData.isLoading || !settingsData.scope) {
    return <DataSpinner />;
  }

  if (
    !settingsData.isLoading &&
    Object.keys(settingsData.scope).length === 0
  ) {
    return <NotFound />;
  }

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <BreadCrumb breadcrumbItems={breadcrumbItems} />
        <TitleLayout
          id={id}
          preText="OAuth2 scope:"
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
            <OAuth2ScopesSettings
              scope={settingsData.scope}
              originalScope={settingsData.originalScope}
              metadata={settingsData.metadata}
              onScopeChange={settingsData.setScope}
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

export default OAuth2ScopesTabs;
