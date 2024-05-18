const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const { mongo, default: mongoose } = require("mongoose");


exports.createRating = async(req,res) => {
    try{
        const {courseId,rating,review} = req.body;
        const userId = req.user.id;

        const courseDetails = await Course.findById(
            {_id:courseId,
                studentsEnrolled: {$elemMatch: {$eq: userId}},
            }
        );

        if(!courseDetails){
            return res.status(400).json({
                success: false,
                message: "Student is not enrolled in the Course"
            })
        }

        const alreadyReviewed = await RatingAndReview.findOne({user:userId, course:courseId});

        if(alreadyReviewed){
            return res.status(403).json({
                success: false,
                message: "Course is already Reviewed by the user"
            })
        }

        const ratingReview = await RatingAndReview.create({rating,review,user:userId,course:courseId});

        const updatedCourseDetails = await Course.findByIdAndUpdate(
            {_id:courseId},
            {
                $push:{
                    ratingAndReviews: ratingReview._id
                }
            },
            {new:true}
        );

        return res.status(200).json({
            success: true,
            message: "Rating and Review created Successfully",
            ratingReview
        })

    }
    catch(err){
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

exports.getAverageRating = async(req,res) => {
    try{
        const courseId = req.body.courseId;

        const result = await RatingAndReview.aggregate([
            {
                $match:{
                    course: new mongoose.Types.ObjectId(courseid)
                }
            },
            {
                $group:{
                    _id:null,
                    averageRating: { $avg: "$rating"}
                }
            }
        ])

        if(result.length > 0){
            return res.status(200).json({
                success: true,
                averageRating: result[0].averageRating
            })
        }

        return res.status(200).json({
            success: true,
            message: "Average rating is 0, No Ratings given till now",
            averageRating: 0
        })

    }
    catch(err){
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}


exports.getAllRating = async(req,res) => {
    try{
        const allReviews = await RatingAndReview.find({})
                                .sort({rating: "desc"})
                                .populate({
                                    path:"user",
                                    select:"firstName lastName email image"
                                })
                                .populate({
                                    path:"course",
                                    select:"courseName"
                                })
                                .exec();

        
        return res.status(200).json({
            success: true,
            message: "All reviews fetched successfully",
            data:allReviews
        })                     

    }
    catch(err){
        return res.status(400).json({
            success: false,
            message: err.message
        })
    }
}