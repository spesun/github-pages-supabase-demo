import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const config = window.APP_CONFIG ?? {};
const configured = Boolean(
  config.supabaseUrl &&
  config.supabasePublishableKey &&
  !config.supabaseUrl.includes("YOUR_PROJECT") &&
  !config.supabasePublishableKey.includes("YOUR_PUBLISHABLE_KEY")
);

const form = document.querySelector("#message-form");
const authorInput = document.querySelector("#author");
const contentInput = document.querySelector("#content");
const submitButton = document.querySelector("#submit-button");
const refreshButton = document.querySelector("#refresh-button");
const messagesContainer = document.querySelector("#messages");
const formStatus = document.querySelector("#form-status");
const charCount = document.querySelector("#char-count");
const badge = document.querySelector("#connection-badge");
const setupPanel = document.querySelector("#setup-panel");

let supabase = null;

function setStatus(message, type = "") {
  formStatus.textContent = message;
  formStatus.className = `status ${type}`.trim();
}

function setConnectedBadge() {
  badge.textContent = "数据库已连接";
  badge.className = "badge badge-connected";
}

function setErrorBadge() {
  badge.textContent = "连接失败";
  badge.className = "badge badge-error";
}

function formatTime(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function renderMessages(rows) {
  messagesContainer.replaceChildren();

  if (!rows.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "还没有留言，来发布第一条吧。";
    messagesContainer.append(empty);
    return;
  }

  for (const row of rows) {
    const article = document.createElement("article");
    article.className = "message";

    const head = document.createElement("div");
    head.className = "message-head";

    const author = document.createElement("span");
    author.className = "message-author";
    author.textContent = row.author;

    const time = document.createElement("time");
    time.className = "message-time";
    time.dateTime = row.created_at;
    time.textContent = formatTime(row.created_at);

    const content = document.createElement("p");
    content.className = "message-content";
    content.textContent = row.content;

    head.append(author, time);
    article.append(head, content);
    messagesContainer.append(article);
  }
}

async function loadMessages() {
  if (!supabase) return;
  refreshButton.disabled = true;
  messagesContainer.innerHTML = '<p class="empty-state">正在读取留言……</p>';

  const { data, error } = await supabase
    .from("messages")
    .select("id, author, content, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  refreshButton.disabled = false;

  if (error) {
    setErrorBadge();
    messagesContainer.innerHTML = '<p class="empty-state">读取失败，请检查 Supabase 表和 RLS 策略。</p>';
    setStatus(`读取失败：${error.message}`, "error");
    return;
  }

  setConnectedBadge();
  renderMessages(data ?? []);
}

contentInput.addEventListener("input", () => {
  charCount.textContent = `${contentInput.value.length} / 280`;
});

refreshButton.addEventListener("click", loadMessages);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) {
    setStatus("请先配置 Supabase。", "error");
    return;
  }

  const author = authorInput.value.trim();
  const content = contentInput.value.trim();
  if (!author || !content) return;

  submitButton.disabled = true;
  setStatus("正在发布……");

  const { error } = await supabase.from("messages").insert({ author, content });
  submitButton.disabled = false;

  if (error) {
    setStatus(`发布失败：${error.message}`, "error");
    return;
  }

  contentInput.value = "";
  charCount.textContent = "0 / 280";
  setStatus("发布成功。", "success");
  await loadMessages();
});

if (!configured) {
  badge.textContent = "等待配置";
  badge.className = "badge badge-pending";
  setupPanel.hidden = false;
  submitButton.disabled = true;
  refreshButton.disabled = true;
  messagesContainer.innerHTML = '<p class="empty-state">配置 Supabase 后，这里会显示云端留言。</p>';
} else {
  supabase = createClient(config.supabaseUrl, config.supabasePublishableKey);
  loadMessages();
}
