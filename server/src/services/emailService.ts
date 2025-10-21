import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

// Send verification email
export const sendVerificationEmail = async (
    email: string,
    username: string,
    verificationToken: string
): Promise<void> => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email service not configured');
    }

    const transporter = createTransporter();
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    const mailOptions = {
        from: `"EcomManager" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify Your EcomManager Account',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to EcomManager!</h1>
                </div>
                
                <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
                    <h2 style="color: #1e293b; margin-top: 0;">Hi ${username}!</h2>
                    
                    <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                        Thank you for signing up for EcomManager. To complete your registration and start managing your e-commerce platforms, please verify your email address.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="background: #0ea5e9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                            Verify Email Address
                        </a>
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px; line-height: 1.5;">
                        If the button doesn't work, you can also copy and paste this link into your browser:
                    </p>
                    <p style="color: #0ea5e9; font-size: 14px; word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px;">
                        ${verificationUrl}
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                    
                    <p style="color: #64748b; font-size: 12px; margin: 0;">
                        This verification link will expire in 24 hours. If you didn't create an account with EcomManager, you can safely ignore this email.
                    </p>
                </div>
            </div>
        `,
        text: `
            Welcome to EcomManager!
            
            Hi ${username}!
            
            Thank you for signing up for EcomManager. To complete your registration, please verify your email address by clicking the link below:
            
            ${verificationUrl}
            
            This verification link will expire in 24 hours. If you didn't create an account with EcomManager, you can safely ignore this email.
        `,
    };

    await transporter.sendMail(mailOptions);
};

// Test email configuration
export const testEmailConfig = async (): Promise<boolean> => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return false;
        }
        
        const transporter = createTransporter();
        await transporter.verify();
        return true;
    } catch (error) {
        console.error('Email configuration test failed:', error);
        return false;
    }
};
