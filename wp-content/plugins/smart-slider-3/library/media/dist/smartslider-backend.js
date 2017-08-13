N2Require('ContextMenu', [], [], function ($, scope, undefined) {

    function ContextMenu($el, parameters) {
        this.isActive = false;
        this.$el = $el.data('nextendcontextmenu', this);
        this.parameters = $.extend({
            selector: false,
            onShow: function () {
            }
        }, parameters);

        this.$menu = $('<div class="n2-context-menu"></div>').on('mousedown', function () {
            nextend.context.setMouseDownArea('context-menu');
        }).appendTo('body');
        if (this.parameters.selector) {
            this.$el.on('contextmenu', this.parameters.selector, $.proxy(this.onShowContextMenu, this));
        } else {
            this.$el.on('contextmenu', $.proxy(this.onShowContextMenu, this));
        }
    };

    ContextMenu.prototype.onShowContextMenu = function (e) {
        e.preventDefault();
        this.clearItems();
        this.parameters.onShow.call(this, e, this);
        if (this.hasItems) {
            e.stopPropagation();
            this.isActive = true;
            this.$menu.css({
                left: e.pageX,
                top: e.pageY
            });

            $('html').on('mouseleave.nextendcontextmenu, click.nextendcontextmenu', $.proxy(this.onHide, this));
        }
        this.$menu.toggleClass('n2-active', this.hasItems);
    }

    ContextMenu.prototype.onHide = function () {
        $('html').off('.nextendcontextmenu');
        this.$menu.removeClass('n2-active');
        this.isActive = false;
    }

    ContextMenu.prototype.clearItems = function () {
        if (this.isActive) {
            this.onHide();
        }
        this.hasItems = false;
        this.$menu.html('');
    }

    ContextMenu.prototype.addItem = function (label, icon, action) {
        this.hasItems = true;
        this.$menu.append($('<div><i class="n2-i ' + icon + '"></i><span>' + label + '</span></div>').on('click', action));
    }

    $.fn.nextendContextMenu = function (parameters) {
        return this.each(function () {
            new ContextMenu($(this), parameters);
        });
    };

    return ContextMenu;
});

N2Require('Zoom', [], [], function ($, scope, undefined) {

    var zoom = null;
    nextend['ssBeforeResponsive'] = function () {
        zoom = new Zoom(this);
        nextend['ssBeforeResponsive'] = function () {
            zoom.add(this);
        };
    };

    function Zoom(responsive) {

        this.key = 'n2-ss-editor-device-lock-mode';
        this.devices = {
            unknownUnknown: $('<div />')
        };
        this.responsives = [responsive];
        responsive.setOrientation('portrait');
        responsive.parameters.onResizeEnabled = 0;
        responsive.parameters.forceFull = 0; // We should disable force full feature on admin dashboard as it won't render before the sidebar
        responsive._getDevice = responsive._getDeviceZoom;

        this.lock = $('#n2-ss-lock').on('click', $.proxy(this.switchLock, this));

        var desktopWidth = responsive.parameters.sliderWidthToDevice['desktopPortrait'];

        this.container = responsive.containerElement.closest('.n2-ss-container-device').addBack();
        this.container.width(desktopWidth);
        this.containerWidth = desktopWidth;

        this.initZoom();

        var tr = $('#n2-ss-devices .n2-tr'),
            modes = responsive.parameters.deviceModes;

        this.devices.desktopPortrait = $('<div class="n2-td n2-panel-option" data-device="desktop" data-orientation="portrait"><i class="n2-i n2-it n2-i-v-desktop"></i></div>').prependTo(tr);
        if (modes.desktopLandscape) {
            this.devices.desktopLandscape = $('<div class="n2-td n2-panel-option" data-device="desktop" data-orientation="landscape"><i class="n2-i n2-it n2-i-v-desktop-landscape"></i></div>').prependTo(tr);
        } else {
            this.devices.desktopLandscape = this.devices.desktopPortrait;
        }

        if (modes.tabletPortrait) {
            this.devices.tabletPortrait = $('<div class="n2-td n2-panel-option" data-device="tablet" data-orientation="portrait"><i class="n2-i n2-it n2-i-v-tablet"></i></div>').prependTo(tr);
        } else {
            this.devices.tabletPortrait = this.devices.desktopPortrait;
        }
        if (modes.tabletLandscape) {
            this.devices.tabletLandscape = $('<div class="n2-td n2-panel-option" data-device="tablet" data-orientation="landscape"><i class="n2-i n2-it n2-i-v-tablet-landscape"></i></div>').prependTo(tr);
        } else {
            this.devices.tabletLandscape = this.devices.desktopLandscape;
        }

        if (modes.mobilePortrait) {
            this.devices.mobilePortrait = $('<div class="n2-td n2-panel-option" data-device="mobile" data-orientation="portrait"><i class="n2-i n2-it n2-i-v-mobile"></i></div>').prependTo(tr);
        } else {
            this.devices.mobilePortrait = this.devices.tabletPortrait;
        }
        if (modes.mobileLandscape) {
            this.devices.mobileLandscape = $('<div class="n2-td n2-panel-option" data-device="mobile" data-orientation="landscape"><i class="n2-i n2-it n2-i-v-mobile-landscape"></i></div>').prependTo(tr);
        } else {
            this.devices.mobileLandscape = this.devices.tabletLandscape;
        }

        this.deviceOptions = $('#n2-ss-devices .n2-panel-option');

        //$('#n2-ss-devices').css('width', (this.deviceOptions.length * 62) + 'px');

        this.deviceOptions.each($.proxy(function (i, el) {
            $(el).on({
                mousedown: $.proxy(nextend.context.setMouseDownArea, nextend.context, 'zoomDeviceClicked'),
                click: $.proxy(this.setDeviceMode, this)
            });
        }, this));

        responsive.sliderElement.on('SliderDeviceOrientation', $.proxy(this.onDeviceOrientationChange, this));
    };

    Zoom.prototype.add = function (responsive) {

        this.responsives.push(responsive);
        responsive.setOrientation('portrait');
        responsive.parameters.onResizeEnabled = 0;
        responsive.parameters.forceFull = 0; // We should disable force full feature on admin dashboard as it won't render before the sidebar
        responsive._getDevice = responsive._getDeviceZoom;

        //responsive.sliderElement.on('SliderDeviceOrientation', $.proxy(this.onDeviceOrientationChange, this));
    }

    Zoom.prototype.onDeviceOrientationChange = function (e, modes) {
        $('#n2-admin').removeClass('n2-ss-mode-' + modes.lastDevice + modes.lastOrientation)
            .addClass('n2-ss-mode-' + modes.device + modes.orientation);
        this.devices[modes.lastDevice + modes.lastOrientation].removeClass('n2-active');
        this.devices[modes.device + modes.orientation].addClass('n2-active');
    };

    Zoom.prototype.setDeviceMode = function (e) {
        var el = $(e.currentTarget);
        if ((e.ctrlKey || e.metaKey) && nextend.smartSlider.canvasManager) {
            var orientation = el.data('orientation');
            nextend.smartSlider.canvasManager.copyOrResetMode(el.data('device') + orientation[0].toUpperCase() + orientation.substr(1));
        } else {
            for (var i = 0; i < this.responsives.length; i++) {
                this.responsives[i].setOrientation(el.data('orientation'));
                this.responsives[i].setMode(el.data('device'), this.responsives[i]);
            }
        }
    };

    Zoom.prototype.switchLock = function (e) {
        e.preventDefault();
        this.lock.toggleClass('n2-active');
        if (this.lock.hasClass('n2-active')) {
            this.setZoomSyncMode();
            this.zoomChange(e, this.zoom.slider("value"), 'sync', false);

            $.jStorage.set(this.key, 'sync');
        } else {
            this.setZoomFixMode();
            $.jStorage.set(this.key, 'fix');
        }
    };

    Zoom.prototype.initZoom = function () {
        var zoom = $("#n2-ss-slider-zoom");
        if (zoom.length > 0) {

            if (typeof zoom[0].slide !== 'undefined') {
                zoom[0].slide = null;
            }

            this.zoom =
                zoom.removeAttr('slide').prop('slide', false).slider({
                    range: "min",
                    step: 1,
                    value: 1,
                    min: 0,
                    max: 102
                });

            this.responsives[0].sliderElement.on('SliderResize', $.proxy(this.sliderResize, this));

            if ($.jStorage.get(this.key, 'sync') == 'fix') {
                this.setZoomFixMode();
            } else {
                this.setZoomSyncMode();
                this.lock.addClass('n2-active');
            }
        }
    };

    Zoom.prototype.sliderResize = function (e, ratios) {
        this.setZoom();
    };

    Zoom.prototype.setZoomFixMode = function () {
        this.zoom.off('.n2-ss-zoom')
            .on({
                'slide.n2-ss-zoom': $.proxy(this.zoomChangeFixMode, this),
                'slidechange.n2-ss-zoom': $.proxy(this.zoomChangeFixMode, this)
            });
    };

    Zoom.prototype.setZoomSyncMode = function () {

        this.zoom.off('.n2-ss-zoom')
            .on({
                'slide.n2-ss-zoom': $.proxy(this.zoomChangeSyncMode, this),
                'slidechange.n2-ss-zoom': $.proxy(this.zoomChangeSyncMode, this)
            });
    };

    Zoom.prototype.zoomChangeFixMode = function (event, ui) {
        this.zoomChange(event, ui.value, 'fix', ui);
    };

    Zoom.prototype.zoomChangeSyncMode = function (event, ui) {
        this.zoomChange(event, ui.value, 'sync', ui);
    };

    Zoom.prototype.zoomChange = function (event, value, mode, ui) {
        var width;
        if (event.originalEvent !== undefined) {
            var ratio = 1;
            if (value < 50) {
                ratio = nextend.smallestZoom / this.containerWidth + Math.max(value / 50, 0) * (1 - nextend.smallestZoom / this.containerWidth);
            } else if (value > 52) {
                ratio = 1 + (value - 52) / 50;
            }
            width = parseInt(ratio * this.containerWidth);
            this.container.width(width);

            for (var i = 1; i < this.responsives.length; i++) {
                this.responsives[i].containerElement.width(width);
            }

            for (var i = 0; i < this.responsives.length; i++) {
                switch (mode) {
                    case 'sync':
                        this.responsives[i].doResize();
                        break;
                    default:
                        this.responsives[i].doResize(true);
                        break;
                }
            }
        } else {
            width = this.container.last().width();
            this.container.width(width);
        }
        if (ui) {
            ui.handle.innerHTML = width + 'px';
        }
    };

    Zoom.prototype.setZoom = function () {
        var ratio = this.responsives[0].containerElement.width() / this.containerWidth;
        var v = 50;
        if (ratio < 1) {
            v = (ratio - nextend.smallestZoom / this.containerWidth) / (1 - nextend.smallestZoom / this.containerWidth) * 50;
        } else if (ratio > 1) {
            v = (ratio - 1) * 50 + 52;
        }
        var oldValue = this.zoom.slider('value');
        this.zoom.slider('value', v);
    };

    return Zoom;
});
N2Require('CreateSlider', [], [], function ($, scope, undefined) {

    function CreateSlider(groupID, ajaxUrl) {
        this.addToGroupModal = null;
        this.groupID = groupID;
        this.ajaxUrl = ajaxUrl;
        $('.n2-ss-create-slider').click($.proxy(function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            this.showModal();
        
        }, this));

        this.notificationStack = new NextendNotificationCenterStackModal($('body'));
        $('.n2-ss-add-sample-slider').click($.proxy(function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            this.showDemoSliders();
        

        }, this));

        if (window.location.hash.substring(1) == 'createslider') {
            this.showModal();
        }
    }

    CreateSlider.prototype.showModal = function () {
        if (!this.createSliderModal) {
            var that = this;
            var ajaxUrl = this.ajaxUrl;
            var presets = [];

            presets.push({
                key: 'default',
                name: n2_('Default'),
                image: '$ss$/admin/images/sliderpresets/default.png'
            });
            presets.push({
                key: 'fullwidth',
                name: n2_('Full width'),
                image: '$ss$/admin/images/sliderpresets/fullwidth.png'
            });
            presets.push({
                key: 'thumbnailhorizontal',
                name: n2_('Thumbnail - horizontal'),
                image: '$ss$/admin/images/sliderpresets/thumbnailhorizontal.png'
            });
            this.createSliderModal = new NextendModal({
                zero: {
                    size: [
                        N2SSPRO ? 750 : 550,
                        N2SSPRO ? 630 : 390 + 130
                    ],
                    title: n2_('Create Slider'),
                    back: false,
                    close: true,
                    content: '<form class="n2-form"></form>',
                    controls: [
                        '<a href="#" class="n2-button n2-button-normal n2-button-l n2-radius-s n2-button-green n2-uc n2-h4">' + n2_('Create') + '</a>'
                    ],
                    fn: {
                        show: function () {

                            var button = this.controls.find('.n2-button-green'),
                                form = this.content.find('.n2-form').on('submit', function (e) {
                                    e.preventDefault();
                                    button.trigger('click');
                                });

                            form.append(this.createInput(n2_('Slider name'), 'createslidertitle', 'width: 240px;'));
                            form.append(this.createInputUnit(n2_('Width'), 'createsliderwidth', 'px', 'width: 30px;'));
                            form.append(this.createInputUnit(n2_('Height'), 'createsliderheight', 'px', 'width: 30px;'));

                            new N2Classes.FormElementAutocompleteSimple("createsliderwidth", ["1920", "1200", "1000", "800", "600", "400"]);
                            new N2Classes.FormElementAutocompleteSimple("createsliderheight", ["800", "600", "500", "400", "300", "200"]);

                            var sliderTitle = $('#createslidertitle').val(n2_('Slider')).focus(),
                                sliderWidth = $('#createsliderwidth').val(1200),
                                sliderHeight = $('#createsliderheight').val(500);

                            sliderWidth.parent().addClass('n2-form-element-autocomplete ui-front');
                            sliderHeight.parent().addClass('n2-form-element-autocomplete ui-front');

                            this.createHeading(n2_('Preset')).appendTo(this.content);

                            var imageRadio = this.createImageRadio(presets)
                                    .css('height', N2SSPRO ? 360 : 100)
                                    .appendTo(this.content),
                                sliderPreset = imageRadio.find('input');
                            imageRadio.css('overflow', 'hidden');
                            this.createHeading(n2_('Import Sample Sliders')).appendTo(this.content);
                            $('<div class="n2-ss-create-slider-free-sample" style="background-image: url(\'' + nextend.imageHelper.fixed('$ss$/admin/images/free/sample1.png') + '\')"></div><div class="n2-ss-create-slider-free-sample" style="background-image: url(\'' + nextend.imageHelper.fixed('$ss$/admin/images/free/sample2.png') + '\')"></div><div class="n2-ss-create-slider-free-sample" style="background-image: url(\'' + nextend.imageHelper.fixed('$ss$/admin/images/free/sample3.png') + '\')"></div>')
                                .on('click', $.proxy(function () {
                                    this.hide();
                                    that.showDemoSliders();
                                }, this))
                                .appendTo(this.content);
                        

                            button.on('click', $.proxy(function () {

                                NextendAjaxHelper.ajax({
                                    type: "POST",
                                    url: NextendAjaxHelper.makeAjaxUrl(ajaxUrl, {
                                        nextendaction: 'create'
                                    }),
                                    data: {
                                        groupID: that.groupID,
                                        sliderTitle: sliderTitle.val(),
                                        sliderSizeWidth: sliderWidth.val(),
                                        sliderSizeHeight: sliderHeight.val(),
                                        preset: sliderPreset.val()
                                    },
                                    dataType: 'json'
                                }).done($.proxy(function (response) {
                                    NextendAjaxHelper.startLoading();
                                }, this));

                            }, this));
                        }
                    }
                }
            });
        }
        this.createSliderModal.show();
    };

    CreateSlider.prototype.showDemoSliders = function () {
        var that = this;
        $('body').css('overflow', 'hidden');
        var pro = 0;
        var frame = $('<iframe src="//smartslider3.com/demo-import/?pro=' + pro + '&version=' + N2SS3VERSION + '&utm_campaign=' + N2SS3C + '&utm_source=import-slider-frame&utm_medium=smartslider-' + N2PLATFORM + '-' + (pro ? 'pro' : 'free') + '" frameborder="0"></iframe>').css({
                position: 'fixed',
                zIndex: 100000,
                left: 0,
                top: 0,
                width: '100%',
                height: '100%'
            }).appendTo('body'),
            closeFrame = function () {
                $('body').css('overflow', '');
                frame.remove();
                window.removeEventListener("message", listener, false);
                that.notificationStack.popStack();
            },
            importSlider = function (href) {
                NextendAjaxHelper.ajax({
                    type: "POST",
                    url: NextendAjaxHelper.makeAjaxUrl(that.ajaxUrl, {
                        nextendaction: 'importDemo'
                    }),
                    data: {
                        groupID: that.groupID,
                        key: Base64.encode(href.replace(/^(http(s)?:)?\/\//, '//'))
                    },
                    dataType: 'json'
                }).fail(function () {
                    //closeFrame();
                });
            },
            listener = function (e) {
                if (e.origin !== "http://smartslider3.com" && e.origin !== "https://smartslider3.com")
                    return;
                var msg = e.data;
                switch (msg.key) {
                    case 'importSlider':
                        if (typeof nextend.joinCommunity === 'function') {
                            nextend.joinCommunity(function () {
                                importSlider(msg.data.href);
                            });
                        } else {
                            importSlider(msg.data.href);
                        }
                    
                        return;

                        break;
                    case 'closeWindow':
                        closeFrame();
                }
            };

        this.notificationStack.enableStack();
        NextendEsc.add($.proxy(function () {
            closeFrame();
            return true;
        }, this));

        window.addEventListener("message", listener, false);
    };

    return CreateSlider;
});
N2Require('ManageSliders', [], [], function ($, scope, undefined) {

    function ManageSliders(groupID, ajaxUrl) {
        this.preventSort = false;
        this.groupID = groupID;
        this.ajaxUrl = ajaxUrl;
        this.sliders = [];
        this.sliderPanel = $('#n2-ss-slider-container');
        this.orderBy = this.sliderPanel.data('orderby') == 'ordering' ? true : false;
        this.slidersContainer = this.sliderPanel.find('.n2-ss-sliders-container');

        var sliders = this.slidersContainer.find('.n2-ss-box-slider');
        for (var i = 0; i < sliders.length; i++) {
            this.sliders.push(new scope.Slider(this, sliders.eq(i)));
        }

        this.changed();

        this.initMenu();

        this.initOrderable();

        this.create = new scope.CreateSlider(groupID, ajaxUrl);
        this.initBulk();
    }

    ManageSliders.prototype.changed = function () {

        $('html').attr('data-sliders', this.sliders.length);
    };

    ManageSliders.prototype.initSliders = function () {
        var previousLength = this.sliders.length;
        var sliderNodes = this.slidersContainer.find('.n2-ss-box-slider'),
            sliders = [];
        for (var i = 0; i < sliderNodes.length; i++) {
            var slider = sliderNodes.eq(i).data('slider');
            sliders.push(slider);
        }
        this.sliders = sliders;
        this.changed();
        $(window).triggerHandler('SmartSliderSidebarSlidersChanged');
    };

    ManageSliders.prototype.initOrderable = function () {
        if (this.orderBy) {
            this.slidersContainer.sortable({
                helper: 'clone',
                forcePlaceholderSize: false,
                tolerance: "pointer",
                connectWith: '.n2-ss-box-slider-group',
                items: ".n2-ss-box-slider",
                start: function (event, ui) {
                    ui.item.show();
                },
                stop: $.proxy(this.saveOrder, this),
                placeholder: 'n2-box-sortable-placeholder',
                distance: 10
            });
        }
    };

    ManageSliders.prototype.saveOrder = function (e) {
        if (this.preventSort) {
            this.slidersContainer.sortable("cancel");
            this.preventSort = false;
            return;
        }
        var sliderNodes = this.slidersContainer.find('.n2-ss-box-slider'),
            sliders = [],
            ids = [],
            originalIds = [];
        for (var i = 0; i < sliderNodes.length; i++) {
            var slider = sliderNodes.eq(i).data('slider');
            sliders.push(slider);
            ids.push(slider.getId());
        }
        for (var i = 0; i < this.sliders.length; i++) {
            originalIds.push(this.sliders[i].getId());
        }

        if (JSON.stringify(originalIds) != JSON.stringify(ids)) {
            $(window).triggerHandler('SmartSliderSidebarSlidersOrderChanged');
            var queries = {
                nextendcontroller: 'sliders',
                nextendaction: 'order'
            };
            NextendAjaxHelper.ajax({
                type: 'POST',
                url: NextendAjaxHelper.makeAjaxUrl(this.ajaxUrl, queries),
                data: {
                    groupID: this.groupID,
                    sliderorder: ids,
                    isReversed: (this.sliderPanel.data('orderbydirection') == 'DESC' ? 1 : 0)
                }
            });
            this.sliders = sliders;
        }
    };


    ManageSliders.prototype.initMenu = function () {
        this.slider = null;
        this.menu = $('#n2-ss-slider-menu').detach().addClass('n2-inited');

        this.menuActions = {
            addToGroup: this.menu.find('.n2-ss-add-to-group').on('click', $.proxy(function (e) {
                e.stopPropagation();
                e.preventDefault();
                this.addToGroup([this.slider.getId()]);
            }, this)),
            removeFromGroup: this.menu.find('.n2-ss-remove-from-group').on('click', $.proxy(function (e) {
                e.stopPropagation();
                e.preventDefault();
                this.removeFromGroup([this.slider.getId()]);
            }, this)),
            duplicate: this.menu.find('.n2-ss-duplicate').on('click', $.proxy(function (e) {
                this.slider.duplicate(e);
            }, this)),
            'delete': this.menu.find('.n2-ss-delete').on('click', $.proxy(function (e) {
                this.slider.delete(e);
            }, this)),
            preview: this.menu.find('.n2-ss-preview').on('click', $.proxy(function (e) {
                this.slider.preview(e);
            }, this)),
        }

        this.menu.find('.n2-button').on('click', $.proxy(function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (this.menu.hasClass('n2-active')) {
                this.menu.removeClass('n2-active').off('mouseleave');
            } else {
                this.menu.addClass('n2-active').on('mouseleave', function () {
                    $(this).removeClass('n2-active');
                });
            }
        }, this));
    }


    ManageSliders.prototype.showMenu = function (slider) {
        this.slider = slider;
        this.menu.appendTo(slider.box);
    }

    ManageSliders.prototype.hideMenu = function () {
        if (this.menu.hasClass('n2-active')) {
            this.menu.removeClass('n2-active').off('mouseleave');
        }
        this.menu.detach();
    }

    ManageSliders.prototype.deleteSliders = function (ids, sliders) {
        this.hideMenu();
        var title = sliders[0].box.find('.n2-box-placeholder-title a').text();
        if (sliders.length > 1) {
            title += ' and ' + (sliders.length - 1) + ' more';
        }
        NextendDeleteModal('slider-delete', title, $.proxy(function () {
            NextendAjaxHelper.ajax({
                url: NextendAjaxHelper.makeAjaxUrl(this.ajaxUrl, {
                    nextendcontroller: 'sliders',
                    nextendaction: 'delete'
                }),
                type: 'POST',
                data: {
                    sliders: ids
                }
            }).done($.proxy(function () {
                for (var i = 0; i < sliders.length; i++) {
                    sliders[i].deleted();
                }
                this.initSliders();
                this.leaveBulk();
            }, this));
        }, this));
    };

    ManageSliders.prototype.duplicateSliders = function (ids, slides) {
        for (var i = 0; i < this.sliders.length; i++) {
            if (this.sliders[i].selected) {
                this.sliders[i].duplicate($.Event("click", {
                    currentTarget: null
                }));
            }
        }
    };

    ManageSliders.prototype.exportSliders = function (ids, sliders) {

        window.location.href = (NextendAjaxHelper.makeFallbackUrl(this.ajaxUrl, {
            nextendcontroller: 'sliders',
            nextendaction: 'exportAll'
        }) + '&' + $.param({sliders: ids, currentGroupID: this.groupID}));
    };


    ManageSliders.prototype.initBulk = function () {

        this.selection = [];

        this.isBulkSelection = false;

        var selects = $('.n2-bulk-select').find('a');

        //Select all
        selects.eq(0).on('click', $.proxy(function (e) {
            e.preventDefault();
            this.bulkSelect(function (slider) {
                slider.select();
            });
        }, this));

        //Select none
        selects.eq(1).on('click', $.proxy(function (e) {
            e.preventDefault();
            this.bulkSelect(function (slider) {
                slider.deSelect();
            });
        }, this));

        var actions = $('.n2-bulk-actions').find('a')
            .on('click', $.proxy(function (e) {
                e.preventDefault();

                switch ($(e.currentTarget).data('action')) {
                    case 'duplicate':
                        this.bulkAction('duplicateSliders', false);
                        break;
                    case 'delete':
                        this.bulkAction('deleteSliders', false);
                        break;
                    case 'export':
                        this.bulkAction('exportSliders', false);
                        break;
                    case 'addToGroup':
                        this.bulkAction('addToGroup', true);
                        break;
                }
            }, this));
    };

    ManageSliders.prototype.addSelection = function (slider) {
        if (this.selection.length == 0) {
            this.enterBulk();
        }
        this.selection.push(slider);
    }

    ManageSliders.prototype.removeSelection = function (slider) {
        this.selection.splice($.inArray(slider, this.selection), 1);
        if (this.selection.length == 0) {
            this.leaveBulk();
        }
    }

    ManageSliders.prototype.bulkSelect = function (cb) {
        for (var i = 0; i < this.sliders.length; i++) {
            cb(this.sliders[i]);
        }
    };

    ManageSliders.prototype.bulkAction = function (action, skipGroups) {
        var sliders = [],
            ids = [];
        this.bulkSelect(function (slider) {
            if (slider.selected && (!skipGroups || !slider.isGroup)) {
                sliders.push(slider);
                ids.push(slider.getId());
            }
        });
        if (ids.length) {
            this[action](ids, sliders);
            this.leaveBulk();
        } else {
            if (skipGroups) {
                nextend.notificationCenter.notice('Please select one or more sliders for the action!');
            } else {
                nextend.notificationCenter.notice('Please select one or more sliders or groups for the action!');
            }
        }
    };

    ManageSliders.prototype.enterBulk = function () {
        if (!this.isBulkSelection) {
            this.isBulkSelection = true;
            if (this.orderBy) {
                this.slidersContainer.sortable('option', 'disabled', true);
            }
            $('#n2-admin').addClass('n2-ss-has-box-selection');
        }
    };

    ManageSliders.prototype.leaveBulk = function () {
        if (this.isBulkSelection) {
            if (this.orderBy) {
                this.slidersContainer.sortable('option', 'disabled', false);
            }
            $('#n2-admin').removeClass('n2-ss-has-box-selection');

            for (var i = 0; i < this.sliders.length; i++) {
                this.sliders[i].deSelect();
            }
            this.selection = [];
            this.isBulkSelection = false;
        }
    };

    ManageSliders.prototype.removeFromGroup = function (sliders) {
        return NextendAjaxHelper.ajax({
            type: "POST",
            url: NextendAjaxHelper.makeAjaxUrl(this.ajaxUrl, {
                nextendaction: 'removeFromGroup'
            }),
            data: {
                currentGroupID: this.groupID,
                sliders: sliders
            },
            dataType: 'json'
        }).done($.proxy(function (response) {
            for (var i = 0; i < sliders.length; i++) {
                $('[data-sliderid="' + sliders[i] + '"]').data('slider').deleted();
            }
            this.initSliders();
        }, this));
    }

    ManageSliders.prototype._addToGroup = function (action, groupID, sliders) {
        return NextendAjaxHelper.ajax({
            type: "POST",
            url: NextendAjaxHelper.makeAjaxUrl(this.ajaxUrl, {
                nextendaction: 'addToGroup'
            }),
            data: {
                currentGroupID: this.groupID,
                groupID: groupID,
                action: action,
                sliders: sliders
            },
            dataType: 'json'
        }).done($.proxy(function (response) {

            if (action == 'move') {
                for (var i = 0; i < sliders.length; i++) {
                    $('[data-sliderid="' + sliders[i] + '"]').data('slider').deleted();
                }

                this.initSliders();
            }

            var groupCounter = $('[data-sliderid="' + groupID + '"] .n2-box-placeholder-buttons .n2-button-grey');
            groupCounter.html(parseInt(groupCounter.html()) + sliders.length);
        }, this));
    };

    ManageSliders.prototype.addToGroup = function (sliders) {
        var groups = null;
        var that = this;
        var ajaxUrl = this.ajaxUrl;

        var addToGroupModal = new NextendModal({
            zero: {
                size: [
                    350,
                    220
                ],
                title: n2_('Add to group'),
                back: false,
                close: true,
                content: '<form class="n2-form"></form>',
                controls: [
                    '<div class="n2-button n2-button-with-actions n2-button-l n2-button-green n2-radius-s n2-h4"><a class="n2-button-inner" href="#" data-action="move">' + n2_('Move') + '</a>' +
                    '<div class="n2-button-menu-open"><i class="n2-i n2-i-buttonarrow"></i><div class="n2-button-menu"><div class="n2-button-menu-inner n2-border-radius">' +
                    '<a class="n2-h4" href="#" data-action="copy">' + n2_('Copy') + '</a>' +
                    '<a class="n2-h4" href="#" data-action="link">' + n2_('Link') + '</a>' +
                    '</div></div></div></div>',
                ],
                fn: {
                    show: function () {

                        this.controls.find(".n2-button-menu-open").n2opener();

                        var button = this.controls.find('a'),
                            form = this.content.find('.n2-form').on('submit', function (e) {
                                e.preventDefault();
                                button.eq(0).trigger('click');
                            });

                        form.append(this.createSelect(n2_('Group'), 'choosegroup', groups, 'width:300px;'));

                        var choosegroup = $('#choosegroup');

                        button.on('click', $.proxy(function (e) {

                            e.preventDefault();

                            that._addToGroup($(e.currentTarget).data('action'), choosegroup.val(), sliders)
                                .done($.proxy(function () {
                                    this.hide(e);
                                }, this));

                        }, this));
                    }
                }
            }
        });


        NextendAjaxHelper.ajax({
            type: "POST",
            url: NextendAjaxHelper.makeAjaxUrl(this.ajaxUrl, {
                nextendcontroller: 'sliders',
                nextendaction: 'listGroups'
            }),
            dataType: 'json'
        }).done($.proxy(function (response) {
            groups = response.data;
            if (typeof groups[this.groupID] !== 'undefined') {
                delete groups[this.groupID];
            }
            if ($.isEmptyObject(groups)) {
                $('body').on({
                    'groupAdded.addToGroup': $.proxy(function () {
                        $('body').off('.addToGroup');
                        NextendAjaxHelper.ajax({
                            type: "POST",
                            url: NextendAjaxHelper.makeAjaxUrl(this.ajaxUrl, {
                                nextendcontroller: 'sliders',
                                nextendaction: 'listGroups'
                            }),
                            dataType: 'json'
                        }).done($.proxy(function (response) {
                            groups = response.data;
                            if (typeof groups[this.groupID] !== 'undefined') {
                                delete groups[this.groupID];
                            }
                            addToGroupModal.show();
                        }, this));

                    }, this),
                    'groupAddCanceled.addToGroup': $.proxy(function () {
                        $('body').off('.addToGroup');
                    }, this)
                });

                this.createGroup.showModal();

            } else {
                addToGroupModal.show();
            }
        }, this));
    };

    return ManageSliders;
});
N2Require('Slider', [], [], function ($, scope, undefined) {
    function Slider(manager, box) {
        this.selected = false;
        this.manager = manager;

        this.box = box.data('slider', this)
            .addClass('n2-clickable');

        this.isGroup = this.box.hasClass('n2-ss-box-slider-group');

        this.box
            .on('mouseenter', $.proxy(function () {
                this.manager.showMenu(this);
            }, this))
            .on('mouseleave', $.proxy(function () {
                this.manager.hideMenu();
            }, this))
            .on('click.n2-slider', $.proxy(this.goToEdit, this));

        this.box.find('.n2-ss-box-select').on('click', $.proxy(function (e) {
            e.stopPropagation();
            e.preventDefault();

            this.invertSelection();
        }, this));
    };

    Slider.prototype.getId = function () {
        return this.box.data('sliderid');
    };

    Slider.prototype.goToEdit = function (e, isBlank) {
        var editUrl = this.box.data('editurl');
        if (typeof isBlank !== 'undefined' && isBlank) {
            window.open(editUrl, '_blank');
        } else {
            window.location = editUrl;
        }
    };

    Slider.prototype.preview = function (e) {
        e.stopPropagation();
        e.preventDefault();
        window.open(NextendAjaxHelper.makeFallbackUrl(this.box.data('editurl'), {
            nextendcontroller: 'preview',
            nextendaction: 'index'
        }), '_blank');
    };


    Slider.prototype.duplicate = function (e) {
        e.stopPropagation();
        e.preventDefault();
        var deferred = $.Deferred();
        NextendAjaxHelper.ajax({
            url: NextendAjaxHelper.makeAjaxUrl(this.box.data('editurl'), {
                nextendcontroller: 'slider',
                nextendaction: 'duplicate'
            })
        }).done($.proxy(function (response) {
            var box = $(response.data).insertAfter(this.box);
            var newSlider = new Slider(this.manager, box);
            this.manager.initSliders();
            deferred.resolve(newSlider);
        }, this));
        return deferred;
    };

    Slider.prototype.delete = function (e) {
        e.stopPropagation();
        e.preventDefault();
        this.manager.deleteSliders([this.getId()], [this]);
    };
    Slider.prototype.deleted = function () {
        this.box.remove();
    };

    Slider.prototype.invertSelection = function (e) {
        if (e) {
            e.preventDefault();
        }

        if (!this.selected) {
            this.select();
        } else {
            this.deSelect();
        }
    };

    Slider.prototype.select = function () {
        if (!this.selected) {
            this.selected = true;
            this.box.addClass('n2-selected');
            this.manager.addSelection(this);
        }
    };

    Slider.prototype.deSelect = function () {
        if (this.selected) {
            this.selected = false;
            this.box.removeClass('n2-selected');
            this.manager.removeSelection(this);
        }
    };

    return Slider;
});
N2Require('FormElementAnimationManager', ['FormElement'], [], function ($, scope, undefined) {

    function FormElementAnimationManager(id, managerIdentifier) {
        this.element = $('#' + id);
        this.managerIdentifier = managerIdentifier;

        this.element.parent()
            .on('click', $.proxy(this.show, this));

        this.element.siblings('.n2-form-element-clear')
            .on('click', $.proxy(this.clear, this));

        this.name = this.element.siblings('input');

        this.updateName(this.element.val());

        scope.FormElement.prototype.constructor.apply(this, arguments);
    };


    FormElementAnimationManager.prototype = Object.create(scope.FormElement.prototype);
    FormElementAnimationManager.prototype.constructor = FormElementAnimationManager;


    FormElementAnimationManager.prototype.show = function (e) {
        e.preventDefault();
        nextend[this.managerIdentifier].show(this.element.val(), $.proxy(this.save, this));
    };

    FormElementAnimationManager.prototype.clear = function (e) {
        e.preventDefault();
        e.stopPropagation();
        this.val('');
    };

    FormElementAnimationManager.prototype.save = function (e, value) {
        this.val(value);
    };

    FormElementAnimationManager.prototype.val = function (value) {
        this.element.val(value);
        this.updateName(value);
        this.triggerOutsideChange();
    };

    FormElementAnimationManager.prototype.insideChange = function (value) {
        this.element.val(value);

        this.updateName(value);

        this.triggerInsideChange();
    };

    FormElementAnimationManager.prototype.updateName = function (value) {
        if (value == '') {
            value = n2_('Disabled');
        } else if (value.split('||').length > 1) {
            value = n2_('Multiple animations')
        } else {
            value = n2_('Single animation');
        }
        this.name.val(value);
    };

    return FormElementAnimationManager;
});
N2Require('FormElementBackground', ['FormElement'], [], function ($, scope, undefined) {

    function FormElementBackground(id, value) {
        this.value = '';
        this.element = $('#' + id);

        this.$container = this.element.closest('.n2-form-tab');

        this.panel = $('#' + id + '-panel');
        this.setValue(value);
        this.options = this.panel.find('.n2-subform-image-option').on('click', $.proxy(this.selectOption, this));

        this.active = this.getIndex(this.options.filter('.n2-active').get(0));

        this.element.on('change', $.proxy(function () {
            this.insideChange(this.element.val());
        }, this));

        scope.FormElement.prototype.constructor.apply(this, arguments);
    };

    FormElementBackground.prototype = Object.create(scope.FormElement.prototype);
    FormElementBackground.prototype.constructor = FormElementBackground;

    FormElementBackground.prototype.selectOption = function (e) {
        var index = this.getIndex(e.currentTarget);
        if (index != this.active) {

            this.options.eq(index).addClass('n2-active');
            this.options.eq(this.active).removeClass('n2-active');

            this.active = index;

            var value = $(e.currentTarget).data('value');
            this.insideChange(value);
        }
    };
    FormElementBackground.prototype.setValue = function (newValue) {
        this.$container.removeClass('n2-ss-background-type-' + this.value);
        this.value = newValue;
        this.$container.addClass('n2-ss-background-type-' + this.value);
    }

    FormElementBackground.prototype.insideChange = function (value) {
        this.setValue(value);

        this.element.val(value);

        this.options.removeClass('n2-active');
        this.options.filter('[data-value="' + value + '"]').addClass('n2-active');
        this.triggerInsideChange();
    };

    FormElementBackground.prototype.getIndex = function (option) {
        return $.inArray(option, this.options);
    };

    return FormElementBackground;
});

N2Require('FormElementColumns', ['FormElement'], [], function ($, scope, undefined) {

    function FormElementColumns(id) {
        this.denominators = {
            1: 100,
            2: 100,
            3: 144,
            4: 100,
            5: 100,
            6: 144
        };
        this.element = $('#' + id);
        scope.FormElement.prototype.constructor.apply(this, arguments);
        this.$c = $('#' + id).parent();
        this.$container = this.$c.find('.n2-ss-columns-element-container');
        this.containerWidth = 284;
        this.maxWidth = 0;


        this.$container.sortable({
            axis: 'x',
            tolerance: 'pointer',
            items: '.n2-ss-columns-element-column',
            helper: 'clone',
            start: $.proxy(function (e, ui) {
                this.$container.addClass('n2-sortable-currently-sorted');
                ui.placeholder.css('width', ui.item.width());

                var $columns = this.$container.find('.n2-ss-columns-element-column');
                ui.item.data('index', $columns.index(ui.item));

            }, this),
            stop: $.proxy(function (e, ui) {
                var $columns = this.$container.find('.n2-ss-columns-element-column');
                var oldIndex = ui.item.data('index'),
                    newIndex = $columns.index(ui.item);
                if (oldIndex != newIndex) {

                    this.currentRow.moveCol(oldIndex, newIndex);

                    ui.item.data('index', null);
                }
                this.makeResizable();
                this.$container.removeClass('n2-sortable-currently-sorted');
            }, this)
        });

        this.$c.find('.n2-ss-columns-element-add-col').on({
            click: $.proxy(function () {
                this.currentRow.createCol();
            }, this)
        });
    }

    FormElementColumns.prototype = Object.create(scope.FormElement.prototype);
    FormElementColumns.prototype.constructor = FormElementColumns;


    FormElementColumns.prototype.getDenominator = function (i) {
        if (this.denominators[i] === undefined) {
            this.denominators[i] = i * 15;
        }
        return this.denominators[i];
    },

        FormElementColumns.prototype.setRow = function (row) {
            this.currentRow = row;
            this.insideChange(row.getColumnsOrdered());
        }

    FormElementColumns.prototype.setValue = function (newValue) {

    }

    FormElementColumns.prototype.insideChange = function (value) {
        this.start(value);
    }

    FormElementColumns.prototype.activateColumn = function (e) {
        var clickedColIndex = this.$container.find('.n2-ss-columns-element-column').index(e.currentTarget);
        this.currentRow.activateColumn(clickedColIndex, e);
    }

    FormElementColumns.prototype.start = function (value) {
        this.percentages = [];

        var columnWidths = value.split('+');
        for (var i = 0; i < columnWidths.length; i++) {
            this.percentages.push(new Fraction(columnWidths[i]));
        }

        this.refreshMaxWidth();

        this.$container.empty();

        for (var i = 0; i < this.percentages.length; i++) {
            this.updateColumn($('<div class="n2-ss-columns-element-column">')
                .on('click', $.proxy(this.activateColumn, this))
                .appendTo(this.$container), this.percentages[i]);
        }

        this.makeResizable();

    }

    FormElementColumns.prototype.refreshMaxWidth = function () {
        this.maxWidth = this.containerWidth - (this.percentages.length - 1) * 15;
    }

    FormElementColumns.prototype.updateColumn = function ($col, fraction) {
        $col.css('width', (this.maxWidth * fraction.valueOf()) + 'px')
            .html(Math.round(fraction.valueOf() * 100 * 10) / 10 + '%');
    }

    FormElementColumns.prototype.makeResizable = function () {
        if (this.handles) {
            this.handles.remove();
        }
        this.$columns = this.$container.find('.n2-ss-columns-element-column');
        $('<div class="n2-ss-columns-element-handle"><div class="n2-i n2-i-more"></div></div>').insertAfter(this.$columns.not(this.$columns.last()));

        this.handles = this.$container.find('.n2-ss-columns-element-handle')
            .on('mousedown', $.proxy(this._resizeStart, this));
    }

    FormElementColumns.prototype._resizeStart = function (e) {
        var index = this.handles.index(e.currentTarget),
            cLeft = this.$container.offset().left + 8;

        this.resizeContext = {
            index: index,
            cLeft: cLeft,
            $currentCol: this.$columns.eq(index),
            $nextCol: this.$columns.eq(index + 1),
            startX: Math.max(0, Math.min(e.clientX - cLeft, this.containerWidth)),
        }

        this._resizeMove(e);

        $('html').off('.resizecol').on({
            'mousemove.resizecol': $.proxy(this._resizeMove, this),
            'mouseup.resizecol mouseleave.resizecol': $.proxy(this._resizeStop, this)
        });
    }

    FormElementColumns.prototype._resizeMove = function (e) {
        e.preventDefault();
        var currentX = Math.max(0, Math.min(e.clientX - this.resizeContext.cLeft, this.containerWidth)),
            currentDenominator = this.getDenominator(this.percentages.length),
            fractionDifference = new Fraction(Math.round((currentX - this.resizeContext.startX) / (this.maxWidth / currentDenominator)), currentDenominator);
        if (fractionDifference.compare(this.percentages[this.resizeContext.index].clone().mul(-1)) < 0) {
            fractionDifference = this.percentages[this.resizeContext.index].clone().mul(-1);
        }
        if (fractionDifference.compare(this.percentages[this.resizeContext.index + 1]) > 0) {
            fractionDifference = this.percentages[this.resizeContext.index + 1].clone();
        }
        var currentP = this.percentages[this.resizeContext.index].add(fractionDifference),
            nextP = this.percentages[this.resizeContext.index + 1].sub(fractionDifference);

        this.updateColumn(this.resizeContext.$currentCol, currentP);
        this.updateColumn(this.resizeContext.$nextCol, nextP);

        var _percentages = $.extend([], this.percentages);
        _percentages[this.resizeContext.index] = currentP;
        _percentages[this.resizeContext.index + 1] = nextP;

        this.onColumnWidthChange(_percentages);

        return [currentP, nextP];
    }

    FormElementColumns.prototype._resizeStop = function (e) {
        var ret = this._resizeMove(e);
        this.percentages[this.resizeContext.index] = ret[0];
        this.percentages[this.resizeContext.index + 1] = ret[1];
        $('html').off('.resizecol');
        delete this.resizeContext;

        this.currentRow.setRealColsWidth(this.percentages);
    }

    FormElementColumns.prototype.onColumnWidthChange = function (_percentages) {
        var percentages = [];
        for (var i = 0; i < _percentages.length; i++) {
            percentages.push(_percentages[i].valueOf());
        }
        this.currentRow.updateColumnWidth(percentages);
    }

    return FormElementColumns;
});

/**
 * @license Fraction.js v3.3.1 09/09/2015
 * http://www.xarg.org/2014/03/rational-numbers-in-javascript/
 *
 * Copyright (c) 2015, Robert Eisele (robert@xarg.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/


/**
 *
 * This class offers the possibility to calculate fractions.
 * You can pass a fraction in different formats. Either as array, as double, as string or as an integer.
 *
 * Array/Object form
 * [ 0 => <nominator>, 1 => <denominator> ]
 * [ n => <nominator>, d => <denominator> ]
 *
 * Integer form
 * - Single integer value
 *
 * Double form
 * - Single double value
 *
 * String form
 * 123.456 - a simple double
 * 123/456 - a string fraction
 * 123.'456' - a double with repeating decimal places
 * 123.(456) - synonym
 * 123.45'6' - a double with repeating last place
 * 123.45(6) - synonym
 *
 * Example:
 *
 * var f = new Fraction("9.4'31'");
 * f.mul([-4, 3]).div(4.9);
 *
 */

(function (root) {

    "use strict";

    // Maximum search depth for cyclic rational numbers. 2000 should be more than enough.
    // Example: 1/7 = 0.(142857) has 6 repeating decimal places.
    // If MAX_CYCLE_LEN gets reduced, long cycles will not be detected and toString() only gets the first 10 digits
    var MAX_CYCLE_LEN = 2000;

    // Parsed data to avoid calling "new" all the time
    var P = {
        "s": 1,
        "n": 0,
        "d": 1
    };

    function assign(n, s) {

        if (isNaN(n = parseInt(n, 10))) {
            throwInvalidParam();
        }
        return n * s;
    }

    function throwInvalidParam() {
        throw "Invalid Param";
    }

    var parse = function (p1, p2) {

        var n = 0, d = 1, s = 1;
        var v = 0, w = 0, x = 0, y = 1, z = 1;

        var A = 0, B = 1;
        var C = 1, D = 1;

        var N = 10000000;
        var M;

        if (p1 === undefined || p1 === null) {
            /* void */
        } else if (p2 !== undefined) {
            n = p1;
            d = p2;
            s = n * d;
        } else
            switch (typeof p1) {

                case "object": {
                    if ("d" in p1 && "n" in p1) {
                        n = p1["n"];
                        d = p1["d"];
                        if ("s" in p1)
                            n *= p1["s"];
                    } else if (0 in p1) {
                        n = p1[0];
                        if (1 in p1)
                            d = p1[1];
                    } else {
                        throwInvalidParam();
                    }
                    s = n * d;
                    break;
                }
                case "number": {
                    if (p1 < 0) {
                        s = p1;
                        p1 = -p1;
                    }

                    if (p1 % 1 === 0) {
                        n = p1;
                    } else if (p1 > 0) { // check for != 0, scale would become NaN (log(0)), which converges really slow

                        if (p1 >= 1) {
                            z = Math.pow(10, Math.floor(1 + Math.log(p1) / Math.LN10));
                            p1 /= z;
                        }

                        // Using Farey Sequences
                        // http://www.johndcook.com/blog/2010/10/20/best-rational-approximation/

                        while (B <= N && D <= N) {
                            M = (A + C) / (B + D);

                            if (p1 === M) {
                                if (B + D <= N) {
                                    n = A + C;
                                    d = B + D;
                                } else if (D > B) {
                                    n = C;
                                    d = D;
                                } else {
                                    n = A;
                                    d = B;
                                }
                                break;

                            } else {

                                if (p1 > M) {
                                    A += C;
                                    B += D;
                                } else {
                                    C += A;
                                    D += B;
                                }

                                if (B > N) {
                                    n = C;
                                    d = D;
                                } else {
                                    n = A;
                                    d = B;
                                }
                            }
                        }
                        n *= z;
                    } else if (isNaN(p1) || isNaN(p2)) {
                        d = n = NaN;
                    }
                    break;
                }
                case "string": {
                    B = p1.match(/\d+|./g);

                    if (B[A] === '-') {// Check for minus sign at the beginning
                        s = -1;
                        A++;
                    } else if (B[A] === '+') {// Check for plus sign at the beginning
                        A++;
                    }

                    if (B.length === A + 1) { // Check if it's just a simple number "1234"
                        w = assign(B[A++], s);
                    } else if (B[A + 1] === '.' || B[A] === '.') { // Check if it's a decimal number

                        if (B[A] !== '.') { // Handle 0.5 and .5
                            v = assign(B[A++], s);
                        }
                        A++;

                        // Check for decimal places
                        if (A + 1 === B.length || B[A + 1] === '(' && B[A + 3] === ')' || B[A + 1] === "'" && B[A + 3] === "'") {
                            w = assign(B[A], s);
                            y = Math.pow(10, B[A].length);
                            A++;
                        }

                        // Check for repeating places
                        if (B[A] === '(' && B[A + 2] === ')' || B[A] === "'" && B[A + 2] === "'") {
                            x = assign(B[A + 1], s);
                            z = Math.pow(10, B[A + 1].length) - 1;
                            A += 3;
                        }

                    } else if (B[A + 1] === '/' || B[A + 1] === ':') { // Check for a simple fraction "123/456" or "123:456"
                        w = assign(B[A], s);
                        y = assign(B[A + 2], 1);
                        A += 3;
                    } else if (B[A + 3] === '/' && B[A + 1] === ' ') { // Check for a complex fraction "123 1/2"
                        v = assign(B[A], s);
                        w = assign(B[A + 2], s);
                        y = assign(B[A + 4], 1);
                        A += 5;
                    }

                    if (B.length <= A) { // Check for more tokens on the stack
                        d = y * z;
                        s = /* void */
                            n = x + d * v + z * w;
                        break;
                    }

                    /* Fall through on error */
                }
                default:
                    throwInvalidParam();
            }

        if (d === 0) {
            throw "DIV/0";
        }

        P["s"] = s < 0 ? -1 : 1;
        P["n"] = Math.abs(n);
        P["d"] = Math.abs(d);
    };

    var modpow = function (b, e, m) {

        for (var r = 1; e > 0; b = (b * b) % m, e >>= 1) {

            if (e & 1) {
                r = (r * b) % m;
            }
        }
        return r;
    };

    var cycleLen = function (n, d) {

        for (; d % 2 === 0;
               d /= 2) {
        }

        for (; d % 5 === 0;
               d /= 5) {
        }

        if (d === 1) // Catch non-cyclic numbers
            return 0;

        // If we would like to compute really large numbers quicker, we could make use of Fermat's little theorem:
        // 10^(d-1) % d == 1
        // However, we don't need such large numbers and MAX_CYCLE_LEN should be the capstone,
        // as we want to translate the numbers to strings.

        var rem = 10 % d;

        for (var t = 1; rem !== 1; t++) {
            rem = rem * 10 % d;

            if (t > MAX_CYCLE_LEN)
                return 0; // Returning 0 here means that we don't print it as a cyclic number. It's likely that the answer is `d-1`
        }
        return t;
    };

    var cycleStart = function (n, d, len) {

        var rem1 = 1;
        var rem2 = modpow(10, len, d);

        for (var t = 0; t < 300; t++) { // s < ~log10(Number.MAX_VALUE)
            // Solve 10^s == 10^(s+t) (mod d)

            if (rem1 === rem2)
                return t;

            rem1 = rem1 * 10 % d;
            rem2 = rem2 * 10 % d;
        }
        return 0;
    };

    var gcd = function (a, b) {

        if (!a) return b;
        if (!b) return a;

        while (1) {
            a %= b;
            if (!a) return b;
            b %= a;
            if (!b) return a;
        }
    };

    /**
     * Module constructor
     *
     * @constructor
     * @param {number|Fraction} a
     * @param {number=} b
     */
    function Fraction(a, b) {

        if (!(this instanceof Fraction)) {
            return new Fraction(a, b);
        }

        parse(a, b);

        if (Fraction['REDUCE']) {
            a = gcd(P["d"], P["n"]); // Abuse a
        } else {
            a = 1;
        }

        this["s"] = P["s"];
        this["n"] = P["n"] / a;
        this["d"] = P["d"] / a;
    }

    /**
     * Boolean global variable to be able to disable automatic reduction of the fraction
     *
     */
    Fraction['REDUCE'] = 1;

    Fraction.prototype = {

        "s": 1,
        "n": 0,
        "d": 1,

        /**
         * Calculates the absolute value
         *
         * Ex: new Fraction(-4).abs() => 4
         **/
        "abs": function () {

            return new Fraction(this["n"], this["d"]);
        },

        /**
         * Inverts the sign of the current fraction
         *
         * Ex: new Fraction(-4).neg() => 4
         **/
        "neg": function () {

            return new Fraction(-this["s"] * this["n"], this["d"]);
        },

        /**
         * Adds two rational numbers
         *
         * Ex: new Fraction({n: 2, d: 3}).add("14.9") => 467 / 30
         **/
        "add": function (a, b) {

            parse(a, b);
            return new Fraction(
                this["s"] * this["n"] * P["d"] + P["s"] * this["d"] * P["n"],
                this["d"] * P["d"]
            );
        },

        /**
         * Subtracts two rational numbers
         *
         * Ex: new Fraction({n: 2, d: 3}).add("14.9") => -427 / 30
         **/
        "sub": function (a, b) {

            parse(a, b);
            return new Fraction(
                this["s"] * this["n"] * P["d"] - P["s"] * this["d"] * P["n"],
                this["d"] * P["d"]
            );
        },

        /**
         * Multiplies two rational numbers
         *
         * Ex: new Fraction("-17.(345)").mul(3) => 5776 / 111
         **/
        "mul": function (a, b) {

            parse(a, b);
            return new Fraction(
                this["s"] * P["s"] * this["n"] * P["n"],
                this["d"] * P["d"]
            );
        },

        /**
         * Divides two rational numbers
         *
         * Ex: new Fraction("-17.(345)").inverse().div(3)
         **/
        "div": function (a, b) {

            parse(a, b);
            return new Fraction(
                this["s"] * P["s"] * this["n"] * P["d"],
                this["d"] * P["n"]
            );
        },

        /**
         * Clones the actual object
         *
         * Ex: new Fraction("-17.(345)").clone()
         **/
        "clone": function () {
            return new Fraction(this);
        },

        /**
         * Calculates the modulo of two rational numbers - a more precise fmod
         *
         * Ex: new Fraction('4.(3)').mod([7, 8]) => (13/3) % (7/8) = (5/6)
         **/
        "mod": function (a, b) {

            if (isNaN(this['n']) || isNaN(this['d'])) {
                return new Fraction(NaN);
            }

            if (a === undefined) {
                return new Fraction(this["s"] * this["n"] % this["d"], 1);
            }

            parse(a, b);
            if (0 === P["n"] && 0 === this["d"]) {
                Fraction(0, 0); // Throw div/0
            }

            /*
             * First silly attempt, kinda slow
             *
             return that["sub"]({
             "n": num["n"] * Math.floor((this.n / this.d) / (num.n / num.d)),
             "d": num["d"],
             "s": this["s"]
             });*/

            /*
             * New attempt: a1 / b1 = a2 / b2 * q + r
             * => b2 * a1 = a2 * b1 * q + b1 * b2 * r
             * => (b2 * a1 % a2 * b1) / (b1 * b2)
             */
            return new Fraction(
                (this["s"] * P["d"] * this["n"]) % (P["n"] * this["d"]),
                P["d"] * this["d"]
            );
        },

        /**
         * Calculates the fractional gcd of two rational numbers
         *
         * Ex: new Fraction(5,8).gcd(3,7) => 1/56
         */
        "gcd": function (a, b) {

            parse(a, b);

            // gcd(a / b, c / d) = gcd(a, c) / lcm(b, d)

            return new Fraction(gcd(P["n"], this["n"]), P["d"] * this["d"] / gcd(P["d"], this["d"]));
        },

        /**
         * Calculates the fractional lcm of two rational numbers
         *
         * Ex: new Fraction(5,8).lcm(3,7) => 15
         */
        "lcm": function (a, b) {

            parse(a, b);

            // lcm(a / b, c / d) = lcm(a, c) / gcd(b, d)

            if (P["n"] === 0 && this["n"] === 0) {
                return new Fraction;
            }
            return new Fraction(P["n"] * this["n"] / gcd(P["n"], this["n"]), gcd(P["d"], this["d"]));
        },

        /**
         * Calculates the ceil of a rational number
         *
         * Ex: new Fraction('4.(3)').ceil() => (5 / 1)
         **/
        "ceil": function (places) {

            places = Math.pow(10, places || 0);

            if (isNaN(this["n"]) || isNaN(this["d"])) {
                return new Fraction(NaN);
            }
            return new Fraction(Math.ceil(places * this["s"] * this["n"] / this["d"]), places);
        },

        /**
         * Calculates the floor of a rational number
         *
         * Ex: new Fraction('4.(3)').floor() => (4 / 1)
         **/
        "floor": function (places) {

            places = Math.pow(10, places || 0);

            if (isNaN(this["n"]) || isNaN(this["d"])) {
                return new Fraction(NaN);
            }
            return new Fraction(Math.floor(places * this["s"] * this["n"] / this["d"]), places);
        },

        /**
         * Rounds a rational numbers
         *
         * Ex: new Fraction('4.(3)').round() => (4 / 1)
         **/
        "round": function (places) {

            places = Math.pow(10, places || 0);

            if (isNaN(this["n"]) || isNaN(this["d"])) {
                return new Fraction(NaN);
            }
            return new Fraction(Math.round(places * this["s"] * this["n"] / this["d"]), places);
        },

        /**
         * Gets the inverse of the fraction, means numerator and denumerator are exchanged
         *
         * Ex: new Fraction([-3, 4]).inverse() => -4 / 3
         **/
        "inverse": function () {

            return new Fraction(this["s"] * this["d"], this["n"]);
        },

        /**
         * Calculates the fraction to some integer exponent
         *
         * Ex: new Fraction(-1,2).pow(-3) => -8
         */
        "pow": function (m) {

            if (m < 0) {
                return new Fraction(Math.pow(this['s'] * this["d"], -m), Math.pow(this["n"], -m));
            } else {
                return new Fraction(Math.pow(this['s'] * this["n"], m), Math.pow(this["d"], m));
            }
        },

        /**
         * Check if two rational numbers are the same
         *
         * Ex: new Fraction(19.6).equals([98, 5]);
         **/
        "equals": function (a, b) {

            parse(a, b);
            return this["s"] * this["n"] * P["d"] === P["s"] * P["n"] * this["d"]; // Same as compare() === 0
        },

        /**
         * Check if two rational numbers are the same
         *
         * Ex: new Fraction(19.6).equals([98, 5]);
         **/
        "compare": function (a, b) {

            parse(a, b);
            var t = (this["s"] * this["n"] * P["d"] - P["s"] * P["n"] * this["d"]);
            return (0 < t) - (t < 0);
        },

        /**
         * Check if two rational numbers are divisible
         *
         * Ex: new Fraction(19.6).divisible(1.5);
         */
        "divisible": function (a, b) {

            parse(a, b);
            return !(!(P["n"] * this["d"]) || ((this["n"] * P["d"]) % (P["n"] * this["d"])));
        },

        /**
         * Returns a decimal representation of the fraction
         *
         * Ex: new Fraction("100.'91823'").valueOf() => 100.91823918239183
         **/
        'valueOf': function () {

            return this["s"] * this["n"] / this["d"];
        },

        /**
         * Returns a string-fraction representation of a Fraction object
         *
         * Ex: new Fraction("1.'3'").toFraction() => "4 1/3"
         **/
        'toFraction': function (excludeWhole) {

            var whole, str = "";
            var n = this["n"];
            var d = this["d"];
            if (this["s"] < 0) {
                str += '-';
            }

            if (d === 1) {
                str += n;
            } else {

                if (excludeWhole && (whole = Math.floor(n / d)) > 0) {
                    str += whole;
                    str += " ";
                    n %= d;
                }

                str += n;
                str += '/';
                str += d;
            }
            return str;
        },

        /**
         * Returns a latex representation of a Fraction object
         *
         * Ex: new Fraction("1.'3'").toLatex() => "\frac{4}{3}"
         **/
        'toLatex': function (excludeWhole) {

            var whole, str = "";
            var n = this["n"];
            var d = this["d"];
            if (this["s"] < 0) {
                str += '-';
            }

            if (d === 1) {
                str += n;
            } else {

                if (excludeWhole && (whole = Math.floor(n / d)) > 0) {
                    str += whole;
                    n %= d;
                }

                str += "\\frac{";
                str += n;
                str += '}{';
                str += d;
                str += '}';
            }
            return str;
        },

        /**
         * Returns an array of continued fraction elements
         *
         * Ex: new Fraction("7/8").toContinued() => [0,1,7]
         */
        'toContinued': function () {

            var t;
            var a = this['n'];
            var b = this['d'];
            var res = [];

            do {
                res.push(Math.floor(a / b));
                t = a % b;
                a = b;
                b = t;
            } while (a !== 1);

            return res;
        },

        /**
         * Creates a string representation of a fraction with all digits
         *
         * Ex: new Fraction("100.'91823'").toString() => "100.(91823)"
         **/
        'toString': function () {

            var g;
            var N = this["n"];
            var D = this["d"];

            if (isNaN(N) || isNaN(D)) {
                return "NaN";
            }

            if (!Fraction['REDUCE']) {
                g = gcd(N, D);
                N /= g;
                D /= g;
            }

            var p = String(N).split(""); // Numerator chars
            var t = 0; // Tmp var

            var ret = [~this["s"] ? "" : "-", "", ""]; // Return array, [0] is zero sign, [1] before comma, [2] after
            var zeros = ""; // Collection variable for zeros

            var cycLen = cycleLen(N, D); // Cycle length
            var cycOff = cycleStart(N, D, cycLen); // Cycle start

            var j = -1;
            var n = 1; // str index

            // rough estimate to fill zeros
            var length = 15 + cycLen + cycOff + p.length; // 15 = decimal places when no repitation

            for (var i = 0; i < length; i++, t *= 10) {

                if (i < p.length) {
                    t += Number(p[i]);
                } else {
                    n = 2;
                    j++; // Start now => after comma
                }

                if (cycLen > 0) { // If we have a repeating part
                    if (j === cycOff) {
                        ret[n] += zeros + "(";
                        zeros = "";
                    } else if (j === cycLen + cycOff) {
                        ret[n] += zeros + ")";
                        break;
                    }
                }

                if (t >= D) {
                    ret[n] += zeros + ((t / D) | 0); // Flush zeros, Add current digit
                    zeros = "";
                    t = t % D;
                } else if (n > 1) { // Add zeros to the zero buffer
                    zeros += "0";
                } else if (ret[n]) { // If before comma, add zero only if already something was added
                    ret[n] += "0";
                }
            }

            // If it's empty, it's a leading zero only
            ret[0] += ret[1] || "0";

            // If there is something after the comma, add the comma sign
            if (ret[2]) {
                return ret[0] + "." + ret[2];
            }
            return ret[0];
        }
    };
    root['Fraction'] = Fraction;

})(this);
N2Require('FormElementLayerPicker', ['FormElement'], [], function ($, scope, undefined) {

    var STATUS = {
            INITIALIZED: 0,
            PICK_PARENT: 1,
            PICK_CHILD: 2,
            PICK_PARENT_ALIGN: 3,
            PICK_CHILD_ALIGN: 4
        },
        OVERLAYS = '<div class="n2-ss-picker-overlay-tile" data-align="left" data-valign="top" />' +
            '<div class="n2-ss-picker-overlay-tile" data-align="center" data-valign="top" style="left:33%;top:0;" />' +
            '<div class="n2-ss-picker-overlay-tile" data-align="right" data-valign="top" style="left:66%;top:0;width:34%;" />' +
            '<div class="n2-ss-picker-overlay-tile" data-align="left" data-valign="middle" style="left:0;top:33%;" />' +
            '<div class="n2-ss-picker-overlay-tile" data-align="center" data-valign="middle" style="left:33%;top:33%; " />' +
            '<div class="n2-ss-picker-overlay-tile" data-align="right" data-valign="middle" style="left:66%;top:33%;width:34%;" />' +
            '<div class="n2-ss-picker-overlay-tile" data-align="left" data-valign="bottom" style="left:0;top:66%;height:34%;" />' +
            '<div class="n2-ss-picker-overlay-tile" data-align="center" data-valign="bottom" style="left:33%;top:66%;height:34%;" />' +
            '<div class="n2-ss-picker-overlay-tile" data-align="right" data-valign="bottom" style="left:66%;top:66%;width:34%;height:34%;" />';

    function FormElementLayerPicker(id) {
        this.status = 0;
        this.element = $('#' + id);
        this.$container = $('.n2-ss-parent-picker');
        this.overlays = null;

        this.aligns = this.element.parent().parent().siblings();

        this.picker = this.element.siblings('.n2-ss-layer-picker')
            .on({
                click: $.proxy(function () {
                    this.change('');
                }, this)
            });


        scope.FormElement.prototype.constructor.apply(this, arguments);
    };


    FormElementLayerPicker.prototype = Object.create(scope.FormElement.prototype);
    FormElementLayerPicker.prototype.constructor = FormElementLayerPicker;

    FormElementLayerPicker.prototype.click = function (e) {
        if (!$('#n2-admin').hasClass('n2-ss-mode-desktopPortrait')) {
            nextend.notificationCenter.notice(n2_('To chain layers together, please switch to desktop portrait mode!'));
            return;
        }
        if (this.status == STATUS.INITIALIZED) {
            this.data = {
                parent: null,
                parentVAlign: null,
                parentHAlign: null,
                child: null,
                childVAlign: null,
                childHAlign: null,
            };

            $('body').on('mousedown.n2-ss-parent-linker', $.proxy(function (e) {
                var $el = $(e.target);
                if (!$el.hasClass('n2-ss-picker-overlay') && !$el.hasClass('n2-ss-picker-overlay-tile')) {
                    this.destroy();
                }
            }, this));

            NextendEsc.add($.proxy(function () {
                this.destroy();
                return false;
            }, this));

            this.pickParent(e);
        } else {
            this.data = null;
            this.change('');
            this.destroy();
        }
    }

    FormElementLayerPicker.prototype.getAbsoluteLayers = function (container) {
        var layers = [],
            _layers = container.getSortedLayers();
        for (var i = 0; i < _layers.length; i++) {
            switch (_layers[i].placement.getType()) {
                case 'absolute':
                    layers.push(_layers[i].layer[0]);
                    break;
                case 'group':
                    layers.push.apply(layers, this.getAbsoluteLayers(_layers[i].container));
                    break;
            }
        }

        return layers;
    }

    FormElementLayerPicker.prototype.pickParent = function (e) {
        var canvasManager = nextend.smartSlider.canvasManager,
            layers = $(this.getAbsoluteLayers(canvasManager.mainContainer.container));
        this.tempLayers = layers;
        if (layers.length == 0) {
            this.destroy();
        } else {

            this.status = STATUS.PICK_PARENT;
            nextend.tooltipMouse.show(n2_('Pick the parent layer!'), e);

            var overlays = $('<div class="n2-ss-picker-overlay"></div>').appendTo(layers)
                .on('click', $.proxy(function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var $layer = $(e.currentTarget).parent(),
                        layer = $layer.data('layerObject');

                    this.data.parent = $layer;

                    this._destroy();
                    this.pickParentAlign(e);

                }, this));
        }
    }

    FormElementLayerPicker.prototype.pickParentAlign = function (e) {
        this.status = STATUS.PICK_PARENT_ALIGN;
        nextend.tooltipMouse.show(n2_('Pick the align point of the parent layer!'), e);

        var overlays = $(OVERLAYS).appendTo(this.data.parent)
            .on('click', $.proxy(function (e) {
                e.preventDefault();
                e.stopPropagation();

                var $currentTarget = $(e.currentTarget);
                this.data.parentHAlign = $currentTarget.data('align');
                this.data.parentVAlign = $currentTarget.data('valign');
                $currentTarget.off('click').addClass('n2-active');

                overlays.not($currentTarget).remove();
                this.pickChild(e);
            }, this));
    }

    FormElementLayerPicker.prototype.pickChild = function (e) {
        this.status = STATUS.PICK_CHILD;
        nextend.tooltipMouse.show(n2_('Pick the child layer!'), e);

        var layers = this.tempLayers.not(this.data.parent);
        delete this.tempLayers;

        /**
         * Parent layers can not be child of one of their child layers.
         * @param layer
         */
        var recursiveRemoveParents = function (layer) {
            var pID = layer.data('layerObject').getProperty('parentid');
            if (pID && pID != '') {
                recursiveRemoveParents($('#' + pID));
            }
            layers = layers.not(layer);
        };

        // Possible parent layers of the selected parent layer can't be the child of the selected parent :)
        recursiveRemoveParents(this.data.parent);

        if (!layers.length) {
            nextend.notificationCenter.error(n2_('There is not any layer available to be child of the selected layer!'));
            this.destroy();
            return;
        }

        var overlays = $('<div class="n2-ss-picker-overlay"></div>').appendTo(layers)
            .on('click', $.proxy(function (e) {
                e.preventDefault();
                e.stopPropagation();
                var $layer = $(e.currentTarget).parent(),
                    layer = $layer.data('layerObject');

                this.data.child = $layer;

                overlays.remove();
                this.pickChildAlign(e);

            }, this));
    }

    FormElementLayerPicker.prototype.pickChildAlign = function (e) {
        this.status = STATUS.PICK_CHILD_ALIGN;

        nextend.tooltipMouse.show(n2_('Pick the align point of the child layer!'), e);

        var overlays = $(OVERLAYS).appendTo(this.data.child)
            .on('click', $.proxy(function (e) {
                e.preventDefault();
                e.stopPropagation();

                var $currentTarget = $(e.currentTarget);
                this.data.childHAlign = $currentTarget.data('align');
                this.data.childVAlign = $currentTarget.data('valign');

                this.done();

            }, this));
    }

    FormElementLayerPicker.prototype._destroy = function () {
        $('.n2-ss-picker-overlay').remove();
        $('.n2-ss-picker-overlay-tile').remove();
    }

    FormElementLayerPicker.prototype.destroy = function () {
        nextend.tooltipMouse.hide();
        this._destroy();
        $('body').off('.n2-ss-parent-linker');
        NextendEsc.pop();

        this.status = STATUS.INITIALIZED;
    }

    FormElementLayerPicker.prototype.done = function () {

        this.data.child.data('layerObject').placement.current
            .parentPicked(this.data.parent.data('layerObject'), this.data.parentHAlign, this.data.parentVAlign, this.data.childHAlign, this.data.childVAlign);
        this.destroy();
    }

    FormElementLayerPicker.prototype.change = function (value) {
        this.element.val(value).trigger('change');
        this._setValue(value);
        this.triggerOutsideChange();
    };

    FormElementLayerPicker.prototype.insideChange = function (value) {
        this.element.val(value);
        this._setValue(value);

        this.triggerInsideChange();
    };

    FormElementLayerPicker.prototype._setValue = function (value) {
        if (value && value != '') {
            this.$container.css('display', '');
        } else {
            this.$container.css('display', 'none');
        }
    };

    return FormElementLayerPicker;
});
N2Require('FormElementPostAnimationManager', ['FormElementAnimationManager'], [], function ($, scope, undefined) {

    function FormElementPostAnimationManager() {
        scope.FormElementAnimationManager.prototype.constructor.apply(this, arguments);
    };

    FormElementPostAnimationManager.prototype = Object.create(scope.FormElementAnimationManager.prototype);
    FormElementPostAnimationManager.prototype.constructor = FormElementPostAnimationManager;

    FormElementPostAnimationManager.prototype.clear = function (e) {
        e.preventDefault();
        e.stopPropagation();
        var data = this.element.val().split('|*|');
        data[2] = '';
        this.val(data.join('|*|'));
    };
    FormElementPostAnimationManager.prototype.updateName = function (value) {
        var data = value.split('|*|');
        value = data[2];
        if (value == '') {
            value = n2_('Disabled');
        } else if (value.split('||').length > 1) {
            value = n2_('Multiple animations');
        } else {
            value = n2_('Single animation');
        }
        this.name.val(value);
    };

    return FormElementPostAnimationManager;
});
N2Require('FormElementSliderType', [], [], function ($, scope, undefined) {

    function FormElementSliderType(id) {
        this.element = $('#' + id);

        this.setAttribute();

        this.element.on('nextendChange', $.proxy(this.setAttribute, this));
    };

    FormElementSliderType.prototype.setAttribute = function () {

        $('#n2-admin').attr('data-slider-type', this.element.val());

        if (this.element.val() == 'block') {
            $('.n2-fm-shadow').trigger('click');
        }
    };

    return FormElementSliderType;
});

N2Require('FormElementSliderWidgetArea', ['FormElement'], [], function ($, scope, undefined) {

    function FormElementSliderWidgetArea(id) {
        this.element = $('#' + id);

        this.area = $('#' + id + '_area');

        this.areas = this.area.find('.n2-area');

        this.areas.on('click', $.proxy(this.chooseArea, this));

        scope.FormElement.prototype.constructor.apply(this, arguments);
    };


    FormElementSliderWidgetArea.prototype = Object.create(scope.FormElement.prototype);
    FormElementSliderWidgetArea.prototype.constructor = FormElementSliderWidgetArea;


    FormElementSliderWidgetArea.prototype.chooseArea = function (e) {
        var value = parseInt($(e.target).data('area'));

        this.element.val(value);
        this.setSelected(value);

        this.triggerOutsideChange();
    };

    FormElementSliderWidgetArea.prototype.insideChange = function (value) {
        value = parseInt(value);
        this.element.val(value);
        this.setSelected(value);

        this.triggerInsideChange();
    };

    FormElementSliderWidgetArea.prototype.setSelected = function (index) {
        this.areas.removeClass('n2-active');
        this.areas.eq(index - 1).addClass('n2-active');
    };

    return FormElementSliderWidgetArea;
});

N2Require('FormElementWidgetPosition', [], [], function ($, scope, undefined) {

    function FormElementWidgetPosition(id) {

        this.element = $('#' + id + '-mode');
        this.container = this.element.closest('.n2-form-element-mixed');

        this.tabs = this.container.find('> .n2-mixed-group');

        this.element.on('nextendChange', $.proxy(this.onChange, this));

        this.onChange();
    };

    FormElementWidgetPosition.prototype.onChange = function () {
        var value = this.element.val();

        if (value == 'advanced') {
            this.tabs.eq(2).css('display', '');
            this.tabs.eq(1).css('display', 'none');
        } else {
            this.tabs.eq(1).css('display', '');
            this.tabs.eq(2).css('display', 'none');
        }
    };

    return FormElementWidgetPosition;
});

N2Require('SmartSliderGeneratorRecords', [], [], function ($, scope, undefined) {

    function SmartSliderGeneratorRecords(ajaxUrl) {
        this.ajaxUrl = ajaxUrl;

        $("#generatorrecord-viewer").on("click", $.proxy(this.showRecords, this));
    };

    SmartSliderGeneratorRecords.prototype.showRecords = function (e) {
        e.preventDefault();
        NextendAjaxHelper.ajax({
            type: "POST",
            url: this.ajaxUrl,
            data: $("#smartslider-form").serialize(),
            dataType: "json"
        }).done(function (response) {
            var modal = new NextendModal({
                zero: {
                    size: [
                        1300,
                        700
                    ],
                    title: "Records",
                    content: response.data.html
                }
            }, true);
            modal.content.css('overflow', 'auto');
        }).error(function (response) {
            if (response.status == 200) {
                var modal = new NextendModal({
                    zero: {
                        size: [
                            1300,
                            700
                        ],
                        title: "Response",
                        content: response.responseText
                    }
                }, true);
                modal.content.css('overflow', 'auto');
            }
        });
    };

    return SmartSliderGeneratorRecords;
});
N2Require('QuickSlides', [], [], function ($, scope, undefined) {

    function QuickSlides(ajaxUrl) {

        var button = $('#n2-quick-slides-edit');
        if (button.length < 1) {
            return;
        }

        this.ajaxUrl = ajaxUrl;

        button.on('click', $.proxy(this.openEdit, this));
    };

    QuickSlides.prototype.openEdit = function (e) {
        e.preventDefault();
        var slides = $('#n2-ss-slides .n2-box-slide');

        var that = this;
        this.modal = new NextendModal({
            zero: {
                fit: true,
                fitX: false,
                overflow: 'auto',
                size: [
                    1200,
                    700
                ],
                title: n2_('Quick Edit - Slides'),
                back: false,
                close: true,
                content: '<form class="n2-form"><table></table></form>',
                controls: [
                    '<a href="#" class="n2-button n2-button-normal n2-button-l n2-radius-s n2-button-green n2-uc n2-h4">' + n2_('Save') + '</a>'
                ],
                fn: {
                    show: function () {

                        var button = this.controls.find('.n2-button-green'),
                            form = this.content.find('.n2-form').on('submit', function (e) {
                                e.preventDefault();
                                button.trigger('click');
                            }),
                            table = form.find('table');

                        slides.each($.proxy(function (i, el) {
                            var slide = $(el),
                                tr = $('<tr />').appendTo(table),
                                id = slide.data('slideid');
                            tr.append($('<td />').append('<img src="' + slide.data('image') + '" style="width:100px;"/>'));
                            tr.append($('<td />').append(that.createInput('Name', 'title-' + id, slide.data('title'), 'width: 240px;')));
                            tr.append($('<td />').append(that.createTextarea('Description', 'description-' + id, slide.data('description'), 'width: 330px;height:24px;')));
                            var link = slide.data('link').split('|*|');
                            tr.append($('<td />').append(that.createLink('Link', 'link-' + id, link[0], 'width: 180px;')));
                            tr.append($('<td />').append(that.createTarget('Target', 'target-' + id, link.length > 1 ? link[1] : '_self', '')));

                            new N2Classes.FormElementUrl('link-' + id, nextend.NextendElementUrlParams);

                        }, this));


                        button.on('click', $.proxy(function (e) {

                            var changed = {};
                            slides.each($.proxy(function (i, el) {
                                var slide = $(el),
                                    id = slide.data('slideid'),
                                    name = $('#title-' + id).val(),
                                    description = $('#description-' + id).val(),
                                    link = $('#link-' + id).val() + '|*|' + $('#target-' + id).val();

                                if (name != slide.data('title') || description != slide.data('description') || link != slide.data('link')) {
                                    changed[id] = {
                                        name: name,
                                        description: description,
                                        link: link
                                    };
                                }
                            }, this));

                            if (jQuery.isEmptyObject(changed)) {
                                this.hide(e);
                            } else {
                                this.hide(e);
                                NextendAjaxHelper.ajax({
                                    type: "POST",
                                    url: NextendAjaxHelper.makeAjaxUrl(that.ajaxUrl),
                                    data: {changed: Base64.encode(JSON.stringify(changed))},
                                    dataType: 'json'
                                }).done($.proxy(function (response) {
                                    var slides = response.data;
                                    for (var slideID in slides) {
                                        var slideBox = $('.n2-box-slide[data-slideid="' + slideID + '"]');
                                        slideBox.find('.n2-box-placeholder a.n2-h4').html(slides[slideID].title);

                                        slideBox.attr('data-title', slides[slideID].rawTitle);
                                        slideBox.data('title', slides[slideID].rawTitle);
                                        slideBox.attr('data-description', slides[slideID].rawDescription);
                                        slideBox.data('description', slides[slideID].rawDescription);
                                        slideBox.attr('data-link', slides[slideID].rawLink);
                                        slideBox.data('link', slides[slideID].rawLink);
                                    }
                                }, this));
                            }
                        }, this));
                    }
                }
            }
        });

        this.modal.setCustomClass('n2-ss-quick-slides-edit-modal');
        this.modal.show();

    };

    QuickSlides.prototype.createInput = function (label, id, value) {
        var style = '';
        if (arguments.length == 4) {
            style = arguments[3];
        }
        var nodes = $('<div class="n2-form-element-mixed"><div class="n2-mixed-group"><div class="n2-mixed-label"><label for="' + id + '">' + label + '</label></div><div class="n2-mixed-element"><div class="n2-form-element-text n2-border-radius"><input type="text" id="' + id + '" class="n2-h5" autocomplete="off" style="' + style + '"></div></div></div></div>');
        nodes.find('input').val(value);
        return nodes;
    };

    QuickSlides.prototype.createTextarea = function (label, id, value) {
        var style = '';
        if (arguments.length == 4) {
            style = arguments[3];
        }
        var nodes = $('<div class="n2-form-element-mixed"><div class="n2-mixed-group"><div class="n2-mixed-label"><label for="' + id + '">' + label + '</label></div><div class="n2-mixed-element"><div class="n2-form-element-textarea n2-border-radius"><textarea id="' + id + '" class="n2-h5" autocomplete="off" style="resize:y;' + style + '"></textarea></div></div></div></div>');
        nodes.find('textarea').val(value);
        return nodes;
    };

    QuickSlides.prototype.createLink = function (label, id, value) {
        var style = '';
        if (arguments.length == 4) {
            style = arguments[3];
        }
        var nodes = $('<div class="n2-form-element-mixed"><div class="n2-mixed-group"><div class="n2-mixed-label"><label for="' + id + '">' + label + '</label></div><div class="n2-mixed-element"><div class="n2-form-element-text n2-border-radius"><input type="text" id="' + id + '" class="n2-h5" autocomplete="off" style="' + style + '"><a href="#" class="n2-form-element-clear"><i class="n2-i n2-it n2-i-empty n2-i-grey-opacity"></i></a><a id="' + id + '_button" class="n2-form-element-button n2-h5 n2-uc" href="#">Link</a></div></div></div></div>');
        nodes.find('input').val(value);
        return nodes;
    };


    QuickSlides.prototype.createTarget = function (label, id, value) {
        var style = '';
        if (arguments.length == 4) {
            style = arguments[3];
        }
        var nodes = $('<div class="n2-form-element-mixed"><div class="n2-mixed-group"><div class="n2-mixed-label"><label for="' + id + '">' + label + '</label></div><div class="n2-mixed-element"><div class="n2-form-element-list"><select id="' + id + '" autocomplete="off" style="' + style + '"><option value="_self">Self</option><option value="_blank">Blank</option></select</div></div></div></div>');
        nodes.find('select').val(value);
        return nodes;
    };

    return QuickSlides;
});
N2Require('Slide', [], [], function ($, scope, undefined) {
    function Slide(manager, box) {
        this.selected = false;
        this.manager = manager;

        this.box = box.data('slide', this)
            .addClass('n2-clickable');

        this.box
            .on('mouseenter', $.proxy(function () {
                this.manager.showMenu(this);
            }, this))
            .on('mouseleave', $.proxy(function () {
                this.manager.hideMenu();
            }, this))
            .on('click.n2-slide', $.proxy(this.goToEdit, this));

        this.publishElement = this.box.find('.n2-slide-published')
            .on('click', $.proxy(this.switchPublished, this));

        this.box.find('.n2-ss-box-select').on('click', $.proxy(function (e) {
            e.stopPropagation();
            e.preventDefault();

            this.invertSelection();
        }, this));
    };

    Slide.prototype.getId = function () {
        return this.box.data('slideid');
    };

    Slide.prototype.setFirst = function (e) {
        e.stopPropagation();
        e.preventDefault();
        NextendAjaxHelper.ajax({
            url: NextendAjaxHelper.makeAjaxUrl(this.manager.ajaxUrl, {
                nextendaction: 'first'
            }),
            type: 'POST',
            data: {
                id: this.getId()
            }
        }).done($.proxy(function () {
            this.manager.unsetFirst();
            this.box.addClass('n2-slide-state-first');
        }, this));
    };

    Slide.prototype.unsetFirst = function () {
        this.box.removeClass('n2-slide-state-first');
    };

    Slide.prototype.switchPublished = function (e) {
        e.stopPropagation();
        e.preventDefault();
        if (this.isPublished()) {
            this.manager.unPublishSlides([this.getId()], [this]);
        } else {
            this.manager.publishSlides([this.getId()], [this]);
        }
    };

    Slide.prototype.isPublished = function () {
        return this.box.hasClass('n2-slide-state-published');
    };

    Slide.prototype.published = function () {
        this.box.addClass('n2-slide-state-published');
    };

    Slide.prototype.unPublished = function () {
        this.box.removeClass('n2-slide-state-published');
    };

    Slide.prototype.goToEdit = function (e, isBlank) {
        if (this.manager.isBulkSelection) {
            this.invertSelection();
            e.preventDefault();
        } else {
            var editUrl = this.box.data('editurl');
            if (typeof isBlank !== 'undefined' && isBlank) {
                window.open(editUrl, '_blank');
            } else if (editUrl == location.href) {
                n2("#n2-admin").toggleClass("n2-ss-slides-outer-container-visible");
            } else {
                window.location = editUrl;
            }
        }
    };

    Slide.prototype.duplicate = function (e) {
        e.stopPropagation();
        e.preventDefault();
        var deferred = $.Deferred();
        NextendAjaxHelper.ajax({
            url: NextendAjaxHelper.makeAjaxUrl(this.box.data('editurl'), {
                nextendaction: 'duplicate'
            })
        }).done($.proxy(function (response) {
            var box = $(response.data).insertAfter(this.box);
            var newSlide = new Slide(this.manager, box);
            this.manager.initSlides();
            deferred.resolve(newSlide);
        }, this));
        return deferred;
    };

    Slide.prototype.delete = function (e) {
        e.stopPropagation();
        e.preventDefault();
        this.manager.deleteSlides([this.getId()], [this]);
    };
    Slide.prototype.deleted = function () {
        this.box.remove();
    };

    Slide.prototype.invertSelection = function (e) {
        if (e) {
            e.preventDefault();
        }

        if (!this.selected) {
            this.select();
        } else {
            this.deSelect();
        }
    };

    Slide.prototype.select = function () {
        if (!this.selected) {
            this.selected = true;
            this.box.addClass('n2-selected');
            this.manager.addSelection(this);
        }
    };

    Slide.prototype.deSelect = function () {
        if (this.selected) {
            this.selected = false;
            this.box.removeClass('n2-selected');
            this.manager.removeSelection(this);
        }
    };

    Slide.prototype.publish = function (e) {
        this.switchPublished(e);
    }

    Slide.prototype.unpublish = function (e) {
        this.switchPublished(e);
    }

    Slide.prototype.generator = function (e) {
        window.location = this.box.data('generator');
    }

    Slide.prototype.copy = function (e) {
        this.manager.showSliderSelector(n2_('Copy slide to ...'), $.proxy(function (sliderID) {
            NextendAjaxHelper.ajax({
                url: NextendAjaxHelper.makeAjaxUrl(this.box.data('editurl'), {
                    nextendaction: 'copy',
                    targetSliderID: sliderID
                })
            });
        }, this));
    }

    return Slide;
});
N2Require('SlidesManager', [], [], function ($, scope, undefined) {

    function SlidesManager(ajaxUrl, contentAjaxUrl, parameters, isUploadDisabled, uploadUrl, uploadDir) {
        this.quickPostModal = null;
        this.quickVideoModal = null;
        this.parameters = parameters;
        this.slides = [];
        this.ajaxUrl = ajaxUrl;
        this.contentAjaxUrl = contentAjaxUrl;
        this.slidesPanel = $('#n2-ss-slides-container');
        this.slidesContainer = this.slidesPanel.find('.n2-ss-slides-container');

        this.initMenu();

        this.initSlidesOrderable();

        var slides = this.slidesContainer.find('.n2-box-slide');
        for (var i = 0; i < slides.length; i++) {
            this.slides.push(new scope.Slide(this, slides.eq(i)));
        }

        $('html').attr('data-slides', this.slides.length);

        $('.n2-add-quick-image, .n2-box-slide-dummy').on('click', $.proxy(this.addQuickImage, this));
        $('.n2-add-quick-video').on('click', $.proxy(this.addQuickVideo, this));
        $('.n2-add-quick-post').on('click', $.proxy(this.addQuickPost, this));

        this.initBulk();


        if (!isUploadDisabled) {
            var images = [];
            this.slidesContainer.fileupload({
                url: uploadUrl,
                pasteZone: false,
                dataType: 'json',
                paramName: 'image',
                dropZone: typeof nextend.smartSlider == 'undefined' ? $(document) : $('.n2-ss-slides-outer-container'),

                add: $.proxy(function (e, data) {
                    data.formData = {path: '/' + uploadDir};
                    data.submit();
                }, this),

                done: $.proxy(function (e, data) {
                    var response = data.result;
                    if (response.data && response.data.name) {
                        images.push({
                            title: response.data.name,
                            description: '',
                            image: response.data.url
                        });
                    } else {
                        NextendAjaxHelper.notification(response);
                    }

                }, this),

                fail: $.proxy(function (e, data) {
                    NextendAjaxHelper.notification(data.jqXHR.responseJSON);
                }, this),

                start: function () {
                    NextendAjaxHelper.startLoading();
                },

                stop: $.proxy(function () {
                    if (images.length) {
                        this._addQuickImages(images);
                    } else {
                        setTimeout(function () {
                            NextendAjaxHelper.stopLoading();
                        }, 100);
                    }
                    images = [];
                }, this)
            });

            var timeout = null;
            this.slidesContainer.on('dragover', $.proxy(function (e) {
                if (timeout !== null) {
                    clearTimeout(timeout);
                    timeout = null;
                } else {
                    this.slidesContainer.addClass('n2-drag-over');
                }
                timeout = setTimeout($.proxy(function () {
                    this.slidesContainer.removeClass('n2-drag-over');
                    timeout = null;
                }, this), 400);

            }, this));
        }
    };

    SlidesManager.prototype.changed = function () {

    };

    SlidesManager.prototype.initSlidesOrderable = function () {
        this.slidesContainer.sortable({
            helper: 'clone',
            forcePlaceholderSize: false,
            tolerance: "pointer",
            items: ".n2-box-slide",
            start: function (event, ui) {
                ui.item.show();
            },
            stop: $.proxy(this.saveSlideOrder, this),
            placeholder: 'n2-box-sortable-placeholder n2-box-sortable-placeholder-small',
            distance: 10
        });
    };

    SlidesManager.prototype.saveSlideOrder = function (e) {
        var slideNodes = this.slidesContainer.find('.n2-box-slide'),
            slides = [],
            ids = [],
            originalIds = [];
        for (var i = 0; i < slideNodes.length; i++) {
            var slide = slideNodes.eq(i).data('slide');
            slides.push(slide);
            ids.push(slide.getId());
        }
        for (var i = 0; i < this.slides.length; i++) {
            originalIds.push(this.slides[i].getId());
        }

        if (JSON.stringify(originalIds) != JSON.stringify(ids)) {
            $(window).triggerHandler('SmartSliderSidebarSlidesOrderChanged');
            var queries = {
                nextendcontroller: 'slides',
                nextendaction: 'order'
            };
            NextendAjaxHelper.ajax({
                type: 'POST',
                url: NextendAjaxHelper.makeAjaxUrl(this.ajaxUrl, queries),
                data: {
                    slideorder: ids
                }
            });
            this.slides = slides;
            this.changed();
        }
    };

    SlidesManager.prototype.initSlides = function () {
        var previousLength = this.slides.length;
        var slideNodes = this.slidesContainer.find('.n2-box-slide'),
            slides = [];
        for (var i = 0; i < slideNodes.length; i++) {
            var slide = slideNodes.eq(i).data('slide');
            slides.push(slide);
        }
        this.slides = slides;
        this.changed();
        $(window).triggerHandler('SmartSliderSidebarSlidesChanged');

        $('html').attr('data-slides', this.slides.length);
    };

    SlidesManager.prototype.unsetFirst = function () {
        for (var i = 0; i < this.slides.length; i++) {
            this.slides[i].unsetFirst();
        }
        this.changed();
    };

    SlidesManager.prototype.addQuickImage = function (e) {
        e.preventDefault();
        nextend.imageHelper.openMultipleLightbox($.proxy(this._addQuickImages, this));
    };

    SlidesManager.prototype.addBoxes = function (boxes) {

        boxes.insertBefore(this.slidesContainer.find('.n2-clear'));
        boxes.addClass('n2-ss-box-just-added').each($.proxy(function (i, el) {
            new scope.Slide(this, $(el));
        }, this));
        this.initSlides();
        setTimeout(function () {
            boxes.removeClass('n2-ss-box-just-added');
        }, 200);
    }

    SlidesManager.prototype._addQuickImages = function (images) {
        NextendAjaxHelper.ajax({
            type: 'POST',
            url: NextendAjaxHelper.makeAjaxUrl(this.ajaxUrl, {
                nextendaction: 'quickImages'
            }),
            data: {
                images: Base64.encode(JSON.stringify(images))
            }
        }).done($.proxy(function (response) {
            this.addBoxes($(response.data));
        }, this));
    };

    SlidesManager.prototype.addQuickVideo = function (e) {
        e.preventDefault();
        var manager = this;
        if (!this.quickVideoModal) {
            this.quickVideoModal = new NextendModal({
                zero: {
                    size: [
                        500,
                        350
                    ],
                    title: n2_('Add video'),
                    back: false,
                    close: true,
                    content: '<form class="n2-form"></form>',
                    controls: ['<a href="#" class="n2-button n2-button-normal n2-button-l n2-radius-s n2-button-green n2-uc n2-h4">' + n2_('Add video') + '</a>'],
                    fn: {
                        show: function () {
                            var button = this.controls.find('.n2-button'),
                                form = this.content.find('.n2-form').on('submit', function (e) {
                                    e.preventDefault();
                                    button.trigger('click');
                                }).append(this.createInput(n2_('Video url'), 'n2-slide-video-url', 'width: 446px;')),
                                videoUrlField = this.content.find('#n2-slide-video-url').focus();

                            this.content.append(this.createHeading(n2_('Examples')));
                            this.content.append(this.createTable([['YouTube', 'https://www.youtube.com/watch?v=lsq09izc1H4'], ['Vimeo', 'https://vimeo.com/144598279']], ['', '']));

                            button.on('click', $.proxy($.proxy(function (e) {
                                e.preventDefault();
                                var video = videoUrlField.val(),
                                    youtubeRegexp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/,
                                    youtubeMatch = video.match(youtubeRegexp),
                                    vimeoRegexp = /https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/,
                                    vimeoMatch = video.match(vimeoRegexp),
                                    html5Video = video.match(/\.(mp4)/i);

                                if (youtubeMatch) {
                                    NextendAjaxHelper.getJSON('https://www.googleapis.com/youtube/v3/videos?id=' + encodeURI(youtubeMatch[2]) + '&part=snippet&key=AIzaSyC3AolfvPAPlJs-2FgyPJdEEKS6nbPHdSM').done($.proxy(function (data) {
                                        if (data.items.length) {
                                            var snippet = data.items[0].snippet;

                                            var thumbnails = data.items[0].snippet.thumbnails,
                                                thumbnail = thumbnails.maxres || thumbnails.standard || thumbnails.high || thumbnails.medium || thumbnails.default;

                                            manager._addQuickVideo(this, {
                                                type: 'youtube',
                                                title: snippet.title,
                                                description: snippet.description,
                                                image: thumbnail.url,
                                                video: video
                                            });
                                        }
                                    }, this)).fail(function (data) {
                                        nextend.notificationCenter.error(data.error.errors[0].message);
                                    });
                                } else if (vimeoMatch) {
                                    NextendAjaxHelper.getJSON('https://vimeo.com/api/v2/video/' + vimeoMatch[3] + '.json').done($.proxy(function (data) {
                                        manager._addQuickVideo(this, {
                                            type: 'vimeo',
                                            title: data[0].title,
                                            description: data[0].description,
                                            video: vimeoMatch[3],
                                            image: data[0].thumbnail_large
                                        });
                                    }, this)).fail(function (data) {
                                        nextend.notificationCenter.error(data.responseText);
                                    });

                                } else if (html5Video) {
                                    nextend.notificationCenter.error('This video url is not supported!');
                                
                                } else {
                                    nextend.notificationCenter.error('This video url is not supported!');
                                }
                            }, this)));
                        }
                    }
                }
            });
        }
        this.quickVideoModal.show();
    };

    SlidesManager.prototype._addQuickVideo = function (modal, video) {
        NextendAjaxHelper.ajax({
            type: 'POST',
            url: NextendAjaxHelper.makeAjaxUrl(this.ajaxUrl, {
                nextendaction: 'quickVideo'
            }),
            data: {
                video: Base64.encode(encodeURIComponent(JSON.stringify(video)))
            }
        }).done($.proxy(function (response) {
            this.addBoxes($(response.data));

            this.initSlides();
        }, this));
        modal.hide();
    };

    SlidesManager.prototype.addQuickPost = function (e) {
        e.preventDefault();
        if (!this.quickPostModal) {
            var manager = this,
                cache = {},
                getContent = $.proxy(function (search) {
                    if (typeof cache[search] == 'undefined') {
                        cache[search] = NextendAjaxHelper.ajax({
                            type: "POST",
                            url: NextendAjaxHelper.makeAjaxUrl(this.contentAjaxUrl),
                            data: {
                                keyword: search
                            },
                            dataType: 'json'
                        });
                    }
                    return cache[search];
                }, this);

            this.quickPostModal = new NextendModal({
                zero: {
                    size: [
                        600,
                        430
                    ],
                    title: n2_('Add post'),
                    back: false,
                    close: true,
                    content: '<div class="n2-form"></div>',
                    fn: {
                        show: function () {

                            this.content.find('.n2-form').append(this.createInput(n2_('Keyword'), 'n2-ss-keyword', 'width:546px;'));
                            var search = $('#n2-ss-keyword'),
                                heading = this.createHeading('').appendTo(this.content),
                                result = this.createResult().appendTo(this.content),
                                searchString = '';

                            search.on('keyup', $.proxy(function () {
                                searchString = search.val();
                                getContent(searchString).done($.proxy(function (r) {
                                    if (search.val() == searchString) {
                                        if (searchString == '') {
                                            heading.html(n2_('No search term specified. Showing recent items.'));
                                        } else {
                                            heading.html(n2_printf(n2_('Showing items match for "%s"'), searchString));
                                        }

                                        var rows = r.data,
                                            data = [],
                                            modal = this;
                                        for (var i = 0; i < rows.length; i++) {
                                            data.push([rows[i].title, rows[i].info, $('<div class="n2-button n2-button-normal n2-button-xs n2-button-green n2-radius-s n2-uc n2-h5">' + n2_('Select') + '</div>')
                                                .on('click', {post: rows[i]}, function (e) {
                                                    manager._addQuickPost(modal, e.data.post);
                                                })]);
                                        }
                                        result.html('');
                                        this.createTable(data, ['width:100%;', '', '']).appendTo(this.createTableWrap().appendTo(result));
                                    }
                                }, this));
                            }, this))
                                .trigger('keyup').focus();
                        }
                    }
                }
            });
        }
        this.quickPostModal.show();
    };

    SlidesManager.prototype._addQuickPost = function (modal, post) {
        if (!post.image) {
            post.image = '';
        }
        NextendAjaxHelper.ajax({
            type: 'POST',
            url: NextendAjaxHelper.makeAjaxUrl(this.ajaxUrl, {
                nextendaction: 'quickPost'
            }),
            data: {
                post: post
            }
        }).done($.proxy(function (response) {
            this.addBoxes($(response.data));

            this.initSlides();
        }, this));
        modal.hide();
    };

    SlidesManager.prototype.initBulk = function () {

        this.selection = [];

        this.isBulkSelection = false;

        var selects = $('.n2-bulk-select').find('a');

        //Select all
        selects.eq(0).on('click', $.proxy(function (e) {
            e.preventDefault();
            this.bulkSelect(function (slide) {
                slide.select();
            });
        }, this));

        //Select none
        selects.eq(1).on('click', $.proxy(function (e) {
            e.preventDefault();
            this.bulkSelect(function (slide) {
                slide.deSelect();
            });
        }, this));

        //Select published
        selects.eq(2).on('click', $.proxy(function (e) {
            e.preventDefault();
            this.bulkSelect(function (slide) {
                if (slide.box.hasClass('n2-slide-state-published')) {
                    slide.select();
                } else {
                    slide.deSelect();
                }
            });
        }, this));

        //Select unpublished
        selects.eq(3).on('click', $.proxy(function (e) {
            e.preventDefault();
            this.bulkSelect(function (slide) {
                if (slide.box.hasClass('n2-slide-state-published')) {
                    slide.deSelect();
                } else {
                    slide.select();
                }
            });
        }, this));

        $('.n2-bulk-actions a').on('click', $.proxy(function (e) {
            var action = $(e.currentTarget).data('action');
            if (action) {
                e.preventDefault();
                this.bulkAction(action);
            }
        }, this));
    };

    SlidesManager.prototype.addSelection = function (slide) {
        if (this.selection.length == 0) {
            this.enterBulk();
        }
        this.selection.push(slide);
    }

    SlidesManager.prototype.removeSelection = function (slide) {
        this.selection.splice($.inArray(slide, this.selection), 1);
        if (this.selection.length == 0) {
            this.leaveBulk();
        }
    }

    SlidesManager.prototype.bulkSelect = function (cb) {
        for (var i = 0; i < this.slides.length; i++) {
            cb(this.slides[i]);
        }
    };

    SlidesManager.prototype.bulkAction = function (action) {
        var slides = [],
            ids = [];
        this.bulkSelect(function (slide) {
            if (slide.selected) {
                slides.push(slide);
                ids.push(slide.getId());
            }
        });
        if (ids.length) {
            this[action](ids, slides);
        } else {
            nextend.notificationCenter.notice('Please select one or more slides for the action!');
        }
    };

    SlidesManager.prototype.enterBulk = function () {
        if (!this.isBulkSelection) {
            this.isBulkSelection = true;
            this.slidesContainer.sortable('option', 'disabled', true);
            $('#n2-admin').addClass('n2-ss-has-box-selection');
        }
    };

    SlidesManager.prototype.leaveBulk = function () {
        if (this.isBulkSelection) {
            this.slidesContainer.sortable('option', 'disabled', false);
            $('#n2-admin').removeClass('n2-ss-has-box-selection');

            for (var i = 0; i < this.slides.length; i++) {
                this.slides[i].deSelect();
            }
            this.selection = [];
            this.isBulkSelection = false;
        }
    };

    SlidesManager.prototype.deleteSlides = function (ids, slides) {
        this.hideMenu();
        var title = slides[0].box.find('.n2-box-placeholder-title a').text();
        if (slides.length > 1) {
            title += ' and ' + (slides.length - 1) + ' more';
        }
        NextendDeleteModal('slide-delete', title, $.proxy(function () {
            NextendAjaxHelper.ajax({
                url: NextendAjaxHelper.makeAjaxUrl(this.ajaxUrl, {
                    nextendaction: 'delete'
                }),
                type: 'POST',
                data: {
                    slides: ids
                }
            }).done($.proxy(function () {
                for (var i = 0; i < slides.length; i++) {
                    slides[i].deleted();
                }
                this.initSlides();
                this.leaveBulk();
            }, this));
        }, this));
    };

    SlidesManager.prototype.duplicateSlides = function (ids, slides) {
        for (var i = 0; i < this.slides.length; i++) {
            if (this.slides[i].selected) {
                this.slides[i].duplicate($.Event("click", {
                    currentTarget: null
                }));
            }
        }
    };

    SlidesManager.prototype.copySlides = function (ids, slides) {
        this.showSliderSelector(n2_('Copy slide to ...'), $.proxy(function (sliderID) {
            NextendAjaxHelper.ajax({
                url: NextendAjaxHelper.makeAjaxUrl(this.ajaxUrl, {
                    nextendaction: 'copySlides',
                    targetSliderID: sliderID
                }),
                type: 'POST',
                data: {
                    slides: ids
                }
            });
        }, this));
    };

    SlidesManager.prototype.publishSlides = function (ids, slides) {
        NextendAjaxHelper.ajax({
            url: NextendAjaxHelper.makeAjaxUrl(this.ajaxUrl, {
                nextendaction: 'publish'
            }),
            type: 'POST',
            data: {
                slides: ids
            }
        }).done($.proxy(function () {
            for (var i = 0; i < slides.length; i++) {
                slides[i].published();
            }
            this.changed();
        }, this));
    };

    SlidesManager.prototype.unPublishSlides = function (ids, slides) {
        NextendAjaxHelper.ajax({
            url: NextendAjaxHelper.makeAjaxUrl(this.ajaxUrl, {
                nextendaction: 'unpublish'
            }),
            type: 'POST',
            data: {
                slides: ids
            }
        }).done($.proxy(function () {
            for (var i = 0; i < slides.length; i++) {
                slides[i].unPublished();
            }
            this.changed();
        }, this));
    };

    SlidesManager.prototype.initMenu = function () {
        this.slide = null;
        this.menu = $('#n2-ss-slide-menu').detach().addClass('n2-inited');

        this.menu.find('li').on('click', $.proxy(function (e) {
            e.stopPropagation();
            var action = $(e.currentTarget).data('action');
            if (action && typeof this.slide[action] === 'function') {
                this.slide[action](e);
            }
        }, this));

        this.menu.find('.n2-button').on('click', $.proxy(function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (this.menu.hasClass('n2-active')) {
                this.menu.removeClass('n2-active').off('mouseleave');
            } else {
                this.menu.addClass('n2-active').on('mouseleave', function () {
                    $(this).removeClass('n2-active');
                });
            }
        }, this));
    }


    SlidesManager.prototype.showMenu = function (slide) {
        this.slide = slide;
        this.menu.appendTo(slide.box);
    }

    SlidesManager.prototype.hideMenu = function () {
        this.menu.detach();
    }

    SlidesManager.prototype.showSliderSelector = function (title, cb) {
        var url = NextendAjaxHelper.makeFallbackUrl(this.ajaxUrl, {
            nextendcontroller: 'sliders',
            nextendaction: 'choose'
        });
        this.sliderSelectorModal = new NextendModal({
            zero: {
                size: [
                    970,
                    600
                ],
                title: title,
                back: false,
                close: true,
                content: '',
                fn: {
                    show: function () {
                        var iframe = $('<iframe src="' + url + '" width="970" height="540" style="margin: 0 -20px 0 -20px;"></iframe>').appendTo(this.content);

                        var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
                        window[eventMethod](eventMethod == "attachEvent" ? "onmessage" : "message", $.proxy(function (e) {
                            if (e.source == (iframe[0].contentWindow || iframe[0].contentDocument)) {
                                var data = e[e.message ? "message" : "data"];
                                cb(data);
                                this.hide();
                            }
                        }, this), false);

                    },
                    destroy: function () {
                        this.destroy();
                    }
                }
            }
        }, true);
    }

    return SlidesManager;
});
N2Require('SlideAdmin', [], [], function ($, scope, undefined) {
    function SlideAdmin() {
        /** @type {LayerAnimationManager} */
        this.layerAnimationManager = null;
        /** @type {SlideEditManager} */
        this.slideEditManager = null;
        /** @type {NextendSmartSliderAbstract} */
        this.frontend = null;
        /** @type {Generator} */
        this.generator = null;
        /** @type {CanvasManager} */
        this.canvasManager = null;
        /** @type {NextendSmartSliderSlideEditorHistory} */
        this.history = null;

        this.$currentSlideElement = null;
    };


    SlideAdmin.prototype.startEditor = function (sliderElementID, slideContentElementID, options) {
        if (this.slideEditManager === null) {
            this.slideEditManager = new scope.SlideEditManager(sliderElementID, slideContentElementID, options);
        }
        return this.slideEditManager;
    };

    window.nextend.pre = 'div#n2-ss-0 ';
    window.nextend.smartSlider = new SlideAdmin();

    return SlideAdmin;
})
N2Require('SlideEditManager', ['SlideAdmin'], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    function SlideEditManager(sliderElementID, slideContentElementID, options) {
        this.readyDeferred = $.Deferred();

        this.options = $.extend({
            slideAsFile: 0,
            isUploadDisabled: true,
            uploadUrl: '',
            uploadDir: ''
        }, options);


        this.warnInternetExplorerUsers();

        this.$slideContentElement = $('#' + slideContentElementID);
        this.slideStartValue = this.$slideContentElement.val();


        window[sliderElementID].started($.proxy(this.sliderStarted, this));
        if (options.isAddSample) {
            this.startSampleSlides();
        }
    };

    SlideEditManager.prototype.startSampleSlides = function () {
        var sampleSlidesUrl = 'https://smartslider3.com/slides/' + window.N2SS3VERSION + '/free/';
    

        var that = this,
            eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";

        var $iframe = $('<iframe src="' + sampleSlidesUrl + '"></iframe>').prependTo('.n2-ss-sample-slides-container'),
            iframe = $iframe[0];

        $('html, body').scrollTop($iframe.offset().top - $('#wpadminbar').height());

        var $settings = $('.n2-ss-sample-slide-settings');

        var $backgroundImage = $('#slidebackgroundImage'),
            $sampleBackgroundImage = $('#n2-ss-sample-slide-setting-background-image')
                .on('click', function () {
                    $backgroundImage.parent().find('.n2-form-element-button').trigger('click');
                }),
            cbUpdateBackgroundImage = function () {
                var image = $backgroundImage.val();
                if (image === '') {
                    $settings.removeClass('n2-ss-has-image');
                    $sampleBackgroundImage.css('background-image', 'url(//nextenddev.no-ip.org/roland/wordpress1/wp-content/plugins/nextend-smart-slider3-pro/nextend/media/images/placeholder/image.png)');
                    $('#slidebackground-type').val('color').trigger('change');
                } else {
                    $settings.addClass('n2-ss-has-image');
                    $('#slidebackground-type').val('image').trigger('change');
                    $sampleBackgroundImage.css('background-image', 'url(' + nextend.imageHelper.fixed(image) + ')');
                }
            };

        $sampleBackgroundImage.find('.n2-i-close').on('click', function (e) {
            e.stopPropagation();
            $backgroundImage.parent().find('.n2-form-element-clear').trigger('click');
        });

        $backgroundImage.on('nextendChange', cbUpdateBackgroundImage);
        cbUpdateBackgroundImage();

        var $opacityField = $('#slidebackgroundImageOpacity'),
            $opacitySlider = $('#n2-ss-sample-slide-setting-opacity-slider').removeAttr('slide').prop('slide', false).slider({
                min: 0,
                max: 100,
                step: 1,
                slide: function (event, ui) {
                    $opacityField.data('field').insideChange(ui.value);
                }
            }),
            cb = function (e) {
                $opacitySlider.slider('value', $opacityField.val());
            };

        $opacityField.on('nextendChange', cb);
        cb();

        var $blurField = $('#slidebackgroundImageBlur'),
            $blurSlider = $('#n2-ss-sample-slide-setting-blur-slider').removeAttr('slide').prop('slide', false).slider({
                min: 0,
                max: 40,
                step: 1,
                slide: function (event, ui) {
                    $blurField.data('field').insideChange(ui.value);
                }
            }),
            cb2 = function (e) {
                $blurSlider.slider('value', $blurField.val());
            };

        $blurField.on('nextendChange', cb2);
        cb2();

        var $colorField = $('#slidebackgroundColor'),
            $color = $('#n2-ss-sample-slide-setting-color')
                .n2spectrum({
                    showAlpha: 1,
                    preferredFormat: "hex8",
                    showInput: false,
                    showButtons: false,
                    move: function () {
                        var value = $color.n2spectrum("get").toHexString8();
                        $color.val(value);
                        $colorField.data('field').insideChange(value);
                    },
                    showSelectionPalette: true,
                    showPalette: true,
                    maxSelectionSize: 6,
                    localStorageKey: 'color',
                    palette: [
                        ['000000', '55aa39', '357cbd', 'bb4a28', '8757b2', '000000CC'],
                        ['81898d', '5cba3c', '4594e1', 'd85935', '9e74c2', '00000080'],
                        ['ced3d5', '27ae60', '01add3', 'e79d19', 'e264af', 'FFFFFFCC'],
                        ['ffffff', '2ecc71', '00c1c4', 'ecc31f', 'ec87c0', 'FFFFFF80']
                    ]
                }),
            cb3 = function (e) {
                var color = $colorField.val();
                if (color != $color.val()) {
                    $color.n2spectrum("set", color);
                }
            };
        $colorField.on('nextendChange', cb3);
        cb3();


        var $gradientDir = $('#slidebackgroundGradient'),
            cb4 = function () {
                if ($gradientDir.val() == 'off') {
                    $settings.removeClass('n2-ss-has-gradient');
                } else {
                    $settings.addClass('n2-ss-has-gradient');
                }
            };
        $gradientDir.on('nextendChange', cb4);
        cb4();

        var $gradientField = $('#slidebackgroundColorEnd'),
            gradient = $('#n2-ss-sample-slide-setting-gradient')
                .n2spectrum({
                    showAlpha: 1,
                    preferredFormat: "hex8",
                    showInput: false,
                    showButtons: false,
                    move: function () {
                        var value = gradient.n2spectrum("get").toHexString8();
                        $gradientField.data('field').insideChange(value);
                    },
                    showSelectionPalette: true,
                    showPalette: true,
                    maxSelectionSize: 6,
                    localStorageKey: 'color',
                    palette: [
                        ['000000', '55aa39', '357cbd', 'bb4a28', '8757b2', '000000CC'],
                        ['81898d', '5cba3c', '4594e1', 'd85935', '9e74c2', '00000080'],
                        ['ced3d5', '27ae60', '01add3', 'e79d19', 'e264af', 'FFFFFFCC'],
                        ['ffffff', '2ecc71', '00c1c4', 'ecc31f', 'ec87c0', 'FFFFFF80']
                    ]
                }),
            cb5 = function (e) {
                gradient.n2spectrum("set", $gradientField.val());
            };
        $gradientField.on('outsideChange', cb5);
        cb5();

        window[eventMethod](eventMethod == "attachEvent" ? "onmessage" : "message", function (e) {
            if (e.source == (iframe.contentWindow || iframe.contentDocument)) {
                var a = e[e.message ? "message" : "data"];
                if (a.key) {
                    switch (a.key) {
                        case 'sampleSlide':
                            var slide = JSON.parse(a.data);
                            that.settings.setData(slide.data, true);

                            that.canvasManager.mainContainer.replaceLayers(slide.layers);

                            if (that.canvasManager.currentEditorMode != 'content' && that.canvasManager.mainContent != undefined) {
                                that.canvasManager.updateEditorMode('content');
                            }
                            break;

                        case 'ready':
                            (iframe.contentWindow || iframe.contentDocument).postMessage({
                                key: 'ackReady'
                            }, "*");
                            if (that.options.isAddSample) {
                                (iframe.contentWindow || iframe.contentDocument).postMessage({
                                    key: 'create'
                                }, "*");
                                that.options.isAddSample = false;
                            }
                            break;
                    }
                }
            }
        }, false);
    }

    SlideEditManager.prototype.sliderStarted = function () {

        smartSlider.history = new scope.History();

        smartSlider.frontend = window["n2-ss-0"];
        smartSlider.frontend.visible(function () {
            $('body').addClass('n2-ss-slider-visible');
            var el = $("#n2-ss-slide-canvas-container"),
                tinyscrollbar = el
                    .tinyscrollbar({
                        axis: "x",
                        wheel: false,
                        wheelLock: false
                    })
                    .data('plugin_tinyscrollbar');
            if (typeof el.get(0).move === 'function') {
                el.get(0).move = null;
            }

            this.sliderElement.on('SliderResize', function () {
                tinyscrollbar.update("relative");
            });
        });

        smartSlider.$currentSlideElement = smartSlider.frontend.adminGetCurrentSlideElement();

        new scope.Generator();

        smartSlider.$currentSlideElement.addClass('n2-ss-currently-edited-slide');

        var staticSlide = smartSlider.frontend.parameters.isStaticEdited;

        this.settings = new scope.SlideSettings(staticSlide);

        this.canvasManager = new scope.CanvasManager(this, staticSlide, this.options);

        this.readyDeferred.resolve();

        $('#smartslider-form').on({
            checkChanged: $.proxy(this.prepareFormForCheck, this),
            submit: $.proxy(this.onSlideSubmit, this)
        });
    }

    SlideEditManager.prototype.ready = function (fn) {
        this.readyDeferred.done(fn);
    };

    SlideEditManager.prototype.prepareFormForCheck = function () {
        var data = JSON.stringify(this.canvasManager.getData()),
            startData = JSON.stringify(JSON.parse(Base64.decode(this.slideStartValue)));

        this.$slideContentElement.val(startData == data ? this.slideStartValue : Base64.encode(data));
    };

    SlideEditManager.prototype.onSlideSubmit = function (e) {
        if (!nextend.isPreview) {
            this.prepareForm();
            e.preventDefault();

            nextend.askToSave = false;

            //$('#n2-admin').removeClass('n2-ss-add-slide-with-sample');

            if (this.options.slideAsFile && typeof window.FormData !== undefined && typeof window.File !== 'undefined') {
                var fd = new FormData();
                var data = $('#smartslider-form').serializeArray();
                $.each(data, function (key, input) {
                    if (input.name == 'slide[slide]') {
                        try {
                            fd.append('slide', new File([input.value], "slide.txt"));
                        } catch (e) {
                            fd.append('slide', new Blob([input.value]));
                        }
                    } else {
                        fd.append(input.name, input.value);
                    }
                });

                NextendAjaxHelper.ajax({
                    url: NextendAjaxHelper.makeAjaxUrl(window.location.href),
                    type: 'POST',
                    data: fd,
                    contentType: false,
                    processData: false
                }).done($.proxy(this.afterSave, this));
            } else {
                NextendAjaxHelper.ajax({
                    type: 'POST',
                    url: NextendAjaxHelper.makeAjaxUrl(window.location.href),
                    data: $('#smartslider-form').serialize(),
                    dataType: 'json'
                }).done($.proxy(this.afterSave, this));
            }
        }
    };

    SlideEditManager.prototype.afterSave = function () {
        nextend.askToSave = true;
        $('#smartslider-form').trigger('saved');

        $('.n2-ss-edit-slide-top-details .n2-h1').html($('#slidetitle').val());
    };

    SlideEditManager.prototype.prepareForm = function () {
        if (smartSlider.ruler) {
            $('#slideguides').val(Base64.encode(JSON.stringify(smartSlider.ruler.toArray())));
        }

        this.$slideContentElement.val(Base64.encode(nextend.UnicodeToHTMLEntity(JSON.stringify(this.canvasManager.getData()))));
    };

    /**
     * Warn old version IE users that the editor may fail to work in their browser.
     * @private
     */
    SlideEditManager.prototype.warnInternetExplorerUsers = function () {
        var ie = this.isInternetExplorer();
        if (ie && ie < 10) {
            alert(window.ss2lang.The_editor_was_tested_under_Internet_Explorer_10_Firefox_and_Chrome_Please_use_one_of_the_tested_browser);
        }
    };

    /**
     * @returns Internet Explorer version number or false
     * @private
     */
    SlideEditManager.prototype.isInternetExplorer = function () {
        var myNav = navigator.userAgent.toLowerCase();
        return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
    };

    SlideEditManager.prototype.getLayout = function () {
        var propertiesRaw = $('#smartslider-form').serializeArray(),
            properties = {};

        for (var i = 0; i < propertiesRaw.length; i++) {
            var m = propertiesRaw[i].name.match(/slide\[(.*?)\]/);
            if (m) {
                properties[m[1]] = propertiesRaw[i].value;
            }
        }
        delete properties['generator'];
        delete properties['published'];
        delete properties['publishdates'];
        delete properties['record-start'];
        delete properties['record-slides'];
        delete properties['slide'];

        properties['slide'] = this.canvasManager.getData();
        return properties;
    };

    SlideEditManager.prototype.loadLayout = function (properties, slideDataOverwrite, layerOverwrite) {
        // we are working on references!
        var slide = properties['slide'];
        delete properties['slide'];
        if (layerOverwrite) {
            this.canvasManager.importLayers(slide, true);
        } else {
            this.canvasManager.importLayers(slide, false);
        }
        if (slideDataOverwrite) {
            for (var k in properties) {
                $('#slide' + k).val(properties[k]).trigger('change');
            }
        }
        properties['slide'] = slide;
    };

    SlideEditManager.prototype.getSelf = function () {
        return this;
    }

    SlideEditManager.prototype.copySlide = function () {
        var slide = {
            data: this.settings.getBackgroundData(),
            layers: this.canvasManager.getData()
        };
        $.jStorage.set('copiedSlide', JSON.stringify(slide));
    }

    SlideEditManager.prototype.pasteSlide = function () {
        var slide = $.jStorage.get('copiedSlide');
        if (slide) {
            slide = JSON.parse(slide);
            this.settings.setData(slide.data);

            this.canvasManager.mainContainer.replaceLayers(slide.layers);
        }
    }
    SlideEditManager.prototype.hasCopiedSlide = function () {
        var slide = $.jStorage.get('copiedSlide');
        if (slide) {
            return true;
        }
        return false;
    }

    return SlideEditManager;
});
N2Require('Generator', ['SlideAdmin'], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";
    function Generator() {
        this._refreshTimeout = null;
        this.modal = false;
        this.group = 0;
        smartSlider.generator = this;
        var variables = smartSlider.$currentSlideElement.data('variables');
        if (variables) {
            this.variables = variables;

            for (var i in this.variables) {
                if (!isNaN(parseFloat(i)) && isFinite(i)) {
                    this.group = Math.max(this.group, parseInt(i) + 1);
                }
            }

            this.fill = this.generatorFill;
            if (this.group > 0) {
                this.registerField = this.generatorRegisterField;

                this.button = $('<a href="#" class="n2-button n2-button-normal n2-button-xs n2-radius-s n2-button-blue n2-h5 n2-uc" style="position:absolute;right: -2px;top: -18px;">Variable</a>')
                    .on('click', $.proxy(function (e) {
                        e.preventDefault();
                        this.showModal();
                    }, this));
                this.registerField($('#slidetitle'));
                this.registerField($('#slidedescription'));
                this.registerField($('#slidethumbnail'));
                this.registerField($('#slidebackgroundImage'));
                this.registerField($('#slidebackgroundAlt'));
                this.registerField($('#slidebackgroundTitle'));
                this.registerField($('#slidebackgroundVideoMp4'));
                this.registerField($('#linkslidelink_0'));
                this.registerField($('#layergenerator-visible'));
                this.registerField($('#layergroup-generator-visible'));

                $('body').addClass('n2-ss-dynamic-slide');
                //this.showModal();
            }

            this.initSlideDataRefresh();
        } else {
            this.variables = null;
        }
    };

    Generator.prototype.isDynamicSlide = function () {
        return this.group > 0;
    };

    Generator.prototype.splitTokens = function (input) {
        var tokens = [];
        var currentToken = "";
        var nestingLevel = 0;
        for (var i = 0; i < input.length; i++) {
            var currentChar = input[i];
            if (currentChar === "," && nestingLevel === 0) {
                tokens.push(currentToken);
                currentToken = "";
            } else {
                currentToken += currentChar;
                if (currentChar === "(") {
                    nestingLevel++;
                }
                else if (currentChar === ")") {
                    nestingLevel--;
                }
            }
        }
        if (currentToken.length) {
            tokens.push(currentToken);
        }
        return tokens;
    }

    Generator.prototype.fill = function (value) {
        return value;
    };

    Generator.prototype.generatorFill = function (value) {
        return value.replace(/{((([a-z]+)\(([^}]+)\))|([a-zA-Z0-9][a-zA-Z0-9_\/]*))}/g, $.proxy(this.parseFunction, this));
    };

    Generator.prototype.parseFunction = function (s, s2, s3, functionName, argumentString, variable) {
        if (typeof variable == 'undefined') {

            var args = this.splitTokens(argumentString);
            for (var i = 0; i < args.length; i++) {
                args[i] = this.parseVariable(args[i]);
            }
            return this[functionName].apply(this, args);
        } else {
            return this.parseVariable(variable);
        }
    };

    Generator.prototype.parseVariable = function (variable) {
        var _string = variable.match(/^("|')(.*)("|')$/);
        if (_string) {
            return _string[2];
        }

        var functionMatch = variable.match(/((([a-z]+)\(([^}]+)\)))/);
        if (functionMatch) {
            return this.parseFunction.apply(this, functionMatch);
        } else {
            var variableMatch = variable.match(/([a-zA-Z][0-9a-zA-Z_]*)(\/([0-9a-z]+))?/);
            if (variableMatch) {
                var index = variableMatch[3];
                if (typeof index == 'undefined') {
                    index = 0;
                } else {
                    var i = parseInt(index);
                    if (!isNaN(i)) {
                        index = Math.max(index, 1) - 1;
                    }
                }
                if (typeof this.variables[index] != 'undefined' && typeof this.variables[index][variableMatch[1]] != 'undefined') {
                    return this.variables[index][variableMatch[1]];
                }
                return '';
            }
            return variable;
        }
    };

    Generator.prototype.fallback = function (variable, def) {
        if (variable == '') {
            return def;
        }
        return variable;
    };

    Generator.prototype.cleanhtml = function (variable) {
        return this.stripTags(variable, '<p><a><b><br /><br/><i>');
    };

    Generator.prototype.stripTags = function (input, allowed) {
        allowed = (((allowed || '') + '')
            .toLowerCase()
            .match(/<[a-z][a-z0-9]*>/g) || [])
            .join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
        var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
            commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
        return input.replace(commentsAndPhpTags, '')
            .replace(tags, function ($0, $1) {
                return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
            });
    }

    Generator.prototype.removehtml = function (variable) {
        return $('<div>' + variable + '</div>').text();
    };

    Generator.prototype.splitbychars = function (s, start, length) {
        return s.substr(start, length);
    };

    Generator.prototype.splitbywords = function (variable, start, length) {
        var s = variable,
            len = s.length,
            posStart = Math.max(0, start == 0 ? 0 : s.indexOf(' ', start)),
            posEnd = Math.max(0, length > len ? len : s.indexOf(' ', length));
        if (posEnd == 0 && length <= len) posEnd = len;
        return s.substr(posStart, posEnd);
    };

    Generator.prototype.findimage = function (variable, index) {
        var s = variable,
            re = /(<img.*?src=[\'"](.*?)[\'"][^>]*>)|(background(-image)??\s*?:.*?url\((["|\']?)?(.+?)(["|\']?)?\))/gi,
            r = [],
            tmp = null;

        index = typeof index != 'undefined' ? parseInt(index) - 1 : 0;

        while (tmp = re.exec(s)) {
            if (typeof tmp[2] != 'undefined') {
                r.push(tmp[2]);
            } else if (typeof tmp[6] != 'undefined') {
                r.push(tmp[6]);
            }
        }

        if (r.length) {
            if (r.length > index) {
                return r[index];
            } else {
                return r[r.length - 1];
            }
        } else {
            return '';
        }
    };

    Generator.prototype.findlink = function (variable, index) {
        var s = variable,
            re = /href=["\']?([^"\'>]+)["\']?/gi,
            r = [],
            tmp = null;

        index = typeof index != 'undefined' ? parseInt(index) - 1 : 0;

        while (tmp = re.exec(s)) {
            if (typeof tmp[1] != 'undefined') {
                r.push(tmp[1]);
            }
        }

        if (r.length) {
            if (r.length > index) {
                return r[index];
            } else {
                return r[r.length - 1];
            }
        } else {
            return '';
        }
    };

    Generator.prototype.removevarlink = function (variable) {
        var s = String(variable),
            re = /<a href=\"(.*?)\">(.*?)<\/a>/g;

        return s.replace(re, '');
    };

    Generator.prototype.registerField = function (field) {
    };

    Generator.prototype.generatorRegisterField = function (field) {
        var parent = field.parent();
        parent.on({
            mouseenter: $.proxy(function () {
                this.activeField = field;
                this.button.prependTo(parent);
            }, this)
        });
    };

    Generator.prototype.getModal = function () {
        var that = this;
        if (!this.modal) {
            var active = {
                    key: '',
                    group: 1,
                    filter: 'no',
                    split: 'no',
                    splitStart: 0,
                    splitLength: 300,
                    findImage: 0,
                    findImageIndex: 1,
                    findLink: 0,
                    findLinkIndex: 1,
                    removeVarLink: 0
                },
                getVariableString = function () {
                    var variable = active.key + '/' + active.group;
                    if (active.findImage) {
                        variable = 'findimage(' + variable + ',' + Math.max(1, active.findImageIndex) + ')';
                    }
                    if (active.findLink) {
                        variable = 'findlink(' + variable + ',' + Math.max(1, active.findLinkIndex) + ')';
                    }
                    if (active.removeVarLink) {
                        variable = 'removevarlink(' + variable + ')';
                    }
                    if (active.filter != 'no') {
                        variable = active.filter + '(' + variable + ')';
                    }
                    if (active.split != 'no' && active.splitStart >= 0 && active.splitLength > 0) {
                        variable = active.split + '(' + variable + ',' + active.splitStart + ',' + active.splitLength + ')';
                    }
                    return '{' + variable + '}';
                },
                resultContainer = $('<div class="n2-generator-result-container" />'),
                updateResult = function () {
                    resultContainer.html($('<div/>').text(that.fill(getVariableString())).html());
                };

            var group = that.group,
                variables = null,
                groups = null,
                content = $('<div class="n2-generator-insert-variable"/>');


            var groupHeader = NextendModal.prototype.createHeading(n2_('Choose the group')).appendTo(content);
            var groupContainer = $('<div class="n2-group-container" />').appendTo(content);


            content.append(NextendModal.prototype.createHeading(n2_('Choose the variable')));
            var variableContainer = $('<div class="n2-variable-container" />').appendTo(content);

            //content.append(NextendModal.prototype.createHeading('Functions'));
            var functionsContainer = $('<div class="n2-generator-functions-container n2-form-element-mixed" />')
                .appendTo($('<div class="n2-form" />').appendTo(content));

            content.append(NextendModal.prototype.createHeading(n2_('Result')));
            resultContainer.appendTo(content);


            $('<div class="n2-mixed-group"><div class="n2-mixed-label"><label>' + n2_('Filter') + '</label></div><div class="n2-mixed-element"><div class="n2-form-element-list"><select autocomplete="off" name="filter" id="n2-generator-function-filter"><option selected="selected" value="no">' + n2_('No') + '</option><option value="cleanhtml">' + n2_('Clean HTML') + '</option><option value="removehtml">' + n2_('Remove HTML') + '</option></select></div></div></div>')
                .appendTo(functionsContainer);
            var filter = functionsContainer.find('#n2-generator-function-filter');
            filter.on('change', $.proxy(function () {
                active.filter = filter.val();
                updateResult();
            }, this));


            $('<div class="n2-mixed-group"><div class="n2-mixed-label"><label>' + n2_('Split by chars') + '</label></div><div class="n2-mixed-element"><div class="n2-form-element-list"><select autocomplete="off" name="split" id="n2-generator-function-split"><option selected="selected" value="no">' + n2_('No') + '</option><option value="splitbychars">' + n2_('Strict') + '</option><option value="splitbywords">' + n2_('Respect words') + '</option></select></div><div class="n2-form-element-text n2-text-has-unit n2-border-radius"><div class="n2-text-sub-label n2-h5 n2-uc">' + n2_('Start') + '</div><input type="text" autocomplete="off" style="width: 22px;" class="n2-h5" value="0" id="n2-generator-function-split-start"></div><div class="n2-form-element-text n2-text-has-unit n2-border-radius"><div class="n2-text-sub-label n2-h5 n2-uc">' + n2_('Length') + '</div><input type="text" autocomplete="off" style="width: 22px;" class="n2-h5" value="300" id="n2-generator-function-split-length"></div></div></div>')
                .appendTo(functionsContainer);
            var split = functionsContainer.find('#n2-generator-function-split');
            split.on('change', $.proxy(function () {
                active.split = split.val();
                updateResult();
            }, this));
            var splitStart = functionsContainer.find('#n2-generator-function-split-start');
            splitStart.on('change', $.proxy(function () {
                active.splitStart = parseInt(splitStart.val());
                updateResult();
            }, this));
            var splitLength = functionsContainer.find('#n2-generator-function-split-length');
            splitLength.on('change', $.proxy(function () {
                active.splitLength = parseInt(splitLength.val());
                updateResult();
            }, this));


            $('<div class="n2-mixed-group"><div class="n2-mixed-label"><label>' + n2_('Find image') + '</label></div><div class="n2-mixed-element"><div class="n2-form-element-onoff"><div class="n2-onoff-slider"><div class="n2-onoff-no"><i class="n2-i n2-i-close"></i></div><div class="n2-onoff-round"></div><div class="n2-onoff-yes"><i class="n2-i n2-i-tick"></i></div></div><input type="hidden" autocomplete="off" value="0" id="n2-generator-function-findimage"></div><div class="n2-form-element-text n2-text-has-unit n2-border-radius"><div class="n2-text-sub-label n2-h5 n2-uc">' + n2_('Index') + '</div><input type="text" autocomplete="off" style="width: 22px;" class="n2-h5" value="1" id="n2-generator-function-findimage-index"></div></div></div>')
                .appendTo(functionsContainer);

            var findImage = functionsContainer.find('#n2-generator-function-findimage');
            findImage.on('nextendChange', $.proxy(function () {
                active.findImage = parseInt(findImage.val());
                updateResult();
            }, this));
            var findImageIndex = functionsContainer.find('#n2-generator-function-findimage-index');
            findImageIndex.on('change', $.proxy(function () {
                active.findImageIndex = parseInt(findImageIndex.val());
                updateResult();
            }, this));


            $('<div class="n2-mixed-group"><div class="n2-mixed-label"><label>' + n2_('Find link') + '</label></div><div class="n2-mixed-element"><div class="n2-form-element-onoff"><div class="n2-onoff-slider"><div class="n2-onoff-no"><i class="n2-i n2-i-close"></i></div><div class="n2-onoff-round"></div><div class="n2-onoff-yes"><i class="n2-i n2-i-tick"></i></div></div><input type="hidden" autocomplete="off" value="0" id="n2-generator-function-findlink"></div><div class="n2-form-element-text n2-text-has-unit n2-border-radius"><div class="n2-text-sub-label n2-h5 n2-uc">' + n2_('Index') + '</div><input type="text" autocomplete="off" style="width: 22px;" class="n2-h5" value="1" id="n2-generator-function-findlink-index"></div></div></div>')
                .appendTo(functionsContainer);

            var findLink = functionsContainer.find('#n2-generator-function-findlink');
            findLink.on('nextendChange', $.proxy(function () {
                active.findLink = parseInt(findLink.val());
                updateResult();
            }, this));
            var findLinkIndex = functionsContainer.find('#n2-generator-function-findlink-index');
            findLinkIndex.on('change', $.proxy(function () {
                active.findLinkIndex = parseInt(findLinkIndex.val());
                updateResult();
            }, this));


            $('<div class="n2-mixed-group"><div class="n2-mixed-label"><label>' + n2_('Remove links') + '</label></div><div class="n2-mixed-element"><div class="n2-form-element-onoff"><div class="n2-onoff-slider"><div class="n2-onoff-no"><i class="n2-i n2-i-close"></i></div><div class="n2-onoff-round"></div><div class="n2-onoff-yes"><i class="n2-i n2-i-tick"></i></div></div><input type="hidden" autocomplete="off" value="0" id="n2-generator-function-removevarlink"></div></div></div>')
                .appendTo(functionsContainer);

            var removeVarLink = functionsContainer.find('#n2-generator-function-removevarlink');
            removeVarLink.on('nextendChange', $.proxy(function () {
                active.removeVarLink = parseInt(removeVarLink.val());
                updateResult();
            }, this));
            var removeVarLinkIndex = functionsContainer.find('#n2-generator-function-removevarlink-index');
            removeVarLinkIndex.on('change', $.proxy(function () {
                active.removeVarLinkIndex = parseInt(removeVarLinkIndex.val());
                updateResult();
            }, this));

            for (var k in this.variables[0]) {
                $('<a href="#" class="n2-button n2-button-normal n2-button-s n2-button-grey n2-radius-s">' + k + '</a>')
                    .on('click', $.proxy(function (key, e) {
                        e.preventDefault();
                        variables.removeClass('n2-active');
                        $(e.currentTarget).addClass('n2-active');
                        active.key = key;
                        updateResult();
                    }, this, k))
                    .appendTo(variableContainer);
            }

            variables = variableContainer.find('a');
            variables.eq(0).trigger('click');

            if (group == 1) {
                groupHeader.css('display', 'none');
                groupContainer.css('display', 'none');
            }
            for (var i = 0; i < group; i++) {
                $('<a href="#" class="n2-button n2-button-normal n2-button-s n2-button-grey n2-radius-s">' + (i + 1) + '</a>')
                    .on('click', $.proxy(function (groupIndex, e) {
                        e.preventDefault();
                        groups.removeClass('n2-active');
                        $(e.currentTarget).addClass('n2-active');
                        active.group = groupIndex + 1;
                        updateResult();
                    }, this, i))
                    .appendTo(groupContainer);
            }
            groups = groupContainer.find('a');
            groups.eq(0).trigger('click');

            var inited = false;

            this.modal = new NextendModal({
                zero: {
                    size: [
                        1000,
                        group > 1 ? 560 : 490
                    ],
                    title: n2_('Insert variable'),
                    back: false,
                    close: true,
                    content: content,
                    controls: ['<a href="#" class="n2-button n2-button-normal n2-button-l n2-radius-s n2-button-green">' + n2_('Insert') + '</a>'],
                    fn: {
                        show: function () {
                            if (!inited) {
                                new N2Classes.FormElementOnoff("n2-generator-function-findimage");
                                new N2Classes.FormElementOnoff("n2-generator-function-findlink");
                                new N2Classes.FormElementOnoff("n2-generator-function-removevarlink");
                                inited = true;
                            }
                            this.controls.find('.n2-button').on('click', $.proxy(function (e) {
                                e.preventDefault();
                                that.insert(getVariableString());
                                this.hide(e);
                            }, this));
                        }
                    }
                }
            }, false);

            this.modal.setCustomClass('n2-ss-generator-modal');
        }
        return this.modal;
    };

    Generator.prototype.showModal = function () {

        this.getModal().show();
    };

    Generator.prototype.insert = function (value) {
        this.activeField.val(value).trigger('change');
    };

    Generator.prototype.initSlideDataRefresh = function () {

        var name = $('#slidetitle').on('nextendChange', $.proxy(function () {
            this.variables.slide.name = name.val();
            this.refresh();
        }, this));

        var description = $('#slidedescription').on('nextendChange', $.proxy(function () {
            this.variables.slide.description = description.val();
            this.refresh();
        }, this));

    };


    Generator.prototype.refresh = function () {
        if (this._refreshTimeout) {
            clearTimeout(this._refreshTimeout);
            this._refreshTimeout = null;
        }
        this._refreshTimeout = setTimeout($.proxy(this._refresh, this), 100);
    };

    Generator.prototype._refresh = function () {
        var layers = smartSlider.canvasManager.mainContainer.container.getAllLayers();
        for (var j = 0; j < layers.length; j++) {
            if (layers[j].type == 'layer') {
                layers[j].item.reRender();
            }
        }
    };

    return Generator;
});
N2Require('History', [], [], function ($, scope, undefined) {
    "use strict";

    function History() {
        this.historyStates = 50;
        this.enabled = this.historyStates != 0;
        this.historyAddAllowed = true;
        this.isBatched = false;
        this.currentBatch = this;
        this.index = -1;
        this.stackedOff = [];

        /**
         @type {Array.<Array.<Task>>}
         */
        this.tasks = [];

        this.preventUndoRedo = false;

        this.undoBTN = $('#n2-ss-undo').on({
            click: $.proxy(this.undo, this),
            mousedown: function (e) {
                nextend.context.setMouseDownArea('undo', e);
            }
        });
        this.redoBTN = $('#n2-ss-redo').on({
            click: $.proxy(this.redo, this),
            mousedown: function (e) {
                nextend.context.setMouseDownArea('redo', e);
            }
        });
        this.updateUI();
    };

    History.prototype.updateUI = function () {
        if (this.index == 0 || this.tasks.length == 0) {
            this.undoBTN.removeClass('n2-active');
        } else {
            this.undoBTN.addClass('n2-active');
        }

        if (this.index == -1 || this.index >= this.tasks.length) {
            this.redoBTN.removeClass('n2-active');
        } else {
            this.redoBTN.addClass('n2-active');
        }
    };

    History.prototype.throttleUndoRedo = function () {
        if (!this.preventUndoRedo) {
            this.preventUndoRedo = true;
            setTimeout($.proxy(function () {
                this.preventUndoRedo = false;
            }, this), 100);
            return false;
        }
        return true;
    };

    History.prototype.isEnabled = function () {
        return this.enabled && this.historyAddAllowed;
    }

    /**
     *
     * @returns {Batch}
     */
    History.prototype.startBatch = function () {
        if (this.isEnabled()) {
            var batch = new Batch(this.currentBatch);
            this.currentBatch._add(batch);
            this.currentBatch = batch;
            return batch;
        }
        return false;
    }

    History.prototype.endBatch = function () {
        if (this.isEnabled()) {
            if (this.currentBatch.parent == undefined) {
                debugger;
            }
            this.currentBatch = this.currentBatch.parent;
        }
    }

    History.prototype.addControl = function (mode) {
        return this.currentBatch._add(new Control(mode));
    }

    History.prototype.addSimple = function (that, undoAction, redoAction, context) {
        if (this.isEnabled()) {
            return this.currentBatch._add(new Task(that, undoAction, redoAction, context));
        }
        return false;
    }

    /**
     *
     * @param that
     * @param action
     * @param undoValue
     * @param redoValue
     * @param context
     * @returns {TaskValue}
     */
    History.prototype.addValue = function (that, action, context) {
        if (this.isEnabled()) {
            if (this.isBatched || this.currentBatch != this) {
                var currentBatch = this.getCurrentBatchStack();
                for (var i = 0; i < currentBatch.length; i++) {
                    if (currentBatch[i].isEqual(that, action, context)) {
                        currentBatch.push(currentBatch.splice(i, 1)[0]);
                        return currentBatch[currentBatch.length - 1];
                    }
                }
            }
            return this.currentBatch._add(new TaskValue(that, action, action, context));
        }
        return false;
    }

    History.prototype.getCurrentBatchStack = function () {
        if (this.currentBatch != this) {
            return this.currentBatch.tasks;
        }
        return this.tasks[this.tasks.length - 1];
    }

    /**
     *
     * @param {Task} task
     * @returns {Task}
     */
    History.prototype._add = function (task) {
        if (this.index != -1) {
            this.tasks.splice(this.index, this.tasks.length);
        }
        this.index = -1;
        if (!this.isBatched) {
            this.tasks.push([task]);
            this.isBatched = true;
            setTimeout($.proxy(function () {
                this.isBatched = false;
            }, this), 100);
        } else {
            this.tasks[this.tasks.length - 1].push(task);
        }

        if (this.tasks.length > this.historyStates) {
            this.tasks.unshift();
        }
        this.updateUI();
        return task;
    };

    History.prototype.off = function () {
        this.historyAddAllowed = false;
        this.stackedOff.push(1);
    };

    History.prototype.on = function () {
        this.stackedOff.pop();
        if (this.stackedOff.length == 0) {
            this.historyAddAllowed = true;
        }
    };

    History.prototype.undo = function (e) {
        if (e) {
            e.preventDefault();
        }
        if (this.throttleUndoRedo()) {
            return false;
        }
        this.off();
        if (this.index == -1) {
            this.index = this.tasks.length - 1;
        } else {
            this.index--;
        }
        if (this.index >= 0) {
            var tasks = this.tasks[this.index];

            for (var i = tasks.length - 1; i >= 0; i--) {
                if (!tasks[i].undo()) {
                    break;
                }
            }
        } else {
            this.index = 0;
            // No more undo
        }
        this.on();
        this.updateUI();
        return true;
    };

    History.prototype.redo = function (e) {
        if (e) {
            e.preventDefault();
        }
        if (this.throttleUndoRedo()) {
            return false;
        }
        this.off();
        if (this.index != -1) {
            if (this.index < this.tasks.length) {
                var tasks = this.tasks[this.index];
                this.index++;
                for (var i = 0; i < tasks.length; i++) {
                    if (!tasks[i].redo()) {
                        break;
                    }
                }
            } else {
                // No more redo
            }
        } else {
            // No redo
        }
        this.on();
        this.updateUI();
        return true;
    };

    function Batch(parent) {
        this.parent = parent;
        this.tasks = [];
    }

    Batch.prototype._add = function (task) {
        this.tasks.push(task);
        return task;
    }

    Batch.prototype.invertUndo = function () {
        this.undo = function () {
            for (var i = this.tasks.length - 1; i >= 0; i--) {
                if (!this.tasks[i].undo()) {
                    break;
                }
            }
            return true;
        }
        return this;
    }

    Batch.prototype.undo = function () {
        for (var i = 0; i < this.tasks.length; i++) {
            if (!this.tasks[i].undo()) {
                break;
            }
        }
        return true;
    }

    Batch.prototype.redo = function () {
        for (var i = 0; i < this.tasks.length; i++) {
            if (!this.tasks[i].redo()) {
                break;
            }
        }
        return true;
    }

    Batch.prototype.isEqual = function () {
        return false;
    }

    function Control(mode) {
        switch (mode) {
            case 'skipForwardUndos':
                this.undo = function () {
                    return false;
                }
                break;
        }
    }


    Control.prototype.undo = function () {
        return true;
    }

    Control.prototype.redo = function () {
        return true;
    }

    Control.prototype.isEqual = function () {
        return false;
    }

    function Task(that, undoAction, redoAction, context) {
        this.that = that;
        this.undoAction = undoAction;
        this.redoAction = redoAction;
        this.context = context || [];
    }


    Task.prototype.undo = function () {
        this.undoAction.apply(this.that.getSelf(), this.context);
        return true;
    }

    Task.prototype.redo = function () {
        this.redoAction.apply(this.that.getSelf(), this.context);
        return true;
    }

    Task.prototype.isEqual = function () {
        return false;
    }

    function TaskValue() {
        Task.prototype.constructor.apply(this, arguments);
    }

    TaskValue.prototype = Object.create(Task.prototype);
    TaskValue.prototype.constructor = TaskValue;

    TaskValue.prototype.setValues = function (undoValue, redoValue) {
        this.undoValue = undoValue;
        this.redoValue = redoValue;
    }

    TaskValue.prototype.undo = function () {
        this.context.unshift(this.undoValue)
        this.undoAction.apply(this.that.getSelf(), this.context);
        this.context.shift();
        return true;
    }

    TaskValue.prototype.redo = function () {
        this.context.unshift(this.redoValue)
        this.redoAction.apply(this.that.getSelf(), this.context);
        this.context.shift();
        return true;
    }

    TaskValue.prototype.isEqual = function (that, action, context) {
        if (that == this.that && action == this.undoAction) {
            for (var i = 0; i < context.length; i++) {
                if (context[i] != this.context[i]) {
                    return false;
                }
            }
            this.setValues = function (undoValue, redoValue) {
                this.redoValue = redoValue;
            }
            return true;
        }
        return false;
    }

    return History;
});

N2Require('InlineField', [], [], function ($, scope, undefined) {

    function InlineField() {

        this.$input = $('<input type="text" name="name" />')
            .on({
                mouseup: function (e) {
                    e.stopPropagation();
                },
                keyup: $.proxy(function (e) {
                    if (e.keyCode == 27) {
                        this.cancel();
                    }
                }, this),
                blur: $.proxy(this.save, this)
            });

        this.$form = $('<form class="n2-inline-form"></form>')
            .append(this.$input)
            .on('submit', $.proxy(this.save, this));
    }

    InlineField.prototype.injectNode = function ($targetNode, value) {
        this.$input.val(value);
        $targetNode.append(this.$form);
        this.$input.focus();
    };

    InlineField.prototype.save = function (e) {
        e.preventDefault();
        this.$input.trigger('valueChanged', [this.$input.val()]);
        this.$input.off('blur');
        this.destroy();
    };

    InlineField.prototype.cancel = function () {
        this.$input.trigger('cancel');
        this.destroy();
    };

    InlineField.prototype.destroy = function () {
        this.$input.off('blur')
        this.$form.remove();
    };

    return InlineField;
});
N2Require('SlideSettings', ['SlideEditManager'], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    function SlideSettings(isStatic) {
        this.isStatic = isStatic;

        var $fields = $('#smartslider-form').find('input[id][name^="slide"], textarea[id][name^="slide"]'),
            fields = {};
        $fields.each($.proxy(function (i, el) {
            var $field = $(el),
                name = $field.attr('name').match(/slide\[(.*)\]/)[1];
            fields[name] = $field.on('nextendChange', $.proxy(this.onChange, this, name));
        }, this));

        this.fields = fields;

        this.slideBackground = smartSlider.$currentSlideElement.data('slideBackground');

        if (!isStatic) {

            this.backgroundImageElement = smartSlider.$currentSlideElement.find('.nextend-slide-bg');
            this.canvas = smartSlider.$currentSlideElement.find('.n2-ss-slide-background');

            this.currentBackgroundType = this.fields['background-type'].val();

            // Auto fill thumbnail if empty
            var thumbnail = $('#slidethumbnail');
            if (thumbnail.val() == '') {
                var itemImage = $('#item_imageimage'),
                    cb = $.proxy(function (image) {
                        if (image != '' && image != '$system$/images/placeholder/image.png') {
                            thumbnail.val(image).trigger('change');
                            this.fields.backgroundImage.off('.slidethumbnail');
                            itemImage.off('.slidethumbnail');
                        }
                    }, this);
                this.fields.backgroundImage.on('nextendChange.slidethumbnail', $.proxy(function () {
                    cb(this.fields.backgroundImage.val());
                }, this));
                itemImage.on('nextendChange.slidethumbnail', $.proxy(function () {
                    cb(itemImage.val());
                }, this));
            }
        }

        this.createHistory();
    }

    SlideSettings.prototype.createHistory = function () {
        this.values = {};
        $('#smartslider-form').find('input[id][name^="slide"], textarea[id][name^="slide"]').not('#slideslide').each($.proxy(function (i, el) {
            var $input = $(el),
                field = $input.data('field'),
                id = $input.attr('id');
            this.values[id] = $input.val();
            $input.on('nextendChange', $.proxy(function () {
                var newValue = $input.val();

                var task = smartSlider.history.addValue(this, this.historyUpdateSlideValue, [field]);
                if (task) {
                    task.setValues(this.values[id], newValue);
                }

                this.values[id] = newValue;
            }, this));
        }, this));
    }

    SlideSettings.prototype.getSelf = function () {
        return this;
    }

    SlideSettings.prototype.historyUpdateSlideValue = function (value, field) {
        field.insideChange(value);
    }

    SlideSettings.prototype.getAllData = function () {

        var data = {};

        for (var k in this.fields) {
            data[k] = this.fields[k].val();
        }

        return data;
    }

    var backgroundFields = ['thumbnail', 'background-type', 'backgroundColor', 'backgroundGradient', 'backgroundColorEnd', 'backgroundImage', 'backgroundImageOpacity', 'backgroundImageBlur', 'backgroundFocusX', 'backgroundFocusY', 'backgroundMode'];

    SlideSettings.prototype.getBackgroundData = function () {

        var data = {};

        for (var i = 0; i < backgroundFields.length; i++) {
            data[backgroundFields[i]] = this.fields[backgroundFields[i]].val();
        }

        return data;
    }

    SlideSettings.prototype.setData = function (data, disableVisualLoad) {

        if (disableVisualLoad) {
            this.slideBackground.setVisualLoad(false);
        }

        for (var k in data) {
            this.fields[k].val(data[k]).trigger('change');
        }

        if (disableVisualLoad) {
            this.slideBackground.setVisualLoad(false);
        }
    }

    SlideSettings.prototype.onChange = function (name, e) {
        if (typeof this['sync_' + name] === 'function') {
            this['sync_' + name].call(this);
        }
    }

    SlideSettings.prototype.sync_backgroundColor =
        SlideSettings.prototype.sync_backgroundGradient =
            SlideSettings.prototype.sync_backgroundColorEnd = function () {
                this.updateBackgroundColor();
            }

    SlideSettings.prototype.updateBackgroundColor = function () {
        var backgroundColor = this.fields.backgroundColor.val(),
            gradient = this.fields.backgroundGradient.val();
        if (gradient != 'off') {
            var backgroundColorEnd = this.fields.backgroundColorEnd.val(),
                canvas = this.canvas.css({background: '', filter: ''});

            switch (gradient) {
                case 'horizontal':
                    canvas
                        .css('background', '#' + backgroundColor.substr(0, 6))
                        .css('background', '-moz-linear-gradient(left, ' + N2Color.hex2rgbaCSS(backgroundColor) + ' 0%,' + N2Color.hex2rgbaCSS(backgroundColorEnd) + ' 100%)')
                        .css('background', ' -webkit-linear-gradient(left, ' + N2Color.hex2rgbaCSS(backgroundColor) + ' 0%,' + N2Color.hex2rgbaCSS(backgroundColorEnd) + ' 100%)')
                        .css('background', 'linear-gradient(to right, ' + N2Color.hex2rgbaCSS(backgroundColor) + ' 0%,' + N2Color.hex2rgbaCSS(backgroundColorEnd) + ' 100%)')
                        .css('background', 'filter: progid:DXImageTransform.Microsoft.gradient( startColorstr=\'#' + backgroundColor.substr(0, 6) + '\', endColorstr=\'#' + backgroundColorEnd.substr(0, 6) + '\',GradientType=1)');
                    break;
                case 'vertical':
                    canvas
                        .css('background', '#' + backgroundColor.substr(0, 6))
                        .css('background', '-moz-linear-gradient(top, ' + N2Color.hex2rgbaCSS(backgroundColor) + ' 0%,' + N2Color.hex2rgbaCSS(backgroundColorEnd) + ' 100%)')
                        .css('background', ' -webkit-linear-gradient(top, ' + N2Color.hex2rgbaCSS(backgroundColor) + ' 0%,' + N2Color.hex2rgbaCSS(backgroundColorEnd) + ' 100%)')
                        .css('background', 'linear-gradient(to bottom, ' + N2Color.hex2rgbaCSS(backgroundColor) + ' 0%,' + N2Color.hex2rgbaCSS(backgroundColorEnd) + ' 100%)')
                        .css('background', 'filter: progid:DXImageTransform.Microsoft.gradient( startColorstr=\'#' + backgroundColor.substr(0, 6) + '\', endColorstr=\'#' + backgroundColorEnd.substr(0, 6) + '\',GradientType=0)');
                    break;
                case 'diagonal1':
                    canvas
                        .css('background', '#' + backgroundColor.substr(0, 6))
                        .css('background', '-moz-linear-gradient(45deg, ' + N2Color.hex2rgbaCSS(backgroundColor) + ' 0%,' + N2Color.hex2rgbaCSS(backgroundColorEnd) + ' 100%)')
                        .css('background', ' -webkit-linear-gradient(45deg, ' + N2Color.hex2rgbaCSS(backgroundColor) + ' 0%,' + N2Color.hex2rgbaCSS(backgroundColorEnd) + ' 100%)')
                        .css('background', 'linear-gradient(45deg, ' + N2Color.hex2rgbaCSS(backgroundColor) + ' 0%,' + N2Color.hex2rgbaCSS(backgroundColorEnd) + ' 100%)')
                        .css('background', 'filter: progid:DXImageTransform.Microsoft.gradient( startColorstr=\'#' + backgroundColor.substr(0, 6) + '\', endColorstr=\'#' + backgroundColorEnd.substr(0, 6) + '\',GradientType=1)');
                    break;
                case 'diagonal2':
                    canvas
                        .css('background', '#' + backgroundColor.substr(0, 6))
                        .css('background', '-moz-linear-gradient(-45deg, ' + N2Color.hex2rgbaCSS(backgroundColor) + ' 0%,' + N2Color.hex2rgbaCSS(backgroundColorEnd) + ' 100%)')
                        .css('background', ' -webkit-linear-gradient(-45deg, ' + N2Color.hex2rgbaCSS(backgroundColor) + ' 0%,' + N2Color.hex2rgbaCSS(backgroundColorEnd) + ' 100%)')
                        .css('background', 'linear-gradient(-45deg, ' + N2Color.hex2rgbaCSS(backgroundColor) + ' 0%,' + N2Color.hex2rgbaCSS(backgroundColorEnd) + ' 100%)')
                        .css('background', 'filter: progid:DXImageTransform.Microsoft.gradient( startColorstr=\'#' + backgroundColor.substr(0, 6) + '\', endColorstr=\'#' + backgroundColorEnd.substr(0, 6) + '\',GradientType=1)');
                    break;
            }


        } else {
            if (backgroundColor.substr(6, 8) == '00') {
                this.canvas.css('background', '');
            } else {
                this.canvas.css('background', '#' + backgroundColor.substr(0, 6))
                    .css('background', N2Color.hex2rgbaCSS(backgroundColor));
            }
        }
    };

    SlideSettings.prototype.sync_backgroundImage = function () {
        this['sync_background-type']();
    }

    SlideSettings.prototype['sync_background-type'] = function () {
        var type = this.fields['background-type'].val();
        if (type == 'color') {
            this.slideBackground.setDesktopSrc('');
        } else {
            this.slideBackground.setDesktopSrc(smartSlider.generator.fill(this.fields.backgroundImage.val()));
        }
    }

    SlideSettings.prototype.sync_backgroundMode = function () {
        this.slideBackground.setMode(this.fields.backgroundMode.val());
    }

    SlideSettings.prototype.sync_backgroundFocusY = function () {
        this.slideBackground.setFocus(this.fields.backgroundFocusX.val(), this.fields.backgroundFocusY.val());
    }

    SlideSettings.prototype.sync_backgroundFocusX = function () {
        this.slideBackground.setFocus(this.fields.backgroundFocusX.val(), this.fields.backgroundFocusY.val());
    }

    SlideSettings.prototype.sync_backgroundImageOpacity = function () {
        this.slideBackground.setOpacity(this.fields.backgroundImageOpacity.val() / 100);
    };

    SlideSettings.prototype.sync_backgroundImageBlur = function () {
        this.slideBackground.setBlur(this.fields.backgroundImageBlur.val());
    };

    return SlideSettings;
});
N2Require('LayerContainer', [], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    function LayerContainer(component, $ul, allowedPlacementMode, childrenSelector, allowedChildren) {
        this.component = component;
        this.$ul = $ul
            .data('container', this);

        this.allowedPlacementMode = allowedPlacementMode;
        this.childrenSelector = childrenSelector;
        this.allowedChildren = allowedChildren;

        this.layerContainerElement = component.layer;
    }

    LayerContainer.prototype.setLayerContainerElement = function ($layerContainerElement) {
        this.layerContainerElement = $layerContainerElement;
    }

    LayerContainer.prototype.startWithExistingNodes = function () {
        var nodes = this.layerContainerElement.find(this.childrenSelector);
        for (var i = 0; i < nodes.length; i++) {
            this._loadNode(nodes.eq(i), false);
        }
        this.component.onChildCountChange();
    }

    LayerContainer.prototype.isChildAllowed = function (type) {
        return $.inArray(type, this.allowedChildren) !== -1;
    }

    LayerContainer.prototype._loadNode = function ($el, needSync) {
        var type = $el.data('type');
        if (this.isChildAllowed(type)) {
            var component;
            switch (type) {
                case 'layer':
                    component = new scope.Layer(this.component.canvasManager, this.component);
                    break;
                case 'content':
                    component = new scope.Content(this.component.canvasManager, this.component);
                    break;
                case 'row':
                    component = new scope.Row(this.component.canvasManager, this.component);
                    break;
                case 'col':
                    component = new scope.Col(this.component.canvasManager, this.component);
                    break;
                case 'group':
                    break;
            }

            if (component) {
                component.load($el);
                if (needSync) {
                    component.sync();
                }
                return component;
            }
        } else {
            console.error(type + ' is not allowed in ' + this.component.label);
        }
        return false;
    }

    LayerContainer.prototype.getLayerCount = function () {
        return this.layerContainerElement.find(this.childrenSelector).length;
    }

    LayerContainer.prototype.getLayerIndex = function ($layer) {
        return this.layerContainerElement.find(this.childrenSelector).index($layer);
    }

    LayerContainer.prototype.getSortedLayers = function () {
        var layers = [];
        this.layerContainerElement.find(this.childrenSelector).each(function (i, el) {
            var layer = $(el).data('layerObject');
            if (layer !== undefined) {
                layers.push(layer);
            }
        });
        return layers;
    }

    LayerContainer.prototype.append = function ($layer) {
        $layer.appendTo(this.layerContainerElement);
        var layer = this._loadNode($layer, true);
        this.component.onChildCountChange();
        return layer;
    }

    LayerContainer.prototype.insertAt = function ($layer, index) {

        var layers = this.getSortedLayers();
        if (index >= layers.length) {
            $layer.appendTo(this.layerContainerElement);
        } else {
            $layer.insertBefore(layers[index].layer);
        }

        var layer = this._loadNode($layer, true);
        this.component.onChildCountChange();
        return layer;
    }

    LayerContainer.prototype.insert = function (layer) {
        layer.getRootElement().appendTo(this.layerContainerElement);
    }

    LayerContainer.prototype.insertLayerAt = function (layer, index) {

        var layers = this.getSortedLayers();

        var layerIndex = $.inArray(layer, layers);
        if (layerIndex != '-1' && layerIndex < index) {
            // we have to readjust the target index of the layer
            index++;
        }

        if (index >= layers.length) {
            layer.getRootElement().appendTo(this.layerContainerElement);
        } else {
            layer.getRootElement().insertBefore(layers[index].getRootElement());
        }

        this.syncLayerRow(layer);
    }

    LayerContainer.prototype.syncLayerRow = function (layer) {
        var relatedLayer,
            isReversed = (this.allowedPlacementMode == 'absolute');
        if (isReversed) {
            relatedLayer = layer.getRootElement().prevAll('.n2-ss-layer, .n2-ss-layer-group, .n2-ss-section-outer').first().data('layerObject');
        } else {
            relatedLayer = layer.getRootElement().nextAll('.n2-ss-layer, .n2-ss-layer-group, .n2-ss-section-outer').first().data('layerObject');
        }

        if (relatedLayer !== undefined) {
            layer.layerRow.insertBefore(relatedLayer.layerRow);
        } else {
            this.$ul.append(layer.layerRow);
        }

        if (layer.animations) {
            layer.animations.syncRow(relatedLayer, isReversed);
        }
    }

    LayerContainer.prototype.getChildLayersRecursive = function (nodeOnly) {
        var _layers = this.getSortedLayers();
        var layers = [];
        for (var i = 0; i < _layers.length; i++) {
            if (nodeOnly) {
                layers.push(_layers[i].layer[0]);
            } else {
                layers.push(_layers[i]);
            }
            if (_layers[i].container) {
                layers.push.apply(layers, _layers[i].container.getChildLayersRecursive(nodeOnly));
            }
        }
        return layers;
    }

    LayerContainer.prototype.moveLayerToGroup = function (layer, newLocalIndex) {
        this.moveLayersToGroup([layer], [newLocalIndex]);
    }

    LayerContainer.prototype.moveLayersToGroup = function (layers, newLocalIndexs) {
        newLocalIndexs = newLocalIndexs || [];

        var originalGroups = [];
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i],
                originalGroup = layer.group;

            var originalIndex = layer.getIndex();
            if (typeof  newLocalIndexs[i] != 'undefined') {
                this.insertLayerAt(layer, newLocalIndexs[i]);
            } else {
                this.insert(layer);
            }
            layer.changeGroup(originalIndex, this.component);

            if (this != originalGroup) {
                if ($.inArray(originalGroup, originalGroups) == -1) {
                    originalGroups.push(originalGroup);
                }
            }
        }

        for (var i = 0; i < originalGroups.length; i++) {
            originalGroups[i].update();
        }
    }

    LayerContainer.prototype.activateFirst = function () {
        var layers = this.getSortedLayers();
        if (layers.length > 0) {
            layers[layers.length - 1].activate(); //Do not show editor on load!
        }
    }

    LayerContainer.prototype.resetModes = function (mode) {
        var layers = this.getSortedLayers();
        for (var i = 0; i < layers.length; i++) {
            layers[i].resetMode(mode);
            if (layers[i].container != undefined) {
                layers[i].container.resetModes(mode);
            }
        }
    }

    LayerContainer.prototype.copyModes = function (mode, currentMode) {
        var layers = this.getSortedLayers();
        for (var i = 0; i < layers.length; i++) {
            layers[i].copyMode(mode, currentMode);
            if (layers[i].container != undefined) {
                layers[i].container.copyModes(mode, currentMode);
            }
        }
    }

    LayerContainer.prototype.changeEditorModes = function (mode) {
        var layers = this.getSortedLayers();
        for (var i = 0; i < layers.length; i++) {
            layers[i].changeEditorMode(mode);
            if (layers[i].container != undefined) {
                layers[i].container.changeEditorModes(mode);
            }
        }
    }

    LayerContainer.prototype.renderModeProperties = function () {
        var layers = this.getSortedLayers();
        for (var i = 0; i < layers.length; i++) {
            layers[i].renderModeProperties();
            if (layers[i].container != undefined) {
                layers[i].container.renderModeProperties();
            }
        }
    }

    LayerContainer.prototype.getAllLayers = function (layers) {
        layers = layers || [];
        var sortedLayers = this.getSortedLayers();
        for (var i = 0; i < sortedLayers.length; i++) {
            layers.push(sortedLayers[i]);
            if (sortedLayers[i].container != undefined) {
                sortedLayers[i].container.getAllLayers(layers);
            }
        }
        return layers;
    }

    LayerContainer.prototype.getData = function (params) {
        params = $.extend({
            layersIncluded: true,
            itemsIncluded: true
        }, params);
        var layers = [];

        var sortedLayers = this.getSortedLayers();
        if (this.allowedPlacementMode == 'absolute') {
            for (var i = sortedLayers.length - 1; i >= 0; i--) {
                layers.push(sortedLayers[i].getData(params));
            }
        } else {
            for (var i = 0; i < sortedLayers.length; i++) {
                layers.push(sortedLayers[i].getData(params));
            }
        }

        return layers;
    }

    LayerContainer.prototype.getHTML = function (base64) {
        var layers = this.getSortedLayers(),
            nodes = [];
        for (var i = 0; i < layers.length; i++) {
            nodes.push(layers[i].getHTML(base64));
        }
        return nodes;
    }

    /**
     * Used for layer editor
     * @param exclude
     * @returns {Array}
     */
    LayerContainer.prototype.getDroppables = function (exclude) {
        var droppables = [],
            layers = this.getSortedLayers();

        for (var i = 0; i < layers.length; i++) {
            if (layers[i] != exclude) {
                var droppable = layers[i].getDroppable();
                if (droppable) {
                    droppables.push(droppable);
                }
                if (layers[i].container) {
                    droppables.push.apply(droppables, layers[i].container.getDroppables(exclude));
                }
            }
        }

        return droppables;
    }

    /**
     * Used for Layer List
     * @param layer
     * @returns {Array}
     */
    LayerContainer.prototype.getLLDroppables = function (layer) {
        var droppables = [];

        var droppable = this.component.getLLDroppable(layer);
        if (droppable) {
            droppables.push(droppable);
        }

        var layers = this.getSortedLayers();
        for (var i = 0; i < layers.length; i++) {
            if (!layers[i].container || layers[i] == layer) continue;

            droppables.push.apply(droppables, layers[i].container.getLLDroppables(layer));
        }

        return droppables;
    }

    return LayerContainer;
});
N2Require('LayerDataStorage', [], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    function LayerDataStorage() {
        this.isDeviceProp = {};
        this.propertyScope = {};
        this.property = {};
        this.deviceProperty = {
            desktopPortrait: {},
            desktopLandscape: {},
            tabletPortrait: {},
            tabletLandscape: {},
            mobilePortrait: {},
            mobileLandscape: {}
        };
    }

    LayerDataStorage.prototype.getMode = function () {
        return this.canvasManager.getMode();
    };

    LayerDataStorage.prototype.getRawProperty = function (name) {

        if (this.isDeviceProp[name]) {
            var mode = this.getMode(),
                properties = this.deviceProperty[mode];
            if (properties[name] !== undefined) {
                return properties[name];
            }
            return undefined;
        }
        return this.property[name];
    }

    LayerDataStorage.prototype.getProperty = function (name) {

        if (this.isDeviceProp[name]) {
            var mode = this.getMode(),
                properties = this.deviceProperty[mode],
                fallbackProperties = this.deviceProperty['desktopPortrait'];
            if (typeof properties[name] !== 'undefined') {
                return properties[name];
            } else if (typeof fallbackProperties[name] !== 'undefined') {
                return fallbackProperties[name];
            }
        }
        return this.property[name];
    };

    LayerDataStorage.prototype.historyStore = function (value, name, mode) {
        if (!this.isDeleteStarted) {
            var currentMode = this.getMode();
            if (!this.isDeviceProp[name] || mode == currentMode) {
                this.store(name, value, true, 'history');
                this.$.trigger('propertyChanged', [name, this.getProperty(name)]);
            } else {
                this.deviceProperty[mode][name] = value;
                this.render(name);
            }
        }
    }

    LayerDataStorage.prototype.store = function (name, value, needRender, from) {

        var mode = this.getMode(),
            oldValue,
            oldValueFilled;
        if (this.isDeviceProp[name]) {
            oldValue = this.deviceProperty[mode][name];
            oldValueFilled = this.getProperty(name);
        } else {
            oldValueFilled = oldValue = this.property[name];
        }
        var task = smartSlider.history.addValue(this, this.historyStore, [name, mode]);
        if (task) {
            task.setValues(oldValue, value);
        }

        this.property[name] = value;

        if (this.isDeviceProp[name]) {
            this.deviceProperty[mode][name] = value;
        }

        if (needRender) {
            this.render(name, oldValueFilled, from);
        }
    }

    LayerDataStorage.prototype.render = function (name, oldValue, from) {
        this.propertyScope[name]['_sync' + name](oldValue, from);
    };

    LayerDataStorage.prototype.isDimensionPropertyAccepted = function (value) {
        if ((value + '').match(/[0-9]+%/) || value == 'auto') {
            return true;
        }
        return false;
    };

    LayerDataStorage.prototype.changeEditorMode = function (mode) {
        var value = parseInt(this.property[mode]);
        if (value) {
            this._show();
        } else {
            this._hide();
        }

        this.layer.triggerHandler('LayerShowChange', [mode, value]);

        this.renderModeProperties(false);
    };

    LayerDataStorage.prototype.renderModeProperties = function () {
        for (var k in this.property) {
            this.property[k] = this.getProperty(k);
            this.$.trigger('propertyChanged', [k, this.property[k]]);
        }
    }

    LayerDataStorage.prototype.historyResetMode = function (value, mode) {

        this.deviceProperty[mode] = $.extend({}, value);

        if (mode == this.canvasManager.getMode()) {
            this.renderModeProperties(true);
        }
    }

    LayerDataStorage.prototype.resetMode = function (mode) {
        if (mode != 'desktopPortrait') {
            var undefined;

            var task = smartSlider.history.addValue(this, this.historyResetMode, [mode]);
            if (task) {
                task.setValues($.extend({}, this.deviceProperty[mode]), {});
            }

            for (var k in this.deviceProperty[mode]) {
                this.deviceProperty[mode][k] = undefined;
            }
            if (mode == this.canvasManager.getMode()) {
                this.renderModeProperties(true);
            }
        }
    };

    LayerDataStorage.prototype.copyMode = function (from, to) {
        if (from != to) {
            var originalValues = this.deviceProperty[to];

            this.deviceProperty[to] = $.extend({}, this.deviceProperty[to], this.deviceProperty[from]);

            var task = smartSlider.history.addValue(this, this.historyResetMode, [to]);
            if (task) {
                task.setValues(originalValues, this.deviceProperty[to]);
            }
        }
    };

    LayerDataStorage.prototype._getDefault = function (name, def) {
        if (this.originalProperties[name] !== undefined) {
            return this.originalProperties[name];
        }
        return def;
    }

    LayerDataStorage.prototype.createProperty = function (name, def, $layer, scope) {
        this.isDeviceProp[name] = false;
        this.propertyScope[name] = scope || this;
        if ($layer) {
            this.property[name] = $layer.data(name.toLowerCase());
            if (this.property[name] === undefined) {
                this.property[name] = this._getDefault(name, def);
            }
        } else {
            this.property[name] = this._getDefault(name, def);
        }
    }

    LayerDataStorage.prototype.createDeviceProperty = function (name, def, $layer, scope) {
        this.isDeviceProp[name] = true;
        this.propertyScope[name] = scope || this;
        if ($layer) {
            for (var k in this.deviceProperty) {
                this.deviceProperty[k][name] = $layer.data(k.toLowerCase() + name.toLowerCase());
                if (this.deviceProperty[k][name] === "") {
                    this.deviceProperty[k][name] = undefined;
                }
            }
            for (var k in this.deviceProperty) {
                if (this.deviceProperty[k][name] === undefined || this.deviceProperty[k][name] === "") {
                    var defaultValue = this._getDefault(k.toLowerCase() + name.toLowerCase());
                    if (defaultValue !== undefined) {
                        this.deviceProperty[k][name] = defaultValue;
                    }
                }
            }
            for (var k in def) {
                if (this.deviceProperty[k][name] === undefined || this.deviceProperty[k][name] === "") {
                    this.deviceProperty[k][name] = def[k];
                }
            }
        } else {
            //Create layer
            for (var k in def) {
                this.deviceProperty[k][name] = def[k];
            }
            for (var k in this.deviceProperty) {
                var defaultValue = this._getDefault(k.toLowerCase() + name.toLowerCase());
                if (defaultValue !== undefined) {
                    this.deviceProperty[k][name] = defaultValue;
                }
            }
        }
        this.property[name] = this.deviceProperty.desktopPortrait[name];
    }

    LayerDataStorage.prototype.removeProperty = function (name) {
        delete this.property[name];
        this.layer.removeData(name.toLowerCase())
            .removeAttr('data-' + name.toLowerCase());

        if (this.isDeviceProp[name]) {
            for (var k in this.deviceProperty) {
                delete this.deviceProperty[k][name];
                this.layer.removeData(k.toLowerCase() + name.toLowerCase())
                    .removeAttr('data-' + k.toLowerCase() + name.toLowerCase());
            }
        }
        delete this.isDeviceProp[name];
        delete this.propertyScope[name];
    }

    LayerDataStorage.prototype.removeProperties = function (properties) {
        for (var i = 0; i < properties.length; i++) {
            this.removeProperty(properties[i]);
        }
    }

    LayerDataStorage.prototype.getPropertiesData = function (properties) {
        var data = {};
        for (var i = 0; i < properties.length; i++) {
            var name = properties[i];
            if (this.property[name] !== undefined) {
                data[name] = this.property[name];
            }
            if (this.isDeviceProp[name]) {
                for (var k in this.deviceProperty) {
                    if (this.deviceProperty[k][name] !== undefined) {
                        data[k.toLowerCase() + name] = this.deviceProperty[k][name];
                    }
                }
            }
        }
        return data;
    }

    LayerDataStorage.prototype.setProperty = function (name, value, from) {
        if (this.propertyScope[name] !== undefined) {
            if (typeof this.propertyScope[name]['setProperty' + name] == 'function') {
                this.propertyScope[name]['setProperty' + name](name, value, from);
            } else {
                this._setProperty(name, value, from);
            }
        }
    }

    LayerDataStorage.prototype._setProperty = function (name, value, from) {

        this.store(name, value, true, from);

        if (from != 'manager') {
            this.$.trigger('propertyChanged', [name, this.getProperty(name)]);
        }
    }

    return LayerDataStorage;
});
N2Require('CanvasManager', [], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";
    var layerClass = '.n2-ss-layer',
        keys = {
            16: 0,
            38: 0,
            40: 0,
            37: 0,
            39: 0
        },
        horizontalAlign = {
            97: 'left',
            98: 'center',
            99: 'right',
            100: 'left',
            101: 'center',
            102: 'right',
            103: 'left',
            104: 'center',
            105: 'right'
        },
        verticalAlign = {
            97: 'bottom',
            98: 'bottom',
            99: 'bottom',
            100: 'middle',
            101: 'middle',
            102: 'middle',
            103: 'top',
            104: 'top',
            105: 'top'
        },
        SELECT_MODE = {
            OFF: 0,
            ON: 1,
            GROUP: 2
        },
        SELECT_MODE_INV = {
            0: 'OFF',
            1: 'ON',
            2: 'GROUP'
        };

    function CanvasManager(slideEditManager, isStatic, options) {
        this.mode = 'desktopPortrait';
        this.slideEditManager = slideEditManager;
        this.isStatic = isStatic;
        this.ready = $.Deferred();

        this.shouldPreventActivationBubble = false;

        this.$ = $(this);

        smartSlider.canvasManager = this;

        this.$highlight = $('<div class="n2-ss-layer-highlight n2-ss-layer-highlight-n" /><div class="n2-ss-layer-highlight n2-ss-layer-highlight-e" /><div class="n2-ss-layer-highlight n2-ss-layer-highlight-s" /><div class="n2-ss-layer-highlight n2-ss-layer-highlight-w" />');

        this.initSelectMode();

        this.layerWindow = new scope.LayerWindow(this);

        this.layerOptions = new scope.ComponentSettings(this);

        this.ui = new scope.CanvasUserInterface(this);

        this.mainContainer = new scope.MainContainer(this);

        this.itemEditor = new scope.ItemManager(this, options);

        this.mainContainer.lateInit();

        this._initDeviceModeChange();

        this.canvasSettings = new scope.CanvasSettings(this);

        this.layerOptions.startFeatures();

        this.hotkeys();

        this.addContextMenu();

        this.mainContainer.refreshHasLayers();

        var editorModes = $('#n2-ss-editor-mode .n2-radio-option'),
            updateEditorModeSync = $.proxy(function (mode) {
                this.updateEditorMode(mode);
                switch (mode) {
                    case 'content':
                        editorModes.eq(0).addClass('n2-active');
                        editorModes.eq(1).removeClass('n2-active');
                        break;
                    case 'canvas':
                        editorModes.eq(0).removeClass('n2-active');
                        editorModes.eq(1).addClass('n2-active');
                        break;
                }
            }, this);

        if (this.mainContent && this.mainContent.container.getLayerCount()) {
            updateEditorModeSync('content');
        } else {
            var layers = this.mainContainer.container.getSortedLayers();
            if (this.mainContent && layers.length > 1 || !this.mainContent && layers.length > 0) {
                updateEditorModeSync('canvas');
            } else {
                var stored = $.jStorage.get('editormode');
                if (!stored) {
                    stored = 'content';
                    $.jStorage.set('editormode', stored);
                }
                updateEditorModeSync(stored);
            }
        }

        editorModes.on('click', $.proxy(function (e) {
            editorModes.removeClass('n2-active');
            var $el = $(e.currentTarget),
                mode = $el.data('mode');
            $el.addClass('n2-active');
            if (mode != this.currentEditorMode) {
                this.updateEditorMode(mode);

                $.jStorage.set('editormode', mode);
            }
        }, this));

        this.isMultiDrag = false;

    };

    CanvasManager.prototype.updateEditorMode = function (mode) {
        this.currentEditorMode = mode;
        $('body').attr('data-editormode', this.currentEditorMode);
    };

    CanvasManager.prototype.getMode = function () {
        return this.mode;
    };

    CanvasManager.prototype.getResponsiveRatio = function (axis) {
        if (axis == 'h') {
            return smartSlider.frontend.responsive.lastRatios.slideW;
        } else if (axis == 'v') {
            return smartSlider.frontend.responsive.lastRatios.slideH;
        }
        return 0;
    };

    CanvasManager.prototype.setMainContent = function (layer) {
        this.mainContent = layer;
    }

    CanvasManager.prototype.isGroup = function (layer) {
        return false;
    
    }

    CanvasManager.prototype.isRow = function (layer) {
        return layer instanceof scope.Row;
    }

    CanvasManager.prototype.isCol = function (layer) {
        return layer instanceof scope.Col;
    }

    CanvasManager.prototype.isLayer = function (layer) {
        return layer instanceof scope.Layer;
    }

    CanvasManager.prototype.isContent = function (layer) {
        return layer instanceof scope.Content;
    }

    //<editor-fold desc="Initialize the device mode changer">


    CanvasManager.prototype._initDeviceModeChange = function () {
        var resetButton = $('#layerresettodesktop').on('click', $.proxy(this.__onResetToDesktopClick, this));
        this.resetToDesktopTRElement = resetButton.closest('tr');
        this.resetToDesktopGlobalElement = $('#n2-ss-layer-reset-to-desktop').on('click', $.proxy(function () {
            if (this.resetToDesktopTRElement.css('display') == 'block') {
                resetButton.trigger('click');
            }
        }, this));

        var showOn = $('#n2-ss-layer-show-on'),
            showOnShortCuts = {},
            deviceModes = smartSlider.frontend.responsive.parameters.deviceModes;
        for (var k in deviceModes) {
            if (deviceModes[k]) {
                showOnShortCuts[k] = $('<div class="n2-radio-option"><i class="n2-i n2-it n2-i-' + k + '"></i></div>').on('click', $.proxy(function (mode) {
                    this.layerOptions.currentForm[mode]
                        .data('field')
                        .onoff.trigger('click');
                }, this, k)).appendTo(showOn);
            }
        }

        showOn.children().first().addClass('n2-first');
        showOn.children().last().addClass('n2-last');


        this.globalShowOnDeviceCB = function (mode) {
            if (typeof showOnShortCuts[mode] !== 'undefined') {
                showOnShortCuts[mode].toggleClass('n2-active', this.layerOptions.currentForm[mode].val() == 1);
            }
        };

        this.layerOptions.forms.global.desktopPortrait.on('nextendChange', $.proxy(this.globalShowOnDeviceCB, this, 'desktopPortrait'));
        this.layerOptions.forms.global.desktopLandscape.on('nextendChange', $.proxy(this.globalShowOnDeviceCB, this, 'desktopLandscape'));
        this.layerOptions.forms.global.tabletPortrait.on('nextendChange', $.proxy(this.globalShowOnDeviceCB, this, 'tabletPortrait'));
        this.layerOptions.forms.global.tabletLandscape.on('nextendChange', $.proxy(this.globalShowOnDeviceCB, this, 'tabletLandscape'));
        this.layerOptions.forms.global.mobilePortrait.on('nextendChange', $.proxy(this.globalShowOnDeviceCB, this, 'mobilePortrait'));
        this.layerOptions.forms.global.mobileLandscape.on('nextendChange', $.proxy(this.globalShowOnDeviceCB, this, 'mobileLandscape'));

        $('#layershow').data('field').setAvailableDevices(deviceModes);
        $('#layergroup-show').data('field').setAvailableDevices(deviceModes);

        this.__onChangeDeviceOrientation();
        smartSlider.frontend.sliderElement.on('SliderDeviceOrientation', $.proxy(function () {
            this.__onChangeDeviceOrientation();
        }, this));

        this.ready.resolve();

    };

    /**
     * Refresh the current responsive mode. Example: you are in tablet view and unpublish a layer for tablet, then you should need a refresh on the mode.
     */
    CanvasManager.prototype.refreshMode = function () {

        this.__onChangeDeviceOrientation();

        smartSlider.frontend.responsive.reTriggerSliderDeviceOrientation();
    };

    /**
     * When the device mode changed we have to change the slider
     * @param mode
     * @private
     */
    CanvasManager.prototype.__onChangeDeviceOrientation = function () {

        this.mode = smartSlider.frontend.responsive.getNormalizedModeString();
        //this.globalShowOnDeviceCB(this.mode);

        this.resetToDesktopTRElement.css('display', (this.mode == 'desktopPortrait' ? 'none' : ''));
        this.resetToDesktopGlobalElement.css('display', (this.mode == 'desktopPortrait' ? 'none' : ''));

        this.mainContainer.container.changeEditorModes(this.mode);
    };

    /**
     * Reset the custom values of the current mode on the current layer to the desktop values.
     * @private
     */
    CanvasManager.prototype.__onResetToDesktopClick = function () {
        if (this.mainContainer.getSelectedLayer()) {
            var mode = this.getMode();
            this.mainContainer.getSelectedLayer().resetMode(mode);
        }
    };

    CanvasManager.prototype.copyOrResetMode = function (mode) {
        var currentMode = this.getMode();
        if (currentMode == 'desktopPortrait') {
            if (mode != 'desktopPortrait') {
                this.mainContainer.container.resetModes(mode);
            }
        } else {
            if (mode == currentMode) {
                this.mainContainer.container.resetModes(mode);
            } else {
                this.mainContainer.container.copyModes(currentMode, mode);
            }
        }
    };

//</editor-fold>

    CanvasManager.prototype.getSnap = function () {
        if (this.canvasSettings.get("n2-ss-snap-to-enabled")) {
            if (this.isStatic) {
                return $('.n2-ss-static-slide .n2-ss-layer.ui-resizable:not(.n2-ss-layer-locked):not(.n2-ss-layer-parent):not(.n2-ss-layer-selected):visible, .n2-ruler-user-guide');
            }
            return $('.n2-ss-slide.n2-ss-slide-active .n2-ss-layer.ui-resizable:not(.n2-ss-layer-locked):not(.n2-ss-layer-parent):not(.n2-ss-layer-selected):visible, .n2-ruler-user-guide');
        }
        return false;
    };

    /**
     * Get the HTML code of the whole slide
     * @returns {string} HTML
     */
    CanvasManager.prototype.getHTML = function () {
        var node = $('<div></div>');

        var list = this.mainContainer.container.getAllLayers();
        for (var i = 0; i < list.length; i++) {
            node.append(list[i].getHTML(true));
        }

        return node.html();
    };


    CanvasManager.prototype.getData = function () {
        return this.mainContainer.container.getData();
    };

    CanvasManager.prototype.importLayers = function (data, overwrite) {
        var group = this.mainContainer;

        var layers = $.extend(true, [], data);
        if (overwrite) {
            this.mainContainer.deleteLayers();
        }

        this._idTranslation = {};

        var layerNodes = this.dataToLayers(layers);

        for (var i = 0; i < layerNodes.length; i++) {
            this.mainContainer.container.append(layerNodes[i]);
        }

        this.refreshMode();


        if (!this.mainContainer.getSelectedLayer()) {
            var layers = this.mainContainer.container.getSortedLayers();
            if (layers.length > 0) {
                layers[0].activate();
            }
        }

    };

    CanvasManager.prototype.loadComponentWithNode = function (group, $component, needHistory, refresh) {

        var component = group.container.append($component);

        if (refresh) {
            this.refreshMode();
        }

        return component;
    };

    CanvasManager.prototype.insertComponentWithNode = function (group, $component, index, needHistory, refresh) {

        var component = group.container.insertAt($component, index);

        if (refresh) {
            this.refreshMode();
        }

        return component;
    };


    /**
     * getter for the currently selected layer
     * @returns {jQuery|boolean} layer element in jQuery representation or false
     * @private
     */

    CanvasManager.prototype.fixActiveLayer = function () {
        var selectedLayer = this.mainContainer.getSelectedLayer();
        if (selectedLayer == false || selectedLayer.isDeleted) {
            this.resetActiveLayer();
        }
    };

    CanvasManager.prototype.resetActiveLayer = function () {
        var layers = this.mainContainer.container.getSortedLayers();
        if (layers.length) {
            layers[layers.length - 1].activate();
        } else {
            this.changeActiveLayer(null);
        }
    };

    CanvasManager.prototype.changeActiveLayer = function (nextActiveLayer, preventExitFromSelection) {
        var layer = this.mainContainer.getSelectedLayer();
        if (layer && !layer.isDeleted) {
            // There is a chance that the layer already deleted
            layer.$.off('propertyChanged.editor')
                .off('.active');

            layer.deActivate();
        }
        this.mainContainer.activeLayer = nextActiveLayer;

        if (!preventExitFromSelection) {
            this.exitSelectMode();
        }

        if (nextActiveLayer) {

            this.layerOptions.changeActiveComponent(nextActiveLayer, nextActiveLayer.type, nextActiveLayer.placement.getType(), nextActiveLayer.property);

            nextActiveLayer.$.on({
                'propertyChanged.editor': $.proxy(this.layerOptions.onUpdateField, this.layerOptions),
                'placementChanged.active': $.proxy(function (e, current, last) {
                    this.layerOptions.changeActiveComponentPlacement(current, nextActiveLayer.property);
                }, this)
            });

        }

        this.$.trigger('activeLayerChanged');
    };

    CanvasManager.prototype.highlight = function (layer) {
        this.$highlight.appendTo(layer.layer);
    }

    CanvasManager.prototype.deHighlight = function (layer) {
        this.$highlight.detach();
    }

    CanvasManager.prototype.delete = function () {
        if (this.mainContainer.getSelectedLayer()) {
            this.doActionOnActiveLayer('delete');
        }
    };

    CanvasManager.prototype.duplicate = function () {
        if (this.mainContainer.getSelectedLayer()) {
            this.doActionOnActiveLayer('duplicate', [this.selectMode == SELECT_MODE.ON ? false : true, false]);
        }
    };

    CanvasManager.prototype.copy = function (clickedLayer) {
        var requestedLayers;
        if (clickedLayer == undefined) {
            if (this.selectMode == 1) {
                requestedLayers = this.selectedLayers;
            } else {
                var activeLayer = this.mainContainer.getSelectedLayer();
                if (activeLayer) {
                    requestedLayers = [activeLayer];
                }
            }
        } else {
            if (this.isCol(clickedLayer) || this.isContent(clickedLayer)) {
                requestedLayers = clickedLayer.container.getSortedLayers()
            } else {
                requestedLayers = [clickedLayer];
            }
        }

        var layers = this.mainContainer.getLayerData(requestedLayers);
        if (layers.length) {
            $.jStorage.set('ss3layersclipboard', JSON.stringify(layers))
        }
    };

    CanvasManager.prototype.paste = function (target) {
        var clipboard = $.jStorage.get('ss3layersclipboard');
        if (clipboard) {
            var layers = JSON.parse(clipboard);
            if (layers.length) {
                var targetGroup;
                if (target === undefined || !target) {
                    targetGroup = this.mainContainer.getActiveGroup();
                } else {
                    if (this.isCol(target) || this.isContent(target)) {
                        targetGroup = target;
                    } else {
                        targetGroup = target.group;
                    }
                }
                this.mainContainer.addLayers(layers, targetGroup);
            }
        }
    };

    CanvasManager.prototype.hasLayersOnClipboard = function () {
        if ($.jStorage.get('ss3layersclipboard')) {
            return true;
        }
        return false;
    }

    CanvasManager.prototype.addContextMenu = function () {
        var canvasManager = this;

        $('#n2-ss-0 .n2-ss-currently-edited-slide').nextendContextMenu({
            onShow: $.proxy(function (e, contextMenu) {
                var $target = $(e.target);

                var $closestLayer = $target.closest('.n2-ss-layer'),
                    closestLayer = $closestLayer.data('layerObject');
                if (!closestLayer) {
                    closestLayer = this.mainContainer.getSelectedLayer();
                }

                if (closestLayer) {
                    if (this.isCol(closestLayer) || this.isContent(closestLayer)) {
                        contextMenu.addItem('Copy child layers', 'n2-i-copy', $.proxy(function () {
                            this.copy(closestLayer);
                        }, this));
                    } else {
                        contextMenu.addItem('Copy layer', 'n2-i-copy', $.proxy(function () {
                            if (this.selectMode == SELECT_MODE.ON) {
                                this.copy();
                            } else {
                                this.copy(closestLayer);
                            }
                        }, this));
                    }
                }

                if (this.hasLayersOnClipboard()) {
                    contextMenu.addItem('Paste layer(s)', 'n2-i-paste', $.proxy(function () {
                        this.paste(closestLayer);
                    }, this));
                }

                contextMenu.addItem('Copy slide', 'n2-i-copy', $.proxy(function () {
                    this.slideEditManager.copySlide();
                }, this));
                if (this.slideEditManager.hasCopiedSlide()) {
                    contextMenu.addItem('Paste slide', 'n2-i-paste', $.proxy(function () {
                        this.slideEditManager.pasteSlide();
                    }, this));
                }
            }, this)
        });
    };


    CanvasManager.prototype.initSelectMode = function () {
        this.selectMode = SELECT_MODE.OFF;
        this.selectedLayers = [];

        $('.n2-ss-layer-list-top-bar .n2-button').on('mousedown', $.proxy(function (e) {
            e.preventDefault();
            switch ($(e.currentTarget).data('action')) {
                case 'delete':
                    this.delete();
                    break;
                case 'duplicate':
                    this.duplicate();
                    break;
                case 'group':
                    this.createGroupFromSelected();
                    break;
                case 'cancel':
                    this.exitSelectMode();
                    break;
            }
        }, this))
    }

    CanvasManager.prototype.startSelection = function (isGroupMode) {
        if (isGroupMode) {
            if (this.selectMode == SELECT_MODE.ON) {
                this.exitSelectMode();
            }
            this.changeSelectMode(SELECT_MODE.GROUP);
        } else {
            this.changeSelectMode(SELECT_MODE.ON);
        }
    }

    CanvasManager.prototype.changeSelectMode = function (targetMode) {
        var lastMode = this.selectMode;
        if (lastMode != targetMode) {

            if (lastMode == SELECT_MODE.ON) {
                $('#n2-admin').removeClass('n2-ss-select-layer-mode-on');
            } else if (lastMode == SELECT_MODE.GROUP) {
                $('#n2-admin').removeClass('n2-ss-select-layer-mode-group');
            }

            this.selectMode = targetMode;

            if (lastMode == SELECT_MODE.GROUP && targetMode == SELECT_MODE.ON) {
                this.selectedLayers[0].activate(null, null, true);
            }

            if (targetMode == SELECT_MODE.OFF) {
                $('#n2-admin').removeClass('n2-ss-select-layer-mode');
            } else {
                $('#n2-admin').addClass('n2-ss-select-layer-mode');
                if (targetMode == SELECT_MODE.ON) {
                    $('#n2-admin').addClass('n2-ss-select-layer-mode-on');
                } else if (targetMode == SELECT_MODE.GROUP) {
                    $('#n2-admin').addClass('n2-ss-select-layer-mode-group');
                }
            }

            if (this.selectMode == SELECT_MODE.OFF) {
                $('body').off('.n2-ss-selection');
            } else {
                $('body').on('mousedown.n2-ss-selection', $.proxy(function (e) {
                    if (event.which != 3 && nextend.context.getCurrentWindow() == 'main') {
                        if (nextend.context.mouseDownArea === false) {
                            this.exitSelectMode();
                        }
                    }
                }, this));
            }
        }
    }

    CanvasManager.prototype.endSelection = function (isGroupMode) {
        if (isGroupMode && this.selectMode == SELECT_MODE.GROUP) {
            this.exitSelectMode();
        }
    }

    CanvasManager.prototype.selectLayer = function (layer, addActive) {
        if (layer.type != 'layer') {
            return true;
        }

        if (this.selectMode != SELECT_MODE.ON) {

            var activeLayer = this.mainContainer.getSelectedLayer();
            if (activeLayer.type == 'layer') {
                this.startSelection(false);
                if (addActive) {
                    this.selectedLayers.push(activeLayer);
                }
            } else {
                layer.activate(null);
                return true;
            }
        }

        this._selectLayer(layer);

        return true;
    };

    CanvasManager.prototype._selectLayer = function (layer) {

        var index = $.inArray(layer, this.selectedLayers);
        if (index != -1) {
            if (this.selectMode == SELECT_MODE.ON && this.selectedLayers.length <= 1) {
                this.exitSelectMode();
                return false;
            }

            var deSelectedLayer = this.selectedLayers[index];
            this.selectedLayers.splice(index, 1);
            layer.layerRow.removeClass('n2-selected');
            layer.layer.removeClass('n2-ss-layer-selected');

            if (this.selectMode == SELECT_MODE.ON && this.selectedLayers.length <= 1) {
                this.selectedLayers[0].activate();
                this.exitSelectMode();
                return false;
            }

            // As the active layer removed from the selection,
            // change the active layer to the first of the current selection
            if (deSelectedLayer === this.mainContainer.getSelectedLayer()) {
                this.selectedLayers[0].activate(false, null, true);
            }

        } else {
            var pushToIndex = this.selectedLayers.length;
            /*for (var i = 0; i < this.selectedLayers.length; i++) {
             if (this.selectedLayers[i].placement.doAction('indexCompare', layer)) {
             pushToIndex = i;
             break;
             }
             }*/
            for (var i = 0; i < this.selectedLayers.length; i++) {
                if (layer.layer.add(this.selectedLayers[i].layer).index(this.selectedLayers[i].layer) > 0) {
                    pushToIndex = i;
                    break;
                }
            }

            this.selectedLayers.splice(pushToIndex, 0, layer);
        }
        for (var i = 0; i < this.selectedLayers.length; i++) {
            this.selectedLayers[i].layerRow.addClass('n2-selected');
            this.selectedLayers[i].layer.addClass('n2-ss-layer-selected');
        }
    }

    CanvasManager.prototype.addSelection = function (layers, isGroupSelected) {
        if (!isGroupSelected) {
            this.changeSelectMode(SELECT_MODE.ON);
        }

        for (var i = 0; i < layers.length; i++) {
            this._selectLayer(layers[i], false);
        }
    }

    CanvasManager.prototype.exitSelectMode = function () {
        if (this.selectMode) {
            for (var i = 0; i < this.selectedLayers.length; i++) {
                if (this.selectedLayers[i] != this.mainContainer.getSelectedLayer()) {
                    this.selectedLayers[i].layerRow.removeClass('n2-active');
                }
                this.selectedLayers[i].layerRow.removeClass('n2-selected');
                this.selectedLayers[i].layer.removeClass('n2-ss-layer-selected');
            }
            $('#n2-admin').removeClass('n2-ss-select-layer-mode');
            this.selectedLayers = [];
            this.changeSelectMode(SELECT_MODE.OFF);
        }
    }

    CanvasManager.prototype.doActionOnActiveLayer = function (action, args) {
        if (this.selectMode == SELECT_MODE.ON) {

            var selectedLayers = $.extend([], this.selectedLayers);
            for (var i = 0; i < selectedLayers.length; i++) {
                selectedLayers[i][action].apply(selectedLayers[i], args);
            }
        } else {
            var selectedLayer = this.mainContainer.getSelectedLayer();
            if (selectedLayer) {
                selectedLayer[action].apply(selectedLayer, args);
            }
        }
    }

    CanvasManager.prototype.canvasDragStart = function (e, ui) {
        if (this.selectMode && this.currentEditorMode == 'canvas' && ui.mode == 'absolute') {

            var targetFoundInSelection = false;
            for (var i = 0; i < this.selectedLayers.length; i++) {
                var selectedLayer = this.selectedLayers[i],
                    $selectedLayer = selectedLayer.layer;

                if ($selectedLayer[0] != ui.layer.layer[0]) {

                    var display = $selectedLayer.css('display');
                    if (display == 'none') {
                        $selectedLayer.css('display', '');
                    }

                    selectedLayer._originalPosition = $selectedLayer.position();


                    if (display == 'none') {
                        $selectedLayer.css('display', 'none');
                    }
                } else {
                    targetFoundInSelection = true;
                }
            }
            if (!targetFoundInSelection) {
                this.exitSelectMode();
            }

            this.isMultiDrag = true;
        }
    }

    CanvasManager.prototype.canvasDragMove = function (e, ui) {
        if (this.isMultiDrag === true) {
            var movement = {
                left: ui.position.left + ui.canvasOffset.left - ui.originalOffset.left,
                top: ui.position.top + ui.canvasOffset.top - ui.originalOffset.top
            }
            for (var i = 0; i < this.selectedLayers.length; i++) {
                var selectedLayer = this.selectedLayers[i];
                if (!this.isGroup(selectedLayer)) {
                    var $selectedLayer = selectedLayer.layer;
                    if ($selectedLayer[0] != ui.layer.layer[0]) {

                        $selectedLayer.css({
                            left: selectedLayer._originalPosition.left + movement.left,
                            top: selectedLayer._originalPosition.top + movement.top,
                            bottom: 'auto',
                            right: 'auto'
                        });
                        selectedLayer.placement.doAction('triggerLayerResized');

                    }
                }
            }
        }
    }

    CanvasManager.prototype.canvasDragStop = function (e, ui) {
        if (this.isMultiDrag === true) {
            for (var i = 0; i < this.selectedLayers.length; i++) {
                var selectedLayer = this.selectedLayers[i];
                if (!this.isGroup(selectedLayer)) {
                    var $selectedLayer = selectedLayer.layer;
                    if ($selectedLayer[0] != ui.layer.layer[0]) {
                        var display = $selectedLayer.css('display');
                        if (display == 'none') {
                            $selectedLayer.css('display', 'block');
                        }
                        var left = parseInt(selectedLayer.layer.css('left')),
                            top = parseInt(selectedLayer.layer.css('top'));
                        selectedLayer.placement.current.setPosition(left, top);

                        selectedLayer.placement.doAction('triggerLayerResized');

                        if (display == 'none') {
                            $selectedLayer.css('display', "none");
                        }
                    }
                }
            }
            this.isMultiDrag = false;
            return true;
        }
        return false;
    }

    CanvasManager.prototype.historyDeleteGroup = function (historicalGroup) {
        historicalGroup.getSelf().delete();
    }

    CanvasManager.prototype.historyCreateGroup = function (historicalGroup) {
        var group = new scope.Group(this, this.mainContainer, {}, null);
        group.create();
        historicalGroup.setSelf(group);
    }

    CanvasManager.prototype.createGroupFromSelected = function () {
        var group;
        switch (this.selectMode) {
            case SELECT_MODE.ON:
                group = new scope.Group(this, this.mainContainer, {}, null);
                group.create();

                smartSlider.history.addSimple(this, this.historyDeleteGroup, this.historyCreateGroup, [group]);

                group.addLayers(this.selectedLayers);

                this.exitSelectMode();
                group.activate();

                break;
            case SELECT_MODE.OFF:
                var activeLayer = this.mainContainer.getSelectedLayer();

                // If the single layer is already in a group, we just activate that group
                if (activeLayer.group instanceof scope.Group) {
                    activeLayer.group.activate();
                } else {
                    group = new scope.Group(this, this.mainContainer, {}, null);
                    group.create();

                    smartSlider.history.addSimple(this, this.historyDeleteGroup, this.historyCreateGroup, [group]);

                    group.addLayers([activeLayer]);

                    group.activate();
                }
                break;
            case SELECT_MODE.GROUP:
                break;
        }
    }

    CanvasManager.prototype.createRow = function (group) {
        var layer = new scope.Row(this, group, {});
        layer.create();
        layer.hightlightStructure();
        return {
            layer: layer
        };
    }

    CanvasManager.prototype.createCol = function (group) {
        var activeGroup = group,
            layer = null;
        if (this.isCol(activeGroup)) {
            layer = activeGroup.group.createCol();
        } else if (this.isRow(activeGroup)) {
            layer = activeGroup.createCol();
        } else if (this.isCol(activeGroup.group)) {
            layer = activeGroup.group.group.createCol();
        } else {
            return this.createRow(group);
        }
        layer.activate(null);
        return {
            layer: layer
        };
    }

    CanvasManager.prototype.preventActivationBubbling = function () {
        if (!this.shouldPreventActivationBubble) {
            this.shouldPreventActivationBubble = true;
            return true;
        }
        return false;
    }

    CanvasManager.prototype.allowActivation = function () {
        this.shouldPreventActivationBubble = false;
    }

    CanvasManager.prototype.hotkeys = function () {
        $(window).on({
            keydown: $.proxy(function (e) {
                if (e.target.tagName != 'TEXTAREA' && e.target.tagName != 'INPUT' && (!smartSlider.layerAnimationManager || !smartSlider.layerAnimationManager.timelineControl || !smartSlider.layerAnimationManager.timelineControl.isActivated())) {
                    var hasSelectedLayer = this.mainContainer.getSelectedLayer(),
                        keyCode = e.keyCode;

                    if (keyCode >= 49 && keyCode <= 57) {
                        var location = e.originalEvent.location || e.originalEvent.keyLocation || 0;
                        // Fix OSX Chrome numeric keycodes
                        if (location == 3) {
                            keyCode += 48;
                        }
                    }

                    if (hasSelectedLayer) {

                        if (keyCode == 46 || keyCode == 8) {
                            this.delete();
                            e.preventDefault();
                        } else if (keyCode == 35) {
                            this.duplicate();
                            e.preventDefault();
                        } else if (keyCode == 16) {
                            keys[keyCode] = 1;
                        } else if (keyCode == 38) {
                            if (!keys[keyCode]) {
                                var fn = $.proxy(function () {
                                    this.doActionOnActiveLayer('moveY', [-1 * (keys[16] ? 10 : 1)]);
                                }, this);
                                fn();
                                keys[keyCode] = setInterval(fn, 100);
                            }
                            e.preventDefault();
                        } else if (keyCode == 40) {
                            if (!keys[keyCode]) {
                                var fn = $.proxy(function () {
                                    this.doActionOnActiveLayer('moveY', [(keys[16] ? 10 : 1)]);
                                }, this);
                                fn();
                                keys[keyCode] = setInterval(fn, 100);
                            }
                            e.preventDefault();
                        } else if (keyCode == 37) {
                            if (!keys[keyCode]) {
                                var fn = $.proxy(function () {
                                    this.doActionOnActiveLayer('moveX', [-1 * (keys[16] ? 10 : 1)]);
                                }, this);
                                fn();
                                keys[keyCode] = setInterval(fn, 100);
                            }
                            e.preventDefault();
                        } else if (keyCode == 39) {
                            if (!keys[keyCode]) {
                                var fn = $.proxy(function () {
                                    this.doActionOnActiveLayer('moveX', [keys[16] ? 10 : 1]);
                                }, this);
                                fn();
                                keys[keyCode] = setInterval(fn, 100);
                            }
                            e.preventDefault();
                        } else if (keyCode >= 97 && keyCode <= 105) {

                            var hAlign = horizontalAlign[keyCode],
                                vAlign = verticalAlign[keyCode],
                                toZero = false;
                            if (this.layerOptions.forms.placement.absolute.align.val() == hAlign && this.layerOptions.forms.placement.absolute.valign.val() == vAlign) {
                                toZero = true;
                            }
                            // numeric pad
                            this.layerOptions.layerFeatures.horizontalAlign(hAlign, toZero);
                            this.layerOptions.layerFeatures.verticalAlign(vAlign, toZero);

                        } else if (keyCode == 65) {
                            e.preventDefault();
                            var selectedLayer = this.mainContainer.getSelectedLayer();
                            if (selectedLayer && selectedLayer.placement.getType() == 'absolute') {
                                selectedLayer.placement.current.fit();
                            }
                        }
                    }

                    if (e.ctrlKey || e.metaKey) {
                        if (keyCode == 90) {
                            if (e.shiftKey) {
                                if (smartSlider.history.redo()) {
                                    e.preventDefault();
                                }
                            } else {
                                if (smartSlider.history.undo()) {
                                    e.preventDefault();
                                }
                            }
                        } else if (keyCode == 71) {
                            this.createGroupFromSelected();
                            e.preventDefault();
                        } else if (keyCode == 68) {
                            e.preventDefault();
                            this.slideEditManager.copySlide();
                        } else if (keyCode == 70) {
                            e.preventDefault();
                            this.slideEditManager.pasteSlide();
                        } else if (keyCode == 67) {
                            this.copy();
                        } else if (keyCode == 86) {
                            this.paste();
                        }
                    }
                }
            }, this),
            keyup: $.proxy(function (e) {
                if (typeof keys[e.keyCode] !== 'undefined' && keys[e.keyCode]) {
                    clearInterval(keys[e.keyCode]);
                    keys[e.keyCode] = 0;
                }
            }, this)
        });
    }

    CanvasManager.prototype.getSelf = function () {
        return this;
    }

    return CanvasManager;
});
N2Require('CanvasUserInterface', [], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    function CanvasUserInterface(canvasManager) {
        this.canvasManager = canvasManager;
        this.isShown = !$.jStorage.get('ssLayersShown', false);
        this.tlHeight = $.jStorage.get('ssLayersHeight') || 200;

        this.$container = $('#n2-ss-layers');
        this.fixScroll();
        this.switchLayerList();

        this.topBar = $('.n2-ss-layer-list-top-bar')
            .on('mousedown', $.proxy(this.resizeStart, this));

        this.topBar.find('.n2-ss-layer-list-opener').on('click', $.proxy(function (e) {
            e.preventDefault();
            this.switchLayerList();
        }, this));

        $('.n2-ss-slide-show-layers').on('click', $.proxy(function (e) {
            e.preventDefault();
            this.switchLayerList();
        }, this));

        this.onResize();
        $(window).on('resize', $.proxy(this.onResize, this));
    };

    CanvasUserInterface.prototype.onResize = function () {
        var h = this.$container.height();
        this.paneLeft.height(h - 48);
        this.paneRight.height(h - 48);
    }

    CanvasUserInterface.prototype.onActivateLayer = function (layer) {

        var scrollTop = this.paneLeft.scrollTop(),
            top = 0,
            currentLayer = layer;

        do {
            top += currentLayer.layerRow.get(0).offsetTop;
            currentLayer = currentLayer.group;
        } while (currentLayer !== this.canvasManager.mainContainer);

        if (top < scrollTop || top > scrollTop + this.paneLeft.height() - 40) {
            this.paneLeft.scrollTop(top);
            this.paneRight.scrollTop(top);
        }
    }

    CanvasUserInterface.prototype.fixScroll = function () {

        this.paneLeft = $('.n2-ss-layers-sidebar-rows');
        this.paneRight = $('.n2-ss-timeline-content-layers-container');

        var cb = $.proxy(function (e) {
            var top = this.paneLeft.scrollTop();
            if (e.originalEvent.deltaY > 0) {
                top += 40;
            } else {
                top -= 40;
            }
            top = Math.round(top / 40) * 40;
            this.paneLeft.scrollTop(top);
            this.paneRight.scrollTop(top);
            e.preventDefault();
        }, this);

        this.paneLeft.on('mousewheel', cb);
        this.paneLeft.on('scroll', $.proxy(function (e) {
            var top = this.paneLeft.scrollTop();
            this.paneRight.scrollTop(top);
            e.preventDefault();
        }, this));

        this.paneRight.on('mousewheel', cb);
    }

    CanvasUserInterface.prototype.resizeStart = function (e) {
        if (!this.isShown) return;
        if (e.target == this.topBar[0] || $(e.target).hasClass('n2-h2')) {
            e.preventDefault();
            this.startY = e.clientY;
            this.height = this.$container.height();
            $('body').on({
                'mousemove.n2-ss-tl-resize': $.proxy(this.resizeMove, this),
                'mouseup.n2-ss-tl-resize': $.proxy(this.resizeStop, this),
                'mouseleave.n2-ss-tl-resize': $.proxy(this.resizeStop, this)
            });
        }
    }

    CanvasUserInterface.prototype.resizeMove = function (e) {
        e.preventDefault();
        this.setTLHeight(this._calculateDesiredHeight(e));
    }

    CanvasUserInterface.prototype.resizeStop = function (e) {
        e.preventDefault();
        $('body').off('.n2-ss-tl-resize');
        var h = this._calculateDesiredHeight(e);
        this.setTLHeight(h);

        this.tlHeight = h;
        $.jStorage.set('ssLayersHeight', h);
        $('#n2-admin').triggerHandler('resize');
    }

    CanvasUserInterface.prototype._calculateDesiredHeight = function (e) {
        var h = this.startY - e.clientY + this.height - 48;
        return this.__calculateDesiredHeight(h);
    }

    CanvasUserInterface.prototype.__calculateDesiredHeight = function (h) {
        return Math.round(Math.min(Math.max(40, h), (window.innerHeight || document.documentElement.clientHeight) / 2) / 40) * 40 + 48;
    }


    CanvasUserInterface.prototype.switchLayerList = function () {
        this.isShown = !this.isShown;
        this.$container.toggleClass('n2-active', this.isShown);
        if (this.isShown) {
            this.setTLHeight(this.tlHeight);
        } else {
            this.setTLHeight(48);
        }
        $.jStorage.set('ssLayersShown', this.isShown);
    }

    CanvasUserInterface.prototype.setTLHeight = function (h) {
        h = Math.max(48, h);
        this.$container.height(h);
        h = this.$container.height();
        this.paneLeft.height(h - 48);
        this.paneRight.height(h - 48);

        nextend.triggerResize();
    }

    CanvasUserInterface.prototype.activateAdd = function (x, y) {
        this.$add.css({
            left: x,
            top: y
        }).appendTo(this.$container);
    }

    return CanvasUserInterface;
});
N2Require('LayerFeatures', [], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    var nameToIndex = {
        left: 0,
        center: 1,
        right: 2,
        top: 0,
        middle: 1,
        bottom: 2
    };

    function LayerFeatures(fields, canvasManager) {
        this.fields = fields;
        this.canvasManager = canvasManager;

        this.initParentLinker();
        this.initAlign();
        this.initEvents();
    }

    LayerFeatures.prototype.initParentLinker = function () {
        var field = this.fields.parentid.data('field'),
            parentLinker = $('#n2-ss-layer-parent-linker').on({
                click: function (e) {
                    field.click(e);
                }
            });
    };

    LayerFeatures.prototype.initAlign = function () {

        this.layerDefault = {
            align: null,
            valign: null
        };

        var hAlignButton = $('#n2-ss-layer-horizontal-align .n2-radio-option'),
            vAlignButton = $('#n2-ss-layer-vertical-align .n2-radio-option');

        hAlignButton.add(vAlignButton).on('click', $.proxy(function (e) {
            if (e.ctrlKey || e.metaKey) {
                var $el = $(e.currentTarget),
                    isActive = $el.hasClass('n2-sub-active'),
                    align = $el.data('align');
                switch (align) {
                    case 'left':
                    case 'center':
                    case 'right':
                        hAlignButton.removeClass('n2-sub-active');
                        if (isActive) {
                            $.jStorage.set('ss-item-horizontal-align', null);
                            this.layerDefault.align = null;
                        } else {
                            $.jStorage.set('ss-item-horizontal-align', align);
                            this.layerDefault.align = align;
                            $el.addClass('n2-sub-active');
                        }
                        break;
                    case 'top':
                    case 'middle':
                    case 'bottom':
                        vAlignButton.removeClass('n2-sub-active');
                        if (isActive) {
                            $.jStorage.set('ss-item-vertical-align', null);
                            this.layerDefault.valign = null;
                        } else {
                            $.jStorage.set('ss-item-vertical-align', align);
                            this.layerDefault.valign = align;
                            $el.addClass('n2-sub-active');
                        }
                        break;
                }
            } else if (this.canvasManager.mainContainer.getSelectedLayer()) {
                var align = $(e.currentTarget).data('align');
                switch (align) {
                    case 'left':
                    case 'center':
                    case 'right':
                        this.horizontalAlign(align, true);
                        break;
                    case 'top':
                    case 'middle':
                    case 'bottom':
                        this.verticalAlign(align, true);
                        break;
                }
            }
        }, this));

        this.fields.align.on('nextendChange', $.proxy(function () {
            hAlignButton.removeClass('n2-active');
            switch (this.fields.align.val()) {
                case 'left':
                    hAlignButton.eq(0).addClass('n2-active');
                    break;
                case 'center':
                    hAlignButton.eq(1).addClass('n2-active');
                    break;
                case 'right':
                    hAlignButton.eq(2).addClass('n2-active');
                    break;
            }
        }, this));
        this.fields.valign.on('nextendChange', $.proxy(function () {
            vAlignButton.removeClass('n2-active');
            switch (this.fields.valign.val()) {
                case 'top':
                    vAlignButton.eq(0).addClass('n2-active');
                    break;
                case 'middle':
                    vAlignButton.eq(1).addClass('n2-active');
                    break;
                case 'bottom':
                    vAlignButton.eq(2).addClass('n2-active');
                    break;
            }
        }, this));


        var hAlign = $.jStorage.get('ss-item-horizontal-align', null),
            vAlign = $.jStorage.get('ss-item-vertical-align', null);
        if (hAlign != null) {
            hAlignButton.eq(nameToIndex[hAlign]).addClass('n2-sub-active');
            this.layerDefault.align = hAlign;
        }
        if (vAlign != null) {
            vAlignButton.eq(nameToIndex[vAlign]).addClass('n2-sub-active');
            this.layerDefault.valign = vAlign;
        }
    };

    LayerFeatures.prototype.horizontalAlign = function (align, toZero) {
        if (this.fields.align.val() != align) {
            this.fields.align.data('field').options.eq(nameToIndex[align]).trigger('click');
        } else if (toZero) {
            this.fields.left.val(0).trigger('change');
        }
    };

    LayerFeatures.prototype.verticalAlign = function (align, toZero) {
        if (this.fields.valign.val() != align) {
            this.fields.valign.data('field').options.eq(nameToIndex[align]).trigger('click');
        } else if (toZero) {
            this.fields.top.val(0).trigger('change');
        }
    };

    LayerFeatures.prototype.initEvents = function () {
        var parent = $('#n2-tab-events'),
            heading = parent.find('.n2-h3'),
            headingLabel = heading.html(),
            row = $('<div class="n2-editor-header n2-h2 n2-uc"><span>' + headingLabel + '</span></div>');

        heading.replaceWith(row);
    }

    return LayerFeatures;
});
N2Require('LayerWindow', [], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    var menuHideTimeout = false;

    function LayerWindow(canvasManager) {

        this.isMinimized = false;
        this.detachedPosition = {
            left: $.jStorage.get('ssPanelLeft') || 100,
            top: $.jStorage.get('ssPanelTop') || 100,
            height: $.jStorage.get('ssPanelHeight') || 400
        }
        this.autoPosition = $.jStorage.get('ssPanelAutoPosition', 1);

        this.hasBreadcrumb = false;
        this.lastHeight = this.detachedPosition.height;

        this.admin = $('#n2-admin');
        this.sidebar = $('#n2-ss-layer-window').on('mousedown', $.proxy(nextend.context.setMouseDownArea, nextend.context, 'sidebarClicked'));

        this.title = this.sidebar.find('.n2-ss-layer-window-title-inner');
        this.sidebarTD = this.sidebar.parent();

        this.canvasManager = canvasManager;
        smartSlider.layerWindow = this;

        this.viewPanes = {
            layerEdit: $('#n2-tabbed-slide-editor-settings > .n2-tabs').addClass('n2-scrollable')
        };

        for (var k in this.viewPanes) {
            this.viewPanes[k].on('DOMMouseScroll mousewheel', function (e) {
                var up = false;
                if (e.originalEvent) {
                    if (e.originalEvent.wheelDelta) up = e.originalEvent.wheelDelta / -1 < 0;
                    if (e.originalEvent.deltaY) up = e.originalEvent.deltaY < 0;
                    if (e.originalEvent.detail) up = e.originalEvent.detail < 0;
                }

                var prevent = function () {
                    e.stopPropagation();
                    e.preventDefault();
                    e.returnValue = false;
                    return false;
                }

                if (!up && this.scrollHeight <= $(this).innerHeight() + this.scrollTop + 1) {
                    return prevent();
                } else if (up && 0 >= this.scrollTop - 1) {
                    return prevent();
                }
            });
        }

        this.panelHeading = $('#n2-tabbed-slide-editor-settings').find('.n2-sidebar-tab-switcher .n2-td');

        var left = this.sidebar.find('.n2-ss-layer-window-title-nav-left');

        $('<a href="#"><i class="n2-i n2-i-minimize n2-i-grey-opacity"></i></a>').on('click', $.proxy(function (e) {
            e.preventDefault();
            this.toggleMinimize();
        }, this)).appendTo(left);

        var right = this.sidebar.find('.n2-ss-layer-window-title-nav-right');

        this.magnet = $('<a href="#"><i class="n2-i n2-i-magnet n2-i-grey-opacity" data-n2tip="Auto position layer window"></i></a>').on('click', $.proxy(function (e) {
            e.preventDefault();
            this.magnetize();
        }, this)).css('display', 'none').appendTo(right);
        $('<a href="#"><i class="n2-i n2-i-closewindow n2-i-grey-opacity"></i></a>').on('click', $.proxy(function (e) {
            e.preventDefault();
            this.hide();
        }, this)).appendTo(right);

        nextend.tooltip.add(right);

        this.$breadcrumb = $('<div class="n2-ss-layer-window-breadcrumb"></div>').insertAfter('#n2-tabbed-slide-editor-settings > .n2-sidebar-tab-switcher');


        var $verticalBar = $('#n2-ss-add-sidebar');
        $('.n2-ss-add-layer-button').on('click', function (e) {
            e.preventDefault();
            $('#n2-ss-layers-switcher > .n2-labels .n2-td').eq(0).trigger('click');
            $verticalBar.toggleClass('n2-active');
        })

        $('.n2-ss-core-item').on('click', function (e) {
            $verticalBar.removeClass('n2-active');
        });

        var topOffset = $('#wpadminbar, .navbar-fixed-top').height() + $('.n2-top-bar').height();
        this.$verticalBarInner = $('.n2-ss-add-sidebar-inner').each(function () {
            var bar = $(this);
            bar.fixTo(bar.parent(), {
                top: topOffset
            });
        });

        this.$resizeInnerContainer = $('#n2-ss-layers-switcher_0, #n2-ss-layers-switcher_1');
        this.extraHeightToRemove = 60;
        if (!this.$resizeInnerContainer.length) {
            this.extraHeightToRemove = 0;
            this.$resizeInnerContainer = this.$verticalBarInner;
        }

        this.$resizeInnerContainer.css('overflow', 'auto');

        this.detach();

        $('#n2-admin').on('resize', $.proxy(this.resizeVerticalBar, this))

        $(window).on('resize', $.proxy(this.onResize, this));


        $('.n2-ss-slide-duplicate-layer').on('click', $.proxy(function (e) {
            e.preventDefault();
            this.duplicate();
        }, this.canvasManager));

        $('.n2-ss-slide-delete-layer').on('click', $.proxy(function (e) {
            e.preventDefault();
            this.delete();
        }, this.canvasManager));


        $('body').on('mousedown', $.proxy(function (e) {
            if (nextend.context.getCurrentWindow() == 'main') {
                if (nextend.context.mouseDownArea === false) {
                    this.hide();
                }
            }
        }, this));

        var $devicespecific = $('<div id="n2-ss-devicespecific-settings"></div>')

        var modes = nextend.smartSlider.frontend.responsive.parameters.deviceModes;
        for (var k in modes) {
            if (modes[k]) {
                var mode = k.replace(/([A-Z])/g, ' $1').split(' '),
                    device = mode[0],
                    orientation = mode[1].toLowerCase();
                $devicespecific.append('<i class="n2-i n2-it n2-i-mini-' + device + '-' + orientation + '" data-device="' + device + '" data-orientation="' + orientation + '"></i>');
            }
        }
        var cb = {
            'mouseenter': $.proxy(function (e) {
                $devicespecific.appendTo(e.currentTarget);
            }, this),
            'mouseleave': $.proxy(function (e) {
                $devicespecific.detach();
            }, this)
        };
        this.sidebar.find('[data-devicespecific] label').prepend('<span class="n2-i n2-i-mini-desktop-portrait"></span>');
        this.sidebar.find('[data-devicespecific] label').on(cb);
        $devicespecific.find('.n2-i').on({
            'click': $.proxy(function (e) {
                //e.stopImmediatePropagation();
                e.preventDefault();
                var $target = $(e.currentTarget);
                $('#n2-ss-devices').find('[data-device="' + $target.data('device') + '"][data-orientation="' + $target.data('orientation') + '"]').trigger('click')
            }, this)
        });
    };

    LayerWindow.prototype.toggleMinimize = function () {
        this.isMinimized = !this.isMinimized;
        this.sidebar.toggleClass('n2-ss-layer-window-minized', this.isMinimized);
        if (!this.isMinimized) {
            this.onResize();
        }
    }

    LayerWindow.prototype.magnetize = function () {
        if (!this.autoPosition) {

            this.autoPosition = 1;
            $.jStorage.set('ssPanelAutoPosition', 1);

            this.magnet.css('display', 'none');

            var activeLayer = this.canvasManager.mainContainer.getSelectedLayer();
            if (activeLayer) {
                activeLayer.positionSidebar();
            }
        }
    }

    LayerWindow.prototype.show = function (layer, of) {
        this.setTitle(layer);

        $('body').addClass('n2-ss-layer-edit-visible');
        if (this.autoPosition) {
            this.sidebar.position({
                my: 'left top',
                at: 'right+10 top',
                collision: "flipfit",
                of: of.is(':visible') ? of : '#n2-ss-layer-list'
            });
        }
    }

    LayerWindow.prototype._show = function () {
        $('body').addClass('n2-ss-layer-edit-visible');
    }

    LayerWindow.prototype.hide = function () {
        $('body').removeClass('n2-ss-layer-edit-visible');
    }

    LayerWindow.prototype.isVisible = function () {
        return $('body').hasClass('n2-ss-layer-edit-visible');
    }

    LayerWindow.prototype.hideWithDeferred = function (deferred) {
        if ($('body').hasClass('n2-ss-layer-edit-visible')) {
            this.hide();
            deferred.done($.proxy(this._show, this));
        }
    }

    LayerWindow.prototype.setTitle = function (layer) {
        this.title.html(layer.getName());

        this.updateGroupTitle(layer);
    }

    LayerWindow.prototype.updateGroupTitle = function (layer) {
        var i;
        this.$breadcrumb.html('');
        for (i = 0; i < 5; i++) {

            $('<span class="n2-window-title-structure-nav"><span>' + layer.label + '</span><span class="n2-i n2-it n2-i-mini-arrow-thin"></span></span>')
                .on({
                    mouseenter: $.proxy(function () {
                        this.canvasManager.highlight(this);
                    }, layer),
                    mouseleave: $.proxy(function () {
                        this.canvasManager.deHighlight(this);
                    }, layer),
                    click: $.proxy(function (e) {
                        this.canvasManager.deHighlight(this);
                        this.activate(e);
                    }, layer)
                })
                .prependTo(this.$breadcrumb);
            if (layer.group && layer.group !== this.canvasManager.mainContainer) {
                layer = layer.group;
            } else {
                break;
            }
        }

        this.hasBreadcrumb = i > 0;
        this.$breadcrumb.toggleClass('n2-has-breadcrumb', this.hasBreadcrumb)
        this.onResize();
    }

    LayerWindow.prototype.getLayerEditExcludedHeight = function () {
        return 85 + (this.hasBreadcrumb ? 23 : 0);
    };

    LayerWindow.prototype.resizeVerticalBar = function () {
        this.$resizeInnerContainer.height((window.innerHeight || document.documentElement.clientHeight) - ($('#n2-ss-layers').is(':visible') && $('#n2-ss-layers').hasClass('n2-active') ? $('#n2-ss-layers').height() : 0) - $('#wpadminbar, .navbar-fixed-top').height() - $('.n2-top-bar').height() - this.extraHeightToRemove);
    }

    LayerWindow.prototype.onResize = function () {
        this.sidebar.css('display', 'block');
        this.resizeVerticalBar();

        var windowHeight = (window.innerHeight || document.documentElement.clientHeight);

        var targetHeight = this.sidebar.height() - this.getLayerEditExcludedHeight();

        this.viewPanes['layerEdit'].height(targetHeight);

        var properties = {},
            windowWidth = (window.innerWidth || document.documentElement.clientWidth);
        var bounding = this.sidebar[0].getBoundingClientRect();

        if (bounding.left < 0) {
            properties.left = 0;
        } else if (bounding.left + bounding.width > windowWidth) {
            properties.left = Math.max(0, windowWidth - bounding.width);
        }

        if (bounding.height > windowHeight - bounding.top) {
            properties.top = windowHeight - bounding.top - bounding.height + bounding.top;
            if (properties.top < 0) {
                this.lastHeight = properties.height = bounding.height + properties.top;
                properties.top = 0;
            }
        }

        this.sidebar.css(properties);
        this.sidebar.css('display', '');

    }

    LayerWindow.prototype.detach = function () {
        if (this.autoPosition) {
            this.sidebar.css('height', this.detachedPosition.height);
            this.magnet.css('display', 'none');
        } else {
            this.sidebar.css(this.detachedPosition);
            this.magnet.css('display', 'inline-block');
        }
        this.sidebar.appendTo(this.admin);

        this.admin.addClass('n2-sidebar-hidden');

        $(window).off('.n2-ss-panel');
        this.sidebar.removeClass("n2-sidebar-fixed");

        this.sidebar
            .draggable({
                distance: 5,
                handle: ".n2-ss-layer-window-title",
                containment: 'window',
                stop: $.proxy(function (event, ui) {
                    this.sidebar.css('height', this.lastHeight);
                    var bounding = this.sidebar[0].getBoundingClientRect();
                    this.detachedPosition.left = bounding.left;
                    this.detachedPosition.top = bounding.top;

                    $.jStorage.set('ssPanelLeft', bounding.left);
                    $.jStorage.set('ssPanelTop', bounding.top);

                    this.autoPosition = 0;
                    $.jStorage.set('ssPanelAutoPosition', 0);
                    this.magnet.css('display', 'inline-block');
                }, this),
                scroll: false
            })
            .resizable({
                distance: 5,
                handles: "s",
                stop: $.proxy(function (event, ui) {
                    this.lastHeight = this.detachedPosition.height = this.sidebar.height();
                    $.jStorage.set('ssPanelHeight', this.detachedPosition.height);

                }, this),
                create: $.proxy(function (e, ui) {
                    var handle = $(e.target).find('.ui-resizable-handle').addClass('n2-ss-layer-window-resizer');
                }, this)
            });

        this.onResize();
        nextend.triggerResize();
    }

    LayerWindow.prototype.switchTab = function (tabName) {
        this.panelHeading.filter('[data-tab="' + tabName + '"]').trigger('click');
    };

    return LayerWindow;
});
N2Require('PositionDisplay', [], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    function PositionDisplay() {
        this.currentSource = '';
        $(window).ready($.proxy(this.ready, this));
    }

    PositionDisplay.prototype.ready = function () {
        this.$body = $('body');
        this.$el = $('<div class="n2 n2-ss-position-display"/>')
            .appendTo('body');
    }

    PositionDisplay.prototype.show = function (source) {
        if (this.currentSource == '') {
            this.currentSource = source;
            this.$el.addClass('n2-active');
            this.$body.addClass('n2-position-display-active');
        }
    }

    PositionDisplay.prototype.update = function (e, source, html) {
        if (this.currentSource == source) {
            this.$el.html(html)
                .css({
                    left: e.pageX + 10,
                    top: e.pageY + 10
                });
        }
    }

    PositionDisplay.prototype.hide = function (source) {
        if (this.currentSource == source || source === undefined) {
            this.$body.removeClass('n2-position-display-active');
            this.$el.removeClass('n2-active');
            this.currentSource = '';
        }

    }

    smartSlider.positionDisplay = new PositionDisplay();

    return PositionDisplay;
});
N2Require('Ruler', [], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    function Ruler(stored) {
        this.showGuides = 1;
        this.guides = [];
        this.container = $('<div class="n2-ruler-container" />').appendTo('#n2-ss-slide-canvas-container-inner .n2-ss-slider-outer-container');

        this.scale = 10;

        this.vertical = $('<div class="n2-ruler n2-ruler-vertical unselectable"></div>').appendTo('.n2-ss-slider-real-container');
        this.horizontal = $('<div class="n2-ruler n2-ruler-horizontal unselectable"></div>').appendTo(this.container);

        this.verticalSpans = $();
        this.horizontalSpans = $();

        this.onResize();
        nextend.smartSlider.frontend.sliderElement.on('SliderResize', $.proxy(this.onSliderResize, this))
        $(window).on('resize', $.proxy(this.onResize, this));

        this.horizontal.on('mousedown', $.proxy(function (e) {
            if (this.showGuides) {
                new GuideHorizontal(this, this.horizontal, e);
            }
        }, this));


        this.vertical.on('mousedown', $.proxy(function (e) {
            if (this.showGuides) {
                new GuideVertical(this, this.vertical, e);
            }
        }, this));


        try {
            stored = $.extend({vertical: [], horizontal: []}, JSON.parse(Base64.decode(stored)));
            for (var i = 0; i < stored.horizontal.length; i++) {
                var guide = new GuideHorizontal(this, this.horizontal);
                guide.setPosition(stored.horizontal[i]);
            }
            for (var i = 0; i < stored.vertical.length; i++) {
                var guide = new GuideVertical(this, this.vertical);
                guide.setPosition(stored.vertical[i]);
            }
        } catch (e) {
        }
        nextend.ruler = this;
        this.measureToolVertical();
        this.measureToolHorizontal();
    }

    Ruler.prototype.addGuide = function (guide) {
        this.guides.push(guide);
    }

    Ruler.prototype.removeGuide = function (guide) {
        this.guides.splice($.inArray(guide, this.guides), 1);
    }

    Ruler.prototype.clearGuides = function () {
        for (var i = this.guides.length - 1; i >= 0; i--) {
            this.guides[i].delete();
        }
    }

    Ruler.prototype.onSliderResize = function (e, ratios) {
        this.onResize();
    }

    Ruler.prototype.onResize = function () {
        var dimensions = nextend.smartSlider.frontend.responsive.responsiveDimensions,
            width = Math.max(dimensions.slider.width, $('#n2-ss-slide-canvas-container').outerWidth(true) - 40),
            height = Math.max(dimensions.slider.height, $('#n2-ss-slide-canvas-container').outerHeight(true));


        this.container.css({
            width: width + 40,
            height: height + 40
        });

        for (var i = this.horizontalSpans.length - 3; i < width / this.scale; i++) {
            var mark = $('<span />').appendTo(this.horizontal);
            if (i % 10 == 0) {
                mark.addClass('n2-ss-ruler-mark-large').append('<span>' + ((i / 10) * 100) + '</span>');
            } else if (i % 2 == 0) {
                mark.addClass('n2-ss-ruler-mark-medium');
            }
            this.horizontalSpans = this.horizontalSpans.add(mark);
        }

        for (var i = this.verticalSpans.length - 3; i < height / this.scale; i++) {
            var mark = $('<span />').appendTo(this.vertical);
            if (i % 10 == 0) {
                mark.addClass('n2-ss-ruler-mark-large').append('<span>' + ((i / 10) * 100) + '</span>');
            } else if (i % 2 == 0) {
                mark.addClass('n2-ss-ruler-mark-medium');
            }
            this.verticalSpans = this.verticalSpans.add(mark);
        }
    }

    Ruler.prototype.toArray = function () {
        var data = {
            horizontal: [],
            vertical: []
        };
        for (var i = 0; i < this.guides.length; i++) {
            if (this.guides[i] instanceof GuideHorizontal) {
                data.horizontal.push(this.guides[i].position);
            } else if (this.guides[i] instanceof GuideVertical) {
                data.vertical.push(this.guides[i].position);
            }
        }
        return data;
    }

    Ruler.prototype.measureToolVertical = function () {
        var guide = $('<div class="n2-ruler-guide" style="z-index:1;"><div class="n2-ruler-guide-border" style="border-color: #f00;"></div></div>')
            .css('display', 'none')
            .appendTo(this.vertical);

        var guideVisible = false,
            showGuide = $.proxy(function () {
                if (!guideVisible) {
                    guideVisible = true;
                    guide.css('display', '');
                    smartSlider.positionDisplay.show('Guide');
                }
            }, this),
            hideGuide = $.proxy(function () {
                if (guideVisible) {
                    guideVisible = false;
                    guide.css('display', 'none');
                    smartSlider.positionDisplay.hide('Guide');
                }
            }, this);
        this.vertical.on({
            mouseenter: $.proxy(function (e) {
                if (!this.showGuides) return;
                var lastY = 0,
                    offset = Math.round(this.vertical.offset().top);
                showGuide();

                this.vertical.on('mousemove.n2-ruler-measure-tool', $.proxy(function (e) {
                    if ($(e.target).hasClass('n2-ruler-guide-border') && $(e.target).parent()[0] != guide[0]) {
                        hideGuide();
                    } else {
                        showGuide();
                        if (lastY != e.pageY) {
                            var pos = e.pageY - offset;
                            guide.css('top', pos);
                            smartSlider.positionDisplay.update(e, 'Guide', (pos - 40) + 'px');
                            lastY = e.pageY;
                        }
                    }
                }, this));
            }, this),
            mouseleave: $.proxy(function () {
                this.vertical.off('.n2-ruler-measure-tool');
                hideGuide();
            }, this)
        });
    }

    Ruler.prototype.measureToolHorizontal = function () {
        var guide = $('<div class="n2-ruler-guide" style="z-index:1;"><div class="n2-ruler-guide-border" style="border-color: #f00;"></div></div>')
            .css('display', 'none')
            .appendTo(this.horizontal);

        var guideVisible = false,
            showGuide = $.proxy(function () {
                if (!guideVisible) {
                    guideVisible = true;
                    guide.css('display', '');
                    smartSlider.positionDisplay.show('Guide');
                }
            }, this),
            hideGuide = $.proxy(function () {
                if (guideVisible) {
                    guideVisible = false;
                    guide.css('display', 'none');
                    smartSlider.positionDisplay.hide('Guide');
                }
            }, this);

        this.horizontal.on({
            mouseenter: $.proxy(function (e) {
                if (!this.showGuides) return;
                var lastX = 0,
                    offset = Math.round(this.horizontal.offset().left);
                showGuide();

                this.horizontal.on('mousemove.n2-ruler-measure-tool', $.proxy(function (e) {
                    if ($(e.target).hasClass('n2-ruler-guide-border') && $(e.target).parent()[0] != guide[0]) {
                        hideGuide();
                    } else {
                        showGuide();
                        if (lastX != e.pageX) {
                            var pos = Math.max(e.pageX - offset, 40);
                            guide.css('left', pos);
                            smartSlider.positionDisplay.update(e, 'Guide', (pos - 40) + 'px');
                            lastX = e.pageX;
                        }
                    }
                }, this));
            }, this),
            mouseleave: $.proxy(function () {
                this.horizontal.off('.n2-ruler-measure-tool');
                hideGuide();
            }, this)
        });
    }

    function Guide(ruler, container, e) {
        this.ruler = ruler;
        this.container = container;
        this.position = 0;

        this.guide = $('<div class="n2-ruler-guide n2-ruler-user-guide"><div class="n2-ruler-guide-border"></div><div class="n2-ruler-guide-handle"></div></div>')
            .appendTo(container)
            .on('mousedown', $.proxy(function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (!nextend.smartSlider.canvasManager.canvasSettings.settings['n2-ss-lock-guides']) {
                    this.delete();
                }
            }, this));

        this.ruler.addGuide(this);

        if (e) {
            this.create(e);
        }

    }

    Guide.prototype._position = function (position, e) {
        return Math.max(0, position);
    }

    Guide.prototype.setPosition = function (position) {
        this.position = position;
        this.refresh();
    }

    Guide.prototype.refresh = function () {
        this.positionRender(this.position);
    }

    Guide.prototype.delete = function () {
        this.ruler.removeGuide(this);
        this.guide.remove();
    }

    function GuideHorizontal() {
        Guide.prototype.constructor.apply(this, arguments);
    }

    GuideHorizontal.prototype = Object.create(Guide.prototype);
    GuideHorizontal.prototype.constructor = GuideHorizontal;


    GuideHorizontal.prototype.create = function (e) {

        var offset = Math.round(this.container.offset().left) + 40;

        this.position = this._position((e.pageX - offset), e);
        this.positionRender(this.position);
    }

    GuideHorizontal.prototype.rawPositionRender = function (value) {
        this.guide.css('left', Math.max(0, value) + 40);
    }

    GuideHorizontal.prototype.positionRender = function (value) {
        this.guide.css('left', Math.max(0, value) + 40);
    }

    function GuideVertical() {
        Guide.prototype.constructor.apply(this, arguments);
    }

    GuideVertical.prototype = Object.create(Guide.prototype);
    GuideVertical.prototype.constructor = GuideVertical;

    GuideVertical.prototype.create = function (e) {

        var offset = Math.round(this.container.offset().top) + 40;
        this.position = this._position((e.pageY - offset), e);
        this.positionRender(this.position);
    }

    GuideVertical.prototype.rawPositionRender = function (value) {
        this.guide.css('top', Math.max(0, value) + 40);
    }

    GuideVertical.prototype.positionRender = function (value) {
        this.guide.css('top', Math.max(0, value) + 40);
    }

    return Ruler;
});
N2Require('CanvasSettings', [], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";
    function CanvasSettings(canvasManager) {

        this.canvasManager = canvasManager;

        this.settings = {}
        var $settings = $('#n2-ss-slide-canvas-settings')
            .on('mouseleave', $.proxy(function () {
                $settings.removeClass('n2-active');
            }, this));

        $settings.find('> a').on('click', function (e) {
            e.preventDefault();
            $settings.toggleClass('n2-active');
        });

        this.$settingsPanel = $settings.find('.n2-ss-settings-panel-inner');
        this.snapTo();
        this.roundTo();
        this.colorScheme();
        if (!this.canvasManager.slideEditManager.options.isAddSample) {
            this.ruler();
        }
    }

    CanvasSettings.prototype._addSettings = function (hash, title, _default, cb) {
        this.settings[hash] = parseInt($.jStorage.get(hash, _default));
        var row = $('<a href="">' + title + '<span class="n2-setting-tick"><i class="n2-i n2-it n2-i-tick2"></i></span></a>').on('click', $.proxy(function (e) {
            e.preventDefault();
            this.settings[hash] = (this.settings[hash] == 1 ? 0 : 1);
            $.jStorage.set(hash, this.settings[hash]);
            row.toggleClass('n2-setting-enabled', this.settings[hash] == 1);
            cb(this.settings[hash], false);
        }, this)).appendTo(this.$settingsPanel);

        row.toggleClass('n2-setting-enabled', this.settings[hash] == 1);
        cb(this.settings[hash], true);
    }

    CanvasSettings.prototype._addAction = function (title, cb) {
        $('<a href="" class="n2-panel-action">' + title + '</a>').on('click', $.proxy(function (e) {
            e.preventDefault();
            cb();
        }, this)).appendTo(this.$settingsPanel);
    }

    CanvasSettings.prototype.get = function (name) {
        return this.settings[name];
    }

    CanvasSettings.prototype.snapTo = function () {

        this._addSettings("n2-ss-snap-to-enabled", n2_('Smart Snap'), 1, $.proxy(function (value) {
            var layers = this.mainContainer.container.getSortedLayers();
            for (var i = 0; i < layers.length; i++) {
                layers[i].placement.doAction('snap');
            }
        }, this.canvasManager));
    };

    CanvasSettings.prototype.roundTo = function () {

        this._addSettings("n2-ss-round-to-enabled", n2_('Round to 5px'), 1, function (value) {
            if (value == 1) {
                nextend.roundTo = 5;
            } else {
                nextend.roundTo = 1;
            }
        });
    };

    CanvasSettings.prototype.colorScheme = function () {

        var themeElement = $('#n2-ss-slide-canvas-container');
        this._addSettings("n2-ss-theme-dark", n2_('Dark Mode'), 0, function (value) {
            themeElement.toggleClass('n2-ss-theme-dark', value == 1);
        });
    };


    CanvasSettings.prototype.ruler = function () {
        smartSlider.ruler = new scope.Ruler($('#slideguides').val());

        var editor = $('#n2-ss-slide-canvas-container');
        this._addSettings("n2-ss-ruler-enabled", n2_('Ruler'), 1, $.proxy(function (value) {
            editor.toggleClass('n2-ss-has-ruler', value == 1);
            nextend.triggerResize();
        }, this));


        this._addSettings("n2-ss-show-guides", n2_('Show Guides'), 1, $.proxy(function (value) {
            nextend.ruler.showGuides = value;
            editor.toggleClass('n2-ss-show-guides', value == 1);
        }, this));
        this._addSettings("n2-ss-lock-guides", n2_('Lock Guides'), 0, $.proxy(function (value) {
            editor.toggleClass('n2-ss-lock-guides', value == 1);
        }, this));

        this._addAction('Clear Guides', $.proxy(function () {
            nextend.ruler.clearGuides();
        }, this))
    };

    return CanvasSettings;
});
N2Require('PlacementAbsolute', ['PlacementAbstract'], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    var rAFShim = (function () {
            var timeLast = 0;

            return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
                    var timeCurrent = (new Date()).getTime(),
                        timeDelta;

                    /* Dynamically set delay on a per-tick basis to match 60fps. */
                    /* Technique by Erik Moller. MIT license: https://gist.github.com/paulirish/1579671 */
                    timeDelta = Math.max(0, 16 - (timeCurrent - timeLast));
                    timeLast = timeCurrent + timeDelta;

                    return setTimeout(function () {
                        callback(timeCurrent + timeDelta);
                    }, timeDelta);
                };
        })(),
        resizeCollection = {
            raf: false,
            ratios: null,
            isThrottled: false,
            layers: []
        },
        requestRender = function () {
            if (resizeCollection.raf === false) {
                resizeCollection.raf = true;
                rAFShim(function () {
                    for (var i = 0; i < resizeCollection.layers.length; i++) {
                        if (!resizeCollection.layers[i].isDeleted) {
                            resizeCollection.layers[i].doTheResize(resizeCollection.ratios, true, resizeCollection.isThrottled);
                        }
                    }
                    resizeCollection = {
                        raf: false,
                        ratios: null,
                        isThrottled: false,
                        layers: []
                    };
                });
            }
        };

    /**
     *
     * @alias scope.PlacementAbsolute
     * @param placement
     * @param layer
     * @param canvasManager
     * @constructor
     */
    function PlacementAbsolute(placement, layer, canvasManager) {
        this.type = 'absolute';

        this.transferredProperties = {};

        scope.PlacementAbstract.prototype.constructor.apply(this, arguments);

        this.doThrottledTheResize = this.doTheResize;
        this._triggerLayerResizedThrottled = NextendThrottle(this._triggerLayerResized, 30);

        this.parentIsVisible = true; // Related to parent child layer picker

        this.children = [];
    }

    PlacementAbsolute.prototype = Object.create(scope.PlacementAbstract.prototype);
    PlacementAbsolute.prototype.constructor = PlacementAbsolute;

    PlacementAbsolute.prototype.start = function () {
        this.$layer = this.layer.layer;
        this.$layerRow = this.layer.layerRow;
    }

    PlacementAbsolute.prototype.preActivation = function (lastPlacement) {
        if (lastPlacement.type == 'normal') {
            var height = this.layer.getProperty('height');
            if (height > 0) {
                this.transferredProperties.height = height;
            }
        }
    }

    PlacementAbsolute.prototype.activated = function (properties) {
        var delayedActivate = false,
            parentid = this.$layer.data('parentid');
        if (parentid) {
            var $parent = $('#' + parentid);
            if ($parent.length > 0) {
                this.activatedAfterParentReady(properties);
            } else {
                setTimeout($.proxy(function () {
                    this.activatedAfterParentReady(properties);
                }, this), 300);
            }
        } else {
            this._activated(properties);
        }
    }

    PlacementAbsolute.prototype.activatedAfterParentReady = function (properties) {
        var parentid = this.$layer.data('parentid');
        if (parentid) {
            var $parent = $('#' + parentid);
            if ($parent.length > 0) {
                var layerObject = $parent.data('layerObject');
                if (layerObject) {
                    layerObject.readyDeferred.done($.proxy(this._activated, this, properties));
                } else {
                    $parent.on('layerStarted', $.proxy(function (e, layerObject) {
                        layerObject.readyDeferred.done($.proxy(this._activated, this, properties));
                    }, this));
                }
            } else {
                this.$layer.data('parentid', '');
                this._activated(properties);
            }
        } else {
            this._activated(properties);
        }
    }

    PlacementAbsolute.prototype._activated = function (properties) {
        this.loadProperties($.extend(properties, this.transferredProperties));
        this.transferredProperties = {};

        this.$layer.css('zIndex', '');

        this.___makeLayerAlign();
        this.___makeLayerResizeable();
    }

    PlacementAbsolute.prototype.deActivated = function (newMode) {

        this.$layer
            .removeAttr('data-align')
            .removeAttr('data-valign')
            .css({
                left: '',
                top: '',
                right: '',
                bottom: '',
                width: '',
                height: '',
                'text-align': ''
            });

        this.alignMarker.remove();
        this.$layer.nextendResizable('destroy');
        this.$layer.off('.n2-ss-absolute');

        this.$layer.triggerHandler('LayerUnavailable');

        var properties = ['parentid', 'responsiveposition', 'responsivesize', 'parentalign', 'parentvalign',
            'align', 'valign', 'left', 'top', 'width', 'height'];

        var historicalData = this.layer.getPropertiesData(properties);

        this.layer.removeProperties(properties);


        this.chainParent.remove();

        return historicalData;
    }

    PlacementAbsolute.prototype.loadProperties = function (options) {
        this.layer.createProperty('parentid', null, this.layer.layer, this);

        this.layer.createProperty('responsiveposition', 1, this.layer.layer, this);
        this.layer.createProperty('responsivesize', 1, this.layer.layer, this);

        this.layer.createDeviceProperty('parentalign', {desktopPortrait: 'center'}, this.layer.layer, this);
        this.layer.createDeviceProperty('parentvalign', {desktopPortrait: 'middle'}, this.layer.layer, this);

        this.layer.createDeviceProperty('align', {desktopPortrait: options.align || 'center'}, this.layer.layer, this);
        this.layer.createDeviceProperty('valign', {desktopPortrait: options.valign || 'middle'}, this.layer.layer, this);

        this.layer.createDeviceProperty('left', {desktopPortrait: options.left || 0}, this.layer.layer, this);
        this.layer.createDeviceProperty('top', {desktopPortrait: options.top || 0}, this.layer.layer, this);

        this.layer.createDeviceProperty('width', {desktopPortrait: options.width || 'auto'}, this.layer.layer, this);
        this.layer.createDeviceProperty('height', {desktopPortrait: options.height || 'auto'}, this.layer.layer, this);

        var $layer = this.layer.layer;

        this.subscribeParentCallbacks = {};
        if (this.layer.getProperty('parentid')) {
            this.subscribeParent();
        }

        $layer.attr({
            'data-align': this.layer.getProperty('align'),
            'data-valign': this.layer.getProperty('valign')
        });

        var $lastParent = null;
        this.chainParent = $('<div class="n2-ss-layer-chain-parent n2-button n2-button-icon n2-button-xs n2-radius-s n2-button-blue"><i class="n2-i n2-i-layerunlink"></i></div>').on({
            click: $.proxy(this.unlink, this),
            mouseenter: $.proxy(function () {
                $lastParent = $('#' + this.layer.getProperty('parentid')).addClass('n2-highlight');
            }, this),
            mouseleave: $.proxy(function () {
                if ($lastParent) {
                    $lastParent.removeClass('n2-highlight');
                    $lastParent = null;
                }
            }, this)
        }).appendTo(this.$layer);
    }


    PlacementAbsolute.prototype.triggerLayerResized = function (isThrottled, ratios) {
        if (isThrottled) {
            this._triggerLayerResized(isThrottled, ratios);
        } else {
            this._triggerLayerResizedThrottled(true, ratios);
        }
    };

    PlacementAbsolute.prototype._triggerLayerResized = function (isThrottled, ratios) {
        if (!this.layer.isDeleted) {
            this.$layer.triggerHandler('LayerResized', [ratios || {
                slideW: this.canvasManager.getResponsiveRatio('h'),
                slideH: this.canvasManager.getResponsiveRatio('v')
            }, isThrottled || false]);
        }
    };

    PlacementAbsolute.prototype.___makeLayerAlign = function () {
        this.alignMarker = $('<div class="n2-ss-layer-cc" />').appendTo(this.$layer);
    };

    //<editor-fold desc="Makes layer resizable">

    /**
     * Add resize handles to the specified layer
     * @param {jQuery} layer
     * @private
     */
    PlacementAbsolute.prototype.___makeLayerResizeable = function () {
        this._resizableJustClick = false;
        this.$layer.nextendResizable({
            handles: 'n, e, s, w, ne, se, sw, nw',
            _containment: this.canvasManager.mainContainer.layer,
            start: $.proxy(this.____makeLayerResizeableStart, this),
            resize: $.proxy(this.____makeLayerResizeableResize, this),
            stop: $.proxy(this.____makeLayerResizeableStop, this),
            create: $.proxy(function () {
                this.$layer.find('.ui-resizable-handle, .n2-ss-layer-cc').on({
                    mousedown: $.proxy(function (e) {
                        this._resizableJustClick = [e.clientX, e.clientY];
                    }, this),
                    mouseup: $.proxy(function (e) {
                        if (this._resizableJustClick && Math.abs(Math.sqrt(Math.pow(this._resizableJustClick[0] - e.clientX, 2) + Math.pow(this._resizableJustClick[1] - e.clientY, 2))) < 1) {
                            var $target = $(e.currentTarget),
                                layerFeatures = this.canvasManager.layerOptions.layerFeatures;
                            if ($target.hasClass('ui-resizable-nw')) {
                                layerFeatures.horizontalAlign('left', false);
                                layerFeatures.verticalAlign('top', false);
                            } else if ($target.hasClass('ui-resizable-w')) {
                                layerFeatures.horizontalAlign('left', false);
                                layerFeatures.verticalAlign('middle', false);
                            } else if ($target.hasClass('ui-resizable-sw')) {
                                layerFeatures.horizontalAlign('left', false);
                                layerFeatures.verticalAlign('bottom', false);
                            } else if ($target.hasClass('ui-resizable-n')) {
                                layerFeatures.horizontalAlign('center', false);
                                layerFeatures.verticalAlign('top', false);
                            } else if ($target.hasClass('n2-ss-layer-cc')) {
                                layerFeatures.horizontalAlign('center', false);
                                layerFeatures.verticalAlign('middle', false);
                            } else if ($target.hasClass('ui-resizable-s')) {
                                layerFeatures.horizontalAlign('center', false);
                                layerFeatures.verticalAlign('bottom', false);
                            } else if ($target.hasClass('ui-resizable-ne')) {
                                layerFeatures.horizontalAlign('right', false);
                                layerFeatures.verticalAlign('top', false);
                            } else if ($target.hasClass('ui-resizable-e')) {
                                layerFeatures.horizontalAlign('right', false);
                                layerFeatures.verticalAlign('middle', false);
                            } else if ($target.hasClass('ui-resizable-se')) {
                                layerFeatures.horizontalAlign('right', false);
                                layerFeatures.verticalAlign('bottom', false);
                            }
                        }
                        this._resizableJustClick = false;
                    }, this)
                });
            }, this),
            smartguides: $.proxy(function () {
                this.$layer.triggerHandler('LayerParent');
                return this.canvasManager.getSnap();
            }, this),
            tolerance: 5
        })
            .on({
                'mousedown.n2-ss-absolute': $.proxy(function (e) {
                    if (!this.layer.status != scope.ComponentAbstract.STATUS.LOCKED) {
                        smartSlider.positionDisplay.show('Canvas');

                        smartSlider.positionDisplay.update(e, 'Canvas', 'W: ' + parseInt(this.$layer.width()) + 'px<br />H: ' + parseInt(this.$layer.height()) + 'px');

                    }
                    if (document.activeElement) {
                        document.activeElement.blur();
                    }
                }, this),
                'mouseup.n2-ss-absolute': $.proxy(function (e) {
                    smartSlider.positionDisplay.hide('Canvas');
                }, this)
            });
    };

    PlacementAbsolute.prototype.____makeLayerResizeableStart = function (event, ui) {
        this.preventActivation = true;
        this.resizableDeferred = $.Deferred();
        this.canvasManager.layerWindow.hideWithDeferred(this.resizableDeferred);
        $('body').addClass('n2-ss-resize-layer');
        if (this._resizableJustClick) {
            this._resizableJustClick = false;
        }
        this.____makeLayerResizeableResize(event, ui);
        smartSlider.positionDisplay.show('Canvas');
    };

    PlacementAbsolute.prototype.____makeLayerResizeableResize = function (e, ui) {


        smartSlider.positionDisplay.update(e, 'Canvas', 'W: ' + ui.size.width + 'px<br />H: ' + ui.size.height + 'px');

        this.triggerLayerResized();
    };

    PlacementAbsolute.prototype.____makeLayerResizeableStop = function (event, ui) {
        $('body').removeClass('n2-ss-resize-layer');
        this.resizableDeferred.resolve();

        var isAutoWidth = false;
        if (ui.axis == "n" || ui.axis == "s" || ui.originalSize.width == ui.size.width) {
            var currentValue = this.layer.getProperty('width');
            if (this.layer.isDimensionPropertyAccepted(currentValue)) {
                isAutoWidth = true;
                this._syncwidth();
            }
        }

        var isAutoHeight = false;
        if (ui.axis == "e" || ui.axis == "w" || ui.originalSize.height == ui.size.height) {
            var currentValue = this.layer.getProperty('height');
            if (this.layer.isDimensionPropertyAccepted(currentValue)) {
                isAutoHeight = true;
                this._syncheight();
            }
        }

        var ratioSizeH = this.canvasManager.getResponsiveRatio('h'),
            ratioSizeV = this.canvasManager.getResponsiveRatio('v');

        if (!parseInt(this.layer.getProperty('responsivesize'))) {
            ratioSizeH = ratioSizeV = 1;
        }
        var width = null;
        if (!isAutoWidth) {
            width = Math.round(ui.size.width * (1 / ratioSizeH));
        }
        var height = null;
        if (!isAutoHeight) {
            height = Math.round(ui.size.height * (1 / ratioSizeV));
        }

        this._setPosition(null, null, ui.position.left, ui.position.top, width, height, true);

        this.triggerLayerResized();

        this.$layer.triggerHandler('LayerUnParent');

        smartSlider.positionDisplay.hide('Canvas');

        setTimeout($.proxy(function () {
            this.preventActivation = false;
        }, this), 80);

        //this.canvasManager.panel.positionMenu(this.$layer);
    };
    //</editor-fold>

    PlacementAbsolute.prototype._setPosition = function (align, valign, left, top, width, height, isPositionAbsolute) {
        var mode = this.layer.getMode();
        if (align === null) {
            align = this.layer.getProperty('align');
        }
        if (valign === null) {
            valign = this.layer.getProperty('valign');
        }

        if (left === null) {
            left = this.layer.getProperty('left');
        } else if (isPositionAbsolute) {
            left = this.calculatePositionLeft(align, left);
        }

        if (top === null) {
            top = this.layer.getProperty('top');
        } else if (isPositionAbsolute) {
            top = this.calculatePositionTop(valign, top);
        }

        if (width === null) {
            width = this.layer.getProperty('width');
        }

        if (height === null) {
            height = this.layer.getProperty('height');
        }

        var task = smartSlider.history.addValue(this.layer, this.layer.historyStoreOnPlacement, ['historyStorePosition', mode]);
        if (task) {
            task.setValues({
                align: this.layer.getRawProperty('align'),
                valign: this.layer.getRawProperty('valign'),
                left: this.layer.getRawProperty('left'),
                top: this.layer.getRawProperty('top'),
                width: this.layer.getRawProperty('width'),
                height: this.layer.getRawProperty('height')
            }, {
                align: align,
                valign: valign,
                left: left,
                top: top,
                width: width,
                height: height
            });
        }

        smartSlider.history.off();

        this.layer.store('left', left, true, 'layer');
        this.layer.$.trigger('propertyChanged', ['left', left]);

        this.layer.store('top', top, true, 'layer');
        this.layer.$.trigger('propertyChanged', ['top', top]);

        this.layer.store('width', width, true, 'layer');
        this.layer.$.trigger('propertyChanged', ['width', width]);

        this.layer.store('height', height, true, 'layer');
        this.layer.$.trigger('propertyChanged', ['height', height]);

        this.layer.store('align', align, true, 'layer');
        this.layer.$.trigger('propertyChanged', ['align', align]);

        this.layer.store('valign', valign, true, 'layer');
        this.layer.$.trigger('propertyChanged', ['valign', valign]);

        smartSlider.history.on();

    };

    PlacementAbsolute.prototype.historyStorePosition = function (values, mode) {

        this.layer.historyStore(values.align, 'align', mode);
        this.layer.historyStore(values.valign, 'valign', mode);

        this.layer.historyStore(values.width, 'width', mode);
        this.layer.historyStore(values.height, 'height', mode);

        this.layer.historyStore(values.left, 'left', mode);
        this.layer.historyStore(values.top, 'top', mode);

        this.triggerLayerResized();
    }

    PlacementAbsolute.prototype.calculatePositionLeft = function (align, left) {
        var ratioH = this.canvasManager.getResponsiveRatio('h');

        if (!parseInt(this.layer.getProperty('responsiveposition'))) {
            ratioH = 1;
        }

        var parent = this.parent,
            p = {
                left: 0,
                leftMultiplier: 1
            };
        if (!parent || !parent.is(':visible')) {
            parent = this.$layer.parent();


            switch (align) {
                case 'center':
                    p.left += parent.width() / 2;
                    break;
                case 'right':
                    p.left += parent.width();
                    break;
            }
        } else {
            var position = parent.position();
            switch (this.layer.getProperty('parentalign')) {
                case 'right':
                    p.left = position.left + parent.width();
                    break;
                case 'center':
                    p.left = position.left + parent.width() / 2;
                    break;
                default:
                    p.left = position.left;
            }
        }


        var left;
        switch (align) {
            case 'left':
                left = -Math.round((p.left - left) * (1 / ratioH));
                break;
            case 'center':
                left = -Math.round((p.left - left - this.$layer.width() / 2) * (1 / ratioH))
                break;
            case 'right':
                left = -Math.round((p.left - left - this.$layer.width()) * (1 / ratioH));
                break;
        }

        return left;
    }


    PlacementAbsolute.prototype.calculatePositionTop = function (valign, top) {
        var ratioV = this.canvasManager.getResponsiveRatio('v');

        if (!parseInt(this.layer.getProperty('responsiveposition'))) {
            ratioV = 1;
        }


        var parent = this.parent,
            p = {
                top: 0,
                topMultiplier: 1
            };
        if (!parent || !parent.is(':visible')) {
            parent = this.$layer.parent();

            switch (valign) {
                case 'middle':
                    p.top += parent.height() / 2;
                    break;
                case 'bottom':
                    p.top += parent.height();
                    break;
            }
        } else {
            var position = parent.position();

            switch (this.layer.getProperty('parentvalign')) {
                case 'bottom':
                    p.top = position.top + parent.height();
                    break;
                case 'middle':
                    p.top = position.top + parent.height() / 2;
                    break;
                default:
                    p.top = position.top;
            }
        }

        var top;
        switch (valign) {
            case 'top':
                top = -Math.round((p.top - top) * (1 / ratioV));
                break;
            case 'middle':
                top = -Math.round((p.top - top - this.$layer.height() / 2) * (1 / ratioV));
                break;
            case 'bottom':
                top = -Math.round((p.top - top - this.$layer.height()) * (1 / ratioV));
                break;
        }

        return top;
    }

    PlacementAbsolute.prototype.moveX = function (x) {

        this._setPosition(null, null, this.layer.getProperty('left') + x, null, null, null, false);
    };

    PlacementAbsolute.prototype.moveY = function (y) {

        this._setPosition(null, null, null, this.layer.getProperty('top') + y, null, null, false);
    };

    PlacementAbsolute.prototype.setPositionLeft = function (left) {

        left = this.calculatePositionLeft(this.layer.getProperty('align'), left);

        this.layer.store('left', left, true);
        this.layer.$.trigger('propertyChanged', ['left', left]);

    }

    PlacementAbsolute.prototype.setPositionTop = function (top) {

        top = this.calculatePositionTop(this.layer.getProperty('valign'), top);

        this.layer.store('top', top, true);
        this.layer.$.trigger('propertyChanged', ['top', top]);
    }

    PlacementAbsolute.prototype.setPosition = function (left, top) {
        this.setPositionLeft(left);
        this.setPositionTop(top);
    }

    PlacementAbsolute.prototype.setDeviceBasedAlign = function () {
        var mode = this.layer.getMode();
        if (typeof this.layer.deviceProperty[mode]['align'] == 'undefined') {
            this.layer.setProperty('align', this.layer.getProperty('align'), 'layer');
        }
        if (typeof this.layer.deviceProperty[mode]['valign'] == 'undefined') {
            this.layer.setProperty('valign', this.layer.getProperty('valign'), 'layer');
        }
    };
    //</editor-fold


    PlacementAbsolute.prototype.setPropertyresponsiveposition =
        PlacementAbsolute.prototype.setPropertyresponsivesize = function (name, value, from) {
            this.layer._setProperty(name, parseInt(value), from);
        }


    PlacementAbsolute.prototype.setPropertywidth =
        PlacementAbsolute.prototype.setPropertyheight = function (name, value, from) {
            var v = value;
            if (!this.layer.isDimensionPropertyAccepted(value)) {
                v = ~~value;
                if (v != value) {
                    this.layer.$.trigger('propertyChanged', [name, v]);
                }
            }
            setTimeout($.proxy(function () {
                this.onResize(false);
            }, this), 50);

            this.layer._setProperty(name, v, from);
        }

    PlacementAbsolute.prototype.setPropertyleft =
        PlacementAbsolute.prototype.setPropertytop = function (name, value, from) {
            var v = ~~value;
            if (v != value) {
                this.layer.$.trigger('propertyChanged', [name, v]);
            }
            this.layer._setProperty(name, v, from);
        }

    PlacementAbsolute.prototype.render = function (name) {
        this['_sync' + name]();
    };

    PlacementAbsolute.prototype.renderWithModifier = function (name, value, modifier) {
        try {
            if ((name == 'width' || name == 'height') && this.layer.isDimensionPropertyAccepted(value)) {
                this['_sync' + name](value);
            } else {
                this['_sync' + name](Math.round(value * modifier));
            }
        } catch (e) {
            console.error('_sync' + name);
        }
    };

    PlacementAbsolute.prototype.onResize = function (isForced) {
        this.resize({
            slideW: this.canvasManager.getResponsiveRatio('h'),
            slideH: this.canvasManager.getResponsiveRatio('v')
        }, isForced);
    };

    PlacementAbsolute.prototype.resize = function (ratios, isForced) {

        if (!this.parent || isForced) {
            //this.doThrottledTheResize(ratios, false);
            this.addToResizeCollection(this, ratios, false);
        }
    };

    PlacementAbsolute.prototype.addToResizeCollection = function (layer, ratios, isThrottled) {
        resizeCollection.ratios = ratios;
        resizeCollection.isThrottled = isThrottled;
        for (var i = 0; i < resizeCollection.layers.length; i++) {
            if (resizeCollection.layers[i] == this) {
                resizeCollection.layers.splice(i, 1);
                break;
            }
        }
        resizeCollection.layers.push(layer);

        requestRender();
        this.triggerLayerResized(isThrottled, ratios);
    };

    PlacementAbsolute.prototype._syncresponsiveposition = function () {
        this.onResize(false);
    };

    PlacementAbsolute.prototype._syncwidth = function () {
        var value = this.layer.getProperty('width');

        if (!this.layer.isDimensionPropertyAccepted(value)) {
            if (parseInt(this.layer.getProperty('responsivesize'))) {
                var ratio = this.canvasManager.getResponsiveRatio('h');
                value = (value * ratio);
            }
            value += 'px';
        }

        this.$layer.css('width', value);
    };

    PlacementAbsolute.prototype._syncheight = function () {
        var value = this.layer.getProperty('height');
        if (!this.layer.isDimensionPropertyAccepted(value)) {
            if (parseInt(this.layer.getProperty('responsivesize'))) {
                var ratio = this.canvasManager.getResponsiveRatio('v');
                value = (value * ratio);
            }
            value += 'px';
        }

        this.$layer.css('height', value);
    };

    PlacementAbsolute.prototype._syncparentalign = function () {
        var value = this.layer.getProperty('parentalign');
        this.$layer.data('parentalign', value);
        var parent = this.getParent();
        if (parent) {
            parent.placement.current.onResize(false);
        }
    };

    PlacementAbsolute.prototype._syncparentvalign = function () {
        var value = this.layer.getProperty('parentvalign');
        this.$layer.data('parentvalign', value);
        var parent = this.getParent();
        if (parent) {
            parent.placement.current.onResize(false);
        }
    };


    PlacementAbsolute.prototype._syncleft = function () {
        var value = this.layer.getProperty('left');

        if (parseInt(this.layer.getProperty('responsiveposition'))) {
            var ratio = this.canvasManager.getResponsiveRatio('h');
            value = (value * ratio);
        }

        if (!this.parent || !this.parentIsVisible) {
            switch (this.layer.getProperty('align')) {
                case 'right':
                    this.$layer.css({
                        left: 'auto',
                        right: -value + 'px'
                    });
                    break;
                case 'center':
                    this.$layer.css({
                        left: (this.$layer.parent().width() / 2 + value - this.$layer.width() / 2) + 'px',
                        right: 'auto'
                    });
                    break;
                default:
                    this.$layer.css({
                        left: value + 'px',
                        right: 'auto'
                    });
            }
        } else {
            var position = this.parent.position(),
                align = this.layer.getProperty('align'),
                parentAlign = this.layer.getProperty('parentalign'),
                left = 0;
            switch (parentAlign) {
                case 'right':
                    left = position.left + this.parent.width();
                    break;
                case 'center':
                    left = position.left + this.parent.width() / 2;
                    break;
                default:
                    left = position.left;
            }

            switch (align) {
                case 'right':
                    this.$layer.css({
                        left: 'auto',
                        right: (this.$layer.parent().width() - left - value) + 'px'
                    });
                    break;
                case 'center':
                    this.$layer.css({
                        left: (left + value - this.$layer.width() / 2) + 'px',
                        right: 'auto'
                    });
                    break;
                default:
                    this.$layer.css({
                        left: (left + value) + 'px',
                        right: 'auto'
                    });
            }

        }

        this.triggerLayerResized();
    };

    PlacementAbsolute.prototype._synctop = function () {
        var value = this.layer.getProperty('top');

        if (parseInt(this.layer.getProperty('responsiveposition'))) {
            var ratio = this.canvasManager.getResponsiveRatio('v');
            value = (value * ratio);
        }

        if (!this.parent || !this.parentIsVisible) {
            switch (this.layer.getProperty('valign')) {
                case 'bottom':
                    this.$layer.css({
                        top: 'auto',
                        bottom: -value + 'px'
                    });
                    break;
                case 'middle':
                    this.$layer.css({
                        top: (this.$layer.parent().height() / 2 + value - this.$layer.height() / 2) + 'px',
                        bottom: 'auto'
                    });
                    break;
                default:
                    this.$layer.css({
                        top: value + 'px',
                        bottom: 'auto'
                    });
            }
        } else {
            var position = this.parent.position(),
                valign = this.layer.getProperty('valign'),
                parentVAlign = this.layer.getProperty('parentvalign'),
                top = 0;
            switch (parentVAlign) {
                case 'bottom':
                    top = position.top + this.parent.height();
                    break;
                case 'middle':
                    top = position.top + this.parent.height() / 2;
                    break;
                default:
                    top = position.top;
            }

            switch (valign) {
                case 'bottom':
                    this.$layer.css({
                        top: 'auto',
                        bottom: (this.$layer.parent().height() - top - value) + 'px'
                    });
                    break;
                case 'middle':
                    this.$layer.css({
                        top: (top + value - this.$layer.height() / 2) + 'px',
                        bottom: 'auto'
                    });
                    break;
                default:
                    this.$layer.css({
                        top: (top + value) + 'px',
                        bottom: 'auto'
                    });
            }
        }

        this.triggerLayerResized();
    };

    PlacementAbsolute.prototype._syncresponsivesize = function () {
        this.onResize(false);
    };

    PlacementAbsolute.prototype.historyStoreDoubleProp = function (data, mode, prop, prop2) {
        var currentMode = this.layer.getMode();
        if (mode == currentMode) {
            this.layer._setProperty(prop, data.value, 'history');
            this.layer._setProperty(prop2, data.value2, 'history');
        } else {
            this.layer.deviceProperty[mode][prop] = data.value;
            this.layer.deviceProperty[mode][prop2] = data.value2;
            this.layer.$.trigger('propertyChanged', [prop, this.layer.getProperty(prop)]);
            this.layer.$.trigger('propertyChanged', [prop2, this.layer.getProperty(prop2)]);
            this.layer.render(prop, null, 'history');
            this.layer.render(prop2, null, 'history');
        }
    }

    PlacementAbsolute.prototype.setPropertyalign = function (name, value, from) {
        var oldValue = this.layer.getProperty(name),
            oldLeft = this.layer.getRawProperty('left');

        smartSlider.history.off();
        this.layer._setProperty(name, value, from);
        smartSlider.history.on();

        var task = smartSlider.history.addValue(this.layer, this.layer.historyStoreOnPlacement, ['historyStoreDoubleProp', this.layer.getMode(), 'align', 'left']);
        if (task) {
            task.setValues({
                value: oldValue,
                value2: oldLeft
            }, {
                value: value,
                value2: this.layer.getRawProperty('left')
            });
        }
    }

    PlacementAbsolute.prototype.setPropertyvalign = function (name, value, from) {
        var oldValue = this.layer.getProperty(name),
            oldTop = this.layer.getRawProperty('top');

        smartSlider.history.off();
        this.layer._setProperty(name, value, from);
        smartSlider.history.on();

        var task = smartSlider.history.addValue(this.layer, this.layer.historyStoreOnPlacement, ['historyStoreDoubleProp', this.layer.getMode(), 'valign', 'top']);
        if (task) {
            task.setValues({
                value: oldValue,
                value2: oldTop
            }, {
                value: value,
                value2: this.layer.getRawProperty('top')
            });
        }
    }

    PlacementAbsolute.prototype._syncalign = function (oldValue, from) {
        var value = this.layer.getProperty('align');
        this.$layer.attr('data-align', value);

        if (from != 'history' && value != oldValue) {
            this.setPositionLeft(this.$layer.position().left);
        }
    };
    PlacementAbsolute.prototype._syncvalign = function (oldValue, from) {
        var value = this.layer.getProperty('valign');
        this.$layer.attr('data-valign', value);

        if (from != 'history' && value != oldValue) {
            this.setPositionTop(this.$layer.position().top);
        }
    };

    PlacementAbsolute.prototype.fit = function () {
        var layer = this.$layer.get(0);

        var position = this.$layer.position();

        if (layer.scrollWidth > 0 && layer.scrollHeight > 0) {
            var resized = false;
            if (this.layer.item) {
                resized = this.layer.item.fitLayer();
            }
            if (!resized) {
                this.layer.setProperty('width', 'auto', 'layer');
                this.layer.setProperty('height', 'auto', 'layer');

                var layerWidth = this.$layer.width();
                if (Math.abs(this.canvasManager.mainContainer.layer.width() - this.$layer.position().left - layerWidth) < 2) {
                    this.layer.setProperty('width', layerWidth, 'layer');
                }
            }
        }
    };

    PlacementAbsolute.prototype.hide = function (targetMode) {
        this.layer.store((targetMode ? targetMode : this.layer.getMode()), 0, true);
    };

    PlacementAbsolute.prototype.show = function (targetMode) {
        this.layer.store((targetMode ? targetMode : this.layer.getMode()), 1, true);
    };


    PlacementAbsolute.prototype.changeStatus = function (oldStatus, newStatus) {

        if (oldStatus == scope.ComponentAbstract.STATUS.LOCKED) {
            this.layer.nextendResizable("enable");
        }


        if (newStatus == scope.ComponentAbstract.STATUS.LOCKED) {
            this.$layer.nextendResizable("disable");
        }
    }

    PlacementAbsolute.prototype.getParent = function () {
        return $('#' + this.layer.getProperty('parentid')).data('layerObject');
    };

    PlacementAbsolute.prototype.subscribeParent = function () {
        var that = this;
        this.subscribeParentCallbacks = {
            LayerResized: function () {
                that.resizeParent.apply(that, arguments);
            },
            LayerParent: function () {
                that.$layer.addClass('n2-ss-layer-parent');
                that.$layer.triggerHandler('LayerParent');
            },
            LayerUnParent: function () {
                that.$layer.removeClass('n2-ss-layer-parent');
                that.$layer.triggerHandler('LayerUnParent');
            },
            LayerDeleted: function (e) {

                that.layer.setProperty('parentid', '', 'layer');
            },
            LayerUnavailable: function (e) {

                that.layer.setProperty('parentid', '', 'layer');
                that.layer.setProperty('left', 0, 'layer');
                that.layer.setProperty('top', 0, 'layer');
            },
            LayerShowChange: function (e, mode, value) {
                if (that.layer.getMode() == mode) {
                    that.parentIsVisible = value;
                }
            },
            'n2-ss-activate': function () {
                that.$layerRow.addClass('n2-parent-active');
            },
            'n2-ss-deactivate': function () {
                that.$layerRow.removeClass('n2-parent-active');
            },
            'LayerGetDataWithChildren': function (e, layers) {
                that.layer.getDataWithChildren(layers);
            }
        };
        this.parent = $('#' + this.layer.property.parentid).on(this.subscribeParentCallbacks);
        this.parent.data('layerObject').placement.current.addChild(this);
        this.$layer.addClass('n2-ss-layer-has-parent');

    };

    PlacementAbsolute.prototype.unSubscribeParent = function (context) {
        this.$layerRow.removeClass('n2-parent-active');
        this.$layer.removeClass('n2-ss-layer-has-parent');
        if (this.parent) {
            this.parent.off(this.subscribeParentCallbacks);
        }
        this.parent = false;
        this.subscribeParentCallbacks = {};
        if (context != 'delete') {
            var position = this.$layer.position();
            this._setPosition(null, null, position.left, position.top, null, null, true);
        }

    };

    PlacementAbsolute.prototype.addChild = function (childPlacement) {
        this.children.push(childPlacement);
    }

    PlacementAbsolute.prototype.removeChild = function (childPlacement) {
        this.children.splice($.inArray(childPlacement, this.children), 1);
    }

    PlacementAbsolute.prototype.unlink = function (e) {
        if (e) e.preventDefault();
        this.layer.setProperty('parentid', '', 'layer');
    };

    PlacementAbsolute.prototype.parentPicked = function (parentObject, parentAlign, parentValign, align, valign) {
        this.layer.setProperty('parentid', '', 'layer');

        this.layer.setProperty('align', align, 'layer');
        this.layer.setProperty('valign', valign, 'layer');
        this.layer.setProperty('parentalign', parentAlign, 'layer');
        this.layer.setProperty('parentvalign', parentValign, 'layer');

        this.layer.setProperty('parentid', parentObject.requestID(), 'layer');

        var undef;
        for (var device in this.layer.deviceProperty) {
            if (device == 'desktopPortrait') continue;
            this.layer.deviceProperty[device].left = undef;
            this.layer.deviceProperty[device].top = undef;
            this.layer.deviceProperty[device].valign = undef;
            this.layer.deviceProperty[device].align = undef;
        }
    };

    PlacementAbsolute.prototype._syncparentid = function () {
        var value = this.layer.getProperty('parentid');
        if (!value || value == '') {
            this.$layer.removeAttr('data-parentid');
            this.unSubscribeParent();
        } else {
            if ($('#' + value).length == 0) {
                this.layer.setProperty('parentid', '', 'layer');
            } else {
                this.$layer.attr('data-parentid', value).addClass('n2-ss-layer-has-parent');
                this.subscribeParent();
                var position = this.$layer.position();
                this._setPosition(null, null, position.left, position.top, null, null, true);
            }
        }
    };

    PlacementAbsolute.prototype.snap = function () {
        this.$layer.nextendResizable("option", "smartguides", $.proxy(function () {
            this.$layer.triggerHandler('LayerParent');
            return this.canvasManager.getSnap();
        }, this));
    };

    PlacementAbsolute.prototype._renderModeProperties = function (isReset) {

        this.$layer.attr('data-align', this.layer.property.align);
        this.$layer.attr('data-valign', this.layer.property.valign);
        if (isReset) {
            this.onResize(true);
        }
    };

    PlacementAbsolute.prototype.doLinearResize = function (ratios) {
        this.doThrottledTheResize(ratios, true);
    };

    PlacementAbsolute.prototype.doTheResize = function (ratios, isLinear, isThrottled) {

        this.render('width');
        this.render('height');

        this.render('left');
        this.render('top');

        if (!isLinear) {
            this.triggerLayerResized(isThrottled, ratios);
        }
    };

    PlacementAbsolute.prototype.resizeParent = function (e, ratios, isThrottled) {
        this.addToResizeCollection(this, ratios, isThrottled);
    };

    PlacementAbsolute.prototype.updatePosition = function () {
        var parent = this.parent;

        if (this.layer.getProperty('align') == 'center') {
            var left = 0;
            if (parent) {
                left = parent.position().left + parent.width() / 2;
            } else {
                left = this.$layer.parent().width() / 2;
            }
            var ratio = this.canvasManager.getResponsiveRatio('h');
            if (!parseInt(this.layer.getProperty('responsiveposition'))) {
                ratio = 1;
            }
            this.$layer.css('left', (left - this.$layer.width() / 2 + this.layer.getProperty('left') * ratio));
        }

        if (this.layer.getProperty('valign') == 'middle') {
            var top = 0;
            if (parent) {
                top = parent.position().top + parent.height() / 2;
            } else {
                top = this.$layer.parent().height() / 2;
            }
            var ratio = this.canvasManager.getResponsiveRatio('v');
            if (!parseInt(this.layer.getProperty('responsiveposition'))) {
                ratio = 1;
            }
            this.$layer.css('top', (top - this.$layer.height() / 2 + this.layer.getProperty('top') * ratio));
        }
        this.triggerLayerResized();
    };

    PlacementAbsolute.prototype.getIndex = function () {
        var index = parseInt(this.$layer.css('zIndex'));
        if (isNaN(index)) {
            index = 0;
        }
        return index;
    }

    PlacementAbsolute.prototype.renderIndex = function (index) {
        //this.layer.layer.css('zIndex', index + 1);
    }

    PlacementAbsolute.prototype.sync = function () {

        this._syncalign(null, 'history');
        this._syncvalign(null, 'history');

        this._syncwidth();
        this._syncheight();
        this._synctop();
        this._syncleft();

        this._syncparentid();

    }

    PlacementAbsolute.prototype.delete = function () {

        var parentId = this.layer.getProperty('parentid');
        if (parentId) {
            this.unSubscribeParent('delete');
        }
    }

    PlacementAbsolute.prototype.isParentOrChild = function () {
        return this.parent || this.children.length > 0;
    }

    return PlacementAbsolute;
});
N2Require('PlacementContent', ['PlacementAbstract'], [], function ($, scope, undefined) {
    "use strict";

    /**
     *
     * @alias scope.PlacementContent
     * @param placement
     * @param layer
     * @param canvasManager
     * @constructor
     */
    function PlacementContent(placement, layer, canvasManager) {
        this.type = 'content';

        scope.PlacementAbstract.prototype.constructor.apply(this, arguments);
    }

    PlacementContent.prototype = Object.create(scope.PlacementAbstract.prototype);
    PlacementContent.prototype.constructor = PlacementContent;

    return PlacementContent;
});
N2Require('PlacementDefault', ['PlacementAbstract'], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    /**
     *
     * @alias scope.PlacementDefault
     * @param placement
     * @param layer
     * @param canvasManager
     * @constructor
     */
    function PlacementDefault(placement, layer, canvasManager) {
        this.type = 'default';

        scope.PlacementAbstract.prototype.constructor.apply(this, arguments);
    }

    PlacementDefault.prototype = Object.create(scope.PlacementAbstract.prototype);
    PlacementDefault.prototype.constructor = PlacementDefault;

    PlacementDefault.prototype.start = function () {
        this.$layer = this.layer.layer;
    }


    PlacementDefault.prototype.activated = function (properties) {

        this.startUISizing();
    }

    PlacementDefault.prototype.deActivated = function (newMode) {
        this.$layer.nextendNormalSizing('destroy');
    }

    PlacementDefault.prototype.startUISizing = function () {
        var needSize = false;
        if (this.layer.item && this.layer.item.needSize) {
            needSize = true;
        }
        this.$layer.nextendNormalSizing({
            start: $.proxy(function (e, prop) {
                smartSlider.positionDisplay.show('NormalSizing');
                if (prop == 'maxwidth') {
                    this.layer.layer.addClass('n2-ss-has-maxwidth');
                }
            }, this),
            resizeMaxWidth: $.proxy(function (e, ui) {

                smartSlider.positionDisplay.update(e, 'NormalSizing', 'Max-width: ' + (ui.value == 0 ? 'none' : (ui.value + 'px')));

            }, this),
            stopMaxWidth: $.proxy(function (e, ui) {
                smartSlider.positionDisplay.hide('NormalSizing');
                this.layer.setProperty('maxwidth', ui.value);
            }, this)
        });
    }

    return PlacementDefault;
});
N2Require('PlacementNormal', ['PlacementAbstract'], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    /**
     *
     * @alias scope.PlacementNormal
     * @param placement
     * @param layer
     * @param canvasManager
     * @constructor
     */
    function PlacementNormal(placement, layer, canvasManager) {
        this.type = 'normal';

        this.transferredProperties = {};

        scope.PlacementAbstract.prototype.constructor.apply(this, arguments);
    }

    PlacementNormal.prototype = Object.create(scope.PlacementAbstract.prototype);
    PlacementNormal.prototype.constructor = PlacementNormal;

    PlacementNormal.prototype.start = function () {
        this.$layer = this.layer.layer;
    }

    PlacementNormal.prototype.preActivation = function (lastPlacement) {
        if (lastPlacement.type == 'absolute' && this.layer.item && this.layer.item.needSize) {
            var height = this.layer.getProperty('height');
            if (height.match && height.match(/[0-9]+%$/)) {
                this.transferredProperties.height = Math.max(100, parseInt(this.$layer.parent().height() * parseInt(height) / 100));
            } else if (height > 0) {
                this.transferredProperties.height = height;
            }
        }
    }

    PlacementNormal.prototype.activated = function (properties) {
        this.loadProperties($.extend(properties, this.transferredProperties));
        this.transferredProperties = {};

        this.layer.$.on('baseSizeUpdated.placementnormal', $.proxy(this._syncmargin, this));
        this.layer.$.on('baseSizeUpdated.placementnormal', $.proxy(this._syncheight, this));

        this.startUISpacing();

        this.startUISizing();

        this.$layer.on({
            mousedown: $.proxy(function (e) {
                e.stopPropagation();
            })
        });
    }

    PlacementNormal.prototype.loadProperties = function (options) {
        this.layer.createDeviceProperty('margin', {desktopPortrait: '0|*|0|*|0|*|0|*|px+'}, this.layer.layer, this);
        this.layer.createDeviceProperty('height', {desktopPortrait: (options.height || 0)}, this.layer.layer, this);
        this.layer.createDeviceProperty('maxwidth', {desktopPortrait: 0}, this.layer.layer, this);
        this.layer.createDeviceProperty('selfalign', {desktopPortrait: 'inherit'}, this.layer.layer, this);
    }

    PlacementNormal.prototype.deActivated = function (newMode) {
        this.layer.$.off('.placementnormal');
        this.$layer.nextendSpacing('destroy');
        this.$layer.nextendNormalSizing('destroy');

        this.layer.layer.removeClass('n2-ss-has-maxwidth');
        this.layer.layer.removeAttr('data-cssselfalign');

        var historicalData = this.layer.getPropertiesData(['margin', 'height']);
        this.layer.removeProperty('margin');
        this.layer.removeProperty('height');
        this.layer.removeProperty('maxwidth');
        this.layer.removeProperty('selfalign');


        this.layer.layer.css({
            position: '',
            margin: '',
            height: '',
            maxWidth: ''
        });
        return historicalData;
    }

    PlacementNormal.prototype._renderModeProperties = function (isReset) {

        this._syncmargin();
        this._syncheight();
        this._syncmaxwidth();
        this._syncselfalign();
    }

    PlacementNormal.prototype._syncmargin = function () {
        var margin = this.layer.getProperty('margin').split('|*|'),
            unit = margin.pop(),
            baseSize = this.layer.baseSize;

        if (unit == 'px+' && baseSize > 0) {
            unit = 'em';
            for (var i = 0; i < margin.length; i++) {
                margin[i] = parseInt(margin[i]) / baseSize;
            }
        }

        var margin = margin.join(unit + ' ') + unit;
        this.layer.layer.css('margin', margin);
        this.layer.update();

        this.$layer.nextendSpacing('option', 'current', margin);
    };

    PlacementNormal.prototype.startUISpacing = function () {
        this.$layer.nextendSpacing({
            mode: 'margin',
            sync: {
                n: 'margin-top',
                e: 'margin-right',
                s: 'margin-bottom',
                w: 'margin-left',
            },
            handles: 'n, s, e, w',
            start: $.proxy(function (e, ui) {
                smartSlider.positionDisplay.show('Spacing');
            }, this),
            spacing: $.proxy(function (e, ui) {
                var html = '';
                for (var k in ui.changed) {
                    html += 'Margin ' + k + ': ' + ui.changed[k] + 'px<br>';
                }

                smartSlider.positionDisplay.update(e, 'Spacing', html);
            }, this),
            stop: $.proxy(this.onSpacingStop, this),
        });
    };

    PlacementNormal.prototype.onSpacingStop = function (event, ui) {
        smartSlider.positionDisplay.hide('Spacing');
        var margin = this.layer.getProperty('margin').split('|*|'),
            ratioH = 1,
            ratioV = 1;
        if (margin[margin.length - 1] == 'px+' && Math.abs(parseFloat(this.$layer.css('fontSize')) - this.layer.baseSize) > 1) {
            ratioH = this.canvasManager.getResponsiveRatio('h');
            ratioV = this.canvasManager.getResponsiveRatio('v');
        }

        for (var k in ui.changed) {
            var value = ui.changed[k];
            switch (k) {
                case 'top':
                    margin[0] = Math.round(value / ratioV);
                    break;
                case 'right':
                    margin[1] = Math.round(value / ratioH);
                    break;
                case 'bottom':
                    margin[2] = Math.round(value / ratioV);
                    break;
                case 'left':
                    margin[3] = Math.round(value / ratioH);
                    break;
            }
        }
        this.layer.setProperty('margin', margin.join('|*|'));
        $('#layernormal-margin').data('field').insideChange(margin.join('|*|'));
    };

    PlacementNormal.prototype.startUISizing = function () {
        var needSize = false;
        if (this.layer.item && this.layer.item.needSize) {
            needSize = true;
        }
        this.$layer.nextendNormalSizing({
            height: needSize,
            syncWidth: true,
            start: $.proxy(function (e, prop) {
                smartSlider.positionDisplay.show('NormalSizing');
                if (prop == 'maxwidth') {
                    this.layer.layer.addClass('n2-ss-has-maxwidth');
                }
            }, this),
            resizeMaxWidth: $.proxy(function (e, ui) {
                smartSlider.positionDisplay.update(e, 'NormalSizing', 'Max-width: ' + (ui.value == 0 ? 'none' : (ui.value + 'px')));

            }, this),
            stopMaxWidth: $.proxy(function (e, ui) {
                smartSlider.positionDisplay.hide('NormalSizing');
                this.layer.setProperty('maxwidth', ui.value);
            }, this),
            resizeHeight: $.proxy(function (e, ui) {
                smartSlider.positionDisplay.update(e, 'NormalSizing', 'Height: ' + ui.value + 'px');

            }, this),
            stopHeight: $.proxy(function (e, ui) {
                smartSlider.positionDisplay.hide('NormalSizing');
                var ratio = 1;
                if (parseInt(this.$layer.css('fontSize')) != this.layer.baseSize) {
                    ratio = this.canvasManager.getResponsiveRatio('h');
                }
                var value = Math.round(value / ratio);

                this.layer.setProperty('height', ui.value);
            }, this)
        });
    }

    PlacementNormal.prototype._syncheight = function () {
        var height = parseInt(this.layer.getProperty('height'));

        if (height > 0) {
            var unit = 'px',
                baseSize = this.layer.baseSize;
            if (baseSize > 0) {
                unit = 'em';
                height = parseInt(height) / baseSize;
            }

            this.layer.layer.css('height', height + unit);
        } else {

            this.layer.layer.css('height', '');
        }

        this.layer.update();
    };

    PlacementNormal.prototype._syncmaxwidth = function () {
        var value = parseInt(this.layer.getProperty('maxwidth'));
        if (value <= 0 || isNaN(value)) {
            this.layer.layer.css('maxWidth', '')
                .removeClass('n2-ss-has-maxwidth');
        } else {
            this.layer.layer.css('maxWidth', value + 'px')
                .addClass('n2-ss-has-maxwidth');
        }

        this.layer.update();
    };

    PlacementNormal.prototype._syncselfalign = function () {
        this.layer.layer.attr('data-cssselfalign', this.layer.getProperty('selfalign'));
    }

    PlacementNormal.prototype.sync = function () {
        this._syncmargin();
        this._syncheight();
        this._syncmaxwidth();
    }

    return PlacementNormal;
});
N2Require('Placement', [], [], function ($, scope, undefined) {
    "use strict";

    /**
     * @alias scope.Placement
     * @param layer
     * @constructor
     */
    function Placement(layer) {
        this.layer = layer;
        this.canvasManager = layer.canvasManager;
        this.modes = {};
        this.current = null;
        this.isTransferHandled = false;

        this.updatePositionThrottled = NextendDeBounce(this.updatePosition, 200);
    }

    Placement.prototype.allow = function (mode) {
        switch (mode) {
            case 'absolute':
                this.modes.absolute = new scope.PlacementAbsolute(this, this.layer, this.canvasManager);
                break;
            case 'normal':
                this.modes.normal = new scope.PlacementNormal(this, this.layer, this.canvasManager);
                break;
            case 'group':
                this.modes.absolute = new scope.PlacementGroup(this, this.layer, this.canvasManager);
                break;
            case 'content':
                this.modes.absolute = new scope.PlacementContent(this, this.layer, this.canvasManager);
                break;
            case 'default':
                this.modes['default'] = new scope.PlacementDefault(this, this.layer, this.canvasManager);
                break;
        }
    }

    Placement.prototype.start = function () {
        for (var k in this.modes) {
            this.modes[k].start();
        }
    }

    Placement.prototype.setMode = function (mode, properties) {
        var historicalData = false;
        properties = properties || {};
        if (typeof this.modes[mode] !== 'undefined') {
            if (this.current != this.modes[mode]) {
                var lastType;
                if (this.current) {

                    this.modes[mode].preActivation(this.current);
                    lastType = this.current.type;
                    historicalData = this.current.deActivated(this.modes[mode]);
                }
                this.current = this.modes[mode];

                this.layer.layer.attr('data-pm', this.current.type);
                this.current.activated(properties);

                this.layer.$.triggerHandler('placementChanged', [this.current.type, lastType]);
            }
        } else {
            throw new Exception('Layer placement(' + mode + ') not allowed for the container', this.layer);
        }
        return historicalData;
    }

    Placement.prototype.doAction = function (action) {
        try {
            return this.current[action].apply(this.current, Array.prototype.slice.call(arguments, 1));
        } catch (e) {

        }
    }

    Placement.prototype.getType = function () {
        return this.current.type;
    }

    Placement.prototype.onResize = function (isForced) {
        if (typeof this.current.onResize == 'function') {
            this.current.onResize(isForced);
        }
    }

    Placement.prototype.updatePosition = function () {
        this.current.updatePosition();
    }

    Placement.prototype.getIndex = function () {
        return this.current.getIndex();
    }

    Placement.prototype.renderIndex = function (index) {
        return this.current.renderIndex(index);
    }

    Placement.prototype.doLinearResize = function (ratios) {
        this.current.doLinearResize(ratios);
    }

    Placement.prototype.sync = function () {
        this.current.sync();
    }

    Placement.prototype.renderModeProperties = function (isReset) {

        var fontSize = this.layer.getProperty('fontsize');
        this.layer.adjustFontSize(this.layer.getProperty('adaptivefont'), fontSize, false);

        this.current._renderModeProperties(isReset);
    }

    Placement.prototype.delete = function () {
        this.current.delete();
    }

    return Placement;
});
N2Require('PlacementAbstract', ['Placement'], [], function ($, scope, undefined) {
    "use strict";

    /**
     * @alias scope.PlacementAbstract
     * @param placement
     * @param {ComponentAbstract} layer
     * @param canvasManager
     * @constructor
     */
    function PlacementAbstract(placement, layer, canvasManager) {
        this.placement = placement;
        /**
         * @type {ComponentAbstract}
         */
        this.layer = layer;
        this.canvasManager = canvasManager;
    }

    PlacementAbstract.prototype.start = function () {

    }

    PlacementAbstract.prototype.preActivation = function (lastPlacement) {

    }

    PlacementAbstract.prototype.activated = function () {

    }

    PlacementAbstract.prototype.deActivated = function (newMode) {

        return false;
    }

    PlacementAbstract.prototype.updatePosition = function () {
        this.layer.group.update();
    }

    PlacementAbstract.prototype._renderModeProperties = function (isReset) {

    }

    PlacementAbstract.prototype._hide = function () {
    };

    PlacementAbstract.prototype._show = function () {
    }

    PlacementAbstract.prototype.snap = function () {
        return false;
    }

    PlacementAbstract.prototype.getIndex = function () {
        return this.layer.layer.index();
    }

    PlacementAbstract.prototype.renderIndex = function (index) {

    }

    PlacementAbstract.prototype.doLinearResize = function (ratios) {
    };

    PlacementAbstract.prototype.sync = function () {

    }

    PlacementAbstract.prototype.delete = function () {
    }


    PlacementAbstract.prototype.triggerLayerResized = function (isThrottled, ratios) {

    }

    PlacementAbstract.prototype.changeStatus = function (oldStatus, newStatus) {

    }

    return PlacementAbstract;
});
N2Require('Item', [], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";


    function Item($item, layer, itemEditor) {

        if (this.type === undefined) {
            this.type = $item.data('item');
        }

        this.needSize = this.needSize || false;

        this.self = this;
        this.$item = $item;
        this.layer = layer;
        this.itemEditor = itemEditor;

        this.fonts = [];
        this.styles = [];

        this.needFill = [];

        this.values = this.$item.data('itemvalues');
        if (typeof this.values !== 'object') {
            this.values = $.parseJSON(this.values);
        }

        this.pre = 'div#' + nextend.smartSlider.frontend.sliderElement.attr('id') + ' ';
        this.defaultValues = itemEditor.getItemForm(this.type).values;

        this.added();

        this.$item.data('item', this);

        this.$item.appendTo(this.layer.getContent());

        this.layer.item = this;

        if (this.$item.children().length === 0) {
            // It's create, so render the item
            this.layer.readyDeferred.done($.proxy(this.reRender, this));
        }


        $('<div/>')
            .addClass('ui-helper ui-item-overlay')
            .css('zIndex', 89)
            .appendTo(this.$item);

        this.$item.find('a').on('click', function (e) {
            e.preventDefault();
        });


        $(window).trigger('ItemCreated');
    };

    Item.prototype.setSelf = function (self) {
        if (this.self != this) {
            this.self.setSelf(self);
        }
        this.self = self;
    }

    Item.prototype.getSelf = function () {
        if (this.self != this) {
            this.self = this.self.getSelf();
        }
        return this.self;
    }

    Item.prototype.changeValue = function (property, value) {
        if (this == this.itemEditor.activeItem) {
            $('#item_' + this.type + property).data('field')
                .insideChange(value);
        } else {
            this.values[property] = value;
        }
    };

    Item.prototype.activate = function (e, context, force) {
        if (this.itemEditor.setActiveItem(this, context, force)) {
            nextend.basicCSS.activate('ss3item' + this.type, this.values, {
                font: this.fonts,
                style: this.styles
            });
            this.itemEditor.lastValues[this.type] = this.values;
        }
    };

    Item.prototype.deActivate = function () {
        nextend.basicCSS.deActivate();
    };

    Item.prototype.render = function (data, originalData) {
        this.layer.layer.triggerHandler('itemRender');
        this.$item.html('')

        this.parseAll(data);
        this._render(data);

        // These will be available on the backend render
        this.itemEditor.lastValues[this.type] = this.values = originalData;

        $('<div/>')
            .addClass('ui-helper ui-item-overlay')
            .css('zIndex', 89)
            .appendTo(this.$item);

        var layerName = this.getName(data);
        if (layerName === false || layerName == '' || layerName == 'Layer') {
            layerName = this.type;
        } else {
            layerName = layerName.replace(/[<>]/gi, '');
        }
        this.layer.rename(layerName, false);

        this.layer.update();

        this.$item.find('a').on('click', function (e) {
            e.preventDefault();
        });
    };

    Item.prototype._render = function (data) {
    };

    Item.prototype.reRender = function (newData) {

        this.values = $.extend({}, this.getDefault(), this.values, newData);

        this.render($.extend({}, this.values), this.values);
    };

    Item.prototype.delete = function () {
        this.$item.trigger('mouseleave');
        this.$item.remove();

        if (this.itemEditor.activeItem == this) {
            this.itemEditor.activeItem = null;
        }
    };

    Item.prototype.getHTML = function (base64) {
        var item = '';
        if (base64) {

            item = '[' + this.type + ' values="' + Base64.encode(JSON.stringify(this.values)) + '"]';
        } else {
            item = $('<div class="n2-ss-item n2-ss-item-' + this.type + '"></div>')
                .attr('data-item', this.type)
                .attr('data-itemvalues', JSON.stringify(this.values));
        }
        return item;
    };

    Item.prototype.getData = function () {
        return {
            type: this.type,
            values: this.values
        };
    };


    Item.prototype.getDefault = function () {
        return {};
    };

    Item.prototype.added = function () {

    };

    Item.prototype.addedFont = function (mode, name) {
        var $input = $('#item_' + this.type + name);
        if ($input.length) {
            this.fonts.push({
                mode: mode,
                name: name,
                field: $input.data('field'),
                def: this.defaultValues[name]
            });
            $.when(nextend.fontManager.addVisualUsage(mode, this.values[name], this.pre))
                .done($.proxy(function (existsFont) {
                    if (!existsFont) {
                        this.changeValue(name, '');
                    }
                }, this));
        }
    };

    Item.prototype.addedStyle = function (mode, name) {
        var $input = $('#item_' + this.type + name);
        if ($input.length) {
            this.styles.push({
                mode: mode,
                name: name,
                field: $input.data('field'),
                def: this.defaultValues[name]
            });

            $.when(nextend.styleManager.addVisualUsage(mode, this.values[name], this.pre))
                .done($.proxy(function (existsStyle) {
                    if (!existsStyle) {
                        this.changeValue(name, '');
                    }
                }, this));
        }

    };

    Item.prototype.parseAll = function (data) {

        for (var i = 0; i < this.fonts.length; i++) {
            data[this.fonts[i].name + 'class'] = nextend.fontManager.getClass(data[this.fonts[i].name], this.fonts[i].mode) + ' ';
        }

        for (var i = 0; i < this.styles.length; i++) {
            data[this.styles[i].name + 'class'] = nextend.styleManager.getClass(data[this.styles[i].name], this.styles[i].mode) + ' ';
        }

        for (var i = 0; i < this.needFill.length; i++) {
            if (typeof data[this.needFill[i]] !== 'undefined') {
                data[this.needFill[i]] = nextend.smartSlider.generator.fill(data[this.needFill[i]] + '');
            }
        }
    };

    Item.prototype.getName = function (data) {
        return 'Layer';
    };

    Item.prototype.resizeLayerToImage = function (image) {
        var layer = this.layer;
        $("<img/>")
            .attr("src", image)
            .load(function () {
                var slideSize = smartSlider.frontend.dimensions.slide;
                var width = this.width,
                    height = this.height,
                    maxWidth = slideSize.width,
                    maxHeight = slideSize.height;

                if (width > 0 && height > 0) {

                    if (width > maxWidth) {
                        height = height * maxWidth / width;
                        width = maxWidth;
                    }
                    if (height > maxHeight) {
                        width = width * maxHeight / height;
                        height = maxHeight;
                    }
                    nextend.smartSlider.history.off();
                    layer.setProperty('width', width);
                    layer.setProperty('height', height);
                    nextend.smartSlider.history.on();
                }
            });
    };

    Item.prototype.fitLayer = function (item) {
        return false;
    };

    return Item;
});
N2Require('ItemManager', [], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    function ItemManager(canvasManager, options) {
        this.suppressChange = false;

        this.activeItemOriginalData = null;

        this.canvasManager = canvasManager;

        this.lastValues = {};

        this.startItems();

        this.forms = {};
        this.activeForm = false;

        if (!options.isUploadDisabled) {
            smartSlider.frontend.sliderElement.fileupload({
                url: options.uploadUrl,
                pasteZone: false,
                dropZone: smartSlider.frontend.sliderElement,
                dataType: 'json',
                paramName: 'image',
                add: function (e, data) {
                    data.formData = {path: '/' + options.uploadDir};
                    data.submit();
                },
                done: $.proxy(function (e, data) {
                    var response = data.result;
                    if (response.data && response.data.name) {
                        var item = this.createLayerItem(false, {item: 'image'});
                        item.reRender({
                            image: response.data.url
                        });
                        item.activate(null, null, true);
                    } else {
                        NextendAjaxHelper.notification(response);
                    }

                }, this),
                fail: function (e, data) {
                    NextendAjaxHelper.notification(data.jqXHR.responseJSON);
                },

                start: function () {
                    NextendAjaxHelper.startLoading();
                },

                stop: function () {
                    setTimeout(function () {
                        NextendAjaxHelper.stopLoading();
                    }, 100);
                }
            });
        }
    }

    ItemManager.prototype.setActiveItem = function (item, context, force) {
        // Must be called through scope.Item.activate();
        if (item != this.activeItem || force) {
            this.activeItemOriginalData = null;

            var type = item.type;

            if (this.activeForm) {
                this.activeForm.form.css('display', 'none');
            }

            if (this.activeItem) {
                this.activeItem.deActivate();
            }

            this.activeForm = this.getItemForm(type);

            var values = $.extend({}, this.activeForm.values, item.values);

            this.activeItem = item;

            this.suppressChange = true;

            for (var key in values) {
                var field = $('#item_' + type + key).data('field');
                if (field) {
                    field.insideChange(values[key]);
                }
            }

            this.suppressChange = false;

            this.activeForm.form.css('display', 'block');
            this.focusFirst(context);
            return true;
        }
        //this.focusFirst(context);
        return false;
    };

    ItemManager.prototype.focusFirst = function (context) {
        var field = this.activeForm.fields.eq(0).data('field');
        if (nextend.smartSlider.generator.isDynamicSlide() && field.connectedField && field.connectedField instanceof N2Classes.FormElementImage) {

        } else {
            this.activeForm.fields.eq(0).data('field').focus(typeof context !== 'undefined' && context);
        }
    }

    ItemManager.prototype.startItems = function () {

        $('.n2-ss-core-item').nextendCanvasItem({
            canvasUIManager: this.canvasManager.mainContainer.canvasUIManager,
            distance: 5,
            $layer: function () {
                return this.element.clone();
            },
            onCreate: $.proxy(function (e, itemOptions, targetContainer, targetIndex) {
                switch (targetContainer.layer.type) {
                    case 'content':
                    case 'col':
                        smartSlider.history.startBatch();
                        var item = this.createLayerItem(targetContainer.layer, itemOptions.$layer.data(), 'click');
                        smartSlider.history.addControl('skipForwardUndos');

                        targetContainer.layer.container.insertLayerAt(item.layer, targetIndex);
                        item.layer.changeGroup(false, targetContainer.layer);

                        smartSlider.history.endBatch();

                        break;

                    case 'row':
                        var col = targetContainer.layer.createCol();
                        targetContainer.layer.moveCol(col.getIndex(), targetIndex);

                        smartSlider.history.startBatch();
                        var item = this.createLayerItem(col, itemOptions.$layer.data(), 'click');
                        smartSlider.history.addControl('skipForwardUndos');

                        col.container.insertLayerAt(item.layer, 0);
                        item.layer.changeGroup(false, col);

                        smartSlider.history.endBatch();

                        break;
                    default:
                        var sliderOffset = nextend.smartSlider.$currentSlideElement.offset(),
                            item = this.createLayerItem(this.canvasManager.mainContainer, itemOptions.$layer.data(), 'click');
                        item.layer.placement.current.setPosition(e.pageX - sliderOffset.left - 20, e.pageY - sliderOffset.top - 20);

                        break;
                }
            }, this),
            start: function () {
                $('#n2-ss-add-sidebar').removeClass('n2-active');
            }
        }).on('click', $.proxy(function (e) {
            this.createLayerItem(this.canvasManager.mainContainer.getActiveGroup(), $(e.currentTarget).data(), 'click');
        }, this));


        $('[data-itemshortcut]').on({
            click: $.proxy(function (e) {
                e.preventDefault();
                $('.n2-ss-core-item[data-item="' + $(e.currentTarget).data('itemshortcut') + '"]').trigger('click');
            }, this),
            mousedown: $.proxy(function (e) {
                $('.n2-ss-core-item[data-item="' + $(e.currentTarget).data('itemshortcut') + '"]').trigger(e);
            }, this)
        });

        $('[data-structureshortcut]').on({
            click: $.proxy(function (e) {
                e.preventDefault();
                $('.n2-ss-add-layer-button').trigger('click');
                $('#n2-ss-layers-switcher > .n2-labels .n2-td').eq(1).trigger('click');
            }, this),
            mousedown: $.proxy(function (e) {
                $('.n2-ss-core-item[data-type="' + $(e.currentTarget).data('structureshortcut') + '"]').trigger(e);
            }, this)
        });
    };

    ItemManager.prototype.createLayerItem = function (group, data, interaction, props) {
        group = group || this.canvasManager.mainContainer.getActiveGroup();
        var type = data.item;
        if (type == 'structure') {
            var layer = new scope.Row(this.canvasManager, group, {});
            layer.create(data.type);
            layer.hightlightStructure();

            return {
                layer: layer
            };
        } else {

            var itemData = this.getItemForm(type),
                $item = $('<div></div>').attr('data-item', type)
                    .data('itemvalues', $.extend(true, {}, itemData.values, this.getLastValues(type)))
                    .addClass('n2-ss-item n2-ss-item-' + type),
                layer = this._createLayer($item, group, $.extend($('.n2-ss-core-item-' + type).data('layerproperties'), props));

            if (interaction && interaction == "click") {
                setTimeout(function () {
                    layer.layer.trigger('mousedown', ['create']).trigger('mouseup', ['create']).trigger('click', ['create']);
                }, 500);
            } else {
                layer.activate();
            }

            smartSlider.layerWindow.switchTab('item');

            smartSlider.history.addSimple(this, this.historyDelete, this.historyCreate, [group, layer, data]);

            return layer.item;
        }
    };

    ItemManager.prototype.getLastValues = function (type) {
        if (this.lastValues[type] !== undefined) {
            return this.lastValues[type];
        }
        return {};
    }

    ItemManager.prototype.getItemClass = function (type) {
        var itemClass = 'Item' + type.capitalize();
        if (typeof scope[itemClass] === 'undefined') {
            return 'Item';
        }
        return itemClass;
    }

    ItemManager.prototype._createLayer = function ($item, group, properties) {
        var defaultAlign = this.canvasManager.layerOptions.layerFeatures.layerDefault;
        for (var k in defaultAlign) {
            if (defaultAlign[k] !== null) {
                properties[k] = defaultAlign[k];
            }
        }

        var newLayer = new scope.Layer(this.canvasManager, group, properties);

        newLayer.create(function (layer) {
            return layer._createLayer()
                .append($item);
        });

        return newLayer;
    };

    /**
     * Initialize an item type and subscribe the field changes on that type.
     * We use event normalization to prevent rendering.
     * @param type
     * @private
     */
    ItemManager.prototype.getItemForm = function (type) {
        if (this.forms[type] === undefined) {
            var form = $('#smartslider-slide-toolbox-item-type-' + type),
                formData = {
                    form: form,
                    values: form.data('itemvalues'),
                    fields: form.find('[name^="item_' + type + '"]'),
                    fieldNameRegexp: new RegExp('item_' + type + "\\[(.*?)\\]", "")
                };
            formData.fields.on({
                nextendChange: $.proxy(this.updateCurrentItem, this),
                keydown: $.proxy(this.updateCurrentItemDeBounced, this)
            });

            this.forms[type] = formData;
        }
        return this.forms[type];
    };

    /**
     * This function renders the current item with the current values of the related form field.
     */
    ItemManager.prototype.updateCurrentItem = function (e) {
        if (!this.suppressChange) {
            if (this.activeItemOriginalData === null) {
                this.activeItemOriginalData = $.extend({}, this.activeItem.values);
            }
            var data = {},
                originalData = {};
            // Get the current values of the fields
            // Run through the related item filter
            this.activeForm.fields.each($.proxy(function (i, field) {
                var field = $(field),
                    name = field.attr('name').match(this.activeForm.fieldNameRegexp)[1];

                originalData[name] = data[name] = field.val();

            }, this));

            if (e && e.type == 'nextendChange') {
                var task = smartSlider.history.addValue(this, this.historyUpdateCurrentItem, [this.activeItem]);
                if (task) {
                    task.setValues(this.activeItemOriginalData, $.extend({}, originalData));
                }

                this.activeItemOriginalData = null;
            }

            this.activeItem.render($.extend({}, this.activeItem.getDefault(), data), originalData);
        }
    };

    ItemManager.prototype.historyUpdateCurrentItem = function (values, historyActiveItem) {
        var maybeOldActiveItem = historyActiveItem.getSelf();
        maybeOldActiveItem.reRender($.extend(true, {}, values));
        maybeOldActiveItem.values = values;
        if (this.activeItem == maybeOldActiveItem) {
            maybeOldActiveItem.activate(null, null, true);
        }
    }

    ItemManager.prototype.updateCurrentItemDeBounced = NextendDeBounce(function (e) {
        this.updateCurrentItem(e);
    }, 100);

    ItemManager.prototype.historyDelete = function (historyGroup, historyLayer) {
        historyLayer.getSelf().delete();
    }

    ItemManager.prototype.historyCreate = function (historyGroup, historyLayer, data) {
        var item = this.createLayerItem(historyGroup.getSelf(), data);
        historyLayer.setSelf(item.layer);
    }

    ItemManager.prototype.historyCreateStructure = function (historyGroup, historyLayer, data) {
        var obj = this.createLayerItem(historyGroup.getSelf(), data);
        historyLayer.setSelf(obj.layer);
    }

    ItemManager.prototype.getSelf = function () {
        return this;
    }

    return ItemManager;
});
N2Require('PluginActivatable', [], [], function ($, scope, undefined) {
    "use strict";

    function PluginActivatable() {
        this.isActive = false;
        this.preventActivation = false;
    }

    PluginActivatable.prototype.activate = function (e, context, preventExitFromSelection) {
        if (this.preventActivation) return false;
        if (document.activeElement) {
            document.activeElement.blur();
        }
        if (e && (e.ctrlKey || e.metaKey) && this.canvasManager.mainContainer.getSelectedLayer()) {
            return !this.select();
        } else {
            if (e && e.which == 3 && this.canvasManager.selectMode) {
                return false;
            }

            if (!preventExitFromSelection) {
                this.canvasManager.exitSelectMode();
            }
        }

        if (e) {
            this.positionSidebar();
        }


        // Set the layer active if it is not active currently
        if (this.canvasManager.mainContainer.getSelectedLayer() !== this) {
            this.layerRow.addClass('n2-active');
            this.layer.addClass('n2-active');
            this.layer.triggerHandler('n2-ss-activate');
            this.canvasManager.changeActiveLayer(this, preventExitFromSelection);
            nextend.activeLayer = this.layer;


            this.canvasManager.ui.onActivateLayer(this);
        }
        this.isActive = true;
        return true;
    };

    PluginActivatable.prototype.deActivate = function () {
        this.isActive = false;
        if (this.layer === undefined) {
            console.error();
        }
        this.layer.removeClass('n2-active');
        this.layerRow.removeClass('n2-active');
        this.layer.triggerHandler('n2-ss-deactivate');
    };

    return PluginActivatable;
});
N2Require('PluginEditableName', [], [], function ($, scope, undefined) {
    "use strict";
    var dblClickInterval = 300,
        timeout = null;

    function PluginEditableName() {
    }

    PluginEditableName.prototype.addProperties = function ($layer) {
        this.createProperty('name', this.label, $layer);
        this.createProperty('nameSynced', 1, $layer);
    }

    PluginEditableName.prototype.makeNameEditable = function () {
        this.layerTitleSpan.on({
            mouseup: $.proxy(function (e) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                    this.editName();
                } else {
                    this.activate(e);
                    timeout = setTimeout($.proxy(function () {
                        timeout = null;
                    }, this), dblClickInterval);
                }
            }, this)
        })
    }

    PluginEditableName.prototype.editName = function () {
        var input = new scope.InlineField();

        input.$input.on({
            valueChanged: $.proxy(function (e, newName) {
                this.rename(newName, true);
                this.layerTitleSpan.css('display', 'inline');
            }, this),
            cancel: $.proxy(function () {
                this.layerTitleSpan.css('display', 'inline');
            }, this)
        });

        this.layerTitleSpan.css('display', 'none');
        input.injectNode(this.layerTitle, this.property.name);

    };

    PluginEditableName.prototype.rename = function (newName, force) {

        if (this.property.nameSynced || force) {

            if (force) {
                this.property.nameSynced = 0;
            }

            if (newName == '') {
                if (force) {
                    this.property.nameSynced = 1;
                    this.item.reRender();
                    return false;
                }
                newName = 'Layer #' + (this.group.getLayerCount() + 1);
            }
            newName = newName.substr(0, 35);
            if (this.property.name != newName) {
                this.property.name = newName;
                this.layerTitleSpan.html(newName);

                this.$.trigger('layerRenamed', newName);
            }
        }
    };

    return PluginEditableName;
});
N2Require('PluginShowOn', [], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    function PluginShowOn() {

    }

    PluginShowOn.prototype.addProperties = function ($layer) {
        this.showsOnCurrent = true;
        this.createProperty('generatorvisible', '', $layer);
        this.createProperty('desktopPortrait', 1, $layer);
        this.createProperty('desktopLandscape', 1, $layer);
        this.createProperty('tabletPortrait', 1, $layer);
        this.createProperty('tabletLandscape', 1, $layer);
        this.createProperty('mobilePortrait', 1, $layer);
        this.createProperty('mobileLandscape', 1, $layer);
    }

    PluginShowOn.prototype._hide = function () {
        this.layer.css('display', 'none');
        this.showsOnCurrent = false;
        this.update();
    };

    PluginShowOn.prototype._show = function () {
        if (parseInt(this.property[this.canvasManager.getMode()])) {
            this.layer.css('display', '');
            this.showsOnCurrent = true;
        }
        this.update();
    };


    PluginShowOn.prototype._syncdesktopPortrait = function () {
        var value = this.getProperty('desktopPortrait');
        this.__syncShowOnDevice('desktopPortrait', value);
    };

    PluginShowOn.prototype._syncdesktopLandscape = function () {
        var value = this.getProperty('desktopLandscape');
        this.__syncShowOnDevice('desktopLandscape', value);
    };

    PluginShowOn.prototype._synctabletPortrait = function () {
        var value = this.getProperty('tabletPortrait');
        this.__syncShowOnDevice('tabletPortrait', value);
    };

    PluginShowOn.prototype._synctabletLandscape = function () {
        var value = this.getProperty('tabletLandscape');
        this.__syncShowOnDevice('tabletLandscape', value);
    };

    PluginShowOn.prototype._syncmobilePortrait = function () {
        var value = this.getProperty('mobilePortrait');
        this.__syncShowOnDevice('mobilePortrait', value);
    };

    PluginShowOn.prototype._syncmobileLandscape = function () {
        var value = this.getProperty('mobileLandscape');
        this.__syncShowOnDevice('mobileLandscape', value);
    };

    PluginShowOn.prototype.__syncShowOnDevice = function (mode, value) {
        if (this.getMode() == mode) {
            var value = parseInt(value);
            if (value) {
                this._show();
            } else {
                this._hide();
            }
            this.layer.triggerHandler('LayerShowChange', [mode, value]);
            this.placement.doAction('triggerLayerResized');
        }
    };

    return PluginShowOn;
});
N2Require('Col', ['ContentAbstract'], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    function Col(canvasManager, group, properties) {
        this.label = 'Col';
        this.type = 'col';

        this.innerContainer = '> .n2-ss-layer-col';

        scope.ContentAbstract.prototype.constructor.call(this, canvasManager, group, properties);

        this.placement.allow('default');
    }

    Col.prototype = Object.create(scope.ContentAbstract.prototype);
    Col.prototype.constructor = Col;

    Col.prototype._createLayer = function () {
        return $('<div class="n2-ss-layer"><div class="n2-ss-layer-content n2-ss-layer-col"></div></div>')
            .attr('data-type', this.type);
    }

    Col.prototype.addProperties = function ($layer) {

        scope.ContentAbstract.prototype.addProperties.call(this, $layer);

        this.createProperty('colwidth', '1', $layer);
        this.createProperty('borderradius', 0, $layer);
        this.createProperty('boxshadow', '0|*|0|*|0|*|0|*|00000080', $layer);

        this.createProperty('borderwidth', '1|*|1|*|1|*|1', $layer);
        this.createProperty('borderstyle', 'none', $layer);
        this.createProperty('bordercolor', 'ffffffff', $layer);

        this.createDeviceProperty('order', {desktopPortrait: 0}, $layer);
    }

    Col.prototype.create = function () {
        scope.ContentAbstract.prototype.create.call(this);

        this._syncorder();

        this._syncborder();

        this._syncborderradius();
        this._syncboxshadow();

        this._onReady();
    }

    Col.prototype.load = function ($layer) {

        scope.ContentAbstract.prototype.load.call(this, $layer);

        this._syncorder();

        this._syncborder();
        this._syncborderradius();
        this._syncboxshadow();

        this._onReady();

        var storedRowColumnWidths = $layer.data('rowcolumns') + ''; //jQuery can convert it to number
        if (storedRowColumnWidths != undefined) {
            if (this.group.readyDeferred.state() == 'resolved') {
                var widths = storedRowColumnWidths.split('+');
                for (var i = 0; i < widths.length; i++) {
                    widths[i] = new Fraction(widths[i]);
                }
                this.group.setColsWidth(widths);
            }
        }
    }

    Col.prototype.createRow = function () {
        this.$content = this.layer.find('.n2-ss-layer-content:first');

        this.container = new scope.LayerContainer(this, $('<ul class="n2-list n2-h4 n2-list-orderable" />'), 'normal', '> .n2-ss-layer', ['row', 'layer']);
        this.container.setLayerContainerElement(this.$content);

        var remove = $('<div class="n2-button n2-button-icon n2-button-m n2-button-m-narrow" data-n2tip="' + n2_('Delete layer') + '"><i class="n2-i n2-i-delete n2-i-grey-opacity"></i></div>').on('click', $.proxy(this.delete, this)),
            duplicate = $('<div class="n2-button n2-button-icon n2-button-m n2-button-m-narrow" data-n2tip="' + n2_('Duplicate layer') + '"><i class="n2-i n2-i-duplicate n2-i-grey-opacity"></i></div>').on('click', $.proxy(function () {
                this.duplicate(true, false)
            }, this));


        this._createLayerListRow([
            $('<div class="n2-actions"></div>').append(duplicate).append(remove)
        ]).addClass('n2-ss-layer-content-row');


        this.openerElement = $('<a href="#" class="n2-ss-layer-icon n2-button n2-button-icon n2-button-m"><i class="n2-i n2-i-col"></i></a>').insertBefore(this.layerTitleSpan)
            .on('click', $.proxy(this.switchOpened, this));

        this.container.$ul.appendTo(this.layerRow);

        this.readyDeferred.done($.proxy(this._syncopened, this));
    }

    Col.prototype._start = function (isCreate) {

        scope.ContentAbstract.prototype._start.call(this, isCreate);

        if (isCreate) {
            this.highlight(2000);
        }
    }

    Col.prototype.getRealOrder = function () {
        var order = this.getProperty('order');
        if (order == 0) {
            return 10;
        }
        return order;
    }

    Col.prototype._syncorder = function () {
        var order = this.getProperty('order');

        if (order == 0) {
            this.layer.css('order', '');
        } else {
            this.layer.css('order', order);
        }

        this.group.refreshUI();
    }

    Col.prototype._synccolwidth = function () {
        this.layer.css('width', ((new Fraction(this.getProperty('colwidth'))).valueOf() * 100) + '%');
        this.group.refreshUI();
    }

    Col.prototype._syncborderradius = function () {
        this.$content.css('border-radius', this.getProperty('borderradius') + 'px');
    }

    Col.prototype._syncborderwidth =
        Col.prototype._syncbordercolor =
            Col.prototype._syncborderstyle = function () {
                this._syncborder();
            }

    Col.prototype._syncborder = function () {
        var borderstyle = this.getProperty('borderstyle');
        if (borderstyle != 'none') {
            this.$content.css('border-color', N2Color.hex2rgbaCSS(this.getProperty('bordercolor')));
            this.$content.css('border-style', this.getProperty('borderstyle'));
            var borderWidth = this.getProperty('borderwidth').split('|*|'),
                unit = 'px';

            this.$content.css('border-width', borderWidth.join(unit + ' ') + unit);
        } else {
            this.$content.css('border', '');
        }

        this.update();
    }

    Col.prototype._syncboxshadow = function () {
        var boxShadow = this.getProperty('boxshadow').split('|*|');
        if ((boxShadow[0] != 0 || boxShadow[1] != 0 || boxShadow[2] != 0 || boxShadow[3] != 0) && N2Color.hex2alpha(boxShadow[4]) != 0) {
            this.$content.css('box-shadow', boxShadow[0] + 'px ' + boxShadow[1] + 'px ' + boxShadow[2] + 'px ' + boxShadow[3] + 'px ' + N2Color.hex2rgbaCSS(boxShadow[4]));
        } else {
            this.$content.css('box-shadow', '');
        }
    }

    Col.prototype.delete = function () {
        if (this.group.container.getLayerCount() > 1) {
            this._delete();
        } else {
            this.group.delete();
        }
    }

    Col.prototype.getHTML = function (base64) {
        var layer = scope.ComponentAbstract.prototype.getHTML.call(this, base64);

        layer.attr('data-rowcolumns', this.group.getColumns());
        return layer;
    }

    Col.prototype.renderModeProperties = function (isReset) {
        this._syncorder();

        scope.ContentAbstract.prototype.renderModeProperties.call(this, isReset);
    }

    Col.prototype.update = function () {

        this.group._syncwrapafter();
        scope.ComponentAbstract.prototype.update.call(this);
    }

    return Col;
});
var dependencies = ['LayerDataStorage', 'PluginEditableName'];
N2Require('ComponentAbstract', dependencies, ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    var i = 0;
    window.layers = [];

    function ComponentAbstract(canvasManager, group, properties) {

        this.wraps = {};
        this.counter = i++;
        window.layers[this.counter] = this;
        this.self = this;
        this.originalProperties = properties || {};
        scope.LayerDataStorage.prototype.constructor.call(this);
        this.readyDeferred = $.Deferred();
        this.readyDeferred.done($.proxy(this.onReady, this));
        this.isDeleteStarted = false;
        this.isDeleted = false;

        this._lastClasses = false;

        this.$ = $(this);

        this.proxyRefreshBaseSize = $.proxy(this.refreshBaseSize, this);

        this.status = ComponentAbstract.STATUS.UNDEFINED;

        this.canvasManager = canvasManager;
        this.group = group;


        scope.PluginActivatable.prototype.constructor.call(this);

        /** @type {Placement} */
        this.placement = new scope.Placement(this);

        this.readyDeferred.done($.proxy(this.addUILabels, this));

    }

    ComponentAbstract.STATUS = {
        UNDEFINED: 0,
        NORMAL: 1,
        LOCKED: 2,
        HIDDEN: 3
    };

    ComponentAbstract.STATUS_INV = {
        0: 'UNDEFINED',
        1: 'NORMAL',
        2: 'LOCKED',
        3: 'HIDDEN'
    };


    for (var k in scope.PluginActivatable.prototype) {
        ComponentAbstract.prototype[k] = scope.PluginActivatable.prototype[k];
    }

    for (var k in scope.LayerDataStorage.prototype) {
        ComponentAbstract.prototype[k] = scope.LayerDataStorage.prototype[k];
    }

    for (var k in scope.PluginEditableName.prototype) {
        ComponentAbstract.prototype[k] = scope.PluginEditableName.prototype[k];
    }

    for (var k in scope.PluginShowOn.prototype) {
        ComponentAbstract.prototype[k] = scope.PluginShowOn.prototype[k];
    }

    ComponentAbstract.prototype.addUILabels = function () {
        this.markTimer = null;
        this.uiLabel = $('<div class="n2-ss-layer-ui-label-container"><div class="n2-ss-layer-ui-label n2-ss-layer-ui-label-self">' + this.getUILabel() + '</div></div>')
            .appendTo(this.layer);

        nextend.tooltip.addElement($('<div class="n2-ss-layer-ui-label n2-ss-layer-ui-label-up n2-ss-layer-ui-label-action"><i class="n2-i n2-i-uplevel"/></div>')
            .on({
                mousedown: function (e) {
                    e.stopPropagation();
                },
                click: $.proxy(function (e) {
                    this.up(e);
                }, this)
            })
            .appendTo(this.uiLabel), 'Select parent');

        $('<div class="n2-ss-layer-ui-label n2-ss-layer-ui-label-action"><i class="n2-i n2-i-mini-duplicate"/></div>')
            .on({
                mousedown: function (e) {
                    e.stopPropagation();
                },
                click: $.proxy(function () {
                    this.duplicate();
                }, this)
            })
            .appendTo(this.uiLabel);

        $('<div class="n2-ss-layer-ui-label n2-ss-layer-ui-label-action"><i class="n2-i n2-i-mini-trash"/></div>')
            .on({
                mousedown: function (e) {
                    e.stopPropagation();
                },
                click: $.proxy(function () {
                    this.delete();
                }, this)
            })
            .appendTo(this.uiLabel);
    }

    ComponentAbstract.prototype.getUILabel = function () {
        return this.label;
    }

    ComponentAbstract.prototype.up = function (e) {
        e.stopImmediatePropagation();
        this.group.activate(e);
    }

    ComponentAbstract.prototype.addProperties = function ($layer) {

        this.createProperty('id', null, $layer, this);

        this.createProperty('class', '', $layer);
        this.createProperty('crop', 'visible', $layer);
        this.createProperty('rotation', 0, $layer);
        this.createProperty('parallax', 0, $layer);
        this.createProperty('adaptivefont', 0, $layer);

        this.createDeviceProperty('fontsize', {desktopPortrait: 100}, $layer);
        scope.PluginShowOn.prototype.addProperties.call(this, $layer);
        scope.PluginEditableName.prototype.addProperties.call(this, $layer);
    }

    ComponentAbstract.prototype.getRootElement = function () {
        return this.layer;
    }

    ComponentAbstract.prototype.create = function (cb, useCreatedLayerProperties) {
        useCreatedLayerProperties = useCreatedLayerProperties || false;
        if (!useCreatedLayerProperties) {
            this.addProperties(false);
        }
        if (typeof cb == 'function') {
            this.layer = cb.call(null, this);
        } else {
            this.layer = this._createLayer();
        }

        this.layer.addClass('n2-ss-layer-under-creation');

        if (useCreatedLayerProperties) {
            this.addProperties(this.layer);
        }

        this.layer.data('layerObject', this);
        this.layer.triggerHandler('layerStarted', [this]);


        this.group.container.insert(this);
        this.group.onChildCountChange();

        this.$.triggerHandler('create');

        this._start(true);
    }

    ComponentAbstract.prototype.load = function ($layer) {

        this.addProperties($layer);

        this.layer = $layer.data('layerObject', this);
        this.layer.triggerHandler('layerStarted', [this]);

        this.$.triggerHandler('load');

        this._start(false);

        var status = $layer.data('status');
        if (status !== null && typeof status != 'undefined') {
            this.changeStatus(status);
        } else {
            this.changeStatus(ComponentAbstract.STATUS.NORMAL);
        }
    }

    ComponentAbstract.prototype._start = function (isCreate) {
        this.createRow();

        var mask = this.layer.find('> .n2-ss-layer-mask');
        if (mask.length) {
            this.wraps.mask = mask;
        }

        this._synccrop();
        this._syncrotation();

        this.placement.start();
        this.placement.setMode(this.group.container.allowedPlacementMode, this.originalProperties);

        this.setGroup(this.group);


        this.canvasManager.$.triggerHandler('layerCreated', this);

        if (isCreate) {
            this.refreshBaseSize();
            this.$.triggerHandler('created');
        }

        setTimeout($.proxy(function () {
            if (!this.isDeleted) {
                this.placement.onResize(true);
                this.layer.css('visibility', '');

                this.layer.removeClass('n2-ss-layer-under-creation');
            }
        }, this), 300);
    }


    ComponentAbstract.prototype._onReady = function () {

        this.originalProperties = {};

        this.readyDeferred.resolve();

        this.layer.on({
            mouseover: $.proxy(this.markOver, this),
            mouseout: $.proxy(this.markOut, this)
        });
    }

    ComponentAbstract.prototype.isReady = function () {
        return this.readyDeferred.state() == 'resolved';
    }

    ComponentAbstract.prototype.getName = function () {
        return this.property.name;
    }

    ComponentAbstract.prototype.setGroup = function (group) {
        this.group.$.off('baseSizeUpdated', this.proxyRefreshBaseSize);

        this.group = group;
        this.placement.setMode(group.container.allowedPlacementMode);
        group.container.syncLayerRow(this);

        if (this.isReady()) {
            this.refreshBaseSize();
        }
        this.group.$.on('baseSizeUpdated', this.proxyRefreshBaseSize);
    };

    ComponentAbstract.prototype.changeGroup = function (originalIndex, newGroup) {
        var originalGroup = this.group;
        originalGroup.$.off('baseSizeUpdated', this.proxyRefreshBaseSize);

        this.group = newGroup;
        var originalPlacementData = this.placement.setMode(newGroup.container.allowedPlacementMode);
        newGroup.container.syncLayerRow(this);

        this.refreshBaseSize();
        newGroup.$.on('baseSizeUpdated', this.proxyRefreshBaseSize);

        this.userGroupChange(originalGroup, originalIndex, originalPlacementData, newGroup, this.getIndex());

        originalGroup.update();
    }

    ComponentAbstract.prototype.userGroupChange = function (originalGroup, originalIndex, originalPlacementData, newGroup, newIndex) {
        if (originalGroup == newGroup) {
            this.userIndexChange(originalIndex, newIndex);
        } else {
            var task = smartSlider.history.addValue(this, this.historyUserGroupChange, []);

            if (task) {
                task.setValues({
                    historyGroup: originalGroup,
                    index: originalIndex,
                    placementData: originalPlacementData
                }, {
                    historyGroup: newGroup,
                    index: newIndex
                });
            }
        }
    }

    ComponentAbstract.prototype.historyUserGroupChange = function (data) {
        var originalGroup = this.group,
            group = data.historyGroup.getSelf(),
            index = data.index;
        group.container.insertLayerAt(this, index);

        this.group.$.off('baseSizeUpdated', this.proxyRefreshBaseSize);

        this.group = group;
        if (data.placementData) {
            this.layer.data(data.placementData);
        }
        this.placement.setMode(group.container.allowedPlacementMode);
        group.container.syncLayerRow(this);

        this.refreshBaseSize();
        this.group.$.on('baseSizeUpdated', this.proxyRefreshBaseSize);


        group.onChildCountChange();

        if (data.placementData) {
            this.placement.sync();
        }

        originalGroup.update();
    };

    ComponentAbstract.prototype.userIndexChange = function (originalIndex, newIndex) {

        var task = smartSlider.history.addValue(this, this.historyUserIndexChange);
        if (task) {
            task.setValues(originalIndex, newIndex);
        }
        this.group.container.insertLayerAt(this, newIndex);
    }

    ComponentAbstract.prototype.historyUserIndexChange = function (value) {
        this.group.container.insertLayerAt(this, value);
    }


    ComponentAbstract.prototype._createLayerListRow = function (actions) {
        this.layerRow = $('<li class="n2-ss-layerlist-row"></li>')
            .data('layer', this)
            .on({
                mousedown: $.proxy(nextend.context.setMouseDownArea, nextend.context, 'layerRowClicked')
            })
            .appendTo(this.group.container.$ul);
        this.layerTitleSpan = $('<span class="n2-ucf">' + this.property.name + '</span>');

        this.makeNameEditable();

        this.layerTitle = $('<div class="n2-ss-layer-title"></div>')
            .on({
                mouseenter: $.proxy(function () {
                    this.canvasManager.highlight(this);
                }, this),
                mouseleave: $.proxy(function () {
                    this.canvasManager.deHighlight(this);
                }, this),
            })
            .append(this.layerTitleSpan)
            .append(actions)
            .appendTo(this.layerRow)
            .on({
                mouseup: $.proxy(function (e) {
                    if (!nextend.shouldPreventMouseUp && e.target.tagName === 'DIV') {
                        this.activate(e);
                    }
                }, this)
            });

        nextend.tooltip.add(this.layerRow);

        this.layerRow.nextendLayerListItem({
            UIManager: this.canvasManager.mainContainer.layerListUIManager,
            layer: this,
            $item: this.layerRow
        });

        return this.layerRow;
    }

    ComponentAbstract.prototype.select = function (e) {
        return this.canvasManager.selectLayer(this, true);
    };

    ComponentAbstract.prototype.update = function () {
        this.readyDeferred.done($.proxy(this.placement.updatePositionThrottled, this.placement));
        //this.placement.updatePositionThrottled();
    };

    ComponentAbstract.prototype.updateThrottled = function () {
        this.placement.updatePositionThrottled();
    }

    ComponentAbstract.prototype.positionSidebar = function () {
        this.canvasManager.layerWindow.show(this, this.layer);
    }

    ComponentAbstract.prototype.showEditor = function () {
        this.canvasManager.layerWindow._show();
    }

    ComponentAbstract.prototype.highlight = function (hideInterval) {
        hideInterval = hideInterval || 2000;
        if (this.isHighlighted) {
            clearTimeout(this.isHighlighted);
            this.isHighlighted = false;
        }
        this.layer.addClass('n2-highlight');
        this.isHighlighted = setTimeout($.proxy(function () {
            this.layer.removeClass('n2-highlight');
        }, this), hideInterval);
    }

    ComponentAbstract.prototype.setPropertydesktopPortrait =
        ComponentAbstract.prototype.setPropertydesktopLandscape =
            ComponentAbstract.prototype.setPropertytabletPortrait =
                ComponentAbstract.prototype.setPropertytabletLandscape =
                    ComponentAbstract.prototype.setPropertymobilePortrait =
                        ComponentAbstract.prototype.setPropertymobileLandscape = function (name, value, from) {
                            this._setProperty(name, parseInt(value), from);
                        }

    ComponentAbstract.prototype.getHTML = function (base64) {
        var $layer = this._createLayer();

        for (var k in this.property) {
            if (k != 'width' && k != 'height' && k != 'left' && k != 'top') {
                $layer.attr('data-' + k.toLowerCase(), this.property[k]);
            }
        }

        for (var k in this.deviceProperty) {
            for (var k2 in this.deviceProperty[k]) {
                $layer.attr('data-' + k.toLowerCase() + k2, this.deviceProperty[k][k2]);
            }
        }

        for (var k in this.deviceProperty['desktop']) {
            $layer.css(k, this.deviceProperty['desktop'][k] + 'px');
        }

        if (this.container != undefined) {
            var $innerContainer = $layer;
            if (this.innerContainer != undefined) {
                $innerContainer = $layer.find(this.innerContainer);
            }

            $innerContainer.append(this.container.getHTML(base64));
        }

        var id = this.getProperty('id');
        if (id && id != '') {
            $layer.attr('id', id);
        }

        if (this.status > scope.ComponentAbstract.STATUS.NORMAL) {
            $layer.attr('data-status', this.status);
        }

        return $layer;
    };

    ComponentAbstract.prototype.duplicate = function (needActivate) {
        var $component = this.getHTML(false);

        if (this.placement.getType() == 'absolute') {
            var id = $component.attr('id');
            if (id) {
                id = $.fn.uid();
                $component.attr('id', id);
                $component.attr('data-id', id);
            }
            if ($component.attr('data-parentid')) {
                $component.data('desktopportraittop', 0);
                $component.data('desktopportraitleft', 0);
            } else {
                $component.data('desktopportraittop', $component.data('desktopportraittop') + 40);
                $component.data('desktopportraitleft', $component.data('desktopportraitleft') + 40);
            }
            $component.attr('data-parentid', '');

        }

        var newComponent = this.canvasManager.insertComponentWithNode(this.group, $component, this.getIndex() + 1, false, true);

        this.layerRow.trigger('mouseleave');

        if (needActivate) {
            newComponent.activate();
        }

        smartSlider.history.addSimple(this, this.historyDeleteDuplicated, this.historyDuplicate, [newComponent, newComponent.container ? newComponent.container.getAllLayers() : false]);

        return newComponent;
    };

    ComponentAbstract.prototype.historyDeleteDuplicated = function (historicalNewComponent) {
        historicalNewComponent.getSelf().delete();
    }

    ComponentAbstract.prototype.historyDuplicate = function (historicalNewComponent, historicalAllLayers) {
        var newComponent = this.duplicate(false, false);
        historicalNewComponent.setSelf(newComponent);

        if (historicalAllLayers) {
            var newAllLayers = newComponent.container.getAllLayers();
            for (var i = 0; i < newAllLayers.length; i++) {
                historicalAllLayers[i].setSelf(newAllLayers[i]);
            }
        }
    }

    ComponentAbstract.prototype.historyDelete = function () {
        this.delete();
    }

    ComponentAbstract.prototype.historyRestore = function ($component, historicalGroup, index, historicalAllLayers) {
        var newComponent = this.canvasManager.insertComponentWithNode(this.group.getSelf(), $component.clone(), index, false, true);
        this.setSelf(newComponent);

        if (historicalAllLayers) {
            var newAllLayers = newComponent.container.getAllLayers();
            for (var i = 0; i < newAllLayers.length; i++) {
                historicalAllLayers[i].setSelf(newAllLayers[i]);
            }
        }
    }

    ComponentAbstract.prototype.delete = function () {
        smartSlider.positionDisplay.hide();
        nextend.tooltip.onLeave();
        this._delete();
    }

    ComponentAbstract.prototype._delete = function () {

        this.isDeleteStarted = true;

        if (this.canvasManager.mainContainer.getSelectedLayer() == this) {
            this.canvasManager.layerWindow.hide();
        }

        if (this.isHighlighted) {
            clearTimeout(this.isHighlighted);
            this.isHighlighted = false;
        }

        smartSlider.history.startBatch();
        smartSlider.history.addSimple(this, this.historyRestore, this.historyDelete, [this.getHTML(false), this.group, this.getIndex(), this.container ? this.container.getAllLayers() : false]);

        this.deActivate();

        if (this.container != undefined) {
            smartSlider.history.off();
            var layers = this.container.getSortedLayers();
            for (var i = 0; i < layers.length; i++) {
                layers[i]._delete();
            }
            smartSlider.history.on();
        }
        smartSlider.history.endBatch();

        if (this.item != undefined) {
            this.item.delete();
        }

        this.placement.delete();

        // If delete happen meanwhile layer dragged or resized, we have to cancel that.
        this.layer.trigger('mouseup');

        this.isDeleted = true;

        this.canvasManager.mainContainer.layerDeleted(this);

        this.layer.triggerHandler('LayerDeleted');
        this.getRootElement().remove();
        this.layerRow.remove();

        this.group.update();


        this.group.$.off('baseSizeUpdated', this.proxyRefreshBaseSize);
        this.$.trigger('layerDeleted');

        if (this.markTimer) {
            clearTimeout(this.markTimer);
        }

        //delete this.canvasManager;
        delete this.layer;
        delete this.itemEditor;
        this.group.onChildCountChange();
    }

    ComponentAbstract.prototype.getData = function (params) {
        var data = {
            type: this.type
        };

        if (this.status > scope.ComponentAbstract.STATUS.NORMAL) {
            data.status = this.status;
        }

        var properties = $.extend({}, this.property);

        // store the device based properties
        for (var device in this.deviceProperty) {
            for (var property in this.deviceProperty[device]) {
                delete properties[property];
                var value = this.deviceProperty[device][property];
                if (typeof value === 'undefined') {
                    continue;
                }

                switch (property) {
                    case 'width':
                    case 'height':
                        if (!this.isDimensionPropertyAccepted(value)) {
                            value = parseFloat(value);
                        }
                        break;
                    case 'fontsize':
                    case 'left':
                    case 'top':
                    case 'gutter':
                    case 'wrap':
                        value = parseFloat(value);
                        break;
                }
                data[device.toLowerCase() + property] = value;
            }
        }

        for (var k in properties) {
            data[k.toLowerCase()] = properties[k];
        }

        return data;
    };

    ComponentAbstract.prototype.onChildCountChange = function () {

    }

    ComponentAbstract.prototype.getDataWithChildren = function (layers) {
        layers.push(this.getData({
            layersIncluded: true,
            itemsIncluded: true
        }));
        this.layer.triggerHandler('LayerGetDataWithChildren', [layers]);
        return layers;
    };

    ComponentAbstract.prototype.markOver = function (e) {
        this.layer.addClass('n2-ss-mouse-over');
        e.stopPropagation();

        this.group.markEnter();

        if (this.markTimer) {
            clearTimeout(this.markTimer);
        }
        this.layer.addClass('n2-ss-mouse-over-delayed');
        this.uiLabel.removeClass('invisible');
    }

    ComponentAbstract.prototype.markOut = function (e) {
        this.layer.removeClass('n2-ss-mouse-over');
        if (e) {
            e.stopPropagation();
        }
        this.group.markLeave();

        if (this.markTimer) {
            clearTimeout(this.markTimer);
        }
        if (!this.isActive) {
            this.uiLabel.addClass('invisible');
        }
        this.markTimer = setTimeout($.proxy(function () {
            this.layer.removeClass('n2-ss-mouse-over-delayed');
            this.uiLabel.removeClass('invisible');
            this.markTimer = null;
        }, this), 10);
    }

    ComponentAbstract.prototype.markEnter = function (e) {
        this.layer.addClass('n2-ss-mouse-hover');
        this.group.markEnter();
    }

    ComponentAbstract.prototype.markLeave = function (e) {
        this.layer.removeClass('n2-ss-mouse-hover');
        this.group.markLeave();
    }


    ComponentAbstract.prototype.formSetname = function (options, value) {

    };

    ComponentAbstract.prototype.formSetnameSynced = function (options, value) {

    };

    ComponentAbstract.prototype.formSetdesktopPortrait = function (options, value) {
        options.currentForm.desktopPortrait.data('field').insideChange(value);
    };

    ComponentAbstract.prototype.formSetdesktopLandscape = function (options, value) {
        options.currentForm.desktopLandscape.data('field').insideChange(value);
    };

    ComponentAbstract.prototype.formSettabletPortrait = function (options, value) {
        options.currentForm.tabletPortrait.data('field').insideChange(value);
    };

    ComponentAbstract.prototype.formSettabletLandscape = function (options, value) {
        options.currentForm.tabletLandscape.data('field').insideChange(value);
    };

    ComponentAbstract.prototype.formSetmobilePortrait = function (options, value) {
        options.currentForm.mobilePortrait.data('field').insideChange(value);
    };

    ComponentAbstract.prototype.formSetmobileLandscape = function (options, value) {
        options.currentForm.mobileLandscape.data('field').insideChange(value);
    };

    ComponentAbstract.prototype.sync = function () {
        this._syncid();
        if (this.container) {
            var layers = this.container.getSortedLayers();
            for (var i = 0; i < layers.length; i++) {
                layers[i].sync();
            }
        }
        this.placement.sync();
    }

    ComponentAbstract.prototype._syncid = function () {
        var value = this.getProperty('id');
        if (!value || value == '') {
            this.layer.removeAttr('id');
        } else {
            this.layer.attr('id', value);
        }
    };

    ComponentAbstract.prototype.requestID = function () {
        var id = this.getProperty('id');
        if (!id) {
            id = $.fn.uid();
            this.setProperty('id', id, 'layer');
        }
        return id;
    };

    ComponentAbstract.prototype._syncfontsize = function () {
        this.adjustFontSize(this.getProperty('adaptivefont'), this.getProperty('fontsize'), true);
    };

    ComponentAbstract.prototype._syncadaptivefont = function () {
        this.adjustFontSize(this.getProperty('adaptivefont'), this.getProperty('fontsize'), true);
    };

    ComponentAbstract.prototype.adjustFontSize = function (isAdaptive, fontSize, shouldUpdatePosition) {
        fontSize = parseInt(fontSize);
        if (parseInt(isAdaptive)) {
            this.layer.css('font-size', (16 * fontSize / 100) + 'px');
        } else if (fontSize != 100) {
            this.layer.css('font-size', fontSize + '%');
        } else {
            this.layer.css('font-size', '');
        }
        this.refreshBaseSize();
        if (shouldUpdatePosition) {
            this.update();
        }
    };

    ComponentAbstract.prototype.refreshBaseSize = function () {
        var fontSize = this.getFontSize();
        if (this.isAdaptiveFont()) {
            this.baseSize = (16 * fontSize / 100);
        } else {
            this.baseSize = this.group.baseSize * fontSize / 100;
        }
        this.$.triggerHandler('baseSizeUpdated');
    }

    ComponentAbstract.prototype.getFontSize = function () {
        return parseInt(this.getProperty('fontsize'));
    }

    ComponentAbstract.prototype.isAdaptiveFont = function () {
        return parseInt(this.getProperty('adaptivefont'));
    }

    ComponentAbstract.prototype._synccrop = function () {
        var value = this.getProperty('crop');
        if (value == 'auto') {
            value = 'hidden';
        }

        if (value == 'mask') {
            value = 'hidden';
            this.addWrap('mask', "<div class='n2-ss-layer-mask'></div>");

        } else {
            this.removeWrap('mask');

            this.layer.data('animatableselector', null);
        }
        this.layer.css('overflow', value);
    };

    ComponentAbstract.prototype._syncrotation = function () {
        var rotation = parseFloat(this.getProperty('rotation'));
        if (rotation / 360 != 0) {
            var $el = this.addWrap('rotation', "<div class='n2-ss-layer-rotation'></div>");

            NextendTween.set($el[0], {
                rotationZ: rotation
            });
        } else {
            this.removeWrap('rotation');
        }
    }

    ComponentAbstract.prototype.addWrap = function (key, html) {
        if (this.wraps[key] === undefined) {
            var $el = $(html);
            this.wraps[key] = $el;

            switch (key) {
                case 'mask':
                    $el.appendTo(this.layer);
                    if (this.wraps.rotation !== undefined) {
                        $el.append(this.wraps.rotation);
                    } else {
                        $el.append(this.getContents());
                    }
                    this.layer.data('animatableselector', '.n2-ss-layer-mask:first');
                    break;
                case 'rotation':
                    if (this.wraps.mask !== undefined) {
                        $el.appendTo(this.wraps.mask);
                    } else {
                        $el.appendTo(this.layer);
                    }
                    $el.append(this.getContents());
                    break;
            }
        }
        return this.wraps[key];
    }

    ComponentAbstract.prototype.removeWrap = function (key) {
        if (this.wraps[key] !== undefined) {

            switch (key) {
                case 'mask':
                    if (this.wraps.rotation !== undefined) {
                        this.layer.append(this.wraps.rotation);
                    } else {
                        this.layer.append(this.getContents());
                    }
                    break;
                case 'rotation':
                    if (this.wraps.mask !== undefined) {
                        this.wraps.mask.append(this.getContents());
                    } else {
                        this.layer.append(this.getContents());
                    }
                    break;
            }
            this.wraps[key].remove();
            delete this.wraps[key];
        }
    }

    ComponentAbstract.prototype.getContents = function () {
        return false;
    }

    ComponentAbstract.prototype._syncclass = function () {
        if (this._lastClasses !== false) {
            this.layer.removeClass(this._lastClasses);
        }
        var value = this.getProperty('class');

        if (value && value != '') {
            this.layer.addClass(value);
            this._lastClasses = value;
        } else {
            this._lastClasses = false;
        }
    };

    ComponentAbstract.prototype._syncparallax = function () {

    };

    ComponentAbstract.prototype._syncgeneratorvisible = function () {
    };

    ComponentAbstract.prototype._syncmouseenter =
        ComponentAbstract.prototype._syncclick =
            ComponentAbstract.prototype._syncmouseleave =
                ComponentAbstract.prototype._syncplay =
                    ComponentAbstract.prototype._syncpause =
                        ComponentAbstract.prototype._syncstop = function () {
                        };


    ComponentAbstract.prototype.renderModeProperties = function (isReset) {

        scope.LayerDataStorage.prototype.renderModeProperties.call(this);


        this.placement.renderModeProperties(isReset);
    }

    ComponentAbstract.prototype.getIndex = function () {
        return this.group.container.getLayerIndex(this.layer);
    }

    ComponentAbstract.prototype.toString = function () {
        return this.type + ' #' + this.counter;
    }

    ComponentAbstract.prototype.setSelf = function (self) {
        if (self === undefined) {
            console.error(self);
        }
        if (this.self != this) {
            this.self.setSelf(self);
        }
        this.self = self;

    }

    ComponentAbstract.prototype.getSelf = function () {
        if (this.self !== this) {
            this.self = this.self.getSelf();
        }
        return this.self;
    }

    ComponentAbstract.prototype.historyStoreOnPlacement = function () {
        var args = Array.prototype.slice.call(arguments);
        args.splice(1, 1);
        this.placement.current[arguments[1]].apply(this.placement.current, args);
    }

    ComponentAbstract.prototype.getDroppable = function () {
        return false;
    }

    ComponentAbstract.prototype.onCanvasUpdate = function (originalIndex, targetGroup, newIndex) {

        if (this.group == targetGroup) {

            if (originalIndex != newIndex) {
                this.userIndexChange(originalIndex, newIndex)
            }
        } else {
            var oldAbsoluteParent;
            if (this.canvasManager.isCol(this.group)) {
                oldAbsoluteParent = this;
                while (oldAbsoluteParent && (!oldAbsoluteParent.placement || oldAbsoluteParent.placement.getType() !== 'absolute')) {
                    oldAbsoluteParent = oldAbsoluteParent.group;
                }
            }
            this.changeGroup(originalIndex, targetGroup);

            targetGroup.onChildCountChange();

            // Find the the first absolute element from the layer parents
            var absoluteParent = this;
            while (absoluteParent && (!absoluteParent.placement || absoluteParent.placement.getType() !== 'absolute')) {
                absoluteParent = absoluteParent.group;
            }

            // Update the closest absolute parent's position as the content changed
            if (oldAbsoluteParent && oldAbsoluteParent != absoluteParent) {
                oldAbsoluteParent.placement.updatePosition();
            }
            if (absoluteParent) {
                absoluteParent.placement.updatePosition();
            }
        }
    }

    ComponentAbstract.prototype.setStatusNormal = function () {
        this.changeStatus(ComponentAbstract.STATUS.NORMAL);
    };

    ComponentAbstract.prototype.changeStatus = function (status) {
        var oldStatus = this.status;

        if (status == this.status) {
            status = ComponentAbstract.STATUS.NORMAL;
        }

        switch (this.status) {
            case ComponentAbstract.STATUS.HIDDEN:
                this.getRootElement().removeAttr('data-visibility');
                this.layerRow.removeClass('n2-ss-layer-status-hidden');
                break;
            case ComponentAbstract.STATUS.LOCKED:
                this.layer.removeClass('n2-ss-layer-locked');
                this.layerRow.removeClass('n2-ss-layer-status-locked');
                break;
        }

        this.status = status;

        switch (this.status) {
            case ComponentAbstract.STATUS.HIDDEN:
                this.getRootElement().attr('data-visibility', 'hidden');
                this.layerRow.addClass('n2-ss-layer-status-hidden');
                break;
            case ComponentAbstract.STATUS.LOCKED:
                this.layer.addClass('n2-ss-layer-locked');
                this.layerRow.addClass('n2-ss-layer-status-locked');
                break;
        }

        this.placement.current.changeStatus(oldStatus, this.status);

    }

    ComponentAbstract.prototype.moveX = function (x) {
        if (this.placement.getType() == 'absolute') {
            this.placement.current.moveX(x);
        }
    }

    ComponentAbstract.prototype.moveY = function (y) {
        if (this.placement.getType() == 'absolute') {
            this.placement.current.moveY(y);
        }
    }

    return ComponentAbstract;
});
N2Require('Content', ['ContentAbstract'], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    function Content(canvasManager, group, properties) {
        this.label = n2_('Content');
        this.type = 'content';

        this.innerContainer = '> .n2-ss-layer-content';

        this._defaults = $.extend({verticalalign: 'center'}, this._defaults);

        scope.ContentAbstract.prototype.constructor.call(this, canvasManager, group, properties);

        this.placement.allow('content');

        canvasManager.setMainContent(this);
    }

    Content.prototype = Object.create(scope.ContentAbstract.prototype);
    Content.prototype.constructor = Content;

    Content.prototype.addUILabels = function () {
        this.markTimer = null;
        this.uiLabel = $('<div class="n2-ss-layer-ui-label-container"><div class="n2-ss-layer-ui-label n2-ss-layer-ui-label-self">' + this.getUILabel() + '</div></div>')
            .appendTo(this.layer);
    }

    Content.prototype.addProperties = function ($layer) {

        scope.ContentAbstract.prototype.addProperties.call(this, $layer);

        this.createDeviceProperty('selfalign', {desktopPortrait: 'inherit'}, $layer);

    }

    Content.prototype.getRootElement = function () {
        return this.$outerSection;
    }

    Content.prototype.getBackgroundElement = function () {
        return this.$outerSection;
    }

    Content.prototype._createLayer = function () {
        return $('<div class="n2-ss-layer n2-ss-content-empty"><div class="n2-ss-section-main-content n2-ss-layer-content"></div></div>')
            .attr('data-type', this.type);
    }

    Content.prototype.createRow = function () {
        this.$outerSection = this.layer.parent();
        if (!this.$outerSection.hasClass('n2-ss-section-outer')) {
            this.$outerSection = $('<div class="n2-ss-section-outer"></div>')
                .insertAfter(this.layer)
                .append(this.layer);
        }
        this.$outerSection.data('layerObject', this);

        this.$content = this.layer.find('> .n2-ss-layer-content');

        var status = $('<div class="n2-ss-layer-status"></div>'),
            remove = $('<div class="n2-button n2-button-icon n2-button-m n2-button-m-narrow" data-n2tip="' + n2_('Delete layer') + '"><i class="n2-i n2-i-delete n2-i-grey-opacity"></i></div>').on('click', $.proxy(this.delete, this));

        this.container = new scope.LayerContainer(this, $('<ul class="n2-list n2-h4 n2-list-orderable" />'), 'normal', '> .n2-ss-layer', ['row', 'layer']);
        this.container.setLayerContainerElement(this.$content);


        $('<a href="#" class="n2-ss-sc-hide n2-button n2-button-icon n2-button-m"><i class="n2-i n2-i-eye"></i></a>').appendTo(status).on('click', $.proxy(function (e) {
            e.preventDefault();
            if (this.status == scope.ComponentAbstract.STATUS.HIDDEN) {
                this.setStatusNormal();
            } else {
                this.changeStatus(scope.ComponentAbstract.STATUS.HIDDEN);
            }
        }, this));

        this._createLayerListRow([
            $('<div class="n2-actions-left"></div>').append(status),
            $('<div class="n2-actions"></div>').append(remove)
        ]).addClass('n2-ss-layer-content-row');


        this.openerElement = $('<a href="#" class="n2-ss-layer-icon n2-button n2-button-icon n2-button-m"><i class="n2-i n2-i-col"></i></a>').insertBefore(this.layerTitleSpan)
            .on('click', $.proxy(this.switchOpened, this));

        this.container.$ul.appendTo(this.layerRow);

        this.readyDeferred.done($.proxy(this._syncopened, this));
    }

    Content.prototype.create = function () {

        this.originalProperties.adaptivefont = 1;

        scope.ContentAbstract.prototype.create.call(this);

        this._syncselfalign();

        this._onReady();
    }

    Content.prototype.load = function ($layer) {

        scope.ContentAbstract.prototype.load.call(this, $layer);

        this._syncselfalign();

        this._onReady();
    }
    Content.prototype._onReady = function () {
        scope.ContentAbstract.prototype._onReady.call(this);
        this.startUISizing();
    }

    Content.prototype.startUISizing = function () {
        this.layer.nextendNormalSizing({
            start: $.proxy(function (e, prop) {
                smartSlider.positionDisplay.show('NormalSizing');
                if (prop == 'maxwidth') {
                    this.layer.addClass('n2-ss-has-maxwidth');
                }
            }, this),
            resizeMaxWidth: $.proxy(function (e, ui) {

                smartSlider.positionDisplay.update(e, 'NormalSizing', 'Max-width: ' + (ui.value == 0 ? 'none' : (ui.value + 'px')));

            }, this),
            stopMaxWidth: $.proxy(function (e, ui) {
                smartSlider.positionDisplay.hide('NormalSizing');
                this.setProperty('maxwidth', ui.value);
            }, this)
        });
    }

    Content.prototype.delete = function () {
        var layers = this.container.getSortedLayers();
        for (var i = 0; i < layers.length; i++) {
            layers[i].delete();
        }
    }

    Content.prototype.remove = function () {
        this._delete();
    }

    Content.prototype.update = function () {
        nextend.smartSlider.frontend.responsive.doVerticalResize();
    }

    Content.prototype.onChildCountChange = function () {

        var layers = this.container.getSortedLayers();

        this.layer.toggleClass('n2-ss-content-empty', layers.length == 0);
    }

    Content.prototype.renderModeProperties = function (isReset) {
        scope.ContentAbstract.prototype.renderModeProperties.call(this, isReset);

        this._syncselfalign();
    }

    Content.prototype._syncselfalign = function () {
        this.layer.attr('data-cssselfalign', this.getProperty('selfalign'));
    }

    Content.prototype.duplicate = function (needActivate) {
        console.error('Content can not be duplicated!');
    }

    return Content;
});
N2Require('ContentAbstract', ['LayerContainer', 'ComponentAbstract'], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    function ContentAbstract(canvasManager, group, properties) {

        this._defaults = $.extend({verticalalign: 'flex-start'}, this._defaults);

        this._syncbgThrottled = NextendThrottle(this._syncbgThrottled, 50);

        scope.ComponentAbstract.prototype.constructor.call(this, canvasManager, group, properties);
    }

    ContentAbstract.prototype = Object.create(scope.ComponentAbstract.prototype);
    ContentAbstract.prototype.constructor = ContentAbstract;

    ContentAbstract.prototype.addProperties = function ($layer) {

        this.createProperty('opened', 1, $layer, this);

        scope.ComponentAbstract.prototype.addProperties.call(this, $layer);

        this.createProperty('bgimage', '', $layer);
        this.createProperty('bgimagex', 50, $layer);
        this.createProperty('bgimagey', 50, $layer);
        this.createProperty('bgimageparallax', 0, $layer);
        this.createProperty('bgcolor', '00000000', $layer);
        this.createProperty('bgcolorgradient', 'off', $layer);
        this.createProperty('bgcolorgradientend', '00000000', $layer);
        this.createProperty('verticalalign', this._defaults.verticalalign, $layer);

        this.createDeviceProperty('maxwidth', {desktopPortrait: 0}, $layer);

        this.createDeviceProperty('inneralign', {desktopPortrait: 'inherit'}, $layer);
        this.createDeviceProperty('padding', {desktopPortrait: '10|*|10|*|10|*|10|*|px+'}, $layer);
    }

    ContentAbstract.prototype.getBackgroundElement = function () {
        return this.$content;
    }

    ContentAbstract.prototype.getPaddingElement = function () {
        return this.$content;
    }

    ContentAbstract.prototype.create = function () {
        scope.ComponentAbstract.prototype.create.call(this);

        this.initUI();

        this._syncverticalalign();

        this._syncmaxwidth();
        this._syncpadding();
        this._syncinneralign();
        this._syncbgThrottled();
    }

    ContentAbstract.prototype.load = function ($layer) {

        scope.ComponentAbstract.prototype.load.call(this, $layer);

        this.initUI();

        this._syncverticalalign();
        this._syncmaxwidth();
        this._syncpadding();
        this._syncinneralign();
        this._syncbgThrottled();

        this.container.startWithExistingNodes();
    }

    ContentAbstract.prototype.initUI = function () {

        this.layer.on({
            mousedown: $.proxy(nextend.context.setMouseDownArea, nextend.context, 'layerClicked'),
            click: $.proxy(function (e) {
                if (!nextend.shouldPreventMouseUp && this.canvasManager.preventActivationBubbling()) {
                    this.activate(e);
                }
            }, this),
            dblclick: $.proxy(function (e) {
                e.stopPropagation();
                $('[data-tab="layer"]').trigger('click');
            }, this)
        });


        this.getPaddingElement().nextendSpacing({
            handles: 'n, s, e, w',
            start: $.proxy(function (e, ui) {
                smartSlider.positionDisplay.show('Spacing');
            }, this),
            spacing: $.proxy(function (e, ui) {
                var html = '';
                for (var k in ui.changed) {
                    html += 'Padding ' + k + ': ' + ui.changed[k] + 'px<br>';
                }

                smartSlider.positionDisplay.update(e, 'Spacing', html);
            }, this),
            stop: $.proxy(this.onSpacingStop, this),
        });
    }

    ContentAbstract.prototype.onSpacingStop = function (event, ui) {
        smartSlider.positionDisplay.hide('Spacing');
        var padding = this.getPadding().split('|*|'),
            ratioH = 1,
            ratioV = 1;

        if (padding[padding.length - 1] == 'px+' && Math.abs(parseFloat(this.layer.css('fontSize')) - this.baseSize) > 1) {
            ratioH = this.canvasManager.getResponsiveRatio('h');
            ratioV = this.canvasManager.getResponsiveRatio('v');
        }

        for (var k in ui.changed) {
            var value = ui.changed[k];
            switch (k) {
                case 'top':
                    padding[0] = Math.round(value / ratioV);
                    break;
                case 'right':
                    padding[1] = Math.round(value / ratioH);
                    break;
                case 'bottom':
                    padding[2] = Math.round(value / ratioV);
                    break;
                case 'left':
                    padding[3] = Math.round(value / ratioH);
                    break;
            }
        }
        this.setProperty('padding', padding.join('|*|'));
        $('#layercol-padding').data('field').insideChange(padding.join('|*|'));
    };

    ContentAbstract.prototype.switchOpened = function (e) {
        e.preventDefault();
        if (this.getProperty('opened')) {
            this.setProperty('opened', 0);
        } else {
            this.setProperty('opened', 1);
        }
    };

    ContentAbstract.prototype._syncopened = function () {
        if (this.getProperty('opened')) {
            this.openerElement.removeClass('n2-closed');
            this.container.$ul.css('display', '');

            this.layer.triggerHandler('opened');
        } else {
            this.openerElement.addClass('n2-closed');
            this.container.$ul.css('display', 'none');

            this.layer.triggerHandler('closed');
        }
    };

    ContentAbstract.prototype.getPadding = function () {
        return this.getProperty('padding');
    }

    ContentAbstract.prototype._syncpadding = function () {
        var padding = this.getPadding().split('|*|'),
            unit = padding.pop(),
            baseSize = this.baseSize;
        if (unit == 'px+' && baseSize > 0) {
            unit = 'em';
            for (var i = 0; i < padding.length; i++) {
                padding[i] = parseInt(padding[i]) / baseSize;
            }
        }

        var css = padding.join(unit + ' ') + unit;
        this.getPaddingElement().css('padding', css);
        this.update();

        this.getPaddingElement().nextendSpacing('option', 'current', css);
    }

    ContentAbstract.prototype._syncmaxwidth = function () {
        var value = parseInt(this.getProperty('maxwidth'));
        if (value <= 0 || isNaN(value)) {
            this.layer.css('maxWidth', '')
                .removeClass('n2-ss-has-maxwidth');
        } else {
            this.layer.css('maxWidth', value + 'px')
                .addClass('n2-ss-has-maxwidth');
        }

        this.update();
    };

    ContentAbstract.prototype.getInnerAlign = function () {
        return this.getProperty('inneralign');
    }

    ContentAbstract.prototype._syncinneralign = function () {
        this.layer.attr('data-csstextalign', this.getInnerAlign());
    }

    ContentAbstract.prototype.getVerticalAlign = function () {
        return this.getProperty('verticalalign');
    }

    ContentAbstract.prototype._syncverticalalign = function () {
        this.$content.attr('data-verticalalign', this.getVerticalAlign());
    }

    ContentAbstract.prototype._syncbgimage =
        ContentAbstract.prototype._syncbgimagex =
            ContentAbstract.prototype._syncbgimagey =
                ContentAbstract.prototype._syncbgimageparallax =
                    ContentAbstract.prototype._syncbgcolor =
                        ContentAbstract.prototype._syncbgcolorgradient =
                            ContentAbstract.prototype._syncbgcolorgradientend = function () {
                                this._syncbgThrottled();
                            }


    ContentAbstract.prototype._syncbgThrottled = function () {
        var background = '',
            image = this.getProperty('bgimage');
        if (image != '') {
            var x = parseInt(this.getProperty('bgimagex'));
            if (!isFinite(x)) {
                x = 50;
            }
            var y = parseInt(this.getProperty('bgimagey'));
            if (!isFinite(y)) {
                y = 50;
            }
            background += 'url("' + nextend.imageHelper.fixed(image) + '") ' + x + '% ' + y + '% / cover no-repeat' + (this.getProperty('bgimageparallax') == 1 ? ' fixed' : '');
        }
        var color = this.getProperty('bgcolor'),
            gradient = this.getProperty('bgcolorgradient'),
            colorend = this.getProperty('bgcolorgradientend');

        if (N2Color.hex2alpha(color) != 0 || (gradient != 'off' && N2Color.hex2alpha(colorend) != 0 )) {
            var after = '';
            if (background != '') {
                after = ',' + background;
            }
            switch (gradient) {
                case 'horizontal':
                    this.getBackgroundElement()
                        .css('background', '-moz-linear-gradient(left, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after)
                        .css('background', ' -webkit-linear-gradient(left, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after)
                        .css('background', 'linear-gradient(to right, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after);
                    break;
                case 'vertical':
                    this.getBackgroundElement()
                        .css('background', '-moz-linear-gradient(top, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after)
                        .css('background', ' -webkit-linear-gradient(top, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after)
                        .css('background', 'linear-gradient(to bottom, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after);
                    break;
                case 'diagonal1':
                    this.getBackgroundElement()
                        .css('background', '-moz-linear-gradient(45deg, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after)
                        .css('background', ' -webkit-linear-gradient(45deg, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after)
                        .css('background', 'linear-gradient(45deg, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after);
                    break;
                case 'diagonal2':
                    this.getBackgroundElement()
                        .css('background', '-moz-linear-gradient(-45deg, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after)
                        .css('background', ' -webkit-linear-gradient(-45deg, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after)
                        .css('background', 'linear-gradient(-45deg, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after);
                    break;
                case 'off':
                default:
                    if (background != '') {
                        background = "linear-gradient(" + N2Color.hex2rgbaCSS(color) + ", " + N2Color.hex2rgbaCSS(color) + ")," + background;
                    } else {
                        background += N2Color.hex2rgbaCSS(color);
                    }
                    this.getBackgroundElement().css('background', background);
                    break;
            }
        } else {
            this.getBackgroundElement().css('background', background);
        }
    };

    ContentAbstract.prototype.getData = function (params) {
        var data = scope.ComponentAbstract.prototype.getData.call(this, params);

        if (params.layersIncluded) {
            data.layers = this.container.getData(params);
        }

        return data;
    };

    ContentAbstract.prototype.onChildCountChange = function () {
        this.layer.toggleClass('n2-ss-content-empty', this.container.getLayerCount() == 0);

        this.update();
    }

    ContentAbstract.prototype.renderModeProperties = function (isReset) {
        scope.ComponentAbstract.prototype.renderModeProperties.call(this, isReset);

        this._syncmaxwidth();

        this._syncpadding();
        this._syncinneralign();
    }

    ContentAbstract.prototype.getDroppable = function () {
        return {
            $container: this.$content,
            layer: this,
            placement: 'normal',
            axis: 'y'
        }
    }

    ContentAbstract.prototype.getLLDroppable = function (layer) {
        switch (layer.type) {
            case 'layer':
            case 'row':
                return {
                    $container: this.container.$ul,
                    layer: this
                };
                break;
        }
        return false;
    }

    ContentAbstract.prototype.getContents = function () {
        return this.$content;
    }

    return ContentAbstract;
});
N2Require('Layer', ['ComponentAbstract'], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    function Layer(canvasManager, group, properties) {
        this.label = n2_('Layer');
        this.type = 'layer';

        this.parent = false;

        this.itemEditor = canvasManager.itemEditor;

        scope.ComponentAbstract.prototype.constructor.call(this, canvasManager, group, properties);

        this.placement.allow('absolute');
        this.placement.allow('normal');

        this.$.on('load create', $.proxy(this.startItem, this));
    };

    Layer.prototype = Object.create(scope.ComponentAbstract.prototype);
    Layer.prototype.constructor = Layer;


    Layer.prototype.create = function () {

        scope.ComponentAbstract.prototype.create.apply(this, arguments);

        this.initUI();

        this._onReady();
    }

    Layer.prototype.load = function ($layer) {

        scope.ComponentAbstract.prototype.load.call(this, $layer);

        this.initUI();

        this._onReady();
    }

    Layer.prototype.startItem = function () {
        var $item = this.layer.find('.n2-ss-item');

        new scope[this.itemEditor.getItemClass($item.data('item'))]($item, this, this.itemEditor);

        this.layer.nextendCanvasItem({
            canvasUIManager: this.canvasManager.mainContainer.canvasUIManager,
            layer: this,
            $layer: this.layer
        });

        if (this.item.needSize) {
            this.layer.addClass('n2-ss-layer-needsize');
        }
    }

    Layer.prototype.initUI = function () {

        this.layer.on({
            mousedown: $.proxy(nextend.context.setMouseDownArea, nextend.context, 'layerClicked'),
            click: $.proxy(function (e) {
                if (this.canvasManager.preventActivationBubbling()) {
                    this.activate(e);
                }
            }, this),
            dblclick: $.proxy(function (e) {
                e.stopPropagation();
                $('[data-tab="item"]').trigger('click');
                this.item.itemEditor.focusFirst('dblclick');
            }, this)
        });
    }

    Layer.prototype.getContent = function () {

        var $content = this.layer,
            selector = $content.data('animatableselector');
        if (selector) {
            $content = $content.find(selector);
        }
        return $content;
    }

    Layer.prototype._createLayer = function () {
        return $('<div class="n2-ss-layer"></div>')
            .attr('data-type', this.type);
    }

    Layer.prototype.createRow = function () {
        var status = $('<div class="n2-ss-layer-status"></div>'),
            remove = $('<div class="n2-button n2-button-icon n2-button-m n2-button-m-narrow" data-n2tip="' + n2_('Delete layer') + '"><i class="n2-i n2-i-delete n2-i-grey-opacity"></i></div>').on('click', $.proxy(this.delete, this)),
            duplicate = $('<div class="n2-button n2-button-icon n2-button-m n2-button-m-narrow" data-n2tip="' + n2_('Duplicate layer') + '"><i class="n2-i n2-i-duplicate n2-i-grey-opacity"></i></div>').on('click', $.proxy(function () {
                this.duplicate(true, false)
            }, this));

        $('<a href="#" class="n2-ss-sc-hide n2-button n2-button-icon n2-button-m"><i class="n2-i n2-i-eye"></i></a>').appendTo(status).on('click', $.proxy(function (e) {
            e.preventDefault();
            if (this.status == scope.ComponentAbstract.STATUS.HIDDEN) {
                this.setStatusNormal();
            } else {
                this.changeStatus(scope.ComponentAbstract.STATUS.HIDDEN);
            }
        }, this));


        this._createLayerListRow([
            $('<div class="n2-actions-left"></div>').append(status),
            $('<div class="n2-actions"></div>').append(duplicate).append(remove)
        ])
            .addClass('n2-ss-layer-layer-row');
    };

    /**
     *
     * @param item {optional}
     */
    Layer.prototype.activate = function (e, context, preventExitFromSelection) {

        scope.PluginActivatable.prototype.activate.call(this, e, context, preventExitFromSelection);

        if (this.item) {
            this.item.activate(null, context);
        } else {
            console.error('The layer do not have item on it!');
        }
    };

    Layer.prototype.getHTML = function (base64) {

        var $node = scope.ComponentAbstract.prototype.getHTML.call(this, base64)

        var $item = this.item.getHTML(base64);
        $node.attr('style', $node.attr('style') + this.getStyleText())
            .append($item);

        return $node;
    };

    Layer.prototype.getData = function (params) {
        var data = scope.ComponentAbstract.prototype.getData.call(this, params);

        if (params.itemsIncluded) {
            data.item = this.item.getData();
        }
        return data;
    };

    Layer.prototype.getStyleText = function () {
        var style = '';
        var crop = this.property.crop;
        if (crop == 'auto' || crop == 'mask') {
            crop = 'hidden';
        }

        style += 'overflow:' + crop + ';';
        return style;
    };

    Layer.prototype.getContents = function () {
        return this.item.$item;
    }

    Layer.prototype.setSelf = function (self) {
        if (this.self != this) {
            this.self.setSelf(self);
        }
        this.self = self;
        this.item.setSelf(self.item);
    }

    Layer.prototype.getSelf = function () {
        if (this.self !== this) {
            this.self = this.self.getSelf();
        }
        return this.self;
    }

    return Layer;
});
N2Require('MainContainer', ['LayerContainer'], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    function MainContainer(canvasManager) {

        this.baseSize = 16;

        this.activeLayer = null;

        this.$ = canvasManager.$;

        this.isActiveGroupBlurred = true;

        this.isMainGroup = true;
        this.canvasManager = canvasManager;
        this.layer = smartSlider.$currentSlideElement.find('.n2-ss-layers-container').addBack().last();

        this.layer.nextendCanvas({
            mainContainer: this,
            tolerance: 5,
            smartguides: $.proxy(function (context) {
                context.$layer.triggerHandler('LayerParent');
                return this.canvasManager.getSnap();
            }, this),
            display: {
                hidden: true,
                show: $.proxy(function () {
                    smartSlider.positionDisplay.show('Canvas');
                }, this),
                update: $.proxy(function (e, position) {
                    smartSlider.positionDisplay.update(e, 'Canvas', 'L: ' + parseInt(position.left | 0) + 'px<br />T: ' + parseInt(position.top | 0) + 'px');

                }, this),
                hide: $.proxy(function () {
                    smartSlider.positionDisplay.hide('Canvas');
                }, this)
            },
            start: $.proxy(function (e, ui) {
                this.canvasManager.canvasDragStart(e, ui);
            }, this),
            drag: $.proxy(function (e, ui) {
                this.canvasManager.canvasDragMove(e, ui);

                if (ui.layer) ui.layer.placement.current.triggerLayerResized();
            }, this),
            stop: $.proxy(function (e, ui) {
                this.canvasManager.canvasDragStop(e, ui);

                if (ui.layer) ui.layer.placement.current.triggerLayerResized();
            }, this)
        });
        this.canvasUIManager = this.layer.data('uiNextendCanvas');

        this.layer.nextendLayerList({
            mainContainer: this,
            $fixed: $('#n2-ss-layers'),
            $scrolled: $('#n2-ss-layer-list')
        });
        this.layerListUIManager = this.layer.data('uiNextendLayerList');

        this.layer.parent().prepend('<div class="n2-ss-slide-border n2-ss-slide-border-left" /><div class="n2-ss-slide-border n2-ss-slide-border-top" /><div class="n2-ss-slide-border n2-ss-slide-border-right" /><div class="n2-ss-slide-border n2-ss-slide-border-bottom" />');

        this.container = new scope.LayerContainer(this, $('#n2-ss-layer-list').find('ul'), 'absolute', '> .n2-ss-section-outer > .n2-ss-layer, > .n2-ss-layer, > .n2-ss-layer-group', ['content', 'row', 'layer', 'group']);

        this.layerRow = this.container.$ul;

        this.$.on('layerCreated', $.proxy(function () {
            this.refreshHasLayers();
        }, this));
    }

    MainContainer.prototype.lateInit = function () {

        this.container.startWithExistingNodes();

        this.layer.parent().on('click', $.proxy(function () {
            if (this.canvasManager.shouldPreventActivationBubble) {
                this.blurActiveGroup();
            } else {
                this.unBlurActiveGroup();
            }
            this.canvasManager.allowActivation();
        }, this));


        smartSlider.frontend.sliderElement.on('SliderResize', $.proxy(this.onResize, this));
    }

    MainContainer.prototype.onResize = function (e, ratios) {

        var sortedLayerList = this.getEverySortedLayers();

        for (var i = 0; i < sortedLayerList.length; i++) {
            sortedLayerList[i].placement.doLinearResize(ratios);
        }
    };

    MainContainer.prototype.getEverySortedLayers = function () {
        var list = this.container.getChildLayersRecursive(false),
            children = {};
        for (var i = list.length - 1; i >= 0; i--) {
            if (typeof list[i].property.parentid !== 'undefined' && list[i].property.parentid) {
                if (typeof children[list[i].property.parentid] == 'undefined') {
                    children[list[i].property.parentid] = [];
                }
                children[list[i].property.parentid].push(list[i]);
                list.splice(i, 1);
            }
        }
        for (var i = 0; i < list.length; i++) {
            if (typeof list[i].property.id !== 'undefined' && list[i].property.id && typeof children[list[i].property.id] !== 'undefined') {
                children[list[i].property.id].unshift(0);
                children[list[i].property.id].unshift(i + 1);
                list.splice.apply(list, children[list[i].property.id]);
                delete children[list[i].property.id];
            }
        }
        return list;
    };

    MainContainer.prototype.deleteLayers = function () {
        var layers = this.container.getSortedLayers();
        for (var i = 0; i < layers.length; i++) {
            layers[i].delete();
        }
    };

    MainContainer.prototype.blurActiveGroup = function () {
        this.isActiveGroupBlurred = true;
    }

    MainContainer.prototype.unBlurActiveGroup = function () {
        this.isActiveGroupBlurred = false;
    }

    MainContainer.prototype.getActiveGroup = function () {
        if (this.isActiveGroupBlurred) {
            var group = this,
                activeLayer = this.activeLayer;
            if (this.canvasManager.isGroup(activeLayer) || this.canvasManager.isCol(activeLayer) || this.canvasManager.isContent(activeLayer)) {
                group = activeLayer;
            } else if (this.canvasManager.isRow(activeLayer)) {
                group = activeLayer.container.getSortedLayers()[0];
            } else if (activeLayer) {
                group = activeLayer.group;
            }
            switch (this.canvasManager.currentEditorMode) {
                case  'content':
                    if (group == this) {
                        group = this.canvasManager.mainContent;
                    }
                    break;
                case  'canvas':
                    if (group == this.canvasManager.mainContent) {
                        group = this;
                    }
                    break;
            }

            return group;
        }
        return this;
    }

    MainContainer.prototype.getSelectedLayer = function () {
        if (this.activeLayer == null) {
            return false;
        }
        return this.activeLayer;
    };

    MainContainer.prototype.getLayerData = function (requestedLayers) {
        if (requestedLayers === undefined) {
            return [];
        }
        var layers = [];

        for (var i = 0; i < requestedLayers.length; i++) {
            requestedLayers[i].getDataWithChildren(layers);
        }

        return layers;
    };

    MainContainer.prototype.layerDeleted = function (layer) {

        var i = this.canvasManager.selectedLayers.length;
        while (i--) {
            if (layer == this.canvasManager.selectedLayers[i]) {
                this.canvasManager.selectedLayers.splice(i, 1);
            }
        }

        this._afterLayerDeletedDeBounced(layer);

        this.refreshHasLayers();
    };

    MainContainer.prototype._afterLayerDeletedDeBounced = NextendDeBounce(function (layer) {

        if (!this.activeLayer || this.activeLayer.isDeleted) {
            this.canvasManager.resetActiveLayer();
        }
    }, 50);

    MainContainer.prototype.refreshHasLayers = function () {
        $('body').toggleClass('n2-ss-has-layers', this.container.getLayerCount() > 0);
        nextend.triggerResize();
    }

    MainContainer.prototype.getName = function () {
        return 'Slide';
    }

    MainContainer.prototype.update = function () {

    }

    MainContainer.prototype.onChildCountChange = function () {

    }

    MainContainer.prototype.markEnter = function (e) {

    }

    MainContainer.prototype.markLeave = function (e) {

    }

    MainContainer.prototype.getSelf = function () {
        return this;
    }

    MainContainer.prototype.createLayerAnimations = function (horizontalRatio, verticalRatio) {
        var animations = [];
        var children = this.container.getSortedLayers();
        for (var i = 0; i < children.length; i++) {
            animations.push.apply(animations, children[i].createLayerAnimations(horizontalRatio, verticalRatio));
        }
        return animations;
    }

    MainContainer.prototype.getDroppables = function (exclude) {
        var editorMode = this.canvasManager.currentEditorMode,
            droppables = [],
            layers;

        if (editorMode == 'canvas') {
            droppables.push(this.getDroppable());
            layers = this.container.getSortedLayers();
            var index = $.inArray(this.canvasManager.mainContent, layers);
            if (index > -1) {
                layers.splice(index, 1);
            }
        } else if (editorMode == 'content') {
            layers = [this.canvasManager.mainContent]
        }

        for (var i = 0; i < layers.length; i++) {
            if (layers[i] == exclude) continue;
            var droppable = layers[i].getDroppable();
            if (droppable) {
                droppables.push(droppable);
            }
            if (layers[i].container) {
                droppables.push.apply(droppables, layers[i].container.getDroppables(exclude));
            }
        }

        return droppables;
    }

    MainContainer.prototype.getLLDroppables = function (layer) {
        return this.container.getLLDroppables(layer);
    }

    MainContainer.prototype.getDroppable = function () {
        return {
            $container: this.layer,
            layer: this,
            placement: 'absolute'
        }
    }

    MainContainer.prototype.getLLDroppable = function (layer) {
        switch (layer.type) {
            case 'layer':
            case 'row':
            case 'group':
            case 'content':
                return {
                    $container: this.container.$ul,
                    layer: this
                };
                break;
        }
        return false;
    }

    MainContainer.prototype.replaceLayers = function (layersData) {

        this._idTranslation = {};
        var layerNodes = this.dataToLayers($.extend(true, [], layersData).reverse()),
            layers = [];

        this.deleteLayers();

        this.canvasManager.mainContent.remove();


        for (var i = 0; i < layerNodes.length; i++) {
            layers.push(this.container.append(layerNodes[i]));
        }

        this.canvasManager.refreshMode();

        if (!this.getSelectedLayer()) {
            if (layers.length > 0) {
                layers[0].activate();
            }
        }

        if (smartSlider.history.isEnabled()) {
            smartSlider.history.addSimple(this, this.historyDeleteAll, this.historyReplaceLayers, [layersData, layers, this.container.getAllLayers()]);
        }

        return layers;
    }

    MainContainer.prototype.historyDeleteAll = function (layersData, historicalLayers) {
        for (var i = 0; i < historicalLayers.length; i++) {
            historicalLayers[i].getSelf().delete();
        }

        this.canvasManager.mainContent.getSelf().remove();
    }

    MainContainer.prototype.historyReplaceLayers = function (layersData, historicalLayers, historicalAllLayers) {
        this.replaceLayers(layersData);

        var layers = this.container.getAllLayers();
        for (var i = 0; i < historicalAllLayers.length; i++) {
            historicalAllLayers[i].setSelf(layers[i]);
        }
    }

    MainContainer.prototype.addLayers = function (layersData, group) {

        this._idTranslation = {};
        var layerNodes = this.dataToLayers($.extend(true, [], layersData)),
            layers = [];

        for (var i = 0; i < layerNodes.length; i++) {
            layers.push(group.container.append(layerNodes[i]));
        }

        this.canvasManager.refreshMode();

        smartSlider.history.addSimple(this, this.historyDeleteLayers, this.historyAddLayers, [layersData, layers, group]);

        return layers;
    }

    MainContainer.prototype.historyDeleteLayers = function (layersData, historicalLayers, historicalGroup) {
        for (var i = 0; i < historicalLayers.length; i++) {
            historicalLayers[i].getSelf().delete();
        }
    }

    MainContainer.prototype.historyAddLayers = function (layersData, historicalLayers, historicalGroup) {
        var layers = this.addLayers(layersData, historicalGroup.getSelf());
        for (var i = 0; i < historicalLayers.length; i++) {
            historicalLayers[i].setSelf(layers[i]);
        }
    }

    MainContainer.prototype.dataToLayers = function (layers, $targetGroupContent) {
        var nodes = [];
        for (var i = 0; i < layers.length; i++) {
            switch (layers[i].type) {
                case 'group':
                    console.error('Group data to layer not implemented!');
                    //new scope.Group(this, this.mainContainer, false, layers[i].data, layers[i]);
                    break;
                case 'row':
                    nodes.push(this.buildRowNode(layers[i], $targetGroupContent));
                    break;
                case 'col':
                    nodes.push(this.buildColNode(layers[i], $targetGroupContent));
                    break;
                case 'content':
                    nodes.push(this.buildContentNode(layers[i], $targetGroupContent));
                    break;
                case 'layer':
                default:
                    nodes.push(this.buildLayerNode(layers[i], $targetGroupContent));
                    break;
            }
        }

        return nodes;
    }

    MainContainer.prototype._buildNodePrepareID = function ($layer, layerData) {
        if (layerData.id) {
            var id = $.fn.uid();

            var deferred = false;
            if (typeof this._idTranslation[layerData.id] == 'object') {
                deferred = this._idTranslation[layerData.id];
            }

            this._idTranslation[layerData.id] = id;
            layerData.id = id;
            $layer.attr('id', id);

            if (deferred) {
                deferred.resolve(layerData.id, id);
            }
        }
        if (layerData.parentid) {
            switch (typeof this._idTranslation[layerData.parentid]) {
                case 'string':
                    layerData.parentid = this._idTranslation[layerData.parentid];
                    break;
                case 'undefined':
                    this._idTranslation[layerData.parentid] = $.Deferred();
                case 'object':
                    this._idTranslation[layerData.parentid].done($.proxy(function ($_layer, originalID, newID) {
                        $_layer.data('parentid', newID);
                    }, this, $layer))
                    break;
                default:
                    layerData.parentid = '';
            }
        }
    }


    MainContainer.prototype.buildContentNode = function (layerData, $targetGroupContent) {

        var $layer = $("<div class='n2-ss-layer' data-type='content'/>"),
            $content = $("<div class='n2-ss-section-main-content n2-ss-layer-content' />").appendTo($layer);
        for (var k in layerData) {
            $layer.data(k, layerData[k]);
        }

        if ($targetGroupContent !== undefined) {
            $layer.appendTo($targetGroupContent);
        }

        this.dataToLayers(layerData.layers, $content);

        return $layer;
    }

    MainContainer.prototype.buildRowNode = function (layerData, $targetGroupContent) {

        var $layer = $("<div class='n2-ss-layer' data-type='row'/>"),
            $content = $("<div class='n2-ss-layer-row' />").appendTo($layer);

        this._buildNodePrepareID($layer, layerData);
        for (var k in layerData) {
            $layer.data(k, layerData[k]);
        }

        if ($targetGroupContent !== undefined) {
            $layer.appendTo($targetGroupContent);
        }

        this.dataToLayers(layerData.cols, $content);

        return $layer;
    }

    MainContainer.prototype.buildColNode = function (layerData, $targetGroupContent) {

        var $layer = $("<div class='n2-ss-layer' data-type='col'/>"),
            $content = $("<div class='n2-ss-layer-col n2-ss-layer-content' />").appendTo($layer);
        for (var k in layerData) {
            $layer.data(k, layerData[k]);
        }

        if ($targetGroupContent !== undefined) {
            $layer.appendTo($targetGroupContent);
        }

        this.dataToLayers(layerData.layers, $content);

        return $layer;
    }

    MainContainer.prototype.buildLayerNode = function (layerData, $targetGroupContent) {

        var $layer = $("<div class='n2-ss-layer' data-type='layer'></div>")
            .attr('style', layerData.style);

        var storedIndex = 1;
        if (layerData.zIndex) {
            storedIndex = layerData.zIndex;
        }

        this._buildNodePrepareID($layer, layerData);

        if (layerData.items !== undefined) {
            layerData.item = layerData.items[0];
            delete layerData.items;
        }

        $('<div class="n2-ss-item n2-ss-item-' + layerData.item.type + '"></div>')
            .data('item', layerData.item.type)
            .data('itemvalues', layerData.item.values)
            .appendTo($layer);

        delete layerData.style;
        delete layerData.item;
        for (var k in layerData) {
            $layer.data(k, layerData[k]);
        }

        if ($targetGroupContent !== undefined) {
            $layer.appendTo($targetGroupContent);
        }

        return $layer;
    };

    return MainContainer;
});
N2Require('Row', ['LayerContainer', 'ComponentAbstract'], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    function Row(canvasManager, group, properties) {
        this.label = n2_('Row');
        this.type = 'row';

        this._syncbgThrottled = NextendThrottle(this._syncbgThrottled, 50);

        this.innerContainer = '> .n2-ss-layer-row';

        this.columnsField = $('#layerrow-columns').data('field');

        this.refreshUI = NextendDeBounce(this.refreshUI, 100);

        scope.ComponentAbstract.prototype.constructor.call(this, canvasManager, group, properties);

        this.placement.allow('absolute');
        this.placement.allow('normal');
    }

    Row.prototype = Object.create(scope.ComponentAbstract.prototype);
    Row.prototype.constructor = Row;

    Row.prototype.addProperties = function ($layer) {

        this.createProperty('opened', 1, $layer, this);

        scope.ComponentAbstract.prototype.addProperties.call(this, $layer);
        this.createProperty('bgimage', '', $layer);
        this.createProperty('bgimagex', 50, $layer);
        this.createProperty('bgimagey', 50, $layer);
        this.createProperty('bgimageparallax', 0, $layer);
        this.createProperty('bgcolor', '00000000', $layer);
        this.createProperty('bgcolorgradient', 'off', $layer);
        this.createProperty('bgcolorgradientend', '00000000', $layer);

        this.createProperty('borderradius', 0, $layer);
        this.createProperty('boxshadow', '0|*|0|*|0|*|0|*|00000080', $layer);

        this.createProperty('fullwidth', 1, $layer);
        this.createProperty('stretch', 0, $layer);


        this.createDeviceProperty('inneralign', {desktopPortrait: 'inherit'}, $layer);
        this.createDeviceProperty('padding', {desktopPortrait: '10|*|10|*|10|*|10|*|px+'}, $layer);
        this.createDeviceProperty('gutter', {desktopPortrait: 20}, $layer);
        this.createDeviceProperty('wrapafter', {desktopPortrait: 0, mobilePortrait: 1, mobileLandscape: 1}, $layer);
    }

    Row.prototype.historyDeleteSelf = function () {
        this.delete();
    }

    Row.prototype.historyCreateSelf = function (historyGroup, preset, historyCols) {
        var newLayer = new scope.Row(this.canvasManager, historyGroup.getSelf(), {});
        newLayer.create(preset);

        this.setSelf(newLayer);

        var newCols = newLayer.container.getSortedLayers();
        for (var i = 0; i < newCols.length; i++) {
            historyCols[i].setSelf(newCols[i]);
        }
    }

    Row.prototype.create = function (preset) {
        var cb,
            _createRawRow = function (cols) {
                return $("<div class='n2-ss-layer' />").append($("<div class='n2-ss-layer-row' />").append(cols))
                    .attr('data-type', 'row');
            },
            _createRawCol = function (inner) {
                return $("<div class='n2-ss-layer' data-type='col'/>").append($("<div class='n2-ss-layer-col n2-ss-layer-content' />").append(inner));
            };
        switch (preset) {
            case '2col':
                cb = function (layer) {
                    return _createRawRow([_createRawCol(), _createRawCol()]);
                };
                break;
            case '2col-60-40':
                cb = function (layer) {
                    return _createRawRow([_createRawCol().data('colwidth', '6/10'), _createRawCol().data('colwidth', '4/10')]);
                };
                break;
            case '2col-40-60':
                cb = function (layer) {
                    return _createRawRow([_createRawCol().data('colwidth', '4/10'), _createRawCol().data('colwidth', '6/10')]);
                };
                break;
            case '2col-80-20':
                cb = function (layer) {
                    return _createRawRow([_createRawCol().data('colwidth', '8/10'), _createRawCol().data('colwidth', '2/10')]);
                };
                break;
            case '2col-20-80':
                cb = function (layer) {
                    return _createRawRow([_createRawCol().data('colwidth', '2/10'), _createRawCol().data('colwidth', '8/10')]);
                };
                break;
            case '3col':
                cb = function (layer) {
                    return _createRawRow([_createRawCol(), _createRawCol(), _createRawCol()]);
                };
                break;
            case '3col-20-60-20':
                cb = function (layer) {
                    return _createRawRow([_createRawCol().data('colwidth', '2/10'), _createRawCol().data('colwidth', '6/10'), _createRawCol().data('colwidth', '2/10')]);
                };
                break;
            case '4col':
                cb = function (layer) {
                    return _createRawRow([_createRawCol(), _createRawCol(), _createRawCol(), _createRawCol()]);
                };
                break;

            case "special":
                cb = function (layer) {
                    var $innerRow = _createRawRow([_createRawCol(), _createRawCol()]);
                    return _createRawRow([_createRawCol().data('colwidth', '1/5'), _createRawCol($innerRow).data('colwidth', '4/5')]);
                };
                break;
            default:
                cb = function (layer) {
                    return _createRawRow([_createRawCol()]);
                };
        }

        if (this.group.container.allowedPlacementMode == 'absolute') {
            this.originalProperties = $.extend({
                width: '100%',
                align: 'center',
                valign: 'top',
                top: 20
            }, this.originalProperties);
        }

        scope.ComponentAbstract.prototype.create.call(this, cb, true);

        this.initUI();

        this.container.startWithExistingNodes();

        this._syncpadding();
        this._syncinneralign();
        this._syncfullwidth();
        this._syncstretch();
        this._syncbgThrottled();
        this._syncborderradius();
        this._syncboxshadow();


        this.renderModeProperties();
        this.container.renderModeProperties();


        smartSlider.history.addSimple(this, this.historyDeleteSelf, this.historyCreateSelf, [this.group, preset, this.container.getSortedLayers()]);

        this._onReady();
    }

    Row.prototype.load = function ($layer) {

        scope.ComponentAbstract.prototype.load.call(this, $layer);

        this.initUI();

        this.container.startWithExistingNodes();

        this._syncpadding();
        this._syncinneralign();
        this._syncfullwidth();
        this._syncstretch();
        this._syncbgThrottled();
        this._syncborderradius();
        this._syncboxshadow();

        this._onReady();
    }

    Row.prototype.initUI = function () {

        this.layer.nextendCanvasItem({
            canvasUIManager: this.canvasManager.mainContainer.canvasUIManager,
            layer: this,
            $layer: this.layer
        });

        this.layer.on({
            mousedown: $.proxy(nextend.context.setMouseDownArea, nextend.context, 'layerClicked'),
            click: $.proxy(function (e) {
                if (!nextend.shouldPreventMouseUp && this.canvasManager.preventActivationBubbling()) {
                    this.activate(e);
                }
            }, this),
            dblclick: $.proxy(function (e) {
                e.stopPropagation();
                $('[data-tab="row"]').trigger('click');
            }, this)
        });

        this.$row.nextendSpacing({
            handles: 'n, s, e, w',
            start: $.proxy(function (e, ui) {
                smartSlider.positionDisplay.show('Spacing');
            }, this),
            spacing: $.proxy(function (e, ui) {
                var html = '';
                for (var k in ui.changed) {
                    html += 'Padding ' + k + ': ' + ui.changed[k] + 'px<br>';
                }
                smartSlider.positionDisplay.update(e, 'Spacing', html);
            }, this),
            stop: $.proxy(this.____makeLayerResizeableStop, this),
        });

        this.$row.nextendColumns({
            columns: '1',
            gutter: this.getGutter(),
            start: $.proxy(function (e, ui) {
                smartSlider.positionDisplay.show('Columns');
            }, this),
            colwidth: $.proxy(function (e, ui) {
                this.updateColumnWidth(ui.currentPercent);

                smartSlider.positionDisplay.update(e, 'Columns', Math.round(ui.currentPercent[ui.index] * 100) + '% &mdash; ' + Math.round(ui.currentPercent[ui.index + 1] * 100) + '%');


            }, this),
            stop: $.proxy(function (e, ui) {
                smartSlider.positionDisplay.hide('Columns');

                this.setRealColsWidth(ui.currentFractions);
            }, this)
        });

        this.$row.sortable({
            distance: 10,
            tolerance: 'pointer',
            forceHelperSize: true,
            forcePlaceholderSize: true,
            items: '> .n2-ss-layer',
            handle: " > .n2-ss-layer-ui-label-container > .n2-ss-layer-ui-label-self",
            start: $.proxy(function (e, ui) {

                var parts = this.getColumns().split('+');

                ui.placeholder.css({
                    width: ((new Fraction(parts[ui.item.data('layerObject').getIndex()])).valueOf() * 100) + '%',
                    height: ui.helper.height(),
                    visibility: 'visible',
                    marginRight: this.getGutter() + 'px',
                    marginTop: this.getGutter() + 'px'
                });
                if (ui.helper.hasClass('n2-ss-last-in-row')) {
                    ui.placeholder.addClass('n2-ss-last-in-row');
                }

                ui.placeholder.css('order', ui.helper.css('order'));

                ui.placeholder.attr('data-r', ui.helper.attr('data-r'));

            }, this),
            stop: $.proxy(function (e, ui) {

                var layer = ui.item.data('layerObject'),
                    prevLayer = ui.item.prevAll('.n2-ss-layer, .n2-ss-layer-group').first().data('layerObject');
                this.$row.sortable('cancel');

                var oldIndex = layer.getIndex(),
                    newIndex = 0;
                if (prevLayer) {
                    newIndex = prevLayer.getIndex();
                    if (newIndex < oldIndex) {
                        newIndex++;
                    }
                }
                if (oldIndex != newIndex) {
                    this.moveCol(oldIndex, newIndex);
                }
            }, this)
        });
    }

    Row.prototype.____makeLayerResizeableStop = function (event, ui) {
        smartSlider.positionDisplay.hide('Spacing');
        var padding = this.getPadding().split('|*|'),
            ratioH = 1,
            ratioV = 1;

        if (padding[padding.length - 1] == 'px+' && Math.abs(parseFloat(this.layer.css('fontSize')) - this.baseSize) > 1) {
            ratioH = this.canvasManager.getResponsiveRatio('h');
            ratioV = this.canvasManager.getResponsiveRatio('v');
        }

        for (var k in ui.changed) {
            var value = ui.changed[k];
            switch (k) {
                case 'top':
                    padding[0] = Math.round(value / ratioV);
                    break;
                case 'right':
                    padding[1] = Math.round(value / ratioH);
                    break;
                case 'bottom':
                    padding[2] = Math.round(value / ratioV);
                    break;
                case 'left':
                    padding[3] = Math.round(value / ratioH);
                    break;
            }
        }
        this.setProperty('padding', padding.join('|*|'));
        $('#layerrow-padding').data('field').insideChange(padding.join('|*|'));
    };

    Row.prototype._createLayer = function () {
        return $('<div class="n2-ss-layer"><div class="n2-ss-layer-row"></div></div>')
            .attr('data-type', this.type);
    }

    Row.prototype.historyDeleteCol = function (historicalRow, historicalCol) {
        historicalCol.getSelf().delete();
    }

    Row.prototype.historyCreateCol = function (historicalRow, historicalCol) {
        var newCol = historicalRow.getSelf().createCol();
        historicalCol.setSelf(newCol);
    }

    Row.prototype.createCol = function () {

        var col = new scope.Col(this.canvasManager, this, {});
        smartSlider.history.addSimple(this, this.historyDeleteCol, this.historyCreateCol, [this, col]);
        col.create();
        if (this.isReady()) {
            this.placement.updatePosition();
        }

        return col;
    }

    Row.prototype.createRow = function () {
        this.$row = this.layer.find('.n2-ss-layer-row:first');
        this.container = new scope.LayerContainer(this, $('<ul class="n2-list n2-h4 n2-list-orderable" />'), 'default', '> .n2-ss-layer', ['col']);
        this.container.setLayerContainerElement(this.$row);

        var status = $('<div class="n2-ss-layer-status"></div>'),
            remove = $('<div class="n2-button n2-button-icon n2-button-m n2-button-m-narrow" data-n2tip="' + n2_('Delete layer') + '"><i class="n2-i n2-i-delete n2-i-grey-opacity"></i></div>').on('click', $.proxy(this.delete, this)),
            duplicate = $('<div class="n2-button n2-button-icon n2-button-m n2-button-m-narrow" data-n2tip="' + n2_('Duplicate layer') + '"><i class="n2-i n2-i-duplicate n2-i-grey-opacity"></i></div>').on('click', $.proxy(function () {
                this.duplicate(true, false)
            }, this));

        $('<a href="#" class="n2-ss-sc-hide n2-button n2-button-icon n2-button-m"><i class="n2-i n2-i-eye"></i></a>').appendTo(status).on('click', $.proxy(function (e) {
            e.preventDefault();
            if (this.status == scope.ComponentAbstract.STATUS.HIDDEN) {
                this.setStatusNormal();
            } else {
                this.changeStatus(scope.ComponentAbstract.STATUS.HIDDEN);
            }
        }, this));

        this._createLayerListRow([
            $('<div class="n2-actions-left"></div>').append(status),
            $('<div class="n2-actions"></div>').append(duplicate).append(remove)
        ]).addClass('n2-ss-layer-row-row');

        this.openerElement = $('<a href="#" class="n2-ss-layer-icon n2-button n2-button-icon n2-button-m"><i class="n2-i n2-i-row"></i></a>').insertBefore(this.layerTitleSpan)
            .on('click', $.proxy(this.switchOpened, this));


        this.container.$ul.appendTo(this.layerRow);

        this.readyDeferred.done($.proxy(this._syncopened, this));
    }
    Row.prototype.activate = function () {
        scope.PluginActivatable.prototype.activate.apply(this, arguments);

        this.columnsField.setRow(this);
    }

    Row.prototype.switchOpened = function (e) {
        e.preventDefault();
        if (this.getProperty('opened')) {
            this.setProperty('opened', 0);
        } else {
            this.setProperty('opened', 1);
        }
    };

    Row.prototype._syncopened = function () {
        if (this.getProperty('opened')) {
            this.openerElement.removeClass('n2-closed');
            this.container.$ul.css('display', '');

            this.layer.triggerHandler('opened');
        } else {
            this.openerElement.addClass('n2-closed');
            this.container.$ul.css('display', 'none');

            this.layer.triggerHandler('closed');
        }
    };

    Row.prototype.getColumns = function () {
        var layers = this.container.getSortedLayers(),
            columns = [];
        for (var i = 0; i < layers.length; i++) {
            columns.push(layers[i].getProperty('colwidth'));
        }
        return columns.join('+');
    }

    Row.prototype.getColumnsOrdered = function () {
        var layers = this.getOrderedColumns(),
            columns = [];
        for (var i = 0; i < layers.length; i++) {
            columns.push(layers[i].getProperty('colwidth'));
        }
        return columns.join('+');
    }

    Row.prototype._synccolumns = function () {
        var layers = this.container.getSortedLayers();
        for (var i = 0; i < layers.length; i++) {
            layers[i]._synccolwidth();
        }
        this.update();
    }

    Row.prototype.getPadding = function () {
        return this.getProperty('padding');
    }

    Row.prototype._syncpadding = function () {
        var padding = this.getPadding().split('|*|'),
            unit = padding.pop(),
            baseSize = this.baseSize;

        if (unit == 'px+' && baseSize > 0) {
            unit = 'em';
            for (var i = 0; i < padding.length; i++) {
                padding[i] = parseInt(padding[i]) / baseSize;
            }
        }

        var css = padding.join(unit + ' ') + unit;
        this.$row.css('padding', css);
        this.$row.nextendSpacing('option', 'current', css);

        this.update();
    }

    Row.prototype.getGutter = function () {
        return this.getProperty('gutter');
    }

    Row.prototype._syncgutter = function () {
        var gutterValue = this.getGutter() + 'px',
            cols = this.container.getSortedLayers();
        if (cols.length > 0) {
            for (var i = cols.length - 1; i >= 0; i--) {
                cols[i].layer
                    .css('marginRight', gutterValue)
                    .css('marginTop', gutterValue);
            }
        }
        this.$row.nextendColumns('option', 'gutter', this.getGutter());
        this.update();
    }

    Row.prototype._syncwrapafter = function () {
        var wrapAfter = parseInt(this.getProperty('wrapafter')),
            columns = this.getOrderedColumns(),
            isWrapped = false;

        for (var i = columns.length - 1; i >= 0; i--) {
            if (!columns[i].showsOnCurrent) {
                columns.splice(i, 1);
            }
        }

        var length = columns.length;

        if (wrapAfter > 0 && wrapAfter < length) {
            isWrapped = true;
        }

        this.$row.find('> .n2-ss-row-break').remove();

        this.$row.toggleClass('n2-ss-row-wrapped', isWrapped);

        if (isWrapped) {
            for (var i = 0; i < length; i++) {
                var row = parseInt(i / wrapAfter);
                columns[i].layer.attr('data-r', row);
                if ((i + 1) % wrapAfter == 0 || i == length - 1) {
                    var order = columns[i].getProperty('order');
                    if (order == 0) order = 10;
                    $('<div class="n2-ss-row-break"/>')
                        .css('order', order)
                        .insertAfter(columns[i].layer.addClass('n2-ss-last-in-row'));
                } else {
                    columns[i].layer.removeClass('n2-ss-last-in-row');
                }
            }
        } else {
            for (var i = 0; i < length; i++) {
                columns[i].layer
                    .removeClass('n2-ss-last-in-row')
                    .attr('data-r', 0);
            }
            if (columns.length > 0) {
                columns[length - 1].layer.addClass('n2-ss-last-in-row');
            } else {
                console.error('The row does not have col.');
            }
        }

        this.update();
    }

    Row.prototype.getOrderedColumns = function () {
        return this.container.getSortedLayers().sort(function (a, b) {
            return a.getRealOrder() - b.getRealOrder();
        });
    }

    Row.prototype.getInnerAlign = function () {
        return this.getProperty('inneralign');
    }

    Row.prototype._syncinneralign = function () {
        this.layer.attr('data-csstextalign', this.getInnerAlign());
    }

    Row.prototype._syncfullwidth = function () {
        this.layer.toggleClass('n2-ss-autowidth', this.getProperty('fullwidth') == 0);
    }

    Row.prototype._syncstretch = function () {
        this.layer.toggleClass('n2-ss-stretch-layer', this.getProperty('stretch') == 1);
    }

    Row.prototype._syncborderradius = function () {
        this.$row.css('border-radius', this.getProperty('borderradius') + 'px');
    }

    Row.prototype._syncboxshadow = function () {
        var boxShadow = this.getProperty('boxshadow').split('|*|');
        if ((boxShadow[0] != 0 || boxShadow[1] != 0 || boxShadow[2] != 0 || boxShadow[3] != 0) && N2Color.hex2alpha(boxShadow[4]) != 0) {
            this.$row.css('box-shadow', boxShadow[0] + 'px ' + boxShadow[1] + 'px ' + boxShadow[2] + 'px ' + boxShadow[3] + 'px ' + N2Color.hex2rgbaCSS(boxShadow[4]));
        } else {
            this.$row.css('box-shadow', '');
        }
    }

    Row.prototype._syncbgimage =
        Row.prototype._syncbgimagex =
            Row.prototype._syncbgimagey =
                Row.prototype._syncbgimageparallax =
                    Row.prototype._syncbgcolor =
                        Row.prototype._syncbgcolorgradient =
                            Row.prototype._syncbgcolorgradientend = function () {
                                this._syncbgThrottled();
                            }

    Row.prototype._syncbgThrottled = function () {
        var background = '',
            image = this.getProperty('bgimage');
        if (image != '') {
            var x = parseInt(this.getProperty('bgimagex'));
            if (!isFinite(x)) {
                x = 50;
            }
            var y = parseInt(this.getProperty('bgimagey'));
            if (!isFinite(y)) {
                y = 50;
            }
            background += 'url("' + nextend.imageHelper.fixed(image) + '") ' + x + '% ' + y + '% / cover no-repeat' + (this.getProperty('bgimageparallax') == 1 ? ' fixed' : '');
        }
        var color = this.getProperty('bgcolor'),
            gradient = this.getProperty('bgcolorgradient'),
            colorend = this.getProperty('bgcolorgradientend');

        if (N2Color.hex2alpha(color) != 0 || (gradient != 'off' && N2Color.hex2alpha(colorend) != 0 )) {
            var after = '';
            if (background != '') {
                after = ',' + background;
            }
            switch (gradient) {
                case 'horizontal':
                    this.$row
                        .css('background', '-moz-linear-gradient(left, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after)
                        .css('background', ' -webkit-linear-gradient(left, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after)
                        .css('background', 'linear-gradient(to right, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after);
                    break;
                case 'vertical':
                    this.$row
                        .css('background', '-moz-linear-gradient(top, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after)
                        .css('background', ' -webkit-linear-gradient(top, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after)
                        .css('background', 'linear-gradient(to bottom, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after);
                    break;
                case 'diagonal1':
                    this.$row
                        .css('background', '-moz-linear-gradient(45deg, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after)
                        .css('background', ' -webkit-linear-gradient(45deg, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after)
                        .css('background', 'linear-gradient(45deg, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after);
                    break;
                case 'diagonal2':
                    this.$row
                        .css('background', '-moz-linear-gradient(-45deg, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after)
                        .css('background', ' -webkit-linear-gradient(-45deg, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after)
                        .css('background', 'linear-gradient(-45deg, ' + N2Color.hex2rgbaCSS(color) + ' 0%,' + N2Color.hex2rgbaCSS(colorend) + ' 100%)' + after);
                    break;
                case 'off':
                default:
                    if (background != '') {
                        background = "linear-gradient(" + N2Color.hex2rgbaCSS(color) + ", " + N2Color.hex2rgbaCSS(color) + ")," + background;
                    } else {
                        background += N2Color.hex2rgbaCSS(color);
                    }
                    this.$row.css('background', background);
                    break;
            }
        } else {
            this.$row.css('background', background);
        }
    };

    Row.prototype.getData = function (params) {
        var data = scope.ComponentAbstract.prototype.getData.call(this, params);

        if (params.itemsIncluded) {
            data.cols = this.container.getData(params);
        }
        return data;
    };

    /**
     * Example: Cols: 0 - 1 - 2
     * oldIndex: 0, newIndex: 2 => 1 - 2 - 0 Moves the col #0 to after the #2 col
     * @param oldIndex
     * @param newIndex
     */
    Row.prototype.moveCol = function (oldIndex, newIndex) {

        if (this.getMode() == 'desktopPortrait') {
            this._moveCol(oldIndex, newIndex);

            var task = smartSlider.history.addValue(this, this.historyMoveCol, []);
            if (task) {
                task.setValues({
                    oldIndex: newIndex,
                    newIndex: oldIndex
                }, {
                    oldIndex: oldIndex,
                    newIndex: newIndex
                });
            }
        } else {
            var orderedColumns = this.getOrderedColumns(),
                colToMove = orderedColumns[oldIndex];
            orderedColumns.splice(oldIndex, 1);
            orderedColumns.splice(newIndex, 0, colToMove);
            for (var i = 0; i < orderedColumns.length; i++) {
                orderedColumns[i].setProperty('order', i + 1);
            }
            this.refreshUI();
        }
    }
    Row.prototype._moveCol = function (oldIndex, newIndex) {

        var layers = this.container.getSortedLayers();
        if (newIndex > oldIndex) {
            newIndex++;
        }
        this.container.insertLayerAt(layers[oldIndex], newIndex);

        this.refreshUI();
    }

    Row.prototype.historyMoveCol = function (data) {

        this._moveCol(data.oldIndex, data.newIndex);
    }

    Row.prototype.setColsWidth = function (fractions) {
        var cols = this.container.getSortedLayers();
        for (var i = 0; i < fractions.length; i++) {
            cols[i].setProperty('colwidth', fractions[i].toFraction());
        }
        this.update();

        this.refreshUI();
    }

    Row.prototype.setRealColsWidth = function (fractions) {
        var cols = this.getOrderedColumns();
        for (var i = 0; i < fractions.length; i++) {
            cols[i].setProperty('colwidth', fractions[i].toFraction());
        }
        this.update();

        this.refreshUI();
    }

    Row.prototype.updateColumnWidth = function (widths) {
        var layers = this.getOrderedColumns();
        for (var i = 0; i < layers.length; i++) {
            layers[i].layer.css('width', (widths[i] * 100) + '%');
        }
        this.update();
    }

    Row.prototype.activateColumn = function (index, e) {
        this.container.getSortedLayers()[index].activate(e);
    }

    Row.prototype.onChildCountChange = function () {
        if (!this.isDeleted && !this.isDeleteStarted) {
            var layers = this.container.getSortedLayers(),
                colLength = layers.length;
            if (colLength) {
                var currentColumns = this.getColumns().split('+'),
                    add = 0;
                for (var i = 0; i < currentColumns.length; i++) {
                    add = (new Fraction(currentColumns[i])).add(add);
                }
                if (add.valueOf() != 1) {
                    for (var i = 0; i < colLength; i++) {
                        layers[i].setProperty('colwidth', "1/" + colLength);
                    }
                } else {

                    for (var i = 0; i < colLength; i++) {
                        layers[i]._synccolwidth();
                    }
                }
                this.refreshUI();
            }
            this._syncgutter();
            this._syncwrapafter();
        }
    }

    Row.prototype.renderModeProperties = function (isReset) {
        scope.ComponentAbstract.prototype.renderModeProperties.call(this, isReset);

        this._syncpadding();
        this._syncinneralign();
        this._syncwrapafter();
        this._syncgutter();

        if (this.isActive) {
            this.columnsField.setRow(this);
        }
    }

    Row.prototype.hightlightStructure = function (hideInterval) {

        hideInterval = hideInterval || 4000;
        if (this.isStructureHighlighted) {
            clearTimeout(this.isStructureHighlighted);
            this.isStructureHighlighted = false;
        }
        this.layer.addClass('n2-highlight-structure');
        this.isStructureHighlighted = setTimeout($.proxy(function () {
            if (!this.isDeleted) {
                this.layer.removeClass('n2-highlight-structure');
            }
        }, this), hideInterval);
    }

    Row.prototype.refreshUI = function () {
        if (!this.isDeleteStarted) {
            if (this.isActive) {
                this.columnsField.setRow(this);
            }
            this._syncwrapafter();
            this.$row.nextendColumns('option', 'columns', this.getColumnsOrdered());
        }
    }

    Row.prototype.getDroppable = function () {
        return {
            $container: this.$row,
            layer: this,
            placement: 'normal',
            axis: 'x'
        }
    }

    Row.prototype.getLLDroppable = function (layer) {
        switch (layer.type) {
            case 'col':
                if (layer.group == this) {
                    return {
                        $container: this.container.$ul,
                        layer: this
                    };
                }
                break;
        }
        return false;
    }

    Row.prototype.getContents = function () {
        return this.$row;
    }

    return Row;
});
N2Require('ComponentSettings', [], ['smartSlider'], function ($, scope, smartSlider, undefined) {
    "use strict";

    function ComponentSettings(canvasManager) {
        this.componentType = 'undefined';
        this.placementType = 'undefined';

        $('html').attr('data-component', '');
        $('html').attr('data-placement', '');

        this.currentForm = {};

        this.forms = {
            'undefined': null,
            placement: {
                absolute: {},
                normal: {},
                default: {}
            },
            component: {
                content: {},
                layer: {},
                row: {},
                col: {},
                group: {}
            },
            global: {
                id: $('#layerid'),
                desktopPortrait: $('#layershow-desktop-portrait'),
                desktopLandscape: $('#layershow-desktop-landscape'),
                tabletPortrait: $('#layershow-tablet-portrait'),
                tabletLandscape: $('#layershow-tablet-landscape'),
                mobilePortrait: $('#layershow-mobile-portrait'),
                mobileLandscape: $('#layershow-mobile-landscape'),
                class: $('#layerclass'),
                generatorvisible: $('#layergenerator-visible'),
                crop: $('#layercrop'),
                rotation: $('#layerrotation'),
                parallax: $('#layerparallax'),
                fontsize: $('#layerfont-size'),
                adaptivefont: $('#layeradaptive-font'),
                mouseenter: $('#layeronmouseenter'),
                click: $('#layeronclick'),
                mouseleave: $('#layeronmouseleave'),
                play: $('#layeronplay'),
                pause: $('#layeronpause'),
                stop: $('#layeronstop')
            }
        };
        this.canvasManager = canvasManager;


        var responsive = smartSlider.frontend.responsive;
        if (!responsive.enabled('desktop', 'Landscape')) {
            this.forms.global.desktopLandscape.closest('.n2-mixed-group').css('display', 'none');
        }
        if (!responsive.enabled('tablet', 'Portrait')) {
            this.forms.global.tabletPortrait.closest('.n2-mixed-group').css('display', 'none');
        }
        if (!responsive.enabled('tablet', 'Landscape')) {
            this.forms.global.tabletLandscape.closest('.n2-mixed-group').css('display', 'none');
        }
        if (!responsive.enabled('mobile', 'Portrait')) {
            this.forms.global.mobilePortrait.closest('.n2-mixed-group').css('display', 'none');
        }
        if (!responsive.enabled('mobile', 'Landscape')) {
            this.forms.global.mobileLandscape.closest('.n2-mixed-group').css('display', 'none');
        }

        this.forms.placement.absolute = {
            parentid: $('#layerparentid'),
            parentalign: $('#layerparentalign'),
            parentvalign: $('#layerparentvalign'),
            left: $('#layerleft'),
            top: $('#layertop'),
            responsiveposition: $('#layerresponsive-position'),
            width: $('#layerwidth'),
            height: $('#layerheight'),
            responsivesize: $('#layerresponsive-size'),
            align: $('#layeralign'),
            valign: $('#layervalign'),
        };

        this.forms.placement.normal = {
            margin: $('#layernormal-margin'),
            height: $('#layernormal-height'),
            maxwidth: $('#layernormal-maxwidth'),
            selfalign: $('#layernormal-selfalign'),
        };

        this.forms.component.content = {
            maxwidth: $('#layercontent-maxwidth'),
            selfalign: $('#layercontent-selfalign'),
            padding: $('#layercontent-padding'),
            inneralign: $('#layercontent-inneralign'),
            verticalalign: $('#layercontent-verticalalign'),
            bgcolor: $('#layercontent-background-color'),
            bgimage: $('#layercontent-background-image'),
            bgimagex: $('#layercontent-background-focus-x'),
            bgimagey: $('#layercontent-background-focus-y'),
            bgimageparallax: $('#layercontent-background-parallax'),
            bgcolorgradient: $('#layercontent-background-gradient'),
            bgcolorgradientend: $('#layercontent-background-color-end'),
            opened: $('#layercontent-opened')
        }

        this.forms.component.row = {
            padding: $('#layerrow-padding'),
            gutter: $('#layerrow-gutter'),
            fullwidth: $('#layerrow-fullwidth'),
            stretch: $('#layerrow-stretch'),
            wrapafter: $('#layerrow-wrap-after'),
            inneralign: $('#layerrow-inneralign'),
            bgimage: $('#layerrow-background-image'),
            bgimagex: $('#layerrow-background-focus-x'),
            bgimagey: $('#layerrow-background-focus-y'),
            bgimageparallax: $('#layerrow-background-parallax'),
            bgcolor: $('#layerrow-background-color'),
            bgcolorgradient: $('#layerrow-background-gradient'),
            bgcolorgradientend: $('#layerrow-background-color-end'),
            borderradius: $('#layerrow-border-radius'),
            boxshadow: $('#layerrow-boxshadow'),
            opened: $('#layerrow-opened')
        }

        this.forms.component.col = {
            maxwidth: $('#layercol-maxwidth'),
            padding: $('#layercol-padding'),
            inneralign: $('#layercol-inneralign'),
            verticalalign: $('#layercol-verticalalign'),
            bgcolor: $('#layercol-background-color'),
            bgimage: $('#layercol-background-image'),
            bgimagex: $('#layercol-background-focus-x'),
            bgimagey: $('#layercol-background-focus-y'),
            bgimageparallax: $('#layercol-background-parallax'),
            bgcolorgradient: $('#layercol-background-gradient'),
            bgcolorgradientend: $('#layercol-background-color-end'),
            borderradius: $('#layercol-border-radius'),
            boxshadow: $('#layercol-boxshadow'),
            borderwidth: $('#layercol-border-width'),
            borderstyle: $('#layercol-border-style'),
            bordercolor: $('#layercol-border-color'),
            opened: $('#layercol-opened'),
            colwidth: $('#layercol-colwidth'),
            order: $('#layercol-order'),
        }
    }

    ComponentSettings.prototype.changeActiveComponent = function (layer, componentType, placementType, properties) {
        this.currentLayer = layer;

        if (this.componentType != componentType) {

            $('html').attr('data-component', componentType);
            switch (componentType) {
                case 'content':
                    $('#n2-tabbed-slide-editor-settings').data('pane').showTabs(['content', 'animations', 'position']);
                    break;
                case 'layer':
                    $('#n2-tabbed-slide-editor-settings').data('pane').showTabs(['item', 'style', 'animations', 'position']);
                    break;
                case 'group':
                    $('#n2-tabbed-slide-editor-settings').data('pane').showTabs(['group', 'animations']);
                    break;
                case 'row':
                    $('#n2-tabbed-slide-editor-settings').data('pane').showTabs(['row', 'animations', 'position']);
                    break;
                case 'col':
                    $('#n2-tabbed-slide-editor-settings').data('pane').showTabs(['column', 'animations', 'position']);
                    break;

            }
            this.componentType = componentType;
        }


        this.changeActiveComponentPlacement(placementType);
        this.syncFields(properties);
    }

    ComponentSettings.prototype.changeActiveComponentPlacement = function (placementType, properties) {

        if (this.placementType != placementType) {
            $('html').attr('data-placement', placementType);
            this.placementType = placementType;
        }

        this.syncFields(properties);
    }

    ComponentSettings.prototype.syncFields = function (properties) {
        if (typeof properties == 'object') {
            this.currentForm = $.extend({}, this.forms.global, this.forms.component[this.componentType], this.forms.placement[this.placementType]);

            for (var name in properties) {
                if (typeof properties[name] !== undefined) {
                    this.updateField(name, properties[name]);
                } else {
                    console.error('Value is undefined for: ' + name);
                }
            }

            for (var k in this.currentForm) {
                this.currentForm[k].off('.layeroptions').on('outsideChange.layeroptions', $.proxy(this.activeComponentPropertyChanged, this, k));
            }
        }
    }

    ComponentSettings.prototype.onUpdateField = function (e, name, value) {
        if (e.target == this.currentLayer) {
            this.updateField(name, value);
        }
    }

    ComponentSettings.prototype.updateField = function (name, value) {
        if (typeof this.currentLayer['formSet' + name] === 'function') {
            this.currentLayer['formSet' + name](this, value);
        } else {
            if (this.currentForm[name] !== undefined) {
                var field = this.currentForm[name].data('field');
                if (field !== undefined) {
                    field.insideChange(value);
                }
            } else {
                console.error('field not available: ' + name + ':' + value, this.currentForm);
            }
        }
    }

    ComponentSettings.prototype.activeComponentPropertyChanged = function (name, e) {
        if (this.currentLayer && !this.currentLayer.isDeleted) {
            //@todo  batch? throttle
            var value = this.currentForm[name].val();
            this.currentLayer.setProperty(name, value, 'manager');
        } else {
            var field = this.currentForm[name].data('field');
            if (typeof field !== 'undefined' && field !== null) {
                field.insideChange('');
            }
        }
    };

    ComponentSettings.prototype.startFeatures = function () {
        this.layerFeatures = new scope.LayerFeatures(this.forms.placement.absolute, this.canvasManager);

        var globalAdaptiveFont = $('#n2-ss-layer-adaptive-font').on('click', $.proxy(function () {
            this.currentForm.adaptivefont.data('field').onoff.trigger('click');
        }, this));

        this.forms.global.adaptivefont.on('nextendChange', $.proxy(function () {
            if (this.currentForm.adaptivefont.val() == 1) {
                globalAdaptiveFont.addClass('n2-active');
            } else {
                globalAdaptiveFont.removeClass('n2-active');
            }
        }, this));


        new N2Classes.FormElementNumber("n2-ss-layer-font-size", -Number.MAX_VALUE, Number.MAX_VALUE);
        new N2Classes.FormElementAutocompleteSlider("n2-ss-layer-font-size", {
            min: 50,
            max: 300,
            step: 5
        });

        var globalFontSize = $('#n2-ss-layer-font-size').on('outsideChange', $.proxy(function () {
            var value = parseInt(globalFontSize.val());
            this.currentForm.fontsize.val(value).trigger('change');
        }, this));

        this.forms.global.fontsize.on('nextendChange', $.proxy(function () {
            globalFontSize.data('field').insideChange(this.forms.global.fontsize.val());
        }, this));
    }

    return ComponentSettings;
});
N2Require('BgAnimationManager', [], [], function ($, scope, undefined) {

    function BgAnimationManager() {
        this.type = 'backgroundanimation';
        NextendVisualManagerMultipleSelection.prototype.constructor.apply(this, arguments);
    };

    BgAnimationManager.prototype = Object.create(NextendVisualManagerMultipleSelection.prototype);
    BgAnimationManager.prototype.constructor = BgAnimationManager;

    BgAnimationManager.prototype.loadDefaults = function () {
        NextendVisualManagerMultipleSelection.prototype.loadDefaults.apply(this, arguments);
        this.type = 'backgroundanimation';
        this.labels = {
            visual: 'Background animation',
            visuals: 'Background animations'
        };
    };

    BgAnimationManager.prototype.initController = function () {
        return new scope.BgAnimationEditor();
    };

    BgAnimationManager.prototype.createVisual = function (visual, set) {
        return new NextendVisualWithSetRowMultipleSelection(visual, set, this);
    };

    return BgAnimationManager;
});

N2Require('BgAnimationEditor', [], [], function ($, scope, undefined) {

    function BgAnimationEditor() {
        this.parameters = {
            shiftedBackgroundAnimation: 0
        };
        NextendVisualEditorController.prototype.constructor.call(this, false);

        this.bgAnimationElement = $('.n2-bg-animation');
        this.slides = $('.n2-bg-animation-slide');
        this.bgImages = $('.n2-bg-animation-slide-bg');
        NextendTween.set(this.bgImages, {
            rotationZ: 0.0001
        });

        this.directionTab = new N2Classes.FormElementRadio('n2-background-animation-preview-tabs', ['0', '1']);
        this.directionTab.element.on('nextendChange.n2-editor', $.proxy(this.directionTabChanged, this));

        if (!nModernizr.csstransforms3d || !nModernizr.csstransformspreserve3d) {
            nextend.notificationCenter.error('Background animations are not available in your browser. It works if the <i>transform-style: preserve-3d</i> feature available. ')
        }
    };

    BgAnimationEditor.prototype = Object.create(NextendVisualEditorController.prototype);
    BgAnimationEditor.prototype.constructor = BgAnimationEditor;

    BgAnimationEditor.prototype.loadDefaults = function () {
        NextendVisualEditorController.prototype.loadDefaults.call(this);
        this.type = 'backgroundanimation';
        this.current = 0;
        this.animationProperties = false;
        this.direction = 0;
    };

    BgAnimationEditor.prototype.get = function () {
        return null;
    };

    BgAnimationEditor.prototype.load = function (visual, tabs, mode, preview) {
        this.lightbox.addClass('n2-editor-loaded');
    };

    BgAnimationEditor.prototype.setTabs = function (labels) {

    };

    BgAnimationEditor.prototype.directionTabChanged = function () {
        this.direction = parseInt(this.directionTab.element.val());
    };

    BgAnimationEditor.prototype.start = function () {
        if (this.animationProperties) {
            if (!this.timeline) {
                this.next();
            } else {
                this.timeline.play();
            }
        }
    };

    BgAnimationEditor.prototype.pause = function () {
        if (this.timeline) {
            this.timeline.pause();
        }
    };

    BgAnimationEditor.prototype.next = function () {
        this.timeline = new NextendTimeline({
            paused: true,
            onComplete: $.proxy(this.ended, this)
        });
        var current = this.bgImages.eq(this.current),
            next = this.bgImages.eq(1 - this.current);

        if (nModernizr.csstransforms3d && nModernizr.csstransformspreserve3d) {
            this.currentAnimation = new N2Classes['SmartSliderBackgroundAnimation' + this.animationProperties.type](this, current, next, this.animationProperties, 1, this.direction);

            this.slides.eq(this.current).css('zIndex', 2);
            this.slides.eq(1 - this.current).css('zIndex', 3);

            this.timeline.to(this.slides.eq(this.current), 0.5, {
                opacity: 0
            }, this.currentAnimation.getExtraDelay());

            this.timeline.to(this.slides.eq(1 - this.current), 0.5, {
                opacity: 1
            }, this.currentAnimation.getExtraDelay());


            this.currentAnimation.postSetup();

        } else {

            this.timeline.to(this.slides.eq(this.current), 1.5, {
                opacity: 0
            }, 0);

            this.timeline.to(this.slides.eq(1 - this.current), 1.5, {
                opacity: 1
            }, 0);
        }
        this.current = 1 - this.current;
        this.timeline.play();
    };

    BgAnimationEditor.prototype.ended = function () {
        if (this.currentAnimation) {
            this.currentAnimation.ended();
        }
        this.next();
    };

    BgAnimationEditor.prototype.setAnimationProperties = function (animationProperties) {
        var lastAnimationProperties = this.animationProperties;
        this.animationProperties = animationProperties;
        if (!lastAnimationProperties) {
            this.next();
        }
    };

    return BgAnimationEditor;
});
