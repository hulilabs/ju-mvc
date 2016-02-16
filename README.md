[![Build Status](https://travis-ci.org/hulilabs/ju-mvc.svg?branch=master)](https://travis-ci.org/hulilabs/ju-mvc)
# ju-mvc
Ju-mvc provides utilities for handling dynamic websites, that will handle the routing logic for pages that are asynchronously loaded, to provide an efficient way for web-apps implementation.  Two of the most important sections are the route-to-page mapping and handling and the view handlers themselves. Here we'll introduce the latter ones.

## View handlers
View handlers are objects that implement a very simple interface and follow a set of conventions to display and control elements in the web page that can interact with a user.

Controllers are a special type of handlers that can be registered in a `routes` file to be used by a `PageManager` to provide dynamic routing that doesn't require full page reload.

The next section introduces the convention for the implementation of one of these handlers, on a `Class` based approach.

## Conventions for members in classes that handle a view element:

### S
Object with constants that can be used as selectors.  Commonly set in the `init` method. e.g.

    this.S = { view : '.site-content' }

### t
Holds a reference to cached tags (i.e. jQuery elements). Set inside a `findLocalElems` method.  The members follow the convention $+varname. e.g.
this.t  = { $view : $('.site-content') }

### k
Stores constants to be used as object keys.  It is also used in some cases to store selectors when S isn't available. e.g.

    this.k = { VIEW_KEY : 'view' }

## controller's life cycle methods

### handleRoute(alreadyInStack, routerParams, urlParams)
Default method to be called by the PageManager as the beginning for the page load life cycle.

* alreadyInStack: flag that says if the controller is already loaded in the current controller stack.  This is useful in cases that you want to handle a route change inside the same controller, for example: you want to navigate to a date in a `calendar page` using a `date` query string param, but if the `calendar page` is `alreadyInStack` you'll skip all the setup and go straight to the logic that navigates to a date.

* routerParams: arguments passed from the route configuration set in a routes.js file. This can be used, for example (example, not usage suggestion), if you want to provide metadata to a controller that handles multiple routes.

* urlParams: an object with the url params and query string params from the current route.

### load (directly called in classes that inherit from BaseModule)
Optional method unless your controller inherits from BaseModule.  This method should be the actual entry point of a module and perform any required resources request, then call `setup` to handle the received resources.

### setup
Uses a set of resources to build a set of elements.  Should call the following methods (they are optional, but we should implement them in most cases):

    findLocalElems (set `t` with cached tags
    bindEvents (add any event listeners)

### destroy
Called when a controller is removed from the controller stack (e.g. when we leave the page).
