(function ($) {
    "use strict";

    $.widget("ui.nextendLayerList", {

        widgetEventPrefix: "layerList",
        ready: false,
        scrollTimeout: null,
        options: {
            $fixed: null,
            $scrolled: null
        },
        _create: function () {
        },
        _mouseCapture: function (itemOptions, event, overrideHandle) {
            return true;
        },
        _mouseStart: function (itemOptions, event, overrideHandle, noActivation) {

            this.scrolledTop = this.options.$scrolled.offset().top;
            this.scrolledHeight = this.options.$scrolled.height();
            this.scrolledScroll = this.options.$scrolled.scrollTop();
            this.scrolledMaxHeight = this.options.$scrolled[0].scrollHeight - this.scrolledHeight;

            $('body').addClass('n2-ss-layer-list-move-layer');

            this.context = {
                placeholder: $('<div class="nextend-sortable-placeholder"><div></div></div>'),
                mouse: {
                    y: event.pageY,
                    topModifier: itemOptions.$item.offset().top - event.pageY
                },
                $item: itemOptions.$item,
                $clone: itemOptions.$item.clone()
            };

            this.context.$clone.addClass('n2-ss-ll-dragging').appendTo(this.options.$scrolled.find('> ul'));

            this.context.droppables = this.options.mainContainer.getLLDroppables(itemOptions.layer);

            this._cacheContainers();

            this._trigger("start", event);

            this._mouseDrag(itemOptions, event);
        },
        _scrollUp: function () {
            if (this.scrolledTop > 0) {
                if (this.scrollTimeout === null) {
                    this.scrollTimeout = setInterval($.proxy(function () {
                        this.scrolledScroll -= 30;
                        this.options.$scrolled.scrollTop(this.scrolledScroll);
                    }, this), 100);
                    this.scrolledScroll -= 30;
                    this.options.$scrolled.scrollTop(this.scrolledScroll);
                }
            }
        },
        _scrollDown: function () {
            if (this.scrollTimeout === null) {
                this.scrollTimeout = setInterval($.proxy(function () {
                    this.scrolledScroll += 30;
                    this.options.$scrolled.scrollTop(Math.min(this.scrolledScroll, this.scrolledMaxHeight));
                }, this), 100);
                this.scrolledScroll += 30;
                this.options.$scrolled.scrollTop(Math.min(this.scrolledScroll, this.scrolledMaxHeight));
            }
        },
        _mouseDrag: function (itemOptions, event) {

            this.scrolledTop = this.options.$scrolled.offset().top;

            if (this.scrolledHeight > 60) {
                if (event.pageY < this.scrolledTop + 30) {
                    this._scrollUp();
                } else if (event.pageY > this.scrolledTop + this.scrolledHeight - 30) {
                    this._scrollDown();
                } else {
                    clearInterval(this.scrollTimeout);
                    this.scrollTimeout = null;
                }
            }


            this.scrolledScroll = this.options.$scrolled.scrollTop();

            var y = event.pageY - this.scrolledTop + this.scrolledScroll;

            var targetContainer = this._findInnerContainer(y);
            if (targetContainer === false) {
                targetContainer = this.context.droppables[0];
            }

            if (typeof targetContainer.layers === "undefined") {
                targetContainer.layers = this._cacheContainerLayers(targetContainer);
            }

            var targetIndex = this._findNormalIndex(y, targetContainer);

            if (targetIndex > 0) {
                this.context.placeholder.insertAfter(targetContainer.layers[targetIndex - 1].layer.layerRow);
            } else {
                this.context.placeholder.prependTo(targetContainer.$container);
            }

            this.context.targetIndex = targetIndex;
            if (this.context.targetContainer && this.context.targetContainer != targetContainer) {
                this.context.targetContainer.layer.layerRow.removeClass('n2-ss-ll-dragging-parent');
            }

            this.context.targetContainer = targetContainer;
            this.context.targetContainer.layer.layerRow.addClass('n2-ss-ll-dragging-parent');

            this.context.$clone.css({
                top: y + this.context.mouse.topModifier
            });

        },

        _mouseStop: function (itemOptions, event, noPropagation) {

            if (this.scrollTimeout !== null) {
                clearInterval(this.scrollTimeout);
                this.scrollTimeout = null;
            }

            this.context.placeholder.remove();

            this.context.$clone.remove();

            this.context.targetContainer.layer.layerRow.removeClass('n2-ss-ll-dragging-parent');

            var targetIndex = this.context.targetIndex,
                targetContainer = this.context.targetContainer,
                originalIndex = itemOptions.layer.getIndex(),
                newIndex = -1;


            if (this.context.targetContainer.layers.length == 0) {
                newIndex = 0;
            } else {
                var nextLayer = false,
                    prevLayer = false;

                if (this.context.targetContainer.layers[targetIndex]) {
                    nextLayer = this.context.targetContainer.layers[targetIndex].layer;
                }

                if (this.context.targetContainer.layers[targetIndex - 1]) {
                    prevLayer = this.context.targetContainer.layers[targetIndex - 1].layer;
                }

                if (nextLayer == itemOptions.layer || prevLayer == itemOptions.layer) {
                    newIndex = -1;
                } else {
                    if (targetContainer.layer.container.allowedPlacementMode == 'absolute') {
                        if (nextLayer) {
                            //itemOptions.layer.layer.detach();
                            newIndex = nextLayer.getIndex() + 1;
                        } else if (prevLayer) {
                            //itemOptions.layer.layer.detach();
                            newIndex = prevLayer.getIndex();
                        }
                    } else {
                        if (prevLayer) {
                            //itemOptions.layer.layer.detach();
                            newIndex = prevLayer.getIndex() + 1;
                        } else if (nextLayer) {
                            //itemOptions.layer.layer.detach();
                            newIndex = nextLayer.getIndex();
                        }
                    }
                }
            }
            if (newIndex >= 0) {
                if (itemOptions.layer.type == 'col') {
                    if (newIndex > originalIndex) {
                        newIndex--;
                    }
                    targetContainer.layer.moveCol(originalIndex, newIndex);
                } else {
                    targetContainer.layer.container.insertLayerAt(itemOptions.layer, newIndex);
                    itemOptions.layer.onCanvasUpdate(originalIndex, targetContainer.layer, newIndex);
                }
            }

            delete this.context;

            this._trigger("stop", event);


            $('body').removeClass('n2-ss-layer-list-move-layer');
        },

        cancel: function (itemOptions) {
        },

        _cacheContainers: function () {
            for (var i = 0; i < this.context.droppables.length; i++) {
                var obj = this.context.droppables[i];
                obj.top = obj.$container.offset().top - this.scrolledTop + this.scrolledScroll - 15;
                obj.height = obj.$container.outerHeight();
                obj.bottom = obj.top + obj.height + 15;
            }
        },

        _findInnerContainer: function (y) {
            for (var i = this.context.droppables.length - 1; i >= 0; i--) {
                var obj = this.context.droppables[i];
                if (obj.top <= y && obj.bottom >= y) {
                    return obj;
                }
            }
            return false;
        },

        _cacheContainerLayers: function (droppable) {
            var layerObjects = [],
                layers = droppable.layer.container.getSortedLayers();

            for (var i = 0; i < layers.length; i++) {
                //if (layers[i].layerRow[0] === this.context.$item[0]) continue;
                var obj = {
                    layer: layers[i]
                };
                obj.top = obj.layer.layerRow.offset().top - this.scrolledTop + this.scrolledScroll;
                obj.height = obj.layer.layerRow.outerHeight();
                obj.bottom = obj.top + obj.height / 2;
                obj.index = i;
                layerObjects.push(obj);
            }

            if (droppable.layer.container.allowedPlacementMode == 'absolute') {
                layerObjects.reverse();
            }

            return layerObjects;
        },

        _findNormalIndex: function (y, targetContainer) {
            for (var i = 0; i < targetContainer.layers.length; i++) {
                var obj = targetContainer.layers[i];
                if (y <= obj.bottom) {
                    return i;
                    break;
                }
            }
            return targetContainer.layers.length;
        }
    });

})(n2);