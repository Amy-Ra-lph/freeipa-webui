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
import { useGettingOAuth2WorkloadsQuery } from "src/services/rpcOAuth2";
import { OAuth2Workload } from "src/utils/datatypes/globalDataTypes";
import AddOAuth2Workload from "src/components/modals/OAuth2Modals/AddOAuth2Workload";
import DeleteOAuth2Workloads from "src/components/modals/OAuth2Modals/DeleteOAuth2Workloads";

const Workloads = () => {
  const [workloadsList, setWorkloadsList] = useState<OAuth2Workload[]>([]);
  const { browserTitle } = useUpdateRoute({ pathname: "workloads" });

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
  const [selectedWorkloads, setSelectedWorkloads] = useState<OAuth2Workload[]>([]);
  const [selectedPerPage, setSelectedPerPage] = useState<number>(0);
  const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] = useState<boolean>(true);
  const [isDeletion, setIsDeletion] = useState(false);

  const firstIdx = (page - 1) * perPage;
  const lastIdx = page * perPage;

  const workloadsDataResponse = useGettingOAuth2WorkloadsQuery({
    searchValue: "",
    sizeLimit: 0,
    apiVersion: apiVersion || API_VERSION_BACKUP,
    startIdx: firstIdx,
    stopIdx: lastIdx,
  } as GenericPayload);

  const {
    data: batchResponse,
    isLoading: isBatchLoading,
  } = workloadsDataResponse;

  useEffect(() => {
    if (workloadsDataResponse.isFetching) {
      setShowTableRows(false);
      setTotalCount(0);
      return;
    }
    if (
      workloadsDataResponse.isSuccess &&
      workloadsDataResponse.data &&
      batchResponse !== undefined
    ) {
      const resultsArr = batchResponse.result.results;
      const count = batchResponse.result.count;
      const total = batchResponse.result.totalCount;
      const list: OAuth2Workload[] = [];
      for (let i = 0; i < count; i++) {
        list.push(resultsArr[i].result as OAuth2Workload);
      }
      setWorkloadsList(list);
      setTotalCount(total);
      setShowTableRows(true);
    }
    if (!workloadsDataResponse.isLoading && workloadsDataResponse.isError) {
      window.location.reload();
    }
  }, [workloadsDataResponse]);

  useEffect(() => {
    workloadsDataResponse.refetch();
  }, [page, perPage]);

  useEffect(() => {
    if (showTableRows !== !isBatchLoading) {
      setShowTableRows(!isBatchLoading);
    }
  }, [isBatchLoading]);

  const clearSelectedWorkloads = () => {
    setSelectedWorkloads([]);
  };

  const refreshData = () => {
    setShowTableRows(false);
    setTotalCount(0);
    clearSelectedWorkloads();
    workloadsDataResponse.refetch();
  };

  const updateSelectedWorkloads = (workloads: OAuth2Workload[], isSelected: boolean) => {
    let newSelected: OAuth2Workload[] = [];
    if (isSelected) {
      newSelected = JSON.parse(JSON.stringify(selectedWorkloads));
      for (let i = 0; i < workloads.length; i++) {
        if (
          selectedWorkloads.find(
            (sel) => sel.cn[0] === workloads[i].cn[0]
          )
        ) {
          continue;
        }
        newSelected.push(workloads[i]);
      }
    } else {
      for (let i = 0; i < selectedWorkloads.length; i++) {
        let found = false;
        for (let ii = 0; ii < workloads.length; ii++) {
          if (selectedWorkloads[i].cn[0] === workloads[ii].cn[0]) {
            found = true;
            break;
          }
        }
        if (!found) {
          newSelected.push(selectedWorkloads[i]);
        }
      }
    }
    setSelectedWorkloads(newSelected);
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

  const workloadsBulkSelectorData = {
    selected: selectedWorkloads,
    updateSelected: updateSelectedWorkloads,
    selectableTable: workloadsList,
    nameAttr: "cn",
  };

  const buttonsData = {
    updateIsDeleteButtonDisabled,
  };

  const selectedPerPageData = {
    selectedPerPage,
    updateSelectedPerPage,
  };

  const deleteWorkloadsButtonsData = {
    updateIsDeleteButtonDisabled,
    updateIsDeletion,
  };

  const selectedWorkloadsData = {
    selectedWorkloads,
    clearSelectedWorkloads,
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
          list={workloadsList}
          shownElementsList={workloadsList}
          elementData={workloadsBulkSelectorData}
          buttonsData={buttonsData}
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
          placeholder="Search workloads"
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
          isDisabled={isDeleteButtonDisabled || !showTableRows}
          onClickHandler={onDeleteHandler}
          dataCy="workloads-button-delete"
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
          dataCy="workloads-button-add"
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
          list={workloadsList}
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
              <InnerScrollContainer style={{ height: "60vh", overflow: "auto" }}>
                <MainTable
                  tableTitle="Workloads table"
                  shownElementsList={workloadsList}
                  pk="cn"
                  keyNames={["cn", "oauth2workloadtype", "oauth2spiffeid", "oauth2workloadowner"]}
                  columnNames={["Name", "Type", "SPIFFE ID", "Owner"]}
                  hasCheckboxes={true}
                  pathname="workloads"
                  showTableRows={showTableRows}
                  showLink={true}
                />
              </InnerScrollContainer>
            </OuterScrollContainer>
          </FlexItem>
          <FlexItem style={{ flex: "0 0 auto", position: "sticky", bottom: 0 }}>
            <PaginationLayout
              list={workloadsList}
              paginationData={paginationData}
              variant={PaginationVariant.bottom}
              widgetId="pagination-options-menu-bottom"
            />
          </FlexItem>
        </Flex>
      </PageSection>
      <AddOAuth2Workload
        show={showAddModal}
        handleModalToggle={onAddModalToggle}
        onOpenAddModal={onAddClickHandler}
        onCloseAddModal={onCloseAddModal}
        onRefresh={refreshData}
      />
      <DeleteOAuth2Workloads
        show={showDeleteModal}
        handleModalToggle={onDeleteModalToggle}
        selectedWorkloadsData={selectedWorkloadsData}
        buttonsData={deleteWorkloadsButtonsData}
        onRefresh={refreshData}
      />
    </div>
  );
};

export default Workloads;
