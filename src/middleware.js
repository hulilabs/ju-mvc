/**                   _
 *  _             _ _| |_
 * | |           | |_   _|
 * | |___  _   _ | | |_|
 * | '_  \| | | || | | |
 * | | | || |_| || | | |
 * |_| |_|\___,_||_| |_|
 *
 * (c) Huli Inc
 */// jscs:ignore disallowMultipleLineBreaks


/**
 * @file Manages and executes middlewares in all the different app phases
 * @requires ju-shared/observable-class
 * @module ju-mvc/middleware
 * @extends ju-shared/observable-class
 */

define([
    'ju-shared/observable-class'
],
function(
    ObservableClass
) {
    'use strict';
    var Middleware = ObservableClass.extend({

        /**
        * Object used to store all the phases and middlewares
        * @type {Object}
        */
        phases : {},

        /**
        * @constructor
        * @alias module:ju-mvc/middleware
        * @param {Object} [opts] - configuration options
        * @param {Boolean} [opts.useDefaultPhases] - indicates if want to initialize the default phases
        * @param {Phase[]} [opts.customPhases] - custom phases
        */
        init : function(opts) {
            //initialize the default phases
            this.initDefaultPhases = opts ? opts.useDefaultPhases : true;
            if (this.initDefaultPhases) {
                this._initDefaultPhases();
            }
            //initialize the custom phases
            if (opts && opts.customPhases && opts.customPhases.length) {
                this._initCustomPhases(opts.customPhases);
            }
        },

         /**
          * Initialize the phases object
          * @private
          */
        _initDefaultPhases : function() {
            //Get all the phases
            var phasesKeys = Object.keys(Middleware.PHASES);
            // for each phase(key), create an array for each subphase
            for (var currentPhase = 0, phasesTotal = phasesKeys.length; currentPhase < phasesTotal; currentPhase++) {
                var phaseName = Middleware.PHASES[phasesKeys[currentPhase]];
                this.phases[phaseName] = this._getDefaultSubPhases();
            }
        },

        /**
         * Returns an object with all the default subphases.
         * @returns {Object}
         * @private
         */
        _getDefaultSubPhases : function() {
            var subPhases = {};
            var subPhasesKeys = Object.keys(Middleware.SUBPHASES);
            // for each phase(key), create an array for all the sub phases
            for (var currentSubPhase = 0, subPhasesTotal = subPhasesKeys.length; currentSubPhase < subPhasesTotal; currentSubPhase++) {
                var subPhaseName = Middleware.SUBPHASES[subPhasesKeys[currentSubPhase]];
                subPhases[subPhaseName] = [];
            }
            return subPhases;
        },

        /**
         * The definition of a Phase object
         * @typedef {Object} Phase
         * @property {String} name - Phase name
         * @property {String[]} subPhases - An array of strings: contains all the subphases names.
         * @example {
            name : 'render',
            subPhases : ['subPhase1', 'subPhase2']
           }
         */

        /**
         * Adds to the phases object the custom phases
         * @param {Phase[]} phases - array of phases
         * @private
         */
        _initCustomPhases : function(phases) {
            if (phases && phases.length) {
                for (var currentPhase = 0, phasesTotal = phases.length; currentPhase < phasesTotal; currentPhase++) {
                    this.addPhase(phases[currentPhase]);
                }
            }
        },

        /**
         * Add a custom phase to the middleware
         * @param {Phase} phase - phase object
         */
        addPhase : function(phase) {
            // check if should create the phase with the default subphases
            if (this.initDefaultPhases) {
                this.phases[phase.name] = this._getDefaultSubPhases();
            }else {
                this.phases[phase.name] = {};
            }
            // for each subPhase create an empty array
            if (phase && phase.subPhases && phase.subPhases.length) {
                for (var currentSubPhase = 0, subPhasesTotal = phase.subPhases.length; currentSubPhase < subPhasesTotal; currentSubPhase++) {
                    this.phases[phase.name][phase.subPhases[currentSubPhase]] = [];
                }
            }
        },

        /**
         * Add a middleware to a specified phase
         * @param {Middleware} middleware
         * @param {String} phase - check Middleware.PHASES
         * @param {String} subPhase - check Middleware.SUBPHASES
         * @returns {boolean}
         */
        add : function(middleware, phase, subPhase) {
            var phases = this.phases;
            if (phases[phase]) {
                if (phases[phase][subPhase]) {
                    phases[phase][subPhase].push(middleware);
                } else {
                    phases[phase][Middleware.DEFAULT_SUBPHASE].push(middleware);
                }
                return true;
            }else {
                return false;
            }
        },

        /**
         * Executes the middlewares sequentially for the given phase/subphase
         * @param {String} phase - phase to be executed, check Middleware.PHASES
         * @param {String} subPhase - subphase to be executed, check Middleware.SUBPHASES
         * @param {Object} params - params to be pass to all the middlewares
         * @param {Function} [onSuccess] - callback success function
         * @param {Function} [onError] - callback error function
         */
        run : function(phase, subPhase, params, onSuccess, onError) {
            if (this.phases[phase] && this.phases[phase][subPhase]) {
                this._runAll(this.phases[phase][subPhase], params).then(function(result) {
                    log('Middleware: ran successfully ' + phase + ':' + subPhase, result);
                    if (typeof onSuccess === 'function') {
                        onSuccess(result);
                    }
                })['catch'](function(error) {
                    log('Middleware: ran with errors ' + phase + ':' + subPhase, error);
                    if (typeof onError === 'function') {
                        onError(error);
                    }
                });
            }
        },

        /***
         * Executes the middlewares sequentially
         * @param {Middleware[]} middlewares - array of middlewares
         * @param {Object} params -  params to be passed to all the middlewares
         * @returns {Promise}
         * @private
         */
        _runAll : function(middlewares, params) {
            var self = this;
            // iterates over the middleware promises
            return middlewares.reduce(function(prevMiddleware, currentMiddleware) {
                return prevMiddleware.then(function(value) {
                    //execute the next middleware when the previous is resolved
                    return self._executeMiddleware(value, currentMiddleware, params);
                });
            }, Promise.resolve());
        },

         /**
          * Executes the middleware run function, handles the error and returns a promise
          * @param {Object?} value - previous middleware returned value
          * @param {Object} middleware - middleware to run
          * @param {Object} [params] - global param to pass to the middleware
          * @returns {Promise}
          * @private
          */
         _executeMiddleware : function(value, middleware, params) {
            var self = this;
            return new Promise(function(resolve, reject) {
                var middlewarePromise = self._getMiddlewarePromise(middleware, params, value);
                return middlewarePromise.then(
                    function onResolved() {
                        /** resolve the promise in order to continue with main flow */
                        resolve(arguments);
                    },
                    function onRejected(error) {
                        if (typeof middleware.errorHandler === 'function') {
                            try {
                                /** if there is an errorHandler, call the resolve with returned value of the
                                 * errorHandler in order to continue with the main flow */
                                resolve(params, middleware.errorHandler(error));
                            }
                            catch (e) {
                                /** if there is an error in the middleware errorHandler, rejects the promises and stops
                                 *  the execution  */
                                reject(e);
                            }
                        } else {
                            /** if there is not an errorHandler, rejects the promises and stop the execution **/
                            reject(error);
                        }
                    }
                );
            });
        },

        /**
         * Works as a wrapperExecutes, executes the middleware.run function and always returns a promise even if the
         * run method is promise or a regular function
         * @param {Object} middleware - middleware to run
         * @param {Object?} params - run method params
         * @param value - previous promise returned value
         * @returns {Promise}
         * @private
         */
        _getMiddlewarePromise : function(middleware, params, value) {
            var middlewarePromise;
            try {
                middlewarePromise = middleware.run(params, value);
                if (middlewarePromise && typeof middlewarePromise.then === 'function') {
                    return middlewarePromise;
                }else {
                    if (middlewarePromise && !(middlewarePromise instanceof Error)) {
                        return Promise.resolve(middlewarePromise);
                    }else {
                        return Promise.reject(middlewarePromise);
                    }
                }
            }catch (error) {
                return Promise.reject(error);
            }
        }
    });

    Middleware.classMembers({
        /**
         * @constant {Object} PHASES - enum to define all the phases
         */
        PHASES : {
            ROUTE : 'route'
        },

        /**
         * @constant {Object} SUBPHASES - enum to define all the sub phases
         */
        SUBPHASES : {
            BEFORE : 'before',
            DURING : 'during',
            AFTER : 'after'
        },

        /**
         * @constant {String} DEFAULT_SUBPHASE - if the subphase is not provided when adding a middleware this will be use
         */
        DEFAULT_SUBPHASE : 'during'
    });

    return Middleware;

});
