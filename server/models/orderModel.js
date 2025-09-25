import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
      image: {
        type: String,
      },
    },
  ],
  amount: {
    type: Number,
    required: true,
  },
  address: {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    street: {
      type: String,
      required: true,
    },
    ward: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    zipcode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
      default: "Vietnam",
    },
    phone: {
      type: String,
      required: true,
    },
    provinceId: {
      type: Number,
    },
    districtId: {
      type: Number,
    },
    wardCode: {
      type: String,
    },
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
    default: "pending",
  },
  emailSent: { type: Boolean, default: false },
  paymentMethod: {
    type: String,
    enum: ["cod", "stripe", "paypal", "vnpay"],
    default: "cod",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  },
  // Payment tracking
  hasPaymentDetails: {
    type: Boolean,
    default: false,
  },
  shippingFee: {
    type: Number,
    default: 0,
  },
  ghnOrderCode: {
    type: String,
  },
  ghnStatus: {
    type: String,
  },
  ghnExpectedDeliveryTime: {
    type: Date,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

orderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;
