#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const exists = require('path-exists').sync;
let shells = require('shells')();
const binDir = './node_modules/.bin';
const comment = `# added by \`npm i local-bin-path\``;

function linesToAdd(shell) {
    const cmd = (shell.type === 'fish')
        ? `set -gx PATH $PATH ${binDir}`
        : `export PATH=$\{PATH\}:${binDir}`;
    return `${comment}\n${cmd}`;
}

function logDone() {
    console.log(`
Done! Restart your shell(s) and give the commands below a try. You should see
that tslint is now executable within the foo directory, even though it's not
globally installed.

npm i tslint
which tslint
`);
}
function install(shell) {
    let config = fs.readFileSync(shell.file, 'utf8');

    if (config.match(binDir)) {
      console.log(`${shell.file} already contains ${binDir} mojo; skipping`);
      return
    }

    const lines = linesToAdd(shell);
    config += `\n${lines}\n`;
    fs.writeFileSync(shell.file, config);

    console.log(`added\n${lines}\n-->to ${shell.file}`);
    logDone();
}

function uninstall(shell) {
    let config = fs.readFileSync(shell.file, 'utf8');

    if (! config.match(binDir)) {
        console.log(`${shell.file} do not contains ${binDir} mojo; skipping`);
        return
    }

    let lines = linesToAdd(shell).split('\n');
    config = config.split('\n');
    let i = config.indexOf(lines[0]);
    // remove '\n' added after lines
    const i1 = i + lines.length;
    if (i1 < config.length && config[i1] === '') {
        config.splice(i1, 1);
    }
    // remove '\n' added before lines
    if (i > 0 && config[i-1] === '') {
        config.splice(i-1, 1);
    }
    config = config.filter(l => !lines.includes(l));

    config = config.join('\n');
    lines = lines.join('\n');
    fs.writeFileSync(shell.file, config);

    console.log(`removed\n${lines}\n-->from ${shell.file}`);
    logDone();
}

if (!shells.length && os.platform() === "win32") {
    console.log(`Note: On Windows, you should use git bash, not command prompt
If you use IntelliJ/ WebStorm/..., pls goto:
Settings > Tools > Terminal
and set 'Shell path' to 'C:\\Program Files\\Git\\bin\\sh.exe'`);
    const bashrc = os.homedir() + "/.bashrc";
    if (!exists(bashrc)) {
        fs.openSync(bashrc, "w");
        const bashProfile = os.homedir() + "/.bash_profile";
        if(!exists(bashProfile)) {
            fs.appendFileSync(bashProfile,
`test -f ~/.profile && . ~/.profile
test -f ~/.bashrc && . ~/.bashrc`)
        }
    }
    shells = [{type: "bash", file: bashrc}];
}

if (!shells.length) {
    console.error("Could not find any config files for bash, fish, or zsh!");
} else if (process.argv.length < 2 || !["install", "uninstall"].includes(process.argv[2])) {
  console.log('Usage: node index.js install | uninstall');
  process.exit(1);
} else if (process.argv[2] === 'install') {
    shells.forEach(install);
} else {
    shells.forEach(uninstall);
}
