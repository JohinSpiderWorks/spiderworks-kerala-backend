require('dotenv').config();
const userModel = require("../../models/user.model");
const { verifyEmail, verifyPassword, isStrongPassword, hashPassword } = require("../../utils/utils");
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const jwt = require('jsonwebtoken');
const sequelizeConfig=require('../../config/sequelize.config')
// Create transporter for sending emails
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Generate and store OTP
const generateOTP = () => {
    return otpGenerator.generate(6, {
        upperCase: false,
        specialChars: false,
        alphabets: false
    });
};

// Generate JWT token
const generateToken = async (user) => {
    console.log(process.env.JWT_SECRET_TOKEN);

    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET_TOKEN,

    );
};

// Store OTP attempts for each user
const otpAttempts = new Map();

// Create temporary user and send OTP
const createUser = async (req, res) => {
    try {
        const { email, name, password, phone, bio } = req.body;

        console.log({ res: req.body });


        // Validate email and password
        if (!verifyEmail(email, res) || !isStrongPassword(password, res)) return;

        // Check if user exists
        const findUser = await userModel.findOne({ where: { email } });
        if (findUser) {
            return res.status(409).json({
                success: false,
                message: 'User already exists with this email address',
                data: { email }
            });
        }

        // Generate OTP and set expiration (5 minutes from now)
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 300000); // 5 minutes

        // Create temporary user record with OTP
        const tempUser = await userModel.create({
            email,
            name,
            password,
            phone: phone || null,
            bio: bio || null,
            role: 'user',
            password_expired: true,
            otp,
            otp_expires: otpExpires,
            failed_login_attempts: 0,
            account_locked_until: null
        });

        // Store OTP attempts
        otpAttempts.set(tempUser.id, { attempts: 0, otp });

        // Send OTP via email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP for Account Verification',
            text: `Your OTP is: ${otp}`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            success: true,
            message: 'OTP sent to your email for verification',
            userId: tempUser.id
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Verify OTP and complete account creation
const verifyOTPAndCreateAccount = async (req, res) => {
    try {
        const { userId, otp } = req.body;

        // Get user and OTP attempts
        const user = await userModel.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const attempts = otpAttempts.get(userId);
        if (!attempts) {
            return res.status(400).json({
                success: false,
                message: 'OTP verification expired'
            });
        }

        // Check OTP attempts
        if (attempts.attempts >= 3) {
            // Delete user after 3 failed attempts
            await user.destroy();
            otpAttempts.delete(userId);
            return res.status(403).json({
                success: false,
                message: 'Maximum OTP attempts reached. Account creation failed.'
            });
        }

        // Verify OTP
        if (attempts.otp !== otp) {
            // Increment failed attempts
            attempts.attempts += 1;
            otpAttempts.set(userId, attempts);

            return res.status(400).json({
                success: false,
                message: 'Invalid OTP',
                attemptsRemaining: 3 - attempts.attempts
            });
        }

        // Hash password and update user
        const hashedPassword = await hashPassword(user.password);
        await user.update({
            password: hashedPassword,
            otp: null,
            otp_expires: null,
            password_expired: false
        });

        // Generate JWT token
        const token = await generateToken(user);

        // Clear OTP attempts
        otpAttempts.delete(userId);

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                bio: user.bio,
                role: user.role,
                token: token
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Login user
const loginUser = async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await userModel.findOne({ where: { email } });
  
      if (!user) {
        return res.status(404).json({
          success: false,
          type: "email",
          message: "Please enter a valid email address",
        });
      }
  
      // Check if account is already locked
      if (
        user.account_locked_until &&
        new Date(user.account_locked_until) > new Date()
      ) {
        return res.status(403).json({
          success: false,
          type: "account_locked",
          message: "Account is temporarily locked. Please try again later.",
          unlockTime: user.account_locked_until,
        });
      }
  
      const isMatch = await verifyPassword(password, user.password);
      if (!isMatch) {
        const currentAttempts = user.failed_login_attempts || 0;
        const newAttempts = currentAttempts + 1;
      
        // Update failed attempts count
        await userModel.update(
          { failed_login_attempts: newAttempts },
          { where: { id: user.id } }
        );
      
        // Lock the account only if failed 4 or more times
        if (newAttempts >= 4) {
          const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
          await userModel.update(
            { account_locked_until: lockUntil },
            { where: { id: user.id } }
          );
          return res.status(403).json({
            success: false,
            type: "account_locked",
            message: "Account is locked due to too many failed attempts.",
            unlockTime: lockUntil,
          });
        }
      
        return res.status(401).json({
          success: false,
          type: "invalid_password",
          message: "Invalid credentials",
          attemptsLeft: 4 - newAttempts, // show 3, 2, 1
        });
      }
  
      // Reset on success
      await userModel.update(
        { failed_login_attempts: 0, account_locked_until: null },
        { where: { id: user.id } }
      );
  
      const token = await generateToken(user);
  
      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          bio: user.bio,
          role: user.role,
          token,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };


const addressModel = require('../../models/user/address.model');

// Create new address
const createAddress = async (req, res) => {
    try {
        const { user } = req;
        const addressData = {
            ...req.body,
            user_id: user.id
        };
        // If this is the first address, set it as primary
        const addressCount = await addressModel.count({ where: { user_id: user.id, is_primary: true } });


        const address = await addressModel.create({ ...addressData, is_primary: addressCount ? false : true });


        res.status(201).json({
            success: true,
            message: 'Address created successfully',
            data: address
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Update address
const updateAddress = async (req, res) => {
    try {
        const { user } = req;
        const { id } = req.params;

        const address = await addressModel.findOne({
            where: { id, user_id: user.id }
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        const updatedAddress = await addressModel.update(req.body, {
            where: { id },
            returning: true
        });

        res.status(200).json({
            success: true,
            message: 'Address updated successfully',
            data: updatedAddress[1][0]
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Delete address
const deleteAddress = async (req, res) => {
    try {
        const { user } = req;
        const { id } = req.params;

        const address = await addressModel.findOne({
            where: { id, user_id: user.id }
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        // Check if the address is primary
        if (address.is_primary) {
            return res.status(400).json({
                success: false,
                message: 'This is a primary address and cannot be deleted. Please set another address as primary first.'
            });
        }

        await addressModel.destroy({ where: { id } });

        res.status(200).json({
            success: true,
            message: 'Address deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// List user addresses
const listAddresses = async (req, res) => {
    try {


        const addresses = await addressModel.findAll({
            where: { user_id: req.user.id },
            order: [['is_primary', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: addresses
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Set primary address
const setPrimaryAddress = async (req, res) => {
    try {
        const { id } = req.params;

        const findAddress = await addressModel.findByPk(id);
        console.log({findAddress});
        console.log(req.body);
        
        

        if (!findAddress) {
            return res.status(404).json({ msg: 'Address not found' });
        }


        await addressModel.update(
            { is_primary: false },
            { where: { is_primary: true } }
        );

        await addressModel.update(
            { is_primary: true },
            { where: { id } }
        );



        res.status(200).json({
            success: true,
            message: 'Primary address updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get address by ID
const getAddressById = async (req, res) => {
    try {
        const { user } = req;
        const { id } = req.params;

        const address = await addressModel.findOne({
            where: { id, user_id: user.id }
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        res.status(200).json({
            success: true,
            data: address
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};





module.exports = {
    createUser,
    verifyOTPAndCreateAccount,
    loginUser,
    createAddress,
    updateAddress,
    deleteAddress,
    listAddresses,
    setPrimaryAddress,
    getAddressById
};