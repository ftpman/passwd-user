'use strict';
const {promisify} = require('util');
const fs = require('fs');

const readFileP = promisify(fs.readFile);

function extractLinux(line) {
	const columns = line.split(':');

	// Linux passwd(5):
	// 0 login name
	// 1 optional encrypted password
	// 2 numerical user ID
	// 3 numerical group ID
	// 4 user name or comment field
	// 5 user home directory
	// 6 optional user command interpreter

	return {
		username: columns[0],
		password: /*columns[1]*/ "",
		userIdentifier: Number(columns[2]),
		groupIdentifier: Number(columns[3]),
		fullName: columns[4] && columns[4].split(',')[0],
		homeDirectory: columns[5],
		shell: columns[6]
	};
}

const extract = extractLinux;

function getUser(passwd, username) {
	const lines = passwd.split('\n');
	const linesCount = lines.length;
	let i = 0;

	while (i < linesCount) {
		const user = extract(lines[i++]);

		if (user.username === username || user.userIdentifier === Number(username)) {
			return user;
		}
	}
}

module.exports = async username => {
	if (username === undefined) {
		if (typeof process.getuid !== 'function') {
			// eslint-disable-next-line unicorn/prefer-type-error
			throw new Error('Platform not supported');
		}

		username = process.getuid();
	}

	if (process.platform === 'linux') {
		return getUser(await readFileP('/etc/passwd', 'utf8'), username);
	}

	throw new Error('Platform not supported');
};

module.exports.sync = username => {
	if (username === undefined) {
		if (typeof process.getuid !== 'function') {
			// eslint-disable-next-line unicorn/prefer-type-error
			throw new Error('Platform not supported');
		}

		username = process.getuid();
	}

	if (process.platform === 'linux') {
		return getUser(fs.readFileSync('/etc/passwd', 'utf8'), username);
	}

	throw new Error('Platform not supported');
};
