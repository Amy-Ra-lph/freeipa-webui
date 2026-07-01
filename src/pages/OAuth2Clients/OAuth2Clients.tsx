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
import { useGettingOAuth2ClientsQuery } from "src/services/rpcOAuth2";

interface OAuth2Client {
  dn: string;
  cn: string[];
  oauth2clientid?: string[];
  oauth2granttype?: string[];
  oauth2clienttype?: string[];
  description?: string[];
}

const OAuth2Clients = () => {
  const [clientsList, setClientsList] = useState<OAuth2Client[]>([]);
  const { browserTitle } = useUpdateRoute({ pathname: "oauth2-clients" });

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

  const clientsDataResponse = useGettingOAuth2ClientsQuery({
    searchValue: "",
    sizeLimit: 0,
    apiVersion: apiVersion || API_VERSION_BACKUP,
    startIdx: firstIdx,
    stopIdx: lastIdx,
  } as GenericPayload);

  const {
    data: batchResponse,
    isLoading: isBatchLoading,
  } = clientsDataResponse;

  useEffect(() => {
    if (clientsDataResponse.isFetching) {
      setShowTableRows(false);
      setTotalCount(0);
      return;
    }
    if (
      clientsDataResponse.isSuccess &&
      clientsDataResponse.data &&
      batchResponse !== undefined
    ) {
      const resultsArr = batchResponse.result.results;
      const count = batchResponse.result.count;
      const total = batchResponse.result.totalCount;
      const list: OAuth2Client[] = [];
      for (let i = 0; i < count; i++) {
        list.push(resultsArr[i].result as OAuth2Client);
      }
      setClientsList(list);
      setTotalCount(total);
      setShowTableRows(true);
    }
    if (
      !clientsDataResponse.isLoading &&
      clientsDataResponse.isError
    ) {
      window.location.reload();
    }
  }, [clientsDataResponse]);

  useEffect(() => {
    clientsDataResponse.refetch();
  }, []);

  useEffect(() => {
    if (showTableRows !== !isBatchLoading) {
      setShowTableRows(!isBatchLoading);
    }
  }, [isBatchLoading]);

  const refreshData = () => {
    setShowTableRows(false);
    setTotalCount(0);
    clientsDataResponse.refetch();
  };

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
          dataCy="oauth2clients-search"
          name="search"
          ariaLabel="Search OAuth2 clients"
          placeholder="Search OAuth2 clients"
          searchValueData={searchValueData}
        />
      ),
    },
    {
      key: 1,
      element: (
        <SecondaryButton
          dataCy="oauth2clients-button-refresh"
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
          list={clientsList}
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
        id="oauth2-clients-title"
        headingLevel="h1"
        text="OAuth2 Clients"
      />
      <OuterScrollContainer>
        <ToolbarLayout
          className="pf-v6-u-pt-lg pf-v6-u-pb-md"
          contentClassName=""
          toolbarItems={toolbarItems}
        />
        <InnerScrollContainer>
          <MainTable
            tableTitle="OAuth2 Clients table"
            shownElementsList={clientsList}
            pk="cn"
            keyNames={["cn", "oauth2clientid", "oauth2granttype", "oauth2clienttype"]}
            columnNames={["Name", "Client ID", "Grant Type", "Client Type"]}
            hasCheckboxes={false}
            pathname="oauth2-clients"
            showTableRows={showTableRows}
            showLink={false}
          />
        </InnerScrollContainer>
      </OuterScrollContainer>
      <PaginationLayout
        list={clientsList}
        paginationData={paginationData}
        variant={PaginationVariant.bottom}
        widgetId="pagination-options-menu-bottom"
      />
    </PageSection>
  );
};

export default OAuth2Clients;
