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
function safeText(v) {
    if (v == null)
        return '';
    return typeof v === 'string' ? v : String(v);
}
function splitEmails(raw) {
    return (raw || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
}
async function fetchAsBase64(url, timeoutMs = 15000) {
    const u = safeText(url).trim();
    if (!u)
        throw new Error('URL de PDF vacía');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(u, { signal: controller.signal });
        if (!res.ok)
            throw new Error(`Fetch PDF HTTP ${res.status}`);
        const ab = await res.arrayBuffer();
        const base64 = Buffer.from(ab).toString('base64');
        return { base64, filename: `compendio_${Date.now()}.pdf` };
    }
    finally {
        clearTimeout(timer);
    }
}
function escapeHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
function buildReportHtml(r) {
    const data = r?.data ?? {};
    const resp = r?.responsable ?? {};
    const fotosAntes = r?.fotos?.antes ?? r?.fotosAntes ?? [];
    const fotosDespues = r?.fotos?.despues ?? r?.fotosDespues ?? [];
    const extra = r?.extra ?? {};
    const incRemote = r?.incidenciaRemote ?? null;
    const row = (k, v) => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #eee;color:#555;font-weight:700;width:220px;">${escapeHtml(k)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eee;color:#111;">${escapeHtml(safeText(v) || '—')}</td>
    </tr>
  `;
    const links = (arr) => {
        if (!Array.isArray(arr) || !arr.length)
            return '<em>—</em>';
        return `<ul style="margin:8px 0 0;padding-left:18px;">
      ${arr.slice(0, 25).map((u) => `<li style="margin:4px 0;"><a href="${escapeHtml(u)}">${escapeHtml(u)}</a></li>`).join('')}
      ${arr.length > 25 ? `<li>+${arr.length - 25} más…</li>` : ''}
    </ul>`;
    };
    const pre = (obj) => `
    <pre style="margin:10px 0 0;background:#0b0f17;color:#e6e6e6;padding:12px;border-radius:10px;overflow:auto;font-size:12px;line-height:1.4;">
${escapeHtml(JSON.stringify(obj ?? {}, null, 2))}
    </pre>
  `;
    const pdfUrl = safeText(r?.responsablePdfUrl || '').trim();
    const pdfBlock = pdfUrl
        ? `<p style="margin:8px 0 0;"><a href="${escapeHtml(pdfUrl)}" style="color:#0864ad;font-weight:800;">Abrir PDF compendio</a></p>`
        : `<p style="margin:8px 0 0;color:#666;"><em>Sin PDF compendio</em></p>`;
    return `
  <div style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
    <div style="max-width:760px;margin:0 auto;background:#fff;border:1px solid #eee;border-radius:12px;overflow:hidden;">
      <div style="background:#0864ad;padding:18px 22px;color:#fff;">
        <h1 style="margin:0;font-size:20px;">Reporte creado</h1>
        <p style="margin:6px 0 0;color:#dbeafe;font-size:13px;">ID: <b>${escapeHtml(safeText(r?.id || '—'))}</b></p>
      </div>

      <div style="padding:18px 22px;color:#111;">
        <h2 style="margin:0 0 10px;font-size:16px;">Datos principales</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:10px;overflow:hidden;">
          ${row('Incidencia', data?.incidencia || r?.incidencia)}
          ${row('Tienda', data?.tienda || r?.tienda)}
          ${row('Tipo', data?.tipo || r?.tipo)}
          ${row('Subtipo', data?.subTipo || r?.subTipo)}
          ${row('Descripción incidencia', data?.descripcionIncidencia || r?.descripcionIncidencia)}
          ${row('Técnico', data?.nombreTecnico || r?.nombreTecnico)}
          ${row('Cédula técnico', data?.cedulaTecnico || r?.cedulaTecnico)}
          ${row('Teléfono técnico', data?.telefonoTecnico || r?.telefonoTecnico)}
          ${row('IP técnico', r?.tecnicoIp)}
          ${row('Departamento', data?.departamentoTienda || r?.departamentoTienda)}
          ${row('Ciudad', data?.ciudadTienda || r?.ciudadTienda)}
        </table>

        <h2 style="margin:18px 0 10px;font-size:16px;">Observaciones</h2>
        <div style="border:1px solid #eee;border-radius:10px;padding:12px;">
          ${escapeHtml(safeText(r?.observaciones || '—'))}
        </div>

        <h2 style="margin:18px 0 10px;font-size:16px;">Responsable</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:10px;overflow:hidden;">
          ${row('Nombre', resp?.nombre)}
          ${row('Cédula', resp?.cedula)}
          ${row('Teléfono', resp?.telefono)}
          ${row('Sello URL', resp?.selloUrl)}
        </table>

        <h2 style="margin:18px 0 10px;font-size:16px;">Evidencias</h2>
        <div style="border:1px solid #eee;border-radius:10px;padding:12px;">
          <p style="margin:0;font-weight:800;">Antes (${Array.isArray(fotosAntes) ? fotosAntes.length : 0})</p>
          ${links(fotosAntes)}
          <p style="margin:14px 0 0;font-weight:800;">Después (${Array.isArray(fotosDespues) ? fotosDespues.length : 0})</p>
          ${links(fotosDespues)}
        </div>

        <h2 style="margin:18px 0 10px;font-size:16px;">PDF Compendio</h2>
        <div style="border:1px solid #eee;border-radius:10px;padding:12px;">
          ${pdfBlock}
        </div>

        <h2 style="margin:18px 0 10px;font-size:16px;">Extra (JSON)</h2>
        ${pre(extra)}

        ${incRemote ? `<h2 style="margin:18px 0 10px;font-size:16px;">IncidenciaRemote (JSON)</h2>${pre(incRemote)}` : ''}
      </div>

      <div style="background:#fafafa;padding:14px 22px;color:#666;font-size:12px;text-align:center;">
        ms_forms_grupo_aral
      </div>
    </div>
  </div>
  `;
}
let ReportNotificationsService = ReportNotificationsService_1 = class ReportNotificationsService {
    logger = new common_1.Logger(ReportNotificationsService_1.name);
    resend = new resend_1.Resend(process.env.RESEND_API_KEY);
    async notifyReportCreated(report) {
        const to = splitEmails(process.env.REPORT_NOTIFY_TO);
        if (!to.length) {
            this.logger.warn('REPORT_NOTIFY_TO no está definido, no se enviará correo.');
            return;
        }
        const from = process.env.MAIL_FROM || 'Reportes <onboarding@resend.dev>';
        const subjectPrefix = process.env.REPORT_NOTIFY_SUBJECT_PREFIX || 'Nuevo reporte';
        const incidencia = safeText(report?.incidencia || report?.data?.incidencia || '—').trim();
        const tienda = safeText(report?.tienda || report?.data?.tienda || '—').trim();
        const html = buildReportHtml(report);
        const pdfUrl = safeText(report?.responsablePdfUrl || '').trim();
        let attachments;
        if (pdfUrl) {
            try {
                const { base64, filename } = await fetchAsBase64(pdfUrl, 20000);
                attachments = [{ filename, content: base64, contentType: 'application/pdf' }];
            }
            catch (err) {
                this.logger.error(`No se pudo adjuntar PDF: ${err?.message}`);
            }
        }
        const result = await this.resend.emails.send({
            from,
            to,
            subject: `${subjectPrefix} • Incidencia ${incidencia} • ${tienda}`,
            html,
            ...(attachments ? { attachments } : {}),
        });
        const data = result?.data ?? result;
        const error = result?.error;
        if (error) {
            this.logger.error(`Resend error: ${JSON.stringify(error)}`);
            return;
        }
        this.logger.log(`Email encolado Resend id=${data?.id ?? '—'} to=${to.join(', ')}`);
    }
};
exports.ReportNotificationsService = ReportNotificationsService;
exports.ReportNotificationsService = ReportNotificationsService = ReportNotificationsService_1 = __decorate([
    (0, common_1.Injectable)()
], ReportNotificationsService);
//# sourceMappingURL=report-notifications.service.js.map