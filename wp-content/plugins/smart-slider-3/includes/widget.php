<?php

class N2SS3Widget extends WP_Widget {

    private $preventRender = false;

    function __construct() {

        parent::__construct('smartslider3', // Base ID
            'Smart Slider', // Name
            array('description' => 'Displays a Smart Slider') // Args
        );

        // YOAST SEO fix
        add_action('wpseo_head', array(
            $this,
            'preventRender'
        ), 0);
        add_action('wpseo_head', array(
            $this,
            'notPreventRender'
        ), 10000000000);
    }

    public static function register_widget() {
        register_widget('N2SS3Widget');
    }

    public function preventRender() {
        $this->preventRender = true;
    }

    public function notPreventRender() {
        $this->preventRender = false;
    }

    function widget($args, $instance) {
        global $wpdb;
        if ($this->preventRender) {
            return;
        }
        $instance = array_merge(array(
            'id'     => md5(time()),
            'slider' => 0,
            'title'  => ''
        ), $instance);

        if ($instance['slider'] === 0) {

            $instance['slider'] = $wpdb->get_var('SELECT id FROM ' . $wpdb->prefix . 'nextend2_smartslider3_sliders LIMIT 0,1');
        }

        $slider = do_shortcode('[smartslider3 slider=' . $instance['slider'] . ']');

        if ($slider != '') {

            $title = apply_filters('widget_title', $instance['title']);

            echo $args['before_widget'];
            if (!empty($title)) echo $args['before_title'] . $title . $args['after_title'];

            echo $slider;

            echo $args['after_widget'];
        }
    }

    function form($instance) {
        $instance = wp_parse_args((array)$instance, array(
            'title'  => '',
            'slider' => 0
        ));
        $title    = $instance['title'];

        N2SSShortcodeInsert::addForced();

        ?>
        <p>
            <label for="<?php echo $this->get_field_id('title'); ?>">
                Title:
                <input class="widefat" id="<?php echo $this->get_field_id('title'); ?>"
                       name="<?php echo $this->get_field_name('title'); ?>" type="text"
                       value="<?php echo esc_attr($title); ?>"/>
            </label>
        </p>

        <p>
            <label for="<?php echo $this->get_field_id('smartslider2'); ?>">
                Smart Slider:<br>
                <input style="width:100px;vertical-align: top;" class="widefat" id="<?php echo $this->get_field_id('slider'); ?>" name="<?php echo $this->get_field_name('slider'); ?>" type="text" value="<?php echo esc_attr($instance['slider']); ?>">

                <a style="vertical-align: top;" href="#" onclick="return NextendSmartSliderSelectModal(jQuery(this).siblings('input'));" class="button button-primary elementor-button elementor-button-smartslider fl-builder-button fl-builder-button-large" title="Select slider">Select slider</a>
            </label>
        </p>
        <?php
    }

    function update($new_instance, $old_instance) {
        $instance           = $old_instance;
        $instance['title']  = $new_instance['title'];
        $instance['slider'] = $new_instance['slider'];

        return $instance;
    }
}

add_action('widgets_init', 'N2SS3Widget::register_widget');