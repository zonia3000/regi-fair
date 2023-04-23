import React from 'react';
const { __ } = wp.i18n;

const Settings = function () {
    return (
        <div>
            <h3>{__('Settings', 'wp-open-events')}</h3>
        </div>
    );
}

export default Settings;
