const testimonialsModel = require("../models/testimonialsModel");
const upload = require("../config/multerConfig"); // Import Multer configuration

const createTestimonial = async (req, res) => {
  try {
    // Extract data from the request body
    const { title, description, author, type } = req.body;

    // Validate required fields
    if (!title || !description || !author) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and author are required fields.",
      });
    }

    // Get file paths from Multer
    const author_photo = req.files?.author_photo?.[0]?.path || null;
    const image_url = req.files?.image_url?.[0]?.path || null;
    const video_url = req.files?.video_url?.[0]?.path || null;

    // Create a new testimonial record
    const newTestimonial = await testimonialsModel.create({
      title,
      description,
      author,
      author_photo,
      type,
      image_url,
      video_url,
    });

    // Return success response
    return res.status(201).json({
      success: true,
      message: "Testimonial created successfully.",
      data: newTestimonial,
    });
  } catch (error) {
    console.error("Error creating testimonial:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

const getAllTestimonials = async (req, res) => {
  try {
    // Fetch all testimonials from the database
    const testimonials = await testimonialsModel.findAll();

    // Return success response with all testimonials
    return res.status(200).json({
      success: true,
      message: "Testimonials retrieved successfully.",
      data: testimonials,
    });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

const getTestimonialById = async (req, res) => {
  try {
    // Extract testimonial ID from request parameters
    const { id } = req.params;

    // Find the testimonial by ID
    const testimonial = await testimonialsModel.findById(id);

    // Check if testimonial exists
    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found.",
      });
    }

    // Return success response with the testimonial
    return res.status(200).json({
      success: true,
      message: "Testimonial retrieved successfully.",
      data: testimonial,
    });
  } catch (error) {
    console.error("Error fetching testimonial:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

const updateTestimonial = async (req, res) => {
  try {
    // Extract testimonial ID from request parameters
    const { id } = req.params;

    // Extract data from the request body
    const { title, description, author, type } = req.body;

    // Get file paths from Multer (if new files are uploaded)
    const author_photo = req.files?.author_photo?.[0]?.path || null;
    const image_url = req.files?.image_url?.[0]?.path || null;
    const video_url = req.files?.video_url?.[0]?.path || null;

    // Create an update object with only provided fields
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (author) updateData.author = author;
    if (type) updateData.type = type;
    if (author_photo) updateData.author_photo = author_photo;
    if (image_url) updateData.image_url = image_url;
    if (video_url) updateData.video_url = video_url;

    // Update the testimonial in the database
    const updatedTestimonial = await testimonialsModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    // Check if testimonial exists
    if (!updatedTestimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found.",
      });
    }

    // Return success response with the updated testimonial
    return res.status(200).json({
      success: true,
      message: "Testimonial updated successfully.",
      data: updatedTestimonial,
    });
  } catch (error) {
    console.error("Error updating testimonial:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if testimonial exists and isn't already deleted
    const testimonial = await testimonialsModel.findOne({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    // Delete associated files if they exist
    const filesToDelete = [
      testimonial.author_photo,
      testimonial.image_url,
      testimonial.video_url,
    ].filter(Boolean); // Filter out null/undefined values

    // Delete files from filesystem
    for (const filePath of filesToDelete) {
      try {
        await fs.unlink(filePath);
        console.log(`Successfully deleted file: ${filePath}`);
      } catch (fileErr) {
        // Log but don't fail if file deletion fails
        console.error(`Error deleting file ${filePath}:`, fileErr);
      }
    }

    // Soft delete by setting deletedAt
    await testimonialsModel.update(
      {
        deletedAt: new Date(),
        updatedBy: req.user?.id, // Use optional chaining in case user isn't in the request
      },
      {
        where: { id },
      }
    );

    res.status(200).json({
      success: true,
      message: "Testimonial deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createTestimonial,
  getAllTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
};
