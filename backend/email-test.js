// Test pengiriman email
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log("Starting email test with config:", {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS ? "****" : undefined,
  });

  try {
    // Buat transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
      debug: true,
      logger: true
    });

    // Verifikasi konfigurasi
    console.log("Verifying transporter...");
    await transporter.verify();
    console.log("Transporter verified successfully");

    // Format alamat email yang ingin diuji
    const testRecipient = process.argv[2] || 'fikran0000@gmail.com';
    
    // Kirim email uji
    console.log(`Sending test email to: ${testRecipient}`);
    const info = await transporter.sendMail({
      from: `"Booking System Test" <${process.env.GMAIL_USER}>`,
      to: testRecipient,
      subject: 'Email Test',
      text: 'This is a test email to verify that the email system is working.',
      html: '<p>This is a test email to verify that the email system is working.</p>'
    });

    console.log("Email sent successfully:", {
      messageId: info.messageId,
      response: info.response
    });
  } catch (error) {
    console.error("Email test failed:", error);
  }
}

// Jalankan test
testEmail();