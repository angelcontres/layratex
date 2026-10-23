<script lang="ts">
  import { 
    Heading1, 
    Heading2, 
    Calculator, 
    Info, 
    List, 
    ListOrdered, 
    Minus, 
    Table,
    Image,
    Sparkles 
  } from '@lucide/svelte';

  let {
    isOpen = $bindable(false),
    filter = '',
    x = null as number | null,
    y = null as number | null,
    onSelect = (action: string) => {},
    onClose = () => {}
  } = $props();

  const items = [
    { 
      id: 'h1', 
      title: 'Título Principal', 
      desc: 'Encabezado grande para secciones del documento', 
      icon: Heading1,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
    },
    { 
      id: 'h2', 
      title: 'Subtítulo', 
      desc: 'Encabezado medio para subtemas', 
      icon: Heading2,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
    },
    { 
      id: 'math', 
      title: 'Fórmula Matemática', 
      desc: 'Ecuación centrada con editor visual KaTeX', 
      icon: Calculator,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
    },
    { 
      id: 'table', 
      title: 'Tabla / Cuadrícula', 
      desc: 'Insertar tabla visual de filas y columnas', 
      icon: Table,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    },
    { 
      id: 'image', 
      title: 'Imagen / Figura', 
      desc: 'Insertar imagen con pie explicativo', 
      icon: Image,
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
    },
    { 
      id: 'callout', 
      title: 'Caja de Nota / Aviso', 
      desc: 'Recuadro sombreado para recordatorios', 
      icon: Info,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    },
    { 
      id: 'bullet', 
      title: 'Lista con Viñetas', 
      desc: 'Lista simple de viñetas circulares', 
      icon: List,
      color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
    },
    { 
      id: 'numbered', 
      title: 'Lista Numerada', 
      desc: 'Secuencia ordenada paso a paso', 
      icon: ListOrdered,
      color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
    },
    { 
      id: 'divider', 
      title: 'Salto a Nueva Hoja A4', 
      desc: 'Comienza una nueva hoja de papel', 
      icon: Minus,
      color: 'bg-slate-500/10 text-slate-500'
    }
  ];

  let selectedIndex = $state(0);

  let filteredItems = $derived(
    items.filter(item => 
      item.title.toLowerCase().includes(filter.toLowerCase()) || 
      item.id.toLowerCase().includes(filter.toLowerCase()) ||
      item.desc.toLowerCase().includes(filter.toLowerCase())
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
  <div 
    class="fixed z-50 bg-white/95 dark:bg-[#161c28]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden w-80 text-slate-900 dark:text-[#c9d1d9] p-2 animate-in fade-in zoom-in-95 duration-100"
    style={x !== null && y !== null ? `left: ${x}px; top: ${y}px; max-height: 380px; overflow-y: auto;` : 'bottom: 2rem; left: 50%; transform: translateX(-50%); max-height: 380px; overflow-y: auto;'}
  >
    <div class="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-[#8b949e] uppercase tracking-wider flex items-center justify-between">
      <span>Insertar en la Hoja</span>
      <span class="text-indigo-500 font-mono text-[9px]">ESC para cerrar</span>
    </div>
    <div class="space-y-0.5">
      {#each filteredItems as item, idx}
        {@const Icon = item.icon}
        <button
          type="button"
          class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left text-xs transition-all cursor-pointer {idx === selectedIndex ? 'bg-indigo-50/80 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-medium' : 'hover:bg-slate-100/70 dark:hover:bg-[#1f2633] text-slate-700 dark:text-slate-300'}"
          onclick={() => onSelect(item.id)}
          onmouseenter={() => selectedIndex = idx}
        >
          <div class="w-7 h-7 rounded-lg {item.color} flex items-center justify-center shrink-0">
            <Icon size={15} />
          </div>
          <div class="truncate flex-1">
            <div class="font-semibold text-slate-900 dark:text-white leading-tight">{item.title}</div>
            <div class="text-[10px] text-slate-400 dark:text-[#8b949e] truncate leading-tight">{item.desc}</div>
          </div>
        </button>
      {/each}
    </div>
  </div>
{/if}
