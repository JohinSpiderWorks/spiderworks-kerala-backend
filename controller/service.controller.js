const serviceModel = require("../models/service/service.model");
const userModel = require("../models/user.model");
const serviceSectionModel = require("../models/service/section.model");
require("dotenv").config();

//get all services
// const getAllServices = async (req, res) => {
//   try {
//     const services = await serviceModel.findAll({
//       order: [["createdAt", "DESC"]],
//       include: [
//         {
//           model: userModel,
//           as: "service_created_by",
//           attributes: { exclude: ["password"] },
//         },
//       ],
//     });

//     console.log(services);

//     res.render("service/index", {
//       title: "Service List",
//       data: services,
//       query: {},
//     });
//   } catch (error) {
//     res.status(500).json({ err: error.message });
//   }
// };

const getAllServices = async (req, res) => {
  try {
    const services = await serviceModel.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: userModel,
          as: "service_created_by",
          attributes: { exclude: ["password"] },
        },
      ],
    });

    res.status(200).json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

//get specific blog details
const getServiceDetail = async (req, res) => {
  const { id } = req.params;
  console.log(req.query);
  try {
    const service = await serviceModel.findByPk(id, {
      include: [
        {
          model: userModel,
          foreignKey: "author",
          as: "service_created_by",
          attributes: {
            exclude: ["password"],
          },
        },
        {
          model: serviceSectionModel,
          foreignKey: "service_id",
          as: "service_sections",
        },
      ],
    });

    if (!service) {
      return res.status(404).json({ err: "service notfound" });
    }
    res.json({
      data: service.dataValues,
    });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

//creat new service

// const createService = async (req, res) => {
//   const {
//     service_name,
//     title,
//     is_published,
//     premium,
//     short_description,
//     top_description,
//     bottom_description,
//     sections,
//   } = req.body;
//   console.log("start");
//   console.log(sections);
//   console.log(req.body);
//   console.log("end");

//   // Parse the sections from the request body
//   // const sections = JSON.parse(sections);

//   try {
//     // Validate the title length
//     if (title?.length > 100 || title?.length < 10) {
//       return res.status(400).json({
//         type: "title",
//         err: "Title must be between 10 and 100 characters",
//       });
//     }

//     // Create the blog entry in the serviceModel
//     const createService = await serviceModel.create({
//       service_name: service_name,
//       title: title,
//       description: top_description,
//       is_published: is_published,
//       premium: premium,
//       short_description: short_description,
//       top_description: top_description,
//       bottom_description: bottom_description,
//       author: req.user.id,
//       // No need to add banner_id since we are not handling the banner image
//     });

//     // Create the sections related to the blog
//     for (const section of sections) {
//       try {
//         const sectionData = await serviceSectionModel.create({
//           service_id: createService.dataValues.id,
//           heading: section?.heading,
//           content: section?.content,
//           section_name: section?.heading,
//         });
//         console.log(sectionData);
//       } catch (error) {
//         return res.status(500).json({ err: error.message });
//       }
//     }

//     // Respond with the created blog data
//     res
//       .status(200)
//       .json({ data: createService.dataValues, msg: "Created Successfully" });
//   } catch (error) {
//     // Handle errors that occur during the blog creation process
//     res.status(500).json({ err: error.message });
//   }
// };

const createService = async (req, res) => {
  const {
    service_name,
    title,
    is_published,
    premium,
    short_description,
    top_description,
    bottom_description,
    sections,
  } = req.body;

  try {
    // Validate the title length
    if (title?.length > 100 || title?.length < 10) {
      return res.status(400).json({
        type: "title",
        err: "Title must be between 10 and 100 characters",
      });
    }

    // Create the service entry in the serviceModel
    const createService = await serviceModel.create({
      service_name: service_name,
      title: title,
      description: top_description,
      is_published: is_published,
      premium: premium,
      short_description: short_description,
      top_description: top_description,
      bottom_description: bottom_description,
      author: req.user.id,
    });

    // Create the sections related to the service
    for (const section of sections) {
      try {
        const sectionData = await serviceSectionModel.create({
          service_id: createService.dataValues.id,
          heading: section?.heading,
          content: section?.content,
          section_name: section?.heading,
        });
        console.log(sectionData);
      } catch (error) {
        return res.status(500).json({ err: error.message });
      }
    }

    // Respond with the created service data
    res
      .status(200)
      .json({ data: createService.dataValues, msg: "Created Successfully" });
  } catch (error) {
    // Handle errors that occur during the service creation process
    res.status(500).json({ err: error.message });
  }
};

// const getUpdateService = async (req, res) => {
//   const { id } = req.params;

//   if (req?.query?.publish) {
//     console.log("yes");
//     const updateBlog = await serviceModel.update(
//       {
//         is_published: req?.query?.publish == "true" ? false : true,
//       },
//       {
//         where: {
//           id: id,
//         },
//       }
//     );
//     res.redirect("/admin/services");
//     return;
//   }
//   if (req?.query?.premium) {
//     console.log("yes");
//     const updateBlog = await serviceModel.update(
//       {
//         premium: req?.query?.premium == "true" ? false : true,
//       },
//       {
//         where: {
//           id: id,
//         },
//       }
//     );
//     res.redirect("/admin/services");
//     return;
//   }

//   const findService = await serviceModel.findByPk(id, {
//     include: [
//       {
//         model: serviceSectionModel,
//         foreignKey: "service_id",
//         as: "service_sections",
//       },
//       {
//         model: userModel,
//         foreignKey: "author",
//         as: "service_created_by",
//         attributes: {
//           exclude: ["password"],
//         },
//       },
//     ],
//   });

//   if (!findService) {
//     return res.status(404).json({ err: "Service not-found" });
//   }
//   console.log(findService.dataValues);
//   res.render("service/update", {
//     data: findService.dataValues,
//     title: "Update Service",
//   });
// };

//update existing blog

const getUpdateService = async (req, res) => {
  try {
    const { id } = req.params;

    // Handle publishing toggle
    if (req.query.publish) {
      await serviceModel.update(
        {
          is_published: req.query.publish === "true" ? false : true,
        },
        {
          where: { id },
        }
      );
      return res
        .status(200)
        .json({ message: "Publish status updated successfully" });
    }

    // Handle premium toggle
    if (req.query.premium) {
      await serviceModel.update(
        {
          premium: req.query.premium === "true" ? false : true,
        },
        {
          where: { id },
        }
      );
      return res
        .status(200)
        .json({ message: "Premium status updated successfully" });
    }

    // Fetch service details
    const findService = await serviceModel.findByPk(id, {
      include: [
        {
          model: serviceSectionModel,
          foreignKey: "service_id",
          as: "service_sections",
        },
        {
          model: userModel,
          foreignKey: "author",
          as: "service_created_by",
          attributes: { exclude: ["password"] },
        },
      ],
    });

    if (!findService) {
      return res.status(404).json({ err: "Service not found" });
    }

    res.status(200).json(findService); // Send JSON response to Next.js frontend
  } catch (error) {
    console.error("Error fetching/updating service:", error);
    res.status(500).json({ err: "Internal Server Error" });
  }
};

const updateServiceMeta = async (req, res) => {
  const { id } = req.params;
  const { metaTitle, metaDescription, metaKeywords } = req.body;

  try {
    const page = await serviceModel.findByPk(id);
    if (!page) {
      return res.status(404).json({ message: "Page not found" });
    }

    // Update meta data
    page.meta_title = metaTitle;
    page.meta_description = metaDescription;
    page.meta_keywords = metaKeywords;

    await page.save();

    res.json({ message: "Meta data updated successfully", page });
  } catch (error) {
    console.error("Error updating meta data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateService = async (req, res) => {
  const {
    service_name,
    title,
    premium,
    short_description,
    is_published,
    top_description,
    bottom_description,
    sections,
  } = req.body;

  const { id } = req.params;

  try {
    if (title?.length > 100 || title?.length < 10) {
      return res.status(400).json({
        type: "title",
        err: "Title must be between 10 and 100 characters",
      });
    }

    // Load the existing blog and its sections
    const service = await serviceModel.findByPk(id, {
      include: [
        {
          model: serviceSectionModel,
          foreignKey: "service_id",
          as: "service_sections",
        },
      ],
    });

    if (!service) {
      return res.status(404).json({ err: "service not found" });
    }

    const existingSections = service.service_sections;

    // Track sections to delete and those already processed
    const sectionsToDelete = [...existingSections];
    const processedSectionIds = [];

    // Iterate over incoming sections to create or update
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];

      // Find a matching section in the existing sections by heading or some unique property
      const existingSection = existingSections.find(
        (existing) =>
          existing.heading === section.heading &&
          !processedSectionIds.includes(existing.id)
      );

      if (existingSection) {
        // Update existing section
        await serviceSectionModel.update(
          {
            heading: section.heading,
            content: section.content,
            section_name: section.heading,
          },
          {
            where: {
              id: existingSection.id,
            },
          }
        );
        // Mark this section as processed
        processedSectionIds.push(existingSection.id);
        // Remove from deletion list
        sectionsToDelete.splice(sectionsToDelete.indexOf(existingSection), 1);
      } else {
        // Create a new section
        await serviceSectionModel.create({
          service_id: id,
          heading: section.heading,
          content: section.content,
          section_name: section.heading,
        });
      }
    }

    // Delete sections that were not processed (i.e., they are not in the incoming data)
    for (const section of sectionsToDelete) {
      await serviceSectionModel.destroy({
        where: {
          id: section.id,
        },
      });
    }

    // Update the service details without changing the banner
    const updateService = await serviceModel.update(
      {
        service_name,
        title,
        description: top_description,
        short_description,
        is_published,
        premium,
        top_description,
        bottom_description,
      },
      {
        where: { id },
      }
    );
    res.status(200).json({ data: updateService, msg: "Updated Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const toggleServiceStatus = async (req, res) => {
  const { id } = req.params;
  const { field, value } = req.body; // `field` can be "is_published" or "premium"

  if (!["is_published", "premium"].includes(field)) {
    return res.status(400).json({ error: "Invalid field" });
  }

  try {
    const service = await serviceModel.findByPk(id);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Update the respective field dynamically
    await serviceModel.update({ [field]: value }, { where: { id } });

    res.status(200).json({ message: "Status updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete existing service
// const deleteService = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const findService = await serviceModel.findOne({
//       where: {
//         id: id,
//       },
//       include: [
//         {
//           model: userModel,
//           foreignKey: "author",
//           as: "service_created_by",
//           attributes: {
//             exclude: ["password"],
//           },
//         },
//         {
//           model: serviceSectionModel,
//           foreignKey: "service_id",
//           as: "service_sections",
//         },
//       ],
//     });
//     if (!findService) {
//       return res.status(404).json({ err: "Service notfound" });
//     }
//     const findServiceSection = await serviceSectionModel.findAll({
//       where: {
//         service_id: findService.dataValues.id,
//       },
//     });

//     await findService.destroy();
//     findServiceSection?.map(async (serviceSection) => {
//       await serviceSection.destroy();
//     });
//     res.redirect("/admin/services");
//   } catch (error) {
//     res.status(500).json({ err: error.message });
//   }
// };

const deleteService = async (req, res) => {
  const { id } = req.params; // or req.query if using query params

  console.log("Received ID for deletion:", id);

  if (!id) {
    return res.status(400).json({ err: "Service ID is required" });
  }

  try {
    const findService = await serviceModel.findOne({ where: { id } });

    if (!findService) {
      return res.status(404).json({ err: "Service not found" });
    }

    await findService.destroy(); // Delete the service

    return res.json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ err: error.message });
  }
};

const duplicateService = async (req, res) => {
  const { id } = req.params;

  try {
    const findService = await serviceModel.findByPk(id, {
      include: [
        {
          model: serviceSectionModel,
          foreignKey: "service_id",
          as: "service_sections",
        },
      ],
    });

    if (findService) {
      // Create the duplicate blog
      const createDuplicateService = await serviceModel.create({
        title: req?.query?.title,
        short_description: findService.dataValues.short_description,
        description: findService.dataValues.description,
        is_published: findService.dataValues.is_published,
        top_description: findService?.dataValues?.top_description,
        bottom_description: findService?.dataValues?.bottom_description,
        publish_date: findService.dataValues.publish_date,
        premium: findService.dataValues.premium,
        meta_title: findService.dataValues.meta_title,
        meta_description: findService.dataValues.meta_description,
        banner_id: findService.dataValues.banner_id,
        featured_id: findService.dataValues.featured_id,
        og_id: findService.dataValues.og_id,
        author: findService.dataValues.author,
        role: findService.dataValues.role,
      });

      // Duplicate sections
      if (
        findService.service_section &&
        findService.service_section.length > 0
      ) {
        const sectionPromises = findService.service_section.map((section) =>
          blogSectionModel.create({
            blog_id: createDuplicateService.id,
            heading: section.heading,
            content: section.content,
            section_name: section.heading,
          })
        );
        await Promise.all(sectionPromises);
      }

      res.redirect("/admin/services");
    } else {
      res.status(404).json({ err: "Blog not found" });
    }
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

module.exports = {
  getAllServices,
  getServiceDetail,
  createService,
  getUpdateService,
  updateService,
  deleteService,
  duplicateService,
  toggleServiceStatus,
  updateServiceMeta,
};
