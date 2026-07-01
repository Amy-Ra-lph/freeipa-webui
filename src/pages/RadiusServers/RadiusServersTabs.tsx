import React, { useState } from "react";
// PatternFly
import { PageSection, Tabs, Tab, TabTitleText } from "@patternfly/react-core";
// React Router DOM
import { useNavigate } from "react-router";
// Components
import RadiusServersSettings from "./RadiusServersSettings";
import BreadCrumb, { BreadCrumbItem } from "src/components/layouts/BreadCrumb";
import TitleLayout from "src/components/layouts/TitleLayout";
import ContextualHelpPanel from "src/components/ContextualHelpPanel/ContextualHelpPanel";
import DataSpinner from "src/components/layouts/DataSpinner";
// Hooks
import { useRadiusServerSettings } from "src/hooks/useRadiusServersSettingsData";
// Navigation
import { URL_PREFIX } from "src/navigation/NavRoutes";
import { NotFound } from "src/components/errors/PageErrors";
import { CnParams, useSafeParams } from "src/utils/paramsUtils";
// Redux
import { useAppDispatch } from "src/store/hooks";
import { updateBreadCrumbPath } from "src/store/Global/routes-slice";

interface RadiusServersTabsProps {
  section: string;
}

const RadiusServersTabs = ({ section }: RadiusServersTabsProps) => {
  const { cn } = useSafeParams<CnParams>(["cn"]);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [breadcrumbItems, setBreadcrumbItems] = React.useState<
    BreadCrumbItem[]
  >([]);

  // Contextual links panel
  const [isContextualPanelExpanded, setIsContextualPanelExpanded] =
    useState(false);

  const onOpenContextualPanel = () => {
    setIsContextualPanelExpanded(!isContextualPanelExpanded);
  };

  const onCloseContextualPanel = () => {
    setIsContextualPanelExpanded(false);
  };

  // Close links panel when tab section is changed
  React.useEffect(() => {
    setIsContextualPanelExpanded(false);
  }, [section]);

  // Data loaded from DB
  const radiusServerSettingsData = useRadiusServerSettings(cn);

  // Tab
  const [activeTabKey, setActiveTabKey] = useState("settings");

  const handleTabClick = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    tabIndex: number | string
  ) => {
    if (tabIndex === "settings") {
      navigate("/radius-servers/" + cn);
    }
  };

  React.useEffect(() => {
    // Update breadcrumb route
    const currentPath: BreadCrumbItem[] = [
      {
        name: "RADIUS servers",
        url: URL_PREFIX + "/radius-servers",
      },
      {
        name: cn,
        url: URL_PREFIX + "/radius-servers/" + cn,
        isActive: true,
      },
    ];
    setBreadcrumbItems(currentPath);
    setActiveTabKey("settings");
    dispatch(updateBreadCrumbPath(currentPath));
  }, [cn]);

  // Redirect to the settings page if the section is not defined
  React.useEffect(() => {
    if (!section) {
      navigate(URL_PREFIX + "/radius-servers/" + cn);
    }
    setActiveTabKey(section);
  }, [section]);

  if (
    radiusServerSettingsData.isLoading ||
    radiusServerSettingsData.radiusServer.cn === undefined
  ) {
    return <DataSpinner />;
  }

  // Show the 'NotFound' page if the server is not found
  if (
    !radiusServerSettingsData.isLoading &&
    Object.keys(radiusServerSettingsData.radiusServer).length === 0
  ) {
    return <NotFound />;
  }

  return (
    <>
      <ContextualHelpPanel
        fromPage="radius-servers-settings"
        isExpanded={isContextualPanelExpanded}
        onClose={onCloseContextualPanel}
      >
        <PageSection hasBodyWrapper={false}>
          <BreadCrumb
            className="pf-v6-u-mb-sm"
            breadcrumbItems={breadcrumbItems}
          />
          <TitleLayout
            id={radiusServerSettingsData.radiusServer.cn}
            preText="RADIUS server:"
            text={radiusServerSettingsData.radiusServer.cn}
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
              <RadiusServersSettings
                radiusServer={radiusServerSettingsData.radiusServer}
                originalRadiusServer={
                  radiusServerSettingsData.originalRadiusServer
                }
                metadata={radiusServerSettingsData.metadata}
                onRadiusServerChange={
                  radiusServerSettingsData.setRadiusServer
                }
                isDataLoading={radiusServerSettingsData.isFetching}
                onRefresh={radiusServerSettingsData.refetch}
                isModified={radiusServerSettingsData.modified}
                onResetValues={radiusServerSettingsData.resetValues}
                modifiedValues={radiusServerSettingsData.modifiedValues}
                onOpenContextualPanel={onOpenContextualPanel}
              />
            </Tab>
          </Tabs>
        </PageSection>
      </ContextualHelpPanel>
    </>
  );
};

export default RadiusServersTabs;
