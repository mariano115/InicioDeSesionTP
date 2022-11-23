const { faker } = require("@faker-js/faker");
const bcrypt = require("bcrypt");

const isValidPassword = (user, password) => {
	return bcrypt.compareSync(password, user.password);
}

const createHash = (password) => {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
}

const auth = (req, res, next) => {
  if (req.session?.email) {
    next();
  } else {
    res.render("login");
  }
};

const fakerProducts = () => {
  const products = [];
  for (let index = 0; index < 5; index++) {
    products.push({
      nombre: faker.commerce.product(),
      precio: faker.commerce.price(),
      foto: faker.image.imageUrl(),
    });
  }
  return products;
};

module.exports = { auth, fakerProducts, isValidPassword, createHash };
