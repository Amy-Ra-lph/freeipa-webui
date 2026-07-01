import React from "react";
// PatternFly
import {
  Button,
  Checkbox,
  Flex,
  FlexItem,
  TextInput,
} from "@patternfly/react-core";
// Components
import ModalWithFormLayout, {
  Field,
} from "src/components/layouts/ModalWithFormLayout";
import InputRequiredText from "src/components/layouts/InputRequiredText";
// RPC
import { useAddDelegationMutation } from "src/services/rpcDelegation";
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

const AddDelegationModal = (props: PropsToAddModal) => {
  const dispatch = useAppDispatch();

  // API calls
  const [addDelegation] = useAddDelegationMutation();

  // States
  const [isAddButtonSpinning, setIsAddButtonSpinning] = React.useState(false);
  const [delegationName, setDelegationName] = React.useState("");
  const [group, setGroup] = React.useState("");
  const [memberof, setMemberof] = React.useState("");
  const [permRead, setPermRead] = React.useState(false);
  const [permWrite, setPermWrite] = React.useState(false);
  const [attrs, setAttrs] = React.useState<string[]>([]);
  const [newAttr, setNewAttr] = React.useState("");

  // Clear fields
  const clearFields = () => {
    setDelegationName("");
    setGroup("");
    setMemberof("");
    setPermRead(false);
    setPermWrite(false);
    setAttrs([]);
    setNewAttr("");
  };

  // Add attribute to list
  const addAttr = () => {
    if (newAttr.trim() !== "" && !attrs.includes(newAttr.trim())) {
      setAttrs([...attrs, newAttr.trim()]);
      setNewAttr("");
    }
  };

  // Remove attribute from list
  const removeAttr = (attr: string) => {
    setAttrs(attrs.filter((a) => a !== attr));
  };

  // 'Add' button handler
  const onAddDelegation = () => {
    setIsAddButtonSpinning(true);

    const permissions: string[] = [];
    if (permRead) permissions.push("read");
    if (permWrite) permissions.push("write");

    addDelegation({
      aciname: delegationName,
      group: group,
      memberof: memberof,
      permissions: permissions.length > 0 ? permissions : undefined,
      attrs: attrs.length > 0 ? attrs : undefined,
    }).then((response) => {
      if ("data" in response) {
        const data = response.data?.result;
        const error = response.data?.error as SerializedError;

        if (error) {
          dispatch(
            addAlert({
              name: "add-delegation-error",
              title: error.message,
              variant: "danger",
            })
          );
        }

        if (data) {
          dispatch(
            addAlert({
              name: "add-delegation-success",
              title: "New delegation added",
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

  const fields: Field[] = [
    {
      id: "modal-form-delegation-name",
      name: "Delegation name",
      pfComponent: (
        <InputRequiredText
          dataCy="modal-textbox-delegation-name"
          id="modal-form-delegation-name"
          name="aciname"
          value={delegationName}
          onChange={setDelegationName}
          requiredHelperText="Required value"
        />
      ),
      fieldRequired: true,
    },
    {
      id: "modal-form-delegation-group",
      name: "Delegated group",
      pfComponent: (
        <InputRequiredText
          dataCy="modal-textbox-delegation-group"
          id="modal-form-delegation-group"
          name="group"
          value={group}
          onChange={setGroup}
          requiredHelperText="Required value"
        />
      ),
      fieldRequired: true,
    },
    {
      id: "modal-form-delegation-memberof",
      name: "Member group",
      pfComponent: (
        <InputRequiredText
          dataCy="modal-textbox-delegation-memberof"
          id="modal-form-delegation-memberof"
          name="memberof"
          value={memberof}
          onChange={setMemberof}
          requiredHelperText="Required value"
        />
      ),
      fieldRequired: true,
    },
    {
      id: "modal-form-delegation-permissions",
      name: "Permissions",
      pfComponent: (
        <Flex>
          <FlexItem>
            <Checkbox
              data-cy="modal-checkbox-read"
              label="Read"
              id="perm-read"
              isChecked={permRead}
              onChange={(_event, checked) => setPermRead(checked)}
            />
          </FlexItem>
          <FlexItem>
            <Checkbox
              data-cy="modal-checkbox-write"
              label="Write"
              id="perm-write"
              isChecked={permWrite}
              onChange={(_event, checked) => setPermWrite(checked)}
            />
          </FlexItem>
        </Flex>
      ),
    },
    {
      id: "modal-form-delegation-attrs",
      name: "Attributes",
      pfComponent: (
        <Flex direction={{ default: "column" }}>
          <FlexItem>
            <Flex>
              <FlexItem flex={{ default: "flex_1" }}>
                <TextInput
                  data-cy="modal-textbox-attr"
                  id="modal-form-delegation-attr-input"
                  name="attr"
                  value={newAttr}
                  onChange={(_event, value) => setNewAttr(value)}
                  aria-label="Attribute"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addAttr();
                    }
                  }}
                />
              </FlexItem>
              <FlexItem>
                <Button
                  variant="secondary"
                  data-cy="modal-button-add-attr"
                  onClick={addAttr}
                  isDisabled={newAttr.trim() === ""}
                >
                  Add
                </Button>
              </FlexItem>
            </Flex>
          </FlexItem>
          {attrs.map((attr) => (
            <FlexItem key={attr}>
              <Flex>
                <FlexItem flex={{ default: "flex_1" }}>{attr}</FlexItem>
                <FlexItem>
                  <Button
                    variant="link"
                    data-cy={"modal-button-remove-attr-" + attr}
                    onClick={() => removeAttr(attr)}
                  >
                    Remove
                  </Button>
                </FlexItem>
              </Flex>
            </FlexItem>
          ))}
        </Flex>
      ),
    },
  ];

  // Actions
  const modalActions: JSX.Element[] = [
    <Button
      data-cy="modal-button-add"
      key="add-new"
      isDisabled={
        isAddButtonSpinning ||
        delegationName === "" ||
        group === "" ||
        memberof === ""
      }
      form="add-modal-form"
      type="submit"
    >
      Add
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
        dataCy="add-delegation-modal"
        variantType={"medium"}
        modalPosition={"top"}
        offPosition={"76px"}
        title={props.title}
        formId="add-modal-form"
        fields={fields}
        show={props.isOpen}
        onSubmit={() => onAddDelegation()}
        onClose={cleanAndCloseModal}
        actions={modalActions}
      />
    </>
  );
};

export default AddDelegationModal;
