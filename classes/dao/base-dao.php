<?php

class WPOE_Base_DAO
{
  public function __construct()
  {
    global $wpdb;
    // Errors are explicitly checked and converted to exceptions in order to preserve API JSON output
    // (otherwise <div id="error"> could be printed at the beginning of the response payload)
    $wpdb->hide_errors();
  }

  /**
   * Used to check the result of the wpdb functions insert, update, delete and query.
   * Those functions return false in case of failure. An exception is thrown by this
   * method if that happens.
   */
  protected function check_result(int|bool $result, string $description)
  {
    global $wpdb;
    if ($result === false) {
      if (defined('WP_DEBUG') && WP_DEBUG === true) {
        if ($wpdb->last_error) {
          // phpcs:ignore WordPress.PHP.DevelopmentFunctions
          error_log($wpdb->last_error);
        } else {
          // phpcs:ignore WordPress.PHP.DevelopmentFunctions
          error_log('The last query returned an error: ' . $wpdb->last_query);
        }
      }
      throw new Exception('Error ' . esc_html($description));
    }
  }

  /**
   * Used to check the wpdb field last_error after executing $wpdb->get_results.
   * An exception is thrown by this method if last_error is set.
   */
  protected function check_results(string $description)
  {
    global $wpdb;
    if ($wpdb->last_error) {
      if (defined('WP_DEBUG') && WP_DEBUG === true) {
        // phpcs:ignore WordPress.PHP.DevelopmentFunctions
        error_log($wpdb->last_error);
      }
      throw new Exception('Error ' . esc_html($description));
    }
  }

  /**
   * Used to check the result of the wpdb function get_var. That function retuns null
   * in case of failure. An exception is thrown by this method if that happens.
   */
  protected function check_var(string|null $var, string $description)
  {
    global $wpdb;
    if ($var === null) {
      if (defined('WP_DEBUG') && WP_DEBUG === true) {
        if ($wpdb->last_error) {
          // phpcs:ignore WordPress.PHP.DevelopmentFunctions
          error_log($wpdb->last_error);
        } else {
          // phpcs:ignore WordPress.PHP.DevelopmentFunctions
          error_log('The last query returned an error: ' . $wpdb->last_query);
        }
      }
      throw new Exception('Error ' . esc_html($description));
    }
  }
}
