# SDD 06 — Motor de LaTeX, Pipeline, Exportación PDF/Word y Renderizado

Este documento describe la arquitectura del motor de compilación, el parsing bidireccional entre código LaTeX y componentes visuales, la exportación a PDF y Microsoft Word (`.docx` OpenXML + OMML), y el pipeline de renderizado reactivo de **Layratex**.

---

## 6.1 Arquitectura del Pipeline de Edición Híbrida

Layratex permite que el usuario alterne libremente entre el editor de código LaTeX, el editor visual estructurado por bloques sobre hoja A4 y una vista previa reactiva.

```mermaid
flowchart TD
    subgraph EntradaUsuario["Entradas de Usuario"]
        CodeInput["Editor de Código Monolítico / Split (CodeMirror 6)"]
        VisualInput["Editor Visual WYSIWYM A4 (PaperEditor)"]
    end

    subgraph CoreEngine["Motor de Transpilación y AST (latexConverter)"]
        AST["Árbol de Bloques Estructurados Layratex"]
        Parser["Parser LaTeX con soporte de llaves balanceadas"]
        Serializer["Generador de LaTeX canónico con preservación de preámbulo"]
    end

    subgraph PipelineSalida["Pipeline de Salida Multi-Formato"]
        QuickPreview["Previsualizador Reactivo Rápido (< 10 ms)\n(KaTeX + Estética article HTML/CSS)"]
        FullCompiler["Compilador Nativo LaTeX\n(Tectonic / TeXLive / MiKTeX Worker)"]
        AutonomousPDF["Motor Tipográfico Autónomo PDF\n(Exportación A4 Zero-Dependency)"]
        WordExporter["Motor OpenXML Microsoft Word (.docx)\n(Ecuaciones Editables OMML <m:oMath>)"]
        Diagnostic["Analizador de Logs y Diagnósticos"]
        PDFViewer["Visor PDF Nativo / Canvas"]
    end

    CodeInput <-->|"Edición directa de texto"| Parser
    VisualInput <-->|"Mutación de bloques"| AST
    
    Parser --> AST
    AST --> Serializer
    Serializer --> CodeInput

    AST --> QuickPreview
    AST --> AutonomousPDF
    AST --> WordExporter
    Serializer --> FullCompiler
    FullCompiler --> PDFViewer
    AutonomousPDF --> PDFViewer
    FullCompiler --> Diagnostic
    Diagnostic --> CodeInput
```

---

## 6.2 Parser Bidireccional y Preservación Round-Trip

Uno de los mayores retos en editores LaTeX visuales es no destruir el formato original, comentarios ni macros personalizadas del usuario.

### Principios del Parser Layratex (`latexConverter.ts`):
1. **Preservación de Preámbulo y Llaves Anidadas:** `extractLatexMetadata` analiza comandos `\title{...}`, `\author{...}` y `\date{...}` mediante conteo de llaves balanceadas, permitiendo comandos anidados como `\textbf{...}` o matemáticas `$...$` dentro del título. Al guardar desde el modo visual, `visualToLatex` conserva intactos los paquetes personalizados (`\usepackage{...}`) del preámbulo original.
2. **Limpieza Inteligente de Comentarios:** Los comentarios de línea `%` no escapados se filtran al proyectar la hoja visual mientras que los porcentajes literales `\%` se preservan como `%`.
3. **Entornos Académicos AMS y Tablas `booktabs`:** Reconoce y transpila bidireccionalmente `\begin{abstract}`, `\begin{theorem}`, `\begin{definition}`, `\begin{lemma}`, `\begin{proof}` y tablas científicas con `\toprule`, `\midrule` y `\bottomrule`.

---

## 6.3 Estrategia de Renderizado y Exportación en 3 Niveles

Para satisfacer el requisito de latencia inferior a 200 ms (**RNF-04**) y ofrecer interoperabilidad editorial completa, la salida se organiza en tres canales:

| Nivel | Mecanismo | Latencia | Propósito |
| :--- | :--- | :--- | :--- |
| **Nivel 1: Live Preview Incremental** | Motor reactivo local (KaTeX + numeración automática de secciones y ecuaciones estilo `article`). | **< 10 - 50 ms** | Retroalimentación instantánea mientras el usuario redacta en tiempo real. |
| **Nivel 2: Compilación PDF Dual (Nativa + Autónoma)** | Invocación asíncrona de `tectonic`/`pdflatex` en Rust con fallback automático al motor autónomo A4 (`pdfExportService`). | **0.4 - 2.5 s** | Generación de documentos PDF A4 listos para publicación e impresión. |
| **Nivel 3: Exportación Microsoft Word (`.docx` OMML)** | Generador OpenXML ZIP en memoria (`wordExportService`) con transpilador LaTeX $\rightarrow$ Office Math (`<m:oMath>`). | **< 50 ms** | Intercambio con revisores y revistas que exigen manuscritos `.docx` con fórmulas nativas editables. |

---

## 6.4 Analizador Inteligente de Diagnósticos de Compilación

La salida estándar de los compiladores LaTeX tradicionales suele ser críptica (`Transcript/Log` de miles de líneas).

Layratex integra un `LaTeXLogParser` reactivo que:
1. Detecta patrones estándar: `! LaTeX Error: <mensaje>` y `l.<línea_número> <contexto>`.
2. Clasifica eventos en Errores críticos, Advertencias (`LaTeX Warning`) y Cajas Desbordadas (`Overfull/Underfull \hbox`).
3. Permite navegar directamente a la línea afectada en el editor CodeMirror 6 con un solo clic.
