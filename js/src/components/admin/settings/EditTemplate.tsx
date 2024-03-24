import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import Loading from '../../Loading';
import { useParams } from 'react-router-dom';
import EditFormFields from '../fields/EditFormFields';

const EditTemplate = () => {
  const { templateId } = useParams();

  const [loading, setLoading] = useState(true);
  const [formFields, setFormFields] = useState([]);

  useEffect(() => {
    if (templateId === 'new') {
      setLoading(false);
    } else {
      setLoading(true);
      apiFetch({ path: '/wpoe/v1/admin/templates/' + templateId }).then((result) => {
        const event = result as TemplateConfiguration;
        setFormFields(event.formFields);
        setLoading(false);
      });
    }
  }, []);
  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <h1>{templateId === 'new' ? __('Create template', 'wp-open-events') : __('Edit template', 'wp-open-events')}</h1>
      <EditFormFields formFields={formFields} setFormFields={setFormFields} />
    </div>
  );
}

export default EditTemplate;
