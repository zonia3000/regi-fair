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
    }

    /**
     * @param WP_REST_Request $request
     * @return WP_Error|WP_REST_Response
     */
    public function get_item($request)
    {
        $id = (int) $request->get_param('id');
        return new WP_REST_Response($this->events_dao->get_public_event_data($id));
    }

    /**
     * @param WP_REST_Request $request
     * @return WP_Error|WP_REST_Response
     */
    public function create_item($request)
    {
        $event_id = (int) $request->get_param('id');
        $event = $this->events_dao->get_event($event_id);

        if ($event === null) {
            return new WP_Error('event_not_found', __('Event not found', 'wp-open-events'), ['status' => 400]);
        }

        $input = json_decode($request->get_body());
        if (count($input) !== count($event->formFields)) {
            return new WP_Error('invalid_form_fields', __('Invalid form field number', 'wp-open-events'), ['status' => 400]);
        }

        // TODO: validation

        $values = [];
        $i = 0;
        $user_email = [];
        foreach ($event->formFields as $field) {
            $values[$field->id] = $input[$i];
            if ($field->fieldType === 'email' && $field->extra !== null && property_exists($field->extra, 'confirmationAddress') && $field->extra->confirmationAddress === true) {
                $user_email[] = $input[$i];
            }
            $i++;
        }

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

        return new WP_REST_Response(['remaining' => $remaining_seats]);
    }
}
