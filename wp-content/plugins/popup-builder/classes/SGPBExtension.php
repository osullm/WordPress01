<?php
abstract class SGPBExtension {

	const SGPB_ADDON_TABLE_NAME = 'sg_popup_addons';
	const SGPB_ADDON_POPUP_CONNECTION_TABLE_NAME = 'sg_popup_addons_connection';

	private $params = array();
	private $popupId;
	private $extensionContent;
	private $extensionOptions;
	private $postData;

	/**
	 * Php magic call method using for setter and getter
	 *
	 * @since 1.0.0
	 *
	 * @param $name setter or getter name
	 * @param  array $args setter params
	 *
	 * @return void
	 *
	 */
	public function __call($name, $args) {

		$methodPrefix = substr($name, 0, 3);
		$methodProperty = lcfirst(substr($name,3));

		if ($methodPrefix=='get') {
			return $this->$methodProperty;
		}
		else if ($methodPrefix=='set') {
			$this->$methodProperty = $args[0];
		}
	}

	/**
	 * Create Extension tables
	 *
	 * @since 2.4.6
	 *
	 * @param int $blogsId
	 *
	 * @return void
	 *
	 */
	public static function createExtensionTables($blogsId) {

		global $wpdb;

		$sgPopupAddon = "CREATE TABLE IF NOT EXISTS ". $wpdb->prefix.$blogsId.SGPBExtension::SGPB_ADDON_TABLE_NAME." (
			`id` int(11) NOT NULL AUTO_INCREMENT,
			`name` varchar(255) NOT NULL UNIQUE,
			`paths` TEXT NOT NULL,
			`type` varchar(255) NOT NULL,
			`options` TEXT NOT NULL,
			`isEvent` TINYINT UNSIGNED NOT NULL,
			PRIMARY KEY (id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8; ";

		$extensionDataTable = "CREATE TABLE IF NOT EXISTS ". $wpdb->prefix.$blogsId.SGPBExtension::SGPB_ADDON_POPUP_CONNECTION_TABLE_NAME." (
			`id` int(11) NOT NULL AUTO_INCREMENT,
			`popupId` int(11) NOT NULL,
			`extensionKey` TEXT NOT NULL,
			`content` TEXT NOT NULL,
			`extensionType` varchar(255) NOT NULL,
			`options` TEXT NOT NULL,
			PRIMARY KEY (id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8; ";

		$columInfo = $wpdb->query("SHOW COLUMNS FROM ".$wpdb->prefix.$blogsId.SGPBExtension::SGPB_ADDON_TABLE_NAME." LIKE 'isEvent'");

		if(!$columInfo) {
			$alterQuery = "ALTER TABLE ".$wpdb->prefix.$blogsId.SGPBExtension::SGPB_ADDON_TABLE_NAME." ADD isEvent TINYINT UNSIGNED NOT NULL";
			$wpdb->query($alterQuery);
		}

		$wpdb->query($sgPopupAddon);
		$wpdb->query($extensionDataTable);
	}

	/**
	 * Popup extensions Saved option
	 *
	 * @since 2.4.6
	 *
	 * @param int $popupId
	 * @param string $extensionKey
	 *
	 * @return bool if does not exists data and Object when have saved data
	 *
	 */
	public static function getSavedOptions($popupId, $extensionKey) {

		global $wpdb;

		$prepareSql = $wpdb->prepare("SELECT options FROM ".$wpdb->prefix.SGPBExtension::SGPB_ADDON_POPUP_CONNECTION_TABLE_NAME." WHERE popupId = %d AND extensionKey = %s", $popupId, $extensionKey);
		$savedData = $wpdb->get_results($prepareSql, OBJECT);

		/*When does not have saved data*/
		if(empty($savedData)) {
			return false;
		}

		return $savedData;
	}

	/**
	 * Exists extension options
	 *
	 * @since 2.4.6
	 *
	 * @param int $popupId
	 * @param string $extensionKey
	 *
	 * @return bool if doens not exists data and Object when have saved data
	 *
	 */
	private function isExistOptionData($popupId, $extensionKey) {

		global $wpdb;

		$prepareSql = $wpdb->prepare("SELECT COUNT(*) as count FROM ".$wpdb->prefix.SGPBExtension::SGPB_ADDON_POPUP_CONNECTION_TABLE_NAME." WHERE popupId = %d AND extensionKey=%s", $popupId, $extensionKey);
		$arr = $wpdb->get_row($prepareSql, ARRAY_A);

		return $arr['count'];
	}

	public function save() {

		$popupId = $this->getPopupId();
		$popupContent = $this->getExtensionContent();
		$extensionOptions = $this->getExtensionOptions();
		if(!isset($extensionOptions)) {
			$extensionOptions = '';
		}
		$extensionOptions = @json_encode($extensionOptions, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE);
		$extensionConnectionTable = SGPBExtension::SGPB_ADDON_POPUP_CONNECTION_TABLE_NAME;
		$extensionKey = static::SGPB_EXTENSION_KEY;
		$extensionType = static::SGPB_EXTENSION_TYPE;
		$saveMode = $this->isExistOptionData($popupId, $extensionKey);

		global $wpdb;

		if($saveMode == 0) {
			$data = array(
				'popupId'=> $popupId,
				'extensionKey'=> $extensionKey,
				'content'=> $popupContent,
				'extensionType'=> $extensionType,
				'options'=> $extensionOptions
			);
			$formats = array('%d', '%s', '%s', '%s', '%s');
			$wpdb->insert($wpdb->prefix.$extensionConnectionTable, $data, $formats);

		}
		else {
			$data = array(
				'content'=> $popupContent,
				'options'=> $extensionOptions
			);
			$formats = array('%s', '%s');
			$whereFormat = array('%d', '%s');
			$where = array(
				'popupId'=> $popupId,
				'extensionKey'=> $extensionKey
			);

			$wpdb->update($wpdb->prefix.$extensionConnectionTable, $data, $where, $formats, $whereFormat);
		}

		return $data;
	}

	public function deleteOption() {

		global $wpdb;

		$popupId = $this->getPopupId();
		$extensionConnectionTable = SGPBExtension::SGPB_ADDON_POPUP_CONNECTION_TABLE_NAME;
		$extensionKey = static::SGPB_EXTENSION_KEY;

		$deleteCondition = array('popupId' => $popupId, 'extensionKey' => $extensionKey);

		$wpdb->delete($wpdb->prefix.$extensionConnectionTable, $deleteCondition, array('%d', '%s'));
	}

	public static function deletePopupFromConnectionById($popupId) {

		global $wpdb;

		$extensionConnectionTable = SGPBExtension::SGPB_ADDON_POPUP_CONNECTION_TABLE_NAME;
		$deleteCondition = array('popupId' => $popupId);
		$wpdb->delete($wpdb->prefix.$extensionConnectionTable, $deleteCondition, array('%d'));
	}

	public static function getExtensionsOptions($popupId, $type = 'option') {

		global $wpdb;
		$extensionData = array();

		$prepareSql = $wpdb->prepare("SELECT extensionKey, options FROM ".$wpdb->prefix.SGPBExtension::SGPB_ADDON_POPUP_CONNECTION_TABLE_NAME." WHERE popupId = %d AND extensionType=%s", $popupId, $type);
		$extensionOptions = $wpdb->get_results($prepareSql, ARRAY_A);

		if(empty($extensionOptions)) {
			return $extensionData;
		}

		foreach($extensionOptions as $extension) {
			$extensionData[$extension['extensionKey']] = json_decode($extension['options'], true);
		}

		return $extensionData;
	}

	public static function getPopupSavedExtensionsKeys($popupId) {

		global $wpdb;

		$prepareSql = $wpdb->prepare("SELECT extensionKey, paths FROM ".$wpdb->prefix."sg_popup_addons LEFT JOIN ".$wpdb->prefix.SGPBExtension::SGPB_ADDON_POPUP_CONNECTION_TABLE_NAME ." ON extensionKey = name  and popupId = %d", $popupId);
		$extensionOptions = $wpdb->get_results($prepareSql, ARRAY_A);

		return $extensionOptions;
	}

	public static function hasPopupEvent($popupId) {

		global $wpdb;

		$prepareSql = $wpdb->prepare("SELECT count(id) as count FROM ".$wpdb->prefix.static::SGPB_ADDON_TABLE_NAME ." WHERE isEvent = 1 AND name in (SELECT extensionKey FROM ".$wpdb->prefix.SGPBExtension::SGPB_ADDON_POPUP_CONNECTION_TABLE_NAME." where popupId = %d)", $popupId);
		$countEvents = $wpdb->get_row($prepareSql, ARRAY_A);
		$count = $countEvents['count'];

		return $count;
	}

}
