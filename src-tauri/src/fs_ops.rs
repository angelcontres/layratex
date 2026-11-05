//! Módulo de Operaciones de Sistema de Archivos Nativo y Proyectos Multi-Carpeta (`fs_ops`)
//!
//! Centraliza:
//! 1. Lectura/escritura segura de documentos `.tex` individuales.
//! 2. Escaneo recursivo de Proyectos LaTeX Modulares (`main.tex`, `secciones/`, `capitulos/`,
//!    `figuras/`, `.bib`, `.cls`, `.sty` y carpeta `build/`).
//! 3. Resolución recursiva de `\input{...}` e `\include{...}` para que tanto el modo
//!    Hoja Visual (`PaperEditor`), la Vista Previa (`LatexPreview`) y la Exportación
//!    a PDF/Word (`.docx`) funcionen con proyectos divididos en carpetas.
//! 4. Generación automática de estructura de proyecto por carpetas + sincronización de `build/`.

use crate::compiler;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

/// Representa un archivo dentro de un proyecto LaTeX multi-carpeta.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectFileEntry {
    /// Ruta relativa al directorio raíz del proyecto (usando `/` como separador canónico)
    pub relative_path: String,
    /// Ruta absoluta en el sistema operativo
    pub full_path: String,
    /// Nombre del archivo (ej. `01-introduccion.tex`)
    pub name: String,
    /// Categoría: `"tex"`, `"bib"`, `"style"`, `"figure"`, `"build"`, `"other"`
    pub category: String,
    /// Indica si es el archivo maestro principal (`main.tex` o el que contiene `\documentclass`)
    pub is_main: bool,
}

/// Estado completo de un Proyecto LaTeX Multi-Carpeta cargado desde disco.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LatexProjectWorkspace {
    pub root_dir: String,
    pub project_name: String,
    pub main_tex_path: String,
    pub main_tex_name: String,
    /// Contenido crudo de `main.tex` (con los comandos `\input{...}` originales)
    pub raw_main_content: String,
    /// Contenido ensamblado con todos los `\input{...}` e `\include{...}` resueltos
    pub resolved_main_content: String,
    /// Lista ordenada de archivos del proyecto (incluyendo subcarpetas y `build/`)
    pub files: Vec<ProjectFileEntry>,
    /// Mapa `relative_path -> contenido UTF-8` para todos los archivos `.tex`, `.bib`, `.cls`, `.sty`
    pub tex_files_map: HashMap<String, String>,
    /// Ruta de la carpeta `build/` del proyecto
    pub build_dir: String,
}

/// Entrada de sub-archivo para crear o guardar un proyecto modular dividido por carpetas.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubFilePayload {
    pub relative_path: String,
    pub content: String,
}

/// Normaliza una ruta relativa para usar siempre barras `/` independientemente del SO.
pub fn normalize_rel_path(path: &Path) -> String {
    path.components()
        .map(|c| c.as_os_str().to_string_lossy().to_string())
        .collect::<Vec<_>>()
        .join("/")
}

/// Clasifica un archivo según su ruta relativa y extensión dentro de un proyecto LaTeX.
fn classify_project_file(rel_path: &str, ext: &str) -> String {
    let lower_rel = rel_path.to_lowercase();
    let lower_ext = ext.to_lowercase();

    if lower_rel.starts_with("build/")
        || lower_rel.starts_with("out/")
        || matches!(
            lower_ext.as_str(),
            "aux"
                | "log"
                | "toc"
                | "lof"
                | "lot"
                | "out"
                | "bbl"
                | "blg"
                | "fls"
                | "fdb_latexmk"
                | "synctex"
                | "gz"
                | "nav"
                | "snm"
        )
    {
        return "build".to_string();
    }

    match lower_ext.as_str() {
        "tex" | "latex" => "tex".to_string(),
        "bib" | "bst" => "bib".to_string(),
        "cls" | "sty" => "style".to_string(),
        "png" | "jpg" | "jpeg" | "svg" | "eps" => "figure".to_string(),
        "pdf" | "docx" => {
            if lower_rel.starts_with("fig")
                || lower_rel.starts_with("img")
                || lower_rel.starts_with("image")
                || lower_rel.starts_with("asset")
            {
                "figure".to_string()
            } else {
                "build".to_string()
            }
        }
        _ => "other".to_string(),
    }
}

/// Recorre recursivamente el directorio de un proyecto recopilando entradas y archivos de texto.
fn collect_project_entries(
    root: &Path,
    current: &Path,
    entries: &mut Vec<ProjectFileEntry>,
    text_map: &mut HashMap<String, String>,
) {
    let read_dir = match fs::read_dir(current) {
        Ok(rd) => rd,
        Err(_) => return,
    };

    for entry in read_dir.flatten() {
        let path = entry.path();
        let file_name = entry.file_name().to_string_lossy().to_string();

        // Ignorar carpetas ocultas o de dependencias pesadas
        if path.is_dir() {
            if file_name.starts_with('.')
                || matches!(
                    file_name.as_str(),
                    "node_modules" | "target" | "dist" | "__pycache__"
                )
            {
                continue;
            }
            collect_project_entries(root, &path, entries, text_map);
            continue;
        }

        if !path.is_file() {
            continue;
        }

        let rel = match path.strip_prefix(root) {
            Ok(r) => normalize_rel_path(r),
            Err(_) => file_name.clone(),
        };

        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_string();
        let category = classify_project_file(&rel, &ext);

        if matches!(category.as_str(), "tex" | "bib" | "style")
            || ext.eq_ignore_ascii_case("log")
            || ext.eq_ignore_ascii_case("toc")
            || ext.eq_ignore_ascii_case("aux")
        {
            if let Ok(text) = fs::read_to_string(&path) {
                text_map.insert(rel.clone(), text);
            }
        }

        entries.push(ProjectFileEntry {
            relative_path: rel,
            full_path: path.to_string_lossy().to_string(),
            name: file_name,
            category,
            is_main: false,
        });
    }
}

/// Resuelve recursivamente comandos `\input{ruta}` e `\include{ruta}` dentro de un documento `.tex`.
pub fn resolve_latex_inputs_from_map(
    content: &str,
    tex_map: &HashMap<String, String>,
    depth: usize,
) -> String {
    if depth > 8 {
        return content.to_string();
    }

    let mut output = String::with_capacity(content.len() + 512);

    for line in content.lines() {
        let trimmed = line.trim();
        // Si la línea está comentada, no expandir el \input
        if trimmed.starts_with('%') {
            output.push_str(line);
            output.push('\n');
            continue;
        }

        if let Some((cmd_kind, target_rel)) = extract_input_or_include_command(trimmed) {
            let normalized_target = target_rel.trim().replace('\\', "/");
            let candidate_with_tex = if normalized_target.to_lowercase().ends_with(".tex") {
                normalized_target.clone()
            } else {
                format!("{}.tex", normalized_target)
            };

            let matched_content = tex_map
                .get(&candidate_with_tex)
                .or_else(|| tex_map.get(&normalized_target))
                .cloned();

            if let Some(sub_content) = matched_content {
                let expanded_sub =
                    resolve_latex_inputs_from_map(&sub_content, tex_map, depth + 1);
                output.push_str(&format!(
                    "% === BEGIN {}: {} ===\n",
                    cmd_kind.to_uppercase(),
                    candidate_with_tex
                ));
                output.push_str(expanded_sub.trim());
                output.push_str(&format!(
                    "\n% === END {}: {} ===\n",
                    cmd_kind.to_uppercase(),
                    candidate_with_tex
                ));
                continue;
            }
        }

        output.push_str(line);
        output.push('\n');
    }

    output
}

/// Detecta si una línea contiene `\input{...}` o `\include{...}` y devuelve `("input"|"include", "ruta")`.
fn extract_input_or_include_command(line: &str) -> Option<(&'static str, String)> {
    // Quitar comentario al final de la línea si existe
    let clean_line = match line.find('%') {
        Some(idx) if idx > 0 && line.as_bytes()[idx - 1] != b'\\' => line[..idx].trim(),
        _ => line.trim(),
    };

    for (prefix, kind) in [("\\input{", "input"), ("\\include{", "include")] {
        if let Some(rest) = clean_line.strip_prefix(prefix) {
            if let Some(end_brace) = rest.find('}') {
                let inside = rest[..end_brace].trim().to_string();
                if !inside.is_empty() {
                    return Some((kind, inside));
                }
            }
        }
    }
    None
}

/// Escanea y carga un proyecto LaTeX multi-carpeta desde `root_dir`.
pub fn open_latex_project_internal(root_dir: &str) -> Result<LatexProjectWorkspace, String> {
    let root_path = Path::new(root_dir);
    if !root_path.exists() || !root_path.is_dir() {
        return Err(format!(
            "El directorio del proyecto no existe o no es una carpeta válida: {}",
            root_dir
        ));
    }

    let project_name = root_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("proyecto-latex")
        .to_string();

    // Asegurar que la carpeta build/ exista dentro del proyecto
    let build_dir_path = root_path.join("build");
    let _ = fs::create_dir_all(&build_dir_path);

    let mut files = Vec::new();
    let mut tex_files_map = HashMap::new();
    collect_project_entries(root_path, root_path, &mut files, &mut tex_files_map);

    // Determinar cuál es el archivo principal (main.tex o el que tiene \documentclass)
    let mut main_rel: Option<String> = None;

    // Prioridad 1: archivo .tex en la raíz con \documentclass y llamado main.tex / tesis.tex / article.tex
    let preferred_names = ["main.tex", "index.tex", "tesis.tex", "articulo.tex", "paper.tex"];
    for pref in preferred_names {
        if let Some(content) = tex_files_map.get(pref) {
            if content.contains("\\documentclass") {
                main_rel = Some(pref.to_string());
                break;
            }
        }
    }

    // Prioridad 2: cualquier archivo .tex que contenga \documentclass
    if main_rel.is_none() {
        let mut candidates: Vec<&String> = tex_files_map
            .iter()
            .filter(|(_, c)| c.contains("\\documentclass"))
            .map(|(k, _)| k)
            .collect();
        candidates.sort_by_key(|k| (k.matches('/').count(), k.len()));
        if let Some(best) = candidates.first() {
            main_rel = Some((*best).clone());
        }
    }

    // Prioridad 3: cualquier archivo .tex disponible
    if main_rel.is_none() {
        let mut all_tex: Vec<&String> = tex_files_map
            .keys()
            .filter(|k| k.to_lowercase().ends_with(".tex"))
            .collect();
        all_tex.sort_by_key(|k| (k.matches('/').count(), k.len()));
        if let Some(first) = all_tex.first() {
            main_rel = Some((*first).clone());
        }
    }

    // Si la carpeta no tenía ningún .tex todavía, creamos un main.tex inicial
    let chosen_main_rel = match main_rel {
        Some(rel) => rel,
        None => {
            let default_main = "\\documentclass[12pt,a4paper]{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amsmath,amssymb,amsthm,booktabs}\n\\title{Nuevo Proyecto LaTeX}\n\\author{Autor}\n\\date{\\today}\n\\begin{document}\n\\maketitle\n\n\\section{Introducción}\nContenido inicial del proyecto.\n\n\\end{document}\n".to_string();
            let main_file = root_path.join("main.tex");
            let _ = fs::write(&main_file, default_main.as_bytes());
            tex_files_map.insert("main.tex".to_string(), default_main);
            files.push(ProjectFileEntry {
                relative_path: "main.tex".to_string(),
                full_path: main_file.to_string_lossy().to_string(),
                name: "main.tex".to_string(),
                category: "tex".to_string(),
                is_main: true,
            });
            "main.tex".to_string()
        }
    };

    for f in &mut files {
        if f.relative_path == chosen_main_rel {
            f.is_main = true;
        }
    }

    // Ordenar archivos: main.tex primero, luego tex, bib, style, figure, build
    files.sort_by(|a, b| {
        let rank = |entry: &ProjectFileEntry| -> u8 {
            if entry.is_main {
                0
            } else {
                match entry.category.as_str() {
                    "tex" => 1,
                    "bib" => 2,
                    "style" => 3,
                    "figure" => 4,
                    "build" => 6,
                    _ => 5,
                }
            }
        };
        rank(a)
            .cmp(&rank(b))
            .then_with(|| a.relative_path.cmp(&b.relative_path))
    });

    let raw_main_content = tex_files_map
        .get(&chosen_main_rel)
        .cloned()
        .unwrap_or_default();
    let resolved_main_content =
        resolve_latex_inputs_from_map(&raw_main_content, &tex_files_map, 0);

    let main_full_path = root_path
        .join(chosen_main_rel.replace('/', std::path::MAIN_SEPARATOR_STR))
        .to_string_lossy()
        .to_string();
    let main_tex_name = Path::new(&chosen_main_rel)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("main.tex")
        .to_string();

    Ok(LatexProjectWorkspace {
        root_dir: root_path.to_string_lossy().to_string(),
        project_name,
        main_tex_path: main_full_path,
        main_tex_name,
        raw_main_content,
        resolved_main_content,
        files,
        tex_files_map,
        build_dir: build_dir_path.to_string_lossy().to_string(),
    })
}

/// Crea o actualiza en disco una estructura completa de Proyecto LaTeX Modular con
/// subcarpetas (`secciones/`, `figuras/`, `build/`), `main.tex`, sub-archivos `.tex`,
/// `referencias.bib` y artefactos iniciales en `build/`.
pub fn create_modular_project_internal(
    root_dir: &str,
    main_tex_content: &str,
    subfiles: Vec<SubFilePayload>,
    bib_content: Option<String>,
) -> Result<LatexProjectWorkspace, String> {
    let root = Path::new(root_dir);
    fs::create_dir_all(root)
        .map_err(|e| format!("No se pudo crear el directorio del proyecto ({}): {}", root_dir, e))?;

    let secciones_dir = root.join("secciones");
    let figuras_dir = root.join("figuras");
    let build_dir = root.join("build");

    let _ = fs::create_dir_all(&secciones_dir);
    let _ = fs::create_dir_all(&figuras_dir);
    let _ = fs::create_dir_all(&build_dir);

    // Escribir main.tex de forma atómica
    let main_path = root.join("main.tex");
    atomic_write_bytes(&main_path, main_tex_content.as_bytes())
        .map_err(|e| format!("No se pudo escribir main.tex: {}", e))?;

    // Escribir cada subarchivo en su subcarpeta (ej. secciones/01-introduccion.tex)
    for sub in &subfiles {
        let clean_rel = sub.relative_path.trim_start_matches('/').replace('\\', "/");
        let target = root.join(clean_rel.replace('/', std::path::MAIN_SEPARATOR_STR));
        if let Some(parent) = target.parent() {
            let _ = fs::create_dir_all(parent);
        }
        atomic_write_bytes(&target, sub.content.as_bytes())
            .map_err(|e| format!("Error al escribir sub-archivo {}: {}", sub.relative_path, e))?;
    }

    // Escribir referencias.bib si se proporcionó o si no existe aún
    let bib_path = root.join("referencias.bib");
    if let Some(bib) = bib_content {
        if !bib.trim().is_empty() || !bib_path.exists() {
            let _ = atomic_write_bytes(&bib_path, bib.as_bytes());
        }
    } else if !bib_path.exists() {
        let default_bib = "% Bibliografía BibTeX del Proyecto\n@article{knuth1984,\n  author  = {Donald E. Knuth},\n  title   = {Literate Programming},\n  journal = {The Computer Journal},\n  year    = {1984},\n  volume  = {27},\n  number  = {2},\n  pages   = {97--111}\n}\n";
        let _ = atomic_write_bytes(&bib_path, default_bib.as_bytes());
    }

    // Generar archivos auxiliares iniciales en build/ (main.aux, main.toc, main.log)
    let _ = write_build_metadata_files(&build_dir, "main", main_tex_content, &subfiles);

    open_latex_project_internal(root_dir)
}

/// Guarda de forma quirúrgica y atómica los cambios realizados sobre un proyecto existente
/// (respetando los nombres originales de carpetas y archivos como `chapters/01_intro.tex` o `secciones/...`).
pub fn save_project_changes_internal(
    root_dir: &str,
    main_tex_rel: &str,
    main_tex_content: &str,
    updated_subfiles: Vec<SubFilePayload>,
) -> Result<LatexProjectWorkspace, String> {
    let root = Path::new(root_dir);
    if !root.exists() {
        fs::create_dir_all(root).map_err(|e| {
            format!(
                "No se pudo crear o acceder al directorio del proyecto ({}): {}",
                root_dir, e
            )
        })?;
    }

    let clean_main_rel = if main_tex_rel.trim().is_empty() {
        "main.tex".to_string()
    } else {
        main_tex_rel.trim_start_matches('/').replace('\\', "/")
    };

    let main_path = root.join(clean_main_rel.replace('/', std::path::MAIN_SEPARATOR_STR));
    if let Some(parent) = main_path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    atomic_write_bytes(&main_path, main_tex_content.as_bytes())
        .map_err(|e| format!("Error al guardar {}: {}", clean_main_rel, e))?;

    for sub in &updated_subfiles {
        let clean_rel = sub.relative_path.trim_start_matches('/').replace('\\', "/");
        if clean_rel.is_empty() {
            continue;
        }
        let target = root.join(clean_rel.replace('/', std::path::MAIN_SEPARATOR_STR));
        if let Some(parent) = target.parent() {
            let _ = fs::create_dir_all(parent);
        }
        atomic_write_bytes(&target, sub.content.as_bytes())
            .map_err(|e| format!("Error al guardar sub-archivo {}: {}", clean_rel, e))?;
    }

    let build_dir = root.join("build");
    let stem = main_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("main");
    let _ = write_build_metadata_files(&build_dir, stem, main_tex_content, &updated_subfiles);

    open_latex_project_internal(root_dir)
}

/// Genera o actualiza archivos auxiliares estándar (`.aux`, `.toc`, `.log`) en la carpeta `build/`
/// para mantener la estructura de compilación sincronizada en cualquier modo.
pub fn write_build_metadata_files(
    build_dir: &Path,
    stem: &str,
    main_content: &str,
    subfiles: &[SubFilePayload],
) -> Result<(), String> {
    let _ = fs::create_dir_all(build_dir);

    let mut toc_lines = Vec::new();
    let mut aux_lines = vec!["\\relax".to_string()];
    let mut sec_num = 0usize;

    let combined = if subfiles.is_empty() {
        main_content.to_string()
    } else {
        let mut s = main_content.to_string();
        for sf in subfiles {
            s.push('\n');
            s.push_str(&sf.content);
        }
        s
    };

    for line in combined.lines() {
        let trimmed = line.trim();
        if let Some(rest) = trimmed.strip_prefix("\\section{") {
            if let Some(end) = rest.find('}') {
                sec_num += 1;
                let title = &rest[..end];
                toc_lines.push(format!(
                    "\\contentsline {{section}}{{\\numberline {{{}}}{}}}{{{}}}{{}}",
                    sec_num, title, sec_num
                ));
                aux_lines.push(format!(
                    "\\@writefile{{toc}}{{\\contentsline {{section}}{{\\numberline {{{}}}{}}}{{{}}}{{}}}}",
                    sec_num, title, sec_num
                ));
            }
        }
    }

    let aux_path = build_dir.join(format!("{}.aux", stem));
    let toc_path = build_dir.join(format!("{}.toc", stem));
    let log_path = build_dir.join(format!("{}.log", stem));

    if !aux_path.exists() || !toc_lines.is_empty() {
        let _ = fs::write(&aux_path, aux_lines.join("\n").as_bytes());
    }
    if !toc_path.exists() || !toc_lines.is_empty() {
        let _ = fs::write(&toc_path, toc_lines.join("\n").as_bytes());
    }
    if !log_path.exists() {
        let log_summary = format!(
            "This is Layratex Build Engine (Version 0.3.0)\nOutput directory: {}\nSections indexed: {}\nSubfiles linked: {}\nTranscript written on {}.log.\n",
            build_dir.to_string_lossy(),
            sec_num,
            subfiles.len(),
            stem
        );
        let _ = fs::write(&log_path, log_summary.as_bytes());
    }

    Ok(())
}

/// Limpia los archivos intermedios de compilación dentro de la carpeta `build/` del proyecto.
pub fn clean_project_build_dir_internal(root_dir: &str) -> Result<usize, String> {
    let build_dir = Path::new(root_dir).join("build");
    if !build_dir.exists() {
        return Ok(0);
    }

    let mut removed = 0usize;
    if let Ok(entries) = fs::read_dir(&build_dir) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_file() && fs::remove_file(&p).is_ok() {
                removed += 1;
            }
        }
    }
    Ok(removed)
}

/// Sincroniza un artefacto exportado (`.pdf` o `.docx`) también dentro de la carpeta `build/`
/// si el archivo destino o el proyecto cuenta con una carpeta `build/`.
fn sync_exported_artifact_to_build_dir(saved_file_path: &Path, bytes: &[u8]) {
    if let Some(parent) = saved_file_path.parent() {
        let parent_name = parent
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_lowercase();
        if parent_name == "build" {
            return;
        }
        let build_dir = parent.join("build");
        if build_dir.is_dir() {
            if let Some(fname) = saved_file_path.file_name() {
                let _ = fs::write(build_dir.join(fname), bytes);
            }
        }
    }
}

/// Lee el contenido UTF-8 de un archivo `.tex` en el sistema de archivos local.
pub fn read_tex_file_internal(path: &str) -> Result<String, String> {
    let p = std::path::Path::new(path);
    if !p.exists() {
        return Err(format!("El archivo especificado no existe: {}", path));
    }
    std::fs::read_to_string(p)
        .map_err(|e| format!("Error al leer el archivo LaTeX ({}): {}", path, e))
}

/// Escribe bytes en disco de forma atómica (`write-temp-then-rename`) para evitar
/// que un corte de energía o cierre abrupto deje archivos `.tex` truncados o en 0 bytes.
pub fn atomic_write_bytes(target_path: &Path, bytes: &[u8]) -> Result<(), String> {
    if let Some(parent) = target_path.parent() {
        if !parent.as_os_str().is_empty() {
            let _ = fs::create_dir_all(parent);
        }
    }

    let file_name = target_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("documento.tex");
    let epoch = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let tmp_name = format!(".{}.{}.layratex.tmp", file_name, epoch);
    let tmp_path = target_path.with_file_name(tmp_name);

    if fs::write(&tmp_path, bytes).is_ok() {
        if fs::rename(&tmp_path, target_path).is_ok() {
            return Ok(());
        }
        let _ = fs::remove_file(&tmp_path);
    }

    fs::write(target_path, bytes)
        .map_err(|e| format!("Error al guardar archivo en disco ({}): {}", target_path.display(), e))
}

/// Guarda el contenido de un documento LaTeX en disco asegurando la extensión `.tex`
/// (o extensiones afines del ecosistema TeX) mediante escritura atómica.
pub fn save_tex_file_internal(target_path: &str, content: &str) -> Result<String, String> {
    let mut dest = std::path::PathBuf::from(target_path);
    let has_valid_ext = dest
        .extension()
        .and_then(|e| e.to_str())
        .map(|s| {
            s.eq_ignore_ascii_case("tex")
                || s.eq_ignore_ascii_case("latex")
                || s.eq_ignore_ascii_case("bib")
                || s.eq_ignore_ascii_case("sty")
                || s.eq_ignore_ascii_case("cls")
        })
        .unwrap_or(false);

    if !has_valid_ext {
        dest.set_extension("tex");
    }

    atomic_write_bytes(&dest, content.as_bytes())?;

    Ok(dest.to_string_lossy().to_string())
}

/// Abre una ruta en la aplicación predeterminada del sistema operativo anfitrión.
pub fn open_path_internal(path: &str) -> Result<(), String> {
    let p = std::path::Path::new(path);
    if !p.exists() {
        return Err(format!("El archivo especificado no existe: {}", path));
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", path])
            .spawn()
            .map_err(|e| format!("Error al abrir archivo con visor predeterminado: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Error al abrir archivo con visor predeterminado: {}", e))?;
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        std::process::Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Error al abrir archivo con visor predeterminado: {}", e))?;
    }

    Ok(())
}

/// Copia un archivo PDF compilado desde un directorio temporal hacia la ruta elegida por el usuario.
pub fn export_pdf_internal(source_path: &str, target_path: &str) -> Result<String, String> {
    let src = std::path::Path::new(source_path);
    if !src.exists() {
        return Err(format!(
            "El archivo PDF de origen no existe: {}",
            source_path
        ));
    }

    let mut dest = std::path::PathBuf::from(target_path);
    let is_pdf = dest
        .extension()
        .and_then(|e| e.to_str())
        .map(|s| s.eq_ignore_ascii_case("pdf"))
        .unwrap_or(false);

    if !is_pdf {
        dest.set_extension("pdf");
    }

    if let Some(parent) = dest.parent() {
        if !parent.as_os_str().is_empty() {
            let _ = std::fs::create_dir_all(parent);
        }
    }

    std::fs::copy(src, &dest).map_err(|e| format!("Error al exportar archivo PDF: {}", e))?;
    if let Ok(bytes) = std::fs::read(&dest) {
        sync_exported_artifact_to_build_dir(&dest, &bytes);
    }

    Ok(dest.to_string_lossy().to_string())
}

/// Decodifica y guarda un documento PDF codificado en Base64 directamente en disco.
pub fn save_pdf_bytes_internal(pdf_base64: &str, target_path: &str) -> Result<String, String> {
    let mut dest = std::path::PathBuf::from(target_path);
    let is_pdf = dest
        .extension()
        .and_then(|e| e.to_str())
        .map(|s| s.eq_ignore_ascii_case("pdf"))
        .unwrap_or(false);

    if !is_pdf {
        dest.set_extension("pdf");
    }

    if let Some(parent) = dest.parent() {
        if !parent.as_os_str().is_empty() {
            let _ = std::fs::create_dir_all(parent);
        }
    }

    let bytes = compiler::decode_base64(pdf_base64)
        .ok_or_else(|| "Error al decodificar contenido base64 del PDF".to_string())?;

    std::fs::write(&dest, &bytes)
        .map_err(|e| format!("Error al escribir el archivo PDF en disco: {}", e))?;

    sync_exported_artifact_to_build_dir(&dest, &bytes);

    Ok(dest.to_string_lossy().to_string())
}

/// Crea un archivo PDF temporal a partir de bytes en Base64 para abrirlo en el visor del sistema.
pub fn create_temp_pdf_internal(
    pdf_base64: &str,
    filename: Option<String>,
) -> Result<String, String> {
    let bytes = compiler::decode_base64(pdf_base64)
        .ok_or_else(|| "Error al decodificar contenido base64".to_string())?;

    let name = filename.unwrap_or_else(|| "documento.pdf".to_string());
    let clean_name = if name.to_lowercase().ends_with(".pdf") {
        name
    } else {
        format!("{}.pdf", name)
    };

    let temp_dir = std::env::temp_dir();
    let epoch = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let file_path = temp_dir.join(format!(
        "layratex_{}_{}_{}",
        std::process::id(),
        epoch,
        clean_name
    ));

    std::fs::write(&file_path, bytes)
        .map_err(|e| format!("Error al escribir archivo temporal: {}", e))?;

    Ok(file_path.to_string_lossy().to_string())
}

/// Decodifica y guarda un documento Microsoft Word (`.docx`) en disco asegurando la extensión.
pub fn save_docx_bytes_internal(docx_base64: &str, target_path: &str) -> Result<String, String> {
    let mut dest = std::path::PathBuf::from(target_path);
    let is_docx = dest
        .extension()
        .and_then(|e| e.to_str())
        .map(|s| s.eq_ignore_ascii_case("docx"))
        .unwrap_or(false);

    if !is_docx {
        dest.set_extension("docx");
    }

    if let Some(parent) = dest.parent() {
        if !parent.as_os_str().is_empty() {
            let _ = std::fs::create_dir_all(parent);
        }
    }

    let bytes = compiler::decode_base64(docx_base64).ok_or_else(|| {
        "Error al decodificar contenido base64 del documento Word (.docx)".to_string()
    })?;

    std::fs::write(&dest, &bytes)
        .map_err(|e| format!("Error al escribir el archivo Word (.docx) en disco: {}", e))?;

    sync_exported_artifact_to_build_dir(&dest, &bytes);

    Ok(dest.to_string_lossy().to_string())
}

/// Crea un archivo `.docx` temporal para poder abrirlo con Microsoft Word o LibreOffice.
pub fn create_temp_docx_internal(
    docx_base64: &str,
    filename: Option<String>,
) -> Result<String, String> {
    let bytes = compiler::decode_base64(docx_base64)
        .ok_or_else(|| "Error al decodificar contenido base64 del documento Word".to_string())?;

    let name = filename.unwrap_or_else(|| "documento.docx".to_string());
    let clean_name = if name.to_lowercase().ends_with(".docx") {
        name
    } else {
        format!("{}.docx", name)
    };

    let temp_dir = std::env::temp_dir();
    let epoch = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let file_path = temp_dir.join(format!(
        "layratex_{}_{}_{}",
        std::process::id(),
        epoch,
        clean_name
    ));

    std::fs::write(&file_path, bytes)
        .map_err(|e| format!("Error al escribir archivo Word temporal: {}", e))?;

    Ok(file_path.to_string_lossy().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn test_read_and_save_tex_file() {
        let epoch = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let target_no_ext = std::env::temp_dir().join(format!("test_doc_{}", epoch));
        let sample_tex = "\\documentclass{article}\n\\begin{document}\nHola LaTeX\n\\end{document}";

        let saved_res = save_tex_file_internal(&target_no_ext.to_string_lossy(), sample_tex);
        assert!(saved_res.is_ok());
        let saved_path = saved_res.unwrap();
        assert!(saved_path.ends_with(".tex"));

        let read_res = read_tex_file_internal(&saved_path);
        assert!(read_res.is_ok());
        assert_eq!(read_res.unwrap(), sample_tex);

        let _ = fs::remove_file(&saved_path);
    }

    #[test]
    fn test_create_and_open_modular_project_with_subfolders_and_build() {
        let epoch = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let proj_dir = std::env::temp_dir().join(format!("test_layratex_proj_{}", epoch));

        let main_tex = "\\documentclass[12pt]{article}\n\\title{Tesis Modular}\n\\author{Autor}\n\\begin{document}\n\\maketitle\n\\input{secciones/01-intro}\n\\input{secciones/02-metodo.tex}\n\\end{document}";
        let subfiles = vec![
            SubFilePayload {
                relative_path: "secciones/01-intro.tex".to_string(),
                content: "\\section{Introducción}\nTexto de la introducción en subcarpeta.".to_string(),
            },
            SubFilePayload {
                relative_path: "secciones/02-metodo.tex".to_string(),
                content: "\\section{Metodología}\nDemostración de ecuaciones $E=mc^2$.".to_string(),
            },
        ];

        let ws = create_modular_project_internal(
            &proj_dir.to_string_lossy(),
            main_tex,
            subfiles,
            None,
        )
        .expect("Debe crear y escanear el proyecto modular");

        assert_eq!(ws.main_tex_name, "main.tex");
        assert!(ws.resolved_main_content.contains("Texto de la introducción en subcarpeta."));
        assert!(ws.resolved_main_content.contains("Demostración de ecuaciones $E=mc^2$."));
        assert!(Path::new(&ws.build_dir).exists());
        assert!(Path::new(&ws.build_dir).join("main.aux").exists());
        assert!(Path::new(&ws.build_dir).join("main.toc").exists());
        assert!(Path::new(&ws.build_dir).join("main.log").exists());

        let cleaned = clean_project_build_dir_internal(&proj_dir.to_string_lossy()).unwrap();
        assert!(cleaned >= 3);

        let _ = fs::remove_dir_all(&proj_dir);
    }

    #[test]
    fn test_open_path_missing_file() {
        let result = open_path_internal("/ruta/inexistente/para/test/archivo.pdf");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("no existe"));
    }

    #[test]
    fn test_export_pdf_missing_source() {
        let result = export_pdf_internal("/ruta/inexistente/source.pdf", "/tmp/dest.pdf");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("no existe"));
    }
}
