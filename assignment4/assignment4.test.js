const { Client } = require("pg");
const readline = require("readline");
const fs = require("fs").promises

require("dotenv").config({path: "../.env"});
let client = null
let connected_to_database = false
let connected_to_homework_file = false
let transaction_open = false
const lines = []

const one_sql_line = () => {
    while (true) {
        let line = lines.shift()
        if (line == undefined) return line;
        line = line.trim()
        if (line.length===0 || line[0] === "#") continue; // skip comments and blank lines
        return line;
    }

}

beforeAll(async () => {
    client = new Client({ connectionString: process.env.DB_URL });
    try {
        await client.connect();
        connected_to_database = true
        client.on
    } catch (error) {
        // This is a mystery error, assumed to be not recoverable
        console.log("error connecting to database");
        console.log(
          `An error occurred: ${error.name} ${error.message} ${error.stack}`,
        );
      }
      if (connected_to_database) {
        try {
            const homework_fd = await fs.open('./assignment4-sql.txt');
            const homework_stream = homework_fd.createReadStream();
            const rl = readline.createInterface({
                input: homework_stream,
                crlfDelay: Infinity // Handle all line endings consistently
              });
            for await (const line of rl) {
                lines.push(line)
            }
           rl.close()
           console.log("lines length", lines.length)
           homework_stream.close();
           await homework_fd.close();
            connected_to_homework_file = true
        } catch (error ) {
            console.log("error connecting to homework file.")
            console.log(error)
        }
        }
})

afterAll(async () => {

    if (transaction_open) {
        await client.query("ROLLBACK;")
    }
    client.end()
})

test('Total price of the first 5 orders', async () => {
    expect(connected_to_database).toBe(true)
    expect(connected_to_homework_file).toBe(true)
    const sql_line = one_sql_line()
    console.log("sql_line", sql_line)
    expect(sql_line).not.toBe(undefined)
    result = await client.query(sql_line)
    expect(result.rows.length).toBe(5)
    expect('order_id' in result.rows[0]).toBe(true)
    expect(result.rows[0].order_id).toBe(1)
    expect('total_price' in result.rows[0]).toBe(true)
    expect(Math.floor(result.rows[0].total_price)).toBe(513)
})