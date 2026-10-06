const SHEET_NAME = "Data";

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, message: "Food form API is running." }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        "Ngày",
        "Những người đóng tiền theo tuần",
        "Những người ăn trong ngày",
        "Những khoản dư đóng theo tuần mà tuần trước chưa dùng",
        "Những khoản dư trước sếp đã ăn",
        "Tổng những khoản của sếp đã ăn",
        "Thời gian gửi"
      ]);
      sheet.setFrozenRows(1);
    }

    const fromDate = payload.fromDate || "";
    const toDate = payload.toDate || "";
    const dateRange = fromDate && toDate
      ? `${formatDate_(fromDate)} - ${formatDate_(toDate)}`
      : formatDate_(fromDate || toDate);

    const weeklyPayers = (payload.payers || []).map(x =>
      `+ ${x.name}: ${money_(x.amount)}${x.paid === "Đã trả" ? " (Đã trả)" : " (Chưa trả)"}`
    ).join("\n");

    const dailyMeals = (payload.days || []).map(day => {
      const people = (day.people || []).map(x => {
        let status = " (Chưa trả)";
        if (x.status === "Đã trả") status = " (Đã trả)";
        if (x.status === "Sử dụng khoản dư") status = " (Sử dụng khoản dư)";
        return `+ ${x.name}: ${money_(x.amount)}${status}`;
      }).join("\n");

      return `- Ngày ${formatDate_(day.date)}\n${people}`;
    }).join("\n");

    const carryover = (payload.carryover || []).map(x =>
      `+ ${x.name}: ${x.detail}`
    ).join("\n");

    sheet.appendRow([
      dateRange,
      weeklyPayers,
      dailyMeals,
      carryover,
      carryover,
      payload.bossDates || "",
      new Date()
    ]);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function formatDate_(value) {
  if (!value) return "";
  const parts = String(value).split("-");
  if (parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}`;
}

function money_(value) {
  const number = Number(value || 0);
  return number.toLocaleString("vi-VN") + "vnđ";
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
