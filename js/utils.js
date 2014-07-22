var Utils =  {
    isNullOrWhitespace: function (input) {
        if (this.isUndefined(input) || input == null) return true;

        // if the input is an object, but is not null, then return false as it has some type of value.
        if (this.isObject)
            return false;

        if(this.isString(input))
            return this.isEmptyString(input)

        return false;
    },
    isString: function(obj) {
        return typeof obj === "string";
    },
    isNumber: function(obj) {
        return typeof obj === "number";
    },
    isArray: $.isArray,
    isFunction: $.isFunction,
    isObject: $.isPlainObject,
    isUndefined: function(obj) {
        return typeof obj === "undefined";
    },
    isEmptyString: function(str) {
        return !str || /^\s*$/.test(str);
    },
    getOption: function(option, property, def){
        if(!this.isObject(option) || !option.hasOwnProperty(property))
            return def;

        return option[property];
    }
};