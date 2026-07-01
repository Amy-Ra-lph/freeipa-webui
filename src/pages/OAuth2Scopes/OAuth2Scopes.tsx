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
import { useGettingOAuth2ScopesQuery } from "src/services/rpcOAuth2";

interface OAuth2Scope {
  dn: string;
  cn: string[];
  oauth2scope?: string[];
  oauth2scopedescription?: string[];
}

const OAuth2Scopes = () => {
  const [scopesList, setScopesList] = useState<OAuth2Scope[]>([]);
  const { browserTitle } = useUpdateRoute({ pathname: "oauth2-scopes" });

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

  const scopesDataResponse = useGettingOAuth2ScopesQuery({
    searchValue: "",
    sizeLimit: 0,
    apiVersion: apiVersion || API_VERSION_BACKUP,
    startIdx: firstIdx,
    stopIdx: lastIdx,
  } as GenericPayload);

  const {
    data: batchResponse,
    isLoading: isBatchLoading,
  } = scopesDataResponse;

  useEffect(() => {
    if (scopesDataResponse.isFetching) {
      setShowTableRows(false);
      setTotalCount(0);
      return;
    }
    if (
      scopesDataResponse.isSuccess &&
      scopesDataResponse.data &&
      batchResponse !== undefined
    ) {
      const resultsArr = batchResponse.result.results;
      const count = batchResponse.result.count;
      const total = batchResponse.result.totalCount;
      const list: OAuth2Scope[] = [];
      for (let i = 0; i < count; i++) {
        list.push(resultsArr[i].result as OAuth2Scope);
      }
      setScopesList(list);
      setTotalCount(total);
      setShowTableRows(true);
    }
    if (!scopesDataResponse.isLoading && scopesDataResponse.isError) {
      window.location.reload();
    }
  }, [scopesDataResponse]);

  useEffect(() => {
    scopesDataResponse.refetch();
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
    scopesDataResponse.refetch();
  };

  const toolbarItems: ToolbarItem[] = [
    {
      key: 0,
      element: (
        <SearchInputLayout
          dataCy="oauth2scopes-search"
          name="search"
          ariaLabel="Search OAuth2 scopes"
          placeholder="Search OAuth2 scopes"
          searchValueData={searchValueData}
        />
      ),
    },
    {
      key: 1,
      element: (
        <SecondaryButton
          dataCy="oauth2scopes-button-refresh"
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
          list={scopesList}
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
        id="oauth2-scopes-title"
        headingLevel="h1"
        text="OAuth2 Scopes"
      />
      <OuterScrollContainer>
        <ToolbarLayout
          className="pf-v6-u-pt-lg pf-v6-u-pb-md"
          contentClassName=""
          toolbarItems={toolbarItems}
        />
        <InnerScrollContainer>
          <MainTable
            tableTitle="OAuth2 Scopes table"
            shownElementsList={scopesList}
            pk="cn"
            keyNames={["cn", "oauth2scope", "oauth2scopedescription"]}
            columnNames={["Name", "Scope Value", "Description"]}
            hasCheckboxes={false}
            pathname="oauth2-scopes"
            showTableRows={showTableRows}
            showLink={false}
          />
        </InnerScrollContainer>
      </OuterScrollContainer>
      <PaginationLayout
        list={scopesList}
        paginationData={paginationData}
        variant={PaginationVariant.bottom}
        widgetId="pagination-options-menu-bottom"
      />
    </PageSection>
  );
};

export default OAuth2Scopes;
