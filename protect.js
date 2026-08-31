const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const options = {
    compact: true,
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: false,
    stringArray: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayEncoding: ['rc4'],
    stringArrayThreshold: 1,
    splitStrings: true,
    splitStringsChunkLength: 6,
    selfDefending: true,
    deadCodeInjection: false,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.35,
    numbersToExpressions: true,
    simplify: true,
    transformObjectKeys: false,
    disableConsoleOutput: true,
    debugProtection: false,
    target: 'browser',
    reservedNames: []
};

const files = [
    { src: path.join('index', 'script.js'), dest: path.join('index', 'script.obf.js') },
    { src: path.join('index', 'admin_script.js'), dest: path.join('index', 'admin_script.obf.js') },
    { src: path.join('index', 'security.js'), dest: path.join('index', 'security.obf.js') },
    { src: path.join('index', 'boot_shop.js'), dest: path.join('index', 'boot_shop.obf.js') },
    { src: path.join('index', 'boot_admin.js'), dest: path.join('index', 'boot_admin.obf.js') }
];

for (const file of files) {
    const code = fs.readFileSync(file.src, 'utf8');
    const result = JavaScriptObfuscator.obfuscate(code, options);
    fs.writeFileSync(file.dest, result.getObfuscatedCode());
    const kb = (fs.statSync(file.dest).size / 1024).toFixed(1);
    console.log('Protected', file.src, '→', file.dest, '(' + kb + ' KB)');
}

console.log('Xong. Shop/admin chạy bản mã hóa; file gốc không tải được qua HTTP.');
