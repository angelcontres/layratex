<script lang="ts">
  import { Zap, Wifi, HardDrive, CheckCircle2 } from '@lucide/svelte';

  let {
    lines = 0,
    words = 0,
    renderTimeMs = 0,
    p2pStatus = 'Local-First (Enjambre Activo)'
  } = $props();
</script>

<footer class="h-6 bg-[#161b22] border-t border-[#21262d] px-3 flex items-center justify-between text-[11px] text-[#8b949e] font-mono select-none">
  <div class="flex items-center gap-4">
    <div class="flex items-center gap-1.5 text-[#3fb950]">
      <CheckCircle2 size={12} />
      <span>{p2pStatus}</span>
    </div>
    <div class="flex items-center gap-1.5 text-[#58a6ff]">
      <Zap size={12} />
      <span>Preview: {renderTimeMs} ms</span>
    </div>
  </div>

  <div class="flex items-center gap-4">
    <span>Líneas: {lines}</span>
    <span>Palabras: {words}</span>
    <span class="text-[#e6edf3]">UTF-8</span>
    <span>LaTeX</span>
  </div>
</footer>
