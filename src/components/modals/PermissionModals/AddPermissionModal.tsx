import React from "react";
// PatternFly
import {
  Button,
  Checkbox,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  TextArea,
  TextInput,
} from "@patternfly/react-core";
// Components
import ModalWithFormLayout, {
  Field,
} from "src/components/layouts/ModalWithFormLayout";
import InputRequiredText from "src/components/layouts/InputRequiredText";
// RPC
import { useAddPermissionMutation } from "src/services/rpcPermissions";
// Redux
import { useAppDispatch } from "src/store/hooks";
// Hooks
import { addAlert } from "src/store/Global/alerts-slice";
// Errors
import { SerializedError } from "@reduxjs/toolkit";

interface PropsToAddModal {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onRefresh: () => void;
}

const RIGHTS_OPTIONS = ["read", "write", "add", "delete", "all"];

const BIND_RULE_OPTIONS = [
  { value: "permission", label: "permission" },
  { value: "all", label: "all" },
  { value: "anonymous", label: "anonymous" },
];

const AddPermissionModal = (props: PropsToAddModal) => {
  const dispatch = useAppDispatch();

  // API calls
  const [addPermission] = useAddPermissionMutation();

  // States
  const [isAddButtonSpinning, setIsAddButtonSpinning] = React.useState(false);
  const [permissionName, setPermissionName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedRights, setSelectedRights] = React.useState<string[]>([]);
  const [bindRuleType, setBindRuleType] = React.useState("permission");
  const [isBindRuleOpen, setIsBindRuleOpen] = React.useState(false);
  const [type, setType] = React.useState("");
  const [attrs, setAttrs] = React.useState("");

  // Clear fields
  const clearFields = () => {
    setPermissionName("");
    setDescription("");
    setSelectedRights([]);
    setBindRuleType("permission");
    setType("");
    setAttrs("");
  };

  // Rights checkbox handler
  const onRightChange = (right: string, checked: boolean) => {
    if (checked) {
      setSelectedRights([...selectedRights, right]);
    } else {
      setSelectedRights(selectedRights.filter((r) => r !== right));
    }
  };

  // 'Add' button handler
  const onAddPermission = () => {
    setIsAddButtonSpinning(true);

    const attrsArray = attrs
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a !== "");

    addPermission({
      cn: permissionName,
      description: description || undefined,
      ipapermright:
        selectedRights.length > 0 ? selectedRights : undefined,
      ipapermbindruletype: bindRuleType || undefined,
      type: type || undefined,
      attrs: attrsArray.length > 0 ? attrsArray : undefined,
    }).then((response) => {
      if ("data" in response) {
        const data = response.data?.result;
        const error = response.data?.error as SerializedError;

        if (error) {
          dispatch(
            addAlert({
              name: "add-permission-error",
              title: error.message,
              variant: "danger",
            })
          );
        }

        if (data) {
          dispatch(
            addAlert({
              name: "add-permission-success",
              title: "New permission added",
              variant: "success",
            })
          );
          // Reset fields
          clearFields();
          // Update data
          props.onRefresh();
          props.onClose();
        }
      }
      // Reset button spinner
      setIsAddButtonSpinning(false);
    });
  };

  // Clean and close modal
  const cleanAndCloseModal = () => {
    clearFields();
    props.onClose();
  };

  const bindRuleToggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => setIsBindRuleOpen(!isBindRuleOpen)}
      isExpanded={isBindRuleOpen}
      data-cy="modal-select-bind-rule-type"
    >
      {bindRuleType}
    </MenuToggle>
  );

  const fields: Field[] = [
    {
      id: "modal-form-permission-name",
      name: "Permission name",
      pfComponent: (
        <InputRequiredText
          dataCy="modal-textbox-permission-name"
          id="modal-form-permission-name"
          name="cn"
          value={permissionName}
          onChange={setPermissionName}
          requiredHelperText="Required value"
        />
      ),
      fieldRequired: true,
    },
    {
      id: "modal-form-permission-description",
      name: "Description",
      pfComponent: (
        <TextArea
          data-cy="modal-textbox-description"
          id="modal-form-permission-description"
          name="description"
          value={description}
          aria-label="Permission description"
          onChange={(_event, value: string) => setDescription(value)}
          autoResize
        />
      ),
    },
    {
      id: "modal-form-permission-rights",
      name: "Rights",
      pfComponent: (
        <div>
          {RIGHTS_OPTIONS.map((right) => (
            <Checkbox
              key={right}
              id={`modal-checkbox-right-${right}`}
              data-cy={`modal-checkbox-right-${right}`}
              label={right}
              isChecked={selectedRights.includes(right)}
              onChange={(_event, checked) => onRightChange(right, checked)}
              className="pf-v6-u-mb-xs"
            />
          ))}
        </div>
      ),
    },
    {
      id: "modal-form-permission-bind-rule-type",
      name: "Bind rule type",
      pfComponent: (
        <Select
          data-cy="modal-select-bind-rule-type"
          id="modal-select-bind-rule-type"
          isOpen={isBindRuleOpen}
          selected={bindRuleType}
          onSelect={(_event, value) => {
            setBindRuleType(value as string);
            setIsBindRuleOpen(false);
          }}
          onOpenChange={setIsBindRuleOpen}
          toggle={bindRuleToggle}
        >
          <SelectList>
            {BIND_RULE_OPTIONS.map((option) => (
              <SelectOption
                key={option.value}
                value={option.value}
                data-cy={`modal-select-option-${option.value}`}
              >
                {option.label}
              </SelectOption>
            ))}
          </SelectList>
        </Select>
      ),
    },
    {
      id: "modal-form-permission-type",
      name: "Type",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-type"
          id="modal-form-permission-type"
          name="type"
          value={type}
          aria-label="Permission type"
          onChange={(_event, value: string) => setType(value)}
        />
      ),
    },
    {
      id: "modal-form-permission-attrs",
      name: "Attributes",
      pfComponent: (
        <TextInput
          data-cy="modal-textbox-attrs"
          id="modal-form-permission-attrs"
          name="attrs"
          value={attrs}
          aria-label="Permission attributes (comma-separated)"
          placeholder="e.g. cn, sn, uid"
          onChange={(_event, value: string) => setAttrs(value)}
        />
      ),
    },
  ];

  // Actions
  const modalActions: JSX.Element[] = [
    <Button
      data-cy="modal-button-add"
      key="add-new"
      isDisabled={isAddButtonSpinning || permissionName === ""}
      isLoading={isAddButtonSpinning}
      spinnerAriaValueText="Adding"
      spinnerAriaLabel="Adding"
      form="add-modal-form"
      type="submit"
    >
      {isAddButtonSpinning ? "Adding" : "Add"}
    </Button>,
    <Button
      data-cy="modal-button-cancel"
      key="cancel-new"
      variant="link"
      onClick={cleanAndCloseModal}
    >
      Cancel
    </Button>,
  ];

  return (
    <>
      <ModalWithFormLayout
        dataCy="add-permission-modal"
        variantType={"small"}
        modalPosition={"top"}
        offPosition={"76px"}
        title={props.title}
        formId="add-modal-form"
        fields={fields}
        show={props.isOpen}
        onSubmit={() => onAddPermission()}
        onClose={cleanAndCloseModal}
        actions={modalActions}
      />
    </>
  );
};

export default AddPermissionModal;
