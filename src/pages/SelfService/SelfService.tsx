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
  SelfServicePermission,
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
import AddSelfServiceModal from "src/components/modals/SelfServiceModals/AddSelfServiceModal";
import DeleteSelfServiceModal from "src/components/modals/SelfServiceModals/DeleteSelfServiceModal";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import useUpdateRoute from "src/hooks/useUpdateRoute";
import useListPageSearchParams from "src/hooks/useListPageSearchParams";
// Utils
import { API_VERSION_BACKUP, isSelfServiceSelectable } from "src/utils/utils";
// RPC client
import { GenericPayload } from "src/services/rpc";
import {
  useGettingSelfServiceQuery,
  useSearchSelfServiceEntriesMutation,
} from "src/services/rpcSelfService";
// Errors
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
import useApiError from "src/hooks/useApiError";
import GlobalErrors from "src/components/errors/GlobalErrors";
import ModalErrors from "src/components/errors/ModalErrors";

const SelfService = () => {
  const dispatch = useAppDispatch();

  const { browserTitle } = useUpdateRoute({ pathname: "self-service" });

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

  const selfServiceDataResponse = useGettingSelfServiceQuery({
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
  } = selfServiceDataResponse;

  // Search state
  const [searchSelfService, searchResult] =
    useSearchSelfServiceEntriesMutation({});
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchData, setSearchData] =
    useState<SearchDataResultType<SelfServicePermission> | null>(null);

  // Derive list and totalCount
  const { elementsList, totalCount } = useMemo(() => {
    if (isSearchActive && searchData) {
      return {
        elementsList: searchData.elementsList,
        totalCount: searchData.totalCount,
      };
    }

    if (batchResponse?.result) {
      const listResult = batchResponse.result.results;
      const listSize = batchResponse.result.count;
      const items: SelfServicePermission[] = [];

      for (let i = 0; i < listSize; i++) {
        items.push(listResult[i].result);
      }

      return {
        elementsList: items,
        totalCount: batchResponse.result.totalCount,
      };
    }

    return { elementsList: [], totalCount: 0 };
  }, [batchResponse, isSearchActive, searchData]);

  const showTableRows = useMemo(() => {
    if (isSearchActive) {
      return !searchResult.isLoading;
    }
    return !isFetching && !isBatchLoading;
  }, [isFetching, isBatchLoading, isSearchActive, searchResult.isLoading]);

  React.useEffect(() => {
    if (isFetching) {
      globalErrors.clear();
    }
  }, [isFetching]);

  React.useEffect(() => {
    if (
      !isBatchLoading &&
      !isFetching &&
      selfServiceDataResponse.isError &&
      selfServiceDataResponse.error !== undefined
    ) {
      window.location.reload();
    }
  }, [selfServiceDataResponse.isError, isBatchLoading, isFetching]);

  const refreshData = () => {
    setIsSearchActive(false);
    setSearchData(null);
    clearSelectedSelfServices();
    selfServiceDataResponse.refetch();
  };

  React.useEffect(() => {
    if (!isSearchActive) {
      selfServiceDataResponse.refetch();
    }
  }, [page, perPage]);

  const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] =
    useState<boolean>(true);

  const [isDeletion, setIsDeletion] = useState(false);

  const [selectedPerPage, setSelectedPerPage] = useState<number>(0);

  const [selectedSelfServices, setSelectedSelfServices] = useState<
    SelfServicePermission[]
  >([]);

  const clearSelectedSelfServices = () => {
    setSelectedSelfServices([]);
  };

  const [searchDisabled, setSearchIsDisabled] = useState<boolean>(false);

  const submitSearchValue = () => {
    setSearchIsDisabled(true);
    setIsSearchActive(true);

    searchSelfService({
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
              title:
                error ||
                "Error when searching for self service permissions",
              variant: "danger",
            })
          );
          setIsSearchActive(false);
          setSearchData(null);
        } else {
          const listResult = result.data?.result.results || [];
          const listSize = result.data?.result.count || 0;
          const searchTotalCount = result.data?.result.totalCount || 0;
          const items: SelfServicePermission[] = [];

          for (let i = 0; i < listSize; i++) {
            items.push(listResult[i].result);
          }

          setSearchData({
            elementsList: items,
            totalCount: searchTotalCount,
          });
        }
        setSearchIsDisabled(false);
      }
    });
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const selectableTable = elementsList.filter(isSelfServiceSelectable);

  const updateSelectedSelfServices = (
    items: SelfServicePermission[],
    isSelected: boolean
  ) => {
    let newSelected: SelfServicePermission[] = [];
    if (isSelected) {
      newSelected = JSON.parse(JSON.stringify(selectedSelfServices));
      for (let i = 0; i < items.length; i++) {
        if (
          selectedSelfServices.find(
            (s) => s.aciname[0] === items[i].aciname[0]
          )
        ) {
          continue;
        }
        newSelected.push(items[i]);
      }
    } else {
      for (let i = 0; i < selectedSelfServices.length; i++) {
        let found = false;
        for (let ii = 0; ii < items.length; ii++) {
          if (selectedSelfServices[i].aciname[0] === items[ii].aciname[0]) {
            found = true;
            break;
          }
        }
        if (!found) {
          newSelected.push(selectedSelfServices[i]);
        }
      }
    }
    setSelectedSelfServices(newSelected);
    setIsDeleteButtonDisabled(newSelected.length === 0);
  };

  const setSelfServiceSelected = (
    item: SelfServicePermission,
    isSelecting = true
  ) => {
    if (isSelfServiceSelectable(item)) {
      updateSelectedSelfServices([item], isSelecting);
    }
  };

  const paginationData = {
    page,
    perPage,
    updatePage: setPage,
    updatePerPage: setPerPage,
    updateSelectedPerPage: setSelectedPerPage,
    updateShownElementsList: (items: SelfServicePermission[]) => {
      if (isSearchActive) {
        setSearchData((prev) =>
          prev
            ? { ...prev, elementsList: items }
            : { elementsList: items, totalCount: 0 }
        );
      }
    },
    totalCount,
  };

  const bulkSelectorData = {
    selected: selectedSelfServices,
    updateSelected: updateSelectedSelfServices,
    selectableTable: selectableTable,
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

  const columnNames = ["Self service name", "Attributes"];
  const keyNames = ["aciname", "attrs"];

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
          ariaLabel="Search self service permissions"
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
          dataCy="self-service-button-refresh"
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
          dataCy="self-service-button-delete"
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
          dataCy="self-service-button-add"
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
          id="self-service-title"
          headingLevel="h1"
          text="Self service permissions"
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
                    tableTitle="Self service permissions table"
                    shownElementsList={elementsList}
                    pk="aciname"
                    keyNames={keyNames}
                    columnNames={columnNames}
                    hasCheckboxes={true}
                    pathname="self-service"
                    showTableRows={showTableRows}
                    showLink={true}
                    elementsData={{
                      isElementSelectable: isSelfServiceSelectable,
                      selectedElements: selectedSelfServices,
                      selectableElementsTable: selectableTable,
                      setElementsSelected: setSelfServiceSelected,
                      clearSelectedElements: clearSelectedSelfServices,
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
      <AddSelfServiceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add self service permission"
        onRefresh={refreshData}
      />
      <DeleteSelfServiceModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        elementsToDelete={selectedSelfServices}
        clearSelectedElements={clearSelectedSelfServices}
        columnNames={columnNames}
        keyNames={keyNames}
        onRefresh={refreshData}
        updateIsDeleteButtonDisabled={setIsDeleteButtonDisabled}
        updateIsDeletion={setIsDeletion}
      />
      <ModalErrors
        errors={modalErrors.getAll()}
        dataCy="self-service-modal-error"
      />
    </div>
  );
};

export default SelfService;
