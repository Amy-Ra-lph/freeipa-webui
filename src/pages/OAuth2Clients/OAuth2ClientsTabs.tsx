import React from "react";
// PatternFly
import { PageSection, Tabs, Tab, TabTitleText } from "@patternfly/react-core";
// React Router DOM
import { useNavigate } from "react-router";
import { URL_PREFIX } from "src/navigation/NavRoutes";
// Layouts
import BreadCrumb, { BreadCrumbItem } from "src/components/layouts/BreadCrumb";
import TitleLayout from "src/components/layouts/TitleLayout";
import DataSpinner from "src/components/layouts/DataSpinner";
// Hooks
import { useOAuth2ClientSettings } from "src/hooks/useOAuth2ClientSettingsData";
// Redux
import { useAppDispatch } from "src/store/hooks";
import { updateBreadCrumbPath } from "src/store/Global/routes-slice";
import { NotFound } from "src/components/errors/PageErrors";
import OAuth2ClientsSettings from "./OAuth2ClientsSettings";
import { CnParams, useSafeParams } from "src/utils/paramsUtils";

// eslint-disable-next-line react/prop-types
const OAuth2ClientsTabs = ({ section }) => {
  // Get location (React Router DOM) and get state data
  const { cn } = useSafeParams<CnParams>(["cn"]);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const settingsData = useOAuth2ClientSettings(cn);
  const [breadcrumbItems, setBreadcrumbItems] = React.useState<
    BreadCrumbItem[]
  >([]);

  const handleTabClick = () => {
    navigate("/oauth2-clients/" + cn);
  };

  React.useEffect(() => {
    // Update breadcrumb route
    const currentPath: BreadCrumbItem[] = [
      {
        name: "OAuth2 Clients",
        url: URL_PREFIX + "/oauth2-clients",
      },
      {
        name: cn,
        url: URL_PREFIX + "/oauth2-clients/" + cn,
        isActive: true,
      },
    ];
    setBreadcrumbItems(currentPath);
    dispatch(updateBreadCrumbPath(currentPath));
  }, [cn]);

  // Redirect to the settings page if the section is not defined
  React.useEffect(() => {
    if (!section) {
      navigate(URL_PREFIX + "/oauth2-clients/" + cn);
    }
  }, [section]);

  if (settingsData.isLoading || settingsData.client.cn === undefined) {
    return <DataSpinner />;
  }

  // Show the 'NotFound' page if the client is not found
  if (
    !settingsData.isLoading &&
    Object.keys(settingsData.client).length === 0
  ) {
    return <NotFound />;
  }

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <BreadCrumb
          className="pf-v6-u-mb-sm"
          breadcrumbItems={breadcrumbItems}
        />
        <TitleLayout
          id={settingsData.client.cn}
          preText="OAuth2 Client:"
          text={settingsData.client.cn}
          headingLevel="h1"
        />
      </PageSection>
      <PageSection hasBodyWrapper={false} type="tabs" isFilled>
        <Tabs
          activeKey={section}
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
            <OAuth2ClientsSettings
              client={settingsData.client}
              originalClient={settingsData.originalClient}
              metadata={settingsData.metadata}
              onClientChange={settingsData.setClient}
              isDataLoading={settingsData.isFetching}
              onRefresh={settingsData.refetch}
              isModified={settingsData.modified}
              onResetValues={settingsData.resetValues}
              modifiedValues={settingsData.modifiedValues}
            />
          </Tab>
        </Tabs>
      </PageSection>
    </>
  );
};

export default OAuth2ClientsTabs;
