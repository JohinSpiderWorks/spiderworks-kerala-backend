const XLSX = require("xlsx");
async function readExcelFile(filepath) {
  // Read the Excel file
  const workbook = XLSX.readFile(filepath);
  const sheetName = workbook.SheetNames[0]; // Get the first sheet
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  return data;
}

module.exports = readExcelFile;
