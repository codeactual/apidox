(function() {
    function require(name) {
        var module = require.modules[name];
        if (!module) throw new Error('failed to require "' + name + '"');
        if (!("exports" in module) && typeof module.definition === "function") {
            module.client = module.component = true;
            module.definition.call(this, module.exports = {}, module);
            delete module.definition;
        }
        return module.exports;
    }
    require.modules = {};
    require.register = function(name, definition) {
        require.modules[name] = {
            definition: definition
        };
    };
    require.define = function(name, exports) {
        require.modules[name] = {
            exports: exports
        };
    };
    require.register("codeactual~extend@0.1.0", function(exports, module) {
        module.exports = function extend(object) {
            var args = Array.prototype.slice.call(arguments, 1);
            for (var i = 0, source; source = args[i]; i++) {
                if (!source) continue;
                for (var property in source) {
                    object[property] = source[property];
                }
            }
            return object;
        };
    });
    require.register("codeactual~require-component@0.1.1", function(exports, module) {
        "use strict";
        module.exports = function(require) {
            function requireComponent(baseName) {
                var found;
                Object.keys(require.modules).forEach(function findComponent(fullName) {
                    if (found) {
                        return;
                    }
                    if (new RegExp("(^|~)" + baseName + "@").test(fullName)) {
                        found = fullName;
                    }
                });
                if (found) {
                    return require(found);
                } else {
                    return require(baseName);
                }
            }
            return {
                requireComponent: requireComponent
            };
        };
    });
    require.register("visionmedia~configurable.js@f87ca5f", function(exports, module) {
        module.exports = function(obj) {
            obj.settings = {};
            obj.set = function(name, val) {
                if (1 == arguments.length) {
                    for (var key in name) {
                        this.set(key, name[key]);
                    }
                } else {
                    this.settings[name] = val;
                }
                return this;
            };
            obj.get = function(name) {
                return this.settings[name];
            };
            obj.enable = function(name) {
                return this.set(name, true);
            };
            obj.disable = function(name) {
                return this.set(name, false);
            };
            obj.enabled = function(name) {
                return !!this.get(name);
            };
            obj.disabled = function(name) {
                return !this.get(name);
            };
            return obj;
        };
    });
    require.register("apidox", function(exports, module) {
        module.exports = require("codeactual~require-component@0.1.1")(require);
    });
    if (typeof exports == "object") {
        module.exports = require("apidox");
    } else if (typeof define == "function" && define.amd) {
        define([], function() {
            return require("apidox");
        });
    } else {
        this["apidox"] = require("apidox");
    }
})();