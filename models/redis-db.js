var redis 		= require('redis');
var config 		= require('./../config');
var redisClient = redis.createClient(config.redis_db,{});

redisClient.on('error', function (err) {
    console.error('Error ' + err);
});

redisClient.on('connect', function () {
    console.log('Redis is ready');
});

exports.redis = redis;
exports.redisClient = redisClient;