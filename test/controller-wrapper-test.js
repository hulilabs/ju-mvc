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

/* global expect, describe, it */

define([
        'ju-mvc/controller-wrapper',
        'ju-mvc/page-manager',
        'testing-helper/routes'
    ],
    function(
        ControllerWrapper,
        PageManager,
        routes
    ) {

    describe('Controller Wrapper Tests', function() {

        // Test the class can be instantiated
        it('Generates a new controller wrapper constructor', function() {
            expect(ControllerWrapper).to.be.a('function');

            var testControllerWrapperInstance = new ControllerWrapper(
                routes['base-route'],
                PageManager.controllerStack // getControllerStack?
            );

            expect(testControllerWrapperInstance).to.be.a('object');
        });
    });

});
