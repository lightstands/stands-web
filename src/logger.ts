import pino from "pino";

export default pino({ level: import.meta.env.VITE_APP_LOG_LEVEL });
