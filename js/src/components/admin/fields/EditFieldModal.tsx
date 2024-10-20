import React, { useEffect, useState } from "react";
import { Button, Modal } from "@wordpress/components";
import { __ } from "@wordpress/i18n";
import EditInputField from "./EditInputField";
import EditRadioField from "./EditRadioField";
import { EditFieldModalProps } from "../../classes/components-props";
import {
  CheckboxField,
  DropdownField,
  FieldType,
  PrivacyField,
  RadioField,
} from "../../classes/fields";
import EditPrivacyPolicyField from "./EditPrivacyPolicyField";
import EditCheckboxField from "./EditCheckboxField";
import EditDropdownField from "./EditDropdownField";

const EditFieldModal = (props: EditFieldModalProps) => {
  const [createNew, setCreateNew] = useState(true);
  const [fieldType, setFieldType] = useState(null as FieldType);
  const [field, setField] = useState(props.fieldToEdit);
  const [useAsNumberOfPeople, setUseAsNumberOfPeople] = useState(false);

  useEffect(() => {
    if (props.fieldToEdit !== null) {
      setCreateNew(false);
      setFieldType(props.fieldToEdit.fieldType);
      setField(props.fieldToEdit);
      setUseAsNumberOfPeople(
        props.fieldToEdit.extra &&
          "useAsNumberOfPeople" in props.fieldToEdit.extra &&
          props.fieldToEdit.extra.useAsNumberOfPeople === true,
      );
    } else {
      setCreateNew(true);
      setUseAsNumberOfPeople(false);
    }
  }, [props.fieldToEdit]);

  function close() {
    props.setShowEditFieldModal(false);
    props.setFieldToEdit(null);
    setFieldType(null);
    setField(null);
    setUseAsNumberOfPeople(false);
  }

  function save() {
    if (!field.validate()) {
      return;
    }
    props.saveField(field);
    close();
  }

  function unsetField() {
    setFieldType(null);
    setField(null);
    setUseAsNumberOfPeople(false);
  }

  return (
    <>
      {props.showEditFieldModal && (
        <Modal
          title={
            createNew
              ? __("Add field", "wp-open-events")
              : __("Edit field", "wp-open-events")
          }
          onRequestClose={close}
        >
          {fieldType === null && (
            <>
              <p>{__("Select field type", "wp-open-events")}</p>
              <h4>{__("Standard", "wp-open-events")}</h4>
              <div>
                <Button
                  variant="primary"
                  onClick={() => setFieldType("text")}
                  className="mr"
                >
                  {__("Text", "wp-open-events")}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setFieldType("email")}
                  className="mr"
                >
                  {__("E-mail", "wp-open-events")}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setFieldType("number")}
                  className="mr"
                >
                  {__("Number", "wp-open-events")}
                </Button>
              </div>
              <div className="mt">
                <Button
                  variant="primary"
                  onClick={() => setFieldType("dropdown")}
                  className="mr"
                >
                  {__("Dropdown", "wp-open-events")}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setFieldType("radio")}
                  className="mr"
                >
                  {__("Radio", "wp-open-events")}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setFieldType("checkbox")}
                  className="mr"
                >
                  {__("Checkbox", "wp-open-events")}
                </Button>
              </div>
              {(props.showNumberOfPeopleFieldButton ||
                props.showPrivacyFieldButton) && (
                <>
                  <h4>{__("Special", "wp-open-events")}</h4>
                  <div>
                    {props.showNumberOfPeopleFieldButton && (
                      <Button
                        variant="primary"
                        className="mr"
                        onClick={() => {
                          setUseAsNumberOfPeople(true);
                          setFieldType("number");
                        }}
                      >
                        {__("Number of people", "wp-open-events")}
                      </Button>
                    )}
                    {props.showPrivacyFieldButton && (
                      <Button
                        variant="primary"
                        onClick={() => setFieldType("privacy")}
                      >
                        {__("Privacy policy", "wp-open-events")}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </>
          )}
          {fieldType === "text" && (
            <EditInputField
              field={field}
              setField={setField}
              fieldType="text"
            />
          )}
          {fieldType === "email" && (
            <EditInputField
              field={field}
              setField={setField}
              fieldType="email"
            />
          )}
          {fieldType === "number" && (
            <EditInputField
              field={field}
              setField={setField}
              fieldType="number"
              useAsNumberOfPeople={useAsNumberOfPeople}
            />
          )}
          {fieldType === "radio" && (
            <EditRadioField field={field as RadioField} setField={setField} />
          )}
          {fieldType === "dropdown" && (
            <EditDropdownField
              field={field as DropdownField}
              setField={setField}
            />
          )}
          {fieldType === "checkbox" && (
            <EditCheckboxField
              field={field as CheckboxField}
              setField={setField}
            />
          )}
          {fieldType === "privacy" && (
            <EditPrivacyPolicyField
              field={field as PrivacyField}
              setField={setField}
            />
          )}
          {fieldType !== null && (
            <>
              <br />
              <hr />
              <Button variant="primary" onClick={save}>
                {__("Save", "wp-open-events")}
              </Button>
              &nbsp;
              {createNew && (
                <Button variant="secondary" onClick={unsetField}>
                  {__("Cancel", "wp-open-events")}
                </Button>
              )}
            </>
          )}
        </Modal>
      )}
    </>
  );
};

export default EditFieldModal;
