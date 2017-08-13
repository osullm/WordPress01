<?php
class PopupInstaller {

	public static $mainTableName = "sg_popup";

	public static function createTables($blogId = '') {

		global $wpdb;
		update_option('SG_POPUP_VERSION', SG_POPUP_VERSION);
		$sgPopupBase = "CREATE TABLE IF NOT EXISTS ". $wpdb->prefix.$blogId."sg_popup (
			`id` int(11) NOT NULL AUTO_INCREMENT,
			`type` varchar(255) NOT NULL,
			`title` varchar(255) NOT NULL,
			`options` LONGTEXT NOT NULL,
			PRIMARY KEY (id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8; ";
		$sgPopupSettingsBase = "CREATE TABLE IF NOT EXISTS ". $wpdb->prefix.$blogId."sg_popup_settings (
			`id` int(11) NOT NULL AUTO_INCREMENT,
			`options` LONGTEXT NOT NULL,
			PRIMARY KEY (id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8; ";
		$optionsDefault = SgPopupGetData::getDefaultValues();
		$sgPopupInsertSettingsSql = $wpdb->prepare("INSERT IGNORE ". $wpdb->prefix.$blogId."sg_popup_settings (id, options) VALUES(%d,%s) ", 1, json_encode($optionsDefault['settingsParams']));

		$sgPopupImageBase = "CREATE TABLE IF NOT EXISTS ". $wpdb->prefix.$blogId."sg_image_popup (
				`id` int(11) NOT NULL,
				`url` varchar(255) NOT NULL
		) ENGINE=InnoDB DEFAULT CHARSET=utf8; ";
		$sgPopupHtmlBase = "CREATE TABLE IF NOT EXISTS ". $wpdb->prefix.$blogId."sg_html_popup (
				`id` int(11) NOT NULL,
				`content` text NOT NULL
		) ENGINE=InnoDB DEFAULT CHARSET=utf8;";
		$sgPopupFblikeBase = "CREATE TABLE IF NOT EXISTS ". $wpdb->prefix.$blogId."sg_fblike_popup (
				`id` int(11) NOT NULL,
				`content` text NOT NULL,
				`options` text NOT NULL
		) ENGINE=InnoDB DEFAULT CHARSET=utf8;";
		$sgPopupShortcodeBase =  "CREATE TABLE IF NOT EXISTS ". $wpdb->prefix.$blogId."sg_shortCode_popup (
				`id` int(12) NOT NULL,
				`url` text NOT NULL
		) ENGINE=InnoDB DEFAULT CHARSET=utf8;";

		$sgPopupAddon = "CREATE TABLE IF NOT EXISTS ". $wpdb->prefix.$blogId."sg_popup_addons (
			`id` int(11) NOT NULL AUTO_INCREMENT,
			`name` varchar(255) NOT NULL UNIQUE,
			`paths` TEXT NOT NULL,
			`type` varchar(255) NOT NULL,
			`options` TEXT NOT NULL,
			`isEvent` TINYINT UNSIGNED NOT NULL,
			PRIMARY KEY (id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8; ";

		$addonsConnectionTable = "CREATE TABLE IF NOT EXISTS ". $wpdb->prefix.$blogId."sg_popup_addons_connection (
			`id` int(11) NOT NULL AUTO_INCREMENT,
			`popupId` int(11) NOT NULL,
			`extensionKey` TEXT NOT NULL,
			`content` TEXT NOT NULL,
			`extensionType` varchar(255) NOT NULL,
			`options` TEXT NOT NULL,
			PRIMARY KEY (id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8; ";

		$wpdb->query($sgPopupBase);
		$wpdb->query($sgPopupSettingsBase);
		$wpdb->query($sgPopupInsertSettingsSql);
		$wpdb->query($sgPopupImageBase);
		$wpdb->query($sgPopupHtmlBase);
		$wpdb->query($sgPopupFblikeBase);
		$wpdb->query($sgPopupShortcodeBase);
		$wpdb->query($sgPopupAddon);
		$wpdb->query($addonsConnectionTable);

		$columnInfo = $wpdb->query("SHOW COLUMNS FROM ".$wpdb->prefix.$blogId.SGPBExtension::SGPB_ADDON_TABLE_NAME." LIKE 'isEvent'");
		if(!$columnInfo) {
			$alterQuery = "ALTER TABLE ".$wpdb->prefix.$blogId.SGPBExtension::SGPB_ADDON_TABLE_NAME." ADD isEvent TINYINT UNSIGNED NOT NULL";
			$wpdb->query($alterQuery);
		}
	}

	public static function install() {

		self::createTables();

		/*get_current_blog_id() == 1 When plugin activated inside the child of multisite instance*/
		if(is_multisite() && get_current_blog_id() == 1) {
			global $wp_version;

			if($wp_version > '4.6.0') {
				$sites = get_sites();
			}
			else {
				$sites = wp_get_sites();
			}

			foreach($sites as $site) {

				if($wp_version > '4.6.0') {
					$blogId = $site->blog_id."_";
				}
				else {
					$blogId = $site['blog_id']."_";
				}
				if($blogId != 1) {
					self::createTables($blogId);
				}
			}
		}
	}

	public static function uninstallTables($blogId = '') {

		global $wpdb;
		$delete = "DELETE FROM ".$wpdb->prefix.$blogId."postmeta WHERE meta_key = 'sg_promotional_popup' ";
		$wpdb->query($delete);

		$popupTable = $wpdb->prefix.$blogId."sg_popup";
		$popupSql = "DROP TABLE ". $popupTable;

		$popupImageTable = $wpdb->prefix.$blogId."sg_image_popup";
		$popupImageSql = "DROP TABLE ". $popupImageTable;

		$popupHtmlTable = $wpdb->prefix.$blogId."sg_html_popup";
		$popupHtmlSql = "DROP TABLE ". $popupHtmlTable;

		$popupFblikeTable = $wpdb->prefix.$blogId."sg_fblike_popup";
		$popupFblikeSql = "DROP TABLE ". $popupFblikeTable;

		$popupShortcodeTable = $wpdb->prefix.$blogId."sg_shortCode_popup";
		$popupShortcodeSql = "DROP TABLE ". $popupShortcodeTable;

		$popupAddonDrop = $wpdb->prefix.$blogId."sg_popup_addons";
		$popupAddonSql = "DROP TABLE ". $popupAddonDrop;

		$popupSettingsDrop = $wpdb->prefix.$blogId."sg_popup_settings";
		$popupSettingsSql = "DROP TABLE ". $popupSettingsDrop;

		$addonsConnectionTableName = $wpdb->prefix.$blogId."sg_popup_addons_connection";
		$deleteAddonsConnectionTable = "DROP TABLE ". $addonsConnectionTableName;

		$wpdb->query($popupSql);
		$wpdb->query($popupImageSql);
		$wpdb->query($popupHtmlSql);
		$wpdb->query($popupFblikeSql);
		$wpdb->query($popupShortcodeSql);
		$wpdb->query($popupAddonSql);
		$wpdb->query($popupSettingsSql);
		$wpdb->query($deleteAddonsConnectionTable);
	}

	public static function deleteSgPopupOptions($blogId = '') {

		global $wpdb;
		$deleteSG = "DELETE FROM ".$wpdb->prefix.$blogId."options WHERE option_name LIKE '%SG_POPUP%'";
		$wpdb->query($deleteSG);
	}

	public static function uninstall() {

		$obj = new self();
		self::uninstallTables();
		$obj->deleteSgPopupOptions();

		if(is_multisite()) {
			global $wp_version;
			if($wp_version > '4.6.0') {
				$sites = get_sites();
			}
			else {
				$sites = wp_get_sites();
			}

			foreach($sites as $site) {

				if($wp_version > '4.6.0') {
					$blogId = $site->blog_id."_";
				}
				else {
					$blogId = $site['blog_id']."_";
				}

				self::uninstallTables($blogId);
				$obj->deleteSgPopupOptions($blogId);
			}
		}
	}
}