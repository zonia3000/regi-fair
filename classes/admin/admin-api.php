<?php

require_once (WPOE_PLUGIN_DIR . 'classes/model/event.php');
require_once (WPOE_PLUGIN_DIR . 'classes/model/form-field.php');
require_once (WPOE_PLUGIN_DIR . 'classes/dao.php');

class WPOE_Admin_API
{
    public static function init()
    {
        register_rest_route(
            'wpoe/v1',
            '/admin/events',
            [
                'methods' => WP_REST_Server::READABLE,
                'permission_callback' => ['WPOE_Admin_API', 'is_events_admin'],
                'callback' => ['WPOE_Admin_API', 'list_events'],
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
                'permission_callback' => ['WPOE_Admin_API', 'is_events_admin'],
                'callback' => ['WPOE_Admin_API', 'get_event'],
            ]
        );

        register_rest_route(
            'wpoe/v1',
            '/admin/events',
            [
                'methods' => 'POST',
                'permission_callback' => ['WPOE_Admin_API', 'is_events_admin'],
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
                'permission_callback' => ['WPOE_Admin_API', 'is_events_admin'],
                'callback' => ['WPOE_Admin_API', 'delete_event'],
            ]
        );

        register_rest_route(
            'wpoe/v1',
            '/admin/templates',
            [
                'methods' => WP_REST_Server::READABLE,
                'permission_callback' => ['WPOE_Admin_API', 'is_events_admin'],
                'callback' => ['WPOE_Admin_API', 'list_event_templates'],
            ]
        );

        register_rest_route(
            'wpoe/v1',
            '/admin/templates/(?P<id>\d+)',
            [
                'methods' => WP_REST_Server::READABLE,
                'args' => [
                    'id' => array(
                        'type' => 'integer',
                        'sanitize_callback' => 'absint'
                    ),
                ],
                'permission_callback' => ['WPOE_Admin_API', 'is_events_admin'],
                'callback' => ['WPOE_Admin_API', 'get_event_template'],
            ]
        );

        register_rest_route(
            'wpoe/v1',
            '/admin/templates',
            [
                'methods' => 'POST',
                'permission_callback' => ['WPOE_Admin_API', 'is_events_admin'],
                'callback' => ['WPOE_Admin_API', 'create_event_template'],
                'args' => [
                    'templateName' => array(
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
                    'waitingList' => array(
                        'type' => 'boolean',
                        'sanitize_callback' => 'rest_sanitize_boolean'
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
            '/admin/templates/(?P<id>\d+)',
            [
                'methods' => WP_REST_Server::DELETABLE,
                'args' => [
                    'id' => array(
                        'type' => 'integer',
                        'sanitize_callback' => 'absint'
                    ),
                ],
                'permission_callback' => ['WPOE_Admin_API', 'is_events_admin'],
                'callback' => ['WPOE_Admin_API', 'delete_event_template'],
            ]
        );
    }

    public static function list_events()
    {
        try {
            return new WP_REST_Response(WPOE_DAO::list_events());
        } catch (Exception $ex) {
            return generic_server_error($ex);
        }
    }

    public static function get_event(WP_REST_Request $request)
    {
        try {
            $id = (int) $request->get_param('id');
            return new WP_REST_Response(WPOE_DAO::get_event($id));
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

            $event_id = WPOE_DAO::create_event($event);
            return new WP_REST_Response(['id' => $event_id]);
        } catch (Exception $ex) {
            return generic_server_error($ex);
        }
    }

    public static function delete_event(WP_REST_Request $request)
    {
        try {
            $id = (int) $request->get_param('id');
            WPOE_DAO::delete_event($id);
            return new WP_REST_Response(null, 204);
        } catch (Exception $ex) {
            return generic_server_error($ex);
        }
    }

    public static function list_event_templates(WP_REST_Request $request)
    {
        try {
            return new WP_REST_Response(WPOE_DAO::list_event_templates());
        } catch (Exception $ex) {
            return generic_server_error($ex);
        }
    }

    public static function get_event_template(WP_REST_Request $request)
    {
        try {
            $id = (int) $request->get_param('id');
            $template = WPOE_DAO::get_event_template($id);
            if ($template === null) {
                return new WP_REST_Response(['error' => __('Event template not found', 'wp-open-events')], 404);
            }
            return new WP_REST_Response($template);
        } catch (Exception $ex) {
            return generic_server_error($ex);
        }
    }

    public static function create_event_template(WP_REST_Request $request)
    {
        try {
            $event_template = new EventTemplate;

            if ($request->get_param('name') !== null) {
                $event_template->name = $request->get_param('name');
            }
            if ($request->get_param('autoremove') !== null) {
                $event_template->autoremove = (bool) $request->get_param('autoremove');
            }
            if ($request->get_param('autoremovePeriod') !== null) {
                $event_template->autoremovePeriod = (int) $request->get_param('autoremovePeriod');
            }
            if ($request->get_param('waitingList') !== null) {
                $event_template->waitingList = (bool) $request->get_param('waitingList');
            }
            if ($request->get_param('formFields') !== null) {
                $event_template->formFields = (array) $request->get_param('formFields');
            }

            $event_id = WPOE_DAO::create_event_template($event_template);
            return new WP_REST_Response(['id' => $event_id]);
        } catch (Exception $ex) {
            return generic_server_error($ex);
        }
    }

    public static function delete_event_template(WP_REST_Request $request)
    {
        try {
            $id = (int) $request->get_param('id');
            WPOE_DAO::delete_event_template($id);
            return new WP_REST_Response(null, 204);
        } catch (Exception $ex) {
            return generic_server_error($ex);
        }
    }

    public static function is_events_admin()
    {
        return current_user_can('manage_options');
    }
}
