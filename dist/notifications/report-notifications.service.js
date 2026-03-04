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
function isHttpUrl(u) {
    return /^https?:\/\//i.test(u);
}
function buildLink(url, label) {
    const u = safeText(url).trim();
    if (!u)
        return '<em>—</em>';
    if (!isHttpUrl(u))
        return escapeHtml(label);
    return `<a href="${escapeHtml(u)}" style="color:#0864ad;font-weight:700;text-decoration:none;">${escapeHtml(label)}</a>`;
}
function buildEvidenceList(urls, prefix) {
    if (!Array.isArray(urls) || urls.length === 0)
        return '<em>—</em>';
    const items = urls.slice(0, 30).map((u, idx) => {
        const label = `Ver foto ${prefix} ${idx + 1}`;
        return `<li style="margin:6px 0;">${buildLink(u, label)}</li>`;
    });
    const more = urls.length > 30 ? `<li style="margin:6px 0;">+${urls.length - 30} más…</li>` : '';
    return `
    <ul style="margin:10px 0 0;padding-left:18px;">
      ${items.join('')}
      ${more}
    </ul>
  `;
}
function buildTable(rows) {
    const row = (k, v) => `
    <tr>
      <td style="padding:9px 10px;border-bottom:1px solid #eee;color:#555;font-weight:700;width:220px;">${escapeHtml(k)}</td>
      <td style="padding:9px 10px;border-bottom:1px solid #eee;color:#111;">${escapeHtml(safeText(v).trim() || '—')}</td>
    </tr>
  `;
    return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:10px;overflow:hidden;">
      ${rows.map(([k, v]) => row(k, v)).join('')}
    </table>
  `;
}
function buildReportHtml(r) {
    const data = r?.data ?? {};
    const resp = r?.responsable ?? {};
    const fotosAntes = (r?.fotos?.antes ?? r?.fotosAntes ?? []);
    const fotosDespues = (r?.fotos?.despues ?? r?.fotosDespues ?? []);
    const incidencia = safeText(data?.incidencia || r?.incidencia).trim() || '—';
    const tienda = safeText(data?.tienda || r?.tienda).trim() || '—';
    const tipo = safeText(data?.tipo || r?.tipo).trim() || '—';
    const subTipo = safeText(data?.subTipo || r?.subTipo).trim() || '—';
    const descInc = safeText(data?.descripcionIncidencia || r?.descripcionIncidencia).trim();
    const observaciones = safeText(r?.observaciones).trim();
    const nombreTec = safeText(data?.nombreTecnico || r?.nombreTecnico).trim();
    const cedulaTec = safeText(data?.cedulaTecnico || r?.cedulaTecnico).trim();
    const telTec = safeText(data?.telefonoTecnico || r?.telefonoTecnico).trim();
    const firmaTecnicoUrl = safeText(r?.firmaTecnicoUrl).trim();
    const firmaEncargadoUrl = safeText(r?.firmaEncargadoUrl).trim();
    const pdfUrl = safeText(r?.responsablePdfUrl || '').trim();
    const selloUrl = safeText(resp?.selloUrl).trim();
    const mainRows = [
        ['Incidencia', incidencia],
        ['Tienda', tienda],
        ['Tipo', tipo],
        ['Subtipo', subTipo],
    ];
    const tecnicoRows = [
        ['Nombre', nombreTec || '—'],
        ['Cédula', cedulaTec || '—'],
        ['Teléfono', telTec || '—'],
    ];
    const responsableRows = [
        ['Nombre', safeText(resp?.nombre).trim() || '—'],
        ['Cédula', safeText(resp?.cedula).trim() || '—'],
        ['Teléfono', safeText(resp?.telefono).trim() || '—'],
        ['Sello', selloUrl ? buildLink(selloUrl, 'Ver sello') : '—'],
    ];
    const firmasRows = [
        ['Firma técnico', firmaTecnicoUrl ? buildLink(firmaTecnicoUrl, 'Ver firma técnico') : '—'],
        ['Firma encargado', firmaEncargadoUrl ? buildLink(firmaEncargadoUrl, 'Ver firma encargado') : '—'],
    ];
    const pdfBlock = pdfUrl
        ? `<p style="margin:8px 0 0;">
         ${buildLink(pdfUrl, 'Abrir PDF compendio')}
         <span style="color:#6b7280;font-size:12px;"> (también va adjunto si el sistema pudo descargarlo)</span>
       </p>`
        : `<p style="margin:8px 0 0;color:#666;"><em>Sin PDF compendio</em></p>`;
    return `
  <div style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
    <div style="max-width:760px;margin:0 auto;background:#fff;border:1px solid #eee;border-radius:12px;overflow:hidden;">

      <div style="background:#0864ad;padding:18px 22px;color:#fff;">
        <h1 style="margin:0;font-size:20px;">Nuevo reporte de mantenimiento</h1>
        <p style="margin:6px 0 0;color:#dbeafe;font-size:13px;">
          ID: <b>${escapeHtml(safeText(r?.id || '—'))}</b>
        </p>
      </div>

      <div style="padding:18px 22px;color:#111;">
        <h2 style="margin:0 0 10px;font-size:16px;">Datos principales</h2>
        ${buildTable(mainRows)}

        <h2 style="margin:18px 0 10px;font-size:16px;">Descripción de la incidencia</h2>
        <div style="border:1px solid #eee;border-radius:10px;padding:12px;color:#111;line-height:1.5;">
          ${escapeHtml(descInc || '—')}
        </div>

        <h2 style="margin:18px 0 10px;font-size:16px;">Datos del técnico</h2>
        ${buildTable(tecnicoRows)}

        <h2 style="margin:18px 0 10px;font-size:16px;">Observaciones / descripción del trabajo</h2>
        <div style="border:1px solid #eee;border-radius:10px;padding:12px;color:#111;line-height:1.5;white-space:pre-wrap;">
          ${escapeHtml(observaciones || '—')}
        </div>

        <h2 style="margin:18px 0 10px;font-size:16px;">Responsable de tienda</h2>
        ${buildTable(responsableRows)}

        <h2 style="margin:18px 0 10px;font-size:16px;">Firmas</h2>
        ${buildTable(firmasRows)}

        <h2 style="margin:18px 0 10px;font-size:16px;">Evidencias fotográficas</h2>
        <div style="border:1px solid #eee;border-radius:10px;padding:12px;">
          <p style="margin:0;font-weight:800;">Antes (${Array.isArray(fotosAntes) ? fotosAntes.length : 0})</p>
          ${buildEvidenceList(fotosAntes, 'ANTES')}
          <p style="margin:14px 0 0;font-weight:800;">Después (${Array.isArray(fotosDespues) ? fotosDespues.length : 0})</p>
          ${buildEvidenceList(fotosDespues, 'DESPUÉS')}
        </div>

        <h2 style="margin:18px 0 10px;font-size:16px;">PDF Compendio</h2>
        <div style="border:1px solid #eee;border-radius:10px;padding:12px;">
          ${pdfBlock}
        </div>
      </div>

      <div style="background:#fafafa;padding:14px 22px;color:#666;font-size:12px;text-align:center;">
        Grupo Aral • Sistema de reportes
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
        const payload = {
            from,
            to,
            subject: `${subjectPrefix} • Incidencia ${incidencia} • ${tienda}`,
            html,
            ...(attachments ? { attachments } : {}),
        };
        const { data, error } = await this.resend.emails.send(payload);
        if (error) {
            this.logger.error(`Resend error: ${JSON.stringify(error)}`);
            return;
        }
        this.logger.log(`Resend queued id=${data?.id ?? '—'} to=${to.join(', ')}`);
    }
};
exports.ReportNotificationsService = ReportNotificationsService;
exports.ReportNotificationsService = ReportNotificationsService = ReportNotificationsService_1 = __decorate([
    (0, common_1.Injectable)()
], ReportNotificationsService);
//# sourceMappingURL=report-notifications.service.js.map