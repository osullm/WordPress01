<?php
/**
 * Singleton class
 *
 * @since 2.4.9
 *
 */
class SgRegistry {

	private static $instance = null;
	private $currentPopupsId = array();

	protected function __construct() {

	}

	protected function __clone() {

	}

	public static function getInstance() {

		if (!isset(self::$instance)) {
			self::$instance = new SgRegistry();
		}
		return self::$instance;
	}

	public function setCurrentPopupId($popupId) {

		array_push($this->currentPopupsId, $popupId);
	}

	public function getCurrentPopupsId() {

		return $this->currentPopupsId;
	}
}