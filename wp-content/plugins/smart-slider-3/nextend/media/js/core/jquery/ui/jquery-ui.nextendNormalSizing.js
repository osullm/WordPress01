(function ($) {
    $.widget("ui.nextendNormalSizing", $.ui.mouse, {
        version: "1.0.0",
        widgetEventPrefix: "normalsizing",
        multiplier: 1,
        options: {
            maxWidth: true,
            height: false,
            syncWidth: false,
            start: null,
            resizeMaxWidth: null,
            resizeHeight: null,
            stopMaxWidth: null,
            stopHeight: null
        },
        _create: function () {

            this._setupHandles();

            this._mouseInit();
        },

        _destroy: function () {

            this._mouseDestroy();

            this.element
                .removeData("uiNextendNormalSizing")
                .off(".normalsizing")
                .find("> .ui-customresizable-handle")
                .remove();

            return this;
        },

        _setupHandles: function () {
            var o = this.options, i, n = [], hname, axis;

            if (o.maxWidth) {
                n.push('w');
                n.push('e');
            }

            if (o.height) {
                n.push('s');
            }
            this.handles = {};

            for (i = 0; i < n.length; i++) {
                var handle = n[i];
                axis = $('<div class="ui-customresizable-handle ui-customresizable-handle ui-customresizable-' + handle + '">').css('zIndex', 90);
                this.handles[handle] = axis;
                this.element.append(axis);
            }

            if (o.maxWidth) {
                nextend.tooltip.addElement(this.handles.e, 'Max width');
                nextend.tooltip.addElement(this.handles.w, 'Max width');
            }

            if (o.height) {
                nextend.tooltip.addElement(this.handles.s, 'Height');
            }

            this._handles = this.element.find("> .ui-customresizable-handle");
            this._handles.disableSelection();
        },

        _removeHandles: function () {
            this._handles.remove();
        },

        _mouseCapture: function (event) {
            var handle,
                capture = false;
            for (handle in this.handles) {
                if (this.handles[handle][0] === event.target) {
                    this.currentHandle = handle;
                    return !this.options.disabled;
                }
            }

            return false;
        },

        _mouseStart: function (event) {
            var o = this.options,
                el = this.element;

            this.resizing = true;

            this.originalMousePosition = {left: event.pageX, top: event.pageY};

            switch (this.currentHandle) {
                case 'w':
                case 'e':
                    this.originalValue = this.element.width();
                    this.maxWidth = this.element.parent().width();

                    this._trigger("start", event, 'maxwidth');

                    if (this.element.css('align-self') == 'center') {
                        this.multiplier = 2;
                    } else {
                        this.multiplier = 1;
                    }
                    break;
                case 's':
                    this.originalValue = this.element.height();

                    this._trigger("start", event, 'height');
                    break;
            }

            this.element.addClass("ui-resizable-resizing");


            $("body").addClass('n2-ss-normal-sizing-element');
            return true;
        },

        _parse_movement_s: function (e) {
            return e.pageY - this.originalMousePosition.top;
        },

        _parse_movement_e: function (e) {
            return (e.pageX - this.originalMousePosition.left) * this.multiplier;
        },

        _parse_movement_w: function (e) {
            return (this.originalMousePosition.left - e.pageX) * this.multiplier;
        },

        _mouseDrag: function (event) {
            var o = this.options;

            this.currentValue = nextend.roundHelper(this.originalValue + this['_parse_movement_' + this.currentHandle].call(this, event));

            switch (this.currentHandle) {
                case 'w':
                case 'e':
                    if (this.currentValue <= this.maxWidth) {
                        this.element.css('maxWidth', this.currentValue + 'px');
                        if (o.syncWidth) {
                            this.element.css('width', this.currentValue + 'px');
                        }
                    } else {
                        this.element.css('maxWidth', 'none');
                        if (o.syncWidth) {
                            this.element.css('width', '');
                        }
                        this.currentValue = 0;
                    }
                    this._trigger("resizeMaxWidth", event, {value: this.currentValue});
                    break;
                case 's':
                    this.currentValue = Math.max(1, this.currentValue);
                    this.element.height(this.currentValue);

                    this._trigger("resizeHeight", event, {value: this.currentValue});
                    break;
            }
        },

        _mouseStop: function (event) {
            var o = this.options;

            this.currentValue = nextend.roundHelper(this.originalValue + this['_parse_movement_' + this.currentHandle].call(this, event));

            switch (this.currentHandle) {
                case 'w':
                case 'e':
                    if (this.currentValue <= this.maxWidth) {
                        this.element.css('maxWidth', this.currentValue + 'px');
                        if (o.syncWidth) {
                            this.element.css('width', '');
                        }
                    } else {
                        this.element.css('maxWidth', 'none');
                        if (o.syncWidth) {
                            this.element.css('width', '');
                        }
                        this.currentValue = 0;
                    }

                    this._trigger("stopMaxWidth", event, {value: this.currentValue});
                    break;
                case 's':
                    this.currentValue = Math.max(1, this.currentValue);
                    this.element.height(this.currentValue);

                    this._trigger("stopHeight", event, {value: this.currentValue});
                    break;
            }

            this.resizing = false;

            $("body").off('.uiNextendNormalSizing')
                .removeClass('n2-ss-normal-sizing-element');

            this.element.removeClass("ui-resizable-resizing");

            nextend.preventMouseUp();
            return false;
        }
    });
})(n2);