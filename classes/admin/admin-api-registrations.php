<?php

if (!defined('ABSPATH')) {
  exit;
}

require_once(WPOE_PLUGIN_DIR . 'classes/dao/dao-registrations.php');

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
          'pageSize' => ['type' => 'integer', 'required' => true, 'minimum' => 1],
          'waitingList' => ['type' => 'boolean', 'required' => false]
        ],
        [
          'methods' => WP_REST_Server::READABLE,
          'permission_callback' => 'is_events_admin',
          'callback' => [$this, 'get_items']
        ]
      ]
    );

    register_rest_route(
      $namespace,
      '/admin/events/(?P<id>\d+)/registrations/download',
      [
        'args' => [
          'id' => ['type' => 'integer', 'required' => true, 'minimum' => 1],
          'waitingList' => ['type' => 'boolean', 'required' => false]
        ],
        [
          'methods' => WP_REST_Server::READABLE,
          'permission_callback' => 'is_events_admin',
          'callback' => [$this, 'download_items']
        ],
      ]
    );

    register_rest_route(
      $namespace,
      '/admin/events/(?P<eventId>\d+)/registrations/(?P<registrationId>\d+)',
      [
        'args' => [
          'eventId' => ['type' => 'integer', 'required' => true, 'minimum' => 1],
          'registrationId' => ['type' => 'integer', 'required' => true, 'minimum' => 1],
          'sendEmail' => ['type' => 'boolean', 'required' => false, 'default' => false]
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
          'args' => $this->get_endpoint_args_for_item_schema()
        ],
        [
          'methods' => WP_REST_Server::DELETABLE,
          'permission_callback' => 'is_events_admin',
          'callback' => [$this, 'delete_item']
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
      $waiting = (bool) $request->get_param('waitingList');
      $event = $this->events_dao->get_event($id);
      if ($event === null) {
        return new WP_Error('event_not_found', __('Event not found', 'wp-open-events'), ['status' => 404]);
      }

      $page = (int) $request->get_param('page');
      $page_size = (int) $request->get_param('pageSize');
      $offset = ($page - 1) * $page_size;
      $registrations = $this->registrations_dao->list_event_registrations($id, $waiting, $page_size, $offset);
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

  /**
   * @param WP_REST_Request $request
   * @return WP_Error|WP_REST_Response
   */
  public function download_items($request)
  {
    try {
      $id = (int) $request->get_param('id');
      $event = $this->events_dao->get_event($id);
      $waiting = (bool) $request->get_param('waitingList');
      if ($event === null) {
        return new WP_Error('event_not_found', __('Event not found', 'wp-open-events'), ['status' => 404]);
      }

      $registrations = $this->registrations_dao->list_event_registrations($id, $waiting, null, offset: null);

      header('Content-Type: text/csv');
      header('Content-Disposition: attachment; filename="' . __('registrations', 'wp-open-events') . '.csv"');
      header('Expires: 0');
      header('Cache-Control: must-revalidate');

      $header = $registrations['head'];
      echo '"#","' . esc_html(__('date', 'wp-open-events')) . '"';
      foreach ($header as $index => $cell) {
        if ($cell['deleted'] === false) {
          echo ',';
          echo '"' . esc_html(str_replace('"', '""', $cell['label'])) . '"';
        }
      }
      echo "\n";

      $body = $registrations['body'];
      foreach ($body as $row) {
        foreach ($row as $index => $cell) {
          if ($index < 2 || $header[$index - 2]['deleted'] === false) {
            if ($index > 0) {
              echo ',';
            }
            echo '"' . esc_html(str_replace('"', '""', $cell)) . '"';
          }
        }
        echo "\n";
      }

      // Terminate the script to prevent WordPress from adding additional output
      exit;
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
      $event_id = (int) $request->get_param('eventId');
      $event = $this->events_dao->get_event($event_id);
      if ($event === null) {
        return new WP_Error('event_not_found', __('Event not found', 'wp-open-events'), ['status' => 404]);
      }

      $registration_id = (int) $request->get_param('registrationId');

      $registration = $this->registrations_dao->get_registration_by_id($event_id, $registration_id);
      if ($registration === null) {
        return new WP_Error('registration_not_found', __('Registration not found', 'wp-open-events'), ['status' => 404]);
      }

      return new WP_REST_Response($registration);
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
      $event_id = (int) $request->get_param('eventId');
      $event = $this->events_dao->get_event($event_id);
      $waiting_list = (bool) $request->get_param('waitingList');

      if ($event === null) {
        return new WP_Error('event_not_found', __('Event not found', 'wp-open-events'), ['status' => 404]);
      }

      if ($waiting_list && !$event->waitingList) {
        return new WP_Error('waiting_list_not_enabled', __('Waiting list is not enabled', 'wp-open-events'), ['status' => 400]);
      }

      $registration_id = (int) $request->get_param('registrationId');

      $input = json_decode($request->get_body(), true);
      $error = validate_event_request($event, $input);
      if ($error !== null) {
        return $error;
      }

      $data = new WPOE_Registration();
      $data->id = $registration_id;
      $data->numberOfPeople = get_number_of_people($event, $input);
      $data->values = $input;
      $data->waitingList = $waiting_list;

      $update_result = $this->registrations_dao->update_registration($event, $data);

      if ($update_result === false) {
        return get_no_more_seats_error($event);
      }

      $send_email = (boolean) $request->get_param('sendEmail');
      if ($send_email) {
        $user_email = get_user_email($event, $input);
        if (count($user_email) > 0) {
          WPOE_Mail_Sender::send_registration_updated_by_admin($event, $user_email, $input);
        }
      }

      $waiting_picked = $update_result['waiting_picked'];

      if ($waiting_picked !== null && count($waiting_picked) > 0) {
        foreach ($waiting_picked as $registration_id) {
          $waiting_registration = $this->registrations_dao->get_registration_by_id($event->id, $registration_id);
          if ($waiting_registration !== null) {
            $user_email = get_user_email($event, $waiting_registration->values);
            if (count($user_email) > 0) {
              WPOE_Mail_Sender::send_picked_from_waiting_list_confirmation($event, $user_email, $waiting_registration->values);
            }
          }
        }
      }

      return new WP_REST_Response(null, 204);
    } catch (Exception $ex) {
      return generic_server_error($ex);
    }
  }

  /**
   * @param WP_REST_Request $request
   * @return WP_Error|WP_REST_Response
   */
  public function delete_item($request)
  {
    try {
      $event_id = (int) $request->get_param('eventId');
      $event = $this->events_dao->get_event($event_id);
      if ($event === null) {
        return new WP_Error('event_not_found', __('Event not found', 'wp-open-events'), ['status' => 404]);
      }

      $registration_id = (int) $request->get_param('registrationId');

      $send_email = (boolean) $request->get_param('sendEmail');
      $values = [];
      if ($send_email) {
        $values = $this->registrations_dao->get_registration_values($registration_id);
      }

      $this->registrations_dao->delete_registration($event, $registration_id);

      if ($send_email) {
        $user_email = get_user_email($event, $values);
        if (count($user_email) > 0) {
          WPOE_Mail_Sender::send_registration_deleted_by_admin($event, $user_email);
        }
      }

      return new WP_REST_Response(null, 204);
    } catch (Exception $ex) {
      return generic_server_error($ex);
    }
  }
}