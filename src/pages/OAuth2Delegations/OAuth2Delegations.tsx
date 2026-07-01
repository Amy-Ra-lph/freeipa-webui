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
import { useGettingOAuth2DelegationsQuery } from "src/services/rpcOAuth2";

interface OAuth2Delegation {
  dn: string;
  cn: string[];
  oauth2delegatesource?: string[];
  oauth2delegatetarget?: string[];
  oauth2delegatescope?: string[];
}

const OAuth2Delegations = () => {
  const [delegationsList, setDelegationsList] = useState<OAuth2Delegation[]>([]);
  const { browserTitle } = useUpdateRoute({ pathname: "oauth2-delegations" });

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

  const delegationsDataResponse = useGettingOAuth2DelegationsQuery({
    searchValue: "",
    sizeLimit: 0,
    apiVersion: apiVersion || API_VERSION_BACKUP,
    startIdx: firstIdx,
    stopIdx: lastIdx,
  } as GenericPayload);

  const {
    data: batchResponse,
    isLoading: isBatchLoading,
  } = delegationsDataResponse;

  useEffect(() => {
    if (delegationsDataResponse.isFetching) {
      setShowTableRows(false);
      setTotalCount(0);
      return;
    }
    if (
      delegationsDataResponse.isSuccess &&
      delegationsDataResponse.data &&
      batchResponse !== undefined
    ) {
      const resultsArr = batchResponse.result.results;
      const count = batchResponse.result.count;
      const total = batchResponse.result.totalCount;
      const list: OAuth2Delegation[] = [];
      for (let i = 0; i < count; i++) {
        list.push(resultsArr[i].result as OAuth2Delegation);
      }
      setDelegationsList(list);
      setTotalCount(total);
      setShowTableRows(true);
    }
    if (!delegationsDataResponse.isLoading && delegationsDataResponse.isError) {
      window.location.reload();
    }
  }, [delegationsDataResponse]);

  useEffect(() => {
    delegationsDataResponse.refetch();
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
    delegationsDataResponse.refetch();
  };

  const toolbarItems: ToolbarItem[] = [
    {
      key: 0,
      element: (
        <SearchInputLayout
          dataCy="delegations-search"
          name="search"
          ariaLabel="Search delegations"
          placeholder="Search delegations"
          searchValueData={searchValueData}
        />
      ),
    },
    {
      key: 1,
      element: (
        <SecondaryButton
          dataCy="delegations-button-refresh"
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
          list={delegationsList}
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
        id="oauth2-delegations-title"
        headingLevel="h1"
        text="Delegations"
      />
      <OuterScrollContainer>
        <ToolbarLayout
          className="pf-v6-u-pt-lg pf-v6-u-pb-md"
          contentClassName=""
          toolbarItems={toolbarItems}
        />
        <InnerScrollContainer>
          <MainTable
            tableTitle="Delegations table"
            shownElementsList={delegationsList}
            pk="cn"
            keyNames={["cn", "oauth2delegatesource", "oauth2delegatetarget", "oauth2delegatescope"]}
            columnNames={["Name", "Source", "Target", "Scope"]}
            hasCheckboxes={false}
            pathname="oauth2-delegations"
            showTableRows={showTableRows}
            showLink={false}
          />
        </InnerScrollContainer>
      </OuterScrollContainer>
      <PaginationLayout
        list={delegationsList}
        paginationData={paginationData}
        variant={PaginationVariant.bottom}
        widgetId="pagination-options-menu-bottom"
      />
    </PageSection>
  );
};

export default OAuth2Delegations;
