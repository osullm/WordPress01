<?php
class HelperFunctions {

	private function checkPhpVersion() {

		if (version_compare(PHP_VERSION, SG_POPUP_MINIMUM_PHP_VERSION, '<')) {
			wp_die('Popup Builder plugin requires PHP version >= '.SG_POPUP_MINIMUM_PHP_VERSION.' version required. You server using PHP version = '.PHP_VERSION);
		}
	}

	public static function checkRequirements() {

		$helperObj = new self();
		$helperObj->checkPhpVersion();
	}
}