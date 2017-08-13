<?php

class N2SS3Shortcode {

    public static $iframe = false;

    public static function forceIframe() {
        self::$iframe = true;
    }

    public static function doShortcode($parameters) {
        if (self::$iframe) {
            if (isset($parameters['slider'])) {
                return self::renderIframe($parameters['slider']);
            }

            return 'Smart Slider - Please select a slider!';
        }

        return self::render($parameters);
    }

    public static function renderIframe($sliderID) {

        $onload = '
if(typeof window.n2SSIframeLoader != "function"){
    (function($){
        var frames = [],
            clientHeight = 0;
        var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
        window[eventMethod](eventMethod == "attachEvent" ? "onmessage" : "message", function (e) {
            var sourceFrame = false;
            for(var i = 0; i < frames.length; i++){
                if(e.source == (frames[i].contentWindow || frames[i].contentDocument)){
                    sourceFrame = frames[i];
                }
            }
            if (sourceFrame) {
                var data = e[e.message ? "message" : "data"];
                
                switch(data["key"]){
                    case "ready":
                        clientHeight = document.documentElement.clientHeight || document.body.clientHeight;
                        $(sourceFrame).removeData();
                        (sourceFrame.contentWindow || sourceFrame.contentDocument).postMessage({
                            key: "ackReady",
                            clientHeight: clientHeight
                        }, "*");
                    break;
                    case "resize":
                        var $sourceFrame = $(sourceFrame);
                        
                        if(data.fullPage){
                            var resizeFP = function(){
                                if(clientHeight != document.documentElement.clientHeight || document.body.clientHeight){
                                    clientHeight = document.documentElement.clientHeight || document.body.clientHeight;
                                    (sourceFrame.contentWindow || sourceFrame.contentDocument).postMessage({
                                        key: "update",
                                        clientHeight: clientHeight
                                    }, "*");
                                }
                            };
                            if($sourceFrame.data("fullpage") != data.fullPage){
                                $sourceFrame.data("fullpage", data.fullPage);
                                resizeFP();
                                $(window).on("resize", resizeFP);
                            }
                        }
                        $sourceFrame.css({
                            height: data.height
                        });
                        
                        if(data.forceFull && $sourceFrame.data("forcefull") != data.forceFull){
                            $sourceFrame.data("forcefull", data.forceFull);
                            $("body").css("overflow-x", "hidden");
                            var resizeFF = function(){
                                var windowWidth = document.body.clientWidth || document.documentElement.clientWidth,
                                    outerEl = $sourceFrame.parent(),
                                    outerElOffset = outerEl.offset();
                                $sourceFrame.css("maxWidth", "none");
                                if ($("html").attr("dir") == "rtl") {
                                    outerElOffset.right = windowWidth - (outerElOffset.left + outerEl.outerWidth());
                                    $sourceFrame.css("marginRight", -outerElOffset.right - parseInt(outerEl.css("paddingLeft")) - parseInt(outerEl.css("borderLeftWidth"))).width(windowWidth);
                                } else {
                                    $sourceFrame.css("marginLeft", -outerElOffset.left - parseInt(outerEl.css("paddingLeft")) - parseInt(outerEl.css("borderLeftWidth"))).width(windowWidth);
                                }
                            };
                            resizeFF();
                            $(window).on("resize", resizeFF);
                        
                        }
                        break;
                }
            }
        });
        window.n2SSIframeLoader = function(iframe){
            frames.push(iframe);
        }
    })(jQuery);
}
n2SSIframeLoader(this);';

        return N2HTML::tag('iframe', array(
            'onload'      => str_replace(array(
                "\n",
                "\r",
                "\r\n"
            ), "", $onload),
            'class'       => "n2-ss-slider-frame",
            'style'       => 'width:100%',
            'frameborder' => 0,
            'src'         => site_url() . '?n2prerender=1&n2app=smartslider&n2controller=slider&n2action=iframe&sliderid=' . $sliderID
        ));

        return '<iframe onload="" class="n2-ss-slider-frame" style="width:100%" frameborder="0" src="' . site_url() . '?n2prerender=1&n2app=smartslider&n2controller=slider&n2action=iframe&sliderid=' . $sliderID . '"></iframe>';
    }

    public static function render($parameters, $usage = 'WordPress Shortcode') {
        if (isset($parameters['slide'])) {
            $slideTo = intval($parameters['slide']);
        }

        if (isset($parameters['get']) && !empty($_GET[$parameters['get']])) {
            $slideTo = intval($_GET[$parameters['get']]);
        }

        if (isset($slideTo)) {
            echo "<script type=\"text/javascript\">window['ss" . $parameters['slider'] . "'] = " . ($slideTo - 1) . ";</script>";
        }

        if (isset($parameters['page'])) {
            if ($parameters['page'] == 'home') {
                $condition = (!is_home() && !is_front_page());
            } else {
                $condition = ((get_the_ID() != intval($parameters['page'])) || (is_home() || is_front_page()));
            }
            if ($condition) {
                return '';
            }
        }

        $parameters = shortcode_atts(array(
            'id'     => md5(time()),
            'slider' => 0
        ), $parameters);

        if (intval($parameters['slider']) > 0) {
            ob_start();
            N2Base::getApplication("smartslider")
                  ->getApplicationType('frontend')
                  ->render(array(
                      "controller" => 'home',
                      "action"     => 'wordpress',
                      "useRequest" => false
                  ), array(
                      intval($parameters['slider']),
                      $usage
                  ));

            return ob_get_clean();
        }

        return '';
    }
}

add_shortcode('smartslider3', 'N2SS3Shortcode::doShortcode');

if (defined('DOING_AJAX') && DOING_AJAX) {
    if (isset($_POST['action']) && ($_POST['action'] == 'stpb_preview_builder_item' || $_POST['action'] == 'stpb_load_builder_templates' || $_POST['action'] == 'stpb_load_template')) {
        remove_shortcode('smartslider3');
    }
}