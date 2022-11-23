const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const { getMensajes, addMensaje } = require("./Mensajes");
const { createUser } = require("./Users");
const { fakerProducts, auth, createHash } = require("./utils");
const { Server: HttpServer } = require("http");
const { Server: IOServer } = require("socket.io");
const app = express();
const httpServer = new HttpServer(app);
const io = new IOServer(httpServer);
const cors = require("cors");
const Config = require("./config");
const cookieParser = require("cookie-parser");
const userModel = require("./models/User.model");
const MongoStore = require("connect-mongo");
const { isValidPassword } = require("./utils");

//passport imports
const passport = require("passport");
const { Strategy } = require("passport-local");
const LocalStrategy = Strategy;

//servidor
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

/*----------- Session -----------*/
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

// motor de vistas
app.set("views", "./views");
app.set("view engine", "ejs");

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

//middlewares passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  "login",
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    ( email, password, done) => {
      mongoose.connect(Config.urlMongo);
      try {
        userModel.findOne(
          {
            email,
          },
          (err, user) => {
            console.log(user)
            if (err) {
              return done(err, null);
            }

            if (!user) {
              return done(null, false);
            }

            if (!isValidPassword(user, password)) {
              return done(null, false);
            }

            return done(null, user);
          }
        );
      } catch (e) {
        return done(e, null);
      }
    }
  )
);

//serializar y deserializar

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  userModel.findById(id, function (err, user) {
    done(err, user);
  });
});

app.get("/", auth, (req, res) => {
  res.redirect("/home");
});

app.post("/login",
  passport.authenticate("login", {
    failureRedirect: "/login-error"
  }), (req, res) => {
    console.log('home')
    req.session.email = req.body.email;
    res.redirect("/home");
  }
);

app.get("/home", auth, (req, res) => {
  res.render("formulario", { email: req.session.email });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  try {
    const hashPassword = createHash(req.body.password)
    const newUser = { email: req.body.email, password: hashPassword }
      if (createUser(newUser)) {
        res.redirect("/");
      } else {
        res.render("register-error");
      }
  } catch (error) {
    res.render("register-error");
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.json({ success: "false", error: err });
    }
    res.render("bye", { nombre: req.query.email });
  });
});

app.get("/register-error", (req, res) => {
  res.render("register-error");
});

app.get("/login-error", (req, res) => {
  res.render("login-error");
});

app.get("/test-mensaje", (req, res) => {
  res.send(testNormalizr());
});

app.get("/productos-test", async (req, res) => {
  res.send(fakerProducts(5));
});

httpServer.listen(PORT, () => console.log("servidor Levantado"));
