import React, { useEffect, useState } from "react";
import { Flex, FlexItem, PageSection, PaginationVariant, ToolbarItemVariant } from "@patternfly/react-core";
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
import BulkSelectorPrep from "src/components/BulkSelectorPrep";
import useUpdateRoute from "src/hooks/useUpdateRoute";
import useListPageSearchParams from "src/hooks/useListPageSearchParams";
import { useAppSelector } from "src/store/hooks";
import { API_VERSION_BACKUP } from "src/utils/utils";
import { GenericPayload } from "src/services/rpc";
import { useGettingOAuth2ScopesQuery } from "src/services/rpcOAuth2";
import { OAuth2Scope } from "src/utils/datatypes/globalDataTypes";
import AddOAuth2Scope from "src/components/modals/OAuth2Modals/AddOAuth2Scope";
import DeleteOAuth2Scopes from "src/components/modals/OAuth2Modals/DeleteOAuth2Scopes";

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
  const [selectedScopes, setSelectedScopes] = useState<OAuth2Scope[]>([]);
  const [selectedPerPage, setSelectedPerPage] = useState<number>(0);
  const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] = useState<boolean>(true);
  const [isDeletion, setIsDeletion] = useState(false);

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
  }, [page, perPage]);

  useEffect(() => {
    if (showTableRows !== !isBatchLoading) {
      setShowTableRows(!isBatchLoading);
    }
  }, [isBatchLoading]);

  const clearSelectedScopes = () => {
    setSelectedScopes([]);
  };

  const refreshData = () => {
    setShowTableRows(false);
    setTotalCount(0);
    clearSelectedScopes();
    scopesDataResponse.refetch();
  };

  const updateSelectedScopes = (scopes: OAuth2Scope[], isSelected: boolean) => {
    let newSelected: OAuth2Scope[] = [];
    if (isSelected) {
      newSelected = JSON.parse(JSON.stringify(selectedScopes));
      for (let i = 0; i < scopes.length; i++) {
        if (
          selectedScopes.find(
            (sel) => sel.cn[0] === scopes[i].cn[0]
          )
        ) {
          continue;
        }
        newSelected.push(scopes[i]);
      }
    } else {
      for (let i = 0; i < selectedScopes.length; i++) {
        let found = false;
        for (let ii = 0; ii < scopes.length; ii++) {
          if (selectedScopes[i].cn[0] === scopes[ii].cn[0]) {
            found = true;
            break;
          }
        }
        if (!found) {
          newSelected.push(selectedScopes[i]);
        }
      }
    }
    setSelectedScopes(newSelected);
    setIsDeleteButtonDisabled(newSelected.length === 0);
  };

  const updateIsDeleteButtonDisabled = (value: boolean) => {
    setIsDeleteButtonDisabled(value);
  };

  const updateIsDeletion = (value: boolean) => {
    setIsDeletion(value);
  };

  const updateSelectedPerPage = (selected: number) => {
    setSelectedPerPage(selected);
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const onAddClickHandler = () => {
    setShowAddModal(true);
  };

  const onCloseAddModal = () => {
    setShowAddModal(false);
  };

  const onAddModalToggle = () => {
    setShowAddModal(!showAddModal);
  };

  const onDeleteHandler = () => {
    setShowDeleteModal(true);
  };

  const onDeleteModalToggle = () => {
    setShowDeleteModal(!showDeleteModal);
  };

  const scopesBulkSelectorData = {
    selected: selectedScopes,
    updateSelected: updateSelectedScopes,
    selectableTable: scopesList,
    nameAttr: "cn",
  };

  const buttonsData = {
    updateIsDeleteButtonDisabled,
  };

  const selectedPerPageData = {
    selectedPerPage,
    updateSelectedPerPage,
  };

  const deleteScopesButtonsData = {
    updateIsDeleteButtonDisabled,
    updateIsDeletion,
  };

  const selectedScopesData = {
    selectedScopes,
    clearSelectedScopes,
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
    updateSelectedPerPage,
    totalCount,
  };

  const toolbarItems: ToolbarItem[] = [
    {
      key: 0,
      element: (
        <BulkSelectorPrep
          list={scopesList}
          shownElementsList={scopesList}
          elementData={scopesBulkSelectorData}
          buttonsData={buttonsData}
          selectedPerPageData={selectedPerPageData}
        />
      ),
    },
    {
      key: 1,
      element: (
        <SearchInputLayout
          dataCy="oauth2scopes-search"
          name="search"
          ariaLabel="Search OAuth2 scopes"
          placeholder="Search OAuth2 scopes"
          searchValueData={searchValueData}
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
          dataCy="oauth2scopes-button-refresh"
          onClickHandler={refreshData}
          isDisabled={!showTableRows}
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
          onClickHandler={onDeleteHandler}
          dataCy="oauth2scopes-button-delete"
        >
          Delete
        </SecondaryButton>
      ),
    },
    {
      key: 5,
      element: (
        <SecondaryButton
          onClickHandler={onAddClickHandler}
          isDisabled={!showTableRows}
          dataCy="oauth2scopes-button-add"
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
    <div>
      <PageSection hasBodyWrapper={false}>
        <TitleLayout
          id="oauth2-scopes-title"
          headingLevel="h1"
          text="OAuth2 Scopes"
        />
      </PageSection>
      <PageSection hasBodyWrapper={false} isFilled={false}>
        <Flex direction={{ default: "column" }}>
          <FlexItem>
            <ToolbarLayout toolbarItems={toolbarItems} />
          </FlexItem>
          <FlexItem style={{ flex: "0 0 auto" }}>
            <OuterScrollContainer>
              <InnerScrollContainer style={{ height: "60vh", overflow: "auto" }}>
                <MainTable
                  tableTitle="OAuth2 Scopes table"
                  shownElementsList={scopesList}
                  pk="cn"
                  keyNames={["cn", "description"]}
                  columnNames={["Name", "Description"]}
                  hasCheckboxes={true}
                  pathname="oauth2-scopes"
                  showTableRows={showTableRows}
                  showLink={true}
                />
              </InnerScrollContainer>
            </OuterScrollContainer>
          </FlexItem>
          <FlexItem style={{ flex: "0 0 auto", position: "sticky", bottom: 0 }}>
            <PaginationLayout
              list={scopesList}
              paginationData={paginationData}
              variant={PaginationVariant.bottom}
              widgetId="pagination-options-menu-bottom"
            />
          </FlexItem>
        </Flex>
      </PageSection>
      <AddOAuth2Scope
        show={showAddModal}
        handleModalToggle={onAddModalToggle}
        onOpenAddModal={onAddClickHandler}
        onCloseAddModal={onCloseAddModal}
        onRefresh={refreshData}
      />
      <DeleteOAuth2Scopes
        show={showDeleteModal}
        handleModalToggle={onDeleteModalToggle}
        selectedScopesData={selectedScopesData}
        buttonsData={deleteScopesButtonsData}
        onRefresh={refreshData}
      />
    </div>
  );
};

export default OAuth2Scopes;
