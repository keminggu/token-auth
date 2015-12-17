var express  = require('express');
var router 	 = express.Router();

var config   = require("./../config");
var User     = require('./../models/user');
var tokenManager = require('./../models/token-manager');

//注册
router.post('/signup', function(req, res, next) {
	var phoneNumber = req.body.phoneNumber || '';
    var password = req.body.password || '';
 	console.log(req.body);
    if (phoneNumber == '' || password == '') {
        return res.sendStatus(401);
    }

    // find user by phone number and judge the user exists or not.
	User.findOne({phoneNumber: req.body.phoneNumber}, function(err, user) {
	    if (err) {
	        res.json({
	            type: false,
	            data: "Error occured: " + err
	        });
	        return;
	    }

	    // user allready exists
        if (user) {
            res.json({
                type: false,
                data: "User already exists!"
            });
            return;
        }

        //save user model
        var userModel = new User();
        userModel.phoneNumber = req.body.phoneNumber;
        userModel.password = req.body.password;
        userModel.save(function(err, user) {
        	//save success and return token
            var token = tokenManager.genAuthKey(user);
            res.json({
                type: true,
                token: token
            });
        })
	});
});

//登录
router.post('/signin', function(req, res, next) {
	// attempt to authenticate user
	console.log(req.body);
    User.getAuthenticated(req.body.phoneNumber, req.body.password, function(err, user, reason) {
        if (err) throw err;

        // login was successful if we have a user
        if (user) {
            // generate  token by user
            var data = tokenManager.createToken(user,function(err,data){
            	if (err) throw err;

	            res.json({
	                type: true,
	                token: data.token
	            });
            });
            return;
        }

        // otherwise we can determine why we failed
        var reasons = User.failedLogin;
        switch (reason) {
            case reasons.NOT_FOUND:
            	res.json({
	                type: false,
	                data: "not found"
	            });  
            case reasons.PASSWORD_INCORRECT:
              	res.json({
	                type: false,
	                data: "incorrect phone number/ password"
	            });  
                break;
            case reasons.MAX_ATTEMPTS:
                res.json({
	                type: false,
	                data: "locked"
	            });  
                break;
        }
    });
});

//test
router.get('/me', [tokenManager.verifyToken], function(req, res, next) {
	res.sendStatus(200);
});

module.exports = router;
