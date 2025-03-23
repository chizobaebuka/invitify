import nodemailer from "nodemailer";
import { supabase } from "./supabase";
import { IEvent } from "@/types/event";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendOtpEmail = async (email: string, otp: string) => {
    const mailOptions = {
        from: `"Your App Name" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Your OTP Code for Verification",
        html: `
      <div style="font-family: sans-serif; padding: 16px;">
        <h2>Email Verification</h2>
        <p>Here is your One-Time Password (OTP):</p>
        <h3 style="font-size: 24px; letter-spacing: 2px;">${otp}</h3>
        <p>This code is valid for 10 minutes. Do not share it with anyone.</p>
      </div>
    `,
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("OTP email sent:", info.messageId);
    } catch (err) {
        console.error("Error sending OTP email:", err);
        throw new Error("Failed to send OTP email.");
    }
};

export const sendWelcomeEmail = async (email: string, name: string) => {
    const mailOptions = {
        from: `"Your App Name" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Welcome to Shortlet!",
        html: `
      <div style="font-family: sans-serif; padding: 16px;">
        <h2>Welcome, ${name}!</h2>
        <p>Thanks for signing up to Shortlet. We're thrilled to have you!</p>
        <p>Please verify your email to start using your account.</p>
      </div>
    `,
    };
    await transporter.sendMail(mailOptions);
};

export const sendVerifiedEmail = async (email: string, name: string) => {
    const mailOptions = {
        from: `"Your App Name" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Email Verified Successfully",
        html: `
      <div style="font-family: sans-serif; padding: 16px;">
        <h2>Hello, ${name}!</h2>
        <p>Your email has been successfully verified. You're now good to go!</p>
      </div>
    `,
    };
    await transporter.sendMail(mailOptions);
};

export const sendPasswordChangedEmail = async (email: string, name: string) => {
    const mailOptions = {
        from: `"Your App Name" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Password Changed Successfully",
        html: `
      <div style="font-family: sans-serif; padding: 16px;">
        <h2>Hello, ${name}!</h2>
        <p>Your password has been updated successfully.</p>
        <p>If you did not do this, please contact our support immediately.</p>
      </div>
    `,
    };
    await transporter.sendMail(mailOptions);
};

export async function sendEventNotificationEmail(
    event: IEvent,
    isUpdate = false
) {
    const { data: users } = await supabase
        .from("users")
        .select("email, full_name");

    const subject = isUpdate
        ? `📢 Event Updated: ${event.title}`
        : `🎉 New Event: ${event.title}`;

    const body = `
        <p>Hello there!</p>
        <p>${isUpdate ? "An event has been updated:" : "You're invited to a new event:"}</p>
        <ul>
            <li><strong>Title:</strong> ${event.title}</li>
            <li><strong>Description:</strong> ${event.description || "N/A"}</li>
            <li><strong>Location:</strong> ${event.location || "N/A"}</li>
            <li><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</li>
        </ul>
        <p>RSVP now on our app.</p>
        <p>Cheers!</p>
    `;

    for (const user of users || []) {
        await transporter.sendMail({
            from: '"Events App" <noreply@eventsapp.com>',
            to: user.email,
            subject,
            html: body,
        });
    }
}

export async function sendEventUpdateEmail({
    recipients,
    eventTitle,
    updatedFields,
    updatedBy,
}: {
    recipients: string[];
    eventTitle: string;
    updatedFields: string[];
    updatedBy: string;
}) {
    const subject = `📢 "${eventTitle}" has been updated`;
    const body = `
      <h2>Event Update Notification</h2>
      <p>Hello,</p>
      <p>The event <strong>${eventTitle}</strong> has been updated by <strong>${updatedBy}</strong>.</p>
      <p>Updated fields: <strong>${updatedFields.join(", ")}</strong></p>
      <p>Visit your dashboard to see the latest info.</p>
      <p>Thanks!</p>
    `;

    await transporter.sendMail({ to: recipients, subject, html: body });
}

export async function sendEventDeleteEmail({
    recipients,
    eventTitle,
    deletedBy,
}: {
    recipients: string[];
    eventTitle: string;
    deletedBy: string;
}) {
    const subject = `❌ "${eventTitle}" has been cancelled`;
    const body = `
      <h2>Event Cancellation Notice</h2>
      <p>Hello,</p>
      <p>We regret to inform you that the event <strong>${eventTitle}</strong> has been cancelled by <strong>${deletedBy}</strong>.</p>
      <p>We apologize for any inconvenience.</p>
      <p>Thanks!</p>
    `;

    await transporter.sendMail({ to: recipients, subject, html: body });
}

export const sendPasswordChangeEmail = async (email: string, newPassword: string) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    await transporter.sendMail({
        from: `"Support Team" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Your Password Was Changed",
        html: `
        <p>Hello,</p>
        <p>Your password has been successfully changed.</p>
        <p><strong>New Password:</strong> ${newPassword}</p>
        <p>If you didn’t request this, please contact support immediately.</p>
        <p>Thanks,<br/>Your App Team</p>
      `,
    });
};

// sendEventNotificationEmail.ts
type NotificationEmailProps = {
    event: IEvent;
    recipients: string[];
    type: "update" | "cancel" | "rsvp";
    updatedFields?: string[];
    updatedBy?: string;
};

export async function sendEventEmail({
    event,
    recipients,
    type,
    updatedFields = [],
    updatedBy = "Organizer",
}: NotificationEmailProps) {
    let subject = "";
    let htmlBody = "";

    if (type === "cancel") {
        subject = `❌ Event Cancelled: ${event.title}`;
        htmlBody = `<p>Hi there,</p>
        <p>The event <strong>${event.title}</strong> scheduled for <strong>${event.date}</strong> has been <strong>cancelled</strong> by ${updatedBy}.</p>
        <p>We apologize for any inconvenience.</p>`;
    } else if (type === "update") {
        subject = `✏️ Event Updated: ${event.title}`;
        htmlBody = `<p>Hi there,</p>
        <p>The event <strong>${event.title}</strong> has been updated by ${updatedBy}.</p>
        <p><strong>Updated fields:</strong> ${updatedFields.join(", ")}</p>
        <p><strong>New Details:</strong><br/>
        Title: ${event.title}<br/>
        Date: ${event.date}<br/>
        Location: ${event.location}<br/>
        Description: ${event.description}</p>`;
    } else if (type === "rsvp") {
        subject = `✅ RSVP Confirmed: ${event.title}`;
        htmlBody = `<p>Hi there,</p>
        <p>Thanks for RSVPing to <strong>${event.title}</strong>!</p>
        <p><strong>Date:</strong> ${event.date}<br/>
        <strong>Location:</strong> ${event.location}</p>
        <p>We look forward to seeing you there! 🎉</p>`;
    } else {
        // fallback just in case
        subject = `Event Notification: ${event.title}`;
        htmlBody = `<p>Hi there,</p><p>You have a notification about the event <strong>${event.title}</strong>.</p>`;
    }

    for (const email of recipients) {
        await transporter.sendMail({
            to: email,
            subject,
            html: htmlBody,
        });
    }
}