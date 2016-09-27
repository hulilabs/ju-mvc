/* global module */
module.exports = function(grunt) {
    grunt.initConfig({
        jsRootDir : 'src',
        jscs : {
            src : grunt.option('files') || [
                '<%= jsRootDir %>/**/*.js',
                '!<%= jsRootDir %>/**/vendor/**/*.js',
                'Gruntfile.js'
            ],
            options : {
                config : '.jscsrc',
                fix : !!(grunt.option('fix'))
            }
        },
        jshint : {
            options : {
                jshintrc : '.jshintrc'
            },
            self : ['Gruntfile.js'],
            all : {
                src : [
                    '<%= jsRootDir %>/**/*.js',
                    '!<%= jsRootDir %>/**/vendor/**/*.js',
                    '!<%= jsRootDir %>/**/output/**/*.js'
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jscs');
    grunt.loadNpmTasks('grunt-newer');

    grunt.registerTask('lint', [
            'jscs',
            'newer:jshint'
        ]
    );
};
