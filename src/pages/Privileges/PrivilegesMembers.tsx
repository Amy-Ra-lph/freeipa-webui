import React, { useMemo } from "react";
// PatternFly
import {
  Badge,
  Pagination,
  PaginationVariant,
  Tab,
  Tabs,
  TabTitleText,
} from "@patternfly/react-core";
// Data types
import { Privilege } from "src/utils/datatypes/globalDataTypes";
// Layouts
import TabLayout from "src/components/layouts/TabLayout";
// Navigation
import { useNavigate } from "react-router";
// Hooks
import useUpdateRoute from "src/hooks/useUpdateRoute";
import useListPageSearchParams from "src/hooks/useListPageSearchParams";
// RPC
import { useGetPrivilegeByIdQuery } from "src/services/rpcPrivileges";
// Components
import MemberOfToolbar from "src/components/MemberOf/MemberOfToolbar";
import MemberTable from "src/components/tables/MembershipTable";
// Utils
import { paginate } from "src/utils/utils";

interface PropsToPrivilegesMembers {
  privilege: Privilege;
  tabSection: string;
}

const PrivilegesMembers = (props: PropsToPrivilegesMembers) => {
  const navigate = useNavigate();

  const privilegeQuery = useGetPrivilegeByIdQuery(props.privilege.cn);
  const privilegeData = privilegeQuery.data || {};

  const privilege = useMemo<Partial<Privilege>>(() => {
    if (!privilegeQuery.isFetching && privilegeData) {
      return { ...privilegeData };
    }
    return {};
  }, [privilegeData, privilegeQuery.isFetching]);

  const onRefreshPrivilegeData = () => {
    privilegeQuery.refetch();
  };

  useUpdateRoute({ pathname: "privileges", noBreadcrumb: true });

  const roleCount = privilege.member_role
    ? privilege.member_role.length
    : 0;
  const permissionCount = privilege.memberof_permission
    ? privilege.memberof_permission.length
    : 0;

  const handleTabClick = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    tabIndex: number | string
  ) => {
    navigate("/privileges/" + props.privilege.cn + "/" + tabIndex);
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
            eventKey={"member_role"}
            name="member_role"
            title={
              <TabTitleText>
                Roles{" "}
                <Badge key={0} id="role_count" isRead>
                  {roleCount}
                </Badge>
              </TabTitleText>
            }
          >
            <PrivilegeMembersTable
              members={privilege.member_role || []}
              isDataLoading={privilegeQuery.isFetching}
              onRefreshData={onRefreshPrivilegeData}
              columnHeader="Role"
              searchPlaceholder="Search roles"
            />
          </Tab>
          <Tab
            eventKey={"memberof_permission"}
            name="memberof_permission"
            title={
              <TabTitleText>
                Permissions{" "}
                <Badge key={1} id="permission_count" isRead>
                  {permissionCount}
                </Badge>
              </TabTitleText>
            }
          >
            <PrivilegeMembersTable
              members={privilege.memberof_permission || []}
              isDataLoading={privilegeQuery.isFetching}
              onRefreshData={onRefreshPrivilegeData}
              columnHeader="Permission"
              searchPlaceholder="Search permissions"
            />
          </Tab>
        </Tabs>
      </TabLayout>
    </div>
  );
};

interface PrivilegeMembersTableProps {
  members: string[];
  isDataLoading: boolean;
  onRefreshData: () => void;
  columnHeader: string;
  searchPlaceholder: string;
}

const PrivilegeMembersTable = (props: PrivilegeMembersTableProps) => {
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

  const itemsToShow = getItemsToShow();

  const columnNames = [props.columnHeader];
  const showTableRows = itemsToShow.length > 0;

  const isRefreshButtonEnabled = !props.isDataLoading;

  return (
    <>
      <MemberOfToolbar
        searchText={searchValue}
        onSearchTextChange={setSearchValue}
        onSearch={() => {}}
        searchPlaceholder={props.searchPlaceholder}
        searchAriaLabel={props.searchPlaceholder}
        refreshButtonEnabled={isRefreshButtonEnabled}
        onRefreshButtonClick={props.onRefreshData}
        deleteButtonEnabled={false}
        onDeleteButtonClick={() => {}}
        addButtonEnabled={false}
        onAddButtonClick={() => {}}
        helpIconEnabled={true}
        totalItems={members.length}
        perPage={perPage}
        page={page}
        onPerPageChange={setPerPage}
        onPageChange={setPage}
      />
      <MemberTable
        entityList={itemsToShow}
        idKey="id"
        from="privileges"
        columnNamesToShow={columnNames}
        propertiesToShow={itemsToShow}
        showTableRows={showTableRows}
      />
      <Pagination
        className="pf-v6-u-pb-0 pf-v6-u-pr-md"
        itemCount={members.length}
        widgetId="pagination-options-menu-bottom"
        perPage={perPage}
        page={page}
        variant={PaginationVariant.bottom}
        onSetPage={(_e, page) => setPage(page)}
        onPerPageSelect={(_e, perPage) => setPerPage(perPage)}
      />
    </>
  );
};

export default PrivilegesMembers;
