import React, { useState } from "react";
// PatternFly
import { PageSection, Tabs, Tab, TabTitleText } from "@patternfly/react-core";
// React Router DOM
import { useNavigate } from "react-router";
// Components
import DelegationSettings from "./DelegationSettings";
import BreadCrumb, { BreadCrumbItem } from "src/components/layouts/BreadCrumb";
import TitleLayout from "src/components/layouts/TitleLayout";
import ContextualHelpPanel from "src/components/ContextualHelpPanel/ContextualHelpPanel";
import DataSpinner from "src/components/layouts/DataSpinner";
// Hooks
import { useDelegationSettings } from "src/hooks/useDelegationSettingsData";
// Navigation
import { URL_PREFIX } from "src/navigation/NavRoutes";
import { NotFound } from "src/components/errors/PageErrors";
import { AcinameParams, useSafeParams } from "src/utils/paramsUtils";
// Redux
import { useAppDispatch } from "src/store/hooks";
import { updateBreadCrumbPath } from "src/store/Global/routes-slice";

interface DelegationTabsProps {
  section: string;
}

const DelegationTabs = ({ section }: DelegationTabsProps) => {
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

  // Close links panel when tab section is changed
  React.useEffect(() => {
    setIsContextualPanelExpanded(false);
  }, [section]);

  // Data loaded from DB
  const delegationSettingsData = useDelegationSettings(aciname);

  // Tab
  const [activeTabKey, setActiveTabKey] = useState("settings");

  const handleTabClick = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    tabIndex: number | string
  ) => {
    if (tabIndex === "settings") {
      navigate("/delegation/" + aciname);
    }
  };

  React.useEffect(() => {
    // Update breadcrumb route
    const currentPath: BreadCrumbItem[] = [
      {
        name: "Delegations",
        url: URL_PREFIX + "/delegation",
      },
      {
        name: aciname,
        url: URL_PREFIX + "/delegation/" + aciname,
        isActive: true,
      },
    ];
    setBreadcrumbItems(currentPath);
    setActiveTabKey("settings");
    dispatch(updateBreadCrumbPath(currentPath));
  }, [aciname]);

  // Redirect to the settings page if the section is not defined
  React.useEffect(() => {
    if (!section) {
      navigate(URL_PREFIX + "/delegation/" + aciname);
    }
    setActiveTabKey(section);
  }, [section]);

  if (
    delegationSettingsData.isLoading ||
    delegationSettingsData.delegation.aciname === undefined
  ) {
    return <DataSpinner />;
  }

  // Show the 'NotFound' page if the delegation is not found
  if (
    !delegationSettingsData.isLoading &&
    Object.keys(delegationSettingsData.delegation).length === 0
  ) {
    return <NotFound />;
  }

  return (
    <>
      <ContextualHelpPanel
        fromPage="delegation-settings"
        isExpanded={isContextualPanelExpanded}
        onClose={onCloseContextualPanel}
      >
        <PageSection hasBodyWrapper={false}>
          <BreadCrumb
            className="pf-v6-u-mb-sm"
            breadcrumbItems={breadcrumbItems}
          />
          <TitleLayout
            id={delegationSettingsData.delegation.aciname}
            preText="Delegation:"
            text={delegationSettingsData.delegation.aciname}
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
              <DelegationSettings
                delegation={delegationSettingsData.delegation}
                originalDelegation={delegationSettingsData.originalDelegation}
                metadata={delegationSettingsData.metadata}
                onDelegationChange={delegationSettingsData.setDelegation}
                isDataLoading={delegationSettingsData.isFetching}
                onRefresh={delegationSettingsData.refetch}
                isModified={delegationSettingsData.modified}
                onResetValues={delegationSettingsData.resetValues}
                modifiedValues={delegationSettingsData.modifiedValues}
                onOpenContextualPanel={onOpenContextualPanel}
              />
            </Tab>
          </Tabs>
        </PageSection>
      </ContextualHelpPanel>
    </>
  );
};

export default DelegationTabs;
