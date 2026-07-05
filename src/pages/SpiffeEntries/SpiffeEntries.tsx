import React from "react";
// PatternFly
import {
  Flex,
  FlexItem,
  PageSection,
  PaginationVariant,
  ToolbarItemVariant,
} from "@patternfly/react-core";
import {
  InnerScrollContainer,
  OuterScrollContainer,
} from "@patternfly/react-table";
// Hooks
import useUpdateRoute from "src/hooks/useUpdateRoute";
import useListPageSearchParams from "src/hooks/useListPageSearchParams";
import useApiError from "src/hooks/useApiError";
// Redux
import { useAppDispatch, useAppSelector } from "src/store/hooks";
import { addAlert } from "src/store/Global/alerts-slice";
// RPC
import {
  useGetOAuth2WorkloadEntriesQuery,
  useSearchOAuth2WorkloadEntriesMutation,
} from "src/services/rpcOAuth2";
// Components
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
import ToolbarLayout, {
  ToolbarItem,
} from "src/components/layouts/ToolbarLayout";
import SearchInputLayout from "src/components/layouts/SearchInputLayout";
import SecondaryButton from "src/components/layouts/SecondaryButton";
import HelpTextWithIconLayout from "src/components/layouts/HelpTextWithIconLayout";
import PaginationLayout from "src/components/layouts/PaginationLayout";
import TitleLayout from "src/components/layouts/TitleLayout";
import GlobalErrors from "src/components/errors/GlobalErrors";
import MainTable from "src/components/tables/MainTable";
import BulkSelectorPrep from "src/components/BulkSelectorPrep";
// Modals
import AddSpiffeEntryModal from "src/components/modals/SpiffeEntries/AddSpiffeEntryModal";
import DeleteSpiffeEntryModal from "src/components/modals/SpiffeEntries/DeleteSpiffeEntryModal";

interface SpiffeEntry {
  cn: string;
  dn: string;
  oauth2spiffeid: string[];
  oauth2workloadtype: string[];
  oauth2workloadowner: string[];
  oauth2enabled: string[];
}

const isSpiffeEntrySelectable = (entry: SpiffeEntry) =>
  entry.cn !== undefined;

const SpiffeEntries = () => {
  const dispatch = useAppDispatch();

  const { browserTitle } = useUpdateRoute({ pathname: "spiffe-entries" });

  React.useEffect(() => {
    document.title = browserTitle;
  }, [browserTitle]);

  const apiVersion = useAppSelector(
    (state) => state.global.environment.api_version
  ) as string;

  const { page, setPage, perPage, setPerPage, searchValue, setSearchValue } =
    useListPageSearchParams();

  const globalErrors = useApiError([]);

  const firstIdx = (page - 1) * perPage;
  const lastIdx = page * perPage;

  const [entries, setEntries] = React.useState<SpiffeEntry[]>([]);
  const [isSearchDisabled, setIsSearchDisabled] = React.useState(false);
  const [totalCount, setTotalCount] = React.useState(0);

  const entriesResponse = useGetOAuth2WorkloadEntriesQuery({
    searchValue: searchValue,
    apiVersion,
    sizelimit: 100,
    startIdx: firstIdx,
    stopIdx: lastIdx,
  });

  const { data, isLoading, error } = entriesResponse;

  // Client-side filter: only entries with non-empty oauth2spiffeid
  const filterSpiffeEntries = (
    results: unknown[],
    count: number
  ): SpiffeEntry[] => {
    const filtered: SpiffeEntry[] = [];
    for (let i = 0; i < count; i++) {
      const entry = results[i] as { result: SpiffeEntry };
      const spiffeEntry = entry.result as unknown as SpiffeEntry;
      if (
        spiffeEntry.oauth2spiffeid &&
        spiffeEntry.oauth2spiffeid.length > 0 &&
        spiffeEntry.oauth2spiffeid[0] !== ""
      ) {
        filtered.push(spiffeEntry);
      }
    }
    return filtered;
  };

  React.useEffect(() => {
    if (entriesResponse.isFetching) {
      setShowTableRows(false);
      setTotalCount(0);
      globalErrors.clear();
      return;
    }

    if (entriesResponse.isSuccess && entriesResponse.data && data) {
      const listResult = data.result.results as unknown as unknown[];
      const listSize = data.result.count;
      const filtered = filterSpiffeEntries(listResult, listSize);

      setTotalCount(filtered.length);
      setEntries(filtered);
      setShowTableRows(true);
    }

    if (
      !entriesResponse.isLoading &&
      entriesResponse.isError &&
      entriesResponse.error
    ) {
      window.location.reload();
    }
  }, [entriesResponse]);

  const [selectedElements, setSelectedElements] = React.useState<
    SpiffeEntry[]
  >([]);
  const [selectedPerPage, setSelectedPerPage] = React.useState(0);

  const clearSelectedElements = () => {
    setSelectedElements([]);
  };

  const refreshData = () => {
    setShowTableRows(false);
    setTotalCount(0);
    entriesResponse.refetch().then(() => {
      setShowTableRows(true);
    });
  };

  const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] =
    React.useState(true);
  const [isDeletion, setIsDeletion] = React.useState(false);

  const selectableTable = entries.filter(isSpiffeEntrySelectable);

  const updateSelectedEntries = (
    items: SpiffeEntry[],
    isSelected: boolean
  ) => {
    let newSelected: SpiffeEntry[] = [];
    if (isSelected) {
      newSelected = JSON.parse(JSON.stringify(selectedElements));
      for (const item of items) {
        if (!selectedElements.find((sel) => sel.cn[0] === item.cn[0])) {
          newSelected.push(item);
        }
      }
    } else {
      for (const sel of selectedElements) {
        let found = false;
        for (const item of items) {
          if (sel.cn[0] === item.cn[0]) {
            found = true;
            break;
          }
        }
        if (!found) {
          newSelected.push(sel);
        }
      }
    }
    setSelectedElements(newSelected);
    setIsDeleteButtonDisabled(newSelected.length === 0);
  };

  const setEntriesSelected = (entry: SpiffeEntry, isSelecting = true) => {
    if (isSpiffeEntrySelectable(entry)) {
      updateSelectedEntries([entry], isSelecting);
    }
  };

  React.useEffect(() => {
    entriesResponse.refetch();
  }, []);

  const [showTableRows, setShowTableRows] = React.useState(!isLoading);

  React.useEffect(() => {
    if (showTableRows !== !isLoading) {
      setShowTableRows(!isLoading);
    }
  }, [isLoading]);

  const [searchEntry] = useSearchOAuth2WorkloadEntriesMutation();

  const submitSearchValue = () => {
    searchEntry({
      searchValue: searchValue,
      apiVersion,
      sizelimit: 100,
      startIdx: 0,
      stopIdx: 200,
    }).then((result) => {
      if ("data" in result) {
        const searchError = result.data?.error as
          | FetchBaseQueryError
          | SerializedError;

        if (searchError) {
          let error = "";
          if ("error" in searchError) {
            error = searchError.error || "";
          } else if ("message" in searchError) {
            error = searchError.message || "";
          }
          dispatch(
            addAlert({
              name: "submit-search-value-error",
              title: error || "Error when searching for SPIFFE entries",
              variant: "danger",
            })
          );
        } else {
          const listResult = (result.data?.result.results as unknown as unknown[]) || [];
          const listSize = result.data?.result.count || 0;
          const filtered = filterSpiffeEntries(listResult, listSize);

          setTotalCount(filtered.length);
          setEntries(filtered);
          setShowTableRows(true);
        }
        setIsSearchDisabled(false);
      }
    });
  };

  const paginationData = {
    page,
    perPage,
    updatePage: setPage,
    updatePerPage: setPerPage,
    updateSelectedPerPage: setSelectedPerPage,
    updateShownElementsList: setEntries,
    totalCount,
  };

  const searchValueData = {
    searchValue,
    updateSearchValue: setSearchValue,
    submitSearchValue,
  };

  const bulkSelectorData = {
    selected: selectedElements,
    updateSelected: updateSelectedEntries,
    selectableTable: selectableTable,
    nameAttr: "cn",
  };

  const selectedPerPageData = {
    selectedPerPage,
    updateSelectedPerPage: setSelectedPerPage,
  };

  // Modals
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  const toolbarItems: ToolbarItem[] = [
    {
      key: 0,
      element: (
        <BulkSelectorPrep
          list={entries}
          shownElementsList={entries}
          elementData={bulkSelectorData}
          buttonsData={{
            updateIsDeleteButtonDisabled: setIsDeleteButtonDisabled,
          }}
          selectedPerPageData={selectedPerPageData}
        />
      ),
    },
    {
      key: 1,
      element: (
        <SearchInputLayout
          dataCy="spiffe-entries-search"
          name="search"
          ariaLabel="Search SPIFFE entries"
          placeholder="Search"
          searchValueData={searchValueData}
          isDisabled={isSearchDisabled}
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
          dataCy="spiffe-entries-button-refresh"
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
          dataCy="spiffe-entries-button-delete"
          isDisabled={isDeleteButtonDisabled || !showTableRows}
          onClickHandler={() => setShowDeleteModal(true)}
        >
          Delete
        </SecondaryButton>
      ),
    },
    {
      key: 5,
      element: (
        <SecondaryButton
          dataCy="spiffe-entries-button-add"
          isDisabled={!showTableRows}
          onClickHandler={() => setShowAddModal(true)}
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
          list={entries}
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
          id="spiffe-entries-title"
          headingLevel="h1"
          text="SPIFFE Entries"
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
                {error !== undefined && error ? (
                  <GlobalErrors errors={globalErrors.getAll()} />
                ) : (
                  <MainTable
                    tableTitle="SPIFFE Entries table"
                    shownElementsList={entries}
                    pk="cn"
                    keyNames={[
                      "oauth2spiffeid",
                      "cn",
                      "oauth2workloadtype",
                      "oauth2workloadowner",
                      "oauth2enabled",
                    ]}
                    columnNames={[
                      "SPIFFE ID",
                      "Workload",
                      "Type",
                      "Owner",
                      "Enabled",
                    ]}
                    hasCheckboxes={true}
                    pathname="spiffe-entries"
                    showTableRows={showTableRows}
                    showLink={true}
                    elementsData={{
                      isElementSelectable: isSpiffeEntrySelectable,
                      selectedElements,
                      selectableElementsTable: selectableTable,
                      setElementsSelected: setEntriesSelected,
                      clearSelectedElements,
                    }}
                    buttonsData={{
                      updateIsDeleteButtonDisabled: (value: boolean) =>
                        setIsDeleteButtonDisabled(value),
                      isDeletion,
                      updateIsDeletion: (value: boolean) =>
                        setIsDeletion(value),
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
              list={entries}
              paginationData={paginationData}
              variant={PaginationVariant.bottom}
              widgetId="pagination-options-menu-bottom"
            />
          </FlexItem>
        </Flex>
      </PageSection>
      <AddSpiffeEntryModal
        isOpen={showAddModal}
        onCloseModal={() => setShowAddModal(false)}
        onRefresh={refreshData}
      />
      <DeleteSpiffeEntryModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        selectedData={{
          selectedElements,
          clearSelectedElements,
        }}
        buttonsData={{
          updateIsDeleteButtonDisabled: setIsDeleteButtonDisabled,
          updateIsDeletion: setIsDeletion,
        }}
        columnNames={["SPIFFE ID", "Workload", "Type", "Owner", "Enabled"]}
        keyNames={["oauth2spiffeid", "cn", "oauth2workloadtype", "oauth2workloadowner", "oauth2enabled"]}
        onRefresh={refreshData}
      />
    </div>
  );
};

export default SpiffeEntries;
