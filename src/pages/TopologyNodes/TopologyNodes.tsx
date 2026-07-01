import React, { useEffect, useMemo, useState } from "react";
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
import { IpaServer } from "src/utils/datatypes/globalDataTypes";
import { useFindServerQuery } from "src/services/rpcServer";

const TopologyNodes = () => {
  const { browserTitle } = useUpdateRoute({ pathname: "topology-nodes" });

  React.useEffect(() => {
    document.title = browserTitle;
  }, [browserTitle]);

  const { page, setPage, perPage, setPerPage, searchValue, setSearchValue } =
    useListPageSearchParams();

  const serverDataResponse = useFindServerQuery({
    cn: "",
    sizelimit: 100,
  });

  const {
    data: serverList,
    isLoading,
    isFetching,
  } = serverDataResponse;

  const filteredServers = useMemo(() => {
    if (!serverList) return [];
    if (!searchValue) return serverList;
    return serverList.filter((s) =>
      s.cn.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [serverList, searchValue]);

  const totalCount = filteredServers.length;
  const firstIdx = (page - 1) * perPage;
  const pagedServers = filteredServers.slice(firstIdx, firstIdx + perPage);

  const showTableRows = !isLoading && !isFetching;

  const tableData = useMemo(() => {
    return pagedServers.map((srv) => ({
      cn: [srv.cn],
      enabled_role_servrole: srv.enabled_role_servrole || [],
      iparepltopomanagedsuffix: srv.iparepltopomanagedsuffix || [],
      dn: srv.dn,
    }));
  }, [pagedServers]);

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

  const refreshData = () => {
    serverDataResponse.refetch();
  };

  const toolbarItems: ToolbarItem[] = [
    {
      key: 0,
      element: (
        <SearchInputLayout
          dataCy="topology-nodes-search"
          name="search"
          ariaLabel="Search topology nodes"
          placeholder="Search topology nodes"
          searchValueData={searchValueData}
        />
      ),
    },
    {
      key: 1,
      element: (
        <SecondaryButton
          dataCy="topology-nodes-button-refresh"
          onClickHandler={refreshData}
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
        id="topology-nodes-title"
        headingLevel="h1"
        text="Topology Nodes"
      />
      <OuterScrollContainer>
        <ToolbarLayout
          className="pf-v6-u-pt-lg pf-v6-u-pb-md"
          contentClassName=""
          toolbarItems={toolbarItems}
        />
        <InnerScrollContainer>
          <MainTable
            tableTitle="Topology Nodes table"
            shownElementsList={tableData}
            pk="cn"
            keyNames={["cn", "enabled_role_servrole", "iparepltopomanagedsuffix"]}
            columnNames={["Server Name", "Roles", "Managed Suffixes"]}
            hasCheckboxes={false}
            pathname="topology-nodes"
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

export default TopologyNodes;
