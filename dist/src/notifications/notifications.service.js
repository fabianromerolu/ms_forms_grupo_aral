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