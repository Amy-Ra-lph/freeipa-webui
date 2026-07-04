import React, { useEffect, useState } from "react";
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
import { useAppSelector } from "src/store/hooks";
import { API_VERSION_BACKUP } from "src/utils/utils";

import { useGetOAuth2WorkloadEntriesQuery } from "src/services/rpcOAuth2";

interface OAuth2Workload {
  dn: string;
  cn: string[];
  oauth2workloadtype?: string[];
  oauth2spiffeid?: string[];
  oauth2workloadowner?: string[];
  oauth2workloadclient?: string[];
}

const Workloads = () => {
  const [workloadsList, setWorkloadsList] = useState<OAuth2Workload[]>([]);
  const { browserTitle } = useUpdateRoute({ pathname: "workloads" });

  React.useEffect(() => {
    document.title = browserTitle;
  }, [browserTitle]);

  const apiVersion = useAppSelector(
    (state) => state.global.environment.api_version
  ) as string;

  const { page, setPage, perPage, setPerPage, searchValue, setSearchValue } =
    useListPageSearchParams();

  const [totalCount, setTotalCount] = useState<number>(0);
  const [showTableRows, setShowTableRows] = useState(false);

  const firstIdx = (page - 1) * perPage;
  const lastIdx = page * perPage;

  const workloadsDataResponse = useGetOAuth2WorkloadEntriesQuery({
    searchValue: "",
    sizelimit: 0,
    apiVersion: apiVersion || API_VERSION_BACKUP,
    startIdx: firstIdx,
    stopIdx: lastIdx,
  });

  const {
    data: batchResponse,
    isLoading: isBatchLoading,
  } = workloadsDataResponse;

  useEffect(() => {
    if (workloadsDataResponse.isFetching) {
      setShowTableRows(false);
      setTotalCount(0);
      return;
    }
    if (
      workloadsDataResponse.isSuccess &&
      workloadsDataResponse.data &&
      batchResponse !== undefined
    ) {
      const resultsArr = batchResponse.result.results;
      const count = batchResponse.result.count;
      const total = batchResponse.result.totalCount;
      const list: OAuth2Workload[] = [];
      for (let i = 0; i < count; i++) {
        list.push(resultsArr[i].result as OAuth2Workload);
      }
      setWorkloadsList(list);
      setTotalCount(total);
      setShowTableRows(true);
    }
    if (!workloadsDataResponse.isLoading && workloadsDataResponse.isError) {
      window.location.reload();
    }
  }, [workloadsDataResponse]);

  useEffect(() => {
    workloadsDataResponse.refetch();
  }, []);

  useEffect(() => {
    if (showTableRows !== !isBatchLoading) {
      setShowTableRows(!isBatchLoading);
    }
  }, [isBatchLoading]);

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
    setShowTableRows(false);
    setTotalCount(0);
    workloadsDataResponse.refetch();
  };

  const toolbarItems: ToolbarItem[] = [
    {
      key: 0,
      element: (
        <SearchInputLayout
          dataCy="workloads-search"
          name="search"
          ariaLabel="Search workloads"
          placeholder="Search workloads"
          searchValueData={searchValueData}
        />
      ),
    },
    {
      key: 1,
      element: (
        <SecondaryButton
          dataCy="workloads-button-refresh"
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
          list={workloadsList}
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
        id="workloads-title"
        headingLevel="h1"
        text="Workloads"
      />
      <OuterScrollContainer>
        <ToolbarLayout
          className="pf-v6-u-pt-lg pf-v6-u-pb-md"
          contentClassName=""
          toolbarItems={toolbarItems}
        />
        <InnerScrollContainer>
          <MainTable
            tableTitle="Workloads table"
            shownElementsList={workloadsList}
            pk="cn"
            keyNames={["cn", "oauth2workloadtype", "oauth2spiffeid", "oauth2workloadclient"]}
            columnNames={["Name", "Type", "SPIFFE ID", "Client"]}
            hasCheckboxes={false}
            pathname="workloads"
            showTableRows={showTableRows}
            showLink={false}
          />
        </InnerScrollContainer>
      </OuterScrollContainer>
      <PaginationLayout
        list={workloadsList}
        paginationData={paginationData}
        variant={PaginationVariant.bottom}
        widgetId="pagination-options-menu-bottom"
      />
    </PageSection>
  );
};

export default Workloads;
