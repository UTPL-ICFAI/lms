const CourseMaterial = require("../models/CourseMaterial");
const Course = require("../models/Course");
const { notifyUsers } = require("../utils/notify");

exports.createMaterial = async (req, res) => {
  try {
    const { title, description, courseId, fileUrl, fileType } = req.body;

    const course = await Course.findOne({ _id: courseId, isDeleted: false });
    if (!course) return res.status(404).json({ message: "Course not found" });

    const finalUrl = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : fileUrl;

    if (!finalUrl) {
      return res.status(400).json({ message: "fileUrl or file upload is required" });
    }

    const material = await CourseMaterial.create({
      title,
      description: description || "",
      course: courseId,
      uploadedBy: req.user._id,
      fileUrl: finalUrl,
      fileType: req.file ? (fileType || "other") : (fileType || "url"),
    });

    await notifyUsers(
      course.students || [],
      `New material uploaded in ${course.title}: ${title}`,
      "material"
    );

    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMaterialsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const materials = await CourseMaterial.find({
      course: courseId,
      isDeleted: false,
    })
      .populate("uploadedBy", "name role")
      .sort({ createdAt: -1 });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await CourseMaterial.findOne({ _id: id, isDeleted: false });
    if (!material) return res.status(404).json({ message: "Material not found" });

    const isOwner = material.uploadedBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    material.isDeleted = true;
    material.deletedAt = new Date();
    await material.save();

    res.json({ message: "Material deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

