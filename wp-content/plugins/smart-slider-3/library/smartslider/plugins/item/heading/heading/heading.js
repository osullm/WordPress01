N2Require('ItemHeading', ['Item'], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    function ItemHeading() {
        this.type = 'heading';
        scope.Item.prototype.constructor.apply(this, arguments);
    }

    ItemHeading.prototype = Object.create(scope.Item.prototype);
    ItemHeading.prototype.constructor = ItemHeading;

    ItemHeading.prototype.getDefault = function () {
        return {
            link: '#|*|_self',
            font: '',
            style: ''
        }
    };

    ItemHeading.prototype.added = function () {
        this.needFill = ['heading'];

        this.addedFont('hover', 'font');
        this.addedStyle('heading', 'style');

        smartSlider.generator.registerField($('#item_headingheading'));
        smartSlider.generator.registerField($('#linkitem_headinglink_0'));

    };

    ItemHeading.prototype.getName = function (data) {
        return data.heading;
    };

    ItemHeading.prototype.parseAll = function (data) {
        data.uid = $.fn.uid();

        var link = data.link.split('|*|');
        data.url = link[0];
        data.target = link[1];
        delete data.link;


        if (data.fullwidth | 0) {
            data.display = 'block';
        } else {
            data.display = 'inline-block';
        }

        data.extrastyle = data.nowrap | 0 ? 'white-space: nowrap;' : '';

        data.heading = $('<div>' + data.heading + '</div>').text().replace(/\n/g, '<br />');
        data.priority = 2;
        data.class = '';
    

        scope.Item.prototype.parseAll.apply(this, arguments);

        if (data['url'] == '#' || data['url'] == '') {
            data['afontclass'] = '';
            data['astyleclass'] = '';
        } else {
            data['afontclass'] = data['fontclass'];
            data['fontclass'] = '';
            data['astyleclass'] = data['styleclass'];
            data['styleclass'] = '';
        }
    };

    ItemHeading.prototype._render = function (data) {
        var $node = $('<div class="n2-ow" />'),
            $heading = $('<div id="' + data.uid + '" style="' + data.extrastyle + '"></div>')
                .addClass('n2-ow ' + data.fontclass + ' ' + data.styleclass + ' ' + data.class)
                .css({
                    display: data.display
                }).appendTo($node);

        if (data['url'] == '#' || data['url'] == '') {
            $heading.html(data.heading);
        } else {
            $heading.append($('<a style="display:' + data.display + ';" href="#" class="' + data.afontclass + ' ' + data.astyleclass + ' n2-ow" onclick="return false;">' + data.heading + '</a>'));
        }

        this.$item.append($node);
    };

    return ItemHeading;
});