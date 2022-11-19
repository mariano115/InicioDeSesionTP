const express = require("express");
const mongoose = require("mongoose");
const { getMensajes, addMensaje } = require("./Mensajes");
const { createUser, verifyUser } = require("./Users");
const { fakerProducts, auth } = require("./utils");
const { Server: HttpServer } = require("http");
const { Server: IOServer } = require("socket.io");
const app = express();
const httpServer = new HttpServer(app);
const io = new IOServer(httpServer);
const cors = require("cors");
const Config = require("./config");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");

const MongoStore = require("connect-mongo");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(cookieParser("secreto"));
app.use(
  session({
    store: MongoStore.create({
      mongoUrl: Config.urlMongo,
      mongoOptions: { useNewUrlParser: true, useUnifiedTopology: true },
    }),
    secret: "secreto",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 },
  })
);

const PORT = process.env.PORT || 8080;

mongoose.connect(
  Config.urlMongo,
  {
    useNewUrlParser: true,
  },
  (err) => {
    if (err) throw new Error(`Error de conexión a la base de datos ${err}`);
    console.log("Base de datos conectada");
  }
);

io.on("connection", async (socket) => {
  await getMensajes().then((res) => socket.emit("messages", res));
  socket.emit("products", await fakerProducts(5));

  socket.on("new-message", async (data) => {
    await addMensaje({
      author: {
        email: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        edad: data.edad,
        alias: data.alias,
        avatar: data.avatar,
      },
      text: data.text,
    });
    io.sockets.emit("messages", await getMensajes());
  });

  socket.on("new-product", async (data) => {
    const products = await fakerProducts(5);
    products.push(data);
    io.sockets.emit("products", products);
  });
});

app.set("views", "./views");
app.set("view engine", "ejs");

app.get("/", auth, (req, res) => {
  res.redirect("/home");
});

app.post("/login", (req, res) => {
  if (req.body.email && req.body.password) {
    if(verifyUser(req.body.email, req.body.password)){
      req.session.email = req.body.email;
    }else{
      //REDIRIGIR A LOGIN FALLIDO
    }
    res.redirect("/");
  }
});

app.get("/home", auth, (req, res) => {
  res.render("formulario", { nombre: req.session.user });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  if (req.body.password) {
    bcrypt.hash(req.body.password, 10, function (err, hash) {
      if (err) res.render("register-error");
      const newUser = { email: req.body.email, password: hash}
      if (createUser(newUser)) {
        res.redirect("/");
      } else {
        //REDIRIGIR A LOGIN FALLIDO
        res.render("register-error");
      }
    });
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.json({ success: "false", error: err });
    }
    res.render("bye", { nombre: req.query.nombre });
  });
});

app.get("/test-mensaje", (req, res) => {
  res.send(testNormalizr());
});

app.get("/productos-test", async (req, res) => {
  res.send(fakerProducts(5));
});

httpServer.listen(PORT, () => console.log("servidor Levantado"));
