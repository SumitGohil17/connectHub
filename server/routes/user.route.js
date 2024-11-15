const express = require("express");
const { body, validationResult } = require("express-validator");
const JWT = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");
const UserSchema = require("../schema/user.schema");
const router = express.Router();
require("dotenv").config();

const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; 
  if (!token) return res.sendStatus(401);

  JWT.verify(token, "private_key", (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user; 
    next();
  });
};

router.post(
  "/signup",
  [
    body("name").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 8 }),
  ],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({ error: error.array() }); // if error is occurred then throw a BAD REQUEST status (400)
    }
    try {
      let findUser = await UserSchema.findOne({ email: req.body.email }); // checking that user is exist or not
      // if user already exist then throws a NOT ACCEPTABLE status (406)
      if (findUser)
        return res.status(406).json({ error: "User is already exist" });

      const genSalt = await bcryptjs.genSalt(10); // generating a salt value trying
      const passwordHashing = await bcryptjs.hash(req.body.password, genSalt); // hashing the password

      findUser = await UserSchema.create({
        name: req.body.name,
        email: req.body.email,
        password: passwordHashing,
      });
      
      const userId = { findUser: { id: findUser.id } };
      const jwt = JWT.sign(userId, "private_key"); // generating a jsonWebToken
      

      res.status(200).json({ jwtToken: jwt , user: req.body.name});
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e }); // if any error is occurred then throw a INTERNAL SERVER ERROR status (500)
    }
  }
);

// // user login api

router.post(
  "/login",
  [body("email").isEmail(), body("password").isLength({ min: 8 })],
  async (req, res) => {
    const error = validationResult(req);

    if (!error) return res.status(400).json({ error: error }); // when user puts a wrong validation, then it will throw a BAD REQUEST status (400)

    const { email, password } = req.body;

    try {
      const findUser = await UserSchema.findOne({ email });
      if (!findUser)
        return res
          .status(404)
          .json({ error: email + " not found such user 😢" }); // if user is not found, them it will throw a NOT FOUND status (404)

      const compPassword = await bcryptjs.compare(password, findUser.password);

      if (!compPassword)
        return res.status(404).json({ error: " incorrect password" }); // if user is not found, them it will throw a NOT FOUND status (404)

      const userId = { findUser: { id: findUser.id } };
      const jwt = JWT.sign(userId, "private_key"); // generating a jsonWebToken

      res.json({ jwtToken: jwt });
    } catch (e) {
      res.status(500).json({ error: e });
    }
  }
);

router.get("/getUserInfo", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.findUser.id; 
    const userDetails = await UserSchema.findById(userId); 

    if (!userDetails) {
      return res.status(404).json({ error: "User not found" }); 
    }

    res.status(200).json({  userDetails }); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
});

module.exports = router;
