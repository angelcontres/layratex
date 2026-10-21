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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![compile_latex, get_latex_compilers])
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
