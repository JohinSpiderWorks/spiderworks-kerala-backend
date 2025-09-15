const StockHistory = require('../models/products/stock-history');
const Product = require('../models/products/product.model');
const AttributeValueProduct = require('../models/products/product_variants.model');
const GalleryMedia = require('../models/GalleryMedia');
const CategoryItem = require('../models/products/category_items.model');
const stockHistory = require('../models/products/stock-history');
const { Op } = require('sequelize');

// Create stock history
const createStockHistory = async (req, res) => {
    try {
        const { product_id, variant_id, stocks_added, product_title, variant_details } = req.body;

        const stockHistory = await stockHistory.create({
            product_id,
            variant_id,
            stocks_added,
            product_title,
            variant_details,
            stock_date: new Date()
        });

        res.status(201).json({
            success: true,
            message: 'Stock history created successfully',
            data: stockHistory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create stock history',
            error: error.message
        });
    }
};

// Get all stock history
const getAllStockHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const searchQuery = req.query.search || '';

        const { count, rows: stockHistory } = await StockHistory.findAndCountAll({
            include: [
                {
                    model: Product,
                    as: 'stock_product',
                    where: searchQuery ? {
                        title: {
                            [Op.iLike]: `%${searchQuery}%`
                        }
                    } : undefined
                },
                {
                    model: AttributeValueProduct,
                    as: 'stock_variant',
                    include: [{
                        model: CategoryItem,
                        as: 'category_item_1'
                    }, {
                        model: CategoryItem,
                        as: 'category_item_2'
                    }, {
                        model: CategoryItem,
                        as: 'category_item_3'
                    }, {
                        model: GalleryMedia,
                        as: 'variant_image'
                    }]
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        const totalPages = Math.ceil(count / limit);

        res.status(200).json({
            success: true,
            message: 'Stock history retrieved successfully',
            data: stockHistory,
            meta: {
                total: count,
                page,
                limit,
                total_pages: totalPages
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve stock history',
            error: error.message
        });
    }
};

// Get stock history by ID
const getStockHistoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const stockHistory = await StockHistory.findByPk(id, {
            include: [
                {
                    model: Product,
                    as: 'stock_product',
                },
                {
                    model: AttributeValueProduct,
                    as: 'stock_variant',
                    include: [{
                        model: CategoryItem,
                        as: 'category_item_1'
                    }, {
                        model: CategoryItem,
                        as: 'category_item_2'
                    }, {
                        model: CategoryItem,
                        as: 'category_item_3'
                    }, {
                        model: GalleryMedia,
                        as: 'variant_image'
                    }]
                }
            ]
        });

        if (!stockHistory) {
            return res.status(404).json({
                success: false,
                message: 'Stock history not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Stock history retrieved successfully',
            data: stockHistory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve stock history',
            error: error.message
        });
    }
};

// Get stock history by product ID
const getStockHistoryByProductId = async (req, res) => {
    try {
        const { product_id } = req.params;
        const stockHistory = await StockHistory.findAll({
            where: { product_id },
            include: [
                {
                    model: Product,
                    as: 'product_stock'
                },
                {
                    model: AttributeValueProduct,
                    as: 'variant_stock'
                }
            ],
            order: [['created_at', 'DESC']]
        });

        if (!stockHistory || stockHistory.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No stock history found for this product'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Stock history retrieved successfully',
            data: stockHistory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve stock history',
            error: error.message
        });
    }
};

// Get out of stock variants
const getOutOfStockVariants = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const outOfStockVariants = await AttributeValueProduct.findAndCountAll({
            where: {
                stock: 0
            },
            include: [
                {
                    model: Product,
                    as: 'product'
                }, {
                    model: GalleryMedia,
                    as: 'variant_image'
                },
                {
                    model: CategoryItem,
                    as: 'category_item_1',
                    required: false
                },
                {
                    model: CategoryItem,
                    as: 'category_item_2',
                    required: false
                },
                {
                    model: CategoryItem,
                    as: 'category_item_3',
                    required: false
                }
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        // if (!outOfStockVariants || outOfStockVariants.count === 0) {
        //     return res.status(404).json({
        //         success: false,
        //         message: 'No out of stock variants found'
        //     });
        // }

        const totalPages = Math.ceil(outOfStockVariants.count / limit);

        res.status(200).json({
            success: true,
            message: 'Out of stock variants retrieved successfully',
            data: {
                variants: outOfStockVariants.rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: totalPages,
                    totalItems: outOfStockVariants.count,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve out of stock variants',
            error: error.message
        });
    }
};


module.exports = {
    createStockHistory,
    getAllStockHistory,
    getStockHistoryById,
    getStockHistoryByProductId,
    getOutOfStockVariants
};
