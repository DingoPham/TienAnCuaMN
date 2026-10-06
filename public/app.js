// Dán URL Web App của Google Apps Script vào đây.
const SCRIPT_URL = "/api/submit";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const weeklyPayers = $("#weeklyPayers");
const dailyMeals = $("#dailyMeals");
const carryovers = $("#carryovers");
const form = $("#foodForm");
const preview = $("#preview");
const message = $("#message");

function money(value) {
  return Number(value || 0).toLocaleString("vi-VN") + "vnđ";
}

function addPayer(data = {}) {
  const node = $("#payerTemplate").content.cloneNode(true);
  const row = $(".payer-row", node);
  $(".payer-name", row).value = data.name || "";
  $(".payer-amount", row).value = data.amount || "";
  $(".payer-paid", row).value = data.paid || "Đã trả";
  $(".remove", row).addEventListener("click", () => {
    row.remove();
    updatePreview();
  });
  $$("input,select", row).forEach(el => el.addEventListener("input", updatePreview));
  weeklyPayers.appendChild(node);
}

function addPerson(list, data = {}) {
  const node = $("#personTemplate").content.cloneNode(true);
  const row = $(".person-row", node);
  $(".person-name", row).value = data.name || "";
  $(".person-amount", row).value = data.amount || "";
  $(".person-status", row).value = data.status || "Đã trả";
  $(".remove", row).addEventListener("click", () => {
    row.remove();
    updatePreview();
  });
  $$("input,select", row).forEach(el => el.addEventListener("input", updatePreview));
  list.appendChild(node);
}

function addDay(data = {}) {
  const node = $("#dayTemplate").content.cloneNode(true);
  const day = $(".day-block", node);
  $(".meal-date", day).value = data.date || "";
  const people = $(".people-list", day);

  (data.people?.length ? data.people : [{}]).forEach(person => addPerson(people, person));

  $(".add-person", day).addEventListener("click", () => {
    addPerson(people);
    updatePreview();
  });

  $(".remove-day", day).addEventListener("click", () => {
    day.remove();
    updatePreview();
  });

  $(".meal-date", day).addEventListener("input", updatePreview);
  dailyMeals.appendChild(node);
}

function addCarryover(data = {}) {
  const node = $("#carryoverTemplate").content.cloneNode(true);
  const row = $(".carryover-row", node);
  $(".carry-name", row).value = data.name || "";
  $(".carry-detail", row).value = data.detail || "";
  $(".remove", row).addEventListener("click", () => {
    row.remove();
    updatePreview();
  });
  $$("input", row).forEach(el => el.addEventListener("input", updatePreview));
  carryovers.appendChild(node);
}

function formatDate(dateString) {
  if (!dateString) return "";
  const [y, m, d] = dateString.split("-");
  return `${d}/${m}`;
}

function collectData() {
  const payers = $$(".payer-row").map(row => ({
    name: $(".payer-name", row).value.trim(),
    amount: $(".payer-amount", row).value,
    paid: $(".payer-paid", row).value
  })).filter(x => x.name);

  const days = $$(".day-block").map(day => ({
    date: $(".meal-date", day).value,
    people: $$(".person-row", day).map(row => ({
      name: $(".person-name", row).value.trim(),
      amount: $(".person-amount", row).value,
      status: $(".person-status", row).value
    })).filter(x => x.name)
  })).filter(x => x.date);

  const carryover = $$(".carryover-row").map(row => ({
    name: $(".carry-name", row).value.trim(),
    detail: $(".carry-detail", row).value.trim()
  })).filter(x => x.name || x.detail);

  return {
    fromDate: $("#fromDate").value,
    toDate: $("#toDate").value,
    payers,
    days,
    carryover,
    bossDates: $("#bossDates").value.trim()
  };
}

function buildPayerText(data) {
  return data.payers.map(x =>
    `+ ${x.name}: ${money(x.amount)}${x.paid === "Đã trả" ? " (Đã trả)" : " (Chưa trả)"}`
  ).join("\n");
}

function buildMealsText(data) {
  return data.days.map(day => {
    const people = day.people.map(x => {
      const status =
        x.status === "Đã trả" ? " (Đã trả)" :
        x.status === "Sử dụng khoản dư" ? " (Sử dụng khoản dư)" :
        " (Chưa trả)";
      return `+ ${x.name}: ${money(x.amount)}${status}`;
    }).join("\n");
    return `- Ngày ${formatDate(day.date)}\n${people}`;
  }).join("\n");
}

function buildCarryoverText(data) {
  return data.carryover.map(x => `+ ${x.name}: ${x.detail}`).join("\n");
}

function updatePreview() {
  const data = collectData();
  const values = [
    [`Ngày`, data.fromDate && data.toDate ? `${formatDate(data.fromDate)} - ${formatDate(data.toDate)}` : ""],
    [`Những người đóng tiền theo tuần`, buildPayerText(data)],
    [`Những người ăn trong ngày`, buildMealsText(data)],
    [`Khoản dư tuần trước`, buildCarryoverText(data)],
    [`Khoản dư trước sếp đã ăn`, buildCarryoverText(data)],
    [`Tổng khoản của sếp đã ăn`, data.bossDates]
  ];

  preview.innerHTML = values.map(([title, value]) => `
    <div class="preview-item">
      <strong>${escapeHtml(title)}</strong>
      <div>${escapeHtml(value || "—")}</div>
    </div>
  `).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

$("#addPayer").addEventListener("click", () => { addPayer(); updatePreview(); });
$("#addDay").addEventListener("click", () => { addDay(); updatePreview(); });
$("#addCarryover").addEventListener("click", () => { addCarryover(); updatePreview(); });

form.addEventListener("input", updatePreview);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.className = "message";
  message.textContent = "";

    const data = collectData();
  const button = $("#submitBtn");
  button.disabled = true;
  button.textContent = "Đang lưu...";

  try {
    // no-cors được dùng để frontend GitHub Pages có thể gửi POST
    // tới Google Apps Script mà không cần dựng server riêng.
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {"Content-Type": "text/plain;charset=utf-8"},
      body: JSON.stringify(data)
    });

    message.className = "message success";
    message.textContent = "Đã gửi dữ liệu. Kiểm tra Google Sheets để xác nhận.";
    form.reset();
    weeklyPayers.innerHTML = "";
    dailyMeals.innerHTML = "";
    carryovers.innerHTML = "";
    addPayer();
    addDay();
    updatePreview();
  } catch (error) {
    console.error(error);
    message.className = "message error";
    message.textContent = "Không gửi được dữ liệu. Hãy kiểm tra URL Apps Script.";
  } finally {
    button.disabled = false;
    button.textContent = "Lưu vào Google Sheets";
  }
});

addPayer();
addDay();
addCarryover();
updatePreview();
