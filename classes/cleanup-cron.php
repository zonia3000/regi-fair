<?php

if (!defined('ABSPATH')) {
  exit;
}

require_once(REGI_FAIR_PLUGIN_DIR . 'classes/dao/dao-events.php');

class REGI_FAIR_Cleanup_Cron {

  static function do_cleanup()
  {
    try {
      $dao = new REGI_FAIR_DAO_Events();

      $events = $dao->get_events_for_autoremove();

      foreach ($events['remove_submissions'] as $event_id) {
        $dao->delete_submissions($event_id);
      }
      foreach ($events['remove_event'] as $event_id) {
        $dao->delete_event($event_id);
      }
    } catch (Exception $ex) {
      if (defined('WP_DEBUG') && WP_DEBUG === true) {
        // phpcs:ignore WordPress.PHP.DevelopmentFunctions
        error_log($ex->getMessage());
      }
    }
  }
}
