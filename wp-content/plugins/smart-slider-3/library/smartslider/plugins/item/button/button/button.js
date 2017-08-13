N2Require('ItemButton', ['Item'], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    function ItemButton() {
        this.type = 'button';
        scope.Item.prototype.constructor.apply(this, arguments);
    };

    ItemButton.prototype = Object.create(scope.Item.prototype);
    ItemButton.prototype.constructor = ItemButton;

    ItemButton.prototype.added = function () {
        this.needFill = ['content'];
        this.addedFont('link', 'font');
        this.addedStyle('button', 'style');

        nextend.smartSlider.generator.registerField($('#item_buttoncontent'));
        nextend.smartSlider.generator.registerField($('#linkitem_buttonlink_0'));
    };

    ItemButton.prototype.getName = function (data) {
        return data.content;
    };

    ItemButton.prototype.parseAll = function (data) {
        var link = data.link.split('|*|');
        data.url = link[0];
        data.target = link[1];
        delete data.link;

        data.classes = '';

        if (data.fullwidth | 0) {
            data.classes += ' n2-ss-fullwidth';
        }

        if (data.nowrap | 0) {
            data.classes += ' n2-ss-nowrap';
        }

        scope.Item.prototype.parseAll.apply(this, arguments);
    };

    ItemButton.prototype._render = function (data) {
        var $node = $('<div class="n2-ss-button-container n2-ow ' + data.fontclass + ' ' + data.classes + '" />'),
            $link = $('<a href="#" onclick="return false;" class="' + data.styleclass + ' ' + data.class + ' n2-ow"></a>').appendTo($node),
            $label = $('<span><span>' + data.content + '</span></span>').appendTo($link);

        this.$item.append($node);
    };

    return ItemButton;
});