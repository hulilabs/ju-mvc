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
            'ju-shared/class'
        ],
        function(
                    $,
                    Class
                ) {
    'use strict';

    /**
     * Infinite Scroll class
     * Containes information
     */
    var InfiniteScroll = Class.extend({
        /**
         * Initializes the Infinite scroll
         * @param  {object} userParams an object with the following format
         *                             {
         *                                 listenScrollOnElem : elem to which the scroll action will be bound
         *                             }
         * @return {void}
         */
        init : function(userParams) {
            log('InfiniteScroll init');
            // Initialize query params
            var params = {
                listenScrollOnElem : window,
                thresholdCallback : null,
                bottomThreshold : 0,
                contentDocument : document
            };

            $.extend(params, userParams);
            this.params = params;
            this.$listenScrollOnElem = $(this.params.listenScrollOnElem);
        },
        listen : function() {
            this.$listenScrollOnElem.scroll($.proxy(this._onScrollTrigger, this));
        },
        _onScrollTrigger : function() {
            var self = this;
            var viewPortScrollTop = self.$listenScrollOnElem.scrollTop(),
                viewPortHeight = self.$listenScrollOnElem.height(),
                contentHeight = $(self.params.contentDocument).height(),
                threshold = self.params.bottomThreshold,
                scrollOffset = Math.max(contentHeight - viewPortHeight - threshold, 0);

            // log(viewPortScrollTop, viewPortHeight, contentHeight, threshold, scrollOffset);
            if ((contentHeight > viewPortHeight) && (viewPortScrollTop >= scrollOffset)) {
                log('Reached Infinite scroll threshold...');
                if (self.params.thresholdCallback) {
                    self.params.thresholdCallback();
                }
            }

        }
    });

    //export module
    // context.InfiniteScroll = InfiniteScroll;
    return InfiniteScroll;

});
