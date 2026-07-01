import React from "react";
// PatternFly
import {
  Button,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  Sidebar,
  SidebarContent,
  SidebarPanel,
  TextInput,
} from "@patternfly/react-core";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
import useUpdateRoute from "src/hooks/useUpdateRoute";
// Icons
import { OutlinedQuestionCircleIcon } from "@patternfly/react-icons";
// RPC
import {
  useGetRealmDomainsQuery,
  useSaveRealmDomainsMutation,
} from "src/services/rpcRealmDomains";
// Components
import DataSpinner from "src/components/layouts/DataSpinner";
import HelpTextWithIconLayout from "src/components/layouts/HelpTextWithIconLayout";
import PageWithGrayBorderLayout from "src/components/layouts/PageWithGrayBorderLayout";
import SecondaryButton from "src/components/layouts/SecondaryButton";
import { ToolbarItem } from "src/components/layouts/ToolbarLayout";

const RealmDomains = () => {
  const dispatch = useAppDispatch();

  // API calls
  const domainsQuery = useGetRealmDomainsQuery();
  const [saveRealmDomains] = useSaveRealmDomainsMutation();

  // Update current route data to Redux and highlight the current page in the Nav bar
  const { browserTitle } = useUpdateRoute({
    pathname: "realm-domains",
  });

  // Set the page title to be shown in the browser tab
  React.useEffect(() => {
    document.title = browserTitle;
  }, [browserTitle]);

  // States
  const [isDataLoading, setIsDataLoading] = React.useState(false);
  const [domains, setDomains] = React.useState<string[]>([]);
  const [originalDomains, setOriginalDomains] = React.useState<string[]>([]);

  // Sync state when API data arrives
  React.useEffect(() => {
    if (domainsQuery.data && !domainsQuery.isFetching) {
      setDomains([...domainsQuery.data]);
      setOriginalDomains([...domainsQuery.data]);
    }
  }, [domainsQuery.data, domainsQuery.isFetching]);

  // Detect modifications
  const modified = JSON.stringify(domains) !== JSON.stringify(originalDomains);

  // Add a new empty domain entry
  const onAddDomain = () => {
    setDomains([...domains, ""]);
  };

  // Update a domain value at a given index
  const onChangeDomain = (value: string, idx: number) => {
    const updated = [...domains];
    updated[idx] = value;
    setDomains(updated);
  };

  // Remove a domain at a given index
  const onRemoveDomain = (idx: number) => {
    const updated = [...domains];
    updated.splice(idx, 1);
    setDomains(updated);
  };

  // 'Revert' handler method
  const onRevert = () => {
    setDomains([...originalDomains]);
    dispatch(
      addAlert({
        name: "revert-success",
        title: "Realm domains data reverted",
        variant: "success",
      })
    );
  };

  // 'Save' handler method
  const onSave = (event: React.FormEvent) => {
    event.preventDefault();
    setIsDataLoading(true);

    // Filter out empty strings before saving
    const domainsToSave = domains.filter((d) => d.trim() !== "");

    saveRealmDomains(domainsToSave).then((response) => {
      if ("data" in response) {
        const data = response.data;
        if (data?.error) {
          dispatch(
            addAlert({
              name: "save-error",
              title: (data.error as Error).message,
              variant: "danger",
            })
          );
        }
        if (data?.result) {
          dispatch(
            addAlert({
              name: "save-success",
              title: "Realm domains updated",
              variant: "success",
            })
          );
        }
        // Refresh data from server
        domainsQuery.refetch();
      }
      setIsDataLoading(false);
    });
  };

  // Toolbar
  const toolbarItems: ToolbarItem[] = [
    {
      key: 0,
      element: (
        <Button
          variant="secondary"
          data-cy="realm-domains-button-refresh"
          onClick={() => domainsQuery.refetch()}
        >
          Refresh
        </Button>
      ),
    },
    {
      key: 1,
      element: (
        <Button
          variant="secondary"
          data-cy="realm-domains-button-revert"
          onClick={onRevert}
          isDisabled={!modified || isDataLoading}
        >
          Revert
        </Button>
      ),
    },
    {
      key: 2,
      element: (
        <Button
          variant="primary"
          data-cy="realm-domains-button-save"
          isDisabled={!modified || isDataLoading}
          form="realm-domains-form"
          type="submit"
          isLoading={isDataLoading}
          spinnerAriaValueText="Saving"
          spinnerAriaLabel="Saving"
        >
          {isDataLoading ? "Saving" : "Save"}
        </Button>
      ),
    },
  ];

  // Handling of the API data
  if (domainsQuery.isLoading) {
    return <DataSpinner />;
  }

  return (
    <PageWithGrayBorderLayout
      id="realm-domains-page"
      pageTitle="Realm Domains"
      toolbarItems={toolbarItems}
    >
      <>
        <Sidebar isPanelRight className="pf-v6-u-mb-0">
          <SidebarPanel variant="sticky">
            <HelpTextWithIconLayout
              textContent="Help"
              icon={
                <OutlinedQuestionCircleIcon className="pf-v6-u-primary-color-100 pf-v6-u-mr-sm" />
              }
            />
          </SidebarPanel>
          <SidebarContent className="pf-v6-u-mr-xl">
            <Flex>
              <FlexItem flex={{ default: "flex_1" }}>
                <Form id="realm-domains-form" onSubmit={onSave}>
                  <FormGroup label="Domain" fieldId="associateddomain">
                    <div data-cy="realm-domains-list">
                      <Flex
                        direction={{ default: "column" }}
                        name="associateddomain"
                      >
                        {domains.map((domain, idx) => (
                          <Flex
                            direction={{ default: "row" }}
                            key={"domain-" + idx + "-div"}
                            name="value"
                            data-cy={"realm-domains-div-" + idx}
                          >
                            <FlexItem
                              key={"domain-" + idx + "-textbox"}
                              flex={{ default: "flex_1" }}
                            >
                              <TextInput
                                data-cy={"realm-domains-textbox-" + idx}
                                id={"associateddomain-" + idx}
                                value={domain}
                                type="text"
                                name={"associateddomain-" + idx}
                                aria-label={"Domain name number " + idx}
                                onChange={(_event, value) =>
                                  onChangeDomain(value, idx)
                                }
                              />
                            </FlexItem>
                            <FlexItem key={"domain-" + idx + "-delete-button"}>
                              <Button
                                data-cy={"realm-domains-button-delete-" + idx}
                                variant="secondary"
                                name={"remove-domain-" + idx}
                                onClick={() => onRemoveDomain(idx)}
                                size="sm"
                              >
                                Delete
                              </Button>
                            </FlexItem>
                          </Flex>
                        ))}
                      </Flex>
                      <SecondaryButton
                        dataCy="realm-domains-button-add"
                        classname="pf-v6-u-mt-sm"
                        name="add-domain"
                        onClickHandler={onAddDomain}
                      >
                        Add
                      </SecondaryButton>
                    </div>
                  </FormGroup>
                </Form>
              </FlexItem>
            </Flex>
          </SidebarContent>
        </Sidebar>
      </>
    </PageWithGrayBorderLayout>
  );
};

export default RealmDomains;
