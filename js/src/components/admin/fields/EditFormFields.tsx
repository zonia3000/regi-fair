import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import AddFieldModal from './AddFieldModal';
import { EditFormFieldsProps } from '../../classes/components-props';

const EditFormFields = (props: EditFormFieldsProps) => {

  const [currentFieldIndex, setCurrentFieldIndex] = useState(props.formFields.length);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);

  function openAddFieldModal() {
    setShowAddFieldModal(true);
  }

  function saveCurrentField(field: Field) {
    const newFields = props.formFields.map((f, i) => i === currentFieldIndex ? field : f);
    if (props.formFields.length <= currentFieldIndex) {
      newFields.push(field);
    }
    props.setFormFields(newFields);
    setCurrentFieldIndex(currentFieldIndex + 1);
  }

  return (
    <>
      <h2>{__('Event form', 'wp-open-events')}</h2>
      {props.formFields.length === 0 && <p>{__('Your form is empty. Add some fields.', 'wp-open-events')}</p>}

      {props.formFields.length !== 0 && <>
        <table className='widefat'>
          <thead>
            <tr>
              <th>{__('Label', 'wp-open-events')}</th>
              <th>{__('Type', 'wp-open-events')}</th>
              <th>{__('Required', 'wp-open-events')}</th>
            </tr>
          </thead>
          <tbody>
            {props.formFields.map((f, index) => {
              return (<tr key={index}>
                <td>{f.label}</td>
                <td>{f.fieldType}</td>
                <td>{f.required ? __('Yes', 'wp-open-events') : __('No', 'wp-open-events')}</td>
              </tr>)
            })}
          </tbody>
        </table>
        <br />
      </>}

      <Button onClick={openAddFieldModal} variant='primary'>
        {__('Add form field', 'wp-open-events')}
      </Button>

      <AddFieldModal
        showAddFieldModal={showAddFieldModal}
        setShowAddFieldModal={setShowAddFieldModal}
        saveCurrentField={saveCurrentField} />
    </>
  )
}

export default EditFormFields;
