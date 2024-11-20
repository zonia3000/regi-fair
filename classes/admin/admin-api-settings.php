<?php

if (!defined('ABSPATH')) {
  exit;
}

require_once(REGI_FAIR_PLUGIN_DIR . 'classes/admin/settings-manager.php');

class REGI_FAIR_Settings_Admin_Controller extends WP_REST_Controller
{
  public function register_routes()
  {
    $namespace = 'regifair/v1';

    register_rest_route(
      $namespace,
      '/admin/settings',
      [
        [
          'methods' => WP_REST_Server::READABLE,
          'permission_callback' => ['REGI_FAIR_API_Utils', 'is_events_admin'],
          'callback' => [$this, 'get_item']
        ],
        [
          'methods' => WP_REST_Server::EDITABLE,
          'permission_callback' => ['REGI_FAIR_API_Utils', 'is_events_admin'],
          'callback' => [$this, 'update_item'],
          'args' => $this->get_endpoint_args_for_item_schema()
        ],
        'schema' => [$this, 'get_item_schema']
      ]
    );
  }

  /**
   * @param WP_REST_Request $request
   * @return WP_Error|WP_REST_Response
   */
  public function get_item($request)
  {
    $settings = REGI_FAIR_Settings_Manager::get_settings();
    $settings['privacyPolicyUrl'] = get_privacy_policy_url();
    return new WP_REST_Response($settings);
  }

  /**
   * @param WP_REST_Request $request
   * @return WP_Error|WP_REST_Response
   */
  public function update_item($request)
  {
    $settings_to_update = (array) json_decode($request->get_body());
    $settings_to_update['defaultExtraEmailContent'] = REGI_FAIR_API_Utils::strip_forbidden_html_tags($settings_to_update['defaultExtraEmailContent']);
    $updated_settings = REGI_FAIR_Settings_Manager::update_settings($settings_to_update);
    return new WP_REST_Response($updated_settings);
  }

  public function get_item_schema()
  {
    // Returned cached copy whenever available.
    if ($this->schema) {
      return $this->add_additional_fields_schema($this->schema);
    }

    $schema = parent::get_item_schema();

    $schema['properties']['defaultAdminEmail'] = ['type' => 'string', 'required' => true];
    $schema['properties']['defaultAutoremovePeriod'] = ['type' => 'integer', 'required' => true, 'minimum' => 1];
    $schema['properties']['defaultExtraEmailContent'] = ['type' => 'string', 'required' => true];
    $schema['properties']['fromEmail'] = ['type' => 'string', 'required' => true, 'format' => 'email'];

    // Cache generated schema on endpoint instance.
    $this->schema = $schema;

    return $this->add_additional_fields_schema($this->schema);
  }
}
