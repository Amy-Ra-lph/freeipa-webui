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
  CertificateAuthority,
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
import AddCertAuthorityModal from "src/components/modals/CertAuthorityModals/AddCertAuthorityModal";
import DeleteCertAuthoritiesModal from "src/components/modals/CertAuthorityModals/DeleteCertAuthoritiesModal";
import EnableDisableCertAuthoritiesModal from "src/components/modals/CertAuthorityModals/EnableDisableCertAuthoritiesModal";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import useUpdateRoute from "src/hooks/useUpdateRoute";
import useListPageSearchParams from "src/hooks/useListPageSearchParams";
// Utils
import { API_VERSION_BACKUP } from "src/utils/utils";
// RPC client
import { GenericPayload } from "src/services/rpc";
import {
  useGettingCertAuthoritiesQuery,
  useSearchCertAuthoritiesEntriesMutation,
} from "src/services/rpcCertAuthorities";
// Errors
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
import useApiError from "src/hooks/useApiError";
import GlobalErrors from "src/components/errors/GlobalErrors";
import ModalErrors from "src/components/errors/ModalErrors";

const isCertAuthoritySelectable = (ca: CertificateAuthority) =>
  Array.isArray(ca.cn) ? ca.cn.length > 0 && ca.cn[0] !== "" : ca.cn !== "";

const CertAuthorities = () => {
  const dispatch = useAppDispatch();

  const { browserTitle } = useUpdateRoute({ pathname: "cert-authorities" });

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

  const certAuthoritiesDataResponse = useGettingCertAuthoritiesQuery({
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
  } = certAuthoritiesDataResponse;

  // Search state - overrides query data when active
  const [searchCertAuthorities, searchResult] =
    useSearchCertAuthoritiesEntriesMutation({});
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchData, setSearchData] =
    useState<SearchDataResultType<CertificateAuthority> | null>(null);

  // Derive elementsList and totalCount from query response or search results
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
      const casListResult = batchResponse.result.results;
      const casListSize = batchResponse.result.count;
      const cas: CertificateAuthority[] = [];

      for (let i = 0; i < casListSize; i++) {
        cas.push(casListResult[i].result);
      }

      return {
        elementsList: cas,
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
      certAuthoritiesDataResponse.isError &&
      certAuthoritiesDataResponse.error !== undefined
    ) {
      window.location.reload();
    }
  }, [certAuthoritiesDataResponse.isError, isBatchLoading, isFetching]);

  const refreshData = () => {
    setIsSearchActive(false);
    setSearchData(null);
    clearSelectedCertAuthorities();
    certAuthoritiesDataResponse.refetch();
  };

  React.useEffect(() => {
    if (!isSearchActive) {
      certAuthoritiesDataResponse.refetch();
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

  const [selectedCertAuthorities, setSelectedCertAuthorities] = useState<
    CertificateAuthority[]
  >([]);

  const clearSelectedCertAuthorities = () => {
    setSelectedCertAuthorities([]);
  };

  const [searchDisabled, setSearchIsDisabled] = useState<boolean>(false);

  const submitSearchValue = () => {
    setSearchIsDisabled(true);
    setIsSearchActive(true);

    searchCertAuthorities({
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
                "Error when searching for certificate authorities",
              variant: "danger",
            })
          );
          setIsSearchActive(false);
          setSearchData(null);
        } else {
          const casListResult = result.data?.result.results || [];
          const casListSize = result.data?.result.count || 0;
          const searchTotalCount = result.data?.result.totalCount || 0;
          const cas: CertificateAuthority[] = [];

          for (let i = 0; i < casListSize; i++) {
            cas.push(casListResult[i].result);
          }

          setSearchData({
            elementsList: cas,
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

  const selectableCertAuthoritiesTable =
    elementsList.filter(isCertAuthoritySelectable);

  const updateSelectedCertAuthorities = (
    cas: CertificateAuthority[],
    isSelected: boolean
  ) => {
    let newSelectedCas: CertificateAuthority[] = [];
    if (isSelected) {
      newSelectedCas = JSON.parse(JSON.stringify(selectedCertAuthorities));
      for (let i = 0; i < cas.length; i++) {
        if (
          selectedCertAuthorities.find(
            (s) => s.cn[0] === cas[i].cn[0]
          )
        ) {
          continue;
        }
        newSelectedCas.push(cas[i]);
      }
    } else {
      for (let i = 0; i < selectedCertAuthorities.length; i++) {
        let found = false;
        for (let ii = 0; ii < cas.length; ii++) {
          if (selectedCertAuthorities[i].cn[0] === cas[ii].cn[0]) {
            found = true;
            break;
          }
        }
        if (!found) {
          newSelectedCas.push(selectedCertAuthorities[i]);
        }
      }
    }
    setSelectedCertAuthorities(newSelectedCas);
    setIsDeleteButtonDisabled(newSelectedCas.length === 0);
    setIsEnableButtonDisabled(newSelectedCas.length === 0);
    setIsDisableButtonDisabled(newSelectedCas.length === 0);
  };

  const setCertAuthoritySelected = (
    ca: CertificateAuthority,
    isSelecting = true
  ) => {
    if (isCertAuthoritySelectable(ca)) {
      updateSelectedCertAuthorities([ca], isSelecting);
    }
  };

  const paginationData = {
    page,
    perPage,
    updatePage: setPage,
    updatePerPage: setPerPage,
    updateSelectedPerPage: setSelectedPerPage,
    updateShownElementsList: (cas: CertificateAuthority[]) => {
      if (isSearchActive) {
        setSearchData((prev) =>
          prev
            ? { ...prev, elementsList: cas }
            : { elementsList: cas, totalCount: 0 }
        );
      }
    },
    totalCount,
  };

  const bulkSelectorData = {
    selected: selectedCertAuthorities,
    updateSelected: updateSelectedCertAuthorities,
    selectableTable: selectableCertAuthoritiesTable,
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

  const columnNames = ["CA name", "Description", "Subject DN"];
  const keyNames = ["cn", "description", "ipacasubjectdn"];

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
          ariaLabel="Search certificate authorities"
          placeholder="Search certificate authorities"
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
          dataCy="cert-authorities-button-refresh"
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
          dataCy="cert-authorities-button-delete"
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
          dataCy="cert-authorities-button-add"
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
          dataCy="cert-authorities-button-enable"
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
          dataCy="cert-authorities-button-disable"
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
        <TitleLayout
          id="cert-authorities-title"
          headingLevel="h1"
          text="Certificate Authorities"
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
                    tableTitle="Certificate authorities table"
                    shownElementsList={elementsList}
                    pk="cn"
                    keyNames={keyNames}
                    columnNames={columnNames}
                    hasCheckboxes={true}
                    pathname="cert-authorities"
                    showTableRows={showTableRows}
                    showLink={true}
                    elementsData={{
                      isElementSelectable: isCertAuthoritySelectable,
                      selectedElements: selectedCertAuthorities,
                      selectableElementsTable:
                        selectableCertAuthoritiesTable,
                      setElementsSelected: setCertAuthoritySelected,
                      clearSelectedElements: clearSelectedCertAuthorities,
                    }}
                    buttonsData={{
                      updateIsDeleteButtonDisabled:
                        setIsDeleteButtonDisabled,
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
      <AddCertAuthorityModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add certificate authority"
        onRefresh={refreshData}
      />
      <DeleteCertAuthoritiesModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        elementsToDelete={selectedCertAuthorities}
        clearSelectedElements={clearSelectedCertAuthorities}
        columnNames={columnNames}
        keyNames={keyNames}
        onRefresh={refreshData}
        updateIsDeleteButtonDisabled={setIsDeleteButtonDisabled}
        updateIsDeletion={setIsDeletion}
      />
      {showEnableDisableModal && (
        <EnableDisableCertAuthoritiesModal
          show={showEnableDisableModal}
          handleModalToggle={() => setShowEnableDisableModal(false)}
          optionSelected={enableDisableOptionSelected}
          selectedCertAuthoritiesData={{
            selectedCertAuthorities,
            clearSelectedCertAuthorities,
          }}
          buttonsData={{
            updateIsEnableButtonDisabled: setIsEnableButtonDisabled,
            updateIsDisableButtonDisabled: setIsDisableButtonDisabled,
            updateIsDisableEnableOp: setIsDisableEnableOp,
          }}
          onRefresh={refreshData}
        />
      )}
      <ModalErrors
        errors={modalErrors.getAll()}
        dataCy="cert-authorities-modal-error"
      />
    </div>
  );
};

export default CertAuthorities;
