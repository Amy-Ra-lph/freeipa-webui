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
  CertACL,
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
import AddCACLModal from "src/components/modals/CACLModals/AddCACLModal";
import DeleteCACLsModal from "src/components/modals/CACLModals/DeleteCACLsModal";
import EnableDisableCACLsModal from "src/components/modals/CACLModals/EnableDisableCACLsModal";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import useUpdateRoute from "src/hooks/useUpdateRoute";
import useListPageSearchParams from "src/hooks/useListPageSearchParams";
// Utils
import { API_VERSION_BACKUP } from "src/utils/utils";
// RPC client
import { GenericPayload } from "src/services/rpc";
import {
  useGettingCACLsQuery,
  useSearchCACLsEntriesMutation,
} from "src/services/rpcCACLs";
// Errors
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
import useApiError from "src/hooks/useApiError";
import GlobalErrors from "src/components/errors/GlobalErrors";
import ModalErrors from "src/components/errors/ModalErrors";

const isCACLSelectable = (cacl: CertACL) => cacl.cn !== "";

const CACLs = () => {
  const dispatch = useAppDispatch();

  const { browserTitle } = useUpdateRoute({ pathname: "ca-acls" });

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

  const caclsDataResponse = useGettingCACLsQuery({
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
  } = caclsDataResponse;

  // Search state - overrides query data when active
  const [searchCACLs, searchResult] = useSearchCACLsEntriesMutation({});
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchData, setSearchData] =
    useState<SearchDataResultType<CertACL> | null>(null);

  // Derive caclsList and totalCount from query response or search results
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
      const caclsListResult = batchResponse.result.results;
      const caclsListSize = batchResponse.result.count;
      const cacls: CertACL[] = [];

      for (let i = 0; i < caclsListSize; i++) {
        cacls.push(caclsListResult[i].result);
      }

      return {
        elementsList: cacls,
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
      caclsDataResponse.isError &&
      caclsDataResponse.error !== undefined
    ) {
      window.location.reload();
    }
  }, [caclsDataResponse.isError, isBatchLoading, isFetching]);

  const refreshData = () => {
    setIsSearchActive(false);
    setSearchData(null);
    clearSelectedCACLs();
    caclsDataResponse.refetch();
  };

  React.useEffect(() => {
    if (!isSearchActive) {
      caclsDataResponse.refetch();
    }
  }, [page, perPage]);

  const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] =
    useState<boolean>(true);
  const [isEnableButtonDisabled, setIsEnableButtonDisabled] =
    useState<boolean>(true);
  const [isDisableButtonDisabled, setIsDisableButtonDisabled] =
    useState<boolean>(true);

  const [isDeletion, setIsDeletion] = useState(false);
  const [isDisableEnableOp, setIsDisableEnableOp] = useState(false);

  const [selectedPerPage, setSelectedPerPage] = useState<number>(0);

  const [selectedCACLs, setSelectedCACLs] = useState<CertACL[]>([]);

  const clearSelectedCACLs = () => {
    setSelectedCACLs([]);
  };

  const [searchDisabled, setSearchIsDisabled] = useState<boolean>(false);

  const submitSearchValue = () => {
    setSearchIsDisabled(true);
    setIsSearchActive(true);

    searchCACLs({
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
              title: error || "Error when searching for CA ACLs",
              variant: "danger",
            })
          );
          setIsSearchActive(false);
          setSearchData(null);
        } else {
          const caclsListResult = result.data?.result.results || [];
          const caclsListSize = result.data?.result.count || 0;
          const searchTotalCount = result.data?.result.totalCount || 0;
          const cacls: CertACL[] = [];

          for (let i = 0; i < caclsListSize; i++) {
            cacls.push(caclsListResult[i].result);
          }

          setSearchData({
            elementsList: cacls,
            totalCount: searchTotalCount,
          });
        }
        setSearchIsDisabled(false);
      }
    });
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEnableDisableModal, setShowEnableDisableModal] = useState(false);
  const [enableDisableOptionSelected, setEnableDisableOptionSelected] =
    useState(false);

  const selectableCACLsTable = elementsList.filter(isCACLSelectable);

  const updateSelectedCACLs = (cacls: CertACL[], isSelected: boolean) => {
    let newSelectedCACLs: CertACL[] = [];
    if (isSelected) {
      newSelectedCACLs = JSON.parse(JSON.stringify(selectedCACLs));
      for (let i = 0; i < cacls.length; i++) {
        if (
          selectedCACLs.find(
            (s) => s.cn === cacls[i].cn
          )
        ) {
          continue;
        }
        newSelectedCACLs.push(cacls[i]);
      }
    } else {
      for (let i = 0; i < selectedCACLs.length; i++) {
        let found = false;
        for (let ii = 0; ii < cacls.length; ii++) {
          if (selectedCACLs[i].cn === cacls[ii].cn) {
            found = true;
            break;
          }
        }
        if (!found) {
          newSelectedCACLs.push(selectedCACLs[i]);
        }
      }
    }
    setSelectedCACLs(newSelectedCACLs);
    setIsDeleteButtonDisabled(newSelectedCACLs.length === 0);
    setIsEnableButtonDisabled(newSelectedCACLs.length === 0);
    setIsDisableButtonDisabled(newSelectedCACLs.length === 0);
  };

  const setCACLSelected = (cacl: CertACL, isSelecting = true) => {
    if (isCACLSelectable(cacl)) {
      updateSelectedCACLs([cacl], isSelecting);
    }
  };

  const paginationData = {
    page,
    perPage,
    updatePage: setPage,
    updatePerPage: setPerPage,
    updateSelectedPerPage: setSelectedPerPage,
    updateShownElementsList: (cacls: CertACL[]) => {
      if (isSearchActive) {
        setSearchData((prev) =>
          prev
            ? { ...prev, elementsList: cacls }
            : { elementsList: cacls, totalCount: 0 }
        );
      }
    },
    totalCount,
  };

  const bulkSelectorData = {
    selected: selectedCACLs,
    updateSelected: updateSelectedCACLs,
    selectableTable: selectableCACLsTable,
    nameAttr: "cn",
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

  const columnNames = ["ACL name", "Description", "Enabled"];
  const keyNames = ["cn", "description", "ipaenabledflag"];

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
          ariaLabel="Search CA ACLs"
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
          dataCy="cacls-button-refresh"
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
          dataCy="cacls-button-delete"
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
          dataCy="cacls-button-add"
        >
          Add
        </SecondaryButton>
      ),
    },
    {
      key: 6,
      element: (
        <SecondaryButton
          isDisabled={isEnableButtonDisabled || !showTableRows}
          onClickHandler={() => {
            setEnableDisableOptionSelected(false);
            setShowEnableDisableModal(true);
          }}
          dataCy="cacls-button-enable"
        >
          Enable
        </SecondaryButton>
      ),
    },
    {
      key: 7,
      element: (
        <SecondaryButton
          isDisabled={isDisableButtonDisabled || !showTableRows}
          onClickHandler={() => {
            setEnableDisableOptionSelected(true);
            setShowEnableDisableModal(true);
          }}
          dataCy="cacls-button-disable"
        >
          Disable
        </SecondaryButton>
      ),
    },
    {
      key: 8,
      toolbarItemVariant: ToolbarItemVariant.separator,
    },
    {
      key: 9,
      element: <HelpTextWithIconLayout textContent="Help" />,
    },
    {
      key: 10,
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
        <TitleLayout id="cacls-title" headingLevel="h1" text="CA ACLs" />
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
                    tableTitle="CA ACLs table"
                    shownElementsList={elementsList}
                    pk="cn"
                    keyNames={keyNames}
                    columnNames={columnNames}
                    hasCheckboxes={true}
                    pathname="ca-acls"
                    showTableRows={showTableRows}
                    showLink={true}
                    elementsData={{
                      isElementSelectable: isCACLSelectable,
                      selectedElements: selectedCACLs,
                      selectableElementsTable: selectableCACLsTable,
                      setElementsSelected: setCACLSelected,
                      clearSelectedElements: clearSelectedCACLs,
                    }}
                    buttonsData={{
                      updateIsDeleteButtonDisabled: setIsDeleteButtonDisabled,
                      isDeletion,
                      updateIsDeletion: setIsDeletion,
                      isDisableEnableOp,
                      updateIsDisableEnableOp: setIsDisableEnableOp,
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
      <AddCACLModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add CA ACL"
        onRefresh={refreshData}
      />
      <DeleteCACLsModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        elementsToDelete={selectedCACLs}
        clearSelectedElements={clearSelectedCACLs}
        columnNames={columnNames}
        keyNames={keyNames}
        onRefresh={refreshData}
        updateIsDeleteButtonDisabled={setIsDeleteButtonDisabled}
        updateIsDeletion={setIsDeletion}
      />
      {showEnableDisableModal && (
        <EnableDisableCACLsModal
          show={showEnableDisableModal}
          handleModalToggle={() => setShowEnableDisableModal(false)}
          optionSelected={enableDisableOptionSelected}
          selectedCACLsData={{
            selectedCACLs,
            clearSelectedCACLs,
          }}
          buttonsData={{
            updateIsEnableButtonDisabled: setIsEnableButtonDisabled,
            updateIsDisableButtonDisabled: setIsDisableButtonDisabled,
            updateIsDisableEnableOp: setIsDisableEnableOp,
          }}
          onRefresh={refreshData}
        />
      )}
      <ModalErrors errors={modalErrors.getAll()} dataCy="cacls-modal-error" />
    </div>
  );
};

export default CACLs;
