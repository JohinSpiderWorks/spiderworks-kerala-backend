const { Op } = require("sequelize");
const jobModel = require("../models/career/job.model");
const userModel = require("../models/user.model");

// const getAllJobs = async (req, res) => {
//   try {
//     const jobs = await jobModel.findAll({
//       order: [["createdAt", "DESC"]],
//       where: {
//         deleted: false,
//       },
//     });
//     const date = `${new Date().getFullYear()}-0${
//       new Date().getMonth() + 1
//     }-${new Date().getDate()}`;
//     console.log(date);
//     if (jobs.length > 0) {
//       await jobModel.update(
//         {
//           active: false,
//         },
//         {
//           where: {
//             expiry_date: date,
//           },
//         }
//       );
//     }
//     if (req?.query?.id) {
//       await jobModel.update(
//         {
//           active: req?.query?.active == "true" ? "false" : "true",
//         },
//         {
//           where: {
//             id: req?.query?.id,
//           },
//         }
//       );
//       res.redirect("/admin/career");
//     } else {
//       console.log(jobs);
//       res.render("career/index", { title: "Career", data: jobs, query: {} });
//     }
//   } catch (error) {
//     res.status(500).json({ err: error.message });
//   }
// };

const getAllJobs = async (req, res) => {
  try {
    const jobs = await jobModel.findAll({
      order: [["createdAt", "DESC"]],
      where: {
        deleted: false,
      },
    });

    const date = `${new Date().getFullYear()}-0${
      new Date().getMonth() + 1
    }-${new Date().getDate()}`;

    // Update jobs with expired dates
    if (jobs.length > 0) {
      await jobModel.update(
        {
          active: false,
        },
        {
          where: {
            expiry_date: date,
          },
        }
      );
    }

    // Toggle job active status if query parameters are provided
    if (req?.query?.id) {
      await jobModel.update(
        {
          active: req?.query?.active === "true" ? false : true,
        },
        {
          where: {
            id: req?.query?.id,
          },
        }
      );
    }

    // Return JSON response
    res.status(200).json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// const createJob = async (req, res) => {
//   const {
//     title,
//     description,
//     responsibilities,
//     requirements,
//     last_date,
//     benefits,
//     expiry_date,
//     company_name,
//     active,
//     salary,
//   } = req.body;

//   console.log(req.body);

//   try {
//     if (title?.length < 10 || title?.length > 100) {
//       return res
//         .status(400)
//         .json({ err: "Title must be between 10 and 50 characters" });
//     }
//     const addJob = await jobModel.create({
//       title: title,
//       description: description,
//       responsibilities: responsibilities,
//       requirements: requirements,
//       last_date: last_date,
//       benefits: benefits,
//       expiry_date: expiry_date,
//       company_name: company_name,
//       active: active,
//       salary: salary,
//       deleted_by: null, // Explicitly set to null
//     });

//     res.status(201).json({ msg: "Created Successfully" });
//   } catch (error) {
//     res.status(500).json({ err: error.message });
//   }
// };

const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      responsibilities,
      requirements,
      last_date,
      benefits,
      expiry_date,
      company_name,
      active,
      salary,
    } = req.body;

    // Validate title length
    if (title?.length < 10 || title?.length > 100) {
      return res
        .status(400)
        .json({ err: "Title must be between 10 and 100 characters" });
    }

    // Validate required fields
    const requiredFields = [
      "title",
      "description",
      "responsibilities",
      "requirements",
      "last_date",
      "benefits",
      "expiry_date",
      "company_name",
      "salary",
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ err: `${field} is required` });
      }
    }

    const addJob = await jobModel.create({
      title,
      description,
      responsibilities,
      requirements,
      last_date,
      benefits,
      expiry_date,
      company_name,
      active,
      salary,
      deleted_by: null,
    });

    res.status(201).json({ msg: "Created Successfully" });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ err: error.message });
  }
};

// const getUpdateJob = async (req, res) => {
//   const { id } = req.params;
//   console.log(id);
//   try {
//     const findJob = await jobModel.findByPk(id);
//     if (!findJob) {
//       return res.status(404).json({ err: "Job not-found" });
//     }
//     res.render("career/update", {
//       title: "Update Job",
//       data: findJob.dataValues,
//     });
//   } catch (error) {
//     res.status(500).json({ err: error.message });
//   }
// };

const getUpdateJob = async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    const findJob = await jobModel.findByPk(id);
    if (!findJob) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.status(200).json({
      success: true,
      job: findJob.dataValues, // Sending JSON instead of rendering EJS
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateJob = async (req, res) => {
  const { id } = req.params;
  console.log("update");
  try {
    const findJob = await jobModel.findByPk(id);
    if (!findJob) {
      return res.status(404).json({ err: "Job not-found" });
    }
    const update = await jobModel.update(req.body, {
      where: {
        id: id,
      },
    });

    res.status(200).json({ msg: "Updated Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const toggleJobActiveStatus = async (req, res) => {
  const { id, active } = req.query; // Get the id and active from the query parameters
  try {
    const findJob = await jobModel.findByPk(id);
    if (!findJob) {
      return res.status(404).json({ err: "Job not found" });
    }

    // Update the job's active status
    const updatedJob = await jobModel.update(
      { active: active === "true" }, // Convert the 'active' to a boolean
      { where: { id } }
    );

    if (updatedJob) {
      res.status(200).json({ msg: "Job status updated successfully" });
    } else {
      res.status(400).json({ err: "Failed to update job status" });
    }
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

// const deleteJob = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const findJob = await jobModel.findByPk(id);
//     if (!findJob) {
//       return res.status(404).json({ err: "Job not-found" });
//     }
//     await jobModel.update(
//       {
//         deleted: true,
//         deleted_date: `${new Date().getFullYear()}-${
//           new Date().getMonth() + 1
//         }-${new Date().getDate()}`,
//         deleted_by: req?.user?.id,
//       },
//       {
//         where: {
//           id: id,
//         },
//       }
//     );
//     res.redirect("/admin/career");
//   } catch (error) {
//     res.status(500).json({ err: error.message });
//   }
// };

const deleteJob = async (req, res) => {
  const { id } = req.params;

  try {
    const findJob = await jobModel.findByPk(id);
    if (!findJob) {
      return res.status(404).json({ err: "Job not found" });
    }

    // Get the user ID from the request (make sure user is authenticated)
    const userId = req?.user?.id;

    // If no user ID exists (i.e., user is not authenticated), set deleted_by to null
    const deletedBy = userId ? userId : null;

    await jobModel.update(
      {
        deleted: true,
        deleted_date: `${new Date().getFullYear()}-${
          new Date().getMonth() + 1
        }-${new Date().getDate()}`,
        deleted_by: deletedBy, // Set deleted_by to user ID or null if no user ID
      },
      {
        where: {
          id: id,
        },
      }
    );

    res.json({ message: "Job successfully deleted" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ err: error.message });
  }
};

module.exports = {
  getAllJobs,
  createJob,
  getUpdateJob,
  updateJob,
  deleteJob,
  toggleJobActiveStatus,
};
