import React from "react";
// PatternFly
import {
  ActionGroup,
  Alert,
  Button,
  Card,
  CardBody,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Label,
  List,
  ListItem,
  PageSection,
  TextInput,
  Title,
} from "@patternfly/react-core";
import {
  CheckCircleIcon,
  TimesCircleIcon,
} from "@patternfly/react-icons";
// Hooks
import useUpdateRoute from "src/hooks/useUpdateRoute";
// RPC
import {
  HBACTestPayload,
  HBACTestResult,
  useHbacTestMutation,
} from "src/services/rpcHBACTest";
// Components
import TitleLayout from "src/components/layouts/TitleLayout";

const HBACTest = () => {
  const { browserTitle } = useUpdateRoute({
    pathname: "hbac-test",
  });

  React.useEffect(() => {
    document.title = browserTitle;
  }, [browserTitle]);

  // Form state
  const [user, setUser] = React.useState("");
  const [targetHost, setTargetHost] = React.useState("");
  const [service, setService] = React.useState("");
  const [includeDisabled, setIncludeDisabled] = React.useState(false);

  // Result state
  const [testResult, setTestResult] = React.useState<HBACTestResult | null>(
    null
  );
  const [testError, setTestError] = React.useState<string | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);

  const [runTest] = useHbacTestMutation();

  const isFormValid = user.trim() !== "" && targetHost.trim() !== "" && service.trim() !== "";

  const onRunTest = () => {
    setIsRunning(true);
    setTestResult(null);
    setTestError(null);

    const payload: HBACTestPayload = {
      user: user.trim(),
      targethost: targetHost.trim(),
      service: service.trim(),
    };

    if (includeDisabled) {
      payload.disabled = true;
    }

    runTest(payload).then((response) => {
      setIsRunning(false);
      if ("data" in response) {
        const data = response.data;
        if (data?.error) {
          setTestError((data.error as Error).message || "Unknown error");
        } else if (data?.result) {
          const result = data.result as unknown as HBACTestResult;
          setTestResult(result);
        }
      } else if ("error" in response) {
        setTestError("Failed to run HBAC test");
      }
    });
  };

  const onClear = () => {
    setUser("");
    setTargetHost("");
    setService("");
    setIncludeDisabled(false);
    setTestResult(null);
    setTestError(null);
  };

  return (
    <div>
      <PageSection hasBodyWrapper={false}>
        <TitleLayout
          id="HBAC test page"
          headingLevel="h1"
          text="HBAC test"
        />
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          {/* Test Form */}
          <FlexItem>
            <Card>
              <CardBody>
                <Title headingLevel="h2" size="lg" style={{ marginBottom: "1rem" }}>
                  Simulate Host-Based Access Control
                </Title>
                <Form isHorizontal>
                  <FormGroup label="User" isRequired fieldId="hbac-test-user">
                    <TextInput
                      id="hbac-test-user"
                      data-cy="hbac-test-user"
                      value={user}
                      onChange={(_event, value) => setUser(value)}
                      type="text"
                      aria-label="user"
                      placeholder="e.g. alice"
                      isRequired
                    />
                    <FormHelperText>
                      <HelperText>
                        <HelperTextItem>User to simulate access for</HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  </FormGroup>

                  <FormGroup label="Target host" isRequired fieldId="hbac-test-host">
                    <TextInput
                      id="hbac-test-host"
                      data-cy="hbac-test-host"
                      value={targetHost}
                      onChange={(_event, value) => setTargetHost(value)}
                      type="text"
                      aria-label="target host"
                      placeholder="e.g. idm1.test.example.com"
                      isRequired
                    />
                    <FormHelperText>
                      <HelperText>
                        <HelperTextItem>Host the user is trying to access</HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  </FormGroup>

                  <FormGroup label="Service" isRequired fieldId="hbac-test-service">
                    <TextInput
                      id="hbac-test-service"
                      data-cy="hbac-test-service"
                      value={service}
                      onChange={(_event, value) => setService(value)}
                      type="text"
                      aria-label="service"
                      placeholder="e.g. sshd, mcp-server"
                      isRequired
                    />
                    <FormHelperText>
                      <HelperText>
                        <HelperTextItem>PAM service name (HBAC service)</HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  </FormGroup>

                  <FormGroup fieldId="hbac-test-disabled">
                    <label>
                      <input
                        type="checkbox"
                        checked={includeDisabled}
                        onChange={(e) => setIncludeDisabled(e.target.checked)}
                        style={{ marginRight: "0.5rem" }}
                      />
                      Include disabled rules
                    </label>
                  </FormGroup>

                  <ActionGroup>
                    <Button
                      data-cy="hbac-test-run"
                      variant="primary"
                      onClick={onRunTest}
                      isDisabled={!isFormValid || isRunning}
                      isLoading={isRunning}
                    >
                      Run test
                    </Button>
                    <Button data-cy="hbac-test-clear" variant="link" onClick={onClear}>
                      Clear
                    </Button>
                  </ActionGroup>
                </Form>
              </CardBody>
            </Card>
          </FlexItem>

          {/* Error */}
          {testError && (
            <FlexItem>
              <Alert variant="danger" title="HBAC test failed" isInline>
                {testError}
              </Alert>
            </FlexItem>
          )}

          {/* Results */}
          {testResult && (
            <FlexItem>
              <Card>
                <CardBody>
                  <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
                    {/* Verdict */}
                    <FlexItem>
                      <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                        <FlexItem>
                          {testResult.value ? (
                            <Label
                              color="green"
                              icon={<CheckCircleIcon />}
                              style={{ fontSize: "1.1rem", padding: "0.5rem 1rem" }}
                            >
                              ACCESS GRANTED
                            </Label>
                          ) : (
                            <Label
                              color="red"
                              icon={<TimesCircleIcon />}
                              style={{ fontSize: "1.1rem", padding: "0.5rem 1rem" }}
                            >
                              ACCESS DENIED
                            </Label>
                          )}
                        </FlexItem>
                        <FlexItem>
                          <span style={{ color: "var(--pf-t--global--color--nonstatus--gray--default)" }}>
                            {user} &rarr; {service} @ {targetHost}
                          </span>
                        </FlexItem>
                      </Flex>
                    </FlexItem>

                    {/* Matched rules */}
                    {testResult.matched && testResult.matched.length > 0 && (
                      <FlexItem>
                        <Title headingLevel="h3" size="md">
                          Matched rules ({testResult.matched.length})
                        </Title>
                        <List isPlain>
                          {testResult.matched.map((rule) => (
                            <ListItem key={rule}>
                              <Label color="green" isCompact>
                                {rule}
                              </Label>
                            </ListItem>
                          ))}
                        </List>
                      </FlexItem>
                    )}

                    {/* Not matched rules */}
                    {testResult.notmatched && testResult.notmatched.length > 0 && (
                      <FlexItem>
                        <Title headingLevel="h3" size="md">
                          Not matched rules ({testResult.notmatched.length})
                        </Title>
                        <List isPlain>
                          {testResult.notmatched.map((rule) => (
                            <ListItem key={rule}>
                              <Label color="grey" isCompact>
                                {rule}
                              </Label>
                            </ListItem>
                          ))}
                        </List>
                      </FlexItem>
                    )}

                    {/* Errors in evaluation */}
                    {testResult.error && testResult.error.length > 0 && (
                      <FlexItem>
                        <Alert variant="warning" title="Evaluation errors" isInline>
                          <List isPlain>
                            {testResult.error.map((err, idx) => (
                              <ListItem key={idx}>{err}</ListItem>
                            ))}
                          </List>
                        </Alert>
                      </FlexItem>
                    )}
                  </Flex>
                </CardBody>
              </Card>
            </FlexItem>
          )}
        </Flex>
      </PageSection>
    </div>
  );
};

export default HBACTest;
