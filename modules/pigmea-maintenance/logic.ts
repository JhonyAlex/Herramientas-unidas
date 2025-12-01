import Papa from 'papaparse';
import { CsvRow, PigmeaStats } from './types.ts';

// Nombres de columnas mapeados
const COL_ESTADO = "Estado";
const COL_FECHA_CREACION = "Fecha (Europe/Madrid +01:00)";
const COL_FECHA_SLA = "Fecha de Fin de SLA (Europe/Madrid +01:00)";
const COL_OBSERVACIONES = "Observaciones";
const COL_ORDEN_TRABAJO = "Orden de Trabajo";

const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  try {
    const [datePart, timePart] = dateStr.split(' ');
    const [day, month, year] = datePart.split('/');
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (timePart) {
      const [hour, minute, second] = timePart.split(':');
      d.setHours(parseInt(hour), parseInt(minute), parseInt(second) || 0);
    }
    return d;
  } catch (e) { return null; }
};

const countBusinessDaysBackwards = (fromDate: Date, toDate: Date): number => {
  let count = 0;
  let current = new Date(fromDate);
  current.setHours(0, 0, 0, 0);
  let end = new Date(toDate);
  end.setHours(0, 0, 0, 0);
  if (current > end) return 0;
  while (current < end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
};

const getPreviousWorkDay = (baseDate: Date): Date => {
  const d = new Date(baseDate);
  const dayOfWeek = d.getDay();
  if (dayOfWeek === 1) d.setDate(d.getDate() - 3);
  else if (dayOfWeek === 0) d.setDate(d.getDate() - 2);
  else d.setDate(d.getDate() - 1);
  return d;
};

const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};

const formatDateShort = (date: Date): string => {
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${date.getDate()} ${months[date.getMonth()]}`;
};

export const processCsvData = (file: File): Promise<PigmeaStats> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      delimiter: ";",
      skipEmptyLines: true,
      complete: function (results) {
        try {
          const data = results.data as CsvRow[];
          const today = new Date();
          const prevWorkDay = getPreviousWorkDay(today);
          const checkStartDate = new Date(today);
          checkStartDate.setDate(checkStartDate.getDate() - 15);
          checkStartDate.setHours(0, 0, 0, 0);

          let atrasadosDates: Date[] = [];

          let stats: PigmeaStats = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            date: today.toISOString().split('T')[0],
            pendientes: 0,
            atrasados: 0,
            espera: 0,
            enCurso: 0,
            terminadas: 0,
            nuevos: 0,
            rangoAtrasados: "",
            miguelOk: true,
            miguelMissingIds: [],
            prevDayName: prevWorkDay.getDay() === 5 ? "viernes" : "ayer"
          };

          data.forEach(row => {
            const estado = (row[COL_ESTADO] || "").trim().toLowerCase();
            const observaciones = (row[COL_OBSERVACIONES] || "").toLowerCase();
            const otId = row[COL_ORDEN_TRABAJO] || "??";
            const fechaCreacion = parseDate(row[COL_FECHA_CREACION]);
            const fechaFinSLA = parseDate(row[COL_FECHA_SLA]);

            // 1. Nuevos Generados Hoy
            if (fechaCreacion && isSameDay(fechaCreacion, today)) {
              stats.nuevos++;
            }

            // 2. Pendientes
            if (estado === 'nuevo') {
              stats.pendientes++;
              if (fechaCreacion) {
                const daysDiff = countBusinessDaysBackwards(fechaCreacion, today);
                if (daysDiff >= 3) {
                  stats.atrasados++;
                  atrasadosDates.push(fechaCreacion);
                }
              }
            }

            // 3. Espera & Curso
            if (estado.includes('espera')) stats.espera++;
            if (estado.includes('curso')) stats.enCurso++;

            // 4. Terminadas (Día laboral anterior)
            if ((estado === 'terminado' || estado === 'cerrado') && fechaFinSLA) {
              if (isSameDay(fechaFinSLA, prevWorkDay)) {
                stats.terminadas++;
              }

              // 5. Miguel Check
              let fechaRef = fechaFinSLA || fechaCreacion;
              if (fechaRef && fechaRef >= checkStartDate && fechaRef <= today) {
                if (!observaciones.includes("miguel")) {
                  stats.miguelMissingIds.push(otId);
                }
              }
            }
          });

          if (atrasadosDates.length > 0) {
            atrasadosDates.sort((a, b) => a.getTime() - b.getTime());
            const oldest = atrasadosDates[0];
            const newest = atrasadosDates[atrasadosDates.length - 1];
            if (isSameDay(oldest, newest)) {
              stats.rangoAtrasados = `(${formatDateShort(oldest)})`;
            } else {
              stats.rangoAtrasados = `(${formatDateShort(oldest)} - ${formatDateShort(newest)})`;
            }
          }

          stats.miguelOk = stats.miguelMissingIds.length === 0;
          resolve(stats);
        } catch (e) {
          reject(e);
        }
      },
      error: (err: any) => reject(err)
    });
  });
};

export const generateReportText = (stats: PigmeaStats): string => {
  let miguelText = "";
  if (stats.miguelOk) {
    miguelText = "✅ Revisiones por Miguel registradas.";
  } else {
    const ids = stats.miguelMissingIds.join(", ");
    miguelText = `⚠️ Falta revisión de Miguel en OTs: ${ids}`;
  }

  return `⏰ Preventivos pendientes: ${stats.pendientes}
⚠️ Preventivos atrasados: ${stats.atrasados} ${stats.rangoAtrasados} 🔔
🕒 OT en Espera: ${stats.espera}
➡️ OT en curso: ${stats.enCurso}
✅ OT terminadas ${stats.prevDayName}: ${stats.terminadas}

✅ Descripciones correctas (Motivo de fallo, como se solucionó)
${miguelText}`;
};