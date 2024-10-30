<?php
/*
 * Plugin Name: WP Open Events
 * Plugin URI: https://zonia3000.github.io/wp-open-events/
 * Author: Sonia Zorba
 * Author URI: https://www.zonia3000.net
 * Version: 0.1.0
 * License: GPLv3 or later
 * License URI: https://www.gnu.org/licenses/gpl-3.0.html
 * Description: Open source plugin to manage event registration forms
 * Text Domain: wp-open-events
 * Domain Path: /languages
 */

if (!defined('ABSPATH')) {
  die();
}

define('WPOE_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('WPOE_ROOT_PATH', __FILE__);

add_action('plugins_loaded', function () {
  load_plugin_textdomain('wp-open-events', false, dirname(plugin_basename(__FILE__)) . '/languages/');
});

require_once(WPOE_PLUGIN_DIR . 'classes/admin/create-admin-menu.php');
add_action('admin_menu', ['WPOE_Admin_Panel_Pages', 'create_menu']);
add_action('admin_enqueue_scripts', ['WPOE_Admin_Panel_Pages', 'enqueue_scripts']);

add_action('enqueue_block_editor_assets', function () {
  wp_set_script_translations('wp-open-events-form-editor-script', 'wp-open-events', WPOE_PLUGIN_DIR . 'languages');
});

require_once(WPOE_PLUGIN_DIR . 'classes/event-form.php');
add_action('init', ['WPOE_Form', 'init']);

require_once(WPOE_PLUGIN_DIR . 'classes/api-utils.php');
require_once(WPOE_PLUGIN_DIR . 'classes/validators/validator.php');

require_once(WPOE_PLUGIN_DIR . 'classes/admin/admin-api-events.php');
require_once(WPOE_PLUGIN_DIR . 'classes/admin/admin-api-templates.php');
require_once(WPOE_PLUGIN_DIR . 'classes/admin/admin-api-registrations.php');
require_once(WPOE_PLUGIN_DIR . 'classes/admin/admin-api-settings.php');
require_once(WPOE_PLUGIN_DIR . 'classes/mail-sender.php');
require_once(WPOE_PLUGIN_DIR . 'classes/public-api.php');

add_action('rest_api_init', function () {
  (new WPOE_Templates_Admin_Controller())->register_routes();
});
add_action('rest_api_init', function () {
  (new WPOE_Events_Admin_Controller())->register_routes();
});
add_action('rest_api_init', function () {
  (new WPOE_Registrations_Admin_Controller())->register_routes();
});
add_action('rest_api_init', function () {
  (new WPOE_Settings_Admin_Controller())->register_routes();
});
add_action('rest_api_init', function () {
  (new WPOE_Public_Controller())->register_routes();
});

require_once(WPOE_PLUGIN_DIR . 'classes/admin/event-post-mapper.php');
add_action('save_post', ['WPOE_Event_Post_Mapper', 'save_post_callback'], 10, 3);
add_action('delete_post', ['WPOE_Event_Post_Mapper', 'delete_post_callback']);

require_once(WPOE_PLUGIN_DIR . 'classes/admin/db-setup.php');
register_activation_hook(__FILE__, ['WPOE_DB_Setup', 'create_tables']);
register_uninstall_hook(__FILE__, ['WPOE_DB_Setup', 'drop_tables']);

// WP-Cron configuration for past events cleanup

add_action('wpoe_cleanup_cron_hook', 'wpoe_cleanup_cron_exec');

function wpoe_cleanup_cron_exec()
{
  try {
    $dao = new WPOE_DAO_Events();
    $dao->delete_past_events();
  } catch (Exception $ex) {
    error_log($ex->getMessage());
  }
}

if (!wp_next_scheduled('wpoe_cleanup_cron_hook')) {
  wp_schedule_event(time(), 'daily', 'wpoe_cleanup_cron_hook');
}

register_deactivation_hook(__FILE__, 'wpoe_deactivate');

function wpoe_deactivate()
{
  $timestamp = wp_next_scheduled('wpoe_cleanup_cron_hook');
  wp_unschedule_event($timestamp, 'wpoe_cleanup_cron_hook');
}

// Testing configuration

if (defined('WPOE_TESTING') && WPOE_TESTING === true) {
  // Configures the PHP mailer to send email to mailpit test server
  // Needed only for end-to-end tests
  add_action('phpmailer_init', 'test_phpmailer_smtp');
  function test_phpmailer_smtp($phpmailer)
  {
    $phpmailer->isSMTP();
    $phpmailer->Host = "host.docker.internal";
    $phpmailer->Port = 1025;
  }
}
