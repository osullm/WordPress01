N2Require('SmartSliderMainAnimationSimple', ['SmartSliderMainAnimationAbstract'], [], function ($, scope, undefined) {

    function SmartSliderMainAnimationSimple(slider, parameters) {

        this.postBackgroundAnimation = false;
        this._currentBackgroundAnimation = false;

        parameters = $.extend({
            delay: 0,
            parallax: 0.45,
            type: 'horizontal',
            shiftedBackgroundAnimation: 'auto'
        }, parameters);
        parameters.delay /= 1000;

        scope.SmartSliderMainAnimationAbstract.prototype.constructor.apply(this, arguments);

        this.setActiveSlide(this.slider.slides.eq(this.slider.currentSlideIndex));

        switch (this.parameters.type) {
            case 'no':
                this.animation = this._mainAnimationNo;
                break;
            case 'fade':
                this.animation = this._mainAnimationFade;
                break;
            case 'crossfade':
                this.animation = this._mainAnimationCrossFade;
                break;
            case 'vertical':
                if (this.parameters.parallax == 1) {
                    this.animation = this._mainAnimationVertical;
                } else {
                    this.animation = this._mainAnimationVerticalParallax;
                }
                break;
            case 'vertical-reversed':
                if (this.parameters.parallax == 1) {
                    this.animation = this._mainAnimationVerticalReversed;
                } else {
                    this.animation = this._mainAnimationVerticalReversedParallax;
                }
                break;
            case 'horizontal-reversed':
                if (this.parameters.parallax == 1) {
                    this.animation = this._mainAnimationHorizontalReversed;
                } else {
                    this.animation = this._mainAnimationHorizontalReversedParallax;
                }
                break;
            default:
                if (this.parameters.parallax == 1) {
                    this.animation = this._mainAnimationHorizontal;
                } else {
                    this.animation = this._mainAnimationHorizontalParallax;
                }
        }
    };

    SmartSliderMainAnimationSimple.prototype = Object.create(scope.SmartSliderMainAnimationAbstract.prototype);
    SmartSliderMainAnimationSimple.prototype.constructor = SmartSliderMainAnimationSimple;


    SmartSliderMainAnimationSimple.prototype.changeTo = function (currentSlideIndex, currentSlide, nextSlideIndex, nextSlide, reversed, isSystem) {
        if (this.postBackgroundAnimation) {
            this.postBackgroundAnimation.prepareToSwitchSlide(currentSlideIndex, nextSlideIndex);
        }

        scope.SmartSliderMainAnimationAbstract.prototype.changeTo.apply(this, arguments);
    };

    /**
     * Used to hide non active slides
     * @param slide
     */
    SmartSliderMainAnimationSimple.prototype.setActiveSlide = function (slide) {
        var notActiveSlides = this.slider.slides.not(slide);
        for (var i = 0; i < notActiveSlides.length; i++) {
            this._hideSlide(notActiveSlides.eq(i));
        }
    };

    /**
     * Hides the slide, but not the usual way. Simply positions them outside of the slider area.
     * If we use the visibility or display property to hide we would end up corrupted YouTube api.
     * If opacity 0 might also work, but that might need additional resource from the browser
     * @param slide
     * @private
     */
    SmartSliderMainAnimationSimple.prototype._hideSlide = function (slide) {
        var obj = {};
        obj[nextend.rtl.left] = '-100000px';
        NextendTween.set(slide.get(0), obj);
    };

    SmartSliderMainAnimationSimple.prototype._showSlide = function (slide) {
        var obj = {};
        obj[nextend.rtl.left] = 0;
        NextendTween.set(slide.get(0), obj);
    };

    SmartSliderMainAnimationSimple.prototype.cleanSlideIndex = function (slideIndex) {
        this._hideSlide(this.slider.slides.eq(slideIndex));
    };


    SmartSliderMainAnimationSimple.prototype.revertTo = function (slideIndex, originalNextSlideIndex) {

        var originalNextSlide = this.slider.slides.eq(originalNextSlideIndex)
            .css('zIndex', '');
        this._hideSlide(originalNextSlide);

        scope.SmartSliderMainAnimationAbstract.prototype.revertTo.apply(this, arguments);
    };

    SmartSliderMainAnimationSimple.prototype._initAnimation = function (currentSlideIndex, currentSlide, nextSlideIndex, nextSlide, reversed) {

        this.animation(currentSlide, nextSlide, reversed, currentSlideIndex, nextSlideIndex);
    };

    SmartSliderMainAnimationSimple.prototype.onChangeToComplete = function (previousSlideIndex, currentSlideIndex, isSystem) {

        this._hideSlide(this.slider.slides.eq(previousSlideIndex));

        scope.SmartSliderMainAnimationAbstract.prototype.onChangeToComplete.apply(this, arguments);
    };

    SmartSliderMainAnimationSimple.prototype.onReverseChangeToComplete = function (previousSlideIndex, currentSlideIndex, isSystem) {

        this._hideSlide(this.slider.slides.eq(previousSlideIndex));

        scope.SmartSliderMainAnimationAbstract.prototype.onReverseChangeToComplete.apply(this, arguments);
    };

    SmartSliderMainAnimationSimple.prototype._mainAnimationNo = function (currentSlide, nextSlide) {

        this._showSlide(nextSlide);

        this.slider.unsetActiveSlide(currentSlide);

        nextSlide.css('opacity', 0);

        this.slider.setActiveSlide(nextSlide);

        var totalDuration = this.timeline.totalDuration(),
            extraDelay = this.getExtraDelay();

        if (this._currentBackgroundAnimation && this.parameters.shiftedBackgroundAnimation) {
            if (this._currentBackgroundAnimation.shiftedPreSetup) {
                this._currentBackgroundAnimation._preSetup();
            }
        }

        if (totalDuration == 0) {
            totalDuration = 0.00001;
            extraDelay += totalDuration;
        }

        this.timeline.set(currentSlide, {
            opacity: 0
        }, extraDelay);

        this.timeline.set(nextSlide, {
            opacity: 1
        }, totalDuration);

        this.sliderElement.on('mainAnimationComplete.n2-simple-no', $.proxy(function (e, animation, currentSlideIndex, nextSlideIndex) {
            this.sliderElement.off('mainAnimationComplete.n2-simple-no');
            this.slider.slides.eq(currentSlideIndex)
                .css('opacity', '');
            this.slider.slides.eq(nextSlideIndex)
                .css('opacity', '');
        }, this));
    };

    SmartSliderMainAnimationSimple.prototype._mainAnimationFade = function (currentSlide, nextSlide) {
        currentSlide.css('zIndex', 5);
        this._showSlide(nextSlide);

        this.slider.unsetActiveSlide(currentSlide);
        this.slider.setActiveSlide(nextSlide);

        var adjustedTiming = this.adjustMainAnimation();

        if (this.parameters.shiftedBackgroundAnimation != 0) {
            var needShift = false,
                resetShift = false;
            if (this.parameters.shiftedBackgroundAnimation == 'auto') {
                if (currentSlide.data('slide').hasLayers()) {
                    needShift = true;
                } else {
                    resetShift = true;
                }
            } else {
                needShift = true;
            }

            if (this._currentBackgroundAnimation && needShift) {
                this.timeline.shiftChildren(adjustedTiming.outDuration - adjustedTiming.extraDelay);
                if (this._currentBackgroundAnimation.shiftedPreSetup) {
                    this._currentBackgroundAnimation._preSetup();
                }
            } else if (resetShift) {
                this.timeline.shiftChildren(adjustedTiming.extraDelay);
                if (this._currentBackgroundAnimation.shiftedPreSetup) {
                    this._currentBackgroundAnimation._preSetup();
                }
            }
        }

        this.timeline.to(currentSlide.get(0), adjustedTiming.outDuration, {
            opacity: 0,
            ease: this.getEase()
        }, adjustedTiming.outDelay);

        nextSlide.css('opacity', 1);

        this.sliderElement.on('mainAnimationComplete.n2-simple-fade', $.proxy(function (e, animation, currentSlideIndex, nextSlideIndex) {
            this.sliderElement.off('mainAnimationComplete.n2-simple-fade');
            this.slider.slides.eq(currentSlideIndex)
                .css('zIndex', '')
                .css('opacity', '');
            this.slider.slides.eq(nextSlideIndex)
                .css('opacity', '');
        }, this));
    };

    SmartSliderMainAnimationSimple.prototype._mainAnimationCrossFade = function (currentSlide, nextSlide) {
        currentSlide.css('zIndex', 5);
        nextSlide.css('opacity', 0);
        this._showSlide(nextSlide);

        this.slider.unsetActiveSlide(currentSlide);
        this.slider.setActiveSlide(nextSlide);

        var adjustedTiming = this.adjustMainAnimation();

        if (this.parameters.shiftedBackgroundAnimation != 0) {
            var needShift = false,
                resetShift = false;
            if (this.parameters.shiftedBackgroundAnimation == 'auto') {
                if (currentSlide.data('slide').hasLayers()) {
                    needShift = true;
                } else {
                    resetShift = true;
                }
            } else {
                needShift = true;
            }

            if (this._currentBackgroundAnimation && needShift) {
                this.timeline.shiftChildren(adjustedTiming.outDuration - adjustedTiming.extraDelay);
                if (this._currentBackgroundAnimation.shiftedPreSetup) {
                    this._currentBackgroundAnimation._preSetup();
                }
            } else if (resetShift) {
                this.timeline.shiftChildren(adjustedTiming.extraDelay);
                if (this._currentBackgroundAnimation.shiftedPreSetup) {
                    this._currentBackgroundAnimation._preSetup();
                }
            }
        }

        this.timeline.to(currentSlide.get(0), adjustedTiming.outDuration, {
            opacity: 0,
            ease: this.getEase()
        }, adjustedTiming.outDelay);

        this.timeline.to(nextSlide.get(0), adjustedTiming.inDuration, {
            opacity: 1,
            ease: this.getEase()
        }, adjustedTiming.inDelay);

        this.sliderElement.on('mainAnimationComplete.n2-simple-fade', $.proxy(function (e, animation, currentSlideIndex, nextSlideIndex) {
            this.sliderElement.off('mainAnimationComplete.n2-simple-fade');
            this.slider.slides.eq(currentSlideIndex)
                .css('zIndex', '')
                .css('opacity', '');
            this.slider.slides.eq(nextSlideIndex)
                .css('opacity', '');
        }, this));
    };

    SmartSliderMainAnimationSimple.prototype._mainAnimationHorizontal = function (currentSlide, nextSlide, reversed, currentSlideIndex, nextSlideIndex) {
        this.__mainAnimationDirection(currentSlide, nextSlide, 'horizontal', 1, reversed, currentSlideIndex, nextSlideIndex);
    };

    SmartSliderMainAnimationSimple.prototype._mainAnimationVertical = function (currentSlide, nextSlide, reversed, currentSlideIndex, nextSlideIndex) {
        this._showSlide(nextSlide);
        this.__mainAnimationDirection(currentSlide, nextSlide, 'vertical', 1, reversed, currentSlideIndex, nextSlideIndex);
    };

    SmartSliderMainAnimationSimple.prototype._mainAnimationHorizontalParallax = function (currentSlide, nextSlide, reversed) {
        this.__mainAnimationDirection(currentSlide, nextSlide, 'horizontal', this.parameters.parallax, reversed);
    };

    SmartSliderMainAnimationSimple.prototype._mainAnimationVerticalParallax = function (currentSlide, nextSlide, reversed) {
        this._showSlide(nextSlide);
        this.__mainAnimationDirection(currentSlide, nextSlide, 'vertical', this.parameters.parallax, reversed);
    };

    SmartSliderMainAnimationSimple.prototype._mainAnimationHorizontalReversed = function (currentSlide, nextSlide, reversed, currentSlideIndex, nextSlideIndex) {
        this.__mainAnimationDirection(currentSlide, nextSlide, 'horizontal', 1, !reversed, currentSlideIndex, nextSlideIndex);
    };

    SmartSliderMainAnimationSimple.prototype._mainAnimationVerticalReversed = function (currentSlide, nextSlide, reversed, currentSlideIndex, nextSlideIndex) {
        this._showSlide(nextSlide);
        this.__mainAnimationDirection(currentSlide, nextSlide, 'vertical', 1, !reversed, currentSlideIndex, nextSlideIndex);
    };

    SmartSliderMainAnimationSimple.prototype._mainAnimationHorizontalReversedParallax = function (currentSlide, nextSlide, reversed) {
        this.__mainAnimationDirection(currentSlide, nextSlide, 'horizontal', this.parameters.parallax, !reversed);
    };

    SmartSliderMainAnimationSimple.prototype._mainAnimationVerticalReversedParallax = function (currentSlide, nextSlide, reversed) {
        this._showSlide(nextSlide);
        this.__mainAnimationDirection(currentSlide, nextSlide, 'vertical', this.parameters.parallax, !reversed);
    };

    SmartSliderMainAnimationSimple.prototype.__mainAnimationDirection = function (currentSlide, nextSlide, direction, parallax, reversed, currentSlideIndex, nextSlideIndex) {
        var property = '',
            propertyValue = 0,
            parallaxProperty = '',
            originalPropertyValue = 0;

        if (direction == 'horizontal') {
            property = nextend.rtl.left;
            parallaxProperty = 'width';
            originalPropertyValue = propertyValue = this.slider.dimensions.slideouter.width;
        } else if (direction == 'vertical') {
            property = 'top';
            parallaxProperty = 'height';
            originalPropertyValue = propertyValue = this.slider.dimensions.slideouter.height;
        }

        if (reversed) {
            propertyValue *= -1;
        }

        var inProperties = {
                ease: this.getEase()
            },
            outProperties = {
                ease: this.getEase()
            };
        var from = {};
        if (parallax != 1) {
            if (!reversed) {
                currentSlide.css('zIndex', 6);
                propertyValue *= parallax;
                nextSlide.css(property, propertyValue);
                from[property] = propertyValue;
            } else {
                currentSlide.css('zIndex', 6);
                inProperties[parallaxProperty] = -propertyValue;
                propertyValue *= parallax;
                from[property] = propertyValue;
                from[parallaxProperty] = -propertyValue;
            }
        } else {
            nextSlide.css(property, propertyValue);
            from[property] = propertyValue;
        }

        nextSlide.css('zIndex', 5);

        if (reversed || parallax == 1) {
            currentSlide.css('zIndex', 4);
        }

        this.slider.unsetActiveSlide(currentSlide);
        this.slider.setActiveSlide(nextSlide);

        var adjustedTiming = this.adjustMainAnimation();

        inProperties[property] = 0;

        this.timeline.fromTo(nextSlide.get(0), adjustedTiming.inDuration, from, inProperties, adjustedTiming.inDelay);
        outProperties[property] = -propertyValue;
        if (!reversed && parallax != 1) {
            outProperties[parallaxProperty] = propertyValue;
        }

        if (this.parameters.shiftedBackgroundAnimation != 0) {
            var needShift = false,
                resetShift = false;
            if (this.parameters.shiftedBackgroundAnimation == 'auto') {
                if (currentSlide.data('slide').hasLayers()) {
                    needShift = true;
                } else {
                    resetShift = true;
                }
            } else {
                needShift = true;
            }

            if (this._currentBackgroundAnimation && needShift) {
                this.timeline.shiftChildren(adjustedTiming.outDuration - adjustedTiming.extraDelay);
                if (this._currentBackgroundAnimation.shiftedPreSetup) {
                    this._currentBackgroundAnimation._preSetup();
                }
            } else if (resetShift) {
                this.timeline.shiftChildren(adjustedTiming.extraDelay);
                if (this._currentBackgroundAnimation.shiftedPreSetup) {
                    this._currentBackgroundAnimation._preSetup();
                }
            }
        }


        this.timeline.to(currentSlide.get(0), adjustedTiming.outDuration, outProperties, adjustedTiming.outDelay);

        if (this.isTouch && this.isReverseAllowed && parallax == 1) {
            var reverseSlideIndex = reversed ? currentSlideIndex + 1 : currentSlideIndex - 1;
            if (reverseSlideIndex < 0) {
                if (this.slider.parameters.carousel) {
                    reverseSlideIndex = this.slider.slides.length - 1;
                } else {
                    reverseSlideIndex = currentSlideIndex;
                }
            } else if (reverseSlideIndex >= this.slider.slides.length) {
                if (this.slider.parameters.carousel) {
                    reverseSlideIndex = 0;
                } else {
                    reverseSlideIndex = currentSlideIndex;
                }
            }
            this.reverseSlideIndex = reverseSlideIndex;
            if (reverseSlideIndex != nextSlideIndex) {

                if (reverseSlideIndex != currentSlideIndex) {
                    this.enableReverseMode();

                    var reverseSlide = this.slider.slides.eq(reverseSlideIndex);
                    if (direction == 'vertical') {
                        this._showSlide(reverseSlide);
                    }
                    reverseSlide.css(property, propertyValue);
                    var reversedInFrom = {},
                        reversedInProperties = {
                            ease: this.getEase()
                        },
                        reversedOutFrom = {},
                        reversedOutProperties = {
                            ease: this.getEase()
                        };

                    reversedInProperties[property] = 0;
                    reversedInFrom[property] = -propertyValue;
                    reversedOutProperties[property] = propertyValue
                    reversedOutFrom[property] = 0;

                    reverseSlide.trigger('mainAnimationStartIn', [this, currentSlideIndex, reverseSlideIndex, false]);
                    this.reverseTimeline.paused(true);
                    this.reverseTimeline.eventCallback('onComplete', this.onChangeToComplete, [currentSlideIndex, reverseSlideIndex, false], this);

                    this.reverseTimeline.fromTo(reverseSlide.get(0), adjustedTiming.inDuration, reversedInFrom, reversedInProperties, adjustedTiming.inDelay);
                    this.reverseTimeline.fromTo(currentSlide.get(0), adjustedTiming.inDuration, reversedOutFrom, reversedOutProperties, adjustedTiming.inDelay);
                }
            }
        }


        this.sliderElement.on('mainAnimationComplete.n2-simple-fade', $.proxy(function (e, animation, currentSlideIndex, nextSlideIndex) {
            this.sliderElement.off('mainAnimationComplete.n2-simple-fade');
            this.slider.slides.eq(nextSlideIndex)
                .css('zIndex', '')
                .css(property, '');
            this.slider.slides.eq(currentSlideIndex)
                .css('zIndex', '')
                .css(parallaxProperty, originalPropertyValue);
        }, this));
    };

    SmartSliderMainAnimationSimple.prototype.getExtraDelay = function () {
        return 0;
    };

    SmartSliderMainAnimationSimple.prototype.adjustMainAnimation = function () {
        var duration = this.parameters.duration,
            delay = this.parameters.delay,
            backgroundAnimationDuration = this.timeline.totalDuration(),
            extraDelay = this.getExtraDelay();
        if (backgroundAnimationDuration > 0) {
            var totalMainAnimationDuration = duration + delay;
            if (totalMainAnimationDuration > backgroundAnimationDuration) {
                duration = duration * backgroundAnimationDuration / totalMainAnimationDuration;
                delay = delay * backgroundAnimationDuration / totalMainAnimationDuration;
                if (delay < extraDelay) {
                    duration -= (extraDelay - delay);
                    delay = extraDelay;
                }
            } else {
                return {
                    inDuration: duration,
                    outDuration: duration,
                    inDelay: backgroundAnimationDuration - duration,
                    outDelay: extraDelay,
                    extraDelay: extraDelay
                }
            }
        } else {
            delay += extraDelay;
        }
        return {
            inDuration: duration,
            outDuration: duration,
            inDelay: delay,
            outDelay: delay,
            extraDelay: extraDelay
        }
    };

    SmartSliderMainAnimationSimple.prototype.hasBackgroundAnimation = function () {
        return false;
    };

    return SmartSliderMainAnimationSimple;
});
N2Require('SmartSliderFrontendBackgroundAnimation', ['SmartSliderMainAnimationSimple'], [], function ($, scope, undefined) {

    function SmartSliderFrontendBackgroundAnimation(slider, parameters, backgroundAnimations) {
        this._currentBackgroundAnimation = false;
        scope.SmartSliderMainAnimationSimple.prototype.constructor.call(this, slider, parameters);
        this.isReverseAllowed = false;

        this.bgAnimationElement = this.sliderElement.find('.n2-ss-background-animation');

        this.backgroundAnimations = $.extend({
            global: 0,
            speed: 'normal',
            slides: []
        }, backgroundAnimations);

        this.backgroundImages = slider.backgroundImages.getBackgroundImages();

        /**
         * Hack to force browser to better image rendering {@link http://stackoverflow.com/a/14308227/305604}
         * Prevents a Firefox glitch
         */
        slider.backgroundImages.hack();
    };

    SmartSliderFrontendBackgroundAnimation.prototype = Object.create(scope.SmartSliderMainAnimationSimple.prototype);
    SmartSliderFrontendBackgroundAnimation.prototype.constructor = SmartSliderFrontendBackgroundAnimation;

    /**
     * @returns [{scope.SmartSliderBackgroundAnimationAbstract}, {string}]
     */
    SmartSliderFrontendBackgroundAnimation.prototype.getBackgroundAnimation = function (i) {
        var animations = this.backgroundAnimations.global,
            speed = this.backgroundAnimations.speed;
        if (typeof this.backgroundAnimations.slides[i] != 'undefined' && this.backgroundAnimations.slides[i]) {
            var animation = this.backgroundAnimations.slides[i];
            animations = animation.animation;
            speed = animation.speed;
        }
        if (!animations) {
            return false;
        }
        return [animations[Math.floor(Math.random() * animations.length)], speed];
    },

        /**
         * Initialize the current background animation
         * @param currentSlideIndex
         * @param currentSlide
         * @param nextSlideIndex
         * @param nextSlide
         * @param reversed
         * @private
         */
        SmartSliderFrontendBackgroundAnimation.prototype._initAnimation = function (currentSlideIndex, currentSlide, nextSlideIndex, nextSlide, reversed) {
            this._currentBackgroundAnimation = false;
            var currentImage = this.backgroundImages[currentSlideIndex],
                nextImage = this.backgroundImages[nextSlideIndex];

            if (currentImage && nextImage) {
                var backgroundAnimation = this.getBackgroundAnimation(nextSlideIndex);

                if (backgroundAnimation !== false) {
                    var durationMultiplier = 1;
                    switch (backgroundAnimation[1]) {
                        case 'superSlow':
                            durationMultiplier = 3;
                            break;
                        case 'slow':
                            durationMultiplier = 1.5;
                            break;
                        case 'fast':
                            durationMultiplier = 0.75;
                            break;
                        case 'superFast':
                            durationMultiplier = 0.5;
                            break;
                    }
                    this._currentBackgroundAnimation = new scope['SmartSliderBackgroundAnimation' + backgroundAnimation[0].type](this, currentImage.element, nextImage.element, backgroundAnimation[0], durationMultiplier, reversed);

                    scope.SmartSliderMainAnimationSimple.prototype._initAnimation.apply(this, arguments);

                    this._currentBackgroundAnimation.postSetup();

                    this.timeline.set($('<div />'), {
                        opacity: 1, onComplete: $.proxy(function () {
                            if (this._currentBackgroundAnimation) {
                                this._currentBackgroundAnimation.ended();
                                this._currentBackgroundAnimation = false;
                            }
                        }, this)
                    });

                    return;
                }
            }

            scope.SmartSliderMainAnimationSimple.prototype._initAnimation.apply(this, arguments);
        };

    /**
     * Remove the background animation when the current animation finish
     * @param previousSlideIndex
     * @param currentSlideIndex
     */
    SmartSliderFrontendBackgroundAnimation.prototype.onChangeToComplete = function (previousSlideIndex, currentSlideIndex) {
        if (this._currentBackgroundAnimation) {
            this._currentBackgroundAnimation.ended();
            this._currentBackgroundAnimation = false;
        }
        scope.SmartSliderMainAnimationSimple.prototype.onChangeToComplete.apply(this, arguments);
    };

    SmartSliderFrontendBackgroundAnimation.prototype.onReverseChangeToComplete = function (previousSlideIndex, currentSlideIndex, isSystem) {
        if (this._currentBackgroundAnimation) {
            this._currentBackgroundAnimation.revertEnded();
            this._currentBackgroundAnimation = false;
        }
        scope.SmartSliderMainAnimationSimple.prototype.onReverseChangeToComplete.apply(this, arguments);
    };

    SmartSliderFrontendBackgroundAnimation.prototype.getExtraDelay = function () {
        if (this._currentBackgroundAnimation) {
            return this._currentBackgroundAnimation.getExtraDelay();
        }
        return 0;
    };

    SmartSliderFrontendBackgroundAnimation.prototype.hasBackgroundAnimation = function () {
        return this._currentBackgroundAnimation;
    };

    return SmartSliderFrontendBackgroundAnimation;

});
N2Require('SmartSliderResponsiveSimple', ['SmartSliderResponsive'], [], function ($, scope, undefined) {

    function SmartSliderResponsiveSimple() {
        this.round = 1;
        scope.SmartSliderResponsive.prototype.constructor.apply(this, arguments);
    };

    SmartSliderResponsiveSimple.prototype = Object.create(scope.SmartSliderResponsive.prototype);
    SmartSliderResponsiveSimple.prototype.constructor = SmartSliderResponsiveSimple;

    SmartSliderResponsiveSimple.prototype.init = function () {

        if (this.sliderElement.find('.n2-ss-section-main-content').length) {
            this.updateVerticalRatios = this._updateVerticalRatios;
        }

        this._sliderHorizontal = this.addHorizontalElement(this.sliderElement, ['width', 'marginLeft', 'marginRight'], 'w', 'slider');
        this.addHorizontalElement(this.sliderElement.find('.n2-ss-slider-1'), ['width', 'paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'], 'w');

        this._sliderVertical = this.addVerticalElement(this.sliderElement, ['height', 'marginTop', 'marginBottom'], 'h', 'slider');
        this.addHorizontalElement(this.sliderElement, ['fontSize'], 'fontRatio', 'slider');
        this.addVerticalElement(this.sliderElement.find('.n2-ss-slider-1'), ['height', 'paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'], 'h');

        this.addHorizontalElement(this.sliderElement.find('.n2-ss-slide'), ['width'], 'w', 'slideouter');

        this.addVerticalElement(this.sliderElement.find('.n2-ss-slide'), ['height'], 'h', 'slideouter');

        var layerContainers = this.sliderElement.find('.n2-ss-layers-container');
        this.addHorizontalElement(layerContainers, ['width'], 'slideW', 'slide');
        this.addVerticalElement(layerContainers, ['height'], 'slideH', 'slide').setCentered();

        var parallax = this.slider.parameters.mainanimation.parallax;
        var backgroundImages = this.slider.backgroundImages.getBackgroundImages();
        for (var i = 0; i < backgroundImages.length; i++) {
            if (parallax != 1) {
                this.addHorizontalElement(backgroundImages[i].element, ['width'], 'w');
                this.addVerticalElement(backgroundImages[i].element, ['height'], 'h');
            }
        }


        var video = this.sliderElement.find('.n2-ss-slider-background-video');
        if (video.length) {
            if (video[0].videoWidth > 0) {
                this.videoPlayerReady(video);
            } else {
                video[0].addEventListener('error', $.proxy(this.videoPlayerError, this, video), true);
                video[0].addEventListener('canplay', $.proxy(this.videoPlayerReady, this, video));
            }
        }
    };

    SmartSliderResponsiveSimple.prototype.videoPlayerError = function (video) {
        video.remove();
    };

    SmartSliderResponsiveSimple.prototype.videoPlayerReady = function (video) {
        video.data('ratio', video[0].videoWidth / video[0].videoHeight);
        video.addClass('n2-active');

        this.slider.ready($.proxy(function () {
            this.slider.sliderElement.on('SliderResize', $.proxy(this.resizeVideo, this, video));
            this.resizeVideo(video);
        }, this));
    };

    SmartSliderResponsiveSimple.prototype.resizeVideo = function (video) {

        var mode = video.data('mode'),
            ratio = video.data('ratio'),
            slideOuter = this.slider.dimensions.slideouter || this.slider.dimensions.slide,
            slideOuterRatio = slideOuter.width / slideOuter.height;

        if (mode == 'fill') {
            if (slideOuterRatio > ratio) {
                video.css({
                    width: '100%',
                    height: 'auto'
                });
            } else {
                video.css({
                    width: 'auto',
                    height: '100%'
                });
            }
        } else if (mode == 'fit') {
            if (slideOuterRatio < ratio) {
                video.css({
                    width: '100%',
                    height: 'auto'
                });
            } else {
                video.css({
                    width: 'auto',
                    height: '100%'
                });
            }
        }
    };

    return SmartSliderResponsiveSimple;
});
N2Require('SmartSliderSimple', ['SmartSliderAbstract'], [], function ($, scope, undefined) {

    function SmartSliderSimple(elementID, parameters) {

        this.type = 'simple';
        this.responsiveClass = scope.SmartSliderResponsiveSimple;

        parameters = $.extend({
            bgAnimations: 0,
            carousel: 1
        }, parameters);

        scope.SmartSliderAbstract.prototype.constructor.call(this, elementID, parameters);
    };

    SmartSliderSimple.prototype = Object.create(scope.SmartSliderAbstract.prototype);
    SmartSliderSimple.prototype.constructor = SmartSliderSimple;

    SmartSliderSimple.prototype.initMainAnimation = function () {

        if (nModernizr.csstransforms3d && nModernizr.csstransformspreserve3d && this.parameters.bgAnimations) {
            this.mainAnimation = new scope.SmartSliderFrontendBackgroundAnimation(this, this.parameters.mainanimation, this.parameters.bgAnimations);
        } else {
            this.mainAnimation = new scope.SmartSliderMainAnimationSimple(this, this.parameters.mainanimation);
        }
    };

    return SmartSliderSimple;

});