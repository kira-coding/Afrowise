const OTP = require("../models/users/OTP");

const generateOTP = async (email) => {
    const otp_value = Math.floor(Math.random() * 1000000).toString()
    const otp = await OTP.create({ email: email, otp: otp_value });
    await sendOTP(email,otp.value);
    return otp;
};

const sendOTP = async (email, otp) => {
    console.log(otp, email);
    // TODO: SEnd otp to email with nodemailer 
};

const verifyOTP = async (email, value) => {
    try {
        const otp = await OTP.findOne({ email});
        if (!otp || !otp.value === value) {
             throw new Error('Invalid OTP');
        }
        if (otpDocument.createdAt < Date.now() - 3600000) {
            throw new Error('OTP expired');
        }
        return true;
    } catch (error) {
        throw error;
    }
};

const isEmailRegistered = async (email) => {
    try {
        const user = await OTP.findOne({ email });
        return !!user;
    } catch (error) {
        throw error;
    }
};
exports.generateOTP = generateOTP;
exports.sendOTP = sendOTP;
exports.verifyOTP = verifyOTP;
exports.isEmailRegistered = isEmailRegistered;