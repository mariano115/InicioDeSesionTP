const { Schema, model } = require("mongoose");

const MessagesSchema = new Schema({
	author: {
		email: { type: String },
		nombre: { type: String },
		apellido: { type: String },
		edad: { type: Number },
		alias: { type: String },
		avatar: { type: String },
	},
	text: { type: String }
});
module.exports = model("messages", MessagesSchema)
