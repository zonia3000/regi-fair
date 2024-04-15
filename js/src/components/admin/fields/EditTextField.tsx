import React, { useEffect, useState } from 'react';
import { TextControl, CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { EditTextFieldProps } from '../../classes/components-props';
import '../../style.css';

const EditTextField = (props: EditTextFieldProps) => {

    const [fieldLabel, setFieldLabel] = useState('');
    const [fieldDescription, setFieldDescription] = useState('');
    const [fieldRequired, setFieldRequired] = useState(false);
    const [validated, setValidated] = useState(false);

    useEffect(() => {
        props.setField({
            label: '',
            fieldType: props.fieldType,
            required: false,
            description: '',
            validate() {
                setValidated(true);
                return fieldLabel !== '';
            }
        });
    }, []);

    function saveFieldLabel(value: string) {
        setFieldLabel(value);
        props.setField({
            ...props.field,
            label: value
        });
    }

    function saveFieldDescription(value: string) {
        setFieldDescription(value);
        props.setField({
            ...props.field,
            description: value
        });
    }

    function saveFieldRequired(value: boolean) {
        setFieldRequired(value);
        props.setField({
            ...props.field,
            required: value
        });
    }

    return (
        <>
            <div className={validated && !fieldLabel.trim() ? 'form-error' : ''}>
                <TextControl
                    label={__('Label', 'wp-open-events')}
                    onChange={saveFieldLabel}
                    value={fieldLabel}
                    required
                />
                <span className='error-text'>{__('Field is required', 'wp-open-events')}</span>
            </div>
            <TextControl
                label={__('Description', 'wp-open-events')}
                onChange={saveFieldDescription}
                value={fieldDescription}
                required
            />
            <CheckboxControl
                label={__('Required', 'wp-open-events')}
                checked={fieldRequired}
                onChange={saveFieldRequired}
                className='mt-2'
            />
        </>
    );
};

export default EditTextField;