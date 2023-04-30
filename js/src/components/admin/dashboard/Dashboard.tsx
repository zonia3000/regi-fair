import React, { useState } from 'react';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import EditEvent from './EditEvent';
import ListEvents from './ListEvents';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [currentEventId, setCurrentEventId] = useState(null);
    const [editing, setEditing] = useState(false);

    const addEvent = () => {
        setCurrentEventId(null);
        setEditing(true);
    }

    const toggleEditing = () => {
        setEditing(!editing);
    }

    const selectEvent = (id: number) => {
        setCurrentEventId(id);
        setEditing(true);
    }

    return (
        <div className='wrap'>
            {editing ? <EditEvent
                loading={loading} setLoading={setLoading}
                currentEventId={currentEventId} toggleEditing={toggleEditing} /> :
                <>
                    <h1 className='wp-heading-inline'>
                        {__('Your events', 'wp-open-events')} &nbsp;
                    </h1>
                    <Button onClick={addEvent} variant='primary' className='page-title-action'>
                        {__('Add event', 'wp-open-events')}
                    </Button>

                    <ListEvents loading={loading} setLoading={setLoading} selectEvent={selectEvent} />
                </>
            }
        </div>
    );
}

export default Dashboard;
