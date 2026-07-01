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
import { GenericPayload } from "src/services/rpc";
import { useGettingOAuth2WorkloadsQuery } from "src/services/rpcOAuth2";

interface SpiffeEntry {
  dn: string;
  cn: string[];
  oauth2spiffeid?: string[];
  oauth2workloadtype?: string[];
  oauth2workloadowner?: string[];
  oauth2workloadclient?: string[];
}

const SpiffeEntries = () => {
  const [entriesList, setEntriesList] = useState<SpiffeEntry[]>([]);
  const { browserTitle } = useUpdateRoute({ pathname: "spiffe-entries" });

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

  const entriesDataResponse = useGettingOAuth2WorkloadsQuery({
    searchValue: "",
    sizeLimit: 0,
    apiVersion: apiVersion || API_VERSION_BACKUP,
    startIdx: firstIdx,
    stopIdx: lastIdx,
  } as GenericPayload);

  const {
    data: batchResponse,
    isLoading: isBatchLoading,
  } = entriesDataResponse;

  useEffect(() => {
    if (entriesDataResponse.isFetching) {
      setShowTableRows(false);
      setTotalCount(0);
      return;
    }
    if (
      entriesDataResponse.isSuccess &&
      entriesDataResponse.data &&
      batchResponse !== undefined
    ) {
      const resultsArr = batchResponse.result.results;
      const count = batchResponse.result.count;
      const total = batchResponse.result.totalCount;
      const list: SpiffeEntry[] = [];
      for (let i = 0; i < count; i++) {
        const entry = resultsArr[i].result as SpiffeEntry;
        if (
          entry.oauth2spiffeid &&
          entry.oauth2spiffeid.length > 0 &&
          entry.oauth2spiffeid[0] !== ""
        ) {
          list.push(entry);
        }
      }
      setEntriesList(list);
      setTotalCount(list.length);
      setShowTableRows(true);
    }
    if (!entriesDataResponse.isLoading && entriesDataResponse.isError) {
      window.location.reload();
    }
  }, [entriesDataResponse]);

  useEffect(() => {
    entriesDataResponse.refetch();
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
    entriesDataResponse.refetch();
  };

  const toolbarItems: ToolbarItem[] = [
    {
      key: 0,
      element: (
        <SearchInputLayout
          dataCy="spiffe-entries-search"
          name="search"
          ariaLabel="Search SPIFFE entries"
          placeholder="Search SPIFFE entries"
          searchValueData={searchValueData}
        />
      ),
    },
    {
      key: 1,
      element: (
        <SecondaryButton
          dataCy="spiffe-entries-button-refresh"
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
          list={entriesList}
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
        id="spiffe-entries-title"
        headingLevel="h1"
        text="SPIFFE Entries"
      />
      <OuterScrollContainer>
        <ToolbarLayout
          className="pf-v6-u-pt-lg pf-v6-u-pb-md"
          contentClassName=""
          toolbarItems={toolbarItems}
        />
        <InnerScrollContainer>
          <MainTable
            tableTitle="SPIFFE Entries table"
            shownElementsList={entriesList}
            pk="cn"
            keyNames={["oauth2spiffeid", "cn", "oauth2workloadtype", "oauth2workloadowner"]}
            columnNames={["SPIFFE ID", "Workload", "Type", "Owner"]}
            hasCheckboxes={false}
            pathname="spiffe-entries"
            showTableRows={showTableRows}
            showLink={false}
          />
        </InnerScrollContainer>
      </OuterScrollContainer>
      <PaginationLayout
        list={entriesList}
        paginationData={paginationData}
        variant={PaginationVariant.bottom}
        widgetId="pagination-options-menu-bottom"
      />
    </PageSection>
  );
};

export default SpiffeEntries;
