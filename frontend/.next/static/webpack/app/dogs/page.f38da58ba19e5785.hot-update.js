"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("app/dogs/page",{

/***/ "(app-pages-browser)/./src/lib/api.ts":
/*!************************!*\
  !*** ./src/lib/api.ts ***!
  \************************/
/***/ (function(module, __webpack_exports__, __webpack_require__) {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   endpoints: function() { return /* binding */ endpoints; }\n/* harmony export */ });\n/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! axios */ \"(app-pages-browser)/./node_modules/axios/lib/axios.js\");\n\n// Create an axios instance with default config\nconst api = axios__WEBPACK_IMPORTED_MODULE_0__[\"default\"].create({\n    baseURL: \"http://localhost:3000/api/v1\" || 0,\n    headers: {\n        \"Content-Type\": \"application/json\"\n    }\n});\n// API endpoints\nconst endpoints = {\n    // Appointments\n    appointments: {\n        getAll: ()=>api.get(\"/appointments\"),\n        getById: (id)=>api.get(\"/appointments/\".concat(id)),\n        create: (data)=>api.post(\"/appointments\", data),\n        update: (id, data)=>api.put(\"/appointments/\".concat(id), data),\n        delete: (id)=>api.delete(\"/appointments/\".concat(id))\n    },\n    // Customers\n    customers: {\n        getAll: ()=>api.get(\"/customers\"),\n        getTable: ()=>api.get(\"/customers/table\"),\n        getById: (id)=>api.get(\"/customers/\".concat(id)),\n        create: (data)=>api.post(\"/customers\", data),\n        update: (id, data)=>api.put(\"/customers/\".concat(id), data),\n        delete: (id)=>api.delete(\"/customers/\".concat(id))\n    },\n    // Dogs\n    dogs: {\n        getAll: ()=>api.get(\"/dogs\"),\n        getTable: ()=>api.get(\"/dogs/table\"),\n        getById: (id)=>api.get(\"/dogs/\".concat(id)),\n        create: (data)=>api.post(\"/dogs\", data),\n        update: (id, data)=>api.put(\"/dogs/\".concat(id), data),\n        delete: (id)=>api.delete(\"/dogs/\".concat(id))\n    },\n    // Invoices\n    invoices: {\n        getAll: ()=>api.get(\"/invoices\"),\n        getById: (id)=>api.get(\"/invoices/\".concat(id)),\n        create: (data)=>api.post(\"/invoices\", data),\n        update: (id, data)=>api.put(\"/invoices/\".concat(id), data),\n        delete: (id)=>api.delete(\"/invoices/\".concat(id))\n    },\n    // Dog Breeds\n    dogBreeds: {\n        getAll: ()=>api.get(\"/static/dog-breeds\")\n    },\n    // Dog Sizes\n    dogSizes: {\n        getAll: ()=>api.get(\"/static/dog-sizes\")\n    }\n};\n/* harmony default export */ __webpack_exports__[\"default\"] = (api);\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL3NyYy9saWIvYXBpLnRzIiwibWFwcGluZ3MiOiI7Ozs7O0FBQTBCO0FBRTFCLCtDQUErQztBQUMvQyxNQUFNQyxNQUFNRCw2Q0FBS0EsQ0FBQ0UsTUFBTSxDQUFDO0lBQ3ZCQyxTQUFTQyw4QkFBK0IsSUFBSTtJQUM1Q0csU0FBUztRQUNQLGdCQUFnQjtJQUNsQjtBQUNGO0FBRUEsZ0JBQWdCO0FBQ1QsTUFBTUMsWUFBWTtJQUN2QixlQUFlO0lBQ2ZDLGNBQWM7UUFDWkMsUUFBUSxJQUFNVCxJQUFJVSxHQUFHLENBQUM7UUFDdEJDLFNBQVMsQ0FBQ0MsS0FBZVosSUFBSVUsR0FBRyxDQUFDLGlCQUFvQixPQUFIRTtRQUNsRFgsUUFBUSxDQUFDWSxPQUFjYixJQUFJYyxJQUFJLENBQUMsaUJBQWlCRDtRQUNqREUsUUFBUSxDQUFDSCxJQUFZQyxPQUFjYixJQUFJZ0IsR0FBRyxDQUFDLGlCQUFvQixPQUFISixLQUFNQztRQUNsRUksUUFBUSxDQUFDTCxLQUFlWixJQUFJaUIsTUFBTSxDQUFDLGlCQUFvQixPQUFITDtJQUN0RDtJQUVBLFlBQVk7SUFDWk0sV0FBVztRQUNUVCxRQUFRLElBQU1ULElBQUlVLEdBQUcsQ0FBQztRQUN0QlMsVUFBVSxJQUFNbkIsSUFBSVUsR0FBRyxDQUFDO1FBQ3hCQyxTQUFTLENBQUNDLEtBQWVaLElBQUlVLEdBQUcsQ0FBQyxjQUFpQixPQUFIRTtRQUMvQ1gsUUFBUSxDQUFDWSxPQUFjYixJQUFJYyxJQUFJLENBQUMsY0FBY0Q7UUFDOUNFLFFBQVEsQ0FBQ0gsSUFBWUMsT0FBY2IsSUFBSWdCLEdBQUcsQ0FBQyxjQUFpQixPQUFISixLQUFNQztRQUMvREksUUFBUSxDQUFDTCxLQUFlWixJQUFJaUIsTUFBTSxDQUFDLGNBQWlCLE9BQUhMO0lBQ25EO0lBRUEsT0FBTztJQUNQUSxNQUFNO1FBQ0pYLFFBQVEsSUFBTVQsSUFBSVUsR0FBRyxDQUFDO1FBQ3RCUyxVQUFVLElBQU1uQixJQUFJVSxHQUFHLENBQUM7UUFDeEJDLFNBQVMsQ0FBQ0MsS0FBZVosSUFBSVUsR0FBRyxDQUFDLFNBQVksT0FBSEU7UUFDMUNYLFFBQVEsQ0FBQ1ksT0FBY2IsSUFBSWMsSUFBSSxDQUFDLFNBQVNEO1FBQ3pDRSxRQUFRLENBQUNILElBQVlDLE9BQWNiLElBQUlnQixHQUFHLENBQUMsU0FBWSxPQUFISixLQUFNQztRQUMxREksUUFBUSxDQUFDTCxLQUFlWixJQUFJaUIsTUFBTSxDQUFDLFNBQVksT0FBSEw7SUFDOUM7SUFFQSxXQUFXO0lBQ1hTLFVBQVU7UUFDUlosUUFBUSxJQUFNVCxJQUFJVSxHQUFHLENBQUM7UUFDdEJDLFNBQVMsQ0FBQ0MsS0FBZVosSUFBSVUsR0FBRyxDQUFDLGFBQWdCLE9BQUhFO1FBQzlDWCxRQUFRLENBQUNZLE9BQWNiLElBQUljLElBQUksQ0FBQyxhQUFhRDtRQUM3Q0UsUUFBUSxDQUFDSCxJQUFZQyxPQUFjYixJQUFJZ0IsR0FBRyxDQUFDLGFBQWdCLE9BQUhKLEtBQU1DO1FBQzlESSxRQUFRLENBQUNMLEtBQWVaLElBQUlpQixNQUFNLENBQUMsYUFBZ0IsT0FBSEw7SUFDbEQ7SUFFQSxhQUFhO0lBQ2JVLFdBQVc7UUFDVGIsUUFBUSxJQUFNVCxJQUFJVSxHQUFHLENBQUM7SUFDeEI7SUFFQSxZQUFZO0lBQ1phLFVBQVU7UUFDUmQsUUFBUSxJQUFNVCxJQUFJVSxHQUFHLENBQUM7SUFDeEI7QUFDRixFQUFFO0FBRUYsK0RBQWVWLEdBQUdBLEVBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9fTl9FLy4vc3JjL2xpYi9hcGkudHM/MmZhYiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXhpb3MgZnJvbSAnYXhpb3MnO1xyXG5cclxuLy8gQ3JlYXRlIGFuIGF4aW9zIGluc3RhbmNlIHdpdGggZGVmYXVsdCBjb25maWdcclxuY29uc3QgYXBpID0gYXhpb3MuY3JlYXRlKHtcclxuICBiYXNlVVJMOiBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19BUElfVVJMIHx8ICdodHRwOi8vbG9jYWxob3N0OjMwMDAvYXBpL3YxJyxcclxuICBoZWFkZXJzOiB7XHJcbiAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gIH0sXHJcbn0pO1xyXG5cclxuLy8gQVBJIGVuZHBvaW50c1xyXG5leHBvcnQgY29uc3QgZW5kcG9pbnRzID0ge1xyXG4gIC8vIEFwcG9pbnRtZW50c1xyXG4gIGFwcG9pbnRtZW50czoge1xyXG4gICAgZ2V0QWxsOiAoKSA9PiBhcGkuZ2V0KCcvYXBwb2ludG1lbnRzJyksXHJcbiAgICBnZXRCeUlkOiAoaWQ6IG51bWJlcikgPT4gYXBpLmdldChgL2FwcG9pbnRtZW50cy8ke2lkfWApLFxyXG4gICAgY3JlYXRlOiAoZGF0YTogYW55KSA9PiBhcGkucG9zdCgnL2FwcG9pbnRtZW50cycsIGRhdGEpLFxyXG4gICAgdXBkYXRlOiAoaWQ6IG51bWJlciwgZGF0YTogYW55KSA9PiBhcGkucHV0KGAvYXBwb2ludG1lbnRzLyR7aWR9YCwgZGF0YSksXHJcbiAgICBkZWxldGU6IChpZDogbnVtYmVyKSA9PiBhcGkuZGVsZXRlKGAvYXBwb2ludG1lbnRzLyR7aWR9YCksXHJcbiAgfSxcclxuICBcclxuICAvLyBDdXN0b21lcnNcclxuICBjdXN0b21lcnM6IHtcclxuICAgIGdldEFsbDogKCkgPT4gYXBpLmdldCgnL2N1c3RvbWVycycpLFxyXG4gICAgZ2V0VGFibGU6ICgpID0+IGFwaS5nZXQoJy9jdXN0b21lcnMvdGFibGUnKSxcclxuICAgIGdldEJ5SWQ6IChpZDogbnVtYmVyKSA9PiBhcGkuZ2V0KGAvY3VzdG9tZXJzLyR7aWR9YCksXHJcbiAgICBjcmVhdGU6IChkYXRhOiBhbnkpID0+IGFwaS5wb3N0KCcvY3VzdG9tZXJzJywgZGF0YSksXHJcbiAgICB1cGRhdGU6IChpZDogbnVtYmVyLCBkYXRhOiBhbnkpID0+IGFwaS5wdXQoYC9jdXN0b21lcnMvJHtpZH1gLCBkYXRhKSxcclxuICAgIGRlbGV0ZTogKGlkOiBudW1iZXIpID0+IGFwaS5kZWxldGUoYC9jdXN0b21lcnMvJHtpZH1gKSxcclxuICB9LFxyXG4gIFxyXG4gIC8vIERvZ3NcclxuICBkb2dzOiB7XHJcbiAgICBnZXRBbGw6ICgpID0+IGFwaS5nZXQoJy9kb2dzJyksXHJcbiAgICBnZXRUYWJsZTogKCkgPT4gYXBpLmdldCgnL2RvZ3MvdGFibGUnKSxcclxuICAgIGdldEJ5SWQ6IChpZDogbnVtYmVyKSA9PiBhcGkuZ2V0KGAvZG9ncy8ke2lkfWApLFxyXG4gICAgY3JlYXRlOiAoZGF0YTogYW55KSA9PiBhcGkucG9zdCgnL2RvZ3MnLCBkYXRhKSxcclxuICAgIHVwZGF0ZTogKGlkOiBudW1iZXIsIGRhdGE6IGFueSkgPT4gYXBpLnB1dChgL2RvZ3MvJHtpZH1gLCBkYXRhKSxcclxuICAgIGRlbGV0ZTogKGlkOiBudW1iZXIpID0+IGFwaS5kZWxldGUoYC9kb2dzLyR7aWR9YCksXHJcbiAgfSxcclxuICBcclxuICAvLyBJbnZvaWNlc1xyXG4gIGludm9pY2VzOiB7XHJcbiAgICBnZXRBbGw6ICgpID0+IGFwaS5nZXQoJy9pbnZvaWNlcycpLFxyXG4gICAgZ2V0QnlJZDogKGlkOiBudW1iZXIpID0+IGFwaS5nZXQoYC9pbnZvaWNlcy8ke2lkfWApLFxyXG4gICAgY3JlYXRlOiAoZGF0YTogYW55KSA9PiBhcGkucG9zdCgnL2ludm9pY2VzJywgZGF0YSksXHJcbiAgICB1cGRhdGU6IChpZDogbnVtYmVyLCBkYXRhOiBhbnkpID0+IGFwaS5wdXQoYC9pbnZvaWNlcy8ke2lkfWAsIGRhdGEpLFxyXG4gICAgZGVsZXRlOiAoaWQ6IG51bWJlcikgPT4gYXBpLmRlbGV0ZShgL2ludm9pY2VzLyR7aWR9YCksXHJcbiAgfSxcclxuICBcclxuICAvLyBEb2cgQnJlZWRzXHJcbiAgZG9nQnJlZWRzOiB7XHJcbiAgICBnZXRBbGw6ICgpID0+IGFwaS5nZXQoJy9zdGF0aWMvZG9nLWJyZWVkcycpLFxyXG4gIH0sXHJcbiAgXHJcbiAgLy8gRG9nIFNpemVzXHJcbiAgZG9nU2l6ZXM6IHtcclxuICAgIGdldEFsbDogKCkgPT4gYXBpLmdldCgnL3N0YXRpYy9kb2ctc2l6ZXMnKSxcclxuICB9LFxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXBpOyAiXSwibmFtZXMiOlsiYXhpb3MiLCJhcGkiLCJjcmVhdGUiLCJiYXNlVVJMIiwicHJvY2VzcyIsImVudiIsIk5FWFRfUFVCTElDX0FQSV9VUkwiLCJoZWFkZXJzIiwiZW5kcG9pbnRzIiwiYXBwb2ludG1lbnRzIiwiZ2V0QWxsIiwiZ2V0IiwiZ2V0QnlJZCIsImlkIiwiZGF0YSIsInBvc3QiLCJ1cGRhdGUiLCJwdXQiLCJkZWxldGUiLCJjdXN0b21lcnMiLCJnZXRUYWJsZSIsImRvZ3MiLCJpbnZvaWNlcyIsImRvZ0JyZWVkcyIsImRvZ1NpemVzIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(app-pages-browser)/./src/lib/api.ts\n"));

/***/ })

});