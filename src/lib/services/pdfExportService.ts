import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { save } from '@tauri-apps/plugin-dialog';
import { compilerService } from './compilerService';

export interface AutonomousPdfResult {
  success: boolean;
  pdfBase64: string;
  pdfBlobUrl: string;
  savedPath: string | null;
  tempPath: string | null;
  durationMs: number;
}

export const pdfExportService = {
  /**
   * Genera un PDF de alta fidelidad recorriendo las hojas A4 renderizadas en el DOM.
   * Si no se proporcionan elementos, busca los contenedores [data-paper-page] o .paper-sheet.
   */
  async exportFromDOM(
    elements: HTMLElement[], 
    suggestedName: string = 'documento.pdf'
  ): Promise<AutonomousPdfResult> {
    const startTime = performance.now();

    if (!elements || elements.length === 0) {
      throw new Error('No se encontraron páginas para renderizar el documento PDF.');
    }

    const cleanSuggestedName = suggestedName.toLowerCase().endsWith('.pdf')
      ? suggestedName
      : `${suggestedName}.pdf`;

    // Inicializar documento jsPDF en formato A4 vertical
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 210; // mm
    const pageHeight = 297; // mm

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (i > 0) {
        doc.addPage('a4', 'portrait');
      }

      // Renderizar el elemento DOM con html2canvas a alta resolución (escala 2x para nitidez tipográfica)
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    }

    const durationMs = Math.round(performance.now() - startTime);

    // Extraer base64 y blob
    const dataUri = doc.output('datauristring');
    const base64Data = dataUri.split(',')[1] || '';
    const arrayBuffer = doc.output('arraybuffer');
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const pdfBlobUrl = URL.createObjectURL(blob);

    // Guardar archivo temporal en Rust para visor integrado / visor del sistema
    let tempPath: string | null = null;
    try {
      tempPath = await compilerService.createTempPdfFromBytes(base64Data, cleanSuggestedName);
    } catch (e) {
      console.warn('No se pudo generar ruta temporal en Tauri:', e);
    }

    // Solicitar ubicación al usuario con diálogo nativo si estamos en Tauri
    let savedPath: string | null = null;
    if (compilerService.isNative()) {
      try {
        const target = await save({
          filters: [
            { name: 'Documento PDF (*.pdf)', extensions: ['pdf'] },
            { name: 'Todos los archivos (*.*)', extensions: ['*'] }
          ],
          defaultPath: cleanSuggestedName
        });

        if (target) {
          savedPath = await compilerService.savePdfBytes(base64Data, target);
        }
      } catch (err) {
        console.warn('Cancelado o error en guardado nativo:', err);
      }
    } else {
      // Descarga directa en navegador web
      compilerService.downloadPdfFromBase64(base64Data, cleanSuggestedName);
      savedPath = cleanSuggestedName;
    }

    return {
      success: true,
      pdfBase64: base64Data,
      pdfBlobUrl,
      savedPath,
      tempPath,
      durationMs
    };
  },

  /**
   * Invoca el diálogo de impresión nativo del sistema operativo (guardar como PDF vectorial)
   */
  printSystemDialog(): void {
    window.print();
  }
};
