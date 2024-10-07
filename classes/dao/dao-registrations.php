<?php

if (!defined('ABSPATH')) {
  exit;
}

require_once(WPOE_PLUGIN_DIR . 'classes/db.php');
require_once(WPOE_PLUGIN_DIR . 'classes/dao/base-dao.php');
require_once(WPOE_PLUGIN_DIR . 'classes/model/event.php');
require_once(WPOE_PLUGIN_DIR . 'classes/model/registration.php');

class WPOE_DAO_Registrations extends WPOE_Base_DAO
{
  public function __construct()
  {
    parent::__construct();
  }

  public function list_event_registrations(int $event_id, bool $waiting, int|null $limit, int|null $offset): array
  {
    global $wpdb;

    $waiting_clause = ($waiting ? "" : "NOT") . " waiting_list";

    $sql = "SELECT r.id, r.inserted_at, f.label, f.deleted, rv.field_value
      FROM " . WPOE_DB::get_table_name('event_registration') . " r
      RIGHT JOIN " . WPOE_DB::get_table_name('event_form_field') . " f ON f.event_id = r.event_id
      LEFT JOIN " . WPOE_DB::get_table_name('event_registration_value') . " rv ON f.id = rv.field_id AND rv.registration_id = r.id
      JOIN (SELECT id FROM " . WPOE_DB::get_table_name('event_registration') . "
      WHERE event_id = %d AND " . $waiting_clause . " ORDER BY id DESC";
    if ($limit !== null && $offset !== null) {
      $sql .= " LIMIT %d OFFSET %d";
    }
    $sql .= ") AS rpage ON r.id = rpage.id ORDER BY r.id DESC, f.deleted, f.position";
    if ($limit !== null && $offset !== null) {
      $query = $wpdb->prepare($sql, $event_id, $limit, $offset);
    } else {
      $query = $wpdb->prepare($sql, $event_id);
    }
    $results = $wpdb->get_results($query, ARRAY_A);
    $this->check_results('retrieving the event registrations');

    $query = $wpdb->prepare('SELECT COUNT(*) FROM ' . WPOE_DB::get_table_name('event_registration')
      . ' WHERE event_id = %d AND ' . $waiting_clause, $event_id);
    $var = $wpdb->get_var($query);
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
      $value = $result['field_value'];
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

  /**
   * Returns:
   * - null if the event has no maxiumum number of participants limit
   * - an integer representing the number of remaining available seats if there is a maxiumum number of participants limit
   * - false if there is a maxiumum number of participants limit and this limit has already been reached
   */
  public function register_to_event(WPOE_Event $event, WPOE_Registration $request, ?string $registration_token): int|false|null
  {
    global $wpdb;

    $remaining_seats = null;

    try {
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
        WPOE_DB::get_table_name('event_registration'),
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
          WPOE_DB::get_table_name('event_registration_value'),
          [
            'registration_id' => $registration_id,
            'field_id' => $field_id,
            'field_value' => $field_value,
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

  public function get_registration_by_id(int $event_id, int $registration_id): WPOE_Registration|null
  {
    global $wpdb;

    $query = $wpdb->prepare('SELECT inserted_at, updated_at, waiting_list FROM '
      . WPOE_DB::get_table_name('event_registration')
      . ' WHERE event_id = %d AND id = %s', $event_id, $registration_id);
    $results = $wpdb->get_results($query);
    $this->check_results('retrieving registration');
    if (count($results) === 0) {
      return null;
    }

    $inserted_at = $results[0]->inserted_at;
    $updated_at = $results[0]->updated_at;
    $waiting_list = $results[0]->waiting_list;

    $values = $this->get_registration_values($registration_id);

    $registration = new WPOE_Registration();
    $registration->id = $registration_id;
    $registration->insertedAt = $inserted_at;
    $registration->updatedAt = $updated_at;
    $registration->values = $values;
    $registration->waitingList = (bool) $waiting_list;
    return $registration;
  }

  public function get_registration_from_token(int $event_id, string $registration_token): WPOE_Registration|null
  {
    global $wpdb;

    $query = $wpdb->prepare('SELECT id, waiting_list FROM ' . WPOE_DB::get_table_name('event_registration')
      . ' WHERE event_id = %d AND registration_token = %s', $event_id, $registration_token);
    $results = $wpdb->get_results($query);
    $this->check_results('retrieving registration');
    if (count($results) === 0) {
      return null;
    }
    if (count($results) > 1) {
      throw new Exception('Multiple registrations associated with the same token');
    }

    $registration_id = $results[0]->id;
    $waiting_list = $results[0]->waiting_list;

    $values = $this->get_registration_values($registration_id);

    $registration = new WPOE_Registration();
    $registration->id = $registration_id;
    $registration->values = $values;
    $registration->waitingList = $waiting_list;
    return $registration;
  }

  public function get_registration_values(int $registration_id): array|null
  {
    global $wpdb;

    $query = $wpdb->prepare("SELECT f.label, rv.field_id, rv.field_value
      FROM " . WPOE_DB::get_table_name('event_registration') . " r
      RIGHT JOIN " . WPOE_DB::get_table_name('event_form_field') . " f ON f.event_id = r.event_id
      LEFT JOIN " . WPOE_DB::get_table_name('event_registration_value') . " rv ON f.id = rv.field_id AND rv.registration_id = r.id
      WHERE r.id = %d AND NOT f.deleted
      ORDER BY f.position", $registration_id);
    $results = $wpdb->get_results($query, ARRAY_A);
    $this->check_results('retrieving the event registration value');

    $values = [];
    foreach ($results as $row) {
      $values[$row['field_id']] = $row['field_value'];
    }

    return $values;
  }

  /**
   * Returns false if the update failed due to no more seats available or an associative array containing:
   * - the number of remaining seats, or null if the event has no max participants set;
   * - the list of registrations ids picked from waiting list, or null if waiting list is not enabled.
   */
  public function update_registration(WPOE_Event $event, WPOE_Registration $request): array|false
  {
    global $wpdb;

    $remaining_seats = null;
    $check_waiting_list = false;
    $waiting_picked = null;

    try {
      $result = $wpdb->query('START TRANSACTION');
      $this->check_result($result, 'starting transaction');

      if ($event->maxParticipants !== null) {
        $registrations_count = $this->get_registrations_count($event->id);
        $remaining_seats = $event->maxParticipants - $registrations_count;

        $query = $wpdb->prepare('SELECT number_of_people FROM '
          . WPOE_DB::get_table_name('event_registration')
          . ' WHERE id = %d', $request->id);
        $var = $wpdb->get_var($query);
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
            $remaining_seats -= $request->numberOfPeople;
          } else if (!$request->waitingList) {
            $check_waiting_list = true;
            $remaining_seats += $people_to_remove;
          }
        }
      }

      // Update registration updated_at
      $result = $wpdb->update(
        WPOE_DB::get_table_name('event_registration'),
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
        WPOE_DB::get_table_name('event_registration_value'),
        ['registration_id' => $request->id],
        ['%d']
      );
      $this->check_result($result, 'deleting event registration fields');

      // Insert the registration fields
      foreach ($request->values as $field_id => $field_value) {
        $result = $wpdb->insert(
          WPOE_DB::get_table_name('event_registration_value'),
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
  public function delete_registration(WPOE_Event $event, int $registration_id): array
  {
    global $wpdb;

    $remaining_seats = null;
    $waiting_picked = null;

    try {
      $result = $wpdb->query('START TRANSACTION');
      $this->check_result($result, 'starting transaction');

      // Delete the registration fields
      $result = $wpdb->delete(
        WPOE_DB::get_table_name('event_registration_value'),
        ['registration_id' => $registration_id],
        ['%d']
      );
      $this->check_result($result, 'deleting event registration fields');

      // Delete the registration
      $result = $wpdb->delete(
        WPOE_DB::get_table_name('event_registration'),
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

  private function pick_from_waiting_list(WPOE_Event $event, int $remaining_seats)
  {
    global $wpdb;
    $query = $wpdb->prepare('SELECT id, number_of_people FROM ' . WPOE_DB::get_table_name('event_registration')
      . ' WHERE event_id = %d AND waiting_list ORDER BY id ASC', $event->id);
    $results = $wpdb->get_results($query, ARRAY_A);
    $this->check_results('retrieving the waiting event registrations');

    $waiting_picked = [];
    foreach ($results as $row) {
      $number_of_people = (int) $row['number_of_people'];
      if ($remaining_seats < $number_of_people) {
        break;
      }
      $registration_id = (int) $row['id'];
      $result = $wpdb->update(
        WPOE_DB::get_table_name('event_registration'),
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
    $query = $wpdb->prepare('SELECT COALESCE(SUM(number_of_people), 0) AS number_of_people FROM 
      ' . WPOE_DB::get_table_name('event_registration') .
      ' WHERE event_id = %d AND NOT waiting_list', $event_id);
    $var = $wpdb->get_var($query);
    $this->check_var($var, 'counting number of registrations');
    return (int) $var;
  }

  /**
   * Returns the number of people in the waiting list.
   */
  public function get_waiting_list_count(int $event_id): int
  {
    global $wpdb;
    $query = $wpdb->prepare('SELECT COALESCE(SUM(number_of_people), 0) AS number_of_people FROM '
      . WPOE_DB::get_table_name('event_registration')
      . ' WHERE event_id = %d AND waiting_list', $event_id);
    $var = $wpdb->get_var($query);
    $this->check_var($var, 'retrieving the event registrations waiting count');
    return (int) $var;
  }
}
