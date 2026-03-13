import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import {
  AnyObj,
  buildReportHtml,
  fetchAsBase64,
  getErrorMessage,
  getNestedObject,
  normalizeIncidencias,
  splitEmails,
} from 'src/utils/notifications.utils';
import { safeText } from 'src/utils/reports.utils';

type SendEmailPayload = Parameters<Resend['emails']['send']>[0];

function sanitizeFilenamePart(value: unknown): string {
  return safeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDateForFilename(iso?: string): string {
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

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? '00';

  return `${get('day')}-${get('month')}-${get('year')}_${get('hour')}-${get('minute')}`;
}

function buildReportPdfFilename(report: AnyObj): string {
  const data = getNestedObject(report, 'data');
  const incidencias = normalizeIncidencias(report);

  const tienda = safeText(report['tienda'] || data['tienda'] || 'SIN-TIENDA');
  const createdAtIso = safeText(
    report['createdAt'] || data['createdAt'] || new Date().toISOString(),
  );

  const incidenciasPart = sanitizeFilenamePart(
    incidencias.join('-') || 'SIN-INCIDENCIA',
  );
  const tiendaPart = sanitizeFilenamePart(tienda || 'SIN-TIENDA');
  const fechaPart = formatDateForFilename(createdAtIso);

  return `Reporte-Asociado-A-${incidenciasPart}-${tiendaPart}-${fechaPart}.pdf`;
}

@Injectable()
export class ReportNotificationsService {
  private readonly logger = new Logger(ReportNotificationsService.name);
  private readonly resend = new Resend(process.env.RESEND_API_KEY ?? '');

  async notifyReportCreated(report: AnyObj): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY no está definido, no se enviará correo.',
      );
      return;
    }

    const to = splitEmails(process.env.REPORT_NOTIFY_TO);
    if (to.length === 0) {
      this.logger.warn(
        'REPORT_NOTIFY_TO no está definido, no se enviará correo.',
      );
      return;
    }

    const from = process.env.MAIL_FROM || 'Reportes <onboarding@resend.dev>';
    const subjectPrefix =
      process.env.REPORT_NOTIFY_SUBJECT_PREFIX || 'Nuevo reporte';

    const incidencias = normalizeIncidencias(report);
    const data = getNestedObject(report, 'data');
    const tienda = safeText(report['tienda'] || data['tienda'] || '—').trim();

    const incidenciaLabel =
      incidencias.length <= 1
        ? `Incidencia ${incidencias[0] || '—'}`
        : `${incidencias.length} incidencias`;

    const html = buildReportHtml(report);

    const pdfUrl = safeText(report['responsablePdfUrl']).trim();
    const attachmentFilename = buildReportPdfFilename(report);

    let attachments: SendEmailPayload['attachments'];

    if (pdfUrl) {
      try {
        const { base64 } = await fetchAsBase64(pdfUrl, 20000);

        attachments = [
          {
            filename: attachmentFilename,
            content: base64,
            contentType: 'application/pdf',
          },
        ];

        this.logger.log(`Adjunto PDF renombrado a: ${attachmentFilename}`);
      } catch (error: unknown) {
        this.logger.error(`No se pudo adjuntar PDF: ${getErrorMessage(error)}`);
      }
    }

    const payload: SendEmailPayload = {
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

    this.logger.log(
      `Resend queued id=${resendData?.id ?? '—'} to=${to.join(', ')}`,
    );
  }
}
