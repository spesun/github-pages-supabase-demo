import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const config = window.APP_CONFIG ?? {};
const configured = Boolean(
  config.supabaseUrl &&
  config.supabasePublishableKey &&
  !config.supabaseUrl.includes("YOUR_PROJECT") &&
  !config.supabasePublishableKey.includes("YOUR_PUBLISHABLE_KEY")
);

const authForm = document.querySelector("#auth-form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const loginButton = document.querySelector("#login-button");
const signupButton = document.querySelector("#signup-button");
const logoutButton = document.querySelector("#logout-button");
const authBadge = document.querySelector("#auth-badge");
const authStatus = document.querySelector("#auth-status");
const userPanel = document.querySelector("#user-panel");
const userEmail = document.querySelector("#user-email");
const loginHint = document.querySelector("#login-hint");
const form = document.querySelector("#message-form");
const messageFields = document.querySelector("#message-fields");
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
let currentUser = null;

function setStatus(element, message, type = "") {
  element.textContent = message;
  element.className = `status ${type}`.trim();
}

function setAuthBusy(busy) {
  loginButton.disabled = busy;
  signupButton.disabled = busy;
}

function setConnectedBadge() {
  badge.textContent = "数据库已连接";
  badge.className = "badge badge-connected";
}

function setErrorBadge() {
  badge.textContent = "连接失败";
  badge.className = "badge badge-error";
}

function updateAuthUI(user) {
  currentUser = user;
  const loggedIn = Boolean(user);

  authForm.hidden = loggedIn;
  userPanel.hidden = !loggedIn;
  messageFields.disabled = !loggedIn || !configured;
  loginHint.hidden = loggedIn;

  if (loggedIn) {
    userEmail.textContent = user.email ?? user.id;
    authBadge.textContent = "已登录";
    authBadge.className = "badge badge-connected";
    setStatus(authStatus, "登录成功，可以发布留言。", "success");
  } else {
    userEmail.textContent = "";
    authBadge.textContent = "未登录";
    authBadge.className = "badge badge-pending";
    setStatus(authStatus, "");
    setStatus(formStatus, "登录后才能发布留言。", "");
  }
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
    empty.textContent = "还没有留言，登录后发布第一条吧。";
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
    setStatus(formStatus, `读取失败：${error.message}`, "error");
    return;
  }

  setConnectedBadge();
  renderMessages(data ?? []);
}

async function login() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) return;

  setAuthBusy(true);
  setStatus(authStatus, "正在登录……");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  setAuthBusy(false);

  if (error) {
    setStatus(authStatus, `登录失败：${error.message}`, "error");
    return;
  }

  passwordInput.value = "";
}

async function signup() {
  if (!authForm.reportValidity()) return;
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  setAuthBusy(true);
  setStatus(authStatus, "正在注册……");
  const { data, error } = await supabase.auth.signUp({ email, password });
  setAuthBusy(false);

  if (error) {
    setStatus(authStatus, `注册失败：${error.message}`, "error");
    return;
  }

  passwordInput.value = "";
  if (data.session) {
    setStatus(authStatus, "注册成功，已自动登录。", "success");
  } else {
    setStatus(authStatus, "注册成功。请到邮箱点击确认链接后再登录。", "success");
  }
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) {
    setStatus(authStatus, "请先配置 Supabase。", "error");
    return;
  }
  await login();
});

signupButton.addEventListener("click", async () => {
  if (!supabase) {
    setStatus(authStatus, "请先配置 Supabase。", "error");
    return;
  }
  await signup();
});

logoutButton.addEventListener("click", async () => {
  setStatus(authStatus, "正在退出……");
  const { error } = await supabase.auth.signOut();
  if (error) setStatus(authStatus, `退出失败：${error.message}`, "error");
});

contentInput.addEventListener("input", () => {
  charCount.textContent = `${contentInput.value.length} / 280`;
});

refreshButton.addEventListener("click", loadMessages);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) {
    setStatus(formStatus, "请先配置 Supabase。", "error");
    return;
  }
  if (!currentUser) {
    setStatus(formStatus, "请先登录。", "error");
    return;
  }

  const author = authorInput.value.trim();
  const content = contentInput.value.trim();
  if (!author || !content) return;

  submitButton.disabled = true;
  setStatus(formStatus, "正在发布……");

  const { error } = await supabase.from("messages").insert({
    author,
    content,
    user_id: currentUser.id
  });
  submitButton.disabled = false;

  if (error) {
    setStatus(formStatus, `发布失败：${error.message}`, "error");
    return;
  }

  contentInput.value = "";
  charCount.textContent = "0 / 280";
  setStatus(formStatus, "发布成功。", "success");
  await loadMessages();
});

if (!configured) {
  badge.textContent = "等待配置";
  badge.className = "badge badge-pending";
  authBadge.textContent = "等待配置";
  setupPanel.hidden = false;
  authForm.querySelectorAll("input, button").forEach((element) => {
    element.disabled = true;
  });
  messageFields.disabled = true;
  refreshButton.disabled = true;
  messagesContainer.innerHTML = '<p class="empty-state">配置 Supabase 后，这里会显示云端留言。</p>';
} else {
  supabase = createClient(config.supabaseUrl, config.supabasePublishableKey);

  const { data: { session } } = await supabase.auth.getSession();
  updateAuthUI(session?.user ?? null);

  supabase.auth.onAuthStateChange((_event, sessionState) => {
    updateAuthUI(sessionState?.user ?? null);
  });

  await loadMessages();
}
