<?php

class REGI_FAIR_Admin_Panel_Pages
{
  public static function create_menu()
  {
    add_menu_page(
      __('Events', 'regi-fair'),
      __('Events', 'regi-fair'),
      'manage_options',
      'regi-fair-events',
      function () {
        echo '<div id="regi-fair-events"></div>';
      },
      'dashicons-forms'
    );

    add_submenu_page(
      'regi-fair-events',
      'regi-fair-templates',
      __('Templates', 'regi-fair'),
      'manage_options',
      'regi-fair-templates',
      function () {
        echo '<div id="regi-fair-templates"></div>';
      }
    );

    add_submenu_page(
      'regi-fair-events',
      'regi-fair-settings',
      __('Settings', 'regi-fair'),
      'manage_options',
      'regi-fair-settings',
      function () {
        echo '<div id="regi-fair-settings"></div>';
      }
    );
  }

  public static function enqueue_scripts($hook)
  {
    if (str_contains($hook, 'regi-fair-events')) {
      $page = 'events';
    } else if (str_contains($hook, 'regi-fair-templates')) {
      $page = 'templates';
    } else if (str_contains($hook, 'regi-fair-settings')) {
      $page = 'settings';
    } else {
      return;
    }

    $script = 'regi-fair-' . $page;

    wp_enqueue_script(
      $script,
      plugins_url('js/build/components/' . $page . '.js', REGI_FAIR_ROOT_PATH),
      ['react', 'react-dom', 'wp-components', 'wp-i18n', 'wp-api-fetch'],
      '0.0.1',
      true
    );
    wp_enqueue_style('wp-components');

    wp_set_script_translations($script, 'regi-fair', REGI_FAIR_PLUGIN_DIR . 'languages');

    wp_localize_script(
      $script,
      'regi_fair_request',
      array(
        'nonce' => wp_create_nonce('wp_rest'),
        'rest_url' => rest_url()
      )
    );
  }
}