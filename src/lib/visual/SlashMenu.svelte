<script lang="ts">
  import { 
    Heading1, 
    Heading2, 
    Calculator, 
    Info, 
    List, 
    ListOrdered, 
    Minus, 
    Table 
  } from '@lucide/svelte';

  let {
    isOpen = $bindable(false),
    filter = '',
    onSelect = (action: string) => {},
    onClose = () => {}
  } = $props();

  const items = [
    { id: 'h1', title: 'Título Principal', desc: 'Encabezado grande para secciones principales', icon: Heading1 },
    { id: 'h2', title: 'Subtítulo', desc: 'Encabezado mediano para subtemas', icon: Heading2 },
    { id: 'math', title: 'Ecuación Matemática', desc: 'Fórmula centrada renderizada con KaTeX', icon: Calculator },
    { id: 'callout', title: 'Caja de Nota / Aviso', desc: 'Cuadro sombreado para recordatorios importantes', icon: Info },
    { id: 'bullet', title: 'Lista con Viñetas', desc: 'Lista simple de puntos clave', icon: List },
    { id: 'numbered', title: 'Lista Numerada', desc: 'Secuencia paso a paso ordenada', icon: ListOrdered },
    { id: 'divider', title: 'Línea Divisoria', desc: 'Separador horizontal limpio', icon: Minus }
  ];

  let selectedIndex = $state(0);

  let filteredItems = $derived(
    items.filter(item => 
      item.title.toLowerCase().includes(filter.toLowerCase()) || 
      item.id.toLowerCase().includes(filter.toLowerCase())
    )
  );

  export function handleKeyDown(e: KeyboardEvent): boolean {
    if (!isOpen) return false;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % (filteredItems.length || 1);
      return true;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + filteredItems.length) % (filteredItems.length || 1);
      return true;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        onSelect(filteredItems[selectedIndex].id);
      }
      return true;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return true;
    }
    return false;
  }
</script>

{#if isOpen && filteredItems.length > 0}
  <div class="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-xl shadow-2xl overflow-hidden w-72 text-gray-900 dark:text-[#c9d1d9] p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
    <div class="px-2.5 py-1 text-[10px] font-bold text-gray-400 dark:text-[#8b949e] uppercase tracking-wider">
      Insertar Bloque
    </div>
    <div class="space-y-0.5">
      {#each filteredItems as item, idx}
        {@const Icon = item.icon}
        <button
          type="button"
          class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs transition-colors {idx === selectedIndex ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'hover:bg-gray-100 dark:hover:bg-[#21262d] text-gray-700 dark:text-gray-300'}"
          onclick={() => onSelect(item.id)}
          onmouseenter={() => selectedIndex = idx}
        >
          <div class="p-1.5 rounded-md bg-gray-100 dark:bg-[#21262d] text-gray-600 dark:text-gray-300">
            <Icon size={14} />
          </div>
          <div class="truncate">
            <div class="font-semibold">{item.title}</div>
            <div class="text-[10px] text-gray-400 dark:text-[#8b949e] truncate">{item.desc}</div>
          </div>
        </button>
      {/each}
    </div>
  </div>
{/if}
