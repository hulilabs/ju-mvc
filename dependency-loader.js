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
 * Handles dependency injection for theclasses
 */
define([
            'require',
            'ju-shared/class',
            'ju-shared/util'
        ],
        function (
            require,
            Class,
            Util
        ) {
    'use strict';


    /**
     * Constants
     */
    var SET_METHOD_PREFIX = 'set';

    /**
     * Injected Depedencies description will have the following format
     *
     * {
     *     // Format 1: Path only
     *     proxy : '',
     *
     *     // Format 2: Object with path and init function
     *     cardProvider : {
     *         path : 'abc/xyz',
     *         init : function (inst) {
     *             return inst;
     *         }
     *     }
     * }
     *
     *
     *
     */
    var DependencyLoader = Class.extend({
        /**
         * [getDependencies description]
         * @param  {Object} dependencies has the format  {
         *                                                   key : 'path/to/dependency',
         *                                                   key2 : {
         *                                                       init : function () ....,
         *                                                       path : 'path/to/dependency'
         *                                                   }
         *                                               }
         * @return Promise a promise that will return a depedency info object
         */
        getDependencies : function (dependencies) {
            var getDependenciesPromise = null;

            if (dependencies) {
                // We have depedencies to fetch
                getDependenciesPromise = this.fetchDependencies(dependencies);
            } else {
                getDependenciesPromise = Promise.resolve(null);
            }
            return getDependenciesPromise;
        },
        /**
         * Uses requireJS to load a file and then injects all the dependencies to it
         */
        requireWithInjection : function (/* classPath, injectedDependencies, callback  */ ) {
            // @TODO: uses require to load the class and all the dependencies at once
        },
        /**
         * Looks for setters in the instance
         *
         * {
         *     cardProvider : {
         *         path : 'abc/xyz',
         *         instance ; objectReturnedByRequire
         *         init : function (inst) {
         *             return inst;
         *         }
         *     }
         * }
         *
         */
        setDependenciesInInstance : function (instance, injectedDependencies) {

            $.each(injectedDependencies, function (dependencyName, dependencyInfo) {
                var setMethodStr = SET_METHOD_PREFIX + Util.capitalizeFirstLetter(dependencyName),
                    setMethod = instance[setMethodStr];

                if (setMethod) {
                    if (dependencyInfo.init) {
                        dependencyInfo.init(dependencyInfo.instance);
                    }
                    setMethod.call(instance, dependencyInfo.instance);
                } else {
                    log('setDependenciesInInstance, no method found...', setMethodStr);
                }
            });
        },
        /**
         * Given a dependencies info object we will fetch the dependencies
         * and store the instances in the same dependencies info
         */
        fetchDependencies : function (dependenciesInfo) {

            var dependenciesPaths = this.normalizeDependenciesInfoObj(dependenciesInfo);

            var dependenciesFetchedPromise = new Promise(function (resolve /* , reject */) {
                // Use require to fetch all the dependencies
                require( dependenciesPaths , function() {
                    var dependenciesInstances = arguments,
                        dependenciesLength = arguments.length,
                        dependenciesIndex = 0;

                    $.each(dependenciesInfo, function (dependencyName, dependencyInfo) {
                        // If we don't have more loaded dependencies, then break
                        if (dependenciesIndex >= dependenciesLength) {
                            return false;
                        }
                        // Stores the instance in the
                        var instance = dependenciesInstances[dependenciesIndex];
                        dependencyInfo.instance = instance;

                        dependenciesIndex++;
                    });

                    // Continue and pass the new dependencies object
                    resolve(dependenciesInfo);
                });
            });

            return dependenciesFetchedPromise;
        },
        /**
         * Normalizes the dependencies object, all the values should contain
         * {
         *     path : 'string',
         *     init : function ....
         * }
         * @return Array                  an array of the dependencies paths
         */
        normalizeDependenciesInfoObj : function (dependenciesInfo) {

            var dependenciesPaths = [];

            $.each(dependenciesInfo, function (dependencyName, dependencyInfo) {
                // If the value is a string then normalize to an object
                if (typeof dependencyInfo == 'string') {
                    var newDependencyInfo = {
                        path : dependencyInfo
                    };
                    dependenciesInfo[dependencyName] = newDependencyInfo;
                    dependencyInfo = newDependencyInfo;
                }
                dependenciesPaths.push(dependencyInfo.path);
            });

            return dependenciesPaths;
        }
    });

    // Exports
    return DependencyLoader;
});
