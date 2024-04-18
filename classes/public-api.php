<?php

class WPOE_Public_API
{
    public static function init()
    {
        register_rest_route(
            'wpoe/v1',
            '/events/(?P<id>\d+)',
            [
                'methods' => 'GET',
                'callback' => ['WPOE_Public_API', 'get_event'],
                'permission_callback' => '__return_true'
            ]
        );

        register_rest_route(
            'wpoe/v1',
            '/events/(?P<id>\d+)/register',
            [
                'methods' => 'POST',
                'callback' => ['WPOE_Public_API', 'register_to_event'],
                'permission_callback' => '__return_true'
            ]
        );
    }

    public static function register_to_event(WP_REST_Request $request)
    {
        $event_id = (int) $request->get_param('id');
        $event = WPOE_DAO_Events::get_event($event_id);

        if ($event === null) {
            return new WP_REST_Response(['error' => __('Event not found', 'wp-open-events')], 400);
        }

        $input = json_decode($request->get_body());
        if (count($input) !== count($event->formFields)) {
            return new WP_REST_Response(['error' => 'Invalid form field number'], 400);
        }

        // TODO: validation

        $values = [];
        $i = 0;
        foreach ($event->formFields as $field) {
            $values[$field->id] = $input[$i];
            $i++;
        }

        $registration_token = bin2hex(openssl_random_pseudo_bytes(16));

        $remaining_seats = WPOE_DAO_Events::register_to_event($event_id, md5($registration_token), $values);

        return new WP_REST_Response(['remaining' => $remaining_seats]);
    }

    public static function get_event(WP_REST_Request $request)
    {
        $id = (int) $request->get_param('id');
        return new WP_REST_Response(WPOE_DAO_Events::get_public_event_data($id));
    }
}