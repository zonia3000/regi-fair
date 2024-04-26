import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import Loading from '../../Loading';
import { useNavigate, useParams } from 'react-router-dom';
import EditFormFields from '../fields/EditFormFields';
import { Button, CheckboxControl, Notice, TextControl } from '@wordpress/components';
import { cleanupFields, extractError } from '../../utils';
import '../../style.css';

const EditTemplate = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [templateName, setTemplateName] = useState('');
  const [autoremove, setAutoremove] = useState(true);
  const [formFields, setFormFields] = useState([]);
  const [error, setError] = useState('');
  const [valid, setValid] = useState(true);

  useEffect(() => {
    if (templateId === 'new') {
      setLoading(false);
    } else {
      setLoading(true);
      apiFetch({ path: `/wpoe/v1/admin/templates/${templateId}` })
        .then((result) => {
          const template = result as TemplateConfiguration;
          setTemplateName(template.name);
          setAutoremove(template.autoremove);
          setFormFields(template.formFields);
        })
        .catch(err => {
          setError(extractError(err));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  async function save() {
    setValid(true);
    if (templateName.trim() === '') {
      setValid(false);
      return;
    }
    const template: TemplateConfiguration = {
      id: templateId === 'new' ? null : Number(templateId),
      name: templateName,
      formFields,
      autoremove: autoremove,
      autoremovePeriod: 30,
      waitingList: false
    };
    setLoading(true);
    try {
      if (templateId === 'new') {
        await apiFetch({
          path: '/wpoe/v1/admin/templates',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(template),
        });
      } else {
        await apiFetch({
          path: `/wpoe/v1/admin/templates/${templateId}`,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...template,
            formFields: cleanupFields(template.formFields)
          }),
        });
      }
      back();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
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
      <div className={!valid && !templateName.trim() ? 'form-error' : ''}>
        <TextControl
          label={__('Name', 'wp-open-events')}
          onChange={setTemplateName}
          value={templateName}
          required
        />
        <span className='error-text'>{__('Field is required', 'wp-open-events')}</span>
      </div>
      <CheckboxControl
        label={__('Autoremove user data after the event', 'wp-open-events')}
        checked={autoremove}
        onChange={setAutoremove}
      />

      <EditFormFields formFields={formFields} setFormFields={setFormFields} />

      <br /><hr />

      {error && <div className='mb'><Notice status='error'>{error}</Notice></div>}

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
