use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

const TIMEOUT_SECONDS: u64 = 15;
const BASE64_ALPHABET: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompilerInfo {
    pub name: String,
    pub path: String,
    pub version: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompilationOutput {
    pub success: bool,
    pub engine: String,
    pub pdf_path: Option<String>,
    pub pdf_base64: Option<String>,
    pub stdout: String,
    pub stderr: String,
    pub log: Option<String>,
    pub duration_ms: u64,
    pub error_message: Option<String>,
}

pub fn encode_base64(data: &[u8]) -> String {
    let mut result = String::with_capacity((data.len() + 2) / 3 * 4);
    for chunk in data.chunks(3) {
        let b0 = chunk[0];
        let b1 = if chunk.len() > 1 { chunk[1] } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] } else { 0 };

        result.push(BASE64_ALPHABET[(b0 >> 2) as usize] as char);
        result.push(BASE64_ALPHABET[(((b0 & 0x03) << 4) | (b1 >> 4)) as usize] as char);
        if chunk.len() > 1 {
            result.push(BASE64_ALPHABET[(((b1 & 0x0f) << 2) | (b2 >> 6)) as usize] as char);
        } else {
            result.push('=');
        }
        if chunk.len() > 2 {
            result.push(BASE64_ALPHABET[(b2 & 0x3f) as usize] as char);
        } else {
            result.push('=');
        }
    }
    result
}

/// Busca ejecutables en PATH y ubicaciones locales comunes.
pub fn find_binary(name: &str) -> Option<PathBuf> {
    if let Ok(path_var) = std::env::var("PATH") {
        for dir in std::env::split_paths(&path_var) {
            let candidate = dir.join(name);
            if candidate.is_file() {
                return Some(candidate);
            }
            #[cfg(windows)]
            {
                let candidate_exe = dir.join(format!("{}.exe", name));
                if candidate_exe.is_file() {
                    return Some(candidate_exe);
                }
            }
        }
    }

    if let Ok(home) = std::env::var("HOME") {
        let candidate = PathBuf::from(home).join(".local/bin").join(name);
        if candidate.is_file() {
            return Some(candidate);
        }
    }

    #[cfg(unix)]
    {
        for dir in &["/usr/local/bin", "/usr/bin", "/opt/texlive/bin"] {
            let candidate = Path::new(dir).join(name);
            if candidate.is_file() {
                return Some(candidate);
            }
        }
    }

    None
}

/// Obtiene la versión del compilador invocado.
fn get_binary_version(binary_path: &Path, name: &str) -> Option<String> {
    let arg = if name == "tectonic" { "-V" } else { "--version" };
    let output = Command::new(binary_path).arg(arg).output().ok()?;
    if output.status.success() {
        let text = String::from_utf8_lossy(&output.stdout);
        text.lines().next().map(|line| line.trim().to_string())
    } else {
        None
    }
}

/// Detecta todos los compiladores LaTeX instalados en el sistema por orden de preferencia.
pub fn detect_all_compilers() -> Vec<CompilerInfo> {
    let candidates = ["tectonic", "latexmk", "pdflatex", "xelatex", "lualatex"];
    let mut list = Vec::new();

    for name in candidates {
        if let Some(path) = find_binary(name) {
            let version = get_binary_version(&path, name);
            list.push(CompilerInfo {
                name: name.to_string(),
                path: path.to_string_lossy().to_string(),
                version,
            });
        }
    }

    list
}

/// Mensaje amigable con instrucciones detalladas de instalación para el usuario.
pub fn get_missing_compiler_message() -> String {
    let mut msg = String::from(
        "No se encontró ningún compilador de LaTeX instalado en el sistema.\n\n\
Para generar y exportar archivos PDF reales, instala uno de los siguientes motores:\n\n"
    );

    #[cfg(target_os = "linux")]
    {
        msg.push_str(
            "• En Fedora / RHEL:\n\
              sudo dnf install -y texlive-scheme-basic texlive-collection-latex\n\n\
• En Ubuntu / Debian:\n\
  sudo apt install -y texlive-latex-base texlive-latex-extra\n\n\
• En Arch Linux:\n\
  sudo pacman -S texlive-basic texlive-latexextra\n\n"
        );
    }

    #[cfg(target_os = "windows")]
    {
        msg.push_str(
            "• En Windows:\n\
  Instala MiKTeX (https://miktex.org) o TeX Live (https://tug.org/texlive/).\n\n"
        );
    }

    #[cfg(target_os = "macos")]
    {
        msg.push_str(
            "• En macOS:\n\
  brew install --cask mactex-no-gui  (o basictex)\n\n"
        );
    }

    msg.push_str(
        "• Tectonic (Compilador moderno, rápido y autocontenido):\n\
  curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.tectonic-typesetting.net | sh\n\
  (o vía Cargo: cargo install tectonic)"
    );

    msg
}

/// Ejecuta la compilación de forma síncrona en un hilo de trabajo aislado.
pub fn compile_latex_internal(
    content: String,
    project_path: Option<String>,
) -> Result<CompilationOutput, String> {
    let compilers = detect_all_compilers();
    if compilers.is_empty() {
        return Err(get_missing_compiler_message());
    }

    let active_compiler = &compilers[0];
    let start_time = Instant::now();

    // Crear un directorio temporal único y aislado
    let epoch_nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let temp_dir_name = format!("layratex_build_{}_{}", std::process::id(), epoch_nanos);
    let temp_dir = std::env::temp_dir().join(&temp_dir_name);

    fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("No se pudo crear el directorio de compilación temporal: {}", e))?;

    // Si se especificó una ruta de proyecto, copiar archivos auxiliares (imágenes, .bib, etc.)
    if let Some(ref proj) = project_path {
        let p = Path::new(proj);
        let src_dir = if p.is_dir() { p } else { p.parent().unwrap_or(p) };
        if let Ok(entries) = fs::read_dir(src_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() {
                    let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
                    if matches!(ext, "png" | "jpg" | "jpeg" | "pdf" | "eps" | "bib" | "sty" | "cls") {
                        if let Some(file_name) = path.file_name() {
                            let _ = fs::copy(&path, temp_dir.join(file_name));
                        }
                    }
                }
            }
        }
    }

    let tex_file_path = temp_dir.join("document.tex");
    fs::write(&tex_file_path, content.as_bytes())
        .map_err(|e| format!("Error al escribir el archivo .tex temporal: {}", e))?;

    // Configurar comando según el motor detectado
    let mut cmd = Command::new(&active_compiler.path);
    match active_compiler.name.as_str() {
        "tectonic" => {
            cmd.args(["--keep-intermediates", "--keep-logs", "document.tex"]);
        }
        "latexmk" => {
            cmd.args([
                "-pdf",
                "-interaction=nonstopmode",
                "-halt-on-error",
                "-file-line-error",
                "document.tex",
            ]);
        }
        "pdflatex" | "xelatex" | "lualatex" => {
            cmd.args([
                "-interaction=nonstopmode",
                "-halt-on-error",
                "-file-line-error",
                "document.tex",
            ]);
        }
        _ => {
            cmd.args(["-interaction=nonstopmode", "document.tex"]);
        }
    }

    cmd.current_dir(&temp_dir);
    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Fallo al iniciar el proceso del compilador ({}): {}", active_compiler.name, e))?;

    let timeout = Duration::from_secs(TIMEOUT_SECONDS);
    let poll_interval = Duration::from_millis(50);
    let mut exit_status = None;

    while start_time.elapsed() < timeout {
        match child.try_wait() {
            Ok(Some(status)) => {
                exit_status = Some(status);
                break;
            }
            Ok(None) => {
                std::thread::sleep(poll_interval);
            }
            Err(e) => {
                return Err(format!("Error verificando estado del compilador: {}", e));
            }
        }
    }

    // Prevenir fugas de procesos en bucles infinitos
    if exit_status.is_none() {
        let _ = child.kill();
        let _ = child.wait(); // Evitar procesos zombies
        let _ = fs::remove_dir_all(&temp_dir);
        return Err(format!(
            "Tiempo de compilación agotado: superó el límite de seguridad de {} segundos.",
            TIMEOUT_SECONDS
        ));
    }

    let status = exit_status.unwrap();

    let mut stdout_str = String::new();
    if let Some(mut out) = child.stdout.take() {
        let _ = out.read_to_string(&mut stdout_str);
    }

    let mut stderr_str = String::new();
    if let Some(mut err) = child.stderr.take() {
        let _ = err.read_to_string(&mut stderr_str);
    }

    // Leer el archivo de log generado
    let log_path = temp_dir.join("document.log");
    let log_content = fs::read_to_string(&log_path).ok();

    let pdf_temp_file = temp_dir.join("document.pdf");
    let has_pdf = pdf_temp_file.is_file();

    let (pdf_path, pdf_base64) = if has_pdf {
        let bytes = fs::read(&pdf_temp_file).ok();
        let b64 = bytes.as_ref().map(|b| encode_base64(b));

        // Mover o copiar el PDF a una ruta temporal más estable para el visor
        let stable_pdf = std::env::temp_dir().join(format!("{}.pdf", temp_dir_name));
        let _ = fs::copy(&pdf_temp_file, &stable_pdf);
        (Some(stable_pdf.to_string_lossy().to_string()), b64)
    } else {
        (None, None)
    };

    // Limpieza de directorio temporal de trabajo
    let _ = fs::remove_dir_all(&temp_dir);

    let duration_ms = start_time.elapsed().as_millis() as u64;
    let is_success = status.success() && has_pdf;

    let error_message = if !is_success {
        if !has_pdf {
            Some("La compilación finalizó pero no generó ningún archivo PDF. Revisa los logs de LaTeX.".to_string())
        } else {
            Some(format!("El compilador finalizó con código de salida: {:?}", status.code()))
        }
    } else {
        None
    };

    Ok(CompilationOutput {
        success: is_success,
        engine: active_compiler.name.clone(),
        pdf_path,
        pdf_base64,
        stdout: stdout_str,
        stderr: stderr_str,
        log: log_content,
        duration_ms,
        error_message,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encode_base64() {
        assert_eq!(encode_base64(b""), "");
        assert_eq!(encode_base64(b"f"), "Zg==");
        assert_eq!(encode_base64(b"fo"), "Zm8=");
        assert_eq!(encode_base64(b"foo"), "Zm9v");
        assert_eq!(encode_base64(b"Hello World"), "SGVsbG8gV29ybGQ=");
    }

    #[test]
    fn test_missing_compiler_message() {
        let msg = get_missing_compiler_message();
        assert!(msg.contains("No se encontró ningún compilador"));
        assert!(msg.contains("Tectonic") || msg.contains("texlive"));
    }

    #[test]
    fn test_compile_no_compiler() {
        let compilers = detect_all_compilers();
        if compilers.is_empty() {
            let result = compile_latex_internal(
                "\\documentclass{article}\\begin{document}Hello\\end{document}".to_string(),
                None,
            );
            assert!(result.is_err());
            let err = result.unwrap_err();
            assert!(err.contains("No se encontró ningún compilador"));
            assert!(err.contains("sudo dnf install") || err.contains("texlive"));
        }
    }
}
