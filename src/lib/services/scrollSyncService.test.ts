import {
  calculateScrollRatio,
  calculateTargetScrollTop,
  ScrollSyncCoordinator,
  type ScrollableElementLike
} from './scrollSyncService';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${msg}`);
  }
}

console.log('🧪 Iniciando pruebas unitarias de ScrollSyncService (TICKET-023)...\n');

// 1. Probar cálculo de ratio de scroll
{
  console.log('Testing calculateScrollRatio...');
  const elTop: ScrollableElementLike = { scrollTop: 0, scrollHeight: 1000, clientHeight: 200 };
  assert(calculateScrollRatio(elTop) === 0, 'Ratio en scrollTop 0 debe ser 0.0');

  const elMid: ScrollableElementLike = { scrollTop: 400, scrollHeight: 1000, clientHeight: 200 };
  assert(calculateScrollRatio(elMid) === 0.5, 'Ratio a la mitad debe ser 0.5');

  const elBottom: ScrollableElementLike = { scrollTop: 800, scrollHeight: 1000, clientHeight: 200 };
  assert(calculateScrollRatio(elBottom) === 1.0, 'Ratio al fondo debe ser 1.0');

  // Caso sin desbordamiento (scrollHeight <= clientHeight)
  const elNoOverflow: ScrollableElementLike = { scrollTop: 0, scrollHeight: 200, clientHeight: 200 };
  assert(calculateScrollRatio(elNoOverflow) === 0, 'Elemento sin scroll debe retornar ratio 0');

  // Clamping en caso de sobre-desplazamiento (bounce)
  const elNegative: ScrollableElementLike = { scrollTop: -50, scrollHeight: 1000, clientHeight: 200 };
  assert(calculateScrollRatio(elNegative) === 0, 'Scroll negativo debe clampearse a 0.0');

  const elOverflow: ScrollableElementLike = { scrollTop: 950, scrollHeight: 1000, clientHeight: 200 };
  assert(calculateScrollRatio(elOverflow) === 1.0, 'Scroll excedido debe clampearse a 1.0');

  console.log('  ✓ calculateScrollRatio validado correctamente en todos los casos');
}

// 2. Probar cálculo de targetScrollTop
{
  console.log('\nTesting calculateTargetScrollTop...');
  const targetEl: ScrollableElementLike = { scrollTop: 0, scrollHeight: 3000, clientHeight: 600 }; // maxScroll = 2400

  assert(calculateTargetScrollTop(0, targetEl) === 0, 'Target en ratio 0 debe ser 0');
  assert(calculateTargetScrollTop(0.5, targetEl) === 1200, 'Target en ratio 0.5 debe ser 1200');
  assert(calculateTargetScrollTop(1.0, targetEl) === 2400, 'Target en ratio 1.0 debe ser 2400 (maxScroll)');

  // Caso sin scroll
  const noScrollTarget: ScrollableElementLike = { scrollTop: 0, scrollHeight: 500, clientHeight: 500 };
  assert(calculateTargetScrollTop(0.7, noScrollTarget) === 0, 'Target sin scroll debe ser 0');

  console.log('  ✓ calculateTargetScrollTop validado con proporciones asimétricas');
}

// 3. Probar ScrollSyncCoordinator (prevención de bucles infinitos con debounce)
{
  console.log('\nTesting ScrollSyncCoordinator...');
  const coordinator = new ScrollSyncCoordinator({ debounceMs: 50, enabled: true });

  const editor: ScrollableElementLike = { scrollTop: 200, scrollHeight: 1000, clientHeight: 200 }; // maxScroll = 800 -> ratio 0.25
  const preview: ScrollableElementLike = { scrollTop: 0, scrollHeight: 2000, clientHeight: 400 }; // maxScroll = 1600 -> target 400

  // Primer sync desde editor hacia preview
  const synced1 = coordinator.sync(editor, preview, (top) => {
    preview.scrollTop = top;
  });
  assert(synced1 === true, 'El primer sync debe ejecutarse');
  assert(preview.scrollTop === 400, `preview.scrollTop debe ser 400, obtenido ${preview.scrollTop}`);
  assert(coordinator.getIsSyncing() === true, 'isScrollingViaSync debe estar activo');

  // Intento de eco inmediato desde preview hacia editor (debe ser bloqueado para evitar bucle)
  const synced2 = coordinator.sync(preview, editor, (top) => {
    editor.scrollTop = top;
  });
  assert(synced2 === false, 'El eco inmediato debe ser bloqueado por la bandera isScrollingViaSync');
  console.log('  ✓ Prevención de retroalimentación recursiva (anti-bucle) verificada');

  // Probar desactivación con toggle enabled = false
  coordinator.setEnabled(false);
  assert(coordinator.enabled === false, 'El coordinador debe estar deshabilitado');
  const syncedDisabled = coordinator.sync(editor, preview);
  assert(syncedDisabled === false, 'No debe sincronizar si está deshabilitado');
  console.log('  ✓ Conmutador de activación/desactivación verificado');

  coordinator.destroy();
}

console.log('\n🎉 TODAS LAS PRUEBAS DE SCROLL SYNC PASARON CON ÉXITO.\n');
