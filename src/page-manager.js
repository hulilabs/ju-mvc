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
 * Status Constants
 */
define([
            'jquery',
            'ju-shared/observable-class',
            'ju-shared/util',
            'ju-mvc/controller-wrapper',
            'ju-mvc/middleware',
            'ju-mvc/router',
            'ju-mvc/transition-manager',
            'ju-shared/logger'
        ],
        function(
            $,
            ObservableClass,
            Util,
            ControllerWrapper,
            Middleware,
            Router,
            TransitionManager
        ) {

    'use strict';

    /**
     * This is a direct mapping of the
     * HH.Status class
     */
    var PageManager = ObservableClass.extend({
        /**
         * Default constructor
         */
        init : function() {
            // Stores a reference to the router
            this.router = new Router();

            // Stores a reference to all the routes registered in the page manager
            this.routesMap = {};

            // Keeps a track of the controller display order ( would be useful in the overlay order )
            // Stores routeIds
            this.controllerStack = [];

            // Keeps track of the controller that have been instanciated before
            // Key is the routeId and the value is the controller itself
            this.controllerDict = {};

            // Keeps track of the controllers marked as singleton instances
            // Key is the controller path, and the value is the controller itself
            this.singletonControllerDict = {};

            // Flag to indicate if the last controller was recently added
            this.recentlyAddedController = false;

            // Keeps track of the current controller
            this.currentController = null;
            // Keeps track of the current controller name including the namespace
            // Which makes it unique
            this.currentControllerName = null;

            // Stores the controller that is currently displayed
            this.currentDisplayedController = null;

            // @TODO: temporally commenting this part until we move it
            //        to method call context instead of instance variable
            // this.redirected = false;

            // Stores a local reference to the transition manager
            this.transitionManager = TransitionManager.getInst();

            // Register events
            this.EV = {
                HANDLE_ROUTE : 'handleRoute',
                DISPATCH_PAGE : 'dispatchPage',
                // Controller related events
                READY : 'ready',
                ERROR_LOADING : 'errLoading'
            };

            this.middleware = Middleware.getInst();
        },
        /**
         * Load routes mapping with controllers
         */
        routes : function(routes) {
            // Registers all the routes with its controllers

            this._processRoutes(routes);
        },
        /**
         * Methods to navigate to a new page given the path
         *
         * @param  {string}   path   route path (with or without hash #)
         * @param  {mutliple} params (Optional) routing configuration
         *                           - Function: handled callback
         *                           - Object: parameters
         */
        navigateToPage : function(path, params) {
            var routeHandled = $.isPlainObject(params) && params.routeHandled ?
                params.routeHandled : (typeof params === 'function' ? params : $.noop);

            // this.redirected = false;
            this._navigate(path, $.extend(true, {}, params, {
                trigger : true,
                force : true,
                routeHandled : routeHandled
            }));
        },
        /**
         * Find route by name and construct path
         *
         * @param {string} name route name or ID
         * @param {args}   arguments to replace by position in route path
         *
         * Alternative params can be passed as object for adding handler support
         * {
         *     route: 'some-route-id',
         *     params : ['p1','p2'],
         *     routeHandled : function () {...},
         *     queryString : {
         *         key1 : 'value1',
         *         key2 : 'value2'
         *     }
         * }
         *
         * @param {object} including keys for route (string), params (array), routeHandled (function)
         */
        navigateToRoute : function() {
            var definition = arguments[0],
                path = '', routeHandled;

            if ($.isPlainObject(definition)) {
                routeHandled = definition.routeHandled;
                path = this.buildPath(definition);
            } else {
                path = this.router.buildPath.apply(this.router, arguments);
            }

            this.navigateToPage(path, definition);
        },
        /**
         * Builds a path using a definition object
         * @param  {String} definition.route  the route's id
         * @param  {Array}  definition.params url params array
         * @param  {Object} definition.queryString queryString map object
         * @return {String}
         */
        buildPath : function(definition) {
            var path = this.router.buildPath.apply(this.router, $.merge([definition.route], definition.params));
            // builds the query string using the definition.queryString object
            if ($.isPlainObject(definition.queryString) &&
                !$.isEmptyObject(definition.queryString)) {
                path += this.router.formatQueryString(definition.queryString);
            }

            return path;
        },
        /**
         * Navigates to the previous page in the browser history API
         */
        navigateToPreviousPage : function() {
            window.history.go(-1);
        },
        /**
         * Navigates to a specific controller without creating a new entry
         * in the router
         */
        navigateToController : function(controllerPath, args) {
            this._handleRoute({ controller : controllerPath }, args);
        },
        /**
         * Pushes a route to the history API but doesn't navigate to it
         * @param {Object} routeDefinition definition object to push
         */
        pushRoute : function(routeDefinition) {
            var path = this.buildPath(routeDefinition);
            this.pushPath(path);
        },
        /**
         * Pushes a path to the history API but doesn't navigate to it
         * @param  {String} path url to push
         */
        pushPath : function(path) {
            this._navigate(path, { trigger : false });
        },
        /**
         * Replaces the current History API entry using a route definition
         * @param {Object} routeDefinition definition object
         */
        replaceCurrentRoute : function(routeDefinition) {
            var path = this.buildPath(routeDefinition);
            this.replaceCurrentPath(path);
        },
        /**
         * Replaces the current History API entry using a path
         * @param {String} path url
         */
        replaceCurrentPath : function(path) {
            this._navigate(path, { replace : true });
        },
        /**
         * Reloads the currently loaded component
         */
        reloadCurrentRoute : function(routeHandled) {
            var currentFragment = this.router.getHistory().getFragment();
            this._navigate(currentFragment, { replace : true, trigger : true, force : true, routeHandled : routeHandled });
        },
        /**
         * Returns the current controller
         * @return {obj} instance of the controller
         */
        getCurrentController : function() {
            return this.currentController;
        },
        /**
         * Returns the current controller name
         * @return {string} Name of the current controller
         */
        getCurrentControllerName : function() {
            return this.currentControllerName;
        },
        /**
         * Returns the current route without any params
         */
        getCurrentRoute : function() {
            var currentFragment = this.router.getHistory().getFragment(),
                route = currentFragment.split('?');
            return route[0];
        },

        /**
         * Returns the controller path for a particular route
         *
         * @param {string} route that is used as a key to get the configuration of the route
         *
         * @return {Function} controller that handles that route
         */
        getRouteController : function(route) {
            return this.routesMap[route] ? this.routesMap[route].controller : null;
        },

        /**
         * Returns the current params in the route
         */
        getCurrentParams : function() {
            var currentFragment = this.router.getHistory().getFragment(),
                parts = currentFragment.split('?'),
                params = '';
                // remove the first element that is the route
                parts.splice(0, 1);

                params = parts.length > 0 ? '?' + parts.join('?') : '';

            return params;
        },
        /**
         * Namespace checking function
         */
        checkNamespace : function(ns) {
            var pieces = ns.split('.'),
                current = window;
            for (var i in pieces) {
                if (!(current = current[pieces[i]])) {
                    return false;
                }
            }
            return true;
        },

        /***
         * Defines the middleware handler
         * @param middleware
         */
        setMiddleware : function(middleware) {
            /** Stores a local reference to the middleware handler */
            this.middleware = middleware;
        },
        /**
         * Private functions
         */
        /**
         * Receives a Router-Controller mapping and converts
         *
         *  Each route could have the following structure
         *
         *  'calendar-appointment' :    // Route ID
         *  {
         *          // Route: specifies the routing expression. String or regular expression
         *          route: 'calendar/appointment(/)(:params)',
         *          // Root: specifies if this route requires a particular route to
         *          //       exists in the controller stack. Must match the route ID
         *          root: 'calendar-landing',
         *          // Controller: this must match the path to the controller
         *          //             that will be instantiated
         *          controller: 'HH.Calendar.Mobile.Appointment',
         *          // Params: This are params that will be passed to the handleRoute
         *          //          method of the controller
         *          params: {
         *              nav: 'calendar'
         *          }
         *  }
         */
        _processRoutes : function(routerControllerMap) {
            var self = this,
                router = this.router,
                routeHandler = 'routeHandler';
            Logger.log('PageManager: _processRoutes..', routerControllerMap);

            this.routesMap = $.extend({}, this.routesMap, routerControllerMap);
            $.each(routerControllerMap, function(routeId, controllerInfo) {
                if (!$.isPlainObject(controllerInfo) ||
                    !controllerInfo.route ||
                    !controllerInfo.controller) {
                    Logger.warn('PageManager: ControllerInfo format is not valid ->', controllerInfo);
                    return;
                }
                controllerInfo.routeId = routeId;
                Logger.log('PageManager: Processing route..', routeId, controllerInfo, routeHandler);
                router.route(controllerInfo.route, routeId, function(urlParams, options) {
                                                            urlParams = self._normalizeQueryParams(urlParams);
                                                            self._handleRoute(controllerInfo, urlParams, options);
                                                         });
            });
        },
        /**
         * Method to navigate to a new page given the path
         */
        _navigate : function(path, options) {
            this.middleware.run(Middleware.PHASES.ROUTE, Middleware.SUBPHASES.BEFORE_UNLOAD, arguments, function() {
                log('PageManager: navigating to...', path, options);
                this.router.navigate.call(this, path, options);
            }.bind(this));
        },
        /**
         * Given a routeId we will look for it in the controller stack and return the index.
         * This method will also check that we don´t have the same routeId twice in the stack.
         * Explanation below:
         *
         * As of now, the stack is working with the routeId and hence we are only allowing one
         * variation of the route pattern in the ´virtual´ stack. We might consider using the final route
         * as the key for the controller stack in the future to allow more than one variations of the same routeId.
         *
         */
        _getControllerIndexInStack : function(routeId) {

            var stackLength = this.controllerStack.length,
                controllerIndex = -1;

            for (var stackIndex = 0; stackIndex < stackLength; stackIndex++) {
                var stackRouteId = this.controllerStack[stackIndex];
                if (stackRouteId == routeId) {
                    if (controllerIndex != -1) {
                        // This means that the routeId was already found previously in the stack
                        // This is an error scenario because we only support one routeId as of now.
                        Logger.error('PageManager: Duplicate routeIds found in the controller stack');
                        // Reset back to initial value
                        controllerIndex = -1;
                    } else {
                        controllerIndex = stackIndex;
                    }
                }
            }

            return (controllerIndex);
        },

        /**
         * This function will handle all the routing request and will process accordingly
         * and process the page transition
         * @todo refactor this method, is too big
         */
        _handleRoute : function(controllerInfo, urlParams, options) {
            var self = this;
            /** runs all the defined middlewares for the route:before phase */
            self.middleware.run(Middleware.PHASES.ROUTE, Middleware.SUBPHASES.BEFORE, controllerInfo, function(/*result*/) {
                log('Handling route...', arguments);
                // Check if the specified controller exists
                // Check if the specified controller has been instanciated
                // Check if the specified controller was loaded
                // We try to resolve the specified controller path to an object
                var controllerPath = controllerInfo.controller,
                    routeId = controllerInfo.routeId,
                // route = controllerInfo.route,
                    isSingleton = controllerInfo.singleton || false,
                    controllerWrapper = new ControllerWrapper(controllerInfo, self.controllerStack);

                // If a wrapper is define, then add current controller name as rootId
                controllerInfo = controllerWrapper.prepareControllerInfo(controllerInfo);

                if (!controllerPath) {
                    log('PageManager: provided ControllerPath is null');
                    return;
                }

                var alreadyInStack = false,
                    rootStackIndex = -1,
                    removedControllers = null;

                // This function load the controller once it has been instanciated
                var loadControllerCallback = function() {
                    // This is a recently added controller is it was not in the stack
                    // previously
                    self.recentlyAddedController = !alreadyInStack;

                    // At this point the instance should already exists, because
                    // it was already in the stack or it was created by the _pushRouteToStack
                    // method
                    var instance = isSingleton ? self.singletonControllerDict[controllerPath]
                        : self.controllerDict[routeId];
                    log('PageManager: isSingleton? ', isSingleton);

                    // Handle route
                    var method = 'handleRoute'; // Default method method to handle requests
                    if (controllerInfo.method) {
                        method = controllerInfo.method;
                    }

                    // Check if valid instance was found
                    if (instance) {
                        // passes a controller instance to any available preprocessor
                        var wrapperPromise = ControllerWrapper.wrapControllerBeforeHandlingRoute(
                            instance, controllerWrapper.getOptions(), alreadyInStack, options
                        );

                        // the flow continues once the wrapper is ready or if there's no wrapper
                        wrapperPromise.then(function() {
                            instance[method].call(instance, alreadyInStack, controllerInfo.params, urlParams);

                            // If a handler was provided by the original navigateToPage, then execute it
                            if (options && options.routeHandled) {
                                var routeHandled = options.routeHandled;
                                routeHandled.call(self, controllerInfo, instance);
                            }

                            self.currentControllerName = controllerPath;
                            self.currentController = instance;

                            // After handled route
                            self.trigger(self.EV.HANDLE_ROUTE, controllerInfo);
                        })
                        ['catch'](function(err) {
                            Logger.error(err);
                        });

                    }
                };

                // Check if the current controller has a root controller
                // This means that we cannot load the specified controlled unless the rootId exists in the controller stack
                if (controllerInfo.rootId) {

                    // First, check if the root controller is loaded in the current context
                    rootStackIndex = self._getControllerIndexInStack(controllerInfo.rootId);
                    if (rootStackIndex == -1) {
                        log('PageManager: root was not found, re-routing to root...');
                        // As the root is not loaded then we re-route to the root
                        var rootController = self.routesMap[controllerInfo.rootId],
                            rootPath = rootController.defaultRoute;

                        if (!rootPath) {
                            Logger.error('Attempting to navigate to a rootId without defaultRoute', rootController);
                        }

                        self.navigateToPage(rootPath);
                        return;
                    }

                    // If the controller is already in the stack
                    var stackIndex = self._getControllerIndexInStack(routeId);
                    if (stackIndex != -1) {
                        // Remove all the controllers in the stack beyond the
                        // current controller
                        removedControllers = self.controllerStack.splice(stackIndex + 1);
                        alreadyInStack = true;
                        log('Removed controllers: ', removedControllers);
                        self._destroyControllers(removedControllers, controllerInfo);
                        loadControllerCallback();
                    } else {
                        self._pushRouteToStack(routeId, controllerPath, isSingleton, loadControllerCallback);
                    }
                } else {

                    // This is a root controller
                    rootStackIndex = self._getControllerIndexInStack(routeId);
                    if (rootStackIndex == -1) {
                        // This is a routeId that is not registered in the stack and behaves as a root controller
                        // we need to clear the stack and create an instance of it
                        // This will create a new ´virtual´ stack
                        self._destroyControllers(self.controllerStack, controllerInfo);
                        self.controllerStack.length = 0;
                        self._pushRouteToStack(routeId, controllerPath, isSingleton, loadControllerCallback);
                    } else {
                        // If this route was already in the stack then we
                        // Remove all the controllers in the stack beyond

                        // This flow corresponds to 2 possible valid scenarios:
                        // 1 - The Page Manager is reloading the same route that is currently loaded in the URL
                        //      (using either the reload method or through any of the navigateMethods but to the same route)
                        // 2 - The controller stack has one or more routes loaded into it and from a children controller
                        //     we are indicating the page manager to route back to a controller that already exists
                        //     in the stack (most likely the root controller). This method will destroy all the previous
                        //     controllers, leaving just the root controller alive.

                        // @todo: this flow reloads current and next landing component but it shouldnt
                        removedControllers = self.controllerStack.splice(rootStackIndex + 1);
                        alreadyInStack = true;
                        log('Removed controllers: ', removedControllers);
                        self._destroyControllers(removedControllers, controllerInfo);
                        loadControllerCallback();
                    }
                }
            });
        },
        /**
         * Pushes the routeId to the top of the stack
         * and creates the related controller if it doesn't exist already
         */
        _pushRouteToStack : function(routeId, controllerPath, isSingleton, callback) {
            var self = this,
                instance = null;

            if (isSingleton) {
                // If this route is using a singleton instance then we
                // check if an instance has already been created from
                // the singleton instance controllers
                instance = this.singletonControllerDict[controllerPath];
                if (!instance) {
                    self._createControllerInstance(controllerPath, isSingleton, function(instance) {
                        // Adding a new instance to the controller dict
                        self.singletonControllerDict[controllerPath] = instance;

                        log('PageManager: _pushRouteToStack: ', routeId);
                        self.controllerStack.push(routeId);
                        callback();
                    });
                } else {
                    log('PageManager: _pushRouteToStack: ', routeId);
                    //Push the route to the stack
                    this.controllerStack.push(routeId);
                    callback();
                }
            } else {
                instance = this.controllerDict[routeId];
                // Checks whether the instance was already created
                if (!instance) {

                    self._createControllerInstance(controllerPath, isSingleton, function(instance) {
                        // Adding a new instance to the controller dict
                        self.controllerDict[routeId] = instance;

                        log('PageManager: _pushRouteToStack: ', routeId);
                        self.controllerStack.push(routeId);
                        callback();
                    });

                } else {
                    Logger.info('PageManager: An instance already exist for the routeId', routeId);
                    log('PageManager: _pushRouteToStack: ', routeId);
                    //Push the route to the stack
                    this.controllerStack.push(routeId);
                    callback();
                }
            }

            // return instance;
        },
        /**
         * Creates a brand new instance of the controller
         * with the specified path and subscribes to the READY event
         *
         * @param {string}   controllerPath        promise with the path to the controller
         * @param {boolean}  isSingleton           controller to be instance should be treated as singleton
         * @param {function} callback              after instance created callback
         *
         * @return {instaceof ControllerClass}
         */
        _createControllerInstance : function(controllerPath, isSingleton, callback) {
            var self = this;
            // Once the dependencies are loaded then fetch the controller itself
            controllerPath().then(function(ControllerClass) {
                var instance = null;

                if (ControllerClass) {
                    log('PageManager: Instanciating controller...');
                    instance = (ControllerClass.getInst && isSingleton) ?
                                    ControllerClass.getInst() : new ControllerClass();
                    instance.on(self.EV.READY, function() { self._dispatchToPage(controllerPath, instance); });

                    // Continue the dispatch process inmediatelly
                    callback(instance);

                } else {
                    Logger.error('PageManager: Controller was not found: ', controllerPath);
                }
            });
            ['catch'](function(err) {
                Logger.error(err);
            });
        },
        _dispatchToPage : function(controllerPath, controller) {
            // Execute transition
            var fromDirection = this.recentlyAddedController ? 'right' : 'left';

            this._dispatchOnLoadViewEvents();

            var $currentPage = this.currentDisplayedController ? this.currentDisplayedController.$pageContainer : null,
                $nextPage = controller.$pageContainer;
            log('PageManager: Controller is ready, dispatching to page', $currentPage, $nextPage, arguments);

            if ($currentPage == $nextPage) {
                return;
            }
            this.transitionManager.transition($currentPage, $nextPage, fromDirection);
            this.currentDisplayedController = controller;
            // Trigger dispatched to page
            this.trigger(this.EV.DISPATCH_PAGE, controllerPath);
        },

        /**
         * Dispatch on load events on the current controller before be send to the stack
         * @return {[type]} [description]
         */
        _dispatchOnLoadViewEvents : function() {
            if (this.currentDisplayedController) {
                // Dispatch on view hidden event
                if (typeof this.currentDisplayedController.onViewHidden === 'function') {
                    this.currentDisplayedController.onViewHidden();
                }
            }
        },

        /**
         * Receives a query string and then formats it to a JSON object
         * and returns it
         */
        _normalizeQueryParams : function(urlParams) {
            if (urlParams && urlParams.length) {
                // The last parameter will be query string
                var queryString = urlParams.pop(),
                    queryParams = null;

                if (queryString && queryString.length) {
                    queryParams = Util.getUrlParamsFromString(queryString);
                }

                urlParams.push(queryParams);

            }
            return urlParams;
        },

        /**
         * Calls the destroy function of each controller and
         * removes the instance from the dictionary mapping
         */
        _destroyControllers : function(routesIds) {
            for (var routeIdx = 0; routeIdx < routesIds.length; routeIdx++) {
                var routeId = routesIds[routeIdx],
                    controller = this.controllerDict[routeId];
                if (controller) {
                    // @TODO: find a way to destroy those controllers that are not singleton only
                    // maybe convert controllerRoutes to a array of objects?
                    controller.destroy();
                    ControllerWrapper.destroyWrapper(controller);
                    // Delete that instance of the controller
                    delete this.controllerDict[routeId];
                }
            }
        }
    });

    /**
     * Export models
     */
    return PageManager.getInst();

});
