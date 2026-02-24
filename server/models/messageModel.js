import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  shopName: String,
  address: String,
  phone: String,
  status: {
    type: String,
    default: "sent",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Message", messageSchema);