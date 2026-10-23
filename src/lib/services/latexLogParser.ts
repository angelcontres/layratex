export type LogIssueType = 'error' | 'warning' | 'badbox';

export interface LogIssue {
  id: string;
  type: LogIssueType;
  message: string;
  line: number | null;
  file?: string;
  detail?: string;
}

/**
 * Parsea el contenido del archivo .log o stdout/stderr de una compilación LaTeX
 * y extrae los errores críticos, advertencias y avisos de Bad Boxes con su respectiva línea.
 */
export function parseLatexLog(rawLog: string): LogIssue[] {
  if (!rawLog || !rawLog.trim()) {
    return [];
  }

  const lines = rawLog.split(/\r?\n/);
  const issues: LogIssue[] = [];
  let idCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();

    // 1. Patrón: file-line-error (ej: ./document.tex:15: Undefined control sequence.)
    // O formatos como document.tex:15: error: ...
    const fileLineMatch = line.match(/^(?:\.\/)?([^:\s]+\.(?:tex|sty|cls|dtx)):(\d+):\s*(.+)$/i);
    if (fileLineMatch) {
      const file = fileLineMatch[1];
      const lineNum = parseInt(fileLineMatch[2], 10);
      const rawMsg = fileLineMatch[3].trim();

      // Recopilar líneas de detalle subsiguientes hasta línea vacía o nuevo error
      let detail = '';
      let j = i + 1;
      while (j < lines.length && lines[j].trim() !== '' && !lines[j].startsWith('!') && !lines[j].match(/^(?:\.\/)?([^:\s]+\.(?:tex|sty|cls|dtx)):(\d+):/)) {
        detail += (detail ? '\n' : '') + lines[j].trim();
        j++;
      }

      issues.push({
        id: `issue-${idCounter++}`,
        type: 'error',
        message: cleanErrorMessage(rawMsg),
        line: isNaN(lineNum) ? null : lineNum,
        file,
        detail: detail || undefined,
      });
      continue;
    }

    // 2. Patrón TeX tradicional: Línea que empieza con ! (ej: ! Undefined control sequence.)
    if (line.startsWith('!')) {
      const errorTitle = line.substring(1).trim();
      let errorLine: number | null = null;
      const detailLines: string[] = [];
      let j = i + 1;

      // Buscar número de línea en las siguientes líneas (ej: "l.15 \foo" o "l.15")
      while (j < lines.length && j < i + 15) {
        const nextLine = lines[j];
        if (nextLine.startsWith('!')) {
          // Inicia otro error
          break;
        }

        const lMatch = nextLine.match(/^l\.(\d+)(?:\s+(.*))?$/);
        if (lMatch) {
          errorLine = parseInt(lMatch[1], 10);
          if (lMatch[2]) {
            detailLines.push(`Código: ${lMatch[2].trim()}`);
          }
          break;
        }

        // También revisar si hay "on input line (\d+)"
        const inputLineMatch = nextLine.match(/on input line (\d+)/i);
        if (inputLineMatch) {
          errorLine = parseInt(inputLineMatch[1], 10);
        }

        if (nextLine.trim()) {
          detailLines.push(nextLine.trim());
        }
        j++;
      }

      // No añadir errores puramente informativos de cierre como "! ==> Fatal error occurred"
      if (!errorTitle.includes('Fatal error occurred') && !errorTitle.includes('Emergency stop')) {
        issues.push({
          id: `issue-${idCounter++}`,
          type: 'error',
          message: cleanErrorMessage(errorTitle),
          line: errorLine,
          detail: detailLines.length > 0 ? detailLines.join('\n') : undefined,
        });
      } else if (issues.length === 0) {
        // Si fue el único error reportado, incluirlo para no dejarlo vacío
        issues.push({
          id: `issue-${idCounter++}`,
          type: 'error',
          message: cleanErrorMessage(errorTitle),
          line: errorLine,
          detail: detailLines.length > 0 ? detailLines.join('\n') : undefined,
        });
      }
      continue;
    }

    // 3. Patrón: Advertencias (LaTeX Warning / Package Warning / Class Warning)
    const warningMatch = line.match(/(?:LaTeX|Package\s+[\w-]+|Class\s+[\w-]+)?\s*Warning:\s*(.+)$/i);
    if (warningMatch) {
      let warnMsg = warningMatch[1].trim();
      let warnLine: number | null = null;

      // Extraer línea si está en la misma línea (ej: "on input line 25.")
      const lineInMsg = warnMsg.match(/on input line (\d+)/i);
      if (lineInMsg) {
        warnLine = parseInt(lineInMsg[1], 10);
      } else {
        // O buscar en la siguiente línea si la advertencia continúa
        if (i + 1 < lines.length) {
          const nextL = lines[i + 1].trim();
          const nextMatch = nextL.match(/on input line (\d+)/i);
          if (nextMatch) {
            warnLine = parseInt(nextMatch[1], 10);
            warnMsg += ' ' + nextL;
          }
        }
      }

      issues.push({
        id: `issue-${idCounter++}`,
        type: 'warning',
        message: cleanWarningMessage(warnMsg),
        line: warnLine,
      });
      continue;
    }

    // 4. Patrón: Bad Boxes (Overfull / Underfull \hbox o \vbox)
    const badBoxMatch = line.match(/^(Overfull|Underfull)\s+\\([hv]box)\s*(.+)$/i);
    if (badBoxMatch) {
      const boxKind = badBoxMatch[1]; // Overfull o Underfull
      const boxType = badBoxMatch[2]; // hbox o vbox
      const rest = badBoxMatch[3];
      let boxLine: number | null = null;

      // Buscar patrones de línea como "lines 19--24" o "line 20"
      const linesMatch = rest.match(/lines?\s+(\d+)(?:--(\d+))?/i);
      if (linesMatch) {
        boxLine = parseInt(linesMatch[1], 10);
      }

      const description = `${boxKind} \\${boxType} ${rest}`.trim();

      issues.push({
        id: `issue-${idCounter++}`,
        type: 'badbox',
        message: description,
        line: boxLine,
      });
      continue;
    }

    // 5. Patrón alternativo para errores estilo Tectonic o CLI: "error: <file>:<line>: <msg>"
    const cliErrorMatch = line.match(/^error(?:\s*\[.*?\])?:\s*(?:(?:\.\/)?([^:\s]+\.(?:tex|sty|cls)):(\d+):\s*)?(.+)$/i);
    if (cliErrorMatch) {
      const file = cliErrorMatch[1];
      const lineNum = cliErrorMatch[2] ? parseInt(cliErrorMatch[2], 10) : null;
      const msg = cliErrorMatch[3].trim();

      issues.push({
        id: `issue-${idCounter++}`,
        type: 'error',
        message: cleanErrorMessage(msg),
        line: lineNum,
        file: file || undefined,
      });
      continue;
    }
  }

  // Deduplicación básica para evitar mensajes repetidos idénticos en la misma línea
  return deduplicateIssues(issues);
}

function cleanErrorMessage(msg: string): string {
  return msg
    .replace(/^LaTeX Error:\s*/i, '')
    .replace(/^Package\s+[\w-]+\s+Error:\s*/i, '')
    .trim();
}

function cleanWarningMessage(msg: string): string {
  return msg
    .replace(/\s+/g, ' ')
    .trim();
}

function deduplicateIssues(issues: LogIssue[]): LogIssue[] {
  const seen = new Set<string>();
  const result: LogIssue[] = [];

  for (const item of issues) {
    const key = `${item.type}:${item.line}:${item.message}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
}
