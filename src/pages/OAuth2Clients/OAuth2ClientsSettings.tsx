import React from "react";
// PatternFly
import {
  Flex,
  FlexItem,
  Form,
  FormGroup,
  JumpLinks,
  JumpLinksItem,
  Sidebar,
  SidebarContent,
  SidebarPanel,
} from "@patternfly/react-core";
// Data types
import { Metadata } from "src/utils/datatypes/globalDataTypes";
import { OAuth2Client } from "src/hooks/useOAuth2ClientSettingsData";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import useUpdateRoute from "src/hooks/useUpdateRoute";
import { addAlert } from "src/store/Global/alerts-slice";
// Utils
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asRecord = (
  element: Record<string, any>,
  onElementChange: (element: Record<string, any>) => void
) => {
  const ipaObject = element as Record<string, any>;
  function recordOnChange(ipaObject: Record<string, any>) {
    onElementChange(ipaObject);
  }
  return { ipaObject, recordOnChange };
};
// Icons
import { OutlinedQuestionCircleIcon } from "@patternfly/react-icons";
// RPC
import {
  OAuth2ClientModPayload,
  useOauth2ClientModMutation,
  useOauth2ClientGenerateSecretMutation,
} from "src/services/rpcOAuth2";
// Components
import IpaTextInput from "src/components/Form/IpaTextInput/IpaTextInput";
import TabLayout from "src/components/layouts/TabLayout";
import SecondaryButton from "src/components/layouts/SecondaryButton";
import HelpTextWithIconLayout from "src/components/layouts/HelpTextWithIconLayout";
import IpaTextContent from "src/components/Form/IpaTextContent/IpaTextContent";
import TitleLayout from "src/components/layouts/TitleLayout";
// PatternFly extra
import {
  Button,
  ClipboardCopy,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

interface PropsToSettings {
  client: Partial<OAuth2Client>;
  originalClient: Partial<OAuth2Client>;
  metadata: Metadata;
  onClientChange: (client: Partial<OAuth2Client>) => void;
  onRefresh: () => void;
  isModified: boolean;
  isDataLoading?: boolean;
  modifiedValues: () => Partial<OAuth2Client>;
  onResetValues: () => void;
  pathname: string;
}

const OAuth2ClientSettings = (props: PropsToSettings) => {
  const dispatch = useAppDispatch();

  useUpdateRoute({ pathname: props.pathname });

  const [isDataLoading, setIsDataLoading] = React.useState(false);

  const { ipaObject, recordOnChange } = asRecord(
    props.client,
    props.onClientChange
  );

  const [saveClient] = useOauth2ClientModMutation();
  const [generateSecret] = useOauth2ClientGenerateSecretMutation();
  const [generatedSecret, setGeneratedSecret] = React.useState<string | null>(
    null
  );
  const [isSecretModalOpen, setIsSecretModalOpen] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const onGenerateSecret = () => {
    const clientName = props.client.cn?.toString();
    if (!clientName) return;

    setIsGenerating(true);
    generateSecret(clientName).then((response) => {
      setIsGenerating(false);
      if ("data" in response) {
        const data = response.data;
        if (data?.error) {
          dispatch(
            addAlert({
              name: "error",
              title: (data.error as Error).message,
              variant: "danger",
            })
          );
        }
        if (data?.result?.result?.secret) {
          const secret = data.result.result.secret;
          setGeneratedSecret(Array.isArray(secret) ? secret[0] : secret);
          setIsSecretModalOpen(true);
          props.onRefresh();
        }
      }
    });
  };

  const onCloseSecretModal = () => {
    setIsSecretModalOpen(false);
    setGeneratedSecret(null);
  };

  const isConfidential =
    props.client.oauth2clienttype?.[0] !== "public";

  const onRevert = () => {
    props.onClientChange(props.originalClient);
    props.onRefresh();
    dispatch(
      addAlert({
        name: "revert-success",
        title: "OAuth2 client data reverted",
        variant: "success",
      })
    );
  };

  const buildPayload = (
    modifiedValues: Partial<OAuth2Client>,
    keyArray: string[]
  ): OAuth2ClientModPayload => {
    const payload: OAuth2ClientModPayload = {
      clientName: props.client.cn?.toString() as string,
    };

    keyArray.forEach((key) => {
      if (modifiedValues[key] !== undefined) {
        if (modifiedValues[key] === "") {
          payload[key] = [];
        } else {
          payload[key] = modifiedValues[key];
        }
      }
    });
    return payload;
  };

  const onSave = () => {
    setIsDataLoading(true);
    const modifiedValues = props.modifiedValues();

    const payload = buildPayload(modifiedValues, [
      "oauth2clientid",
      "oauth2redirecturi",
      "oauth2granttype",
      "oauth2scope",
      "oauth2clienttype",
      "oauth2tokenlifetime",
      "oauth2enabled",
      "description",
    ]);

    saveClient(payload).then((response) => {
      if ("data" in response) {
        const data = response.data;
        if (data?.error) {
          dispatch(
            addAlert({
              name: "error",
              title: (data.error as Error).message,
              variant: "danger",
            })
          );
        }
        if (data?.result) {
          props.onClientChange(data.result.result);
          dispatch(
            addAlert({
              name: "success",
              title:
                "OAuth2 client '" + props.client.cn + "' updated",
              variant: "success",
            })
          );
          props.onResetValues();
        }
      }
      setIsDataLoading(false);
    });
  };

  const toolbarFields = [
    {
      key: 0,
      element: (
        <SecondaryButton
          dataCy="oauth2-clients-tab-settings-button-refresh"
          onClickHandler={props.onRefresh}
        >
          Refresh
        </SecondaryButton>
      ),
    },
    {
      key: 1,
      element: (
        <SecondaryButton
          dataCy="oauth2-clients-tab-settings-button-revert"
          isDisabled={!props.isModified || isDataLoading}
          onClickHandler={onRevert}
        >
          Revert
        </SecondaryButton>
      ),
    },
    {
      key: 2,
      element: (
        <SecondaryButton
          dataCy="oauth2-clients-tab-settings-button-save"
          isDisabled={!props.isModified || isDataLoading}
          onClickHandler={onSave}
        >
          Save
        </SecondaryButton>
      ),
    },
  ];

  return (
    <>
      <TabLayout id="settings-page" toolbarItems={toolbarFields}>
        <Sidebar isPanelRight>
          <SidebarPanel variant="sticky">
            <HelpTextWithIconLayout
              textContent="Help"
              icon={
                <OutlinedQuestionCircleIcon className="pf-v6-u-primary-color-100 pf-v6-u-mr-sm" />
              }
            />
            <JumpLinks
              isVertical
              label="Jump to section"
              scrollableSelector="#oauth2-client-page"
              expandable={{ default: "expandable", md: "nonExpandable" }}
              className="pf-v6-u-mt-md"
            >
              <JumpLinksItem key={0} href="#general-settings">
                General
              </JumpLinksItem>
              <JumpLinksItem key={1} href="#oauth2-settings">
                OAuth2 settings
              </JumpLinksItem>
              <JumpLinksItem key={2} href="#client-secret">
                Client secret
              </JumpLinksItem>
              <JumpLinksItem key={3} href="#keycloak-sync">
                Keycloak sync
              </JumpLinksItem>
            </JumpLinks>
          </SidebarPanel>
          <SidebarContent className="pf-v6-u-mr-xl">
            <TitleLayout
              key={0}
              id="general-settings"
              text="General"
              headingLevel="h2"
              className="pf-v6-u-mt-lg pf-v6-u-mb-md"
            />
            <Flex direction={{ default: "column", lg: "row" }}>
              <FlexItem flex={{ default: "flex_1" }}>
                <Form className="pf-v6-u-mb-lg">
                  <FormGroup label="Name" role="group">
                    <IpaTextContent
                      dataCy="oauth2-clients-tab-settings-textbox-cn"
                      name={"cn"}
                      ariaLabel={"Name"}
                      ipaObject={ipaObject}
                      objectName="oauth2client"
                      metadata={props.metadata}
                    />
                  </FormGroup>
                  <FormGroup
                    label="Client ID"
                    fieldId="oauth2clientid"
                    isRequired
                  >
                    <IpaTextInput
                      dataCy="oauth2-clients-tab-settings-textbox-oauth2clientid"
                      name={"oauth2clientid"}
                      ariaLabel={"Client ID"}
                      ipaObject={ipaObject}
                      onChange={recordOnChange}
                      objectName="oauth2client"
                      metadata={props.metadata}
                    />
                  </FormGroup>
                  <FormGroup
                    label="Client type"
                    fieldId="oauth2clienttype"
                  >
                    <IpaTextInput
                      dataCy="oauth2-clients-tab-settings-textbox-oauth2clienttype"
                      name={"oauth2clienttype"}
                      ariaLabel={"Client type"}
                      ipaObject={ipaObject}
                      onChange={recordOnChange}
                      objectName="oauth2client"
                      metadata={props.metadata}
                    />
                  </FormGroup>
                  <FormGroup label="Enabled" fieldId="oauth2enabled">
                    <IpaTextInput
                      dataCy="oauth2-clients-tab-settings-textbox-oauth2enabled"
                      name={"oauth2enabled"}
                      ariaLabel={"Enabled"}
                      ipaObject={ipaObject}
                      onChange={recordOnChange}
                      objectName="oauth2client"
                      metadata={props.metadata}
                    />
                  </FormGroup>
                  <FormGroup label="Description" fieldId="description">
                    <IpaTextInput
                      dataCy="oauth2-clients-tab-settings-textbox-description"
                      name={"description"}
                      ariaLabel={"Description"}
                      ipaObject={ipaObject}
                      onChange={recordOnChange}
                      objectName="oauth2client"
                      metadata={props.metadata}
                    />
                  </FormGroup>
                </Form>
              </FlexItem>
            </Flex>
            <TitleLayout
              key={1}
              headingLevel="h2"
              id="oauth2-settings"
              text="OAuth2 settings"
              className="pf-v6-u-mt-lg pf-v6-u-mb-md"
            />
            <Flex direction={{ default: "column", lg: "row" }}>
              <FlexItem flex={{ default: "flex_1" }}>
                <Form className="pf-v6-u-mb-lg">
                  <FormGroup
                    label="Redirect URIs"
                    fieldId="oauth2redirecturi"
                  >
                    <IpaTextInput
                      dataCy="oauth2-clients-tab-settings-textbox-oauth2redirecturi"
                      name={"oauth2redirecturi"}
                      ariaLabel={"Redirect URIs"}
                      ipaObject={ipaObject}
                      onChange={recordOnChange}
                      objectName="oauth2client"
                      metadata={props.metadata}
                    />
                  </FormGroup>
                  <FormGroup
                    label="Grant types"
                    fieldId="oauth2granttype"
                  >
                    <IpaTextInput
                      dataCy="oauth2-clients-tab-settings-textbox-oauth2granttype"
                      name={"oauth2granttype"}
                      ariaLabel={"Grant types"}
                      ipaObject={ipaObject}
                      onChange={recordOnChange}
                      objectName="oauth2client"
                      metadata={props.metadata}
                    />
                  </FormGroup>
                  <FormGroup label="Scopes" fieldId="oauth2scope">
                    <IpaTextInput
                      dataCy="oauth2-clients-tab-settings-textbox-oauth2scope"
                      name={"oauth2scope"}
                      ariaLabel={"Scopes"}
                      ipaObject={ipaObject}
                      onChange={recordOnChange}
                      objectName="oauth2client"
                      metadata={props.metadata}
                    />
                  </FormGroup>
                  <FormGroup
                    label="Token lifetime"
                    fieldId="oauth2tokenlifetime"
                  >
                    <IpaTextInput
                      dataCy="oauth2-clients-tab-settings-textbox-oauth2tokenlifetime"
                      name={"oauth2tokenlifetime"}
                      ariaLabel={"Token lifetime"}
                      ipaObject={ipaObject}
                      onChange={recordOnChange}
                      objectName="oauth2client"
                      metadata={props.metadata}
                    />
                  </FormGroup>
                </Form>
              </FlexItem>
            </Flex>
            <TitleLayout
              key={2}
              headingLevel="h2"
              id="client-secret"
              text="Client secret"
              className="pf-v6-u-mt-lg pf-v6-u-mb-md"
            />
            <Flex direction={{ default: "column", lg: "row" }}>
              <FlexItem flex={{ default: "flex_1" }}>
                <Form className="pf-v6-u-mb-lg">
                  <FormGroup
                    label="Secret hash"
                    fieldId="oauth2clientsecret"
                  >
                    <IpaTextContent
                      dataCy="oauth2-clients-tab-settings-textbox-oauth2clientsecret"
                      name={"oauth2clientsecret"}
                      ariaLabel={"Secret hash"}
                      ipaObject={ipaObject}
                      objectName="oauth2client"
                      metadata={props.metadata}
                    />
                  </FormGroup>
                  {isConfidential && (
                    <FormGroup fieldId="generate-secret">
                      <Button
                        variant="secondary"
                        onClick={onGenerateSecret}
                        isLoading={isGenerating}
                        isDisabled={isGenerating}
                        data-cy="oauth2-clients-tab-settings-button-generate-secret"
                      >
                        Generate new secret
                      </Button>
                    </FormGroup>
                  )}
                </Form>
              </FlexItem>
            </Flex>
            <TitleLayout
              key={3}
              headingLevel="h2"
              id="keycloak-sync"
              text="Keycloak sync"
              className="pf-v6-u-mt-lg pf-v6-u-mb-md"
            />
            <Flex direction={{ default: "column", lg: "row" }}>
              <FlexItem flex={{ default: "flex_1" }}>
                <Form className="pf-v6-u-mb-lg">
                  <FormGroup
                    label="Keycloak UUID"
                    fieldId="oauth2keycloakid"
                  >
                    <IpaTextContent
                      dataCy="oauth2-clients-tab-settings-textbox-oauth2keycloakid"
                      name={"oauth2keycloakid"}
                      ariaLabel={"Keycloak UUID"}
                      ipaObject={ipaObject}
                      objectName="oauth2client"
                      metadata={props.metadata}
                    />
                  </FormGroup>
                </Form>
              </FlexItem>
            </Flex>
          </SidebarContent>
        </Sidebar>
      </TabLayout>
      <Modal
        variant="small"
        isOpen={isSecretModalOpen}
        onClose={onCloseSecretModal}
      >
        <ModalHeader title="Client Secret Generated" />
        <ModalBody>
          <p className="pf-v6-u-mb-md">
            Copy this secret now. It will not be shown again.
          </p>
          {generatedSecret && (
            <ClipboardCopy
              isReadOnly
              hoverTip="Copy"
              clickTip="Copied"
              variant="inline-compact"
            >
              {generatedSecret}
            </ClipboardCopy>
          )}
        </ModalBody>
        <ModalFooter>
          <Button data-cy="secret-modal-done" variant="primary" onClick={onCloseSecretModal}>
            Done
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default OAuth2ClientSettings;
