export type AnyObj = Record<string, unknown>;

export function isRecord(value: unknown): value is AnyObj {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function safeText(value: unknown): string {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => safeText(item))
      .filter(Boolean)
      .join(', ');
  }

  return '';
}

export function splitEmails(raw?: string): string[] {
  return safeText(raw)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function uniqueStrings(values: unknown[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const text = safeText(value).trim();
    if (!text || seen.has(text)) {
      continue;
    }

    seen.add(text);
    out.push(text);
  }

  return out;
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return uniqueStrings(value);
}

export function getNestedObject(source: AnyObj, key: string): AnyObj {
  const value = source[key];
  return isRecord(value) ? value : {};
}

export function normalizeIncidencias(report: AnyObj): string[] {
  const data = getNestedObject(report, 'data');

  return uniqueStrings([
    ...asStringArray(report['incidencias']),
    report['incidenciaPrincipal'],
    report['incidencia'],
    data['incidencia'],
    ...asStringArray(data['incidencias']),
  ]);
}

export function normalizeSubTipos(report: AnyObj): string[] {
  const data = getNestedObject(report, 'data');

  return uniqueStrings([
    ...asStringArray(report['subTipos']),
    report['subTipoPrincipal'],
    report['subTipo'],
    data['subTipo'],
    ...asStringArray(data['subTipos']),
  ]);
}

export async function fetchAsBase64(
  url: string,
  timeoutMs = 15000,
): Promise<{ base64: string; filename: string }> {
  const normalizedUrl = safeText(url).trim();
  if (!normalizedUrl) {
    throw new Error('URL de PDF vacía');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Fetch PDF HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return {
      base64,
      filename: `reporte_${Date.now()}.pdf`,
    };
  } finally {
    clearTimeout(timer);
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function buildLink(url: string, label: string): string {
  const normalizedUrl = safeText(url).trim();

  if (!normalizedUrl) {
    return '<em>—</em>';
  }

  if (!isHttpUrl(normalizedUrl)) {
    return escapeHtml(label);
  }

  return `<a href="${escapeHtml(
    normalizedUrl,
  )}" style="color:#0864ad;font-weight:700;text-decoration:none;">${escapeHtml(
    label,
  )}</a>`;
}

export function buildEvidenceList(urls: string[], prefix: string): string {
  if (!Array.isArray(urls) || urls.length === 0) {
    return '<em>—</em>';
  }

  const items = urls.slice(0, 30).map((url, index) => {
    const label = `Ver foto ${prefix} ${index + 1}`;
    return `<li style="margin:6px 0;">${buildLink(url, label)}</li>`;
  });

  const more =
    urls.length > 30
      ? `<li style="margin:6px 0;">+${urls.length - 30} más…</li>`
      : '';

  return `
    <ul style="margin:10px 0 0;padding-left:18px;">
      ${items.join('')}
      ${more}
    </ul>
  `;
}

export function buildBulletList(items: string[], emptyLabel = '—'): string {
  if (!Array.isArray(items) || items.length === 0) {
    return `<em>${escapeHtml(emptyLabel)}</em>`;
  }

  return `
    <ul style="margin:10px 0 0;padding-left:18px;">
      ${items
        .map(
          (item) =>
            `<li style="margin:6px 0;">${escapeHtml(safeText(item))}</li>`,
        )
        .join('')}
    </ul>
  `;
}

export function buildTable(
  rows: ReadonlyArray<readonly [string, unknown]>,
  opts?: { htmlValues?: boolean },
): string {
  const htmlValues = Boolean(opts?.htmlValues);

  const row = (key: string, value: unknown): string => {
    const rendered = htmlValues
      ? safeText(value).trim()
        ? String(value)
        : '<em>—</em>'
      : escapeHtml(safeText(value).trim() || '—');

    return `
      <tr>
        <td style="padding:9px 10px;border-bottom:1px solid #eee;color:#555;font-weight:700;width:220px;">${escapeHtml(
          key,
        )}</td>
        <td style="padding:9px 10px;border-bottom:1px solid #eee;color:#111;">${rendered}</td>
      </tr>
    `;
  };

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:10px;overflow:hidden;">
      ${rows.map(([key, value]) => row(key, value)).join('')}
    </table>
  `;
}

export function buildReportHtml(report: AnyObj): string {
  const data = getNestedObject(report, 'data');
  const responsable = getNestedObject(report, 'responsable');
  const fotos = getNestedObject(report, 'fotos');

  const fotosAntes = uniqueStrings([
    ...asStringArray(fotos['antes']),
    ...asStringArray(report['fotosAntes']),
  ]);

  const fotosDespues = uniqueStrings([
    ...asStringArray(fotos['despues']),
    ...asStringArray(report['fotosDespues']),
  ]);

  const incidencias = normalizeIncidencias(report);
  const subTipos = normalizeSubTipos(report);

  const tienda = safeText(data['tienda'] || report['tienda']).trim() || '—';
  const tipo = safeText(data['tipo'] || report['tipo']).trim() || '—';

  const descripcionIncidencia = safeText(
    data['descripcionIncidencia'] || report['descripcionIncidencia'],
  ).trim();

  const observaciones = safeText(report['observaciones']).trim();

  const nombreTecnico = safeText(
    data['nombreTecnico'] || report['nombreTecnico'],
  ).trim();

  const cedulaTecnico = safeText(
    data['cedulaTecnico'] || report['cedulaTecnico'],
  ).trim();

  const telefonoTecnico = safeText(
    data['telefonoTecnico'] || report['telefonoTecnico'],
  ).trim();

  const pdfUrl = safeText(report['responsablePdfUrl']).trim();
  const selloUrl = safeText(responsable['selloUrl']).trim();

  const mainRows: Array<readonly [string, unknown]> = [
    ['Tienda', tienda],
    ['Tipo', tipo],
    ['Total incidencias', incidencias.length || '—'],
    ['Total especialidades', subTipos.length || '—'],
  ];

  const tecnicoRows: Array<readonly [string, unknown]> = [
    ['Nombre', nombreTecnico || '—'],
    ['Cédula', cedulaTecnico || '—'],
    ['Teléfono', telefonoTecnico || '—'],
  ];

  const responsableRows: Array<readonly [string, unknown]> = [
    ['Nombre', safeText(responsable['nombre']).trim() || '—'],
    ['Cédula', safeText(responsable['cedula']).trim() || '—'],
    ['Teléfono', safeText(responsable['telefono']).trim() || '—'],
    ['Acta', selloUrl ? buildLink(selloUrl, 'Ver acta de entrega') : '—'],
  ];

  const pdfBlock = pdfUrl
    ? `<p style="margin:8px 0 0;">
         ${buildLink(pdfUrl, 'Descargar PDF Reporte')}
         <span style="color:#6b7280;font-size:12px;"> (también va adjunto si el sistema pudo descargarlo)</span>
       </p>`
    : '<p style="margin:8px 0 0;color:#666;"><em>Sin PDF Reporte</em></p>';

  return `
  <div style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
    <div style="max-width:760px;margin:0 auto;background:#fff;border:1px solid #eee;border-radius:12px;overflow:hidden;">

      <div style="background:#0864ad;padding:18px 22px;color:#fff;">
        <h1 style="margin:0;font-size:20px;">Nuevo reporte de mantenimiento</h1>
        <p style="margin:6px 0 0;color:#dbeafe;font-size:13px;">
          ID: <b>${escapeHtml(safeText(report['id']) || '—')}</b>
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
          ${escapeHtml(descripcionIncidencia || '—')}
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
          <p style="margin:0;font-weight:800;">Antes (${fotosAntes.length})</p>
          ${buildEvidenceList(fotosAntes, 'ANTES')}
          <p style="margin:14px 0 0;font-weight:800;">Después (${fotosDespues.length})</p>
          ${buildEvidenceList(fotosDespues, 'DESPUÉS')}
        </div>

        <h2 style="margin:18px 0 10px;font-size:16px;">PDF Reporte</h2>
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

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return safeText(error) || 'Error desconocido';
}
