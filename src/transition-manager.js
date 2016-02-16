/**                   _
 *  _             _ _| |_
 * | |           | |_   _|
 * | |___  _   _ | | |_|
 * | '_  \| | | || | | |
 * | | | || |_| || | | |
 * |_| |_|\___,_||_| |_|
 *
 * (c) Huli Inc
 */

define([
            'jquery',
            'ju-shared/observable-class'
        ],
        function(
                    $,
                    ObservableClass
                ) {
    'use strict';

    // Constants
    var HIDDEN_PAGE_CSS = 'hidden',
        SCROLL_TARGET = 'html,body';

    /**
     * This class will handle the transition between pages with a slide effect
     */
    var TransitionManager = ObservableClass.extend({
        /**
         * Default constructor
         */
        init : function() {
            this.transitionableClass = 'transitionable';

            // Constants to control scroll mode
            this.SCROLL = {
                ANIM : 'anim',
                STATIC : 'static',
                NONE : 'none'
            };

        },
        applyTransition : function(currentPageSelec, nextPageSelec, direction) {
            var self = this,
                $currentPage = $(currentPageSelec),
                $nextPage = $(nextPageSelec);

            direction = direction || 1;
            $currentPage.addClass(this.transitionableClass);

            var windowWidth = $(window).width();
            var translateRuleCurrent, translateRuleNext, translateRuleNextEnd;
            if (direction == 1) {
                translateRuleCurrent = 'translateX(-' + windowWidth + 'px)';
                translateRuleNext = 'translateX(' + windowWidth + 'px)';
                translateRuleNextEnd = 'translateX(0px)';
            } else {
                translateRuleCurrent = 'translateX(' + windowWidth + 'px)';
                translateRuleNext = 'translateX(-' + windowWidth + 'px)';
                translateRuleNextEnd = 'translateX(0px)';
            }

            $nextPage.css({
                                position : 'absolute',
                                top : 0,
                                '-webkit-transform' : translateRuleNext,
                                '-moz-transform' : translateRuleNext,
                                '-ms-transform' : translateRuleNext,
                                '-o-transform' : translateRuleNext,
                                transform : translateRuleNext
                             });
            $currentPage.css({
                                '-webkit-transform' : translateRuleCurrent,
                                '-moz-transform' : translateRuleCurrent,
                                '-ms-transform' : translateRuleCurrent,
                                '-o-transform' : translateRuleCurrent,
                                transform : translateRuleCurrent
                             });

            setTimeout(function() {
                $nextPage.addClass(self.transitionableClass);
                $nextPage.css({display : 'block'});
                setTimeout(function() {
                    $nextPage.css({
                                    // 'display' : 'block',
                                    '-webkit-transform' : translateRuleNextEnd,
                                    '-moz-transform' : translateRuleNextEnd,
                                    '-ms-transform' : translateRuleNextEnd,
                                    '-o-transform' : translateRuleNextEnd,
                                    transform : translateRuleNextEnd
                                 });
                    setTimeout(function() {
                        $nextPage.css({
                                    position : '',
                                    top : ''
                                 });
                        $currentPage.hide();
                     }, 300);
                }, 0);
            }, 0);
        },
        transition : function($currentPage, $nextPage, from, scrollTopMode) {
            scrollTopMode = scrollTopMode || this.SCROLL.ANIM;
            log('TransitionManager: ', arguments);

            if (!$currentPage || !from) {
                $nextPage.removeClass(HIDDEN_PAGE_CSS).show();
                // $nextPage.attr("class", "page center");
            } else {
                $currentPage.hide();
                $nextPage.removeClass(HIDDEN_PAGE_CSS).show();
            }
            switch (scrollTopMode) {
                case this.SCROLL.ANIM:
                    $(SCROLL_TARGET).animate({ scrollTop : 0 });
                    break;
                case this.SCROLL.STATIC:
                    this.moveScrollTo(0);
                    break;
                default:
                    break;
            }
        },
        /**
         *  Moves the scroll to a specific position
         */
        moveScrollTo : function(position) {
            $(SCROLL_TARGET).scrollTop(position);
        },
        /**
         * Sets the scroll of the page to the bottom
         */
        moveScrollToBottom : function() {
            // We use a timeout to allow the reflow + repaint process to complete
            setTimeout(function() {
                $(SCROLL_TARGET).animate({ scrollTop : $(document).height() });
                // $(SCROLL_TARGET).scrollTop($(document).height());
            }, 100);
        },
        /**
         * Animates the scroll to the specified position
         */
        animateScrollTo : function(scrollTop, callback) {
            // Flag to control that the callback is executed only once per method call
            var callbackExecuted = false;

            $(SCROLL_TARGET).animate(
                // Property
                {
                    scrollTop : scrollTop
                },
                // Options
                {
                    complete : function() {
                        if (callbackExecuted) {
                            return;
                        }
                        callbackExecuted = true;
                        if (callback) {
                            callback();
                        }
                    }
                });
        },
        transitionSmooth : function($currentPage, $nextPage, from) {
            log('TransitionManager: ', arguments);

            if (!$currentPage || !from) {
                $nextPage.addClass('page center');
                // $nextPage.attr("class", "page center");
                return;
            }

            // Position the page at the starting position of the animation
            $nextPage.removeClass('transition center left right').addClass('class', 'page ' + from).show();

            $currentPage.one('webkitTransitionEnd', function(e) {
                log('webkitTransitionEnd');
                $(e.target).remove();
            });

            // Force reflow. More information here: http://www.phpied.com/rendering-repaint-reflowrelayout-restyle/
            $('#main-tab-container')[0].offsetWidth;    // jshint ignore:line

            // Position the new page and the current page at the ending position of their animation with a transition class indicating the duration of the animation
            $nextPage.addClass('transition center');
            $currentPage.removeClass('center').addClass('page transition ' + (from === 'left' ? 'right' : 'left'));
        },
        // slidePageFrom : function (page, from) {
        //     var self = this,
        //         $currentPage = $(currentPageSelec),
        //         $nextPage = $(nextPageSelec),
        //         direction = direction || 1;

        //     // container.append(page);

        //     if (!$currentPage || !from) {
        //         page.attr("class", "page center");
        //         $currentPage = page;
        //         return;
        //     }

        //     // Position the page at the starting position of the animation
        //     page.attr("class", "page " + from);

        //     $currentPage.one('webkitTransitionEnd', function(e) {
        //         $(e.target).remove();
        //     });

        //     // Force reflow. More information here: http://www.phpied.com/rendering-repaint-reflowrelayout-restyle/
        //     container[0].offsetWidth;

        //     // Position the new page and the current page at the ending position of their animation with a transition class indicating the duration of the animation
        //     page.attr("class", "page transition center");
        //     $currentPage.attr("class", "page transition " + (from === "left" ? "right" : "left"));
        //     $currentPage = page;
        // },
        /**
         * Returns the transition end property that works with the current browser
         * @return {[string]} [transition end property]
         */
        getTransitionEndProperty : function() {
            /**
             * Transition-end mapping
             */
            var map = {
                WebkitTransition : 'webkitTransitionEnd',
                MozTransition : 'transitionend',
                OTransition : 'oTransitionEnd',
                msTransition : 'MSTransitionEnd',
                transition : 'transitionend'
            };

            /**
             * Expose `transitionend`
             */
            var el = document.createElement('p');

            for (var transition in map) {
                if (null != el.style[transition]) {
                   return map[transition];
                }
            }
        },
        getAnimationEndProperty : function() {
            /**
             * Animation-end mapping
             */
            var map = {
                WebkitTransition : 'webkitAnimationEnd',
                MozTransition : 'animationend',
                OTransition : 'oTransitionEnd',
                msTransition : 'animationend',
                transition : 'animationend'
            };

            /**
             * Expose `animati=onend`
             */
            var el = document.createElement('p');

            for (var animation in map) {
                if (null != el.style[animation]) {
                   return map[animation];
                }
            }
        },
        /**
         * Slide up a container with CSS3 transition
         */
        slideUp : function($group) {
            var self = this,
                $child = $group.children(),
                transitionEndProp = self.getTransitionEndProperty();
            if (transitionEndProp) {
                var childHeight = $child.height();
                $group.css({ height : childHeight });
                $group.one(transitionEndProp, function() {
                     $group.removeClass('expanded transition');
                });
                // // Triggers a reflow to flush the expanded
                $group[0].offsetWidth;  // jshint ignore:line
                $group.addClass('transition');
                $group[0].offsetWidth;  // jshint ignore:line
                $group.css({ height : 0 });
            } else {
                $group.removeClass('expanded');
            }
        },
        /**
         * Slide down a container with CSS3 transition
         */
        slideDown : function($group) {
            var self = this,
                $child = $group.children(),
                transitionEndProp = self.getTransitionEndProperty();
            if (transitionEndProp) {
                $group.css({ height : 0 });
                $group.addClass('transition expanded');
                $group.one(transitionEndProp, function() {
                    $group.removeClass('transition');
                    // Triggers a reflow to flush the expanded
                    $group[0].offsetWidth;  // jshint ignore:line
                    $group.css({ height : '' });
                });
                // Triggers a reflow to flush the expanded
                $group[0].offsetWidth;  // jshint ignore:line
                var childHeight = $child.height();
                $group.css({ height : childHeight });
            } else {
                $group.addClass('expanded');
            }
        }
    });

    /**
     * Export models
     */
    // context.TransitionManager = TransitionManager;
    return TransitionManager;

});
