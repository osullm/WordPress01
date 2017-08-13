(function ($) {

    $.widget("ui.nextendResizable", $.ui.resizable, {
        _mouseStart: function (t) {
            var position = this.element.position();
            this.element.css({
                left: position.left,
                top: position.top,
                right: 'auto',
                bottom: 'auto'
            });
            return this._superApply(arguments);
        },

        ui: function () {
            return {
                originalElement: this.originalElement,
                element: this.element,
                helper: this.helper,
                position: this.position,
                size: this.size,
                originalSize: this.originalSize,
                originalPosition: this.originalPosition,
                axis: this.axis
            };
        }
    });

    $.ui.plugin.add("nextendResizable", "smartguides", {
        start: function (event, ui) {
            var i = $(this).data("uiNextendResizable"), o = i.options;
            i.gridH = $('<div class="n2-grid n2-grid-h"></div>').appendTo(o._containment);
            i.gridV = $('<div class="n2-grid n2-grid-v"></div>').appendTo(o._containment);
            i.gridH2 = $('<div class="n2-grid n2-grid-h"></div>').appendTo(o._containment);
            i.gridV2 = $('<div class="n2-grid n2-grid-v"></div>').appendTo(o._containment);
            i.elements = [];
            if (typeof o.smartguides == 'function') {

                var guides = o.smartguides();
                if (guides) {
                    var containmentOffset = o._containment.offset();
                    guides.each(function () {
                        var $t = $(this);
                        var $o = $t.offset();
                        if (this != i.element[0]) i.elements.push({
                            item: this,
                            width: $t.outerWidth(),
                            height: $t.outerHeight(),
                            top: Math.round($o.top - containmentOffset.top),
                            left: Math.round($o.left - containmentOffset.left)
                        });
                    });
                    i.elements.push({
                        item: o._containment,
                        width: o._containment.width(), height: o._containment.height(),
                        top: 0, left: 0
                    });
                }
            }
        },
        stop: function (event, ui) {
            var i = $(this).data("uiNextendResizable");
            i.gridH.remove();
            i.gridV.remove();
            i.gridH2.remove();
            i.gridV2.remove();
        },
        resize: function (event, ui) {
            var inst = $(this).data("uiNextendResizable"), o = inst.options;
            var d = o.tolerance;
            inst.gridV.css({"display": "none"});
            inst.gridH.css({"display": "none"});
            inst.gridV2.css({"display": "none"});
            inst.gridH2.css({"display": "none"});


            var container = inst.elements[inst.elements.length - 1];

            function setGridV(left) {
                inst.gridV.css({left: Math.min(left, container.width - 1), display: "block"});
            };
            function setGridV2(left) {
                inst.gridV2.css({left: Math.min(left, container.width - 1), display: "block"});
            };
            function setGridH(top) {
                inst.gridH.css({top: Math.min(top, container.height - 1), display: "block"});
            };
            function setGridH2(top) {
                inst.gridH2.css({top: Math.min(top, container.height - 1), display: "block"});
            };

            var ctrlKey = event.ctrlKey || event.metaKey,
                altKey = event.altKey;
            if (ctrlKey && altKey) {
                return;
            }

            var x1 = ui.position.left, x2 = x1 + ui.size.width,
                y1 = ui.position.top, y2 = y1 + ui.size.height;
            for (var i = inst.elements.length - 1; i >= 0; i--) {
                var l = inst.elements[i].left, r = l + inst.elements[i].width,
                    t = inst.elements[i].top, b = t + inst.elements[i].height;

                if (!ctrlKey) {
                    var hc = (l + r) / 2;

                    if (Math.abs(l - x2) <= d) {
                        ui.size.width = l - ui.position.left;
                        setGridV(ui.position.left + ui.size.width);
                    } else if (Math.abs(l - x1) <= d) {
                        var diff = ui.position.left - l;
                        ui.position.left = l;
                        ui.size.width += diff;
                        setGridV(ui.position.left);
                    } else if (Math.abs(hc - x1) <= d) {
                        var diff = ui.position.left - hc;
                        ui.position.left = hc;
                        ui.size.width += diff;
                        setGridV(ui.position.left);
                    }

                    if (Math.abs(r - x1) <= d) {
                        var diff = ui.position.left - r;
                        ui.position.left = r;
                        ui.size.width += diff;
                        setGridV2(ui.position.left);
                    } else if (Math.abs(r - x2) <= d) {
                        ui.size.width = r - ui.position.left;
                        setGridV2(ui.position.left + ui.size.width);
                    } else if (Math.abs(hc - x2) <= d) {
                        ui.size.width = hc - ui.position.left;
                        setGridV2(ui.position.left + ui.size.width);
                    }
                }

                if (!altKey) {
                    var vc = (t + b) / 2;

                    if (Math.abs(t - y2) <= d) {
                        ui.size.height = t - ui.position.top;
                        setGridH(t);
                    } else if (Math.abs(t - y1) <= d) {
                        var diff = ui.position.top - t;
                        ui.position.top = t;
                        ui.size.height += diff;
                        setGridH(ui.position.top);
                    } else if (Math.abs(vc - y1) <= d) {
                        var diff = ui.position.top - vc;
                        ui.position.top = vc;
                        ui.size.height += diff;
                        setGridH(ui.position.top);
                    }

                    if (Math.abs(b - y1) <= d) {
                        var diff = ui.position.top - b;
                        ui.position.top = b;
                        ui.size.height += diff;
                        setGridH2(ui.position.top);
                    } else if (Math.abs(b - y2) <= d) {
                        ui.size.height = b - ui.position.top;
                        setGridH2(ui.position.top + ui.size.height);
                    } else if (Math.abs(vc - y2) <= d) {
                        ui.size.height = vc - ui.position.top;
                        setGridH2(ui.position.top + ui.size.height);
                    }
                }
            }
        }
    });

})(n2);