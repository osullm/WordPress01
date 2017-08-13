(function ($) {
    "use strict";

    $.widget("ui.nextendCanvas", {

        widgetEventPrefix: "canvas",
        ready: false,
        options: {
            mainContainer: null
        },
        display: false,
        _create: function () {

        },
        _mouseCapture: function (itemOptions, event, overrideHandle) {
            if ($(event.target).closest(".ui-resizable-handle, .ui-customresizable-handle, .ui-spacing-handle").length > 0) {
                return false;
            }
            return true;
        },
        _mouseStart: function (itemOptions, event, overrideHandle, noActivation) {

            $('body').addClass('n2-ss-move-layer');

            this.dragDeferred = $.Deferred();
            this.options.mainContainer.canvasManager.layerWindow.hideWithDeferred(this.dragDeferred);

            this.context = {
                placeholder: $('<div class="n2-ss-layer-placeholder" />'),
                mouse: {
                    offset: {
                        left: event.pageX,
                        top: event.pageY
                    }
                },
                canvas: {
                    offset: this.options.mainContainer.layer.offset(),
                    size: {
                        width: this.options.mainContainer.layer.outerWidth(),
                        height: this.options.mainContainer.layer.outerHeight()
                    }
                },
                $layer: itemOptions.$layer
            };

            var css = {
                position: 'absolute',
                right: 'auto',
                bottom: 'auto'
            };

            if (!itemOptions.layer) {
                this.startMode = 'create';

                this.context.layer = {
                    offset: {
                        left: 0,
                        top: 0
                    }
                };

                itemOptions.$layer.appendTo('body');
            } else {
                this.startMode = itemOptions.layer.placement.getType();

                this.context.layer = {
                    offset: itemOptions.$layer.offset()
                };

                this.context.originalIndex = itemOptions.layer.getIndex();

                if (this.startMode == 'normal') {

                    css.width = itemOptions.$layer.width();
                    //css.height = itemOptions.$layer.height();

                    itemOptions.$layer.appendTo(this.options.mainContainer.layer);
                }
            }

            itemOptions.$layer
                .addClass('n2-canvas-item-drag')
                .css(css);

            this._cacheMargins(itemOptions.$layer);

            this.context.size = {
                width: itemOptions.$layer.outerWidth(),
                height: itemOptions.$layer.outerHeight()
            }


            this.context.droppables = this.options.mainContainer.getDroppables(itemOptions.layer);

            this._cacheContainers();

            this._trigger("start", event, {
                layer: itemOptions.layer,
                mode: this.startMode
            });

            this._mouseDrag(itemOptions, event);
        },
        _mouseDrag: function (itemOptions, event) {
            var position;
            if (this.startMode == 'create') {
                position = {
                    top: event.pageY - this.context.canvas.offset.top - 20,
                    left: event.pageX - this.context.canvas.offset.left - 20
                };
            } else {
                position = {
                    top: this.context.layer.offset.top - this.context.canvas.offset.top + event.pageY - this.context.mouse.offset.top,
                    left: this.context.layer.offset.left - this.context.canvas.offset.left + event.pageX - this.context.mouse.offset.left
                };
            }

            var targetContainer = this._findInnerContainer(event);
            if (targetContainer === false && this.startMode != 'create') {
                targetContainer = this.context.droppables[0];
            }
            if (targetContainer) {
                if (targetContainer.placement == 'normal') {

                    if (typeof targetContainer.layers === "undefined") {
                        targetContainer.layers = this._cacheContainerLayers(targetContainer);
                    }

                    var targetIndex = this._findNormalIndex(event, targetContainer);
                    if (targetIndex > 0) {
                        this.context.placeholder.css('order', targetContainer.layers[targetIndex - 1].layer.layer.css('order'));
                        this.context.placeholder.insertAfter(targetContainer.layers[targetIndex - 1].layer.layer);
                    } else {
                        this.context.placeholder.css('order', 0);
                        this.context.placeholder.prependTo(targetContainer.$container);
                    }

                    this.context.targetIndex = targetIndex;
                } else {
                    this.context.placeholder.detach();
                }
            } else {
                this.context.placeholder.detach();
            }

            this.context.targetContainer = targetContainer;


            this._trigger("drag", event, {
                layer: itemOptions.layer,
                originalOffset: this.context.layer.offset,
                position: position,
                canvasOffset: this.context.canvas.offset,
                offset: {
                    left: position.left + this.context.canvas.offset.left,
                    top: position.top + this.context.canvas.offset.top
                }
            });

            if (this.startMode == 'create') {
                position.left += this.context.canvas.offset.left;
                position.top += this.context.canvas.offset.top;
            }

            itemOptions.$layer.css(position);

            this._displayPosition(event, position);
        },

        _mouseStop: function (itemOptions, event, noPropagation) {
            this.context.placeholder.remove();

            var targetIndex = this.context.targetIndex,
                targetContainer = this.context.targetContainer;

            itemOptions.$layer
                .removeClass('n2-canvas-item-drag')

            if (this.startMode == 'create') {
                if (targetContainer) {
                    itemOptions.onCreate.call(this, event, itemOptions, targetContainer, targetIndex);
                }
                itemOptions.$layer.detach();

            } else {
                if (this.startMode == 'absolute' && this.context.targetContainer.placement == 'absolute') {

                    // Simple drag on the canvas on an absolute layer. Just update its position!
                    var left = parseInt(itemOptions.$layer.css('left')),
                        top = parseInt(itemOptions.$layer.css('top'));

                    itemOptions.$layer.css({
                        position: '',
                        right: '',
                        bottom: '',
                    });

                    itemOptions.layer.placement.current.setPosition(left, top);

                } else if (this.context.targetContainer.placement == 'absolute') {

                    // Layer moved from a normal container to the canvas.

                    var left = parseInt(itemOptions.$layer.css('left')),
                        top = parseInt(itemOptions.$layer.css('top'));

                    itemOptions.$layer.css({
                        position: '',
                        right: '',
                        bottom: '',
                    });

                    var width = itemOptions.$layer.width(),
                        height = itemOptions.$layer.height();

                    itemOptions.layer.group.onChildCountChange();

                    var oldAbsoluteGroup = itemOptions.layer;
                    while (oldAbsoluteGroup && (!oldAbsoluteGroup.placement || oldAbsoluteGroup.placement.getType() !== 'absolute')) {
                        oldAbsoluteGroup = oldAbsoluteGroup.group;
                    }

                    nextend.smartSlider.history.startBatch();
                    // Set the new group, which will trigger this current placement to activate
                    itemOptions.layer.changeGroup(this.context.originalIndex, this.options.mainContainer);
                    nextend.smartSlider.history.addControl('skipForwardUndos');

                    if (itemOptions.layer.type == 'layer' && itemOptions.layer.item) {
                        if (!itemOptions.layer.item.needSize) {
                            height = 'auto';
                            width++; //Prevent text layers to wrap line ending to new line after drag
                        }
                    }

                    // As this placement activated, we have to set these values from the closest absolute parent
                    var targetAlign = oldAbsoluteGroup ? oldAbsoluteGroup.getProperty('align') : 'center',
                        targetValign = oldAbsoluteGroup ? oldAbsoluteGroup.getProperty('valign') : 'middle';

                    itemOptions.layer.placement.current._setPosition(targetAlign, targetValign, left, top, width, height, true);

                    nextend.smartSlider.history.endBatch();

                } else if (this.context.targetContainer.placement == 'normal') {
                    itemOptions.$layer.css({
                        position: 'relative',
                        width: '',
                        left: '',
                        top: ''
                    });

                    switch (targetContainer.layer.type) {

                        case 'content':
                        case 'col':
                            if (targetIndex > 0) {
                                itemOptions.$layer.insertAfter(targetContainer.layers[targetIndex - 1].layer.layer);
                            } else {
                                itemOptions.$layer.prependTo(targetContainer.$container);
                            }

                            itemOptions.layer.onCanvasUpdate(this.context.originalIndex, targetContainer.layer, targetIndex);
                            break;

                        case 'row':
                            var col = targetContainer.layer.createCol();
                            targetContainer.layer.moveCol(col.getIndex(), targetIndex);

                            itemOptions.$layer.prependTo(col.$content);
                            itemOptions.layer.onCanvasUpdate(this.context.originalIndex, col, 0);

                            break;
                    }

                    //itemOptions.layer.placement.current._syncheight(); // we should sync back the height of the normal layer
                }
            }

            delete this.context;

            if (this.options.display) {
                this.options.display.hide();
            }

            this._trigger("stop", event, {
                layer: itemOptions.layer
            });

            this.dragDeferred.resolve();


            $('body').removeClass('n2-ss-move-layer');
        },

        cancel: function (itemOptions) {
        },

        _cacheContainers: function () {
            for (var i = 0; i < this.context.droppables.length; i++) {
                var obj = this.context.droppables[i];
                obj.offset = obj.$container.offset();
                obj.size = {
                    width: obj.$container.outerWidth(),
                    height: obj.$container.outerHeight()
                }
                obj.offset.right = obj.offset.left + obj.size.width;
                obj.offset.bottom = obj.offset.top + obj.size.height;
            }
        },

        _findInnerContainer: function (event) {
            for (var i = this.context.droppables.length - 1; i >= 0; i--) {
                var obj = this.context.droppables[i];
                if (obj.offset.left <= event.pageX && obj.offset.right >= event.pageX && obj.offset.top <= event.pageY && obj.offset.bottom >= event.pageY) {
                    return obj;
                }
            }
            return false;
        },

        _cacheContainerLayers: function (droppable) {
            var layerObjects = [],
                layers = droppable.layer.container.getSortedLayers();

            for (var i = 0; i < layers.length; i++) {
                var obj = {
                    layer: layers[i]
                };
                obj.offset = obj.layer.layer.offset();
                obj.size = {
                    width: obj.layer.layer.outerWidth(),
                    height: obj.layer.layer.outerHeight()
                }
                obj.offset.right = obj.offset.left + obj.size.width / 2;
                obj.offset.bottom = obj.offset.top + obj.size.height / 2;
                layerObjects.push(obj);
            }

            return layerObjects;
        },

        _findNormalIndex: function (event, targetContainer) {
            var index = -1;

            switch (targetContainer.axis) {
                case 'y':
                    for (var i = 0; i < targetContainer.layers.length; i++) {
                        var obj = targetContainer.layers[i];
                        if (event.pageY <= obj.offset.bottom) {
                            index = i;
                            break;
                        }
                    }
                    break;
                case 'x':
                    for (var i = 0; i < targetContainer.layers.length; i++) {
                        var obj = targetContainer.layers[i];
                        if (event.pageX <= obj.offset.right) {
                            index = i;
                            break;
                        }
                    }
                    break;
            }

            if (index === -1) {
                index = targetContainer.layers.length;
            }

            return index;
        },

        _displayPosition: function (event, position) {

            if (this.options.display) {
                if (this.context.targetContainer && this.context.targetContainer.placement == 'absolute') {
                    if (this.options.display.hidden) {
                        this.options.display.show();
                    }
                    if (this.startMode == 'create') {
                        position.left -= this.context.canvas.offset.left;
                        position.top -= this.context.canvas.offset.top;
                    }
                    this.options.display.update(event, position);
                } else {
                    if (this.options.display.hidden) {
                        this.options.display.hide();
                    }
                }
            }
        },

        _trigger: function (type, event, ui) {
            ui = ui || {};

            $.ui.plugin.call(this, type, [event, ui, this], true);

            return $.Widget.prototype._trigger.call(this, type, event, ui);
        },

        plugins: {},

        _cacheMargins: function (layer) {
            this.margins = {
                left: ( parseInt(layer.css("marginLeft"), 10) || 0 ),
                top: ( parseInt(layer.css("marginTop"), 10) || 0 ),
                right: ( parseInt(layer.css("marginRight"), 10) || 0 ),
                bottom: ( parseInt(layer.css("marginBottom"), 10) || 0 )
            };
        }
    });

    $.ui.plugin.add("nextendCanvas", "smartguides", {

        start: function (event, ui) {
            var inst = $(this).data("uiNextendCanvas"), o = inst.options;

            if (inst.startMode == 'create') return;

            inst.gridH = $('<div class="n2-grid n2-grid-h"></div>').appendTo(o.mainContainer.layer);
            inst.gridV = $('<div class="n2-grid n2-grid-v"></div>').appendTo(o.mainContainer.layer);
            inst.elements = [];
            if (typeof o.smartguides == 'function') {
                var guides = $(o.smartguides(inst.context)).not(inst.context.$layer);
                if (guides && guides.length) {
                    guides.each(function () {
                        var $t = $(this);
                        var $o = $t.offset();
                        if (this != inst.element[0]) inst.elements.push({
                            item: this,
                            width: $t.outerWidth(), height: $t.outerHeight(),
                            top: Math.round($o.top), left: Math.round($o.left),
                            backgroundColor: ''
                        });
                    });
                }
                var $o = o.mainContainer.layer.offset();
                inst.elements.push({
                    width: o.mainContainer.layer.width(), height: o.mainContainer.layer.height(),
                    top: Math.round($o.top), left: Math.round($o.left),
                    backgroundColor: '#ff4aff'
                });
            }
        },

        stop: function (event, ui) {
            var inst = $(this).data("uiNextendCanvas");

            if (inst.startMode == 'create') return;

            inst.gridH.remove();
            inst.gridV.remove();
        },

        drag: function (event, ui) {
            var vElement = false,
                hElement = false,
                inst = $(this).data("uiNextendCanvas"),
                o = inst.options,
                verticalTolerance = o.tolerance,
                horizontalTolerance = o.tolerance;

            if (inst.startMode == 'create') return;

            inst.gridH.css({"display": "none"});
            inst.gridV.css({"display": "none"});

            if (inst.context.targetContainer && inst.context.targetContainer.placement == 'absolute') {

                var container = inst.elements[inst.elements.length - 1],
                    setGridV = function (left) {
                        inst.gridV.css({left: Math.min(left, container.width - 1), display: "block"});
                    },
                    setGridH = function (top) {
                        inst.gridH.css({top: Math.min(top, container.height - 1), display: "block"});
                    }

                var ctrlKey = event.ctrlKey || event.metaKey,
                    altKey = event.altKey;
                if (ctrlKey && altKey) {
                    return;
                } else if (ctrlKey) {
                    vElement = true;
                } else if (altKey) {
                    hElement = true;
                }
                var x1 = ui.offset.left, x2 = x1 + inst.context.size.width,
                    y1 = ui.offset.top, y2 = y1 + inst.context.size.height,
                    xc = (x1 + x2) / 2,
                    yc = (y1 + y2) / 2;

                if (!vElement) {
                    for (var i = inst.elements.length - 1; i >= 0; i--) {
                        if (verticalTolerance == 0) break;

                        var l = inst.elements[i].left,
                            r = l + inst.elements[i].width,
                            hc = (l + r) / 2;

                        var v = true,
                            c;
                        if ((c = Math.abs(l - x2)) < verticalTolerance) {
                            ui.position.left = l - inst.context.size.width - inst.context.canvas.offset.left - inst.margins.left;
                            setGridV(ui.position.left + inst.context.size.width);
                        } else if ((c = Math.abs(l - x1)) < verticalTolerance) {
                            ui.position.left = l - inst.context.canvas.offset.left - inst.margins.left;
                            setGridV(ui.position.left);
                        } else if ((c = Math.abs(r - x1)) < verticalTolerance) {
                            ui.position.left = r - inst.context.canvas.offset.left - inst.margins.left;
                            setGridV(ui.position.left);
                        } else if ((c = Math.abs(r - x2)) < verticalTolerance) {
                            ui.position.left = r - inst.context.size.width - inst.context.canvas.offset.left - inst.margins.left;
                            setGridV(ui.position.left + inst.context.size.width);
                        } else if ((c = Math.abs(hc - x2)) < verticalTolerance) {
                            ui.position.left = hc - inst.context.size.width - inst.context.canvas.offset.left - inst.margins.left;
                            setGridV(ui.position.left + inst.context.size.width);
                        } else if ((c = Math.abs(hc - x1)) < verticalTolerance) {
                            ui.position.left = hc - inst.context.canvas.offset.left - inst.margins.left;
                            setGridV(ui.position.left);
                        } else if ((c = Math.abs(hc - xc)) < verticalTolerance) {
                            ui.position.left = hc - inst.context.size.width / 2 - inst.context.canvas.offset.left - inst.margins.left;
                            setGridV(ui.position.left + inst.context.size.width / 2);
                        } else {
                            v = false;
                        }

                        if (v) {
                            vElement = inst.elements[i];
                            verticalTolerance = Math.min(c, verticalTolerance);
                        }
                    }
                }

                if (!hElement) {
                    for (var i = inst.elements.length - 1; i >= 0; i--) {
                        if (horizontalTolerance == 0) break;

                        var t = inst.elements[i].top,
                            b = t + inst.elements[i].height,
                            vc = (t + b) / 2;

                        var h = true,
                            c;
                        if ((c = Math.abs(t - y2)) < horizontalTolerance) {
                            ui.position.top = t - inst.context.size.height - inst.context.canvas.offset.top - inst.margins.top;
                            setGridH(ui.position.top + inst.context.size.height);
                        } else if ((c = Math.abs(t - y1)) < horizontalTolerance) {
                            ui.position.top = t - inst.context.canvas.offset.top - inst.margins.top;
                            setGridH(ui.position.top);
                        } else if ((c = Math.abs(b - y1)) < horizontalTolerance) {
                            ui.position.top = b - inst.context.canvas.offset.top - inst.margins.top;
                            setGridH(ui.position.top);
                        } else if ((c = Math.abs(b - y2)) < horizontalTolerance) {
                            ui.position.top = b - inst.context.size.height - inst.context.canvas.offset.top - inst.margins.top;
                            setGridH(ui.position.top + inst.context.size.height);
                        } else if ((c = Math.abs(vc - y2)) < horizontalTolerance) {
                            ui.position.top = vc - inst.context.size.height - inst.context.canvas.offset.top - inst.margins.top;
                            setGridH(ui.position.top + inst.context.size.height);
                        } else if ((c = Math.abs(vc - y1)) < horizontalTolerance) {
                            ui.position.top = vc - inst.context.canvas.offset.top - inst.margins.top;
                            setGridH(ui.position.top);
                        } else if ((c = Math.abs(vc - yc)) < horizontalTolerance) {
                            ui.position.top = vc - inst.context.size.height / 2 - inst.context.canvas.offset.top - inst.margins.top;
                            setGridH(ui.position.top + inst.context.size.height / 2);
                        } else {
                            h = false;
                        }

                        if (h) {
                            hElement = inst.elements[i];
                            horizontalTolerance = Math.min(c, horizontalTolerance);
                        }
                    }
                }

                if (vElement && vElement !== true) {
                    inst.gridV.css('backgroundColor', vElement.backgroundColor);
                }
                if (hElement && hElement !== true) {
                    inst.gridH.css('backgroundColor', hElement.backgroundColor);
                }
            }
        }
    });

})(n2);