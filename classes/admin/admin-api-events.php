<?php

if (!defined('ABSPATH')) {
  exit;
}

require_once(WPOE_PLUGIN_DIR . 'classes/model/event.php');
require_once(WPOE_PLUGIN_DIR . 'classes/model/form-field.php');
require_once(WPOE_PLUGIN_DIR . 'classes/dao/dao-events.php');
require_once(WPOE_PLUGIN_DIR . 'classes/api-utils.php');

class WPOE_Events_Admin_Controller extends WP_REST_Controller
{
  /**
   * @var WPOE_DAO_Events
   */
  private $dao;

  public function __construct()
  {
    $this->dao = new WPOE_DAO_Events();
  }

  public function register_routes()
  {
    $namespace = 'wpoe/v1';

    register_rest_route(
      $namespace,
      '/admin/events',
      [
        'args' => [
          'ignorePastEvents' => ['type' => 'boolean', 'required' => false]
        ],
        [
          'methods' => WP_REST_Server::READABLE,
          'permission_callback' => 'is_events_admin',
          'callback' => [$this, 'get_items']
        ],
        [
          'methods' => WP_REST_Server::CREATABLE,
          'permission_callback' => 'is_events_admin',
          'callback' => [$this, 'create_item'],
          'args' => $this->get_endpoint_args_for_item_schema()
        ],
        'schema' => [$this, 'get_item_schema']
      ]
    );

    register_rest_route(
      $namespace,
      '/admin/events/(?P<id>\d+)',
      [
        'args' => [
          'id' => ['type' => 'integer', 'required' => true, 'minimum' => 1]
        ],
        [
          'methods' => WP_REST_Server::READABLE,
          'permission_callback' => 'is_events_admin',
          'callback' => [$this, 'get_item']
        ],
        [
          'methods' => WP_REST_Server::EDITABLE,
          'permission_callback' => 'is_events_admin',
          'callback' => [$this, 'update_item'],
          'args' => array_merge(
            $this->get_endpoint_args_for_item_schema(),
            ['properties' => ['id' => ['type' => 'integer', 'required' => true, 'minimum' => 1]]]
          )
        ],
        [
          'methods' => WP_REST_Server::DELETABLE,
          'permission_callback' => 'is_events_admin',
          'callback' => [$this, 'delete_item']
        ],
        'schema' => [$this, 'get_item_schema']
      ]
    );

    register_rest_route(
      $namespace,
      '/admin/events/(?P<id>\d+)/references',
      [
        'args' => [
          'id' => ['type' => 'integer', 'required' => true, 'minimum' => 1]
        ],
        [
          'methods' => WP_REST_Server::READABLE,
          'permission_callback' => 'is_events_admin',
          'callback' => [$this, 'get_referencing_post']
        ],
      ]
    );
  }

  /**
   * @param WP_REST_Request $request
   * @return WP_Error|WP_REST_Response
   */
  public function get_items($request)
  {
    try {
      $ignore_past_events = (bool) $request->get_param('ignorePastEvents');
      return new WP_REST_Response($this->dao->list_events($ignore_past_events));
    } catch (Exception $ex) {
      return generic_server_error($ex);
    }
  }

  /**
   * @param WP_REST_Request $request
   * @return WP_Error|WP_REST_Response
   */
  public function get_item($request)
  {
    try {
      $id = (int) $request->get_param('id');
      $event = $this->dao->get_event($id);
      if ($event === null) {
        return new WP_Error('event_not_found', __('Event not found', 'wp-open-events'), ['status' => 404]);
      }
      return new WP_REST_Response($event);
    } catch (Exception $ex) {
      return generic_server_error($ex);
    }
  }

  /**
   * @param WP_REST_Request $request
   * @return WP_Error|WP_REST_Response
   */
  public function get_referencing_post($request)
  {
    try {
      $event_id = $request->get_param('id');
      return new WP_REST_Response($this->dao->get_referencing_posts($event_id));
    } catch (Exception $ex) {
      return generic_server_error($ex);
    }
  }

  /**
   * @param WP_REST_Request $request
   * @return WP_Error|WP_REST_Response
   */
  public function create_item($request)
  {
    try {
      $event = $this->get_event_from_request($request);
      $event_id = $this->dao->create_event($event);
      $event = $this->dao->get_event($event_id);
      return new WP_REST_Response($event, 201);
    } catch (WPOE_Validation_Exception $ex) {
      return new WP_Error('invalid_payload', $ex->getMessage(), ['status' => 400]);
    } catch (Exception $ex) {
      return generic_server_error($ex);
    }
  }

  /**
   * @param WP_REST_Request $request
   * @return WP_Error|WP_REST_Response
   */
  public function update_item($request)
  {
    try {
      $id = (int) $request->get_param('id');
      $event = $this->dao->get_event($id);
      if ($event === null) {
        return new WP_Error('event_not_found', __('Event not found', 'wp-open-events'), ['status' => 404]);
      }

      $event = $this->get_event_from_request($request);
      $event->id = $id;
      $this->dao->update_event($event);
      $event = $this->dao->get_event($id);
      return new WP_REST_Response($event, 200);
    } catch (WPOE_Validation_Exception $ex) {
      return new WP_Error('invalid_payload', $ex->getMessage(), ['status' => 400]);
    } catch (Exception $ex) {
      return generic_server_error($ex);
    }
  }

  private function get_event_from_request(WP_REST_Request $request): WPOE_Event
  {
    $event = new WPOE_Event();
    $event->name = $request->get_param('name');
    $event->date = $request->get_param('date');
    $event->autoremove = (bool) $request->get_param('autoremove');
    if ($event->autoremove) {
      if ($request->get_param('autoremovePeriod') !== null) {
        $event->autoremovePeriod = (int) $request->get_param('autoremovePeriod');
      } else {
        $event->autoremovePeriod = 30; // default value
      }
    } else {
      $event->autoremovePeriod = null;
    }
    if ($request->get_param('maxParticipants')) {
      $event->maxParticipants = (int) $request->get_param('maxParticipants');
    }
    $event->waitingList = (bool) $request->get_param('waitingList');
    $event->editableRegistrations = (bool) $request->get_param('editableRegistrations');
    $admin_email = $request->get_param('adminEmail');
    if ($admin_email) {
      $event->adminEmail = $admin_email;
    }
    $extra_email_content = $request->get_param('extraEmailContent');
    if ($extra_email_content) {
      $event->extraEmailContent = strip_forbidden_html_tags($extra_email_content);
    }
    $event->formFields = get_form_field_from_request($request);
    return $event;
  }

  /**
   * @param WP_REST_Request $request
   * @return WP_Error|WP_REST_Response
   */
  public function delete_item($request)
  {
    try {
      $id = (int) $request->get_param('id');
      $this->dao->delete_event($id);
      return new WP_REST_Response(null, 204);
    } catch (Exception $ex) {
      return generic_server_error($ex);
    }
  }

  public function get_item_schema()
  {
    // Returns cached copy whenever available.
    if ($this->schema) {
      return $this->add_additional_fields_schema($this->schema);
    }

    $schema = parent::get_item_schema();

    $schema['properties']['name'] = ['type' => 'string', 'required' => true, 'minLength' => 1];
    $schema['properties']['date'] = ['type' => 'string', 'required' => true, 'format' => 'date-time'];
    $schema['properties']['autoremove'] = ['type' => 'boolean', 'required' => true];
    $schema['properties']['autoremovePeriod'] = ['type' => 'integer', 'required' => false, 'minimum' => 1];
    $schema['properties']['maxParticipants'] = ['type' => 'integer', 'required' => false, 'minimum' => 1];
    $schema['properties']['waitingList'] = ['type' => 'boolean', 'required' => true];
    $schema['properties']['adminEmail'] = ['type' => 'string', 'format' => 'email', 'required' => false];
    $schema['properties']['editableRegistrations'] = ['type' => 'boolean', 'required' => true];
    $schema['properties']['extraEmailContent'] = ['type' => 'string', 'required' => false];
    $schema['properties']['formFields'] = get_form_fields_schema();

    // Cache generated schema on endpoint instance.
    $this->schema = $schema;

    return $this->add_additional_fields_schema($this->schema);
  }
}
