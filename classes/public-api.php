<?php

if (!defined('ABSPATH')) {
  die();
}

require_once(WPOE_PLUGIN_DIR . 'classes/model/registration.php');

class WPOE_Public_Controller extends WP_REST_Controller
{
  /**
   * @var WPOE_DAO_Events
   */
  private $events_dao;
  /**
   * @var WPOE_DAO_Registrations
   */
  private $registrations_dao;

  public function __construct()
  {
    $this->events_dao = new WPOE_DAO_Events();
    $this->registrations_dao = new WPOE_DAO_Registrations();
  }

  public function register_routes()
  {
    $namespace = 'wpoe/v1';

    register_rest_route(
      $namespace,
      '/events/(?P<id>\d+)',
      [
        'args' => [
          'id' => ['type' => 'integer', 'required' => true, 'minimum' => 1],
          'waitingList' => ['type' => 'boolean', 'required' => false]
        ],
        [
          'methods' => WP_REST_Server::READABLE,
          'callback' => [$this, 'get_item'],
          'permission_callback' => '__return_true'
        ],
        [
          'methods' => WP_REST_Server::CREATABLE,
          'callback' => [$this, 'create_item'],
          'permission_callback' => '__return_true'
        ]
      ]
    );

    register_rest_route(
      $namespace,
      '/events/(?P<id>\d+)/(?P<registration_token>\w+)',
      [
        'args' => [
          'id' => ['type' => 'integer', 'required' => true, 'minimum' => 1],
          'registration_token' => ['type' => 'string', 'required' => true],
          'waitingList' => ['type' => 'boolean', 'required' => false]
        ],
        [
          'methods' => WP_REST_Server::READABLE,
          'callback' => [$this, 'get_registration'],
          'permission_callback' => '__return_true'
        ],
        [
          'methods' => WP_REST_Server::EDITABLE,
          'callback' => [$this, 'update_registration'],
          'permission_callback' => '__return_true'
        ],
        [
          'methods' => WP_REST_Server::DELETABLE,
          'callback' => [$this, 'delete_registration'],
          'permission_callback' => '__return_true'
        ]
      ]
    );
  }

  /**
   * @param WP_REST_Request $request
   * @return WP_Error|WP_REST_Response
   */
  public function get_item($request)
  {
    $id = (int) $request->get_param('id');
    $event = $this->events_dao->get_public_event_data($id);
    if ($event === null) {
      return new WP_Error('event_not_found', __('Event not found', 'wp-open-events'), ['status' => 404]);
    }
    $event->formFields = $this->remove_registered_user_email_field($event->formFields);
    return new WP_REST_Response($event);
  }

  /**
   * @param WPOE_Form_Field[] $fields
   * @return WPOE_Form_Field[]
   */
  private function remove_registered_user_email_field($fields)
  {
    $email = get_current_user_email();
    if ($email === null) {
      return $fields;
    }
    $filtered_fields = [];
    foreach ($fields as $field) {
      if (!use_wp_user_email($field)) {
        $filtered_fields[] = $field;
      }
    }
    return $filtered_fields;
  }

  /**
   * @param WP_REST_Request $request
   * @return WP_Error|WP_REST_Response
   */
  public function create_item($request)
  {
    try {
      $event_id = (int) $request->get_param('id');
      $event = $this->events_dao->get_event($event_id);
      $waiting_list = (bool) $request->get_param('waitingList');

      if ($event === null) {
        return new WP_Error('event_not_found', __('Event not found', 'wp-open-events'), ['status' => 400]);
      }

      if ($waiting_list && !$event->waitingList) {
        return new WP_Error('waiting_list_not_enabled', __('Waiting list is not enabled', 'wp-open-events'), ['status' => 400]);
      }

      $input = json_decode($request->get_body(), true);
      set_registered_user_email($event, $input);
      $error = validate_event_request($event, $input);
      if ($error !== null) {
        return $error;
      }

      $user_email = get_user_email($event, $input);

      $data = new WPOE_Registration();
      $data->numberOfPeople = get_number_of_people($event, $input);
      $data->values = $input;
      $data->waitingList = $waiting_list;

      $registration_token = bin2hex(openssl_random_pseudo_bytes(16));

      $remaining_seats = $this->registrations_dao->register_to_event($event, $data, md5($registration_token));
      if ($remaining_seats === false) {
        return get_no_more_seats_error($event);
      }

      if (count($user_email) > 0) {
        if ($waiting_list) {
          WPOE_Mail_Sender::send_waiting_list_confirmation($event, $user_email, $registration_token, $input);
        } else {
          WPOE_Mail_Sender::send_registration_confirmation($event, $user_email, $registration_token, $input);
        }
      }
      if ($event->adminEmail !== null) {
        if ($waiting_list) {
          WPOE_Mail_Sender::send_new_waiting_list_registration_to_admin($event, $input);
        } else {
          WPOE_Mail_Sender::send_new_registration_to_admin($event, $input);
        }
      }

      return new WP_REST_Response([
        'remaining' => $remaining_seats,
        'token' => $registration_token
      ], 201);
    } catch (Exception $ex) {
      return generic_server_error($ex);
    }
  }

  /**
   * @param WP_REST_Request $request
   * @return WP_Error|WP_REST_Response
   */
  public function update_registration($request)
  {
    try {
      $event_id = (int) $request->get_param('id');
      $event = $this->events_dao->get_event($event_id);
      $waiting_list = (bool) $request->get_param('waitingList');

      if ($event === null) {
        return new WP_Error('event_not_found', __('Event not found', 'wp-open-events'), ['status' => 400]);
      }

      if ($waiting_list && !$event->waitingList) {
        return new WP_Error('waiting_list_not_enabled', __('Waiting list is not enabled', 'wp-open-events'), ['status' => 400]);
      }

      if (!$event->editableRegistrations) {
        return new WP_Error('registrations_not_editable', __('This event doesn\'t allow to edit the registrations', 'wp-open-events'), ['status' => 403]);
      }

      $token = $request->get_param('registration_token');
      $registration = $this->registrations_dao->get_registration_from_token($event_id, md5($token));
      if ($registration === null) {
        return new WP_Error('registration_not_found', __('Registration not found', 'wp-open-events'), ['status' => 400]);
      }

      $input = json_decode($request->get_body(), true);
      set_registered_user_email($event, $input);
      $error = validate_event_request($event, $input);
      if ($error !== null) {
        return $error;
      }

      $user_email = get_user_email($event, $input);

      $data = new WPOE_Registration();
      $data->id = $registration->id;
      $data->numberOfPeople = get_number_of_people($event, $input);
      $data->values = $input;
      $data->waitingList = $registration->waitingList || $waiting_list;

      $update_result = $this->registrations_dao->update_registration($event, $data);
      if ($update_result === false) {
        return get_no_more_seats_error($event);
      }

      $remaining_seats = $update_result['remaining'];
      $waiting_picked = $update_result['waiting_picked'];

      if (count($user_email) > 0) {
        WPOE_Mail_Sender::send_registration_updated_confirmation($event, $user_email, $token, $input);
      }
      if ($event->adminEmail !== null) {
        WPOE_Mail_Sender::send_registration_updated_to_admin($event, $input);
      }

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
        if ($event->adminEmail !== null) {
          WPOE_Mail_Sender::send_registrations_picked_from_waiting_list_to_admin($event, $waiting_picked);
        }
      }

      return new WP_REST_Response([
        'remaining' => $remaining_seats
      ]);
    } catch (Exception $ex) {
      return generic_server_error($ex);
    }
  }

  /**
   * @param WP_REST_Request $request
   * @return WP_Error|WP_REST_Response
   */
  public function get_registration($request)
  {
    try {
      $event_id = (int) $request->get_param('id');
      $event = $this->events_dao->get_event($event_id);

      if ($event === null) {
        return new WP_Error('event_not_found', __('Event not found', 'wp-open-events'), ['status' => 404]);
      }

      if (!$event->editableRegistrations) {
        return new WP_Error('registrations_not_editable', __('This event doesn\'t allow to edit the registrations', 'wp-open-events'), ['status' => 403]);
      }

      $token = $request->get_param('registration_token');
      $registration = $this->registrations_dao->get_registration_from_token($event_id, md5($token));
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
  public function delete_registration($request)
  {
    try {
      $event_id = (int) $request->get_param('id');
      $event = $this->events_dao->get_event($event_id);

      if ($event === null) {
        return new WP_Error('event_not_found', __('Event not found', 'wp-open-events'), ['status' => 400]);
      }

      if (!$event->editableRegistrations) {
        return new WP_Error('registrations_not_editable', __('This event doesn\'t allow to edit the registrations', 'wp-open-events'), ['status' => 403]);
      }

      $token = $request->get_param('registration_token');
      $registration = $this->registrations_dao->get_registration_from_token($event_id, md5($token));
      if ($registration === null) {
        return new WP_Error('registration_not_found', __('Registration not found', 'wp-open-events'), ['status' => 400]);
      }

      $deletion_result = $this->registrations_dao->delete_registration($event, $registration->id);

      $remaining = $deletion_result['remaining'];
      $waiting_picked = $deletion_result['waiting_picked'];

      $user_email = get_user_email($event, $registration->values);

      if (count($user_email) > 0) {
        WPOE_Mail_Sender::send_registration_deleted_confirmation($event, $user_email);
      }
      if ($event->adminEmail !== null) {
        WPOE_Mail_Sender::send_registration_deleted_to_admin($event);
      }
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
        if ($event->adminEmail !== null) {
          WPOE_Mail_Sender::send_registrations_picked_from_waiting_list_to_admin($event, $waiting_picked);
        }
      }

      return new WP_REST_Response([
        'remaining' => $remaining
      ]);
    } catch (Exception $ex) {
      return generic_server_error($ex);
    }
  }
}
