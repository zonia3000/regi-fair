<?php

require_once ABSPATH . 'wp-admin/includes/upgrade.php';

define('REGI_FAIR_DB_VERSION_KEY', 'regi_fair_db_version');
define('REGI_FAIR_DB_VERSION', '1.0');
require_once(REGI_FAIR_PLUGIN_DIR . 'classes/db.php');

class REGI_FAIR_DB_Setup
{
  public static function create_tables()
  {
    global $wpdb;

    $event_table = REGI_FAIR_DB_Setup::create_table('event', "
      id bigint unsigned NOT NULL AUTO_INCREMENT,
      name varchar(255) NOT NULL,
      date date NOT NULL,
      autoremove_submissions bit DEFAULT 1,
      autoremove_submissions_period int DEFAULT 30,
      max_participants int DEFAULT NULL,
      waiting_list bit DEFAULT 0,
      editable_registrations bit DEFAULT 1,
      admin_email varchar(255) NULL,
      extra_email_content text NULL,
      PRIMARY KEY  (id)
    ");

    $event_form_field_table = REGI_FAIR_DB_Setup::create_table('event_form_field', "
      id bigint unsigned NOT NULL AUTO_INCREMENT,
      event_id bigint unsigned NOT NULL,
      label varchar(255) NOT NULL,
      type varchar(255) NOT NULL,
      description text NULL,
      required bit DEFAULT 1,
      extra text NULL,
      position int NOT NULL,
      deleted bit DEFAULT 0,
      PRIMARY KEY  (id),
      FOREIGN KEY (event_id) REFERENCES $event_table (id)
    ");

    $event_post_create_sql = "
      event_id bigint unsigned NOT NULL,
      post_id bigint unsigned NOT NULL,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY  (event_id, post_id),
      FOREIGN KEY (event_id) REFERENCES $event_table (id)";

    if (REGI_FAIR_DB_Setup::can_create_posts_foreign_key()) {
      $event_post_create_sql .= ",
      FOREIGN KEY (post_id) REFERENCES " . $wpdb->prefix . "posts (ID)";
    }

    REGI_FAIR_DB_Setup::create_table('event_post', $event_post_create_sql);

    $event_template_table = REGI_FAIR_DB_Setup::create_table('event_template', "
      id bigint unsigned NOT NULL AUTO_INCREMENT,
      name varchar(255) NOT NULL,
      autoremove_submissions bit DEFAULT 1,
      autoremove_submissions_period int DEFAULT 30,
      waiting_list bit DEFAULT 0,
      editable_registrations bit DEFAULT 1,
      admin_email varchar(255) NULL,
      extra_email_content text NULL,
      PRIMARY KEY  (id)
    ");

    REGI_FAIR_DB_Setup::create_table('event_template_form_field', "
      id bigint unsigned NOT NULL AUTO_INCREMENT,
      template_id bigint unsigned NOT NULL,
      label varchar(255) NOT NULL,
      type varchar(255) NOT NULL,
      description text NULL,
      required bit DEFAULT 1,
      extra text NULL,
      position int NOT NULL,
      PRIMARY KEY  (id),
      FOREIGN KEY (template_id) REFERENCES $event_template_table (id)
    ");

    $event_registration_table = REGI_FAIR_DB_Setup::create_table('event_registration', "
      id bigint unsigned NOT NULL AUTO_INCREMENT,
      event_id bigint unsigned NOT NULL,
      registration_token varchar(255) NULL,
      inserted_at timestamp DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
      number_of_people integer NOT NULL DEFAULT 1,
      waiting_list bit DEFAULT 0,
      PRIMARY KEY  (id),
      FOREIGN KEY (event_id) REFERENCES $event_table (id),
      UNIQUE (registration_token)
    ");

    REGI_FAIR_DB_Setup::create_table('event_registration_value', "
      registration_id bigint unsigned NOT NULL,
      field_id bigint unsigned NOT NULL,
      field_value text NULL,
      PRIMARY KEY  (registration_id, field_id),
      FOREIGN KEY (registration_id) REFERENCES $event_registration_table (id),
      FOREIGN KEY (field_id) REFERENCES $event_form_field_table (id)
    ");

    add_option(REGI_FAIR_DB_VERSION_KEY, REGI_FAIR_DB_VERSION);
  }

  /**
   * Check if it is possible to create foreign key references to the posts table.
   * Creating the foreign key is not possible if the posts table was created using
   * an engine different than the current default engine. In any case the foreign
   * key constraint has effect only if the table engine is set to InnoDB.
   * @return bool
   */
  private static function can_create_posts_foreign_key()
  {
    // phpcs:disable WordPress.DB.DirectDatabaseQuery
    global $wpdb;
    $posts_table_engine = $wpdb->get_var(
      $wpdb->prepare(
        "SELECT ENGINE FROM information_schema.tables WHERE table_name = %s",
        $wpdb->prefix . 'posts'
      )
    );
    $default_engine = $wpdb->get_var(
      "SELECT ENGINE FROM information_schema.ENGINES WHERE SUPPORT = 'DEFAULT'"
    );
    return $posts_table_engine === $default_engine;
    // phpcs:enable
  }

  public static function drop_tables()
  {
    global $wpdb;
    // phpcs:disable WordPress.DB.DirectDatabaseQuery
    $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}regi_fair_event_post");
    $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}regi_fair_event_registration_value");
    $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}regi_fair_event_registration");
    $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}regi_fair_event_form_field");
    $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}regi_fair_event");
    $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}regi_fair_event_template_form_field");
    $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}regi_fair_event_template");
    // phpcs:enable
    delete_option(REGI_FAIR_DB_VERSION_KEY);
    delete_option('regi_fair_settings');
  }

  private static function create_table(string $table_name, string $sql_fields): string
  {
    global $wpdb;
    $table_name = REGI_FAIR_DB::get_table_name($table_name);
    $charset_collate = $wpdb->get_charset_collate();
    $sql = "CREATE TABLE $table_name ($sql_fields) $charset_collate;";
    dbDelta($sql);
    return $table_name;
  }
}