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

    var DummyControllerWrapper = Class.extend({
        wrap : function(callback) {
            callback(true);
        },
        destroy : function() {
            return true;
        }
    });

    // Exports
    return DummyControllerWrapper;
});
