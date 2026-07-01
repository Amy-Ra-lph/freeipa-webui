import React, { useState } from "react";
// PatternFly
import { PageSection, Tabs, Tab, TabTitleText } from "@patternfly/react-core";
// React Router DOM
import { useNavigate } from "react-router";
// Components
import CACLsSettings from "./CACLsSettings";
import BreadCrumb, { BreadCrumbItem } from "src/components/layouts/BreadCrumb";
import TitleLayout from "src/components/layouts/TitleLayout";
import ContextualHelpPanel from "src/components/ContextualHelpPanel/ContextualHelpPanel";
import DataSpinner from "src/components/layouts/DataSpinner";
// Hooks
import { useCACLSettings } from "src/hooks/useCACLsSettingsData";
// Navigation
import { URL_PREFIX } from "src/navigation/NavRoutes";
import { NotFound } from "src/components/errors/PageErrors";
import { CnParams, useSafeParams } from "src/utils/paramsUtils";
// Redux
import { useAppDispatch } from "src/store/hooks";
import { updateBreadCrumbPath } from "src/store/Global/routes-slice";

interface CACLsTabsProps {
  section: string;
}

const CACLsTabs = ({ section }: CACLsTabsProps) => {
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
  const caclSettingsData = useCACLSettings(cn);

  // Tab
  const [activeTabKey, setActiveTabKey] = useState("settings");

  const handleTabClick = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    tabIndex: number | string
  ) => {
    if (tabIndex === "settings") {
      navigate("/ca-acls/" + cn);
    }
  };

  React.useEffect(() => {
    // Update breadcrumb route
    const currentPath: BreadCrumbItem[] = [
      {
        name: "CA ACLs",
        url: URL_PREFIX + "/ca-acls",
      },
      {
        name: cn,
        url: URL_PREFIX + "/ca-acls/" + cn,
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
      navigate(URL_PREFIX + "/ca-acls/" + cn);
    }
    setActiveTabKey(section);
  }, [section]);

  if (
    caclSettingsData.isLoading ||
    caclSettingsData.cacl.cn === undefined
  ) {
    return <DataSpinner />;
  }

  // Show the 'NotFound' page if the CA ACL is not found
  if (
    !caclSettingsData.isLoading &&
    Object.keys(caclSettingsData.cacl).length === 0
  ) {
    return <NotFound />;
  }

  return (
    <>
      <ContextualHelpPanel
        fromPage="cacls-settings"
        isExpanded={isContextualPanelExpanded}
        onClose={onCloseContextualPanel}
      >
        <PageSection hasBodyWrapper={false}>
          <BreadCrumb
            className="pf-v6-u-mb-sm"
            breadcrumbItems={breadcrumbItems}
          />
          <TitleLayout
            id={caclSettingsData.cacl.cn}
            preText="CA ACL:"
            text={caclSettingsData.cacl.cn}
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
              <CACLsSettings
                cacl={caclSettingsData.cacl}
                originalCACL={caclSettingsData.originalCACL}
                metadata={caclSettingsData.metadata}
                onCACLChange={caclSettingsData.setCACL}
                isDataLoading={caclSettingsData.isFetching}
                onRefresh={caclSettingsData.refetch}
                isModified={caclSettingsData.modified}
                onResetValues={caclSettingsData.resetValues}
                modifiedValues={caclSettingsData.modifiedValues}
                onOpenContextualPanel={onOpenContextualPanel}
              />
            </Tab>
          </Tabs>
        </PageSection>
      </ContextualHelpPanel>
    </>
  );
};

export default CACLsTabs;
