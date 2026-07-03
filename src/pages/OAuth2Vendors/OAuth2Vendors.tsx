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
  useGetOAuth2VendorEntriesQuery,
  useSearchOAuth2VendorEntriesMutation,
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
import AddOAuth2VendorModal from "src/components/modals/OAuth2/AddVendorModal";
import DeleteOAuth2VendorModal from "src/components/modals/OAuth2/DeleteVendorModal";

interface OAuth2Vendor {
  cn: string;
  dn: string;
  oauth2vendorcontact: string[];
  oauth2vendorscope: string[];
  oauth2vendornotafter: string[];
  oauth2enabled: string[];
}

// Unwrap __datetime__ and __base64__ objects returned by IPA JSON API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const UNWRAP_FIELDS = ["oauth2vendornotafter", "oauth2vendorcacert"];

const unwrapVendorSpecialTypes = (vendor: any): OAuth2Vendor => {
  const v = { ...vendor };
  for (const key of UNWRAP_FIELDS) {
    if (key in v && Array.isArray(v[key]) && v[key].length > 0) {
      if (v[key][0]?.__datetime__) {
        v[key] = [v[key][0].__datetime__];
      } else if (v[key][0]?.__base64__) {
        v[key] = [v[key][0].__base64__];
      }
    }
  }
  return v as OAuth2Vendor;
};

const isOAuth2VendorSelectable = (vendor: OAuth2Vendor) =>
  vendor.cn !== undefined;

const OAuth2Vendors = () => {
  const dispatch = useAppDispatch();

  const { browserTitle } = useUpdateRoute({
    pathname: "oauth2-vendors",
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

  const [vendors, setVendors] = React.useState<OAuth2Vendor[]>([]);
  const [isSearchDisabled, setIsSearchDisabled] = React.useState(false);
  const [totalCount, setTotalCount] = React.useState(0);

  const vendorsResponse = useGetOAuth2VendorEntriesQuery({
    searchValue: searchValue,
    apiVersion,
    sizelimit: 100,
    startIdx: firstIdx,
    stopIdx: lastIdx,
  });

  const { data, isLoading, error } = vendorsResponse;

  React.useEffect(() => {
    if (vendorsResponse.isFetching) {
      setShowTableRows(false);
      setTotalCount(0);
      globalErrors.clear();
      return;
    }

    if (vendorsResponse.isSuccess && vendorsResponse.data && data) {
      const listResult = data.result.results;
      const totalCount = data.result.totalCount;
      const listSize = data.result.count;
      const elementsList: OAuth2Vendor[] = [];

      for (let i = 0; i < listSize; i++) {
        elementsList.push(unwrapVendorSpecialTypes(listResult[i].result));
      }

      setTotalCount(totalCount);
      setVendors(elementsList);
      setShowTableRows(true);
    }

    if (
      !vendorsResponse.isLoading &&
      vendorsResponse.isError &&
      vendorsResponse.error
    ) {
      window.location.reload();
    }
  }, [vendorsResponse]);

  const [selectedElements, setSelectedElements] = React.useState<
    OAuth2Vendor[]
  >([]);
  const [selectedPerPage, setSelectedPerPage] = React.useState(0);

  const clearSelectedElements = () => {
    setSelectedElements([]);
  };

  const refreshData = () => {
    setShowTableRows(false);
    setTotalCount(0);
    vendorsResponse.refetch().then(() => {
      setShowTableRows(true);
    });
  };

  const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] =
    React.useState(true);
  const [isDeletion, setIsDeletion] = React.useState(false);

  const selectableTable = vendors.filter(isOAuth2VendorSelectable);

  const updateSelectedVendors = (
    items: OAuth2Vendor[],
    isSelected: boolean
  ) => {
    let newSelected: OAuth2Vendor[] = [];
    if (isSelected) {
      newSelected = JSON.parse(JSON.stringify(selectedElements));
      for (const item of items) {
        if (!selectedElements.find((sel) => sel.cn?.[0] === item.cn?.[0])) {
          newSelected.push(item);
        }
      }
    } else {
      for (const sel of selectedElements) {
        let found = false;
        for (const item of items) {
          if (sel.cn?.[0] === item.cn?.[0]) {
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

  const setVendorsSelected = (vendor: OAuth2Vendor, isSelecting = true) => {
    if (isOAuth2VendorSelectable(vendor)) {
      updateSelectedVendors([vendor], isSelecting);
    }
  };

  React.useEffect(() => {
    vendorsResponse.refetch();
  }, []);

  const [showTableRows, setShowTableRows] = React.useState(!isLoading);

  React.useEffect(() => {
    if (showTableRows !== !isLoading) {
      setShowTableRows(!isLoading);
    }
  }, [isLoading]);

  const [searchEntry] = useSearchOAuth2VendorEntriesMutation();

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
              title: error || "Error when searching for trusted vendors",
              variant: "danger",
            })
          );
        } else {
          const listResult = result.data?.result.results || [];
          const listSize = result.data?.result.count || 0;
          const totalCount = result.data?.result.totalCount || 0;
          const elementsList: OAuth2Vendor[] = [];

          for (let i = 0; i < listSize; i++) {
            elementsList.push(
              listResult[i].result as unknown as OAuth2Vendor
            );
          }

          setTotalCount(totalCount);
          setVendors(elementsList);
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
    updateShownElementsList: setVendors,
    totalCount,
  };

  const searchValueData = {
    searchValue,
    updateSearchValue: setSearchValue,
    submitSearchValue,
  };

  const bulkSelectorData = {
    selected: selectedElements,
    updateSelected: updateSelectedVendors,
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
          list={vendors}
          shownElementsList={vendors}
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
          ariaLabel="Search trusted vendors"
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
          dataCy="oauth2-vendors-button-refresh"
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
          dataCy="oauth2-vendors-button-delete"
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
          dataCy="oauth2-vendors-button-add"
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
          list={vendors}
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
          id="Trusted vendors page"
          headingLevel="h1"
          text="Trusted vendors"
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
                    tableTitle="Trusted vendors table"
                    shownElementsList={vendors}
                    pk="cn"
                    keyNames={[
                      "cn",
                      "oauth2vendorcontact",
                      "oauth2vendornotafter",
                      "oauth2enabled",
                    ]}
                    columnNames={[
                      "Name",
                      "Contact",
                      "Expires",
                      "Enabled",
                    ]}
                    hasCheckboxes={true}
                    pathname="oauth2-vendors"
                    showTableRows={showTableRows}
                    showLink={true}
                    elementsData={{
                      isElementSelectable: isOAuth2VendorSelectable,
                      selectedElements,
                      selectableElementsTable: selectableTable,
                      setElementsSelected: setVendorsSelected,
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
              list={vendors}
              paginationData={paginationData}
              variant={PaginationVariant.bottom}
              widgetId="pagination-options-menu-bottom"
            />
          </FlexItem>
        </Flex>
      </PageSection>
      <AddOAuth2VendorModal
        isOpen={showAddModal}
        onCloseModal={() => setShowAddModal(false)}
        onRefresh={refreshData}
        title="Add trusted vendor"
      />
      <DeleteOAuth2VendorModal
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
        columnNames={["Name", "Contact", "Expires", "Enabled"]}
        keyNames={["cn", "oauth2vendorcontact", "oauth2vendornotafter", "oauth2enabled"]}
        onRefresh={refreshData}
      />
    </div>
  );
};

export default OAuth2Vendors;
