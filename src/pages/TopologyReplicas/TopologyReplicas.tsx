import React, { useMemo } from "react";
import { PageSection, PaginationVariant } from "@patternfly/react-core";
import {
  InnerScrollContainer,
  OuterScrollContainer,
} from "@patternfly/react-table";
import TitleLayout from "src/components/layouts/TitleLayout";
import ToolbarLayout, {
  ToolbarItem,
} from "src/components/layouts/ToolbarLayout";
import SearchInputLayout from "src/components/layouts/SearchInputLayout";
import SecondaryButton from "src/components/layouts/SecondaryButton";
import PaginationLayout from "src/components/layouts/PaginationLayout";
import MainTable from "src/components/tables/MainTable";
import useUpdateRoute from "src/hooks/useUpdateRoute";
import useListPageSearchParams from "src/hooks/useListPageSearchParams";
import { useTopologyGraph } from "src/hooks/useTopologyGraph";

const TopologyReplicas = () => {
  const { browserTitle } = useUpdateRoute({ pathname: "topology-replicas" });

  React.useEffect(() => {
    document.title = browserTitle;
  }, [browserTitle]);

  const { page, setPage, perPage, setPerPage, searchValue, setSearchValue } =
    useListPageSearchParams();

  const { isLoading, refetch, topologySegments } = useTopologyGraph();

  const filteredSegments = useMemo(() => {
    if (!searchValue) return topologySegments;
    const lower = searchValue.toLowerCase();
    return topologySegments.filter(
      (s) =>
        s.cn.toLowerCase().includes(lower) ||
        s.iparepltoposegmentleftnode.toLowerCase().includes(lower) ||
        s.iparepltoposegmentrightnode.toLowerCase().includes(lower)
    );
  }, [topologySegments, searchValue]);

  const totalCount = filteredSegments.length;
  const firstIdx = (page - 1) * perPage;
  const pagedSegments = filteredSegments.slice(firstIdx, firstIdx + perPage);

  const showTableRows = !isLoading;

  const tableData = useMemo(() => {
    return pagedSegments.map((seg) => ({
      cn: [seg.cn],
      iparepltoposegmentleftnode: [seg.iparepltoposegmentleftnode],
      iparepltoposegmentrightnode: [seg.iparepltoposegmentrightnode],
      iparepltoposegmentdirection: [seg.iparepltoposegmentdirection],
      suffixType: [seg.suffixType],
      dn: "",
    }));
  }, [pagedSegments]);

  const searchValueData = {
    searchValue,
    updateSearchValue: setSearchValue,
  };

  const paginationData = {
    page,
    perPage,
    updatePage: setPage,
    updatePerPage: setPerPage,
    updateSelectedPerPage: () => {},
    totalCount,
  };

  const toolbarItems: ToolbarItem[] = [
    {
      key: 0,
      element: (
        <SearchInputLayout
          dataCy="topology-replicas-search"
          name="search"
          ariaLabel="Search topology replicas"
          placeholder="Search topology replicas"
          searchValueData={searchValueData}
        />
      ),
    },
    {
      key: 1,
      element: (
        <SecondaryButton
          dataCy="topology-replicas-button-refresh"
          onClickHandler={refetch}
          isDisabled={!showTableRows}
        >
          Refresh
        </SecondaryButton>
      ),
    },
    {
      key: 2,
      element: (
        <PaginationLayout
          list={tableData}
          paginationData={paginationData}
          widgetId="pagination-options-menu-top"
          isCompact={true}
        />
      ),
      toolbarItemAlignment: { default: "alignEnd" },
    },
  ];

  return (
    <PageSection>
      <TitleLayout
        id="topology-replicas-title"
        headingLevel="h1"
        text="Topology Replicas"
      />
      <OuterScrollContainer>
        <ToolbarLayout
          className="pf-v6-u-pt-lg pf-v6-u-pb-md"
          contentClassName=""
          toolbarItems={toolbarItems}
        />
        <InnerScrollContainer>
          <MainTable
            tableTitle="Topology Replicas table"
            shownElementsList={tableData}
            pk="cn"
            keyNames={[
              "cn",
              "iparepltoposegmentleftnode",
              "iparepltoposegmentrightnode",
              "suffixType",
            ]}
            columnNames={["Segment", "Left Node", "Right Node", "Suffix"]}
            hasCheckboxes={false}
            pathname="topology-replicas"
            showTableRows={showTableRows}
            showLink={false}
          />
        </InnerScrollContainer>
      </OuterScrollContainer>
      <PaginationLayout
        list={tableData}
        paginationData={paginationData}
        variant={PaginationVariant.bottom}
        widgetId="pagination-options-menu-bottom"
      />
    </PageSection>
  );
};

export default TopologyReplicas;
