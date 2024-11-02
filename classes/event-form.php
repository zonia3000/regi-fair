<?php

class REGI_FAIR_Form
{
  public static function init()
  {
    register_block_type(
      REGI_FAIR_PLUGIN_DIR . '/js/build/block',
      array(
        'render_callback' => array('REGI_FAIR_Form', 'render_block')
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
    REGI_FAIR_Form::enqueue_scripts();
    return '<div id="' . esc_attr('regi-fair-form-' . $event_id) . '" data-regi-fair-event-id="' . esc_attr($event_id) . '"></div>';
  }

  private static function enqueue_scripts()
  {
    $script = 'regi-fair-users';

    wp_enqueue_script(
      $script,
      plugins_url('js/build/components/users.js', REGI_FAIR_ROOT_PATH),
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