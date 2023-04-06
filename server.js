import bcrypt from "bcryptjs";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import multer from "multer";
import passport from "passport";
import passportLocal from "passport-local";
import path from "path";
import { fileURLToPath } from "url";
import { createLocation } from "./controllers/location.controllers.js";
import { Business } from "./models/Business.model.js";
import { User } from "./models/User.model.js";
import businessRouter from "./routes/business.routes.js";
import userRouter from "./routes/user.routes.js";
import locationRouter from "./routes/location.routes.js";
const LocalStrategy = passportLocal.Strategy;

/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

/* FILE STORAGE */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

var whitelist = [
  "http://localhost:3000",
  "http://www.localhost:3000",
  "http://172.20.10.9:3000",
  "http://www.172.20.10.9:3000",
  "https://travaye-beta.netlify.app",
  "https://www.travaye-beta.netlify.app",
];
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};
app.use(cors(corsOptions));
app.use(
  session({
    secret: "LolSecretIsHere",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
function SessionConstructor(userId, userGroup, details) {
  this.userId = userId;
  this.userGroup = userGroup;
  this.details = details;
}
passport.use(
  "userLocal",
  new LocalStrategy({ usernameField: "username" }, User.authenticate())
);
const businessStrategy = new LocalStrategy(
  {
    usernameField: "businessEmail",
    passwordField: "password",
    session: true,
  },
  async function (businessEmail, password, done) {
    // find user by email and password using Model2
    Business.findOne({ businessEmail: businessEmail })
      .then(async (user) => {
        console.log(user);
        if (!user) {
          return done(null, false, { message: "User doesn't Exist" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect email or password." });
        }

        return done(null, user);
      })
      .catch((err) => done(err));
  }
);
passport.use("businessLocal", businessStrategy);

// used to serialize the user for the session
passport.serializeUser(function (userObject, done) {
  let userGroup = "User";
  let userPrototype = Object.getPrototypeOf(userObject);
  if (userPrototype === User.prototype) {
    userGroup = "User";
  } else if (userPrototype === Business.prototype) {
    userGroup = "Business";
  }
  let sessionContructor = new SessionConstructor(userObject.id, userGroup, "");
  done(null, sessionContructor);
});
// deserialize the user
passport.deserializeUser(function (sessionContructor, done) {
  if (sessionContructor.userGroup === "User") {
    User.findById({ _id: sessionContructor.userId }, function (err, user) {
      done(err, user);
    });
  } else if (sessionContructor.userGroup === "Business") {
    Business.findById({ _id: sessionContructor.userId }, function (err, user) {
      done(err, user);
    });
  }
});

// ROUTES WITH FILES
app.post("/location", upload.single("picture"), createLocation);

// ROUTES
app.use("/api/user", userRouter);
app.use("/api/business", businessRouter);
app.use("/api/location", locationRouter);

// Server Listener
async function connectDbAndListen() {
  try {
    mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("DB Connected");
    app.listen(process.env.PORT, () => {
      console.log(`Listening on http://localhost:${process.env.PORT}`);
    });
  } catch (error) {
    console.log(error.message);
  }
}
await connectDbAndListen();
