const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")

let refreshTokens = [];
const authController = {
    // register
    registerUser: async (req, res) => {
        try {
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(req.body.password, salt);

            // Create new user
            const newUser = await new User({
                username: req.body.username,
                email: req.body.email,
                password: hashed,
            });

            // Save to DB
            const user = await newUser.save();
            res.status(200).json(user)
        } catch (error) {
            res.status(500).json(error)
        }
    },
    // Generate access Token
    generateAccessToken: (user) => {
        return jwt.sign({
            id: user.id,
            admin: user.admin
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "30s" }
        );
    },
    // Generate refresh Token
    generateRefreshToken: (user) => {
        return jwt.sign({
            id: user.id,
            admin: user.admin,   
        },
        process.env.JWT_REFRESH_KEY,
        {expiresIn: "365d"}
        )
    },
    // Login
    loginUser: async (req, res) => {
        try {
            const user = await User.findOne({username: req.body.username});
            if (!user) {
                res.status(404).json("Wrong username!");

            }
            
            const validPassword = await bcrypt.compare(
                req.body.password,
                user.password
            )
            if (!validPassword) {
                res.status(404).json("wrong password")
            }

            if (user && validPassword) {
                const accessToken = authController.generateAccessToken(user);
                const refreshToken = authController.generateRefreshToken(user);
                refreshTokens.push(refreshToken)
                res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    path: "/",
                    sameSite: "strict",
                    secure: false
                })
                const {password, ...others} = user._doc;
                res.status(200).json({...others, accessToken})
            }
            
        } catch (error) {
            res.status(500).json(err);
        }
    },

    // Reset Token
    // Redis for save refresh
    requestRefreshTonken: async (req, res) => {
        // Take refresh token from user
        const refreshToken = req.cookies.refreshToken;
        res.status(200).json(refreshToken)
        if (!refreshToken) return res.status(401).json("You're not authenticated!")
        if (!refreshTokens.includes(refreshToken)) {
            return res.status(403).json("Refresh token is not valid!");
        }
        jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, (err, user) => {
            if (err) {
                console.log(err)
            }
            refreshTokens = refreshTokens.filter((token) => token !== refreshToken)
            // Create new accessToken, refreshToken
            const newAccessToken = authController.generateAccessToken(user);
            const newRefreshToken = authController.generateRefreshToken(user);
            refreshTokens.push(newRefreshToken)
            res.cookie("refreshToken", newRefreshToken, {
                httpOnly: true,
                path: "/",
                sameSite: "strict",
                secure: false
            })
            res.status(200).json({accessToken: newAccessToken});
        })
    },

    // Logout
    userLogout: async(req, res) => {
        res.clearCookie("refreshToken");
        refreshTokens = refreshTokens.filter(token => token !== req.cookies.refreshToken);
        res.status(200).json("Logged out!")
    }
}

/* 
    Store token
    1. Local storage (XSS attack)
    2. Cookies (CSRF => SAMESITE Protect)
    3. Redux store => (accesstoken)
        + Httponly cookies => RefreshToken
*/

module.exports = authController