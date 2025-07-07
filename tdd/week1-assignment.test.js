const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

describe('Week 1 Assignment Solution Tests', () => {
  const assignmentDir = path.join(__dirname, '../Week-1');
  const sampleFilesDir = path.join(assignmentDir, 'sample-files');

  test('globals-demo.js outputs correct globals', () => {
    const scriptPath = path.join(assignmentDir, 'globals-demo.js');
    const output = execSync(`node ${scriptPath}`).toString();
    expect(output).toContain(`__dirname: ${assignmentDir}`);
    expect(output).toContain(`__filename: ${scriptPath}`);
    expect(output).toMatch(/Process ID:/);
    expect(output).toMatch(/Platform:/);
    expect(output).toMatch(/Custom global variable: Hello, global!/);
  });

  test('async-demo.js reads and writes sample.txt correctly and demonstrates async patterns', () => {
    // Remove sample.txt if it exists
    const sampleTxt = path.join(sampleFilesDir, 'sample.txt');
    if (fs.existsSync(sampleTxt)) fs.unlinkSync(sampleTxt);
    const output = execSync(`node ${path.join(assignmentDir, 'async-demo.js')}`).toString();
    // Check callback output
    expect(output).toMatch(/Callback read: Hello, async world!/);
    // Check promise output
    expect(output).toMatch(/Promise read: Hello, async world!/);
    // Check async/await output
    expect(output).toMatch(/Async\/Await read: Hello, async world!/);
    // File should exist after script runs
    expect(fs.existsSync(sampleTxt)).toBe(true);
    // Ensure no error logs for normal operation
    expect(output).not.toMatch(/error/i);
  });

  test('core-modules-demo.js uses os, path, fs.promises, and streams', () => {
    const demoTxt = path.join(sampleFilesDir, 'demo.txt');
    const largeFile = path.join(sampleFilesDir, 'largefile.txt');
    // Remove files if they exist
    if (fs.existsSync(demoTxt)) fs.unlinkSync(demoTxt);
    if (fs.existsSync(largeFile)) fs.unlinkSync(largeFile);
    const output = execSync(`node ${path.join(assignmentDir, 'core-modules-demo.js')}`).toString();
    // OS module output
    expect(output).toMatch(/Platform:/);
    expect(output).toMatch(/CPU:/);
    expect(output).toMatch(/Total Memory:/);
    // Path module output
    expect(output).toMatch(/Joined path:/);
    // fs.promises output
    expect(output).toMatch(/fs\.promises read: Hello from fs\.promises!/);
    // Streams output: should see at least one chunk and the end message
    expect(output).toMatch(/Read chunk:/);
    expect(output).toMatch(/Finished reading large file with streams/);
    // Files should exist after script runs
    expect(fs.existsSync(demoTxt)).toBe(true);
    expect(fs.existsSync(largeFile)).toBe(true);
    // Check that the large file has 100 lines
    const lines = fs.readFileSync(largeFile, 'utf8').split('\n').filter(Boolean);
    expect(lines.length).toBe(100);
    expect(lines[0]).toBe('This is a line in a large file.');
  });
}); 