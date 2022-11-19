const { Schema, model } = require("mongoose");

const UserSchema = new Schema({
	email: { type: String},
	password: { type: String }
});
module.exports = model("users", UserSchema)
