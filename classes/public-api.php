<?php

if (!defined('ABSPATH')) {
    die();
}

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
        return new WP_REST_Response($event);
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

            if ($event === null) {
                return new WP_Error('event_not_found', __('Event not found', 'wp-open-events'), ['status' => 400]);
            }

            $input = json_decode($request->get_body());
            $error = $this->validate_request($event, $input);
            if ($error !== null) {
                return $error;
            }

            $values = $this->map_input_to_values($event, $input);
            $user_email = $this->get_user_email($event, $input);

            $registration_token = bin2hex(openssl_random_pseudo_bytes(16));

            $remaining_seats = $this->registrations_dao->register_to_event($event_id, md5($registration_token), $values, $event->maxParticipants);
            if ($remaining_seats === false) {
                return new WP_Error('no_more_seats', __('No more seats available', 'wp-open-events'), ['status' => 400]);
            }

            if (count($user_email) > 0) {
                WPOE_Mail_Sender::send_registration_confirmation($event, $user_email, $registration_token, $values);
            }
            if ($event->adminEmail !== null) {
                WPOE_Mail_Sender::send_new_registration_to_admin($event, $values);
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

            if ($event === null) {
                return new WP_Error('event_not_found', __('Event not found', 'wp-open-events'), ['status' => 400]);
            }

            if (!$event->editableRegistrations) {
                return new WP_Error('registrations_not_editable', __('This event doesn\'t allow to edit the registrations', 'wp-open-events'), ['status' => 403]);
            }

            $token = $request->get_param('registration_token');
            $registration = $this->registrations_dao->get_registration(md5($token));
            if ($registration === null) {
                return new WP_Error('registration_not_found', __('Registration not found', 'wp-open-events'), ['status' => 400]);
            }

            $input = json_decode($request->get_body());
            $error = $this->validate_request($event, $input);
            if ($error !== null) {
                return $error;
            }

            $values = $this->map_input_to_values($event, $input);
            $user_email = $this->get_user_email($event, $input);

            $remaining = $this->registrations_dao->update_registration($registration['id'], $values, $event_id, $event->maxParticipants);

            if (count($user_email) > 0) {
                WPOE_Mail_Sender::send_registration_updated_confirmation($event, $user_email, $token, $values);
            }
            if ($event->adminEmail !== null) {
                WPOE_Mail_Sender::send_registration_updated_to_admin($event, $values);
            }

            return new WP_REST_Response([
                'remaining' => $remaining
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
            $registration = $this->registrations_dao->get_registration(md5($token));
            if ($registration === null) {
                return new WP_Error('registration_not_found', __('Registration not found', 'wp-open-events'), ['status' => 404]);
            }
            return new WP_REST_Response($registration['values']);
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
            $registration = $this->registrations_dao->get_registration(md5($token));
            if ($registration === null) {
                return new WP_Error('registration_not_found', __('Registration not found', 'wp-open-events'), ['status' => 400]);
            }

            $remaining = $this->registrations_dao->delete_registration($registration['id'], $event_id, $event->maxParticipants);

            $user_email = $this->get_user_email($event, $registration['values']);

            if (count($user_email) > 0) {
                WPOE_Mail_Sender::send_registration_deleted_confirmation($event, $user_email);
            }
            if ($event->adminEmail !== null) {
                WPOE_Mail_Sender::send_registration_deleted_to_admin($event);
            }

            return new WP_REST_Response([
                'remaining' => $remaining
            ]);
        } catch (Exception $ex) {
            return generic_server_error($ex);
        }
    }

    private function map_input_to_values(WPOE_Event $event, array $input): array
    {
        $values = [];
        $i = 0;
        foreach ($event->formFields as $field) {
            $values[$field->id] = $input[$i];
            $i++;
        }
        return $values;
    }

    private function get_user_email(WPOE_Event $event, array $input): array
    {
        $i = 0;
        $user_email = [];
        foreach ($event->formFields as $field) {
            if ($field->fieldType === 'email' && $field->extra !== null && property_exists($field->extra, 'confirmationAddress') && $field->extra->confirmationAddress === true) {
                $user_email[] = $input[$i];
            }
            $i++;
        }
        return $user_email;
    }

    private function validate_request(WPOE_Event $event, $input): WP_Error|WP_REST_Response|null
    {
        if (!is_array($input)) {
            return new WP_Error('invalid_form_fields', __('The payload must be an array', 'wp-open-events'), ['status' => 400]);
        }
        if (count($input) !== count($event->formFields)) {
            return new WP_Error('invalid_form_fields', __('Invalid number of fields', 'wp-open-events'), ['status' => 400]);
        }

        $errors = [];
        foreach ($event->formFields as $index => $field) {
            try {
                WPOE_Validator::validate($field, $input[$index]);
            } catch (WPOE_Validation_Exception $ex) {
                $errors[$index] = $ex->getMessage();
            }
        }
        if (count($errors) > 0) {
            return new WP_REST_Response([
                'code' => 'invalid_form_fields',
                'message' => __('Some fields are not valid', 'wp-open-events'),
                'data' => [
                    'status' => 400,
                    'fieldsErrors' => (object) $errors
                ]
            ], 400);
        }
        return null;
    }
}
