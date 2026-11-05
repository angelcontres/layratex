<script lang="ts">
  import { 
    Heading1, 
    Heading2, 
    Heading3,
    Calculator, 
    Info, 
    List, 
    ListOrdered, 
    Minus, 
    Table,
    Image,
    BookOpen,
    Award,
    CheckSquare,
    FileText
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
      title: 'Sección Principal (\\section)', 
      desc: 'Encabezado numerado 1, 2, 3 estilo artículo LaTeX', 
      icon: Heading1,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
    },
    { 
      id: 'h2', 
      title: 'Subsección (\\subsection)', 
      desc: 'Encabezado secundario numerado 1.1, 1.2', 
      icon: Heading2,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
    },
    { 
      id: 'h3', 
      title: 'Subsubsección (\\subsubsection)', 
      desc: 'Encabezado de tercer nivel 1.1.1', 
      icon: Heading3,
      color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
    },
    { 
      id: 'abstract', 
      title: 'Resumen / Abstract (\\begin{abstract})', 
      desc: 'Bloque de resumen académico centrado con márgenes estrechos', 
      icon: FileText,
      color: 'bg-slate-500/10 text-slate-700 dark:text-slate-300'
    },
    { 
      id: 'math', 
      title: 'Ecuación Numerada (\\[ ... \\])', 
      desc: 'Fórmula centrada con numeración (1) a la derecha', 
      icon: Calculator,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
    },
    { 
      id: 'theorem', 
      title: 'Teorema (\\begin{theorem})', 
      desc: 'Entorno Teorema numerado en cursiva Computer Modern', 
      icon: Award,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    },
    { 
      id: 'definition', 
      title: 'Definición (\\begin{definition})', 
      desc: 'Entorno formal de Definición numerada', 
      icon: BookOpen,
      color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
    },
    { 
      id: 'proof', 
      title: 'Demostración Q.E.D. (\\begin{proof})', 
      desc: 'Demostración matemática con símbolo final ◻ (Q.E.D.)', 
      icon: CheckSquare,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    },
    { 
      id: 'table', 
      title: 'Tabla Booktabs (\\begin{tabular})', 
      desc: 'Cuadro científico con líneas horizontales \\toprule y \\bottomrule', 
      icon: Table,
      color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
    },
    { 
      id: 'image', 
      title: 'Figura con Pie (\\begin{figure})', 
      desc: 'Imagen centrada con numeración Figura 1: ...', 
      icon: Image,
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
    },
    { 
      id: 'callout', 
      title: 'Cita / Observación (\\begin{quote})', 
      desc: 'Bloque sangrado para citas o notas destacadas', 
      icon: Info,
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
    },
    { 
      id: 'bullet', 
      title: 'Lista con Viñetas (\\begin{itemize})', 
      desc: 'Lista de elementos con viñeta clásica TeX', 
      icon: List,
      color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
    },
    { 
      id: 'numbered', 
      title: 'Lista Numerada (\\begin{enumerate})', 
      desc: 'Secuencia enumerada 1., 2., 3.', 
      icon: ListOrdered,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
    },
    { 
      id: 'divider', 
      title: 'Salto de Página (\\newpage)', 
      desc: 'Comienza en una nueva hoja A4', 
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
    class="fixed z-50 bg-white/98 dark:bg-[#161c28]/98 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 rounded-md shadow-2xl overflow-hidden w-88 max-w-[calc(100vw-32px)] text-slate-900 dark:text-[#c9d1d9] p-1.5 animate-in fade-in zoom-in-95 duration-100"
    style={x !== null && y !== null ? `left: ${Math.min(Math.max(16, x), (typeof window !== 'undefined' ? window.innerWidth : 1200) - 360)}px; top: ${Math.min(Math.max(60, y), (typeof window !== 'undefined' ? window.innerHeight : 800) - 400)}px; max-height: min(380px, calc(100vh - 80px)); overflow-y: auto;` : 'bottom: 2rem; left: 50%; transform: translateX(-50%); max-height: min(380px, calc(100vh - 80px)); overflow-y: auto;'}
  >
    <div class="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-[#8b949e] uppercase tracking-wider flex items-center justify-between">
      <span>Entornos y Comandos LaTeX</span>
      <span class="text-indigo-500 font-mono text-[9px]">ESC para cerrar</span>
    </div>
    <div class="space-y-0.5">
      {#each filteredItems as item, idx}
        {@const Icon = item.icon}
        <button
          type="button"
          class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xs text-left text-xs transition-all cursor-pointer {idx === selectedIndex ? 'bg-indigo-50/90 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-medium' : 'hover:bg-slate-100/70 dark:hover:bg-[#1f2633] text-slate-700 dark:text-slate-300'}"
          onclick={() => onSelect(item.id)}
          onmouseenter={() => selectedIndex = idx}
        >
          <div class="w-7 h-7 rounded-xs {item.color} flex items-center justify-center shrink-0">
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
