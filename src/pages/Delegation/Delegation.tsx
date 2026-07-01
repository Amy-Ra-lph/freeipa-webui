import React, { useMemo, useState } from "react";
// PatternFly
import {
  Flex,
  FlexItem,
  PageSection,
  PaginationVariant,
  ToolbarItemVariant,
} from "@patternfly/react-core";
// PatternFly table
import {
  InnerScrollContainer,
  OuterScrollContainer,
} from "@patternfly/react-table";
// Data types
import {
  DelegationPermission,
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
// Modals
import AddDelegationModal from "src/components/modals/DelegationModals/AddDelegationModal";
import DeleteDelegationModal from "src/components/modals/DelegationModals/DeleteDelegationModal";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import useUpdateRoute from "src/hooks/useUpdateRoute";
import useListPageSearchParams from "src/hooks/useListPageSearchParams";
// Utils
import { API_VERSION_BACKUP, isDelegationSelectable } from "src/utils/utils";
// RPC client
import { GenericPayload } from "src/services/rpc";
import {
  useGettingDelegationQuery,
  useSearchDelegationEntriesMutation,
} from "src/services/rpcDelegation";
// Errors
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
import useApiError from "src/hooks/useApiError";
import GlobalErrors from "src/components/errors/GlobalErrors";
import ModalErrors from "src/components/errors/ModalErrors";

const Delegation = () => {
  const dispatch = useAppDispatch();

  const { browserTitle } = useUpdateRoute({ pathname: "delegation" });

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

  const delegationDataResponse = useGettingDelegationQuery({
    searchValue: "",
    sizeLimit: 0,
    apiVersion: apiVersion || API_VERSION_BACKUP,
    startIdx: firstIdx,
    stopIdx: lastIdx,
  } as GenericPayload);

  const {
    data: batchResponse,
    isLoading: isBatchLoading,
    isFetching,
    error: batchError,
  } = delegationDataResponse;

  // Search state - overrides query data when active
  const [searchDelegations, searchResult] =
    useSearchDelegationEntriesMutation({});
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchData, setSearchData] =
    useState<SearchDataResultType<DelegationPermission> | null>(null);

  // Derive delegationsList and totalCount from query response or search results
  const { elementsList, totalCount } = useMemo(() => {
    // If search is active and has results, use search data
    if (isSearchActive && searchData) {
      return {
        elementsList: searchData.elementsList,
        totalCount: searchData.totalCount,
      };
    }

    // Otherwise derive from query response
    if (batchResponse?.result) {
      const delegationsListResult = batchResponse.result.results;
      const delegationsListSize = batchResponse.result.count;
      const delegations: DelegationPermission[] = [];

      for (let i = 0; i < delegationsListSize; i++) {
        delegations.push(delegationsListResult[i].result);
      }

      return {
        elementsList: delegations,
        totalCount: batchResponse.result.totalCount,
      };
    }

    return { elementsList: [], totalCount: 0 };
  }, [batchResponse, isSearchActive, searchData]);

  // Derive showTableRows from loading states
  const showTableRows = useMemo(() => {
    if (isSearchActive) {
      return !searchResult.isLoading;
    }
    return !isFetching && !isBatchLoading;
  }, [isFetching, isBatchLoading, isSearchActive, searchResult.isLoading]);

  // Clear errors when fetching starts
  React.useEffect(() => {
    if (isFetching) {
      globalErrors.clear();
    }
  }, [isFetching]);

  // Handle query errors
  React.useEffect(() => {
    if (
      !isBatchLoading &&
      !isFetching &&
      delegationDataResponse.isError &&
      delegationDataResponse.error !== undefined
    ) {
      window.location.reload();
    }
  }, [delegationDataResponse.isError, isBatchLoading, isFetching]);

  const refreshData = () => {
    setIsSearchActive(false);
    setSearchData(null);
    clearSelectedDelegations();
    delegationDataResponse.refetch();
  };

  React.useEffect(() => {
    if (!isSearchActive) {
      delegationDataResponse.refetch();
    }
  }, [page, perPage]);

  const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] =
    useState<boolean>(true);

  const [isDeletion, setIsDeletion] = useState(false);

  const [selectedPerPage, setSelectedPerPage] = useState<number>(0);

  const [selectedDelegations, setSelectedDelegations] = useState<
    DelegationPermission[]
  >([]);

  const clearSelectedDelegations = () => {
    setSelectedDelegations([]);
  };

  const [searchDisabled, setSearchIsDisabled] = useState<boolean>(false);

  const submitSearchValue = () => {
    setSearchIsDisabled(true);
    setIsSearchActive(true);

    searchDelegations({
      searchValue: searchValue,
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
              name: "submit-search-value-error",
              title: error || "Error when searching for delegations",
              variant: "danger",
            })
          );
          setIsSearchActive(false);
          setSearchData(null);
        } else {
          const delegationsListResult = result.data?.result.results || [];
          const delegationsListSize = result.data?.result.count || 0;
          const searchTotalCount = result.data?.result.totalCount || 0;
          const delegations: DelegationPermission[] = [];

          for (let i = 0; i < delegationsListSize; i++) {
            delegations.push(delegationsListResult[i].result);
          }

          setSearchData({
            elementsList: delegations,
            totalCount: searchTotalCount,
          });
        }
        setSearchIsDisabled(false);
      }
    });
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const selectableDelegationsTable =
    elementsList.filter(isDelegationSelectable);

  const updateSelectedDelegations = (
    delegations: DelegationPermission[],
    isSelected: boolean
  ) => {
    let newSelectedDelegations: DelegationPermission[] = [];
    if (isSelected) {
      newSelectedDelegations = JSON.parse(
        JSON.stringify(selectedDelegations)
      );
      for (let i = 0; i < delegations.length; i++) {
        if (
          selectedDelegations.find(
            (s) => s.aciname[0] === delegations[i].aciname[0]
          )
        ) {
          continue;
        }
        newSelectedDelegations.push(delegations[i]);
      }
    } else {
      for (let i = 0; i < selectedDelegations.length; i++) {
        let found = false;
        for (let ii = 0; ii < delegations.length; ii++) {
          if (
            selectedDelegations[i].aciname[0] === delegations[ii].aciname[0]
          ) {
            found = true;
            break;
          }
        }
        if (!found) {
          newSelectedDelegations.push(selectedDelegations[i]);
        }
      }
    }
    setSelectedDelegations(newSelectedDelegations);
    setIsDeleteButtonDisabled(newSelectedDelegations.length === 0);
  };

  const setDelegationSelected = (
    delegation: DelegationPermission,
    isSelecting = true
  ) => {
    if (isDelegationSelectable(delegation)) {
      updateSelectedDelegations([delegation], isSelecting);
    }
  };

  const paginationData = {
    page,
    perPage,
    updatePage: setPage,
    updatePerPage: setPerPage,
    updateSelectedPerPage: setSelectedPerPage,
    updateShownElementsList: (delegations: DelegationPermission[]) => {
      if (isSearchActive) {
        setSearchData((prev) =>
          prev
            ? { ...prev, elementsList: delegations }
            : { elementsList: delegations, totalCount: 0 }
        );
      }
    },
    totalCount,
  };

  const bulkSelectorData = {
    selected: selectedDelegations,
    updateSelected: updateSelectedDelegations,
    selectableTable: selectableDelegationsTable,
    nameAttr: "aciname",
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

  const columnNames = [
    "Delegation name",
    "Delegated group",
    "Member group",
    "Permissions",
  ];
  const keyNames = ["aciname", "group", "memberof", "permissions"];

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
          ariaLabel="Search delegations"
          placeholder="Search"
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
          dataCy="delegation-button-refresh"
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
          dataCy="delegation-button-delete"
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
          dataCy="delegation-button-add"
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

  return (
    <div>
      <PageSection hasBodyWrapper={false}>
        <TitleLayout
          id="delegation-title"
          headingLevel="h1"
          text="Delegations"
        />
      </PageSection>
      <PageSection hasBodyWrapper={false} isFilled={false}>
        <Flex direction={{ default: "column" }}>
          <FlexItem>
            <ToolbarLayout toolbarItems={toolbarItems} />
          </FlexItem>
          <FlexItem style={{ flex: "0 0 auto" }}>
            <OuterScrollContainer>
              <InnerScrollContainer
                style={{ height: "60vh", overflow: "auto" }}
              >
                {batchError !== undefined && batchError ? (
                  <GlobalErrors errors={globalErrors.getAll()} />
                ) : (
                  <MainTable
                    tableTitle="Delegations table"
                    shownElementsList={elementsList}
                    pk="aciname"
                    keyNames={keyNames}
                    columnNames={columnNames}
                    hasCheckboxes={true}
                    pathname="delegation"
                    showTableRows={showTableRows}
                    showLink={true}
                    elementsData={{
                      isElementSelectable: isDelegationSelectable,
                      selectedElements: selectedDelegations,
                      selectableElementsTable: selectableDelegationsTable,
                      setElementsSelected: setDelegationSelected,
                      clearSelectedElements: clearSelectedDelegations,
                    }}
                    buttonsData={{
                      updateIsDeleteButtonDisabled: setIsDeleteButtonDisabled,
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
        </Flex>
      </PageSection>
      <AddDelegationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add delegation"
        onRefresh={refreshData}
      />
      <DeleteDelegationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        elementsToDelete={selectedDelegations}
        clearSelectedElements={clearSelectedDelegations}
        columnNames={columnNames}
        keyNames={keyNames}
        onRefresh={refreshData}
        updateIsDeleteButtonDisabled={setIsDeleteButtonDisabled}
        updateIsDeletion={setIsDeletion}
      />
      <ModalErrors
        errors={modalErrors.getAll()}
        dataCy="delegation-modal-error"
      />
    </div>
  );
};

export default Delegation;
