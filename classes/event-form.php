<?php

class WPOE_Form
{
  public static function init()
  {
    register_block_type(
      WPOE_PLUGIN_DIR . '/js/build/block',
      array(
        'render_callback' => array('WPOE_Form', 'render_block')
      )
    );
  }

  public static function render_block(array $properties)
  {
    if (isset($properties['eventId'])) {
      $event_id = $properties['eventId'];
    } else {
      $event_id = '';
    }
    WPOE_Form::enqueue_scripts();
    return '<div id="wpoe-form" data-event-id="' . $event_id . '"></div>';
  }

  private static function enqueue_scripts()
  {
    $script = 'wpoe-users';

    wp_enqueue_script(
      $script,
      plugins_url('js/build/components/users.js', WPOE_ROOT_PATH),
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