/**
 * Componentes de Interfaz de Usuario y Shell de Espacio de Trabajo (`src/lib/ui`)
 *
 * Contiene la barra lateral, cajones de navegación (archivos/P2P/ajustes),
 * barra de estado inferior, panel de errores de compilación y modales del sistema.
 */

export { default as Sidebar } from './Sidebar.svelte';
export { default as StatusBar } from './StatusBar.svelte';
export { default as ErrorPanel } from './ErrorPanel.svelte';
export { default as PreferencesModal } from './PreferencesModal.svelte';
export { default as WorkspaceDrawer } from './WorkspaceDrawer.svelte';
export { default as ExportModals, type CompiledExportArtifact } from './ExportModals.svelte';
