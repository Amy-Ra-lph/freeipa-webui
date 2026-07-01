import React, { useState } from "react";
// PatternFly
import { PageSection, Tabs, Tab, TabTitleText } from "@patternfly/react-core";
// React Router DOM
import { useNavigate } from "react-router";
// Components
import CertProfilesSettings from "./CertProfilesSettings";
import BreadCrumb, { BreadCrumbItem } from "src/components/layouts/BreadCrumb";
import TitleLayout from "src/components/layouts/TitleLayout";
import ContextualHelpPanel from "src/components/ContextualHelpPanel/ContextualHelpPanel";
import DataSpinner from "src/components/layouts/DataSpinner";
// Hooks
import { useCertProfileSettings } from "src/hooks/useCertProfilesSettingsData";
// Navigation
import { URL_PREFIX } from "src/navigation/NavRoutes";
import { NotFound } from "src/components/errors/PageErrors";
import { CnParams, useSafeParams } from "src/utils/paramsUtils";
// Redux
import { useAppDispatch } from "src/store/hooks";
import { updateBreadCrumbPath } from "src/store/Global/routes-slice";

interface CertProfilesTabsProps {
  section: string;
}

const CertProfilesTabs = ({ section }: CertProfilesTabsProps) => {
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
  const certProfileSettingsData = useCertProfileSettings(cn);

  // Tab
  const [activeTabKey, setActiveTabKey] = useState("settings");

  const handleTabClick = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    tabIndex: number | string
  ) => {
    if (tabIndex === "settings") {
      navigate("/cert-profiles/" + cn);
    }
  };

  React.useEffect(() => {
    // Update breadcrumb route
    const currentPath: BreadCrumbItem[] = [
      {
        name: "Certificate Profiles",
        url: URL_PREFIX + "/cert-profiles",
      },
      {
        name: cn,
        url: URL_PREFIX + "/cert-profiles/" + cn,
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
      navigate(URL_PREFIX + "/cert-profiles/" + cn);
    }
    setActiveTabKey(section || "settings");
  }, [section]);

  if (
    certProfileSettingsData.isLoading ||
    certProfileSettingsData.certProfile.cn === undefined
  ) {
    return <DataSpinner />;
  }

  // Show the 'NotFound' page if the cert profile is not found
  if (
    !certProfileSettingsData.isLoading &&
    Object.keys(certProfileSettingsData.certProfile).length === 0
  ) {
    return <NotFound />;
  }

  return (
    <>
      <ContextualHelpPanel
        fromPage="cert-profiles-settings"
        isExpanded={isContextualPanelExpanded}
        onClose={onCloseContextualPanel}
      >
        <PageSection hasBodyWrapper={false}>
          <BreadCrumb
            className="pf-v6-u-mb-sm"
            breadcrumbItems={breadcrumbItems}
          />
          <TitleLayout
            id={certProfileSettingsData.certProfile.cn}
            preText="Certificate Profile:"
            text={certProfileSettingsData.certProfile.cn}
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
              <CertProfilesSettings
                certProfile={certProfileSettingsData.certProfile}
                originalCertProfile={
                  certProfileSettingsData.originalCertProfile
                }
                metadata={certProfileSettingsData.metadata}
                onCertProfileChange={certProfileSettingsData.setCertProfile}
                isDataLoading={certProfileSettingsData.isFetching}
                onRefresh={certProfileSettingsData.refetch}
                isModified={certProfileSettingsData.modified}
                onResetValues={certProfileSettingsData.resetValues}
                modifiedValues={certProfileSettingsData.modifiedValues}
                onOpenContextualPanel={onOpenContextualPanel}
              />
            </Tab>
          </Tabs>
        </PageSection>
      </ContextualHelpPanel>
    </>
  );
};

export default CertProfilesTabs;
