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
import { useGettingOAuth2ClientsQuery } from "src/services/rpcOAuth2";
import { OAuth2Client } from "src/utils/datatypes/globalDataTypes";
import AddOAuth2Client from "src/components/modals/OAuth2Modals/AddOAuth2Client";
import DeleteOAuth2Clients from "src/components/modals/OAuth2Modals/DeleteOAuth2Clients";

const OAuth2Clients = () => {
  const [clientsList, setClientsList] = useState<OAuth2Client[]>([]);
  const { browserTitle } = useUpdateRoute({ pathname: "oauth2-clients" });

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
  const [selectedClients, setSelectedClients] = useState<OAuth2Client[]>([]);
  const [selectedPerPage, setSelectedPerPage] = useState<number>(0);
  const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] = useState<boolean>(true);
  const [isDeletion, setIsDeletion] = useState(false);

  const firstIdx = (page - 1) * perPage;
  const lastIdx = page * perPage;

  const clientsDataResponse = useGettingOAuth2ClientsQuery({
    searchValue: "",
    sizeLimit: 0,
    apiVersion: apiVersion || API_VERSION_BACKUP,
    startIdx: firstIdx,
    stopIdx: lastIdx,
  } as GenericPayload);

  const {
    data: batchResponse,
    isLoading: isBatchLoading,
  } = clientsDataResponse;

  useEffect(() => {
    if (clientsDataResponse.isFetching) {
      setShowTableRows(false);
      setTotalCount(0);
      return;
    }
    if (
      clientsDataResponse.isSuccess &&
      clientsDataResponse.data &&
      batchResponse !== undefined
    ) {
      const resultsArr = batchResponse.result.results;
      const count = batchResponse.result.count;
      const total = batchResponse.result.totalCount;
      const list: OAuth2Client[] = [];
      for (let i = 0; i < count; i++) {
        list.push(resultsArr[i].result as OAuth2Client);
      }
      setClientsList(list);
      setTotalCount(total);
      setShowTableRows(true);
    }
    if (
      !clientsDataResponse.isLoading &&
      clientsDataResponse.isError
    ) {
      window.location.reload();
    }
  }, [clientsDataResponse]);

  useEffect(() => {
    clientsDataResponse.refetch();
  }, [page, perPage]);

  useEffect(() => {
    if (showTableRows !== !isBatchLoading) {
      setShowTableRows(!isBatchLoading);
    }
  }, [isBatchLoading]);

  const clearSelectedClients = () => {
    setSelectedClients([]);
  };

  const refreshData = () => {
    setShowTableRows(false);
    setTotalCount(0);
    clearSelectedClients();
    clientsDataResponse.refetch();
  };

  const updateSelectedClients = (clients: OAuth2Client[], isSelected: boolean) => {
    let newSelected: OAuth2Client[] = [];
    if (isSelected) {
      newSelected = JSON.parse(JSON.stringify(selectedClients));
      for (let i = 0; i < clients.length; i++) {
        if (
          selectedClients.find(
            (sel) => sel.cn[0] === clients[i].cn[0]
          )
        ) {
          continue;
        }
        newSelected.push(clients[i]);
      }
    } else {
      for (let i = 0; i < selectedClients.length; i++) {
        let found = false;
        for (let ii = 0; ii < clients.length; ii++) {
          if (selectedClients[i].cn[0] === clients[ii].cn[0]) {
            found = true;
            break;
          }
        }
        if (!found) {
          newSelected.push(selectedClients[i]);
        }
      }
    }
    setSelectedClients(newSelected);
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

  const clientsBulkSelectorData = {
    selected: selectedClients,
    updateSelected: updateSelectedClients,
    selectableTable: clientsList,
    nameAttr: "cn",
  };

  const buttonsData = {
    updateIsDeleteButtonDisabled,
  };

  const selectedPerPageData = {
    selectedPerPage,
    updateSelectedPerPage,
  };

  const deleteClientsButtonsData = {
    updateIsDeleteButtonDisabled,
    updateIsDeletion,
  };

  const selectedClientsData = {
    selectedClients,
    clearSelectedClients,
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
          list={clientsList}
          shownElementsList={clientsList}
          elementData={clientsBulkSelectorData}
          buttonsData={buttonsData}
          selectedPerPageData={selectedPerPageData}
        />
      ),
    },
    {
      key: 1,
      element: (
        <SearchInputLayout
          dataCy="oauth2clients-search"
          name="search"
          ariaLabel="Search OAuth2 clients"
          placeholder="Search OAuth2 clients"
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
          dataCy="oauth2clients-button-refresh"
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
          dataCy="oauth2clients-button-delete"
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
          dataCy="oauth2clients-button-add"
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
          list={clientsList}
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
          id="oauth2-clients-title"
          headingLevel="h1"
          text="OAuth2 Clients"
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
                  tableTitle="OAuth2 Clients table"
                  shownElementsList={clientsList}
                  pk="cn"
                  keyNames={["cn", "oauth2clientid", "oauth2granttype", "oauth2clienttype"]}
                  columnNames={["Name", "Client ID", "Grant Type", "Client Type"]}
                  hasCheckboxes={true}
                  pathname="oauth2-clients"
                  showTableRows={showTableRows}
                  showLink={true}
                />
              </InnerScrollContainer>
            </OuterScrollContainer>
          </FlexItem>
          <FlexItem style={{ flex: "0 0 auto", position: "sticky", bottom: 0 }}>
            <PaginationLayout
              list={clientsList}
              paginationData={paginationData}
              variant={PaginationVariant.bottom}
              widgetId="pagination-options-menu-bottom"
            />
          </FlexItem>
        </Flex>
      </PageSection>
      <AddOAuth2Client
        show={showAddModal}
        handleModalToggle={onAddModalToggle}
        onOpenAddModal={onAddClickHandler}
        onCloseAddModal={onCloseAddModal}
        onRefresh={refreshData}
      />
      <DeleteOAuth2Clients
        show={showDeleteModal}
        handleModalToggle={onDeleteModalToggle}
        selectedClientsData={selectedClientsData}
        buttonsData={deleteClientsButtonsData}
        onRefresh={refreshData}
      />
    </div>
  );
};

export default OAuth2Clients;
