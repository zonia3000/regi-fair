import React, { useState } from 'react';
import Form from '../Form';

const EventRegistration = (props: { eventId: number }) => {
    const [loading, setLoading] = useState(true);
    return (
        <>
            <Form loading={loading} setLoading={setLoading} eventId={props.eventId} disabled={false} admin={false} />
        </>
    )
};

export default EventRegistration;