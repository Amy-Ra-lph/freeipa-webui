import React, { useMemo, useState } from "react";
// PatternFly
import {
  Button,
  ExpandableSection,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  PageSection,
  PaginationVariant,
  TextInput,
  ToolbarItemVariant,
} from "@patternfly/react-core";
// PatternFly table
import {
  InnerScrollContainer,
  OuterScrollContainer,
} from "@patternfly/react-table";
// Data types
import { Certificate } from "src/utils/datatypes/globalDataTypes";
import { ToolbarItem } from "src/components/layouts/ToolbarLayout";
// Redux
import { useAppDispatch } from "src/store/hooks";
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
import ContextualHelpPanel from "src/components/ContextualHelpPanel/ContextualHelpPanel";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import useUpdateRoute from "src/hooks/useUpdateRoute";
import useListPageSearchParams from "src/hooks/useListPageSearchParams";
import { useContextualHelpPanel } from "src/hooks/useContextualHelpPanel";
// RPC client
import { useCertFindMutation } from "src/services/rpcCertificates";
// Errors
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";

const Certificates = () => {
  const dispatch = useAppDispatch();

  const { browserTitle } = useUpdateRoute({ pathname: "certificates" });

  React.useEffect(() => {
    document.title = browserTitle;
  }, [browserTitle]);

  const { page, setPage, perPage, setPerPage, searchValue, setSearchValue } =
    useListPageSearchParams();

  const firstIdx = (page - 1) * perPage;
  const lastIdx = page * perPage;

  // Search mutation
  const [certFind] = useCertFindMutation({});
  const [isSearching, setIsSearching] = useState(false);
  const [searchDisabled, setSearchIsDisabled] = useState(false);
  const [certificatesList, setCertificatesList] = useState<Certificate[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  // Advanced search form state
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [advSubject, setAdvSubject] = useState("");
  const [advIssuer, setAdvIssuer] = useState("");
  const [advMinSerial, setAdvMinSerial] = useState("");
  const [advMaxSerial, setAdvMaxSerial] = useState("");
  const [advStatus, setAdvStatus] = useState("");

  const showTableRows = useMemo(() => {
    return !isSearching;
  }, [isSearching]);

  // Execute search using the mutation
  const executeSearch = (params: {
    subject?: string;
    issuer?: string;
    min_serial_number?: string;
    max_serial_number?: string;
    status?: string;
  }) => {
    setSearchIsDisabled(true);
    setIsSearching(true);

    certFind({
      ...params,
      sizeLimit: 0,
      startIdx: firstIdx,
      stopIdx: lastIdx,
    }).then((result) => {
      if ("data" in result) {
        const searchError = result.data as unknown as {
          error?: FetchBaseQueryError | SerializedError;
        };

        if (searchError.error) {
          let error: string | undefined = "";
          if ("error" in searchError.error) {
            error = searchError.error.error;
          } else if ("message" in searchError.error) {
            error = searchError.error.message;
          }
          dispatch(
            addAlert({
              name: "cert-search-error",
              title: error || "Error when searching for certificates",
              variant: "danger",
            })
          );
          setCertificatesList([]);
          setTotalCount(0);
        } else {
          const data = result.data as {
            certificates: Certificate[];
            totalCount: number;
          };
          setCertificatesList(data.certificates);
          setTotalCount(data.totalCount);
        }
        setHasSearched(true);
        setSearchIsDisabled(false);
        setIsSearching(false);
      } else if ("error" in result) {
        dispatch(
          addAlert({
            name: "cert-search-error",
            title: "Error when searching for certificates",
            variant: "danger",
          })
        );
        setCertificatesList([]);
        setTotalCount(0);
        setHasSearched(true);
        setSearchIsDisabled(false);
        setIsSearching(false);
      }
    });
  };

  // Quick search (toolbar) - searches by subject
  const submitSearchValue = () => {
    executeSearch({ subject: searchValue });
  };

  // Advanced search
  const submitAdvancedSearch = () => {
    executeSearch({
      subject: advSubject || undefined,
      issuer: advIssuer || undefined,
      min_serial_number: advMinSerial || undefined,
      max_serial_number: advMaxSerial || undefined,
      status: advStatus || undefined,
    });
  };

  const resetAdvancedSearch = () => {
    setAdvSubject("");
    setAdvIssuer("");
    setAdvMinSerial("");
    setAdvMaxSerial("");
    setAdvStatus("");
  };

  const refreshData = () => {
    if (hasSearched) {
      // Re-execute the last search
      submitSearchValue();
    }
  };

  // Re-search when pagination changes (only if a search has been performed)
  React.useEffect(() => {
    if (hasSearched) {
      if (
        advSubject ||
        advIssuer ||
        advMinSerial ||
        advMaxSerial ||
        advStatus
      ) {
        submitAdvancedSearch();
      } else if (searchValue) {
        submitSearchValue();
      }
    }
  }, [page, perPage]);

  const paginationData = {
    page,
    perPage,
    updatePage: setPage,
    updatePerPage: setPerPage,
    totalCount,
  };

  const searchValueData = {
    searchValue,
    updateSearchValue: setSearchValue,
    submitSearchValue,
  };

  // Contextual links panel
  const contextualPanel = useContextualHelpPanel({
    defaultPage: "certificates",
  });

  const columnNames = [
    "Serial Number",
    "Subject",
    "Issuer",
    "Valid Not After",
    "Status",
  ];
  const keyNames = [
    "serial_number_hex",
    "subject",
    "issuer",
    "valid_not_after",
    "status",
  ];

  const toolbarItems: ToolbarItem[] = [
    {
      key: 0,
      element: (
        <SearchInputLayout
          dataCy="search"
          name="search"
          ariaLabel="Search certificates"
          placeholder="Search by subject"
          searchValueData={searchValueData}
          isDisabled={searchDisabled}
        />
      ),
      toolbarItemVariant: ToolbarItemVariant.label,
      toolbarItemGap: { default: "gapMd" },
    },
    {
      key: 1,
      toolbarItemVariant: ToolbarItemVariant.separator,
    },
    {
      key: 2,
      element: (
        <SecondaryButton
          onClickHandler={refreshData}
          isDisabled={!showTableRows || !hasSearched}
          dataCy="certificates-button-refresh"
        >
          Refresh
        </SecondaryButton>
      ),
    },
    {
      key: 3,
      toolbarItemVariant: ToolbarItemVariant.separator,
    },
    {
      key: 4,
      element: (
        <HelpTextWithIconLayout
          textContent="Help"
          onClick={() => contextualPanel.setIsExpanded((prev) => !prev)}
        />
      ),
    },
    {
      key: 5,
      element: (
        <PaginationLayout
          list={certificatesList}
          paginationData={paginationData}
          widgetId="pagination-options-menu-top"
          isCompact={true}
        />
      ),
      toolbarItemAlignment: { default: "alignEnd" },
    },
  ];

  return (
    <ContextualHelpPanel {...contextualPanel.panelProps}>
      <PageSection hasBodyWrapper={false}>
        <TitleLayout
          id="certificates-title"
          headingLevel="h1"
          text="Certificates"
        />
      </PageSection>
      <PageSection hasBodyWrapper={false} isFilled={false}>
        <Flex direction={{ default: "column" }}>
          {/* Advanced search form */}
          <FlexItem>
            <ExpandableSection
              toggleText={
                isAdvancedOpen ? "Hide advanced search" : "Advanced search"
              }
              onToggle={(_event, isExpanded) => setIsAdvancedOpen(isExpanded)}
              isExpanded={isAdvancedOpen}
              data-cy="certificates-advanced-search"
            >
              <Form
                isHorizontal
                className="pf-v6-u-mb-md"
                data-cy="certificates-advanced-form"
              >
                <FormGroup label="Subject" fieldId="adv-subject">
                  <TextInput
                    id="adv-subject"
                    data-cy="adv-subject"
                    value={advSubject}
                    onChange={(_event, value) => setAdvSubject(value)}
                    placeholder="e.g. CN=example.com"
                  />
                </FormGroup>
                <FormGroup label="Issuer" fieldId="adv-issuer">
                  <TextInput
                    id="adv-issuer"
                    data-cy="adv-issuer"
                    value={advIssuer}
                    onChange={(_event, value) => setAdvIssuer(value)}
                    placeholder="e.g. CN=Certificate Authority"
                  />
                </FormGroup>
                <FormGroup label="Min serial number" fieldId="adv-min-serial">
                  <TextInput
                    id="adv-min-serial"
                    data-cy="adv-min-serial"
                    value={advMinSerial}
                    onChange={(_event, value) => setAdvMinSerial(value)}
                    placeholder="e.g. 1"
                  />
                </FormGroup>
                <FormGroup label="Max serial number" fieldId="adv-max-serial">
                  <TextInput
                    id="adv-max-serial"
                    data-cy="adv-max-serial"
                    value={advMaxSerial}
                    onChange={(_event, value) => setAdvMaxSerial(value)}
                    placeholder="e.g. 100"
                  />
                </FormGroup>
                <FormGroup label="Status" fieldId="adv-status">
                  <TextInput
                    id="adv-status"
                    data-cy="adv-status"
                    value={advStatus}
                    onChange={(_event, value) => setAdvStatus(value)}
                    placeholder="VALID, REVOKED, or EXPIRED"
                  />
                </FormGroup>
                <Flex>
                  <FlexItem>
                    <Button
                      variant="primary"
                      onClick={submitAdvancedSearch}
                      isDisabled={searchDisabled}
                      data-cy="certificates-button-advanced-search"
                    >
                      Search
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="link"
                      onClick={resetAdvancedSearch}
                      data-cy="certificates-button-reset"
                    >
                      Reset
                    </Button>
                  </FlexItem>
                </Flex>
              </Form>
            </ExpandableSection>
          </FlexItem>
          {/* Toolbar */}
          <FlexItem>
            <ToolbarLayout toolbarItems={toolbarItems} />
          </FlexItem>
          {/* Table */}
          <FlexItem style={{ flex: "0 0 auto" }}>
            <OuterScrollContainer>
              <InnerScrollContainer
                style={{ height: "60vh", overflow: "auto" }}
              >
                <MainTable
                  tableTitle="Certificates table"
                  shownElementsList={certificatesList}
                  pk="serial_number"
                  keyNames={keyNames}
                  columnNames={columnNames}
                  hasCheckboxes={false}
                  pathname="certificates"
                  showTableRows={showTableRows}
                  showLink={false}
                  paginationData={{
                    selectedPerPage: perPage,
                    updateSelectedPerPage: setPerPage,
                  }}
                />
              </InnerScrollContainer>
            </OuterScrollContainer>
          </FlexItem>
          {/* Bottom pagination */}
          <FlexItem style={{ flex: "0 0 auto", position: "sticky", bottom: 0 }}>
            <PaginationLayout
              list={certificatesList}
              paginationData={paginationData}
              variant={PaginationVariant.bottom}
              widgetId="pagination-options-menu-bottom"
            />
          </FlexItem>
        </Flex>
      </PageSection>
    </ContextualHelpPanel>
  );
};

export default Certificates;
