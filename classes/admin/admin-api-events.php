<?php

require_once (WPOE_PLUGIN_DIR . 'classes/model/event.php');
require_once (WPOE_PLUGIN_DIR . 'classes/model/form-field.php');
require_once (WPOE_PLUGIN_DIR . 'classes/dao/dao-events.php');
require_once (WPOE_PLUGIN_DIR . 'classes/api-utils.php');

class WPOE_Admin_API_Events
{
    public static function init()
    {
        register_rest_route(
            'wpoe/v1',
            '/admin/events',
            [
                'methods' => WP_REST_Server::READABLE,
                'permission_callback' => 'is_events_admin',
                'callback' => ['WPOE_Admin_API_Events', 'list_events'],
            ]
        );

        register_rest_route(
            'wpoe/v1',
            '/admin/events/(?P<id>\d+)',
            [
                'methods' => WP_REST_Server::READABLE,
                'args' => [
                    'id' => array(
                        'type' => 'integer',
                        'sanitize_callback' => 'absint'
                    ),
                ],
                'permission_callback' => 'is_events_admin',
                'callback' => ['WPOE_Admin_API_Events', 'get_event'],
            ]
        );

        register_rest_route(
            'wpoe/v1',
            '/admin/events',
            [
                'methods' => 'POST',
                'permission_callback' => 'is_events_admin',
                'callback' => ['WPOE_Admin_API_Events', 'create_event'],
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
                    'maxParticipants' => array(
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

        register_rest_route(
            'wpoe/v1',
            '/admin/events/(?P<id>\d+)',
            [
                'methods' => WP_REST_Server::DELETABLE,
                'args' => [
                    'id' => array(
                        'type' => 'integer',
                        'sanitize_callback' => 'absint'
                    ),
                ],
                'permission_callback' => 'is_events_admin',
                'callback' => ['WPOE_Admin_API_Events', 'delete_event'],
            ]
        );
    }

    public static function list_events()
    {
        try {
            return new WP_REST_Response(WPOE_DAO_Events::list_events());
        } catch (Exception $ex) {
            return generic_server_error($ex);
        }
    }

    public static function get_event(WP_REST_Request $request)
    {
        try {
            $id = (int) $request->get_param('id');
            return new WP_REST_Response(WPOE_DAO_Events::get_event($id));
        } catch (Exception $ex) {
            return generic_server_error($ex);
        }
    }

    public static function create_event(WP_REST_Request $request)
    {
        try {
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

            $event_id = WPOE_DAO_Events::create_event($event);
            return new WP_REST_Response(['id' => $event_id]);
        } catch (Exception $ex) {
            return generic_server_error($ex);
        }
    }

    public static function delete_event(WP_REST_Request $request)
    {
        try {
            $id = (int) $request->get_param('id');
            WPOE_DAO_Events::delete_event($id);
            return new WP_REST_Response(null, 204);
        } catch (Exception $ex) {
            return generic_server_error($ex);
        }
    }
}
