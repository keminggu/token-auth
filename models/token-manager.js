var jwt      	= require('jwt-simple');
var moment 		= require("moment");
var config   	= require('./../config');
var redisClient = require('./redis-db').redisClient;

//get the request token
function getToken(req) {
	//get post body or query url or header  token.
    var token = (req.body && req.body.token) || (req.query && req.query.token) || req.headers['x-access-token'];
    if (typeof token !== 'undefined') {
    	return token;
    }

    //get bearer token
    var bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        var bearer = bearerHeader.split(" ");
        if (bearer.length == 2) {
        	token = bearer[1];
        	return token;
        } else {
        	return null;
        }
    } else {
        return null;
    }
}

//生成token
exports.genAuthKey = function(user) {
	var expires = moment().add(config.token_exp, 'seconds').valueOf();
	var token = jwt.encode({
		  iss: user._id,
		  exp: expires,
		}, config.jwt_secret);

	return token;
}

exports.createToken = function(user, cb){
	if (!user) return next(new Error('user data can not be empty'));

	var data = {
        _id: user._id,
        phoneNumber: user.phoneNumber,
        token: exports.genAuthKey(user),
    };
    console.log('create token' + data.token);
    //save user data to redis.
    redisClient.set(data.token, JSON.stringify(data), function (err, reply) {
        if (err) return cb(err);

    	if (reply) {
            redisClient.expire(data.token, config.token_exp, function (err, reply) {
                if (err) {
                    return cb(new Error("Can not set the expire value for the token key"));
                }

                if (reply) {
                    cb(null, data)
                } else {
                    return cb(new Error('Expiration not set on redis'));
                }
            });
        } else {
            return cb(new Error('Token not set in redis'));
        }
    });
}


exports.expireToken = function(req) {
    var token = getToken(req);
    if (token != null) {
    	//clear the token.
        redisClient.expire(token, 0);
    }
    return token != null;
};

// Middleware for token verification
exports.verifyToken = function (req, res, next) {
    var token = getToken(req);
    console.log("token =====" + token);
    //no authorization
    if (!token) {
    	res.sendStatus(401);
    	return;
    }

    // get token data from redis
    redisClient.get(token, function (err, reply) {
        if (err) {
        	console.error('get token from redis err:' + err);
            return res.sendStatus(500);
        }

       	//handle token not exists.
        if (!reply) {
            res.sendStatus(401);
        } else {
            next();
        }
    });
};
