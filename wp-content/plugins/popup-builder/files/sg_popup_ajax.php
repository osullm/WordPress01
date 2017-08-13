<?php
//sanitizing and validating input before any action
function sgSanitizeAjaxField($optionValue,  $isTextField = false) {
	/*TODO: Extend function for other sanitization and validation actions*/
	if(!$isTextField) {
		return sanitize_text_field($optionValue);
	}
}

function sgPopupDelete()
{
	check_ajax_referer('sgPopupBuilderDeleteNonce', 'ajaxNonce');
	$id = (int)@$_POST['popup_id'];

	if($id == 0 || !$id) {
		return;
	}

	require_once(SG_APP_POPUP_CLASSES.'/SGPopup.php');
	SGPopup::delete($id);
	SGPopup::removePopupFromPages($id);

	$args = array('popupId'=> $id);
	do_action('sgPopupDelete', $args);
}

add_action('wp_ajax_delete_popup', 'sgPopupDelete');

function sgFrontend()
{
	global $wpdb;
	check_ajax_referer('sgPopupBuilderSubsNonce', 'subsSecurity');
	parse_str($_POST['subsribers'], $subsribers);
	if(!empty($subsribers['sg-subs-hidden-checker'])) {
		return 'Bot';
	}
	$email = sanitize_email($subsribers['subs-email-name']);
	$firstName = sgSanitizeAjaxField($subsribers['subs-first-name']);
	$lastName = sgSanitizeAjaxField($subsribers['subs-last-name']);
	$title = sanitize_title($subsribers['subs-popup-title']);

	$query = $wpdb->prepare("SELECT id FROM ". $wpdb->prefix ."sg_subscribers WHERE email = %s AND subscriptionType = %s", $email, $title);
	$list = $wpdb->get_row($query, ARRAY_A);
	if(!isset($list['id'])) {
		$sql = $wpdb->prepare("INSERT INTO ".$wpdb->prefix."sg_subscribers (firstName, lastName, email, subscriptionType, status) VALUES (%s, %s, %s, %s,%d)", $firstName, $lastName, $email, $title, 0);
		$res = $wpdb->query($sql);
	}
	die();
}

add_action('wp_ajax_nopriv_subs_send_mail', 'sgFrontend');
add_action('wp_ajax_subs_send_mail', 'sgFrontend');

function sgContactForm()
{
	global $wpdb;
	parse_str($_POST['contactParams'], $params);
	//CSRF CHECK
	check_ajax_referer('sgPopupBuilderContactNonce', 'contactSecurity');
	if(!empty($params['sg-hidden-checker'])) {
		return 'Bot';
	}
	$adminMail = sanitize_email($_POST['receiveMail']);
	$popupTitle = sanitize_title($_POST['popupTitle']);
	$name = sgSanitizeAjaxField($params['contact-name']);
	$subject = sgSanitizeAjaxField($params['contact-subject']);
	$userMessage = sgSanitizeAjaxField($params['content-message']);
	$mail = sanitize_email($params['contact-email']);


	$message = '';
	if(isset($name)) {
		if($name == '') {
			$name = 'Not provided';
		}
		$message .= '<b>Name</b>: '.$name."<br>";
	}
	
	$message .= '<b>E-mail</b>: '.$mail."<br>";
	if(isset($subject)) {
		if($subject == '') {
			$subject = 'Not provided';
		}
		$message .= '<b>Subject</b>: '.$subject."<br>";
	}
	
	$message .= '<b>Message</b>: '.$userMessage."<br>";
	$headers  = 'MIME-Version: 1.0'."\r\n";
	$headers  = 'From: '.$adminMail.''."\r\n";
	$headers .= 'Content-type: text/html; charset=UTF-8'."\r\n"; //set UTF-8

	$sendStatus = wp_mail($adminMail, $popupTitle.'- Popup contact form', $message, $headers); //return true or false
	echo $sendStatus;
	die();
}

add_action('wp_ajax_nopriv_contact_send_mail', 'sgContactForm');
add_action('wp_ajax_contact_send_mail', 'sgContactForm');

function sgImportPopups()
{
	global $wpdb;
	check_ajax_referer('sgPopupBuilderImportNonce', 'ajaxNonce');
	$url = sgSanitizeAjaxField($_POST['attachmentUrl']);

	$contents = unserialize(base64_decode(file_get_contents($url)));

	/* For tables wich they are not popup tables child ex. subscribers */
	foreach ($contents['customData'] as $tableName => $datas) {
		$columns = '';

		$columsArray = array();
		foreach ($contents['customTablesColumsName'][$tableName] as $key => $value) {
			$columsArray[$key] = $value['Field'];
		}
		$columns .= implode(array_values($columsArray), ', ');
		foreach ($datas as $key => $data) {
			$values = "'".implode(array_values($data), "','")."'";
			$customInsertSql = $wpdb->prepare("INSERT INTO ".$wpdb->prefix.$tableName."($columns) VALUES ($values)");
			$wpdb->query($customInsertSql);
		}
	}

	foreach ($contents['wpOptions'] as $key => $option) {
		update_option($key,$option);
	}
	
	foreach ($contents['exportArray'] as $content) {
		//Main popup table data
		$popupData = $content['mainPopupData'];
		$popupId = $popupData['id'];
		$popupType = $popupData['type'];
		$popupTitle = $popupData['title'];
		$popupOptions = $popupData['options'];

		//Insert popup
		$sql = $wpdb->prepare("INSERT INTO ".$wpdb->prefix.PopupInstaller::$mainTableName."(id, type, title, options) VALUES (%d, %s, %s, %s)", $popupId, $popupType, $popupTitle, $popupOptions);
		$res = $wpdb->query($sql);
		//Get last insert popup id
		$lastInsertId = $wpdb->insert_id;

		//Child popup data
		$childPopupTableName = $content['childTableName']; // change it Tbale to Table
		$childPopupData = $content['childData']; //change it child

		//Foreach throw child popups
		foreach ($childPopupData as $childPopup) {
			//Child popup table columns
			$values = '';
			$columns = implode(array_keys($childPopup), ', ');
			//$values = "'".implode(array_values($childPopup), "','")."'";
			foreach (array_values($childPopup) as $value) {
				$values .= "'".addslashes($value)."', ";
			}
			$values = rtrim($values, ', ');
			
			$queryValues = str_repeat("%s, ", count(array_keys($childPopup)));
			$queryValues = "%d, ".rtrim($queryValues, ', ');
			
			$queryStr = 'INSERT INTO '.$wpdb->prefix.$childPopupTableName.'(id, '.$columns.') VALUES ('.$lastInsertId.','. $values.')';
			//$sql = $wpdb->prepare($queryStr,$lastInsertId, $valuess);
			
			$resa = $wpdb->query($queryStr);
			
			echo 'ChildRes: '.$resa;
		}
		echo 'MainRes: '.$res;
	}
}

add_action('wp_ajax_import_popups', 'sgImportPopups');

function sgCloseReviewPanel()
{
	check_ajax_referer('sgPopupBuilderReview', 'ajaxNonce');
    update_option('SG_COLOSE_REVIEW_BLOCK', true);
}
add_action('wp_ajax_close_review_panel', 'sgCloseReviewPanel');

function addToSubscribers() {

	global $wpdb;
	check_ajax_referer('sgPopupBuilderAddSubsToListNonce', 'ajaxNonce');
	$firstName = sgSanitizeAjaxField($_POST['firstName']);
	$lastName = sgSanitizeAjaxField($_POST['lastName']);
	$email = sanitize_email($_POST['email']);
	$subsType = array_map( 'sanitize_text_field', $_POST['subsType']);

	foreach ($subsType as $subType) {
		$selectSql = $wpdb->prepare("SELECT id FROM ".$wpdb->prefix."sg_subscribers WHERE email=%s AND subscriptionType=%s", $email, $subType);
		$res = $wpdb->get_row($selectSql, ARRAY_A);
		if(empty($res)) {
			$sql = $wpdb->prepare("INSERT INTO ".$wpdb->prefix."sg_subscribers (firstName, lastName, email, subscriptionType) VALUES (%s, %s, %s, %s) ", $firstName, $lastName, $email, $subType);
			$wpdb->query($sql);
		}
	}
	
	die();
}
add_action('wp_ajax_add_to_subsribers', 'addToSubscribers');

function sgDeleteSubscribers() {

	global $wpdb;
	check_ajax_referer('sgPopupBuilderAddSubsNonce', 'ajaxNonce');
	$subsribersId = array_map( 'sanitize_text_field', $_POST['subsribersId']);
	foreach ($subsribersId as $subsriberId) {
		$prepareSql = $wpdb->prepare("DELETE FROM ". $wpdb->prefix ."sg_subscribers WHERE id = %d",$subsriberId);
		$wpdb->query($prepareSql);
	}
	die();
}

add_action('wp_ajax_subsribers_delete', 'sgDeleteSubscribers');

function sgIsHaveErrorLog() {

	global $wpdb;
	check_ajax_referer('sgPopupBuilderSubsLogNonce', 'ajaxNonce');
	$countRows = '';
	$popupType = sgSanitizeAjaxField($_POST['subsType']);
	
	$getErrorCounteSql = $wpdb->prepare("SELECT count(*) FROM ". $wpdb->prefix ."sg_subscription_error_log WHERE popupType=%s",$popupType);
	$countRows = $wpdb->get_var($getErrorCounteSql);
	echo $countRows;
	die();
}

add_action('wp_ajax_subs_error_log_count', 'sgIsHaveErrorLog');

function sgChangePopupStatus() {
	check_ajax_referer('sgPopupBuilderDeactivateNonce', 'ajaxNonce');
	$popupId = (int)$_POST['popupId'];
	$obj = SGPopup::findById($popupId);
	$options = json_decode($obj->getOptions(), true);
	$options['isActiveStatus'] = sgSanitizeAjaxField($_POST['popupStatus']);
	$obj->setOptions(json_encode($options));
	$obj->save();
}	
add_action('wp_ajax_change_popup_status', 'sgChangePopupStatus');

