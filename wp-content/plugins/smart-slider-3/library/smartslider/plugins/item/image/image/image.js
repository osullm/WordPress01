N2Require('ItemImage', ['Item'], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    function ItemImage() {
        this.type = 'image';
        scope.Item.prototype.constructor.apply(this, arguments);
    };

    ItemImage.prototype = Object.create(scope.Item.prototype);
    ItemImage.prototype.constructor = ItemImage;

    ItemImage.prototype.getDefault = function () {
        return {
            size: 'auto|*|auto',
            link: '#|*|_self',
            style: ''
        }
    };

    ItemImage.prototype.added = function () {
        this.needFill = ['image'];

        this.addedStyle('box', 'style');

        nextend.smartSlider.generator.registerField($('#item_imageimage'));
        nextend.smartSlider.generator.registerField($('#item_imagealt'));
        nextend.smartSlider.generator.registerField($('#item_imagetitle'));
        nextend.smartSlider.generator.registerField($('#linkitem_imagelink_0'));
    };

    ItemImage.prototype.getName = function (data) {
        return data.image.split('/').pop();
    };

    ItemImage.prototype.parseAll = function (data) {
        var size = data.size.split('|*|');
        data.width = size[0];
        data.height = size[1];
        delete data.size;

        var link = data.link.split('|*|');
        data.url = link[0];
        data.target = link[1];
        delete data.link;

        scope.Item.prototype.parseAll.apply(this, arguments);

        if (data.image != this.values.image) {
            data.image = nextend.imageHelper.fixed(data.image);

            if (this.layer.placement.getType() == 'absolute') {
                this.resizeLayerToImage(data.image);
            }
        } else {
            data.image = nextend.imageHelper.fixed(data.image);
        }

    };

    ItemImage.prototype.fitLayer = function () {
        if (this.layer.placement.getType() == 'absolute') {
            this.resizeLayerToImage(nextend.imageHelper.fixed(this.values.image));
        }
        return true;
    };

    ItemImage.prototype._render = function (data) {

        var $node = $('<div class="' + data.styleclass + ' n2-ss-img-wrapper n2-ow" style="overflow:hidden"></div>'),
            $a = $node;

        if (data['url'] != '#' && data['url'] != '') {
            $a = $('<a href="#" class="n2-ow" onclick="return false;" style="display: block;background: none !important;"></a>').appendTo($node);
        }

        $('<img class="n2-ow ' + data.cssclass + '" src="' + data.image + '"/>').css({
            display: 'inline-block',
            maxWidth: '100%',
            width: data.width,
            height: data.height
        }).appendTo($a);

        this.$item.append($node);
    };

    return ItemImage;
});