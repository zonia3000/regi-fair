<?php

class WPOE_Admin_Panel_Pages
{
  public static function create_menu()
  {
    add_menu_page(
      __('Events'),
      __('Events', 'wp-open-events'),
      'manage_options',
      'wpoe-events',
      function () {
        echo '<div id="wpoe-events"></div>';
      }
    );

    add_submenu_page(
      'wpoe-events',
      'wpoe-templates',
      __('Templates', 'wp-open-events'),
      'manage_options',
      'wpoe-templates',
      function () {
        echo '<div id="wpoe-templates"></div>';
      }
    );

    add_submenu_page(
      'wpoe-events',
      'wpoe-settings',
      __('Settings', 'wp-open-events'),
      'manage_options',
      'wpoe-settings',
      function () {
        echo '<div id="wpoe-settings"></div>';
      }
    );
  }

  public static function enqueue_scripts($hook)
  {
    if (str_contains($hook, 'wpoe-events')) {
      $page = 'events';
    } else if (str_contains($hook, 'wpoe-templates')) {
      $page = 'templates';
    } else if (str_contains($hook, 'wpoe-settings')) {
      $page = 'settings';
    } else {
      return;
    }

    $script = 'wpoe-' . $page;

    wp_enqueue_script(
      $script,
      plugins_url('js/build/components/' . $page . '.js', WPOE_ROOT_PATH),
      ['react', 'react-dom', 'wp-components', 'wp-i18n', 'wp-api-fetch'],
      '0.0.1',
      true
    );
    wp_enqueue_style('wp-components');

    wp_set_script_translations($script, 'wp-open-events', WPOE_PLUGIN_DIR . 'languages');

    wp_localize_script(
      $script,
      'wpoe_request',
      array(
        'nonce' => wp_create_nonce('wp_rest'),
        'rest_url' => rest_url()
      )
    );
  }
}