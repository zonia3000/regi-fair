<?php

if (!defined('ABSPATH')) {
  exit;
}

require_once (WPOE_PLUGIN_DIR . 'classes/dao/dao-registrations.php');

class WPOE_Registrations_Admin_Controller extends WP_REST_Controller
{
  /**
   * @var WPOE_DAO_Registrations
   */
  private $registrations_dao;
  /**
   * @var WPOE_DAO_Events
   */
  private $events_dao;

  public function __construct()
  {
    $this->registrations_dao = new WPOE_DAO_Registrations();
    $this->events_dao = new WPOE_DAO_Events();
  }

  public function register_routes()
  {
    $namespace = 'wpoe/v1';

    register_rest_route(
      $namespace,
      '/admin/events/(?P<id>\d+)/registrations',
      [
        'args' => [
          'id' => ['type' => 'integer', 'required' => true, 'minimum' => 1],
          'page' => ['type' => 'integer', 'required' => true, 'minimum' => 1],
          'pageSize' => ['type' => 'integer', 'required' => true, 'minimum' => 1]
        ],
        [
          'methods' => WP_REST_Server::READABLE,
          'permission_callback' => 'is_events_admin',
          'callback' => [$this, 'get_items']
        ]
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
      $id = (int) $request->get_param('id');
      $event = $this->events_dao->get_event($id);
      if ($event === null) {
        return new WP_Error('event_not_found', __('Event not found', 'wp-open-events'), ['status' => 404]);
      }

      $page = (int) $request->get_param('page');
      $page_size = (int) $request->get_param('pageSize');
      $offset = ($page - 1) * $page_size;
      $registrations = $this->registrations_dao->list_event_registrations($id, $page_size, $offset);
      return new WP_REST_Response(
        array_merge(
          $registrations,
          ['eventName' => $event->name]
        )
      );
    } catch (Exception $ex) {
      return generic_server_error($ex);
    }
  }
}