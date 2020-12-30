// Generates a CVS to fill up the spreadsheet with data from before #400

const { writeFileSync, readFileSync } = require("fs");

const contents = JSON.parse(readFileSync("data/contents.json"));

const teamNameMap = {
  "Markus Schlegel": "MS",
  "Peter Kröner": "PK",
  "Christian Schaefer": "CS",
  "Hans Christian Reinl": "HCR",
  "Kahlil Lechelt": "KL",
  "Rodney Rehm": "RR",
  "Stefan Baumgartner": "SB",
  "Anselm Hannemann": "AH",
};

const output = [];
for(const key in contents) {
  const { id, date, people, title } = contents[key];
  const team = people
    .filter( ({ team }) => team )
    .map(({ name }) => teamNameMap[name])
    .sort()
    .join(", ");
  const guests = people
    .filter( ({ team }) => !team )
    .map(({ name }) => name)
    .sort()
    .join(", ");

  if (id === 140) { // non-existent thank to audio failure
    output.unshift([
      String(id),                                         // "Nummer"
      "",                                                 // "ist raus"
      "",                                                 // "als ED"
      "",                                                 // "Aufname"
      "",                                                 // "Release Public"
      `"${guests}"`,                                      // "Gast"
      `"${team}"`,                                        // "Crew"
      `Open Device Labs und Konferenzen`,                 // "Thema"
      `"Audio unrettbar kaputt, keine Veröffentlichung"`, // "Anmerkung für Sabine"
    ]);
    continue;
  }

  output.unshift([
    String(id),                          // "Nummer"
    "X",                                 // "ist raus"
    "",                                  // "als ED"
    "",                                  // "Aufname"
    date.split("-").reverse().join("."), // "Release Public"
    `"${guests}"`,                       // "Gast"
    `"${team}"`,                         // "Crew"
    `"${title}"`,                        // "Thema"
    "",                                  // "Anmerkung für Sabine"
  ]);

  // last ID that we've got data for, pad out until 399
  if (id === 363) {
    for (let i = 364; i < 400; i++) {
      output.unshift([
        String(i), // "Nummer"
        "X",       // "ist raus"
        "",        // "als ED"
        "",        // "Aufname"
        "",        // "Release Public"
        "",        // "Gast"
        "",        // "Crew"
        "",        // "Thema"
        "",        // "Anmerkung für Sabine"
      ]);
    }
  }

}

const csv = output.map( (row) => row.join(",") ).join("\n")

writeFileSync("data/contents.csv", csv, { encoding: "utf-8" });

console.log("Done!");
