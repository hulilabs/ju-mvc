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
        'testing-helper/dummy-controller',
        'testing-helper/dummy-controller-wrapper',
        'testing-helper/routes'
    ],
    function(
        ControllerWrapper,
        DummyController,
        DummyControllerWrapper,
        routes
    ) {

    /**
     * Mocks PageManager.controllerStack
     */
    var controllerStack;

    /**
     * Define a dummy controller for testing purposes
     */
    var dummyController;

    // Preparation before each test
    beforeEach(function() {
        controllerStack = [];
        dummyController = null;
    });

    describe('ControllerWrapper', function() {

        describe('constructor', function() {

            var getControllerWrapperInstance = function(stacked) {
                if (stacked) {
                    controllerStack.push('base-route');
                }

                var controllerInfo = routes['route-with-simple-wrapper'],
                    testControllerWrapperInstance = new ControllerWrapper(controllerInfo, controllerStack);

                return testControllerWrapperInstance;
            };

            it('generates a root-controller instance', function() {
                var testControllerWrapperInstance = getControllerWrapperInstance(false);
                expect(testControllerWrapperInstance).to.be.a('object');
                expect(testControllerWrapperInstance.doStackController, 'doStackController').to.be.false;
            });

            it('generates a stacked-controller instance', function() {
                var testControllerWrapperInstance = getControllerWrapperInstance(true);
                expect(testControllerWrapperInstance).to.be.a('object');
                expect(testControllerWrapperInstance.doStackController, 'doStackController').to.be.true;
            });

            it('instance can prepare controller information', function() {
                var controllerInfo = routes['route-with-simple-wrapper'];

                var testControllerWrapperInstance = getControllerWrapperInstance(true);

                expect(testControllerWrapperInstance).to.respondTo('prepareControllerInfo');
                var controllerPreparedInfo = testControllerWrapperInstance.prepareControllerInfo(controllerInfo);
                expect(controllerPreparedInfo).to.not.equal(controllerInfo);
            });
        });

        describe('#handleDependencies', function() {

            var getControllerWrapperDependencies = function(routeName, stacked) {
                if (stacked) {
                    controllerStack.push('base-route');
                }

                var controllerInfo = routes[routeName],
                    testControllerWrapperInstance = new ControllerWrapper(controllerInfo, controllerStack),
                    injectedDependencies = {};

                return testControllerWrapperInstance.handleDependencies(injectedDependencies);
            };

            it('method exist', function() {
                var testControllerWrapperInstance = new ControllerWrapper(routes['route-with-simple-wrapper'], controllerStack);
                expect(testControllerWrapperInstance).to.respondTo('handleDependencies');
            });

            it('on root-controller doesnt return controller wrapper dependency', function() {
                var testControllerWrapperInstance = new ControllerWrapper(routes['route-with-simple-wrapper'], controllerStack);
                    controllerWrapperDependencies = testControllerWrapperInstance.handleDependencies({});

                expect(controllerWrapperDependencies, 'controllerWrapperDependencies').to.not.have.property('controllerWrapper');
            });

            context('on stacked-controller', function() {
                it('for a simple wrapper return controller wrapper dependency', function() {
                    var controllerWrapperDependencies = getControllerWrapperDependencies('route-with-simple-wrapper', true);
                    expect(controllerWrapperDependencies, 'controllerWrapperDependencies').to.have.property('controllerWrapper');
                });

                it('for a complex wrapper return controller wrapper dependency', function() {
                    var controllerWrapperDependencies = getControllerWrapperDependencies('route-with-complex-wrapper', true);
                    expect(controllerWrapperDependencies, 'controllerWrapperDependencies').to.have.property('controllerWrapper');
                });
            });
        });

        describe('class member test', function() {
            var dependenciesInfo;

            // Defined as function and not as before() because the setWrapperInstanceIntoController
            // must be validated before call and it can be reuse on destroy test
            var createControllerWithWrapper = function() {
                dummyController = new DummyController();

                dependenciesInfo = {
                    controllerWrapper : {
                        instance : DummyControllerWrapper,
                        path : 'testing-helper/dummy-controller-wrapper'
                    }
                };

                ControllerWrapper.setWrapperInstanceIntoController(dummyController, dependenciesInfo);

                return dummyController;
            };

            context('on page manager create controller instance', function() {
                it('store controller wrapper instance as controller member', function() {
                    expect(ControllerWrapper).itself.to.respondTo('setWrapperInstanceIntoController');

                    createControllerWithWrapper();

                    expect(dependenciesInfo.controllerWrapper).to.be.undefined;
                    expect(dummyController[ControllerWrapper.MEMBER]).to.be.a('object');
                });
            });

            context('on page manager controller loaded', function() {
                it('wraps controller before handling route', function() {
                    expect(ControllerWrapper).itself.to.respondTo('wrapControllerBeforeHandlingRoute');

                    createControllerWithWrapper();

                    var controllerWrapperOptions = {}, alreadyInStack = false, options = {};

                    var wrapperPromise = ControllerWrapper.wrapControllerBeforeHandlingRoute(
                        dummyController, controllerWrapperOptions, alreadyInStack, options
                    );

                    expect(wrapperPromise).to.be.a('Promise');
                });
            });

            context('on page manager destroy', function() {
                it('is destroyed', function() {
                    expect(ControllerWrapper).itself.to.respondTo('destroyWrapper');

                    createControllerWithWrapper();

                    expect(dummyController).to.respondTo('destroy');

                    ControllerWrapper.destroyWrapper(dummyController);

                    expect(dummyController[ControllerWrapper.MEMBER]).to.be.undefined;
                });
            });
        });

        describe('route processing', function() {

            var getControllerPreparedInformation = function(routeName) {
                var controllerInfo = routes[routeName],
                    testControllerWrapperInstance = new ControllerWrapper(controllerInfo, controllerStack),
                    controllerPreparedInfo = testControllerWrapperInstance.prepareControllerInfo(controllerInfo);

                return controllerPreparedInfo;
            };

            context('without controller wrapper', function() {

                it('for a basic route doesnt have rootId', function() {
                    var controllerPreparedInfo = getControllerPreparedInformation('base-route');
                    expect(controllerPreparedInfo).to.not.have.property('rootId');
                });

                it('for a sub route includes rootId', function() {
                    var controllerPreparedInfo = getControllerPreparedInformation('sub-route');
                    expect(controllerPreparedInfo).to.have.property('rootId');
                    expect(controllerPreparedInfo.rootId).to.equal('base-route');
                });
            });

            context('with controller wraper', function() {
                it('for a route with simple wrapper includes rootId', function() {
                    controllerStack.push('base-route');
                    var controllerPreparedInfo = getControllerPreparedInformation('route-with-simple-wrapper');
                    expect(controllerPreparedInfo).to.have.property('rootId');
                    expect(controllerPreparedInfo.rootId).to.equal('base-route');
                });

                it('for a route with a complex wrapper includes rootId', function() {
                    controllerStack.push('base-route');
                    var controllerPreparedInfo = getControllerPreparedInformation('route-with-complex-wrapper');
                    expect(controllerPreparedInfo).to.have.property('rootId');
                    expect(controllerPreparedInfo.rootId).to.equal('base-route');
                });

                it('for a sub route with wrapper keeps the same rootId as in routes definition', function() {
                    controllerStack.push('any-route');
                    var controllerPreparedInfo = getControllerPreparedInformation('sub-route-with-wrapper');
                    expect(controllerPreparedInfo).to.have.property('rootId');
                    expect(controllerPreparedInfo.rootId).to.not.equal('any-route');
                    expect(controllerPreparedInfo.rootId).to.equal('base-route');
                });
            });

        });
    });
});
