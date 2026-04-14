"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ReportNotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportNotificationsService = void 0;
const common_1 = require("@nestjs/common");
const resend_1 = require("resend");
const notifications_utils_1 = require("../utils/notifications.utils");
const reports_utils_1 = require("../utils/reports.utils");
function sanitizeFilenamePart(value) {
    return (0, reports_utils_1.safeText)(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\\/:*?"<>|]+/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}
function formatDateForFilename(iso) {
    const date = iso ? new Date(iso) : new Date();
    const parts = new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(date);
    const get = (type) => parts.find((p) => p.type === type)?.value ?? '00';
    return `${get('day')}-${get('month')}-${get('year')}_${get('hour')}-${get('minute')}`;
}
function buildReportPdfFilename(report) {
    const data = (0, notifications_utils_1.getNestedObject)(report, 'data');
    const incidencias = (0, notifications_utils_1.normalizeIncidencias)(report);
    const tienda = (0, reports_utils_1.safeText)(report['tienda'] || data['tienda'] || 'SIN-TIENDA');
    const createdAtIso = (0, reports_utils_1.safeText)(report['createdAt'] || data['createdAt'] || new Date().toISOString());
    const incidenciasPart = sanitizeFilenamePart(incidencias.join('-') || 'SIN-INCIDENCIA');
    const tiendaPart = sanitizeFilenamePart(tienda || 'SIN-TIENDA');
    const fechaPart = formatDateForFilename(createdAtIso);
    return `Reporte-Asociado-A-${incidenciasPart}-${tiendaPart}-${fechaPart}.pdf`;
}
let ReportNotificationsService = ReportNotificationsService_1 = class ReportNotificationsService {
    logger = new common_1.Logger(ReportNotificationsService_1.name);
    resend = new resend_1.Resend(process.env.RESEND_API_KEY ?? '');
    async notifyReportCreated(report) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            this.logger.warn('RESEND_API_KEY no está definido, no se enviará correo.');
            return;
        }
        const to = (0, notifications_utils_1.splitEmails)(process.env.REPORT_NOTIFY_TO);
        if (to.length === 0) {
            this.logger.warn('REPORT_NOTIFY_TO no está definido, no se enviará correo.');
            return;
        }
        const from = process.env.MAIL_FROM || 'Reportes <onboarding@resend.dev>';
        const subjectPrefix = process.env.REPORT_NOTIFY_SUBJECT_PREFIX || 'Nuevo reporte';
        const incidencias = (0, notifications_utils_1.normalizeIncidencias)(report);
        const data = (0, notifications_utils_1.getNestedObject)(report, 'data');
        const tienda = (0, reports_utils_1.safeText)(report['tienda'] || data['tienda'] || '—').trim();
        const incidenciaLabel = incidencias.length <= 1
            ? `Incidencia ${incidencias[0] || '—'}`
            : `${incidencias.length} incidencias`;
        const html = (0, notifications_utils_1.buildReportHtml)(report);
        const pdfUrl = (0, reports_utils_1.safeText)(report['responsablePdfUrl']).trim();
        const attachmentFilename = buildReportPdfFilename(report);
        let attachments;
        if (pdfUrl) {
            try {
                const { base64 } = await (0, notifications_utils_1.fetchAsBase64)(pdfUrl, 20000);
                attachments = [
                    {
                        filename: attachmentFilename,
                        content: base64,
                        contentType: 'application/pdf',
                    },
                ];
                this.logger.log(`Adjunto PDF renombrado a: ${attachmentFilename}`);
            }
            catch (error) {
                this.logger.error(`No se pudo adjuntar PDF: ${(0, notifications_utils_1.getErrorMessage)(error)}`);
            }
        }
        const payload = {
            from,
            to,
            subject: `${subjectPrefix} • ${incidenciaLabel} • ${tienda}`,
            html,
            ...(attachments ? { attachments } : {}),
        };
        const { data: resendData, error } = await this.resend.emails.send(payload);
        if (error) {
            this.logger.error(`Resend error: ${JSON.stringify(error)}`);
            return;
        }
        this.logger.log(`Resend queued id=${resendData?.id ?? '—'} to=${to.join(', ')}`);
    }
    async notifyUserCreated(user) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            this.logger.warn('RESEND_API_KEY no definido, no se enviará correo de bienvenida.');
            return;
        }
        const from = process.env.MAIL_FROM || 'Grupo Aral <onboarding@resend.dev>';
        const roleLabel = user.role === 'COORDINADOR' ? 'Coordinador' : 'Supervisor';
        const platformUrl = process.env.PLATFORM_URL || 'https://plataforma.grupoaral.com';
        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(27,38,52,0.12);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1B2634 0%,#0781BE 100%);padding:40px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;color:#F2AD15;font-size:13px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">Grupo Aral</p>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;line-height:1.3;">¡Bienvenido a la plataforma!</h1>
              <p style="margin:12px 0 0;color:rgba(255,255,255,0.75);font-size:15px;">Has sido registrado como <strong style="color:#F2AD15;">${roleLabel}</strong>.</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 20px;color:#1B2634;font-size:16px;line-height:1.7;">
                Hola <strong>${user.fullName}</strong>,
              </p>
              <p style="margin:0 0 28px;color:#4a5568;font-size:15px;line-height:1.7;">
                Te han registrado en la plataforma de gestión del <strong>Grupo Aral</strong> con el rol de <strong>${roleLabel}</strong>. A continuación encontrarás tus credenciales de acceso:
              </p>

              <!-- Credentials box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9fc;border:1.5px solid #e2e8f0;border-radius:16px;overflow:hidden;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 16px;color:#1B2634;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Credenciales de acceso</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
                          <span style="color:#718096;font-size:13px;font-weight:600;">Usuario (correo)</span><br/>
                          <span style="color:#1B2634;font-size:16px;font-weight:700;font-family:monospace;">${user.email}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0 0;">
                          <span style="color:#718096;font-size:13px;font-weight:600;">Contraseña</span><br/>
                          <span style="color:#0781BE;font-size:16px;font-weight:700;font-family:monospace;background:#EBF8FF;padding:4px 10px;border-radius:8px;display:inline-block;margin-top:4px;">${user.password}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${platformUrl}/auth/login" style="display:inline-block;background:linear-gradient(135deg,#1B2634,#0781BE);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:50px;box-shadow:0 8px 20px rgba(7,129,190,0.28);">
                      Ingresar a la plataforma →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;color:#718096;font-size:13px;line-height:1.7;background:#fffbeb;border:1px solid #f6d860;border-radius:12px;padding:14px 18px;">
                <strong style="color:#92400e;">⚠ Importante:</strong> Por seguridad, te recomendamos cambiar tu contraseña después de tu primer inicio de sesión. Guarda estas credenciales en un lugar seguro.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f7f9fc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#a0aec0;font-size:12px;">Este correo fue generado automáticamente por la plataforma de gestión de <strong>Grupo Aral</strong>. Por favor no respondas este mensaje.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
        const { data: resendData, error } = await this.resend.emails.send({
            from,
            to: [user.email],
            subject: `Bienvenido a Grupo Aral · Tus credenciales de acceso`,
            html,
        });
        if (error) {
            this.logger.error(`Error enviando credenciales: ${JSON.stringify(error)}`);
            return;
        }
        this.logger.log(`Credenciales enviadas a ${user.email} id=${resendData?.id ?? '—'}`);
    }
    async notifyIncidentCreated(incidencia) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey)
            return;
        const to = (0, notifications_utils_1.splitEmails)(process.env.INCIDENT_NOTIFY_TO || process.env.REPORT_NOTIFY_TO);
        if (to.length === 0)
            return;
        const from = process.env.MAIL_FROM || 'Incidencias <onboarding@resend.dev>';
        const subject = `Nueva incidencia • ${incidencia.incidentNumber} • ${incidencia.storeName}`;
        const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1B2634">Nueva incidencia creada</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;font-weight:600;color:#555">Número</td><td style="padding:6px 0">${incidencia.incidentNumber}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;color:#555">Tienda</td><td style="padding:6px 0">${incidencia.storeName}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;color:#555">Ciudad</td><td style="padding:6px 0">${incidencia.city ?? '—'}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;color:#555">Tipo de mantenimiento</td><td style="padding:6px 0">${incidencia.maintenanceType}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;color:#555">Especialidad</td><td style="padding:6px 0">${incidencia.specialty ?? '—'}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;color:#555">Descripción</td><td style="padding:6px 0">${incidencia.description}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;color:#555">Prioridad</td><td style="padding:6px 0">${incidencia.priority}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;color:#555">Vence</td><td style="padding:6px 0">${incidencia.expirationAt ? new Date(incidencia.expirationAt).toLocaleString('es-CO') : '—'}</td></tr>
        </table>
      </div>`;
        const { data: resendData, error } = await this.resend.emails.send({
            from,
            to,
            subject,
            html,
        });
        if (error) {
            this.logger.error(`Resend incident created error: ${JSON.stringify(error)}`);
            return;
        }
        this.logger.log(`Incident created notification queued id=${resendData?.id ?? '—'}`);
    }
    async notifyIncidentExpired(incidencia) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey)
            return;
        const to = (0, notifications_utils_1.splitEmails)(process.env.INCIDENT_NOTIFY_TO || process.env.REPORT_NOTIFY_TO);
        if (to.length === 0)
            return;
        const from = process.env.MAIL_FROM || 'Incidencias <onboarding@resend.dev>';
        const subject = `⚠️ Incidencia vencida • ${incidencia.incidentNumber} • ${incidencia.storeName}`;
        const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#c0392b">Incidencia vencida sin resolver</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;font-weight:600;color:#555">Número</td><td style="padding:6px 0">${incidencia.incidentNumber}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;color:#555">Tienda</td><td style="padding:6px 0">${incidencia.storeName}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;color:#555">Ciudad</td><td style="padding:6px 0">${incidencia.city ?? '—'}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;color:#555">Tipo</td><td style="padding:6px 0">${incidencia.maintenanceType}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;color:#555">Descripción</td><td style="padding:6px 0">${incidencia.description}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;color:#555">Estado</td><td style="padding:6px 0">${incidencia.status}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;color:#555">Venció</td><td style="padding:6px 0">${incidencia.expirationAt ? new Date(incidencia.expirationAt).toLocaleString('es-CO') : '—'}</td></tr>
        </table>
      </div>`;
        const { data: resendData, error } = await this.resend.emails.send({
            from,
            to,
            subject,
            html,
        });
        if (error) {
            this.logger.error(`Resend incident expired error: ${JSON.stringify(error)}`);
            return;
        }
        this.logger.log(`Incident expired notification queued id=${resendData?.id ?? '—'}`);
    }
};
exports.ReportNotificationsService = ReportNotificationsService;
exports.ReportNotificationsService = ReportNotificationsService = ReportNotificationsService_1 = __decorate([
    (0, common_1.Injectable)()
], ReportNotificationsService);
//# sourceMappingURL=notifications.service.js.map