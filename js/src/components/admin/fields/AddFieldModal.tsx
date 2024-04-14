import React, { useState } from 'react';
import { Button, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import EditTextField from './EditTextField';
import EditRadioField from './EditRadioField';
import { AddFieldModalProps } from '../../classes/components-props';

const AddFieldModal = (props: AddFieldModalProps) => {

    const [fieldType, setFieldType] = useState(null as FieldType);
    const [field, setField] = useState(null as Field);

    function close() {
        props.setShowAddFieldModal(false);
        setFieldType(null);
        setField(null);
    }

    function save() {
        props.saveCurrentField(field);
        close();
    }

    return (
        <>
            {props.showAddFieldModal && (
                <Modal title={__('Add field', 'wp-open-events')} onRequestClose={close}>
                    {fieldType === null && (
                        <>
                            <p>{__('Select field type', 'wp-open-events')}</p>
                            <Button variant='primary' onClick={() => setFieldType('text')}>
                                {__('Text', 'wp-open-events')}
                            </Button>
                            &nbsp;
                            <Button variant='primary' onClick={() => setFieldType('email')}>
                                {__('E-mail', 'wp-open-events')}
                            </Button>
                            &nbsp;
                            <Button variant='primary' onClick={() => setFieldType('radio')}>
                                {__('Radio', 'wp-open-events')}
                            </Button>
                        </>
                    )}
                    {fieldType === 'text' && (
                        <EditTextField field={field} setField={setField} fieldType='text' />
                    )}
                    {fieldType === 'email' && (
                        <EditTextField field={field} setField={setField} fieldType='email' />
                    )}
                    {fieldType === 'radio' && (
                        <EditRadioField field={field as RadioField} setField={setField} />
                    )}
                    {fieldType !== null && (
                        <>
                            <br /><hr />
                            <Button variant='primary' onClick={save}>
                                {__('Save', 'wp-open-events')}
                            </Button>
                            &nbsp;
                            <Button variant='secondary' onClick={() => setFieldType(null)}>
                                {__('Cancel', 'wp-open-events')}
                            </Button>
                        </>
                    )}
                </Modal>
            )}
        </>
    );
};

export default AddFieldModal;