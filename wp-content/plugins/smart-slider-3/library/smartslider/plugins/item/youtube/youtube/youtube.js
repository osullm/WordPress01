N2Require('ItemYoutube', ['Item'], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    function ItemYoutube() {
        this.type = 'youtube';
        this.needSize = true;
        scope.Item.prototype.constructor.apply(this, arguments);
    };

    ItemYoutube.prototype = Object.create(scope.Item.prototype);
    ItemYoutube.prototype.constructor = ItemYoutube;

    ItemYoutube.prototype.added = function () {
        this.needFill = ['youtubeurl', 'image', 'start'];

        nextend.smartSlider.generator.registerField($('#item_youtubeyoutubeurl'));
        nextend.smartSlider.generator.registerField($('#item_youtubeimage'));
        nextend.smartSlider.generator.registerField($('#item_youtubestart'));
    };

    ItemYoutube.prototype.getName = function (data) {
        return data.youtubeurl;
    };

    ItemYoutube.prototype.parseAll = function (data) {

        var youTubeChanged = this.values.youtubeurl != data.youtubeurl;

        scope.Item.prototype.parseAll.apply(this, arguments);

        if (data.image == '') {
            data.image = '$system$/images/placeholder/video.png';
        }

        data.image = nextend.imageHelper.fixed(data.image);

        if (youTubeChanged) {
            var youtubeRegexp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/,
                youtubeMatch = data.youtubeurl.match(youtubeRegexp);

            if (youtubeMatch) {
                NextendAjaxHelper.getJSON('https://www.googleapis.com/youtube/v3/videos?id=' + encodeURI(youtubeMatch[2]) + '&part=snippet&key=AIzaSyC3AolfvPAPlJs-2FgyPJdEEKS6nbPHdSM').done($.proxy(function (_data) {
                    if (_data.items.length) {

                        var thumbnails = _data.items[0].snippet.thumbnails,
                            thumbnail = thumbnails.maxres || thumbnails.standard || thumbnails.high || thumbnails.medium || thumbnails.default,
                            url = thumbnail.url;
                        if (this.values.youtubeurl == '{video_url}') {
                            url = url.replace(youtubeMatch[2], '{video_id}');
                        }
                        $('#item_youtubeimage').val(url).trigger('change');
                    }
                }, this)).fail(function (data) {
                    nextend.notificationCenter.error(data.error.errors[0].message);
                });
            } else {
                nextend.notificationCenter.error('The provided URL does not match any known YouTube url or code!');
            }
        }
    };

    ItemYoutube.prototype.fitLayer = function () {
        return true;
    };

    ItemYoutube.prototype._render = function (node, data) {
        if (!parseInt(data.playbutton)) {
            node.find('.n2-video-play').remove();
        }
        return node;
    };

    ItemYoutube.prototype._render = function (data) {

        var $node = $('<div class="n2-ow"></div>').css({
            width: '100%',
            height: '100%',
            minHeight: '50px',
            background: 'url(' + data.image + ') no-repeat 50% 50%',
            backgroundSize: 'cover'
        });

        if (parseInt(data.playbutton)) {
            $('<div class="n2-video-play n2-ow"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><g fill="none" fill-rule="evenodd"><circle cx="24" cy="24" r="24" fill="#000" opacity=".6"/><path fill="#FFF" d="M19.8 32c-.124 0-.247-.028-.36-.08-.264-.116-.436-.375-.44-.664V16.744c.005-.29.176-.55.44-.666.273-.126.592-.1.84.07l10.4 7.257c.2.132.32.355.32.595s-.12.463-.32.595l-10.4 7.256c-.14.1-.31.15-.48.15z"/></g></svg></div>')
                .appendTo($node);
        }

        this.$item.append($node);
    };

    return ItemYoutube;
});