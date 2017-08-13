<?php
if(!class_exists('SgPopupBuilderConfig')) {
	class SgPopupBuilderConfig
	{

		public function __construct()
		{
			$this->init();
		}

		private function init()
		{

			if (!defined('ABSPATH')) {
				exit();
			}

			define("SG_APP_POPUP_PATH", dirname(__FILE__));
			define('SG_APP_POPUP_URL', plugins_url('', __FILE__));
			define('SG_APP_POPUP_ADMIN_URL', admin_url());
			define('SG_APP_POPUP_FILE', plugin_basename(__FILE__));
			define('SG_APP_POPUP_FILES', SG_APP_POPUP_PATH . '/files');
			define('SG_APP_POPUP_CLASSES', SG_APP_POPUP_PATH . '/classes');
			define('SG_APP_POPUP_JS', SG_APP_POPUP_PATH . '/javascript');
			define('SG_APP_POPUP_HELPERS', SG_APP_POPUP_PATH . '/helpers/');
			define('SG_APP_POPUP_TABLE_LIMIT', 15);
			define('SG_POPUP_VERSION', 2.633);
			define('SG_POPUP_PRO_VERSION', 3.36);
			define('SG_POPUP_PRO_URL', 'https://popup-builder.com/');
			define('SG_POPUP_EXTENSION_URL', 'https://popup-builder.com/extensions');
			define('SG_MAILCHIMP_EXTENSION_URL', 'https://popup-builder.com/downloads/mailchimp/');
			define('SG_ANALYTICS_EXTENSION_URL', 'https://popup-builder.com/downloads/analytics/');
			define('SG_AWEBER_EXTENSION_URL', 'https://popup-builder.com/downloads/aweber/');
			define('SG_EXITINTENT_EXTENSION_URL', 'https://popup-builder.com/downloads/exit-intent/');
			define('SG_ADBLOCK_EXTENSION_URL', 'https://popup-builder.com/downloads/adblock/');
			define('SG_IP_TO_COUNTRY_SERVICE_TIMEOUT', 2);
			define("SG_SHOW_POPUP_REVIEW", get_option("SG_COLOSE_REVIEW_BLOCK"));
			define("SG_POSTS_PER_PAGE", 1000);
			define("SG_POPUP_MINIMUM_PHP_VERSION", '5.3.3');
			/*Example 1 minute*/
			define("SG_FILTER_REPEAT_INTERVAL", 1);
			define("SG_POST_TYPE_PAGE", "allPages");
			define("SG_POST_TYPE_POST", "allPosts");

			define('POPUP_BUILDER_PKG_FREE', 1);
			define('POPUP_BUILDER_PKG_SILVER', 2);
			define('POPUP_BUILDER_PKG_GOLD', 3);
			define('POPUP_BUILDER_PKG_PLATINUM', 4);

			global $POPUP_TITLES;
			global $POPUP_ADDONS;

			$POPUP_TITLES = array(
				'image' => 'Image',
				'html' => 'HTML',
				'fblike' => 'Facebook',
				'iframe' => 'Iframe',
				'video' => 'Video',
				'shortcode' => 'Shortcode',
				'ageRestriction' => 'Age Restriction',
				'countdown' => 'Countdown',
				'social' => 'Social',
				'exitIntent' => 'Exit Intent',
				'subscription' => 'Subscription',
				'contactForm' => 'Contact Form'
			);

			$POPUP_ADDONS = array(
				'aweber',
				'mailchimp',
				'analytics',
				'exitIntent',
				'adBlock'
			);


			require_once(dirname(__FILE__) . '/config-pkg.php');

		}

		public static function popupJsDataInit()
		{

			$popupBuilderVersion = SG_POPUP_VERSION;
			if (POPUP_BUILDER_PKG > POPUP_BUILDER_PKG_FREE) {
				$popupBuilderVersion = SG_POPUP_PRO_VERSION;
			}

			$dataString = "<script type='text/javascript'>
							SG_POPUPS_QUEUE = [];
							SG_POPUP_DATA = [];
							SG_APP_POPUP_URL = '" . SG_APP_POPUP_URL . "';
							SG_POPUP_VERSION='" . $popupBuilderVersion . "_" . POPUP_BUILDER_PKG . ";';
							function sgAddEvent(element, eventName, fn) {
								if (element.addEventListener)
									element.addEventListener(eventName, fn, false);
								else if (element.attachEvent)
									element.attachEvent('on' + eventName, fn);
							}
						</script>";

			return $dataString;
		}
	}

	$popupConf = new SgPopupBuilderConfig();
}