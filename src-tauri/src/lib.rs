pub mod compiler;
pub mod fs_ops;

use compiler::{CompilationOutput, CompilerInfo};
pub use fs_ops::{
    atomic_write_bytes, clean_project_build_dir_internal, create_modular_project_internal,
    create_temp_docx_internal, create_temp_pdf_internal, export_pdf_internal,
    open_latex_project_internal, open_path_internal, read_tex_file_internal,
    save_docx_bytes_internal, save_pdf_bytes_internal, save_project_changes_internal,
    save_tex_file_internal, LatexProjectWorkspace, ProjectFileEntry, SubFilePayload,
};

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

#[tauri::command]
fn read_tex_file(path: String) -> Result<String, String> {
    fs_ops::read_tex_file_internal(&path)
}

#[tauri::command]
fn save_tex_file(target_path: String, content: String) -> Result<String, String> {
    fs_ops::save_tex_file_internal(&target_path, &content)
}

#[tauri::command]
fn open_latex_project(root_dir: String) -> Result<LatexProjectWorkspace, String> {
    fs_ops::open_latex_project_internal(&root_dir)
}

#[tauri::command]
fn create_modular_project(
    root_dir: String,
    main_tex_content: String,
    subfiles: Vec<SubFilePayload>,
    bib_content: Option<String>,
) -> Result<LatexProjectWorkspace, String> {
    fs_ops::create_modular_project_internal(&root_dir, &main_tex_content, subfiles, bib_content)
}

#[tauri::command]
fn save_project_changes(
    root_dir: String,
    main_tex_rel: String,
    main_tex_content: String,
    updated_subfiles: Vec<SubFilePayload>,
) -> Result<LatexProjectWorkspace, String> {
    fs_ops::save_project_changes_internal(
        &root_dir,
        &main_tex_rel,
        &main_tex_content,
        updated_subfiles,
    )
}

#[tauri::command]
fn clean_project_build_dir(root_dir: String) -> Result<usize, String> {
    fs_ops::clean_project_build_dir_internal(&root_dir)
}

#[tauri::command]
fn open_path(path: String) -> Result<(), String> {
    fs_ops::open_path_internal(&path)
}

#[tauri::command]
fn export_pdf(source_path: String, target_path: String) -> Result<String, String> {
    fs_ops::export_pdf_internal(&source_path, &target_path)
}

#[tauri::command]
fn save_pdf_bytes(pdf_base64: String, target_path: String) -> Result<String, String> {
    fs_ops::save_pdf_bytes_internal(&pdf_base64, &target_path)
}

#[tauri::command]
fn create_temp_pdf_from_bytes(
    pdf_base64: String,
    filename: Option<String>,
) -> Result<String, String> {
    fs_ops::create_temp_pdf_internal(&pdf_base64, filename)
}

#[tauri::command]
fn save_docx_bytes(docx_base64: String, target_path: String) -> Result<String, String> {
    fs_ops::save_docx_bytes_internal(&docx_base64, &target_path)
}

#[tauri::command]
fn create_temp_docx_from_bytes(
    docx_base64: String,
    filename: Option<String>,
) -> Result<String, String> {
    fs_ops::create_temp_docx_internal(&docx_base64, filename)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            compile_latex,
            get_latex_compilers,
            read_tex_file,
            save_tex_file,
            open_latex_project,
            create_modular_project,
            save_project_changes,
            clean_project_build_dir,
            open_path,
            export_pdf,
            save_pdf_bytes,
            create_temp_pdf_from_bytes,
            save_docx_bytes,
            create_temp_docx_from_bytes
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
