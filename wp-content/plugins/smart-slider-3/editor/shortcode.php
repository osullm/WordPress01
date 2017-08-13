<?php

class N2SSShortcodeInsert {

    public static function init() {
        add_action('admin_init', array(
            'N2SSShortcodeInsert',
            'addButton'
        ));
    }

    public static function addButton() {
        N2Loader::import('libraries.settings.settings', 'smartslider');
        if ((!current_user_can('edit_posts') && !current_user_can('edit_pages'))) {
            return;
        }
        if (in_array(basename($_SERVER['PHP_SELF']), array(
            'post-new.php',
            'page-new.php',
            'post.php',
            'page.php'
        ))) {

            self::addForced();

            wp_enqueue_script('jquery-ui-dialog');
            wp_enqueue_style("wp-jquery-ui-dialog");

            if (intval(N2SmartSliderSettings::get('editor-icon', 1))) {
                if (get_user_option('rich_editing') == 'true') {
                    add_filter('mce_external_plugins', array(
                        'N2SSShortcodeInsert',
                        'mceAddPlugin'
                    ));
                    add_filter('mce_buttons', array(
                        'N2SSShortcodeInsert',
                        'mceRegisterButton'
                    ));
                }
            }
        }
    }

    public static function addForcedFrontend($action = 'wp_print_footer_scripts') {
        self::addForced('wp_print_footer_scripts');
    }

    public static function addForced($action = 'admin_print_footer_scripts') {
        static $added = false;
        if (!$added) {
            self::initButtonDialog();

            add_action($action, array(
                'N2SSShortcodeInsert',
                'addButtonDialog'
            ));

            wp_enqueue_script('jquery-ui-dialog');
            wp_enqueue_style("wp-jquery-ui-dialog");

            $added = true;
        }
    }

    public static function mceAddPlugin($plugin_array) {
        $plugin_array['nextend2smartslider3'] = plugin_dir_url(__FILE__) . 'shortcode.js';

        return $plugin_array;
    }

    public static function mceRegisterButton($buttons) {
        array_push($buttons, "|", "nextend2smartslider3");

        return $buttons;
    }

    public static function initButtonDialog() {
        wp_register_style('smart-slider-editor', plugin_dir_url(__FILE__) . 'editor.min.css', array(), '3.22', 'screen');
    
        wp_enqueue_style('smart-slider-editor');
    }

    public static function addButtonDialog() {
        N2Loader::import('libraries.settings.settings', 'smartslider');
        ?>
        <div id="n2-ss-editor-modal">
				<div class="n2-ss-editor-inner">
					<div class="n2-ss-editor-header">Select a Slider<div class="n2-ss-editor-header-close"></div></div>
                    <?php
                    $router = N2Base::getApplication('smartslider')->router;
                    ?>
                    <iframe src="<?php echo $router->createUrl(array('sliders/embed')); ?>"></iframe>
				</div>
			</div>
        <script type="text/javascript">
				jQuery(document).ready(function ($) {
                    var modal = $('#n2-ss-editor-modal'),
                        inner = $('.n2-ss-editor-inner'),
                        iframe = inner.find('iframe'),
                        $window = $(window),
                        callback = function () {
                        },
                        watchResize = function () {
                            iframe.height(inner.height() - 59);
                            $window.on('resize.ss', function () {
                                iframe.height(inner.height() - 59);
                            });
                        },
                        unWatchResize = function () {
                            $window.off('resize.ss');
                        },
                        show = function () {
                            modal.addClass('n2-active');
                            watchResize();
                        },
                        hide = function () {
                            unWatchResize();
                            modal.removeClass('n2-active');
                        };

                    modal.on('click', function (e) {
                        if (e.target == modal.get(0)) {
                            hide();
                        }
                    });
                    $('.n2-ss-editor-header-close').on('click', function (e) {
                        e.preventDefault();
                        hide();
                    });

                    var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";

                    window[eventMethod](eventMethod == "attachEvent" ? "onmessage" : "message", function (e) {
                        if (e.source == (iframe[0].contentWindow || iframe[0].contentDocument)) {
                            callback(e[e.message ? "message" : "data"]);
                            hide();
                        }
                    }, false);

                    <?php
                    if (intval(N2SmartSliderSettings::get('editor-icon', 1))) {
                    ?>
                    window.NextendSmartSliderWPTinyMCEModal = function (ed) {
                        callback = function (id) {
                            ed.execCommand('mceInsertContent', false, '<div>[smartslider3 slider=' + id + ']</div>');
                        };
                        show();
                    };

                    if (typeof QTags !== 'undefined') {
                        QTags.addButton('smart-slider-3', 'Smart Slider', function () {
                            callback = function (id) {
                                QTags.insertContent('<div>[smartslider3 slider=' + id + ']</div>');
                            };
                            show();
                        });
                    }
                    <?php
                    }
                    ?>

                    window.NextendSmartSliderSelectModal = function ($input) {
                        callback = function (id) {
                            $input.val(id).trigger('input').trigger('change');
                        };
                        show();
                        return false;
                    };

                });
			</script>
        <?php
    }
}

N2SSShortcodeInsert::init();