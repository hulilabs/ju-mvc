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
        'ju-mvc/page-manager',
        'testing-helper/routes'
    ],
    function(
        PageManager,
        routes
    ) {

    describe('Page Manager', function() {
        it ('returns the controller of a particular route', function(){
            PageManager.routes(routes);
            var route = 'base-route-with-controller',
                originalController = routes[route].controller,
                returnedController = PageManager.getRouteController(route);

            expect(originalController).to.be.equal(returnedController);
        });
    });
});
