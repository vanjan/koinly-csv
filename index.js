import fs from 'fs'
import csv from 'csv-parser'
import stripBomStream from 'strip-bom-stream'

const koinlyRows = [];

function stripMinus(value) {
    return (value.charAt(0) === '-') ? value.substring(1) : value
}

function generateKoinlyRow(koinlyRows, row) {
    const description = row.Description.toLowerCase();
    if (description === 'interest' || description === 'affiliate summary' || description === 'deposit'
        || description === 'correction' || description === 'token swap (received)') {
        const koinlyRow = {
            Date: row.Date,
            'Received Amount': row['Received Amount'],
            'Received Currency': row['Received Currency'],
            'Net Worth Amount': row.Balance,
            'Net Worth Currency': row['Balance Asset'],
            TxHash: row.TxHash
        }
        koinlyRows.push(koinlyRow);
    } else if (description === 'withdrawal' || description === 'token swap (paid)') {
        const koinlyRow = {
            Date: row.Date,
            'Sent Amount': stripMinus(row['Sent Amount']),
            'Sent Currency': row['Sent Currency'],
            'Net Worth Amount': row.Balance,
            'Net Worth Currency': row['Balance Asset'],
            'TxHash': row.TxHash
        }
        koinlyRows.push(koinlyRow);
    } else if (description === 'withdrawal fee') {
        const koinlyRow = koinlyRows[koinlyRows.length - 1];
        koinlyRow['Fee Amount'] = stripMinus(row['Sent Amount'])
        koinlyRow['Fee Currency'] = row['Sent Currency']
    }
}

function writeToCSVFile(koinlyRows) {
    const filename = 'output.csv';
    fs.writeFile(filename, extractAsCSV(koinlyRows), err => {
        if (err) {
            console.log('Error writing to csv file', err);
        } else {
            console.log(`saved as ${filename}`);
        }
    });
}

function extractAsCSV(koinlyRows) {
    const header = ["Date", "Sent Amount", "Sent Currency", "Received Amount", "Received Currency"]
    const rows = koinlyRows.map(koinlyRow => {
        const row = header.map(key => koinlyRow[key]).join(',')
        return row
    })
    return [header.join(",")].concat(rows).join("\n")
}


fs.createReadStream('Hodlnaut_Transaction_Summary_2022-02-09T14 11 31+01 00.csv')
    .pipe(stripBomStream())
    .pipe(csv({bom: true}))
    .on('data', function (row) {
        generateKoinlyRow(koinlyRows, row)
    })
    .on('end', function () {
        writeToCSVFile(koinlyRows)
    })
