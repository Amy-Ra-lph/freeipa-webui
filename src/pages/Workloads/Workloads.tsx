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
import AddWorkloadModal from "src/components/modals/Workloads/AddWorkloadModal";
import DeleteWorkloadModal from "src/components/modals/Workloads/DeleteWorkloadModal";

interface Workload {
  cn: string;
  dn: string;
  oauth2workloadtype: string[];
  oauth2workloadowner: string[];
  oauth2workloadserviceprincipal: string[];
  oauth2workloadskill: string[];
  oauth2enabled: string[];
}

const isWorkloadSelectable = (workload: Workload) =>
  workload.cn !== undefined;

const Workloads = () => {
  const dispatch = useAppDispatch();

  const { browserTitle } = useUpdateRoute({ pathname: "workloads" });

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

  const [workloads, setWorkloads] = React.useState<Workload[]>([]);
  const [isSearchDisabled, setIsSearchDisabled] = React.useState(false);
  const [totalCount, setTotalCount] = React.useState(0);

  const workloadsResponse = useGetOAuth2WorkloadEntriesQuery({
    searchValue: searchValue,
    apiVersion,
    sizelimit: 100,
    startIdx: firstIdx,
    stopIdx: lastIdx,
  });

  const { data, isLoading, error } = workloadsResponse;

  React.useEffect(() => {
    if (workloadsResponse.isFetching) {
      setShowTableRows(false);
      setTotalCount(0);
      globalErrors.clear();
      return;
    }

    if (workloadsResponse.isSuccess && workloadsResponse.data && data) {
      const listResult = data.result.results;
      const totalCount = data.result.totalCount;
      const listSize = data.result.count;
      const elementsList: Workload[] = [];

      for (let i = 0; i < listSize; i++) {
        elementsList.push(listResult[i].result as unknown as Workload);
      }

      setTotalCount(totalCount);
      setWorkloads(elementsList);
      setShowTableRows(true);
    }

    if (
      !workloadsResponse.isLoading &&
      workloadsResponse.isError &&
      workloadsResponse.error
    ) {
      window.location.reload();
    }
  }, [workloadsResponse]);

  const [selectedElements, setSelectedElements] = React.useState<Workload[]>(
    []
  );
  const [selectedPerPage, setSelectedPerPage] = React.useState(0);

  const clearSelectedElements = () => {
    setSelectedElements([]);
  };

  const refreshData = () => {
    setShowTableRows(false);
    setTotalCount(0);
    workloadsResponse.refetch().then(() => {
      setShowTableRows(true);
    });
  };

  const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] =
    React.useState(true);
  const [isDeletion, setIsDeletion] = React.useState(false);

  const selectableTable = workloads.filter(isWorkloadSelectable);

  const updateSelectedWorkloads = (
    items: Workload[],
    isSelected: boolean
  ) => {
    let newSelected: Workload[] = [];
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

  const setWorkloadsSelected = (workload: Workload, isSelecting = true) => {
    if (isWorkloadSelectable(workload)) {
      updateSelectedWorkloads([workload], isSelecting);
    }
  };

  React.useEffect(() => {
    workloadsResponse.refetch();
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
              title: error || "Error when searching for workloads",
              variant: "danger",
            })
          );
        } else {
          const listResult = result.data?.result.results || [];
          const listSize = result.data?.result.count || 0;
          const totalCount = result.data?.result.totalCount || 0;
          const elementsList: Workload[] = [];

          for (let i = 0; i < listSize; i++) {
            elementsList.push(
              listResult[i].result as unknown as Workload
            );
          }

          setTotalCount(totalCount);
          setWorkloads(elementsList);
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
    updateShownElementsList: setWorkloads,
    totalCount,
  };

  const searchValueData = {
    searchValue,
    updateSearchValue: setSearchValue,
    submitSearchValue,
  };

  const bulkSelectorData = {
    selected: selectedElements,
    updateSelected: updateSelectedWorkloads,
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
          list={workloads}
          shownElementsList={workloads}
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
          dataCy="workloads-search"
          name="search"
          ariaLabel="Search workloads"
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
          dataCy="workloads-button-refresh"
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
          dataCy="workloads-button-delete"
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
          dataCy="workloads-button-add"
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
          list={workloads}
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
          id="workloads-title"
          headingLevel="h1"
          text="Workloads"
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
                    tableTitle="Workloads table"
                    shownElementsList={workloads}
                    pk="cn"
                    keyNames={[
                      "cn",
                      "oauth2workloadtype",
                      "oauth2workloadskill",
                      "oauth2workloadowner",
                      "oauth2workloadserviceprincipal",
                      "oauth2enabled",
                    ]}
                    columnNames={[
                      "Name",
                      "Type",
                      "Skills",
                      "Owner",
                      "Service Principal",
                      "Enabled",
                    ]}
                    hasCheckboxes={true}
                    pathname="workloads"
                    showTableRows={showTableRows}
                    showLink={true}
                    elementsData={{
                      isElementSelectable: isWorkloadSelectable,
                      selectedElements,
                      selectableElementsTable: selectableTable,
                      setElementsSelected: setWorkloadsSelected,
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
              list={workloads}
              paginationData={paginationData}
              variant={PaginationVariant.bottom}
              widgetId="pagination-options-menu-bottom"
            />
          </FlexItem>
        </Flex>
      </PageSection>
      <AddWorkloadModal
        isOpen={showAddModal}
        onCloseModal={() => setShowAddModal(false)}
        onRefresh={refreshData}
      />
      <DeleteWorkloadModal
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
        columnNames={["Name", "Type", "Skills", "Owner", "Service Principal", "Enabled"]}
        keyNames={["cn", "oauth2workloadtype", "oauth2workloadskill", "oauth2workloadowner", "oauth2workloadserviceprincipal", "oauth2enabled"]}
        onRefresh={refreshData}
      />
    </div>
  );
};

export default Workloads;
