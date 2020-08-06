
console.log("\nStarting test.js:");

const csvContent = [
  ["id", "name", "no", "col1", "col2", "col3"],
  ["0", "a", 9, 1, 1, 1],
  ["1", "a", 9, 2, 2, 2],
  ["2", "b", 9, 0, 1, 2],
  ["3", "b", 9, 0, 0, 1],
  ["4", "c", 9, 1, 2, 3],
]
const dissolveField = "name";

async function main(csvContent, dissolveField) {
  csv2dArray = csvContent;
  headerRow = csv2dArray[0];
  dissolveIndex = headerRow.indexOf(dissolveField);
  dataRows = {};

  console.log("headerRow:\n", headerRow);
  console.log("csv2dArray:\n", csv2dArray);

  /* Each Row */
  for(let i = 1; i < csv2dArray.length; i++) {
    currentRow = csv2dArray[i];
    groupName = currentRow[dissolveIndex];
    console.log("i, currentRow", i, currentRow);
    // console.log(`On row ID ${currentRow[0]}`);

    if (dataRows[groupName] === undefined) {
      dataRows[groupName] = currentRow;
    } else {
      /* Each Cell */
      for (let ii = 0; ii < currentRow.length; ii++) {
        cellValue = currentRow[ii]
        /* If the cell represents data */
        if (typeof cellValue === "number" && headerRow[ii] !== "no") {
          dataRows[groupName][ii] = dataRows[groupName][ii] += cellValue;
        }
      }
    }
  }

  output2dArray = [];
  output2dArray.push(headerRow);
  for (groupName in dataRows) {
    if (groupName in dataRows) {
      output2dArray.push(dataRows[groupName]);
    }
  }

  console.log("output2dArray:\n", output2dArray);

}

main(csvContent, dissolveField);
