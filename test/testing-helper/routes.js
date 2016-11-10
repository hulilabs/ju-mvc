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
 * Routes definition for testing
 */
define([], function() {
    'use strict';

    // jscs:disable disallowQuotedKeysInObjects
    var routes = {
        // Base route
        'base-route' : {
            route : '/some/path',
        },
        // Base route with controller
        'base-route-with-controller' : {
            route : '/some/path',
            controller : 'testing-helper/dummy-controller'
        },
        // Sub route
        'sub-route' : {
            route : '/some/sub/path/',
            rootId : 'base-route'
        },
        // Simple controller wrapper (string)
        'route-with-simple-wrapper' : {
            route : '/some/path',
            controllerWrapper : 'testing-helper/dummy-controller-wrapper'
        },
        // Complex controller wrapper (object)
        'route-with-complex-wrapper' : {
            route : '/some/path',
            controllerWrapper : {
                wrapper : 'testing-helper/dummy-controller-wrapper',
                param : 'some-parameter'
            }
        },
        // Sub route with controller wrapper
        'sub-route-with-wrapper' : {
            route : '/some/sub/path',
            rootId : 'base-route',
            controllerWrapper : 'testing-helper/dummy-controller-wrapper'
        }

    };
    // jscs:enable disallowQuotedKeysInObjects

    return routes;
});
