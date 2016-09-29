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
            'ju-mvc/controller'
        ],
        function(
            $,
            Controller
        ) {
    'use strict';

    var DummyController = Controller.extend({
        load : function() {
            return true;
        }
    });

    // Exports
    return DummyController;
});
