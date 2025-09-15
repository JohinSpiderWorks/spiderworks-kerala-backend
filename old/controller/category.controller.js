const Product_Category = require("../models/products/category.model");

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const GalleryMedia = require("../models/GalleryMedia");
const CategoryItem = require("../models/products/category_items.model");

const uploadDir = "uploads/categories";

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

const categoryUpload = multer({ storage }).fields([
    { name: "og_image", maxCount: 1 },
    { name: 'icon', maxCount: 1 }
]);

// Create a new category
const createCategory = async (req, res) => {
    try {
        categoryUpload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            const {
                is_featured,
                is_published,
                name,
                slug,
                short_description,
                created_by,
                meta_title,
                meta_description,
                meta_keywords,
                og_title,
                og_description,
                bottom_description
            } = req.body;

            console.log(req.body);


            // First handle the OG image upload and gallery media creation
            let ogImageMediaId = null;
            if (req.files['og_image']) {
                const ogFile = req.files['og_image'][0];
                console.log(ogFile);


                // Create the gallery media entry first
                const galleryMedia = await GalleryMedia.create({
                    media_name: 'Category OG Image',
                    filename: ogFile.filename,
                    file_type: 'Image',
                    status: 'active',
                    created_by: req.user.id,
                    src: `/${uploadDir}/${ogFile.filename}`
                });

                // Get the ID of the created gallery media entry 
                ogImageMediaId = galleryMedia.id;
            }

            console.log('yes');


            // Then create the category with the gallery media ID
            const category = await Product_Category.create({
                name,
                slug,
                featured: is_featured == true,
                status: is_published == true,
                created_by,
                short_description,
                meta_title,
                meta_description,
                meta_keywords,
                og_title,
                og_description,
                og_image: ogImageMediaId,
                bottom_description
            });

            res.status(201).json({
                message: "Category created successfully",
                data: category
            });
        });
    } catch (error) {
        res.status(500).json({ error: error });
    }
};

// Get all categories
const getAllCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows: categories } = await Product_Category.findAndCountAll({
            attributes: ['id', 'name', 'slug'],
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']] // Changed to order by created_at in descending order
        });

        res.status(200).json({
            data: categories,
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

// Get a single category by slug
const getCategoryBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const category = await Product_Category.findOne({
            where: { slug },
            include: [{
                model: GalleryMedia,
                as: 'category_og'
            }]
        });

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.status(200).json({ data: category });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a category
const updateCategory = async (req, res) => {
    try {
        categoryUpload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            const { id } = req.params;
            const {
                name,
                slug,
                is_featured,
                is_published,
                meta_title,
                meta_description,
                meta_keywords,
                og_title,
                og_description,
                bottom_description
            } = req.body;

            const category = await Product_Category.findByPk(id);
            if (!category) {
                return res.status(404).json({ message: "Category not found" });
            }

            // Handle OG Image update
            if (req.files['og_image']) {
                const ogFile = req.files['og_image'][0];
                const ogMedia = await GalleryMedia.create({
                    media_name: 'Category OG Image',
                    filename: ogFile.filename,
                    file_type: 'Image',
                    status: 'active',
                    created_by: req.user.id,
                    src: `/${uploadDir}/${ogFile.filename}`
                });
                category.og_image = ogMedia.id;
            }

            category.name = name || category.name;
            category.featured = is_featured ? true : false;
            category.status = is_published ? true : false;
            category.meta_title = meta_title || category.meta_title;
            category.meta_description = meta_description || category.meta_description;
            category.meta_keywords = meta_keywords || category.meta_keywords;
            category.og_title = og_title || category.og_title;
            category.og_description = og_description || category.og_description;
            category.bottom_description = bottom_description || category.bottom_description;
            category.slug = slug || category.slug

            await category.save();

            res.status(200).json({ message: "Category updated successfully", data: category });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a category
const deleteCategory = async (req, res) => {
    try {
        console.log('yes');

        const { id } = req.params;
        const category = await Product_Category.findByPk(id);

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        await category.destroy();
        res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const getAllOptions = async (req, res) => {
    try {
        const { id } = req.params;

        // const findCategory = await Product_Category.findByPk(id);
        // console.log(findCategory);


        // if (!findCategory) {
        //     return res.status(404).json({ msg: 'Category Not Found' })
        // }

        const getOptions = await CategoryItem.findAll({
            where: {
                category_id: id
            },
            include: [{
                model: GalleryMedia,
                as: 'items_icon',
            }]
        })

        res.status(200).json({ data: getOptions })

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const addNewOption = async (req, res) => {
    try {
        console.log('yes');

        categoryUpload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            const { id } = req.params;
            const { label } = req.body;
            const iconFile = req.files?.icon?.[0];
            console.log(iconFile);

            const category = await Product_Category.findByPk(id);
            if (!category) {
                return res.status(404).json({ message: "Category not found" });
            }

            let iconMediaId = null;
            if (iconFile) {
                // Create media entry for the icon
                const iconMedia = await GalleryMedia.create({
                    media_name: 'Option Icon',
                    filename: iconFile.filename,
                    file_type: 'Image',
                    status: 'active',
                    created_by: req.user.id,
                    src: `/${uploadDir}/${iconFile.filename}`
                });
                iconMediaId = iconMedia.id;
            }

            // Create the new option with the icon media reference
            const newOption = await CategoryItem.create({
                label,
                icon: iconMediaId,
                category_id: id,
                created_by: req.user.id
            });

            res.status(201).json({
                message: "Option added successfully",
                data: newOption
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const updateOption = async (req, res) => {
    try {
        categoryUpload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            const { label } = req.body;
            const { id, option_id } = req.params;

            if (!label) {
                return res.status(400).json({ message: "Label is required" });
            }

            const getCategoryOption = await CategoryItem.findByPk(option_id);
            if (!getCategoryOption) {
                return res.status(404).json({ message: "Category option not found" });
            }

            if (req.files?.icon) {
                const iconFile = req.files.icon[0];

                // Create media entry for the icon
                const iconMedia = await GalleryMedia.create({
                    media_name: 'Option Icon',
                    filename: iconFile.filename,
                    file_type: 'Image',
                    status: 'active',
                    created_by: req.user.id,
                    src: `/${uploadDir}/${iconFile.filename}`
                });

                getCategoryOption.icon = iconMedia.id;
            }

            getCategoryOption.label = label;
            await getCategoryOption.save();

            res.status(200).json({
                message: "Option updated successfully",
                data: getCategoryOption
            });
        });
    } catch (error) {
        console.error("Error updating option:", error);
        res.status(500).json({ error: error.message });
    }
}

const deleteOption = async (req, res) => {

    try {
        const { option_id } = req.params;
        const findOption = await CategoryItem.findByPk(option_id);
        if (!findOption) {
            return res.status(404).json({ msg: "Option Doesn't Exist" })
        }

        await findOption.destroy();


        res.status(204).json({ msg: 'Delete Successfully' })


    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    createCategory,
    getAllCategories,
    getCategoryBySlug,
    updateCategory,
    deleteCategory,
    addNewOption,
    updateOption,
    deleteOption,
    getAllOptions
}
