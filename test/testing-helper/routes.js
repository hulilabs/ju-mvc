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
            route : '/some/path'
        },
        // Sub route
        'sub-route' : {
            route : '/some/sub/path/',
            rootId : 'base-route'
        }
    };
    // jscs:enable disallowQuotedKeysInObjects

    return routes;
});
