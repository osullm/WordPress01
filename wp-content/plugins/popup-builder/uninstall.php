<?php

if( ! defined( 'WP_UNINSTALL_PLUGIN' ) )
	exit();

require_once(dirname(__FILE__)."/config.php");
require_once(SG_APP_POPUP_CLASSES .'/PopupInstaller.php'); //cretae tables
require_once(SG_APP_POPUP_FILES .'/sg_functions.php');


if (POPUP_BUILDER_PKG > POPUP_BUILDER_PKG_FREE) {
	require_once( SG_APP_POPUP_CLASSES .'/PopupProInstaller.php'); //uninstall tables
}

$deleteStatus = SGFunctions::popupTablesDeleteSatus();

if($deleteStatus) {
	PopupInstaller::uninstall();
	if (POPUP_BUILDER_PKG > POPUP_BUILDER_PKG_FREE) {
		PopupProInstaller::uninstall();
	}
}