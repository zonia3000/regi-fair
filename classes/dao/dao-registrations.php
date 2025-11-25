<?php

if (!defined('ABSPATH')) {
  exit;
}

require_once(REGI_FAIR_PLUGIN_DIR . 'classes/db.php');
require_once(REGI_FAIR_PLUGIN_DIR . 'classes/dao/base-dao.php');
require_once(REGI_FAIR_PLUGIN_DIR . 'classes/model/event.php');
require_once(REGI_FAIR_PLUGIN_DIR . 'classes/model/registration.php');

// phpcs:disable WordPress.DB.DirectDatabaseQuery
class REGI_FAIR_DAO_Registrations extends REGI_FAIR_Base_DAO
{
  public function __construct()
  {
    parent::__construct();
  }

  public function list_event_registrations(int $event_id, bool $waiting_list, int|null $limit, int|null $offset): array
  {
    global $wpdb;

    if ($limit !== null && $offset !== null) {
      $results = $this->list_all_event_registrations_paginated($event_id, $waiting_list, $limit, $offset);
    } else {
      $results = $this->list_all_event_registrations($event_id, $waiting_list);
    }
    $this->check_results('retrieving the event registrations');

    $var = $wpdb->get_var(
      $wpdb->prepare(
        "SELECT COUNT(*) FROM {$wpdb->prefix}regi_fair_event_registration WHERE event_id = %d AND waiting_list = %d",
        $event_id,
        (int) $waiting_list
      )
    );
    $this->check_var($var, 'retrieving the event registration rows');
    $total = (int) $var;

    $total_participants = $this->get_registrations_count($event_id);
    $total_waiting = $this->get_waiting_list_count($event_id);

    $head_map = [];
    $body_map = [];
    $ids = [];
    foreach ($results as $result) {
      $id = (int) $result['id'];
      $inserted_at = $result['inserted_at'];
      if (!in_array($id, $ids)) {
        $ids[] = $id;
      }
      $label = $result['label'];
      $value = $this->get_formatted_registration_value($result['field_value'], $result['type'], $result['extra']);
      if (!array_key_exists($label, $head_map)) {
        $head_map[$label] = (bool) $result['deleted'];
      }
      if (array_key_exists($id, $body_map)) {
        $body_map[$id][$label] = $value;
      } else {
        $body_map[$id] = [
          'inserted_at' => $inserted_at,
          $label => $value
        ];
      }
    }

    $head_labels = [];
    $head = [];
    foreach ($head_map as $label => $deleted) {
      $head[] = ['label' => $label, 'deleted' => $deleted];
      $head_labels[] = $label;
    }

    $rows = [];
    foreach ($ids as $id) {
      $row_data = $body_map[$id];
      $row = [$id, $body_map[$id]['inserted_at']];
      foreach ($head_labels as $label) {
        if (array_key_exists($label, $row_data)) {
          $cell = $row_data[$label];
        } else {
          $cell = '';
        }
        $row[] = $cell;
      }
      $rows[] = $row;
    }

    return [
      'head' => $head,
      'body' => $rows,
      'total' => $total,
      'totalParticipants' => $total_participants,
      'totalWaiting' => $total_waiting
    ];
  }

  private function list_all_event_registrations(int $event_id, bool $waiting_list)
  {
    global $wpdb;
    return $wpdb->get_results(
      $wpdb->prepare(
        "SELECT r.id, r.inserted_at, f.label, f.type, f.deleted, f.extra, rv.field_value
        FROM {$wpdb->prefix}regi_fair_event_registration r
        RIGHT JOIN {$wpdb->prefix}regi_fair_event_form_field f ON f.event_id = r.event_id
        LEFT JOIN {$wpdb->prefix}regi_fair_event_registration_value rv ON f.id = rv.field_id AND rv.registration_id = r.id
        WHERE r.event_id = %d AND waiting_list = %d
        ORDER BY r.id DESC, f.deleted, f.position",
        $event_id,
        (int) $waiting_list
      ),
      ARRAY_A
    );
  }

  private function list_all_event_registrations_paginated(int $event_id, bool $waiting_list, int $limit, int $offset)
  {
    global $wpdb;
    return $wpdb->get_results(
      $wpdb->prepare(
        "SELECT r.id, r.inserted_at, f.label, f.type, f.deleted, f.extra, rv.field_value
        FROM {$wpdb->prefix}regi_fair_event_registration r
        RIGHT JOIN {$wpdb->prefix}regi_fair_event_form_field f ON f.event_id = r.event_id
        LEFT JOIN {$wpdb->prefix}regi_fair_event_registration_value rv ON f.id = rv.field_id AND rv.registration_id = r.id
        JOIN (SELECT id FROM {$wpdb->prefix}regi_fair_event_registration
          WHERE event_id = %d AND waiting_list = %d ORDER BY id DESC LIMIT %d OFFSET %d
        ) AS rpage ON r.id = rpage.id ORDER BY r.id DESC, f.deleted, f.position",
        $event_id,
        (int) $waiting_list,
        $limit,
        $offset
      ),
      ARRAY_A
    );
  }

  /**
   * Returns:
   * - null if the event has no maxiumum number of participants limit
   * - an integer representing the number of remaining available seats if there is a maxiumum number of participants limit
   * - false if there is a maxiumum number of participants limit and this limit has already been reached
   */
  public function register_to_event(REGI_FAIR_Event $event, REGI_FAIR_Registration $request, ?string $registration_token): int|false|null
  {
    global $wpdb;

    $remaining_seats = null;

    try {
      if ($event->maxParticipants) {
        $result = $wpdb->query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
        $this->check_result($result, 'setting isolation level');
      }
      $result = $wpdb->query('START TRANSACTION');
      $this->check_result($result, 'starting transaction');

      // Count the number of remaining seats
      if ($event->maxParticipants !== null) {
        $registrations_count = $this->get_registrations_count($event->id);
        $remaining_seats = $event->maxParticipants - $registrations_count;
        if ($remaining_seats < $request->numberOfPeople && !$request->waitingList) {
          // Unable to register: no more seats available
          $wpdb->query('ROLLBACK');
          return false;
        }
        if ($request->waitingList && $remaining_seats >= $request->numberOfPeople) {
          $request->waitingList = false;
        }
      }

      // Insert the registration
      $result = $wpdb->insert(
        REGI_FAIR_DB::get_table_name('event_registration'),
        [
          'event_id' => $event->id,
          'registration_token' => $registration_token,
          'number_of_people' => $request->numberOfPeople,
          'waiting_list' => $request->waitingList
        ],
        ['%d', '%s', '%d', '%d']
      );
      $this->check_result($result, 'inserting event registration');

      $registration_id = $wpdb->insert_id;

      // Insert the registration fields
      foreach ($request->values as $field_id => $field_value) {
        $result = $wpdb->insert(
          REGI_FAIR_DB::get_table_name('event_registration_value'),
          [
            'registration_id' => $registration_id,
            'field_id' => $field_id,
            'field_value' => is_array($field_value) ? wp_json_encode($field_value) : $field_value,
          ],
          ['%d', '%d', '%s']
        );
        $this->check_result($result, 'inserting event registration field');
      }
    } catch (Exception $ex) {
      $wpdb->query('ROLLBACK');
      throw $ex;
    }

    $result = $wpdb->query('COMMIT');
    $this->check_result($result, 'inserting registration');

    if ($remaining_seats !== null && !$request->waitingList) {
      $remaining_seats -= $request->numberOfPeople;
    }
    return $remaining_seats;
  }

  public function get_registration_by_id(int $event_id, int $registration_id): REGI_FAIR_Registration|null
  {
    global $wpdb;

    $row = $wpdb->get_row(
      $wpdb->prepare(
        "SELECT inserted_at, updated_at, waiting_list
        FROM {$wpdb->prefix}regi_fair_event_registration WHERE event_id = %d AND id = %s",
        $event_id,
        $registration_id
      )
    );
    $this->check_results('retrieving registration');
    if ($row === null) {
      return null;
    }

    $inserted_at = $row->inserted_at;
    $updated_at = $row->updated_at;
    $waiting_list = $row->waiting_list;

    $values = $this->get_registration_values($registration_id);

    $registration = new REGI_FAIR_Registration();
    $registration->id = $registration_id;
    $registration->insertedAt = $inserted_at;
    $registration->updatedAt = $updated_at;
    $registration->values = $values;
    $registration->waitingList = (bool) $waiting_list;
    return $registration;
  }

  public function get_registration_from_token(int $event_id, string $registration_token): REGI_FAIR_Registration|null
  {
    global $wpdb;

    $results = $wpdb->get_results(
      $wpdb->prepare(
        "SELECT id, waiting_list FROM {$wpdb->prefix}regi_fair_event_registration
         WHERE event_id = %d AND registration_token = %s",
        $event_id,
        $registration_token
      )
    );
    $this->check_results('retrieving registration');
    if (count($results) === 0) {
      return null;
    }
    if (count($results) > 1) {
      throw new Exception('Multiple registrations associated with the same token');
    }

    $registration_id = $results[0]->id;
    $waiting_list = (bool) $results[0]->waiting_list;

    $values = $this->get_registration_values($registration_id);

    $registration = new REGI_FAIR_Registration();
    $registration->id = $registration_id;
    $registration->values = $values;
    $registration->waitingList = $waiting_list;
    return $registration;
  }

  public function get_registration_values(int $registration_id): array|null
  {
    global $wpdb;

    $results = $wpdb->get_results(
      $wpdb->prepare(
        "SELECT f.label, f.type, f.id AS field_id, f.extra, rv.field_value
         FROM {$wpdb->prefix}regi_fair_event_registration r
         RIGHT JOIN {$wpdb->prefix}regi_fair_event_form_field f ON f.event_id = r.event_id
         LEFT JOIN {$wpdb->prefix}regi_fair_event_registration_value rv ON f.id = rv.field_id AND rv.registration_id = r.id
         WHERE r.id = %d AND NOT f.deleted
         ORDER BY f.position",
        $registration_id
      ),
      ARRAY_A
    );
    $this->check_results('retrieving the event registration value');

    $values = [];
    foreach ($results as $row) {
      $values[$row['field_id']] = $this->get_registration_value($row['field_value'], $row['type'], $row['extra']);
    }

    return $values;
  }

  private function get_registration_value(mixed $value, string $type, string|null $extra)
  {
    if ($type === 'checkbox' || $type === 'privacy') {
      return (bool) $value;
    }
    if ($type === 'dropdown' && $extra !== null) {
      $extra = json_decode($extra);
      if (property_exists($extra, 'multiple') && $extra->multiple === true) {
        return json_decode($value);
      }
    }
    return $value;
  }

  private function get_formatted_registration_value(mixed $value, string $type, string|null $extra)
  {
    if ($value === null) {
      return '';
    }
    if ($type === 'dropdown' && $extra !== null) {
      $extra = json_decode($extra);
      if (property_exists($extra, 'multiple') && $extra->multiple === true) {
        $decoded_value = json_decode($value);
        if (is_array($decoded_value)) {
          return implode(', ', $decoded_value);
        }
      }
    }
    if ($type === 'checkbox' || $type === 'privacy') {
      return ((bool) $value) ? __('Yes', 'regi-fair') : __('No', 'regi-fair');
    }
    return $value;
  }

  /**
   * Returns false if the update failed due to no more seats available or an associative array containing:
   * - the number of remaining seats, or null if the event has no max participants set;
   * - the list of registrations ids picked from waiting list, or null if waiting list is not enabled.
   */
  public function update_registration(REGI_FAIR_Event $event, REGI_FAIR_Registration $request): array|false
  {
    global $wpdb;

    $remaining_seats = null;
    $check_waiting_list = false;
    $waiting_picked = null;

    try {
      if ($event->maxParticipants) {
        $result = $wpdb->query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
        $this->check_result($result, 'setting isolation level');
      }
      $result = $wpdb->query('START TRANSACTION');
      $this->check_result($result, 'starting transaction');

      if ($event->maxParticipants !== null) {
        $registrations_count = $this->get_registrations_count($event->id);
        $remaining_seats = $event->maxParticipants - $registrations_count;

        $var = $wpdb->get_var(
          $wpdb->prepare(
            "SELECT number_of_people FROM {$wpdb->prefix}regi_fair_event_registration WHERE id = %d",
            $request->id
          )
        );
        $this->check_var($var, 'retrieving previous number of people');
        $previous_number_of_people = (int) $var;

        if ($request->numberOfPeople > $previous_number_of_people) {
          $people_to_add = $request->numberOfPeople - $previous_number_of_people;

          if ($remaining_seats < $people_to_add && !$request->waitingList) {
            // Unable to update the registration: no more seats available
            $wpdb->query('ROLLBACK');
            return false;
          }
          if (!$request->waitingList) {
            $remaining_seats -= $people_to_add;
          }
        } else if ($request->numberOfPeople < $previous_number_of_people) {
          $people_to_remove = $previous_number_of_people - $request->numberOfPeople;
          if ($request->waitingList && $remaining_seats >= $request->numberOfPeople) {
            $request->waitingList = false;
            $waiting_picked = [$request->id];
            $remaining_seats -= $request->numberOfPeople;
          } else if (!$request->waitingList) {
            $check_waiting_list = true;
            $remaining_seats += $people_to_remove;
          }
        }
      }

      // Update registration updated_at
      $result = $wpdb->update(
        REGI_FAIR_DB::get_table_name('event_registration'),
        [
          'updated_at' => current_time('mysql'),
          'number_of_people' => $request->numberOfPeople,
          'waiting_list' => $request->waitingList
        ],
        ['id' => $request->id],
        ['%s', '%d', '%d'],
        ['%d']
      );
      $this->check_result($result, 'updating registration');

      // Delete the registration fields
      $result = $wpdb->delete(
        REGI_FAIR_DB::get_table_name('event_registration_value'),
        ['registration_id' => $request->id],
        ['%d']
      );
      $this->check_result($result, 'deleting event registration fields');

      // Insert the registration fields
      foreach ($request->values as $field_id => $field_value) {
        $result = $wpdb->insert(
          REGI_FAIR_DB::get_table_name('event_registration_value'),
          [
            'registration_id' => $request->id,
            'field_id' => $field_id,
            'field_value' => $field_value,
          ],
          ['%d', '%d', '%s']
        );
        $this->check_result($result, 'inserting event registration field');
      }

      if ($check_waiting_list) {
        $waiting_result = $this->pick_from_waiting_list($event, $remaining_seats);
        $remaining_seats = $waiting_result['remaining_seats'];
        $waiting_picked = $waiting_result['waiting_picked'];
      }

    } catch (Exception $ex) {
      $wpdb->query('ROLLBACK');
      throw $ex;
    }

    $result = $wpdb->query('COMMIT');
    $this->check_result($result, 'updating registration');
    return [
      'waiting_picked' => $waiting_picked,
      'remaining' => $remaining_seats
    ];
  }

  /**
   * Returns an associative array containing:
   * - the number of remaining seats, or null if the event has no max participants set;
   * - the list of registrations ids picked from waiting list, or null if waiting list is not enabled.
   */
  public function delete_registration(REGI_FAIR_Event $event, int $registration_id): array
  {
    global $wpdb;

    $remaining_seats = null;
    $waiting_picked = null;

    try {
      if ($event->maxParticipants) {
        $result = $wpdb->query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
        $this->check_result($result, 'setting isolation level');
      }
      $result = $wpdb->query('START TRANSACTION');
      $this->check_result($result, 'starting transaction');

      // Delete the registration fields
      $result = $wpdb->delete(
        REGI_FAIR_DB::get_table_name('event_registration_value'),
        ['registration_id' => $registration_id],
        ['%d']
      );
      $this->check_result($result, 'deleting event registration fields');

      // Delete the registration
      $result = $wpdb->delete(
        REGI_FAIR_DB::get_table_name('event_registration'),
        ['id' => $registration_id],
        ['%d']
      );
      $this->check_result($result, 'deleting event registration');

      if ($event->maxParticipants !== null) {
        $registrations_count = $this->get_registrations_count($event->id);
        $remaining_seats = $event->maxParticipants - $registrations_count;
        if ($event->waitingList) {
          $waiting_result = $this->pick_from_waiting_list($event, $remaining_seats);
          $remaining_seats = $waiting_result['remaining_seats'];
          $waiting_picked = $waiting_result['waiting_picked'];
        }
      }
    } catch (Exception $ex) {
      $wpdb->query('ROLLBACK');
      throw $ex;
    }

    $result = $wpdb->query('COMMIT');
    $this->check_result($result, 'deleting registration');

    return [
      'waiting_picked' => $waiting_picked,
      'remaining' => $remaining_seats
    ];
  }

  private function pick_from_waiting_list(REGI_FAIR_Event $event, int $remaining_seats)
  {
    global $wpdb;
    $results = $wpdb->get_results(
      $wpdb->prepare(
        "SELECT id, number_of_people
        FROM {$wpdb->prefix}regi_fair_event_registration
        WHERE event_id = %d AND waiting_list ORDER BY id ASC",
        $event->id
      ),
      ARRAY_A
    );
    $this->check_results('retrieving the waiting event registrations');

    $waiting_picked = [];
    foreach ($results as $row) {
      $number_of_people = (int) $row['number_of_people'];
      if ($remaining_seats < $number_of_people) {
        break;
      }
      $registration_id = (int) $row['id'];
      $result = $wpdb->update(
        REGI_FAIR_DB::get_table_name('event_registration'),
        [
          'updated_at' => current_time('mysql'),
          'waiting_list' => 0
        ],
        ['id' => $registration_id],
        ['%s', '%d'],
        ['%d']
      );
      $remaining_seats -= $number_of_people;
      $waiting_picked[] = $registration_id;
      $this->check_result($result, 'updating registration');
    }

    return [
      'waiting_picked' => $waiting_picked,
      'remaining_seats' => $remaining_seats
    ];
  }

  /**
   * Returns the number of people registered to the event.
   */
  public function get_registrations_count(int $event_id): int
  {
    global $wpdb;
    $var = $wpdb->get_var(
      $wpdb->prepare(
        "SELECT COALESCE(SUM(number_of_people), 0) AS number_of_people
        FROM {$wpdb->prefix}regi_fair_event_registration
        WHERE event_id = %d AND NOT waiting_list",
        $event_id
      )
    );
    $this->check_var($var, 'counting number of registrations');
    return (int) $var;
  }

  /**
   * Returns the number of people in the waiting list.
   */
  public function get_waiting_list_count(int $event_id): int
  {
    global $wpdb;
    $var = $wpdb->get_var(
      $wpdb->prepare(
        "SELECT COALESCE(SUM(number_of_people), 0) AS number_of_people
        FROM {$wpdb->prefix}regi_fair_event_registration
        WHERE event_id = %d AND waiting_list",
        $event_id
      )
    );
    $this->check_var($var, 'retrieving the event registrations waiting count');
    return (int) $var;
  }
}
