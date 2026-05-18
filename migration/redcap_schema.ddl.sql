CREATE TABLE `redcap_actions` (
`action_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`survey_id` int(10) DEFAULT NULL,
`action_trigger` enum('MANUAL','ENDOFSURVEY','SURVEYQUESTION') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`action_response` enum('NONE','EMAIL_PRIMARY','EMAIL_SECONDARY','EMAIL_TERTIARY','STOPSURVEY','PROMPT') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`custom_text` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`recipient_id` int(10) DEFAULT NULL COMMENT 'FK user_information',
PRIMARY KEY (`action_id`),
UNIQUE KEY `survey_recipient_id` (`survey_id`,`recipient_id`),
KEY `project_id` (`project_id`),
KEY `recipient_id` (`recipient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_ai_log` (
`ai_id` int(11) NOT NULL AUTO_INCREMENT,
`ts` datetime DEFAULT NULL,
`service` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_id` int(11) DEFAULT NULL,
`user_id` int(11) DEFAULT NULL,
`num_chars_sent` int(11) DEFAULT NULL,
`num_words_sent` int(11) DEFAULT NULL,
`num_chars_received` int(11) DEFAULT NULL,
`num_words_received` int(11) DEFAULT NULL,
PRIMARY KEY (`ai_id`),
KEY `project_id` (`project_id`),
KEY `ts_type` (`ts`,`type`),
KEY `type_project` (`type`,`project_id`),
KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_alerts` (
`alert_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`alert_title` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`alert_type` enum('EMAIL','SMS','VOICE_CALL','SENDGRID_TEMPLATE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EMAIL',
`alert_stop_type` enum('RECORD','RECORD_EVENT','RECORD_EVENT_INSTRUMENT','RECORD_INSTRUMENT','RECORD_EVENT_INSTRUMENT_INSTANCE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RECORD_EVENT_INSTRUMENT_INSTANCE',
`email_deleted` tinyint(1) NOT NULL DEFAULT '0',
`alert_expiration` datetime DEFAULT NULL,
`form_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Instrument Name',
`form_name_event` int(10) DEFAULT NULL COMMENT 'Event ID',
`alert_condition` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Conditional logic',
`ensure_logic_still_true` tinyint(1) NOT NULL DEFAULT '0',
`do_not_clear_recurrences` tinyint(1) NOT NULL DEFAULT '0',
`prevent_piping_identifiers` tinyint(1) NOT NULL DEFAULT '1',
`email_incomplete` tinyint(1) DEFAULT '0' COMMENT 'Send alert for any form status?',
`email_from` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email From',
`email_from_display` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email sender display name',
`email_to` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email To',
`phone_number_to` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`email_cc` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email CC',
`email_bcc` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email BCC',
`email_subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Subject',
`alert_message` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Message',
`email_failed` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`email_attachment_variable` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'REDCap file variables',
`email_attachment1` int(10) DEFAULT NULL,
`email_attachment2` int(10) DEFAULT NULL,
`email_attachment3` int(10) DEFAULT NULL,
`email_attachment4` int(10) DEFAULT NULL,
`email_attachment5` int(10) DEFAULT NULL,
`email_repetitive` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Re-send alert on form re-save?',
`email_repetitive_change` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Re-send alert on form re-save if data has been added or modified?',
`email_repetitive_change_calcs` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Include calc fields for email_repetitive_change?',
`cron_send_email_on` enum('now','date','time_lag','next_occurrence') COLLATE utf8mb4_unicode_ci DEFAULT 'now' COMMENT 'When to send alert',
`cron_send_email_on_date` datetime DEFAULT NULL COMMENT 'Exact time to send',
`cron_send_email_on_time_lag_days` int(4) DEFAULT NULL,
`cron_send_email_on_time_lag_hours` int(3) DEFAULT NULL,
`cron_send_email_on_time_lag_minutes` int(3) DEFAULT NULL,
`cron_send_email_on_field` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`cron_send_email_on_field_after` enum('before','after') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'after',
`cron_send_email_on_next_day_type` enum('DAY','WEEKDAY','WEEKENDDAY','SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DAY',
`cron_send_email_on_next_time` time DEFAULT NULL,
`cron_repeat_for` float NOT NULL DEFAULT '0' COMMENT 'Repeat every # of days',
`cron_repeat_for_units` enum('DAYS','HOURS','MINUTES') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DAYS',
`cron_repeat_for_max` smallint(4) DEFAULT NULL,
`email_timestamp_sent` datetime DEFAULT NULL COMMENT 'Time last alert was sent',
`email_sent` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Has at least one alert been sent?',
`alert_order` int(10) DEFAULT NULL,
`sendgrid_template_id` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`sendgrid_template_data` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`sendgrid_mail_send_configuration` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`alert_id`),
KEY `alert_expiration` (`alert_expiration`),
KEY `email_attachment1` (`email_attachment1`),
KEY `email_attachment2` (`email_attachment2`),
KEY `email_attachment3` (`email_attachment3`),
KEY `email_attachment4` (`email_attachment4`),
KEY `email_attachment5` (`email_attachment5`),
KEY `form_name_event` (`form_name_event`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_alerts_recurrence` (
`aq_id` int(10) NOT NULL AUTO_INCREMENT,
`alert_id` int(10) DEFAULT NULL,
`creation_date` datetime DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`instrument` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`instance` smallint(4) DEFAULT NULL,
`send_option` enum('now','date','time_lag','next_occurrence') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'now',
`times_sent` smallint(4) DEFAULT NULL,
`last_sent` datetime DEFAULT NULL,
`status` enum('IDLE','QUEUED','SENDING') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IDLE',
`first_send_time` datetime DEFAULT NULL,
`next_send_time` datetime DEFAULT NULL,
PRIMARY KEY (`aq_id`),
UNIQUE KEY `alert_id_record_instrument_instance` (`alert_id`,`record`,`event_id`,`instrument`,`instance`),
KEY `alert_id_status_times_sent` (`status`,`alert_id`,`times_sent`),
KEY `creation_date` (`creation_date`),
KEY `event_id` (`event_id`),
KEY `first_send_time` (`first_send_time`),
KEY `last_sent` (`last_sent`),
KEY `next_send_time_alert_id_status` (`next_send_time`,`alert_id`,`status`),
KEY `send_option` (`send_option`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_alerts_sent` (
`alert_sent_id` int(10) NOT NULL AUTO_INCREMENT,
`alert_id` int(10) NOT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`instrument` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`instance` smallint(4) DEFAULT '1',
`last_sent` datetime DEFAULT NULL,
PRIMARY KEY (`alert_sent_id`),
UNIQUE KEY `alert_id_record_event_instrument_instance` (`alert_id`,`record`,`event_id`,`instrument`,`instance`),
KEY `event_id_record_alert_id` (`event_id`,`record`,`alert_id`),
KEY `last_sent` (`last_sent`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_alerts_sent_log` (
`alert_sent_log_id` int(10) NOT NULL AUTO_INCREMENT,
`alert_sent_id` int(10) DEFAULT NULL,
`alert_type` enum('EMAIL','SMS','VOICE_CALL','SENDGRID_TEMPLATE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EMAIL',
`time_sent` datetime DEFAULT NULL,
`email_from` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`email_to` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`phone_number_to` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`email_cc` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`email_bcc` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`subject` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`message` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`attachment_names` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`alert_sent_log_id`),
KEY `alert_sent_id_time_sent` (`alert_sent_id`,`time_sent`),
KEY `email_from` (`email_from`),
KEY `time_sent` (`time_sent`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_auth` (
`username` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
`password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Hash of user''s password',
`password_salt` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Unique random salt for password',
`legacy_hash` int(1) NOT NULL DEFAULT '0' COMMENT 'Using older legacy hash for password storage?',
`temp_pwd` int(1) NOT NULL DEFAULT '0' COMMENT 'Flag to force user to re-enter password',
`password_question` int(10) DEFAULT NULL COMMENT 'PK of question',
`password_answer` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Hashed answer to password recovery question',
`password_question_reminder` datetime DEFAULT NULL COMMENT 'When to prompt user to set up security question',
`password_reset_key` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`username`),
UNIQUE KEY `password_reset_key` (`password_reset_key`),
KEY `password_question` (`password_question`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_auth_history` (
`username` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
`password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
`timestamp` datetime DEFAULT NULL,
KEY `username_password` (`username`(191),`password`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores last 5 passwords';

CREATE TABLE `redcap_auth_questions` (
`qid` int(10) NOT NULL AUTO_INCREMENT,
`question` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`qid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_cache` (
`cache_id` bigint(19) NOT NULL AUTO_INCREMENT,
`project_id` int(11) NOT NULL,
`cache_key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
`data` longblob DEFAULT NULL,
`ts` datetime DEFAULT NULL,
`expiration` datetime DEFAULT NULL,
`invalidation_strategies` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`cache_id`),
UNIQUE KEY `project_id_cache_key` (`project_id`,`cache_key`),
KEY `cache_key` (`cache_key`),
KEY `expiration` (`expiration`),
KEY `ts` (`ts`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_cde_cache` (
`cache_id` int(10) NOT NULL AUTO_INCREMENT,
`tinyId` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`publicId` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`steward` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`question` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`choices` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`updated_on` datetime DEFAULT NULL,
PRIMARY KEY (`cache_id`),
UNIQUE KEY `publicId` (`publicId`),
UNIQUE KEY `tinyId` (`tinyId`),
KEY `steward` (`steward`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_cde_field_mapping` (
`project_id` int(10) DEFAULT NULL,
`field_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`tinyId` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`publicId` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`questionId` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`steward` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`web_service` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`org_selected` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
UNIQUE KEY `project_field` (`project_id`,`field_name`),
KEY `org_project` (`org_selected`,`project_id`),
KEY `publicId` (`publicId`),
KEY `questionId` (`questionId`),
KEY `steward_project` (`steward`,`project_id`),
KEY `tinyId_project` (`tinyId`,`project_id`),
KEY `web_service` (`web_service`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_config` (
`field_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
`value` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`field_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores global settings';

CREATE TABLE `redcap_crons` (
`cron_id` int(10) NOT NULL AUTO_INCREMENT,
`cron_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Unique name for each job',
`external_module_id` int(11) DEFAULT NULL,
`cron_description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`cron_enabled` enum('ENABLED','DISABLED') COLLATE utf8mb4_unicode_ci DEFAULT 'ENABLED',
`cron_frequency` int(10) DEFAULT NULL COMMENT 'seconds',
`cron_max_run_time` int(10) DEFAULT NULL COMMENT 'max # seconds a cron should run',
`cron_instances_max` int(2) NOT NULL DEFAULT '1' COMMENT 'Number of instances that can run simultaneously',
`cron_instances_current` int(2) NOT NULL DEFAULT '0' COMMENT 'Current number of instances running',
`cron_last_run_start` datetime DEFAULT NULL,
`cron_last_run_end` datetime DEFAULT NULL,
`cron_times_failed` int(2) NOT NULL DEFAULT '0' COMMENT 'After X failures, set as Disabled',
`cron_external_url` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'URL to call for custom jobs not defined by REDCap',
PRIMARY KEY (`cron_id`),
UNIQUE KEY `cron_name_module_id` (`cron_name`,`external_module_id`),
KEY `external_module_id` (`external_module_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='List of all jobs to be run by universal cron job';

CREATE TABLE `redcap_crons_datediff` (
`dd_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`asi_updated_at` datetime DEFAULT NULL COMMENT 'Last evaluation for ASIs',
`asi_last_update_start` datetime DEFAULT NULL,
`asi_status` enum('QUEUED','PROCESSING') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Status for ASIs',
`alert_updated_at` datetime DEFAULT NULL COMMENT 'Last evaluation for Alerts',
`alert_last_update_start` datetime DEFAULT NULL,
`alert_status` enum('QUEUED','PROCESSING') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Status for Alerts',
PRIMARY KEY (`dd_id`),
UNIQUE KEY `project_record` (`project_id`,`record`),
KEY `alert_last_update_status` (`alert_last_update_start`,`alert_status`),
KEY `alert_status_updated_at` (`alert_status`,`alert_updated_at`),
KEY `alert_updated_at` (`alert_updated_at`),
KEY `asi_last_update_status` (`asi_last_update_start`,`asi_status`),
KEY `asi_status_updated_at` (`asi_status`,`asi_updated_at`),
KEY `asi_updated_at` (`asi_updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_crons_history` (
`ch_id` int(10) NOT NULL AUTO_INCREMENT,
`cron_id` int(10) DEFAULT NULL,
`cron_run_start` datetime DEFAULT NULL,
`cron_run_end` datetime DEFAULT NULL,
`cron_run_status` enum('PROCESSING','COMPLETED','FAILED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`cron_info` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Any pertinent info that might be logged',
PRIMARY KEY (`ch_id`),
KEY `cron_id` (`cron_id`),
KEY `cron_run_end` (`cron_run_end`),
KEY `cron_run_start` (`cron_run_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='History of all jobs run by universal cron job';

CREATE TABLE `redcap_custom_queries` (
`qid` int(10) NOT NULL AUTO_INCREMENT,
`title` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`query` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`qid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_custom_queries_folders` (
`folder_id` int(10) NOT NULL AUTO_INCREMENT,
`name` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`position` smallint(4) DEFAULT NULL,
PRIMARY KEY (`folder_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_custom_queries_folders_items` (
`folder_id` int(10) DEFAULT NULL,
`qid` int(10) DEFAULT NULL,
UNIQUE KEY `folder_id_qid` (`folder_id`,`qid`),
KEY `qid` (`qid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_dashboard_ip_location_cache` (
`ip` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
`latitude` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`longitude` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`city` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`region` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`country` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`ip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_data` (
`project_id` int(10) NOT NULL DEFAULT '0',
`event_id` int(10) DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`field_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`value` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`instance` smallint(4) DEFAULT NULL,
KEY `event_id_instance` (`event_id`,`instance`),
KEY `proj_record_field` (`project_id`,`record`,`field_name`),
KEY `project_field` (`project_id`,`field_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_data2` (
`project_id` int(10) NOT NULL DEFAULT '0',
`event_id` int(10) DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`field_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`value` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`instance` smallint(4) DEFAULT NULL,
KEY `event_id_instance` (`event_id`,`instance`),
KEY `proj_record_field` (`project_id`,`record`,`field_name`),
KEY `project_field` (`project_id`,`field_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_data3` (
`project_id` int(10) NOT NULL DEFAULT '0',
`event_id` int(10) DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`field_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`value` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`instance` smallint(4) DEFAULT NULL,
KEY `event_id_instance` (`event_id`,`instance`),
KEY `proj_record_field` (`project_id`,`record`,`field_name`),
KEY `project_field` (`project_id`,`field_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_data4` (
`project_id` int(10) NOT NULL DEFAULT '0',
`event_id` int(10) DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`field_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`value` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`instance` smallint(4) DEFAULT NULL,
KEY `event_id_instance` (`event_id`,`instance`),
KEY `proj_record_field` (`project_id`,`record`,`field_name`),
KEY `project_field` (`project_id`,`field_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_data5` (
`project_id` int(10) NOT NULL DEFAULT '0',
`event_id` int(10) DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`field_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`value` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`instance` smallint(4) DEFAULT NULL,
KEY `event_id_instance` (`event_id`,`instance`),
KEY `proj_record_field` (`project_id`,`record`,`field_name`),
KEY `project_field` (`project_id`,`field_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_data6` (
`project_id` int(10) NOT NULL DEFAULT '0',
`event_id` int(10) DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`field_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`value` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`instance` smallint(4) DEFAULT NULL,
KEY `event_id_instance` (`event_id`,`instance`),
KEY `proj_record_field` (`project_id`,`record`,`field_name`),
KEY `project_field` (`project_id`,`field_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_data_access_groups` (
`group_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`group_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`group_id`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_data_access_groups_users` (
`project_id` int(10) DEFAULT NULL,
`group_id` int(10) DEFAULT NULL,
`username` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
UNIQUE KEY `group_id` (`group_id`,`username`),
UNIQUE KEY `username` (`username`,`project_id`,`group_id`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_data_dictionaries` (
`dd_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`doc_id` int(10) DEFAULT NULL,
`ui_id` int(10) DEFAULT NULL,
PRIMARY KEY (`dd_id`),
KEY `doc_id` (`doc_id`),
KEY `project_id` (`project_id`),
KEY `ui_id` (`ui_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_data_import` (
`import_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`user_id` int(10) DEFAULT NULL COMMENT 'User importing the data',
`dag_id` int(10) DEFAULT NULL COMMENT 'Current DAG of user importing data',
`filename` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`upload_time` datetime DEFAULT NULL,
`completed_time` datetime DEFAULT NULL,
`total_processing_time` int(10) DEFAULT NULL COMMENT 'seconds',
`status` enum('INITIALIZING','QUEUED','PROCESSING','COMPLETED','FAILED','CANCELED','PAUSED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INITIALIZING',
`csv_header` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`records_provided` int(10) DEFAULT NULL,
`records_imported` int(10) DEFAULT NULL,
`total_errors` int(10) DEFAULT NULL,
`delimiter` enum(',',';','TAB') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT ',',
`date_format` enum('YMD','MDY','DMY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'YMD',
`overwrite_behavior` enum('normal','overwrite') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
`force_auto_number` tinyint(1) NOT NULL DEFAULT '0',
`change_reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`import_id`),
KEY `completed_time` (`completed_time`),
KEY `dag_id` (`dag_id`),
KEY `project_id` (`project_id`),
KEY `status_completed_time` (`status`,`completed_time`),
KEY `upload_time` (`upload_time`),
KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_data_import_rows` (
`row_id` int(10) NOT NULL AUTO_INCREMENT,
`import_id` int(10) NOT NULL,
`record_provided` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`row_status` enum('QUEUED','PROCESSING','COMPLETED','FAILED','CANCELED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'QUEUED',
`start_time` datetime DEFAULT NULL,
`end_time` datetime DEFAULT NULL,
`total_time` int(10) DEFAULT NULL COMMENT 'milliseconds',
`row_data` longtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`error_count` int(10) DEFAULT NULL,
`errors` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`row_id`),
UNIQUE KEY `import_row_id` (`import_id`,`row_id`),
KEY `end_time` (`end_time`),
KEY `event_id` (`event_id`),
KEY `import_id_record_event_id` (`import_id`,`record`,`event_id`),
KEY `import_id_row_status` (`import_id`,`row_status`),
KEY `row_status_end_time` (`row_status`,`end_time`),
KEY `start_time` (`start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_data_quality_resolutions` (
`res_id` int(10) NOT NULL AUTO_INCREMENT,
`status_id` int(10) DEFAULT NULL COMMENT 'FK from data_quality_status',
`ts` datetime DEFAULT NULL COMMENT 'Date/time added',
`user_id` int(10) DEFAULT NULL COMMENT 'Current user',
`response_requested` int(1) NOT NULL DEFAULT '0' COMMENT 'Is a response requested?',
`response` enum('DATA_MISSING','TYPOGRAPHICAL_ERROR','CONFIRMED_CORRECT','WRONG_SOURCE','OTHER') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Response category if user responded to query',
`comment` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Text for comment',
`current_query_status` enum('OPEN','CLOSED','VERIFIED','DEVERIFIED') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Current query status of thread',
`upload_doc_id` int(10) DEFAULT NULL COMMENT 'FK of uploaded document',
`field_comment_edited` int(1) NOT NULL DEFAULT '0' COMMENT 'Denote if field comment was edited',
PRIMARY KEY (`res_id`),
KEY `doc_id` (`upload_doc_id`),
KEY `status_id` (`status_id`),
KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_data_quality_rules` (
`rule_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`rule_order` int(3) DEFAULT '1',
`rule_name` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`rule_logic` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`real_time_execute` int(1) NOT NULL DEFAULT '0' COMMENT 'Run in real-time on data entry forms?',
PRIMARY KEY (`rule_id`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_data_quality_status` (
`status_id` int(10) NOT NULL AUTO_INCREMENT,
`rule_id` int(10) DEFAULT NULL COMMENT 'FK from data_quality_rules table',
`pd_rule_id` int(2) DEFAULT NULL COMMENT 'Name of pre-defined rules',
`non_rule` int(1) DEFAULT NULL COMMENT '1 for non-rule, else NULL',
`project_id` int(11) DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`field_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Only used if field-level is required',
`repeat_instrument` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`instance` smallint(4) NOT NULL DEFAULT '1',
`status` int(2) DEFAULT NULL COMMENT 'Current status of discrepancy',
`exclude` int(1) NOT NULL DEFAULT '0' COMMENT 'Hide from results',
`query_status` enum('OPEN','CLOSED','VERIFIED','DEVERIFIED') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Status of data query',
`assigned_user_id` int(10) DEFAULT NULL COMMENT 'UI ID of user assigned to query',
PRIMARY KEY (`status_id`),
UNIQUE KEY `nonrule_proj_record_event_field` (`non_rule`,`project_id`,`record`,`event_id`,`field_name`,`instance`),
UNIQUE KEY `pd_rule_proj_record_event_field` (`pd_rule_id`,`record`,`event_id`,`field_name`,`project_id`,`instance`),
UNIQUE KEY `rule_record_event` (`rule_id`,`record`,`event_id`,`instance`),
KEY `assigned_user_id` (`assigned_user_id`),
KEY `event_record` (`event_id`,`record`),
KEY `pd_rule_proj_record_event` (`pd_rule_id`,`record`,`event_id`,`project_id`,`instance`),
KEY `project_query_status` (`project_id`,`query_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_ddp_log_view` (
`ml_id` int(10) NOT NULL AUTO_INCREMENT,
`time_viewed` datetime DEFAULT NULL COMMENT 'Time the data was displayed to the user',
`user_id` int(10) DEFAULT NULL COMMENT 'PK from user_information table',
`project_id` int(10) DEFAULT NULL,
`source_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ID value from source system (e.g. MRN)',
PRIMARY KEY (`ml_id`),
KEY `project_id` (`project_id`),
KEY `source_id` (`source_id`(191)),
KEY `time_viewed` (`time_viewed`),
KEY `user_project` (`user_id`,`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_ddp_log_view_data` (
`ml_id` int(10) DEFAULT NULL COMMENT 'PK from ddp_log_view table',
`source_field` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Field name from source system',
`source_timestamp` datetime DEFAULT NULL COMMENT 'Date of service from source system',
`md_id` int(10) DEFAULT NULL COMMENT 'PK from ddp_records_data table',
KEY `md_id` (`md_id`),
KEY `ml_id` (`ml_id`),
KEY `source_field` (`source_field`),
KEY `source_timestamp` (`source_timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_ddp_mapping` (
`map_id` int(10) NOT NULL AUTO_INCREMENT,
`external_source_field_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Unique name of field mapped from external data source',
`is_record_identifier` int(1) DEFAULT NULL COMMENT '1=Yes, Null=No',
`project_id` int(10) DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`field_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`temporal_field` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'REDCap date field',
`preselect` enum('MIN','MAX','FIRST','LAST','NEAR') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Preselect a source value for temporal fields only',
PRIMARY KEY (`map_id`),
UNIQUE KEY `project_field_event_source` (`project_id`,`event_id`,`field_name`,`external_source_field_name`),
UNIQUE KEY `project_identifier` (`project_id`,`is_record_identifier`),
KEY `event_id` (`event_id`),
KEY `external_source_field_name` (`external_source_field_name`),
KEY `field_name` (`field_name`),
KEY `temporal_field` (`temporal_field`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_ddp_preview_fields` (
`project_id` int(10) NOT NULL,
`field1` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`field2` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`field3` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`field4` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`field5` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_ddp_records` (
`mr_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`updated_at` datetime DEFAULT NULL COMMENT 'Time of last data fetch',
`item_count` int(10) DEFAULT NULL COMMENT 'New item count (as of last viewing)',
`fetch_status` enum('QUEUED','FETCHING') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Current status of data fetch for this record',
`future_date_count` int(10) NOT NULL DEFAULT '0' COMMENT 'Count of datetime reference fields with values in the future',
PRIMARY KEY (`mr_id`),
UNIQUE KEY `project_record` (`project_id`,`record`),
KEY `project_id_fetch_status` (`fetch_status`,`project_id`),
KEY `project_updated_at` (`updated_at`,`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_ddp_records_data` (
`md_id` int(10) NOT NULL AUTO_INCREMENT,
`map_id` int(10) NOT NULL COMMENT 'PK from ddp_mapping table',
`mr_id` int(10) DEFAULT NULL COMMENT 'PK from ddp_records table',
`source_timestamp` datetime DEFAULT NULL COMMENT 'Date of service from source system',
`source_value` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Encrypted data value from source system',
`source_value2` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`adjudicated` int(1) NOT NULL DEFAULT '0' COMMENT 'Has source value been adjudicated?',
`exclude` int(1) NOT NULL DEFAULT '0' COMMENT 'Has source value been excluded?',
PRIMARY KEY (`md_id`),
KEY `map_id_mr_id_timestamp_value` (`map_id`,`mr_id`,`source_timestamp`,`source_value2`(128)),
KEY `map_id_timestamp` (`map_id`,`source_timestamp`),
KEY `mr_id_adjudicated` (`mr_id`,`adjudicated`),
KEY `mr_id_exclude` (`mr_id`,`exclude`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cached data values from web service';

CREATE TABLE `redcap_descriptive_popups` (
`popup_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`hex_link_color` char(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`inline_text` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`inline_text_popup_description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`active_on_surveys` tinyint(1) NOT NULL DEFAULT '1',
`active_on_data_entry_forms` tinyint(1) NOT NULL DEFAULT '1',
`first_occurrence_only` tinyint(1) NOT NULL DEFAULT '0',
`list_instruments` longtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`list_survey_pages` longtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`popup_id`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_docs` (
`docs_id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(10) NOT NULL DEFAULT '0',
`docs_date` date DEFAULT NULL,
`docs_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`docs_size` double DEFAULT NULL,
`docs_type` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`docs_file` longblob DEFAULT NULL,
`docs_comment` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`docs_rights` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`export_file` int(1) NOT NULL DEFAULT '0',
`temp` int(1) NOT NULL DEFAULT '0' COMMENT 'Is file only a temp file?',
PRIMARY KEY (`docs_id`),
KEY `docs_name` (`docs_name`(191)),
KEY `project_id_comment` (`project_id`,`docs_comment`(190)),
KEY `project_id_export_file_temp` (`project_id`,`export_file`,`temp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_docs_attachments` (
`docs_id` int(10) NOT NULL,
PRIMARY KEY (`docs_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_docs_folders` (
`folder_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(11) DEFAULT NULL,
`name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`parent_folder_id` int(10) DEFAULT NULL,
`dag_id` int(11) DEFAULT NULL COMMENT 'DAG association',
`role_id` int(10) DEFAULT NULL COMMENT 'User role association',
`admin_only` tinyint(1) NOT NULL DEFAULT '0',
`deleted` tinyint(1) NOT NULL DEFAULT '0',
PRIMARY KEY (`folder_id`),
KEY `dag_id` (`dag_id`),
KEY `parent_folder_id` (`parent_folder_id`),
KEY `project_id_admin_only` (`project_id`,`admin_only`),
KEY `project_id_name_parent_id` (`project_id`,`name`,`parent_folder_id`,`deleted`),
KEY `role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_docs_folders_files` (
`docs_id` int(10) NOT NULL,
`folder_id` int(10) DEFAULT NULL,
PRIMARY KEY (`docs_id`),
UNIQUE KEY `docs_folder_id` (`docs_id`,`folder_id`),
KEY `folder_id` (`folder_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_docs_share` (
`docs_id` int(10) NOT NULL AUTO_INCREMENT,
`hash` varchar(100) CHARACTER SET latin1 COLLATE latin1_general_cs DEFAULT NULL,
PRIMARY KEY (`docs_id`),
UNIQUE KEY `hash` (`hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_docs_to_edocs` (
`docs_id` int(11) NOT NULL COMMENT 'PK redcap_docs',
`doc_id` int(11) NOT NULL COMMENT 'PK redcap_edocs_metadata',
PRIMARY KEY (`docs_id`,`doc_id`),
KEY `doc_id` (`doc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_econsent` (
`consent_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`survey_id` int(10) DEFAULT NULL,
`version` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`active` tinyint(1) NOT NULL DEFAULT '0',
`type_label` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`custom_econsent_label` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`firstname_field` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`firstname_event_id` int(11) DEFAULT NULL,
`lastname_field` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`lastname_event_id` int(11) DEFAULT NULL,
`dob_field` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`dob_event_id` int(11) DEFAULT NULL,
`allow_edit` tinyint(1) NOT NULL DEFAULT '0',
`signature_field1` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`signature_field2` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`signature_field3` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`signature_field4` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`signature_field5` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`consent_form_location_field` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Display consent form below this field',
PRIMARY KEY (`consent_id`),
UNIQUE KEY `survey_id` (`survey_id`),
KEY `dob_event_id` (`dob_event_id`),
KEY `firstname_event_id` (`firstname_event_id`),
KEY `lastname_event_id` (`lastname_event_id`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_econsent_forms` (
`consent_form_id` int(10) NOT NULL AUTO_INCREMENT,
`consent_id` int(10) DEFAULT NULL,
`version` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`consent_form_active` tinyint(1) DEFAULT NULL COMMENT 'null=Inactive, 1=Active',
`creation_time` datetime DEFAULT NULL,
`uploader` int(10) DEFAULT NULL,
`consent_form_pdf_doc_id` int(10) DEFAULT NULL COMMENT 'Consent form PDF document',
`consent_form_richtext` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Consent form text (alternate to PDF)',
`consent_form_filter_dag_id` int(10) DEFAULT NULL COMMENT 'Consent form DAG filter',
`consent_form_filter_lang_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Consent form MLM filter',
PRIMARY KEY (`consent_form_id`),
UNIQUE KEY `consent_id_version_active_dag_lang` (`consent_id`,`version`,`consent_form_active`,`consent_form_filter_dag_id`,`consent_form_filter_lang_id`),
KEY `consent_form_filter_dag_id` (`consent_form_filter_dag_id`),
KEY `consent_form_filter_lang_id` (`consent_form_filter_lang_id`),
KEY `consent_form_pdf_doc_id` (`consent_form_pdf_doc_id`),
KEY `uploader` (`uploader`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_edocs_data_mapping` (
`doc_id` int(10) NOT NULL,
`project_id` int(10) DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`field_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`instance` smallint(4) DEFAULT NULL,
PRIMARY KEY (`doc_id`),
KEY `event_id_record` (`event_id`,`record`),
KEY `proj_record_event_field` (`project_id`,`record`,`event_id`,`field_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_edocs_metadata` (
`doc_id` int(10) NOT NULL AUTO_INCREMENT,
`stored_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'stored name',
`mime_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`doc_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`doc_size` int(10) DEFAULT NULL,
`file_extension` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`gzipped` int(1) NOT NULL DEFAULT '0' COMMENT 'Is file gzip compressed?',
`project_id` int(10) DEFAULT NULL,
`stored_date` datetime DEFAULT NULL COMMENT 'stored date',
`delete_date` datetime DEFAULT NULL COMMENT 'date deleted',
`date_deleted_server` datetime DEFAULT NULL COMMENT 'When really deleted from server',
PRIMARY KEY (`doc_id`),
KEY `date_deleted` (`delete_date`,`date_deleted_server`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_ehr_access_tokens` (
`patient` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`mrn` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'If different from patient id',
`token_owner` int(11) DEFAULT NULL COMMENT 'REDCap User ID',
`expiration` datetime DEFAULT NULL,
`access_token` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`refresh_token` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`permission_Patient` tinyint(1) DEFAULT NULL,
`permission_Observation` tinyint(1) DEFAULT NULL,
`permission_Condition` tinyint(1) DEFAULT NULL,
`permission_MedicationOrder` tinyint(1) DEFAULT NULL,
`permission_AllergyIntolerance` tinyint(1) DEFAULT NULL,
`ehr_id` int(11) DEFAULT NULL,
UNIQUE KEY `token_owner_mrn_ehr` (`token_owner`,`mrn`,`ehr_id`),
UNIQUE KEY `token_owner_patient_ehr` (`token_owner`,`patient`,`ehr_id`),
KEY `access_token` (`access_token`(190)),
KEY `ehr_id` (`ehr_id`),
KEY `expiration` (`expiration`),
KEY `mrn` (`mrn`),
KEY `patient` (`patient`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_ehr_datamart_revisions` (
`id` int(11) unsigned NOT NULL AUTO_INCREMENT,
`project_id` int(11) DEFAULT NULL,
`request_id` int(11) DEFAULT NULL,
`user_id` int(11) DEFAULT NULL,
`mrns` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`date_min` date DEFAULT NULL,
`date_max` date DEFAULT NULL,
`fields` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`date_range_categories` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`approved` tinyint(1) NOT NULL DEFAULT '0',
`is_deleted` tinyint(1) NOT NULL DEFAULT '0',
`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
`executed_at` timestamp NULL DEFAULT NULL,
PRIMARY KEY (`id`),
UNIQUE KEY `request_id` (`request_id`),
KEY `project_id` (`project_id`),
KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_ehr_fhir_logs` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`user_id` int(11) DEFAULT NULL,
`fhir_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
`project_id` int(11) DEFAULT NULL COMMENT 'project ID is NULL during an EHR launch',
`resource_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
`status` int(11) NOT NULL,
`environment` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'CRON or direct user request',
`created_at` datetime DEFAULT NULL,
`mrn` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
`ehr_id` int(11) DEFAULT NULL,
PRIMARY KEY (`id`),
KEY `ehr_id` (`ehr_id`),
KEY `fhir_id_resource_type` (`fhir_id`,`resource_type`),
KEY `mrn` (`mrn`),
KEY `project_id_fhir_id` (`project_id`,`fhir_id`),
KEY `project_id_mrn` (`project_id`,`mrn`),
KEY `user_project_fhir_id_resource` (`user_id`,`project_id`,`fhir_id`,`resource_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_ehr_import_counts` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`ts` datetime DEFAULT NULL,
`type` enum('CDP','CDM','CDP-I') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CDP',
`adjudicated` tinyint(1) NOT NULL DEFAULT '0',
`project_id` int(11) DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`counts_Patient` mediumint(7) DEFAULT '0',
`counts_Observation` mediumint(7) DEFAULT '0',
`counts_Condition` mediumint(7) DEFAULT '0',
`counts_Medication` mediumint(7) DEFAULT '0',
`counts_AllergyIntolerance` mediumint(7) DEFAULT '0',
`counts_Encounter` mediumint(7) DEFAULT '0',
`counts_Immunization` mediumint(7) DEFAULT '0',
`counts_AdverseEvent` mediumint(7) DEFAULT '0',
PRIMARY KEY (`id`),
KEY `project_record` (`project_id`,`record`),
KEY `ts_project_adjud` (`ts`,`project_id`,`adjudicated`),
KEY `type_adjud_project_record` (`type`,`adjudicated`,`project_id`,`record`),
KEY `type_project_record` (`type`,`project_id`,`record`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_ehr_resource_import_details` (
`count_id` int(11) NOT NULL AUTO_INCREMENT,
`ehr_import_count_id` int(11) NOT NULL,
`category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
`resource` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
`count` mediumint(7) DEFAULT '0',
PRIMARY KEY (`count_id`),
KEY `ehr_import_count_id` (`ehr_import_count_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_ehr_resource_imports` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`ts` datetime DEFAULT NULL,
`type` enum('CDP','CDM','CDP-I') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CDP',
`adjudicated` tinyint(1) NOT NULL DEFAULT '0',
`project_id` int(11) DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`ehr_id` int(11) DEFAULT NULL,
PRIMARY KEY (`id`),
KEY `ehr_id` (`ehr_id`),
KEY `project_record` (`project_id`,`record`),
KEY `ts_project_adjud` (`ts`,`project_id`,`adjudicated`),
KEY `type_adjud_project_record` (`type`,`adjudicated`,`project_id`,`record`),
KEY `type_project_record` (`type`,`project_id`,`record`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_ehr_settings` (
`ehr_id` int(11) NOT NULL AUTO_INCREMENT,
`order` int(10) NOT NULL DEFAULT '1',
`ehr_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`client_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`client_secret` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`fhir_base_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`fhir_token_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`fhir_authorize_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`fhir_identity_provider` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`patient_identifier_string` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`fhir_custom_auth_params` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`ehr_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_ehr_token_rules` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(11) NOT NULL,
`user_id` int(11) DEFAULT NULL,
`priority` int(11) NOT NULL,
`allow` tinyint(1) NOT NULL DEFAULT '1',
`created_at` datetime DEFAULT NULL,
`updated_at` datetime DEFAULT NULL,
PRIMARY KEY (`id`),
UNIQUE KEY `project_id_userid` (`project_id`,`user_id`),
KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_ehr_user_map` (
`ehr_username` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`redcap_userid` int(11) DEFAULT NULL,
`ehr_id` int(11) DEFAULT NULL,
UNIQUE KEY `unique_ehr_username` (`ehr_id`,`ehr_username`),
UNIQUE KEY `unique_redcap_userid` (`ehr_id`,`redcap_userid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_ehr_user_projects` (
`project_id` int(11) DEFAULT NULL,
`redcap_userid` int(11) DEFAULT NULL,
UNIQUE KEY `project_id_userid` (`project_id`,`redcap_userid`),
KEY `redcap_userid` (`redcap_userid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_email_users_messages` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`subject` text COLLATE utf8mb4_unicode_ci NOT NULL,
`body` text COLLATE utf8mb4_unicode_ci NOT NULL,
`sent_by` int(11) NOT NULL,
`created_at` datetime DEFAULT NULL,
PRIMARY KEY (`id`),
KEY `created_at` (`created_at`),
KEY `sent_by` (`sent_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_email_users_queries` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`name` text COLLATE utf8mb4_unicode_ci NOT NULL,
`description` text COLLATE utf8mb4_unicode_ci NOT NULL,
`query` text COLLATE utf8mb4_unicode_ci NOT NULL,
`created_at` datetime DEFAULT NULL,
PRIMARY KEY (`id`),
KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_error_log` (
`error_id` int(10) NOT NULL AUTO_INCREMENT,
`log_view_id` bigint(19) DEFAULT NULL,
`time_of_error` datetime DEFAULT NULL,
`error` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`error_id`),
KEY `log_view_id` (`log_view_id`),
KEY `time_of_error` (`time_of_error`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_esignatures` (
`esign_id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`form_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`instance` smallint(4) NOT NULL DEFAULT '1',
`username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`timestamp` datetime DEFAULT NULL,
PRIMARY KEY (`esign_id`),
UNIQUE KEY `proj_rec_event_form_instance` (`project_id`,`record`,`event_id`,`form_name`,`instance`),
KEY `event_id` (`event_id`),
KEY `username` (`username`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_events_arms` (
`arm_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) NOT NULL DEFAULT '0',
`arm_num` int(2) NOT NULL DEFAULT '1',
`arm_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Arm 1',
PRIMARY KEY (`arm_id`),
UNIQUE KEY `proj_arm_num` (`project_id`,`arm_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_events_calendar` (
`cal_id` int(10) NOT NULL AUTO_INCREMENT,
`record` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_id` int(10) DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`baseline_date` date DEFAULT NULL,
`group_id` int(10) DEFAULT NULL,
`event_date` date DEFAULT NULL,
`event_time` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'HH:MM',
`event_status` int(2) DEFAULT NULL COMMENT 'NULL=Ad Hoc, 0=Due Date, 1=Scheduled, 2=Confirmed, 3=Cancelled, 4=No Show',
`note_type` int(2) DEFAULT NULL,
`notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`extra_notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`cal_id`),
KEY `event_id` (`event_id`),
KEY `group_id` (`group_id`),
KEY `project_date` (`project_id`,`event_date`),
KEY `project_record` (`project_id`,`record`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Calendar Data';

CREATE TABLE `redcap_events_calendar_feed` (
`feed_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`userid` int(11) DEFAULT NULL COMMENT 'NULL=survey participant',
`hash` varchar(100) CHARACTER SET latin1 COLLATE latin1_general_cs DEFAULT NULL,
PRIMARY KEY (`feed_id`),
UNIQUE KEY `hash` (`hash`),
UNIQUE KEY `project_record_user` (`project_id`,`record`,`userid`),
KEY `project_userid` (`project_id`,`userid`),
KEY `userid` (`userid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_events_forms` (
`event_id` int(10) NOT NULL DEFAULT '0',
`form_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
UNIQUE KEY `event_form` (`event_id`,`form_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_events_metadata` (
`event_id` int(10) NOT NULL AUTO_INCREMENT,
`arm_id` int(10) NOT NULL DEFAULT '0' COMMENT 'FK for events_arms',
`day_offset` float NOT NULL DEFAULT '0' COMMENT 'Days from Start Date',
`offset_min` float NOT NULL DEFAULT '0',
`offset_max` float NOT NULL DEFAULT '0',
`descrip` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Event 1' COMMENT 'Event Name',
`external_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`custom_event_label` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`event_id`),
KEY `arm_dayoffset_descrip` (`arm_id`,`day_offset`,`descrip`),
KEY `day_offset` (`day_offset`),
KEY `descrip` (`descrip`),
KEY `external_id` (`external_id`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_events_repeat` (
`event_id` int(10) DEFAULT NULL,
`form_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`custom_repeat_form_label` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
UNIQUE KEY `event_id_form` (`event_id`,`form_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_external_links` (
`ext_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`link_order` int(5) NOT NULL DEFAULT '1',
`link_url` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`link_label` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`open_new_window` int(10) NOT NULL DEFAULT '0',
`link_type` enum('LINK','POST_AUTHKEY','REDCAP_PROJECT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'LINK',
`user_access` enum('ALL','DAG','SELECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ALL',
`append_record_info` int(1) NOT NULL DEFAULT '0' COMMENT 'Append record and event to URL',
`append_pid` int(1) NOT NULL DEFAULT '0' COMMENT 'Append project_id to URL',
`link_to_project_id` int(10) DEFAULT NULL,
PRIMARY KEY (`ext_id`),
KEY `link_to_project_id` (`link_to_project_id`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_external_links_dags` (
`ext_id` int(11) NOT NULL AUTO_INCREMENT,
`group_id` int(10) NOT NULL DEFAULT '0',
PRIMARY KEY (`ext_id`,`group_id`),
KEY `group_id` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_external_links_exclude_projects` (
`ext_id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(10) NOT NULL DEFAULT '0',
PRIMARY KEY (`ext_id`,`project_id`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Projects to exclude for global external links';

CREATE TABLE `redcap_external_links_users` (
`ext_id` int(11) NOT NULL AUTO_INCREMENT,
`username` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
PRIMARY KEY (`ext_id`,`username`),
KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_external_module_settings` (
`external_module_id` int(11) NOT NULL,
`project_id` int(11) DEFAULT NULL,
`key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
`type` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'string',
`value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
KEY `external_module_id` (`external_module_id`),
KEY `key` (`key`(191)),
KEY `project_id` (`project_id`),
KEY `value` (`value`(190))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_external_modules` (
`external_module_id` int(11) NOT NULL AUTO_INCREMENT,
`directory_prefix` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
PRIMARY KEY (`external_module_id`),
UNIQUE KEY `directory_prefix` (`directory_prefix`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_external_modules_downloads` (
`module_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
`module_id` int(11) DEFAULT NULL,
`time_downloaded` datetime DEFAULT NULL,
`time_deleted` datetime DEFAULT NULL,
PRIMARY KEY (`module_name`),
UNIQUE KEY `module_id` (`module_id`),
KEY `time_deleted` (`time_deleted`),
KEY `time_downloaded` (`time_downloaded`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Modules downloaded from the external modules repository';

CREATE TABLE `redcap_external_modules_log` (
`log_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
`timestamp` datetime NOT NULL,
`ui_id` int(11) DEFAULT NULL,
`ip` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`external_module_id` int(11) DEFAULT NULL,
`project_id` int(11) DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`message` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
PRIMARY KEY (`log_id`),
KEY `external_module_id` (`external_module_id`),
KEY `message` (`message`(190)),
KEY `record` (`record`),
KEY `redcap_log_redcap_projects_record` (`project_id`,`record`),
KEY `timestamp` (`timestamp`),
KEY `ui_id` (`ui_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_external_modules_log_parameters` (
`log_id` bigint(20) unsigned NOT NULL,
`name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
`value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
PRIMARY KEY (`log_id`,`name`(191)),
KEY `name` (`name`(191)),
KEY `value` (`value`(190))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_folders` (
`folder_id` int(10) NOT NULL AUTO_INCREMENT,
`ui_id` int(10) DEFAULT NULL,
`name` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`position` int(10) DEFAULT NULL,
`foreground` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`background` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`collapsed` tinyint(1) NOT NULL DEFAULT '0',
PRIMARY KEY (`folder_id`),
UNIQUE KEY `ui_id_name_uniq` (`ui_id`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_folders_projects` (
`ui_id` int(10) DEFAULT NULL,
`project_id` int(10) DEFAULT NULL,
`folder_id` int(10) DEFAULT NULL,
UNIQUE KEY `ui_id_project_folder` (`ui_id`,`project_id`,`folder_id`),
KEY `folder_id` (`folder_id`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_form_display_logic_conditions` (
`control_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`control_condition` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`apply_to_data_entry` tinyint(1) NOT NULL DEFAULT '1',
`apply_to_survey` tinyint(1) NOT NULL DEFAULT '0',
`apply_to_mycap` tinyint(1) NOT NULL DEFAULT '0',
PRIMARY KEY (`control_id`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_form_display_logic_targets` (
`control_id` int(10) DEFAULT NULL,
`form_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
UNIQUE KEY `event_form_control` (`event_id`,`form_name`,`control_id`),
KEY `control_event` (`control_id`,`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_forms` (
`project_id` int(10) DEFAULT NULL,
`form_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`custom_css` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
UNIQUE KEY `proj_form` (`project_id`,`form_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_forms_temp` (
`project_id` int(10) DEFAULT NULL,
`form_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`custom_css` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
UNIQUE KEY `proj_form` (`project_id`,`form_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_history_size` (
`date` date NOT NULL DEFAULT '1000-01-01',
`size_db` float DEFAULT NULL COMMENT 'MB',
`size_files` float DEFAULT NULL COMMENT 'MB',
PRIMARY KEY (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Space usage of REDCap database and uploaded files.';

CREATE TABLE `redcap_history_version` (
`date` date NOT NULL DEFAULT '1000-01-01',
`redcap_version` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
PRIMARY KEY (`date`,`redcap_version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='History of REDCap versions installed on this server.';

CREATE TABLE `redcap_instrument_zip` (
`iza_id` int(10) NOT NULL DEFAULT '0',
`instrument_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
`upload_count` smallint(5) NOT NULL DEFAULT '1',
PRIMARY KEY (`iza_id`,`instrument_id`),
KEY `instrument_id` (`instrument_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_instrument_zip_authors` (
`iza_id` int(10) NOT NULL AUTO_INCREMENT,
`author_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`iza_id`),
UNIQUE KEY `author_name` (`author_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_instrument_zip_origins` (
`server_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
`upload_count` smallint(5) NOT NULL DEFAULT '1',
PRIMARY KEY (`server_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_ip_banned` (
`ip` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
`time_of_ban` timestamp NULL DEFAULT NULL,
PRIMARY KEY (`ip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_ip_cache` (
`ip_hash` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
`timestamp` timestamp NULL DEFAULT NULL,
KEY `ip_hash` (`ip_hash`),
KEY `timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_library_map` (
`project_id` int(10) NOT NULL DEFAULT '0',
`form_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
`type` int(11) NOT NULL DEFAULT '0' COMMENT '1 = Downloaded; 2 = Uploaded',
`library_id` int(10) NOT NULL DEFAULT '0',
`upload_timestamp` datetime DEFAULT NULL,
`acknowledgement` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`acknowledgement_cache` datetime DEFAULT NULL,
`promis_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'PROMIS instrument key',
`scoring_type` enum('EACH_ITEM','END_ONLY') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'If has scoring, what type?',
`battery` tinyint(1) NOT NULL DEFAULT '0',
`promis_battery_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'PROMIS battery key',
PRIMARY KEY (`project_id`,`form_name`,`type`,`library_id`),
KEY `form_name` (`form_name`),
KEY `library_id` (`library_id`),
KEY `type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_locking_data` (
`ld_id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`form_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`instance` smallint(4) NOT NULL DEFAULT '1',
`username` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`timestamp` datetime DEFAULT NULL,
PRIMARY KEY (`ld_id`),
UNIQUE KEY `proj_rec_event_form_instance` (`project_id`,`record`,`event_id`,`form_name`,`instance`),
KEY `event_id` (`event_id`),
KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_locking_labels` (
`ll_id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(11) DEFAULT NULL,
`form_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`label` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`display` int(1) NOT NULL DEFAULT '1',
`display_esignature` int(1) NOT NULL DEFAULT '0',
PRIMARY KEY (`ll_id`),
UNIQUE KEY `project_form` (`project_id`,`form_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_locking_records` (
`lr_id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`arm_id` int(10) NOT NULL,
`username` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`timestamp` datetime DEFAULT NULL,
PRIMARY KEY (`lr_id`),
UNIQUE KEY `arm_id_record` (`arm_id`,`record`),
KEY `project_record` (`project_id`,`record`),
KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_locking_records_pdf_archive` (
`doc_id` int(10) DEFAULT NULL,
`project_id` int(10) DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`arm_id` int(10) NOT NULL,
UNIQUE KEY `doc_id` (`doc_id`),
KEY `arm_id_record` (`arm_id`,`record`),
KEY `project_record` (`project_id`,`record`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_log_event` (
`log_event_id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(10) NOT NULL DEFAULT '0',
`ts` bigint(14) DEFAULT NULL,
`user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`ip` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`page` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event` enum('UPDATE','INSERT','DELETE','SELECT','ERROR','LOGIN','LOGOUT','OTHER','DATA_EXPORT','DOC_UPLOAD','DOC_DELETE','MANAGE','LOCK_RECORD','ESIGNATURE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`object_type` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`sql_log` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pk` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`data_values` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`description` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`legacy` int(1) NOT NULL DEFAULT '0',
`change_reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`log_event_id`),
KEY `description` (`description`),
KEY `event_project` (`event`,`project_id`),
KEY `object_type` (`object_type`),
KEY `pk` (`pk`(191)),
KEY `ts` (`ts`),
KEY `user` (`user`(191)),
KEY `user_project` (`project_id`,`user`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_log_event10` (
`log_event_id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(10) NOT NULL DEFAULT '0',
`ts` bigint(14) DEFAULT NULL,
`user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`ip` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`page` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event` enum('UPDATE','INSERT','DELETE','SELECT','ERROR','LOGIN','LOGOUT','OTHER','DATA_EXPORT','DOC_UPLOAD','DOC_DELETE','MANAGE','LOCK_RECORD','ESIGNATURE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`object_type` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`sql_log` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pk` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`data_values` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`description` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`legacy` int(1) NOT NULL DEFAULT '0',
`change_reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`log_event_id`),
KEY `object_type` (`object_type`),
KEY `project_description` (`project_id`,`description`),
KEY `project_event` (`project_id`,`event`),
KEY `project_page` (`project_id`,`page`(191)),
KEY `project_pk` (`project_id`,`pk`(191)),
KEY `project_ts_description` (`project_id`,`ts`,`description`),
KEY `project_user` (`project_id`,`user`(191)),
KEY `ts_project` (`ts`,`project_id`),
KEY `user_project` (`user`(191),`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_log_event11` (
`log_event_id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(10) NOT NULL DEFAULT '0',
`ts` bigint(14) DEFAULT NULL,
`user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`ip` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`page` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event` enum('UPDATE','INSERT','DELETE','SELECT','ERROR','LOGIN','LOGOUT','OTHER','DATA_EXPORT','DOC_UPLOAD','DOC_DELETE','MANAGE','LOCK_RECORD','ESIGNATURE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`object_type` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`sql_log` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pk` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`data_values` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`description` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`legacy` int(1) NOT NULL DEFAULT '0',
`change_reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`log_event_id`),
KEY `object_type` (`object_type`),
KEY `project_description` (`project_id`,`description`),
KEY `project_event` (`project_id`,`event`),
KEY `project_page` (`project_id`,`page`(191)),
KEY `project_pk` (`project_id`,`pk`(191)),
KEY `project_ts_description` (`project_id`,`ts`,`description`),
KEY `project_user` (`project_id`,`user`(191)),
KEY `ts_project` (`ts`,`project_id`),
KEY `user_project` (`user`(191),`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_log_event12` (
`log_event_id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(10) NOT NULL DEFAULT '0',
`ts` bigint(14) DEFAULT NULL,
`user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`ip` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`page` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event` enum('UPDATE','INSERT','DELETE','SELECT','ERROR','LOGIN','LOGOUT','OTHER','DATA_EXPORT','DOC_UPLOAD','DOC_DELETE','MANAGE','LOCK_RECORD','ESIGNATURE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`object_type` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`sql_log` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pk` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`data_values` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`description` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`legacy` int(1) NOT NULL DEFAULT '0',
`change_reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`log_event_id`),
KEY `object_type` (`object_type`),
KEY `project_description` (`project_id`,`description`),
KEY `project_event` (`project_id`,`event`),
KEY `project_page` (`project_id`,`page`(191)),
KEY `project_pk` (`project_id`,`pk`(191)),
KEY `project_ts_description` (`project_id`,`ts`,`description`),
KEY `project_user` (`project_id`,`user`(191)),
KEY `ts_project` (`ts`,`project_id`),
KEY `user_project` (`user`(191),`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_log_event2` (
`log_event_id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(10) NOT NULL DEFAULT '0',
`ts` bigint(14) DEFAULT NULL,
`user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`ip` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`page` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event` enum('UPDATE','INSERT','DELETE','SELECT','ERROR','LOGIN','LOGOUT','OTHER','DATA_EXPORT','DOC_UPLOAD','DOC_DELETE','MANAGE','LOCK_RECORD','ESIGNATURE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`object_type` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`sql_log` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pk` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`data_values` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`description` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`legacy` int(1) NOT NULL DEFAULT '0',
`change_reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`log_event_id`),
KEY `description_project` (`description`,`project_id`),
KEY `event_project` (`event`,`project_id`),
KEY `object_type` (`object_type`),
KEY `page_project` (`page`(191),`project_id`),
KEY `pk_project` (`pk`(191),`project_id`),
KEY `project_user` (`project_id`,`user`(191)),
KEY `ts_project` (`ts`,`project_id`),
KEY `user_project` (`user`(191),`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_log_event3` (
`log_event_id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(10) NOT NULL DEFAULT '0',
`ts` bigint(14) DEFAULT NULL,
`user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`ip` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`page` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event` enum('UPDATE','INSERT','DELETE','SELECT','ERROR','LOGIN','LOGOUT','OTHER','DATA_EXPORT','DOC_UPLOAD','DOC_DELETE','MANAGE','LOCK_RECORD','ESIGNATURE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`object_type` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`sql_log` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pk` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`data_values` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`description` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`legacy` int(1) NOT NULL DEFAULT '0',
`change_reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`log_event_id`),
KEY `description_project` (`description`,`project_id`),
KEY `event_project` (`event`,`project_id`),
KEY `object_type` (`object_type`),
KEY `page_project` (`page`(191),`project_id`),
KEY `pk_project` (`pk`(191),`project_id`),
KEY `project_user` (`project_id`,`user`(191)),
KEY `ts_project` (`ts`,`project_id`),
KEY `user_project` (`user`(191),`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_log_event4` (
`log_event_id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(10) NOT NULL DEFAULT '0',
`ts` bigint(14) DEFAULT NULL,
`user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`ip` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`page` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event` enum('UPDATE','INSERT','DELETE','SELECT','ERROR','LOGIN','LOGOUT','OTHER','DATA_EXPORT','DOC_UPLOAD','DOC_DELETE','MANAGE','LOCK_RECORD','ESIGNATURE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`object_type` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`sql_log` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pk` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`data_values` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`description` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`legacy` int(1) NOT NULL DEFAULT '0',
`change_reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`log_event_id`),
KEY `description_project` (`description`,`project_id`),
KEY `event_project` (`event`,`project_id`),
KEY `object_type` (`object_type`),
KEY `page_project` (`page`(191),`project_id`),
KEY `pk_project` (`pk`(191),`project_id`),
KEY `project_user` (`project_id`,`user`(191)),
KEY `ts_project` (`ts`,`project_id`),
KEY `user_project` (`user`(191),`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_log_event5` (
`log_event_id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(10) NOT NULL DEFAULT '0',
`ts` bigint(14) DEFAULT NULL,
`user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`ip` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`page` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event` enum('UPDATE','INSERT','DELETE','SELECT','ERROR','LOGIN','LOGOUT','OTHER','DATA_EXPORT','DOC_UPLOAD','DOC_DELETE','MANAGE','LOCK_RECORD','ESIGNATURE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`object_type` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`sql_log` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pk` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`data_values` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`description` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`legacy` int(1) NOT NULL DEFAULT '0',
`change_reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`log_event_id`),
KEY `description_project` (`description`,`project_id`),
KEY `event_project` (`event`,`project_id`),
KEY `object_type` (`object_type`),
KEY `page_project` (`page`(191),`project_id`),
KEY `pk_project` (`pk`(191),`project_id`),
KEY `project_user` (`project_id`,`user`(191)),
KEY `ts_project` (`ts`,`project_id`),
KEY `user_project` (`user`(191),`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_log_event6` (
`log_event_id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(10) NOT NULL DEFAULT '0',
`ts` bigint(14) DEFAULT NULL,
`user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`ip` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`page` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event` enum('UPDATE','INSERT','DELETE','SELECT','ERROR','LOGIN','LOGOUT','OTHER','DATA_EXPORT','DOC_UPLOAD','DOC_DELETE','MANAGE','LOCK_RECORD','ESIGNATURE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`object_type` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`sql_log` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pk` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`data_values` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`description` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`legacy` int(1) NOT NULL DEFAULT '0',
`change_reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`log_event_id`),
KEY `object_type` (`object_type`),
KEY `project_description` (`project_id`,`description`),
KEY `project_event` (`project_id`,`event`),
KEY `project_page` (`project_id`,`page`(191)),
KEY `project_pk` (`project_id`,`pk`(191)),
KEY `project_ts_description` (`project_id`,`ts`,`description`),
KEY `project_user` (`project_id`,`user`(191)),
KEY `ts_project` (`ts`,`project_id`),
KEY `user_project` (`user`(191),`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_log_event7` (
`log_event_id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(10) NOT NULL DEFAULT '0',
`ts` bigint(14) DEFAULT NULL,
`user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`ip` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`page` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event` enum('UPDATE','INSERT','DELETE','SELECT','ERROR','LOGIN','LOGOUT','OTHER','DATA_EXPORT','DOC_UPLOAD','DOC_DELETE','MANAGE','LOCK_RECORD','ESIGNATURE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`object_type` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`sql_log` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pk` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`data_values` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`description` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`legacy` int(1) NOT NULL DEFAULT '0',
`change_reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`log_event_id`),
KEY `object_type` (`object_type`),
KEY `project_description` (`project_id`,`description`),
KEY `project_event` (`project_id`,`event`),
KEY `project_page` (`project_id`,`page`(191)),
KEY `project_pk` (`project_id`,`pk`(191)),
KEY `project_ts_description` (`project_id`,`ts`,`description`),
KEY `project_user` (`project_id`,`user`(191)),
KEY `ts_project` (`ts`,`project_id`),
KEY `user_project` (`user`(191),`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_log_event8` (
`log_event_id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(10) NOT NULL DEFAULT '0',
`ts` bigint(14) DEFAULT NULL,
`user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`ip` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`page` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event` enum('UPDATE','INSERT','DELETE','SELECT','ERROR','LOGIN','LOGOUT','OTHER','DATA_EXPORT','DOC_UPLOAD','DOC_DELETE','MANAGE','LOCK_RECORD','ESIGNATURE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`object_type` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`sql_log` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pk` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`data_values` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`description` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`legacy` int(1) NOT NULL DEFAULT '0',
`change_reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`log_event_id`),
KEY `object_type` (`object_type`),
KEY `project_description` (`project_id`,`description`),
KEY `project_event` (`project_id`,`event`),
KEY `project_page` (`project_id`,`page`(191)),
KEY `project_pk` (`project_id`,`pk`(191)),
KEY `project_ts_description` (`project_id`,`ts`,`description`),
KEY `project_user` (`project_id`,`user`(191)),
KEY `ts_project` (`ts`,`project_id`),
KEY `user_project` (`user`(191),`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_log_event9` (
`log_event_id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(10) NOT NULL DEFAULT '0',
`ts` bigint(14) DEFAULT NULL,
`user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`ip` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`page` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event` enum('UPDATE','INSERT','DELETE','SELECT','ERROR','LOGIN','LOGOUT','OTHER','DATA_EXPORT','DOC_UPLOAD','DOC_DELETE','MANAGE','LOCK_RECORD','ESIGNATURE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`object_type` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`sql_log` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pk` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`data_values` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`description` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`legacy` int(1) NOT NULL DEFAULT '0',
`change_reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`log_event_id`),
KEY `object_type` (`object_type`),
KEY `project_description` (`project_id`,`description`),
KEY `project_event` (`project_id`,`event`),
KEY `project_page` (`project_id`,`page`(191)),
KEY `project_pk` (`project_id`,`pk`(191)),
KEY `project_ts_description` (`project_id`,`ts`,`description`),
KEY `project_user` (`project_id`,`user`(191)),
KEY `ts_project` (`ts`,`project_id`),
KEY `user_project` (`user`(191),`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_log_view` (
`log_view_id` bigint(19) NOT NULL AUTO_INCREMENT,
`ts` timestamp NULL DEFAULT NULL,
`user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event` enum('LOGIN_SUCCESS','LOGIN_FAIL','LOGOUT','PAGE_VIEW') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`ip` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`browser_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`browser_version` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`full_url` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`page` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_id` int(10) DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`record` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`form_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`miscellaneous` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`session_id` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`log_view_id`),
KEY `browser_name` (`browser_name`(191)),
KEY `browser_version` (`browser_version`(191)),
KEY `event` (`event`),
KEY `ip` (`ip`),
KEY `page_ts_project_id` (`page`(191),`ts`,`project_id`),
KEY `project_event_record` (`project_id`,`event_id`,`record`(191)),
KEY `project_record` (`project_id`,`record`(191)),
KEY `session_id` (`session_id`),
KEY `ts_user_event` (`ts`,`user`(191),`event`),
KEY `user_project` (`user`(191),`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_log_view_old` (
`log_view_id` int(11) NOT NULL AUTO_INCREMENT,
`ts` timestamp NULL DEFAULT NULL,
`user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event` enum('LOGIN_SUCCESS','LOGIN_FAIL','LOGOUT','PAGE_VIEW') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`ip` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`browser_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`browser_version` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`full_url` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`page` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_id` int(10) DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`record` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`form_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`miscellaneous` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`session_id` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`log_view_id`),
KEY `browser_name` (`browser_name`(191)),
KEY `browser_version` (`browser_version`(191)),
KEY `event` (`event`),
KEY `ip` (`ip`),
KEY `page` (`page`(191)),
KEY `project_event_record` (`project_id`,`event_id`,`record`(191)),
KEY `session_id` (`session_id`),
KEY `ts` (`ts`),
KEY `user_project` (`user`(191),`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_log_view_requests` (
`lvr_id` bigint(19) NOT NULL AUTO_INCREMENT,
`log_view_id` bigint(19) DEFAULT NULL COMMENT 'FK from redcap_log_view',
`mysql_process_id` int(10) DEFAULT NULL COMMENT 'Process ID for MySQL',
`php_process_id` int(10) DEFAULT NULL COMMENT 'Process ID for PHP',
`script_execution_time` float DEFAULT NULL COMMENT 'Total PHP script execution time (seconds)',
`is_ajax` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Is request an AJAX request?',
`is_cron` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Is this the REDCap cron job?',
`ui_id` int(11) DEFAULT NULL COMMENT 'FK from redcap_user_information',
PRIMARY KEY (`lvr_id`),
UNIQUE KEY `log_view_id` (`log_view_id`),
KEY `mysql_process_id` (`mysql_process_id`),
KEY `php_process_id` (`php_process_id`),
KEY `ui_id_log_view_id` (`ui_id`,`log_view_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_messages` (
`message_id` int(10) NOT NULL AUTO_INCREMENT,
`thread_id` int(10) DEFAULT NULL COMMENT 'Thread that message belongs to (FK from redcap_messages_threads)',
`sent_time` datetime DEFAULT NULL COMMENT 'Time message was sent',
`author_user_id` int(10) DEFAULT NULL COMMENT 'Author of message (FK from redcap_user_information)',
`message_body` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'The message itself',
`attachment_doc_id` int(10) DEFAULT NULL COMMENT 'doc_id if there is an attachment (FK from redcap_edocs_metadata)',
`stored_url` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`message_id`),
KEY `attachment_doc_id` (`attachment_doc_id`),
KEY `author_user_id` (`author_user_id`),
KEY `message_body` (`message_body`(190)),
KEY `sent_time` (`sent_time`),
KEY `thread_id` (`thread_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_messages_recipients` (
`recipient_id` int(10) NOT NULL AUTO_INCREMENT,
`thread_id` int(10) DEFAULT NULL COMMENT 'Thread that recipient belongs to (FK from redcap_messages_threads)',
`recipient_user_id` int(10) DEFAULT NULL COMMENT 'Individual recipient in thread (FK from redcap_user_information)',
`all_users` tinyint(1) DEFAULT '0' COMMENT 'Set if recipients = ALL USERS',
`prioritize` tinyint(1) NOT NULL DEFAULT '0',
`conv_leader` tinyint(1) NOT NULL DEFAULT '0',
PRIMARY KEY (`recipient_id`),
UNIQUE KEY `recipient_user_thread_id` (`recipient_user_id`,`thread_id`),
KEY `thread_id_users` (`thread_id`,`all_users`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_messages_status` (
`status_id` int(10) NOT NULL AUTO_INCREMENT,
`message_id` int(10) DEFAULT NULL COMMENT 'FK from redcap_messages',
`recipient_id` int(10) DEFAULT NULL COMMENT 'Individual recipient in thread (FK from redcap_messages_recipients)',
`recipient_user_id` int(10) DEFAULT NULL COMMENT 'Individual recipient in thread (FK from redcap_user_information)',
`urgent` tinyint(1) NOT NULL DEFAULT '0',
PRIMARY KEY (`status_id`),
KEY `message_id` (`message_id`),
KEY `recipient_id` (`recipient_id`),
KEY `recipient_user_id` (`recipient_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_messages_threads` (
`thread_id` int(10) NOT NULL AUTO_INCREMENT,
`type` enum('CHANNEL','NOTIFICATION','CONVERSATION') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Type of entity',
`channel_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Only for channels',
`invisible` tinyint(1) NOT NULL DEFAULT '0',
`archived` tinyint(1) NOT NULL DEFAULT '0',
`project_id` int(11) DEFAULT NULL COMMENT 'Associated project',
PRIMARY KEY (`thread_id`),
KEY `project_id` (`project_id`),
KEY `type_channel` (`type`,`channel_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_metadata` (
`project_id` int(10) NOT NULL DEFAULT '0',
`field_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
`field_phi` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`form_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`form_menu_description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`field_order` float DEFAULT NULL,
`field_units` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_preceding_header` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_label` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_enum` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_note` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_validation_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_validation_min` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_validation_max` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_validation_checktype` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`branching_logic` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`field_req` int(1) NOT NULL DEFAULT '0',
`edoc_id` int(10) DEFAULT NULL COMMENT 'image/file attachment',
`edoc_display_img` int(1) NOT NULL DEFAULT '0',
`custom_alignment` enum('LH','LV','RH','RV') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'RV = NULL = default',
`stop_actions` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`question_num` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`grid_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Unique name of grid group',
`grid_rank` int(1) NOT NULL DEFAULT '0',
`misc` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Miscellaneous field attributes',
`video_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`video_display_inline` tinyint(1) NOT NULL DEFAULT '0',
PRIMARY KEY (`project_id`,`field_name`),
KEY `edoc_id` (`edoc_id`),
KEY `field_name` (`field_name`),
KEY `project_id_fieldorder` (`project_id`,`field_order`),
KEY `project_id_form` (`project_id`,`form_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_metadata_archive` (
`project_id` int(10) NOT NULL DEFAULT '0',
`field_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
`field_phi` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`form_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`form_menu_description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`field_order` float DEFAULT NULL,
`field_units` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_preceding_header` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_label` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_enum` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_note` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_validation_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_validation_min` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_validation_max` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_validation_checktype` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`branching_logic` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`field_req` int(1) NOT NULL DEFAULT '0',
`edoc_id` int(10) DEFAULT NULL COMMENT 'image/file attachment',
`edoc_display_img` int(1) NOT NULL DEFAULT '0',
`custom_alignment` enum('LH','LV','RH','RV') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'RV = NULL = default',
`stop_actions` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`question_num` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`grid_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Unique name of grid group',
`grid_rank` int(1) NOT NULL DEFAULT '0',
`misc` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Miscellaneous field attributes',
`video_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`video_display_inline` tinyint(1) NOT NULL DEFAULT '0',
`pr_id` int(10) DEFAULT NULL,
UNIQUE KEY `project_field_prid` (`project_id`,`field_name`,`pr_id`),
KEY `edoc_id` (`edoc_id`),
KEY `field_name` (`field_name`),
KEY `pr_id` (`pr_id`),
KEY `project_id_form` (`project_id`,`form_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_metadata_prod_revisions` (
`pr_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) NOT NULL DEFAULT '0',
`ui_id_requester` int(10) DEFAULT NULL,
`ui_id_approver` int(10) DEFAULT NULL,
`ts_req_approval` datetime DEFAULT NULL,
`ts_approved` datetime DEFAULT NULL,
PRIMARY KEY (`pr_id`),
KEY `project_approved` (`project_id`,`ts_approved`),
KEY `project_user` (`project_id`,`ui_id_requester`),
KEY `ui_id_approver` (`ui_id_approver`),
KEY `ui_id_requester` (`ui_id_requester`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_metadata_temp` (
`project_id` int(10) NOT NULL DEFAULT '0',
`field_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
`field_phi` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`form_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`form_menu_description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`field_order` float DEFAULT NULL,
`field_units` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_preceding_header` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_label` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_enum` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_note` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_validation_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_validation_min` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_validation_max` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`element_validation_checktype` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`branching_logic` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`field_req` int(1) NOT NULL DEFAULT '0',
`edoc_id` int(10) DEFAULT NULL COMMENT 'image/file attachment',
`edoc_display_img` int(1) NOT NULL DEFAULT '0',
`custom_alignment` enum('LH','LV','RH','RV') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'RV = NULL = default',
`stop_actions` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`question_num` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`grid_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Unique name of grid group',
`grid_rank` int(1) NOT NULL DEFAULT '0',
`misc` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Miscellaneous field attributes',
`video_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`video_display_inline` tinyint(1) NOT NULL DEFAULT '0',
PRIMARY KEY (`project_id`,`field_name`),
KEY `edoc_id` (`edoc_id`),
KEY `field_name` (`field_name`),
KEY `project_id_form` (`project_id`,`form_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_mobile_app_devices` (
`device_id` int(10) NOT NULL AUTO_INCREMENT,
`uuid` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_id` int(10) DEFAULT NULL,
`nickname` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`revoked` tinyint(4) NOT NULL DEFAULT '0',
PRIMARY KEY (`device_id`),
UNIQUE KEY `uuid_project_id` (`uuid`,`project_id`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_mobile_app_files` (
`af_id` int(10) NOT NULL AUTO_INCREMENT,
`doc_id` int(10) NOT NULL,
`type` enum('ESCAPE_HATCH','LOGGING') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`user_id` int(10) DEFAULT NULL,
`device_id` int(10) DEFAULT NULL,
PRIMARY KEY (`af_id`),
KEY `device_id` (`device_id`),
KEY `doc_id` (`doc_id`),
KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_mobile_app_log` (
`mal_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`ui_id` int(11) DEFAULT NULL,
`log_event_id` int(10) DEFAULT NULL,
`device_id` int(10) DEFAULT NULL,
`event` enum('INIT_PROJECT','INIT_DOWNLOAD_DATA','INIT_DOWNLOAD_DATA_PARTIAL','REINIT_PROJECT','REINIT_DOWNLOAD_DATA','REINIT_DOWNLOAD_DATA_PARTIAL','SYNC_DATA') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`details` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`longitude` double DEFAULT NULL,
`latitude` double DEFAULT NULL,
PRIMARY KEY (`mal_id`),
KEY `device_id` (`device_id`),
KEY `log_event_id` (`log_event_id`),
KEY `project_id_event` (`project_id`,`event`),
KEY `ui_id` (`ui_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_multilanguage_config` (
`project_id` int(10) DEFAULT NULL,
`lang_id` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
`name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
`value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
UNIQUE KEY `project_lang_name` (`project_id`,`lang_id`,`name`),
KEY `lang_name` (`lang_id`,`name`),
KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_multilanguage_config_temp` (
`project_id` int(10) DEFAULT NULL,
`lang_id` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
`name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
`value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
UNIQUE KEY `project_lang_name` (`project_id`,`lang_id`,`name`),
KEY `lang_name` (`lang_id`,`name`),
KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_multilanguage_metadata` (
`project_id` int(10) DEFAULT NULL,
`lang_id` varchar(50) COLLATE utf8mb4_bin NOT NULL,
`type` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
`name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`index` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`hash` char(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`value` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
UNIQUE KEY `project_lang_type_name_index` (`project_id`,`lang_id`,`type`,`name`,`index`),
KEY `lang_type_name_index` (`lang_id`,`type`,`name`,`index`),
KEY `name` (`name`),
KEY `type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_multilanguage_metadata_temp` (
`project_id` int(10) DEFAULT NULL,
`lang_id` varchar(50) COLLATE utf8mb4_bin NOT NULL,
`type` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
`name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`index` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`hash` char(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`value` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
UNIQUE KEY `project_lang_type_name_index` (`project_id`,`lang_id`,`type`,`name`,`index`),
KEY `lang_type_name_index` (`lang_id`,`type`,`name`,`index`),
KEY `name` (`name`),
KEY `type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_multilanguage_snapshots` (
`snapshot_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) NOT NULL,
`edoc_id` int(10) DEFAULT NULL,
`created_by` int(10) DEFAULT NULL COMMENT 'References a uu_id in the redcap_user_information table',
`deleted_by` int(10) DEFAULT NULL COMMENT 'References a uu_id in the redcap_user_information table',
PRIMARY KEY (`snapshot_id`),
KEY `created_by` (`created_by`),
KEY `deleted_by` (`deleted_by`),
KEY `edoc_id` (`edoc_id`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_multilanguage_ui` (
`project_id` int(10) DEFAULT NULL,
`lang_id` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
`item` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
`hash` char(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`translation` text COLLATE utf8mb4_unicode_ci NOT NULL,
UNIQUE KEY `project_lang_item` (`project_id`,`lang_id`,`item`),
KEY `item` (`item`),
KEY `lang_item` (`lang_id`,`item`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_multilanguage_ui_temp` (
`project_id` int(10) DEFAULT NULL,
`lang_id` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
`item` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
`hash` char(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`translation` text COLLATE utf8mb4_unicode_ci NOT NULL,
UNIQUE KEY `project_lang_item` (`project_id`,`lang_id`,`item`),
KEY `item` (`item`),
KEY `lang_item` (`lang_id`,`item`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_mycap_aboutpages` (
`page_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`identifier` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`page_title` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`page_content` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Page content',
`sub_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`image_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Image Type',
`system_image_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'System Image Name',
`custom_logo` int(10) DEFAULT NULL COMMENT 'doc id for custom image uploaded',
`page_order` int(10) DEFAULT NULL,
`dag_id` int(11) DEFAULT NULL COMMENT 'DAG specific page',
PRIMARY KEY (`page_id`),
KEY `custom_logo` (`custom_logo`),
KEY `dag_id` (`dag_id`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_mycap_contacts` (
`contact_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`identifier` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`contact_header` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`contact_title` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`phone_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Field name that stores contact phone number',
`email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`website` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`additional_info` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`contact_order` int(10) DEFAULT NULL,
`dag_id` int(11) DEFAULT NULL COMMENT 'DAG specific contact',
PRIMARY KEY (`contact_id`),
KEY `dag_id` (`dag_id`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_mycap_links` (
`link_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`identifier` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`link_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`link_url` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`link_icon` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`append_project_code` int(1) NOT NULL DEFAULT '0' COMMENT 'Append Project Code to URL',
`append_participant_code` int(1) NOT NULL DEFAULT '0' COMMENT 'Append Participant Code to URL',
`link_order` int(10) DEFAULT NULL,
`dag_id` int(11) DEFAULT NULL COMMENT 'DAG specific link',
PRIMARY KEY (`link_id`),
KEY `dag_id` (`dag_id`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_mycap_message_notifications` (
`notification_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`dag_id` int(10) DEFAULT NULL,
`notify_user` int(1) NOT NULL DEFAULT '0' COMMENT 'Notify study coordinator upon receiving message via email?',
`user_emails` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'List of user emails',
`custom_email_text` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Custom Email text',
PRIMARY KEY (`notification_id`),
KEY `dag_id` (`dag_id`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_mycap_messages` (
`uuid` char(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'UUID',
`project_id` int(10) DEFAULT NULL COMMENT 'FK to redcap_projects.project_id',
`type` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Announcement, standard',
`from_server` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes',
`from` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Either a participant code or a redcap user',
`to` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Either a participant code or a redcap user',
`title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Optional title',
`body` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Body content',
`sent_date` datetime NOT NULL COMMENT 'Unix timestamp',
`received_date` datetime DEFAULT NULL COMMENT 'Unix timestamp',
`read_date` datetime DEFAULT NULL COMMENT 'Unix timestamp',
`processed` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes',
`processed_by` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'message processed by this REDCap user. FK to redcap_user_information.username',
PRIMARY KEY (`uuid`),
KEY `project_id` (`project_id`),
KEY `received_date` (`received_date`),
KEY `sent_date` (`sent_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_mycap_participants` (
`code` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Participant identifier. Alias for record_id. We never store record_id on the mobile app for security reasons.',
`project_id` int(10) DEFAULT NULL COMMENT 'FK to redcap_projects.project_id',
`record` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
`event_id` int(10) DEFAULT NULL,
`join_date` datetime DEFAULT NULL COMMENT 'Date participant joined the project',
`join_date_utc` datetime DEFAULT NULL COMMENT 'Date (UTC format) participant joined the project',
`timezone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Participant timezone',
`baseline_date` datetime DEFAULT NULL COMMENT 'Date of important event. Used for scheduling.',
`push_notification_ids` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Stores push notification identifiers',
`is_deleted` tinyint(1) NOT NULL DEFAULT '0',
PRIMARY KEY (`code`),
KEY `event_id` (`event_id`),
KEY `project_record_event` (`project_id`,`record`,`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_mycap_projectfiles` (
`project_code` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'PFK to redcap_mycap_projects.code',
`doc_id` int(10) NOT NULL COMMENT 'PFK to redcap_edocs_metadata.doc_id',
`name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'File name',
`category` int(10) DEFAULT NULL COMMENT 'File categorization, if any. 1=PROMIS Form, 2=PROMIS Calibration, 3=Image, 4=Config Version',
PRIMARY KEY (`project_code`,`doc_id`),
KEY `doc_id` (`doc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_mycap_projects` (
`code` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Project identifier. Alias for project_id. We never store project_id on the mobile app for security reasons.',
`hmac_key` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Hash-based Message Access Code key.',
`project_id` int(10) NOT NULL COMMENT 'FK to redcap_projects.project_id',
`name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Name of the project within the app',
`allow_new_participants` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Participants cannot join if FALSE',
`participant_custom_field` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'participant identifier field_name',
`participant_custom_label` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`participant_allow_condition` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`config` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'JSON representation of the config',
`baseline_date_field` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'baseline date field_name',
`baseline_date_config` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'JSON representation of the baseline date settings config',
`status` int(1) NOT NULL DEFAULT '1' COMMENT '0=Deleted, 1=Active',
`converted_to_flutter` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Participant join URL will display flutter app link if TRUE',
`flutter_conversion_time` datetime DEFAULT NULL COMMENT 'Time when project is converted to flutter by button click',
`event_display_format` enum('ID','LABEL','NONE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NONE',
`notification_time` time DEFAULT '08:00:00',
`acknowledged_app_link` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'User acknowledged a change from join URL/Dynamic link to new app link if TRUE',
`prevent_lang_switch_mtb` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Prevent participants to switch language from Spanish to English or vice a versa',
`last_enabled_on` datetime DEFAULT NULL COMMENT 'Time when project is enabled for MyCap by button click/copy project/xml upload',
PRIMARY KEY (`code`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_mycap_syncissuefiles` (
`uuid` char(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'PFK to redcap_mycap_syncissues.uuid',
`doc_id` int(10) NOT NULL COMMENT 'PFK to redcap_edocs_metadata.doc_id',
PRIMARY KEY (`doc_id`,`uuid`),
KEY `uuid_idx` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_mycap_syncissues` (
`uuid` char(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'UUID generated by app. Maps to a field with annotation @MC-TASK-UUID',
`participant_code` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'FK to a record with field annotation @MC-PARTICIPANT-CODE. FK is not enforced as someone may inadvertently delete a participant, but we still want to get results',
`project_code` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'FK to redcap_mycap_projects.code. Not enforced because someone may accidentally delete a project.',
`received_date` datetime NOT NULL COMMENT 'Date received by the server',
`payload` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Request payload in JSON format',
`instrument` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'FK to redcap_metadata.form_name. Relationship not enforced as we may receive results for tasks that were deleted in REDCap.',
`event_id` int(10) DEFAULT NULL,
`error_type` int(1) NOT NULL DEFAULT '0' COMMENT '1 = REDCap Save, 2 = Could not find participant, 3 = Could not find project, 4 = Other',
`error_message` varchar(4000) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Error message that REDCap returned when attempting to save the result, or that MyCap identified',
`resolved` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0 = Unresolved, 1 = Resolved',
`resolved_by` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'issue resolved by this user. FK to redcap_user_information.username',
`resolved_comment` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Optional comment describing why issue was toggled as resolved',
PRIMARY KEY (`uuid`),
KEY `event_id` (`event_id`),
KEY `participant_code` (`participant_code`),
KEY `project_code` (`project_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_mycap_tasks` (
`task_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`form_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'REDCap Instrument Name',
`enabled_for_mycap` int(1) NOT NULL DEFAULT '1' COMMENT '0 = no, 1 = yes',
`task_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'MyCap Task Title',
`question_format` varchar(35) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Possible values are .Questionnaire, .Form',
`card_display` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Possible values are .Percent, .Form',
`x_date_field` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Date Field for Chart Display = Chart',
`x_time_field` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Time Field for Chart Display = Chart',
`y_numeric_field` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Numeric Field for Chart Display = Chart',
`extended_config_json` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Extended Config JSON string for active task',
PRIMARY KEY (`task_id`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_mycap_tasks_schedules` (
`ts_id` int(11) NOT NULL AUTO_INCREMENT,
`task_id` int(11) DEFAULT NULL,
`event_id` int(11) DEFAULT NULL,
`allow_retro_completion` int(1) NOT NULL DEFAULT '0' COMMENT 'Allow retroactive completion?',
`allow_save_complete_later` int(1) NOT NULL DEFAULT '0' COMMENT 'Allow save and complete later?',
`include_instruction_step` int(1) NOT NULL DEFAULT '0' COMMENT 'Include Instruction Step?',
`include_completion_step` int(1) NOT NULL DEFAULT '0' COMMENT 'Include Completion Step?',
`instruction_step_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Instruction Step - Title',
`instruction_step_content` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Instruction Step - Content',
`completion_step_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Completion Step - Title',
`completion_step_content` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Completion Step - Content',
`schedule_relative_to` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Possible values are .JoinDate, .ZeroDate',
`schedule_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Possible values are .OneTime, .Infinite, .Repeating, .Fixed',
`schedule_frequency` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Possible values are .Daily, .Weekly, .Monthly',
`schedule_interval_week` int(2) DEFAULT NULL COMMENT 'Weeks from 1 to 24',
`schedule_days_of_the_week` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'List of days of the week',
`schedule_interval_month` int(2) DEFAULT NULL COMMENT 'Months from 1 to 12',
`schedule_days_of_the_month` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'List of days of the month',
`schedule_days_fixed` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'List of days for type FIXED',
`schedule_relative_offset` int(10) DEFAULT NULL COMMENT 'Number of days to delay',
`schedule_ends` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Possible values are .Never or list of .AfterCountOccurrences, .AfterNDays, .OnDate',
`schedule_end_count` int(10) DEFAULT NULL COMMENT 'Ends after number of times',
`schedule_end_after_days` int(10) DEFAULT NULL COMMENT 'Ends after number of days have elapsed',
`schedule_end_date` date DEFAULT NULL,
`active` int(1) NOT NULL DEFAULT '1' COMMENT 'Is it currently active?',
PRIMARY KEY (`ts_id`),
KEY `event_id` (`event_id`),
KEY `task_id` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_mycap_themes` (
`theme_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`primary_color` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`light_primary_color` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`accent_color` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`dark_primary_color` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`light_bg_color` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`theme_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`system_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`theme_id`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_new_record_cache` (
`project_id` int(10) NOT NULL DEFAULT '0',
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`creation_time` datetime DEFAULT NULL,
UNIQUE KEY `proj_record` (`project_id`,`record`),
KEY `creation_time` (`creation_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Save new record names to prevent record duplication';

CREATE TABLE `redcap_outgoing_email_counts` (
`date` date NOT NULL,
`send_count` int(10) DEFAULT '1' COMMENT 'Total',
`smtp` int(10) DEFAULT '0',
`sendgrid` int(10) DEFAULT '0',
`mandrill` int(10) DEFAULT '0',
`twilio_sms` int(10) NOT NULL DEFAULT '0',
`mosio_sms` int(10) NOT NULL DEFAULT '0',
`mailgun` int(10) DEFAULT '0',
PRIMARY KEY (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_outgoing_email_sms_identifiers` (
`ident_id` int(10) NOT NULL AUTO_INCREMENT,
`ssq_id` int(10) DEFAULT NULL,
PRIMARY KEY (`ident_id`),
UNIQUE KEY `ssq_id` (`ssq_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_outgoing_email_sms_log` (
`email_id` int(10) NOT NULL AUTO_INCREMENT,
`type` enum('EMAIL','SMS','VOICE_CALL','SENDGRID_TEMPLATE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EMAIL',
`category` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`time_sent` datetime DEFAULT NULL,
`sender` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email or phone number',
`recipients` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Emails or phone numbers',
`email_cc` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`email_bcc` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`email_subject` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`message` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`message_html` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`attachment_names` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`attachment_doc_ids` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_id` int(10) DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`instrument` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`instance` smallint(4) DEFAULT NULL,
`hash` varchar(100) CHARACTER SET latin1 COLLATE latin1_general_cs DEFAULT NULL,
`lang_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`email_id`),
UNIQUE KEY `hash` (`hash`),
KEY `attachment_names` (`attachment_names`(150)),
KEY `category` (`category`),
KEY `email_bcc` (`email_bcc`(150)),
KEY `email_cc` (`email_cc`(150)),
KEY `email_subject` (`email_subject`(150)),
KEY `event_id` (`event_id`),
KEY `lang_id` (`lang_id`),
KEY `message` (`message`(150)),
KEY `project_message` (`project_id`,`message_html`(150)),
KEY `project_record` (`project_id`,`record`),
KEY `project_subject_message` (`project_id`,`email_subject`(100),`message`(100)),
KEY `project_time_sent` (`project_id`,`time_sent`),
KEY `recipients` (`recipients`(150)),
KEY `sender` (`sender`),
KEY `time_sent` (`time_sent`),
KEY `type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_page_hits` (
`date` date NOT NULL,
`page_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`page_hits` float NOT NULL DEFAULT '1',
UNIQUE KEY `date` (`date`,`page_name`),
KEY `page_name` (`page_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_pdf_image_cache` (
`pdf_doc_id` int(10) DEFAULT NULL,
`page` int(5) DEFAULT NULL,
`num_pages` int(5) DEFAULT NULL,
`image_doc_id` int(10) DEFAULT NULL,
`expiration` datetime DEFAULT NULL,
UNIQUE KEY `pdf_doc_id_page` (`pdf_doc_id`,`page`),
KEY `expiration` (`expiration`),
KEY `image_doc_id` (`image_doc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_pdf_snapshots` (
`snapshot_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`active` tinyint(1) NOT NULL DEFAULT '0',
`name` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`custom_filename_prefix` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`consent_id` int(10) DEFAULT NULL COMMENT 'Used for eConsent',
`trigger_surveycomplete_survey_id` int(10) DEFAULT NULL COMMENT 'Trigger based on survey completion',
`trigger_surveycomplete_event_id` int(10) DEFAULT NULL,
`trigger_logic` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Trigger based on logic',
`selected_forms_events` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Instruments/events to include in snapshot',
`pdf_save_to_file_repository` tinyint(1) NOT NULL DEFAULT '0',
`pdf_save_to_field` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pdf_save_to_event_id` int(10) DEFAULT NULL,
`pdf_save_translated` tinyint(1) NOT NULL DEFAULT '0',
`pdf_compact` tinyint(1) NOT NULL DEFAULT '1',
PRIMARY KEY (`snapshot_id`),
UNIQUE KEY `consent_survey_id` (`consent_id`,`trigger_surveycomplete_survey_id`),
KEY `pdf_save_to_event_id` (`pdf_save_to_event_id`),
KEY `project_id_active_name` (`project_id`,`active`,`name`),
KEY `survey_id_active_name` (`trigger_surveycomplete_survey_id`,`active`,`name`),
KEY `trigger_surveycomplete_event_id` (`trigger_surveycomplete_event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_pdf_snapshots_triggered` (
`snapshot_id` int(10) NOT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
PRIMARY KEY (`snapshot_id`,`record`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_project_checklist` (
`list_id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`list_id`),
UNIQUE KEY `project_name` (`project_id`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_project_dashboards` (
`dash_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) NOT NULL,
`title` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`body` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`dash_order` int(3) DEFAULT NULL,
`user_access` enum('ALL','SELECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ALL',
`hash` varchar(11) CHARACTER SET latin1 COLLATE latin1_general_cs DEFAULT NULL,
`short_url` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`is_public` tinyint(1) NOT NULL DEFAULT '0',
`cache_time` datetime DEFAULT NULL,
`cache_content` longtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`dash_id`),
UNIQUE KEY `hash` (`hash`),
UNIQUE KEY `project_dash_order` (`project_id`,`dash_order`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_project_dashboards_access_dags` (
`dash_id` int(10) NOT NULL AUTO_INCREMENT,
`group_id` int(10) NOT NULL DEFAULT '0',
PRIMARY KEY (`dash_id`,`group_id`),
KEY `group_id` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_project_dashboards_access_roles` (
`dash_id` int(10) NOT NULL DEFAULT '0',
`role_id` int(10) NOT NULL DEFAULT '0',
PRIMARY KEY (`dash_id`,`role_id`),
KEY `role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_project_dashboards_access_users` (
`dash_id` int(10) NOT NULL AUTO_INCREMENT,
`username` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
PRIMARY KEY (`dash_id`,`username`),
KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_project_dashboards_folders` (
`folder_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`name` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`position` smallint(4) DEFAULT NULL,
PRIMARY KEY (`folder_id`),
UNIQUE KEY `position_project_id` (`position`,`project_id`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_project_dashboards_folders_items` (
`folder_id` int(10) DEFAULT NULL,
`dash_id` int(10) DEFAULT NULL,
UNIQUE KEY `folder_id_dash_id` (`folder_id`,`dash_id`),
KEY `dash_id` (`dash_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_projects` (
`project_id` int(10) NOT NULL AUTO_INCREMENT,
`project_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`app_title` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`status` int(1) NOT NULL DEFAULT '0',
`creation_time` datetime DEFAULT NULL,
`production_time` datetime DEFAULT NULL,
`inactive_time` datetime DEFAULT NULL,
`completed_time` datetime DEFAULT NULL,
`completed_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`data_locked` tinyint(1) NOT NULL DEFAULT '0',
`log_event_table` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'redcap_log_event' COMMENT 'Project redcap_log_event table',
`data_table` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'redcap_data' COMMENT 'Project redcap_data table',
`created_by` int(10) DEFAULT NULL COMMENT 'FK from User Info',
`draft_mode` int(1) NOT NULL DEFAULT '0',
`surveys_enabled` int(1) NOT NULL DEFAULT '0' COMMENT '0 = forms only, 1 = survey+forms, 2 = single survey only',
`repeatforms` int(1) NOT NULL DEFAULT '0',
`scheduling` int(1) NOT NULL DEFAULT '0',
`purpose` int(2) DEFAULT NULL,
`purpose_other` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`show_which_records` int(1) NOT NULL DEFAULT '0',
`__SALT__` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Alphanumeric hash unique to each project',
`count_project` int(1) NOT NULL DEFAULT '1',
`investigators` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_note` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`online_offline` int(1) NOT NULL DEFAULT '1',
`auth_meth` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`double_data_entry` int(1) NOT NULL DEFAULT '0',
`project_language` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'English',
`project_encoding` enum('japanese_sjis','chinese_utf8','chinese_utf8_traditional') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Encoding to be used for various exported files',
`is_child_of` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`date_shift_max` int(10) NOT NULL DEFAULT '364',
`institution` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`site_org_type` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`grant_cite` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_contact_name` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_contact_email` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`headerlogo` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`auto_inc_set` int(1) NOT NULL DEFAULT '0',
`custom_data_entry_note` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`custom_index_page_note` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`order_id_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`custom_reports` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Legacy report builder',
`report_builder` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`disable_data_entry` int(1) NOT NULL DEFAULT '0',
`google_translate_default` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`require_change_reason` int(1) NOT NULL DEFAULT '0',
`dts_enabled` int(1) NOT NULL DEFAULT '0',
`project_pi_firstname` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_pi_mi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_pi_lastname` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_pi_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_pi_alias` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_pi_username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_pi_pub_exclude` int(1) DEFAULT NULL,
`project_pub_matching_institution` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_irb_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_grant_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`history_widget_enabled` int(1) NOT NULL DEFAULT '1',
`secondary_pk` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'field_name of seconary identifier',
`secondary_pk_display_value` tinyint(1) NOT NULL DEFAULT '1',
`secondary_pk_display_label` tinyint(1) NOT NULL DEFAULT '1',
`custom_record_label` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`display_project_logo_institution` int(1) NOT NULL DEFAULT '1',
`imported_from_rs` int(1) NOT NULL DEFAULT '0' COMMENT 'If imported from REDCap Survey',
`display_today_now_button` int(1) NOT NULL DEFAULT '1',
`auto_variable_naming` int(1) NOT NULL DEFAULT '0',
`randomization` int(1) NOT NULL DEFAULT '0',
`enable_participant_identifiers` int(1) NOT NULL DEFAULT '0',
`survey_email_participant_field` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Field name that stores participant email',
`survey_phone_participant_field` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Field name that stores participant phone number',
`data_entry_trigger_url` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'URL for sending Post request when a record is created or modified',
`template_id` int(10) DEFAULT NULL COMMENT 'If created from a project template, the project_id of the template',
`date_deleted` datetime DEFAULT NULL COMMENT 'Time that project was flagged for deletion',
`data_resolution_enabled` int(1) NOT NULL DEFAULT '1' COMMENT '0=Disabled, 1=Field comment log, 2=Data Quality resolution workflow',
`field_comment_edit_delete` int(1) NOT NULL DEFAULT '1' COMMENT 'Allow users to edit or delete Field Comments',
`drw_hide_closed_queries_from_dq_results` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Hide closed and verified DRW data queries from Data Quality results',
`realtime_webservice_enabled` int(1) NOT NULL DEFAULT '0' COMMENT 'Is real-time web service enabled for external data import?',
`realtime_webservice_type` enum('CUSTOM','FHIR') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CUSTOM',
`realtime_webservice_offset_days` float NOT NULL DEFAULT '7' COMMENT 'Default value of days offset',
`realtime_webservice_offset_plusminus` enum('+','-','+-') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '+-' COMMENT 'Default value of plus-minus range for days offset',
`last_logged_event` datetime DEFAULT NULL,
`last_logged_event_exclude_exports` datetime DEFAULT NULL,
`edoc_upload_max` int(10) DEFAULT NULL,
`file_attachment_upload_max` int(10) DEFAULT NULL,
`survey_queue_custom_text` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`survey_queue_hide` tinyint(1) NOT NULL DEFAULT '0',
`survey_auth_enabled` int(1) NOT NULL DEFAULT '0',
`survey_auth_field1` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`survey_auth_event_id1` int(10) DEFAULT NULL,
`survey_auth_field2` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`survey_auth_event_id2` int(10) DEFAULT NULL,
`survey_auth_field3` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`survey_auth_event_id3` int(10) DEFAULT NULL,
`survey_auth_min_fields` enum('1','2','3') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`survey_auth_apply_all_surveys` int(1) NOT NULL DEFAULT '1',
`survey_auth_custom_message` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`survey_auth_fail_limit` int(2) DEFAULT NULL,
`survey_auth_fail_window` int(3) DEFAULT NULL,
`twilio_enabled` int(1) NOT NULL DEFAULT '0',
`twilio_modules_enabled` enum('SURVEYS','ALERTS','SURVEYS_ALERTS') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SURVEYS',
`twilio_hide_in_project` tinyint(1) NOT NULL DEFAULT '0',
`twilio_account_sid` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`twilio_auth_token` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`twilio_from_number` bigint(16) DEFAULT NULL,
`twilio_alphanum_sender_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`twilio_voice_language` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en',
`twilio_option_voice_initiate` tinyint(1) NOT NULL DEFAULT '0',
`twilio_option_sms_initiate` tinyint(1) NOT NULL DEFAULT '0',
`twilio_option_sms_invite_make_call` tinyint(1) NOT NULL DEFAULT '0',
`twilio_option_sms_invite_receive_call` tinyint(1) NOT NULL DEFAULT '0',
`twilio_option_sms_invite_web` tinyint(1) NOT NULL DEFAULT '0',
`twilio_default_delivery_preference` enum('EMAIL','VOICE_INITIATE','SMS_INITIATE','SMS_INVITE_MAKE_CALL','SMS_INVITE_RECEIVE_CALL','SMS_INVITE_WEB') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EMAIL',
`twilio_request_inspector_checked` datetime DEFAULT NULL,
`twilio_request_inspector_enabled` int(1) NOT NULL DEFAULT '1',
`twilio_append_response_instructions` int(1) NOT NULL DEFAULT '1',
`twilio_multiple_sms_behavior` enum('OVERWRITE','CHOICE','FIRST') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CHOICE',
`twilio_delivery_preference_field_map` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`mosio_api_key` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`mosio_hide_in_project` tinyint(1) NOT NULL DEFAULT '0',
`two_factor_exempt_project` tinyint(1) NOT NULL DEFAULT '0',
`two_factor_force_project` tinyint(1) NOT NULL DEFAULT '0',
`two_factor_project_esign_once_per_session` tinyint(1) DEFAULT NULL,
`disable_autocalcs` tinyint(1) NOT NULL DEFAULT '0',
`custom_public_survey_links` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pdf_custom_header_text` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pdf_show_logo_url` tinyint(1) NOT NULL DEFAULT '1',
`pdf_hide_secondary_field` tinyint(1) NOT NULL DEFAULT '0',
`pdf_hide_record_id` tinyint(1) NOT NULL DEFAULT '0',
`shared_library_enabled` tinyint(1) NOT NULL DEFAULT '1',
`allow_delete_record_from_log` tinyint(1) NOT NULL DEFAULT '0',
`delete_file_repository_export_files` int(3) NOT NULL DEFAULT '0' COMMENT 'Will auto-delete files after X days',
`custom_project_footer_text` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`custom_project_footer_text_link` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`google_recaptcha_enabled` tinyint(1) NOT NULL DEFAULT '0',
`datamart_allow_repeat_revision` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'If true, a normal user can run a revision multiple times',
`datamart_allow_create_revision` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'If true, a normal user can request a new revision',
`datamart_enabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Is project a Clinical Data Mart project?',
`break_the_glass_enabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Are users allowed to use the Epic feature Break-the-Glass feature?',
`datamart_cron_enabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'If true, the cron job will pull data automatically for all records at a specified interval X times per day.',
`datamart_cron_end_date` datetime DEFAULT NULL COMMENT 'stop processing the cron job after this date',
`fhir_include_email_address_project` tinyint(1) DEFAULT NULL,
`file_upload_vault_enabled` tinyint(1) NOT NULL DEFAULT '0',
`file_upload_versioning_enabled` tinyint(1) NOT NULL DEFAULT '1',
`missing_data_codes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`record_locking_pdf_vault_enabled` tinyint(1) NOT NULL DEFAULT '0',
`record_locking_pdf_vault_custom_text` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`fhir_cdp_auto_adjudication_enabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'If true, auto adjudicate data in CDP projects',
`fhir_cdp_auto_adjudication_cronjob_enabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'If true, the cron job will auto adjudicate data in CDP projects',
`project_dashboard_min_data_points` int(10) DEFAULT NULL,
`bypass_branching_erase_field_prompt` tinyint(1) NOT NULL DEFAULT '0',
`protected_email_mode` tinyint(1) NOT NULL DEFAULT '0',
`protected_email_mode_custom_text` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`protected_email_mode_trigger` enum('ALL','PIPING') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ALL',
`protected_email_mode_logo` int(10) DEFAULT NULL,
`hide_filled_forms` tinyint(1) NOT NULL DEFAULT '1',
`hide_disabled_forms` tinyint(1) NOT NULL DEFAULT '0',
`sendgrid_enabled` tinyint(1) NOT NULL DEFAULT '0',
`sendgrid_project_api_key` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`mycap_enabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Is project a MyCap project?',
`file_repository_total_size` int(10) DEFAULT NULL COMMENT 'MB',
`project_db_character_set` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_db_collation` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`ehr_id` int(11) DEFAULT NULL,
`allow_econsent_allow_edit` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Set to 0 to prevent users from modifying a completed e-Consent response in the project.',
`store_in_vault_snapshots_containing_completed_econsent` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Regarding non-e-Consent governed snapshots only, store in Vault (if enabled) if snapshot contains a completed e-Consent response?',
`task_complete_status` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Task completion status when submitted from app-side. 0 - Incomplete, 1 - Unverified, 2 - Complete',
`local_storage_subfolder` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`openai_endpoint_url_project` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`openai_api_key_project` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`openai_api_version_project` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`geminiai_api_key_project` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`geminiai_api_model_project` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`geminiai_api_version_project` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`max_records_development` int(11) NOT NULL DEFAULT '0' COMMENT '0=Disabled',
`rewards_enabled` tinyint(1) NOT NULL DEFAULT '0',
PRIMARY KEY (`project_id`),
UNIQUE KEY `project_name` (`project_name`),
UNIQUE KEY `twilio_from_number` (`twilio_from_number`),
KEY `app_title` (`app_title`(190)),
KEY `auth_meth` (`auth_meth`),
KEY `completed_by` (`completed_by`),
KEY `completed_time` (`completed_time`),
KEY `created_by` (`created_by`),
KEY `date_deleted` (`date_deleted`),
KEY `delete_file_repository_export_files` (`delete_file_repository_export_files`),
KEY `ehr_id` (`ehr_id`),
KEY `last_logged_event` (`last_logged_event`),
KEY `last_logged_event_exclude_exports` (`last_logged_event_exclude_exports`),
KEY `project_note` (`project_note`(190)),
KEY `protected_email_mode_logo` (`protected_email_mode_logo`),
KEY `survey_auth_event_id1` (`survey_auth_event_id1`),
KEY `survey_auth_event_id2` (`survey_auth_event_id2`),
KEY `survey_auth_event_id3` (`survey_auth_event_id3`),
KEY `template_id` (`template_id`),
KEY `twilio_account_sid` (`twilio_account_sid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores project-level values';

CREATE TABLE `redcap_projects_external` (
`project_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Brief user-defined project identifier unique within custom_type',
`custom_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Brief user-defined name for the resource/category/bucket under which the project falls',
`app_title` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`creation_time` datetime DEFAULT NULL,
`project_pi_firstname` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_pi_mi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_pi_lastname` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_pi_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_pi_alias` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_pi_pub_exclude` int(1) DEFAULT NULL,
`project_pub_matching_institution` text COLLATE utf8mb4_unicode_ci NOT NULL,
PRIMARY KEY (`project_id`,`custom_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_projects_templates` (
`project_id` int(10) NOT NULL DEFAULT '0',
`title` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`enabled` int(1) NOT NULL DEFAULT '0' COMMENT 'If enabled, template is visible to users in list.',
`copy_records` tinyint(1) NOT NULL DEFAULT '0',
PRIMARY KEY (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Info about which projects are used as templates';

CREATE TABLE `redcap_projects_user_hidden` (
`project_id` int(10) NOT NULL,
`ui_id` int(10) NOT NULL,
PRIMARY KEY (`project_id`,`ui_id`),
KEY `ui_id` (`ui_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_pub_articles` (
`article_id` int(10) NOT NULL AUTO_INCREMENT,
`pubsrc_id` int(10) NOT NULL,
`pub_id` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'The publication source''s ID for the article (e.g., a PMID in the case of PubMed)',
`title` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`volume` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`issue` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pages` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`journal` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`journal_abbrev` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pub_date` date DEFAULT NULL,
`epub_date` date DEFAULT NULL,
PRIMARY KEY (`article_id`),
UNIQUE KEY `pubsrc_id` (`pubsrc_id`,`pub_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Articles pulled from a publication source (e.g., PubMed)';

CREATE TABLE `redcap_pub_authors` (
`author_id` int(10) NOT NULL AUTO_INCREMENT,
`article_id` int(10) DEFAULT NULL,
`author` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`author_id`),
KEY `article_id` (`article_id`),
KEY `author` (`author`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_pub_matches` (
`match_id` int(11) NOT NULL AUTO_INCREMENT,
`article_id` int(11) NOT NULL,
`project_id` int(11) DEFAULT NULL,
`external_project_id` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'FK 1/2 referencing redcap_projects_external (not explicitly defined as FK to allow redcap_projects_external to be blown away)',
`external_custom_type` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'FK 2/2 referencing redcap_projects_external (not explicitly defined as FK to allow redcap_projects_external to be blown away)',
`search_term` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
`matched` int(1) DEFAULT NULL,
`matched_time` datetime DEFAULT NULL,
`email_count` int(11) NOT NULL DEFAULT '0',
`email_time` datetime DEFAULT NULL,
`unique_hash` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
PRIMARY KEY (`match_id`),
UNIQUE KEY `unique_hash` (`unique_hash`),
KEY `article_id` (`article_id`),
KEY `external_custom_type` (`external_custom_type`),
KEY `external_project_id` (`external_project_id`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_pub_mesh_terms` (
`mesh_id` int(10) NOT NULL AUTO_INCREMENT,
`article_id` int(10) DEFAULT NULL,
`mesh_term` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`mesh_id`),
KEY `article_id` (`article_id`),
KEY `mesh_term` (`mesh_term`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_pub_sources` (
`pubsrc_id` int(11) NOT NULL,
`pubsrc_name` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
`pubsrc_last_crawl_time` datetime DEFAULT NULL,
PRIMARY KEY (`pubsrc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='The different places where we grab publications from';

CREATE TABLE `redcap_queue` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`status` enum('waiting','processing','completed','warning','error','canceled') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`priority` int(11) DEFAULT NULL,
`message` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`data` blob DEFAULT NULL,
`created_at` datetime DEFAULT NULL,
`started_at` datetime DEFAULT NULL,
`completed_at` datetime DEFAULT NULL,
PRIMARY KEY (`id`),
KEY `created_at` (`created_at`),
KEY `key_index` (`key`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_randomization` (
`rid` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`stratified` int(1) NOT NULL DEFAULT '1' COMMENT '1=Stratified, 0=Block',
`group_by` enum('DAG','FIELD') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Randomize by group?',
`target_field` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`target_event` int(10) DEFAULT NULL,
`source_field1` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`source_event1` int(10) DEFAULT NULL,
`source_field2` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`source_event2` int(10) DEFAULT NULL,
`source_field3` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`source_event3` int(10) DEFAULT NULL,
`source_field4` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`source_event4` int(10) DEFAULT NULL,
`source_field5` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`source_event5` int(10) DEFAULT NULL,
`source_field6` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`source_event6` int(10) DEFAULT NULL,
`source_field7` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`source_event7` int(10) DEFAULT NULL,
`source_field8` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`source_event8` int(10) DEFAULT NULL,
`source_field9` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`source_event9` int(10) DEFAULT NULL,
`source_field10` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`source_event10` int(10) DEFAULT NULL,
`source_field11` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`source_event11` int(10) DEFAULT NULL,
`source_field12` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`source_event12` int(10) DEFAULT NULL,
`source_field13` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`source_event13` int(10) DEFAULT NULL,
`source_field14` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`source_event14` int(10) DEFAULT NULL,
`source_field15` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`source_event15` int(10) DEFAULT NULL,
`trigger_option` int(1) DEFAULT NULL,
`trigger_instrument` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`trigger_event_id` int(10) DEFAULT NULL,
`trigger_logic` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`rid`),
UNIQUE KEY `target` (`project_id`,`target_field`,`target_event`),
KEY `source_event1` (`source_event1`),
KEY `source_event10` (`source_event10`),
KEY `source_event11` (`source_event11`),
KEY `source_event12` (`source_event12`),
KEY `source_event13` (`source_event13`),
KEY `source_event14` (`source_event14`),
KEY `source_event15` (`source_event15`),
KEY `source_event2` (`source_event2`),
KEY `source_event3` (`source_event3`),
KEY `source_event4` (`source_event4`),
KEY `source_event5` (`source_event5`),
KEY `source_event6` (`source_event6`),
KEY `source_event7` (`source_event7`),
KEY `source_event8` (`source_event8`),
KEY `source_event9` (`source_event9`),
KEY `target_event` (`target_event`),
KEY `trigger_event_id` (`trigger_event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_randomization_allocation` (
`aid` int(10) NOT NULL AUTO_INCREMENT,
`rid` int(10) NOT NULL DEFAULT '0',
`project_status` int(1) NOT NULL DEFAULT '0' COMMENT 'Used in dev or prod status',
`is_used_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Used by a record?',
`allocation_time` datetime DEFAULT NULL,
`allocation_time_utc` datetime DEFAULT NULL,
`group_id` int(10) DEFAULT NULL COMMENT 'DAG',
`target_field` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Data value',
`target_field_alt` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`source_field1` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Data value',
`source_field2` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Data value',
`source_field3` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Data value',
`source_field4` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Data value',
`source_field5` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Data value',
`source_field6` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Data value',
`source_field7` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Data value',
`source_field8` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Data value',
`source_field9` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Data value',
`source_field10` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Data value',
`source_field11` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Data value',
`source_field12` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Data value',
`source_field13` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Data value',
`source_field14` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Data value',
`source_field15` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Data value',
PRIMARY KEY (`aid`),
UNIQUE KEY `rid_status_usedby` (`rid`,`project_status`,`is_used_by`),
KEY `group_id` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_record_background_delete` (
`delete_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`user_id` int(10) DEFAULT NULL COMMENT 'User deleting the records',
`request_time` datetime DEFAULT NULL,
`start_time` datetime DEFAULT NULL,
`completed_time` datetime DEFAULT NULL,
`status` enum('INITIALIZING','QUEUED','PROCESSING','COMPLETED','FAILED','CANCELED','PAUSED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INITIALIZING',
`form_event` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`records_provided` int(10) DEFAULT NULL,
`records_deleted` int(10) DEFAULT NULL,
`total_errors` int(10) DEFAULT NULL,
`total_processing_time` int(10) DEFAULT NULL COMMENT 'seconds',
`remove_log_details` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'If data details for record should be wiped from the log',
`change_reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`delete_id`),
KEY `completed_time` (`completed_time`),
KEY `project_id` (`project_id`),
KEY `request_time` (`request_time`),
KEY `start_time` (`start_time`),
KEY `status_completed_time` (`status`,`completed_time`),
KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_record_background_delete_items` (
`dr_id` int(10) NOT NULL AUTO_INCREMENT,
`delete_id` int(10) NOT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`arm_id` int(10) DEFAULT NULL,
`row_status` enum('QUEUED','PROCESSING','COMPLETED','FAILED','CANCELED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'QUEUED',
`start_time` datetime DEFAULT NULL,
`end_time` datetime DEFAULT NULL,
`total_time` int(10) DEFAULT NULL COMMENT 'milliseconds',
`error_count` int(10) DEFAULT NULL,
`errors` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`dr_id`),
UNIQUE KEY `delete_dr_id` (`delete_id`,`dr_id`),
KEY `arm_id_record` (`arm_id`,`record`),
KEY `delete_id_record_arm_id` (`delete_id`,`record`,`arm_id`),
KEY `delete_id_row_status` (`delete_id`,`row_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_record_counts` (
`project_id` int(11) NOT NULL,
`record_count` int(11) DEFAULT NULL,
`time_of_count` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
`record_list_status` enum('NOT_STARTED','PROCESSING','COMPLETE','FIX_SORT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NOT_STARTED',
`time_of_list_cache` timestamp NULL DEFAULT NULL,
PRIMARY KEY (`project_id`),
KEY `time_of_count` (`time_of_count`),
KEY `time_of_list_cache` (`time_of_list_cache`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_record_dashboards` (
`rd_id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(11) DEFAULT NULL,
`title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`filter_logic` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`orientation` enum('V','H') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'H',
`group_by` enum('form','event') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'event',
`selected_forms_events` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`arm` int(2) DEFAULT NULL,
`sort_event_id` int(11) DEFAULT NULL,
`sort_field_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`sort_order` enum('ASC','DESC') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ASC',
PRIMARY KEY (`rd_id`),
KEY `project_id` (`project_id`),
KEY `sort_event_id` (`sort_event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_record_list` (
`project_id` int(10) NOT NULL,
`arm` int(2) NOT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
`dag_id` int(10) DEFAULT NULL,
`sort` mediumint(7) DEFAULT NULL,
PRIMARY KEY (`project_id`,`arm`,`record`),
KEY `dag_project_arm` (`dag_id`,`project_id`,`arm`),
KEY `project_record` (`project_id`,`record`),
KEY `sort_project_arm` (`sort`,`project_id`,`arm`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_reports` (
`report_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) NOT NULL,
`title` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`unique_report_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`report_order` int(3) DEFAULT NULL,
`user_access` enum('ALL','SELECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ALL',
`user_edit_access` enum('ALL','SELECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ALL',
`description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`combine_checkbox_values` tinyint(1) NOT NULL DEFAULT '0',
`output_dags` int(1) NOT NULL DEFAULT '0',
`output_survey_fields` int(1) NOT NULL DEFAULT '0',
`output_missing_data_codes` int(1) NOT NULL DEFAULT '0',
`remove_line_breaks_in_values` int(1) NOT NULL DEFAULT '1',
`orderby_field1` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`orderby_sort1` enum('ASC','DESC') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`orderby_field2` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`orderby_sort2` enum('ASC','DESC') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`orderby_field3` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`orderby_sort3` enum('ASC','DESC') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`advanced_logic` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`filter_type` enum('RECORD','EVENT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EVENT',
`dynamic_filter1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`dynamic_filter2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`dynamic_filter3` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`hash` varchar(16) CHARACTER SET latin1 COLLATE latin1_general_cs DEFAULT NULL,
`short_url` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`is_public` tinyint(1) NOT NULL DEFAULT '0',
`report_display_include_repeating_fields` tinyint(1) NOT NULL DEFAULT '1',
`report_display_header` enum('LABEL','VARIABLE','BOTH') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BOTH',
`report_display_data` enum('LABEL','RAW','BOTH') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BOTH',
PRIMARY KEY (`report_id`),
UNIQUE KEY `hash` (`hash`),
UNIQUE KEY `project_report_order` (`project_id`,`report_order`),
UNIQUE KEY `unique_report_name_project_id` (`unique_report_name`,`project_id`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_reports_access_dags` (
`report_id` int(10) NOT NULL AUTO_INCREMENT,
`group_id` int(10) NOT NULL DEFAULT '0',
PRIMARY KEY (`report_id`,`group_id`),
KEY `group_id` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_reports_access_roles` (
`report_id` int(10) NOT NULL DEFAULT '0',
`role_id` int(10) NOT NULL DEFAULT '0',
PRIMARY KEY (`report_id`,`role_id`),
KEY `role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_reports_access_users` (
`report_id` int(10) NOT NULL AUTO_INCREMENT,
`username` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
PRIMARY KEY (`report_id`,`username`),
KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_reports_ai_prompts` (
`project_id` int(10) NOT NULL,
`report_id` int(10) DEFAULT NULL,
`field_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`summary_prompt` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
UNIQUE KEY `project_id_report_id_field_name` (`project_id`,`report_id`,`field_name`),
KEY `field_name` (`field_name`),
KEY `project_id` (`project_id`),
KEY `report_id` (`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_reports_edit_access_dags` (
`report_id` int(10) NOT NULL AUTO_INCREMENT,
`group_id` int(10) NOT NULL DEFAULT '0',
PRIMARY KEY (`report_id`,`group_id`),
KEY `group_id` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_reports_edit_access_roles` (
`report_id` int(10) NOT NULL DEFAULT '0',
`role_id` int(10) NOT NULL DEFAULT '0',
PRIMARY KEY (`report_id`,`role_id`),
KEY `role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_reports_edit_access_users` (
`report_id` int(10) NOT NULL AUTO_INCREMENT,
`username` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
PRIMARY KEY (`report_id`,`username`),
KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_reports_fields` (
`report_id` int(10) DEFAULT NULL,
`field_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`field_order` int(3) DEFAULT NULL,
`limiter_group_operator` enum('AND','OR') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`limiter_event_id` int(10) DEFAULT NULL,
`limiter_operator` enum('E','NE','GT','GTE','LT','LTE','CHECKED','UNCHECKED','CONTAINS','NOT_CONTAIN','STARTS_WITH','ENDS_WITH') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`limiter_value` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
UNIQUE KEY `report_id_field_name_order` (`report_id`,`field_name`,`field_order`),
KEY `field_name` (`field_name`),
KEY `limiter_event_id` (`limiter_event_id`),
KEY `report_id_field_order` (`report_id`,`field_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_reports_filter_dags` (
`report_id` int(10) NOT NULL AUTO_INCREMENT,
`group_id` int(10) NOT NULL DEFAULT '0',
PRIMARY KEY (`report_id`,`group_id`),
KEY `group_id` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_reports_filter_events` (
`report_id` int(10) NOT NULL AUTO_INCREMENT,
`event_id` int(10) NOT NULL DEFAULT '0',
PRIMARY KEY (`report_id`,`event_id`),
KEY `event_id` (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_reports_folders` (
`folder_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`name` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`position` smallint(4) DEFAULT NULL,
PRIMARY KEY (`folder_id`),
UNIQUE KEY `position_project_id` (`position`,`project_id`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_reports_folders_items` (
`folder_id` int(10) DEFAULT NULL,
`report_id` int(10) DEFAULT NULL,
UNIQUE KEY `folder_id_report_id` (`folder_id`,`report_id`),
KEY `report_id` (`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_rewards_access_token` (
`access_token_id` int(11) NOT NULL AUTO_INCREMENT,
`access_token` text COLLATE utf8mb4_unicode_ci NOT NULL,
`scope` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`expires_in` int(11) DEFAULT NULL,
`token_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`created_at` datetime DEFAULT NULL,
`project_id` int(11) NOT NULL,
`provider_id` int(11) NOT NULL,
PRIMARY KEY (`access_token_id`),
KEY `project_id` (`project_id`),
KEY `provider_id` (`provider_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_rewards_actions` (
`action_id` int(11) NOT NULL AUTO_INCREMENT,
`order_id` int(11) DEFAULT NULL,
`project_id` int(11) DEFAULT NULL,
`arm_number` int(11) DEFAULT '1',
`record_id` int(11) DEFAULT NULL,
`stage` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'e.g., eligibility_review, financial_authorization, compensation_delivery',
`event` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'pending' COMMENT 'e.g., approval, rejection, revert, error, unknown, redeem_code_generated, email_sent',
`status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'e.g., pending, completed, error',
`comment` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Reason for rejection, if applicable',
`details` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'extra details (e.g.: errors, payload)',
`performed_by` int(11) DEFAULT NULL,
`performed_at` datetime DEFAULT NULL,
PRIMARY KEY (`action_id`),
KEY `fk_action_performed_by` (`performed_by`),
KEY `fk_action_project` (`project_id`),
KEY `fk_action_reward_option` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_rewards_emails` (
`email_id` int(11) NOT NULL AUTO_INCREMENT,
`sendable_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Type of the related entity',
`sendable_id` int(11) DEFAULT NULL COMMENT 'ID of the related entity',
`email_subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Subject of the email sent',
`email_content` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Content of the email sent',
`sender_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email address of the sender',
`recipient_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email address of the recipient',
`sent_at` datetime DEFAULT NULL COMMENT 'Timestamp when the email was sent',
`sent_by` int(11) DEFAULT NULL COMMENT 'User ID who sent the email',
PRIMARY KEY (`email_id`),
KEY `fk_email_sent_by` (`sent_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_rewards_logs` (
`log_id` int(11) NOT NULL AUTO_INCREMENT,
`table_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
`action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
`payload` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_id` int(11) DEFAULT NULL,
`created_at` datetime DEFAULT NULL,
PRIMARY KEY (`log_id`),
KEY `fk_log_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_rewards_orders` (
`order_id` int(11) NOT NULL AUTO_INCREMENT,
`reward_option_id` int(11) DEFAULT NULL,
`project_id` int(11) DEFAULT NULL,
`arm_number` int(11) DEFAULT '1',
`record_id` int(11) DEFAULT NULL,
`internal_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'a reference ID for internal use',
`reference_order` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'order ID from the reward provider',
`eligibility_logic` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'stored for history',
`reward_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`reward_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`reward_value` decimal(10,2) DEFAULT NULL,
`redeem_link` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`scheduled_action` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`uuid` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
`created_by` int(11) DEFAULT NULL,
`created_at` datetime DEFAULT NULL,
PRIMARY KEY (`order_id`),
UNIQUE KEY `idx_uuid_unique` (`uuid`),
KEY `fk_order_created_by` (`created_by`),
KEY `fk_order_redcap_project` (`project_id`),
KEY `fk_order_reward_option` (`reward_option_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_rewards_permissions` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
PRIMARY KEY (`id`),
UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_rewards_project_providers` (
`project_id` int(11) NOT NULL,
`provider_id` int(11) NOT NULL,
UNIQUE KEY `unique_project_provider` (`project_id`,`provider_id`),
KEY `provider_id` (`provider_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_rewards_project_settings` (
`project_setting_id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(11) NOT NULL,
`setting_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
`setting_value` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`project_setting_id`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_rewards_providers` (
`provider_id` int(11) NOT NULL AUTO_INCREMENT,
`provider_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
`is_default` tinyint(1) NOT NULL DEFAULT '0',
PRIMARY KEY (`provider_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_rewards_reward_option` (
`reward_option_id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(11) DEFAULT NULL,
`provider_product_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`value_amount` decimal(10,2) DEFAULT NULL,
`eligibility_logic` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`deleted_at` timestamp NULL DEFAULT NULL,
PRIMARY KEY (`reward_option_id`),
KEY `fk_reward_option_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_rewards_settings` (
`setting_id` int(11) NOT NULL AUTO_INCREMENT,
`provider_id` int(11) NOT NULL,
`setting_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
`setting_value` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`setting_id`),
KEY `redcap_rewards_settings_ibfk_1` (`provider_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_rewards_user_permissions` (
`user_id` int(11) NOT NULL,
`permission_id` int(11) NOT NULL,
`project_id` int(11) NOT NULL,
PRIMARY KEY (`user_id`,`permission_id`,`project_id`),
KEY `permission_id` (`permission_id`),
KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_sendit_docs` (
`document_id` int(11) NOT NULL AUTO_INCREMENT,
`doc_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`doc_orig_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`doc_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`doc_size` int(11) DEFAULT NULL,
`send_confirmation` int(1) NOT NULL DEFAULT '0',
`expire_date` datetime DEFAULT NULL,
`username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`location` int(1) NOT NULL DEFAULT '0' COMMENT '1 = Home page; 2 = File Repository; 3 = Form',
`docs_id` int(11) NOT NULL DEFAULT '0',
`date_added` datetime DEFAULT NULL,
`date_deleted` datetime DEFAULT NULL COMMENT 'When really deleted from server (only applicable for location=1)',
PRIMARY KEY (`document_id`),
KEY `date_added` (`date_added`),
KEY `docs_id_location` (`location`,`docs_id`),
KEY `expire_location_deleted` (`expire_date`,`location`,`date_deleted`),
KEY `user_id` (`username`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_sendit_recipients` (
`recipient_id` int(11) NOT NULL AUTO_INCREMENT,
`email_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`sent_confirmation` int(1) NOT NULL DEFAULT '0',
`download_date` datetime DEFAULT NULL,
`download_count` int(11) NOT NULL DEFAULT '0',
`document_id` int(11) NOT NULL DEFAULT '0' COMMENT 'FK from redcap_sendit_docs',
`guid` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pwd` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`recipient_id`),
KEY `document_id` (`document_id`),
KEY `email_address` (`email_address`(191)),
KEY `guid` (`guid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_sessions` (
`session_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
`session_data` longtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`session_expiration` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (`session_id`),
KEY `session_expiration` (`session_expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores user authentication session data';

CREATE TABLE `redcap_surveys` (
`survey_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`form_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'NULL = assume first form',
`title` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Survey title',
`instructions` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Survey instructions',
`offline_instructions` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`acknowledgement` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Survey acknowledgement',
`stop_action_acknowledgement` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`stop_action_delete_response` tinyint(1) NOT NULL DEFAULT '0',
`question_by_section` int(1) NOT NULL DEFAULT '0' COMMENT '0 = one-page survey',
`display_page_number` int(1) NOT NULL DEFAULT '1',
`question_auto_numbering` int(1) NOT NULL DEFAULT '1',
`survey_enabled` int(1) NOT NULL DEFAULT '1',
`save_and_return` int(1) NOT NULL DEFAULT '0',
`save_and_return_code_bypass` tinyint(1) NOT NULL DEFAULT '0',
`logo` int(10) DEFAULT NULL COMMENT 'FK for redcap_edocs_metadata',
`hide_title` int(1) NOT NULL DEFAULT '0',
`view_results` int(1) NOT NULL DEFAULT '0',
`min_responses_view_results` int(5) NOT NULL DEFAULT '10',
`check_diversity_view_results` int(1) NOT NULL DEFAULT '0',
`end_survey_redirect_url` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'URL to redirect to after completing survey',
`survey_expiration` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Timestamp when survey expires',
`promis_skip_question` int(1) NOT NULL DEFAULT '0' COMMENT 'Allow participants to skip questions on PROMIS CATs',
`survey_auth_enabled_single` int(1) NOT NULL DEFAULT '0' COMMENT 'Enable Survey Login for this single survey?',
`edit_completed_response` int(1) NOT NULL DEFAULT '0' COMMENT 'Allow respondents to return and edit a completed response?',
`hide_back_button` tinyint(1) NOT NULL DEFAULT '0',
`show_required_field_text` tinyint(1) NOT NULL DEFAULT '1',
`confirmation_email_subject` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`confirmation_email_content` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`confirmation_email_from` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`confirmation_email_from_display` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email sender display name',
`confirmation_email_attach_pdf` tinyint(1) DEFAULT '0',
`confirmation_email_attachment` int(10) DEFAULT NULL COMMENT 'FK for redcap_edocs_metadata',
`text_to_speech` int(1) NOT NULL DEFAULT '0',
`text_to_speech_language` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en',
`end_survey_redirect_next_survey` tinyint(1) NOT NULL DEFAULT '0',
`end_survey_redirect_next_survey_logic` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`theme` int(10) DEFAULT NULL,
`text_size` tinyint(2) DEFAULT NULL,
`font_family` tinyint(2) DEFAULT NULL,
`custom_css` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`theme_text_buttons` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`theme_bg_page` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`theme_text_title` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`theme_bg_title` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`theme_text_sectionheader` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`theme_bg_sectionheader` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`theme_text_question` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`theme_bg_question` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`enhanced_choices` smallint(1) NOT NULL DEFAULT '0',
`repeat_survey_enabled` tinyint(1) NOT NULL DEFAULT '0',
`repeat_survey_btn_text` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`repeat_survey_btn_location` enum('BEFORE_SUBMIT','AFTER_SUBMIT','HIDDEN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BEFORE_SUBMIT',
`response_limit` int(7) DEFAULT NULL,
`response_limit_include_partials` tinyint(1) NOT NULL DEFAULT '1',
`response_limit_custom_text` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`survey_time_limit_days` smallint(3) DEFAULT NULL,
`survey_time_limit_hours` tinyint(2) DEFAULT NULL,
`survey_time_limit_minutes` tinyint(2) DEFAULT NULL,
`email_participant_field` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`end_of_survey_pdf_download` tinyint(4) NOT NULL DEFAULT '0',
`pdf_save_to_field` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pdf_save_to_event_id` int(10) DEFAULT NULL,
`pdf_save_translated` tinyint(1) NOT NULL DEFAULT '0',
`pdf_auto_archive` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0=Disabled, 1=Normal, 2=eConsent',
`pdf_econsent_version` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pdf_econsent_type` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pdf_econsent_firstname_field` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pdf_econsent_firstname_event_id` int(11) DEFAULT NULL,
`pdf_econsent_lastname_field` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pdf_econsent_lastname_event_id` int(11) DEFAULT NULL,
`pdf_econsent_dob_field` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pdf_econsent_dob_event_id` int(11) DEFAULT NULL,
`pdf_econsent_allow_edit` tinyint(1) NOT NULL DEFAULT '0',
`pdf_econsent_signature_field1` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pdf_econsent_signature_field2` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pdf_econsent_signature_field3` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pdf_econsent_signature_field4` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`pdf_econsent_signature_field5` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`survey_width_percent` int(3) DEFAULT NULL,
`survey_show_font_resize` tinyint(1) NOT NULL DEFAULT '1',
`survey_btn_text_prev_page` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`survey_btn_text_next_page` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`survey_btn_text_submit` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`survey_btn_hide_submit` tinyint(1) NOT NULL DEFAULT '0',
`survey_btn_hide_submit_logic` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`survey_id`),
UNIQUE KEY `logo` (`logo`),
UNIQUE KEY `project_form` (`project_id`,`form_name`),
KEY `confirmation_email_attachment` (`confirmation_email_attachment`),
KEY `pdf_econsent_dob_event_id` (`pdf_econsent_dob_event_id`),
KEY `pdf_econsent_firstname_event_id` (`pdf_econsent_firstname_event_id`),
KEY `pdf_econsent_lastname_event_id` (`pdf_econsent_lastname_event_id`),
KEY `pdf_save_to_event_id` (`pdf_save_to_event_id`),
KEY `survey_expiration_enabled` (`survey_expiration`,`survey_enabled`),
KEY `theme` (`theme`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table for survey data';

CREATE TABLE `redcap_surveys_emails` (
`email_id` int(10) NOT NULL AUTO_INCREMENT,
`survey_id` int(10) DEFAULT NULL,
`email_subject` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`email_content` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`email_sender` int(10) DEFAULT NULL COMMENT 'FK ui_id from redcap_user_information',
`email_sender_display` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email sender display name',
`email_account` enum('1','2','3') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Sender''s account (1=Primary, 2=Secondary, 3=Tertiary)',
`email_static` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Sender''s static email address (only for scheduled invitations)',
`email_sent` datetime DEFAULT NULL COMMENT 'Null=Not sent yet (scheduled)',
`delivery_type` enum('PARTICIPANT_PREF','EMAIL','VOICE_INITIATE','SMS_INITIATE','SMS_INVITE_MAKE_CALL','SMS_INVITE_RECEIVE_CALL','SMS_INVITE_WEB') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EMAIL',
`append_survey_link` tinyint(1) NOT NULL DEFAULT '1',
`lang_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`email_id`),
KEY `email_sender` (`email_sender`),
KEY `email_sent` (`email_sent`),
KEY `lang_id` (`lang_id`),
KEY `survey_id_email_sent` (`survey_id`,`email_sent`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Track emails sent out';

CREATE TABLE `redcap_surveys_emails_recipients` (
`email_recip_id` int(10) NOT NULL AUTO_INCREMENT,
`email_id` int(10) DEFAULT NULL COMMENT 'FK redcap_surveys_emails',
`participant_id` int(10) DEFAULT NULL COMMENT 'FK redcap_surveys_participants',
`static_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Static email address of recipient (used when participant has no email)',
`static_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Static phone number of recipient (used when participant has no phone number)',
`delivery_type` enum('EMAIL','VOICE_INITIATE','SMS_INITIATE','SMS_INVITE_MAKE_CALL','SMS_INVITE_RECEIVE_CALL','SMS_INVITE_WEB') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EMAIL',
PRIMARY KEY (`email_recip_id`),
KEY `emt_id` (`email_id`),
KEY `participant_id` (`participant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Track email recipients';

CREATE TABLE `redcap_surveys_emails_send_rate` (
`esr_id` int(10) NOT NULL AUTO_INCREMENT,
`sent_begin_time` datetime DEFAULT NULL COMMENT 'Time email batch was sent',
`emails_per_batch` int(10) DEFAULT NULL COMMENT 'Number of emails sent in this batch',
`emails_per_minute` int(6) DEFAULT NULL COMMENT 'Number of emails sent per minute for this batch',
PRIMARY KEY (`esr_id`),
KEY `sent_begin_time` (`sent_begin_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Capture the rate that emails are sent per minute by REDCap';

CREATE TABLE `redcap_surveys_erase_twilio_log` (
`tl_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`ts` datetime DEFAULT NULL,
`sid` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`sid_hash` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`tl_id`),
UNIQUE KEY `sid` (`sid`),
UNIQUE KEY `sid_hash` (`sid_hash`),
KEY `project_id` (`project_id`),
KEY `ts` (`ts`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Temporary storage of Twilio logs to be deleted';

CREATE TABLE `redcap_surveys_login` (
`ts` datetime DEFAULT NULL,
`response_id` int(10) DEFAULT NULL,
`login_success` tinyint(1) NOT NULL DEFAULT '1',
KEY `response_id` (`response_id`),
KEY `ts_response_id_success` (`ts`,`response_id`,`login_success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_surveys_participants` (
`participant_id` int(10) NOT NULL AUTO_INCREMENT,
`survey_id` int(10) DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`hash` varchar(32) CHARACTER SET latin1 COLLATE latin1_general_cs DEFAULT NULL,
`legacy_hash` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Migrated from RS',
`access_code` varchar(9) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`access_code_numeral` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`participant_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'NULL if public survey',
`participant_identifier` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`participant_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`delivery_preference` enum('EMAIL','VOICE_INITIATE','SMS_INITIATE','SMS_INVITE_MAKE_CALL','SMS_INVITE_RECEIVE_CALL','SMS_INVITE_WEB') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`link_expiration` datetime DEFAULT NULL,
`link_expiration_override` tinyint(1) NOT NULL DEFAULT '0',
PRIMARY KEY (`participant_id`),
UNIQUE KEY `access_code` (`access_code`),
UNIQUE KEY `access_code_numeral` (`access_code_numeral`),
UNIQUE KEY `hash` (`hash`),
UNIQUE KEY `legacy_hash` (`legacy_hash`),
KEY `event_id` (`event_id`),
KEY `participant_email_phone` (`participant_email`(191),`participant_phone`),
KEY `survey_event_email` (`survey_id`,`event_id`,`participant_email`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table for survey data';

CREATE TABLE `redcap_surveys_pdf_archive` (
`doc_id` int(10) DEFAULT NULL,
`consent_id` int(10) DEFAULT NULL,
`consent_form_id` int(10) DEFAULT NULL,
`contains_completed_consent` tinyint(1) NOT NULL DEFAULT '0',
`snapshot_id` int(10) DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`survey_id` int(10) DEFAULT NULL,
`instance` smallint(4) NOT NULL DEFAULT '1',
`identifier` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`version` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`type` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`ip` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
UNIQUE KEY `doc_id` (`doc_id`),
KEY `consent_form_id_record` (`consent_form_id`,`record`),
KEY `consent_id_record` (`consent_id`,`record`),
KEY `event_id` (`event_id`),
KEY `record_event_survey_instance` (`record`,`event_id`,`survey_id`,`instance`),
KEY `snapshot_id_record` (`snapshot_id`,`record`),
KEY `survey_id` (`survey_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_surveys_phone_codes` (
`pc_id` int(10) NOT NULL AUTO_INCREMENT,
`phone_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
`twilio_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
`access_code` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`project_id` int(10) DEFAULT NULL,
`session_id` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`pc_id`),
UNIQUE KEY `phone_access_project` (`phone_number`,`twilio_number`,`access_code`,`project_id`),
KEY `participant_twilio_phone` (`phone_number`,`twilio_number`),
KEY `project_id` (`project_id`),
KEY `session_id` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_surveys_queue` (
`sq_id` int(10) NOT NULL AUTO_INCREMENT,
`survey_id` int(10) DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`active` int(1) NOT NULL DEFAULT '1' COMMENT 'Is it currently active?',
`auto_start` int(1) NOT NULL DEFAULT '0' COMMENT 'Automatically start if next after survey completion',
`condition_surveycomplete_survey_id` int(10) DEFAULT NULL COMMENT 'survey_id of trigger',
`condition_surveycomplete_event_id` int(10) DEFAULT NULL COMMENT 'event_id of trigger',
`condition_andor` enum('AND','OR') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Include survey complete AND/OR logic',
`condition_logic` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Logic using field values',
PRIMARY KEY (`sq_id`),
UNIQUE KEY `survey_event` (`survey_id`,`event_id`),
KEY `condition_surveycomplete_event_id` (`condition_surveycomplete_event_id`),
KEY `condition_surveycomplete_survey_event` (`condition_surveycomplete_survey_id`,`condition_surveycomplete_event_id`),
KEY `event_id` (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_surveys_queue_hashes` (
`project_id` int(10) NOT NULL DEFAULT '0',
`record` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
`hash` varchar(10) CHARACTER SET latin1 COLLATE latin1_general_cs DEFAULT NULL,
PRIMARY KEY (`project_id`,`record`),
UNIQUE KEY `hash` (`hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_surveys_response` (
`response_id` int(11) NOT NULL AUTO_INCREMENT,
`participant_id` int(10) DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`instance` smallint(4) NOT NULL DEFAULT '1',
`start_time` datetime DEFAULT NULL,
`first_submit_time` datetime DEFAULT NULL,
`completion_time` datetime DEFAULT NULL,
`return_code` varchar(8) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`results_code` varchar(8) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`response_id`),
UNIQUE KEY `participant_record` (`participant_id`,`record`,`instance`),
KEY `completion_time` (`completion_time`),
KEY `first_submit_time` (`first_submit_time`),
KEY `record_participant` (`record`,`participant_id`,`instance`),
KEY `results_code` (`results_code`),
KEY `return_code` (`return_code`),
KEY `start_time` (`start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_surveys_scheduler` (
`ss_id` int(10) NOT NULL AUTO_INCREMENT,
`survey_id` int(10) DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`instance` enum('FIRST','AFTER_FIRST') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FIRST' COMMENT 'survey instance being triggered',
`num_recurrence` float NOT NULL DEFAULT '0',
`units_recurrence` enum('DAYS','HOURS','MINUTES') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DAYS',
`max_recurrence` int(5) DEFAULT NULL,
`active` int(1) NOT NULL DEFAULT '1' COMMENT 'Is it currently active?',
`email_subject` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Survey invitation subject',
`email_content` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Survey invitation text',
`email_sender` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Static email address of sender',
`email_sender_display` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email sender display name',
`condition_surveycomplete_survey_id` int(10) DEFAULT NULL COMMENT 'survey_id of trigger',
`condition_surveycomplete_event_id` int(10) DEFAULT NULL COMMENT 'event_id of trigger',
`condition_surveycomplete_instance` enum('FIRST','PREVIOUS') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FIRST' COMMENT 'instance of trigger',
`condition_andor` enum('AND','OR') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Include survey complete AND/OR logic',
`condition_logic` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Logic using field values',
`condition_send_time_option` enum('IMMEDIATELY','TIME_LAG','NEXT_OCCURRENCE','EXACT_TIME') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'When to send invites after condition is met',
`condition_send_time_lag_days` int(4) DEFAULT NULL COMMENT 'Wait X days to send invites after condition is met',
`condition_send_time_lag_hours` int(2) DEFAULT NULL COMMENT 'Wait X hours to send invites after condition is met',
`condition_send_time_lag_minutes` int(2) DEFAULT NULL COMMENT 'Wait X seconds to send invites after condition is met',
`condition_send_time_lag_field` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`condition_send_time_lag_field_after` enum('before','after') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'after',
`condition_send_next_day_type` enum('DAY','WEEKDAY','WEEKENDDAY','SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Wait till specific day/time to send invites after condition is met',
`condition_send_next_time` time DEFAULT NULL COMMENT 'Wait till specific day/time to send invites after condition is met',
`condition_send_time_exact` datetime DEFAULT NULL COMMENT 'Wait till exact date/time to send invites after condition is met',
`delivery_type` enum('EMAIL','VOICE_INITIATE','SMS_INITIATE','SMS_INVITE_MAKE_CALL','SMS_INVITE_RECEIVE_CALL','PARTICIPANT_PREF','SMS_INVITE_WEB') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EMAIL',
`reminder_type` enum('TIME_LAG','NEXT_OCCURRENCE','EXACT_TIME') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'When to send reminders after original invite is sent',
`reminder_timelag_days` int(3) DEFAULT NULL COMMENT 'Wait X days to send reminders',
`reminder_timelag_hours` int(2) DEFAULT NULL COMMENT 'Wait X hours to send reminders',
`reminder_timelag_minutes` int(2) DEFAULT NULL COMMENT 'Wait X seconds to send reminders',
`reminder_nextday_type` enum('DAY','WEEKDAY','WEEKENDDAY','SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Wait till specific day/time to send reminders',
`reminder_nexttime` time DEFAULT NULL COMMENT 'Wait till specific day/time to send reminders',
`reminder_exact_time` datetime DEFAULT NULL COMMENT 'Wait till exact date/time to send reminders',
`reminder_num` int(3) NOT NULL DEFAULT '0' COMMENT 'Reminder recurrence',
`reeval_before_send` int(1) NOT NULL DEFAULT '0',
PRIMARY KEY (`ss_id`),
UNIQUE KEY `survey_event` (`survey_id`,`event_id`),
KEY `condition_surveycomplete_event_id` (`condition_surveycomplete_event_id`),
KEY `condition_surveycomplete_survey_event` (`condition_surveycomplete_survey_id`,`condition_surveycomplete_event_id`),
KEY `event_id` (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_surveys_scheduler_queue` (
`ssq_id` int(10) NOT NULL AUTO_INCREMENT,
`ss_id` int(10) DEFAULT NULL COMMENT 'FK for surveys_scheduler table',
`email_recip_id` int(10) DEFAULT NULL COMMENT 'FK for redcap_surveys_emails_recipients table',
`reminder_num` int(3) NOT NULL DEFAULT '0' COMMENT 'Email reminder instance (0 = original invitation)',
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'NULL if record not created yet',
`instance` smallint(4) NOT NULL DEFAULT '1',
`scheduled_time_to_send` datetime DEFAULT NULL COMMENT 'Time invitation will be sent',
`status` enum('QUEUED','SENDING','SENT','DID NOT SEND','DELETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'QUEUED' COMMENT 'Survey invitation status (default=QUEUED)',
`time_sent` datetime DEFAULT NULL COMMENT 'Actual time invitation was sent',
`reason_not_sent` enum('EMAIL ADDRESS NOT FOUND','PHONE NUMBER NOT FOUND','EMAIL ATTEMPT FAILED','UNKNOWN','SURVEY ALREADY COMPLETED','VOICE/SMS SETTING DISABLED','ERROR SENDING SMS','ERROR MAKING VOICE CALL','LINK HAD ALREADY EXPIRED','PARTICIPANT OPTED OUT') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Explanation of why invitation did not send, if applicable',
PRIMARY KEY (`ssq_id`),
UNIQUE KEY `email_recip_id_record` (`email_recip_id`,`record`,`reminder_num`,`instance`),
UNIQUE KEY `ss_id_record` (`ss_id`,`record`,`reminder_num`,`instance`),
KEY `send_sent_status` (`scheduled_time_to_send`,`time_sent`,`status`),
KEY `status` (`status`),
KEY `time_sent` (`time_sent`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_surveys_scheduler_recurrence` (
`ssr_id` int(10) NOT NULL AUTO_INCREMENT,
`ss_id` int(10) DEFAULT NULL,
`creation_date` datetime DEFAULT NULL,
`record` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`event_id` int(10) DEFAULT NULL,
`instrument` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`times_sent` smallint(4) DEFAULT NULL,
`last_sent` datetime DEFAULT NULL,
`status` enum('IDLE','QUEUED','SENDING') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IDLE',
`first_send_time` datetime DEFAULT NULL,
`next_send_time` datetime DEFAULT NULL,
PRIMARY KEY (`ssr_id`),
UNIQUE KEY `ss_id_record_event_instrument` (`ss_id`,`record`,`event_id`,`instrument`),
KEY `creation_date` (`creation_date`),
KEY `event_record` (`event_id`,`record`),
KEY `first_send_time` (`first_send_time`),
KEY `last_sent` (`last_sent`),
KEY `next_send_time_status_ss_id` (`next_send_time`,`status`,`ss_id`),
KEY `ss_id_status_times_sent` (`status`,`ss_id`,`times_sent`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_surveys_short_codes` (
`ts` datetime DEFAULT NULL,
`participant_id` int(10) DEFAULT NULL,
`code` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
UNIQUE KEY `code` (`code`),
KEY `participant_id_ts` (`participant_id`,`ts`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_surveys_themes` (
`theme_id` int(10) NOT NULL AUTO_INCREMENT,
`theme_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`ui_id` int(10) DEFAULT NULL COMMENT 'NULL = Theme is available to all users',
`theme_text_buttons` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`theme_bg_page` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`theme_text_title` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`theme_bg_title` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`theme_text_sectionheader` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`theme_bg_sectionheader` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`theme_text_question` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`theme_bg_question` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`theme_id`),
KEY `theme_name` (`theme_name`),
KEY `ui_id` (`ui_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_todo_list` (
`request_id` int(11) NOT NULL AUTO_INCREMENT,
`request_from` int(11) DEFAULT NULL,
`request_to` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`todo_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`todo_type_id` int(11) DEFAULT NULL,
`action_url` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`request_time` datetime DEFAULT NULL,
`project_id` int(10) DEFAULT NULL,
`request_completion_time` datetime DEFAULT NULL,
`request_completion_userid` int(11) DEFAULT NULL,
`comment` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`request_id`),
UNIQUE KEY `project_id_todo_type_id` (`project_id`,`todo_type`,`todo_type_id`),
KEY `request_completion_userid` (`request_completion_userid`),
KEY `request_from` (`request_from`),
KEY `request_time` (`request_time`),
KEY `status` (`status`),
KEY `todo_type` (`todo_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_twilio_credentials_temp` (
`tc_id` int(10) NOT NULL AUTO_INCREMENT,
`request_id` int(10) DEFAULT NULL,
`project_id` int(10) DEFAULT NULL,
`twilio_account_sid` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`twilio_auth_token` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`twilio_from_number` bigint(16) DEFAULT NULL,
`twilio_alphanum_sender_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`mosio_api_key` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`tc_id`),
KEY `project_id` (`project_id`),
KEY `request_id` (`request_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_twilio_error_log` (
`error_id` int(10) NOT NULL AUTO_INCREMENT,
`ssq_id` int(10) DEFAULT NULL,
`alert_sent_log_id` int(10) DEFAULT NULL,
`error_message` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`error_id`),
KEY `alert_sent_log_id` (`alert_sent_log_id`),
KEY `ssq_id` (`ssq_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_two_factor_response` (
`tf_id` int(10) NOT NULL AUTO_INCREMENT,
`user_id` int(10) DEFAULT NULL,
`time_sent` datetime DEFAULT NULL,
`phone_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`verified` tinyint(1) NOT NULL DEFAULT '0',
PRIMARY KEY (`tf_id`),
KEY `phone_number` (`phone_number`),
KEY `time_sent` (`time_sent`),
KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_user_allowlist` (
`username` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
PRIMARY KEY (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_user_information` (
`ui_id` int(10) NOT NULL AUTO_INCREMENT,
`username` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`user_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Primary email',
`user_email2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Secondary email',
`user_email3` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tertiary email',
`user_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`user_phone_sms` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`user_firstname` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`user_lastname` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`user_inst_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`super_user` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Can access all projects and their data',
`account_manager` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Can manage user accounts',
`access_system_config` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Can access system configuration pages',
`access_system_upgrade` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Can perform system upgrade',
`access_external_module_install` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Can install, upgrade, and configure external modules',
`admin_rights` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Can set administrator privileges',
`access_admin_dashboards` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Can access admin dashboards',
`user_creation` datetime DEFAULT NULL COMMENT 'Time user account was created',
`user_firstvisit` datetime DEFAULT NULL,
`user_firstactivity` datetime DEFAULT NULL,
`user_lastactivity` datetime DEFAULT NULL,
`user_lastlogin` datetime DEFAULT NULL,
`user_suspended_time` datetime DEFAULT NULL,
`user_expiration` datetime DEFAULT NULL COMMENT 'Time at which the user will be automatically suspended from REDCap',
`user_access_dashboard_view` datetime DEFAULT NULL,
`user_access_dashboard_email_queued` enum('QUEUED','SENDING') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tracks status of email reminder for User Access Dashboard',
`user_sponsor` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Username of user''s sponsor or contact person',
`user_comments` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Miscellaneous comments about user',
`allow_create_db` int(1) NOT NULL DEFAULT '1',
`email_verify_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Primary email verification code',
`email2_verify_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Secondary email verification code',
`email3_verify_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tertiary email verification code',
`datetime_format` enum('M-D-Y_24','M-D-Y_12','M/D/Y_24','M/D/Y_12','M.D.Y_24','M.D.Y_12','D-M-Y_24','D-M-Y_12','D/M/Y_24','D/M/Y_12','D.M.Y_24','D.M.Y_12','Y-M-D_24','Y-M-D_12','Y/M/D_24','Y/M/D_12','Y.M.D_24','Y.M.D_12') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'M/D/Y_12' COMMENT 'User''s preferred datetime viewing format',
`number_format_decimal` enum('.',',') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '.' COMMENT 'User''s preferred decimal format',
`number_format_thousands_sep` enum(',','.','','SPACE','''') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT ',' COMMENT 'User''s preferred thousands separator',
`csv_delimiter` enum(',',';','TAB','SPACE','|','^') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT ',',
`two_factor_auth_secret` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`two_factor_auth_enrolled` tinyint(1) NOT NULL DEFAULT '0',
`display_on_email_users` int(1) NOT NULL DEFAULT '1',
`two_factor_auth_twilio_prompt_phone` tinyint(1) NOT NULL DEFAULT '1',
`two_factor_auth_code_expiration` int(3) NOT NULL DEFAULT '2',
`api_token` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`messaging_email_preference` enum('NONE','2_HOURS','4_HOURS','6_HOURS','8_HOURS','12_HOURS','DAILY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '4_HOURS',
`messaging_email_urgent_all` tinyint(1) NOT NULL DEFAULT '1',
`messaging_email_ts` datetime DEFAULT NULL,
`messaging_email_general_system` tinyint(1) NOT NULL DEFAULT '1',
`messaging_email_queue_time` datetime DEFAULT NULL,
`ui_state` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`api_token_auto_request` tinyint(1) NOT NULL DEFAULT '0',
`fhir_data_mart_create_project` tinyint(1) NOT NULL DEFAULT '0',
PRIMARY KEY (`ui_id`),
UNIQUE KEY `api_token` (`api_token`),
UNIQUE KEY `email2_verify_code` (`email2_verify_code`),
UNIQUE KEY `email3_verify_code` (`email3_verify_code`),
UNIQUE KEY `email_verify_code` (`email_verify_code`),
UNIQUE KEY `username` (`username`),
KEY `messaging_email_queue_time` (`messaging_email_queue_time`),
KEY `two_factor_auth_secret` (`two_factor_auth_secret`),
KEY `user_access_dashboard_email_queued` (`user_access_dashboard_email_queued`),
KEY `user_access_dashboard_view` (`user_access_dashboard_view`),
KEY `user_comments` (`user_comments`(190)),
KEY `user_creation` (`user_creation`),
KEY `user_email` (`user_email`(191)),
KEY `user_expiration` (`user_expiration`),
KEY `user_firstactivity` (`user_firstactivity`),
KEY `user_firstname` (`user_firstname`(191)),
KEY `user_firstvisit` (`user_firstvisit`),
KEY `user_inst_id` (`user_inst_id`(191)),
KEY `user_lastactivity` (`user_lastactivity`),
KEY `user_lastlogin` (`user_lastlogin`),
KEY `user_lastname` (`user_lastname`(191)),
KEY `user_sponsor` (`user_sponsor`(191)),
KEY `user_suspended_time` (`user_suspended_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_user_rights` (
`project_id` int(10) NOT NULL DEFAULT '0',
`username` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
`expiration` date DEFAULT NULL,
`role_id` int(10) DEFAULT NULL,
`group_id` int(10) DEFAULT NULL,
`lock_record` int(1) NOT NULL DEFAULT '0',
`lock_record_multiform` int(1) NOT NULL DEFAULT '0',
`lock_record_customize` int(1) NOT NULL DEFAULT '0',
`data_export_tool` tinyint(1) DEFAULT NULL,
`data_export_instruments` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`data_import_tool` int(1) NOT NULL DEFAULT '1',
`data_comparison_tool` int(1) NOT NULL DEFAULT '1',
`data_logging` int(1) NOT NULL DEFAULT '1',
`email_logging` int(1) NOT NULL DEFAULT '0',
`file_repository` int(1) NOT NULL DEFAULT '1',
`double_data` int(1) NOT NULL DEFAULT '0',
`user_rights` int(1) NOT NULL DEFAULT '1',
`data_access_groups` int(1) NOT NULL DEFAULT '1',
`graphical` int(1) NOT NULL DEFAULT '1',
`reports` int(1) NOT NULL DEFAULT '1',
`design` int(1) NOT NULL DEFAULT '0',
`alerts` int(1) NOT NULL DEFAULT '0',
`calendar` int(1) NOT NULL DEFAULT '1',
`data_entry` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`api_token` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`api_export` int(1) NOT NULL DEFAULT '0',
`api_import` int(1) NOT NULL DEFAULT '0',
`api_modules` int(1) NOT NULL DEFAULT '0',
`mobile_app` int(1) NOT NULL DEFAULT '0',
`mobile_app_download_data` int(1) NOT NULL DEFAULT '0',
`record_create` int(1) NOT NULL DEFAULT '1',
`record_rename` int(1) NOT NULL DEFAULT '0',
`record_delete` int(1) NOT NULL DEFAULT '0',
`dts` int(1) NOT NULL DEFAULT '0' COMMENT 'DTS adjudication page',
`participants` int(1) NOT NULL DEFAULT '1',
`data_quality_design` int(1) NOT NULL DEFAULT '0',
`data_quality_execute` int(1) NOT NULL DEFAULT '0',
`data_quality_resolution` int(1) NOT NULL DEFAULT '0' COMMENT '0=No access, 1=View only, 2=Respond, 3=Open, close, respond, 4=Open only, 5=Open and respond',
`random_setup` int(1) NOT NULL DEFAULT '0',
`random_dashboard` int(1) NOT NULL DEFAULT '0',
`random_perform` int(1) NOT NULL DEFAULT '0',
`realtime_webservice_mapping` int(1) NOT NULL DEFAULT '0' COMMENT 'User can map fields for RTWS',
`realtime_webservice_adjudicate` int(1) NOT NULL DEFAULT '0' COMMENT 'User can adjudicate data for RTWS',
`external_module_config` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`mycap_participants` int(1) NOT NULL DEFAULT '0',
PRIMARY KEY (`project_id`,`username`),
UNIQUE KEY `api_token` (`api_token`),
KEY `group_id` (`group_id`),
KEY `project_id` (`project_id`),
KEY `role_id` (`role_id`),
KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_user_roles` (
`role_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`role_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Name of user role',
`unique_role_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`lock_record` int(1) NOT NULL DEFAULT '0',
`lock_record_multiform` int(1) NOT NULL DEFAULT '0',
`lock_record_customize` int(1) NOT NULL DEFAULT '0',
`data_export_tool` tinyint(1) DEFAULT NULL,
`data_export_instruments` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`data_import_tool` int(1) NOT NULL DEFAULT '1',
`data_comparison_tool` int(1) NOT NULL DEFAULT '1',
`data_logging` int(1) NOT NULL DEFAULT '1',
`email_logging` int(1) NOT NULL DEFAULT '0',
`file_repository` int(1) NOT NULL DEFAULT '1',
`double_data` int(1) NOT NULL DEFAULT '0',
`user_rights` int(1) NOT NULL DEFAULT '1',
`data_access_groups` int(1) NOT NULL DEFAULT '1',
`graphical` int(1) NOT NULL DEFAULT '1',
`reports` int(1) NOT NULL DEFAULT '1',
`design` int(1) NOT NULL DEFAULT '0',
`alerts` int(1) NOT NULL DEFAULT '0',
`calendar` int(1) NOT NULL DEFAULT '1',
`data_entry` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`api_export` int(1) NOT NULL DEFAULT '0',
`api_import` int(1) NOT NULL DEFAULT '0',
`api_modules` int(1) NOT NULL DEFAULT '0',
`mobile_app` int(1) NOT NULL DEFAULT '0',
`mobile_app_download_data` int(1) NOT NULL DEFAULT '0',
`record_create` int(1) NOT NULL DEFAULT '1',
`record_rename` int(1) NOT NULL DEFAULT '0',
`record_delete` int(1) NOT NULL DEFAULT '0',
`dts` int(1) NOT NULL DEFAULT '0' COMMENT 'DTS adjudication page',
`participants` int(1) NOT NULL DEFAULT '1',
`data_quality_design` int(1) NOT NULL DEFAULT '0',
`data_quality_execute` int(1) NOT NULL DEFAULT '0',
`data_quality_resolution` int(1) NOT NULL DEFAULT '0' COMMENT '0=No access, 1=View only, 2=Respond, 3=Open, close, respond',
`random_setup` int(1) NOT NULL DEFAULT '0',
`random_dashboard` int(1) NOT NULL DEFAULT '0',
`random_perform` int(1) NOT NULL DEFAULT '0',
`realtime_webservice_mapping` int(1) NOT NULL DEFAULT '0' COMMENT 'User can map fields for RTWS',
`realtime_webservice_adjudicate` int(1) NOT NULL DEFAULT '0' COMMENT 'User can adjudicate data for RTWS',
`external_module_config` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`mycap_participants` int(1) NOT NULL DEFAULT '0',
PRIMARY KEY (`role_id`),
UNIQUE KEY `project_id_unique_role_name` (`project_id`,`unique_role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_validation_types` (
`validation_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Unique name for Data Dictionary',
`validation_label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Label in Online Designer',
`regex_js` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`regex_php` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`data_type` enum('date','datetime','datetime_seconds','email','integer','mrn','number','number_comma_decimal','phone','postal_code','ssn','text','time','char') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`legacy_value` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`visible` int(1) NOT NULL DEFAULT '1' COMMENT 'Show in Online Designer?',
UNIQUE KEY `validation_name` (`validation_name`),
KEY `data_type` (`data_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redcap_web_service_cache` (
`cache_id` int(10) NOT NULL AUTO_INCREMENT,
`project_id` int(10) DEFAULT NULL,
`service` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`category` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`value` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
`label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
PRIMARY KEY (`cache_id`),
UNIQUE KEY `project_service_cat_value` (`project_id`,`service`,`category`,`value`),
KEY `category` (`category`),
KEY `service_cat_value` (`service`,`category`,`value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `redcap_actions`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`recipient_id`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`survey_id`) REFERENCES `redcap_surveys` (`survey_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_ai_log`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`user_id`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `redcap_alerts`
ADD FOREIGN KEY (`email_attachment1`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`email_attachment2`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`email_attachment3`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`email_attachment4`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`email_attachment5`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`form_name_event`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_alerts_recurrence`
ADD FOREIGN KEY (`alert_id`) REFERENCES `redcap_alerts` (`alert_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_alerts_sent`
ADD FOREIGN KEY (`alert_id`) REFERENCES `redcap_alerts` (`alert_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_alerts_sent_log`
ADD FOREIGN KEY (`alert_sent_id`) REFERENCES `redcap_alerts_sent` (`alert_sent_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_auth`
ADD FOREIGN KEY (`password_question`) REFERENCES `redcap_auth_questions` (`qid`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `redcap_cache`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_cde_field_mapping`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_crons`
ADD FOREIGN KEY (`external_module_id`) REFERENCES `redcap_external_modules` (`external_module_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_crons_datediff`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_crons_history`
ADD FOREIGN KEY (`cron_id`) REFERENCES `redcap_crons` (`cron_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `redcap_custom_queries_folders_items`
ADD FOREIGN KEY (`folder_id`) REFERENCES `redcap_custom_queries_folders` (`folder_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`qid`) REFERENCES `redcap_custom_queries` (`qid`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_data_access_groups`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_data_access_groups_users`
ADD FOREIGN KEY (`group_id`) REFERENCES `redcap_data_access_groups` (`group_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_data_dictionaries`
ADD FOREIGN KEY (`doc_id`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`ui_id`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `redcap_data_import`
ADD FOREIGN KEY (`dag_id`) REFERENCES `redcap_data_access_groups` (`group_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`user_id`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `redcap_data_import_rows`
ADD FOREIGN KEY (`event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`import_id`) REFERENCES `redcap_data_import` (`import_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_data_quality_resolutions`
ADD FOREIGN KEY (`status_id`) REFERENCES `redcap_data_quality_status` (`status_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`upload_doc_id`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`user_id`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `redcap_data_quality_rules`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_data_quality_status`
ADD FOREIGN KEY (`assigned_user_id`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`rule_id`) REFERENCES `redcap_data_quality_rules` (`rule_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_ddp_log_view`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`user_id`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `redcap_ddp_log_view_data`
ADD FOREIGN KEY (`md_id`) REFERENCES `redcap_ddp_records_data` (`md_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`ml_id`) REFERENCES `redcap_ddp_log_view` (`ml_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_ddp_mapping`
ADD FOREIGN KEY (`event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_ddp_preview_fields`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_ddp_records`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_ddp_records_data`
ADD FOREIGN KEY (`map_id`) REFERENCES `redcap_ddp_mapping` (`map_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`mr_id`) REFERENCES `redcap_ddp_records` (`mr_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_descriptive_popups`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_docs`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_docs_attachments`
ADD FOREIGN KEY (`docs_id`) REFERENCES `redcap_docs` (`docs_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_docs_folders`
ADD FOREIGN KEY (`dag_id`) REFERENCES `redcap_data_access_groups` (`group_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`parent_folder_id`) REFERENCES `redcap_docs_folders` (`folder_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`role_id`) REFERENCES `redcap_user_roles` (`role_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_docs_folders_files`
ADD FOREIGN KEY (`docs_id`) REFERENCES `redcap_docs` (`docs_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`folder_id`) REFERENCES `redcap_docs_folders` (`folder_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_docs_share`
ADD FOREIGN KEY (`docs_id`) REFERENCES `redcap_docs` (`docs_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_docs_to_edocs`
ADD FOREIGN KEY (`doc_id`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`docs_id`) REFERENCES `redcap_docs` (`docs_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_econsent`
ADD FOREIGN KEY (`dob_event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`firstname_event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`lastname_event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`survey_id`) REFERENCES `redcap_surveys` (`survey_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_econsent_forms`
ADD FOREIGN KEY (`consent_form_filter_dag_id`) REFERENCES `redcap_data_access_groups` (`group_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`consent_form_pdf_doc_id`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`consent_id`) REFERENCES `redcap_econsent` (`consent_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`uploader`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `redcap_edocs_data_mapping`
ADD FOREIGN KEY (`doc_id`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_edocs_metadata`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `redcap_ehr_access_tokens`
ADD FOREIGN KEY (`ehr_id`) REFERENCES `redcap_ehr_settings` (`ehr_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`token_owner`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_ehr_datamart_revisions`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`request_id`) REFERENCES `redcap_todo_list` (`request_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`user_id`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_ehr_fhir_logs`
ADD FOREIGN KEY (`ehr_id`) REFERENCES `redcap_ehr_settings` (`ehr_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`user_id`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_ehr_import_counts`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_ehr_resource_import_details`
ADD FOREIGN KEY (`ehr_import_count_id`) REFERENCES `redcap_ehr_resource_imports` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_ehr_resource_imports`
ADD FOREIGN KEY (`ehr_id`) REFERENCES `redcap_ehr_settings` (`ehr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_ehr_token_rules`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`user_id`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_ehr_user_map`
ADD FOREIGN KEY (`ehr_id`) REFERENCES `redcap_ehr_settings` (`ehr_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `redcap_ehr_user_projects`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`redcap_userid`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_email_users_messages`
ADD FOREIGN KEY (`sent_by`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_error_log`
ADD FOREIGN KEY (`log_view_id`) REFERENCES `redcap_log_view` (`log_view_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_esignatures`
ADD FOREIGN KEY (`event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_events_arms`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_events_calendar`
ADD FOREIGN KEY (`event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`group_id`) REFERENCES `redcap_data_access_groups` (`group_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_events_calendar_feed`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`userid`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_events_forms`
ADD FOREIGN KEY (`event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_events_metadata`
ADD FOREIGN KEY (`arm_id`) REFERENCES `redcap_events_arms` (`arm_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_events_repeat`
ADD FOREIGN KEY (`event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_external_links`
ADD FOREIGN KEY (`link_to_project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_external_links_dags`
ADD FOREIGN KEY (`ext_id`) REFERENCES `redcap_external_links` (`ext_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`group_id`) REFERENCES `redcap_data_access_groups` (`group_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_external_links_exclude_projects`
ADD FOREIGN KEY (`ext_id`) REFERENCES `redcap_external_links` (`ext_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_external_links_users`
ADD FOREIGN KEY (`ext_id`) REFERENCES `redcap_external_links` (`ext_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_external_module_settings`
ADD FOREIGN KEY (`external_module_id`) REFERENCES `redcap_external_modules` (`external_module_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_external_modules_log_parameters`
ADD FOREIGN KEY (`log_id`) REFERENCES `redcap_external_modules_log` (`log_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_folders`
ADD FOREIGN KEY (`ui_id`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_folders_projects`
ADD FOREIGN KEY (`folder_id`) REFERENCES `redcap_folders` (`folder_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`ui_id`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_form_display_logic_conditions`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_form_display_logic_targets`
ADD FOREIGN KEY (`control_id`) REFERENCES `redcap_form_display_logic_conditions` (`control_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_forms`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_forms_temp`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_instrument_zip`
ADD FOREIGN KEY (`iza_id`) REFERENCES `redcap_instrument_zip_authors` (`iza_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_library_map`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_locking_data`
ADD FOREIGN KEY (`event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_locking_labels`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_locking_records`
ADD FOREIGN KEY (`arm_id`) REFERENCES `redcap_events_arms` (`arm_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_locking_records_pdf_archive`
ADD FOREIGN KEY (`arm_id`) REFERENCES `redcap_events_arms` (`arm_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`doc_id`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_log_view_requests`
ADD FOREIGN KEY (`log_view_id`) REFERENCES `redcap_log_view` (`log_view_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`ui_id`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `redcap_messages`
ADD FOREIGN KEY (`attachment_doc_id`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`author_user_id`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`thread_id`) REFERENCES `redcap_messages_threads` (`thread_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_messages_recipients`
ADD FOREIGN KEY (`recipient_user_id`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`thread_id`) REFERENCES `redcap_messages_threads` (`thread_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_messages_status`
ADD FOREIGN KEY (`message_id`) REFERENCES `redcap_messages` (`message_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`recipient_id`) REFERENCES `redcap_messages_recipients` (`recipient_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`recipient_user_id`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_messages_threads`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `redcap_metadata`
ADD FOREIGN KEY (`edoc_id`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_metadata_archive`
ADD FOREIGN KEY (`edoc_id`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`pr_id`) REFERENCES `redcap_metadata_prod_revisions` (`pr_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_metadata_prod_revisions`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`ui_id_approver`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`ui_id_requester`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `redcap_metadata_temp`
ADD FOREIGN KEY (`edoc_id`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_mobile_app_devices`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_mobile_app_files`
ADD FOREIGN KEY (`device_id`) REFERENCES `redcap_mobile_app_devices` (`device_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`doc_id`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`user_id`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `redcap_mobile_app_log`
ADD FOREIGN KEY (`device_id`) REFERENCES `redcap_mobile_app_devices` (`device_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`ui_id`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `redcap_multilanguage_config`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_multilanguage_config_temp`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_multilanguage_metadata`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_multilanguage_metadata_temp`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_multilanguage_snapshots`
ADD FOREIGN KEY (`created_by`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`deleted_by`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`edoc_id`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_multilanguage_ui`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_multilanguage_ui_temp`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_mycap_aboutpages`
ADD FOREIGN KEY (`dag_id`) REFERENCES `redcap_data_access_groups` (`group_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_mycap_contacts`
ADD FOREIGN KEY (`dag_id`) REFERENCES `redcap_data_access_groups` (`group_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_mycap_links`
ADD FOREIGN KEY (`dag_id`) REFERENCES `redcap_data_access_groups` (`group_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_mycap_message_notifications`
ADD FOREIGN KEY (`dag_id`) REFERENCES `redcap_data_access_groups` (`group_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_mycap_messages`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_mycap_participants`
ADD FOREIGN KEY (`event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_mycap_projectfiles`
ADD FOREIGN KEY (`doc_id`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_code`) REFERENCES `redcap_mycap_projects` (`code`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_mycap_projects`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_mycap_syncissuefiles`
ADD FOREIGN KEY (`doc_id`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`uuid`) REFERENCES `redcap_mycap_syncissues` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_mycap_syncissues`
ADD FOREIGN KEY (`event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_mycap_tasks`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_mycap_tasks_schedules`
ADD FOREIGN KEY (`event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`task_id`) REFERENCES `redcap_mycap_tasks` (`task_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_mycap_themes`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_new_record_cache`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_outgoing_email_sms_identifiers`
ADD FOREIGN KEY (`ssq_id`) REFERENCES `redcap_surveys_scheduler_queue` (`ssq_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_outgoing_email_sms_log`
ADD FOREIGN KEY (`event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_pdf_image_cache`
ADD FOREIGN KEY (`image_doc_id`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`pdf_doc_id`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_pdf_snapshots`
ADD FOREIGN KEY (`consent_id`) REFERENCES `redcap_econsent` (`consent_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`pdf_save_to_event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`trigger_surveycomplete_event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`trigger_surveycomplete_survey_id`) REFERENCES `redcap_surveys` (`survey_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_pdf_snapshots_triggered`
ADD FOREIGN KEY (`snapshot_id`) REFERENCES `redcap_pdf_snapshots` (`snapshot_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_project_checklist`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_project_dashboards`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_project_dashboards_access_dags`
ADD FOREIGN KEY (`dash_id`) REFERENCES `redcap_project_dashboards` (`dash_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`group_id`) REFERENCES `redcap_data_access_groups` (`group_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_project_dashboards_access_roles`
ADD FOREIGN KEY (`dash_id`) REFERENCES `redcap_project_dashboards` (`dash_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`role_id`) REFERENCES `redcap_user_roles` (`role_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_project_dashboards_access_users`
ADD FOREIGN KEY (`dash_id`) REFERENCES `redcap_project_dashboards` (`dash_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_project_dashboards_folders`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_project_dashboards_folders_items`
ADD FOREIGN KEY (`dash_id`) REFERENCES `redcap_project_dashboards` (`dash_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`folder_id`) REFERENCES `redcap_project_dashboards_folders` (`folder_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_projects`
ADD FOREIGN KEY (`created_by`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`ehr_id`) REFERENCES `redcap_ehr_settings` (`ehr_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`protected_email_mode_logo`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`survey_auth_event_id1`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`survey_auth_event_id2`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`survey_auth_event_id3`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`template_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `redcap_projects_templates`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_projects_user_hidden`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`ui_id`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_pub_articles`
ADD FOREIGN KEY (`pubsrc_id`) REFERENCES `redcap_pub_sources` (`pubsrc_id`);

ALTER TABLE `redcap_pub_authors`
ADD FOREIGN KEY (`article_id`) REFERENCES `redcap_pub_articles` (`article_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_pub_matches`
ADD FOREIGN KEY (`article_id`) REFERENCES `redcap_pub_articles` (`article_id`) ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON UPDATE CASCADE;

ALTER TABLE `redcap_pub_mesh_terms`
ADD FOREIGN KEY (`article_id`) REFERENCES `redcap_pub_articles` (`article_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_randomization`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`source_event1`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`source_event10`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`source_event11`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`source_event12`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`source_event13`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`source_event14`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`source_event15`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`source_event2`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`source_event3`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`source_event4`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`source_event5`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`source_event6`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`source_event7`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`source_event8`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`source_event9`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`target_event`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`trigger_event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `redcap_randomization_allocation`
ADD FOREIGN KEY (`group_id`) REFERENCES `redcap_data_access_groups` (`group_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`rid`) REFERENCES `redcap_randomization` (`rid`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_record_background_delete`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`user_id`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_record_background_delete_items`
ADD FOREIGN KEY (`arm_id`) REFERENCES `redcap_events_arms` (`arm_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`delete_id`) REFERENCES `redcap_record_background_delete` (`delete_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_record_counts`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_record_dashboards`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`sort_event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_record_list`
ADD FOREIGN KEY (`dag_id`) REFERENCES `redcap_data_access_groups` (`group_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_reports`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_reports_access_dags`
ADD FOREIGN KEY (`group_id`) REFERENCES `redcap_data_access_groups` (`group_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`report_id`) REFERENCES `redcap_reports` (`report_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_reports_access_roles`
ADD FOREIGN KEY (`report_id`) REFERENCES `redcap_reports` (`report_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`role_id`) REFERENCES `redcap_user_roles` (`role_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_reports_access_users`
ADD FOREIGN KEY (`report_id`) REFERENCES `redcap_reports` (`report_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_reports_ai_prompts`
ADD FOREIGN KEY (`report_id`) REFERENCES `redcap_reports` (`report_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_reports_edit_access_dags`
ADD FOREIGN KEY (`group_id`) REFERENCES `redcap_data_access_groups` (`group_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`report_id`) REFERENCES `redcap_reports` (`report_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_reports_edit_access_roles`
ADD FOREIGN KEY (`report_id`) REFERENCES `redcap_reports` (`report_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`role_id`) REFERENCES `redcap_user_roles` (`role_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_reports_edit_access_users`
ADD FOREIGN KEY (`report_id`) REFERENCES `redcap_reports` (`report_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_reports_fields`
ADD FOREIGN KEY (`limiter_event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`report_id`) REFERENCES `redcap_reports` (`report_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_reports_filter_dags`
ADD FOREIGN KEY (`group_id`) REFERENCES `redcap_data_access_groups` (`group_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`report_id`) REFERENCES `redcap_reports` (`report_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_reports_filter_events`
ADD FOREIGN KEY (`event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`report_id`) REFERENCES `redcap_reports` (`report_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_reports_folders`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_reports_folders_items`
ADD FOREIGN KEY (`folder_id`) REFERENCES `redcap_reports_folders` (`folder_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`report_id`) REFERENCES `redcap_reports` (`report_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_rewards_access_token`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`provider_id`) REFERENCES `redcap_rewards_providers` (`provider_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_rewards_actions`
ADD FOREIGN KEY (`order_id`) REFERENCES `redcap_rewards_orders` (`order_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`performed_by`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `redcap_rewards_emails`
ADD FOREIGN KEY (`sent_by`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE `redcap_rewards_logs`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `redcap_rewards_orders`
ADD FOREIGN KEY (`created_by`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`reward_option_id`) REFERENCES `redcap_rewards_reward_option` (`reward_option_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `redcap_rewards_project_providers`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`provider_id`) REFERENCES `redcap_rewards_providers` (`provider_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_rewards_project_settings`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_rewards_reward_option`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`);

ALTER TABLE `redcap_rewards_settings`
ADD FOREIGN KEY (`provider_id`) REFERENCES `redcap_rewards_providers` (`provider_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_rewards_user_permissions`
ADD FOREIGN KEY (`permission_id`) REFERENCES `redcap_rewards_permissions` (`id`) ON DELETE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`user_id`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_sendit_recipients`
ADD FOREIGN KEY (`document_id`) REFERENCES `redcap_sendit_docs` (`document_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_surveys`
ADD FOREIGN KEY (`confirmation_email_attachment`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`logo`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`pdf_econsent_dob_event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`pdf_econsent_firstname_event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`pdf_econsent_lastname_event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`pdf_save_to_event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`theme`) REFERENCES `redcap_surveys_themes` (`theme_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `redcap_surveys_emails`
ADD FOREIGN KEY (`email_sender`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE SET NULL ON UPDATE SET NULL,
ADD FOREIGN KEY (`survey_id`) REFERENCES `redcap_surveys` (`survey_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_surveys_emails_recipients`
ADD FOREIGN KEY (`email_id`) REFERENCES `redcap_surveys_emails` (`email_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`participant_id`) REFERENCES `redcap_surveys_participants` (`participant_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_surveys_erase_twilio_log`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_surveys_login`
ADD FOREIGN KEY (`response_id`) REFERENCES `redcap_surveys_response` (`response_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_surveys_participants`
ADD FOREIGN KEY (`event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`survey_id`) REFERENCES `redcap_surveys` (`survey_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_surveys_pdf_archive`
ADD FOREIGN KEY (`consent_form_id`) REFERENCES `redcap_econsent_forms` (`consent_form_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`consent_id`) REFERENCES `redcap_econsent` (`consent_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`doc_id`) REFERENCES `redcap_edocs_metadata` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`snapshot_id`) REFERENCES `redcap_pdf_snapshots` (`snapshot_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`survey_id`) REFERENCES `redcap_surveys` (`survey_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_surveys_phone_codes`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_surveys_queue`
ADD FOREIGN KEY (`condition_surveycomplete_event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`condition_surveycomplete_survey_id`) REFERENCES `redcap_surveys` (`survey_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`survey_id`) REFERENCES `redcap_surveys` (`survey_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_surveys_queue_hashes`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_surveys_response`
ADD FOREIGN KEY (`participant_id`) REFERENCES `redcap_surveys_participants` (`participant_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_surveys_scheduler`
ADD FOREIGN KEY (`condition_surveycomplete_event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`condition_surveycomplete_survey_id`) REFERENCES `redcap_surveys` (`survey_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`survey_id`) REFERENCES `redcap_surveys` (`survey_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_surveys_scheduler_queue`
ADD FOREIGN KEY (`email_recip_id`) REFERENCES `redcap_surveys_emails_recipients` (`email_recip_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`ss_id`) REFERENCES `redcap_surveys_scheduler` (`ss_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `redcap_surveys_scheduler_recurrence`
ADD FOREIGN KEY (`event_id`) REFERENCES `redcap_events_metadata` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`ss_id`) REFERENCES `redcap_surveys_scheduler` (`ss_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_surveys_short_codes`
ADD FOREIGN KEY (`participant_id`) REFERENCES `redcap_surveys_participants` (`participant_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_surveys_themes`
ADD FOREIGN KEY (`ui_id`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_todo_list`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`request_completion_userid`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE SET NULL,
ADD FOREIGN KEY (`request_from`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `redcap_twilio_credentials_temp`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`request_id`) REFERENCES `redcap_todo_list` (`request_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_twilio_error_log`
ADD FOREIGN KEY (`alert_sent_log_id`) REFERENCES `redcap_alerts_sent_log` (`alert_sent_log_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`ssq_id`) REFERENCES `redcap_surveys_scheduler_queue` (`ssq_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_two_factor_response`
ADD FOREIGN KEY (`user_id`) REFERENCES `redcap_user_information` (`ui_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_user_rights`
ADD FOREIGN KEY (`group_id`) REFERENCES `redcap_data_access_groups` (`group_id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY (`role_id`) REFERENCES `redcap_user_roles` (`role_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `redcap_user_roles`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `redcap_web_service_cache`
ADD FOREIGN KEY (`project_id`) REFERENCES `redcap_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;