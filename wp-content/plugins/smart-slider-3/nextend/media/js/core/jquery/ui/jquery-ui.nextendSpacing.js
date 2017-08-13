(function ($) {
    $.widget("ui.nextendSpacing", $.ui.mouse, {
        version: "1.0.0",
        widgetEventPrefix: "spacing",
        options: {
            handles: '',
            mode: 'padding',
            sync: {
                n: 'padding-top',
                e: 'padding-right',
                s: 'padding-bottom',
                w: 'padding-left',
            },
            syncInv: {
                n: 's',
                e: 'w',
                s: 'n',
                w: 'e',
            },
            side: {
                n: 'top',
                e: 'right',
                s: 'bottom',
                w: 'left',
            },
            size: {
                n: 'height',
                e: 'width',
                s: 'height',
                w: 'width',
            },
            // Callbacks
            drag: null,
            start: null,
            stop: null
        },
        _create: function () {

            this._setupHandles();

            this._mouseInit();
        },

        _destroy: function () {

            this._mouseDestroy();

            this.element
                .removeData("uiNextendSpacing")
                .off(".spacing")
                .find("> .ui-spacing-handle")
                .remove();

            return this;
        },

        _setupHandles: function () {
            var o = this.options, handle, i, n, hname, axis;

            n = "n,e,s,w".split(",");
            this.handles = {};

            for (i = 0; i < n.length; i++) {

                handle = $.trim(n[i]);
                hname = "ui-spacing-" + handle;
                this.handles[handle] = axis = $("<div>")
                    .addClass("ui-spacing-handle ui-spacing-handle-" + o.mode + " ui-spacing-handle " + hname)
                    .on('mousedown', $.proxy(this._mouseDown, this))
                    .appendTo(this.element)
                    .disableSelection();

                nextend.tooltip.addElement(this.handles[handle], o.mode.capitalize() + ' ' + o.side[handle]);

            }
        },

        _removeHandles: function () {
            this.element.find("> .ui-spacing-handle").remove();
        },

        _parse_movement_n: function (e) {
            return e.pageY - this.originalMousePosition.top;
        },

        _parse_movement_w: function (e) {
            return e.pageX - this.originalMousePosition.left;
        },

        _parse_movement_s: function (e) {
            return e.pageY - this.originalMousePosition.top;
        },

        _parse_movement_e: function (e) {
            return this.originalMousePosition.left - e.pageX;
        },

        _mouseCapture: function (e) {
            var i, handle,
                capture = false;

            for (i in this.handles) {
                handle = $(this.handles[i])[0];
                if (handle === e.target || $.contains(handle, e.target)) {
                    capture = true;
                }
            }

            return !this.options.disabled && capture;
        },

        _mouseStart: function (e) {

            this.wasShiftPressed = false;
            var curleft, curtop,
                o = this.options,
                el = this.element;
            for (var d in this.handles) {
                handle = this.handles[d][0];
                if (handle === e.target || $.contains(handle, e.target)) {
                    this.direction = d;
                    break;
                }
            }
            this.syncProperty = this.options.sync[this.direction];
            this.originalValue = parseInt(this.element.css(this.syncProperty));

            this.invSyncProperty = this.options.sync[this.options.syncInv[this.direction]];
            this.invOriginalValue = parseInt(this.element.css(this.invSyncProperty));

            this.resizing = true;

            this.originalMousePosition = {left: e.pageX, top: e.pageY};
            this.currentValue = this.originalValue;

            this.handles[this.direction].addClass('ui-spacing-under-spacing');

            this.element.addClass("ui-spacing-resizing");

            $("body").on({
                'keydown.uiSpacing': $.proxy(this._keyDown, this),
                'keyup.uiSpacing': $.proxy(this._keyUp, this)
            })
                .addClass('n2-ss-spacing-element');
            this._trigger("start", e, this.ui());
            return true;
        },
        _keyDown: function (e) {
            if (e.shiftKey && !this.wasShiftPressed) {
                this.wasShiftPressed = true;
                this.element.css(this.invSyncProperty, this.currentValue);
                this.handles[this.options.syncInv[this.direction]].css(this.options.size[this.options.syncInv[this.direction]], this.currentValue);
                this._trigger("spacing", e, this.ui());
            }
        },
        _keyUp: function (e) {
            if (!e.shiftKey && this.wasShiftPressed) {
                this.wasShiftPressed = false;
                this.element.css(this.invSyncProperty, this.invOriginalValue);
                this.handles[this.options.syncInv[this.direction]].css(this.options.size[this.options.syncInv[this.direction]], '');
                this._trigger("spacing", e, this.ui());
            }
        },
        _mouseDrag: function (e) {

            this.movement = this['_parse_movement_' + this.direction].call(this, e);

            this.currentValue = nextend.roundHelper(this.originalValue + this.movement);

            if (this.options.mode == 'padding') {
                this.currentValue = Math.max(0, this.currentValue);
            }

            this.element.css(this.syncProperty, this.currentValue);
            this.handles[this.direction].css(this.options.size[this.direction], this.currentValue);
            if (e.shiftKey) {
                this.wasShiftPressed = true;
                this.element.css(this.invSyncProperty, this.currentValue);
                this.handles[this.options.syncInv[this.direction]].css(this.options.size[this.options.syncInv[this.direction]], this.currentValue);
            } else if (this.wasShiftPressed) {
                this.wasShiftPressed = false;
                this.element.css(this.invSyncProperty, this.invOriginalValue);
                this.handles[this.options.syncInv[this.direction]].css(this.options.size[this.options.syncInv[this.direction]], '');
            }
            this._trigger("spacing", e, this.ui());
        },

        _mouseStop: function (e) {
            this.movement = this['_parse_movement_' + this.direction].call(this, e);

            this.currentValue = nextend.roundHelper(this.originalValue + this.movement);

            if (this.options.mode == 'padding') {
                this.currentValue = Math.max(0, this.currentValue);
            }

            this.element.css(this.syncProperty, this.currentValue);
            //this.handles[this.direction].css(this.options.size[this.direction], '');

            if (e.shiftKey) {
                this.element.css(this.invSyncProperty, this.currentValue);
                //this.handles[this.options.syncInv[this.direction]].css(this.options.size[this.options.syncInv[this.direction]], '');
            } else if (this.wasShiftPressed) {
                this.element.css(this.invSyncProperty, this.invOriginalValue);
                //this.handles[this.options.syncInv[this.direction]].css(this.options.size[this.options.syncInv[this.direction]], '');
            }

            this.resizing = false;

            $("body").off('.uiSpacing')
                .removeClass('n2-ss-spacing-element');

            this.handles[this.direction].removeClass('ui-spacing-under-spacing');
            this.element.removeClass("ui-spacing-resizing");

            this._trigger("stop", e, this.ui());

            nextend.preventMouseUp();
            return false;
        },

        plugins: {},

        ui: function () {
            var changed = {};
            changed[this.options.side[this.direction]] = this.currentValue;
            if (this.wasShiftPressed) {
                changed[this.options.side[this.options.syncInv[this.direction]]] = this.currentValue;
            }
            return {
                element: this.element,
                changed: changed
            };
        },

        _setOption: function (key, value) {
            this._super(key, value);
            if (key === "current") {
                var values = value.split(' ');
                this.handles.n.css('height', values[0]);
                this.handles.e.css('width', values[1]);
                this.handles.s.css('height', values[2]);
                this.handles.w.css('width', values[3]);
            }
        },
    });
})(n2);