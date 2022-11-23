const messageModel = require("./models/Message.model");

const getMensajes = async () => {
  return await messageModel.find();
};

const addMensaje = async (mensaje) => {
  try {
    const mensGuardar = new messageModel(mensaje);
    mensGuardar.save();
    console.log("Mensaje guardado", mensGuardar);
  } catch (error) {
    console.log("error", error);
  }
};

module.exports = { addMensaje, getMensajes };
