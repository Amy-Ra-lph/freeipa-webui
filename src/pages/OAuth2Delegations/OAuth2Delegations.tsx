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
import { API_VERSION_BACKUP, isOAuth2DelegationSelectable } from "src/utils/utils";
import { GenericPayload } from "src/services/rpc";
import { useGettingOAuth2DelegationsQuery } from "src/services/rpcOAuth2";
import { OAuth2Delegation } from "src/utils/datatypes/globalDataTypes";
import { apiToOAuth2Delegation } from "src/utils/oauth2Utils";
import AddOAuth2Delegation from "src/components/modals/OAuth2Modals/AddOAuth2Delegation";
import DeleteOAuth2Delegations from "src/components/modals/OAuth2Modals/DeleteOAuth2Delegations";
import DisableEnableOAuth2Delegations from "src/components/modals/OAuth2Modals/DisableEnableOAuth2Delegations";

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
  const [isEnableButtonDisabled, setIsEnableButtonDisabled] = useState<boolean>(true);
  const [isDisableButtonDisabled, setIsDisableButtonDisabled] = useState<boolean>(true);
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
        list.push(apiToOAuth2Delegation(resultsArr[i].result));
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

  const selectableDelegationsTable = delegationsList.filter(
    isOAuth2DelegationSelectable
  );

  const updateSelectedDelegations = (delegations: OAuth2Delegation[], isSelected: boolean) => {
    let newSelected: OAuth2Delegation[] = [];
    if (isSelected) {
      newSelected = JSON.parse(JSON.stringify(selectedDelegations));
      for (let i = 0; i < delegations.length; i++) {
        if (
          selectedDelegations.find(
            (sel) => sel.cn === delegations[i].cn
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
          if (selectedDelegations[i].cn === delegations[ii].cn) {
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

  const setDelegationSelected = (delegation: OAuth2Delegation, isSelecting = true) => {
    if (isOAuth2DelegationSelectable(delegation)) {
      updateSelectedDelegations([delegation], isSelecting);
    }
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEnableDisableModal, setShowEnableDisableModal] = useState(false);
  const [operation, setOperation] = useState<"enable" | "disable">("disable");

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

  const onEnableOperation = () => {
    setOperation("enable");
    setShowEnableDisableModal(true);
  };

  const onDisableOperation = () => {
    setOperation("disable");
    setShowEnableDisableModal(true);
  };

  const delegationsBulkSelectorData = {
    selected: selectedDelegations,
    updateSelected: updateSelectedDelegations,
    selectableTable: selectableDelegationsTable,
    nameAttr: "cn",
  };

  const selectedPerPageData = {
    selectedPerPage,
    updateSelectedPerPage: setSelectedPerPage,
  };

  const deleteDelegationsButtonsData = {
    updateIsDeleteButtonDisabled: setIsDeleteButtonDisabled,
    updateIsDeletion: setIsDeletion,
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
    updateSelectedPerPage: setSelectedPerPage,
    totalCount,
  };

  const columnNames = ["Name", "Status", "Source", "Target", "Scope"];
  const keyNames = ["cn", "oauth2enabled", "oauth2delegatesource", "oauth2delegatetarget", "oauth2delegatescope"];

  const toolbarItems: ToolbarItem[] = [
    {
      key: 0,
      element: (
        <BulkSelectorPrep
          list={delegationsList}
          shownElementsList={delegationsList}
          elementData={delegationsBulkSelectorData}
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
      element: (
        <SecondaryButton
          isDisabled={isDisableButtonDisabled || !showTableRows}
          onClickHandler={onDisableOperation}
          dataCy="delegations-button-disable"
        >
          Disable
        </SecondaryButton>
      ),
    },
    {
      key: 7,
      element: (
        <SecondaryButton
          isDisabled={isEnableButtonDisabled || !showTableRows}
          onClickHandler={onEnableOperation}
          dataCy="delegations-button-enable"
        >
          Enable
        </SecondaryButton>
      ),
    },
    {
      key: 8,
      toolbarItemVariant: ToolbarItemVariant.separator,
    },
    {
      key: 9,
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
                  keyNames={keyNames}
                  columnNames={columnNames}
                  hasCheckboxes={true}
                  pathname="oauth2-delegations"
                  showTableRows={showTableRows}
                  showLink={true}
                  elementsData={{
                    isElementSelectable: isOAuth2DelegationSelectable,
                    selectedElements: selectedDelegations,
                    selectableElementsTable: selectableDelegationsTable,
                    setElementsSelected: setDelegationSelected,
                    clearSelectedElements: clearSelectedDelegations,
                  }}
                  buttonsData={{
                    updateIsDeleteButtonDisabled: setIsDeleteButtonDisabled,
                    isDeletion,
                    updateIsDeletion: setIsDeletion,
                    updateIsEnableButtonDisabled: setIsEnableButtonDisabled,
                    updateIsDisableButtonDisabled: setIsDisableButtonDisabled,
                    isDisableEnableOp: true,
                  }}
                  paginationData={{
                    selectedPerPage,
                    updateSelectedPerPage: setSelectedPerPage,
                  }}
                  statusElementName="oauth2enabled"
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
      <DisableEnableOAuth2Delegations
        isOpen={showEnableDisableModal}
        onClose={() => setShowEnableDisableModal(false)}
        elementsList={selectedDelegations.map((d) => d.cn)}
        setElementsList={(newList: OAuth2Delegation[]) =>
          setSelectedDelegations(newList)
        }
        operation={operation}
        onRefresh={refreshData}
      />
    </div>
  );
};

export default OAuth2Delegations;
