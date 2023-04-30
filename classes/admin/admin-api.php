<?php

require_once(WPOE_PLUGIN_DIR . 'classes/model/event.php');
require_once(WPOE_PLUGIN_DIR . 'classes/model/form-field.php');
require_once(WPOE_PLUGIN_DIR . 'classes/dao.php');

class WPOE_Admin_API
{
    public static function init()
    {
        register_rest_route(
            'wpoe/v1',
            '/events',
            [
                'methods' => WP_REST_Server::READABLE,
                'permission_callback' => ['WPOE_Admin_API', 'can_manage_options'],
                'callback' => ['WPOE_Admin_API', 'list_events'],
            ]
        );

        register_rest_route(
            'wpoe/v1',
            '/events/(?P<id>\d+)',
            [
                'methods' => WP_REST_Server::READABLE,
                'args' => [
                    'id' => array(
                        'type' => 'integer',
                        'sanitize_callback' => 'absint'
                    ),
                ],
                'permission_callback' => ['WPOE_Admin_API', 'can_manage_options'],
                'callback' => ['WPOE_Admin_API', 'get_event'],
            ]
        );

        register_rest_route(
            'wpoe/v1',
            '/events',
            [
                'methods' => 'POST',
                'permission_callback' => ['WPOE_Admin_API', 'can_manage_options'],
                'callback' => ['WPOE_Admin_API', 'create_event'],
                'args' => [
                    'name' => array(
                        'type' => 'string',
                        'sanitize_callback' => 'sanitize_text_field'
                    ),
                    'date' => array(
                        'type' => 'string',
                        'sanitize_callback' => 'sanitize_text_field'
                    ),
                    'autoremove' => array(
                        'type' => 'boolean',
                        'sanitize_callback' => 'rest_sanitize_boolean'
                    ),
                    'autoremovePeriod' => array(
                        'type' => 'integer',
                        'sanitize_callback' => 'absint'
                    ),
                    'formFields' => array(
                        'type' => 'array',
                        'sanitize_callback' => 'rest_sanitize_request_arg'
                    )
                ]
            ]
        );
    }

    public static function list_events()
    {
        wp_send_json(WPOE_DAO::list_events());
        wp_die();
    }

    public static function get_event(WP_REST_Request $request)
    {
        $id = (int) $request->get_param('id');
        wp_send_json(WPOE_DAO::get_event($id));
        wp_die();
    }

    public static function create_event(WP_REST_Request $request)
    {
        $event = new Event;

        if ($request->get_param('name') !== null) {
            $event->name = $request->get_param('name');
        }
        if ($request->get_param('date') !== null) {
            $event->date = $request->get_param('date');
        }
        if ($request->get_param('autoremove') !== null) {
            $event->autoremove = (bool) $request->get_param('autoremove');
        }
        if ($request->get_param('autoremovePeriod') !== null) {
            $event->autoremovePeriod = (int) $request->get_param('autoremovePeriod');
        }
        if ($request->get_param('formFields') !== null) {
            $event->formFields = (array) $request->get_param('formFields');
        }

        $event_id = WPOE_DAO::create_event($event);
        wp_send_json(['id' => $event_id]);
        wp_die();
    }

    public static function can_manage_options()
    {
        return current_user_can('manage_options');
    }
}