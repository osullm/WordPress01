N2Require('ItemVimeo', ['Item'], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    function ItemVimeo() {
        this.type = 'vimeo';
        this.needSize = true;
        scope.Item.prototype.constructor.apply(this, arguments);
    };

    ItemVimeo.prototype = Object.create(scope.Item.prototype);
    ItemVimeo.prototype.constructor = ItemVimeo;

    ItemVimeo.prototype.added = function () {
        this.needFill = ['vimeourl'];

        nextend.smartSlider.generator.registerField($('#item_vimeovimeourl'));
    };

    ItemVimeo.prototype.getName = function (data) {
        return data.vimeourl;
    };

    ItemVimeo.prototype.parseAll = function (data) {
        var vimeoChanged = this.values.vimeourl != data.vimeourl;

        scope.Item.prototype.parseAll.apply(this, arguments);

        if (data.image == '') {
            data.image = '$system$/images/placeholder/video.png';
        }

        data.image = nextend.imageHelper.fixed(data.image);

        if (vimeoChanged && data.vimeourl != '') {
            var vimeoRegexp = /https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/,
                vimeoMatch = data.vimeourl.match(vimeoRegexp);

            var videoCode = false;
            if (vimeoMatch) {
                videoCode = vimeoMatch[3];
            } else if (data.vimeourl.match(/^[0-9]+$/)) {
                videoCode = data.vimeourl;
            }

            if (videoCode) {
                NextendAjaxHelper.getJSON('https://vimeo.com/api/v2/video/' + encodeURI(videoCode) + '.json').done($.proxy(function (data) {
                    $('#item_vimeoimage').val(data[0].thumbnail_large).trigger('change');
                }, this)).fail(function (data) {
                    nextend.notificationCenter.error(data.responseText);
                });
            } else {
                nextend.notificationCenter.error('The provided URL does not match any known Vimeo url or code!');
            }
        }
    };

    ItemVimeo.prototype._render = function (data) {

        var $node = $('<div class="n2-ow"></div>').css({
            width: '100%',
            height: '100%',
            minHeight: '50px',
            background: 'url(' + data.image + ') no-repeat 50% 50%',
            backgroundSize: 'cover'
        });

        $('<div class="n2-video-play n2-ow"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><g fill="none" fill-rule="evenodd"><circle cx="24" cy="24" r="24" fill="#000" opacity=".6"/><path fill="#FFF" d="M19.8 32c-.124 0-.247-.028-.36-.08-.264-.116-.436-.375-.44-.664V16.744c.005-.29.176-.55.44-.666.273-.126.592-.1.84.07l10.4 7.257c.2.132.32.355.32.595s-.12.463-.32.595l-10.4 7.256c-.14.1-.31.15-.48.15z"/></g></svg></div>')
            .appendTo($node);

        this.$item.append($node);
    };

    ItemVimeo.prototype.fitLayer = function () {
        return true;
    };

    return ItemVimeo;
});