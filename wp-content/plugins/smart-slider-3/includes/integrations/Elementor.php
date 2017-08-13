<?php
namespace Elementor;

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

add_action('template_redirect', function () {
    if (\Elementor\Plugin::instance()->editor->is_edit_mode() || \Elementor\Plugin::instance()->preview->is_preview_mode()) {
        \N2SS3Shortcode::forceIframe();
    }
}, -1);


add_action('wp_ajax_elementor_render_widget', 'N2SS3Shortcode::forceIframe', -1);
add_action('elementor/editor/before_enqueue_scripts', 'N2SSShortcodeInsert::addForcedFrontend');

add_action('elementor/widgets/widgets_registered', function () {
    $widget_manager = \Elementor\Plugin::$instance->widgets_manager;
    $widget_manager->register_widget_type(new \Elementor\Nextend_Widget_SmartSlider());
}, 100);


class Nextend_Widget_SmartSlider extends \Elementor\Widget_Base {

    public function get_name() {
        return 'smartslider';
    }

    public function get_title() {
        return 'Smart Slider';
    }

    public function get_icon() {
        return 'eicon-slider-3d';
    }

    protected function _register_controls() {

        $this->start_controls_section('section_my_custom', [
            'label' => esc_html('Smart Slider'),
        ]);

        NextendRegisterControlSmartSliderField();
        \Elementor\Plugin::instance()->controls_manager->register_control('smartsliderfield', new Control_SmartSliderField());


        $this->add_control('smartsliderid', [
            'label'   => 'Slider ID',
            'type'    => 'smartsliderfield',
            'default' => '',
            'title'   => __('Enter some text', 'elementor-custom-element'),
        ]);

        $this->end_controls_section();

    }

    protected function render() {
        if (\Elementor\Plugin::instance()->editor->is_edit_mode() || \Elementor\Plugin::instance()->preview->is_preview_mode()) {
            echo \N2SS3Shortcode::renderIframe($this->get_settings('smartsliderid'));
        } else {
            echo do_shortcode('[smartslider3 slider=' . $this->get_settings('smartsliderid') . ']');
        }
    }

    public function render_plain_content() {
        echo 'Smart Slider with ID: ' . $this->get_settings('smartsliderid');
    }

    protected function _content_template() {
        echo \N2SS3Shortcode::renderIframe('{{{ settings.smartsliderid }}}');
    }

}

function NextendRegisterControlSmartSliderField() {
    static $registered;
    if (!$registered) {
        if (class_exists('\Elementor\Base_Data_Control')) {

            class_alias('\Elementor\Base_Data_Control', '\Elementor\NextendElementorFieldAbstract');
        } else {

            class_alias('\Elementor\Control_Base', '\Elementor\NextendElementorFieldAbstract');
        }

        class_exists('\Elementor\Group_Control_Background');

        class Control_SmartSliderField extends \Elementor\NextendElementorFieldAbstract {

            public function get_type() {
                return 'smartsliderfield';
            }

            public function content_template() {
                ?>
                <div class="elementor-control-field">
			<label class="elementor-control-title">{{{ data.label }}}</label>
			<div class="elementor-control-input-wrapper">
                <a style="margin-bottom:10px;" href="#" onclick="return NextendSmartSliderSelectModal(jQuery(this).siblings('input'));" class="button button-primary elementor-button elementor-button-smartslider" title="Select slider">Select slider</a>
				<input type="{{ data.input_type }}" title="{{ data.title }}" data-setting="{{ data.name }}""/>
			</div>
		</div>
                <# if ( data.description ) { #>
		<div class="elementor-control-field-description">{{{ data.description }}}</div>
		<# } #>
                <?php
            }

            public function get_default_settings() {
                return [
                    'input_type' => 'text',
                ];
            }
        }

        $registered = true;
    }
}
