(function ($) {
    "use strict";
    $.widget("ui.nextendColumns", $.ui.mouse, {
        version: "1.0.0",
        widgetEventPrefix: "columns",
        options: {
            columns: '1',
            gutter: 0,
            denominators: {
                1: 100,
                2: 100,
                3: 144,
                4: 100,
                5: 100,
                6: 144
            },
            // Callbacks
            drag: null,
            start: null,
            stop: null
        },
        getDenominator: function (i) {
            if (this.options.denominators[i] === undefined) {
                this.options.denominators[i] = i * 15;
            }
            return this.options.denominators[i];
        },
        _create: function () {

            this._setupHandles();

            $(window).on('resize', $.proxy(this._resize, this));

            this._mouseInit();
        },

        _destroy: function () {

            this._mouseDestroy();
            this.element
                .removeData("uiNextendColumns")
                .off(".columns")
                .find("> .ui-column-width-handle")
                .remove();

            return this;
        },

        _setupHandles: function () {
            var o = this.options, handle, i, n, axis;

            this.fractions = [];

            var columnWidths = o.columns.split('+');
            for (var i = 0; i < columnWidths.length; i++) {
                this.fractions.push(new Fraction(columnWidths[i]));
            }
            this.currentDenominator = this.getDenominator(this.fractions.length);

            var currentPercent = 0;
            for (i = 0; i < this.fractions.length - 1; i++) {
                axis = $("<div class='ui-column-width-handle'>");

                var width = (this.fractions[i].valueOf() * 100);
                currentPercent += width;
                axis
                    .data('i', i)
                    .data('percent', currentPercent)
                    .appendTo(this.element);
                this._on(axis, {"mousedown": this._mouseDown});
            }

            this.handles = this.element.find('> .ui-column-width-handle');

            this.handles.disableSelection();

            this._resize();
        },

        _resize: function () {
            this.paddingLeft = parseInt(this.element.css('paddingLeft'));
            this.paddingRight = parseInt(this.element.css('paddingRight'));

            var containerWidth = this.element.width();

            this.outerWidth = containerWidth + this.paddingLeft + this.paddingRight,
                this.innerWidth = containerWidth - this.handles.length * this.options.gutter;

            for (var i = 0; i < this.handles.length; i++) {
                var currentPercent = this.handles.eq(i).data('percent');
                this._updateResizer(i, currentPercent);
            }
        },

        _updateResizer: function (i, currentPercent) {
            this.handles.eq(i).css({
                left: currentPercent + '%',
                marginLeft: -2 + this.paddingLeft + (i + 0.5) * this.options.gutter + (this.innerWidth - this.outerWidth) * currentPercent / 100
            })
        },

        _removeHandles: function () {
            this.handles.remove();
        },

        _setOption: function (key, value) {
            this._super(key, value);

            switch (key) {
                case "columns":
                    this._removeHandles();
                    this._setupHandles();
                    break;
                case "gutter":
                    this._resize();
                default:
                    break;
            }
        },

        _mouseCapture: function (event) {
            var i, handle,
                capture = false;

            for (i = 0; i < this.handles.length; i++) {
                handle = this.handles[i];
                if (handle === event.target) {
                    capture = true;
                }
            }

            return !this.options.disabled && capture;
        },

        _mouseStart: function (event) {
            var index = $(event.target).data('i'),
                cLeft = this.element.offset().left + 10,
                containerWidth = this.element.width() - 20;

            this.resizeContext = {
                index: index,
                cLeft: cLeft,
                containerWidth: containerWidth,
                startX: Math.max(0, Math.min(event.clientX - cLeft, containerWidth)),
            }

            this.currentFractions = [];
            this.currentPercent = [];
            for (var i = 0; i < this.fractions.length; i++) {
                this.currentFractions.push(this.fractions[i].clone());
                this.currentPercent.push(this.fractions[i].valueOf());
            }

            this.resizing = true;

            $("body").css("cursor", "ew-resize");

            this.element.addClass("ui-column-width-resizing");
            this._trigger("start", event, this.ui());
            return true;
        },

        _mouseDrag: function (event) {

            var currentX = Math.max(0, Math.min(event.clientX - this.resizeContext.cLeft, this.resizeContext.containerWidth)),
                fractionDifference = new Fraction(Math.round((currentX - this.resizeContext.startX) / (this.resizeContext.containerWidth / this.currentDenominator)), this.currentDenominator);

            if (fractionDifference.compare(this.fractions[this.resizeContext.index].clone().mul(-1)) < 0) {
                fractionDifference = this.fractions[this.resizeContext.index].clone().mul(-1);
            }
            if (fractionDifference.compare(this.fractions[this.resizeContext.index + 1]) > 0) {
                fractionDifference = this.fractions[this.resizeContext.index + 1].clone();
            }
            var currentP = this.fractions[this.resizeContext.index].add(fractionDifference),
                nextP = this.fractions[this.resizeContext.index + 1].sub(fractionDifference);

            this.currentFractions[this.resizeContext.index] = currentP;
            this.currentFractions[this.resizeContext.index + 1] = nextP;

            var currentPercent = 0;
            this.currentPercent = [];
            for (var i = 0; i < this.currentFractions.length; i++) {
                var width = this.currentFractions[i].valueOf();
                this.currentPercent.push(width);
                currentPercent += width * 100;
                this._updateResizer(i, currentPercent);
            }

            this._trigger("colwidth", event, this.ui());
        },

        _mouseStop: function (event) {

            this.resizing = false;

            $("body").css("cursor", "auto");

            this._trigger("stop", event, this.ui());

            this.fractions = this.currentFractions;

            nextend.preventMouseUp();
            return false;
        },

        ui: function () {
            return {
                element: this.element,
                originalFractions: this.fractions,
                currentFractions: this.currentFractions,
                currentPercent: this.currentPercent,
                index: this.resizeContext.index
            };
        }
    });
})(n2);