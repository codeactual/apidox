fs = require('fs')
path = require('path')
_ = require('lodash')
async = require('async')
mkdirp = require('mkdirp')

/**
 *  Recursive apidox implementation
 *
 *  Example:
 *
 * 		node ./node_modules/apidox/bin/apidox --root ./ --target ./doc
 *
 * 	Missing some unit testing
 *  
 */

module.exports = function(commander) {

	ignore = path.join(process.env.PWD, '.npmignore')
	fs.exists(ignore, function(exists) {

		if(!exists) {

			fs.writeFile(ignore, "node_modules", function(err, res) {

				if(!err) {

					recurse.blacklist(fs.readFileSync(ignore).toString(), function(blacklist) {

						recurse.main(commander, blacklist)
						
					})		

				}

			})

		} else {

			recurse.blacklist(fs.readFileSync(ignore).toString(), function(blacklist) {

				recurse.main(commander, blacklist)

			})		

		}

	})
	
	var recurse = {

		/**
		 *  If no .npmfile is available one will be created with node_modules
		 *
		 *  // TODO flag for blacklist for now its active by default!
		 *
		 *  // TODO unit testing
		 *
		 *  // coffeescript for the love of god! :)
		 *  
		 */

		blacklist: function(source, callback) {

			ignore = source.
			replace(/(\s)*\s+$/, "").
			replace(/^(\s)*\s+/).
			split("\n")

			ignore = _.map(ignore, function(file) {

				file = file.replace(/\/$/, "")
				file = path.join(process.env.PWD, file)
				return file

			})

			callback(ignore)
			
		},

		readDir: function(dirname, next) {

			fs.readdir(dirname, function(err, files) {

				next(_.map(files, function(file) {

					return path.join(dirname, file)

				}))

			})

		},

		isDirectory: function(root, next) {

			fs.stat(root, function(err, stats) {

				if(!err) {

					if(stats.isDirectory()) {

						next(stats)

					}	else {

						next(null)

					}

				}	else {

					next(null)

				}

			})

		},

		dir: function(src, next) {

			var self = this

			self.tasklist = {}
			self.readDir(src, function(files) {

				var total = _.size(files)

				_.map(files, function(file) {

					self.isDirectory(file, function(isdir) {

						_.map(self.ignore, function(filepath) {

							substr = file.substr(0, filepath.length)
							if(substr == filepath) {
								file = undefined
								total--
							}

						})

						if(file) {

							if(isdir) {
						
								self.tasklist[file] = function(callback) {
									self.dir(file, callback)
								}

							} else {

								self.tasklist[file] = function(callback) {
									self.file(file, callback)
								}

							}

							if(_.size(self.tasklist) == total) {

								async.parallel(self.tasklist, next)

							}

						}		


					})

				})

			})

		},

		file: function(file, callback) {

			if(file.match(/\.js$/)) {

				self = this

				var src = file
				var dest = file.replace(this.src,this.dest)
				dest = dest.replace(/\.[a-z]+$/, ".md")

				self.commander.dox.set('input', src);
				self.commander.dox.set('output', dest);
				self.commander.dox.parse();

				docpath = path.dirname(dest)
				if(!fs.existsSync(docpath)) {

					mkdirp.sync(docpath, "0755")

				}

				require('fs').writeFileSync(dest, self.commander.dox.convert());

				callback(null, file)


			}

			

		},

		main: function(commander, blacklist) {

			var self = this
			this.ignore = blacklist
			this.commander = commander
			this.src = path.resolve(commander.root)
			this.dest = path.resolve(commander.target)

			self.isDirectory(self.dest, function(isdir) {

				if(!isdir) {

					mkdirp.sync(path.dirname(self.dest))

				} 

				self.isDirectory(self.src, function(isdir) {

					if(isdir) {

						self.dir(self.src, function(error, results) {

							console.log(error, results)

						})

					} else {

						console.log("error: " + self.src + " does not exist")

					}

				})

			})

		}

	}	

}

