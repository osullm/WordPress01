<?php
class SGPBExtensionManager {

	private $managerParams = array();
	private $extensionKey;
	private $postData;
	private $savedOptions;
	private $optionsDefaultValues;

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

	public function save() {

		$this->extensionsSave();
	}

	public function sgBoolToChecked($var) {
		return ($var?'checked':'');
	}

	public function getExtensionsData($type = '') {

		global $wpdb;
		$paths = array();
		$where = '';

		if($type != '') {
			$where = ' WHERE type="'.$type.'"';
		}

		$prepareSql = "SELECT * FROM ". $wpdb->prefix .SGPBExtension::SGPB_ADDON_TABLE_NAME.$where;
		$results = $wpdb->get_results($prepareSql, ARRAY_A);

		if(empty($results)) {
			return $paths;
		}

		foreach ($results as $key => $value) {

			$extensionPaths = json_decode($value['paths'], true);

			if(!$extensionPaths) {
				$extensionPaths = array();
			}

			$paths[$value['name']] = $extensionPaths;
		}

		return $paths;
	}

	public function getExtensionClassName() {

		$extensionKey = $this->getExtensionKey();
		$extensionClass = "SGPB".ucfirst($extensionKey)."Extension";

		return $extensionClass;
	}

	public function optionsInclude($popupType) {

		$options = $this->getExtensionsData('option');
		$extensionOptions = '';

		foreach($options as $extensionKey => $optionData) {

			$this->setExtensionKey($extensionKey);
			$extensionClass = $this->getExtensionClassName();
			if(!file_exists($optionData['app-path'].'/classes/'.$extensionClass.'.php')) {
				continue;
			}
			require_once($optionData['app-path'].'/classes/'.$extensionClass.'.php');
			$extensionObj = new $extensionClass();
			$content = $extensionObj->includeOption($popupType);
			$extensionOptions .= $content;

		}

		return $extensionOptions;
	}

	public function extensionsSave() {

		$extensionsData = $this->getExtensionsData();
		$postData = $this->getPostData();

		foreach($extensionsData as $extensionKey => $extensionData) {

			$this->setExtensionKey($extensionKey);
			$extensionClass = $this->getExtensionClassName();
			if(!file_exists($extensionData['app-path'] . '/classes/' . $extensionClass . '.php')) {
				continue;
			}
			require_once($extensionData['app-path'].'/classes/'.$extensionClass.'.php');
			$extensionObj = new $extensionClass();
			$extensionObj->setPostData($postData);
			$extensionObj->save();

		}
	}

	public function setupOptionsDefaultValues() {

		$options = $this->getExtensionsData('option');
		$allOptions = array();

		foreach($options as $extensionKey => $optionData) {

			$this->setExtensionKey($extensionKey);
			$extensionClass = $this->getExtensionClassName();
			if(!file_exists($optionData['app-path'].'/classes/'.$extensionClass.'.php')) {
				continue;
			}
			require_once($optionData['app-path'].'/classes/'.$extensionClass.'.php');
			$extensionObj = new $extensionClass();
			$defaults = $extensionObj->getDefaultValues();
			$allOptions = array_merge($allOptions, $defaults);

		}

		$this->setOptionsDefaultValues($allOptions);
	}

	public function setExtensionData($popupId, $extensionKey) {

		$savedOptionsData = array();
		if(isset($popupId)) {
			$savedOptions = SGPBExtension::getSavedOptions($popupId, $extensionKey);

			if($savedOptions) {
				foreach($savedOptions as $key => $optionData) {

					$options = json_decode($optionData->options, true);
					$savedOptionsData = $options;
				}
			}
		}

		$this->setupOptionsDefaultValues();
		$this->setSavedOptions($savedOptionsData);
	}

	public function getOptionValue($optionKey, $isBool = false) {

		$savedOptions = $this->getSavedOptions();

		$defaultOptions = $this->getOptionsDefaultValues();

		if (isset($savedOptions[$optionKey])) {
			$elementValue = $savedOptions[$optionKey];
		}
		else if(!empty($savedOptions) && $isBool) {
			/*for checkbox elements when they does not exist in the saved data*/
			$elementValue = '';
		}
		else {
			$elementValue =  $defaultOptions[$optionKey];
		}

		if($isBool) {
			$elementValue = $this->sgBoolToChecked($elementValue);
		}

		return $elementValue;
	}

	public function includeExtensionScripts($popupId) {

		$extensionKeys = SGPBExtension::getPopupSavedExtensionsKeys($popupId);

		foreach($extensionKeys as $extensionOptios) {

			$paths = json_decode($extensionOptios['paths'], true);
			$extensionKey = $extensionOptios['extensionKey'];
			if(!isset($extensionKey)) {
				continue;
			}
			$this->setExtensionKey($extensionKey);
			$extensionClass = $this->getExtensionClassName();

			if(!class_exists($extensionClass)) {
				if(!file_exists($paths['app-path'].'/classes/'.$extensionClass.'.php')) {
					continue;
				}
				require_once($paths['app-path'].'/classes/'.$extensionClass.'.php');
			}
			$extensionObj = new $extensionClass();
			$extensionObj->includeScripts($popupId);

		}
	}

	public function deletePopupFromConnection($popupId) {

		SGPBExtension::deletePopupFromConnectionById($popupId);
	}

}