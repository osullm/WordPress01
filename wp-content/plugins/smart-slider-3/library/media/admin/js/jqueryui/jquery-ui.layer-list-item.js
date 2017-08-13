(function ($) {
    "use strict";

    $.widget("ui.nextendLayerListItem", $.ui.mouse, {
        widgetEventPrefix: "layerListItem",
        options: {
            UIManager: null,
            layer: false,
            $layer: null,
            distance: 2
        },
        _create: function () {
            this._mouseInit();
        },
        _mouseCapture: function (event, overrideHandle) {
            return this.options.UIManager._mouseCapture(this.options, event, overrideHandle);
        },
        _mouseStart: function (event, overrideHandle, noActivation) {
            this._trigger('start');
            return this.options.UIManager._mouseStart(this.options, event, overrideHandle, noActivation);
        },
        _mouseDrag: function (event) {
            return this.options.UIManager._mouseDrag(this.options, event);
        },
        _mouseStop: function (event, noPropagation) {
            return this.options.UIManager._mouseStop(this.options, event, noPropagation);

        },
        _destroy: function () {
            this._mouseDestroy();
            return this;
        },
    });

})(n2);