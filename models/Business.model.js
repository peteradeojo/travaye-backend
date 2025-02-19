// A Model File is For structuring and Exporting A single Instance of the required Model that is Needed For Saving Data or to Know which data to put in the database
// Where A Model itself is just the instance of the Schema Structure to apply CRUD in the database .

// Necessary Imports
import mongoose from "mongoose";
import findOrCreate from "mongoose-findorcreate";
import passportLocalMongoose from "passport-local-mongoose";

// User Schema Structure
const businessSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      unique: true,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    businessEmail: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    verificationCode: {
      type: Number,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    businessVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
const options = {
  usernameField: "businessEmail",
};
businessSchema.plugin(passportLocalMongoose, options);
businessSchema.plugin(findOrCreate);

// Exporting Model
export const Business = mongoose.model("Business", businessSchema);
