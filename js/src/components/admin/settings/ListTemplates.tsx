import React, { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Link, useNavigate } from 'react-router-dom';
import apiFetch from '@wordpress/api-fetch';
import Loading from '../../Loading';
import { Button } from '@wordpress/components';

const ListTemplates = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [templates, setEvents] = useState([] as TemplateConfiguration[]);

  useEffect(() => {
    setLoading(true);
    apiFetch({ path: '/wpoe/v1/admin/templates' }).then((result) => {
      setEvents(result as TemplateConfiguration[]);
      setLoading(false);
    });
  }, []);

  function newTemplate() {
    navigate('/template/new');
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <h2>{__('Event templates', 'wp-open-events')}</h2>
      <Button onClick={newTemplate} variant='primary'>
        {__('Add event template', 'wp-open-events')}
      </Button>

      {templates.length === 0 && <p>{__('No event templates found', 'wp-open-events')}</p>}
      {templates.length !== 0 &&
        <table className='widefat'>
          <thead>
            <tr>
              <th>{__('Name', 'wp-open-events')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {templates.map((e: TemplateConfiguration) => {
              return (<tr key={e.id}>
                <td>
                  <Link to={`/template/${e.id}`}>{e.name}</Link>
                </td>
                <td></td>
              </tr>)
            })}
          </tbody>
        </table>
      }
      <br />
    </div>
  );
}

export default ListTemplates;
