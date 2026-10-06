// ── Config ────────────────────────────────────────────────────
// Runtime override injected by Nginx (/config.js) when deployed via Docker
if (window.APP_CONFIG && window.APP_CONFIG.apiBaseUrl) {
  document.getElementById("server-url").value = window.APP_CONFIG.apiBaseUrl;
}

function getBaseUrl() {
  return document.getElementById("server-url").value.replace(/\/+$/, "");
}

// ── DOM References ───────────────────────────────────────────
const form       = document.getElementById("item-form");
const formTitle  = document.getElementById("form-title");
const itemId     = document.getElementById("item-id");
const itemName   = document.getElementById("item-name");
const itemDesc   = document.getElementById("item-desc");
const btnSubmit  = document.getElementById("btn-submit");
const btnPut     = document.getElementById("btn-put");
const btnPatch   = document.getElementById("btn-patch");
const btnCancel  = document.getElementById("btn-cancel");
const btnRefresh = document.getElementById("btn-refresh");
const tbody      = document.getElementById("items-body");
const logEl      = document.getElementById("response-log");

// ── Logging ──────────────────────────────────────────────────
function log(method, url, status, body) {
  const time = new Date().toLocaleTimeString();
  const line = `[${time}] ${method} ${url}\nStatus: ${status}\n${JSON.stringify(body, null, 2)}\n${"─".repeat(50)}\n`;
  logEl.textContent = line + logEl.textContent;
}

// ── API Calls ────────────────────────────────────────────────
async function apiCall(method, path = "", body = null) {
  const url = getBaseUrl() + path;
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(url, options);
    const data = await res.json();
    log(method, url, res.status, data);
    return data;
  } catch (err) {
    log(method, url, "ERR", { error: err.message });
    return null;
  }
}

// ── Render Table ─────────────────────────────────────────────
function renderItems(items) {
  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty">No items found.</td></tr>`;
    return;
  }
  tbody.innerHTML = items
    .map(
      (item) => `
    <tr>
      <td>${item.id}</td>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.description)}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-edit" onclick="editItem(${item.id}, '${escapeAttr(item.name)}', '${escapeAttr(item.description)}')">Edit</button>
          <button class="btn btn-danger" onclick="deleteItem(${item.id})">Delete</button>
        </div>
      </td>
    </tr>`
    )
    .join("");
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeAttr(str) {
  if (!str) return "";
  return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// ── GET All ──────────────────────────────────────────────────
async function refreshItems() {
  const res = await apiCall("GET");
  if (res && res.success) renderItems(res.data);
}

// ── POST — Create ────────────────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = { name: itemName.value, description: itemDesc.value };
  const res = await apiCall("POST", "", body);
  if (res && res.success) {
    resetForm();
    refreshItems();
  }
});

// ── Edit Mode ────────────────────────────────────────────────
function editItem(id, name, desc) {
  formTitle.textContent = `Edit Item #${id}`;
  itemId.value = id;
  itemName.value = name;
  itemDesc.value = desc;
  btnSubmit.style.display = "none";
  btnPut.style.display = "inline-block";
  btnPatch.style.display = "inline-block";
  btnCancel.style.display = "inline-block";
}

// ── PUT — Replace ────────────────────────────────────────────
btnPut.addEventListener("click", async () => {
  const id = itemId.value;
  const body = { name: itemName.value, description: itemDesc.value };
  const res = await apiCall("PUT", `/${id}`, body);
  if (res && res.success) {
    resetForm();
    refreshItems();
  }
});

// ── PATCH — Partial Update ───────────────────────────────────
btnPatch.addEventListener("click", async () => {
  const id = itemId.value;
  const body = {};
  if (itemName.value) body.name = itemName.value;
  if (itemDesc.value) body.description = itemDesc.value;
  const res = await apiCall("PATCH", `/${id}`, body);
  if (res && res.success) {
    resetForm();
    refreshItems();
  }
});

// ── DELETE ────────────────────────────────────────────────────
async function deleteItem(id) {
  if (!confirm(`Delete item #${id}?`)) return;
  const res = await apiCall("DELETE", `/${id}`);
  if (res && res.success) refreshItems();
}

// ── Reset Form ───────────────────────────────────────────────
function resetForm() {
  formTitle.textContent = "Create New Item";
  itemId.value = "";
  itemName.value = "";
  itemDesc.value = "";
  btnSubmit.style.display = "inline-block";
  btnPut.style.display = "none";
  btnPatch.style.display = "none";
  btnCancel.style.display = "none";
}

btnCancel.addEventListener("click", resetForm);
btnRefresh.addEventListener("click", refreshItems);

// ── Initial Load ─────────────────────────────────────────────
refreshItems();
