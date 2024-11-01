<?php

if (!defined('ABSPATH')) {
  exit;
}

require_once(WPOE_PLUGIN_DIR . 'classes/db.php');
require_once(WPOE_PLUGIN_DIR . 'classes/dao/base-dao.php');
require_once(WPOE_PLUGIN_DIR . 'classes/dao/dao-registrations.php');

// phpcs:disable WordPress.DB.DirectDatabaseQuery
class WPOE_DAO_Events extends WPOE_Base_DAO
{
  /**
   * @var WPOE_DAO_Registrations
   */
  private $registrations_dao;

  public function __construct()
  {
    parent::__construct();
    $this->registrations_dao = new WPOE_DAO_Registrations();
  }

  public function list_events(bool $ignore_past_events = false): array
  {
    global $wpdb;

    if ($ignore_past_events) {
      $results = $this->list_all_events();
    } else {
      $results = $this->list_only_future_events();
    }
    $this->check_results('retrieving events list');

    $events = [];
    foreach ($results as $result) {
      $post_permalink = null;
      $post_title = null;
      if ($result['posts'] === null) {
        $posts = [];
      } else {
        $posts_result = $result['posts'];
        $posts = explode(',', $posts_result);
        $post_id = (int) ($posts[0]);
        $permalink = get_permalink($post_id);
        if ($permalink !== false) {
          $post_permalink = $permalink;
          $post_title = get_the_title($post_id);
        }
      }
      $events[] = [
        'id' => (int) $result['id'],
        'name' => $result['name'],
        'date' => $result['date'],
        'registrations' => (int) $result['registrations'],
        'postTitle' => $post_title,
        'postPermalink' => $post_permalink,
        'hasMultipleReferences' => count($posts) > 1
      ];
    }
    return $events;
  }

  private function list_all_events()
  {
    global $wpdb;
    return $wpdb->get_results(
      "SELECT e.id, e.name, e.date, COUNT(r.id) AS registrations, p.posts
       FROM {$wpdb->prefix}wpoe_event e
       LEFT JOIN {$wpdb->prefix}wpoe_event_registration r ON e.id = r.event_id
       LEFT JOIN (
         SELECT event_id, GROUP_CONCAT(post_id ORDER BY updated_at DESC) AS posts
         FROM {$wpdb->prefix}wpoe_event_post GROUP BY event_id
       ) AS p ON p.event_id = e.id
       GROUP BY e.id ORDER BY e.date DESC",
      ARRAY_A
    );
  }

  private function list_only_future_events()
  {
    global $wpdb;
    return $wpdb->get_results(
      "SELECT e.id, e.name, e.date, COUNT(r.id) AS registrations, p.posts
       FROM {$wpdb->prefix}wpoe_event e
       LEFT JOIN {$wpdb->prefix}wpoe_event_registration r ON e.id = r.event_id
       LEFT JOIN (
         SELECT event_id, GROUP_CONCAT(post_id ORDER BY updated_at DESC) AS posts
         FROM {$wpdb->prefix}wpoe_event_post GROUP BY event_id
       ) AS p ON p.event_id = e.id
       WHERE DATE(e.date) >= DATE(CURRENT_TIMESTAMP)
       GROUP BY e.id ORDER BY e.date DESC",
      ARRAY_A
    );
  }

  public function get_event(int $event_id): ?WPOE_Event
  {
    global $wpdb;

    $event_results = $wpdb->get_results(
      $wpdb->prepare(
        "SELECT e.id, e.name, e.date, e.autoremove_submissions, e.autoremove_submissions_period,
         e.editable_registrations, e.admin_email, e.extra_email_content, e.max_participants, e.waiting_list,
         DATE(e.date) < DATE(CURRENT_TIMESTAMP) AS ended,
         f.id AS field_id, f.label, f.type, f.description, f.required, f.extra, f.position
         FROM {$wpdb->prefix}wpoe_event e
         LEFT JOIN {$wpdb->prefix}wpoe_event_form_field f
         ON f.event_id = e.id AND (f.deleted IS NULL OR NOT f.deleted)
         WHERE e.id = %d  ORDER BY f.position",
        $event_id
      ),
      ARRAY_A
    );
    $this->check_results('retrieving event');

    if (count($event_results) === 0) {
      return null;
    }

    $registrations_count = $this->get_registrations_count($event_id);
    $has_responses = $registrations_count > 0;

    $event = new WPOE_Event();
    $event->id = (int) $event_results[0]['id'];
    $event->name = $event_results[0]['name'];
    $event->date = $event_results[0]['date'];
    $event->ended = (bool) $event_results[0]['ended'];
    if ($event_results[0]['max_participants']) {
      $event->maxParticipants = (int) $event_results[0]['max_participants'];
      $event->availableSeats = $event->maxParticipants - $registrations_count;
      $event->waitingList = (bool) $event_results[0]['waiting_list'];
    }
    $event->autoremove = (bool) $event_results[0]['autoremove_submissions'];
    $event->autoremovePeriod = (int) $event_results[0]['autoremove_submissions_period'];
    $event->formFields = $this->load_form_fields($event_results);
    $event->hasResponses = $has_responses;
    $event->editableRegistrations = (bool) $event_results[0]['editable_registrations'];
    $event->adminEmail = $event_results[0]['admin_email'];
    $event->extraEmailContent = $event_results[0]['extra_email_content'];
    $event->posts = $this->get_referencing_posts($event_id);

    return $event;
  }

  public function get_public_event_data(int $event_id): ?WPOE_Public_Event_Data
  {
    global $wpdb;

    $results = $wpdb->get_results(
      $wpdb->prepare(
        "SELECT e.id, e.name, e.editable_registrations, e.date, e.max_participants,
         e.waiting_list, DATE(e.date) < DATE(CURRENT_TIMESTAMP) AS ended,
         f.id AS field_id, f.label, f.type, f.description, f.required, f.extra, f.position
         FROM {$wpdb->prefix}wpoe_event e
         LEFT JOIN {$wpdb->prefix}wpoe_event_form_field f ON f.event_id = e.id
         WHERE e.id = %d AND (f.id IS NULL OR NOT f.deleted) ORDER BY f.position",
        $event_id
      ),
      ARRAY_A
    );
    $this->check_results('retrieving public event data');

    if (count($results) === 0) {
      return null;
    }

    $event = new WPOE_Public_Event_Data();
    $event->id = (int) $results[0]['id'];
    $event->name = $results[0]['name'];
    $event->date = $results[0]['date'];
    $event->editableRegistrations = (bool) $results[0]['editable_registrations'];
    $event->waitingList = (bool) $results[0]['waiting_list'];
    $event->formFields = $this->load_form_fields($results);
    $event->ended = (bool) $results[0]['ended'];

    if ($results[0]['max_participants']) {
      $max_participants = (int) $results[0]['max_participants'];
      $registrations_count = $this->get_registrations_count($event_id);
      $event->availableSeats = $max_participants - $registrations_count;
    }

    return $event;
  }

  private function get_registrations_count(int $event_id): int
  {
    global $wpdb;
    $var = $wpdb->get_var(
      $wpdb->prepare(
        "SELECT COALESCE(SUM(number_of_people), 0) AS number_of_people
         FROM {$wpdb->prefix}wpoe_event_registration
         WHERE event_id = %d AND NOT waiting_list",
        $event_id
      )
    );
    $this->check_var($var, 'retrieving event registrations count');
    return (int) $var;
  }

  private function load_form_fields(array $results)
  {
    $formFields = [];
    foreach ($results as $result) {
      if ($result['field_id'] !== null) {
        $field = new WPOE_Form_Field();
        $field->id = (int) $result['field_id'];
        $field->label = $result['label'];
        $field->fieldType = $result['type'];
        $field->description = $result['description'];
        $field->required = (bool) $result['required'];
        $field->extra = isset($result['extra']) ? json_decode($result['extra']) : null;
        $field->position = (int) $result['position'];
        $formFields[] = $field;
      }
    }
    return $formFields;
  }

  /**
   * Returns the id of the created event
   */
  public function create_event(WPOE_Event $event): int
  {
    global $wpdb;

    try {
      $result = $wpdb->query('START TRANSACTION');
      $this->check_result($result, 'starting transaction');

      // Insert the event
      $result = $wpdb->insert(
        WPOE_DB::get_table_name('event'),
        [
          'name' => $event->name,
          'date' => $event->date,
          'autoremove_submissions' => $event->autoremove,
          'autoremove_submissions_period' => $event->autoremovePeriod,
          'max_participants' => $event->maxParticipants,
          'waiting_list' => $event->waitingList,
          'editable_registrations' => $event->editableRegistrations,
          'admin_email' => $event->adminEmail,
          'extra_email_content' => $event->extraEmailContent
        ],
        ['%s', '%s', '%d', '%d', '%d', '%d', '%d', '%s', '%s']
      );
      $this->check_result($result, 'inserting event');

      // Get the ID of the inserted event
      $event_id = $wpdb->insert_id;

      // Insert the form fields
      $i = 0;
      foreach ($event->formFields as $form_field) {
        $result = $wpdb->insert(
          WPOE_DB::get_table_name('event_form_field'),
          [
            'event_id' => $event_id,
            'label' => $form_field->label,
            'type' => $form_field->fieldType,
            'description' => $form_field->description,
            'required' => $form_field->required,
            'extra' => $form_field->extra === null ? null : wp_json_encode($form_field->extra),
            'position' => $i
          ],
          ['%d', '%s', '%s', '%s', '%d', '%s', '%d']
        );
        $this->check_result($result, 'inserting event form field');
        $i++;
      }
    } catch (Exception $ex) {
      $wpdb->query('ROLLBACK');
      throw $ex;
    }
    $result = $wpdb->query('COMMIT');
    $this->check_result($result, 'creating event');

    return $event_id;
  }

  public function update_event(WPOE_Event $event): void
  {
    global $wpdb;

    $result = $wpdb->query('START TRANSACTION');
    $this->check_result($result, 'starting transaction');

    try {
      if ($event->maxParticipants !== null) {
        $registrations = $this->registrations_dao->get_registrations_count($event->id);
        if ($event->maxParticipants < $registrations) {
          throw new WPOE_Validation_Exception(__("The number of available seats can't be lower than the current confirmed registered people", 'wp-open-events'));
        }
        if (!$event->waitingList && $this->registrations_dao->get_waiting_list_count($event->id) > 0) {
          throw new WPOE_Validation_Exception(message: __("It is not possible to remove the waiting list because there are some people in it", 'wp-open-events'));
        }
      }
      // Update the event
      $result = $wpdb->update(
        WPOE_DB::get_table_name('event'),
        [
          'name' => $event->name,
          'date' => $event->date,
          'autoremove_submissions' => $event->autoremove,
          'autoremove_submissions_period' => $event->autoremovePeriod,
          'max_participants' => $event->maxParticipants,
          'waiting_list' => $event->waitingList,
          'editable_registrations' => $event->editableRegistrations,
          'admin_email' => $event->adminEmail,
          'extra_email_content' => $event->extraEmailContent
        ],
        ['id' => $event->id],
        ['%s', '%s', '%d', '%d', '%d', '%d', '%d', '%s', '%s'],
        ['%d']
      );
      $this->check_result($result, 'updating event');

      $current_field_ids = [];
      foreach ($event->formFields as $form_field) {
        if ($form_field->id !== null) {
          $current_field_ids[] = $form_field->id;
        }
      }

      // Retrieve the list of fields to delete, store them in a map having field id as keys and field label as values.
      $results = [];
      if (count($current_field_ids) > 0) {
        $placeholders = array_fill(0, count($current_field_ids), '%d');
        $results = $wpdb->get_results(
          // phpcs:ignore WordPress.DB
          $wpdb->prepare(
            "SELECT id, extra FROM {$wpdb->prefix}wpoe_event_form_field
            WHERE event_id = %d AND id NOT IN ("
            // phpcs:ignore WordPress.DB
            . join(',', $placeholders) . ")",
            $event->id,
            ...$current_field_ids
          ),
          ARRAY_A
        );
      } else {
        $results = $wpdb->get_results(
          $wpdb->prepare(
            "SELECT id, extra FROM {$wpdb->prefix}wpoe_event_form_field WHERE event_id = %d",
            $event->id
          ),
          ARRAY_A
        );
      }
      $this->check_results('retrieving form fields to delete');

      if (count($results) > 0) {
        $number_of_people_field_id = null;

        $field_ids_to_delete = [];
        foreach ($results as $result) {
          $field_id = (int) $result['id'];
          if ($result['extra'] !== null) {
            $extra = (array) json_decode($result['extra']);
            if (array_key_exists('useAsNumberOfPeople', $extra) && $extra['useAsNumberOfPeople'] === true) {
              $number_of_people_field_id = $field_id;
            }
          }
          $field_ids_to_delete[] = $field_id;
        }

        // Select the fields to preserve because they are associated with some registration values
        // These fields will be marked as deleted but they will not be really removed from the database
        $placeholders = array_fill(0, count($field_ids_to_delete), '%d');
        $results = $wpdb->get_results(
          $wpdb->prepare(
            "SELECT DISTINCT rv.field_id
            FROM {$wpdb->prefix}wpoe_event_registration r
            JOIN {$wpdb->prefix}wpoe_event_registration_value rv
            ON r.id = rv.registration_id AND field_id IN ("
            // phpcs:ignore WordPress.DB
            . join(',', $placeholders) . ")",
            ...$field_ids_to_delete
          ),
          ARRAY_A
        );
        $this->check_results('retrieving form fields to preserve');

        if (count($results) > 0) {
          // Marking referenced fields as deleted
          $referenced_ids = [];
          foreach ($results as $result) {
            $field_id = (int) $result['field_id'];
            // Check special "number of people" field
            if ($field_id === $number_of_people_field_id) {
              throw new WPOE_Validation_Exception(__('It is not possible to remove referenced "number of people" field', 'wp-open-events'));
            }
            $referenced_ids[] = $field_id;
          }

          $placeholders = array_fill(0, count($referenced_ids), '%d');
          $result = $wpdb->query(
            $wpdb->prepare(
              "UPDATE {$wpdb->prefix}wpoe_event_form_field
              SET deleted = 1 WHERE id IN ("
              // phpcs:ignore WordPress.DB
              . join(',', $placeholders) . ")",
              ...$referenced_ids
            )
          );
          $this->check_result($result, 'marking fields as deleted');

          // Recompute the list of ids that can be deleted
          $unreferenced_ids = [];
          foreach ($field_ids_to_delete as $field_id) {
            if (!in_array($field_id, $referenced_ids)) {
              $unreferenced_ids[] = $field_id;
            }
          }
          $field_ids_to_delete = $unreferenced_ids;
        }

        if (count($field_ids_to_delete)) {
          // Delete the form fields without references
          foreach ($field_ids_to_delete as $field_id) {
            $result = $wpdb->delete(
              WPOE_DB::get_table_name('event_form_field'),
              ['id' => $field_id],
              ['%d']
            );
            $this->check_result($result, 'deleting form field');
          }
        }
      }

      foreach ($event->formFields as $form_field) {
        if ($form_field->id === null) {
          // Insert a new form field
          $result = $wpdb->insert(
            WPOE_DB::get_table_name('event_form_field'),
            [
              'event_id' => $event->id,
              'label' => $form_field->label,
              'type' => $form_field->fieldType,
              'description' => $form_field->description,
              'required' => $form_field->required,
              'extra' => $form_field->extra === null ? null : wp_json_encode($form_field->extra),
              'position' => $form_field->position
            ],
            ['%d', '%s', '%s', '%s', '%d', '%s', '%d'],
          );
          $this->check_result($result, 'inserting form field');
        } else {
          // Update an existing form field
          $result = $wpdb->update(
            WPOE_DB::get_table_name('event_form_field'),
            [
              'event_id' => $event->id,
              'label' => $form_field->label,
              'type' => $form_field->fieldType,
              'description' => $form_field->description,
              'required' => $form_field->required,
              'extra' => $form_field->extra === null ? null : wp_json_encode($form_field->extra),
              'position' => $form_field->position
            ],
            ['id' => $form_field->id],
            ['%d', '%s', '%s', '%s', '%d', '%s', '%d'],
            ['%d']
          );
          $this->check_result($result, 'updating form field');
        }
      }
    } catch (Exception $ex) {
      $wpdb->query('ROLLBACK');
      throw $ex;
    }

    $result = $wpdb->query('COMMIT');
    $this->check_result($result, 'updating event');
  }

  public function delete_event(int $event_id): void
  {
    global $wpdb;

    $result = $wpdb->query('START TRANSACTION');
    $this->check_result($result, 'starting transaction');

    try {
      $result = $wpdb->delete(
        WPOE_DB::get_table_name('event_post'),
        ['event_id' => $event_id],
        ['%d']
      );
      $this->check_result($result, 'removing associations between post and events');

      $result = $wpdb->query(
        $wpdb->prepare(
          "DELETE rv FROM {$wpdb->prefix}wpoe_event_registration_value rv
         JOIN {$wpdb->prefix}wpoe_event_registration r ON rv.registration_id = r.id
         WHERE r.event_id = %d",
          $event_id
        )
      );
      $this->check_result($result, 'deleting registrations values');

      $result = $wpdb->delete(WPOE_DB::get_table_name('event_registration'), ['event_id' => $event_id], ['%d']);
      $this->check_result($result, 'deleting registrations');

      $result = $wpdb->delete(WPOE_DB::get_table_name('event_form_field'), ['event_id' => $event_id], ['%d']);
      $this->check_result($result, 'deleting event form fields');

      $result = $wpdb->delete(WPOE_DB::get_table_name('event'), ['id' => $event_id], ['%d']);
      $this->check_result($result, 'deleting event');
    } catch (Exception $ex) {
      $wpdb->query('ROLLBACK');
      throw $ex;
    }

    $result = $wpdb->query('COMMIT');
    $this->check_result($result, 'deleting event');
  }

  /**
   * Returns post associated with the given event.
   * @return WPOE_Post_Reference[]
   */
  public function get_referencing_posts(int $event_id): array
  {
    global $wpdb;
    $results = $wpdb->get_results(
      $wpdb->prepare(
        "SELECT post_id FROM {$wpdb->prefix}wpoe_event_post WHERE event_id = %d ORDER BY updated_at DESC",
        $event_id
      ),
      ARRAY_A
    );
    $this->check_results('loading posts referencing the event');
    $posts = [];
    foreach ($results as $result) {
      $post_id = (int) $result['post_id'];
      $permalink = get_permalink($post_id);
      if ($permalink !== false) {
        $post_title = get_the_title($post_id);
        $post_reference = new WPOE_Post_Reference();
        $post_reference->permalink = $permalink;
        $post_reference->title = $post_title;
        $posts[] = $post_reference;
      }
    }
    return $posts;
  }

  public function set_post_events(int $post_id, array $events_ids)
  {
    global $wpdb;

    $result = $wpdb->query('START TRANSACTION');
    $this->check_result($result, 'starting transaction');

    try {
      $result = $wpdb->delete(
        WPOE_DB::get_table_name('event_post'),
        ['post_id' => $post_id],
        ['%d']
      );
      $this->check_result($result, 'removing associations between post and events');

      foreach ($events_ids as $event_id) {
        $result = $wpdb->replace(
          WPOE_DB::get_table_name('event_post'),
          [
            'event_id' => $event_id,
            'post_id' => $post_id
          ],
          ['%d', '%d']
        );
        $this->check_result($result, 'adding association between post and event');
      }
    } catch (Exception $ex) {
      $wpdb->query('ROLLBACK');
      throw $ex;
    }

    $result = $wpdb->query('COMMIT');
    $this->check_result($result, 'associating post to events');
  }

  public function delete_event_post(int $post_id)
  {
    global $wpdb;
    $result = $wpdb->delete(
      WPOE_DB::get_table_name('event_post'),
      ['post_id' => $post_id],
      ['%d']
    );
    $this->check_result($result, 'removing associations between post and events');
  }

  public function delete_past_events()
  {
    global $wpdb;

    $results = $wpdb->get_results(
      "SELECT id FROM {$wpdb->prefix}wpoe_event
       WHERE autoremove_submissions AND
       DATE(date) < DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL autoremove_submissions_period DAY)",
      ARRAY_A
    );
    $this->check_results('retrieving events to be deleted');

    foreach ($results as $result) {
      $this->delete_event((int) $result['id']);
    }
  }
}
