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
  useGetOAuth2ClientEntriesQuery,
  useSearchOAuth2ClientEntriesMutation,
} from "src/services/rpcOAuth2";
// Data types
import { OAuth2Client } from "src/hooks/useOAuth2ClientSettingsData";
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
import AddOAuth2ClientModal from "src/components/modals/OAuth2/AddClientModal";
import DeleteOAuth2ClientModal from "src/components/modals/OAuth2/DeleteClientModal";

const isOAuth2ClientSelectable = (client: OAuth2Client) =>
  client.cn !== undefined;

const OAuth2Clients = () => {
  const dispatch = useAppDispatch();

  const { browserTitle } = useUpdateRoute({
    pathname: "oauth2-clients",
  });

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

  const [clients, setClients] = React.useState<OAuth2Client[]>([]);
  const [isSearchDisabled, setIsSearchDisabled] = React.useState(false);
  const [totalCount, setTotalCount] = React.useState(0);

  const clientsResponse = useGetOAuth2ClientEntriesQuery({
    searchValue: searchValue,
    apiVersion,
    sizelimit: 100,
    startIdx: firstIdx,
    stopIdx: lastIdx,
  });

  const { data, isLoading, error } = clientsResponse;

  React.useEffect(() => {
    if (clientsResponse.isFetching) {
      setShowTableRows(false);
      setTotalCount(0);
      globalErrors.clear();
      return;
    }

    if (clientsResponse.isSuccess && clientsResponse.data && data) {
      const listResult = data.result.results;
      const totalCount = data.result.totalCount;
      const listSize = data.result.count;
      const elementsList: OAuth2Client[] = [];

      for (let i = 0; i < listSize; i++) {
        elementsList.push(listResult[i].result as unknown as OAuth2Client);
      }

      setTotalCount(totalCount);
      setClients(elementsList);
      setShowTableRows(true);
    }

    if (
      !clientsResponse.isLoading &&
      clientsResponse.isError &&
      clientsResponse.error
    ) {
      window.location.reload();
    }
  }, [clientsResponse]);

  const [selectedElements, setSelectedElements] = React.useState<
    OAuth2Client[]
  >([]);
  const [selectedPerPage, setSelectedPerPage] = React.useState(0);

  const clearSelectedElements = () => {
    setSelectedElements([]);
  };

  const refreshData = () => {
    setShowTableRows(false);
    setTotalCount(0);
    clientsResponse.refetch().then(() => {
      setShowTableRows(true);
    });
  };

  const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] =
    React.useState(true);
  const [isDeletion, setIsDeletion] = React.useState(false);

  const selectableTable = clients.filter(isOAuth2ClientSelectable);

  const updateSelectedClients = (
    items: OAuth2Client[],
    isSelected: boolean
  ) => {
    let newSelected: OAuth2Client[] = [];
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

  const setClientsSelected = (client: OAuth2Client, isSelecting = true) => {
    if (isOAuth2ClientSelectable(client)) {
      updateSelectedClients([client], isSelecting);
    }
  };

  React.useEffect(() => {
    clientsResponse.refetch();
  }, []);

  const [showTableRows, setShowTableRows] = React.useState(!isLoading);

  React.useEffect(() => {
    if (showTableRows !== !isLoading) {
      setShowTableRows(!isLoading);
    }
  }, [isLoading]);

  const [searchEntry] = useSearchOAuth2ClientEntriesMutation();

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
          let errorMsg = "";
          if ("error" in searchError) {
            errorMsg = searchError.error || "";
          } else if ("message" in searchError) {
            errorMsg = searchError.message || "";
          }
          dispatch(
            addAlert({
              name: "submit-search-value-error",
              title: errorMsg || "Error when searching for OAuth2 clients",
              variant: "danger",
            })
          );
        } else {
          const listResult = result.data?.result.results || [];
          const listSize = result.data?.result.count || 0;
          const total = result.data?.result.totalCount || 0;
          const elementsList: OAuth2Client[] = [];

          for (let i = 0; i < listSize; i++) {
            elementsList.push(
              listResult[i].result as unknown as OAuth2Client
            );
          }

          setTotalCount(total);
          setClients(elementsList);
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
    updateShownElementsList: setClients,
    totalCount,
  };

  const searchValueData = {
    searchValue,
    updateSearchValue: setSearchValue,
    submitSearchValue,
  };

  const bulkSelectorData = {
    selected: selectedElements,
    updateSelected: updateSelectedClients,
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
          list={clients}
          shownElementsList={clients}
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
          dataCy="search"
          name="search"
          ariaLabel="Search OAuth2 clients"
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
          dataCy="oauth2-clients-button-refresh"
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
          dataCy="oauth2-clients-button-delete"
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
          dataCy="oauth2-clients-button-add"
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
          list={clients}
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
          id="OAuth2 clients page"
          headingLevel="h1"
          text="OAuth2 clients"
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
                    tableTitle="OAuth2 clients table"
                    shownElementsList={clients}
                    pk="cn"
                    keyNames={[
                      "cn",
                      "oauth2clientid",
                      "oauth2clienttype",
                      "oauth2enabled",
                    ]}
                    columnNames={["Name", "Client ID", "Type", "Enabled"]}
                    hasCheckboxes={true}
                    pathname="oauth2-clients"
                    showTableRows={showTableRows}
                    showLink={true}
                    elementsData={{
                      isElementSelectable: isOAuth2ClientSelectable,
                      selectedElements,
                      selectableElementsTable: selectableTable,
                      setElementsSelected: setClientsSelected,
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
              list={clients}
              paginationData={paginationData}
              variant={PaginationVariant.bottom}
              widgetId="pagination-options-menu-bottom"
            />
          </FlexItem>
        </Flex>
      </PageSection>
      <AddOAuth2ClientModal
        isOpen={showAddModal}
        onCloseModal={() => setShowAddModal(false)}
        onRefresh={refreshData}
        title="Add OAuth2 client"
      />
      <DeleteOAuth2ClientModal
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
        columnNames={["Name", "Client ID", "Type", "Enabled"]}
        keyNames={["cn", "oauth2clientid", "oauth2clienttype", "oauth2enabled"]}
        onRefresh={refreshData}
      />
    </div>
  );
};

export default OAuth2Clients;
