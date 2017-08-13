<?php

/**
 * Popup builder extensions connection
 *
 * @since 2.5.3
 *
 */
class SGPBExtensionsConnector {

	public $activeExtensions;
	public $deactive;
	//redirect url for activation hook
	public $redirectUrl = '';
	//bool $networkWide Whether to enable the plugin for all sites in the network.
	public $networkWide = false;
	//bool $silent Prevent calling activation hooks.
	public $silent = false;
	public $prepareData;

	public static $POPUPEXTENSIONS = array(
		'popup-builder-mailchimp/popup-builder-mailchimp.php',
		'popup-builder-aweber/popup-builder-aweber.php',
		'popup-builder-exit-intent/popup-builder-exit-intent.php',
		'popup-builder-analytics/popup-builder-analytics.php',
		'popup-builder-ad-block/popup-builder-add-block.php'
	);

	public function __construct() {

		include_once( ABSPATH . 'wp-admin/includes/plugin.php' );
		if(is_multisite()) {
			$this->networkWide = true;
		}
	}

	/**
	 * Check extensions connection
	 *
	 * @since 2.5.3
	 *
	 * @param bool $activeStatus if true check is active extension
	 *
	 * @return void
	 *
	 */

	private function extensionCheck($activeStatus) {

		$extensions = array();
		$allExtensions = SGPBExtensionsConnector::$POPUPEXTENSIONS;

		if(empty($allExtensions)) {
			return;
		}

		foreach($allExtensions as $extensionKey) {
			$isActive = is_plugin_active($extensionKey);

			if($isActive && $activeStatus) {
				$extensions[] = $extensionKey;
			}
			else if(!$isActive && !$activeStatus) {
				$extensions[] = $extensionKey;
			}
		}

		if($activeStatus) {
			$this->activeExtensions = $extensions;
		}
		else {
			$this->deactive = $extensions;
		}

	}

	private function packageChecker() {

		$originalExtension = SG_APP_POPUP_FILES.'/extensions/popup-builder-exit-intent';
		$passedExtension =  WP_PLUGIN_DIR.'/popup-builder-exit-intent';

		if(file_exists($originalExtension) && file_exists($passedExtension)) {
			$exitIntentPackage = array('popup-builder-exit-intent/popup-builder-exit-intent.php');
			$this->deletePlugin($exitIntentPackage);
		}
	}

	/**
	 * Current All active extensions
	 *
	 * @since 2.5.3
	 *
	 * @return array $activeExtension
	 *
	 */

	private function getActiveExtensions() {

		$this->extensionCheck(true);
		$activeExtension = $this->activeExtensions;

		return $activeExtension;
	}

	/**
	 * Current all deactive extensions
	 *
	 * @since 2.5.3
	 *
	 * @return array $deactivateExtensions
	 *
	 */

	private function getDeactivatePlugins() {

		$this->extensionCheck(false);
		$deactivateExtensions = $this->deactive;

		return $deactivateExtensions;
	}

	private function prepareToActivate() {

		$this->getActiveExtensions();
		$this->getDeactivatePlugins();
		// Deactivate all active extensions
		$this->deactivate();
		$this->packageChecker();
	}

	/**
	 * Activate all extensions
	 *
	 * @since 2.5.3
	 *
	 * @param bool status if true activate all else active only active extensions
	 *
	 * @return void
	 *
	 */

	public function activate($status = false) {

		include_once( ABSPATH . 'wp-admin/includes/plugin.php' );
		$doActivate = $this->activeExtensions;

		$this->prepareToActivate();

		if($status) {
			$doActivate = SGPBExtensionsConnector::$POPUPEXTENSIONS;
		}
		if(POPUP_BUILDER_PKG > POPUP_BUILDER_PKG_SILVER) {
			@$this->sgRunActivatePlugin('popup-builder-exit-intent/popup-builder-exit-intent.php');
		}
		$this->doActivate($doActivate);
	}

	/**
	 * Activate plugins
	 *
	 * @since 2.5.3
	 *
	 * @param string|array $plugins Single plugin or list of plugins.
	 *
	 * @return void
	 */

	public function doActivate($plugins) {

		$redirectUrl = $this->redirectUrl;
		$networkWide = $this->networkWide;
		$silent = $this->silent;

		activate_plugins($plugins, $redirectUrl, $networkWide, $silent);
	}

	/**
	 * Deactivate all extensions
	 *
	 * @since 2.5.3
	 *
	 * @return void
	 *
	 */

	public function deactivate() {

		$doDeActivate = $this->activeExtensions;

		$this->doDeactivate($doDeActivate);
	}

	/**
	 * Deactivate plugins
	 *
	 * @since 2.5.3
	 *
	 * @param string|array $plugins Single plugin or list of plugins.
	 *
	 * @return void
	 *
	 */

	public function doDeactivate($plugins) {

		$networkWide = $this->networkWide;
		$silent = $this->silent;

		deactivate_plugins($plugins,$silent,$networkWide);
	}

	/**
	 * Delete plugin from plugins section
	 *
	 * @since 2.5.3
	 *
	 * @param array  $plugins List of plugins to delete.
	 *
	 * @return void
	 *
	 */

	private function deletePlugin($plugins) {

		delete_plugins($plugins);
	}

	public function sgRunActivatePlugin($plugin) {
		$current = get_option( 'active_plugins' );
		$plugin = plugin_basename( trim( $plugin ) );

		if ( !in_array( $plugin, $current ) ) {
			$current[] = $plugin;
			sort( $current );
			do_action( 'activate_plugin', trim( $plugin ) );
			update_option( 'active_plugins', $current );
			do_action( 'activate_' . trim( $plugin ) );
			do_action( 'activated_plugin', trim( $plugin) );
		}

		return null;
	}
}