require("dotenv").config();
const mongoose = require("mongoose");
mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(console.log("db connection success"))
  .catch((err) => console.log(err));
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: false },
  googleId: { type: String, required: false },
});
module.exports = mongoose.model("User", UserSchema);
