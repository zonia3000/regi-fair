import React, { useState } from 'react';
import { Button, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import EditTextField from './fields/EditTextField';
import EditRadioField from './fields/EditRadioField';

const AddFieldModal = (props: any) => {

    const [fieldType, setFieldType] = useState(null);
    const [field, setField] = useState(null);

    const close = () => {
        props.setShowAddFieldModal(false);
        setFieldType(null);
        setField(null);
    }

    const save = () => {
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
                        <EditRadioField field={field} setField={setField} />
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