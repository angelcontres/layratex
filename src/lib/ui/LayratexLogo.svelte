<script lang="ts">
  interface Props {
    size?: number;
    showText?: boolean;
    showBadge?: boolean;
    animated?: boolean;
    class?: string;
  }

  let {
    size = 28,
    showText = true,
    showBadge = true,
    animated = true,
    class: customClass = ''
  }: Props = $props();
</script>

<div class="inline-flex items-center gap-2.5 select-none group {customClass}">
  <!-- Contenedor del Logo SVG con Resplandor Insano -->
  <div 
    class="relative flex items-center justify-center shrink-0"
    style="width: {size}px; height: {size}px;"
  >
    <!-- Halo resplandeciente cibernético de fondo -->
    <div 
      class="absolute inset-0 rounded-xl bg-gradient-to-tr from-indigo-500/35 via-violet-500/25 to-amber-500/30 blur-[7px] opacity-75 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 pointer-events-none"
    ></div>

    <!-- SVG Vectorial Nativo de Layratex con micro-sombra y animación sutil -->
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 512 512" 
      width={size} 
      height={size}
      class="relative z-10 transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_2px_8px_rgba(99,102,241,0.4)]"
      aria-label="Layratex Logo"
    >
      <!-- Chasis oscuro técnico de fondo con borde ultra-fino -->
      <rect x="24" y="24" width="464" height="464" rx="108" fill="#090d16" stroke="#252f44" stroke-width="4" />

      <!-- Eje central de sincronización / split entre páginas -->
      <line x1="256" y1="96" x2="256" y2="416" stroke="#1e293b" stroke-width="3" stroke-dasharray="8 6" />

      <!-- HOJA IZQUIERDA: Silueta L & Código LaTeX local (#F8FAFC) -->
      <path d="M 190 106 L 100 106 L 100 406 L 230 406" fill="none" stroke="#f8fafc" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" />

      <!-- Líneas de código LaTeX local -->
      <line x1="124" y1="154" x2="210" y2="154" stroke="#384964" stroke-width="6.5" stroke-linecap="round" />
      <line x1="124" y1="184" x2="230" y2="184" stroke="#4f6382" stroke-width="6.5" stroke-linecap="round" />
      
      <!-- Línea de edición y Cursor activo en Ámbar Resplandeciente -->
      <line x1="124" y1="214" x2="160" y2="214" stroke="#384964" stroke-width="6.5" stroke-linecap="round" />
      <line x1="172" y1="200" x2="172" y2="228" stroke="#f59e0b" stroke-width="5.5" stroke-linecap="round" class={animated ? 'animate-pulse' : ''} />

      <line x1="124" y1="244" x2="218" y2="244" stroke="#263449" stroke-width="6.5" stroke-linecap="round" />
      <line x1="124" y1="274" x2="185" y2="274" stroke="#263449" stroke-width="6.5" stroke-linecap="round" />

      <!-- HOJA DERECHA: Borde técnico de cierre (#64748B) -->
      <path d="M 322 106 L 412 106 L 412 406 L 282 406" fill="none" stroke="#64748b" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" />

      <!-- Símbolo matemático renderizado (Integral / KaTeX) con gradiente cian/ámbar -->
      <path d="M 358 174 C 374 174 376 190 366 220 L 350 270 C 340 300 342 316 358 316" fill="none" stroke="#38bdf8" stroke-width="6.5" stroke-linecap="round" />
      <line x1="338" y1="245" x2="378" y2="245" stroke="#475569" stroke-width="5" stroke-linecap="round" />

      <!-- Nodo de presencia colaborativa P2P con halo ámbar -->
      <circle cx="388" cy="130" r="14" fill="#090d16" stroke="#818cf8" stroke-width="3.5" />
      <circle cx="388" cy="130" r="5" fill="#f59e0b" class={animated ? 'animate-ping' : ''} opacity="0.75" />
      <circle cx="388" cy="130" r="4.5" fill="#f59e0b" />
    </svg>
  </div>

  {#if showText}
    <div class="flex items-baseline gap-1.5 leading-none">
      <span class="font-bold text-sm tracking-tight text-white group-hover:text-indigo-200 transition-colors">
        Layra<span class="font-serif font-black text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]">T<sub class="text-[0.8em] text-cyan-300">E</sub>X</span>
      </span>

      {#if showBadge}
        <span class="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.15)] hidden sm:inline-block">
          P2P
        </span>
      {/if}
    </div>
  {/if}
</div>
