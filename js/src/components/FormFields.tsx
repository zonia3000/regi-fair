import React, { } from 'react';
import { Field, RadioField as RadioFieldType } from './classes/fields';
import { FormFieldsProps } from './classes/components-props';
import InputField from './fields/InputField';
import './style.css';
import RadioField from './fields/RadioField';

const FormFields = (props: FormFieldsProps) => {

  function setFieldValue(key: number, newValue: string) {
    props.setFieldsValues(Object.fromEntries(
      Object.entries(props.fieldsValues).map(e => e[0] === key.toString() ? [e[0], newValue] : e))
    );
  }

  return (
    props.formFields.map((field: Field) => {
      return (<div key={`field-${field.id}`} className={field.id in props.fieldsErrors ? 'form-error mt' : 'mt'}>
        {
          (field.fieldType === 'text' || field.fieldType === 'email' || field.fieldType === 'number')
          && <InputField
            required={field.required}
            label={field.label} disabled={props.disabled} type={field.fieldType}
            min={field.extra && 'min' in field.extra ? Number(field.extra.min) : undefined}
            max={field.extra && 'max' in field.extra ? Number(field.extra.max) : undefined}
            value={props.fieldsValues[field.id]} setValue={(v: string) => setFieldValue(field.id, v)} />
        }
        {
          field.fieldType === 'radio'
          && <RadioField
            required={field.required}
            label={field.label} disabled={props.disabled} options={(field as RadioFieldType).extra.options}
            value={props.fieldsValues[field.id]} setValue={(v: string) => setFieldValue(field.id, v)} />
        }
        {field.id.toString() in props.fieldsErrors &&
          <span className='error-text'>{props.fieldsErrors[field.id]}</span>
        }
      </div>);
    })
  );
}

export default FormFields;
