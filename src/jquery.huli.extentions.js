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

define(['jquery'],
        function($) {

        $.fn.extend({
            scrollTo : function() {
                return this.each(function() {
                    var top = $(this).offset().top - $(window).height() / 3;
                    var left = $(this).offset().left - $(window).width() / 3;
                    $('body,html').animate({
                        scrollTop : top,
                        scrollLeft : left
                    });
                });
            }
        });
});
