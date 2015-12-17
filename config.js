module.exports = {
  mongo_db 	 : process.env.MONGO_URI || 'mongodb://localhost:27017/test',
  redis_db   : process.env.REDIS_URI || 'redis://localhost:6379',
  jwt_secret : process.env.JWT_SECRET || 'test',
  token_exp  : 60 * 60,
};