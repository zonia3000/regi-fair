<?php
/*
 * Plugin Name: WP Open Events
 * Author: Sonia Zorba
 * Author URI: https://github.com/zonia3000
 * Version: 0.0.1
 * Description: Open source plugin to manage event registration forms
 * Text-Domain: wp-open-events
 * Domain Path: /languages
 */

if (!defined('ABSPATH')) {
    die();
}

add_action('admin_menu', 'create_admin_menu');

add_action('plugins_loaded', function () {
    load_plugin_textdomain('wp-open-events', false, dirname(plugin_basename(__FILE__)) . '/languages/');
});

function create_admin_menu()
{
    add_menu_page(
        __('Events'),
        __('Events', 'wp-open-events'),
        'manage_options',
        'wpoe-dashboard',
        function () {
            echo '<div id="wpoe-dashboard"></div>';
        }
    );

    add_submenu_page(
        'wpoe-dashboard',
        'wpoe-settings',
        __('Settings', 'wp-open-events'),
        'manage_options',
        'wpoe-settings',
        function () {
            echo '<div id="wpoe-settings"></div>';
        }
    );
}

add_action('admin_enqueue_scripts', function ($hook) {

    if (str_contains($hook, 'wpoe-dashboard')) {
        $page = 'dashboard';
    } else if (str_contains($hook, 'wpoe-settings')) {
        $page = 'settings';
    } else {
        return;
    }

    $script = $page . 'script';

    wp_enqueue_script(
        $script,
        plugins_url('js/build/components/' . $page . '.js', __FILE__),
        ['wp-i18n'],
        '0.0.1',
        true
    );

    wp_set_script_translations($script, 'wp-open-events', plugin_dir_path(__FILE__) . 'languages');

    wp_localize_script(
        $script,
        'wpoe_request',
        array(
            'nonce' => wp_create_nonce('wp_rest'),
            'rest_url' => rest_url()
        )
    );
});

function render_block_wp_open_events_form()
{
    return 'TODO';
}

add_action('init', function () {
    register_block_type(
        __DIR__ . '/js/build/block',
        array(
            'render_callback' => 'render_block_wp_open_events_form'
        )
    );
});