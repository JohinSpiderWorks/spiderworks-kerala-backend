const applicantModel = require("../../models/career/applicant.model");
const jobModel = require("../../models/career/job.model");

const getAllJobs = async (req, res) => {
  try {
    const jobs = await jobModel.findAll({
      order: [["createdAt", "DESC"]],
      where: {
        deleted: false,
      },
    });
    console.log(jobs);
    res.status(200).json({ data: jobs });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const getJobDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const findJob = await jobModel.findByPk(id);
    if (!findJob) {
      return res.status(404).json({ err: "Job not-found" });
    }
    res.status(200).json({ data: findJob.dataValues });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const createJob = async (req, res) => {
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

  console.log(req.body);

  try {
    if (title?.length < 5 || title?.length > 100) {
      return res
        .status(400)
        .json({ err: "Title must be between 10 and 50 characters" });
    }
    const addJob = await jobModel.create({
      title: title,
      description: description,
      responsibilities: responsibilities,
      requirements: requirements,
      last_date: last_date,
      benefits: benefits,
      expiry_date: expiry_date,
      company_name: company_name,
      active: active,
      salary: salary,
    });
    res.status(201).json({ msg: "Created Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
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

const deleteJob = async (req, res) => {
  const { id } = req.params;

  try {
    const findJob = await jobModel.findByPk(id);
    if (!findJob) {
      return res.status(404).json({ err: "Job not-found" });
    }
    await jobModel.update(
      {
        deleted: true,
        deleted_date: `${new Date().getFullYear()}-${
          new Date().getMonth() + 1
        }-${new Date().getDate()}`,
        deleted_by: req?.user?.id,
      },
      {
        where: {
          id: id,
        },
      }
    );
    res.status(200).json({ msg: "Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const applyJob = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, description } = req.body;

  try {
    const findJob = await jobModel.findByPk(id);
    if (!findJob) {
      return res.status(404).json({ err: "Job not-found" });
    }

    const apply = await applicantModel.create({
      name: name,
      email: email,
      phone: phone,
      resume: `/uploads/resume/${req.file.filename}`,
      description: description,
    });

    res.status(201).json({ msg: "Applied Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const appliedJobs = async (req, res) => {
  try {
    const findAppliedJobs = await applicantModel.findAll({
      where: {
        user_id: req?.user?.id,
      },
      include: [
        {
          model: jobModel,
          foreignKey: "job_id",
          as: "applied",
        },
      ],
    });
    res.status(200).json({data:findAppliedJobs})
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
  
};

const removeAppliedJob=async(req,res)=>{
  const {id}=req.params;
  try {
    const findAppliedJob=await applicantModel.findByPk(id);

    if(!findAppliedJob){
      return res.status(404).json({err:'Applied Job not-found'});
    }
  
    await findAppliedJob.destroy();
    res.status(200).json({msg:'Removed Successfully'})
  } catch (error) {
    res.status(500).json({err:error.message})
    
  }


}

module.exports = {
  getAllJobs,
  getJobDetails,
  createJob,
  updateJob,
  deleteJob,
  applyJob,
  appliedJobs,
  removeAppliedJob
};
