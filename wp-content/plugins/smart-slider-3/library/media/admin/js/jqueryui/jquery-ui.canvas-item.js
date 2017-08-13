(function ($) {
    "use strict";

    $.widget("ui.nextendCanvasItem", $.ui.mouse, {
        widgetEventPrefix: "canvasItem",
        options: {
            canvasUIManager: null,
            layer: false,
            $layer: null,
            distance: 2,
            onCreate: function () {

            }
        },
        _create: function () {

            if (typeof this.options.$layer === 'function') {
                this.options.$layer = this.options.$layer.call(this, this);
            }
            this._mouseInit();
        },
        _mouseCapture: function (event, overrideHandle) {
            return this.options.canvasUIManager._mouseCapture(this.options, event, overrideHandle);
        },
        _mouseStart: function (event, overrideHandle, noActivation) {
            this._trigger('start');
            return this.options.canvasUIManager._mouseStart(this.options, event, overrideHandle, noActivation);
        },
        _mouseDrag: function (event) {
            return this.options.canvasUIManager._mouseDrag(this.options, event);
        },
        _mouseStop: function (event, noPropagation) {
            return this.options.canvasUIManager._mouseStop(this.options, event, noPropagation);

        },
        _destroy: function () {
            this._mouseDestroy();

            return this;
        },
    });

})(n2);