import React, { useCallback, useEffect, useMemo, useState } from "react";
// PatternFly
import {
  Card,
  CardBody,
  Flex,
  FlexItem,
  FormGroup,
  Label,
  MenuToggle,
  MenuToggleElement,
  PageSection,
  PaginationVariant,
  Progress,
  Select,
  SelectList,
  SelectOption,
  ToggleGroup,
  ToggleGroupItem,
  ToolbarItemVariant,
} from "@patternfly/react-core";
// PatternFly topology
import {
  NodeModel,
  EdgeModel,
  NodeShape,
  EdgeStyle,
} from "@patternfly/react-topology";
// PatternFly icons
import { ServerIcon, TableIcon, TopologyIcon } from "@patternfly/react-icons";
// PatternFly table
import {
  InnerScrollContainer,
  OuterScrollContainer,
} from "@patternfly/react-table";
// Data types
import {
  TopologySegment,
  SearchDataResultType,
} from "src/utils/datatypes/globalDataTypes";
import { ToolbarItem } from "src/components/layouts/ToolbarLayout";
// Redux
import { useAppDispatch, useAppSelector } from "src/store/hooks";
// Layouts
import TitleLayout from "src/components/layouts/TitleLayout";
import HelpTextWithIconLayout from "src/components/layouts/HelpTextWithIconLayout";
import SecondaryButton from "src/components/layouts/SecondaryButton";
import ToolbarLayout from "src/components/layouts/ToolbarLayout";
import SearchInputLayout from "src/components/layouts/SearchInputLayout";
// Tables
import MainTable from "src/components/tables/MainTable";
// Components
import PaginationLayout from "src/components/layouts/PaginationLayout";
import BulkSelectorPrep from "src/components/BulkSelectorPrep";
import TopologyVisualization from "src/components/TopologyVisualization/TopologyVisualization";
// Modals
import AddTopologySegmentModal from "src/components/modals/TopologySegmentModals/AddTopologySegmentModal";
import DeleteTopologySegmentsModal from "src/components/modals/TopologySegmentModals/DeleteTopologySegmentsModal";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import useUpdateRoute from "src/hooks/useUpdateRoute";
import useListPageSearchParams from "src/hooks/useListPageSearchParams";
import { useTopologyGraph } from "src/hooks/useTopologyGraph";
// Utils
import {
  API_VERSION_BACKUP,
  isTopologySegmentSelectable,
} from "src/utils/utils";
import { apiToTopologySegment } from "src/utils/topologySegmentsUtils";
import {
  computeTopologyAnalysis,
  computeHealthScore,
  classifyTopologyPattern,
  simulateSingleFailure,
  healthScoreVariant,
  HealthScore,
  TopologyPattern,
  TopologyAnalysis,
  FailureSimResult,
} from "src/utils/topologyAnalysis";
// RPC client
import { useSearchTopologySegmentsEntriesMutation } from "src/services/rpcTopologySegments";
// Errors
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
import useApiError from "src/hooks/useApiError";
import GlobalErrors from "src/components/errors/GlobalErrors";
import ModalErrors from "src/components/errors/ModalErrors";

// The two well-known IPA topology suffixes
const SUFFIX_OPTIONS = ["domain", "ca"];
const DEFAULT_SUFFIX = "domain";

const TopologySegments = () => {
  const dispatch = useAppDispatch();

  const { browserTitle } = useUpdateRoute({ pathname: "topology-segments" });

  React.useEffect(() => {
    document.title = browserTitle;
  }, [browserTitle]);

  const apiVersion = useAppSelector(
    (state) => state.global.environment.api_version
  ) as string;

  const { page, setPage, perPage, setPerPage, searchValue, setSearchValue } =
    useListPageSearchParams();

  const globalErrors = useApiError([]);
  const modalErrors = useApiError([]);

  const firstIdx = (page - 1) * perPage;
  const lastIdx = page * perPage;

  // Suffix selector state
  const [selectedSuffix, setSelectedSuffix] = useState(DEFAULT_SUFFIX);
  const [isSuffixOpen, setIsSuffixOpen] = useState(false);

  // View toggle state: table (default) or graph
  const [viewMode, setViewMode] = useState<"table" | "graph">("table");

  // Failure simulation state
  const [simulateServer, setSimulateServer] = useState<string | null>(null);
  const [isSimSelectorOpen, setIsSimSelectorOpen] = useState(false);

  // Search / data loading via mutation (segments require suffixCn)
  const [searchSegments, searchResult] =
    useSearchTopologySegmentsEntriesMutation({});

  const [segmentsData, setSegmentsData] =
    useState<SearchDataResultType<TopologySegment> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [selectedPerPage, setSelectedPerPage] = useState<number>(0);
  const [searchDisabled, setSearchIsDisabled] = useState<boolean>(false);

  // Selection state
  const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] =
    useState<boolean>(true);
  const [isDeletion, setIsDeletion] = useState(false);
  const [selectedSegments, setSelectedSegments] = useState<TopologySegment[]>(
    []
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const clearSelectedSegments = () => {
    setSelectedSegments([]);
  };

  // Graph data (loaded when graph mode is active or preloaded for quick toggle)
  const {
    isLoading: isGraphLoading,
    refetch: refetchGraph,
    servers,
    topologySegments: allGraphSegments,
  } = useTopologyGraph();

  // Filter graph segments by the currently selected suffix
  const filteredGraphSegments = useMemo(
    () => allGraphSegments.filter((seg) => seg.suffixType === selectedSuffix),
    [allGraphSegments, selectedSuffix]
  );

  // Build node and edge models for the graph visualization
  const graphNodes: NodeModel[] = useMemo(
    () =>
      servers.map((srv) => ({
        id: `node-${srv.cn}`,
        type: "node",
        label: srv.cn,
        width: 70,
        height: 70,
        shape: NodeShape.ellipse,
        data: { icon: ServerIcon },
      })),
    [servers]
  );

  const graphEdges: EdgeModel[] = useMemo(
    () =>
      filteredGraphSegments.map((seg) => ({
        id: `edge-${seg.iparepltoposegmentleftnode}-${seg.iparepltoposegmentrightnode}`,
        type: "edge",
        source: `node-${seg.iparepltoposegmentleftnode}`,
        target: `node-${seg.iparepltoposegmentrightnode}`,
        edgeStyle: EdgeStyle.default,
        data: { suffixType: seg.suffixType, segmentCN: seg.cn },
      })),
    [filteredGraphSegments]
  );

  // Topology analysis computations (pure functions, memoized)
  const topologyAnalysis: TopologyAnalysis = useMemo(
    () => computeTopologyAnalysis(servers, filteredGraphSegments, selectedSuffix),
    [servers, filteredGraphSegments, selectedSuffix]
  );

  const healthScore: HealthScore = useMemo(
    () => computeHealthScore(servers, filteredGraphSegments, selectedSuffix),
    [servers, filteredGraphSegments, selectedSuffix]
  );

  const topologyPattern: TopologyPattern = useMemo(
    () =>
      classifyTopologyPattern(servers, filteredGraphSegments, selectedSuffix),
    [servers, filteredGraphSegments, selectedSuffix]
  );

  // Failure simulation result (computed only when a server is selected)
  const failureSimResult: FailureSimResult | null = useMemo(() => {
    if (!simulateServer) return null;
    return simulateSingleFailure(
      servers,
      filteredGraphSegments,
      simulateServer,
      selectedSuffix
    );
  }, [servers, filteredGraphSegments, simulateServer, selectedSuffix]);

  // Fetch segments for the selected suffix
  const fetchSegments = useCallback(
    (search: string) => {
      setIsLoading(true);
      setHasError(false);

      searchSegments({
        suffixCn: selectedSuffix,
        searchValue: search,
        sizeLimit: 0,
        apiVersion: apiVersion || API_VERSION_BACKUP,
        startIdx: firstIdx,
        stopIdx: lastIdx,
      }).then((result) => {
        if ("data" in result) {
          const searchError = result.data?.error as
            | FetchBaseQueryError
            | SerializedError;

          if (searchError) {
            let error: string | undefined = "";
            if ("error" in searchError) {
              error = searchError.error;
            } else if ("message" in searchError) {
              error = searchError.message;
            }
            dispatch(
              addAlert({
                name: "fetch-segments-error",
                title:
                  error || "Error when fetching topology segments",
                variant: "danger",
              })
            );
            setSegmentsData(null);
            setHasError(true);
          } else {
            const segmentsListResult = result.data?.result.results || [];
            const segmentsListSize = result.data?.result.count || 0;
            const searchTotalCount = result.data?.result.totalCount || 0;
            const segments: TopologySegment[] = [];

            for (let i = 0; i < segmentsListSize; i++) {
              const segment = apiToTopologySegment(
                segmentsListResult[i].result
              );
              segment.suffixType = selectedSuffix;
              segments.push(segment);
            }

            setSegmentsData({
              elementsList: segments,
              totalCount: searchTotalCount,
            });
          }
        } else {
          setHasError(true);
        }
        setIsLoading(false);
        setSearchIsDisabled(false);
      });
    },
    [selectedSuffix, apiVersion, firstIdx, lastIdx, dispatch, searchSegments]
  );

  // Initial load and reload when suffix, page, or perPage changes
  useEffect(() => {
    fetchSegments(searchValue);
  }, [selectedSuffix, page, perPage]);

  const { elementsList, totalCount } = useMemo(() => {
    if (segmentsData) {
      return {
        elementsList: segmentsData.elementsList,
        totalCount: segmentsData.totalCount,
      };
    }
    return { elementsList: [], totalCount: 0 };
  }, [segmentsData]);

  const showTableRows = useMemo(() => {
    return !isLoading && !searchResult.isLoading;
  }, [isLoading, searchResult.isLoading]);

  const refreshData = () => {
    setSearchValue("");
    clearSelectedSegments();
    setIsDeleteButtonDisabled(true);
    fetchSegments("");
  };

  const submitSearchValue = () => {
    setSearchIsDisabled(true);
    fetchSegments(searchValue);
  };

  // Suffix selector handlers
  const onSuffixToggle = () => {
    setIsSuffixOpen(!isSuffixOpen);
  };

  const onSuffixSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    selection: string | number | undefined
  ) => {
    if (selection && typeof selection === "string") {
      setSelectedSuffix(selection);
      setPage(1);
      setSearchValue("");
      clearSelectedSegments();
      setIsDeleteButtonDisabled(true);
    }
    setIsSuffixOpen(false);
  };

  const suffixToggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      data-cy="topology-segments-suffix-selector"
      ref={toggleRef}
      onClick={onSuffixToggle}
      isExpanded={isSuffixOpen}
    >
      {selectedSuffix}
    </MenuToggle>
  );

  // Simulation server selector handlers
  const onSimSelectorToggle = () => {
    setIsSimSelectorOpen(!isSimSelectorOpen);
  };

  const onSimServerSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    selection: string | number | undefined
  ) => {
    if (selection && typeof selection === "string") {
      setSimulateServer(selection === "__none__" ? null : selection);
    }
    setIsSimSelectorOpen(false);
  };

  const simSelectorToggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      data-cy="topology-segments-sim-selector"
      ref={toggleRef}
      onClick={onSimSelectorToggle}
      isExpanded={isSimSelectorOpen}
    >
      {simulateServer || "Simulate failure..."}
    </MenuToggle>
  );

  // Selection handlers
  const selectableSegmentsTable = elementsList.filter(
    isTopologySegmentSelectable
  );

  const updateSelectedSegments = (
    segments: TopologySegment[],
    isSelected: boolean
  ) => {
    let newSelectedSegments: TopologySegment[] = [];
    if (isSelected) {
      newSelectedSegments = JSON.parse(JSON.stringify(selectedSegments));
      for (let i = 0; i < segments.length; i++) {
        if (
          selectedSegments.find((s) => s.cn[0] === segments[i].cn[0])
        ) {
          continue;
        }
        newSelectedSegments.push(segments[i]);
      }
    } else {
      for (let i = 0; i < selectedSegments.length; i++) {
        let found = false;
        for (let ii = 0; ii < segments.length; ii++) {
          if (selectedSegments[i].cn[0] === segments[ii].cn[0]) {
            found = true;
            break;
          }
        }
        if (!found) {
          newSelectedSegments.push(selectedSegments[i]);
        }
      }
    }
    setSelectedSegments(newSelectedSegments);
    setIsDeleteButtonDisabled(newSelectedSegments.length === 0);
  };

  const setSegmentSelected = (
    segment: TopologySegment,
    isSelecting = true
  ) => {
    if (isTopologySegmentSelectable(segment)) {
      updateSelectedSegments([segment], isSelecting);
    }
  };

  const paginationData = {
    page,
    perPage,
    updatePage: setPage,
    updatePerPage: setPerPage,
    updateSelectedPerPage: setSelectedPerPage,
    updateShownElementsList: (segments: TopologySegment[]) => {
      setSegmentsData((prev) =>
        prev
          ? { ...prev, elementsList: segments }
          : { elementsList: segments, totalCount: 0 }
      );
    },
    totalCount,
  };

  const bulkSelectorData = {
    selected: selectedSegments,
    updateSelected: updateSelectedSegments,
    selectableTable: selectableSegmentsTable,
    nameAttr: "cn",
  };

  const buttonsData = {
    updateIsDeleteButtonDisabled: setIsDeleteButtonDisabled,
  };

  const selectedPerPageData = {
    selectedPerPage,
    updateSelectedPerPage: setSelectedPerPage,
  };

  const searchValueData = {
    searchValue,
    updateSearchValue: setSearchValue,
    submitSearchValue,
  };

  const columnNames = ["Segment name", "Left node", "Right node"];
  const keyNames = [
    "cn",
    "iparepltoposegmentleftnode",
    "iparepltoposegmentrightnode",
  ];

  const toolbarItems: ToolbarItem[] = [
    {
      key: 0,
      element: (
        <BulkSelectorPrep
          list={elementsList}
          shownElementsList={elementsList}
          elementData={bulkSelectorData}
          buttonsData={buttonsData}
          selectedPerPageData={selectedPerPageData}
        />
      ),
    },
    {
      key: 1,
      element: (
        <SearchInputLayout
          dataCy="search"
          name="search"
          ariaLabel="Search topology segments"
          placeholder="Search topology segments"
          searchValueData={searchValueData}
          isDisabled={searchDisabled}
        />
      ),
      toolbarItemVariant: ToolbarItemVariant.label,
      toolbarItemGap: { default: "gapMd" },
    },
    {
      key: 2,
      toolbarItemVariant: ToolbarItemVariant.separator,
    },
    {
      key: 3,
      element: (
        <SecondaryButton
          onClickHandler={refreshData}
          isDisabled={!showTableRows}
          dataCy="topology-segments-button-refresh"
        >
          Refresh
        </SecondaryButton>
      ),
    },
    {
      key: 4,
      element: (
        <SecondaryButton
          isDisabled={isDeleteButtonDisabled || !showTableRows}
          onClickHandler={() => setShowDeleteModal(true)}
          dataCy="topology-segments-button-delete"
        >
          Delete
        </SecondaryButton>
      ),
    },
    {
      key: 5,
      element: (
        <SecondaryButton
          onClickHandler={() => setShowAddModal(true)}
          isDisabled={!showTableRows}
          dataCy="topology-segments-button-add"
        >
          Add
        </SecondaryButton>
      ),
    },
    {
      key: 6,
      toolbarItemVariant: ToolbarItemVariant.separator,
    },
    {
      key: 7,
      element: <HelpTextWithIconLayout textContent="Help" />,
    },
    {
      key: 8,
      element: (
        <PaginationLayout
          list={elementsList}
          paginationData={paginationData}
          widgetId="pagination-options-menu-top"
          isCompact={true}
        />
      ),
      toolbarItemAlignment: { default: "alignEnd" },
    },
  ];

  // Articulation points and bridges counts for display
  const articulationPointCount = topologyAnalysis.articulationPoints.size;
  const bridgeCount = topologyAnalysis.bridges.size;

  // Health score Progress bar variant helper
  const progressVariant = (
    pts: number,
    max: number
  ): "success" | "warning" | "danger" | undefined => {
    const pct = max > 0 ? (pts / max) * 100 : 0;
    if (pct >= 80) return "success";
    if (pct >= 50) return "warning";
    return "danger";
  };

  return (
    <div>
      <PageSection hasBodyWrapper={false}>
        <TitleLayout
          id="topology-segments-title"
          headingLevel="h1"
          text="Topology segments"
        />
      </PageSection>
      <PageSection hasBodyWrapper={false} isFilled={false}>
        <Flex direction={{ default: "column" }}>
          {/* Row: View toggle + Suffix selector */}
          <FlexItem>
            <Flex
              spaceItems={{ default: "spaceItemsMd" }}
              alignItems={{ default: "alignItemsFlexEnd" }}
            >
              <FlexItem>
                <ToggleGroup aria-label="View mode toggle">
                  <ToggleGroupItem
                    icon={<TableIcon />}
                    text="Table"
                    aria-label="Table view"
                    buttonId="toggle-table"
                    isSelected={viewMode === "table"}
                    onChange={() => setViewMode("table")}
                    data-cy="topology-segments-view-table"
                  />
                  <ToggleGroupItem
                    icon={<TopologyIcon />}
                    text="Graph"
                    aria-label="Graph view"
                    buttonId="toggle-graph"
                    isSelected={viewMode === "graph"}
                    onChange={() => setViewMode("graph")}
                    data-cy="topology-segments-view-graph"
                  />
                </ToggleGroup>
              </FlexItem>
              <FlexItem>
                <FormGroup
                  label="Topology suffix"
                  fieldId="topology-segments-suffix-selector"
                >
                  <Select
                    data-cy="topology-segments-suffix-select"
                    aria-label="Select topology suffix"
                    toggle={suffixToggle}
                    onSelect={onSuffixSelect}
                    selected={selectedSuffix}
                    isOpen={isSuffixOpen}
                    onOpenChange={(isOpen) => setIsSuffixOpen(isOpen)}
                  >
                    <SelectList>
                      {SUFFIX_OPTIONS.map((suffix) => (
                        <SelectOption
                          data-cy={
                            "topology-segments-suffix-option-" + suffix
                          }
                          key={suffix}
                          value={suffix}
                        >
                          {suffix}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </FormGroup>
              </FlexItem>
              {/* Simulation selector — only in graph mode */}
              {viewMode === "graph" && (
                <FlexItem>
                  <FormGroup
                    label="Simulate failure"
                    fieldId="topology-segments-sim-selector"
                  >
                    <Select
                      data-cy="topology-segments-sim-select"
                      aria-label="Select server to simulate failure"
                      toggle={simSelectorToggle}
                      onSelect={onSimServerSelect}
                      selected={simulateServer || ""}
                      isOpen={isSimSelectorOpen}
                      onOpenChange={(isOpen) => setIsSimSelectorOpen(isOpen)}
                    >
                      <SelectList>
                        <SelectOption
                          key="__none__"
                          value="__none__"
                          data-cy="topology-segments-sim-option-none"
                        >
                          (No simulation)
                        </SelectOption>
                        {servers.map((srv) => (
                          <SelectOption
                            key={srv.cn}
                            value={srv.cn}
                            data-cy={
                              "topology-segments-sim-option-" + srv.cn
                            }
                          >
                            {srv.cn}
                          </SelectOption>
                        ))}
                      </SelectList>
                    </Select>
                  </FormGroup>
                </FlexItem>
              )}
              {/* Refresh button for graph mode */}
              {viewMode === "graph" && (
                <FlexItem>
                  <SecondaryButton
                    onClickHandler={() => {
                      refetchGraph();
                      setSimulateServer(null);
                    }}
                    isDisabled={isGraphLoading}
                    dataCy="topology-segments-graph-refresh"
                  >
                    Refresh
                  </SecondaryButton>
                </FlexItem>
              )}
              {/* Clear simulation button */}
              {viewMode === "graph" && simulateServer && (
                <FlexItem>
                  <SecondaryButton
                    onClickHandler={() => setSimulateServer(null)}
                    dataCy="topology-segments-sim-clear"
                  >
                    Clear simulation
                  </SecondaryButton>
                </FlexItem>
              )}
            </Flex>
          </FlexItem>

          {/* ===== TABLE MODE ===== */}
          {viewMode === "table" && (
            <>
              <FlexItem>
                <ToolbarLayout toolbarItems={toolbarItems} />
              </FlexItem>
              <FlexItem style={{ flex: "0 0 auto" }}>
                <OuterScrollContainer>
                  <InnerScrollContainer
                    style={{ height: "60vh", overflow: "auto" }}
                  >
                    {hasError ? (
                      <GlobalErrors errors={globalErrors.getAll()} />
                    ) : (
                      <MainTable
                        tableTitle="Topology segments table"
                        shownElementsList={elementsList}
                        pk="cn"
                        keyNames={keyNames}
                        columnNames={columnNames}
                        hasCheckboxes={true}
                        pathname="topology-segments"
                        showTableRows={showTableRows}
                        showLink={true}
                        elementsData={{
                          isElementSelectable: isTopologySegmentSelectable,
                          selectedElements: selectedSegments,
                          selectableElementsTable: selectableSegmentsTable,
                          setElementsSelected: setSegmentSelected,
                          clearSelectedElements: clearSelectedSegments,
                        }}
                        buttonsData={{
                          updateIsDeleteButtonDisabled:
                            setIsDeleteButtonDisabled,
                          isDeletion,
                          updateIsDeletion: setIsDeletion,
                        }}
                        paginationData={{
                          selectedPerPage,
                          updateSelectedPerPage: setSelectedPerPage,
                        }}
                      />
                    )}
                  </InnerScrollContainer>
                </OuterScrollContainer>
              </FlexItem>
              <FlexItem
                style={{ flex: "0 0 auto", position: "sticky", bottom: 0 }}
              >
                <PaginationLayout
                  list={elementsList}
                  paginationData={paginationData}
                  variant={PaginationVariant.bottom}
                  widgetId="pagination-options-menu-bottom"
                />
              </FlexItem>
            </>
          )}

          {/* ===== GRAPH MODE ===== */}
          {viewMode === "graph" && (
            <>
              {/* Health summary card */}
              <FlexItem>
                <Card data-cy="topology-health-card">
                  <CardBody>
                    <Flex
                      spaceItems={{ default: "spaceItemsMd" }}
                      alignItems={{ default: "alignItemsCenter" }}
                    >
                      <FlexItem>
                        <Label
                          color={
                            healthScoreVariant(healthScore.score) === "success"
                              ? "green"
                              : healthScoreVariant(healthScore.score) ===
                                  "warning"
                                ? "orange"
                                : "red"
                          }
                          data-cy="topology-health-score"
                        >
                          Health: {healthScore.score}/100 ({healthScore.label})
                        </Label>
                      </FlexItem>
                      <FlexItem>
                        <Label color="blue" data-cy="topology-pattern-label">
                          {topologyPattern.patternLabel}
                        </Label>
                      </FlexItem>
                      <FlexItem>
                        <span>{healthScore.tierLabel}</span>
                      </FlexItem>
                      {articulationPointCount > 0 && (
                        <FlexItem>
                          <Label color="orange">
                            {articulationPointCount} articulation point
                            {articulationPointCount !== 1 ? "s" : ""}
                          </Label>
                        </FlexItem>
                      )}
                      {bridgeCount > 0 && (
                        <FlexItem>
                          <Label color="orange">
                            {bridgeCount} bridge
                            {bridgeCount !== 1 ? "s" : ""}
                          </Label>
                        </FlexItem>
                      )}
                    </Flex>
                    <Flex
                      direction={{ default: "column" }}
                      spaceItems={{ default: "spaceItemsSm" }}
                      style={{ marginTop: "16px" }}
                    >
                      {healthScore.breakdown.map((comp) => (
                        <FlexItem key={comp.key}>
                          <Progress
                            value={
                              comp.max > 0
                                ? Math.round((comp.pts / comp.max) * 100)
                                : 0
                            }
                            title={`${comp.name} (${comp.pts}/${comp.max})`}
                            label={`${comp.pts}/${comp.max}`}
                            variant={progressVariant(comp.pts, comp.max)}
                            data-cy={`topology-health-${comp.key}`}
                          />
                        </FlexItem>
                      ))}
                    </Flex>
                  </CardBody>
                </Card>
              </FlexItem>

              {/* Graph visualization */}
              <FlexItem style={{ minHeight: "500px" }}>
                <TopologyVisualization
                  nodes={graphNodes}
                  edges={graphEdges}
                  articulationPoints={
                    new Set(
                      [...topologyAnalysis.articulationPoints].map(
                        (n) => `node-${n}`
                      )
                    )
                  }
                  bridges={topologyAnalysis.bridges}
                  simulatingFailure={
                    simulateServer ? `node-${simulateServer}` : null
                  }
                  isolatedInSimulation={
                    failureSimResult
                      ? new Set(
                          failureSimResult.isolatedNodes.map(
                            (n) => `node-${n}`
                          )
                        )
                      : undefined
                  }
                />
              </FlexItem>

              {/* Failure simulation results card */}
              {simulateServer && failureSimResult && (
                <FlexItem>
                  <Card data-cy="topology-sim-result-card">
                    <CardBody>
                      <Flex
                        direction={{ default: "column" }}
                        spaceItems={{ default: "spaceItemsSm" }}
                      >
                        <FlexItem>
                          <strong>
                            Simulated failure: {failureSimResult.name}
                          </strong>
                        </FlexItem>
                        <FlexItem>
                          <Flex spaceItems={{ default: "spaceItemsMd" }}>
                            <FlexItem>
                              Stays connected:{" "}
                              <Label
                                color={
                                  failureSimResult.staysConnected
                                    ? "green"
                                    : "red"
                                }
                                data-cy="topology-sim-connected"
                              >
                                {failureSimResult.staysConnected ? "Yes" : "No"}
                              </Label>
                            </FlexItem>
                            <FlexItem>
                              Diameter change:{" "}
                              <Label
                                color={
                                  failureSimResult.diameterChange > 0
                                    ? "orange"
                                    : "green"
                                }
                              >
                                {failureSimResult.diameterChange > 0 ? "+" : ""}
                                {failureSimResult.diameterChange}
                              </Label>
                            </FlexItem>
                          </Flex>
                        </FlexItem>
                        {failureSimResult.isolatedNodes.length > 0 && (
                          <FlexItem>
                            <Label color="red">
                              Isolated nodes:{" "}
                              {failureSimResult.isolatedNodes.join(", ")}
                            </Label>
                          </FlexItem>
                        )}
                        {failureSimResult.lostRedundancy.length > 0 && (
                          <FlexItem>
                            <Label color="orange">
                              Lost redundancy:{" "}
                              {failureSimResult.lostRedundancy.join(", ")}
                            </Label>
                          </FlexItem>
                        )}
                      </Flex>
                    </CardBody>
                  </Card>
                </FlexItem>
              )}
              {/* Message when simulation selected but server not found */}
              {simulateServer && !failureSimResult && (
                <FlexItem>
                  <Card>
                    <CardBody>
                      Server &quot;{simulateServer}&quot; is not participating
                      in the {selectedSuffix} suffix topology.
                    </CardBody>
                  </Card>
                </FlexItem>
              )}
            </>
          )}
        </Flex>
      </PageSection>
      <AddTopologySegmentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add topology segment"
        onRefresh={refreshData}
        suffixCn={selectedSuffix}
      />
      <DeleteTopologySegmentsModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        elementsToDelete={selectedSegments}
        clearSelectedElements={clearSelectedSegments}
        columnNames={columnNames}
        columnIds={keyNames}
        onRefresh={refreshData}
        updateIsDeleteButtonDisabled={setIsDeleteButtonDisabled}
        updateIsDeletion={setIsDeletion}
        suffixCn={selectedSuffix}
      />
      <ModalErrors
        errors={modalErrors.getAll()}
        dataCy="topology-segments-modal-error"
      />
    </div>
  );
};

export default TopologySegments;
