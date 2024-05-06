import React, { useEffect, useState } from 'react';
import { Button, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import EditTextField from './EditTextField';
import EditRadioField from './EditRadioField';
import { EditFieldModalProps } from '../../classes/components-props';

const EditFieldModal = (props: EditFieldModalProps) => {

    const [createNew, setCreateNew] = useState(true);
    const [fieldType, setFieldType] = useState(null as FieldType);
    const [field, setField] = useState(props.fieldToEdit);

    useEffect(() => {
        if (props.fieldToEdit !== null) {
            setCreateNew(false);
            setFieldType(props.fieldToEdit.fieldType);
            setField(props.fieldToEdit);
        } else {
            setCreateNew(true);
        }
    }, [props.fieldToEdit]);

    function close() {
        props.setShowEditFieldModal(false);
        props.setFieldToEdit(null);
        setFieldType(null);
        setField(null);
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
    }

    return (
        <>
            {props.showEditFieldModal && (
                <Modal title={createNew ? __('Add field', 'wp-open-events') : __('Edit field', 'wp-open-events')} onRequestClose={close}>
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
                            {createNew &&
                                <Button variant='secondary' onClick={unsetField}>
                                    {__('Cancel', 'wp-open-events')}
                                </Button>
                            }
                        </>
                    )}
                </Modal>
            )}
        </>
    );
};

export default EditFieldModal;