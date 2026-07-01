import React, { useState } from "react";
// PatternFly
import { PageSection, Tabs, Tab, TabTitleText } from "@patternfly/react-core";
// React Router DOM
import { useNavigate, useSearchParams } from "react-router";
// Components
import TopologySegmentsSettings from "./TopologySegmentsSettings";
import BreadCrumb, { BreadCrumbItem } from "src/components/layouts/BreadCrumb";
import TitleLayout from "src/components/layouts/TitleLayout";
import ContextualHelpPanel from "src/components/ContextualHelpPanel/ContextualHelpPanel";
import DataSpinner from "src/components/layouts/DataSpinner";
// Hooks
import { useTopologySegmentSettings } from "src/hooks/useTopologySegmentsSettingsData";
// Navigation
import { URL_PREFIX } from "src/navigation/NavRoutes";
import { NotFound } from "src/components/errors/PageErrors";
import { CnParams, useSafeParams } from "src/utils/paramsUtils";
// Redux
import { useAppDispatch } from "src/store/hooks";
import { updateBreadCrumbPath } from "src/store/Global/routes-slice";

interface TopologySegmentsTabsProps {
  section: string;
}

const TopologySegmentsTabs = ({ section }: TopologySegmentsTabsProps) => {
  const { cn } = useSafeParams<CnParams>(["cn"]);
  const [searchParams] = useSearchParams();
  const suffixCn = searchParams.get("suffix") || "domain";
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
  const segmentSettingsData = useTopologySegmentSettings(suffixCn, cn);

  // Tab
  const [activeTabKey, setActiveTabKey] = useState("settings");

  const handleTabClick = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    tabIndex: number | string
  ) => {
    if (tabIndex === "settings") {
      navigate(
        "/topology-segments/" + cn + "?suffix=" + encodeURIComponent(suffixCn)
      );
    }
  };

  React.useEffect(() => {
    // Update breadcrumb route
    const currentPath: BreadCrumbItem[] = [
      {
        name: "Topology segments",
        url: URL_PREFIX + "/topology-segments",
      },
      {
        name: cn,
        url:
          URL_PREFIX +
          "/topology-segments/" +
          cn +
          "?suffix=" +
          encodeURIComponent(suffixCn),
        isActive: true,
      },
    ];
    setBreadcrumbItems(currentPath);
    setActiveTabKey("settings");
    dispatch(updateBreadCrumbPath(currentPath));
  }, [cn, suffixCn]);

  // Redirect to the settings page if the section is not defined
  React.useEffect(() => {
    if (!section) {
      navigate(
        URL_PREFIX +
          "/topology-segments/" +
          cn +
          "?suffix=" +
          encodeURIComponent(suffixCn)
      );
    }
    setActiveTabKey(section);
  }, [section]);

  if (
    segmentSettingsData.isLoading ||
    segmentSettingsData.segment.cn === undefined
  ) {
    return <DataSpinner />;
  }

  // Show the 'NotFound' page if the segment is not found
  if (
    !segmentSettingsData.isLoading &&
    Object.keys(segmentSettingsData.segment).length === 0
  ) {
    return <NotFound />;
  }

  return (
    <>
      <ContextualHelpPanel
        fromPage="topology-segments-settings"
        isExpanded={isContextualPanelExpanded}
        onClose={onCloseContextualPanel}
      >
        <PageSection hasBodyWrapper={false}>
          <BreadCrumb
            className="pf-v6-u-mb-sm"
            breadcrumbItems={breadcrumbItems}
          />
          <TitleLayout
            id={segmentSettingsData.segment.cn}
            preText="Topology segment:"
            text={segmentSettingsData.segment.cn}
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
              <TopologySegmentsSettings
                suffixCn={suffixCn}
                segment={segmentSettingsData.segment}
                originalSegment={segmentSettingsData.originalSegment}
                metadata={segmentSettingsData.metadata}
                onSegmentChange={segmentSettingsData.setSegment}
                isDataLoading={segmentSettingsData.isFetching}
                onRefresh={segmentSettingsData.refetch}
                isModified={segmentSettingsData.modified}
                onResetValues={segmentSettingsData.resetValues}
                modifiedValues={segmentSettingsData.modifiedValues}
                onOpenContextualPanel={onOpenContextualPanel}
              />
            </Tab>
          </Tabs>
        </PageSection>
      </ContextualHelpPanel>
    </>
  );
};

export default TopologySegmentsTabs;
