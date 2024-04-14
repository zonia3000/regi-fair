import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import Loading from '../../Loading';
import { useNavigate, useParams } from 'react-router-dom';
import EditFormFields from '../fields/EditFormFields';
import { Button, CheckboxControl, Notice, TextControl } from '@wordpress/components';
import { extractError } from '../../utils';

const EditTemplate = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [templateName, setTemplateName] = useState('');
  const [autoremove, setAutoremove] = useState(true);
  const [formFields, setFormFields] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (templateId === 'new') {
      setLoading(false);
    } else {
      setLoading(true);
      apiFetch({ path: '/wpoe/v1/admin/templates/' + templateId })
        .then((result) => {
          const template = result as TemplateConfiguration;
          setTemplateName(template.name);
          setAutoremove(template.autoremove);
          setFormFields(template.formFields);
          setLoading(false);
        })
        .catch(err => {
          setError(extractError(err));
        });
    }
  }, []);

  const save = async () => {
    const template: TemplateConfiguration = {
      id: null,
      name: templateName,
      formFields,
      autoremove: autoremove,
      autoremovePeriod: 30,
      waitingList: false
    };
    try {
      await apiFetch({
        path: '/wpoe/v1/admin/templates',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });
      back();
    } catch (err) {
      setError(extractError(err));
    }
  };

  function back() {
    navigate('/');
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <h1>{templateId === 'new' ? __('Create template', 'wp-open-events') : __('Edit template', 'wp-open-events')}</h1>
      <TextControl
        label={__('Name', 'wp-open-events')}
        onChange={setTemplateName}
        value={templateName}
        required
      />
      <CheckboxControl
        label={__('Autoremove user data after the event', 'wp-open-events')}
        checked={autoremove}
        onChange={setAutoremove}
      />

      <EditFormFields formFields={formFields} setFormFields={setFormFields} />

      <br /><hr />

      {error && <Notice status='error'>{error}</Notice>}

      <Button onClick={save} variant='primary'>
        {__('Save', 'wp-open-events')}
      </Button>
      &nbsp;
      <Button onClick={back} variant='secondary'>
        {__('Back', 'wp-open-events')}
      </Button>
    </div>
  );
}

export default EditTemplate;
