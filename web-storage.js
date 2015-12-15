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
 * Events manager Module
 */

define([
            'jquery',
            'ju-shared/class',
            'ju-shared/util'
        ],
        function (
            $,
            Class,
            Util
        ) {

    'use strict';

    /**
     * This manager will serve as a global Events manager
     * for the application. It will rely on the
     * observable class method
     */
    var WebStorage = Class.extend({
        init : function () {
            this.isLocalStorageAvailable = this.getIsLocalStorageAvailable();
        },
        /**
         * Sets the item in the storage
         * @param {[type]} key   [description]
         * @param {[type]} value [description]
         * @param {[type]} type  Either local or session storage
         */
        setItem : function (key, value, type) {     // jshint ignore:line
            if (this.isLocalStorageAvailable) {
                window.localStorage.setItem(key, value);
            }
        },
        /**
         * Gets the item from the storage
         * @return {[type]} [description]
         */
        getItem : function (key) {
            return window.localStorage.getItem(key);
        },
        /**
         * Removes the item from the storage
         * @return {[type]} [description]
         */
        removeItem : function (key) {
            window.localStorage.removeItem(key);
        },

        getIsLocalStorageAvailable : function() {
            var storage = window.localStorage,
                storageAvailable = false;
            try {
                storage.setItem('testKey', '1');
                storage.removeItem('testKey');
                storageAvailable = true;
            } catch (e) {
                log('localStorage is not available');
            }

            return storageAvailable;
        },

        /**
         * Clear local storage data
         * @return boolean
         */
        deleteLocalStorage : function() {
            var deleted = false;
            if (this.isLocalStorageAvailable) {
                window.localStorage.clear();
                deleted = true;
            }
            return deleted;
        }
    });

    WebStorage.classMembers({
        formatKey : function () {
            return Util.format.apply(Util, arguments);
        }
    });

    return WebStorage;

});
