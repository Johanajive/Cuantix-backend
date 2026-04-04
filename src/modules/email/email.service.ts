import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  // ─── Layout base ─────────────────────────────────────────────────────────
  private layout(title: string, body: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#EEF4F6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 20px;">
    <tr>
      <td align="center">

        <!-- Tarjeta principal -->
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,94,122,0.10);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#005E7A 0%,#1A7A8E 100%);
                       padding:36px 40px;text-align:center;">
              <p style="margin:0 0 10px;color:rgba(255,255,255,0.6);
                        font-size:11px;font-weight:700;letter-spacing:2px;
                        text-transform:uppercase;">
                Cuantix
              </p>
              <h1 style="margin:0;color:#ffffff;font-size:22px;
                         font-weight:600;letter-spacing:-0.3px;">
                ${title}
              </h1>
              <div style="width:40px;height:2px;background:rgba(255,255,255,0.35);
                          margin:16px auto 0;border-radius:2px;"></div>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F4F8FA;padding:24px 40px;
                       border-top:1px solid #DDE8EC;text-align:center;">
              <p style="margin:0 0 6px;color:#7aabb8;font-size:12px;">
                ¿Necesitas ayuda?
                <a href="mailto:cuantix02@gmail.com"
                   style="color:#005E7A;text-decoration:none;font-weight:600;">
                  cuantix02@gmail.com
                </a>
              </p>
              <p style="margin:0;color:#b0c8d0;font-size:11px;">
                &copy; ${new Date().getFullYear()} Cuantix &mdash; Todos los derechos reservados.
              </p>
              <p style="margin:10px 0 0;color:#b0c8d0;font-size:11px;">
                Este es un mensaje automático. Por favor no respondas a este correo.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  // ─── Bienvenida registro ──────────────────────────────────────────────────
  async sendWelcomeRegister(email: string, name: string) {
    const body = `
      <p style="margin:0 0 20px;font-size:15px;color:#0A1B26;font-weight:600;">
        Hola, ${name}
      </p>
      <p style="margin:0 0 16px;font-size:14px;color:#5a6c7d;line-height:1.7;">
        Tu cuenta en <strong style="color:#005E7A;">Cuantix</strong> ha sido creada correctamente.
        Estamos felices de tenerte con nosotros.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#F4F8FA;border-radius:8px;padding:20px;margin:24px 0;
                    border-left:3px solid #1A7A8E;">
        <tr>
          <td>
            <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#7aabb8;
                      text-transform:uppercase;letter-spacing:1px;">
              Estado de tu cuenta
            </p>
            <p style="margin:0;font-size:14px;color:#005E7A;font-weight:600;">
              Pendiente de activación
            </p>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 16px;font-size:14px;color:#5a6c7d;line-height:1.7;">
        Para desbloquear todas las funciones de la plataforma, adquiere un plan premium
        y comienza a aprovechar todo lo que Cuantix tiene para ofrecerte.
      </p>

      <div style="text-align:center;margin:32px 0 8px;">
        <a href="https://cuantix.com"
           style="background:#005E7A;color:#ffffff;padding:13px 32px;
                  text-decoration:none;border-radius:7px;font-weight:600;
                  font-size:13px;display:inline-block;letter-spacing:0.3px;">
          Ir a Cuantix
        </a>
      </div>`;

    await this.transporter.sendMail({
      from: '"Cuantix" <cuantix02@gmail.com>',
      to: email,
      subject: 'Bienvenido a Cuantix — Tu cuenta fue creada',
      html: this.layout('Bienvenido a Cuantix', body),
    });
  }

  // ─── Alerta de inicio de sesión ───────────────────────────────────────────
  async sendLoginAlert(email: string, name: string) {
    const body = `
      <p style="margin:0 0 20px;font-size:15px;color:#0A1B26;font-weight:600;">
        Hola, ${name}
      </p>
      <p style="margin:0 0 16px;font-size:14px;color:#5a6c7d;line-height:1.7;">
        Se ha registrado un nuevo inicio de sesión en tu cuenta de Cuantix.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#F4F8FA;border-radius:8px;padding:20px;margin:24px 0;
                    border-left:3px solid #1A7A8E;">
        <tr>
          <td>
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#7aabb8;
                      text-transform:uppercase;letter-spacing:1px;">
              Fecha y hora
            </p>
            <p style="margin:0;font-size:14px;color:#334155;font-weight:500;">
              ${new Date().toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}
            </p>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#FFF8F0;border-radius:8px;padding:18px 20px;margin:0 0 20px;
                    border-left:3px solid #f59e0b;">
        <tr>
          <td>
            <p style="margin:0;font-size:13px;color:#7d6608;line-height:1.6;">
              Si fuiste tu, puedes ignorar este mensaje con tranquilidad.<br>
              Si <strong>no reconoces</strong> este acceso, cambia tu contrasena de inmediato
              y contacta a nuestro equipo de soporte.
            </p>
          </td>
        </tr>
      </table>`;

    await this.transporter.sendMail({
      from: '"Cuantix" <cuantix02@gmail.com>',
      to: email,
      subject: 'Nuevo inicio de sesion detectado — Cuantix',
      html: this.layout('Inicio de sesion detectado', body),
    });
  }

  // ─── Advertencia de expiración ────────────────────────────────────────────
  async sendExpirationWarning(email: string, name: string) {
    const body = `
      <p style="margin:0 0 20px;font-size:15px;color:#0A1B26;font-weight:600;">
        Hola, ${name}
      </p>
      <p style="margin:0 0 16px;font-size:14px;color:#5a6c7d;line-height:1.7;">
        Tu plan <strong style="color:#005E7A;">Premium</strong> en Cuantix
        vence en <strong style="color:#f59e0b;">3 dias</strong>.
        Te recomendamos renovarlo para mantener acceso ininterrumpido a todas las funciones.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#FFF8F0;border-radius:8px;padding:20px;margin:24px 0;
                    border-left:3px solid #f59e0b;">
        <tr>
          <td>
            <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#b45309;
                      text-transform:uppercase;letter-spacing:1px;">
              Aviso de vencimiento
            </p>
            <p style="margin:0;font-size:14px;color:#7d6608;line-height:1.6;">
              Si tu plan expira, tu cuenta pasara automaticamente al modo gratuito
              y algunas funciones quedaran restringidas.
            </p>
          </td>
        </tr>
      </table>

      <div style="text-align:center;margin:32px 0 8px;">
        <a href="https://cuantix.com/planes"
           style="background:#005E7A;color:#ffffff;padding:13px 32px;
                  text-decoration:none;border-radius:7px;font-weight:600;
                  font-size:13px;display:inline-block;letter-spacing:0.3px;">
          Renovar mi plan
        </a>
      </div>`;

    await this.transporter.sendMail({
      from: '"Cuantix" <cuantix02@gmail.com>',
      to: email,
      subject: 'Tu plan Premium esta por vencer — Cuantix',
      html: this.layout('Tu plan Premium esta por vencer', body),
    });
  }

  // ─── PIN de recuperación ──────────────────────────────────────────────────
  async sendResetPin(email: string, pin: string) {
    const body = `
      <p style="margin:0 0 20px;font-size:15px;color:#0A1B26;font-weight:600;">
        Recuperacion de contrasena
      </p>
      <p style="margin:0 0 16px;font-size:14px;color:#5a6c7d;line-height:1.7;">
        Recibimos una solicitud para restablecer la contrasena de tu cuenta en Cuantix.
        Usa el siguiente codigo de verificacion para continuar con el proceso.
      </p>

      <!-- PIN -->
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#F4F8FA;border-radius:10px;padding:32px;
                    margin:28px 0;border:1px solid #DDE8EC;">
        <tr>
          <td style="text-align:center;">
            <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#7aabb8;
                      text-transform:uppercase;letter-spacing:1.5px;">
              Codigo de verificacion
            </p>
            <div style="background:#ffffff;border-radius:8px;padding:20px 28px;
                        display:inline-block;border:1px solid #DDE8EC;
                        box-shadow:0 2px 10px rgba(0,94,122,0.08);">
              <span style="font-size:36px;font-weight:700;color:#005E7A;
                           letter-spacing:8px;font-family:'Courier New',monospace;">
                ${pin}
              </span>
            </div>
            <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">
              Este codigo expira en
              <strong style="color:#5a6c7d;">10 minutos</strong>
            </p>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#FFF8F0;border-radius:8px;padding:18px 20px;
                    border-left:3px solid #f59e0b;">
        <tr>
          <td>
            <p style="margin:0;font-size:13px;color:#7d6608;line-height:1.6;">
              <strong>Importante:</strong> Por tu seguridad, nunca compartas este codigo.
              El equipo de Cuantix jamas te solicitara este dato por telefono o mensaje.
            </p>
          </td>
        </tr>
      </table>`;

    await this.transporter.sendMail({
      from: '"Cuantix" <cuantix02@gmail.com>',
      to: email,
      subject: 'Codigo de recuperacion de contrasena — Cuantix',
      html: this.layout('Recuperacion de Contrasena', body),
    });
  }

  // ─── Plan expirado ────────────────────────────────────────────────────────
  async sendPlanExpired(email: string, name: string) {
    const body = `
      <p style="margin:0 0 20px;font-size:15px;color:#0A1B26;font-weight:600;">
        Hola, ${name}
      </p>
      <p style="margin:0 0 16px;font-size:14px;color:#5a6c7d;line-height:1.7;">
        Tu suscripcion <strong style="color:#005E7A;">Premium</strong> en Cuantix ha expirado.
        Tu cuenta ha sido revertida al modo gratuito y algunas funciones
        han quedado temporalmente restringidas.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#F4F8FA;border-radius:8px;padding:20px;margin:24px 0;
                    border-left:3px solid #f43f5e;">
        <tr>
          <td>
            <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#f43f5e;
                      text-transform:uppercase;letter-spacing:1px;">
              Estado actual
            </p>
            <p style="margin:0;font-size:14px;color:#334155;">
              Plan gratuito &mdash; Funciones avanzadas desactivadas
            </p>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 16px;font-size:14px;color:#5a6c7d;line-height:1.7;">
        Puedes renovar tu suscripcion en cualquier momento para recuperar el acceso completo
        a todas las herramientas de Cuantix.
      </p>

      <div style="text-align:center;margin:32px 0 8px;">
        <a href="https://cuantix.com/planes"
           style="background:#005E7A;color:#ffffff;padding:13px 32px;
                  text-decoration:none;border-radius:7px;font-weight:600;
                  font-size:13px;display:inline-block;letter-spacing:0.3px;">
          Renovar mi plan
        </a>
      </div>`;

    await this.transporter.sendMail({
      from: '"Cuantix" <cuantix02@gmail.com>',
      to: email,
      subject: 'Tu plan Premium ha expirado — Cuantix',
      html: this.layout('Tu plan Premium ha expirado', body),
    });
  }

  // ─── Asesor aprobado ──────────────────────────────────────────────────────
  async sendAgentApproved(email: string, name: string) {
    const body = `
      <p style="margin:0 0 20px;font-size:15px;color:#0A1B26;font-weight:600;">
        Hola, ${name}
      </p>
      <p style="margin:0 0 16px;font-size:14px;color:#5a6c7d;line-height:1.7;">
        Nos complace informarte que tu solicitud para operar como
        <strong style="color:#005E7A;">Asesor en Cuantix</strong>
        ha sido revisada y aprobada exitosamente.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#F0FDF4;border-radius:8px;padding:20px;margin:24px 0;
                    border-left:3px solid #10b981;">
        <tr>
          <td>
            <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#10b981;
                      text-transform:uppercase;letter-spacing:1px;">
              Estado de tu solicitud
            </p>
            <p style="margin:0;font-size:14px;color:#064e3b;font-weight:600;">
              Aprobada — Cuenta activa
            </p>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 8px;font-size:13px;color:#7aabb8;font-weight:700;
                text-transform:uppercase;letter-spacing:1px;">
        A partir de ahora puedes:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#F4F8FA;border-radius:8px;padding:20px;margin:8px 0 24px;">
        <tr>
          <td>
            <p style="margin:0 0 10px;font-size:13px;color:#334155;">
              &mdash; &nbsp; Gestionar tu perfil profesional en la plataforma
            </p>
            <p style="margin:0 0 10px;font-size:13px;color:#334155;">
              &mdash; &nbsp; Recibir y gestionar solicitudes de asesoria
            </p>
            <p style="margin:0;font-size:13px;color:#334155;">
              &mdash; &nbsp; Conectar con usuarios que buscan orientacion financiera
            </p>
          </td>
        </tr>
      </table>

      <div style="text-align:center;margin:32px 0 8px;">
        <a href="https://cuantix.com/login"
           style="background:#005E7A;color:#ffffff;padding:13px 32px;
                  text-decoration:none;border-radius:7px;font-weight:600;
                  font-size:13px;display:inline-block;letter-spacing:0.3px;">
          Iniciar sesion
        </a>
      </div>`;

    await this.transporter.sendMail({
      from: '"Cuantix" <cuantix02@gmail.com>',
      to: email,
      subject: 'Tu cuenta de asesor fue aprobada — Cuantix',
      html: this.layout('Cuenta de Asesor Aprobada', body),
    });
  }

  // ─── Asesor rechazado ─────────────────────────────────────────────────────
  async sendAgentRejected(email: string, name: string) {
    const body = `
      <p style="margin:0 0 20px;font-size:15px;color:#0A1B26;font-weight:600;">
        Hola, ${name}
      </p>
      <p style="margin:0 0 16px;font-size:14px;color:#5a6c7d;line-height:1.7;">
        Agradecemos tu interes en formar parte de <strong style="color:#005E7A;">Cuantix</strong>
        como asesor financiero. Hemos revisado cuidadosamente tu solicitud.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#FFF4F5;border-radius:8px;padding:20px;margin:24px 0;
                    border-left:3px solid #f43f5e;">
        <tr>
          <td>
            <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#f43f5e;
                      text-transform:uppercase;letter-spacing:1px;">
              Estado de tu solicitud
            </p>
            <p style="margin:0;font-size:14px;color:#7f1d1d;font-weight:600;">
              No aprobada en esta ocasion
            </p>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 16px;font-size:14px;color:#5a6c7d;line-height:1.7;">
        Lamentablemente tu solicitud no cumplio con todos los requisitos necesarios
        en este momento. Te animamos a revisar la informacion de tu perfil,
        asegurarte de que tu documentacion este completa y volver a aplicar.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#F4F8FA;border-radius:8px;padding:18px 20px;
                    border-left:3px solid #1A7A8E;margin:0 0 24px;">
        <tr>
          <td>
            <p style="margin:0;font-size:13px;color:#334155;line-height:1.6;">
              Si tienes preguntas sobre los requisitos o deseas mas informacion,
              no dudes en contactarnos a
              <a href="mailto:cuantix02@gmail.com"
                 style="color:#005E7A;text-decoration:none;font-weight:600;">
                cuantix02@gmail.com
              </a>
            </p>
          </td>
        </tr>
      </table>`;

    await this.transporter.sendMail({
      from: '"Cuantix" <cuantix02@gmail.com>',
      to: email,
      subject: 'Actualizacion sobre tu solicitud de asesor — Cuantix',
      html: this.layout('Solicitud de Asesor No Aprobada', body),
    });
  }
}