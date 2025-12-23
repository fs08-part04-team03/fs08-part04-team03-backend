import nodemailer from 'nodemailer';
import { env } from '../../config/env.config';
import { CustomError } from './error.util';
import { HttpStatus } from '../constants/httpStatus.constants';
import { ErrorCodes } from '../constants/errorCodes.constants';

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: Number(env.EMAIL_PORT),
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

// 이메일 전송 유틸
async function sendEmail(to: string, subject: string, html: string) {
  const mailOptions = {
    from: env.EMAIL_USER,
    to,
    subject,
    html,
  };

  try {
    await transporter.verify();
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new CustomError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCodes.EMAIL_SENDING_FAILED,
      '이메일 전송에 실패했습니다.',
      `이메일 전송 실패: ${error as string}`
    );
  }
}

// 초대 이메일 전송
export function sendInvitationEmail(to: string, invitationLink: string) {
  const subject = '[SNACK] 서비스에 가입하세요!';
  const html = `
    <p>아래 링크를 클릭하여 초대를 수락하세요:</p>
    <a href="${invitationLink}">${invitationLink}</a>
  `;

  setTimeout(() => {
    console.log('메일 전송 완료: ', to);
  }, 1000);

  return sendEmail(to, subject, html);
}

// 예산 부족 알림 이메일 전송
export function sendBudgetAlertEmail(to: string, budget: number, message: string) {
  const subject = '[SNACK] ⚠️ 예산 관련 알림';
  const html = `
    <h2>예산 관련 알림</h2>
    <p>설정된 예산: <strong>${budget.toLocaleString()}원</strong></p>
    <p>자세한 내용: <strong>${message}</strong></p>
  `;

  setTimeout(() => {
    console.log('메일 전송 완료: ', to);
  }, 1000);

  return sendEmail(to, subject, html);
}
