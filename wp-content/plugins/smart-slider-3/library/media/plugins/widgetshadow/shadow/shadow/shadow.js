N2Require('SmartSliderWidgetShadow', [], [], function ($, scope, undefined) {
    "use strict";

    function SmartSliderWidgetShadow(id, parameters) {
        this.slider = window[id];

        this.slider.started($.proxy(this.start, this, id, parameters));
    };


    SmartSliderWidgetShadow.prototype.start = function (id, parameters) {
        this.shadow = this.slider.sliderElement.find('.nextend-shadow');
        this.slider.responsive.addStaticMargin('Bottom', this);
    };

    SmartSliderWidgetShadow.prototype.isVisible = function () {
        return this.shadow.is(':visible');
    };

    SmartSliderWidgetShadow.prototype.getSize = function () {
        return this.shadow.height();
    };

    return SmartSliderWidgetShadow;
});