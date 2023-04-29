import React, { useState } from 'react';
import { Button, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import EditTextField from './EditTextField';

const EditRadioField = (props: any) => {

    const [options, setOptions] = useState(['', '']);

    const addOption = () => {
        setOptions([...options, '']);
        console.log(options);
    };

    const saveFieldOptions = (value: string, index: number) => {
        setOptions(options.map((o, i) => i === index ? value : o));
        props.setField({
            ...props.field,
            options
        });
    }

    const optionsList = options.map((option, index) => {
        return (<TextControl
            label={__('Option', 'wp-open-events') + ' ' + (index + 1)}
            onChange={value => saveFieldOptions(value, index)}
            value={option}
            required
        />);
    });

    return (
        <>
            <EditTextField field={props.field} setField={props.setField} fieldType='radio' />
            {optionsList}
            <Button onClick={addOption} variant='primary'>
                {__('Add option', 'wp-open-events')}
            </Button>
            <br/>
        </>
    );
}

export default EditRadioField;
