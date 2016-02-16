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
 *  // Router
 */

define([
            'jquery',
            'ju-shared/observable-class',
            'ju-mvc/history',
            'ju-shared/util'
        ],
        function(
                    $,
                    ObservableClass,
                    History,
                    Util
                ) {
    'use strict';

    // Cached regular expressions for matching named param parts and splatted
    // parts of route strings.
    var optionalParam = /\((.*?)\)/g;
    var namedParam = /(\(\?)?:\w+/g;
    var splatParam = /\*\w+/g;
    var escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;
    var queryStringRegExp = '(?:\\?([\\s\\S]*))?$';

    // Routers map faux-URLs to actions, and fire events when routes are
    // matched. Creating a new one sets its `routes` hash, if not set statically.
    var Router = ObservableClass.extend({
        init : function(options) {
            if (!options) {
                (options = {});
            }
            if (options.routes) {
                this.routes = options.routes;
            }
            this._bindRoutes();
            this.initialize.apply(this, arguments);
        },
        // Initialize is an empty function by default. Override it with your own
        // initialization logic.
        initialize : function() {},

        // Manually bind a single named route to a callback. For example:
        //
        //     this.route('search/:query/p:num', 'search', function(query, num) {
        //       ...
        //     });
        //
        route : function(route, name, callback) {
            var path = route;

            if (!Util.isRegExp(route)) {
                // Convert from string to regular expresion
                route = this._routeToRegExp(route);
            } else {
                // Add query string matching group to regular expressions
                route = this._normalizeRegExpRoute(route);
            }

            if (Util.isFunction(name)) {
                callback = name;
                name = '';
            }

            if (!callback) {
                callback = this[name];
            }

            var self = this;

            log('Registering route ', route, name);

            History.route(name, path, route, function(fragment, options) {
                var args = self._extractParameters(route, fragment);

                if (callback) {
                    callback.call(self, args, options);
                }

                self.trigger.apply(self, ['route:' + name].concat(args));
                self.trigger('route', name, args);
                History.trigger('route', self, name, args);
            });

            return this;
        },

        // Simple proxy to `.history` to save a fragment into the history.
        navigate : function(fragment, options) {
            History.navigate(fragment, options);
            return this;
        },

        /**
         * Build path using handler and arguments
         */
        buildPath : function() {
            var name = arguments[0],
                args = Array.prototype.slice.call(arguments, 1),
                handler = History.getHandlerByName(name),
                path = handler.path,
                optionalParams = handler.path.match(optionalParam);

            for (var i in optionalParams) {
                if (optionalParams.hasOwnProperty(i) && args.hasOwnProperty(i)) {
                    path = path.replace(optionalParams[i], args[i]);
                } else {
                    break;
                }
            }

            return path;
        },
        /**
         * Returns the History handler
         */
        getHistory : function() {
            return History;
        },
        // Bind all defined routes to `.history`. We have to reverse the
        // order of the routes here to support behavior where the most general
        // routes can be defined at the bottom of the route map.
        _bindRoutes : function() {
            if (!this.routes) {
                return;
            }
            this.routes = Util.result(this, 'routes');
            var route, routes = Util.keys(this.routes);
            while ((route = routes.pop()) != null) {
                this.route(route, this.routes[route]);
            }
        },

        // Convert a route string into a regular expression, suitable for matching
        // against the current location hash.
        _routeToRegExp : function(route) {
            route = route.replace(escapeRegExp, '\\$&')
            .replace(optionalParam, '(?:$1)?')
            .replace(namedParam, function(match, optional) {
                return optional ? match : '([^/?]+)';
            })
            .replace(splatParam, '([^?]*?)');
            return new RegExp('^' + route + queryStringRegExp);
        },

        // Given a route, and a URL fragment that it matches, return the array of
        // extracted decoded parameters. Empty or unmatched parameters will be
        // treated as `null` to normalize cross-browser behavior.
        _extractParameters : function(route, fragment) {
            var params = route.exec(fragment).slice(1);
            return Util.map(params, function(param, i) {
                // Don't decode the search params.
                if (i === params.length - 1) {
                    return param || null;
                }
                return param ? decodeURIComponent(param) : null;
            });
        },

        /**
         * Given a route that is already a regular expression,
         * we will make sure that this route is able to match query strings.
         * If that is not the case we will append the query string non-capturing group
         * at the end of the initial route
         */
        _normalizeRegExpRoute : function(route) {
            if (route) {
                var originalRegExp = route.toString();
                if (originalRegExp.indexOf(queryStringRegExp) < 0) {
                    // We need to add the query string non-capturing group to the original regex
                    var regex = new RegExp('^/(.*)/([a-z]*)?$'),
                        matches = regex.exec(originalRegExp);

                    if (matches && matches.length >= 3) {
                        var source = matches[1],
                            flags = matches[2];
                        // Remove the trailing $ as the query string regex already has it
                        source = source.replace(/\$$/, '').concat(queryStringRegExp);
                        route = new RegExp(source, flags);
                    } else {
                        Logger.error('Could not normalize route. Please check', originalRegExp);
                    }
                }
            }

            return route;
        }
    });

    // Set up all inheritable **.Router** properties and methods.

    Router.classMembers({
        /**
         * Given an array of arguments, we need to get the query string map, which is
         * mapped to the last position of the array and return it
         * @param  PseudoArray argsArray arguments array
         * @return object           query string map
         */
        getQueryStringMap : function(argsArray) {
            var urlParamsLength;
            var queryParams = (argsArray && (urlParamsLength = argsArray.length)) ?
                                    argsArray[urlParamsLength - 1] :
                                    null;
            return queryParams;
        }
    });

    // Exports
    // context.Router = Router;
    return Router;

});
