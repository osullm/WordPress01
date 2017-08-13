(function ($) {

    $.widget("ui.nextendAutocomplete", $.ui.autocomplete, {
        _renderMenu: function (ul, items) {
            ul.removeAttr('tabindex').addClass('n2 n2-ui-autocomplete');


            ul.on('mousedown', $.proxy(nextend.context.setMouseDownArea, nextend.context, 'nextendAutocomplete')).on('DOMMouseScroll mousewheel', function (e) {
                e.stopPropagation();
            });

            $(window).add('.n2-scrollable').on('scroll.n2-autocomplete', $.proxy(function () {
                ul.position($.extend({of: this.element}, this.options.position))
            }, this));

            var that = this;
            $.each(items, function (index, item) {
                that._renderItemData(ul, item);
            });
        },
        _resizeMenu: function () {
            this.menu.element.outerWidth(this.element.outerWidth(true));
        },
        close: function () {
            $(window).add('.n2-scrollable').off('.n2-autocomplete');
            this._superApply(arguments);
        }
    });



})(n2);