import React, { useState, useEffect } from 'react';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import EditEvent from './EditEvent';

const Dashboard = () => {
    const [editing, setEditing] = useState(false);

    const toggleEditing = () => {
        setEditing(!editing);
    }

    useEffect(() => {
        apiFetch({ path: '/wpoe/v1/events' }).then((result) => {
            console.log(result);
        });
    }, []);

    return (
        <div className='wrap'>
            {editing ? <EditEvent toggleEditing={toggleEditing} /> :
                <>
                    <h1 className='wp-heading-inline'>
                        {__('Your events', 'wp-open-events')} &nbsp;
                    </h1>
                    <Button onClick={toggleEditing} variant='primary' className='page-title-action'>
                        {__('Add event', 'wp-open-events')}
                    </Button>
                </>
            }
        </div>
    );
}

export default Dashboard;
