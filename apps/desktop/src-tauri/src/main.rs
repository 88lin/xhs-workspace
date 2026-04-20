#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use arboard::Clipboard;
use chrono::{Datelike, Duration as ChronoDuration, Local, LocalResult, NaiveDateTime, NaiveTime, TimeZone};
use dirs::config_dir;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::ffi::OsStr;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, MutexGuard};
use std::time::{Instant, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, Manager, State};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct SpaceRecord {
    id: String,
    name: String,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
struct SubjectAttribute {
    key: String,
    value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct SubjectCategory {
    id: String,
    name: String,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct SubjectRecord {
    id: String,
    name: String,
    category_id: Option<String>,
    description: Option<String>,
    tags: Vec<String>,
    attributes: Vec<SubjectAttribute>,
    image_paths: Vec<String>,
    voice_path: Option<String>,
    voice_script: Option<String>,
    created_at: String,
    updated_at: String,
    absolute_image_paths: Vec<String>,
    preview_urls: Vec<String>,
    primary_preview_url: Option<String>,
    absolute_voice_path: Option<String>,
    voice_preview_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct CaptureRecord {
    id: String,
    source_type: String,
    platform: String,
    status: String,
    note_id: Option<String>,
    source_url: Option<String>,
    title: String,
    description: Option<String>,
    tags: Vec<String>,
    author_name: Option<String>,
    content_type: String,
    cover_url: Option<String>,
    raw_payload: Value,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct ActivityRecord {
    id: String,
    kind: String,
    title: String,
    detail: Option<String>,
    tone: String,
    created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct ChatSessionRecord {
    id: String,
    title: String,
    context_id: Option<String>,
    context_type: Option<String>,
    initial_context: Option<String>,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct ChatMessageRecord {
    id: String,
    session_id: String,
    role: String,
    content: String,
    display_content: Option<String>,
    attachment: Option<Value>,
    task_hints: Option<Value>,
    created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct ChatRuntimeState {
    session_id: String,
    is_processing: bool,
    partial_response: String,
    updated_at: u128,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
struct RedClawRunnerRecord {
    interval_minutes: u32,
    keep_alive_when_no_window: bool,
    max_projects_per_tick: u32,
    max_automation_per_tick: u32,
    is_ticking: bool,
    last_tick_at: Option<String>,
    next_tick_at: Option<String>,
    heartbeat_enabled: bool,
    heartbeat_interval_minutes: u32,
    heartbeat_suppress_empty_report: bool,
    heartbeat_report_to_main_session: bool,
    heartbeat_prompt: Option<String>,
    heartbeat_last_run_at: Option<String>,
    heartbeat_next_run_at: Option<String>,
    heartbeat_last_digest: Option<String>,
    last_error: Option<String>,
}

impl Default for RedClawRunnerRecord {
    fn default() -> Self {
        Self {
            interval_minutes: 30,
            keep_alive_when_no_window: false,
            max_projects_per_tick: 1,
            max_automation_per_tick: 1,
            is_ticking: false,
            last_tick_at: None,
            next_tick_at: None,
            heartbeat_enabled: false,
            heartbeat_interval_minutes: 180,
            heartbeat_suppress_empty_report: true,
            heartbeat_report_to_main_session: false,
            heartbeat_prompt: None,
            heartbeat_last_run_at: None,
            heartbeat_next_run_at: None,
            heartbeat_last_digest: None,
            last_error: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct RedClawScheduledTaskRecord {
    id: String,
    name: String,
    enabled: bool,
    mode: String,
    prompt: String,
    project_id: Option<String>,
    interval_minutes: Option<u32>,
    time: Option<String>,
    weekdays: Vec<u32>,
    run_at: Option<String>,
    created_at: String,
    updated_at: String,
    last_run_at: Option<String>,
    last_result: Option<String>,
    last_error: Option<String>,
    retry_count: u32,
    max_retries: u32,
    retry_delay_minutes: u32,
    last_saved_manuscript_path: Option<String>,
    last_session_id: Option<String>,
    last_draft_strategy: Option<String>,
    last_reference_manuscript_path: Option<String>,
    next_run_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct RedClawLongCycleTaskRecord {
    id: String,
    name: String,
    enabled: bool,
    status: String,
    objective: String,
    step_prompt: String,
    project_id: Option<String>,
    interval_minutes: u32,
    total_rounds: u32,
    completed_rounds: u32,
    created_at: String,
    updated_at: String,
    last_run_at: Option<String>,
    last_result: Option<String>,
    last_error: Option<String>,
    retry_count: u32,
    max_retries: u32,
    retry_delay_minutes: u32,
    last_saved_manuscript_path: Option<String>,
    last_session_id: Option<String>,
    last_draft_strategy: Option<String>,
    last_reference_manuscript_path: Option<String>,
    next_run_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct RedClawProjectStateRecord {
    project_id: String,
    enabled: bool,
    prompt: Option<String>,
    last_run_at: Option<String>,
    last_result: Option<String>,
    last_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct RedClawOutputArchiveRecord {
    id: String,
    source_kind: String,
    draft_strategy: Option<String>,
    title: String,
    summary: Option<String>,
    manuscript_path: String,
    reference_manuscript_path: Option<String>,
    source_title: Option<String>,
    session_id: Option<String>,
    project_id: Option<String>,
    project_name: Option<String>,
    created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
struct AppStore {
    settings: Value,
    spaces: Vec<SpaceRecord>,
    active_space_id: String,
    subjects: Vec<SubjectRecord>,
    categories: Vec<SubjectCategory>,
    captures: Vec<CaptureRecord>,
    activities: Vec<ActivityRecord>,
    chat_sessions: Vec<ChatSessionRecord>,
    chat_messages: Vec<ChatMessageRecord>,
    redclaw_runner: RedClawRunnerRecord,
    redclaw_scheduled_tasks: Vec<RedClawScheduledTaskRecord>,
    redclaw_long_cycle_tasks: Vec<RedClawLongCycleTaskRecord>,
    redclaw_project_states: Vec<RedClawProjectStateRecord>,
    redclaw_output_archive: Vec<RedClawOutputArchiveRecord>,
    last_bridge_sync_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct WorkspaceBackupClientState {
    manuscript_links: HashMap<String, String>,
    session_links: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
struct WorkspaceBackupRecord {
    schema_version: u32,
    exported_at: String,
    app_version: String,
    includes_api_key: bool,
    includes_workspace_files: bool,
    store: AppStore,
    client_state: WorkspaceBackupClientState,
}

impl Default for WorkspaceBackupRecord {
    fn default() -> Self {
        Self {
            schema_version: 1,
            exported_at: now_iso(),
            app_version: env!("CARGO_PKG_VERSION").to_string(),
            includes_api_key: false,
            includes_workspace_files: false,
            store: default_store(),
            client_state: WorkspaceBackupClientState::default(),
        }
    }
}

impl Default for AppStore {
    fn default() -> Self {
        default_store()
    }
}

struct AppState {
    store_path: PathBuf,
    store: Mutex<AppStore>,
    chat_runtime: Mutex<HashMap<String, ChatRuntimeState>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SubjectMediaInput {
    relative_path: Option<String>,
    data_url: Option<String>,
    name: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SubjectVoiceInput {
    relative_path: Option<String>,
    data_url: Option<String>,
    name: Option<String>,
    script_text: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SubjectMutationInput {
    id: Option<String>,
    name: String,
    category_id: Option<String>,
    description: Option<String>,
    tags: Option<Vec<String>>,
    attributes: Option<Vec<SubjectAttribute>>,
    images: Option<Vec<SubjectMediaInput>>,
    voice: Option<SubjectVoiceInput>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SubjectCategoryMutationInput {
    id: Option<String>,
    name: String,
}

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct CaptureImportFileInput {
    name: Option<String>,
    content: String,
}

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct CaptureImportBatchInput {
    files: Vec<CaptureImportFileInput>,
}

fn now_ms() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
}

fn now_iso() -> String {
    now_ms().to_string()
}

fn estimate_tokens(text: &str) -> usize {
    let chars = text.chars().count();
    if chars == 0 {
        0
    } else {
        (chars / 2).max(1)
    }
}

fn app_root_dir() -> PathBuf {
    let mut base = config_dir().unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));
    base.push("XHSAtelier");
    let _ = fs::create_dir_all(&base);
    base
}

fn build_store_path() -> PathBuf {
    app_root_dir().join("xhs-atelier-state.json")
}

fn workspace_backup_counts(store: &AppStore, client_state: &WorkspaceBackupClientState) -> Value {
    json!({
        "subjects": store.subjects.len(),
        "captures": store.captures.len(),
        "categories": store.categories.len(),
        "chatSessions": store.chat_sessions.len(),
        "scheduledTasks": store.redclaw_scheduled_tasks.len(),
        "longCycleTasks": store.redclaw_long_cycle_tasks.len(),
        "archivedOutputs": store.redclaw_output_archive.len(),
        "linkedManuscripts": client_state.manuscript_links.len(),
        "linkedSessions": client_state.session_links.len()
    })
}

fn redact_backup_store(store: &mut AppStore) {
    if let Some(settings) = store.settings.as_object_mut() {
        settings.insert("aiApiKey".to_string(), Value::String(String::new()));
    }
}

fn normalize_imported_workspace_store(store: &mut AppStore) {
    if store.spaces.is_empty() {
        let timestamp = now_iso();
        store.spaces.push(SpaceRecord {
            id: "default".to_string(),
            name: "Default Space".to_string(),
            created_at: timestamp.clone(),
            updated_at: timestamp,
        });
    }

    if store.active_space_id.trim().is_empty() || !store.spaces.iter().any(|item| item.id == store.active_space_id) {
        store.active_space_id = store
            .spaces
            .first()
            .map(|item| item.id.clone())
            .unwrap_or_else(|| "default".to_string());
    }

    redact_backup_store(store);
    sort_chat_sessions_desc(&mut store.chat_sessions);
    sort_chat_messages_asc(&mut store.chat_messages);
    sort_captures_desc(&mut store.captures);
    sort_redclaw_scheduled_tasks(&mut store.redclaw_scheduled_tasks);
    sort_redclaw_long_cycle_tasks(&mut store.redclaw_long_cycle_tasks);
    normalize_redclaw_runner_schedule(store);
}

fn default_store() -> AppStore {
    let timestamp = now_iso();
    AppStore {
        settings: json!({}),
        spaces: vec![SpaceRecord {
            id: "default".to_string(),
            name: "Default Space".to_string(),
            created_at: timestamp.clone(),
            updated_at: timestamp,
        }],
        active_space_id: "default".to_string(),
        subjects: Vec::new(),
        categories: Vec::new(),
        captures: Vec::new(),
        activities: Vec::new(),
        chat_sessions: Vec::new(),
        chat_messages: Vec::new(),
        redclaw_runner: RedClawRunnerRecord::default(),
        redclaw_scheduled_tasks: Vec::new(),
        redclaw_long_cycle_tasks: Vec::new(),
        redclaw_project_states: Vec::new(),
        redclaw_output_archive: Vec::new(),
        last_bridge_sync_at: None,
    }
}

fn load_store(path: &PathBuf) -> AppStore {
    let content = match fs::read_to_string(path) {
        Ok(content) => content,
        Err(_) => return default_store(),
    };
    serde_json::from_str(&content).unwrap_or_else(|_| default_store())
}

fn persist_store(path: &PathBuf, store: &AppStore) -> Result<(), String> {
    let serialized = serde_json::to_string_pretty(store).map_err(|error| error.to_string())?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    fs::write(path, serialized).map_err(|error| error.to_string())
}

fn with_store_mut<T>(
    state: &State<'_, AppState>,
    mutator: impl FnOnce(&mut AppStore) -> Result<T, String>,
) -> Result<T, String> {
    let mut store = state.store.lock().map_err(|_| "App state lock is unavailable.".to_string())?;
    let result = mutator(&mut store)?;
    persist_store(&state.store_path, &store)?;
    Ok(result)
}

fn with_store<T>(
    state: &State<'_, AppState>,
    reader: impl FnOnce(MutexGuard<'_, AppStore>) -> Result<T, String>,
) -> Result<T, String> {
    let store = state.store.lock().map_err(|_| "App state lock is unavailable.".to_string())?;
    reader(store)
}

fn get_chat_runtime_state(
    state: &State<'_, AppState>,
    session_id: &str,
) -> Result<ChatRuntimeState, String> {
    let runtime = state
        .chat_runtime
        .lock()
        .map_err(|error| error.to_string())?;

    Ok(runtime.get(session_id).cloned().unwrap_or(ChatRuntimeState {
        session_id: session_id.to_string(),
        is_processing: false,
        partial_response: String::new(),
        updated_at: now_ms(),
    }))
}

fn set_chat_runtime_state(
    state: &State<'_, AppState>,
    session_id: &str,
    is_processing: bool,
    partial_response: impl Into<String>,
) -> Result<(), String> {
    let mut runtime = state
        .chat_runtime
        .lock()
        .map_err(|error| error.to_string())?;

    runtime.insert(
        session_id.to_string(),
        ChatRuntimeState {
            session_id: session_id.to_string(),
            is_processing,
            partial_response: partial_response.into(),
            updated_at: now_ms(),
        },
    );

    Ok(())
}

fn clear_chat_runtime_state(
    state: &State<'_, AppState>,
    session_id: &str,
) -> Result<(), String> {
    let mut runtime = state
        .chat_runtime
        .lock()
        .map_err(|error| error.to_string())?;
    runtime.remove(session_id);
    Ok(())
}

fn normalize_string(value: Option<&Value>) -> Option<String> {
    value
        .and_then(|value| value.as_str().map(|item| item.trim().to_string()))
        .filter(|item| !item.is_empty())
}

fn payload_field<'a>(payload: &'a Value, key: &str) -> Option<&'a Value> {
    payload.as_object().and_then(|object| object.get(key))
}

fn payload_string(payload: &Value, key: &str) -> Option<String> {
    normalize_string(payload_field(payload, key))
}

fn value_string(value: &Value, key: &str) -> Option<String> {
    normalize_string(value.get(key))
}

fn payload_bool(payload: &Value, key: &str) -> Option<bool> {
    payload_field(payload, key).and_then(Value::as_bool)
}

fn payload_u32(payload: &Value, key: &str) -> Option<u32> {
    payload_field(payload, key)
        .and_then(|value| value.as_u64().or_else(|| value.as_i64().map(|item| item.max(0) as u64)))
        .and_then(|value| u32::try_from(value).ok())
}

fn payload_u32_list(payload: &Value, key: &str) -> Vec<u32> {
    payload_field(payload, key)
        .and_then(Value::as_array)
        .map(|values| {
            values
                .iter()
                .filter_map(|value| value.as_u64().and_then(|item| u32::try_from(item).ok()))
                .collect::<Vec<_>>()
        })
        .unwrap_or_default()
}

fn value_path_string(value: &Value, keys: &[&str]) -> Option<String> {
    let mut current = value;
    for key in keys {
        current = current.get(*key)?;
    }
    normalize_string(Some(current))
}

fn setting_string(settings: &Value, key: &str) -> Option<String> {
    settings
        .get(key)
        .and_then(Value::as_str)
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

#[derive(Debug, Clone)]
struct RedClawGenerationConfig {
    model: String,
    endpoint: String,
    api_key: String,
}

const XHSSPEC_CONFIG: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../../packages/content-ops/template-repo/.xhsspec/config.yaml"
));
const XHSSPEC_BRAND_PROFILE: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../../packages/content-ops/template-repo/.xhsspec/brand/profile.md"
));
const XHSSPEC_BRAND_AUDIENCE: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../../packages/content-ops/template-repo/.xhsspec/brand/audience.md"
));
const XHSSPEC_BRAND_TONE: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../../packages/content-ops/template-repo/.xhsspec/brand/tone.md"
));
const XHSSPEC_BRAND_OFFER: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../../packages/content-ops/template-repo/.xhsspec/brand/offer.md"
));
const XHSSPEC_BRAND_TABOO: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../../packages/content-ops/template-repo/.xhsspec/brand/taboo.md"
));
const XHSSPEC_TOPIC_FRAMEWORKS: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../../packages/content-ops/template-repo/.xhsspec/strategy/topic-frameworks.md"
));
const XHSSPEC_CREATION_SPEC: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../../packages/content-ops/template-repo/.xhsspec/specs/creation.spec.md"
));
const XHSSPEC_NOTE_SPEC: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../../packages/content-ops/template-repo/.xhsspec/specs/note.spec.md"
));
const XHSSPEC_QUICK_BRIEF_PROMPT: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../../packages/content-ops/template-repo/.xhsspec/prompts/quick-brief.md"
));
const XHSSPEC_QUICK_DRAFT_PROMPT: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../../packages/content-ops/template-repo/.xhsspec/prompts/quick-draft.md"
));
const XHSSPEC_WINNING_PATTERNS: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../../packages/content-ops/template-repo/.xhsspec/knowledge/winning-patterns.md"
));

fn redclaw_generation_config_from_settings(settings: &Value) -> Option<RedClawGenerationConfig> {
    Some(RedClawGenerationConfig {
        model: setting_string(settings, "aiModel")?,
        endpoint: setting_string(settings, "aiEndpoint")?,
        api_key: setting_string(settings, "aiApiKey")?,
    })
}

fn validate_redclaw_endpoint(endpoint: &str) -> Result<(), String> {
    let normalized = endpoint.trim();
    if normalized.is_empty() {
        return Err("Missing AI endpoint in Settings.".to_string());
    }

    let parsed = reqwest::Url::parse(normalized).map_err(|_| {
        "AI endpoint must be a valid URL, for example https://api.example.com/v1.".to_string()
    })?;

    match parsed.scheme() {
        "http" | "https" => Ok(()),
        _ => Err("AI endpoint must start with http:// or https://".to_string()),
    }
}

fn redclaw_generation_config_issues(settings: &Value) -> Vec<String> {
    let mut issues = Vec::new();
    let model = setting_string(settings, "aiModel");
    let endpoint = setting_string(settings, "aiEndpoint");
    let api_key = setting_string(settings, "aiApiKey");

    if model.is_none() {
        issues.push("Missing AI model in Settings.".to_string());
    }

    match endpoint {
        Some(ref value) => {
            if let Err(error) = validate_redclaw_endpoint(value) {
                issues.push(error);
            }
        }
        None => issues.push("Missing AI endpoint in Settings.".to_string()),
    }

    if api_key.is_none() {
        issues.push("Missing AI API key in Settings.".to_string());
    }

    issues
}

fn validate_redclaw_generation_config(config: &RedClawGenerationConfig) -> Result<(), String> {
    if config.model.trim().is_empty() {
        return Err("Missing AI model in Settings.".to_string());
    }
    validate_redclaw_endpoint(&config.endpoint)?;
    if config.api_key.trim().is_empty() {
        return Err("Missing AI API key in Settings.".to_string());
    }
    Ok(())
}

fn build_redclaw_content_pack_context() -> String {
    [
        ("XHSSpec Config", XHSSPEC_CONFIG),
        ("Brand Profile", XHSSPEC_BRAND_PROFILE),
        ("Audience", XHSSPEC_BRAND_AUDIENCE),
        ("Tone", XHSSPEC_BRAND_TONE),
        ("Offer and CTA", XHSSPEC_BRAND_OFFER),
        ("Taboo", XHSSPEC_BRAND_TABOO),
        ("Topic Frameworks", XHSSPEC_TOPIC_FRAMEWORKS),
        ("Creation Spec", XHSSPEC_CREATION_SPEC),
        ("Note Spec", XHSSPEC_NOTE_SPEC),
        ("Quick Brief Contract", XHSSPEC_QUICK_BRIEF_PROMPT),
        ("Quick Draft Contract", XHSSPEC_QUICK_DRAFT_PROMPT),
        ("Winning Patterns", XHSSPEC_WINNING_PATTERNS),
    ]
    .iter()
    .filter_map(|(title, content)| {
        let trimmed = content.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(format!("## {title}\n{trimmed}"))
        }
    })
    .collect::<Vec<_>>()
    .join("\n\n")
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum RedClawTextApi {
    ChatCompletions,
    Responses,
}

#[derive(Debug, Clone)]
struct RedClawResolvedEndpoint {
    url: String,
    api: RedClawTextApi,
}

fn resolve_redclaw_text_endpoint(endpoint: &str) -> Result<RedClawResolvedEndpoint, String> {
    let parsed = reqwest::Url::parse(endpoint.trim()).map_err(|_| {
        "AI endpoint must be a valid URL, for example https://api.example.com/v1.".to_string()
    })?;

    let path = parsed.path().trim_end_matches('/');
    if path.ends_with("/chat/completions") {
        return Ok(RedClawResolvedEndpoint {
            url: parsed.to_string(),
            api: RedClawTextApi::ChatCompletions,
        });
    }
    if path.ends_with("/responses") {
        return Ok(RedClawResolvedEndpoint {
            url: parsed.to_string(),
            api: RedClawTextApi::Responses,
        });
    }

    let ends_with_v1 = parsed
        .path_segments()
        .map(|segments| segments.filter(|segment| !segment.is_empty()).last() == Some("v1"))
        .unwrap_or(false);

    let mut url = parsed;
    {
        let mut segments = url.path_segments_mut().map_err(|_| {
            "AI endpoint must be a base URL or a full /chat/completions or /responses URL.".to_string()
        })?;
        segments.pop_if_empty();
        if ends_with_v1 {
            segments.push("chat");
            segments.push("completions");
        } else {
            segments.push("v1");
            segments.push("chat");
            segments.push("completions");
        }
    }

    Ok(RedClawResolvedEndpoint {
        url: url.to_string(),
        api: RedClawTextApi::ChatCompletions,
    })
}

fn extract_openai_message_text(response: &Value) -> Option<String> {
    let message_content = response
        .get("choices")
        .and_then(Value::as_array)
        .and_then(|choices| choices.first())
        .and_then(|choice| choice.get("message"))
        .and_then(|message| message.get("content"))?;

    if let Some(text) = message_content.as_str() {
        let normalized = text.trim().to_string();
        return if normalized.is_empty() { None } else { Some(normalized) };
    }

    if let Some(parts) = message_content.as_array() {
        let joined = parts
            .iter()
            .filter_map(|part| {
                value_string(part, "text").or_else(|| {
                    part.get("type")
                        .and_then(Value::as_str)
                        .filter(|kind| *kind == "text")
                        .and_then(|_| value_string(part, "value"))
                })
            })
            .collect::<Vec<_>>()
            .join("\n")
            .trim()
            .to_string();

        return if joined.is_empty() { None } else { Some(joined) };
    }

    None
}

fn extract_responses_output_text(response: &Value) -> Option<String> {
    if let Some(text) = value_string(response, "output_text") {
        return Some(text);
    }

    let joined = response
        .get("output")
        .and_then(Value::as_array)
        .map(|items| {
            items
                .iter()
                .filter(|item| item.get("type").and_then(Value::as_str) == Some("message"))
                .flat_map(|item| {
                    item.get("content")
                        .and_then(Value::as_array)
                        .into_iter()
                        .flat_map(|parts| parts.iter())
                })
                .filter_map(|part| {
                    let kind = part.get("type").and_then(Value::as_str).unwrap_or_default();
                    if kind == "output_text" || kind == "text" {
                        value_string(part, "text")
                    } else {
                        None
                    }
                })
                .collect::<Vec<_>>()
                .join("\n")
                .trim()
                .to_string()
        })
        .unwrap_or_default();

    if joined.is_empty() {
        None
    } else {
        Some(joined)
    }
}

fn extract_redclaw_text_response(response: &Value, api: RedClawTextApi) -> Option<String> {
    match api {
        RedClawTextApi::ChatCompletions => extract_openai_message_text(response),
        RedClawTextApi::Responses => extract_responses_output_text(response),
    }
}

fn generate_redclaw_draft(
    config: &RedClawGenerationConfig,
    prompt: &str,
) -> Result<String, String> {
    validate_redclaw_generation_config(config)?;
    let resolved_endpoint = resolve_redclaw_text_endpoint(&config.endpoint)?;
    let content_pack_context = build_redclaw_content_pack_context();
    let system_prompt = [
        "You are RedClaw, the manuscript generation engine inside XHS Atelier.",
        "Write a complete Xiaohongshu draft in Chinese markdown.",
        "Use the embedded XHSSpec content pack as repo context and follow its brand, tone, CTA, and structure constraints.",
        "If the content pack still contains <placeholder> blocks, treat them as missing context rather than copying them into the final draft.",
        "Resolve unknowns into the safest concrete decisions before writing, keep one clear angle, use an editorial but practical tone, and return only the draft body.",
    ]
    .join(" ");

    let payload = match resolved_endpoint.api {
        RedClawTextApi::ChatCompletions => json!({
            "model": config.model,
            "temperature": 0.7,
            "store": false,
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "system",
                    "content": format!(
                        "Embedded XHSSpec content pack for this build:\n\n{}",
                        content_pack_context
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }),
        RedClawTextApi::Responses => json!({
            "model": config.model,
            "temperature": 0.7,
            "store": false,
            "instructions": system_prompt,
            "input": [
                {
                    "role": "developer",
                    "content": format!(
                        "Embedded XHSSpec content pack for this build:\n\n{}",
                        content_pack_context
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }),
    };

    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(90))
        .build()
        .map_err(|error| error.to_string())?;

    let response = client
        .post(resolved_endpoint.url.clone())
        .bearer_auth(&config.api_key)
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .map_err(|error| error.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().unwrap_or_default();
        let summary = if body.trim().is_empty() {
            format!("RedClaw generation request failed with status {status}")
        } else {
            format!("RedClaw generation request failed with status {status}: {body}")
        };
        return Err(summary);
    }

    let response_json: Value = response.json().map_err(|error| error.to_string())?;
    extract_redclaw_text_response(&response_json, resolved_endpoint.api)
        .ok_or_else(|| "The AI endpoint returned no draft content.".to_string())
}

fn test_redclaw_generation_config(config: &RedClawGenerationConfig) -> Result<Value, String> {
    validate_redclaw_generation_config(config)?;

    let resolved_endpoint = resolve_redclaw_text_endpoint(&config.endpoint)?;
    let payload = match resolved_endpoint.api {
        RedClawTextApi::ChatCompletions => json!({
            "model": config.model,
            "temperature": 0,
            "max_tokens": 24,
            "store": false,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a connection health-check responder. Reply with one short plain-text confirmation only."
                },
                {
                    "role": "user",
                    "content": "Reply with a short confirmation that this RedClaw connection is working."
                }
            ]
        }),
        RedClawTextApi::Responses => json!({
            "model": config.model,
            "max_output_tokens": 24,
            "store": false,
            "instructions": "You are a connection health-check responder. Reply with one short plain-text confirmation only.",
            "input": "Reply with a short confirmation that this RedClaw connection is working."
        }),
    };

    let started_at = Instant::now();
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|error| error.to_string())?;

    let response = client
        .post(resolved_endpoint.url.clone())
        .bearer_auth(&config.api_key)
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .map_err(|error| error.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().unwrap_or_default();
        let summary = if body.trim().is_empty() {
            format!("Connection test failed with status {status}")
        } else {
            format!("Connection test failed with status {status}: {body}")
        };
        return Err(summary);
    }

    let response_json: Value = response.json().map_err(|error| error.to_string())?;
    let reply = extract_redclaw_text_response(&response_json, resolved_endpoint.api)
        .ok_or_else(|| "The AI endpoint returned no health-check text.".to_string())?;

    Ok(json!({
        "success": true,
        "resolvedEndpoint": resolved_endpoint.url,
        "model": config.model,
        "reply": snippet_from_text(&reply, 120),
        "latencyMs": started_at.elapsed().as_millis()
    }))
}

fn redclaw_content_pack_section_count() -> usize {
    12
}

fn next_interval_run_at(reference: Option<&str>, interval_minutes: Option<u32>) -> Option<String> {
    let minutes = interval_minutes?;
    let base = reference
        .and_then(|value| value.parse::<u128>().ok())
        .unwrap_or_else(now_ms);
    Some((base + u128::from(minutes) * 60_000).to_string())
}

fn parse_timestamp_millis(value: Option<&str>) -> Option<u128> {
    value
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .and_then(|value| value.parse::<u128>().ok())
}

fn timestamp_millis_to_local_datetime(timestamp: u128) -> Option<chrono::DateTime<Local>> {
    let millis = i64::try_from(timestamp).ok()?;
    match Local.timestamp_millis_opt(millis) {
        LocalResult::Single(value) => Some(value),
        LocalResult::Ambiguous(value, _) => Some(value),
        LocalResult::None => None,
    }
}

fn local_datetime_to_timestamp_millis(value: chrono::DateTime<Local>) -> Option<String> {
    let millis = value.timestamp_millis();
    (millis >= 0).then(|| millis.to_string())
}

fn parse_local_datetime_value(value: Option<&str>) -> Option<chrono::DateTime<Local>> {
    let value = value?.trim();
    if value.is_empty() {
        return None;
    }

    if let Some(timestamp) = parse_timestamp_millis(Some(value)) {
        return timestamp_millis_to_local_datetime(timestamp);
    }

    let naive = NaiveDateTime::parse_from_str(value, "%Y-%m-%dT%H:%M")
        .ok()
        .or_else(|| NaiveDateTime::parse_from_str(value, "%Y-%m-%d %H:%M").ok())?;
    match Local.from_local_datetime(&naive) {
        LocalResult::Single(value) => Some(value),
        LocalResult::Ambiguous(value, _) => Some(value),
        LocalResult::None => None,
    }
}

fn parse_clock_time(value: Option<&str>) -> Option<NaiveTime> {
    let value = value?.trim();
    if value.is_empty() {
        return None;
    }

    NaiveTime::parse_from_str(value, "%H:%M")
        .ok()
        .or_else(|| NaiveTime::parse_from_str(value, "%H:%M:%S").ok())
}

fn sanitize_weekdays(weekdays: &[u32]) -> Vec<u32> {
    let mut sanitized = weekdays
        .iter()
        .copied()
        .filter(|value| *value <= 6)
        .collect::<Vec<_>>();
    sanitized.sort_unstable();
    sanitized.dedup();
    sanitized
}

fn compute_next_daily_run(reference: Option<&str>, time: Option<&str>) -> Option<String> {
    let base = parse_local_datetime_value(reference).unwrap_or_else(Local::now);
    let scheduled_time = parse_clock_time(time)?;

    for day_offset in 0..=7 {
        let date = base.date_naive() + ChronoDuration::days(day_offset);
        let naive = date.and_time(scheduled_time);
        let Some(candidate) = (match Local.from_local_datetime(&naive) {
            LocalResult::Single(value) => Some(value),
            LocalResult::Ambiguous(value, _) => Some(value),
            LocalResult::None => None,
        }) else {
            continue;
        };
        if candidate.timestamp_millis() > base.timestamp_millis() {
            return local_datetime_to_timestamp_millis(candidate);
        }
    }

    None
}

fn compute_next_weekly_run(reference: Option<&str>, time: Option<&str>, weekdays: &[u32]) -> Option<String> {
    let base = parse_local_datetime_value(reference).unwrap_or_else(Local::now);
    let scheduled_time = parse_clock_time(time)?;
    let weekdays = sanitize_weekdays(weekdays);
    if weekdays.is_empty() {
        return None;
    }

    for day_offset in 0..=13 {
        let date = base.date_naive() + ChronoDuration::days(day_offset);
        if !weekdays
            .iter()
            .any(|weekday| *weekday == date.weekday().num_days_from_sunday())
        {
            continue;
        }

        let naive = date.and_time(scheduled_time);
        let Some(candidate) = (match Local.from_local_datetime(&naive) {
            LocalResult::Single(value) => Some(value),
            LocalResult::Ambiguous(value, _) => Some(value),
            LocalResult::None => None,
        }) else {
            continue;
        };
        if candidate.timestamp_millis() > base.timestamp_millis() {
            return local_datetime_to_timestamp_millis(candidate);
        }
    }

    None
}

fn build_subject_brief_for_runner(subject: &SubjectRecord, categories: &[SubjectCategory]) -> String {
    let category_name = subject
        .category_id
        .as_ref()
        .and_then(|category_id| categories.iter().find(|item| item.id == *category_id))
        .map(|item| item.name.as_str())
        .unwrap_or("Uncategorized");
    let tags = if subject.tags.is_empty() {
        None
    } else {
        Some(subject.tags.iter().map(|item| format!("#{item}")).collect::<Vec<_>>().join(" "))
    };
    let summary = subject
        .description
        .as_deref()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or("Clarify the angle, audience, and desired outcome before drafting.");

    [
        format!("# {}", subject.name),
        String::new(),
        "## Creation Goal".to_string(),
        "Use the material below to draft a complete Chinese Xiaohongshu manuscript that can be edited and published.".to_string(),
        String::new(),
        format!("- Subject: {}", subject.name),
        format!("- Category: {category_name}"),
        format!("- Summary: {summary}"),
        tags.map(|value| format!("- Tags: {value}")).unwrap_or_default(),
    ]
    .into_iter()
    .chain(subject.attributes.iter().map(|item| format!("- {}: {}", item.key, item.value)))
    .chain([
        String::new(),
        "- Include a complete title, body structure, closing interaction line, and tag suggestions.".to_string(),
        "- Do not leave placeholders and do not add unrelated meta commentary.".to_string(),
    ])
    .filter(|line| !line.is_empty())
    .collect::<Vec<_>>()
    .join("\n")
}

fn build_redclaw_automation_prompt(
    store: &AppStore,
    project_id: Option<&str>,
    automation_label: &str,
    prompt: &str,
) -> Result<(String, Option<String>), String> {
    let subject = project_id.and_then(|id| store.subjects.iter().find(|item| item.id == id));
    let project_state =
        project_id.and_then(|id| store.redclaw_project_states.iter().find(|item| item.project_id == id));

    if let Some(project_state) = project_state {
        if !project_state.enabled {
            return Err("Project automation is disabled for this subject.".to_string());
        }
    }

    let project_prompt = project_state
        .and_then(|item| item.prompt.as_ref())
        .map(|item| item.trim())
        .filter(|item| !item.is_empty())
        .map(|item| item.to_string());

    let mut sections = Vec::new();

    if let Some(subject) = subject {
        sections.push(build_subject_brief_for_runner(subject, &store.categories));
    }

    if let Some(project_prompt) = project_prompt {
        sections.push("## Project automation strategy".to_string());
        sections.push(project_prompt);
    }

    sections.push(format!("## {automation_label}"));
    sections.push(prompt.trim().to_string());

    let source_title = subject.map(|item| item.name.clone());
    Ok((sections.join("\n\n"), source_title))
}

fn build_redclaw_scheduled_map(tasks: &[RedClawScheduledTaskRecord]) -> Value {
    let mut map = serde_json::Map::new();
    for task in tasks {
        map.insert(task.id.clone(), json!(task));
    }
    Value::Object(map)
}

fn build_redclaw_long_cycle_map(tasks: &[RedClawLongCycleTaskRecord]) -> Value {
    let mut map = serde_json::Map::new();
    for task in tasks {
        map.insert(task.id.clone(), json!(task));
    }
    Value::Object(map)
}

fn build_redclaw_project_state_map(items: &[RedClawProjectStateRecord]) -> Value {
    let mut map = serde_json::Map::new();
    for item in items {
        map.insert(item.project_id.clone(), json!(item));
    }
    Value::Object(map)
}

fn build_redclaw_runner_status(state: &State<'_, AppState>) -> Result<Value, String> {
    let (
        direct_generation_enabled,
        configuration_issues,
        runner,
        scheduled_tasks,
        long_cycle_tasks,
        project_states,
    ) = with_store(state, |store| {
        let configuration_issues = redclaw_generation_config_issues(&store.settings);
        Ok((
            redclaw_generation_config_from_settings(&store.settings).is_some() && configuration_issues.is_empty(),
            configuration_issues,
            store.redclaw_runner.clone(),
            store.redclaw_scheduled_tasks.clone(),
            store.redclaw_long_cycle_tasks.clone(),
            store.redclaw_project_states.clone(),
        ))
    })?;

    let scheduled_tasks_map = build_redclaw_scheduled_map(&scheduled_tasks);
    let long_cycle_tasks_map = build_redclaw_long_cycle_map(&long_cycle_tasks);
    let project_states_map = build_redclaw_project_state_map(&project_states);
    let next_automation_fire_at = pick_earliest_timestamp(
        scheduled_tasks
            .iter()
            .filter(|task| is_redclaw_project_enabled_in_records(&project_states, task.project_id.as_deref()))
            .map(resolve_redclaw_scheduled_next_run)
            .chain(
                long_cycle_tasks
                    .iter()
                    .filter(|task| is_redclaw_project_enabled_in_records(&project_states, task.project_id.as_deref()))
                    .map(resolve_redclaw_long_cycle_next_run),
            ),
    );
    let next_maintenance_at = runner
        .heartbeat_next_run_at
        .clone()
        .filter(|value| parse_timestamp_millis(Some(value.as_str())).is_some());

    Ok(json!({
        "enabled": runner.is_ticking,
        "available": true,
        "directGenerationEnabled": direct_generation_enabled,
        "configurationIssues": configuration_issues,
        "contentPackName": "embedded-xhsspec",
        "contentPackSections": redclaw_content_pack_section_count(),
        "mode": "chat-direct",
        "lockState": "owner",
        "blockedBy": Value::Null,
        "intervalMinutes": runner.interval_minutes,
        "keepAliveWhenNoWindow": runner.keep_alive_when_no_window,
        "maxProjectsPerTick": runner.max_projects_per_tick,
        "maxAutomationPerTick": runner.max_automation_per_tick,
        "isTicking": runner.is_ticking,
        "currentProjectId": Value::Null,
        "currentAutomationTaskId": Value::Null,
        "nextAutomationFireAt": next_automation_fire_at,
        "inFlightTaskIds": Vec::<String>::new(),
        "inFlightLongCycleTaskIds": Vec::<String>::new(),
        "heartbeatInFlight": false,
        "lastTickAt": runner.last_tick_at,
        "nextTickAt": runner.next_tick_at,
        "nextMaintenanceAt": next_maintenance_at,
        "lastError": runner.last_error.clone().or_else(|| {
            if direct_generation_enabled || configuration_issues.is_empty() {
                None
            } else {
                Some(configuration_issues.join(" | "))
            }
        }),
        "heartbeat": {
            "enabled": runner.heartbeat_enabled,
            "intervalMinutes": runner.heartbeat_interval_minutes,
            "suppressEmptyReport": runner.heartbeat_suppress_empty_report,
            "reportToMainSession": runner.heartbeat_report_to_main_session,
            "prompt": runner.heartbeat_prompt,
            "lastRunAt": runner.heartbeat_last_run_at,
            "nextRunAt": runner.heartbeat_next_run_at,
            "lastDigest": runner.heartbeat_last_digest
        },
        "scheduledTasks": scheduled_tasks_map,
        "longCycleTasks": long_cycle_tasks_map,
        "projectStates": project_states_map
    }))
}

fn normalize_redclaw_runner_payload(payload: Value) -> Value {
    let mut normalized = payload;

    if let Some(object) = normalized.as_object_mut() {
        let task_hints = object.entry("taskHints".to_string()).or_insert_with(|| json!({}));
        if let Some(task_hints_object) = task_hints.as_object_mut() {
            task_hints_object
                .entry("intent".to_string())
                .or_insert_with(|| Value::String("manuscript_creation".to_string()));
            task_hints_object
                .entry("platform".to_string())
                .or_insert_with(|| Value::String("xiaohongshu".to_string()));
            task_hints_object
                .entry("taskType".to_string())
                .or_insert_with(|| Value::String("direct_write".to_string()));
            task_hints_object
                .entry("formatTarget".to_string())
                .or_insert_with(|| Value::String("markdown".to_string()));
            let has_source_manuscript_path = task_hints_object
                .get("sourceManuscriptPath")
                .and_then(Value::as_str)
                .map(|value| !value.trim().is_empty())
                .unwrap_or(false);
            task_hints_object
                .entry("draftStrategy".to_string())
                .or_insert_with(|| {
                    Value::String(if has_source_manuscript_path { "continue" } else { "fresh" }.to_string())
                });
            if has_source_manuscript_path {
                let source_path_value = task_hints_object
                    .get("sourceManuscriptPath")
                    .cloned()
                    .unwrap_or(Value::Null);
                task_hints_object
                    .entry("referenceManuscriptPath".to_string())
                    .or_insert(source_path_value);
            }
        }
    }

    normalized
}

fn compute_redclaw_heartbeat_next_run(
    runner: &RedClawRunnerRecord,
    base: Option<&str>,
) -> Option<String> {
    if !runner.heartbeat_enabled {
        return None;
    }

    next_interval_run_at(base, Some(runner.heartbeat_interval_minutes))
}

fn compute_redclaw_scheduled_next_run(task: &RedClawScheduledTaskRecord) -> Option<String> {
    if !task.enabled {
        return None;
    }

    match task.mode.as_str() {
        "interval" => next_interval_run_at(task.last_run_at.as_deref(), task.interval_minutes),
        "daily" => compute_next_daily_run(task.last_run_at.as_deref(), task.time.as_deref()),
        "weekly" => compute_next_weekly_run(task.last_run_at.as_deref(), task.time.as_deref(), &task.weekdays),
        "once" => parse_local_datetime_value(task.run_at.as_deref())
            .and_then(local_datetime_to_timestamp_millis)
            .filter(|value| parse_timestamp_millis(Some(value.as_str())).unwrap_or(0) > now_ms()),
        _ => None,
    }
}

fn resolve_redclaw_scheduled_next_run(task: &RedClawScheduledTaskRecord) -> Option<String> {
    task.next_run_at
        .clone()
        .filter(|value| parse_timestamp_millis(Some(value.as_str())).is_some())
        .or_else(|| compute_redclaw_scheduled_next_run(task))
}

fn compute_redclaw_long_cycle_next_run(task: &RedClawLongCycleTaskRecord) -> Option<String> {
    if !task.enabled || task.completed_rounds >= task.total_rounds {
        return None;
    }

    next_interval_run_at(task.last_run_at.as_deref(), Some(task.interval_minutes))
}

fn compute_redclaw_retry_next_run(delay_minutes: u32) -> String {
    (now_ms() + u128::from(delay_minutes.max(1)) * 60 * 1000).to_string()
}

fn apply_redclaw_scheduled_task_outcome(task: &mut RedClawScheduledTaskRecord, success: bool) -> bool {
    if success {
        task.retry_count = 0;
        if task.mode == "once" {
            task.enabled = false;
        }
        task.next_run_at = compute_redclaw_scheduled_next_run(task);
        return false;
    }

    if task.max_retries > 0 && task.retry_count < task.max_retries {
        task.retry_count = task.retry_count.saturating_add(1).min(task.max_retries);
        task.next_run_at = Some(compute_redclaw_retry_next_run(task.retry_delay_minutes));
        return true;
    }

    task.retry_count = 0;
    if task.mode == "once" {
        task.enabled = false;
    }
    task.next_run_at = compute_redclaw_scheduled_next_run(task);
    false
}

fn apply_redclaw_long_cycle_task_outcome(task: &mut RedClawLongCycleTaskRecord, success: bool) -> bool {
    if success {
        task.retry_count = 0;
        task.completed_rounds = task.completed_rounds.saturating_add(1);
        sync_redclaw_long_cycle_task_state(task);
        return false;
    }

    if task.max_retries > 0 && task.retry_count < task.max_retries {
        task.retry_count = task.retry_count.saturating_add(1).min(task.max_retries);
        task.status = "paused".to_string();
        task.next_run_at = Some(compute_redclaw_retry_next_run(task.retry_delay_minutes));
        return true;
    }

    task.retry_count = 0;
    sync_redclaw_long_cycle_task_state(task);
    false
}

fn sync_redclaw_long_cycle_task_state(task: &mut RedClawLongCycleTaskRecord) {
    if task.completed_rounds >= task.total_rounds {
        task.completed_rounds = task.total_rounds;
        task.status = "completed".to_string();
        task.enabled = false;
        task.next_run_at = None;
        return;
    }

    task.status = "paused".to_string();
    task.next_run_at = compute_redclaw_long_cycle_next_run(task);
}

fn resolve_redclaw_long_cycle_next_run(task: &RedClawLongCycleTaskRecord) -> Option<String> {
    task.next_run_at
        .clone()
        .filter(|value| parse_timestamp_millis(Some(value.as_str())).is_some())
        .or_else(|| compute_redclaw_long_cycle_next_run(task))
}

fn pick_earliest_timestamp<I>(values: I) -> Option<String>
where
    I: IntoIterator<Item = Option<String>>,
{
    values
        .into_iter()
        .flatten()
        .filter(|value| parse_timestamp_millis(Some(value.as_str())).is_some())
        .min_by_key(|value| parse_timestamp_millis(Some(value.as_str())).unwrap_or(u128::MAX))
}

fn normalize_redclaw_runner_schedule(store: &mut AppStore) {
    if store.redclaw_runner.heartbeat_enabled {
        let next_heartbeat = store
            .redclaw_runner
            .heartbeat_next_run_at
            .clone()
            .filter(|value| parse_timestamp_millis(Some(value.as_str())).is_some())
            .or_else(|| {
                compute_redclaw_heartbeat_next_run(
                    &store.redclaw_runner,
                    store
                        .redclaw_runner
                        .heartbeat_last_run_at
                        .as_deref()
                        .or(store.redclaw_runner.last_tick_at.as_deref()),
                )
            });
        store.redclaw_runner.heartbeat_next_run_at = next_heartbeat;
    } else {
        store.redclaw_runner.heartbeat_next_run_at = None;
    }

    for task in &mut store.redclaw_scheduled_tasks {
        task.next_run_at = resolve_redclaw_scheduled_next_run(task);
    }

    for task in &mut store.redclaw_long_cycle_tasks {
        task.next_run_at = resolve_redclaw_long_cycle_next_run(task);
    }
}

fn is_redclaw_project_enabled(store: &AppStore, project_id: Option<&str>) -> bool {
    is_redclaw_project_enabled_in_records(&store.redclaw_project_states, project_id)
}

fn is_redclaw_project_enabled_in_records(
    project_states: &[RedClawProjectStateRecord],
    project_id: Option<&str>,
) -> bool {
    let Some(project_id) = project_id else {
        return true;
    };

    project_states
        .iter()
        .find(|item| item.project_id == project_id)
        .map(|item| item.enabled)
        .unwrap_or(true)
}

#[derive(Clone)]
enum RedClawAutomationKind {
    Scheduled,
    LongCycle,
}

#[derive(Clone)]
struct RedClawAutomationCandidate {
    kind: RedClawAutomationKind,
    task_id: String,
    project_key: String,
    due_at: u128,
}

fn collect_redclaw_due_candidates(store: &AppStore, now: u128) -> Vec<RedClawAutomationCandidate> {
    let mut candidates = Vec::new();

    for task in &store.redclaw_scheduled_tasks {
        let Some(due_at) = parse_timestamp_millis(resolve_redclaw_scheduled_next_run(task).as_deref()) else {
            continue;
        };
        if !task.enabled || due_at > now || !is_redclaw_project_enabled(store, task.project_id.as_deref()) {
            continue;
        }
        candidates.push(RedClawAutomationCandidate {
            kind: RedClawAutomationKind::Scheduled,
            task_id: task.id.clone(),
            project_key: task
                .project_id
                .clone()
                .unwrap_or_else(|| format!("scheduled::{}", task.id)),
            due_at,
        });
    }

    for task in &store.redclaw_long_cycle_tasks {
        let Some(due_at) = parse_timestamp_millis(resolve_redclaw_long_cycle_next_run(task).as_deref()) else {
            continue;
        };
        if !task.enabled
            || task.completed_rounds >= task.total_rounds
            || due_at > now
            || !is_redclaw_project_enabled(store, task.project_id.as_deref())
        {
            continue;
        }
        candidates.push(RedClawAutomationCandidate {
            kind: RedClawAutomationKind::LongCycle,
            task_id: task.id.clone(),
            project_key: task
                .project_id
                .clone()
                .unwrap_or_else(|| format!("long-cycle::{}", task.id)),
            due_at,
        });
    }

    candidates.sort_by(|left, right| left.due_at.cmp(&right.due_at));

    let automation_limit = store.redclaw_runner.max_automation_per_tick.max(1) as usize;
    let project_limit = store.redclaw_runner.max_projects_per_tick.max(1) as usize;
    let mut project_keys = Vec::new();
    let mut selected = Vec::new();

    for candidate in candidates {
        if selected.len() >= automation_limit {
            break;
        }

        let is_new_project = !project_keys.iter().any(|item| item == &candidate.project_key);
        if is_new_project && project_keys.len() >= project_limit {
            continue;
        }

        if is_new_project {
            project_keys.push(candidate.project_key.clone());
        }

        selected.push(candidate);
    }

    selected
}

fn sort_redclaw_scheduled_tasks(tasks: &mut [RedClawScheduledTaskRecord]) {
    tasks.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
}

fn sort_redclaw_long_cycle_tasks(tasks: &mut [RedClawLongCycleTaskRecord]) {
    tasks.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
}

fn upsert_redclaw_project_state(
    store: &mut AppStore,
    project_id: &str,
    enabled: Option<bool>,
    prompt: Option<Option<String>>,
    last_run_at: Option<Option<String>>,
    last_result: Option<Option<String>>,
    last_error: Option<Option<String>>,
) {
    let index = store
        .redclaw_project_states
        .iter()
        .position(|item| item.project_id == project_id);

    let item = if let Some(index) = index {
        &mut store.redclaw_project_states[index]
    } else {
        store.redclaw_project_states.push(RedClawProjectStateRecord {
            project_id: project_id.to_string(),
            enabled: true,
            prompt: None,
            last_run_at: None,
            last_result: None,
            last_error: None,
        });
        store
            .redclaw_project_states
            .last_mut()
            .expect("project state inserted")
    };

    if let Some(value) = enabled {
        item.enabled = value;
    }
    if let Some(value) = prompt {
        item.prompt = value;
    }
    if let Some(value) = last_run_at {
        item.last_run_at = value;
    }
    if let Some(value) = last_result {
        item.last_result = value;
    }
    if let Some(value) = last_error {
        item.last_error = value;
    }
}

fn execute_redclaw_automation(
    state: &State<'_, AppState>,
    context_id: String,
    context_type: &str,
    session_title: String,
    automation_label: &str,
    display_content: String,
    project_id: Option<String>,
    prompt: String,
    draft_name: String,
    source_manuscript_path: Option<String>,
) -> Result<Value, String> {
    let (mut compiled_prompt, source_title) = with_store(state, |store| {
        build_redclaw_automation_prompt(&store, project_id.as_deref(), automation_label, &prompt)
    })?;
    let resolved_manuscript_path = resolve_redclaw_automation_manuscript_path(
        source_manuscript_path.as_deref(),
        source_title.as_deref(),
        &draft_name,
    );
    let existing_manuscript_content = read_manuscript_content_if_exists(state, &resolved_manuscript_path);
    if let Some(existing_draft) = existing_manuscript_content.as_ref() {
        compiled_prompt = format!(
            "{compiled_prompt}\n\n## Current manuscript draft\n{}\n\n## Revision directive\nContinue improving the same manuscript draft above and overwrite it with the stronger next version.",
            truncate_for_prompt(existing_draft, 6000)
        );
    }

    let session = handle_chat_get_or_create_context_session(
        json!({
            "contextId": context_id,
            "contextType": context_type,
            "title": session_title,
            "initialContext": "You are RedClaw, the manuscript execution desk inside XHS Atelier."
        }),
        state,
    )?;
    let session_id = value_string(&session, "id").ok_or_else(|| "Failed to create RedClaw session".to_string())?;
    let task_hints = json!({
        "intent": "manuscript_creation",
        "projectId": project_id,
        "platform": "xiaohongshu",
        "taskType": "direct_write",
        "formatTarget": "markdown",
        "draftStrategy": if existing_manuscript_content.is_some() { "continue" } else { "fresh" },
        "sourceMode": if existing_manuscript_content.is_some() { "manuscript" } else { "manual" },
        "sourceTitle": source_title
            .clone()
            .unwrap_or_else(|| display_content.clone()),
        "sourceManuscriptPath": resolved_manuscript_path,
        "referenceManuscriptPath": if existing_manuscript_content.is_some() {
            Value::String(resolved_manuscript_path.clone())
        } else {
            Value::Null
        }
    });

    handle_chat_send_message(
        normalize_redclaw_runner_payload(json!({
            "sessionId": session_id,
            "message": compiled_prompt,
            "displayContent": display_content,
            "taskHints": task_hints
        })),
        state,
    )
}

fn handle_redclaw_runner_start(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    with_store_mut(state, |store| {
        store.redclaw_runner.is_ticking = true;
        store.redclaw_runner.last_error = None;
        store.redclaw_runner.last_tick_at = Some(now_iso());
        if let Some(value) = payload_u32(&payload, "intervalMinutes") {
            store.redclaw_runner.interval_minutes = value.max(1);
        }
        if let Some(value) = payload_bool(&payload, "keepAliveWhenNoWindow") {
            store.redclaw_runner.keep_alive_when_no_window = value;
        }
        if let Some(value) = payload_u32(&payload, "maxProjectsPerTick") {
            store.redclaw_runner.max_projects_per_tick = value.max(1);
        }
        if let Some(value) = payload_u32(&payload, "maxAutomationPerTick") {
            store.redclaw_runner.max_automation_per_tick = value.max(1);
        }
        if let Some(value) = payload_bool(&payload, "heartbeatEnabled") {
            store.redclaw_runner.heartbeat_enabled = value;
        }
        if let Some(value) = payload_u32(&payload, "heartbeatIntervalMinutes") {
            store.redclaw_runner.heartbeat_interval_minutes = value.max(1);
        }
        if let Some(value) = payload_bool(&payload, "heartbeatSuppressEmptyReport") {
            store.redclaw_runner.heartbeat_suppress_empty_report = value;
        }
        if let Some(value) = payload_bool(&payload, "heartbeatReportToMainSession") {
            store.redclaw_runner.heartbeat_report_to_main_session = value;
        }
        if payload_field(&payload, "heartbeatPrompt").is_some() {
            store.redclaw_runner.heartbeat_prompt = payload_string(&payload, "heartbeatPrompt");
        }
        store.redclaw_runner.next_tick_at =
            next_interval_run_at(store.redclaw_runner.last_tick_at.as_deref(), Some(store.redclaw_runner.interval_minutes));
        store.redclaw_runner.heartbeat_next_run_at = compute_redclaw_heartbeat_next_run(
            &store.redclaw_runner,
            store.redclaw_runner.heartbeat_last_run_at.as_deref().or(store.redclaw_runner.last_tick_at.as_deref()),
        );
        Ok(json!({ "success": true }))
    })
}

fn handle_redclaw_runner_stop(state: &State<'_, AppState>) -> Result<Value, String> {
    with_store_mut(state, |store| {
        store.redclaw_runner.is_ticking = false;
        store.redclaw_runner.next_tick_at = None;
        store.redclaw_runner.heartbeat_next_run_at = None;
        Ok(json!({ "success": true }))
    })
}

fn handle_redclaw_runner_set_config(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    with_store_mut(state, |store| {
        if let Some(value) = payload_u32(&payload, "intervalMinutes") {
            store.redclaw_runner.interval_minutes = value.max(1);
        }
        if let Some(value) = payload_bool(&payload, "keepAliveWhenNoWindow") {
            store.redclaw_runner.keep_alive_when_no_window = value;
        }
        if let Some(value) = payload_u32(&payload, "maxProjectsPerTick") {
            store.redclaw_runner.max_projects_per_tick = value.max(1);
        }
        if let Some(value) = payload_u32(&payload, "maxAutomationPerTick") {
            store.redclaw_runner.max_automation_per_tick = value.max(1);
        }
        if let Some(value) = payload_bool(&payload, "heartbeatEnabled") {
            store.redclaw_runner.heartbeat_enabled = value;
        }
        if let Some(value) = payload_u32(&payload, "heartbeatIntervalMinutes") {
            store.redclaw_runner.heartbeat_interval_minutes = value.max(1);
        }
        if let Some(value) = payload_bool(&payload, "heartbeatSuppressEmptyReport") {
            store.redclaw_runner.heartbeat_suppress_empty_report = value;
        }
        if let Some(value) = payload_bool(&payload, "heartbeatReportToMainSession") {
            store.redclaw_runner.heartbeat_report_to_main_session = value;
        }
        if payload_field(&payload, "heartbeatPrompt").is_some() {
            store.redclaw_runner.heartbeat_prompt = payload_string(&payload, "heartbeatPrompt");
        }
        store.redclaw_runner.next_tick_at = if store.redclaw_runner.is_ticking {
            next_interval_run_at(store.redclaw_runner.last_tick_at.as_deref(), Some(store.redclaw_runner.interval_minutes))
        } else {
            None
        };
        store.redclaw_runner.heartbeat_next_run_at = compute_redclaw_heartbeat_next_run(
            &store.redclaw_runner,
            store
                .redclaw_runner
                .heartbeat_last_run_at
                .as_deref()
                .or(store.redclaw_runner.last_tick_at.as_deref()),
        );
        Ok(json!({ "success": true }))
    })
}

fn handle_redclaw_runner_test_config(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let settings_payload = if payload.as_object().map(|object| object.is_empty()).unwrap_or(true) {
        with_store(state, |store| Ok(store.settings.clone()))?
    } else {
        payload
    };

    let issues = redclaw_generation_config_issues(&settings_payload);
    if !issues.is_empty() {
        return Ok(json!({
            "success": false,
            "error": issues.join(" | ")
        }));
    }

    let config = redclaw_generation_config_from_settings(&settings_payload)
        .ok_or_else(|| "Missing RedClaw generation config".to_string())?;

    match test_redclaw_generation_config(&config) {
        Ok(result) => Ok(result),
        Err(error) => Ok(json!({
            "success": false,
            "error": error
        })),
    }
}

fn handle_redclaw_runner_set_project(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let project_id = payload_string(&payload, "projectId").ok_or_else(|| "Missing projectId".to_string())?;
    let enabled = payload_bool(&payload, "enabled").unwrap_or(true);
    let prompt = if payload_field(&payload, "prompt").is_some() {
        Some(
            payload_string(&payload, "prompt")
                .map(|item| item.trim().to_string())
                .filter(|item| !item.is_empty()),
        )
    } else {
        None
    };

    with_store_mut(state, |store| {
        upsert_redclaw_project_state(store, &project_id, Some(enabled), prompt, None, None, None);
        Ok(json!({ "success": true }))
    })
}

fn handle_redclaw_runner_list_scheduled(state: &State<'_, AppState>) -> Result<Value, String> {
    with_store(state, |store| {
        let mut tasks = store.redclaw_scheduled_tasks.clone();
        sort_redclaw_scheduled_tasks(&mut tasks);
        Ok(json!({ "success": true, "tasks": tasks }))
    })
}

fn handle_redclaw_runner_list_output_archive(state: &State<'_, AppState>) -> Result<Value, String> {
    with_store(state, |store| {
        Ok(json!({
            "success": true,
            "items": store.redclaw_output_archive.clone()
        }))
    })
}

fn handle_redclaw_runner_remove_output_archive(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let archive_id = payload_string(&payload, "archiveId").ok_or_else(|| "Missing archiveId".to_string())?;

    with_store_mut(state, |store| {
        let previous_len = store.redclaw_output_archive.len();
        store.redclaw_output_archive.retain(|item| item.id != archive_id);
        if store.redclaw_output_archive.len() == previous_len {
            return Ok(json!({ "success": false, "error": "Archive item not found" }));
        }

        push_activity(
            store,
            "redclaw-archive",
            "Removed one archived draft",
            Some(archive_id),
            "info",
        );

        Ok(json!({ "success": true }))
    })
}

fn handle_redclaw_runner_clear_output_archive(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let project_id = payload_string(&payload, "projectId");
    let source_kind = payload_string(&payload, "sourceKind");

    with_store_mut(state, |store| {
        let previous_len = store.redclaw_output_archive.len();
        store.redclaw_output_archive.retain(|item| {
            let project_matches = project_id
                .as_deref()
                .map(|value| item.project_id.as_deref() == Some(value))
                .unwrap_or(true);
            let source_matches = source_kind
                .as_deref()
                .map(|value| item.source_kind == value)
                .unwrap_or(true);

            !(project_matches && source_matches)
        });

        let removed_count = previous_len.saturating_sub(store.redclaw_output_archive.len());
        push_activity(
            store,
            "redclaw-archive",
            "Cleared archived drafts",
            Some(format!("Removed {removed_count} archive item(s).")),
            "info",
        );

        Ok(json!({
            "success": true,
            "removedCount": removed_count
        }))
    })
}

#[derive(Debug)]
struct RedClawScheduledTaskInput {
    name: String,
    enabled: bool,
    mode: String,
    prompt: String,
    project_id: Option<String>,
    interval_minutes: Option<u32>,
    time: Option<String>,
    weekdays: Vec<u32>,
    run_at: Option<String>,
    max_retries: u32,
    retry_delay_minutes: u32,
}

fn parse_redclaw_scheduled_task_input(payload: &Value, default_enabled: bool) -> Result<RedClawScheduledTaskInput, String> {
    let name = payload_string(payload, "name").ok_or_else(|| "Missing scheduled task name".to_string())?;
    let mode = payload_string(payload, "mode").unwrap_or_else(|| "interval".to_string());
    let prompt = payload_string(payload, "prompt").ok_or_else(|| "Missing scheduled task prompt".to_string())?;
    let interval_minutes = payload_u32(payload, "intervalMinutes").map(|value| value.max(1));
    let time = payload_string(payload, "time")
        .map(|value| value.trim().to_string())
        .filter(|value| parse_clock_time(Some(value.as_str())).is_some());
    let weekdays = sanitize_weekdays(&payload_u32_list(payload, "weekdays"));
    let run_at = payload_string(payload, "runAt")
        .and_then(|value| parse_local_datetime_value(Some(value.as_str())))
        .and_then(local_datetime_to_timestamp_millis);

    match mode.as_str() {
        "interval" => {
            if interval_minutes.is_none() {
                return Err("Interval scheduled task requires intervalMinutes".to_string());
            }
        }
        "daily" => {
            if time.is_none() {
                return Err("Daily scheduled task requires time in HH:MM format".to_string());
            }
        }
        "weekly" => {
            if time.is_none() {
                return Err("Weekly scheduled task requires time in HH:MM format".to_string());
            }
            if weekdays.is_empty() {
                return Err("Weekly scheduled task requires at least one weekday".to_string());
            }
        }
        "once" => {
            let Some(run_at_value) = run_at.as_deref() else {
                return Err("One-time scheduled task requires runAt".to_string());
            };
            if parse_timestamp_millis(Some(run_at_value)).unwrap_or(0) <= now_ms() {
                return Err("One-time scheduled task must be scheduled in the future".to_string());
            }
        }
        _ => return Err("Unsupported scheduled task mode".to_string()),
    }

    let scheduled_interval_minutes = match mode.as_str() {
        "interval" => interval_minutes,
        _ => None,
    };
    let scheduled_time = match mode.as_str() {
        "daily" | "weekly" => time,
        _ => None,
    };
    let scheduled_weekdays = if mode == "weekly" { weekdays } else { Vec::new() };
    let scheduled_run_at = if mode == "once" { run_at } else { None };

    Ok(RedClawScheduledTaskInput {
        name,
        enabled: payload_bool(payload, "enabled").unwrap_or(default_enabled),
        mode,
        prompt,
        project_id: payload_string(payload, "projectId"),
        interval_minutes: scheduled_interval_minutes,
        time: scheduled_time,
        weekdays: scheduled_weekdays,
        run_at: scheduled_run_at,
        max_retries: payload_u32(payload, "maxRetries").unwrap_or(0),
        retry_delay_minutes: payload_u32(payload, "retryDelayMinutes").unwrap_or(30).max(1),
    })
}

fn handle_redclaw_runner_add_scheduled(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let input = parse_redclaw_scheduled_task_input(&payload, true)?;
    let created_at = now_iso();

    with_store_mut(state, |store| {
        let task = RedClawScheduledTaskRecord {
            id: make_id("redclaw-scheduled"),
            name: input.name,
            enabled: input.enabled,
            mode: input.mode,
            prompt: input.prompt,
            project_id: input.project_id,
            interval_minutes: input.interval_minutes,
            time: input.time,
            weekdays: input.weekdays,
            run_at: input.run_at,
            created_at: created_at.clone(),
            updated_at: created_at.clone(),
            last_run_at: None,
            last_result: None,
            last_error: None,
            retry_count: 0,
            max_retries: input.max_retries,
            retry_delay_minutes: input.retry_delay_minutes,
            last_saved_manuscript_path: None,
            last_session_id: None,
            last_draft_strategy: None,
            last_reference_manuscript_path: None,
            next_run_at: None,
        };
        let mut task = task;
        task.next_run_at = compute_redclaw_scheduled_next_run(&task);
        store.redclaw_scheduled_tasks.push(task.clone());
        sort_redclaw_scheduled_tasks(&mut store.redclaw_scheduled_tasks);
        Ok(json!({ "success": true, "task": task }))
    })
}

fn handle_redclaw_runner_update_scheduled(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let task_id = payload_string(&payload, "taskId").ok_or_else(|| "Missing taskId".to_string())?;

    with_store_mut(state, |store| {
        let current_enabled = store
            .redclaw_scheduled_tasks
            .iter()
            .find(|item| item.id == task_id)
            .map(|item| item.enabled)
            .ok_or_else(|| "Scheduled task not found".to_string())?;
        let input = parse_redclaw_scheduled_task_input(&payload, current_enabled)?;
        let updated_at = now_iso();

        let updated_task = {
            let task = store
                .redclaw_scheduled_tasks
                .iter_mut()
                .find(|item| item.id == task_id)
                .ok_or_else(|| "Scheduled task not found".to_string())?;
            task.name = input.name;
            task.enabled = input.enabled;
            task.mode = input.mode;
            task.prompt = input.prompt;
            task.project_id = input.project_id;
            task.interval_minutes = input.interval_minutes;
            task.time = input.time;
            task.weekdays = input.weekdays;
            task.run_at = input.run_at;
            task.retry_count = 0;
            task.max_retries = input.max_retries;
            task.retry_delay_minutes = input.retry_delay_minutes;
            task.updated_at = updated_at;
            task.next_run_at = compute_redclaw_scheduled_next_run(task);
            task.clone()
        };

        sort_redclaw_scheduled_tasks(&mut store.redclaw_scheduled_tasks);
        Ok(json!({ "success": true, "task": updated_task }))
    })
}

fn handle_redclaw_runner_remove_scheduled(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let task_id = payload_string(&payload, "taskId").ok_or_else(|| "Missing taskId".to_string())?;
    with_store_mut(state, |store| {
        store.redclaw_scheduled_tasks.retain(|item| item.id != task_id);
        Ok(json!({ "success": true }))
    })
}

fn handle_redclaw_runner_set_scheduled_enabled(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let task_id = payload_string(&payload, "taskId").ok_or_else(|| "Missing taskId".to_string())?;
    let enabled = payload_bool(&payload, "enabled").unwrap_or(true);
    with_store_mut(state, |store| {
        let Some(task) = store.redclaw_scheduled_tasks.iter_mut().find(|item| item.id == task_id) else {
            return Ok(json!({ "success": false, "error": "Scheduled task not found" }));
        };
        task.enabled = enabled;
        task.retry_count = 0;
        task.updated_at = now_iso();
        task.next_run_at = compute_redclaw_scheduled_next_run(task);
        Ok(json!({ "success": true }))
    })
}

fn handle_redclaw_runner_run_scheduled_now(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let task_id = payload_string(&payload, "taskId").ok_or_else(|| "Missing taskId".to_string())?;
    let task = with_store(state, |store| {
        store.redclaw_scheduled_tasks
            .iter()
            .find(|item| item.id == task_id)
            .cloned()
            .ok_or_else(|| "Scheduled task not found".to_string())
    })?;

    let result = execute_redclaw_automation(
        state,
        format!("redclaw::scheduled::{}", task.id),
        "xhs-atelier:redclaw-scheduled",
        format!("Scheduled / {}", task.name),
        "Scheduled task",
        format!("Scheduled task / {}", task.name),
        task.project_id.clone(),
        task.prompt.clone(),
        task.name.clone(),
        task.last_saved_manuscript_path.clone(),
    );

    let (success, error_text, response_value) = match result {
        Ok(value) => {
            let success = value.get("success").and_then(Value::as_bool).unwrap_or(false);
            let error = value.get("error").and_then(Value::as_str).map(|item| item.to_string());
            (success, error, value)
        }
        Err(error) => (false, Some(error.clone()), json!({ "success": false, "error": error })),
    };
    let executed_at = now_iso();
    let saved_manuscript_path = value_string(&response_value, "savedManuscriptPath");
    let response_session_id = value_string(&response_value, "sessionId");
    let response_draft_strategy = value_string(&response_value, "draftStrategy");
    let response_reference_manuscript_path = value_string(&response_value, "referenceManuscriptPath");

    with_store_mut(state, |store| {
        let mut retry_scheduled = false;
        if let Some(task_mut) = store.redclaw_scheduled_tasks.iter_mut().find(|item| item.id == task_id) {
            task_mut.updated_at = executed_at.clone();
            task_mut.last_run_at = Some(executed_at.clone());
            task_mut.last_result = Some(if success { "success".to_string() } else { "error".to_string() });
            task_mut.last_error = error_text.clone();
            if let Some(value) = response_session_id.clone() {
                task_mut.last_session_id = Some(value);
            }
            if success {
                task_mut.last_saved_manuscript_path = saved_manuscript_path.clone();
                task_mut.last_draft_strategy = response_draft_strategy.clone();
                task_mut.last_reference_manuscript_path = response_reference_manuscript_path.clone();
            }
            retry_scheduled = apply_redclaw_scheduled_task_outcome(task_mut, success);
        }
        if let Some(project_id) = task.project_id.as_deref() {
            upsert_redclaw_project_state(
                store,
                project_id,
                None,
                None,
                Some(Some(executed_at.clone())),
                Some(Some(if success { "success".to_string() } else { "error".to_string() })),
                Some(error_text.clone()),
            );
        }
        push_activity(
            store,
            "redclaw-scheduled",
            format!("Scheduled task executed: {}", task.name),
            Some(if success {
                "RedClaw completed one scheduled task run.".to_string()
            } else if retry_scheduled {
                format!(
                    "{} Retrying in {} minute(s).",
                    error_text.clone().unwrap_or_else(|| "Scheduled task execution failed.".to_string()),
                    task.retry_delay_minutes.max(1)
                )
            } else {
                error_text.clone().unwrap_or_else(|| "Scheduled task execution failed.".to_string())
            }),
            if success { "success" } else { "warning" },
        );
        Ok(())
    })?;

    Ok(response_value)
}

fn handle_redclaw_runner_list_long_cycle(state: &State<'_, AppState>) -> Result<Value, String> {
    with_store(state, |store| {
        let mut tasks = store.redclaw_long_cycle_tasks.clone();
        sort_redclaw_long_cycle_tasks(&mut tasks);
        Ok(json!({ "success": true, "tasks": tasks }))
    })
}

#[derive(Debug)]
struct RedClawLongCycleTaskInput {
    name: String,
    enabled: bool,
    objective: String,
    step_prompt: String,
    project_id: Option<String>,
    interval_minutes: u32,
    total_rounds: u32,
    max_retries: u32,
    retry_delay_minutes: u32,
}

fn parse_redclaw_long_cycle_task_input(payload: &Value, default_enabled: bool) -> Result<RedClawLongCycleTaskInput, String> {
    Ok(RedClawLongCycleTaskInput {
        name: payload_string(payload, "name").ok_or_else(|| "Missing long cycle name".to_string())?,
        enabled: payload_bool(payload, "enabled").unwrap_or(default_enabled),
        objective: payload_string(payload, "objective").ok_or_else(|| "Missing objective".to_string())?,
        step_prompt: payload_string(payload, "stepPrompt").ok_or_else(|| "Missing stepPrompt".to_string())?,
        project_id: payload_string(payload, "projectId"),
        interval_minutes: payload_u32(payload, "intervalMinutes").unwrap_or(1440).max(1),
        total_rounds: payload_u32(payload, "totalRounds").unwrap_or(7).max(1),
        max_retries: payload_u32(payload, "maxRetries").unwrap_or(0),
        retry_delay_minutes: payload_u32(payload, "retryDelayMinutes").unwrap_or(30).max(1),
    })
}

fn handle_redclaw_runner_add_long_cycle(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let input = parse_redclaw_long_cycle_task_input(&payload, true)?;
    let created_at = now_iso();

    with_store_mut(state, |store| {
        let mut task = RedClawLongCycleTaskRecord {
            id: make_id("redclaw-long-cycle"),
            name: input.name,
            enabled: input.enabled,
            status: "paused".to_string(),
            objective: input.objective,
            step_prompt: input.step_prompt,
            project_id: input.project_id,
            interval_minutes: input.interval_minutes,
            total_rounds: input.total_rounds,
            completed_rounds: 0,
            created_at: created_at.clone(),
            updated_at: created_at,
            last_run_at: None,
            last_result: None,
            last_error: None,
            retry_count: 0,
            max_retries: input.max_retries,
            retry_delay_minutes: input.retry_delay_minutes,
            last_saved_manuscript_path: None,
            last_session_id: None,
            last_draft_strategy: None,
            last_reference_manuscript_path: None,
            next_run_at: None,
        };
        sync_redclaw_long_cycle_task_state(&mut task);
        store.redclaw_long_cycle_tasks.push(task.clone());
        sort_redclaw_long_cycle_tasks(&mut store.redclaw_long_cycle_tasks);
        Ok(json!({ "success": true, "task": task }))
    })
}

fn handle_redclaw_runner_update_long_cycle(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let task_id = payload_string(&payload, "taskId").ok_or_else(|| "Missing taskId".to_string())?;

    with_store_mut(state, |store| {
        let current_enabled = store
            .redclaw_long_cycle_tasks
            .iter()
            .find(|item| item.id == task_id)
            .map(|item| item.enabled)
            .ok_or_else(|| "Long cycle task not found".to_string())?;
        let input = parse_redclaw_long_cycle_task_input(&payload, current_enabled)?;
        let updated_at = now_iso();

        let updated_task = {
            let task = store
                .redclaw_long_cycle_tasks
                .iter_mut()
                .find(|item| item.id == task_id)
                .ok_or_else(|| "Long cycle task not found".to_string())?;
            task.name = input.name;
            task.enabled = input.enabled;
            task.objective = input.objective;
            task.step_prompt = input.step_prompt;
            task.project_id = input.project_id;
            task.interval_minutes = input.interval_minutes;
            task.total_rounds = input.total_rounds;
            task.completed_rounds = task.completed_rounds.min(task.total_rounds);
            task.retry_count = 0;
            task.max_retries = input.max_retries;
            task.retry_delay_minutes = input.retry_delay_minutes;
            task.updated_at = updated_at;
            sync_redclaw_long_cycle_task_state(task);
            task.clone()
        };

        sort_redclaw_long_cycle_tasks(&mut store.redclaw_long_cycle_tasks);
        Ok(json!({ "success": true, "task": updated_task }))
    })
}

fn handle_redclaw_runner_remove_long_cycle(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let task_id = payload_string(&payload, "taskId").ok_or_else(|| "Missing taskId".to_string())?;
    with_store_mut(state, |store| {
        store.redclaw_long_cycle_tasks.retain(|item| item.id != task_id);
        Ok(json!({ "success": true }))
    })
}

fn handle_redclaw_runner_set_long_cycle_enabled(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let task_id = payload_string(&payload, "taskId").ok_or_else(|| "Missing taskId".to_string())?;
    let enabled = payload_bool(&payload, "enabled").unwrap_or(true);
    with_store_mut(state, |store| {
        let Some(task) = store.redclaw_long_cycle_tasks.iter_mut().find(|item| item.id == task_id) else {
            return Ok(json!({ "success": false, "error": "Long cycle task not found" }));
        };
        task.enabled = enabled;
        task.retry_count = 0;
        task.updated_at = now_iso();
        sync_redclaw_long_cycle_task_state(task);
        Ok(json!({ "success": true }))
    })
}

fn handle_redclaw_runner_run_long_cycle_now(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let task_id = payload_string(&payload, "taskId").ok_or_else(|| "Missing taskId".to_string())?;
    let task = with_store(state, |store| {
        store.redclaw_long_cycle_tasks
            .iter()
            .find(|item| item.id == task_id)
            .cloned()
            .ok_or_else(|| "Long cycle task not found".to_string())
    })?;

    let step_prompt = format!(
        "Long-cycle objective: {}\nCurrent round: {} / {}\n\n{}",
        task.objective,
        task.completed_rounds + 1,
        task.total_rounds,
        task.step_prompt
    );

    let result = execute_redclaw_automation(
        state,
        format!("redclaw::long-cycle::{}", task.id),
        "xhs-atelier:redclaw-long-cycle",
        format!("Long cycle / {}", task.name),
        "Long-cycle task",
        format!("Long cycle / {} / round {}", task.name, task.completed_rounds + 1),
        task.project_id.clone(),
        step_prompt,
        task.name.clone(),
        task.last_saved_manuscript_path.clone(),
    );

    let (success, error_text, response_value) = match result {
        Ok(value) => {
            let success = value.get("success").and_then(Value::as_bool).unwrap_or(false);
            let error = value.get("error").and_then(Value::as_str).map(|item| item.to_string());
            (success, error, value)
        }
        Err(error) => (false, Some(error.clone()), json!({ "success": false, "error": error })),
    };
    let executed_at = now_iso();
    let saved_manuscript_path = value_string(&response_value, "savedManuscriptPath");
    let response_session_id = value_string(&response_value, "sessionId");
    let response_draft_strategy = value_string(&response_value, "draftStrategy");
    let response_reference_manuscript_path = value_string(&response_value, "referenceManuscriptPath");

    with_store_mut(state, |store| {
        let mut retry_scheduled = false;
        if let Some(task_mut) = store.redclaw_long_cycle_tasks.iter_mut().find(|item| item.id == task_id) {
            task_mut.updated_at = executed_at.clone();
            task_mut.last_run_at = Some(executed_at.clone());
            task_mut.last_result = Some(if success { "success".to_string() } else { "error".to_string() });
            task_mut.last_error = error_text.clone();
            if let Some(value) = response_session_id.clone() {
                task_mut.last_session_id = Some(value);
            }
            if success {
                task_mut.last_saved_manuscript_path = saved_manuscript_path.clone();
                task_mut.last_draft_strategy = response_draft_strategy.clone();
                task_mut.last_reference_manuscript_path = response_reference_manuscript_path.clone();
            }
            retry_scheduled = apply_redclaw_long_cycle_task_outcome(task_mut, success);
        }
        if let Some(project_id) = task.project_id.as_deref() {
            upsert_redclaw_project_state(
                store,
                project_id,
                None,
                None,
                Some(Some(executed_at.clone())),
                Some(Some(if success { "success".to_string() } else { "error".to_string() })),
                Some(error_text.clone()),
            );
        }
        push_activity(
            store,
            "redclaw-long-cycle",
            format!("Long cycle advanced: {}", task.name),
            Some(if success {
                "RedClaw completed one long-cycle round.".to_string()
            } else if retry_scheduled {
                format!(
                    "{} Retrying in {} minute(s).",
                    error_text.clone().unwrap_or_else(|| "Long-cycle task execution failed.".to_string()),
                    task.retry_delay_minutes.max(1)
                )
            } else {
                error_text.clone().unwrap_or_else(|| "Long-cycle task execution failed.".to_string())
            }),
            if success { "success" } else { "warning" },
        );
        Ok(())
    })?;

    Ok(response_value)
}

fn execute_redclaw_runner_heartbeat(state: &State<'_, AppState>) -> Result<Option<String>, String> {
    let heartbeat_run_at = now_iso();
    let (digest, suppress_empty_report) = with_store(state, |store| {
        let last_heartbeat_at = parse_timestamp_millis(store.redclaw_runner.heartbeat_last_run_at.as_deref()).unwrap_or(0);
        let recent_activities = store
            .activities
            .iter()
            .filter(|item| parse_timestamp_millis(Some(item.created_at.as_str())).unwrap_or(0) > last_heartbeat_at)
            .take(6)
            .map(|item| {
                let detail = item
                    .detail
                    .as_deref()
                    .filter(|value| !value.trim().is_empty())
                    .map(|value| format!(" - {value}"))
                    .unwrap_or_default();
                format!("- {}{}", item.title, detail)
            })
            .collect::<Vec<_>>();
        let active_scheduled = store.redclaw_scheduled_tasks.iter().filter(|item| item.enabled).count();
        let active_long_cycle = store
            .redclaw_long_cycle_tasks
            .iter()
            .filter(|item| item.enabled && item.completed_rounds < item.total_rounds)
            .count();
        let has_recent_activity = !recent_activities.is_empty();

        let mut sections = vec![
            format!("Heartbeat at {heartbeat_run_at}"),
            format!("Active scheduled tasks: {active_scheduled}"),
            format!("Active long-cycle tasks: {active_long_cycle}"),
        ];

        if has_recent_activity {
            sections.push("Recent activity:".to_string());
            sections.extend(recent_activities);
        }

        let digest = if !has_recent_activity && store.redclaw_runner.heartbeat_suppress_empty_report {
            None
        } else {
            Some(sections.join("\n"))
        };

        Ok((digest, store.redclaw_runner.heartbeat_suppress_empty_report))
    })?;

    with_store_mut(state, |store| {
        store.redclaw_runner.heartbeat_last_run_at = Some(heartbeat_run_at.clone());
        store.redclaw_runner.heartbeat_next_run_at =
            compute_redclaw_heartbeat_next_run(&store.redclaw_runner, Some(heartbeat_run_at.as_str()));
        store.redclaw_runner.heartbeat_last_digest = digest.clone();
        if let Some(summary) = digest.clone() {
            push_activity(
                store,
                "redclaw-heartbeat",
                "RedClaw heartbeat updated",
                Some(summary),
                "info",
            );
        } else if !suppress_empty_report {
            push_activity(
                store,
                "redclaw-heartbeat",
                "RedClaw heartbeat completed",
                Some("No new automation activity was detected in this interval.".to_string()),
                "info",
            );
        }
        Ok(())
    })?;

    Ok(digest)
}

fn should_redclaw_runner_execute_without_window(app: &AppHandle, state: &State<'_, AppState>) -> Result<bool, String> {
    if !app.webview_windows().is_empty() {
        return Ok(true);
    }

    with_store(state, |store| Ok(store.redclaw_runner.keep_alive_when_no_window))
}

fn run_redclaw_scheduler_tick(app: &AppHandle) -> Result<(), String> {
    let state = app.state::<AppState>();
    let now = now_ms();
    let (should_run, direct_generation_enabled, due_candidates, heartbeat_due) = with_store_mut(&state, |store| {
        normalize_redclaw_runner_schedule(store);

        if !store.redclaw_runner.is_ticking {
            return Ok((false, false, Vec::<RedClawAutomationCandidate>::new(), false));
        }

        let tick_due = parse_timestamp_millis(store.redclaw_runner.next_tick_at.as_deref())
            .map(|value| value <= now)
            .unwrap_or(true);
        if !tick_due {
            return Ok((false, false, Vec::<RedClawAutomationCandidate>::new(), false));
        }

        Ok((
            true,
            redclaw_generation_config_from_settings(&store.settings).is_some()
                && redclaw_generation_config_issues(&store.settings).is_empty(),
            collect_redclaw_due_candidates(store, now),
            parse_timestamp_millis(store.redclaw_runner.heartbeat_next_run_at.as_deref())
                .map(|value| value <= now)
                .unwrap_or(false),
        ))
    })?;

    if !should_run {
        return Ok(());
    }

    if !should_redclaw_runner_execute_without_window(app, &state)? {
        return Ok(());
    }

    let mut error_messages = Vec::new();

    if direct_generation_enabled {
        for candidate in due_candidates {
            let result = match candidate.kind {
                RedClawAutomationKind::Scheduled => {
                    handle_redclaw_runner_run_scheduled_now(json!({ "taskId": candidate.task_id }), &state)
                }
                RedClawAutomationKind::LongCycle => {
                    handle_redclaw_runner_run_long_cycle_now(json!({ "taskId": candidate.task_id }), &state)
                }
            };

            match result {
                Ok(value) if value.get("success").and_then(Value::as_bool).unwrap_or(false) => {}
                Ok(value) => {
                    let error = value
                        .get("error")
                        .and_then(Value::as_str)
                        .unwrap_or("RedClaw automation returned an unknown error.")
                        .to_string();
                    error_messages.push(error);
                }
                Err(error) => error_messages.push(error),
            }
        }
    } else {
        error_messages.push(
            "Configure the AI model, endpoint, and API key in Settings before using RedClaw automation."
                .to_string(),
        );
    }

    if heartbeat_due {
        if let Err(error) = execute_redclaw_runner_heartbeat(&state) {
            error_messages.push(error);
        }
    }

    let tick_finished_at = now_iso();
    with_store_mut(&state, |store| {
        normalize_redclaw_runner_schedule(store);
        store.redclaw_runner.last_tick_at = Some(tick_finished_at.clone());
        store.redclaw_runner.next_tick_at = if store.redclaw_runner.is_ticking {
            next_interval_run_at(Some(tick_finished_at.as_str()), Some(store.redclaw_runner.interval_minutes))
        } else {
            None
        };

        if error_messages.is_empty() {
            store.redclaw_runner.last_error = None;
        } else {
            let combined_error = error_messages.join(" | ");
            let should_log = store.redclaw_runner.last_error.as_deref() != Some(combined_error.as_str());
            store.redclaw_runner.last_error = Some(combined_error.clone());
            if should_log {
                push_activity(
                    store,
                    "redclaw-runner",
                    "RedClaw runner reported a warning",
                    Some(combined_error),
                    "warning",
                );
            }
        }

        Ok(())
    })?;

    if let Ok(status) = build_redclaw_runner_status(&state) {
        let _ = app.emit("redclaw:runner-updated", status);
    }

    Ok(())
}

fn spawn_redclaw_scheduler(app: &AppHandle) {
    let app_handle = app.clone();
    std::thread::spawn(move || loop {
        std::thread::sleep(std::time::Duration::from_secs(10));
        let _ = run_redclaw_scheduler_tick(&app_handle);
    });
}

fn make_id(prefix: &str) -> String {
    format!("{prefix}-{}", now_ms())
}

fn normalize_tags(tags: Vec<String>) -> Vec<String> {
    let mut normalized = Vec::new();
    for tag in tags {
        let trimmed = tag.trim().trim_start_matches('#').to_string();
        if trimmed.is_empty() {
            continue;
        }
        if !normalized.iter().any(|item| item == &trimmed) {
            normalized.push(trimmed);
        }
    }
    normalized
}

fn tags_from_value(value: Option<&Value>) -> Vec<String> {
    let Some(value) = value else {
        return Vec::new();
    };

    if let Some(tags) = value.as_array() {
        return normalize_tags(
            tags.iter()
                .filter_map(|item| normalize_string(Some(item)).or_else(|| value_string(item, "name")))
                .collect(),
        );
    }

    if let Some(text) = value.as_str() {
        return normalize_tags(
            text.replace('\u{FF0C}', ",")
                .split([',', ' ', '\n', '\t'])
                .map(str::to_string)
                .collect(),
        );
    }

    Vec::new()
}

fn subject_record_from_input(input: SubjectMutationInput, existing: Option<SubjectRecord>) -> SubjectRecord {
    let SubjectMutationInput {
        id,
        name,
        category_id,
        description,
        tags,
        attributes,
        images,
        voice,
    } = input;

    let existing_record = existing.as_ref();
    let created_at = existing_record
        .map(|item| item.created_at.clone())
        .unwrap_or_else(now_iso);

    let (image_paths, absolute_image_paths, preview_urls, primary_preview_url) = if let Some(images) = images {
        let image_paths: Vec<String> = images
            .iter()
            .enumerate()
            .map(|(index, item)| {
                item.relative_path
                    .clone()
                    .or_else(|| item.name.clone().map(|name| format!("inline:{index}:{name}")))
                    .or_else(|| item.data_url.clone())
                    .unwrap_or_else(|| format!("inline:{index}"))
            })
            .collect();

        let preview_urls: Vec<String> = images
            .iter()
            .filter_map(|item| item.data_url.clone().or_else(|| item.relative_path.clone()))
            .collect();

        (
            image_paths.clone(),
            image_paths,
            preview_urls.clone(),
            preview_urls.first().cloned(),
        )
    } else if let Some(existing) = existing_record {
        (
            existing.image_paths.clone(),
            existing.absolute_image_paths.clone(),
            existing.preview_urls.clone(),
            existing.primary_preview_url.clone(),
        )
    } else {
        (Vec::new(), Vec::new(), Vec::new(), None)
    };

    let next_voice_script = match voice.as_ref().and_then(|item| item.script_text.as_ref()) {
        Some(script) if script.trim().is_empty() => None,
        Some(script) => Some(script.trim().to_string()),
        None => existing_record.and_then(|item| item.voice_script.clone()),
    };

    let next_voice_preview_url = voice.as_ref().and_then(|item| {
        item.data_url
            .clone()
            .or_else(|| item.relative_path.clone())
            .filter(|value| !value.is_empty())
    });
    let next_voice_path = voice.as_ref().and_then(|item| {
        item.relative_path
            .clone()
            .or_else(|| item.name.clone().map(|file_name| format!("inline-voice:{file_name}")))
    });
    let has_voice_asset_update = next_voice_preview_url.is_some() || next_voice_path.is_some();

    let (voice_path, absolute_voice_path, voice_preview_url) = if has_voice_asset_update {
        (
            next_voice_path.clone(),
            next_voice_path,
            next_voice_preview_url,
        )
    } else if let Some(existing) = existing_record {
        (
            existing.voice_path.clone(),
            existing.absolute_voice_path.clone(),
            existing.voice_preview_url.clone(),
        )
    } else {
        (None, None, None)
    };

    SubjectRecord {
        id: id.unwrap_or_else(|| make_id("subject")),
        name,
        category_id: category_id.filter(|item| !item.is_empty()),
        description: description.filter(|item| !item.trim().is_empty()),
        tags: normalize_tags(tags.unwrap_or_default()),
        attributes: attributes.unwrap_or_default(),
        image_paths,
        voice_path,
        voice_script: next_voice_script,
        created_at,
        updated_at: now_iso(),
        absolute_image_paths,
        preview_urls,
        primary_preview_url,
        absolute_voice_path,
        voice_preview_url,
    }
}

fn bridge_root(store_path: &Path) -> Result<PathBuf, String> {
    let Some(parent) = store_path.parent() else {
        return Err("Unable to locate the app data directory.".to_string());
    };
    Ok(parent.join("extension-bridge").join("xhs-collector"))
}

fn bridge_inbox_dir(store_path: &Path) -> Result<PathBuf, String> {
    Ok(bridge_root(store_path)?.join("inbox"))
}

fn bridge_imported_dir(store_path: &Path) -> Result<PathBuf, String> {
    Ok(bridge_root(store_path)?.join("imported"))
}

fn bridge_manifest_path(store_path: &Path) -> Result<PathBuf, String> {
    Ok(bridge_root(store_path)?.join("bridge-manifest.json"))
}

fn exports_dir(store_path: &Path) -> Result<PathBuf, String> {
    let Some(parent) = store_path.parent() else {
        return Err("Unable to locate the app data directory.".to_string());
    };
    Ok(parent.join("exports"))
}

fn ensure_directory(path: &Path) -> Result<(), String> {
    fs::create_dir_all(path).map_err(|error| error.to_string())
}

fn normalize_relative_path(value: &str) -> String {
    value
        .replace('\\', "/")
        .split('/')
        .filter(|segment| !segment.is_empty() && *segment != "." && *segment != "..")
        .collect::<Vec<_>>()
        .join("/")
}

fn join_relative(parent: &str, name: &str) -> String {
    let parent = normalize_relative_path(parent);
    let name = normalize_relative_path(name);

    if parent.is_empty() {
        name
    } else if name.is_empty() {
        parent
    } else {
        format!("{parent}/{name}")
    }
}

fn ensure_markdown_extension(value: &str) -> String {
    let normalized = normalize_relative_path(value);
    if normalized.is_empty() {
        "untitled.md".to_string()
    } else if normalized.ends_with(".md") {
        normalized
    } else {
        format!("{normalized}.md")
    }
}

fn manuscript_title_from_path(relative_path: &str) -> String {
    Path::new(relative_path)
        .file_stem()
        .and_then(OsStr::to_str)
        .unwrap_or("Untitled")
        .to_string()
}

fn manuscript_id_from_path(relative_path: &str) -> String {
    normalize_relative_path(relative_path)
        .replace('/', "-")
        .replace('.', "-")
}

fn safe_markdown_file_name(value: &str) -> String {
    let mut sanitized = String::new();
    for character in value.chars() {
        if matches!(character, '\\' | '/' | ':' | '*' | '?' | '"' | '<' | '>' | '|') {
            sanitized.push('-');
        } else if character.is_control() {
            continue;
        } else {
            sanitized.push(character);
        }
    }

    let collapsed = sanitized
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .trim()
        .to_string();

    let base = if collapsed.is_empty() {
        "untitled-redclaw-draft".to_string()
    } else {
        collapsed
    };

    if base.ends_with(".md") {
        base
    } else {
        format!("{base}.md")
    }
}

fn truncate_for_prompt(text: &str, max_chars: usize) -> String {
    let truncated: String = text.chars().take(max_chars).collect();
    if text.chars().count() > max_chars {
        format!("{truncated}\n\n[Truncated to the first {max_chars} characters for prompt context.]")
    } else {
        truncated
    }
}

fn active_space_workspace_root(state: &State<'_, AppState>) -> Result<PathBuf, String> {
    let active_space_id = with_store(state, |store| Ok(store.active_space_id.clone()))?;
    let root = app_root_dir().join("spaces").join(active_space_id);
    ensure_directory(&root)?;
    Ok(root)
}

fn manuscripts_root(state: &State<'_, AppState>) -> Result<PathBuf, String> {
    let root = active_space_workspace_root(state)?.join("manuscripts");
    ensure_directory(&root)?;
    Ok(root)
}

fn default_redclaw_automation_manuscript_path(project_title: Option<&str>, draft_name: &str) -> String {
    let folder_name = project_title
        .map(sanitize_filename)
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| "unassigned".to_string());

    join_relative(
        &join_relative("xhs-atelier/automation-drafts", &folder_name),
        &safe_markdown_file_name(draft_name),
    )
}

fn resolve_redclaw_automation_manuscript_path(
    existing_path: Option<&str>,
    project_title: Option<&str>,
    draft_name: &str,
) -> String {
    existing_path
        .map(ensure_markdown_extension)
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| default_redclaw_automation_manuscript_path(project_title, draft_name))
}

fn resolve_manuscript_path(state: &State<'_, AppState>, relative_path: &str) -> Result<(String, PathBuf), String> {
    let normalized = normalize_relative_path(relative_path);
    let root = manuscripts_root(state)?;
    let path = if normalized.is_empty() {
        root.clone()
    } else {
        root.join(&normalized)
    };
    Ok((normalized, path))
}

fn read_manuscript_content_if_exists(state: &State<'_, AppState>, relative_path: &str) -> Option<String> {
    let normalized = normalize_relative_path(relative_path);
    if normalized.is_empty() {
        return None;
    }

    let (_, path) = resolve_manuscript_path(state, &normalized).ok()?;
    let content = fs::read_to_string(path).ok()?;
    let trimmed = content.trim().to_string();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed)
    }
}

fn write_bridge_manifest(store_path: &Path) -> Result<Value, String> {
    let root = bridge_root(store_path)?;
    let inbox = bridge_inbox_dir(store_path)?;
    let imported = bridge_imported_dir(store_path)?;
    ensure_directory(&root)?;
    ensure_directory(&inbox)?;
    ensure_directory(&imported)?;

    let manifest = json!({
        "appName": "XHS Atelier",
        "version": env!("CARGO_PKG_VERSION"),
        "bridgeRoot": root.display().to_string(),
        "inboxDir": inbox.display().to_string(),
        "importedDir": imported.display().to_string(),
        "acceptedFormats": [
            "JSON array exported from xhs-atelier-collector",
            "JSON object with posts/items/data arrays",
            "JSONL with one post per line"
        ],
        "notes": [
            "Drop exported JSON or JSONL files into the inbox directory.",
            "After the desktop app imports from the bridge directory, files are moved into the imported directory."
        ]
    });

    let path = bridge_manifest_path(store_path)?;
    let serialized = serde_json::to_string_pretty(&manifest).map_err(|error| error.to_string())?;
    fs::write(path, serialized).map_err(|error| error.to_string())?;

    Ok(manifest)
}

fn count_bridge_payload_files(store_path: &Path) -> Result<usize, String> {
    let inbox = bridge_inbox_dir(store_path)?;
    ensure_directory(&inbox)?;
    let entries = fs::read_dir(inbox).map_err(|error| error.to_string())?;
    let count = entries
        .filter_map(Result::ok)
        .filter(|entry| entry.path().is_file())
        .filter(|entry| {
            matches!(
                entry.path().extension().and_then(OsStr::to_str).map(|value| value.to_lowercase()),
                Some(ext) if ext == "json" || ext == "jsonl"
            )
        })
        .count();
    Ok(count)
}

fn default_indexing_stats() -> Value {
    json!({
        "isIndexing": false,
        "totalQueueLength": 0,
        "activeItems": [],
        "queuedItems": [],
        "processedCount": 0,
        "totalStats": {
            "vectors": 0,
            "documents": 0
        }
    })
}

fn push_activity(
    store: &mut AppStore,
    kind: &str,
    title: impl Into<String>,
    detail: Option<String>,
    tone: &str,
) {
    store.activities.insert(
        0,
        ActivityRecord {
            id: make_id("activity"),
            kind: kind.to_string(),
            title: title.into(),
            detail,
            tone: tone.to_string(),
            created_at: now_iso(),
        },
    );

    if store.activities.len() > 48 {
        store.activities.truncate(48);
    }
}

fn snippet_from_text(text: &str, max_chars: usize) -> Option<String> {
    let compact = text
        .split_whitespace()
        .filter(|segment| !segment.is_empty())
        .collect::<Vec<_>>()
        .join(" ")
        .trim()
        .to_string();

    if compact.is_empty() {
        return None;
    }

    let truncated: String = compact.chars().take(max_chars).collect();
    if compact.chars().count() > max_chars {
        Some(format!("{truncated}..."))
    } else {
        Some(truncated)
    }
}

fn redclaw_output_source_kind(context_type: Option<&str>) -> String {
    match context_type.unwrap_or_default() {
        "xhs-atelier:redclaw-scheduled" => "scheduled".to_string(),
        "xhs-atelier:redclaw-long-cycle" => "longCycle".to_string(),
        "xhs-atelier:redclaw-entry" => "manual".to_string(),
        _ => "manual".to_string(),
    }
}

fn normalize_optional_relative_path(value: Option<&str>) -> Option<String> {
    value
        .map(normalize_relative_path)
        .filter(|value| !value.trim().is_empty())
}

fn infer_redclaw_draft_strategy(
    explicit_strategy: Option<&str>,
    reference_manuscript_path: Option<&str>,
    manuscript_path: Option<&str>,
) -> Option<String> {
    if let Some(strategy) = explicit_strategy
        .map(str::trim)
        .filter(|value| !value.is_empty())
    {
        return Some(strategy.to_string());
    }

    let normalized_reference = normalize_optional_relative_path(reference_manuscript_path);
    let normalized_target = normalize_optional_relative_path(manuscript_path);

    match (normalized_reference, normalized_target) {
        (Some(reference), Some(target)) if reference == target => Some("continue".to_string()),
        (Some(_), Some(_)) => Some("rewrite".to_string()),
        (None, Some(_)) => Some("fresh".to_string()),
        (Some(_), None) => Some("continue".to_string()),
        (None, None) => None,
    }
}

fn push_redclaw_output_archive(store: &mut AppStore, item: RedClawOutputArchiveRecord) {
    store.redclaw_output_archive.insert(0, item);
    if store.redclaw_output_archive.len() > 120 {
        store.redclaw_output_archive.truncate(120);
    }
}

fn sort_chat_sessions_desc(sessions: &mut [ChatSessionRecord]) {
    sessions.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
}

fn sort_chat_messages_asc(messages: &mut [ChatMessageRecord]) {
    messages.sort_by(|left, right| left.created_at.cmp(&right.created_at));
}

fn chat_session_id_from_payload(payload: &Value) -> String {
    payload_string(payload, "sessionId")
        .or_else(|| normalize_string(Some(payload)))
        .unwrap_or_default()
}

fn emit_space_changed(app: &AppHandle, active_space_id: &str) {
    let _ = app.emit("space:changed", json!({ "activeSpaceId": active_space_id }));
}

fn capture_title_from_value(value: &Value) -> String {
    value_string(value, "title")
        .or_else(|| value_string(value, "displayTitle"))
        .or_else(|| value_string(value, "display_title"))
        .or_else(|| value_string(value, "name"))
        .or_else(|| value_string(value, "noteId"))
        .or_else(|| value_string(value, "note_id"))
        .or_else(|| value_string(value, "url"))
        .unwrap_or_else(|| "Untitled capture".to_string())
}

fn capture_description_from_value(value: &Value) -> Option<String> {
    value_string(value, "description")
        .or_else(|| value_string(value, "content"))
        .or_else(|| value_string(value, "desc"))
        .or_else(|| value_string(value, "summary"))
        .or_else(|| value_string(value, "text"))
}

fn capture_tags_from_value(value: &Value) -> Vec<String> {
    let tags = tags_from_value(value.get("tags"));
    if !tags.is_empty() {
        return tags;
    }
    if let Some(tag_list) = value.get("tag_list") {
        return tags_from_value(Some(tag_list));
    }
    if let Some(tag_list) = value.get("tagList") {
        return tags_from_value(Some(tag_list));
    }
    Vec::new()
}

fn capture_source_url_from_value(value: &Value) -> Option<String> {
    value_string(value, "sourceUrl")
        .or_else(|| value_string(value, "source_url"))
        .or_else(|| value_string(value, "url"))
        .or_else(|| value_string(value, "link"))
        .or_else(|| {
            value_string(value, "noteId")
                .or_else(|| value_string(value, "note_id"))
                .map(|note_id| format!("https://www.xiaohongshu.com/explore/{note_id}"))
        })
}

fn capture_author_name_from_value(value: &Value) -> Option<String> {
    value_string(value, "authorName")
        .or_else(|| value_string(value, "author_name"))
        .or_else(|| value_string(value, "author"))
        .or_else(|| value_string(value, "nickname"))
        .or_else(|| value_path_string(value, &["user", "nickname"]))
}

fn capture_cover_url_from_value(value: &Value) -> Option<String> {
    value_string(value, "coverUrl")
        .or_else(|| value_string(value, "cover_url"))
        .or_else(|| value_path_string(value, &["cover", "url_default"]))
        .or_else(|| value_path_string(value, &["cover", "url_pre"]))
}

fn capture_content_type_from_value(value: &Value) -> String {
    value_string(value, "contentType")
        .or_else(|| value_string(value, "content_type"))
        .or_else(|| value_string(value, "type"))
        .unwrap_or_else(|| {
            if value.get("videoUrl").is_some() || value.get("video_url").is_some() {
                "video".to_string()
            } else if value.get("images").is_some() {
                "image".to_string()
            } else {
                "note".to_string()
            }
        })
}

fn capture_record_from_value(value: &Value, source_type: &str) -> CaptureRecord {
    let timestamp = now_iso();
    CaptureRecord {
        id: make_id("capture"),
        source_type: source_type.to_string(),
        platform: value_string(value, "platform").unwrap_or_else(|| "xiaohongshu".to_string()),
        status: "inbox".to_string(),
        note_id: value_string(value, "noteId").or_else(|| value_string(value, "note_id")),
        source_url: capture_source_url_from_value(value),
        title: capture_title_from_value(value),
        description: capture_description_from_value(value),
        tags: capture_tags_from_value(value),
        author_name: capture_author_name_from_value(value),
        content_type: capture_content_type_from_value(value),
        cover_url: capture_cover_url_from_value(value),
        raw_payload: value.clone(),
        created_at: timestamp.clone(),
        updated_at: timestamp,
    }
}

fn expand_capture_values(value: &Value) -> Vec<Value> {
    if let Some(items) = value.as_array() {
        return items.to_vec();
    }

    if let Some(items) = value.get("posts").and_then(Value::as_array) {
        return items.to_vec();
    }

    if let Some(items) = value.get("items").and_then(Value::as_array) {
        return items.to_vec();
    }

    if let Some(items) = value
        .get("data")
        .and_then(|item| item.get("items").and_then(Value::as_array))
    {
        return items.to_vec();
    }

    if let Some(items) = value
        .get("data")
        .and_then(|item| item.get("notes").and_then(Value::as_array))
    {
        return items.to_vec();
    }

    vec![value.clone()]
}

fn parse_jsonl_content(content: &str) -> Result<Vec<Value>, String> {
    let mut items = Vec::new();
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        let value: Value = serde_json::from_str(trimmed).map_err(|error| error.to_string())?;
        items.push(value);
    }
    Ok(items)
}

fn parse_bridge_content(content: &str, extension: Option<&str>) -> Result<Vec<Value>, String> {
    let normalized_ext = extension
        .map(|value| value.trim().trim_start_matches('.').to_ascii_lowercase());

    if matches!(normalized_ext.as_deref(), Some("jsonl")) {
        return parse_jsonl_content(content);
    }

    match serde_json::from_str::<Value>(content) {
        Ok(value) => Ok(expand_capture_values(&value)),
        Err(json_error) => {
            let jsonl_items = parse_jsonl_content(content);
            if let Ok(items) = jsonl_items {
                if !items.is_empty() {
                    return Ok(items);
                }
            }
            Err(json_error.to_string())
        }
    }
}

fn parse_bridge_file(path: &Path) -> Result<Vec<Value>, String> {
    let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
    let extension = path.extension().and_then(OsStr::to_str);
    parse_bridge_content(&content, extension)
}

fn capture_duplicate_index(store: &AppStore, candidate: &CaptureRecord) -> Option<usize> {
    store.captures.iter().position(|item| {
        candidate.note_id.is_some() && candidate.note_id == item.note_id
            || candidate.source_url.is_some() && candidate.source_url == item.source_url
    })
}

fn merge_capture(existing: &mut CaptureRecord, incoming: CaptureRecord) {
    if !incoming.title.trim().is_empty() {
        existing.title = incoming.title;
    }

    if incoming.description.is_some() {
        existing.description = incoming.description;
    }

    if existing.author_name.is_none() && incoming.author_name.is_some() {
        existing.author_name = incoming.author_name;
    }

    if existing.cover_url.is_none() && incoming.cover_url.is_some() {
        existing.cover_url = incoming.cover_url;
    }

    if existing.source_url.is_none() && incoming.source_url.is_some() {
        existing.source_url = incoming.source_url;
    }

    if existing.note_id.is_none() && incoming.note_id.is_some() {
        existing.note_id = incoming.note_id;
    }

    existing.tags = normalize_tags({
        let mut tags = existing.tags.clone();
        tags.extend(incoming.tags);
        tags
    });
    existing.raw_payload = incoming.raw_payload;
    existing.updated_at = now_iso();
}

fn sort_captures_desc(captures: &mut [CaptureRecord]) {
    captures.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
}

fn import_capture_values(store: &mut AppStore, items: Vec<Value>, source_type: &str) -> (usize, usize) {
    let mut imported = 0usize;
    let mut updated = 0usize;

    for item in items {
        let capture = capture_record_from_value(&item, source_type);
        if let Some(index) = capture_duplicate_index(store, &capture) {
            merge_capture(&mut store.captures[index], capture);
            updated += 1;
        } else {
            store.captures.push(capture);
            imported += 1;
        }
    }

    (imported, updated)
}

fn import_bridge_captures(state: &State<'_, AppState>) -> Result<Value, String> {
    let inbox = bridge_inbox_dir(&state.store_path)?;
    let imported_dir = bridge_imported_dir(&state.store_path)?;
    ensure_directory(&inbox)?;
    ensure_directory(&imported_dir)?;

    let mut files = Vec::new();
    for entry in fs::read_dir(&inbox).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path();
        if !path.is_file() {
            continue;
        }
        let Some(ext) = path.extension().and_then(OsStr::to_str).map(|value| value.to_lowercase()) else {
            continue;
        };
        if ext == "json" || ext == "jsonl" {
            files.push(path);
        }
    }

    let mut imported = 0usize;
    let mut updated = 0usize;
    let mut processed_files = 0usize;
    let mut failed = Vec::new();

    with_store_mut(state, |store| {
        for path in &files {
            match parse_bridge_file(path) {
                Ok(items) => {
                    processed_files += 1;
                    let (file_imported, file_updated) = import_capture_values(store, items, "extension-bridge");
                    imported += file_imported;
                    updated += file_updated;

                    let target = imported_dir.join(format!(
                        "{}-{}",
                        now_ms(),
                        path.file_name()
                            .and_then(OsStr::to_str)
                            .unwrap_or("bridge-payload.json")
                    ));

                    if let Err(error) = fs::rename(path, target) {
                        failed.push(json!({
                            "file": path.display().to_string(),
                            "error": error.to_string()
                        }));
                    }
                }
                Err(error) => {
                    failed.push(json!({
                        "file": path.display().to_string(),
                        "error": error
                    }));
                }
            }
        }

        sort_captures_desc(&mut store.captures);
        store.last_bridge_sync_at = Some(now_iso());
        push_activity(
            store,
            "bridge-import",
            format!("Bridge inbox processed {} files", files.len()),
            Some(if failed.is_empty() {
                format!("Imported {imported} items and updated {updated} items.")
            } else {
                format!(
                    "Imported {imported} items, updated {updated} items, and failed to parse {} files.",
                    failed.len()
                )
            }),
            if failed.is_empty() { "success" } else { "info" },
        );

        Ok(json!({
            "success": processed_files > 0 || imported > 0 || updated > 0,
            "files": files.len(),
            "processedFiles": processed_files,
            "importedCount": imported,
            "updatedCount": updated,
            "failed": failed,
            "bridgeDirectory": inbox.display().to_string(),
            "lastSyncedAt": store.last_bridge_sync_at.clone()
        }))
    })
}

fn handle_capture_import_files(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let input: CaptureImportBatchInput =
        serde_json::from_value(payload).map_err(|error| format!("Invalid import file payload: {error}"))?;

    if input.files.is_empty() {
        return Ok(json!({ "success": false, "error": "No files were provided for import." }));
    }

    let total_files = input.files.len();

    with_store_mut(state, |store| {
        let mut imported = 0usize;
        let mut updated = 0usize;
        let mut processed_files = 0usize;
        let mut failed = Vec::new();

        for file in input.files {
            let display_name = file
                .name
                .clone()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| format!("direct-import-{}.json", now_ms()));
            let extension = Path::new(&display_name).extension().and_then(OsStr::to_str);

            match parse_bridge_content(&file.content, extension) {
                Ok(items) => {
                    processed_files += 1;
                    let (file_imported, file_updated) = import_capture_values(store, items, "direct-import");
                    imported += file_imported;
                    updated += file_updated;
                }
                Err(error) => {
                    failed.push(json!({
                        "file": display_name,
                        "error": error
                    }));
                }
            }
        }

        sort_captures_desc(&mut store.captures);
        push_activity(
            store,
            "direct-import",
            format!("Imported {} local files", total_files),
            Some(if failed.is_empty() {
                format!("Imported {imported} items and updated {updated} items.")
            } else {
                format!(
                    "Imported {imported} items, updated {updated} items, and failed to parse {} files.",
                    failed.len()
                )
            }),
            if failed.is_empty() { "success" } else { "info" },
        );

        let has_success = processed_files > 0 || imported > 0 || updated > 0;
        Ok(json!({
            "success": has_success,
            "files": total_files,
            "processedFiles": processed_files,
            "importedCount": imported,
            "updatedCount": updated,
            "failed": failed,
            "error": if has_success {
                Value::Null
            } else {
                Value::String("None of the selected files could be parsed.".to_string())
            }
        }))
    })
}

fn sanitize_filename(input: &str) -> String {
    let filtered: String = input
        .chars()
        .map(|ch| match ch {
            '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' => '-',
            _ => ch,
        })
        .collect();

    let collapsed = filtered
        .split_whitespace()
        .filter(|segment| !segment.is_empty())
        .collect::<Vec<_>>()
        .join(" ");

    if collapsed.is_empty() {
        "xhs-note".to_string()
    } else {
        collapsed
    }
}

fn unique_markdown_path(dir: &Path, name: &str) -> PathBuf {
    let base_name = sanitize_filename(name);
    let mut candidate = dir.join(format!("{base_name}.md"));
    let mut counter = 2usize;

    while candidate.exists() {
        candidate = dir.join(format!("{base_name}-{counter}.md"));
        counter += 1;
    }

    candidate
}

fn unique_manuscript_relative_path(
    state: &State<'_, AppState>,
    parent_path: &str,
    name: &str,
) -> Result<String, String> {
    let normalized_parent = normalize_relative_path(parent_path);
    let root = manuscripts_root(state)?;
    let directory = if normalized_parent.is_empty() {
        root
    } else {
        root.join(&normalized_parent)
    };

    ensure_directory(&directory)?;

    let base_name = Path::new(name)
        .file_stem()
        .and_then(OsStr::to_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or("untitled");
    let absolute_path = unique_markdown_path(&directory, base_name);
    let file_name = absolute_path
        .file_name()
        .and_then(OsStr::to_str)
        .ok_or_else(|| "Failed to allocate a manuscript file name".to_string())?;

    Ok(join_relative(&normalized_parent, file_name))
}

fn subject_markdown(subject: &SubjectRecord) -> String {
    let mut lines = Vec::new();
    lines.push(format!("# {}", subject.name));
    lines.push(String::new());
    lines.push(format!("> Exported at: {}", now_iso()));
    lines.push(format!("> Created at: {}", subject.created_at));
    lines.push(format!("> Updated at: {}", subject.updated_at));

    if !subject.tags.is_empty() {
        lines.push(format!(
            "> Tags: {}",
            subject
                .tags
                .iter()
                .map(|tag| format!("#{tag}"))
                .collect::<Vec<_>>()
                .join(" ")
        ));
    }

    lines.push(String::new());

    if let Some(description) = subject.description.as_ref() {
        lines.push("## Summary".to_string());
        lines.push(String::new());
        lines.push(description.clone());
        lines.push(String::new());
    }

    if !subject.attributes.is_empty() {
        lines.push("## Metadata".to_string());
        lines.push(String::new());
        for attribute in &subject.attributes {
            lines.push(format!("- **{}**: {}", attribute.key, attribute.value));
        }
        lines.push(String::new());
    }

    if !subject.preview_urls.is_empty() {
        lines.push("## Asset Links".to_string());
        lines.push(String::new());
        for url in &subject.preview_urls {
            lines.push(format!("- {}", url));
        }
        lines.push(String::new());
    }

    lines.join("\n")
}

fn configured_export_dir(store_path: &Path, settings: &Value) -> Result<(PathBuf, bool), String> {
    if let Some(path) = payload_string(settings, "exportDirectory") {
        let export_path = PathBuf::from(path);
        ensure_directory(&export_path)?;
        return Ok((export_path, false));
    }

    let fallback = exports_dir(store_path)?;
    ensure_directory(&fallback)?;
    Ok((fallback, true))
}

fn handle_workspace_export_backup(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let client_state = payload
        .get("clientState")
        .cloned()
        .map(serde_json::from_value::<WorkspaceBackupClientState>)
        .transpose()
        .map_err(|error| format!("Invalid workspace backup client state: {error}"))?
        .unwrap_or_default();

    let store_snapshot = with_store(state, |store| Ok(store.clone()))?;
    let (export_dir, used_fallback_directory) = configured_export_dir(&state.store_path, &store_snapshot.settings)?;
    let mut backup_store = store_snapshot;
    redact_backup_store(&mut backup_store);

    let backup = WorkspaceBackupRecord {
        schema_version: 1,
        exported_at: now_iso(),
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        includes_api_key: false,
        includes_workspace_files: false,
        store: backup_store,
        client_state: client_state.clone(),
    };

    let path = export_dir.join(format!("xhs-atelier-backup-{}.json", now_ms()));
    let serialized = serde_json::to_string_pretty(&backup).map_err(|error| error.to_string())?;
    fs::write(&path, serialized).map_err(|error| error.to_string())?;

    Ok(json!({
        "success": true,
        "path": path.display().to_string(),
        "usedFallbackDirectory": used_fallback_directory,
        "counts": workspace_backup_counts(&backup.store, &client_state),
        "includesApiKey": false,
        "includesWorkspaceFiles": false,
        "schemaVersion": 1
    }))
}

fn handle_workspace_import_backup(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let Some(content) = payload_string(&payload, "content") else {
        return Ok(json!({ "success": false, "error": "Missing backup content." }));
    };

    let mut backup: WorkspaceBackupRecord =
        serde_json::from_str(&content).map_err(|error| format!("Invalid workspace backup: {error}"))?;
    normalize_imported_workspace_store(&mut backup.store);
    let counts = workspace_backup_counts(&backup.store, &backup.client_state);
    let schema_version = backup.schema_version.max(1);

    with_store_mut(state, |store| {
        *store = backup.store.clone();
        push_activity(
            store,
            "workspace-backup-import",
            "Workspace backup restored",
            Some("Metadata restored from a JSON snapshot. Re-enter the API key before running RedClaw again.".to_string()),
            "success",
        );
        Ok(())
    })?;

    let mut runtime = state
        .chat_runtime
        .lock()
        .map_err(|_| "Chat runtime lock is unavailable.".to_string())?;
    runtime.clear();
    drop(runtime);

    Ok(json!({
        "success": true,
        "clientState": backup.client_state,
        "counts": counts,
        "includesApiKey": false,
        "includesWorkspaceFiles": false,
        "schemaVersion": schema_version
    }))
}

fn handle_subject_category_create(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let input: SubjectCategoryMutationInput =
        serde_json::from_value(payload).map_err(|error| format!("Invalid category payload: {error}"))?;
    let name = input.name.trim().to_string();
    if name.is_empty() {
        return Ok(json!({ "success": false, "error": "Category name cannot be empty." }));
    }

    with_store_mut(state, |store| {
        let timestamp = now_iso();
        let category = SubjectCategory {
            id: make_id("category"),
            name,
            created_at: timestamp.clone(),
            updated_at: timestamp,
        };
        store.categories.push(category.clone());
        Ok(json!({ "success": true, "category": category }))
    })
}

fn handle_subject_category_update(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let input: SubjectCategoryMutationInput =
        serde_json::from_value(payload).map_err(|error| format!("Invalid category payload: {error}"))?;
    let Some(id) = input.id else {
        return Ok(json!({ "success": false, "error": "Missing category id." }));
    };
    let next_name = input.name.trim().to_string();
    if next_name.is_empty() {
        return Ok(json!({ "success": false, "error": "Category name cannot be empty." }));
    }

    with_store_mut(state, |store| {
        let Some(category) = store.categories.iter_mut().find(|item| item.id == id) else {
            return Ok(json!({ "success": false, "error": "Category was not found." }));
        };
        category.name = next_name;
        category.updated_at = now_iso();
        Ok(json!({ "success": true, "category": category.clone() }))
    })
}

fn handle_subject_category_delete(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let Some(id) = payload_string(&payload, "id") else {
        return Ok(json!({ "success": false, "error": "Missing category id." }));
    };

    with_store_mut(state, |store| {
        if store
            .subjects
            .iter()
            .any(|subject| subject.category_id.as_deref() == Some(id.as_str()))
        {
            return Ok(json!({
                "success": false,
                "error": "This category is still used by one or more subjects."
            }));
        }
        let before = store.categories.len();
        store.categories.retain(|item| item.id != id);
        if store.categories.len() == before {
            return Ok(json!({ "success": false, "error": "Category was not found." }));
        }
        Ok(json!({ "success": true }))
    })
}

fn handle_subject_create(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let input: SubjectMutationInput =
        serde_json::from_value(payload).map_err(|error| format!("Invalid subject payload: {error}"))?;
    if input.name.trim().is_empty() {
        return Ok(json!({ "success": false, "error": "Subject name cannot be empty." }));
    }

    with_store_mut(state, |store| {
        let record = subject_record_from_input(input, None);
        store.subjects.push(record.clone());
        push_activity(
            store,
            "subject-created",
            format!("Created subject: {}", record.name),
            record.description.clone(),
            "success",
        );
        Ok(json!({ "success": true, "subject": record }))
    })
}

fn handle_subject_update(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let input: SubjectMutationInput =
        serde_json::from_value(payload).map_err(|error| format!("Invalid subject payload: {error}"))?;
    let Some(id) = input.id.clone() else {
        return Ok(json!({ "success": false, "error": "Missing subject id." }));
    };

    with_store_mut(state, |store| {
        let Some(index) = store.subjects.iter().position(|item| item.id == id) else {
            return Ok(json!({ "success": false, "error": "Subject was not found." }));
        };
        let existing = store.subjects.get(index).cloned();
        let record = subject_record_from_input(input, existing);
        store.subjects[index] = record.clone();
        push_activity(
            store,
            "subject-updated",
            format!("Updated subject: {}", record.name),
            record.description.clone(),
            "info",
        );
        Ok(json!({ "success": true, "subject": record }))
    })
}

fn handle_subject_delete(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let Some(id) = payload_string(&payload, "id") else {
        return Ok(json!({ "success": false, "error": "Missing subject id." }));
    };

    with_store_mut(state, |store| {
        let before = store.subjects.len();
        store.subjects.retain(|item| item.id != id);
        if store.subjects.len() == before {
            return Ok(json!({ "success": false, "error": "Subject was not found." }));
        }
        Ok(json!({ "success": true }))
    })
}

fn handle_subject_delete_with_activity(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let Some(id) = payload_string(&payload, "id") else {
        return Ok(json!({ "success": false, "error": "Missing subject id." }));
    };

    with_store_mut(state, |store| {
        let record = store.subjects.iter().find(|item| item.id == id).cloned();
        let before = store.subjects.len();
        store.subjects.retain(|item| item.id != id);
        if store.subjects.len() == before {
            return Ok(json!({ "success": false, "error": "Subject was not found." }));
        }

        if let Some(record) = record {
            push_activity(
                store,
                "subject-deleted",
                format!("Deleted subject: {}", record.name),
                record.description.clone(),
                "info",
            );
        }

        Ok(json!({ "success": true }))
    })
}

fn handle_capture_create(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let title = payload_string(&payload, "title").unwrap_or_default();
    let source_url = payload_string(&payload, "sourceUrl").or_else(|| payload_string(&payload, "source_url"));
    let description = payload_string(&payload, "description");
    let tags = normalize_tags(tags_from_value(payload.get("tags")));
    if title.trim().is_empty() && source_url.as_deref().unwrap_or_default().trim().is_empty() {
        return Ok(json!({ "success": false, "error": "Enter a title or a source URL." }));
    }

    with_store_mut(state, |store| {
        let value = json!({
            "title": if title.trim().is_empty() { source_url.clone().unwrap_or_default() } else { title.clone() },
            "description": description,
            "sourceUrl": source_url,
            "tags": tags,
            "platform": "xiaohongshu",
            "type": "manual"
        });

        let candidate = capture_record_from_value(&value, "manual-entry");
        if let Some(index) = capture_duplicate_index(store, &candidate) {
            merge_capture(&mut store.captures[index], candidate);
            let capture = store.captures[index].clone();
            sort_captures_desc(&mut store.captures);
            push_activity(
                store,
                "capture-updated",
                format!("Updated inbox item: {}", capture.title),
                capture.source_url.clone(),
                "info",
            );
            return Ok(json!({ "success": true, "capture": capture, "updated": true }));
        }

        store.captures.push(candidate.clone());
        sort_captures_desc(&mut store.captures);
        push_activity(
            store,
            "capture-created",
            format!("Added inbox item: {}", candidate.title),
            candidate.source_url.clone(),
            "success",
        );
        Ok(json!({ "success": true, "capture": candidate, "updated": false }))
    })
}

fn handle_capture_delete(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let Some(id) = payload_string(&payload, "id") else {
        return Ok(json!({ "success": false, "error": "Missing inbox item id." }));
    };

    with_store_mut(state, |store| {
        let before = store.captures.len();
        store.captures.retain(|item| item.id != id);
        if store.captures.len() == before {
            return Ok(json!({ "success": false, "error": "Inbox item was not found." }));
        }
        Ok(json!({ "success": true }))
    })
}

fn handle_capture_delete_with_activity(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let Some(id) = payload_string(&payload, "id") else {
        return Ok(json!({ "success": false, "error": "Missing inbox item id." }));
    };

    with_store_mut(state, |store| {
        let Some(index) = store.captures.iter().position(|item| item.id == id) else {
            return Ok(json!({ "success": false, "error": "Inbox item was not found." }));
        };
        let capture = store.captures.remove(index);
        push_activity(
            store,
            "capture-deleted",
            format!("Removed inbox item: {}", capture.title),
            capture.source_url.clone(),
            "info",
        );
        Ok(json!({ "success": true }))
    })
}

fn handle_capture_promote(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let Some(id) = payload_string(&payload, "id") else {
        return Ok(json!({ "success": false, "error": "Missing inbox item id." }));
    };

    with_store_mut(state, |store| {
        let Some(index) = store.captures.iter().position(|item| item.id == id) else {
            return Ok(json!({ "success": false, "error": "Inbox item was not found." }));
        };

        if store.captures[index].status == "converted" {
            return Ok(json!({
                "success": false,
                "error": "This inbox item has already been promoted to a subject."
            }));
        }

        let capture = store.captures[index].clone();
        let timestamp = now_iso();
        let mut attributes = vec![
            SubjectAttribute {
                key: "sourceType".to_string(),
                value: capture.source_type.clone(),
            },
            SubjectAttribute {
                key: "captureStatus".to_string(),
                value: capture.status.clone(),
            },
        ];

        if let Some(url) = capture.source_url.as_ref() {
            attributes.push(SubjectAttribute {
                key: "sourceUrl".to_string(),
                value: url.clone(),
            });
        }

        if let Some(note_id) = capture.note_id.as_ref() {
            attributes.push(SubjectAttribute {
                key: "noteId".to_string(),
                value: note_id.clone(),
            });
        }

        if let Some(author_name) = capture.author_name.as_ref() {
            attributes.push(SubjectAttribute {
                key: "authorName".to_string(),
                value: author_name.clone(),
            });
        }

        let preview_urls = capture.cover_url.clone().map(|url| vec![url]).unwrap_or_default();

        let subject = SubjectRecord {
            id: make_id("subject"),
            name: capture.title.clone(),
            category_id: None,
            description: capture.description.clone(),
            tags: capture.tags.clone(),
            attributes,
            image_paths: preview_urls.clone(),
            voice_path: None,
            voice_script: None,
            created_at: timestamp.clone(),
            updated_at: timestamp,
            absolute_image_paths: preview_urls.clone(),
            preview_urls: preview_urls.clone(),
            primary_preview_url: preview_urls.first().cloned(),
            absolute_voice_path: None,
            voice_preview_url: None,
        };

        store.subjects.insert(0, subject.clone());
        store.captures[index].status = "converted".to_string();
        store.captures[index].updated_at = now_iso();
        push_activity(
            store,
            "capture-promoted",
            format!("Promoted inbox item to subject: {}", subject.name),
            Some(format!("Source: {}", capture.source_type)),
            "success",
        );

        Ok(json!({
            "success": true,
            "subject": subject,
            "capture": store.captures[index].clone()
        }))
    })
}

fn handle_subject_export_markdown(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let Some(id) = payload_string(&payload, "id") else {
        return Ok(json!({ "success": false, "error": "Missing subject id." }));
    };
    let open_after_export = payload
        .get("openAfterExport")
        .and_then(Value::as_bool)
        .unwrap_or(false);

    let (subject, settings) = with_store(state, |store| {
        let Some(subject) = store.subjects.iter().find(|item| item.id == id) else {
            return Err("Subject was not found.".to_string());
        };
        Ok((subject.clone(), store.settings.clone()))
    })?;

    let (directory, used_fallback_directory) = configured_export_dir(&state.store_path, &settings)?;
    let path = unique_markdown_path(&directory, &subject.name);
    let content = subject_markdown(&subject);
    fs::write(&path, content).map_err(|error| error.to_string())?;

    if open_after_export {
        let target = path.parent().unwrap_or(&directory).to_path_buf();
        let _ = open::that(target);
    }

    with_store_mut(state, |store| {
        push_activity(
            store,
            "subject-exported",
            format!("Exported Markdown for {}", subject.name),
            Some(path.display().to_string()),
            "success",
        );
        Ok(())
    })?;

    Ok(json!({
        "success": true,
        "path": path.display().to_string(),
        "directory": directory.display().to_string(),
        "usedFallbackDirectory": used_fallback_directory
    }))
}

fn handle_chat_get_or_create_context_session(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let context_id = payload_string(&payload, "contextId");
    let context_type = payload_string(&payload, "contextType");
    let title = payload_string(&payload, "title").unwrap_or_else(|| "RedClaw".to_string());
    let initial_context = payload_string(&payload, "initialContext");

    with_store_mut(state, |store| {
        if let Some(existing) = context_id
            .as_ref()
            .and_then(|id| store.chat_sessions.iter_mut().find(|session| session.context_id.as_ref() == Some(id)))
        {
            existing.title = title.clone();
            if existing.initial_context.is_none() && initial_context.is_some() {
                existing.initial_context = initial_context.clone();
            }
            existing.updated_at = now_iso();
            return Ok(json!(existing.clone()));
        }

        let timestamp = now_iso();
        let session = ChatSessionRecord {
            id: make_id("chat-session"),
            title,
            context_id,
            context_type,
            initial_context,
            created_at: timestamp.clone(),
            updated_at: timestamp,
        };

        store.chat_sessions.push(session.clone());
        sort_chat_sessions_desc(&mut store.chat_sessions);
        Ok(json!(session))
    })
}

fn handle_chat_create_session(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let title = normalize_string(Some(&payload)).unwrap_or_else(|| "New Chat".to_string());

    with_store_mut(state, |store| {
        let timestamp = now_iso();
        let session = ChatSessionRecord {
            id: make_id("chat-session"),
            title,
            context_id: None,
            context_type: None,
            initial_context: None,
            created_at: timestamp.clone(),
            updated_at: timestamp,
        };
        store.chat_sessions.push(session.clone());
        sort_chat_sessions_desc(&mut store.chat_sessions);
        Ok(json!(session))
    })
}

fn handle_chat_get_messages(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let session_id = chat_session_id_from_payload(&payload);
    if session_id.is_empty() {
        return Ok(json!([]));
    }

    with_store(state, |store| {
        let mut messages: Vec<ChatMessageRecord> = store
            .chat_messages
            .iter()
            .filter(|message| message.session_id == session_id)
            .cloned()
            .collect();
        sort_chat_messages_asc(&mut messages);
        Ok(json!(messages))
    })
}

fn handle_chat_send_message(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let session_id = payload_string(&payload, "sessionId").unwrap_or_default();
    let content = payload_string(&payload, "message").unwrap_or_default();
    let display_content = payload_string(&payload, "displayContent");
    let attachment = payload.get("attachment").cloned().filter(|value| !value.is_null());
    let task_hints = payload.get("taskHints").cloned().filter(|value| !value.is_null());

    if session_id.is_empty() {
        return Ok(json!({ "success": false, "error": "Missing sessionId" }));
    }
    if content.trim().is_empty() {
        return Ok(json!({ "success": false, "error": "Missing message content" }));
    }

    set_chat_runtime_state(
        state,
        &session_id,
        true,
        "RedClaw is preparing the authoring request...",
    )?;

    let task_label = task_hints
        .as_ref()
        .and_then(|value| value.get("intent"))
        .and_then(Value::as_str)
        .unwrap_or("creative-entry")
        .to_string();
    let target_manuscript_path = task_hints
        .as_ref()
        .and_then(|value| value.get("sourceManuscriptPath"))
        .and_then(Value::as_str)
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());
    let reference_manuscript_path = task_hints
        .as_ref()
        .and_then(|value| value.get("referenceManuscriptPath"))
        .and_then(Value::as_str)
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());
    let draft_strategy = infer_redclaw_draft_strategy(
        task_hints
            .as_ref()
            .and_then(|value| value.get("draftStrategy"))
            .and_then(Value::as_str),
        reference_manuscript_path.as_deref(),
        target_manuscript_path.as_deref(),
    );
    let source_title = task_hints
        .as_ref()
        .and_then(|value| value.get("sourceTitle"))
        .and_then(Value::as_str)
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());

    let (session_title, session_context_type, generation_config) = with_store(state, |store| {
        let Some(session) = store.chat_sessions.iter().find(|item| item.id == session_id) else {
            return Err("Chat session was not found".to_string());
        };
        Ok((
            session.title.clone(),
            session.context_type.clone(),
            if task_label == "manuscript_creation" {
                redclaw_generation_config_from_settings(&store.settings)
            } else {
                None
            },
        ))
    })?;

    if task_label == "manuscript_creation" && generation_config.is_none() {
        set_chat_runtime_state(
            state,
            &session_id,
            false,
            "RedClaw setup is incomplete. Configure model, endpoint, and API key first.",
        )?;
        return Ok(json!({
            "success": false,
            "error": "Configure the AI model, endpoint, and API key in Settings before using RedClaw generation."
        }));
    }

    let generated_draft = if task_label == "manuscript_creation" {
        set_chat_runtime_state(
            state,
            &session_id,
            true,
            "RedClaw is generating a manuscript draft...",
        )?;
        let config = generation_config
            .as_ref()
            .ok_or_else(|| "Missing RedClaw generation config".to_string())?;
        Some(match generate_redclaw_draft(config, &content) {
            Ok(draft) => draft,
            Err(error) => {
                let _ = set_chat_runtime_state(
                    state,
                    &session_id,
                    false,
                    format!("RedClaw generation failed: {error}"),
                );
                return Ok(json!({
                    "success": false,
                    "error": error
                }));
            }
        })
    } else {
        None
    };

    let saved_manuscript_path = if let Some(draft) = generated_draft.as_ref() {
        set_chat_runtime_state(
            state,
            &session_id,
            true,
            "RedClaw finished drafting. Saving the manuscript snapshot...",
        )?;
        let target_path = if let Some(path) = target_manuscript_path.as_ref() {
            Some(path.clone())
        } else {
            let fallback_title = source_title
                .as_deref()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or(&session_title);
            Some(unique_manuscript_relative_path(
                state,
                "xhs-atelier/redclaw-drafts",
                fallback_title,
            )?)
        };

        if let Some(path) = target_path.as_ref() {
            let (normalized_path, absolute_path) = resolve_manuscript_path(state, path)?;
            if normalized_path.is_empty() {
                None
            } else {
                if let Some(parent) = absolute_path.parent() {
                    ensure_directory(parent)?;
                }
                fs::write(&absolute_path, draft).map_err(|error| error.to_string())?;
                Some(normalized_path)
            }
        } else {
            None
        }
    } else {
        None
    };
    let task_project_id = task_hints
        .as_ref()
        .and_then(|value| value.get("projectId"))
        .and_then(Value::as_str)
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());

    let assistant_body = generated_draft.unwrap_or_else(|| {
        "RedClaw entry captured this request in the local workspace. Continue from this session once the runtime is connected.".to_string()
    });
    let assistant_display = if let Some(path) = saved_manuscript_path.as_ref() {
        format!("Draft generated and saved to {path}")
    } else if task_label == "manuscript_creation" {
        "RedClaw draft generated".to_string()
    } else {
        "RedClaw session updated".to_string()
    };

    set_chat_runtime_state(
        state,
        &session_id,
        false,
        if let Some(path) = saved_manuscript_path.as_ref() {
            format!("RedClaw finished. Draft saved to {path}")
        } else if task_label == "manuscript_creation" {
            "RedClaw finished drafting the manuscript.".to_string()
        } else {
            "RedClaw session updated.".to_string()
        },
    )?;

    with_store_mut(state, |store| {
        let Some(session_index) = store.chat_sessions.iter().position(|item| item.id == session_id) else {
            return Ok(json!({ "success": false, "error": "Chat session was not found" }));
        };

        let user_message = ChatMessageRecord {
            id: make_id("chat-message"),
            session_id: session_id.clone(),
            role: "user".to_string(),
            content: content.clone(),
            display_content: display_content.clone(),
            attachment: attachment.clone(),
            task_hints: task_hints.clone(),
            created_at: now_iso(),
        };

        let assistant_message = ChatMessageRecord {
            id: make_id("chat-message"),
            session_id: session_id.clone(),
            role: "assistant".to_string(),
            content: assistant_body,
            display_content: Some(assistant_display.clone()),
            attachment: None,
            task_hints: None,
            created_at: now_iso(),
        };

        store.chat_messages.push(user_message.clone());
        store.chat_messages.push(assistant_message.clone());
        store.chat_sessions[session_index].updated_at = now_iso();
        sort_chat_sessions_desc(&mut store.chat_sessions);

        push_activity(
            store,
            "redclaw-entry",
            format!("RedClaw task received: {}", session_title),
            saved_manuscript_path
                .clone()
                .or_else(|| display_content.clone())
                .or_else(|| Some(content.chars().take(88).collect())),
            "info",
        );

        if let Some(path) = saved_manuscript_path.clone() {
            let project_name = task_project_id
                .as_deref()
                .and_then(|project_id| store.subjects.iter().find(|item| item.id == project_id))
                .map(|subject| subject.name.clone())
                .or_else(|| source_title.clone());
            push_redclaw_output_archive(
                store,
                RedClawOutputArchiveRecord {
                    id: make_id("redclaw-output"),
                    source_kind: redclaw_output_source_kind(session_context_type.as_deref()),
                    draft_strategy: draft_strategy.clone(),
                    title: manuscript_title_from_path(&path),
                    summary: snippet_from_text(&assistant_message.content, 160),
                    manuscript_path: path,
                    reference_manuscript_path: reference_manuscript_path.clone(),
                    source_title: source_title.clone(),
                    session_id: Some(session_id.clone()),
                    project_id: task_project_id.clone(),
                    project_name,
                    created_at: now_iso(),
                },
            );
        }

        Ok(json!({
            "success": true,
            "sessionId": session_id,
            "savedManuscriptPath": saved_manuscript_path,
            "draftStrategy": draft_strategy,
            "referenceManuscriptPath": reference_manuscript_path,
            "sourceTitle": source_title,
            "userMessage": user_message,
            "assistantMessage": assistant_message
        }))
    })
}

fn handle_chat_clear_messages(payload: Value, state: &State<'_, AppState>) -> Result<Value, String> {
    let session_id = chat_session_id_from_payload(&payload);
    if session_id.is_empty() {
        return Ok(json!({ "success": false, "error": "Missing sessionId" }));
    }

    clear_chat_runtime_state(state, &session_id)?;

    with_store_mut(state, |store| {
        store.chat_messages.retain(|message| message.session_id != session_id);
        if let Some(session) = store.chat_sessions.iter_mut().find(|item| item.id == session_id) {
            session.updated_at = now_iso();
        }
        Ok(json!({ "success": true }))
    })
}

fn handle_channel(
    app: &AppHandle,
    channel: &str,
    payload: Value,
    state: &State<'_, AppState>,
) -> Result<Value, String> {
    match channel {
        "app:get-version" => Ok(json!(env!("CARGO_PKG_VERSION"))),
        "app:check-update" => Ok(json!({
            "success": true,
            "updateAvailable": false,
            "currentVersion": env!("CARGO_PKG_VERSION")
        })),
        "app:open-release-page" | "app:open-url" => {
            let url = payload_string(&payload, "url")
                .unwrap_or_else(|| "https://github.com/88lin/xhs-workspace/releases".to_string());
            match open::that(url.clone()) {
                Ok(_) => Ok(json!({ "success": true, "url": url })),
                Err(error) => Ok(json!({ "success": false, "error": error.to_string(), "url": url })),
            }
        }
        "app:open-path" => {
            let Some(path) = payload_string(&payload, "path") else {
                return Ok(json!({ "success": false, "error": "Missing path." }));
            };
            match open::that(path.clone()) {
                Ok(_) => Ok(json!({ "success": true, "path": path })),
                Err(error) => Ok(json!({ "success": false, "error": error.to_string(), "path": path })),
            }
        }
        "app:open-export-directory" => {
            let (directory, used_fallback_directory) =
                with_store(state, |store| configured_export_dir(&state.store_path, &store.settings))?;
            match open::that(directory.clone()) {
                Ok(_) => Ok(json!({
                    "success": true,
                    "path": directory.display().to_string(),
                    "usedFallbackDirectory": used_fallback_directory
                })),
                Err(error) => Ok(json!({
                    "success": false,
                    "path": directory.display().to_string(),
                    "usedFallbackDirectory": used_fallback_directory,
                    "error": error.to_string()
                })),
            }
        }
        "app:open-workspace-directory" => {
            let directory = app_root_dir();
            match open::that(directory.clone()) {
                Ok(_) => Ok(json!({
                    "success": true,
                    "path": directory.display().to_string()
                })),
                Err(error) => Ok(json!({
                    "success": false,
                    "path": directory.display().to_string(),
                    "error": error.to_string()
                })),
            }
        }
        "db:get-settings" => with_store(state, |store| Ok(store.settings.clone())),
        "db:save-settings" => with_store_mut(state, |store| {
            store.settings = payload;
            Ok(json!({ "success": true }))
        }),
        "workspace:export-backup" => handle_workspace_export_backup(payload, state),
        "workspace:import-backup" => handle_workspace_import_backup(payload, state),
        "spaces:list" => with_store(state, |store| {
            Ok(json!({
                "spaces": store.spaces.clone(),
                "activeSpaceId": store.active_space_id.clone()
            }))
        }),
        "spaces:create" => {
            let name = payload
                .as_str()
                .map(|item| item.trim().to_string())
                .or_else(|| payload_string(&payload, "name"))
                .unwrap_or_default();
            if name.is_empty() {
                return Ok(json!({ "success": false, "error": "Space name cannot be empty." }));
            }

            let result = with_store_mut(state, |store| {
                let timestamp = now_iso();
                let space = SpaceRecord {
                    id: make_id("space"),
                    name,
                    created_at: timestamp.clone(),
                    updated_at: timestamp,
                };
                store.active_space_id = space.id.clone();
                store.spaces.push(space.clone());
                Ok(json!({ "success": true, "space": space, "activeSpaceId": store.active_space_id.clone() }))
            })?;
            if let Some(active_space_id) = result.get("activeSpaceId").and_then(Value::as_str) {
                emit_space_changed(app, active_space_id);
            }
            Ok(result)
        }
        "spaces:rename" => {
            let Some(id) = payload_string(&payload, "id") else {
                return Ok(json!({ "success": false, "error": "Missing space id." }));
            };
            let Some(name) = payload_string(&payload, "name") else {
                return Ok(json!({ "success": false, "error": "Space name cannot be empty." }));
            };
            with_store_mut(state, |store| {
                let Some(space) = store.spaces.iter_mut().find(|item| item.id == id) else {
                    return Ok(json!({ "success": false, "error": "Space was not found." }));
                };
                space.name = name;
                space.updated_at = now_iso();
                Ok(json!({ "success": true, "space": space.clone() }))
            })
        }
        "spaces:switch" => {
            let next_id = payload
                .as_str()
                .map(ToString::to_string)
                .or_else(|| payload_string(&payload, "spaceId"));
            let Some(space_id) = next_id else {
                return Ok(json!({ "success": false, "error": "Missing space id." }));
            };
            let result = with_store_mut(state, |store| {
                if !store.spaces.iter().any(|item| item.id == space_id) {
                    return Ok(json!({ "success": false, "error": "Space was not found." }));
                }
                store.active_space_id = space_id.clone();
                Ok(json!({ "success": true, "activeSpaceId": store.active_space_id.clone() }))
            })?;
            if let Some(active_space_id) = result.get("activeSpaceId").and_then(Value::as_str) {
                emit_space_changed(app, active_space_id);
            }
            Ok(result)
        }
        "clipboard:read-text" => match Clipboard::new().and_then(|mut clipboard| clipboard.get_text()) {
            Ok(text) => Ok(json!(text)),
            Err(error) => Ok(json!({ "success": false, "error": error.to_string() })),
        },
        "clipboard:write-html" => {
            let text = payload_string(&payload, "text")
                .or_else(|| payload_string(&payload, "html"))
                .unwrap_or_default();
            match Clipboard::new().and_then(|mut clipboard| clipboard.set_text(text.clone())) {
                Ok(_) => Ok(json!({ "success": true, "text": text })),
                Err(error) => Ok(json!({ "success": false, "error": error.to_string() })),
            }
        }
        "debug:get-status" => Ok(json!({
            "enabled": true,
            "logDirectory": state
                .store_path
                .parent()
                .map(|path| path.display().to_string())
                .unwrap_or_default()
        })),
        "debug:get-recent" => {
            let limit = payload_u32(&payload, "limit").unwrap_or(12).max(1) as usize;
            with_store(state, |store| {
                let mut lines = store
                    .activities
                    .iter()
                    .take(limit)
                    .map(|item| {
                        let tone = match item.tone.as_str() {
                            "success" => "SUCCESS",
                            "warning" => "WARNING",
                            _ => "INFO",
                        };
                        let kind = if item.kind.trim().is_empty() {
                            "activity"
                        } else {
                            item.kind.as_str()
                        };
                        let detail = item.detail.as_deref().unwrap_or("");
                        if detail.is_empty() {
                            format!("[{tone}] {kind} / {}", item.title)
                        } else {
                            format!("[{tone}] {kind} / {} / {detail}", item.title)
                        }
                    })
                    .collect::<Vec<_>>();

                if lines.is_empty() {
                    lines.push("XHS Atelier Rust host is active.".to_string());
                }

                Ok(json!({ "lines": lines }))
            })
        }
        "debug:open-log-dir" => Ok(json!({
            "success": true,
            "path": state
                .store_path
                .parent()
                .map(|path| path.display().to_string())
                .unwrap_or_default()
        })),
        "plugin:browser-extension-status" => {
            let manifest = write_bridge_manifest(&state.store_path)?;
            let pending_items = count_bridge_payload_files(&state.store_path)?;
            let bridge_directory = manifest
                .get("inboxDir")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string();
            let imported_directory = manifest
                .get("importedDir")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string();
            let last_sync_at = with_store(state, |store| Ok(store.last_bridge_sync_at.clone()))?;
            let status_message = if pending_items > 0 {
                format!(
                    "The bridge inbox currently has {pending_items} pending files ready to import into the desktop app."
                )
            } else {
                "The bridge inbox is ready. The browser companion can drop JSON or JSONL files into the inbox directory.".to_string()
            };

            Ok(json!({
                "success": true,
                "bundled": true,
                "connected": pending_items > 0,
                "companionPath": "apps/extension",
                "bridgeDirectory": bridge_directory,
                "importedDirectory": imported_directory,
                "pendingItems": pending_items,
                "lastSyncAt": last_sync_at,
                "message": status_message
            }))
        }
        "plugin:prepare-browser-extension" => {
            let manifest = write_bridge_manifest(&state.store_path)?;
            let inbox_dir = manifest
                .get("inboxDir")
                .and_then(Value::as_str)
                .map(ToString::to_string);

            with_store_mut(state, |store| {
                push_activity(
                    store,
                    "bridge-prepared",
                    "Prepared the browser bridge inbox",
                    inbox_dir,
                    "success",
                );
                Ok(())
            })?;

            Ok(json!({
                "success": true,
                "manifest": manifest
            }))
        }
        "plugin:open-browser-extension-dir" => {
            let path = bridge_root(&state.store_path)?;
            ensure_directory(&path)?;
            match open::that(path.clone()) {
                Ok(_) => Ok(json!({
                    "success": true,
                    "path": path.display().to_string()
                })),
                Err(error) => Ok(json!({
                    "success": false,
                    "path": path.display().to_string(),
                    "error": error.to_string()
                })),
            }
        }
        "indexing:get-stats" => Ok(default_indexing_stats()),
        "indexing:clear-queue" => Ok(json!({ "success": true })),
        "indexing:remove-item" => Ok(json!({ "success": true })),
        "captures:list" => with_store(state, |store| {
            let mut captures = store.captures.clone();
            sort_captures_desc(&mut captures);
            Ok(json!({
                "success": true,
                "captures": captures,
                "lastSyncedAt": store.last_bridge_sync_at.clone()
            }))
        }),
        "activity:list" => with_store(state, |store| {
            Ok(json!({
                "success": true,
                "activities": store.activities.clone()
            }))
        }),
        "manuscripts:read" => {
            let relative_path = normalize_string(Some(&payload))
                .or_else(|| payload_string(&payload, "path"))
                .unwrap_or_default();

            let (normalized_path, path) = resolve_manuscript_path(state, &relative_path)?;
            let content = fs::read_to_string(&path).map_err(|error| error.to_string())?;

            Ok(json!({
                "path": normalized_path,
                "absolutePath": path.display().to_string(),
                "content": content,
                "metadata": {
                    "id": manuscript_id_from_path(&normalized_path),
                    "title": manuscript_title_from_path(&normalized_path)
                }
            }))
        },
        "manuscripts:save" => {
            let Some(relative_path) = payload_string(&payload, "path") else {
                return Ok(json!({ "success": false, "error": "Missing manuscript path" }));
            };
            let content = payload_field(&payload, "content")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string();
            let (normalized_path, path) = resolve_manuscript_path(state, &relative_path)?;

            if normalized_path.is_empty() {
                return Ok(json!({ "success": false, "error": "Missing manuscript path" }));
            }

            if let Some(parent) = path.parent() {
                ensure_directory(parent)?;
            }
            fs::write(&path, content).map_err(|error| error.to_string())?;

            Ok(json!({
                "success": true,
                "path": normalized_path
            }))
        },
        "manuscripts:create-file" => {
            let parent_path = payload_string(&payload, "parentPath").unwrap_or_default();
            let name = payload_string(&payload, "name").unwrap_or_else(|| "Untitled".to_string());
            let content = payload_field(&payload, "content")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string();
            let relative_path = unique_manuscript_relative_path(state, &parent_path, &name)?;
            let (_, path) = resolve_manuscript_path(state, &relative_path)?;

            if let Some(parent) = path.parent() {
                ensure_directory(parent)?;
            }
            fs::write(&path, content).map_err(|error| error.to_string())?;

            with_store_mut(state, |store| {
                push_activity(
                    store,
                    "manuscript-created",
                    format!("Created manuscript draft: {}", manuscript_title_from_path(&relative_path)),
                    Some(relative_path.clone()),
                    "success",
                );
                Ok(())
            })?;

            Ok(json!({
                "success": true,
                "path": relative_path
            }))
        },
        "manuscripts:reserve-file-path" => {
            let parent_path = payload_string(&payload, "parentPath").unwrap_or_default();
            let name = payload_string(&payload, "name").unwrap_or_else(|| "Untitled".to_string());
            let relative_path = unique_manuscript_relative_path(state, &parent_path, &name)?;

            Ok(json!({
                "success": true,
                "path": relative_path
            }))
        },
        "captures:create" => handle_capture_create(payload, state),
        "captures:delete" => handle_capture_delete_with_activity(payload, state),
        "captures:import-files" => handle_capture_import_files(payload, state),
        "captures:promote-to-subject" => handle_capture_promote(payload, state),
        "captures:import-bridge" => import_bridge_captures(state),
        "subjects:list" => with_store(state, |store| {
            Ok(json!({ "success": true, "subjects": store.subjects.clone() }))
        }),
        "subjects:get" => {
            let Some(id) = payload_string(&payload, "id") else {
                return Ok(json!({ "success": false, "error": "Missing subject id." }));
            };
            with_store(state, |store| {
                let subject = store.subjects.iter().find(|item| item.id == id).cloned();
                Ok(json!({ "success": true, "subject": subject }))
            })
        },
        "subjects:create" => handle_subject_create(payload, state),
        "subjects:update" => handle_subject_update(payload, state),
        "subjects:delete" => handle_subject_delete_with_activity(payload, state),
        "subjects:export-markdown" => handle_subject_export_markdown(payload, state),
        "subjects:search" => {
            let query = payload_string(&payload, "query").unwrap_or_default().to_lowercase();
            let category_id = payload_string(&payload, "categoryId");
            with_store(state, |store| {
                let subjects: Vec<SubjectRecord> = store
                    .subjects
                    .iter()
                    .filter(|subject| {
                        let matches_category = match category_id.as_deref() {
                            Some(category) => subject.category_id.as_deref() == Some(category),
                            None => true,
                        };
                        let matches_query = if query.is_empty() {
                            true
                        } else {
                            let haystack = format!(
                                "{}\n{}\n{}",
                                subject.name,
                                subject.description.clone().unwrap_or_default(),
                                subject.tags.join(" ")
                            )
                            .to_lowercase();
                            haystack.contains(&query)
                        };
                        matches_category && matches_query
                    })
                    .cloned()
                    .collect();
                Ok(json!({ "success": true, "subjects": subjects }))
            })
        },
        "subjects:categories:list" => with_store(state, |store| {
            Ok(json!({ "success": true, "categories": store.categories.clone() }))
        }),
        "subjects:categories:create" => handle_subject_category_create(payload, state),
        "subjects:categories:update" => handle_subject_category_update(payload, state),
        "subjects:categories:delete" => handle_subject_category_delete(payload, state),
        "chat:get-sessions" => with_store(state, |store| {
            let mut sessions = store.chat_sessions.clone();
            sort_chat_sessions_desc(&mut sessions);
            Ok(json!(sessions))
        }),
        "chat:create-session" => handle_chat_create_session(payload, state),
        "chat:getOrCreateContextSession" => handle_chat_get_or_create_context_session(payload, state),
        "chat:get-messages" => handle_chat_get_messages(payload, state),
        "chat:get-runtime-state" => {
            let session_id = chat_session_id_from_payload(&payload);
            let runtime = get_chat_runtime_state(state, &session_id)?;
            Ok(json!({
                "success": true,
                "sessionId": runtime.session_id,
                "isProcessing": runtime.is_processing,
                "partialResponse": runtime.partial_response,
                "updatedAt": runtime.updated_at
            }))
        },
        "chat:clear-messages" => handle_chat_clear_messages(payload, state),
        "chat:delete-session" => {
            let session_id = chat_session_id_from_payload(&payload);
            clear_chat_runtime_state(state, &session_id)?;
            with_store_mut(state, |store| {
                store.chat_sessions.retain(|session| session.id != session_id);
                store.chat_messages.retain(|message| message.session_id != session_id);
                Ok(json!({ "success": true }))
            })
        },
        "chat:get-context-usage" => {
            let session_id = chat_session_id_from_payload(&payload);
            with_store(state, |store| {
                let context_type = store
                    .chat_sessions
                    .iter()
                    .find(|session| session.id == session_id)
                    .and_then(|session| session.context_type.clone());
                let initial_context_tokens = store
                    .chat_sessions
                    .iter()
                    .find(|session| session.id == session_id)
                    .and_then(|session| session.initial_context.as_ref())
                    .map(|value| estimate_tokens(value))
                    .unwrap_or(0);
                let messages: Vec<&ChatMessageRecord> = store
                    .chat_messages
                    .iter()
                    .filter(|message| message.session_id == session_id)
                    .collect();
                let count = messages.len();
                let active_history_tokens = initial_context_tokens
                    + messages
                        .iter()
                        .map(|message| {
                            estimate_tokens(&message.content)
                                + message
                                    .display_content
                                    .as_deref()
                                    .map(estimate_tokens)
                                    .unwrap_or(0)
                        })
                        .sum::<usize>();
                let embedded_prompt_tokens = if context_type.as_deref() == Some("xhs-atelier:redclaw-entry") {
                    estimate_tokens(&build_redclaw_content_pack_context())
                } else {
                    0
                };
                let estimated_total_tokens = active_history_tokens + embedded_prompt_tokens;
                let compact_threshold = 24_000usize;
                let compact_ratio = if compact_threshold == 0 {
                    0.0
                } else {
                    estimated_total_tokens as f64 / compact_threshold as f64
                };
                Ok(json!({
                    "success": true,
                    "sessionId": session_id,
                    "contextType": context_type,
                    "messageCount": count,
                    "estimatedTotalTokens": estimated_total_tokens,
                    "compactSummaryTokens": 0,
                    "activeHistoryTokens": active_history_tokens,
                    "embeddedPromptTokens": embedded_prompt_tokens,
                    "compactThreshold": compact_threshold,
                    "compactRatio": compact_ratio,
                    "compactRounds": 0,
                    "compactUpdatedAt": null
                }))
            })
        },
        "chat:send-message" => handle_chat_send_message(payload, state),
        "redclaw:direct-status" => build_redclaw_runner_status(state),
        "redclaw:direct-run-now" => {
            let normalized_payload = normalize_redclaw_runner_payload(payload);
            handle_chat_send_message(normalized_payload, state)
        },
        "redclaw:automation-status" => build_redclaw_runner_status(state),
        "redclaw:automation-start" => handle_redclaw_runner_start(payload, state),
        "redclaw:automation-stop" => handle_redclaw_runner_stop(state),
        "redclaw:automation-run-now" => {
            let normalized_payload = normalize_redclaw_runner_payload(payload);
            handle_chat_send_message(normalized_payload, state)
        },
        "redclaw:automation-set-project" => handle_redclaw_runner_set_project(payload, state),
        "redclaw:automation-set-config" => handle_redclaw_runner_set_config(payload, state),
        "redclaw:automation-test-config" => handle_redclaw_runner_test_config(payload, state),
        "redclaw:automation-list-scheduled" => handle_redclaw_runner_list_scheduled(state),
        "redclaw:automation-list-output-archive" => handle_redclaw_runner_list_output_archive(state),
        "redclaw:automation-remove-output-archive" => handle_redclaw_runner_remove_output_archive(payload, state),
        "redclaw:automation-clear-output-archive" => handle_redclaw_runner_clear_output_archive(payload, state),
        "redclaw:automation-add-scheduled" => handle_redclaw_runner_add_scheduled(payload, state),
        "redclaw:automation-update-scheduled" => handle_redclaw_runner_update_scheduled(payload, state),
        "redclaw:automation-remove-scheduled" => handle_redclaw_runner_remove_scheduled(payload, state),
        "redclaw:automation-set-scheduled-enabled" => handle_redclaw_runner_set_scheduled_enabled(payload, state),
        "redclaw:automation-run-scheduled-now" => handle_redclaw_runner_run_scheduled_now(payload, state),
        "redclaw:automation-list-long-cycle" => handle_redclaw_runner_list_long_cycle(state),
        "redclaw:automation-add-long-cycle" => handle_redclaw_runner_add_long_cycle(payload, state),
        "redclaw:automation-update-long-cycle" => handle_redclaw_runner_update_long_cycle(payload, state),
        "redclaw:automation-remove-long-cycle" => handle_redclaw_runner_remove_long_cycle(payload, state),
        "redclaw:automation-set-long-cycle-enabled" => handle_redclaw_runner_set_long_cycle_enabled(payload, state),
        "redclaw:automation-run-long-cycle-now" => handle_redclaw_runner_run_long_cycle_now(payload, state),
        "work:list" => Ok(json!([])),
        "work:get" => Ok(Value::Null),
        "work:ready" => Ok(json!([])),
        "work:update" => Ok(json!({ "success": false, "error": "XHS Atelier does not support writable work items yet." })),
        "redclaw:runner-status" | "redclaw:runner-status-legacy" => build_redclaw_runner_status(state),
        "redclaw:runner-run-scheduled-now" => handle_redclaw_runner_run_scheduled_now(payload, state),
        "redclaw:runner-run-long-cycle-now" => handle_redclaw_runner_run_long_cycle_now(payload, state),
        _ => Ok(json!({
            "success": false,
            "error": format!("Rust host has not implemented channel `{channel}` yet.")
        })),
    }
}

#[tauri::command]
fn ipc_invoke(
    app: AppHandle,
    channel: String,
    payload: Option<Value>,
    state: State<'_, AppState>,
) -> Result<Value, String> {
    handle_channel(&app, &channel, payload.unwrap_or(Value::Null), &state)
}

#[tauri::command]
fn ipc_send(
    app: AppHandle,
    channel: String,
    payload: Option<Value>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let payload = payload.unwrap_or(Value::Null);
    let _ = handle_channel(&app, &channel, payload, &state)?;
    Ok(())
}

fn main() {
    let store_path = build_store_path();
    let store = load_store(&store_path);

    tauri::Builder::default()
        .manage(AppState {
            store_path,
            store: Mutex::new(store),
            chat_runtime: Mutex::new(HashMap::new()),
        })
        .invoke_handler(tauri::generate_handler![ipc_invoke, ipc_send])
        .setup(|app| {
            let _ = app.emit("indexing:status", default_indexing_stats());
            spawn_redclaw_scheduler(&app.handle());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to run XHS Atelier");
}
