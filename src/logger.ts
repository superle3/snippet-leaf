type Levels = "info" | "warn" | "error" | "debug";
class Logger {
    level: Levels = "info";

    log(level: Levels, message: string) {
        const timestamp = new Date().toISOString();
        if (this.shouldLog(level)) {
            console[level](`extension.js [${level}]: ${message}`);
        }
    }

    info(message: string) {
        this.log("info", message);
    }

    warn(message: string) {
        this.log("warn", message);
    }
    // debug(message: string) {
    //     this.log("debug", message);
    // }

    error(message: string) {
        this.log("error", message);
    }

    private shouldLog(level: Levels): boolean {
        const levels: { [key in Levels]: number } = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3,
        };
        return levels[level] <= levels[this.level];
    }
}

const logger = new Logger();

export default logger;
