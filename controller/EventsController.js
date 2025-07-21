const eventModel = require("../models/events/Events");
const tableFunction = require('../common/functions/listing')

const getAllEvents = async (req, res) => {

  const { page, limit, offset } = tableFunction.TablePagination(req)

  try {
    const { count: total, rows: events } = await eventModel.findAndCountAll({
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
      where: {
        deletedAt: null, // Fetch only non-deleted events
      },
    });

    // Toggle event active status if query parameters are provided
    if (req?.query?.id) {
      await eventModel.update(
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

    res.status(200).json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createEvent = async (req, res) => {
  try {
    const {
      title,
      event_start_date,
      event_end_date,
      content_type,
      summary,
      top_description,
      bottom_description,
      full_body_html,
      meta_title,
      meta_description,
      faq_id,
    } = req.body;

    const createdBy = req.user.id;

    // Validate title length
    if (!title || title.length < 4 || title.length > 150) {
      return res
        .status(400)
        .json({ err: "Title must be between 4 and 150 characters" });
    }

    // Validate required fields
    const requiredFields = ["title", "event_start_date", "event_end_date"];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ err: `${field} is required` });
      }
    }

    // Ensure event_end_date is after event_start_date
    if (new Date(event_start_date) >= new Date(event_end_date)) {
      return res
        .status(400)
        .json({ err: "Event end date must be after start date" });
    }

    const newEvent = await eventModel.create({
      title,
      event_start_date,
      event_end_date,
      content_type,
      summary,
      top_description,
      bottom_description,
      full_body_html,
      meta_title,
      meta_description,
      faq_id,
      createdBy,
    });

    res
      .status(201)
      .json({ msg: "Event Created Successfully", event: newEvent });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ err: error.message });
  }
};

// Get Single Event
const getSingleEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await eventModel.findOne({
      where: {
        id,
        deletedAt: null, // Only fetch non-deleted events
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, err: "Event not found" });
    }

    res.status(200).json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update Event
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      event_start_date,
      event_end_date,
      content_type,
      summary,
      top_description,
      bottom_description,
      full_body_html,
      meta_title,
      meta_description,
      faq_id,
      active,
    } = req.body;

    // Check if event exists and isn't deleted
    const event = await eventModel.findOne({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, err: "Event not found" });
    }

    // Validate title if provided
    if (title && (title.length < 4 || title.length > 150)) {
      return res
        .status(400)
        .json({ err: "Title must be between 4 and 150 characters" });
    }

    // Validate dates if provided
    if (event_start_date && event_end_date) {
      if (new Date(event_start_date) >= new Date(event_end_date)) {
        return res
          .status(400)
          .json({ err: "Event end date must be after start date" });
      }
    }

    const updatedEvent = await eventModel.update(
      {
        title: title || event.title,
        event_start_date: event_start_date || event.event_start_date,
        event_end_date: event_end_date || event.event_end_date,
        content_type: content_type || event.content_type,
        summary: summary || event.summary,
        top_description: top_description || event.top_description,
        bottom_description: bottom_description || event.bottom_description,
        full_body_html: full_body_html || event.full_body_html,
        meta_title: meta_title || event.meta_title,
        meta_description: meta_description || event.meta_description,
        faq_id: faq_id || event.faq_id,
        active: active !== undefined ? active : event.active,
        updatedBy: req.user.id,
      },
      {
        where: { id },
        returning: true,
      }
    );

    res.status(200).json({
      success: true,
      msg: "Event updated successfully",
      event: updatedEvent[1][0],
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete Event (Soft Delete)
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists and isn't already deleted
    const event = await eventModel.findOne({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, err: "Event not found" });
    }

    // Soft delete by setting deletedAt
    await eventModel.update(
      {
        deletedAt: new Date(),
        updatedBy: req.user.id,
      },
      {
        where: { id },
      }
    );

    res.status(200).json({ success: true, msg: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllEvents,
  createEvent,
  getSingleEvent,
  updateEvent,
  deleteEvent,
};
