/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var http = __webpack_require__(1);
var app = __webpack_require__(2).app;
var port = process.env.PORT || 3000;
var server = http.createServer(app);
server.listen(port, function () { return console.log("Server started on:", port); });


/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("http");

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(__dirname) {
Object.defineProperty(exports, "__esModule", { value: true });
var path = __webpack_require__(11);
var express = __webpack_require__(3);
var morgan = __webpack_require__(4);
var bodyParser = __webpack_require__(5);
var mongoose = __webpack_require__(6);
exports.secretKey = {
    primary: "461b2697-e354-4b45-9500-cb4b410ca993",
    secondary: "1f8bbfcb-3505-42b7-9f57-e7563eff8f25"
};
var productRoutes = __webpack_require__(12);
var orderRoutes = __webpack_require__(15);
var userRoutes = __webpack_require__(18);
mongoose
    .connect(process.env.MONGO_ATLAS_URI)
    .then(function () { return console.log("connected to db"); });
mongoose.Promise = global.Promise;
exports.app = express();
exports.app.use(morgan("dev"));
exports.app.use(bodyParser.urlencoded({ extended: false }));
exports.app.use(bodyParser.json());
exports.app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        return res.status(200).json({});
    }
    next();
});
exports.app.use("/products", productRoutes);
exports.app.use("/orders", orderRoutes);
exports.app.use("/user", userRoutes);
exports.app.use("/uploads", express.static(path.join(__dirname, "uploads")));
exports.app.use(function (req, res, next) {
    var error = new Error("Not found");
    res.status(404);
    next(error);
});
exports.app.use((function (error, req, res, next) {
    var status = error.status || res.statusCode || 500;
    res.status(status);
    res.json({
        error: {
            name: error.name,
            message: error.message,
            expiredAt: error.expiredAt,
            statusCode: status,
            request: {
                method: req.method,
                url: req.url
            }
        }
    });
}));

/* WEBPACK VAR INJECTION */}.call(exports, "/"))

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("express");

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("morgan");

/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = require("body-parser");

/***/ }),
/* 6 */
/***/ (function(module, exports) {

module.exports = require("mongoose");

/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = require("uuid");

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var jwt = __webpack_require__(9);
var app_1 = __webpack_require__(2);
var checkAuth = function (req, res, next) {
    try {
        var header = req.headers.authorization;
        if (!header)
            throw new Error("Authorization header error");
        var token = header.split(" ")[1];
        jwt.verify(token, app_1.secretKey.primary);
        next();
    }
    catch (error) {
        console.log(error);
        res.status(403);
        return next(error);
    }
};
module.exports = checkAuth;


/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = require("jsonwebtoken");

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var uuid = __webpack_require__(7);
var mongoose = __webpack_require__(6);
var productSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuid.v4()
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    productImage: {
        type: String,
        required: true
    }
});
module.exports = mongoose.model("Product", productSchema);


/***/ }),
/* 11 */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var express = __webpack_require__(3);
var multer = __webpack_require__(13);
var checkAuth = __webpack_require__(8);
var ProductsController = __webpack_require__(14);
var router = express.Router();
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, new Date().getTime() + "-" + file.originalname);
    }
});
var upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
            cb(null, true);
        }
        else {
            cb(null, false);
        }
    }
});
router.get("/", ProductsController.products_get_all);
router.post("/", checkAuth, upload.single("productImage"), ProductsController.products_create_product);
router.get("/:productId", ProductsController.products_get_product);
router.patch("/:productId", checkAuth, ProductsController.products_update_product);
router.delete("/:productId", checkAuth, ProductsController.products_delete_product);
module.exports = router;


/***/ }),
/* 13 */
/***/ (function(module, exports) {

module.exports = require("multer");

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var uuid = __webpack_require__(7);
var Product = __webpack_require__(10);
var products_get_all = function (req, res, next) {
    Product.find()
        .select("name price productImage")
        .exec()
        .then(function (docs) {
        var response = {
            count: docs.length,
            products: docs.map(function (doc) {
                return {
                    name: doc.name,
                    price: doc.price,
                    productImage: doc.productImage,
                    _id: doc._id,
                    request: {
                        type: "GET",
                        url: "http://localhost:3000/products/" + doc._id
                    }
                };
            })
        };
        res.status(200).json(response);
    })
        .catch(function (err) {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
};
var products_create_product = function (req, res, next) {
    var product = new Product({
        _id: uuid.v4(),
        name: req.body.name,
        price: req.body.price,
        productImage: req.file.path
    });
    product
        .save()
        .then(function (result) {
        res.status(201).json({
            message: "Created product successfully",
            createdProduct: {
                name: result.name,
                price: result.price,
                _id: result._id,
                request: {
                    type: "GET",
                    url: {
                        product: "/products/" + result._id,
                        productImage: "/uploads/" + req.file.filename
                    }
                }
            }
        });
    })
        .catch(function (err) {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
};
var products_get_product = function (req, res, next) {
    var id = req.params.productId;
    Product.findById(id)
        .select("name price _id productImage")
        .exec()
        .then(function (doc) {
        console.log("From database", doc);
        if (doc) {
            res.status(200).json({
                product: doc,
                request: {
                    type: "GET",
                    url: "http://localhost:3000/products"
                }
            });
        }
        else {
            res.status(404).json({
                message: "No valid entry found for provided ID"
            });
        }
    })
        .catch(function (err) {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
};
var products_update_product = function (req, res, next) {
    var id = req.params.productId;
    var updateOps = {};
    try {
        for (var _a = __values(req.body), _b = _a.next(); !_b.done; _b = _a.next()) {
            var ops = _b.value;
            updateOps[ops.propName] = ops.value;
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
        }
        finally { if (e_1) throw e_1.error; }
    }
    Product.update({
        _id: id
    }, {
        $set: updateOps
    })
        .exec()
        .then(function (result) {
        res.status(200).json({
            message: "Product updated",
            request: {
                type: "GET",
                url: "http://localhost:3000/products/" + id
            }
        });
    })
        .catch(function (err) {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
    var e_1, _c;
};
var products_delete_product = function (req, res, next) {
    var id = req.params.productId;
    Product.remove({
        _id: id
    }).exec()
        .then(function (result) {
        res.status(200).json({
            message: "Product deleted",
            request: {
                type: "POST",
                url: "http://localhost:3000/products",
                body: {
                    name: "String",
                    price: "Number"
                }
            }
        });
    })
        .catch(function (err) {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
};
exports.products_get_all = products_get_all;
exports.products_create_product = products_create_product;
exports.products_get_product = products_get_product;
exports.products_update_product = products_update_product;
exports.products_delete_product = products_delete_product;


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var express = __webpack_require__(3);
var router = express.Router();
var checkAuth = __webpack_require__(8);
var OrdersController = __webpack_require__(16);
router.get("/", checkAuth, OrdersController.orders_get_all);
router.post("/", checkAuth, OrdersController.orders_create_order);
router.get("/:orderId", checkAuth, OrdersController.orders_get_order);
router.delete("/:orderId", checkAuth, OrdersController.orders_delete_order);
module.exports = router;


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var uuid = __webpack_require__(7);
var Order = __webpack_require__(17);
var Product = __webpack_require__(10);
var orders_get_all = function (req, res, next) {
    Order.find()
        .select("product quantity _id")
        .populate("product", "name")
        .exec()
        .then(function (docs) {
        res.status(200).json({
            count: docs.length,
            orders: docs.map(function (doc) {
                return {
                    _id: doc._id,
                    product: doc.product,
                    quantity: doc.quantity,
                    request: {
                        type: "GET",
                        url: "http://localhost:3000/orders/" + doc._id
                    }
                };
            })
        });
    })
        .catch(function (err) {
        res.status(500).json({
            error: err
        });
    });
};
var orders_create_order = function (req, res, next) {
    Product.findById(req.body.productId)
        .then(function (product) {
        if (!product) {
            res.status(404).json({
                message: "Product not found"
            });
        }
        else {
            var order = new Order({
                _id: uuid.v4(),
                quantity: req.body.quantity,
                product: req.body.productId
            });
            return order.save();
        }
    })
        .then(function (result) {
        console.log(result);
        res.status(201).json({
            message: "Order stored",
            createdOrder: {
                _id: result._id,
                product: result.product,
                quantity: result.quantity
            },
            request: {
                type: "GET",
                url: "http://localhost:3000/orders/" + result._id
            }
        });
    })
        .catch(function (err) {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
};
var orders_get_order = function (req, res, next) {
    Order.findById(req.params.orderId)
        .populate("product")
        .exec()
        .then(function (order) {
        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }
        res.status(200).json({
            order: order,
            request: {
                type: "GET",
                url: "http://localhost:3000/orders"
            }
        });
    })
        .catch(function (err) {
        res.status(500).json({
            error: err
        });
    });
};
var orders_delete_order = function (req, res, next) {
    Order.remove({
        _id: req.params.orderId
    })
        .exec()
        .then(function (result) {
        res.status(200).json({
            message: "Order deleted",
            request: {
                type: "POST",
                url: "http://localhost:3000/orders",
                body: {
                    productId: "ID",
                    quantity: "Number"
                }
            }
        });
    })
        .catch(function (err) {
        res.status(500).json({
            error: err
        });
    });
};
exports.orders_get_all = orders_get_all;
exports.orders_create_order = orders_create_order;
exports.orders_get_order = orders_get_order;
exports.orders_delete_order = orders_delete_order;


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var uuid = __webpack_require__(7);
var mongoose = __webpack_require__(6);
var orderSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuid.v4()
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    quantity: {
        type: Number,
        default: 1
    }
});
module.exports = mongoose.model("Order", orderSchema);


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var express = __webpack_require__(3);
var router = express.Router();
var UserController = __webpack_require__(19);
var checkAuth = __webpack_require__(8);
router.get("/", UserController.users_get_all);
router.post("/signup", UserController.user_signup);
router.post("/login", UserController.user_login);
router.delete("/:userId", checkAuth, UserController.user_delete);
module.exports = router;


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var bcrypt = __webpack_require__(20);
var jwt = __webpack_require__(9);
var uuid = __webpack_require__(7);
var app_1 = __webpack_require__(2);
var User = __webpack_require__(21);
var users_get_all = function (req, res, next) {
    User.find()
        .exec()
        .then(function (docs) {
        var response = {
            count: docs.length,
            products: docs.map(function (doc) {
                return docs;
            })
        };
        res.status(200).json(response);
    })
        .catch(function (err) {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
};
var user_signup = function (req, res, next) {
    User.find({ email: req.body.email })
        .exec()
        .then(function (user) {
        if (user.length >= 1) {
            return res.status(409).json({
                message: "Mail exists"
            });
        }
        bcrypt.hash(req.body.password, 10, function (err, hash) {
            if (err) {
                return res.status(500).json({
                    error: err
                });
            }
            var user = new User({
                _id: uuid.v4(),
                email: req.body.email,
                password: hash
            });
            user
                .save()
                .then(function (result) {
                console.log(result);
                res.status(201).json({
                    message: "User created"
                });
            })
                .catch(function (err) {
                console.log(err);
                res.status(500).json({
                    error: err
                });
            });
        });
    });
};
var user_login = function (req, res, next) {
    User.findOne({
        email: req.body.email
    })
        .select("_id email password")
        .exec()
        .then(function (user) {
        if (!user) {
            res.status(401);
            return next(new Error("Wrong credentials"));
        }
        bcrypt.compare(req.body.password, user.password, function (err, result) {
            try {
                if (err)
                    throw new Error("Auth failed");
                res.status(200).json({
                    message: "Authorization successful",
                    token: jwt.sign({ user: user }, app_1.secretKey.primary, {
                        expiresIn: "1h"
                    })
                });
            }
            catch (error) {
                console.log(error);
                res.status(401);
                return next(error);
            }
        });
    })
        .catch(function (err) {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
};
var user_delete = function (req, res, next) {
    User.remove({
        _id: req.params.userId
    })
        .exec()
        .then(function (result) {
        res.status(200).json({
            message: "User deleted"
        });
    })
        .catch(function (err) {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
};
exports.users_get_all = users_get_all;
exports.user_signup = user_signup;
exports.user_login = user_login;
exports.user_delete = user_delete;


/***/ }),
/* 20 */
/***/ (function(module, exports) {

module.exports = require("bcrypt");

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var uuid = __webpack_require__(7);
var mongoose = __webpack_require__(6);
var userSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuid.v4()
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
    },
    password: {
        type: String,
        required: true
    }
});
module.exports = mongoose.model("User", userSchema);


/***/ })
/******/ ]);