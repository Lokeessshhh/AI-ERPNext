import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import csv from 'csv-parser'
import createCsvWriter from 'csv-writer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, '../data')

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

export const readCSV = (filename) => {
  return new Promise((resolve, reject) => {
    const results = []
    const filePath = path.join(dataDir, filename)
    
    if (!fs.existsSync(filePath)) {
      resolve([])
      return
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject)
  })
}

export const writeCSV = async (filename, data, headers) => {
  const filePath = path.join(dataDir, filename)
  
  const csvWriter = createCsvWriter.createObjectCsvWriter({
    path: filePath,
    header: headers
  })

  await csvWriter.writeRecords(data)
}

export const appendCSV = async (filename, record, headers) => {
  const filePath = path.join(dataDir, filename)
  const fileExists = fs.existsSync(filePath)
  
  const csvWriter = createCsvWriter.createObjectCsvWriter({
    path: filePath,
    header: headers,
    append: fileExists
  })

  await csvWriter.writeRecords([record])
}