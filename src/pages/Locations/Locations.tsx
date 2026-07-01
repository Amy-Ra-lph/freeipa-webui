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
  Location,
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
import AddLocationModal from "src/components/modals/LocationModals/AddLocationModal";
import DeleteLocationsModal from "src/components/modals/LocationModals/DeleteLocationsModal";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import useUpdateRoute from "src/hooks/useUpdateRoute";
import useListPageSearchParams from "src/hooks/useListPageSearchParams";
// Utils
import { API_VERSION_BACKUP, isLocationSelectable } from "src/utils/utils";
// RPC client
import { GenericPayload } from "src/services/rpc";
import {
  useGettingLocationsQuery,
  useSearchLocationsEntriesMutation,
} from "src/services/rpcLocations";
// Errors
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
import useApiError from "src/hooks/useApiError";
import GlobalErrors from "src/components/errors/GlobalErrors";
import ModalErrors from "src/components/errors/ModalErrors";

const Locations = () => {
  const dispatch = useAppDispatch();

  const { browserTitle } = useUpdateRoute({ pathname: "locations" });

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

  const locationsDataResponse = useGettingLocationsQuery({
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
  } = locationsDataResponse;

  // Search state - overrides query data when active
  const [searchLocations, searchResult] =
    useSearchLocationsEntriesMutation({});
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchData, setSearchData] =
    useState<SearchDataResultType<Location> | null>(null);

  // Derive locationsList and totalCount from query response or search results
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
      const locationsListResult = batchResponse.result.results;
      const locationsListSize = batchResponse.result.count;
      const locations: Location[] = [];

      for (let i = 0; i < locationsListSize; i++) {
        locations.push(locationsListResult[i].result);
      }

      return {
        elementsList: locations,
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
      locationsDataResponse.isError &&
      locationsDataResponse.error !== undefined
    ) {
      window.location.reload();
    }
  }, [locationsDataResponse.isError, isBatchLoading, isFetching]);

  const refreshData = () => {
    setIsSearchActive(false);
    setSearchData(null);
    clearSelectedLocations();
    locationsDataResponse.refetch();
  };

  React.useEffect(() => {
    if (!isSearchActive) {
      locationsDataResponse.refetch();
    }
  }, [page, perPage]);

  const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] =
    useState<boolean>(true);

  const [isDeletion, setIsDeletion] = useState(false);

  const [selectedPerPage, setSelectedPerPage] = useState<number>(0);

  const [selectedLocations, setSelectedLocations] = useState<Location[]>([]);

  const clearSelectedLocations = () => {
    setSelectedLocations([]);
  };

  const [searchDisabled, setSearchIsDisabled] = useState<boolean>(false);

  const submitSearchValue = () => {
    setSearchIsDisabled(true);
    setIsSearchActive(true);

    searchLocations({
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
              title: error || "Error when searching for locations",
              variant: "danger",
            })
          );
          setIsSearchActive(false);
          setSearchData(null);
        } else {
          const locationsListResult = result.data?.result.results || [];
          const locationsListSize = result.data?.result.count || 0;
          const searchTotalCount = result.data?.result.totalCount || 0;
          const locations: Location[] = [];

          for (let i = 0; i < locationsListSize; i++) {
            locations.push(locationsListResult[i].result);
          }

          setSearchData({
            elementsList: locations,
            totalCount: searchTotalCount,
          });
        }
        setSearchIsDisabled(false);
      }
    });
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const selectableLocationsTable = elementsList.filter(isLocationSelectable);

  const updateSelectedLocations = (
    locations: Location[],
    isSelected: boolean
  ) => {
    let newSelectedLocations: Location[] = [];
    if (isSelected) {
      newSelectedLocations = JSON.parse(JSON.stringify(selectedLocations));
      for (let i = 0; i < locations.length; i++) {
        if (
          selectedLocations.find(
            (s) => s.idnsname[0] === locations[i].idnsname[0]
          )
        ) {
          continue;
        }
        newSelectedLocations.push(locations[i]);
      }
    } else {
      for (let i = 0; i < selectedLocations.length; i++) {
        let found = false;
        for (let ii = 0; ii < locations.length; ii++) {
          if (selectedLocations[i].idnsname[0] === locations[ii].idnsname[0]) {
            found = true;
            break;
          }
        }
        if (!found) {
          newSelectedLocations.push(selectedLocations[i]);
        }
      }
    }
    setSelectedLocations(newSelectedLocations);
    setIsDeleteButtonDisabled(newSelectedLocations.length === 0);
  };

  const setLocationSelected = (location: Location, isSelecting = true) => {
    if (isLocationSelectable(location)) {
      updateSelectedLocations([location], isSelecting);
    }
  };

  const paginationData = {
    page,
    perPage,
    updatePage: setPage,
    updatePerPage: setPerPage,
    updateSelectedPerPage: setSelectedPerPage,
    updateShownElementsList: (locations: Location[]) => {
      if (isSearchActive) {
        setSearchData((prev) =>
          prev
            ? { ...prev, elementsList: locations }
            : { elementsList: locations, totalCount: 0 }
        );
      }
    },
    totalCount,
  };

  const bulkSelectorData = {
    selected: selectedLocations,
    updateSelected: updateSelectedLocations,
    selectableTable: selectableLocationsTable,
    nameAttr: "idnsname",
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

  const columnNames = ["Location name", "Description"];
  const keyNames = ["idnsname", "description"];

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
          ariaLabel="Search locations"
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
          dataCy="locations-button-refresh"
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
          dataCy="locations-button-delete"
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
          dataCy="locations-button-add"
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
          id="locations-title"
          headingLevel="h1"
          text="IPA locations"
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
                    tableTitle="Locations table"
                    shownElementsList={elementsList}
                    pk="idnsname"
                    keyNames={keyNames}
                    columnNames={columnNames}
                    hasCheckboxes={true}
                    pathname="locations"
                    showTableRows={showTableRows}
                    showLink={true}
                    elementsData={{
                      isElementSelectable: isLocationSelectable,
                      selectedElements: selectedLocations,
                      selectableElementsTable: selectableLocationsTable,
                      setElementsSelected: setLocationSelected,
                      clearSelectedElements: clearSelectedLocations,
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
      <AddLocationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add location"
        onRefresh={refreshData}
      />
      <DeleteLocationsModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        elementsToDelete={selectedLocations}
        clearSelectedElements={clearSelectedLocations}
        columnNames={columnNames}
        keyNames={keyNames}
        onRefresh={refreshData}
        updateIsDeleteButtonDisabled={setIsDeleteButtonDisabled}
        updateIsDeletion={setIsDeletion}
      />
      <ModalErrors
        errors={modalErrors.getAll()}
        dataCy="locations-modal-error"
      />
    </div>
  );
};

export default Locations;
