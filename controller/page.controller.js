const { Op } = require("sequelize");
const pageModel = require("../models/page/page.model");
const pageSectionModel = require("../models/page/section.model");
const pageSeoModel = require("../models/page/seo.model");

// const getAllPages = async (req, res) => {
//   try {
//     const pages = await pageModel.findAll({
//       where: {
//         is_dynamic: true,
//       },
//       include: [
//         {
//           model: pageSectionModel,
//           as: "page_sections",
//         },
//       ],
//     });
//     res.render("page/index", {
//       title: "Dynamic Pages",
//       data: pages,
//       query: {},
//     });
//   } catch (error) {
//     res.status(500).json({ err: error.message });
//   }
// };

const getAllPages = async (req, res) => {
  try {
    const pages = await pageModel.findAll({
      where: { is_dynamic: true },
      include: [
        {
          model: pageSectionModel,
          as: "page_sections",
        },
      ],
    });

    res.json({ success: true, pages });
  } catch (error) {
    res.status(500).json({ success: false, err: error.message });
  }
};

// const getPageDetails = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const findPage = await pageModel.findOne({
//       where: {
//         id: id,
//       },
//       include: [
//         {
//           model: pageSectionModel,
//           as: "page_sections",
//         },
//       ],
//     });

//     if (!findPage) {
//       return res.status(404).json({ err: "Page not-found" });
//     }

//     if (req?.query?.publish) {
//       await pageModel.update(
//         {
//           is_published: req?.query?.publish == "true" ? "false" : "true",
//         },
//         {
//           where: {
//             id: id,
//           },
//         }
//       );
//       res.redirect("/admin/pages");
//       return;
//     }

//     res.render("page/update", {
//       data: findPage.dataValues,
//       title: "Update Page",
//     });
//   } catch (error) {
//     res.status(500).json({ err: error.message });
//   }
// };

const getPageDetails = async (req, res) => {
  const { id } = req.params; // Use req.query for Next.js API routes

  try {
    const findPage = await pageModel.findOne({
      where: { id },
      include: [
        {
          model: pageSectionModel,
          as: "page_sections",
        },
      ],
    });

    if (!findPage) {
      return res.status(404).json({ error: "Page not found" });
    }

    if (req?.query?.publish) {
      await pageModel.update(
        {
          is_published: req.query.publish === "true" ? "false" : "true",
        },
        {
          where: { id },
        }
      );
      return res.json({ message: "Page publish status updated" });
    }

    res.json({
      data: findPage,
      title: "Update Page",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createPage = async (req, res) => {
  console.log(req.body); // Logs the request body to ensure data is received correctly
  const {
    is_published,
    title,
    short_description,
    top_description,
    bottom_description,
    sections,
    is_dynamic,
    page_name,
  } = req.body;

  try {
    const findPageName = await pageModel.findOne({
      where: {
        page_name: {
          [Op.iLike]: page_name,
        },
      },
    });

    if (findPageName) {
      return res.status(400).json({ err: "Page Name Already Exists" });
    }

    // Create the main page entry
    const createPage = await pageModel.create({
      page_name: page_name,
      title: title,
      is_published: is_published,
      short_description: short_description,
      top_description: top_description,
      bottom_description: bottom_description,
      meta_title: title,
      meta_description: short_description,
      is_dynamic: is_dynamic,
      // Remove meta_keywords if it's not needed
    });

    // Create sections associated with the page
    for (const section of sections) {
      // sections is already an array, no need to parse
      try {
        const sectionData = await pageSectionModel.create({
          page_id: createPage.dataValues.id,
          heading: section?.heading,
          content: section?.content,
        });
        console.log(sectionData); // Logs each section data created
      } catch (error) {
        // If any error occurs while creating sections, return the error
        return res
          .status(500)
          .json({ err: `Error creating section: ${error.message}` });
      }
    }

    // Return success response after creating the page and sections
    res
      .status(200)
      .json({ data: createPage.dataValues, msg: "Created Successfully" });
  } catch (error) {
    // Catch all other errors and return them
    res.status(500).json({ err: `Error creating page: ${error.message}` });
  }
};

const updateMetaData = async (req, res) => {
  const { id } = req.params;
  const { metaTitle, metaDescription, metaKeywords } = req.body;

  try {
    const page = await pageModel.findByPk(id);
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

// const updateMetaData = (req, res) => {
//   console.log("updateMetaData route hit!");
//   console.log("Request params:", req.params);
//   console.log("Request body:", req.body);

//   res.status(200).json({
//     success: true,
//     message: "Meta data updated successfully!",
//     receivedId: req.params.id,
//     receivedData: req.body,
//   });
// };

const updatePage = async (req, res) => {
  const {
    title,
    page_name,
    short_description,
    is_published,
    top_description,
    bottom_description,
    sections, // sections will already be a parsed JSON object
    meta_title,
    meta_description,
    is_dynamic,
  } = req.body;

  const { id } = req.params;

  try {
    // Load the existing page and its sections
    const page = await pageModel.findByPk(id, {
      include: [
        {
          model: pageSectionModel,
          as: "page_sections",
        },
      ],
    });

    if (!page) {
      return res.status(404).json({ err: "Page not found" });
    }

    const existingSections = page.page_sections;

    // Track sections to delete and those already processed
    const sectionsToDelete = [...existingSections];
    const processedSectionIds = [];

    // Iterate over incoming sections to create or update
    for (const section of sections) {
      // Find a matching section in the existing sections by heading or some unique property
      const existingSection = existingSections.find(
        (existing) =>
          existing.heading === section.heading &&
          !processedSectionIds.includes(existing.id)
      );

      if (existingSection) {
        // Update existing section
        await pageSectionModel.update(
          {
            heading: section.heading,
            content: section.content,
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
        await pageSectionModel.create({
          page_id: id,
          heading: section.heading,
          content: section.content,
        });
      }
    }

    // Delete sections that were not processed (i.e., they are not in the incoming data)
    for (const section of sectionsToDelete) {
      await pageSectionModel.destroy({
        where: {
          id: section.id,
        },
      });
    }

    // Update the page details
    await pageModel.update(
      {
        title,
        page_name,
        short_description,
        is_published,
        top_description,
        bottom_description,
        is_dynamic,
      },
      {
        where: { id },
      }
    );

    res.status(200).json({ msg: "Updated Successfully" });
  } catch (error) {
    res.status(500).json({ err: `Server error: ${error.message}` });
  }
};

const togglePagePublishStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const page = await pageModel.findByPk(id);

    if (!page) {
      return res.status(404).json({ err: "Page not found" });
    }

    // Toggle the publish status
    const updatedStatus = !page.is_published;

    // Update the page's publish status
    await pageModel.update({ is_published: updatedStatus }, { where: { id } });

    res.status(200).json({
      msg: `Page status updated to ${
        updatedStatus ? "Published" : "Unpublished"
      }`,
      is_published: updatedStatus,
    });
  } catch (error) {
    res.status(500).json({ err: `Server error: ${error.message}` });
  }
};

const deletePage = async (req, res) => {
  const { id } = req.params;
  try {
    const findPage = await pageModel.findByPk(id, {
      include: [
        {
          model: pageSectionModel,
          as: "page_sections",
        },
      ],
    });

    if (!findPage) {
      return res.status(404).json({ err: "Page not-found" });
    }
    await findPage.destroy();

    res.redirect("/admin/pages");
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

module.exports = {
  getAllPages,
  getPageDetails,
  createPage,
  updatePage,
  deletePage,
  togglePagePublishStatus,
  updateMetaData,
};
