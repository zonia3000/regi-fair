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
            ]
        );

        register_rest_route(
            'wpoe/v1',
            '/events/(?P<id>\d+)/register',
            [
                'methods' => 'POST',
                'callback' => ['WPOE_Public_API', 'register_to_event'],
            ]
        );
    }

    public static function register_to_event(WP_REST_Request $request)
    {
        $event_id = (int) $request->get_param('id');
        $event = WPOE_DAO::get_event($event_id);

        if ($event === null) {
            $response = new WP_REST_Response(array('error' => 'Bad Request: event not found'));
            $response->set_status(400);
            return $response;
        }

        $input = json_decode($request->get_body());
        if (count($input) !== count($event->formFields)) {
            $response = new WP_REST_Response(array('error' => 'Bad Request: invalid form field number'));
            $response->set_status(400);
            return $response;
        }

        // TODO: validation

        $values = [];
        $i = 0;
        foreach ($event->formFields as $field) {
            $values[$field->id] = $input[$i];
            $i++;
        }

        $registration_token = bin2hex(openssl_random_pseudo_bytes(16));

        $remaining_seats = WPOE_DAO::register_to_event($event_id, md5($registration_token), $values);

        $response = new WP_REST_Response(array('remaining' => $remaining_seats));
        $response->set_status(200);
        return $response;
    }

    public static function get_event(WP_REST_Request $request)
    {
        $id = (int) $request->get_param('id');
        wp_send_json(WPOE_DAO::get_public_event_data($id));
        wp_die();
    }
}