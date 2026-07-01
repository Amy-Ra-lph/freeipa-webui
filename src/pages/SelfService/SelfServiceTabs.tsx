import React, { useState } from "react";
// PatternFly
import { PageSection, Tabs, Tab, TabTitleText } from "@patternfly/react-core";
// React Router DOM
import { useNavigate } from "react-router";
// Components
import SelfServiceSettings from "./SelfServiceSettings";
import BreadCrumb, { BreadCrumbItem } from "src/components/layouts/BreadCrumb";
import TitleLayout from "src/components/layouts/TitleLayout";
import ContextualHelpPanel from "src/components/ContextualHelpPanel/ContextualHelpPanel";
import DataSpinner from "src/components/layouts/DataSpinner";
// Hooks
import { useSelfServiceSettings } from "src/hooks/useSelfServiceSettingsData";
// Navigation
import { URL_PREFIX } from "src/navigation/NavRoutes";
import { NotFound } from "src/components/errors/PageErrors";
import { AcinameParams, useSafeParams } from "src/utils/paramsUtils";
// Redux
import { useAppDispatch } from "src/store/hooks";
import { updateBreadCrumbPath } from "src/store/Global/routes-slice";

interface SelfServiceTabsProps {
  section: string;
}

const SelfServiceTabs = ({ section }: SelfServiceTabsProps) => {
  const { aciname } = useSafeParams<AcinameParams>(["aciname"]);
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

  React.useEffect(() => {
    setIsContextualPanelExpanded(false);
  }, [section]);

  // Data loaded from DB
  const selfServiceSettingsData = useSelfServiceSettings(aciname);

  // Tab
  const [activeTabKey, setActiveTabKey] = useState("settings");

  const handleTabClick = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    tabIndex: number | string
  ) => {
    if (tabIndex === "settings") {
      navigate("/self-service/" + aciname);
    }
  };

  React.useEffect(() => {
    const currentPath: BreadCrumbItem[] = [
      {
        name: "Self service permissions",
        url: URL_PREFIX + "/self-service",
      },
      {
        name: aciname,
        url: URL_PREFIX + "/self-service/" + aciname,
        isActive: true,
      },
    ];
    setBreadcrumbItems(currentPath);
    setActiveTabKey("settings");
    dispatch(updateBreadCrumbPath(currentPath));
  }, [aciname]);

  React.useEffect(() => {
    if (!section) {
      navigate(URL_PREFIX + "/self-service/" + aciname);
    }
    setActiveTabKey(section);
  }, [section]);

  if (
    selfServiceSettingsData.isLoading ||
    selfServiceSettingsData.selfService.aciname === undefined
  ) {
    return <DataSpinner />;
  }

  if (
    !selfServiceSettingsData.isLoading &&
    Object.keys(selfServiceSettingsData.selfService).length === 0
  ) {
    return <NotFound />;
  }

  return (
    <>
      <ContextualHelpPanel
        fromPage="self-service-settings"
        isExpanded={isContextualPanelExpanded}
        onClose={onCloseContextualPanel}
      >
        <PageSection hasBodyWrapper={false}>
          <BreadCrumb
            className="pf-v6-u-mb-sm"
            breadcrumbItems={breadcrumbItems}
          />
          <TitleLayout
            id={selfServiceSettingsData.selfService.aciname}
            preText="Self service permission:"
            text={selfServiceSettingsData.selfService.aciname}
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
              <SelfServiceSettings
                selfService={selfServiceSettingsData.selfService}
                originalSelfService={
                  selfServiceSettingsData.originalSelfService
                }
                metadata={selfServiceSettingsData.metadata}
                onSelfServiceChange={selfServiceSettingsData.setSelfService}
                isDataLoading={selfServiceSettingsData.isFetching}
                onRefresh={selfServiceSettingsData.refetch}
                isModified={selfServiceSettingsData.modified}
                onResetValues={selfServiceSettingsData.resetValues}
                modifiedValues={selfServiceSettingsData.modifiedValues}
                onOpenContextualPanel={onOpenContextualPanel}
              />
            </Tab>
          </Tabs>
        </PageSection>
      </ContextualHelpPanel>
    </>
  );
};

export default SelfServiceTabs;
