const brandModel = require("../models/products/brand");
const GalleryMedia = require("../models/GalleryMedia");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Op } = require("sequelize");

const uploadDir = "uploads/brands";

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
  { name: "logo", maxCount: 1 },
  { name: "og_image", maxCount: 1 },
]);

// Create a new brand
const createBrand = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      const {
        name,
        short_description,
        slug,
        meta_title,
        meta_description,
        meta_keywords,
        og_title,
        og_description,
        bottom_description,
        isFeatured,
        isPublished,
      } = req.body;

      let logoMedia = null;
      let ogImageMedia = null;

      console.log(req.files);
      

      // Logo upload
      if (req.files?.logo?.[0]) {
        const logoFile = req.files.logo[0];
        const publicPath = path.join("uploads", "brands", logoFile.filename);
        logoMedia = await GalleryMedia.create({
          media_name: "Brand Logo",
          filename: logoFile.filename,
          file_type: "Image",
          status: "active",
          created_by: req.user.id,
          src: `/${uploadDir}/${logoFile.filename}`
        });
      }

      // OG image upload
      if (req.files?.og_image?.[0]) {
        const ogImageFile = req.files.og_image[0];
        const publicPath = path.join("uploads", "brands", ogImageFile.filename);
        ogImageMedia = await GalleryMedia.create({
          media_name: "Brand OG Image",
          filename: ogImageFile.filename,
          file_type: "Image",
          status: "active",
          created_by: req.user.id,
          src: `/${uploadDir}/${ogImageFile.filename}`
        });
      }

      const newBrand = await brandModel.create({
        name,
        slug,
        short_description,
        bottom_description,
        meta_title,
        meta_description,
        meta_keywords,
        og_title,
        og_description,
        logo: logoMedia?.id || null,
        og_image: ogImageMedia?.id || null,
        featured: isFeatured == true,
        status: isPublished == true,
      });

      res.status(201).json({
        message: "Brand created successfully",
        data: {
          ...newBrand.toJSON(),
          logo_url: logoMedia ? `/${logoMedia.public_path}` : null,
          og_image_url: ogImageMedia ? `/${ogImageMedia.public_path}` : null
        },
      });
    });
  } catch (error) {
    console.error("Error creating brand:", error);
    res.status(500).json({ error: error.message });
  }
};


// Get all brands
const getAllBrands = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: brands } = await brandModel.findAndCountAll({
      include: [
        {
          model: GalleryMedia,
          as: 'brand_logo',
        },
        {
          model: GalleryMedia,
          as: 'brand_og',
        }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit
    });

    const formattedBrands = brands.map(brand => ({
      ...brand.toJSON(),
      logo_url: brand.brand_logo ? `/${brand.brand_logo.public_path}` : null,
      og_image_url: brand.brand_og ? `/${brand.brand_og.public_path}` : null
    }));

    res.status(200).json({
      data: formattedBrands,
      meta: {
        total: count,
        page,
        limit,
        total_pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single brand by slug
const getBrandBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const brand = await brandModel.findOne({
      where: { slug },
      include: [
        {
          model: GalleryMedia,
          as: 'brand_logo',
        },
        {
          model: GalleryMedia,
          as: 'brand_og',
        }
      ],
    });

    console.log({brand:brand.dataValues});
    

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    res.status(200).json({ data: brand.dataValues });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a brand
// Update a brand
const updateBrand = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      const { id } = req.params;
      const {
        name,
        short_description,
        slug,
        meta_title,
        meta_description,
        meta_keywords,
        og_title,
        og_description,
        bottom_description,
        isFeatured,
        isPublished,
      } = req.body;
      console.log(req.body);
      console.log({files:req.files});
      
      const brand = await brandModel.findByPk(id);
      if (!brand) {
        return res.status(404).json({ message: "Brand not found" });
      }

      // Soft-replace logo
      if (req.files['logo']) {
        const logoFile = req.files['logo'][0];
        const logoMedia = await GalleryMedia.create({
          media_name: 'Brand Logo',
          filename: logoFile.filename,
          file_type: 'Image',
          status: 'active',
          created_by: req.user.id,
          src: `/uploads/brands/${logoFile.filename}`
        });

        // No deletion of old file — only replace reference
        brand.logo = logoMedia.id;
      }

      // Soft-replace OG Image
      if (req.files['og_image']) {
        const ogFile = req.files['og_image'][0];
        const ogMedia = await GalleryMedia.create({
          media_name: 'Brand OG Image',
          filename: ogFile.filename,
          file_type: 'Image',
          status: 'active',
          created_by: req.user.id,
          src: `/uploads/brands/${ogFile.filename}`
        });

        brand.og_image = ogMedia.id;
      }

      brand.name = name || brand.name;
      brand.short_description = short_description || brand.short_description;
      brand.slug = slug || brand.slug;
      brand.meta_title = meta_title || brand.meta_title;
      brand.meta_description = meta_description || brand.meta_description;
      brand.meta_keywords = meta_keywords || brand.meta_keywords;
      brand.og_title = og_title || brand.og_title;
      brand.og_description = og_description || brand.og_description;
      brand.bottom_description = bottom_description || brand.bottom_description;
      brand.featured = isFeatured ? true:false;
      brand.status = isPublished ? true:false;

      await brand.save();

      res.status(200).json({ message: "Brand updated successfully", data: brand });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Delete a brand
const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await brandModel.findByPk(id);

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    await brand.destroy();
    res.status(200).json({ message: "Brand deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search brands
const searchBrands = async (req, res) => {
  try {
    const { query } = req.query;

    const brands = await brandModel.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } },
          { meta_title: { [Op.like]: `%${query}%` } },
          { meta_description: { [Op.like]: `%${query}%` } },
          { meta_keywords: { [Op.like]: `%${query}%` } }
        ]
      }
    });

    res.status(200).json({ data: brands });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createBrand,
  getAllBrands,
  getBrandBySlug,
  updateBrand,
  deleteBrand,
  searchBrands
};
