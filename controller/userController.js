const User = require("../models/User");

const userController = {
    // Get all users
    getAllUsers: async (req, res) => {
        try {
            const user = await User.find();
            res.status(200).json(user)
        } catch (error) {
            res.status(500).json(error)
        }
    },

    // Delete users
    deleteUser: async (req, res) => {
        try {
            // find by id and delete
            const user = await User.findById(req.params.id);
            res.status(200).json("Delete successfully")

        } catch (error) {
            res.status(500).json(error)
        }
    }
}

module.exports = userController