import React, { useMemo } from "react";
// PatternFly
import { Badge, Tab, Tabs, TabTitleText } from "@patternfly/react-core";
// Data types
import { Vault } from "src/utils/datatypes/globalDataTypes";
// Layouts
import TabLayout from "src/components/layouts/TabLayout";
// Navigation
import { useNavigate } from "react-router";
// Hooks
import useUpdateRoute from "src/hooks/useUpdateRoute";
// RPC
import { useGetVaultByIdQuery } from "src/services/rpcVaults";
// 'Members' sections
import MembersUsers from "src/components/Members/MembersUsers";
import MembersUserGroups from "src/components/Members/MembersUserGroups";
import MembersServices from "src/components/Members/MembersServices";

interface PropsToVaultsMembers {
  vault: Vault;
  tabSection: string;
}

const VaultsMembers = (props: PropsToVaultsMembers) => {
  const navigate = useNavigate();

  const vaultQuery = useGetVaultByIdQuery(props.vault.cn);
  const vaultData = vaultQuery.data || {};

  const vault = useMemo<Partial<Vault>>(() => {
    if (!vaultQuery.isFetching && vaultData) {
      return { ...vaultData };
    }
    return {};
  }, [vaultData, vaultQuery.isFetching]);

  const onRefreshVaultData = () => {
    vaultQuery.refetch();
  };

  useUpdateRoute({ pathname: "vaults", noBreadcrumb: true });

  const memberUserCount = vault.member_user ? vault.member_user.length : 0;
  const memberGroupCount = vault.member_group ? vault.member_group.length : 0;
  const memberServiceCount = vault.member_service
    ? vault.member_service.length
    : 0;
  const ownerUserCount = vault.owner_user ? vault.owner_user.length : 0;
  const ownerGroupCount = vault.owner_group ? vault.owner_group.length : 0;
  const ownerServiceCount = vault.owner_service
    ? vault.owner_service.length
    : 0;

  const handleTabClick = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    tabIndex: number | string
  ) => {
    navigate("/vaults/" + props.vault.cn + "/" + tabIndex);
  };

  return (
    <div style={{ height: `var(--memberof-calc)` }}>
      <TabLayout id="members">
        <Tabs
          activeKey={props.tabSection}
          onSelect={handleTabClick}
          isBox={false}
          mountOnEnter
          unmountOnExit
        >
          <Tab
            eventKey={"member_user"}
            name="member_user"
            title={
              <TabTitleText>
                Member users{" "}
                <Badge key={0} id="member_user_count" isRead>
                  {memberUserCount}
                </Badge>
              </TabTitleText>
            }
          >
            <MembersUsers
              entity={vault}
              id={vault.cn as string}
              from="vaults"
              isDataLoading={vaultQuery.isFetching}
              onRefreshData={onRefreshVaultData}
              member_user={vault.member_user || []}
              membershipDisabled={true}
              setDirection={() => {}}
              direction="direct"
            />
          </Tab>
          <Tab
            eventKey={"member_group"}
            name="member_group"
            title={
              <TabTitleText>
                Member groups{" "}
                <Badge key={1} id="member_group_count" isRead>
                  {memberGroupCount}
                </Badge>
              </TabTitleText>
            }
          >
            <MembersUserGroups
              entity={vault}
              id={vault.cn as string}
              from="vaults"
              isDataLoading={vaultQuery.isFetching}
              onRefreshData={onRefreshVaultData}
              member_group={vault.member_group || []}
              membershipDisabled={true}
              setDirection={() => {}}
              direction="direct"
            />
          </Tab>
          <Tab
            eventKey={"member_service"}
            name="member_service"
            title={
              <TabTitleText>
                Member services{" "}
                <Badge key={2} id="member_service_count" isRead>
                  {memberServiceCount}
                </Badge>
              </TabTitleText>
            }
          >
            <MembersServices
              entity={vault}
              id={vault.cn as string}
              from="vaults"
              isDataLoading={vaultQuery.isFetching}
              onRefreshData={onRefreshVaultData}
              member_service={vault.member_service || []}
              membershipDisabled={true}
              setDirection={() => {}}
              direction="direct"
            />
          </Tab>
          <Tab
            eventKey={"owner_user"}
            name="owner_user"
            title={
              <TabTitleText>
                Owner users{" "}
                <Badge key={3} id="owner_user_count" isRead>
                  {ownerUserCount}
                </Badge>
              </TabTitleText>
            }
          >
            <MembersUsers
              entity={vault}
              id={vault.cn as string}
              from="vaults"
              isDataLoading={vaultQuery.isFetching}
              onRefreshData={onRefreshVaultData}
              member_user={vault.owner_user || []}
              membershipDisabled={true}
              setDirection={() => {}}
              direction="direct"
            />
          </Tab>
          <Tab
            eventKey={"owner_group"}
            name="owner_group"
            title={
              <TabTitleText>
                Owner groups{" "}
                <Badge key={4} id="owner_group_count" isRead>
                  {ownerGroupCount}
                </Badge>
              </TabTitleText>
            }
          >
            <MembersUserGroups
              entity={vault}
              id={vault.cn as string}
              from="vaults"
              isDataLoading={vaultQuery.isFetching}
              onRefreshData={onRefreshVaultData}
              member_group={vault.owner_group || []}
              membershipDisabled={true}
              setDirection={() => {}}
              direction="direct"
            />
          </Tab>
          <Tab
            eventKey={"owner_service"}
            name="owner_service"
            title={
              <TabTitleText>
                Owner services{" "}
                <Badge key={5} id="owner_service_count" isRead>
                  {ownerServiceCount}
                </Badge>
              </TabTitleText>
            }
          >
            <MembersServices
              entity={vault}
              id={vault.cn as string}
              from="vaults"
              isDataLoading={vaultQuery.isFetching}
              onRefreshData={onRefreshVaultData}
              member_service={vault.owner_service || []}
              membershipDisabled={true}
              setDirection={() => {}}
              direction="direct"
            />
          </Tab>
        </Tabs>
      </TabLayout>
    </div>
  );
};

export default VaultsMembers;
