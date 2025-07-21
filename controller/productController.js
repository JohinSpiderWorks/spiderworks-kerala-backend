const fs = require('fs');
const multer = require("multer");
const path = require("path");
const GalleryMedia = require('../models/GalleryMedia');
const AttributeValueProduct = require('../models/products/product_variants.model');
const Product_Category = require('../models/products/category.model');
const Brand = require('../models/products/brand');
const Product = require('../models/products/product.model');
const sequelize = require('../config/sequelize.config');
const { Sequelize, where } = require('sequelize');
const CategoryItem = require('../models/products/category_items.model');
const { v4: uuidv4 } = require('uuid');
const stockHistory = require('../models/products/stock-history');
const Order = require('../models/products/order');
const OrderItem = require('../models/products/order_items.model');
const Payment = require('../models/products/payment.model');


// media upload handling section

const uploadDir = "uploads/products";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage }).fields([
  { name: "featured", maxCount: 1 },
  { name: "banner", maxCount: 1 },
  { name: 'og_image', maxCount: 1 },
  { name: 'icon', maxCount: 1 },
  { name: 'variant_image', maxCount: 1 }
]);

// CATEGORY 
const getAllCategory = async (req, res) => {
  try {
    const category = await Product_Category.findAll({
      include: [{
        model: CategoryItem,
        as: 'category_items'
      }]
    });
    res.status(200).json({
      data: category
    })
  } catch (error) {
    console.log({ err: error?.message });

    res.status(500).json({ err: error?.message })
  }
}

// BRAND
const getAllBrand = async (req, res) => {
  try {
    const brands = await Brand.findAll({});
    res.status(200).json({ data: brands });

  } catch (error) {
    console.log({ err: error?.message });

    res.status(500).json({ err: error?.message })
  }
}

//NEW PRODUCT API


// Create New Product

const createProduct = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message });
      }

      const {
        title,
        slug,
        info,
        short_description,
        status,
        category_id_1,
        category_id_2,
        category_id_3,
        meta_title,
        meta_description,
        meta_keywords,
        og_title,
        og_description,
        bottom_description,
        is_featured,
        brand_id
      } = req.body;
      const created_by = req.user.id;

      console.log(req.body);


      // Validate required fields
      if (!title || !slug || !status || !category_id_1) {
        return res.status(400).json({
          success: false,
          error: "Name, slug, status, and primary_category_id are required.",
        });
      }

      let featuredMedia = null;
      let bannerMedia = null;
      let ogMedia = null;

      // Handle featured image upload
      if (req.files?.featured?.[0]) {
        const featuredFile = req.files.featured[0];
        featuredMedia = await GalleryMedia.create({
          media_name: "Product Featured Image",
          filename: featuredFile.filename,
          file_type: "Image",
          status: "active",
          created_by: req.user.id,
          src: `/${uploadDir}/${featuredFile.filename}`
        });
      }

      // Handle banner image upload
      if (req.files?.banner?.[0]) {
        const bannerFile = req.files.banner[0];
        bannerMedia = await GalleryMedia.create({
          media_name: "Product Banner Image",
          filename: bannerFile.filename,
          file_type: "Image",
          status: "active",
          created_by: req.user.id,
          src: `/${uploadDir}/${bannerFile.filename}`
        });
      }

      //Handle OG image upload
      if (req.files?.og_image?.[0]) {
        const ogFile = req.files.og_image[0];
        ogMedia = await GalleryMedia.create({
          media_name: "Product Og Image",
          filename: ogFile.filename,
          file_type: "Image",
          status: 'active',
          created_by: req.user.id,
          src: `/${uploadDir}/${ogFile.filename}`
        })
      }

      // Create the product
      const newProduct = await Product.create({
        title,
        slug,
        info,
        short_description,
        status: status ? "active" : "inactive",
        is_featured: is_featured ? true : false,
        created_by,
        brand_id,
        featured_image_id: featuredMedia?.id || null,
        banner_image_id: bannerMedia?.id || null,
        og_image_id: ogMedia?.id || null,
        category_id_1: category_id_1 || null,
        category_id_2: category_id_2 || null,
        category_id_3: category_id_3 || null,
        meta_title,
        meta_description,
        meta_keywords,
        og_title,
        og_description,
        bottom_description
      });

      res.status(201).json({
        success: true,
        data: {
          ...newProduct.toJSON(),
          featured_image_url: featuredMedia ? `/${featuredMedia.src}` : null,
          banner_image_url: bannerMedia ? `/${bannerMedia.src}` : null,
          og_image_url: ogMedia ? `/${ogMedia.src}` : null
        }
      });
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};


// get all products list

const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: products } = await Product.findAndCountAll({
      include: [
        {
          model: GalleryMedia,
          as: 'featured_image',
          attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
          where: Sequelize.where(
            Sequelize.cast(Sequelize.col('products.featured_image_id'), 'TEXT'),
            '=',
            Sequelize.col('featured_image.id')
          ),
          required: false
        },
        {
          model: GalleryMedia,
          as: 'banner_image',
          attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
          where: Sequelize.where(
            Sequelize.cast(Sequelize.col('products.banner_image_id'), 'TEXT'),
            '=',
            Sequelize.col('banner_image.id')
          ),
          required: false
        },
        {
          model: Brand,
          as: 'brand',
          attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
          required: false

        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    console.log({ products, count });


    res.status(200).json({
      success: true,
      data: products,
      meta: {
        total: count,
        page,
        limit,
        total_pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.log({ err: error?.message });
    res.status(500).json({ success: false, error: error?.message });
  }
}


const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log({ id });


    const product = await Product.findOne({
      where: { id },
      include: [
        {
          model: GalleryMedia,
          as: 'featured_image',
          attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
        },
        {
          model: GalleryMedia,
          as: 'banner_image',
          attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
        },
        {
          model: GalleryMedia,
          as: 'og_image',
          attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
        },
        {
          model: Brand,
          as: 'brand',
          attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
        },
        // {
        //   model: Product_Category,
        //   as: 'category_level_1',
        //   attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
        // },
        // {
        //   model: Product_Category,
        //   as: 'category_level_2',
        //   attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
        // },
        // {
        //   model: Product_Category,
        //   as: 'category_level_3',
        //   attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
        // },
        // {
        //   model: AttributeValueProduct,
        //   as: 'category_item_1',
        //   include: [{
        //     model: GalleryMedia,
        //     as: 'icon_media',
        //     attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
        //   }]
        // },
        // {
        //   model: AttributeValueProduct,
        //   as: 'category_item_2',
        //   include: [{
        //     model: GalleryMedia,
        //     as: 'icon_media',
        //     attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
        //   }]
        // },
        // {
        //   model: AttributeValueProduct,
        //   as: 'category_item_3',
        //   include: [{
        //     model: GalleryMedia,
        //     as: 'icon_media',
        //     attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
        //   }]
        // }
      ]
    });

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error?.message });
  }
}


const updateProduct = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) { 
        return res.status(400).json({ success: false, error: err.message });
      }
      
      
      const { id } = req.params;
      console.log({id});
      const { title, slug, info, short_description, status, category_id_1, category_id_2, category_id_3 } = req.body;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({ success: false, error: "Product not found" });
      }

      let featuredMedia = null;
      let bannerMedia = null;
      let ogMedia = null;

      // Handle featured image update
      if (req.files?.featured?.[0]) {
        const featuredFile = req.files.featured[0];
        featuredMedia = await GalleryMedia.create({
          media_name: "Product Featured Image",
          filename: featuredFile.filename,
          file_type: "Image",
          status: "active",
          created_by: req.user.id,
          src: `/${uploadDir}/${featuredFile.filename}`
        });
      }

      // Handle banner image update
      if (req.files?.banner?.[0]) {
        const bannerFile = req.files.banner[0];
        bannerMedia = await GalleryMedia.create({
          media_name: "Product Banner Image",
          filename: bannerFile.filename,
          file_type: "Image",
          status: "active",
          created_by: req.user.id,
          src: `/${uploadDir}/${bannerFile.filename}`
        });
      }

      // Handle OG image update
      if (req.files?.og_image?.[0]) {
        const ogFile = req.files.og_image[0];
        ogMedia = await GalleryMedia.create({
          media_name: "Product Og Image",
          filename: ogFile.filename,
          file_type: "Image",
          status: 'active',
          created_by: req.user.id,
          src: `/${uploadDir}/${ogFile.filename}`
        });
      }

      // Update the product
      const updatedProduct = await product.update({
        title,
        slug,
        info,
        short_description,
        status,
        category_id_1,
        category_id_2,
        category_id_3,
        featured_image: featuredMedia?.id || product.featured_image,
        banner_image: bannerMedia?.id || product.banner_image,
        og_image_id: ogMedia?.id || product.og_image_id
      },{
        where:{
          id:id
        }
      });

      res.status(200).json({
        success: true,
        data: {
          ...updatedProduct.toJSON(),
          featured_image_url: featuredMedia ? `/${featuredMedia.src}` : null,
          banner_image_url: bannerMedia ? `/${bannerMedia.src}` : null,
          og_image_url: ogMedia ? `/${ogMedia.src}` : null
        }
      });
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the product to be deleted
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    // Delete the product
    await product.destroy();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};


// product variant section


const createVariant = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message });
      }

      const { price, stock, product_id, category_item_1, category_item_2, category_item_3, status } = req.body;

      console.log({ req: req.body });

      let variantMedia = null;

      // Handle variant image upload
      if (req.files?.variant_image?.[0]) {
        const variantFile = req.files.variant_image[0];
        variantMedia = await GalleryMedia.create({
          media_name: "Product Variant Image",
          filename: variantFile.filename,
          file_type: "Image",
          status: 'active',
          created_by: req.user.id,
          src: `/${uploadDir}/${variantFile.filename}`
        });
      }

      const create = await AttributeValueProduct.create({
        id: uuidv4(),
        price,
        stock,
        product_id,
        category_item_id_1:category_item_1||null,
        category_item_id_2:category_item_2||null,
        category_item_id_3:category_item_3||null,
        status: status ? "active" : "inactive",
        images: variantMedia?.id || null
      });

      res.status(201).json({
        success: true,
        data: {
          ...create.toJSON(),
          variant_image_url: variantMedia ? `/${variantMedia.src}` : null
        }
      });
    });
  } catch (error) {
    console.log({ err: error?.message });
    res.status(500).json({ success: false, error: error?.message });
  }
}

const updateVariant = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message });
      }
      const { id } = req.params;
      const { price, stock, product_id, category_item_1, category_item_2, category_item_3, status, variant_image } = req.body;

      console.log({ id, variant_image });

      // Get existing variant data
      const existingVariant = await AttributeValueProduct.findByPk(id);
      if (!existingVariant) {
        return res.status(404).json({ success: false, error: 'Variant not found' });
      }

      const updateData = {};
      let stockDifference = 0;
      
      // Only update fields that have changed
      if (price && price !== existingVariant.price) {
        updateData.price = price;
      }
      if (stock !== undefined && stock !== existingVariant.stock) {
        stockDifference = stock - existingVariant.stock;
        updateData.stock = stock ? stock : 0;
      }
      if (product_id && product_id !== existingVariant.product_id) {
        updateData.product_id = product_id;
      }
      if (category_item_1 && parseInt(category_item_1) !== existingVariant.category_item_id_1) {
        updateData.category_item_id_1 = parseInt(category_item_1) || null;
      }
      if (category_item_2 && parseInt(category_item_2) !== existingVariant.category_item_id_2) {
        updateData.category_item_id_2 = parseInt(category_item_2) || null;
      }
      if (category_item_3 && parseInt(category_item_3) !== existingVariant.category_item_id_3) {
        updateData.category_item_id_3 = parseInt(category_item_3) || null;
      }
      if (status && (status === 'true' ? 'active' : 'inactive') !== existingVariant.status) {
        updateData.status = status === 'true' ? 'active' : 'inactive';
      }

      // Handle variant image
      let variantMedia = null;
      if (req.files?.variant_image?.[0]) {
        // New image uploaded
        const variantFile = req.files.variant_image[0];
        variantMedia = await GalleryMedia.create({
          media_name: 'Product Variant Image',
          filename: variantFile.filename,
          file_type: 'Image',
          status: 'active',
          created_by: req.user.id,
          src: `/${uploadDir}/${variantFile.filename}`,
        });
        updateData.images = variantMedia.id;
      } else if (variant_image === '' && existingVariant.images !== null) {
        // Explicit request to remove image
        updateData.images = null;
      }

      // Only update if there are changes
      if (Object.keys(updateData).length > 0) {
        const [updated] = await AttributeValueProduct.update(updateData, {
          where: { id },
        });

        if (!updated) {
          return res.status(404).json({ success: false, error: 'Variant not found' });
        }

        // Create stock history if stock changed
        if (stockDifference > 0) {

          await stockHistory.create({
            product_id: existingVariant.product_id,
            variant_id: id,
            stocks_added: stockDifference,
            stock_date: new Date()
          });
        }
      }

      const updatedVariant = await AttributeValueProduct.findByPk(id, {
        include: [
          {
            model: GalleryMedia,
            as: 'variant_image',
            attributes: ['id', 'src'],
          },
        ],
      });

      res.status(200).json({
        success: true,
        data: {
          ...updatedVariant.toJSON(),
          variant_image: updatedVariant.variant_image_media
            ? { src: updatedVariant.variant_image_media.src }
            : null,
        },
      });
    });
  } catch (error) {
    console.error({ error: error?.message });
    res.status(500).json({ success: false, error: error?.message });
  }
};



const getAllVariants = async (req, res) => {
  try {
    const { id } = req.params;
    const variants = await AttributeValueProduct.findAll({
      where: {
        product_id: id
      },
      include: [{
        model: GalleryMedia,
        as: 'variant_image',
        required: false
      }, {
        model: CategoryItem,
        as: 'category_item_one',
        required: false
      }, {
        model: CategoryItem,
        as: 'category_item_two',
        required: false
      }, {
        model: CategoryItem,
        as: 'category_item_three',
        required: false
      }]
    });

    console.log({ variants });


    res.status(200).json({ data: variants })
  } catch (error) {
    console.log({ err: error?.message });
    res.status(500).json({ success: false, error: error?.message });
  }
}

const getVariant = async (req, res) => {
  try {
    const { id } = req.params;

    const findVariant = await AttributeValueProduct.findByPk(id);

    if (!findVariant) {
      return res.status(404).json({ msg: 'Variant Not Found' });
    }

    res.status(200).json({ data: findVariant });

  } catch (error) {
    console.log({ err: error?.message });
    res.status(500).json({ success: false, error: error?.message });
  }
}

const deleteVariant = async (req, res) => {
  try {
    const { id } = req.params;

    const findVariant = await AttributeValueProduct.findByPk(id);

    if (!findVariant) {
      return res.status(404).json({ msg: 'Variant Not Found' });
    }

    await findVariant.destroy();

    res.status(204).json({ msg: 'Variant Deleted Successfully' });


  } catch (error) {
    console.log({ err: error?.message });
    res.status(500).json({ success: false, error: error?.message });
  }
}


const orderList = async (req, res) => {
  try {
    // Validate and parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const searchQuery = req.query.search?.trim() || '';

    // Build the query options
    const queryOptions = {
      include: [
        {
          model: OrderItem,
          as: 'order_items',
          include: [
            {
              model: AttributeValueProduct,
              as: 'product_order_variant',
              include: [
                { model: Product, as: 'product' },
                { model: GalleryMedia, as: 'variant_image' }
              ]
            }
          ]
        },
        { model: Payment, as: 'order_payment' }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    };

    // Add search conditions if search query exists
    if (searchQuery) {
      queryOptions.where = {
        [Op.or]: [
          { order_number: { [Op.iLike]: `%${searchQuery}%` } },
          { customer_email: { [Op.iLike]: `%${searchQuery}%` } }
        ]
      };
    }

    // Execute the query
    const { count, rows: orders } = await Order.findAndCountAll(queryOptions);

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: orders,
      meta: {
        total: count,
        page,
        limit,
        total_pages: totalPages,
        has_next_page: hasNextPage,
        has_previous_page: hasPreviousPage
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders',
      error: error.message
    });
  }
}


module.exports = {
  createProduct,
  getAllProducts,
  getProduct,
  getAllBrand,
  getAllCategory,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  getVariant,
  deleteVariant,
  getAllVariants,
  orderList
};
