import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import apiFetch from '@wordpress/api-fetch';
import React, { useState, useEffect } from 'react';
import { SelectControl } from '@wordpress/components';
import Form from 'regi-fair/Form';
import Loading from 'regi-fair/Loading';

export default function Edit({ attributes, setAttributes }) {
    const [loading, setLoading] = useState(!attributes.eventId);
    const [formLoading, setFormLoading] = useState(true);
    const [eventsOptions, setEventsOptions] = useState([]);
    const [eventId, setEventId] = useState(attributes.eventId || '');

    useEffect(() => {
        if (!attributes.eventId) {
            apiFetch({ path: '/regifair/v1/admin/events?ignorePastEvents=true' })
                .then((result) => {
                    setEventsOptions(
                        [{
                            label: __('Select...', 'regi-fair'),
                            value: ''
                        }].concat(
                            result.map(event => {
                                return {
                                    value: event.id,
                                    label: event.name
                                };
                            })
                        )
                    );
                    setLoading(false);
                });
        }
    }, []);

    const saveEventId = (id) => {
        setEventId(id);
        setAttributes({
            eventId: id
        });
    };

    return (
        <div {...useBlockProps()}>
            {loading && <Loading />}

            {!loading && !eventId &&
                <SelectControl
                    label={__('Select event', 'regi-fair')}
                    options={eventsOptions}
                    onChange={saveEventId}
                    __nextHasNoMarginBottom={true} />
            }

            {!loading && eventId &&
                <Form loading={formLoading} setLoading={setFormLoading} eventId={eventId} disabled={true} admin={true} />
            }
        </div>
    );
}
