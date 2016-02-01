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
 * @file Manages and executes middlewares in all the different app phases
 * @requires ju-shared/observable-class
 * @module ju-mvc/middleware
 * @extends ju-shared/observable-class
 */

define([
	'ju-shared/observable-class'
],
function (
	ObservableClass
){
	'use strict';


	/** Constants **/

    /**
     * @constant {String} DEFAULT_SUBPHASE - if the subphase is not provided when adding a middleware this will be use
     */
	var DEFAULT_SUBPHASE = 'during';

    /**
     * Object used to store all the phases and middlewares
     * @type {Object}
     */
    var phases = {};


    /**
     * Create an instance of middleware
     * @constructor
     * @alias module:ju-mvc/middleware
     * @returns {Object} Middleware
     */
	var Middleware = ObservableClass.extend({


		init : function(){
            //initialize the phases
            var pashesKeys = Object.keys(Middleware.PHASES);
            for (var currentPhase = 0, pashesTotal = pashesKeys.length; currentPhase < pashesTotal; currentPhase++) {
                var phaseName = Middleware.PHASES[pashesKeys[currentPhase]];
                if(!phases[phaseName]){
                    phases[phaseName] = {
                        before : [],
                        during : [],
                        after : []
                    };
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
		add : function (middleware, phase, subPhase){
			if (phases[phase]){
				if (phases[phase][subPhase]){
					phases[phase][subPhase].push(middleware);
				}
				else{
					phases[phase][DEFAULT_SUBPHASE].push(middleware);
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
			if (phases[phase] && phases[phase][subPhase]){
				this._runAll(phases[phase][subPhase], params).then(function (result) {
					log('Middleware: ran successfully '+ phase + ':' + subPhase, result);
					if (typeof onSuccess === 'function'){
						onSuccess(result);
					}
				}).catch(function (error) {
                    log('Middleware: ran with errors '+ phase + ':' + subPhase, error);
					if (typeof onError === 'function'){
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
            /** iterates over the middleware promises. */
			var _self =  this;
            return middlewares.reduce( function(prevMiddlewarePromise, currentMiddleware) {
                return prevMiddlewarePromise.then( function (value) {
                    return new Promise(function (resolve, reject) {
                        var middlewarePromise = _self._getMiddlewarePromise(currentMiddleware, params, value);
                        return middlewarePromise.then(
                            function onResolved() {
                                // resolve the promise in order to continue with main flow
                                resolve.apply(this, arguments);
                            },
                            function onRejected(error) {
                                if (typeof currentMiddleware.errorHandler === 'function') {
                                    try {
                                        /** if there is an errorHandler, call the resolve with returned value of the errorHandler
                                         in order to continue with the main flow */
                                        resolve(params, currentMiddleware.errorHandler(error));
                                    }
                                    catch (e) {
                                        /** if there is an error in the middleware errorHandler, ejects the promises and stop the execution  */
                                        reject(e);
                                    }
                                } else {
                                    /** if there is not an errorHandler, rejects the promises and stop the execution **/
                                    reject(error);
                                }
                            }
                        );
                    });
                });
            }, Promise.resolve());
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
		_getMiddlewarePromise : function (middleware,params ,value) {
			var middlewarePromise;
			try{
				middlewarePromise = middleware.run(params, value);
				if (middlewarePromise && typeof middlewarePromise.then === 'function'){
					return middlewarePromise;
				}else{
					if (middlewarePromise && !(middlewarePromise instanceof Error)){
						return Promise.resolve(middlewarePromise);
					}else
					{
						return Promise.reject(middlewarePromise);
					}
				}
			}catch(error){
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

		opts : {},

		configure : function(opts) {
			Middleware.opts = opts;
		}
	});

	return Middleware;

});