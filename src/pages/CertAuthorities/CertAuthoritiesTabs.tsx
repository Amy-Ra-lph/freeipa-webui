import React, { useState } from "react";
// PatternFly
import { PageSection, Tabs, Tab, TabTitleText } from "@patternfly/react-core";
// React Router DOM
import { useNavigate } from "react-router";
// Components
import CertAuthoritiesSettings from "./CertAuthoritiesSettings";
import BreadCrumb, { BreadCrumbItem } from "src/components/layouts/BreadCrumb";
import TitleLayout from "src/components/layouts/TitleLayout";
import ContextualHelpPanel from "src/components/ContextualHelpPanel/ContextualHelpPanel";
import DataSpinner from "src/components/layouts/DataSpinner";
// Hooks
import { useCertAuthoritySettings } from "src/hooks/useCertAuthoritiesSettingsData";
// Navigation
import { URL_PREFIX } from "src/navigation/NavRoutes";
import { NotFound } from "src/components/errors/PageErrors";
import { CnParams, useSafeParams } from "src/utils/paramsUtils";
// Redux
import { useAppDispatch } from "src/store/hooks";
import { updateBreadCrumbPath } from "src/store/Global/routes-slice";

interface CertAuthoritiesTabsProps {
  section: string;
}

const CertAuthoritiesTabs = ({ section }: CertAuthoritiesTabsProps) => {
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
  const certAuthoritySettingsData = useCertAuthoritySettings(cn);

  // Tab
  const [activeTabKey, setActiveTabKey] = useState("settings");

  const handleTabClick = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    tabIndex: number | string
  ) => {
    if (tabIndex === "settings") {
      navigate("/cert-authorities/" + cn);
    }
  };

  // Derive display name from cn (handle string[] vs string)
  const displayName = Array.isArray(certAuthoritySettingsData.certAuthority.cn)
    ? certAuthoritySettingsData.certAuthority.cn[0] || ""
    : certAuthoritySettingsData.certAuthority.cn || "";

  React.useEffect(() => {
    // Update breadcrumb route
    const currentPath: BreadCrumbItem[] = [
      {
        name: "Certificate Authorities",
        url: URL_PREFIX + "/cert-authorities",
      },
      {
        name: cn,
        url: URL_PREFIX + "/cert-authorities/" + cn,
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
      navigate(URL_PREFIX + "/cert-authorities/" + cn);
    }
    setActiveTabKey(section);
  }, [section]);

  if (
    certAuthoritySettingsData.isLoading ||
    certAuthoritySettingsData.certAuthority.cn === undefined
  ) {
    return <DataSpinner />;
  }

  // Show the 'NotFound' page if the CA is not found
  if (
    !certAuthoritySettingsData.isLoading &&
    Object.keys(certAuthoritySettingsData.certAuthority).length === 0
  ) {
    return <NotFound />;
  }

  return (
    <>
      <ContextualHelpPanel
        fromPage="cert-authorities-settings"
        isExpanded={isContextualPanelExpanded}
        onClose={onCloseContextualPanel}
      >
        <PageSection hasBodyWrapper={false}>
          <BreadCrumb
            className="pf-v6-u-mb-sm"
            breadcrumbItems={breadcrumbItems}
          />
          <TitleLayout
            id={displayName}
            preText="Certificate Authority:"
            text={displayName}
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
              <CertAuthoritiesSettings
                certAuthority={certAuthoritySettingsData.certAuthority}
                originalCertAuthority={
                  certAuthoritySettingsData.originalCertAuthority
                }
                metadata={certAuthoritySettingsData.metadata}
                onCertAuthorityChange={
                  certAuthoritySettingsData.setCertAuthority
                }
                isDataLoading={certAuthoritySettingsData.isFetching}
                onRefresh={certAuthoritySettingsData.refetch}
                isModified={certAuthoritySettingsData.modified}
                onResetValues={certAuthoritySettingsData.resetValues}
                modifiedValues={certAuthoritySettingsData.modifiedValues}
                onOpenContextualPanel={onOpenContextualPanel}
              />
            </Tab>
          </Tabs>
        </PageSection>
      </ContextualHelpPanel>
    </>
  );
};

export default CertAuthoritiesTabs;
