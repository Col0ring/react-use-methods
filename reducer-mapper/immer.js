(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "immer"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.combineReducers = void 0;
    const immer_1 = require("immer");
    function combineReducers(reducer) {
        return (state, action) => immer_1.produce(state, (draft) => {
            return reducer(draft, action);
        });
    }
    exports.combineReducers = combineReducers;
});
