import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

type AnyObj = Record<string, any>;

function safeText(v: any) {
  if (v == null) return '';
  return typeof v === 'string' ? v : String(v);
}

function splitEmails(raw?: string) {
  return (raw || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function uniqueStrings(values: any[]) {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const v of values) {
    const t = safeText(v).trim();
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }

  return out;
}

function normalizeIncidencias(r: AnyObj) {
  return uniqueStrings([
    ...(Array.isArray(r?.incidencias) ? r.incidencias : []),
    r?.incidenciaPrincipal,
    r?.incidencia,
    r?.data?.incidencia,
    ...(Array.isArray(r?.data?.incidencias) ? r.data.incidencias : []),
  ]);
}

function normalizeSubTipos(r: AnyObj) {
  return uniqueStrings([
    ...(Array.isArray(r?.subTipos) ? r.subTipos : []),
    r?.subTipoPrincipal,
    r?.subTipo,
    r?.data?.subTipo,
    ...(Array.isArray(r?.data?.subTipos) ? r.data.subTipos : []),
  ]);
}

async function fetchAsBase64(
  url: string,
  timeoutMs = 15000,
): Promise<{ base64: string; filename: string }> {
  const u = safeText(url).trim();
  if (!u) throw new Error('URL de PDF vacía');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(u, { signal: controller.signal });
    if (!res.ok) throw new Error(`Fetch PDF HTTP ${res.status}`);

    const ab = await res.arrayBuffer();
    const base64 = Buffer.from(ab).toString('base64');
    return { base64, filename: `compendio_${Date.now()}.pdf` };
  } finally {
    clearTimeout(timer);
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isHttpUrl(u: string) {
  return /^https?:\/\//i.test(u);
}

function buildLink(url: string, label: string) {
  const u = safeText(url).trim();
  if (!u) return '<em>—</em>';
  if (!isHttpUrl(u)) return escapeHtml(label);
  return `<a href="${escapeHtml(u)}" style="color:#0864ad;font-weight:700;text-decoration:none;">${escapeHtml(label)}</a>`;
}

function buildEvidenceList(urls: string[], prefix: string) {
  if (!Array.isArray(urls) || urls.length === 0) return '<em>—</em>';

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

function buildBulletList(items: string[], emptyLabel = '—') {
  if (!Array.isArray(items) || items.length === 0) return `<em>${escapeHtml(emptyLabel)}</em>`;

  return `
    <ul style="margin:10px 0 0;padding-left:18px;">
      ${items.map((item) => `<li style="margin:6px 0;">${escapeHtml(item)}</li>`).join('')}
    </ul>
  `;
}

function buildTable(rows: Array<[string, any]>, opts?: { htmlValues?: boolean }) {
  const htmlValues = !!opts?.htmlValues;

  const row = (k: string, v: any) => {
    const rendered =
      htmlValues
        ? (safeText(v).trim() ? String(v) : '<em>—</em>')
        : escapeHtml(safeText(v).trim() || '—');

    return `
      <tr>
        <td style="padding:9px 10px;border-bottom:1px solid #eee;color:#555;font-weight:700;width:220px;">${escapeHtml(k)}</td>
        <td style="padding:9px 10px;border-bottom:1px solid #eee;color:#111;">${rendered}</td>
      </tr>
    `;
  };

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:10px;overflow:hidden;">
      ${rows.map(([k, v]) => row(k, v)).join('')}
    </table>
  `;
}

function buildReportHtml(r: AnyObj) {
  const data = r?.data ?? {};
  const resp = r?.responsable ?? {};

  const fotosAntes = (r?.fotos?.antes ?? r?.fotosAntes ?? []) as string[];
  const fotosDespues = (r?.fotos?.despues ?? r?.fotosDespues ?? []) as string[];

  const incidencias = normalizeIncidencias(r);
  const subTipos = normalizeSubTipos(r);

  const tienda = safeText(data?.tienda || r?.tienda).trim() || '—';
  const tipo = safeText(data?.tipo || r?.tipo).trim() || '—';

  const descInc = safeText(data?.descripcionIncidencia || r?.descripcionIncidencia).trim();
  const observaciones = safeText(r?.observaciones).trim();

  const nombreTec = safeText(data?.nombreTecnico || r?.nombreTecnico).trim();
  const cedulaTec = safeText(data?.cedulaTecnico || r?.cedulaTecnico).trim();
  const telTec = safeText(data?.telefonoTecnico || r?.telefonoTecnico).trim();

  const pdfUrl = safeText(r?.responsablePdfUrl || '').trim();
  const selloUrl = safeText(resp?.selloUrl).trim();

  const mainRows: Array<[string, any]> = [
    ['Tienda', tienda],
    ['Tipo', tipo],
    ['Total incidencias', incidencias.length || '—'],
    ['Total especialidades', subTipos.length || '—'],
  ];

  const tecnicoRows: Array<[string, any]> = [
    ['Nombre', nombreTec || '—'],
    ['Cédula', cedulaTec || '—'],
    ['Teléfono', telTec || '—'],
  ];

  const responsableRows: Array<[string, any]> = [
    ['Nombre', safeText(resp?.nombre).trim() || '—'],
    ['Cédula', safeText(resp?.cedula).trim() || '—'],
    ['Teléfono', safeText(resp?.telefono).trim() || '—'],
    ['Acta', selloUrl ? buildLink(selloUrl, 'Ver acta de entrega') : '—'],
  ];

  const pdfBlock = pdfUrl
    ? `<p style="margin:8px 0 0;">
         ${buildLink(pdfUrl, 'Descargar PDF compendio')}
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

        <h2 style="margin:18px 0 10px;font-size:16px;">Incidencias asociadas</h2>
        <div style="border:1px solid #eee;border-radius:10px;padding:12px;color:#111;line-height:1.5;">
          ${buildBulletList(incidencias)}
        </div>

        <h2 style="margin:18px 0 10px;font-size:16px;">Especialidades del reporte</h2>
        <div style="border:1px solid #eee;border-radius:10px;padding:12px;color:#111;line-height:1.5;">
          ${buildBulletList(subTipos)}
        </div>

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
        ${buildTable(responsableRows, { htmlValues: true })}

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

@Injectable()
export class ReportNotificationsService {
  private readonly logger = new Logger(ReportNotificationsService.name);
  private readonly resend = new Resend(process.env.RESEND_API_KEY!);

  async notifyReportCreated(report: AnyObj) {
    const to = splitEmails(process.env.REPORT_NOTIFY_TO);
    if (!to.length) {
      this.logger.warn('REPORT_NOTIFY_TO no está definido, no se enviará correo.');
      return;
    }

    const from = process.env.MAIL_FROM || 'Reportes <onboarding@resend.dev>';
    const subjectPrefix = process.env.REPORT_NOTIFY_SUBJECT_PREFIX || 'Nuevo reporte';

    const incidencias = normalizeIncidencias(report);
    const tienda = safeText(report?.tienda || report?.data?.tienda || '—').trim();

    const incidenciaLabel =
      incidencias.length <= 1
        ? `Incidencia ${incidencias[0] || '—'}`
        : `${incidencias.length} incidencias`;

    const html = buildReportHtml(report);

    const pdfUrl = safeText(report?.responsablePdfUrl || '').trim();
    let attachments: Array<{ filename: string; content: string; contentType?: string }> | undefined;

    if (pdfUrl) {
      try {
        const { base64, filename } = await fetchAsBase64(pdfUrl, 20000);
        attachments = [{ filename, content: base64, contentType: 'application/pdf' }];
      } catch (err: any) {
        this.logger.error(`No se pudo adjuntar PDF: ${err?.message}`);
      }
    }

    const payload = {
      from,
      to,
      subject: `${subjectPrefix} • ${incidenciaLabel} • ${tienda}`,
      html,
      ...(attachments ? { attachments } : {}),
    };

    const { data, error } = await this.resend.emails.send(payload as any);

    if (error) {
      this.logger.error(`Resend error: ${JSON.stringify(error)}`);
      return;
    }

    this.logger.log(`Resend queued id=${data?.id ?? '—'} to=${to.join(', ')}`);
  }
}