import React, { useState } from "react";
// PatternFly
import { PageSection, Tabs, Tab, TabTitleText } from "@patternfly/react-core";
// React Router DOM
import { useNavigate } from "react-router";
// Components
import LocationsSettings from "./LocationsSettings";
import BreadCrumb, { BreadCrumbItem } from "src/components/layouts/BreadCrumb";
import TitleLayout from "src/components/layouts/TitleLayout";
import ContextualHelpPanel from "src/components/ContextualHelpPanel/ContextualHelpPanel";
import DataSpinner from "src/components/layouts/DataSpinner";
// Hooks
import { useLocationSettings } from "src/hooks/useLocationsSettingsData";
// Navigation
import { URL_PREFIX } from "src/navigation/NavRoutes";
import { NotFound } from "src/components/errors/PageErrors";
import { IdnsnameParams, useSafeParams } from "src/utils/paramsUtils";
// Redux
import { useAppDispatch } from "src/store/hooks";
import { updateBreadCrumbPath } from "src/store/Global/routes-slice";

interface LocationsTabsProps {
  section: string;
}

const LocationsTabs = ({ section }: LocationsTabsProps) => {
  const { idnsname } = useSafeParams<IdnsnameParams>(["idnsname"]);
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
  const locationSettingsData = useLocationSettings(idnsname);

  // Tab
  const [activeTabKey, setActiveTabKey] = useState("settings");

  const handleTabClick = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    tabIndex: number | string
  ) => {
    if (tabIndex === "settings") {
      navigate("/locations/" + idnsname);
    }
  };

  React.useEffect(() => {
    // Update breadcrumb route
    const currentPath: BreadCrumbItem[] = [
      {
        name: "IPA locations",
        url: URL_PREFIX + "/locations",
      },
      {
        name: idnsname,
        url: URL_PREFIX + "/locations/" + idnsname,
        isActive: true,
      },
    ];
    setBreadcrumbItems(currentPath);
    setActiveTabKey("settings");
    dispatch(updateBreadCrumbPath(currentPath));
  }, [idnsname]);

  // Redirect to the settings page if the section is not defined
  React.useEffect(() => {
    if (!section) {
      navigate(URL_PREFIX + "/locations/" + idnsname);
    }
    setActiveTabKey(section);
  }, [section]);

  if (
    locationSettingsData.isLoading ||
    locationSettingsData.location.idnsname === undefined
  ) {
    return <DataSpinner />;
  }

  // Show the 'NotFound' page if the location is not found
  if (
    !locationSettingsData.isLoading &&
    Object.keys(locationSettingsData.location).length === 0
  ) {
    return <NotFound />;
  }

  return (
    <>
      <ContextualHelpPanel
        fromPage="locations-settings"
        isExpanded={isContextualPanelExpanded}
        onClose={onCloseContextualPanel}
      >
        <PageSection hasBodyWrapper={false}>
          <BreadCrumb
            className="pf-v6-u-mb-sm"
            breadcrumbItems={breadcrumbItems}
          />
          <TitleLayout
            id={locationSettingsData.location.idnsname}
            preText="Location:"
            text={locationSettingsData.location.idnsname}
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
              <LocationsSettings
                location={locationSettingsData.location}
                originalLocation={locationSettingsData.originalLocation}
                metadata={locationSettingsData.metadata}
                onLocationChange={locationSettingsData.setLocation}
                isDataLoading={locationSettingsData.isFetching}
                onRefresh={locationSettingsData.refetch}
                isModified={locationSettingsData.modified}
                onResetValues={locationSettingsData.resetValues}
                modifiedValues={locationSettingsData.modifiedValues}
                onOpenContextualPanel={onOpenContextualPanel}
              />
            </Tab>
          </Tabs>
        </PageSection>
      </ContextualHelpPanel>
    </>
  );
};

export default LocationsTabs;
