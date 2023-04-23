import React from 'react';
const { __ } = wp.i18n;

const Dashboard = function () {
    return (
        <div>
            <h2>{__('Dashboard', 'wp-open-events')}</h2>
            <h3>{__('Your events', 'wp-open-events')}</h3>
        </div>
    );
}

export default Dashboard;
