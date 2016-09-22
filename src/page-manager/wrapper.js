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
 * Customize a route to be display inside a wrapper component like a toast
 * or a dialog. This will also handle routing and dependencies loading
 *
 * @see  PageManager route option
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

    var RouteWrapper = Class.extend({
        /**
         * Constructor
         *
         * @param  {object} controllerInfo  route defintion
         * @param  {object} controllerStack PageManager controllers stack
         */
        init : function(controllerInfo, controllerStack) {
            // Store controllerInfo reference
            this.controllerInfo = controllerInfo || {};
            this.hasWrapper = !!this.controllerInfo.controllerWrapper,
            this.controllerWrapper = this.hasWrapper ? this.controllerInfo.controllerWrapper : {};

            // Ease access to the number of controllers in stack
            var controllerStackLength = controllerStack.length;

            // Flags : requested controller can be root or stacked
            // By default, a requested controller is root so it is not stacked
            this.isRootController = controllerStackLength === 0;
            this.doStackController = !this.isRootController && this.hasWrapper;

            // Store reference to current controller (not necessarily the first in the stack)
            this.currentController = this.doStackController ? controllerStack[controllerStackLength-1] : null;
        },
        /**
         * Prepare requested controller info based on how it is requested:
         * - Directly: display without wrapper (view)
         * - After: display wrapper (overlay)
         *
         * @return {Object} original or modified clone of controller info
         */
        prepareControllerInfo : function() {
            if (this.doStackController) {
                // Clone controller info to avoid overriding
                // the original routing information
                this.controllerInfo = $.extend(true, {
                    // Define wrapped controller rootId as current controller
                    // this will stack the dialog as a child of current controller
                    rootId : this.currentController
                }, this.controllerInfo);
            }

            return this.controllerInfo;
        },
        /**
         * Add the controller wrapper as a dependency to be loaded. Extracts wrapper path
         * from additional configuration and stores it in `dependencies` object
         *
         * @param {object} injectedDependencies
         */
        handleDependencies : function(injectedDependencies) {
            if (injectedDependencies && injectedDependencies.controllerWrapper) {
                Logger.warn('PageManager: invalid property name "controllerWrapper"');
            }

            if (this.doStackController) {
                // in this scenario, no options are provided
                // and we have the path to the controller wrapper
                if ('string' === typeof this.controllerWrapper) {
                    injectedDependencies.controllerWrapper = this.controllerWrapper;
                    return;
                }

                // otherwise, we assume options are provided
                // hence we check that wrapper path is provided
                if (!this.controllerWrapper.wrapper) {
                    Logger.error('PageManager: unable to load wrapper from route configuration');
                }

                // we add the controller wrapper as a dependency
                injectedDependencies.controllerWrapper = this.controllerWrapper.wrapper;
            }
        },
        /**
         * Passes a controller and controllerInfo to an external handler
         * that can use them to perform common tasks like view preprocessing
         *
         * @param  {Object}  controller     a controller instance that will handle a route
         * @param  {boolean} alreadyInStack controller is in stack
         * @param  {Object}  options
         *
         * @return {Promise} chaining methods may user wrapper context as first argument
         */
        wrapControllerBeforeHandlingRoute : function(controller, alreadyInStack, options) {
            // Verify options
            options = options || {}

            // Determine wrapper options
            if (controller[RouteWrapper.MEMBER]) {
                var controllerWrapperOptions = ('string' === typeof this.controllerWrapper) ?
                        {} : this.controllerWrapper,
                    wrapperOptions = $.extend(true, {},
                        controllerWrapperOptions,
                        options.wrapperOptions
                    ),
                    wrapperPromise = new Promise(function(resolve) {
                        controller[RouteWrapper.MEMBER].wrap(resolve, wrapperOptions, alreadyInStack);
                    });

                return wrapperPromise;
            }

            // Return no wrapper context
            // This point is mostly reached by controllers without wrapper
            return Promise.resolve(null);
        }
    });

    RouteWrapper.classMembers({
        MEMBER : '__wrapper',
        /**
         * Define RouteWrapper.MEMBER with an instance of any loaded wrapper into controllerInstance
         * using the dependencies info, as the wrapper is loaded in the dependencies flow
         *
         * After RouteWrapper.MEMBER is set, `controllerWrapper` member is removed from `dependenciesInfo`
         *
         * @param {Object} controllerInstance
         * @param {Object} dependenciesInfo
         */
        setWrapperInstanceIntoController : function(controllerInstance, dependenciesInfo) {
            // sets any controller wrapper loaded in the dependency flow
            if (dependenciesInfo.controllerWrapper &&
                dependenciesInfo.controllerWrapper.instance) {

                controllerInstance[RouteWrapper.MEMBER] = controllerInstance[RouteWrapper.MEMBER] ||
                                               new dependenciesInfo.controllerWrapper.instance(controllerInstance);
                dependenciesInfo.controllerWrapper = null;
                delete(dependenciesInfo.controllerWrapper);
            }
        },
        /**
         * Destroy RouteWrapper.MEMBER belongin to a loaded controller
         *
         * @param  {Object} controllerInstance
         */
        destroyWrapper : function(controllerInstance) {
            if (controllerInstance && controllerInstance[RouteWrapper.MEMBER]) {
                controllerInstance[RouteWrapper.MEMBER].destroy();
            }
        }
    });

    return RouteWrapper;
});
