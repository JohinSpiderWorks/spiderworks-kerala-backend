const serviceModel = require("../../models/service/service.model");
const userModel = require("../../models/user.model");
const serviceSectionModel = require("../../models/service/section.model");
require("dotenv").config();

//get all services
const getAllServices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Ensure `page` is an integer
    const limit = parseInt(req.query.limit) || 15; // Ensure `limit` is an integer
    const offset = (page - 1) * limit;

    const { count, rows } = await serviceModel.findAndCountAll({
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
      include: [
        {
          model: userModel,
          as: "service_created_by",
          attributes: { exclude: ["password"] },
        },
      ],
      where: {
        premium: false,
      },
    });

    // Calculate total pages
    const totalPages = Math.ceil(count / limit);
    res.json({
      currentPage: page,
      totalPages: totalPages,
      totalResults: count,
      nextPage: page < totalPages ? page + 1 : null,
      nextPageUrl:
        page < totalPages
          ? `${process.env.BACKEND_URL}/services?page=${page + 1}&limit=${limit}`
          : null,
      previousPageUrl:
        page > 1
          ? `${process.env.BACKEND_URL}/services?page=${page - 1}&limit=${limit}`
          : null,
      firstPageUrl: `${process.env.BACKEND_URL}/services?page=1&limit=${limit}`,
      lastPageUrl: `${process.env.BACKEND_URL}/services?page=${totalPages}&limit=${limit}`,
      offset: offset,
      limit: limit,
      data: rows.length > 0 ? rows : null,
    });
  } catch (error) {
    res.status(500).json({ err: error.message });
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

const createService = async (req, res) => {
  const {
    title,
    is_published,
    premium,
    short_description,
    top_description,
    bottom_description,
    sections,
  } = req.body;
  const parseSection = JSON.parse(sections);
  console.log(req?.headers?.host);
  console.log(req?.files);
  console.log(JSON.parse(req?.body?.sections));
  try {
    if (title?.length > 100 || title?.length < 10) {
      return res.status(400).json({
        type: "title",
        err: "Title must be between 10 and 100 characters",
      });
    }
   

    const createService = await serviceModel.create({
      title: title,
      description: top_description,
      is_published: is_published,
      premium: premium,
      short_description: short_description,
      top_description: top_description,
      bottom_description: bottom_description,
      author: req.user.id,
    });

    for (const section of parseSection) {
      try {
        const sectionData = await serviceSectionModel.create({
          blog_id: createService.dataValues.id,
          heading: section?.heading,
          content: section?.content,
          section_name: section?.heading,
        });
        console.log(sectionData);
      } catch (error) {
        res.status(500).json({ err: error.message });
      }
    }

    res
      .status(200)
      .json({ data: createService.dataValues, msg: "Created Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};


//update existing blog
const updateService = async (req, res) => {
  const {
    title,
    premium,
    short_description,
    is_published,
    top_description,
    bottom_description,
    sections,
  } = req.body;

  const { id } = req.params;
  const parseSection = JSON.parse(sections);

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

    const existingSections = service.sections;

    // Track sections to delete and those already processed
    const sectionsToDelete = [...existingSections];
    const processedSectionIds = [];

    // Iterate over incoming sections to create or update
    for (let i = 0; i < parseSection.length; i++) {
      const section = parseSection[i];

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
  const updateService=  await serviceModel.update(
      {
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
    res
      .status(200)
      .json({ data: updateService, msg: "Updated Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

// Delete existing service
const deleteService = async (req, res) => {
  const { id } = req.params;

  try {
    const findService = await serviceModel.findOne({
      where: {
        id: id,
      },
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
    if (!findService) {
      return res.status(404).json({ err: "Service notfound" });
    }
    const findServiceSection=await serviceSectionModel.findAll({
        where:{
            service_id:findService.dataValues.id
        }
    })

      await findService.destroy();
      findServiceSection?.map(async(serviceSection)=>{
        await serviceSection.destroy();
      })
     res.redirect('/admin/services')
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};


module.exports = {
  getAllServices,
  getServiceDetail,
  createService,
  updateService,
  deleteService
};
