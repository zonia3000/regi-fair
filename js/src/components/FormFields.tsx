import React, { } from 'react';
import { Field } from './classes/fields';
import { FormFieldsProps } from './classes/components-props';
import InputField from './fields/InputField';
import { __, _x } from '@wordpress/i18n';
import './style.css';
import RadioField from './fields/RadioField';

const FormFields = (props: FormFieldsProps) => {

  function setFieldValue(newValue: string, index: number) {
    props.setFieldsValues(props.fieldsValues.map((oldValue: string, i: number) => (index === i) ? newValue : oldValue));
  }

  return (
    props.formFields.map((field: Field, index: number) => {
      return (<div key={`field-${index}`} className={index.toString() in props.fieldsErrors ? 'form-error mt' : 'mt'}>
        {
          (field.fieldType === 'text' || field.fieldType === 'email' || field.fieldType === 'number')
          && <InputField
            required={field.required}
            label={field.label} disabled={props.disabled} type={field.fieldType}
            min={field.extra && 'min' in field.extra ? Number(field.extra.min) : undefined}
            max={field.extra && 'max' in field.extra ? Number(field.extra.max) : undefined}
            value={props.fieldsValues[index]} setValue={(v: string) => setFieldValue(v, index)} />
        }
        {
          field.fieldType === 'radio'
          && <RadioField
            required={field.required}
            label={field.label} disabled={props.disabled} options={(field.extra as any).options}
            value={props.fieldsValues[index]} setValue={(v: string) => setFieldValue(v, index)} />
        }
        {index.toString() in props.fieldsErrors &&
          <span className='error-text'>{(props.fieldsErrors as any)[index.toString()]}</span>}
      </div>);
    })
  );
}

export default FormFields;
