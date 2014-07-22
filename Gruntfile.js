module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-compress');

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        buildDir: 'dist',

        copyright: [
            ' * Copyright <%= grunt.template.today("yyyy") %> JSI Studios, LLC',
            ' *',
            ' * Licensed under the Apache License, Version 2.0 (the "License");',
            ' * you may not use this file except in compliance with the License.',
            ' * You may obtain a copy of the License at',
            ' *',
            ' * http://www.apache.org/licenses/LICENSE-2.0',
            ' *',
            ' * Unless required by applicable law or agreed to in writing, software',
            ' * distributed under the License is distributed on an "AS IS" BASIS,',
            ' * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.',
            ' * See the License for the specific language governing permissions and',
            ' * limitations under the License.'
        ].join('\n'),

        banners: {
            bundle: [
                '/* =============================================================',
                ' * <%= pkg.name %> v<%= pkg.version %>',
                ' * <%= pkg.homepage %>',
                ' * =============================================================',
                '<%= copyright %>',
                ' * ============================================================ */\n\n'
            ].join('\n'),
            pgSearchAhead: [
                '/* =============================================================',
                ' * pgSearchAhead v<%= pkg.version %>',
                ' * http://www.pageablecontrols.com/controls/pgSearchAhead.html',
                ' * =============================================================',
                '<%= copyright %>',
                ' * ============================================================ */\n\n'
            ].join('\n'),
            pgGrid: [
                '/* =============================================================',
                ' * pgGrid v<%= pkg.version %>',
                ' * http://www.pageablecontrols.com/controls/pgGrid.html',
                ' * =============================================================',
                '<%= copyright %>',
                ' * ============================================================ */\n\n'
            ].join('\n')
        },
        concat: {
            options: {
                separator: ';'
            },
            pageableControls: {
                src: ['js/pgGrid.js', 'js/pgSearchAhead.js', 'js/Pager.js', 'js/utils.js'],
                dest: '<%= buildDir %>/js/pageableControls.js'
            },
            pgSearchAhead: {
                src: ['js/pgSearchAhead.js', 'js/Pager.js', 'js/utils.js'],
                dest: '<%= buildDir %>/js/pgSearchAhead.js'
            },
            pgGrid: {
                src: ['js/pgGrid.js', 'js/Pager.js', 'js/utils.js'],
                dest: '<%= buildDir %>/js/pgGrid.js'
            },
            pageableControlsCss:{
                src: ['css/PageableControls.css', 'css/pgGrid.css', 'css/pgSearchAhead.css'],
                dest: '<%= buildDir %>/css/bundles/PageableControls.bundle.css'
            }
            ,
            pgGridCss:{
                src: ['css/PageableControls.css', 'css/pgGrid.css'],
                dest: '<%= buildDir %>/css/bundles/pgGrid.bundle.css'
            },
            pgSearchAheadCss:{
                src: ['css/PageableControls.css', 'css/pgSearchAhead.css'],
                dest: '<%= buildDir %>/css/bundles/searchAhead.bundle.css'
            }
        },

        uglify: {
            options:{
                enclose: { 'window.jQuery': '$' }
            },
            pageableControls: {
                options: {
                    banner: '<%= banners.bundle %>',
                    mangle: false,
                    beautify: true,
                    compress: false
                },
                files: {
                    '<%= buildDir %>/js/pageableControls.js': ['<%= concat.pageableControls.dest %>']
                }
            },
            pageableControlsMin: {
                options: {
                    banner: '<%= banners.bundle %>',
                    mangle: true,
                    compress: true
                },
                files: {
                    '<%= buildDir %>/js/pageableControls.min.js': ['<%= concat.pageableControls.dest %>']
                }
            },
            pgSearchAhead: {
                options: {
                    banner: '<%= banners.pgSearchAhead %>',
                    mangle: false,
                    beautify: true,
                    compress: false
                },
                files: {
                    '<%= buildDir %>/js/pgSearchAhead.js': ['<%= concat.pgSearchAhead.dest %>']
                }
            },
            pgSearchAheadMin: {
                options: {
                    banner: '<%= banners.pgSearchAhead %>',
                    mangle: true,
                    compress: true
                },
                files: {
                    '<%= buildDir %>/js/pgSearchAhead.min.js': ['<%= concat.pgSearchAhead.dest %>']
                }
            },
            pgGrid: {
                options: {
                    banner: '<%= banners.pgGrid %>',
                    mangle: false,
                    beautify: true,
                    compress: false
                },
                files: {
                    '<%= buildDir %>/js/pgGrid.js': ['<%= concat.pgGrid.dest %>']
                }
            },
            pgGridMin: {
                options: {
                    banner: '<%= banners.pgGrid%>',
                    mangle: true,
                    compress: true
                },
                files: {
                    '<%= buildDir %>/js/pgGrid.min.js': ['<%= concat.pgGrid.dest %>']
                }
            }
        },

        copy: {
            deploy: {
                files: [
                    {expand: true, src: ['img/*'], dest: '<%= buildDir %>/', filter: 'isFile'},
                    {expand: true, src: ['css/*'], dest: '<%= buildDir %>/', filter: 'isFile'}
                ]
            },
            dev: {
                files: [
                    {expand: true, src: ['js/*'], dest: 'docs/dist/', filter: 'isFile'},
                    {expand: true, src: ['css/*'], dest: 'docs/dist/', filter: 'isFile'},
                    {expand: true, src: ['img/*'], dest: 'docs/dist/', filter: 'isFile'}
                ]
            }
        },

        compress: {
            deploy: {
                options: {
                    mode: 'zip',
                    pretty: true,
                    archive: 'docs/dist/PageableControls.zip'
                },
                files: [
                    {expand: true, src: ['<%= buildDir %>/**']}
                ]
            }
        }
    });

    grunt.registerTask('dev-update', ['copy:dev']);
    grunt.registerTask('build', ['concat', 'uglify', 'copy:deploy', 'compress:deploy']);
};