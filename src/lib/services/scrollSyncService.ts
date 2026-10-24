/**
 * Servicio de Sincronización Proporcional de Scroll Bidireccional (Scroll Sync)
 * TICKET-023: Permite que el editor CodeMirror 6 y la vista previa KaTeX / PDF
 * se desplacen proporcionalmente de manera suave, eliminando tirones y bucles infinitos.
 */

export interface ScrollableElementLike {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

/**
 * Calcula la posición porcentual de scroll normalizada entre 0.0 y 1.0.
 * Formula: scrollTop / (scrollHeight - clientHeight)
 */
export function calculateScrollRatio(el: ScrollableElementLike): number {
  const maxScroll = el.scrollHeight - el.clientHeight;
  if (maxScroll <= 0) return 0;
  const ratio = el.scrollTop / maxScroll;
  return Math.max(0, Math.min(1, ratio));
}

/**
 * Calcula la posición scrollTop destino dado un ratio normalizado.
 * Formula: round(ratio * (scrollHeight - clientHeight))
 */
export function calculateTargetScrollTop(ratio: number, el: ScrollableElementLike): number {
  const maxScroll = el.scrollHeight - el.clientHeight;
  if (maxScroll <= 0) return 0;
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  return Math.max(0, Math.min(maxScroll, Math.round(clampedRatio * maxScroll)));
}

export interface ScrollSyncOptions {
  debounceMs?: number;
  enabled?: boolean;
}

/**
 * Coordinador de Sincronización Bidireccional con bandera anti-bucle y debounce de 100 ms.
 */
export class ScrollSyncCoordinator {
  private isScrollingViaSync = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private debounceMs = 100;
  public enabled = true;

  constructor(options?: ScrollSyncOptions) {
    if (options?.debounceMs !== undefined) this.debounceMs = options.debounceMs;
    if (options?.enabled !== undefined) this.enabled = options.enabled;
  }

  /**
   * Sincroniza desde el elemento origen hacia el elemento destino.
   * Retorna true si la sincronización fue aplicada, o false si se ignoró (deshabilitado o en bucle).
   */
  public sync(
    source: ScrollableElementLike,
    target: ScrollableElementLike,
    applyScroll?: (targetTop: number) => void
  ): boolean {
    if (!this.enabled) return false;
    if (this.isScrollingViaSync) return false;

    const ratio = calculateScrollRatio(source);
    const targetTop = calculateTargetScrollTop(ratio, target);

    this.isScrollingViaSync = true;

    if (applyScroll) {
      applyScroll(targetTop);
    } else if ('scrollTop' in (target as any)) {
      target.scrollTop = targetTop;
    }

    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.isScrollingViaSync = false;
      this.debounceTimer = null;
    }, this.debounceMs);

    return true;
  }

  /**
   * Indica si actualmente hay un desplazamiento generado programáticamente por el sync.
   */
  public getIsSyncing(): boolean {
    return this.isScrollingViaSync;
  }

  /**
   * Activa o desactiva la sincronización.
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled && this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
      this.isScrollingViaSync = false;
    }
  }

  /**
   * Limpia timers al destruir el componente.
   */
  public destroy(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.isScrollingViaSync = false;
  }
}
