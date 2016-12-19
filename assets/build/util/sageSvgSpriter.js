'use strict';

const SVGSpriter = require('svg-sprite');
const glob = require('glob');
const path = require('path');
const mkdirp = require('mkdirp');
const fs = require('fs');

function sageSvgSpriter(options) {
    this.options = options || {};
}


sageSvgSpriter.prototype.apply = function (compiler) {

    var self = this;

    compiler.plugin('compile', function () {


        // Wrap in iteration for the files the user wants to create
        for( var file in self.options.files ) {
            
            // Configuration can simply be sent by self.options.files[file] = [ "folder/*.svg" ];
            if ( self.options.files[file].patterns == null ) {  // Patterns is not set, lets set it
                var aux = self.options.files[file];
                delete self.options.files[file];
                self.options.files[file] = {};
                self.options.files[file].patterns = aux;
            }


            // did the user define a root path.
            if ( self.options.svgSpriterRoot != null ) {

                // Normalize the root path, this could be outsite the look, but I wouldn't like to repeat the if.
                self.options.svgSpriterRoot = path.resolve( self.options.svgSpriterRoot );

                // Iterate all the patterns so they refer to the absolute path
                for( var index in self.options.files[file].patterns ) {
                    self.options.files[file].patterns[index] = self.options.svgSpriterRoot + "/" + self.options.files[file].patterns[index];
                }
                
            } // Otherwise we assume the patterns were set up correctly we can use them out of the box

            console.log( self.options.files[file].patterns );

            console.log( 'aaaaaaaaaaaaaaaa' );
            console.log( self.options.files[file].patterns );
            console.log( 'aaaaaaaaaaaaaaaa' );

            // Get all the files
            var files = glob.sync( ( self.options.files[file].patterns[0] ) );

            // Remove folders entries.
            files = files.filter(function(f) { return !/\/$/.test(f); });

            console.log( "FILES", files );

            // Lets process the config.

            // for simplicity, we do accept simpler configurations, however we have to complete it before passing it to svg spriter
            if ( self.options.files[file].config === undefined ) { // Is the config set
                self.options.files[file].config = {
                    shape: {
                        // Output directory for optimized intermediate SVG shapes
                        dest: false, //Inherits from defaultDest
                    },
                    mode: {
                        symbol: {
                            dest: false, // Inherits from defaultDest
                            sprite: false // Inherits from defaultDest
                        },
                    },
                }
            } // We are sure to have a config now.

            // Do we have the dest paths set up
            if ( self.options.files[file].config.shape.dest === false ) {
                self.options.files[file].config.shape.dest = path.resolve( self.options.defaultDest, file );
            }

            if ( self.options.files[file].config.mode.dest === false ) {
                self.options.files[file].config.shape.dest = path.resolve( self.options.defaultDest );
            }

            for ( var mode in self.options.files[file].config.mode ) {
                if ( self.options.files[file].config.mode[mode].dest === false ) {
                    self.options.files[file].config.mode[mode].dest = path.resolve( self.options.defaultDest );
                }
                if ( self.options.files[file].config.mode[mode].sprite === false ) {
                    self.options.files[file].config.mode[mode].sprite = file + '.svg';
                }
            }

            console.log( self.options.files[file] );


            // SVG Spriter code, not really touched.
            let spriter = new SVGSpriter(self.options.files[file].config); // Init

            for (var i = files.length - 1; i >= 0; i--) { // Add all the files
                spriter.add( path.resolve(files[i]), null, fs.readFileSync(path.resolve(files[i]), {encoding: 'utf-8'}));
            }

            spriter.compile(function (error, result, data) { // Compile
                for (var mode in result) {
                    for (var type in result[mode]) {
                        mkdirp.sync(path.dirname(result[mode][type].path));
                        fs.writeFileSync(result[mode][type].path, result[mode][type].contents);
                    }
                }
            });


        }

    });

}

module.exports = sageSvgSpriter;