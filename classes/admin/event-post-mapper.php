<?php

if (!defined('ABSPATH')) {
  die();
}

/**
 * Keeps synchronized the records in the regi_fair_event_post table, where each event is associated with
 * its published posts. The association is used to send the correct post link in the confirmation mail.
 * The link can be used to modify the event registration. The mapping is also used to check if there
 * are multiple pages associated with the same event (discouraged case, reported as warning).
 */
class REGI_FAIR_Event_Post_Mapper
{
  public static function save_post_callback(int $post_id, WP_Post $post, bool $update)
  {
    if ($post->post_type === 'revision') {
      return;
    }
    $blocks = parse_blocks($post->post_content);
    $events_ids = [];
    foreach ($blocks as $block) {
      if (
        array_key_exists('blockName', $block)
        && $block['blockName'] === 'regi-fair/form'
        && array_key_exists('attrs', $block)
        && array_key_exists('eventId', $block['attrs'])
      ) {
        $event_id = (int) $block['attrs']['eventId'];
        $events_ids[] = $event_id;
      }
    }
    $dao = new REGI_FAIR_DAO_Events();
    if ($post->post_status === 'publish') {
      $dao->set_post_events($post_id, $events_ids);
    } else {
      $dao->delete_event_post($post_id);
    }
  }

  public static function delete_post_callback(int $post_id)
  {
    $dao = new REGI_FAIR_DAO_Events();
    $dao->delete_event_post($post_id);
  }
}
