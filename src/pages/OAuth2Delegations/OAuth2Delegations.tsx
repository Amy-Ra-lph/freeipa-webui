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
import { useGettingOAuth2DelegationsQuery } from "src/services/rpcOAuth2";
import { OAuth2Delegation } from "src/utils/datatypes/globalDataTypes";
import AddOAuth2Delegation from "src/components/modals/OAuth2Modals/AddOAuth2Delegation";
import DeleteOAuth2Delegations from "src/components/modals/OAuth2Modals/DeleteOAuth2Delegations";

const OAuth2Delegations = () => {
  const [delegationsList, setDelegationsList] = useState<OAuth2Delegation[]>([]);
  const { browserTitle } = useUpdateRoute({ pathname: "oauth2-delegations" });

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
  const [selectedDelegations, setSelectedDelegations] = useState<OAuth2Delegation[]>([]);
  const [selectedPerPage, setSelectedPerPage] = useState<number>(0);
  const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] = useState<boolean>(true);
  const [isDeletion, setIsDeletion] = useState(false);

  const firstIdx = (page - 1) * perPage;
  const lastIdx = page * perPage;

  const delegationsDataResponse = useGettingOAuth2DelegationsQuery({
    searchValue: "",
    sizeLimit: 0,
    apiVersion: apiVersion || API_VERSION_BACKUP,
    startIdx: firstIdx,
    stopIdx: lastIdx,
  } as GenericPayload);

  const {
    data: batchResponse,
    isLoading: isBatchLoading,
  } = delegationsDataResponse;

  useEffect(() => {
    if (delegationsDataResponse.isFetching) {
      setShowTableRows(false);
      setTotalCount(0);
      return;
    }
    if (
      delegationsDataResponse.isSuccess &&
      delegationsDataResponse.data &&
      batchResponse !== undefined
    ) {
      const resultsArr = batchResponse.result.results;
      const count = batchResponse.result.count;
      const total = batchResponse.result.totalCount;
      const list: OAuth2Delegation[] = [];
      for (let i = 0; i < count; i++) {
        list.push(resultsArr[i].result as OAuth2Delegation);
      }
      setDelegationsList(list);
      setTotalCount(total);
      setShowTableRows(true);
    }
    if (!delegationsDataResponse.isLoading && delegationsDataResponse.isError) {
      window.location.reload();
    }
  }, [delegationsDataResponse]);

  useEffect(() => {
    delegationsDataResponse.refetch();
  }, [page, perPage]);

  useEffect(() => {
    if (showTableRows !== !isBatchLoading) {
      setShowTableRows(!isBatchLoading);
    }
  }, [isBatchLoading]);

  const clearSelectedDelegations = () => {
    setSelectedDelegations([]);
  };

  const refreshData = () => {
    setShowTableRows(false);
    setTotalCount(0);
    clearSelectedDelegations();
    delegationsDataResponse.refetch();
  };

  const updateSelectedDelegations = (delegations: OAuth2Delegation[], isSelected: boolean) => {
    let newSelected: OAuth2Delegation[] = [];
    if (isSelected) {
      newSelected = JSON.parse(JSON.stringify(selectedDelegations));
      for (let i = 0; i < delegations.length; i++) {
        if (
          selectedDelegations.find(
            (sel) => sel.cn[0] === delegations[i].cn[0]
          )
        ) {
          continue;
        }
        newSelected.push(delegations[i]);
      }
    } else {
      for (let i = 0; i < selectedDelegations.length; i++) {
        let found = false;
        for (let ii = 0; ii < delegations.length; ii++) {
          if (selectedDelegations[i].cn[0] === delegations[ii].cn[0]) {
            found = true;
            break;
          }
        }
        if (!found) {
          newSelected.push(selectedDelegations[i]);
        }
      }
    }
    setSelectedDelegations(newSelected);
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

  const delegationsBulkSelectorData = {
    selected: selectedDelegations,
    updateSelected: updateSelectedDelegations,
    selectableTable: delegationsList,
    nameAttr: "cn",
  };

  const buttonsData = {
    updateIsDeleteButtonDisabled,
  };

  const selectedPerPageData = {
    selectedPerPage,
    updateSelectedPerPage,
  };

  const deleteDelegationsButtonsData = {
    updateIsDeleteButtonDisabled,
    updateIsDeletion,
  };

  const selectedDelegationsData = {
    selectedDelegations,
    clearSelectedDelegations,
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
          list={delegationsList}
          shownElementsList={delegationsList}
          elementData={delegationsBulkSelectorData}
          buttonsData={buttonsData}
          selectedPerPageData={selectedPerPageData}
        />
      ),
    },
    {
      key: 1,
      element: (
        <SearchInputLayout
          dataCy="delegations-search"
          name="search"
          ariaLabel="Search delegations"
          placeholder="Search delegations"
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
          dataCy="delegations-button-refresh"
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
          dataCy="delegations-button-delete"
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
          dataCy="delegations-button-add"
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
          list={delegationsList}
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
          id="oauth2-delegations-title"
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
              <InnerScrollContainer style={{ height: "60vh", overflow: "auto" }}>
                <MainTable
                  tableTitle="Delegations table"
                  shownElementsList={delegationsList}
                  pk="cn"
                  keyNames={["cn", "oauth2delegatesource", "oauth2delegatetarget", "oauth2delegatescope"]}
                  columnNames={["Name", "Source", "Target", "Scope"]}
                  hasCheckboxes={true}
                  pathname="oauth2-delegations"
                  showTableRows={showTableRows}
                  showLink={true}
                />
              </InnerScrollContainer>
            </OuterScrollContainer>
          </FlexItem>
          <FlexItem style={{ flex: "0 0 auto", position: "sticky", bottom: 0 }}>
            <PaginationLayout
              list={delegationsList}
              paginationData={paginationData}
              variant={PaginationVariant.bottom}
              widgetId="pagination-options-menu-bottom"
            />
          </FlexItem>
        </Flex>
      </PageSection>
      <AddOAuth2Delegation
        show={showAddModal}
        handleModalToggle={onAddModalToggle}
        onOpenAddModal={onAddClickHandler}
        onCloseAddModal={onCloseAddModal}
        onRefresh={refreshData}
      />
      <DeleteOAuth2Delegations
        show={showDeleteModal}
        handleModalToggle={onDeleteModalToggle}
        selectedDelegationsData={selectedDelegationsData}
        buttonsData={deleteDelegationsButtonsData}
        onRefresh={refreshData}
      />
    </div>
  );
};

export default OAuth2Delegations;
