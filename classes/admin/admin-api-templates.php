<?php

if (!defined('ABSPATH')) {
  exit;
}

require_once (WPOE_PLUGIN_DIR . 'classes/model/event-template.php');
require_once (WPOE_PLUGIN_DIR . 'classes/model/form-field.php');
require_once (WPOE_PLUGIN_DIR . 'classes/dao/dao-templates.php');
require_once (WPOE_PLUGIN_DIR . 'classes/api-utils.php');

class WPOE_Templates_Admin_Controller extends WP_REST_Controller
{
  /**
   * @var WPOE_DAO_Templates
   */
  private $dao;

  public function __construct()
  {
    $this->dao = new WPOE_DAO_Templates();
  }

  public function register_routes()
  {
    $namespace = 'wpoe/v1';

    register_rest_route(
      $namespace,
      '/admin/templates',
      [
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
      '/admin/templates/(?P<id>\d+)',
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
  }

  /**
   * @param WP_REST_Request $request
   * @return WP_Error|WP_REST_Response
   */
  public function get_items($request)
  {
    try {
      return new WP_REST_Response($this->dao->list_event_templates());
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
      $template = $this->dao->get_event_template($id);
      if ($template === null) {
        return new WP_Error('template_not_found', __('Event template not found', 'wp-open-events'), ['status' => 404]);
      }
      return new WP_REST_Response($template);
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
      $event_template = $this->get_event_template_from_request($request);
      $template_id = $this->dao->create_event_template($event_template);
      return new WP_REST_Response(['id' => $template_id], 201);
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
      $event_template = $this->dao->get_event_template($id);
      if ($event_template === null) {
        return new WP_Error('template_not_found', __('Event template not found', 'wp-open-events'), ['status' => 404]);
      }
      $event_template = $this->get_event_template_from_request($request);
      $event_template->id = $id;
      $this->dao->update_event_template($event_template);
      return new WP_REST_Response(null, 204);
    } catch (Exception $ex) {
      return generic_server_error($ex);
    }
  }

  private function get_event_template_from_request(WP_REST_Request $request): WPOE_Event_Template
  {
    $event_template = new WPOE_Event_Template();
    $event_template->name = $request->get_param('name');
    $event_template->autoremove = (bool) $request->get_param('autoremove');
    if ($event_template->autoremove) {
      if ($request->get_param('autoremovePeriod') !== null) {
        $event_template->autoremovePeriod = (int) $request->get_param('autoremovePeriod');
      } else {
        $event_template->autoremovePeriod = 30; // default value
      }
    } else {
      $event_template->autoremovePeriod = null;
    }
    $event_template->waitingList = (bool) $request->get_param('waitingList');
    $event_template->editableRegistrations = (bool) $request->get_param('editableRegistrations');
    $admin_email = $request->get_param('adminEmail');
    if ($admin_email) {
      $event_template->adminEmail = $admin_email;
    }
    $extra_email_content = $request->get_param('extraEmailContent');
    if ($extra_email_content) {
      $event_template->extraEmailContent = $extra_email_content;
    }
    $event_template->formFields = get_form_field_from_request($request);
    return $event_template;
  }

  /**
   * @param WP_REST_Request $request
   * @return WP_Error|WP_REST_Response
   */
  public function delete_item($request)
  {
    try {
      $id = (int) $request->get_param('id');
      $this->dao->delete_event_template($id);
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

    $schema['properties']['name'] = ['type' => 'string', 'required' => true];
    $schema['properties']['autoremove'] = ['type' => 'boolean', 'required' => true];
    $schema['properties']['autoremovePeriod'] = ['type' => 'integer', 'required' => false, 'minimum' => 1];
    $schema['properties']['waitingList'] = ['type' => 'boolean', 'required' => true];
    $schema['properties']['editableRegistrations'] = ['type' => 'boolean', 'required' => true];
    $schema['properties']['adminEmail'] = ['type' => 'string', 'format' => 'email', 'required' => false];
    $schema['properties']['extraEmailContent'] = ['type' => 'string', 'required' => false];
    $schema['properties']['formFields'] = get_form_fields_schema();

    // Cache generated schema on endpoint instance.
    $this->schema = $schema;

    return $this->add_additional_fields_schema($this->schema);
  }
}
