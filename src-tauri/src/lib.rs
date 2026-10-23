pub mod compiler;

use compiler::{CompilationOutput, CompilerInfo};

#[tauri::command]
async fn compile_latex(
    content: String,
    project_path: Option<String>,
) -> Result<CompilationOutput, String> {
    tauri::async_runtime::spawn_blocking(move || {
        compiler::compile_latex_internal(content, project_path)
    })
    .await
    .map_err(|e| format!("Error en tarea de compilación en segundo plano: {}", e))?
}

#[tauri::command]
fn get_latex_compilers() -> Vec<CompilerInfo> {
    compiler::detect_all_compilers()
}

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

pub fn export_pdf_internal(source_path: &str, target_path: &str) -> Result<String, String> {
    let src = std::path::Path::new(source_path);
    if !src.exists() {
        return Err(format!("El archivo PDF de origen no existe: {}", source_path));
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

    std::fs::copy(src, &dest)
        .map_err(|e| format!("Error al exportar archivo PDF: {}", e))?;

    Ok(dest.to_string_lossy().to_string())
}

#[tauri::command]
fn open_path(path: String) -> Result<(), String> {
    open_path_internal(&path)
}

#[tauri::command]
fn export_pdf(source_path: String, target_path: String) -> Result<String, String> {
    export_pdf_internal(&source_path, &target_path)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            compile_latex,
            get_latex_compilers,
            open_path,
            export_pdf
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn test_open_path_missing_file() {
        let result = open_path_internal("/ruta/inexistente/para/test/archivo.pdf");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("no existe"));
    }

    #[test]
    fn test_export_pdf_missing_source() {
        let result = export_pdf_internal(
            "/ruta/inexistente/source.pdf",
            "/tmp/dest.pdf",
        );
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("no existe"));
    }

    #[test]
    fn test_export_pdf_success_and_extension() {
        let epoch = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let src_path = std::env::temp_dir().join(format!("test_src_{}.pdf", epoch));
        let dest_no_ext = std::env::temp_dir().join(format!("test_dest_{}", epoch));

        fs::write(&src_path, b"%PDF-1.4 mock content").unwrap();

        let result = export_pdf_internal(
            &src_path.to_string_lossy(),
            &dest_no_ext.to_string_lossy(),
        );

        assert!(result.is_ok());
        let final_dest = result.unwrap();
        assert!(final_dest.ends_with(".pdf"));
        assert!(std::path::Path::new(&final_dest).exists());

        let content = fs::read(&final_dest).unwrap();
        assert_eq!(content, b"%PDF-1.4 mock content");

        let _ = fs::remove_file(&src_path);
        let _ = fs::remove_file(&final_dest);
    }
}
