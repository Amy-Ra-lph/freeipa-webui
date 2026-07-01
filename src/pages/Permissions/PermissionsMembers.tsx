import React, { useMemo } from "react";
// PatternFly
import { Badge, Tab, Tabs, TabTitleText } from "@patternfly/react-core";
// Data types
import { Permission } from "src/utils/datatypes/globalDataTypes";
// Layouts
import TabLayout from "src/components/layouts/TabLayout";
// Navigation
import { useNavigate } from "react-router";
// Hooks
import useUpdateRoute from "src/hooks/useUpdateRoute";
// RPC
import { useGetPermissionByIdQuery } from "src/services/rpcPermissions";
// Tables
import MemberTable from "src/components/tables/MembershipTable";
import useListPageSearchParams from "src/hooks/useListPageSearchParams";
import { paginate } from "src/utils/utils";

interface PropsToPermissionsMembers {
  permission: Permission;
  tabSection: string;
}

const PermissionsMembers = (props: PropsToPermissionsMembers) => {
  const navigate = useNavigate();

  const permissionQuery = useGetPermissionByIdQuery(props.permission.cn);
  const permissionData = permissionQuery.data || {};

  const permission = useMemo<Partial<Permission>>(() => {
    if (!permissionQuery.isFetching && permissionData) {
      return { ...permissionData };
    }
    return {};
  }, [permissionData, permissionQuery.isFetching]);

  useUpdateRoute({ pathname: "permissions", noBreadcrumb: true });

  const privilegeCount = permission.member_privilege
    ? permission.member_privilege.length
    : 0;

  const handleTabClick = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    tabIndex: number | string
  ) => {
    navigate("/permissions/" + props.permission.cn + "/" + tabIndex);
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
            eventKey={"member_privilege"}
            name="member_privilege"
            title={
              <TabTitleText>
                Privileges{" "}
                <Badge key={0} id="privilege_count" isRead>
                  {privilegeCount}
                </Badge>
              </TabTitleText>
            }
          >
            <PermissionMembersList
              members={permission.member_privilege || []}
              isLoading={permissionQuery.isFetching}
              columnHeader="Privilege"
            />
          </Tab>
        </Tabs>
      </TabLayout>
    </div>
  );
};

interface PermissionMembersListProps {
  members: string[];
  isLoading: boolean;
  columnHeader: string;
}

const PermissionMembersList = (props: PermissionMembersListProps) => {
  const { page, setPage, perPage, setPerPage, searchValue, setSearchValue } =
    useListPageSearchParams();

  const members = props.members || [];

  const getItemsToShow = (): string[] => {
    let toShow = [...members];
    toShow.sort();

    if (searchValue) {
      toShow = toShow.filter((name) =>
        name.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    toShow = paginate(toShow, page, perPage);

    return toShow;
  };

  const itemsToShow = useMemo(getItemsToShow, [
    members,
    page,
    perPage,
    searchValue,
  ]);

  return (
    <MemberTable
      entityList={itemsToShow}
      idKey="cn"
      from="privileges"
      columnNamesToShow={[props.columnHeader]}
      propertiesToShow={["cn"]}
      checkedItems={[]}
      onCheckItemsChange={() => {
        // Read-only display
      }}
      showTableRows={!props.isLoading}
    />
  );
};

export default PermissionsMembers;
