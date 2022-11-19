const { faker } = require("@faker-js/faker");

const auth = (req, res, next) => {
  if (req.session?.user) {
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

module.exports = { auth, fakerProducts };
