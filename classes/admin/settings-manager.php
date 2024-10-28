<?php

if (!defined('ABSPATH')) {
  exit;
}

class WPOE_Settings_Manager
{
  private static function get_default_settings(): array
  {
    $from_email = WPOE_Settings_Manager::get_default_from_email();
    return [
      'defaultAdminEmail' => '',
      'defaultAutoremovePeriod' => 30,
      'defaultExtraEmailContent' => '',
      'fromEmail' => $from_email
    ];
  }

  private static function get_default_from_email(): string
  {
    $sitename = wp_parse_url(network_home_url(), PHP_URL_HOST);
    if ($sitename === false) {
      return '';
    }
    // Remove www
    if (str_starts_with($sitename, 'www.')) {
      $sitename = substr($sitename, 4);
    }
    return 'noreply@' . $sitename;
  }

  public static function get_settings(): array
  {
    $settings_value = get_option('wpoe_settings');
    if ($settings_value === false) {
      $settings = WPOE_Settings_Manager::get_default_settings();
    } else {
      $settings = (array) json_decode($settings_value);
    }
    return array_merge(WPOE_Settings_Manager::get_default_settings(), $settings);
  }

  public static function update_settings(array $settings_to_update): array
  {
    $old_settings_value = get_option('wpoe_settings');
    if ($old_settings_value === false) {
      $old_settings = WPOE_Settings_Manager::get_default_settings();
    } else {
      $old_settings = array_merge(WPOE_Settings_Manager::get_default_settings(), (array) json_decode($old_settings_value));
    }

    $new_settings = array_merge($old_settings, $settings_to_update);
    if ($old_settings_value === false) {
      add_option('wpoe_settings', json_encode($new_settings));
    } else {
      update_option('wpoe_settings', json_encode($new_settings));
    }
    return $new_settings;
  }
}
