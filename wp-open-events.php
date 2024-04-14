<?php
/*
 * Plugin Name: WP Open Events
 * Author: Sonia Zorba
 * Author URI: https://github.com/zonia3000
 * Version: 0.0.1
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

require_once (WPOE_PLUGIN_DIR . 'classes/create-admin-menu.php');
add_action('admin_menu', ['WPOE_Admin_Panel_Pages', 'create_menu']);
add_action('admin_enqueue_scripts', ['WPOE_Admin_Panel_Pages', 'enqueue_scripts']);

add_action('enqueue_block_editor_assets', function () {
    wp_set_script_translations('wp-open-events-form-editor-script', 'wp-open-events', WPOE_PLUGIN_DIR . 'languages');
});

require_once (WPOE_PLUGIN_DIR . 'classes/event-form.php');
add_action('init', ['WPOE_Form', 'init']);

require_once (WPOE_PLUGIN_DIR . 'classes/api-utils.php');

require_once (WPOE_PLUGIN_DIR . 'classes/admin/admin-api.php');
add_action('rest_api_init', ['WPOE_Admin_API', 'init']);

require_once (WPOE_PLUGIN_DIR . 'classes/public-api.php');
add_action('rest_api_init', ['WPOE_Public_API', 'init']);

require_once (WPOE_PLUGIN_DIR . 'classes/admin/db-setup.php');
register_activation_hook(__FILE__, ['WPOE_DB_Setup', 'create_tables']);
register_uninstall_hook(__FILE__, ['WPOE_DB_Setup', 'drop_tables']);
