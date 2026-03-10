const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            /* Recurse into a subdirectory */
            results = results.concat(walk(file));
        } else {
            /* Is a file */
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const srcDir = path.join(__dirname, '../src');
const files = walk(srcDir);
const largeFiles = [];

files.forEach(f => {
    const content = fs.readFileSync(f, 'utf-8');
    const lines = content.split('\n').length;
    if (lines > 500) {
        largeFiles.push({ file: f.replace(srcDir + path.sep, ''), lines });
    }
});

largeFiles.sort((a, b) => b.lines - a.lines);
console.log(JSON.stringify(largeFiles, null, 2));
