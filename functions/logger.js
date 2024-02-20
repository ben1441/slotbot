module.exports = {
    info: (...args) => console.log('\x1b[32m[INFO]\x1b[0m', ...args), // Green color for INFO
    error: (...args) => console.log('\x1b[31m[ERROR]\x1b[0m', ...args), // Red color for ERROR
    warn: (...args) => console.log('\x1b[33m[WARN]\x1b[0m', ...args), // Yellow color for WARN
    trace: (...args) => console.log('\x1b[36m[TRACE]\x1b[0m', ...args), // Cyan color for TRACE
    dir: (args, options) => process.stdout.write('\x1b[34m[DIR]\x1b[0m ') && console.dir(args, { ...options, depth: null }), // No color for DIR
    log: (...args) => console.log('[LOG]', ...args), // No color for LOG
}
