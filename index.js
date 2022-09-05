require("dotenv").config();
const { Server } = require("socket.io");
const path = require("path");
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const PORT = process.env.PORT || 5000;
const cors = require("cors");
const bodyParser = require("body-parser");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const LocalStrategy = require("passport-local").Strategy;
const helmet = require("helmet");
const bcrypt = require("bcrypt");
const { sessionMiddleware } = require("./helpers/sessionHelper");
const ExpressPeerServer = require("peer").ExpressPeerServer;
const peerServer = ExpressPeerServer(server, { debug: true });
//my dumbass was debugging with peervc.onrender.com :(
const URL =
  process.env.NODE_ENV === "production"
    ? "https://oauthvc.onrender.com"
    : "http://localhost:3000";
const io = new Server(server, {
  /* options */
  cors: {
    origin: "*",
    transports: ["websocket", "polling"],
  },
});
const User = require("./helpers/User");

app.use("/peerjs", peerServer);
app.set("trust proxy", true);
// app.use(
//   helmet({
//     contentSecurityPolicy: false,
//   })
// );
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
//this one line took a lot of fudgery to get to work
app.use(cors({ credentials: true, origin: URL }));
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
// app.use((req, res, next) => {
//   console.log(req.session);
//   console.log(req.user);
//   next();
// })
//set static serve production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "frontend/dist")));
}

//temp db
let users = [];

//passport serialize/deserialize users
passport.serializeUser((user, cb) => {
  cb(null, user._id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, doc) => {
    // Whatever we return goes to the client and binds to the req.user property
    return done(null, doc);
  });
});

//google strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOne({ googleId: profile.id }, async (err, doc) => {
        if (err) {
          return cb(err, null);
        }

        if (!doc) {
          const newUser = new User({
            googleId: profile.id,
            username: profile.name.givenName,
          });

          await newUser.save();
          cb(null, newUser);
        } else cb(null, doc);
      });
    }
  )
);

//local strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
      session: true,
    },
    function (username, password, done) {
      User.findOne({ username: username }, async (err, user) => {
        if (err) {
          return done(err);
        }
        if (!user) {
          console.log("no user");
          const hashedPassword = bcrypt.hashSync(password, 10);
          const newUser = new User({
            username: username,
            password: hashedPassword,
          });
          console.log("new user: ", newUser);
          newUser.isNew = true;
          await newUser.save();
          console.log("new user saved");
          return done(null, newUser);
        }
        if (!bcrypt.compareSync(password, user.password)) {
          console.log("wrong password");
          return done(null, false);
        }
        console.log("user validated");
        return done(null, user);
      });
    }
  )
);

//google auth route
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { scope: ["profile"] }),
  (req, res) => {
    res.redirect(URL);
  }
);

//local auth route
app.post("/api/login", passport.authenticate("local"), (req, res) => {
  res.json({ status: "success" });
});

//inapp routes begin here
app.get("/api/getuser", (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.json(null);
  }
});

app.get("/auth/logout", (req, res) => {
  console.log("logging out");
  req.session.destroy();
  req.logout((err) => {
    if (err) {
      console.log(err);
    }
  });
  res.clearCookie("vc-session");
});

//socket connections handled here
let rooms = [];
io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("roomJoin", (roomCode, user, fn) => {
    socket.join(roomCode);
    console.log("joined room: " + roomCode);
    let room = rooms.find((r) => r.roomCode === roomCode);
    let id = socket.id;
    console.log(user);
    let userObject = {
      id: id,
      uname: user.name,
      socketId: socket.id,
    };
    if (!room) {
      room = {
        roomCode: roomCode,
        users: [userObject],
        hasStarted: false,
      };
      rooms.push(room);
    } else {
      if (room?.hasStarted) {
        fn(false);
      }
      room.users.push(userObject);
      if (room.users.length === 2) {
        room.hasStarted = true;
      }
    }
    socket.to(roomCode).emit("updatePlayers", room.users);
    fn(true, room.users);
    console.log(room.hasStarted);
  });

  socket.on("clearRooms", () => {
    console.log(socket.rooms);
    socket.leaveAll();
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

io.sockets.adapter.on("delete-room", (roomCode) => {
  rooms = rooms.filter((room) => {
    if (room.roomCode === roomCode) {
      console.log("deleted room: " + roomCode);
    }
    return !(room.roomCode === roomCode);
  });
});

io.sockets.adapter.on("create-room", (roomCode) => {
  console.log("created room: " + roomCode);
});

io.sockets.adapter.on("leave-room", (roomCode, id) => {
  rooms.forEach((room) => {
    if (room.roomCode === roomCode) {
      room.users = room.users.filter((user) => {
        console.log(user.socketId + " left room: " + roomCode);
        if (user.socketId === id) {
          console.log("forfeited: " + user.uname);
          io.to(roomCode).emit("playerForfeit", user.id);
        }
        return user.socketId !== id;
      });
      room.hasStarted = false;
      io.to(roomCode).emit("updatePlayers", room.users);
    }
  });
});

//peer server logic here
peerServer.on("connection", function (client) {
  console.log("peer ", client.getId());
  // console.log(server._clients);
});

//catch all production build
if (process.env.NODE_ENV === "production") {
  app.get("*", function (req, res) {
    res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
  });
}

//begin server listening
server.listen(PORT, () => {
  console.log("listening on port", PORT);
});
