import React, { useEffect, useRef, useState } from 'react';
import { TextControl, CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { EditTextFieldProps } from '../../classes/components-props';
import '../../style.css';

const EditTextField = (props: EditTextFieldProps) => {

    const [initializing, setInitializing] = useState(true);
    const [fieldLabel, setFieldLabel] = useState('');
    const fieldLabelRef = useRef(fieldLabel);
    const [fieldDescription, setFieldDescription] = useState('');
    const [fieldRequired, setFieldRequired] = useState(false);
    const [useAsConfirmationAddress, setUseAsConfirmationAddress] = useState(false);
    const [validated, setValidated] = useState(false);

    useEffect(() => {
        if (props.field === null) {
            console.log(props.fieldType)
            const field: Field = {
                label: '',
                fieldType: props.fieldType,
                required: false,
                description: '',
                validate
            };
            if (props.fieldType === 'email') {
                setUseAsConfirmationAddress(true);
                field.extra = {
                    confirmationAddress: true
                }
            }
            props.setField(field);
        } else {
            const field: Field = {
                ...props.field,
                validate
            }
            if (props.fieldType === 'email' && props.field.extra
                && 'confirmationAddress' in props.field.extra && props.field.extra.confirmationAddress) {
                setUseAsConfirmationAddress(true);
                field.extra = {
                    confirmationAddress: true
                }
            }
            props.setField(field);
            setFieldLabel(props.field.label);
            setFieldDescription(props.field.description);
            setFieldRequired(props.field.required);
        }
        setInitializing(false);
    }, []);

    useEffect(() => {
        fieldLabelRef.current = fieldLabel;
    }, [fieldLabel]);

    function validate() {
        setValidated(true);
        return fieldLabelRef.current.trim() !== '';
    }

    function saveFieldLabel(value: string) {
        setFieldLabel(value);
        props.setField({
            ...props.field,
            label: value,
            validate
        });
    }

    function saveFieldDescription(value: string) {
        setFieldDescription(value);
        props.setField({
            ...props.field,
            description: value,
            validate
        });
    }

    function saveFieldRequired(value: boolean) {
        setFieldRequired(value);
        props.setField({
            ...props.field,
            required: value,
            validate
        });
    }

    function saveUseAsConfirmationAddress(value: boolean) {
        setUseAsConfirmationAddress(value);
        props.setField({
            ...props.field,
            extra: {
                confirmationAddress: value
            },
            validate
        });
    }

    if (initializing) {
        return;
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
                label={__('Description (optional)', 'wp-open-events')}
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
            {props.fieldType === 'email' &&
                <CheckboxControl
                    label={__('Use this address to send confirmation e-mail when the user register to the event', 'wp-open-events')}
                    checked={useAsConfirmationAddress}
                    onChange={saveUseAsConfirmationAddress}
                    className='mt-2'
                />
            }
        </>
    );
};

export default EditTextField;