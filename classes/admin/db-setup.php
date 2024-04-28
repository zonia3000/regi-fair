<?php

require_once ABSPATH . 'wp-admin/includes/upgrade.php';

define('WPOE_DB_VERSION_KEY', 'wpoe_db_version');
define('WPOE_DB_VERSION', '1.0');
require_once(WPOE_PLUGIN_DIR . 'classes/db.php');

class WPOE_DB_Setup
{
    public static function create_tables()
    {
        global $wpdb;

        $event_table = WPOE_DB_Setup::create_table('event', "
          id bigint NOT NULL AUTO_INCREMENT,
          name varchar(255) NOT NULL,
          date date NOT NULL,
          autoremove_submissions bit DEFAULT 1,
          autoremove_submissions_period int DEFAULT 30,
          max_participants int DEFAULT NULL,
          waiting_list bit DEFAULT 0,
          PRIMARY KEY  (id)
        ");

        $event_form_field_table = WPOE_DB_Setup::create_table('event_form_field', "
          id bigint NOT NULL AUTO_INCREMENT,
          event_id bigint NOT NULL,
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

        $event_template_table = WPOE_DB_Setup::create_table('event_template', "
          id bigint NOT NULL AUTO_INCREMENT,
          name varchar(255) NOT NULL,
          autoremove_submissions bit DEFAULT 1,
          autoremove_submissions_period int DEFAULT 30,
          waiting_list bit DEFAULT 0,
          PRIMARY KEY  (id)
        ");

        WPOE_DB_Setup::create_table('event_template_form_field', "
          id bigint NOT NULL AUTO_INCREMENT,
          template_id bigint NOT NULL,
          label varchar(255) NOT NULL,
          type varchar(255) NOT NULL,
          description text NULL,
          required bit DEFAULT 1,
          extra text NULL,
          position int NOT NULL,
          PRIMARY KEY  (id),
          FOREIGN KEY (template_id) REFERENCES $event_template_table (id)
        ");

        $event_registration_table = WPOE_DB_Setup::create_table('event_registration', "
          id bigint NOT NULL AUTO_INCREMENT,
          event_id bigint NOT NULL,
          registration_token varchar(255) NULL,
          inserted_at timestamp DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY  (id),
          FOREIGN KEY (event_id) REFERENCES $event_table (id)
        ");

        WPOE_DB_Setup::create_table('event_registration_value', "
          registration_id bigint NOT NULL,
          field_id bigint NOT NULL,
          field_value text NULL,
          PRIMARY KEY  (registration_id, field_id),
          FOREIGN KEY (registration_id) REFERENCES $event_registration_table (id),
          FOREIGN KEY (field_id) REFERENCES $event_form_field_table (id)
        ");

        add_option(WPOE_DB_VERSION_KEY, WPOE_DB_VERSION);
    }

    public static function drop_tables()
    {
        global $wpdb;
        $tables = ['event_form_field', 'event', 'event_template', 'event_template_form_field', 'event_registration', 'event_registration_value'];

        foreach ($tables as $table) {
            $wpdb->query('DROP TABLE IF EXISTS ' . WPOE_DB::get_table_name($table));
        }

        delete_option(WPOE_DB_VERSION_KEY);
    }

    private static function create_table(string $table_name, string $sql_fields): string
    {
        global $wpdb;
        $table_name = WPOE_DB::get_table_name($table_name);
        $charset_collate = $wpdb->get_charset_collate();
        $sql = "CREATE TABLE $table_name ($sql_fields) $charset_collate;";
        dbDelta($sql);
        return $table_name;
    }
}