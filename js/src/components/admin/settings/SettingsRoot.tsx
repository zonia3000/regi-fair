import React from 'react';
import { __ } from '@wordpress/i18n';
import ListTemplates from './ListTemplates';

const SettingsRoot = () => {
  return (
    <div>
      <h1>{__('Settings', 'wp-open-events')}</h1>
      <ListTemplates />
    </div>
  );
}

export default SettingsRoot;
