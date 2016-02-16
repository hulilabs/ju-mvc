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

/**
 * Controller Class
 */
define([
            'jquery',
            'ju-shared/observable-class',
            'ju-mvc/router'
        ],
        function(
                $,
                ObservableClass,
                Router
                ) {
    'use strict';

    // Constants
    var HIDDEN_PAGE_CSS = 'hidden';

    var Controller = ObservableClass.extend({
        /**
         * Default constructor
         */
        init : function(elem, params) {     // jshint ignore:line
            this.MAIN_CONTENT_SELECTOR = '#site-content';

            // This variable must have a jQuery reference to the view of this controller
            this.$container = null;

            // This variable must have a jQuery reference to the page view of this controller
            // In most cases this is the same object as $container
            this.$pageContainer = null;

            // Store a list of events enabled for this VIEW
            this.EV = {};
        },
        /**
         * Must be implemented in child classes
         */
        handleRoute : function(alreadyInStack, routerParams, urlParams) {  // jshint ignore:line
            this.routerParams = routerParams;
            this.alreadyInStack = alreadyInStack;
            this.urlParams = urlParams;
            // Store the query string params in a separate reference
            // http://jsperf.com/get-last-item-from-array
            this.queryParams = Router.getQueryStringMap(urlParams);
        },
        /**
         * Must be implemented in child classes
         */
        load : function() {},
        /**
         * Setup this view
         * Must be implemented in child classes
         */
        setupPage : function() {},

        /**
         * Binds events to the page
         */
        bindEvents : function() {},

        setContent : function(htmlContent) {
            this._setContainerWithHtml(htmlContent);
            $(this.MAIN_CONTENT_SELECTOR).html(this.$container);
        },
        /**
         * Overwrite this method if the page container is not equal to the local $container
         */
        findPageContainer : function() {
            return this.$container;
        },
        /**
         * Appends a page markup to the tab's container
         */
        appendPage : function(htmlContent) {
            // Add new content
            this._setContainerWithHtml(htmlContent);
            this.$container.addClass(HIDDEN_PAGE_CSS);
            $(this.MAIN_CONTENT_SELECTOR).append(this.$container);
        },
        /**
         * Register events to the EV variable
         */
        registerEventNames : function(events) {
            if (!events) { return; }
            for (var eventAlias in events) {
                if (events.hasOwnProperty(eventAlias)) {
                    var eventName = events[eventAlias];
                    this.EV[eventAlias] = eventName;
                }
            }
        },
        /**
         * Private functions
         */
        _setContainerWithHtml : function(htmlContent) {
            // Add new content
            this.$container = htmlContent instanceof $ ? htmlContent : $($.parseHTML(htmlContent));
            this.$pageContainer = this.findPageContainer();
        },
        /**
         * A call to this function will clean up any resources that should be removed
         * from memory or from the DOM tree
         */
        destroy : function() {
            // if (this.$pageContainer) {
            //     this.$pageContainer.remove();
            // } else {
            //     Logger.warn('BaseModule: cannot remove $pageContainer');
            // }
        },
        /**
         * This function will be called on the current controller before be sent to the page stack
         * The idea is to be used as destroy but to hide elements on the actual view before display
         * the new view
         */
        onViewHidden : function() {
            //
        }
    });

    // Exports
    return Controller;

});
