const pageModel = require("../models/page/page.model");
const pageSectionModel = require("../models/page/section.model");
const pageSeoModel = require("../models/page/seo.model");

// const getAllStaticPages = async (req, res) => {
//   try {
//     const pages = await pageModel.findAll({
//       where: {
//         is_dynamic: false,
//       },
//       include: [
//         {
//           model: pageSectionModel,
//           as: "page_sections",
//         },
//       ],
//     });
//     res.render("staticpages/index", {
//       title: "Static Pages",
//       data: pages,
//       query: {},
//     });
//   } catch (error) {
//     res.status(500).json({ err: error.message });
//   }
// };

const getAllStaticPages = async (req, res) => {
  try {
    const pages = await pageModel.findAll({
      where: {
        is_dynamic: false, // Keep this for static pages, or change to `true` for dynamic pages
      },
      include: [
        {
          model: pageSectionModel,
          as: "page_sections",
        },
      ],
    });

    // Return JSON response
    res.status(200).json({ success: true, pages });
  } catch (error) {
    res.status(500).json({ success: false, err: error.message });
  }
};

const getStaticPageDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const findPage = await pageModel.findOne({
      where: {
        id: id,
      },
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

    if (req?.query?.publish) {
      await pageModel.update(
        {
          is_published: req?.query?.publish == "true" ? "false" : "true",
        },
        {
          where: {
            id: id,
          },
        }
      );
      res.redirect("/admin/staticpages");
      return;
    }

    res.render("staticpages/update", {
      data: findPage.dataValues,
      title: "Update Static Page",
    });
  } catch (error) {
    res.status(500).json({ err: error.message });
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
    sections, // sections will already be a parsed JSON object
  } = req.body;

  try {
    // Validate title length
    if (title?.length > 14 || title?.length < 4) {
      return res.status(400).json({
        type: "title",
        err: "Title must be between 4 and 14 characters",
      });
    }

    // Create the main page entry
    const createPage = await pageModel.create({
      title: title,
      is_published: is_published,
      short_description: short_description,
      top_description: top_description,
      bottom_description: bottom_description,
      meta_title: title,
      meta_description: short_description,
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

const updateStaticPage = async (req, res) => {
  const {
    title,
    short_description,
    is_published,
    top_description,
    bottom_description,
    sections, // sections will already be a parsed JSON object
    meta_title,
    meta_description,
  } = req.body;

  const { id } = req.params;

  try {
    // Validate title length
    if (!title || title.length > 14 || title.length < 4) {
      return res.status(400).json({
        type: "title",
        err: "Title must be between 4 and 14 characters",
      });
    }

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
        short_description,
        is_published,
        top_description,
        bottom_description,
      },
      {
        where: { id },
      }
    );

    // Update the SEO details
    await pageSeoModel.update(
      {
        meta_title: meta_title,
        meta_description: meta_description,
      },
      {
        where: {
          id: id,
        },
      }
    );

    res.status(200).json({ msg: "Updated Successfully" });
  } catch (error) {
    res.status(500).json({ err: `Server error: ${error.message}` });
  }
};

const deleteStaticPage = async (req, res) => {
  const { id } = req.params;
  try {
    const findPage = await pageModel.findByPk(id, {
      include: [
        {
          model: pageSectionModel,
          as: "page_sections",
        },
        {
          model: pageSeoModel,
          as: "page_seo",
        },
      ],
    });

    if (!findPage) {
      return res.status(404).json({ err: "Page not-found" });
    }
    await findPage.destroy();

    res.redirect("/admin/staticpages");
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

module.exports = {
  getAllStaticPages,
  getStaticPageDetails,
  createPage,
  updateStaticPage,
  deleteStaticPage,
};
