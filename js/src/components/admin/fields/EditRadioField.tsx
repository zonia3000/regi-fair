import React, { useEffect, useRef, useState } from 'react';
import { Button, CheckboxControl, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { EditRadioFieldProps } from '../../classes/components-props';
import '../../style.css';

const EditRadioField = (props: EditRadioFieldProps) => {

    const [initializing, setInitializing] = useState(true);
    const [fieldLabel, setFieldLabel] = useState('');
    const fieldLabelRef = useRef(fieldLabel);
    const [fieldDescription, setFieldDescription] = useState('');
    const [fieldRequired, setFieldRequired] = useState(false);
    const [options, setOptions] = useState(['', '']);
    const optionsRef = useRef(options);
    const [valid, setValid] = useState(true);

    useEffect(() => {
        if (props.field === null) {
            props.setField({
                label: '',
                fieldType: 'radio',
                required: false,
                description: '',
                extra: {
                    options: ['', '']
                },
                validate
            });
        } else {
            props.setField({
                ...props.field,
                validate
            });
            setFieldLabel(props.field.label);
            setFieldDescription(props.field.description);
            setFieldRequired(props.field.required);
            setOptions(props.field.extra.options);
        }
        setInitializing(false);
    }, []);

    useEffect(() => {
        fieldLabelRef.current = fieldLabel;
        optionsRef.current = options;
    }, [fieldLabel, options]);

    function validate() {
        const valid = fieldLabelRef.current !== '' && optionsRef.current.filter(o => o.trim() === '').length === 0;
        setValid(valid);
        return valid;
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

    function addOption() {
        updateOptions([...options, '']);
    }

    function removeOption(index: number) {
        updateOptions(options.filter((_, i) => i !== index));
    }

    function saveFieldOptions(value: string, index: number) {
        updateOptions(options.map((o, i) => i === index ? value : o));
    }

    function updateOptions(updatedOptions: string[]) {
        setOptions(updatedOptions);
        props.setField({
            ...props.field,
            extra: { options: updatedOptions },
            validate
        });
    }

    if (initializing) {
        return;
    }

    return (
        <>
            <div className={!valid && !fieldLabel.trim() ? 'form-error' : ''}>
                <TextControl
                    label={__('Label', 'wp-open-events')}
                    onChange={saveFieldLabel}
                    value={fieldLabel}
                    required
                />
                {!valid && !fieldLabel.trim() &&
                    <span className='error-text'>{__('Field is required', 'wp-open-events')}</span>
                }
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
                className={'mt-2 mb-2'}
            />
            {options.map((option, index) => {
                return (
                    <div className={!valid && !option.trim() ? 'form-error edit-radio-option-wrapper' : 'edit-radio-option-wrapper'} key={index}>
                        <TextControl
                            label={__('Option', 'wp-open-events') + ' ' + (index + 1)}
                            onChange={value => saveFieldOptions(value, index)}
                            value={option}
                            required
                        />
                        {options.length > 2 &&
                            <Button aria-label={__('Remove option', 'wp-open-events')} onClick={() => removeOption(index)} className='remove-option-btn'>
                                &times;
                            </Button>
                        }
                        {!valid && !option.trim() &&
                            <span className='error-text'>{__('Field is required', 'wp-open-events')}</span>
                        }
                    </div>);
            })}
            <Button onClick={addOption} variant='primary'>
                {__('Add option', 'wp-open-events')}
            </Button>
            <br />
        </>
    );
}

export default EditRadioField;
