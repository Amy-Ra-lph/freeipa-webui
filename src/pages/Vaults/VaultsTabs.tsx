import React, { useState } from "react";
// PatternFly
import { PageSection, Tabs, Tab, TabTitleText } from "@patternfly/react-core";
// React Router DOM
import { useNavigate } from "react-router";
// Components
import VaultsSettings from "./VaultsSettings";
import BreadCrumb, { BreadCrumbItem } from "src/components/layouts/BreadCrumb";
import TitleLayout from "src/components/layouts/TitleLayout";
import ContextualHelpPanel from "src/components/ContextualHelpPanel/ContextualHelpPanel";
import DataSpinner from "src/components/layouts/DataSpinner";
import VaultsMembers from "./VaultsMembers";
import { partialVaultToVault } from "src/utils/vaultsUtils";
// Hooks
import { useVaultSettings } from "src/hooks/useVaultsSettingsData";
// Navigation
import { URL_PREFIX } from "src/navigation/NavRoutes";
import { NotFound } from "src/components/errors/PageErrors";
import { CnParams, useSafeParams } from "src/utils/paramsUtils";
// Redux
import { useAppDispatch } from "src/store/hooks";
import { updateBreadCrumbPath } from "src/store/Global/routes-slice";

interface VaultsTabsProps {
  section: string;
}

const VaultsTabs = ({ section }: VaultsTabsProps) => {
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
  const vaultSettingsData = useVaultSettings(cn);

  // Tab
  const [activeTabKey, setActiveTabKey] = useState("settings");

  const handleTabClick = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    tabIndex: number | string
  ) => {
    if (tabIndex === "settings") {
      navigate("/vaults/" + cn);
    } else if (tabIndex === "member") {
      navigate("/vaults/" + cn + "/member_user");
    }
  };

  React.useEffect(() => {
    // Update breadcrumb route
    const currentPath: BreadCrumbItem[] = [
      {
        name: "Vaults",
        url: URL_PREFIX + "/vaults",
      },
      {
        name: cn,
        url: URL_PREFIX + "/vaults/" + cn,
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
      navigate(URL_PREFIX + "/vaults/" + cn);
    }
    if (section.startsWith("member_")) {
      setActiveTabKey("member");
    } else {
      setActiveTabKey(section);
    }
  }, [section]);

  if (vaultSettingsData.isLoading || vaultSettingsData.vault.cn === undefined) {
    return <DataSpinner />;
  }

  // Show the 'NotFound' page if the vault is not found
  if (
    !vaultSettingsData.isLoading &&
    Object.keys(vaultSettingsData.vault).length === 0
  ) {
    return <NotFound />;
  }

  return (
    <>
      <ContextualHelpPanel
        fromPage="vaults-settings"
        isExpanded={isContextualPanelExpanded}
        onClose={onCloseContextualPanel}
      >
        <PageSection hasBodyWrapper={false}>
          <BreadCrumb
            className="pf-v6-u-mb-sm"
            breadcrumbItems={breadcrumbItems}
          />
          <TitleLayout
            id={vaultSettingsData.vault.cn}
            preText="Vault:"
            text={vaultSettingsData.vault.cn}
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
              <VaultsSettings
                vault={vaultSettingsData.vault}
                originalVault={vaultSettingsData.originalVault}
                metadata={vaultSettingsData.metadata}
                onVaultChange={vaultSettingsData.setVault}
                isDataLoading={vaultSettingsData.isFetching}
                onRefresh={vaultSettingsData.refetch}
                isModified={vaultSettingsData.modified}
                onResetValues={vaultSettingsData.resetValues}
                modifiedValues={vaultSettingsData.modifiedValues}
                onOpenContextualPanel={onOpenContextualPanel}
              />
            </Tab>
            <Tab
              eventKey={"member"}
              name={"member-details"}
              title={<TabTitleText>Members</TabTitleText>}
            >
              <VaultsMembers
                vault={partialVaultToVault(vaultSettingsData.vault)}
                tabSection={section}
              />
            </Tab>
          </Tabs>
        </PageSection>
      </ContextualHelpPanel>
    </>
  );
};

export default VaultsTabs;
