<?php
/*
 * Plugin Name: RegiFair
 * Plugin URI: https://zonia3000.github.io/regi-fair/
 * Author: Sonia Zorba
 * Author URI: https://www.zonia3000.net
 * Version: 1.0.3
 * License: GPLv3 or later
 * License URI: https://www.gnu.org/licenses/gpl-3.0.html
 * Description: Free and open source plugin to manage events registrations. Provides form builder, waiting lists, group registrations and email notifications. Works with Gutenberg blocks.
 * Text Domain: regi-fair
 * Domain Path: /languages
 */

if (!defined('ABSPATH')) {
  die();
}

define('REGI_FAIR_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('REGI_FAIR_ROOT_PATH', __FILE__);

require_once(REGI_FAIR_PLUGIN_DIR . 'classes/admin/create-admin-menu.php');
add_action('admin_menu', ['REGI_FAIR_Admin_Panel_Pages', 'create_menu']);
add_action('admin_enqueue_scripts', ['REGI_FAIR_Admin_Panel_Pages', 'enqueue_scripts']);

add_action('enqueue_block_editor_assets', function () {
  wp_set_script_translations('regi-fair-form-editor-script', 'regi-fair', REGI_FAIR_PLUGIN_DIR . 'languages');
});

require_once(REGI_FAIR_PLUGIN_DIR . 'classes/event-form.php');
add_action('init', ['REGI_FAIR_Form', 'init']);

require_once(REGI_FAIR_PLUGIN_DIR . 'classes/api-utils.php');
require_once(REGI_FAIR_PLUGIN_DIR . 'classes/validators/validator.php');

require_once(REGI_FAIR_PLUGIN_DIR . 'classes/admin/admin-api-events.php');
require_once(REGI_FAIR_PLUGIN_DIR . 'classes/admin/admin-api-templates.php');
require_once(REGI_FAIR_PLUGIN_DIR . 'classes/admin/admin-api-registrations.php');
require_once(REGI_FAIR_PLUGIN_DIR . 'classes/admin/admin-api-settings.php');
require_once(REGI_FAIR_PLUGIN_DIR . 'classes/mail-sender.php');
require_once(REGI_FAIR_PLUGIN_DIR . 'classes/public-api.php');

add_action('rest_api_init', function () {
  (new REGI_FAIR_Templates_Admin_Controller())->register_routes();
});
add_action('rest_api_init', function () {
  (new REGI_FAIR_Events_Admin_Controller())->register_routes();
});
add_action('rest_api_init', function () {
  (new REGI_FAIR_Registrations_Admin_Controller())->register_routes();
});
add_action('rest_api_init', function () {
  (new REGI_FAIR_Settings_Admin_Controller())->register_routes();
});
add_action('rest_api_init', function () {
  (new REGI_FAIR_Public_Controller())->register_routes();
});

require_once(REGI_FAIR_PLUGIN_DIR . 'classes/admin/event-post-mapper.php');
add_action('save_post', ['REGI_FAIR_Event_Post_Mapper', 'save_post_callback'], 10, 3);
add_action('delete_post', ['REGI_FAIR_Event_Post_Mapper', 'delete_post_callback']);

require_once(REGI_FAIR_PLUGIN_DIR . 'classes/admin/db-setup.php');
register_activation_hook(__FILE__, ['REGI_FAIR_DB_Setup', 'create_tables']);
register_uninstall_hook(__FILE__, ['REGI_FAIR_DB_Setup', 'drop_tables']);

// WP-Cron configuration for past events cleanup

add_action('regi_fair_cleanup_cron_hook', 'regi_fair_cleanup_cron_exec');

function regi_fair_cleanup_cron_exec()
{
  try {
    $dao = new REGI_FAIR_DAO_Events();
    $dao->delete_past_events();
  } catch (Exception $ex) {
    if (defined('WP_DEBUG') && WP_DEBUG === true) {
      // phpcs:ignore WordPress.PHP.DevelopmentFunctions
      error_log($ex->getMessage());
    }
  }
}

if (!wp_next_scheduled('regi_fair_cleanup_cron_hook')) {
  wp_schedule_event(time(), 'daily', 'regi_fair_cleanup_cron_hook');
}

register_deactivation_hook(__FILE__, 'regi_fair_deactivate');

function regi_fair_deactivate()
{
  $timestamp = wp_next_scheduled('regi_fair_cleanup_cron_hook');
  wp_unschedule_event($timestamp, 'regi_fair_cleanup_cron_hook');
}

// Testing configuration

if (defined('REGI_FAIR_TESTING') && REGI_FAIR_TESTING === true) {
  // Configures the PHP mailer to send email to mailpit test server
  // Needed only for end-to-end tests
  add_action('phpmailer_init', 'regi_fair_test_phpmailer_smtp');
  function regi_fair_test_phpmailer_smtp($phpmailer)
  {
    $phpmailer->isSMTP();
    $phpmailer->Host = "host.docker.internal";
    $phpmailer->Port = 1025;
  }
}
