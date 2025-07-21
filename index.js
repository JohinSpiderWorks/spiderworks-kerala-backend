require("dotenv").config();
const express = require("express");
const path = require("path");
const sequelizeConfig = require("./config/sequelize.config");
const app = express();
const cookieParser = require("cookie-parser");
const { rateLimit } = require("express-rate-limit");
const axios = require("axios");

//user routes
const productRoute = require("./routes/user-api/product.route");
const userRoute = require("./routes/user-api/account.route");

//routes

const blogRoute = require("./routes/blog.route");
const adminRoute = require("./routes/admin.route");
const forumRoute = require("./routes/forum.route");
const careerRoute = require("./routes/career.route");
const serviceRoute = require("./routes/service.route");
const menuRoute = require("./routes/menu.route");
const logsRoute = require("./routes/logs.routes");
const blogCategoryRoute = require("./routes/category.route");
const frontendRoute = require("./routes/frontend-routes/frontend.route");

const brandModel = require("./models/products/brand");
const blogModel = require("./models/blog.model");
const userModel = require("./models/user.model");
const cors = require("cors");
const bannerImageModel = require("./models/bannerImage.model");
const blogSectionModel = require("./models/blogSection.model");
const blogCommentModel = require("./models/blogComment.model");
const forumModel = require("./models/forum/forum.model");
const forumReplyModel = require("./models/forum/replies.model");
const forumImgModel = require("./models/forum/forumImage.model");
const blogLikeModel = require("./models/blogLike.model");
const blogReplyModel = require("./models/blogReply.model");
const blogSaveModel = require("./models/blogSave.model");
const blogTopicModel = require("./models/blogTopics.model");
const blogFavouriteModel = require("./models/blogFavourite");
const jobModel = require("./models/career/job.model");
const serviceModel = require("./models/service/service.model");
const serviceSectionModel = require("./models/service/section.model");
const applicantModel = require("./models/career/applicant.model");
const menuModel = require("./models/menu/menu.model");
const pageModel = require("./models/page/page.model");
const pageSectionModel = require("./models/page/section.model");
const pageSeoModel = require("./models/page/seo.model");
const notificationModel = require("./models/notification/notification.model");
const blogCategoryModel = require("./models/blogCategory.model");
const blogCategoryMapModel = require("./models/blogCategoryMap.model");

// stripe
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_PRIVATE_KEY);

//product module

// const productModel = require("./models/products/product.model");
// const attribute_valuesModel = require("./models/products/attribute_values.model");
// const attributeModel = require("./models/products/attribute.model");
// const attribute_value_productModel = require("./models/products/attribute_value_product.model");

const errorHandler = require("./middleware/error.middleware");
const redirection = require("./middleware/redirection.middleware");
const { Op, DataTypes } = require("sequelize");
const GalleryMedia = require("./models/GalleryMedia");
const { ProductCategory } = require("./models/product.model");
const Product_Category = require("./models/products/category.model");
const CategoryItem = require("./models/products/category_items.model");
const Product = require("./models/products/product.model");
const AttributeValueProduct = require("./models/products/product_variants.model");
const Brand = require("./models/products/brand");
const StockHistory = require("./models/products/stock-history");
const { stripeWebhook } = require("./controller/user-api/product.controller");
const Order = require("./models/products/order");
const Payment = require("./models/products/payment.model");
const {
  handleCheckoutSessionCompleted,
  handleAsyncPaymentFailed,
  handleChargeSucceeded,
  handleChargeUpdated,
} = require("./utils/stripe");
const authorModel = require("./models/author.model");

// const limiter = rateLimit({
//   windowMs: 60 * 1000,
//   limit: 200,
//   message: "Limit Exceeded, Try again later",
//   standardHeaders: "draft-6",
//   legacyHeaders: false,
//   handler: (req, res) => {
//     res.status(429).json({
//       error: "Too many requests",
//       message:
//         "You have exceeded the number of allowed requests. Please try again later.",
//       resetAfter: req.rateLimit.resetTime, // Optional: time when the rate limit will reset
//     });
//   },
// });

app.set("view engine", "ejs");
app.set("views", "./views");

//ejs setup

// app.use(limiter);
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.BACKEND_URL,
  "https://exploit3rs.spider.ws",
  "http://localhost:3000",
  "http://localhost:3001",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
// app.use(
//   cors({
//     origin: '*',
//     credentials: true,
//   })
// );

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    // Capture timing information for debugging
    const receivedAt = new Date().toISOString();

    // Extract signature information
    const rawSig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!rawSig) {
      console.error("Missing Stripe signature header");
      return res.status(400).send("Webhook Error: Missing Stripe signature");
    }

    if (!endpointSecret) {
      console.error("Missing webhook endpoint secret");
      return res.status(500).send("Server Configuration Error");
    }

    // Fix for duplicated signature header
    let sig = rawSig;
    if (rawSig && rawSig.includes("StripStripe-Signature")) {
      // Extract just the first complete signature
      const match = rawSig.match(/t=\d+,v1=[a-f0-9]+,v0=[a-f0-9]+/);
      if (match) {
        sig = match[0];
        console.log("Detected and fixed duplicated Stripe signature header");
      }
    }

    // Log raw request details for debugging
    console.log("Raw Body Length:", req.body.length);
    console.log("Original Stripe-Signature:", rawSig);
    console.log("Processed Signature:", sig);
    console.log("Server Time:", receivedAt);

    // Extract timestamp from signature for timing analysis
    const sigTimestamp = sig.split(",")[0].split("=")[1];
    if (sigTimestamp) {
      const stripeTime = new Date(parseInt(sigTimestamp) * 1000).toISOString();
      console.log("Stripe Timestamp:", stripeTime);

      // Calculate time difference to detect potential clock skew issues
      const timeDiffMs = Date.now() - parseInt(sigTimestamp) * 1000;
      console.log("Time difference (ms):", timeDiffMs);

      if (Math.abs(timeDiffMs) > 300000) {
        // More than 5 minutes difference
        console.warn(
          "Large time difference detected between server and Stripe. Check server clock."
        );
      }
    }

    // Process the webhook event
    let event;
    try {
      // Verify the event with Stripe
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      console.log("Webhook signature verified successfully");
      console.log("Event Type:", event.type);
      console.log("Event ID:", event.id);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);

      // Add additional debugging info
      if (err.message.includes("timestamp")) {
        console.error(
          "This may be due to clock skew between your server and Stripe"
        );
      } else if (err.message.includes("No signatures found")) {
        console.error(
          "Check if the raw body is being properly passed to the webhook handler"
        );
      }

      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Create a unique identifier for this webhook processing attempt
    const processId = `${event.id}-${Date.now()}`;
    console.log(`Processing webhook ${processId}`);

    // Use a try/catch block to handle processing errors
    try {
      // Handle different event types
      switch (event.type) {
        case "checkout.session.completed": {
          await handleCheckoutSessionCompleted(event.data.object);
          break;
        }

        case "checkout.session.async_payment_failed": {
          await handleAsyncPaymentFailed(event.data.object);
          break;
        }

        case "charge.succeeded": {
          await handleChargeSucceeded(event.data.object);
          break;
        }

        case "charge.updated": {
          const charge = event.data.object;
          console.log({ event });

          await handleChargeUpdated(event.data.object);
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      console.log(`Successfully processed webhook ${processId}`);
      return res.json({ received: true, id: processId });
    } catch (error) {
      console.error(`Error processing webhook ${processId}:`, error);

      // Determine if we should return an error or acknowledge receipt
      // Stripe will retry webhooks that receive an error response
      if (error.shouldRetry === true) {
        return res.status(500).send("Processing Error: Retry");
      } else {
        // If we don't want Stripe to retry, acknowledge receipt even though we had an error
        console.warn("Error occurred but telling Stripe not to retry");
        return res.json({ received: true, error: error.message });
      }
    }
  }
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// product module associations

// productModel.hasMany(attribute_value_productModel, {
//   foreignKey: "product_id",
//   as: "product_attributes",
//   onDelete: "SET NULL",
//   onUpdate: "CASCADE",
// });
// attribute_value_productModel.belongsTo(productModel, {
//   foreignKey: "product_id",
//   as: "product_attributes",
//   onDelete: "SET NULL",
//   onUpdate: "CASCADE",
// });
// attributeModel.hasMany(attribute_value_productModel, {
//   foreignKey: "attribute_id",
//   as: "attribute_values",
//   onDelete: "SET NULL",
//   onUpdate: "CASCADE",
// });
// attribute_value_productModel.belongsTo(attributeModel, {
//   foreignKey: "attribute_id",
//   as: "attribute_values",
//   onDelete: "SET NULL",
//   onUpdate: "CASCADE",
// });
// attribute_valuesModel.hasMany(attribute_value_productModel, {
//   foreignKey: "attribute_value_id_1",
//   as: "attribute_value_1",
//   onDelete: "SET NULL",
//   onUpdate: "CASCADE",
// });
// attribute_value_productModel.belongsTo(attribute_valuesModel, {
//   foreignKey: "attribute_value_id_1",
//   as: "attribute_value_1",
//   onDelete: "SET NULL",
//   onUpdate: "CASCADE",
// });
// attribute_valuesModel.hasMany(attribute_value_productModel, {
//   foreignKey: "attribute_value_id_2",
//   as: "attribute_value_2",
//   onDelete: "SET NULL",
//   onUpdate: "CASCADE",
// });
// attribute_value_productModel.belongsTo(attribute_valuesModel, {
//   foreignKey: "attribute_value_id_2",
//   as: "attribute_value_2",
//   onDelete: "SET NULL",
//   onUpdate: "CASCADE",
// });
// attribute_valuesModel.hasMany(attribute_value_productModel, {
//   foreignKey: "attribute_value_id_3",
//   as: "attribute_value_3",
//   onDelete: "SET NULL",
//   onUpdate: "CASCADE",
// });
// attribute_value_productModel.belongsTo(attribute_valuesModel, {
//   foreignKey: "attribute_value_id_3",
//   as: "attribute_value_3",
//   onDelete: "SET NULL",
//   onUpdate: "CASCADE",
// });
// attribute_valuesModel.belongsTo(attributeModel, {
//   foreignKey: "attribute_id",
//   as: "attribute",
//   onDelete: "SET NULL",
//   onUpdate: "CASCADE",
// });

// brand

// Brand associations
GalleryMedia.hasOne(brandModel, {
  foreignKey: "og_image",
  as: "brand_og",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
brandModel.belongsTo(GalleryMedia, {
  foreignKey: "og_image",
  as: "brand_og",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

GalleryMedia.hasOne(brandModel, {
  foreignKey: "logo",
  as: "brand_logo",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
brandModel.belongsTo(GalleryMedia, {
  foreignKey: "logo",
  as: "brand_logo",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// Category association
GalleryMedia.hasOne(Product_Category, {
  foreignKey: "og_image",
  as: "category_og",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
Product_Category.belongsTo(GalleryMedia, {
  foreignKey: "og_image",
  as: "category_og",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

//  category items association
GalleryMedia.hasOne(CategoryItem, {
  foreignKey: "icon",
  as: "items_icon",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
CategoryItem.belongsTo(GalleryMedia, {
  foreignKey: "icon",
  as: "items_icon",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// PRODUCT ASSOCIATIONS

//Media Section
GalleryMedia.hasOne(Product, {
  foreignKey: "featured_image_id",
  as: "featured_image",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
Product.belongsTo(GalleryMedia, {
  foreignKey: "featured_image_id",
  as: "featured_image",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

GalleryMedia.hasOne(Product, {
  foreignKey: "banner_image_id",
  as: "banner_image",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
Product.belongsTo(GalleryMedia, {
  foreignKey: "banner_image_id",
  as: "banner_image",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

GalleryMedia.hasOne(Product, {
  foreignKey: "og_image_id",
  as: "og_image",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
Product.belongsTo(GalleryMedia, {
  foreignKey: "og_image_id",
  as: "og_image",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// One brand has many products
Brand.hasMany(Product, { foreignKey: "brand_id", as: "products" });
Product.belongsTo(Brand, { foreignKey: "brand_id", as: "brand" });

// ─── Product → ProductCategory (3 Levels) ─────────
// Product belongs to 3 category levels
Product.belongsTo(Product_Category, {
  foreignKey: "category_id_1",
  as: "category_level_1",
});
Product.belongsTo(Product_Category, {
  foreignKey: "category_id_2",
  as: "category_level_2",
});
Product.belongsTo(Product_Category, {
  foreignKey: "category_id_3",
  as: "category_level_3",
});

Product_Category.hasMany(Product, {
  foreignKey: "category_id_1",
  as: "products_level_1",
});
Product_Category.hasMany(Product, {
  foreignKey: "category_id_2",
  as: "products_level_2",
});
Product_Category.hasMany(Product, {
  foreignKey: "category_id_3",
  as: "products_level_3",
});

// One product category has many category items
Product_Category.hasMany(CategoryItem, {
  foreignKey: "category_id",
  as: "category_items",
});
CategoryItem.belongsTo(Product_Category, {
  foreignKey: "category_id",
  as: "category",
});

// ─── Product → ProductVariant ─────────────────────
// A product has many product_variants
Product.hasMany(AttributeValueProduct, {
  foreignKey: "product_id",
  as: "variants",
});
AttributeValueProduct.belongsTo(Product, {
  foreignKey: "product_id",
  as: "product",
});

// ─── ProductVariant → CategoryItems (3 Levels) ────
// A product variant belongs to up to 3 category items
AttributeValueProduct.belongsTo(CategoryItem, {
  foreignKey: "category_item_id_1",
  as: "category_item_1",
});
AttributeValueProduct.belongsTo(CategoryItem, {
  foreignKey: "category_item_id_2",
  as: "category_item_2",
});
AttributeValueProduct.belongsTo(CategoryItem, {
  foreignKey: "category_item_id_3",
  as: "category_item_3",
});

CategoryItem.hasMany(AttributeValueProduct, {
  foreignKey: "category_item_id_1",
  as: "product_variants_1",
});
CategoryItem.hasMany(AttributeValueProduct, {
  foreignKey: "category_item_id_2",
  as: "product_variants_2",
});
CategoryItem.hasMany(AttributeValueProduct, {
  foreignKey: "category_item_id_3",
  as: "product_variants_3",
});

GalleryMedia.hasOne(AttributeValueProduct, {
  foreignKey: "icon",
  as: "icon_media",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
AttributeValueProduct.belongsTo(GalleryMedia, {
  foreignKey: "icon",
  as: "icon_media",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// product variant relation

GalleryMedia.hasMany(AttributeValueProduct, {
  foreignKey: "images",
  as: "variant_image",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
AttributeValueProduct.belongsTo(GalleryMedia, {
  foreignKey: "images",
  as: "variant_image",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// One-to-one relationship between AttributeValueProduct and CategoryItem
AttributeValueProduct.belongsTo(CategoryItem, {
  foreignKey: "category_item_id_1",
  as: "category_item_one",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

CategoryItem.hasOne(AttributeValueProduct, {
  foreignKey: "category_item_id_1",
  as: "product_variant_one",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

AttributeValueProduct.belongsTo(CategoryItem, {
  foreignKey: "category_item_id_2",
  as: "category_item_two",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

CategoryItem.hasOne(AttributeValueProduct, {
  foreignKey: "category_item_id_2",
  as: "product_variant_two",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

AttributeValueProduct.belongsTo(CategoryItem, {
  foreignKey: "category_item_id_3",
  as: "category_item_three",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

CategoryItem.hasOne(AttributeValueProduct, {
  foreignKey: "category_item_id_3",
  as: "product_variant_three",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// stock history associations

StockHistory.belongsTo(Product, {
  foreignKey: "product_id",
  as: "stock_product",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// Add unique constraint to variant_id before creating association
AttributeValueProduct.belongsTo(StockHistory, {
  foreignKey: "variant_id",
  constraints: false, // Disable foreign key constraint temporarily
});

StockHistory.belongsTo(AttributeValueProduct, {
  foreignKey: "variant_id",
  as: "stock_variant",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
  constraints: true, // Re-enable constraints after ensuring unique constraint exists
});

//associations
userModel.hasMany(blogModel, {
  foreignKey: "created_by", // ✅ Matches your model definition
  as: "creator",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

blogModel.belongsTo(userModel, {
  foreignKey: "created_by", // ✅ Matches your model definition
  as: "creator",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
// Update these associations to match the aliases used in your include
bannerImageModel.hasOne(blogModel, {
  foreignKey: "banner_id",
  as: "bannerImage", // Must match the include alias
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

blogModel.belongsTo(bannerImageModel, {
  foreignKey: "banner_id",
  as: "bannerImage", // Must match the include alias
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

bannerImageModel.hasOne(blogModel, {
  foreignKey: "featured_id",
  as: "featuredImage", // Must match the include alias
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

blogModel.belongsTo(bannerImageModel, {
  foreignKey: "featured_id",
  as: "featuredImage", // Must match the include alias
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

bannerImageModel.hasOne(blogModel, {
  foreignKey: "og_id",
  as: "ogImage", // Must match the include alias
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

blogModel.belongsTo(bannerImageModel, {
  foreignKey: "og_id",
  as: "ogImage", // Must match the include alias
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

blogModel.hasMany(blogSectionModel, {
  foreignKey: "blog_id",
  as: "sections",
  onDelete: "CASCADE", // No change needed as CASCADE is appropriate for sections of a blog
  onUpdate: "CASCADE",
});
blogSectionModel.belongsTo(blogModel, {
  foreignKey: "blog_id",
  as: "sections",
  onDelete: "CASCADE", // No change needed as CASCADE is appropriate for sections of a blog
  onUpdate: "CASCADE",
});

blogModel.hasMany(blogFavouriteModel, {
  foreignKey: "blog_id",
  as: "favourite",
  onDelete: "CASCADE", // No change needed as CASCADE is appropriate for favourites of a blog
  onUpdate: "CASCADE",
});
blogFavouriteModel.belongsTo(blogModel, {
  foreignKey: "blog_id",
  as: "favourite",
  onDelete: "CASCADE", // No change needed as CASCADE is appropriate for favourites of a blog
  onUpdate: "CASCADE",
});

blogModel.hasMany(blogCommentModel, { foreignKey: "blog_id", as: "comments" });
blogCommentModel.belongsTo(blogModel, {
  foreignKey: "blog_id",
  //as: "comments",
  as: "blog",
  onDelete: "CASCADE", // No change needed as CASCADE is appropriate for comments of a blog
  onUpdate: "CASCADE",
});

userModel.hasMany(blogCommentModel, {
  foreignKey: "user_id",
  as: "commented_by",
  onDelete: "SET NULL", // Changed from CASCADE to SET NULL to allow comments to remain even if the user is deleted
  onUpdate: "CASCADE",
});
blogCommentModel.belongsTo(userModel, {
  foreignKey: "user_id",
  as: "commented_by",
  onDelete: "SET NULL", // Changed from CASCADE to SET NULL to allow comments to remain even if the user is deleted
  onUpdate: "CASCADE",
});

blogCommentModel.hasMany(blogLikeModel, {
  foreignKey: "comment_id",
  as: "likes",
  onDelete: "CASCADE", // No change needed as CASCADE is appropriate for likes of a comment
  onUpdate: "CASCADE",
});
blogLikeModel.belongsTo(blogCommentModel, {
  foreignKey: "comment_id",
  as: "likes",
  onDelete: "CASCADE", // No change needed as CASCADE is appropriate for likes of a comment
  onUpdate: "CASCADE",
});

userModel.hasMany(blogLikeModel, {
  foreignKey: "user_id",
  as: "liked_by",
  onDelete: "SET NULL", // Changed from CASCADE to SET NULL to allow likes to remain even if the user is deleted
  onUpdate: "CASCADE",
});
blogLikeModel.belongsTo(userModel, {
  foreignKey: "user_id",
  as: "liked_by",
  onDelete: "SET NULL", // Changed from CASCADE to SET NULL to allow likes to remain even if the user is deleted
  onUpdate: "CASCADE",
});

blogCommentModel.hasMany(blogReplyModel, {
  foreignKey: "comment_id",
  as: "comment_replies",
  onDelete: "CASCADE", // No change needed as CASCADE is appropriate for replies of a comment
  onUpdate: "CASCADE",
});
blogReplyModel.belongsTo(blogCommentModel, {
  foreignKey: "comment_id",
  as: "comment_replies",
  onDelete: "CASCADE", // No change needed as CASCADE is appropriate for replies of a comment
  onUpdate: "CASCADE",
});

userModel.hasMany(blogReplyModel, { foreignKey: "user_id", as: "replied_by" });
blogReplyModel.belongsTo(userModel, {
  foreignKey: "user_id",
  as: "replied_by",
  onDelete: "SET NULL", // Changed from no onDelete to SET NULL to allow replies to remain even if the user is deleted
  onUpdate: "CASCADE",
});

blogModel.hasMany(blogSaveModel, {
  foreignKey: "blog_id",
  onDelete: "SET NULL", // No change needed as SET NULL is appropriate for saves of a blog
  as: "saves",
});
blogSaveModel.belongsTo(blogModel, { foreignKey: "blog_id", as: "saves" });

blogModel.hasMany(blogTopicModel, { foreignKey: "blog_id", as: "tags" });
blogTopicModel.belongsTo(blogModel, { foreignKey: "blog_id", as: "tags" });

blogModel.belongsToMany(blogCategoryModel, {
  foreignKey: "blog_id",
  through: blogCategoryMapModel,
  onUpdate: "CASCADE",
  onDelete: "CASCADE",
});
blogCategoryModel.belongsToMany(blogModel, {
  foreignKey: "category_id",
  through: blogCategoryMapModel,
  onUpdate: "CASCADE",
  onDelete: "CASCADE",
});
// Blog to Author association
authorModel.hasMany(blogModel, {
  foreignKey: "author_id",
  as: "blogs",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

blogModel.belongsTo(authorModel, {
  foreignKey: "author_id",
  as: "blogAuthor",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
userModel.hasMany(jobModel, {
  foreignKey: "deleted_by",
  as: "deleted_user",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
jobModel.belongsTo(userModel, {
  foreignKey: "deleted_by",
  as: "deleted_user",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

//forum
userModel.hasMany(forumModel, {
  foreignKey: "author",
  as: "forum_user",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
forumModel.belongsTo(userModel, {
  foreignKey: "author",
  as: "forum_user",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

forumModel.hasMany(forumReplyModel, {
  foreignKey: "forum_id",
  as: "replies",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
forumReplyModel.belongsTo(forumModel, {
  foreignKey: "forum_id",
  as: "replies",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

userModel.hasMany(forumReplyModel, {
  foreignKey: "user_id",
  as: "repliers",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
forumReplyModel.belongsTo(userModel, {
  foreignKey: "user_id",
  as: "repliers",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

userModel.hasMany(serviceModel, {
  foreignKey: "author",
  as: "service_created_by",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
serviceModel.belongsTo(userModel, {
  foreignKey: "author",
  as: "service_created_by",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

serviceModel.hasMany(serviceSectionModel, {
  foreignKey: "service_id",
  as: "service_sections",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
serviceSectionModel.belongsTo(serviceModel, {
  foreignKey: "service_id",
  as: "service_sections",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

//career association
jobModel.hasMany(applicantModel, {
  foreignKey: "job_id",
  as: "applications",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
applicantModel.belongsTo(jobModel, {
  foreignKey: "job_id",
  as: "applications",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

menuModel.hasMany(menuModel, {
  foreignKey: "parent_id",
  as: "submenu",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
menuModel.belongsTo(menuModel, {
  foreignKey: "parent_id",
  as: "parentMenu",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

//pages

pageModel.hasMany(pageSectionModel, {
  foreignKey: "page_id",
  as: "page_sections",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
pageSectionModel.belongsTo(pageModel, {
  foreignKey: "page_id",
  as: "page_sections",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

pageModel.hasOne(pageSeoModel, {
  foreignKey: "page_id",
  as: "page_seo",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
pageSeoModel.belongsTo(pageModel, {
  foreignKey: "page_id",
  as: "page_seo",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// notifications

userModel.hasMany(notificationModel, {
  foreignKey: "created_by",
  as: "notified_by",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
notificationModel.belongsTo(userModel, {
  foreignKey: "created_by",
  as: "notified_by",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// Jira credentials
const jiraDomain = "https://spiderworks-team-cy9ua3bp.atlassian.net";
const projectKey = "DP";
const email = "akhil@spiderworks.in";
const apiToken =
  "ATATT3xFfGF0NSN0uv_FhmIjDC5ZYRIPtv52I5gXMNbuDsEqBHBSakzlcf3IWEd0p5vyJ57hfN4MwuQQhTBb6r3Ea8PKcIO1K5-xlmFO9BoYEfXEHagxjTqbf_38buByaM5k7PiFNfSc2_tkPoc2ndYr2J8b-kVShY7VPc4x9LtnRwNq1G7EiJg=B64D0FDC";
1;

const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");

app.post("/create-task", async (req, res) => {
  const { summary, description } = req.body;

  const data = {
    fields: {
      project: { key: projectKey },
      summary: summary || "Test Task from Node.js",
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: description || "Created via Node.js + Express",
              },
            ],
          },
        ],
      },
      issuetype: { name: "Task" },
    },
  };

  try {
    const response = await axios.post(`${jiraDomain}/rest/api/3/issue`, data, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    res.status(201).json({
      message: "JIRA Task Created Successfully",
      issueKey: response.data.key,
      issueUrl: `${jiraDomain}/browse/${response.data.key}`,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({
      message: "Failed to create JIRA task",
      error: error.response?.data || error.message,
    });
  }
});

app.get("/", async (req, res) => {
  try {
    const page = req?.query?.page || 1;
    const limit = req?.query?.limit || 15;
    const offset = (page - 1) * limit;

    // Fetching all blogs without filtering by type
    const { count, rows } = await blogModel.findAndCountAll({
      order: [["createdAt", "ASC"]], // Order blogs by latest first
      limit: limit,
      offset: offset,
      include: [
        {
          model: userModel,
          foreignKey: "created_by", // Changed from "author"
          as: "creator",
          attributes: {
            exclude: ["password"],
          },
        },
        {
          model: bannerImageModel,
          foreignKey: "banner_id",
          as: "banner",
        },
        {
          model: bannerImageModel,
          foreignKey: "featured_id",
          as: "featured",
        },
        {
          model: bannerImageModel,
          foreignKey: "og_id",
          as: "og",
        },
        {
          model: blogSectionModel,
          foreignKey: "blog_id",
          as: "sections",
        },
        {
          model: blogFavouriteModel,
          foreignKey: "blog_id",
          as: "favourite",
        },
        {
          model: blogCommentModel,
          foreignKey: "blog_id",
          as: "comments",
          include: [
            {
              model: userModel,
              foreignKey: "user_id",
              as: "commented_by",
              attributes: {
                exclude: ["password"],
              },
            },
            {
              model: blogLikeModel,
              foreignKey: "comment_id",
              as: "likes",
              include: [
                {
                  model: userModel,
                  foreignKey: "user_id",
                  as: "liked_by",
                  attributes: {
                    exclude: ["password"],
                  },
                },
              ],
            },
            {
              model: blogReplyModel,
              foreignKey: "comment_id",
              as: "comment_replies",
              include: [
                {
                  model: userModel,
                  foreignKey: "user_id",
                  as: "replied_by",
                  attributes: {
                    exclude: ["password"],
                  },
                },
              ],
            },
          ],
          separate: true,
          order: [["createdAt", "DESC"]],
        },
        {
          model: blogTopicModel,
          foreignKey: "blog_id",
          as: "tags",
        },
        {
          model: blogCategoryModel,
          as: "blog_categories",
          through: {
            model: blogCategoryMapModel,
            unique: false,
          },
        },
      ],
      where: {
        premium: false,
      },
    });

    res.json({
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalResults: count,
      nextPage: page < Math.ceil(count / limit) ? page + 1 : null,
      nextPageUrl:
        page < Math.ceil(count / limit)
          ? `${process.env.BACKEND_URL}/blogs?page=${
              parseInt(page) + 1
            }&limit=${limit}`
          : null,
      previousPageUrl:
        page > 1
          ? `${process.env.BACKEND_URL}/blogs?page=${page - 1}&limit=${limit}`
          : null,
      firstPageUrl: `${process.env.BACKEND_URL}/blogs?page=1&limit=${limit}`,
      lastPageUrl: `${process.env.BACKEND_URL}/blogs?page=${Math.ceil(
        count / limit
      )}&limit=${limit}`,
      offset: offset,
      limit: limit,
      data: rows,
    });
  } catch (error) {
    res.json({ err: error.message });
  }
});

// app.use("/user", userRoute);
app.use("/blogs", blogRoute);
app.use("/category", blogCategoryRoute);
app.get("/contact", async (req, res) => {
  const contactDetails = await pageModel.findOne({
    where: {
      page_name: {
        [Op.iLike]: "%contact%",
      },
    },
  });

  res.json({ data: contactDetails?.dataValues });
});

app.get("/test", async (req, res) => {
  const { count, rows } = await blogModel.findAndCountAll({
    order: [["createdAt", "DESC"]], // Order blogs by latest first
    include: [
      {
        model: userModel,
        foreignKey: "created_by", // Changed from "author"
        as: "creator",
        attributes: {
          exclude: ["password"],
        },
      },
      {
        model: bannerImageModel,
        foreignKey: "banner_id",
        as: "banner",
      },
      {
        model: bannerImageModel,
        foreignKey: "featured_id",
        as: "featured",
      },
      {
        model: bannerImageModel,
        foreignKey: "og_id",
        as: "og",
      },
      {
        model: blogSectionModel,
        foreignKey: "blog_id",
        as: "sections",
      },
      {
        model: blogFavouriteModel,
        foreignKey: "blog_id",
        as: "favourite",
      },
      {
        model: blogCommentModel,
        foreignKey: "blog_id",
        as: "comments",
        include: [
          {
            model: userModel,
            foreignKey: "user_id",
            as: "commented_by",
            attributes: {
              exclude: ["password"],
            },
          },
          {
            model: blogLikeModel,
            foreignKey: "comment_id",
            as: "likes",
            include: [
              {
                model: userModel,
                foreignKey: "user_id",
                as: "liked_by",
                attributes: {
                  exclude: ["password"],
                },
              },
            ],
          },
          {
            model: blogReplyModel,
            foreignKey: "comment_id",
            as: "comment_replies",
            include: [
              {
                model: userModel,
                foreignKey: "user_id",
                as: "replied_by",
                attributes: {
                  exclude: ["password"],
                },
              },
            ],
          },
        ],
        separate: true,
        order: [["createdAt", "DESC"]],
      },
      {
        model: blogTopicModel,
        foreignKey: "blog_id",
        as: "tags",
      },
      {
        model: blogCategoryModel,
        as: "blog_categories",
        through: {
          model: blogCategoryMapModel,
          unique: false,
        },
      },
    ],
    where: {
      premium: false,
    },
  });

  res.json({
    totalResults: count,
    data: rows,
  });
});

app.get("/allblogs", async (req, res) => {
  try {
    const blogs = await blogModel.findAll({
      include: [
        {
          model: userModel,
          foreignKey: "created_by", // Changed from "author"
          as: "creator", // Changed from "created_by"

          attributes: {
            exclude: ["password"],
          },
        },
        {
          model: bannerImageModel,
          foreignKey: "banner_id",
          as: "banner",
        },
        {
          model: bannerImageModel,
          foreignKey: "featured_id",
          as: "featured",
        },
        {
          model: bannerImageModel,
          foreignKey: "og_id",
          as: "og",
        },
        {
          model: blogSectionModel,
          foreignKey: "blog_id",
          as: "sections",
        },
        {
          model: blogFavouriteModel,
          foreignKey: "blog_id",
          as: "favourite",
        },
        {
          model: blogCommentModel,
          foreignKey: "blog_id",
          as: "comments",
          include: [
            {
              model: userModel,
              foreignKey: "user_id",
              as: "commented_by",
              attributes: {
                exclude: ["password"],
              },
            },
            {
              model: blogLikeModel,
              foreignKey: "comment_id",
              as: "likes",
              include: [
                {
                  model: userModel,
                  foreignKey: "user_id",
                  as: "liked_by",
                  attributes: {
                    exclude: ["password"],
                  },
                },
              ],
            },
            {
              model: blogReplyModel,
              foreignKey: "comment_id",
              as: "comment_replies",
              include: [
                {
                  model: userModel,
                  foreignKey: "user_id",
                  as: "replied_by",
                  attributes: {
                    exclude: ["password"],
                  },
                },
              ],
            },
          ],
          separate: true,
          order: [["createdAt", "DESC"]],
        },
        {
          model: blogTopicModel,
          foreignKey: "blog_id",
          as: "tags",
        },
        {
          model: blogCategoryModel,
          as: "blog_categories",
          through: {
            model: blogCategoryMapModel,
            unique: false,
          },
        },
      ],
    });

    res.status(200).json({ data: blogs });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
});

app.get("/msg", (req, res) => {
  res.json({ msg: "Server Run Successfully" });
});

app.get("/:id", async (req, res) => {
  console.log(req?.user);
  try {
    const { id } = req.params;
    const blogDetail = await blogModel.findByPk(id, {
      include: [
        {
          model: userModel,
          foreignKey: "created_by", // Changed from "author"
          as: "creator", // Changed from "created_by"

          attributes: {
            exclude: ["password"],
          },
        },
        {
          model: bannerImageModel,
          foreignKey: "banner_id",
          as: "banner",
        },
        {
          model: bannerImageModel,
          foreignKey: "featured_id",
          as: "featured",
        },
        {
          model: bannerImageModel,
          foreignKey: "og_id",
          as: "og",
        },
        {
          model: blogSectionModel,
          foreignKey: "blog_id",
          as: "sections",
        },
        {
          model: blogFavouriteModel,
          foreignKey: "blog_id",
          as: "favourite",
        },
        {
          model: blogCommentModel,
          foreignKey: "blog_id",
          as: "comments",
          include: [
            {
              model: userModel,
              foreignKey: "user_id",
              as: "commented_by",
              attributes: {
                exclude: ["password"],
              },
            },
            {
              model: blogLikeModel,
              foreignKey: "comment_id",
              as: "likes",
              include: [
                {
                  model: userModel,
                  foreignKey: "user_id",
                  as: "liked_by",
                  attributes: {
                    exclude: ["password"],
                  },
                },
              ],
            },
            {
              model: blogReplyModel,
              foreignKey: "comment_id",
              as: "comment_replies",
              include: [
                {
                  model: userModel,
                  foreignKey: "user_id",
                  as: "replied_by",
                  attributes: {
                    exclude: ["password"],
                  },
                },
              ],
            },
          ],
          separate: true,
          order: [["createdAt", "DESC"]],
        },
        {
          model: blogTopicModel,
          foreignKey: "blog_id",
          as: "tags",
        },
        {
          model: blogCategoryModel,
          as: "blog_categories",
          through: {
            model: blogCategoryMapModel,
            unique: true,
          },
        },
      ],
      where: {
        premium: false,
      },
    });
    const attachments = await bannerImageModel.findAll({
      where: {
        blog_id: id,
      },
    });

    res.json({
      data: blogDetail,
      attachments: attachments,
    });
  } catch (error) {
    res.json({ err: error });
  }
});

// app.use(redirection);
app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  next();
});

app.use("/api/account", userRoute);
app.use("/api/products", productRoute);
app.use("/admin", adminRoute);
app.use("/api/forum", forumRoute);
app.use("/api/career", careerRoute);
app.use("/api/services", serviceRoute);
app.use("/api/menu", menuRoute);
app.use("/api/logs", logsRoute);
app.use("/api/frontend", frontendRoute);

sequelizeConfig
  .authenticate()
  .then(async () => {
    try {
      const models = sequelizeConfig.models;
      const syncResults = await Promise.allSettled(
        Object.values(models).map((model) => model.sync())
      );

      const failedTables = syncResults
        .filter((result) => result.status === "rejected")
        .map((result, index) => ({
          table: Object.keys(models)[index],
          error: result.reason.message,
        }));

      if (failedTables.length > 0) {
        console.error("Failed to sync the following tables:");
        failedTables.forEach(({ table, error }) => {
          console.error(`Table: ${table}, Error: ${error}`);
        });
        throw new Error("Some tables failed to sync");
      }

      app.listen(process.env.PORT, () => {
        console.log(`Server is running on PORT: ${process.env.PORT}`);
      });
      console.log("All Tables Created Successfully");
    } catch (err) {
      console.error("Error syncing database:", err);
      process.exit(1); // Exit with error code
    }
  })
  .catch((err) => {
    console.error("Unable to authenticate with database:", err);
    process.exit(1); // Exit with error code
  });

//   sequelizeConfig.authenticate();
// sequelizeConfig
//   .sync()
//   .then(() => {
//     app.listen(process.env.PORT, () => {
//       console.log(`Server is running on PORT: ${process.env.PORT}`);
//     });
//     console.log("All Tables Created Successfully");
//   })
//   .catch((err) => {
//     console.error("Error syncing database XXXXXXXX:", err);
//   });
